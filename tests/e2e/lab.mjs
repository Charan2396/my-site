// "Break my pipeline" (/lab): the model, the playable UI, the no-JS fallback, keyboard, reduced motion, overflow.
import { base, launch, OUT } from './_setup.mjs';
import { rounds, simulate, allOn } from '../../src/lib/lab.ts';

let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };

// model: every defense on catches, off misses, one guard per round
ok(rounds.length === 5, 'five rounds');
for (const r of rounds) {
	ok(simulate(r.id, allOn()).outcome === 'caught', `${r.id}: defense on is caught`);
	ok(simulate(r.id, { ...allOn(), [r.guard]: false }).outcome === 'missed', `${r.id}: defense off is missed`);
}
// the only digits allowed are the sample quantities 2 and 3 (the invented record in stages.ts): no performance figures
ok(rounds.every((r) => !/\b(?![23]\b)\d+/.test(r.on + r.off + r.talk)), 'no figures in the round copy');

const b = await launch();

// home teaser: one link to /lab, outside the hero
const h = await b.newPage({ viewport: { width: 1280, height: 900 } });
await h.goto(base);
const teaser = h.locator('main a[href$="/lab/"]');
ok((await teaser.count()) === 1, 'home has exactly one link to /lab');
ok((await teaser.evaluate((a) => !a.closest('.hero'))), 'the teaser sits outside the hero');

// playable, reduced motion so the final state is immediate
const rm = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const p = await rm.newPage();
await p.goto(base + 'lab/');
ok((await p.textContent('h1')).trim().toLowerCase() === 'break my pipeline', 'h1');
ok((await p.locator('.round').count()) === 5, 'five round buttons');
ok(await p.locator('table[data-fallback]').isHidden(), 'fallback table hidden when JS runs');
await p.locator('.round', { hasText: 'Out of order' }).click();
ok((await p.textContent('[data-verdict]')).includes('Round 3') && (await p.textContent('[data-verdict]')).includes('CAUGHT'), 'round 3 starts caught');
ok((await p.locator('.is-caught').count()) === 1 && (await p.locator('.is-hit').count()) === 1, 'one hit lamp and one caught lamp');
const before = await p.textContent('[data-live]');
await p.locator('[data-guard]').click();
ok((await p.textContent('[data-verdict]')).includes('MISSED'), 'defense off: missed');
ok((await p.locator('.is-missed').count()) === 1, 'one missed lamp');
ok((await p.textContent('[data-live]')) !== before, 'the live region announces the change');
ok((await p.getAttribute('[data-guard]', 'aria-pressed')) === 'false', 'guard toggle reflects off');
// the guard belongs to its own round
await p.locator('.round', { hasText: 'Lost message' }).click();
ok((await p.textContent('[data-verdict]')).includes('CAUGHT'), 'another round is unaffected by that switch');

// keyboard: arrow keys move between rounds
await p.locator('.round').first().focus();
await p.keyboard.press('ArrowRight');
ok((await p.getAttribute('.round:nth-child(2)', 'aria-pressed')) === 'true', 'ArrowRight selects round 2');

// animated path settles by itself
const an = await b.newPage({ viewport: { width: 1280, height: 900 } });
await an.goto(base + 'lab/');
await an.locator('.round', { hasText: 'Consumer lag' }).click();
await an.waitForFunction(() => document.querySelector('[data-verdict]').textContent.includes('CAUGHT'), null, { timeout: 5000 }).catch(() => {});
ok((await an.textContent('[data-verdict]')).includes('CAUGHT'), 'animated round 5 settles on its verdict');
await an.screenshot({ path: OUT + 'lab-1280.png', fullPage: true });

// no JS: the table carries all five rounds
const nj = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const q = await nj.newPage();
await q.goto(base + 'lab/');
ok((await q.locator('table[data-fallback] tbody tr').count()) === 5, 'no JS: table lists five rounds');
ok(await q.locator('.round').first().isHidden(), 'no JS: round buttons stay hidden');

// overflow
for (const [w, h2] of [[390, 844], [1280, 900]]) {
	const s = await b.newPage({ viewport: { width: w, height: h2 } });
	await s.goto(base + 'lab/');
	await s.waitForTimeout(300);
	ok(await s.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `no horizontal overflow at ${w}`);
	if (w === 390) await s.screenshot({ path: OUT + 'lab-390.png', fullPage: true });
}

await b.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
