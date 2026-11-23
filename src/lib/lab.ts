// "Break my pipeline": five failures, each with the one defense that catches it. Pure and erasable (no Node APIs),
// so the browser can import it and the build can check it. A SIMULATION on invented sample data (order 4471,
// line 2, see stages.ts). It carries no figures of its own; "tens of thousands" is the one-bad-message story's phrase.
import type { StageKey } from './stages';

export const order: StageKey[] = ['source', 'queue', 'process', 'store', 'consume'];
export type GuardKey = 'recon' | 'idempotent' | 'seq' | 'isolate' | 'alerts';

export type Round = {
	id: string;
	n: number;
	failure: string;
	guard: GuardKey;
	defense: string;
	hit: StageKey; // where the failure strikes
	at: StageKey; // where the defense acts (and where the damage lands if it is off)
	hitSay: string;
	on: string;
	off: string;
	talk: string;
	href: string; // path under the site base
	source: string;
};

export const rounds: Round[] = [
	{
		id: 'lost',
		n: 1,
		failure: 'Lost message',
		guard: 'recon',
		defense: 'Reconciliation',
		hit: 'queue',
		at: 'store',
		hitSay: 'A change message never reaches Oracle.',
		on: 'Reconciliation fingerprints both sides and drills down to the exact missing key. Feeding that key back to the source regenerates the message.',
		off: 'Nobody compares the two sides. Oracle keeps quantity 2 while the source says 3, and downstream teams read the stale row.',
		talk: 'Delivery guarantees are claims. Comparing both sides is evidence.',
		href: 'designs/reconciliation-engine/',
		source: 'the reconciliation design',
	},
	{
		id: 'duplicate',
		n: 2,
		failure: 'Duplicate delivery',
		guard: 'idempotent',
		defense: 'Idempotent apply',
		hit: 'queue',
		at: 'store',
		hitSay: 'The same change is delivered twice, as at-least-once messaging allows.',
		on: 'The apply is idempotent, so the second copy changes nothing.',
		off: 'The second copy is applied as a new change and Oracle ends up with a duplicate row.',
		talk: 'The backfill relies on the same property: run it again and nothing doubles.',
		href: 'stories/backfill-16900/',
		source: 'the backfill story',
	},
	{
		id: 'order',
		n: 3,
		failure: 'Out of order',
		guard: 'seq',
		defense: 'Sequence guard',
		hit: 'queue',
		at: 'store',
		hitSay: 'An older change arrives after a newer one.',
		on: 'The merge only applies a change whose source sequence is higher than the row’s, so the stale one is skipped.',
		off: 'The older change overwrites the newer one and the quantity goes back to 2.',
		talk: 'A message-ordering defect showed up in the queue splitter. I rolled back a change to isolate it, then redesigned the split logic to preserve ordering.',
		href: 'designs/store-and-forward/',
		source: 'the store-and-forward design',
	},
	{
		id: 'corrupt',
		n: 4,
		failure: 'Corrupt message',
		guard: 'isolate',
		defense: 'Isolate and regenerate',
		hit: 'process',
		at: 'process',
		hitSay: 'One message arrives corrupt, with uneven line breaks inside it.',
		on: 'Find the one bad message, capture its keys, and have the source regenerate clean copies.',
		off: 'The splitter keeps rejecting: not just the bad message, but tens of thousands behind it.',
		talk: 'Treat tens of thousands of rejects as one problem, and regenerate from the source instead of hand-editing the copy.',
		href: 'stories/one-bad-message/',
		source: 'the one-bad-message story',
	},
	{
		id: 'lag',
		n: 5,
		failure: 'Consumer lag',
		guard: 'alerts',
		defense: 'Backlog alerts and a runbook',
		hit: 'consume',
		at: 'consume',
		hitSay: 'A consumer falls behind and the queue backlog keeps growing.',
		on: 'An alert fires early, and the runbook says which scenario this is.',
		off: 'The backlog grows quietly until a downstream team asks where their records went.',
		talk: 'Afterwards I added more alerts and a runbook for the different scenarios, so the next person does not need to have seen it before.',
		href: 'stories/one-bad-message/',
		source: 'the one-bad-message story',
	},
];

export const allOn = (): Record<GuardKey, boolean> => ({ recon: true, idempotent: true, seq: true, isolate: true, alerts: true });

export function simulate(id: string, guards: Record<GuardKey, boolean>) {
	const round = rounds.find((r) => r.id === id);
	if (!round) throw new Error(`lab.ts: no round ${id}`);
	const caught = guards[round.guard];
	return {
		round,
		outcome: caught ? ('caught' as const) : ('missed' as const),
		say: caught ? round.on : round.off,
		hit: order.indexOf(round.hit),
		end: order.indexOf(round.at),
	};
}

// build-time check: every defense on catches its round, every defense off misses it, and the stages exist
for (const r of rounds) {
	const on = simulate(r.id, allOn());
	const off = simulate(r.id, { ...allOn(), [r.guard]: false });
	if (on.outcome !== 'caught' || off.outcome !== 'missed' || on.hit < 1 || on.end < on.hit)
		throw new Error(`lab.ts: round ${r.id} is inconsistent`);
}
if (new Set(rounds.map((r) => r.guard)).size !== rounds.length) throw new Error('lab.ts: one guard per round');
