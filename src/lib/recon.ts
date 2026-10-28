// Reconciliation explainer (/reconciliation/), based only on the resume's proof-of-concept bullet.
// All data is INVENTED: three generic instances, one table, six rows. Each step lists which keys each
// instance holds; fingerprints and drift classes are computed from that, so text and badges always agree.
import { createHash } from 'node:crypto';

export const instances = ['A', 'B', 'C'] as const;
export type Inst = (typeof instances)[number];
export const SOURCE: Inst = 'A';
export const companies = [10, 20];

// key = company/order/line; `recent` = changed in the last 30 days
const rows: Record<string, { co: number; recent: boolean }> = {
	'10/4471/1': { co: 10, recent: false },
	'10/4471/2': { co: 10, recent: false },
	'10/5502/1': { co: 10, recent: true },
	'20/3310/1': { co: 20, recent: false },
	'20/3310/2': { co: 20, recent: false },
	'20/6120/1': { co: 20, recent: true },
};
const all = Object.keys(rows);
const without = (...k: string[]) => all.filter((r) => !k.includes(r));

// fingerprint = row count + first 8 hex of SHA-1 over the sorted keys
const fp = (keys: string[]) => ({
	count: keys.length,
	hash: keys.length ? createHash('sha1').update([...keys].sort().join('\n')).digest('hex').slice(0, 8) : '',
});
const label = (f: { count: number; hash: string }) => `${f.count} · ${f.hash || 'none'}`;

interface StepDef {
	title: string;
	caption: string;
	hold: Record<Inst, string[]>;
	compare?: boolean; // fingerprints have been run for this step
	drill?: boolean; // show the exact keys
	fixed?: string[]; // keys just repaired in a target (`C:10/5502/1`)
}

const defs: StepDef[] = [
	{
		title: 'All three instances in sync',
		caption:
			'Instance A is the source; B and C are targets. For each table and company code the engine takes a fingerprint: the row count plus a hash of the keys, once over all rows and once over the last 30 days. Every fingerprint in B and C matches A.',
		hold: { A: all, B: all, C: all },
		compare: true,
	},
	{
		title: 'Inject drift: a row never lands in Instance C',
		caption:
			'Order line 10/5502/1 is written to A and B, but never arrives in C. Nothing has failed loudly. Until the next fingerprint run, nobody knows.',
		hold: { A: all, B: all, C: without('10/5502/1') },
	},
	{
		title: 'Fingerprint: company 10 differs in Instance C',
		caption:
			'C has fewer rows than A for company 10, and its key hash differs, so the drift is classified "missing in target". Both fingerprints differ, because the row is recent.',
		hold: { A: all, B: all, C: without('10/5502/1') },
		compare: true,
	},
	{
		title: 'A delete that never propagated: drift the other way',
		caption:
			'Order line 20/3310/2 is deleted on the source. C applies the delete; B never does. B now holds a row the source no longer has: "stale in target". Only the full fingerprint differs, because the row is older than 30 days. That is why each table is fingerprinted twice.',
		hold: { A: without('20/3310/2'), B: all, C: without('10/5502/1', '20/3310/2') },
		compare: true,
	},
	{
		title: 'Drill down to the exact keys',
		caption:
			'A fingerprint says that something differs, not what. The drill-down compares keys for just the drifted table and company code, and lists the exact rows.',
		hold: { A: without('20/3310/2'), B: all, C: without('10/5502/1', '20/3310/2') },
		compare: true,
		drill: true,
	},
	{
		title: 'Hand the exact keys to the repair process',
		caption:
			'The engine is read-only: it changes nothing itself. It hands the exact keys on. The missing key goes to the self-healing process, which sends it back to the mainframe to be resent. The stale key is flagged with its exact key for follow-up. Once both are fixed, the next fingerprint run shows zero difference.',
		hold: { A: without('20/3310/2'), B: without('20/3310/2'), C: without('20/3310/2') },
		compare: true,
		fixed: ['C:10/5502/1'],
	},
];

type RowState = 'ok' | 'missing' | 'stale' | 'deleted' | 'fixed';
export type Drift = { inst: Inst; co: number; kind: 'missing in target' | 'stale in target'; keys: string[]; detail: string };

export const reconSteps = defs.map((d) => {
	const universe = all.filter((k) => instances.some((i) => d.hold[i].includes(k)));
	const src = d.hold[SOURCE];
	const cols = instances.map((inst) => {
		const has = d.hold[inst];
		const list = universe.map((key) => {
			let state: RowState = 'ok';
			if (!has.includes(key)) state = src.includes(key) ? 'missing' : 'deleted';
			else if (inst !== SOURCE && !src.includes(key)) state = 'stale';
			else if (d.fixed?.includes(`${inst}:${key}`)) state = 'fixed';
			return { key, state };
		});
		const fps = companies.map((co) => {
			const mine = has.filter((k) => rows[k].co === co);
			const theirs = src.filter((k) => rows[k].co === co);
			const full = fp(mine);
			const recent = fp(mine.filter((k) => rows[k].recent));
			const sFull = fp(theirs);
			const sRecent = fp(theirs.filter((k) => rows[k].recent));
			return {
				co,
				full: label(full),
				recent: label(recent),
				fullDiff: label(full) !== label(sFull),
				recentDiff: label(recent) !== label(sRecent),
			};
		});
		return { inst, list, fps };
	});
	const drift: Drift[] = [];
	if (d.compare)
		for (const inst of instances.filter((i) => i !== SOURCE))
			for (const co of companies) {
				const mine = d.hold[inst].filter((k) => rows[k].co === co);
				const theirs = src.filter((k) => rows[k].co === co);
				const missing = theirs.filter((k) => !mine.includes(k));
				const stale = mine.filter((k) => !theirs.includes(k));
				const detail = `${mine.length} rows vs ${theirs.length} in A`;
				if (missing.length) drift.push({ inst, co, kind: 'missing in target', keys: missing, detail });
				if (stale.length) drift.push({ inst, co, kind: 'stale in target', keys: stale, detail });
			}
	return { ...d, cols, drift };
});

// self-check: the story above must classify exactly what the captions say
const kinds = reconSteps.map((s) => s.drift.map((x) => `${x.inst}${x.co}:${x.kind}`).join(','));
const expected = ['', '', 'C10:missing in target', 'B20:stale in target,C10:missing in target', 'B20:stale in target,C10:missing in target', ''];
if (kinds.join('|') !== expected.join('|')) throw new Error(`recon.ts: drift classes changed: ${kinds.join('|')}`);
