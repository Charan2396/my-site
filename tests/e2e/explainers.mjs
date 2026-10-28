import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const eq = (a, e, m) => ok(JSON.stringify(a) === JSON.stringify(e), `${m}: ${JSON.stringify(a)}${JSON.stringify(a) === JSON.stringify(e) ? '' : ' expected ' + JSON.stringify(e)}`);

// --- reconciliation ---
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
ok((await p.goto(base + 'reconciliation/')).status() === 200, 'reconciliation 200');
ok((await p.textContent('h1')).includes("Finding data that didn't arrive"), 'recon h1');
ok((await p.textContent('.eyebrow')).includes('Proof of concept'), 'labelled proof of concept');
const R = p.locator('[data-stepper]');
const rState = () => R.evaluate((root) => {
  const li = [...root.querySelectorAll('[data-step-item]')].find((s) => !s.hidden);
  const c = (s) => li.querySelectorAll(s).length;
  const panel = li.querySelector('.panel');
  return { visible: [...root.querySelectorAll('[data-step-item]')].filter((s) => !s.hidden).length, missing: c('.row.is-missing'), stale: c('.row.is-stale'), fpErr: c('.fp.is-error'), fixed: c('.row.is-fixed'), keys: c('.keys'), panel: panel.classList.contains('is-error') ? 'error' : panel.classList.contains('is-clean') ? 'clean' : 'none', live: root.querySelector('[data-live]').textContent, count: root.querySelector('[data-count]').textContent };
});
const rExp = [
  [0, 0, 0, 0, 0, 'clean'], [1, 0, 0, 0, 0, 'none'], [1, 0, 1, 0, 0, 'error'], [1, 1, 2, 0, 0, 'error'], [1, 1, 2, 0, 2, 'error'], [0, 0, 0, 1, 0, 'clean'],
];
const rTitles = await R.locator('[data-step-item] h3').allTextContents();
ok(await R.locator('[data-controls]').isVisible(), 'recon controls shown with JS');
for (let i = 0; i < rExp.length; i++) {
  if (i > 0 && i < 4) await R.locator('[data-go="1"]').click();
  else if (i >= 4) { await R.locator('[data-go="1"]').focus(); await p.keyboard.press('ArrowRight'); }
  const s = await rState();
  const [missing, stale, fpErr, fixed, keys, panel] = rExp[i];
  eq([s.visible, s.missing, s.stale, s.fpErr, s.fixed, s.keys, s.panel], [1, missing, stale, fpErr, fixed, keys, panel], `recon step ${i + 1} ${i >= 4 ? '(ArrowRight)' : '(Next)'} classes`);
  if (i > 0) ok(s.live === `Step ${i + 1} of 6: ${rTitles[i]}`, `recon live: "${s.live}"`);
  ok(s.count === `${i + 1} / 6`, `recon count ${s.count}`);
}
await p.keyboard.press('ArrowRight');
ok((await rState()).count === '6 / 6', 'recon clamps at last step');
await p.keyboard.press('ArrowLeft');
ok((await rState()).live.startsWith('Step 5 of 6'), 'recon ArrowLeft goes back');

// --- dynamo ---
ok((await p.goto(base + 'projects/simple-dynamo/')).status() === 200, 'simple-dynamo 200');
ok((await p.textContent('h1')) === 'Simple Dynamo: a replicated key-value store', 'dynamo h1');
ok((await p.textContent('.eyebrow')).includes('University at Buffalo coursework, 2018–19'), 'dynamo label');
ok((await p.locator('a[href="https://github.com/Charan2396/Amazon-Dynamo-DB-"]').count()) === 1, 'Code on GitHub link');
eq(await p.$$eval('.order li', (l) => l.map((x) => x.textContent.trim().slice(0, 4))), ['5562', '5556', '5554', '5558', '5560'], 'ring order by SHA-1');
const svgs = await p.$$eval('svg[role="img"]', (s) => s.map((x) => x.getAttribute('aria-label')));
ok(svgs.length === 15 && svgs.every((l) => l && l.startsWith('Ring in hash order')), `15 SVGs with role=img + aria-label`);
const dExp = {
  a: { lit: [['5554'], ['5554', '5558'], ['5554', '5558'], ['5554', '5560'], ['5554', '5562']], err: [[], [], [], [], []], msgs: [0, 0, 2, 2, 2], fail: [0, 0, 0, 0, 0] },
  b: { lit: [['5554'], ['5554', '5558'], ['5554'], ['5554', '5562'], ['5560'], ['5554', '5560']], err: [['5560'], ['5560'], ['5560'], ['5560'], [], []], msgs: [0, 2, 1, 2, 4, 1], fail: [0, 0, 1, 0, 0, 0] },
  c: { lit: [['5554'], ['5554'], ['5554', '5562'], ['5554', '5562']], err: [['5558'], ['5558'], ['5558'], ['5558']], msgs: [0, 1, 1, 1], fail: [0, 1, 0, 0] },
};
for (const [id, e] of Object.entries(dExp)) {
  const root = p.locator(`#scenario-${id}`);
  const titles = await root.locator('[data-step-item] h3').allTextContents();
  const st = () => root.evaluate((r) => {
    const li = [...r.querySelectorAll('[data-step-item]')].find((s) => !s.hidden);
    const ports = (s) => [...li.querySelectorAll(s)].map((g) => g.dataset.port).sort();
    return { lit: ports('.node.is-lit'), err: ports('.node.is-error'), msgs: li.querySelectorAll('.msg').length, fail: li.querySelectorAll('.msg.is-fail').length, live: r.querySelector('[data-live]').textContent };
  });
  for (let i = 0; i < e.lit.length; i++) {
    if (i === 1) await root.locator('[data-go="1"]').click();
    else if (i > 1) { await root.locator('[data-go="1"]').focus(); await p.keyboard.press('ArrowRight'); }
    const s = await st();
    eq([s.lit, s.err, s.msgs, s.fail], [[...e.lit[i]].sort(), e.err[i], e.msgs[i], e.fail[i]], `scenario ${id} step ${i + 1} lit/error/msgs/fail`);
    const name = `Scenario ${id.toUpperCase()}`;
    if (i > 0) ok(s.live === `${name}, step ${i + 1} of ${e.lit.length}: ${titles[i]}`, `live: "${s.live}"`);
  }
}

// --- no JS ---
const nj = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const q = await nj.newPage();
for (const [path, count] of [['reconciliation/', 6], ['projects/simple-dynamo/', 15]]) {
  await q.goto(base + path);
  const vis = await q.$$eval('[data-step-item]', (l) => l.filter((x) => x.getBoundingClientRect().height > 0).length);
  ok(vis === count, `no-JS ${path}: ${vis}/${count} steps visible`);
  ok((await q.$$eval('[data-controls]', (l) => l.filter((x) => x.getBoundingClientRect().height > 0).length)) === 0, `no-JS ${path}: controls hidden`);
}
await nj.close();

// --- reduced motion ---
const rm = await b.newContext({ reducedMotion: 'reduce' });
const r = await rm.newPage();
await r.goto(base + 'projects/simple-dynamo/');
await r.locator('#scenario-b [data-go="1"]').click();
const anim = await r.$$eval('#scenario-b [data-step-item]:not([hidden]) .msg, #scenario-b [data-step-item]:not([hidden])', (l) => l.map((x) => { const c = getComputedStyle(x); return [c.animationName, c.animationDuration, c.transitionDuration]; }));
ok(anim.length > 1 && anim.every(([nm, d, t]) => (nm === 'none' || parseFloat(d) <= 0.0001) && parseFloat(t) <= 0.0001), `dynamo reduced motion: ${JSON.stringify(anim)}`);
await r.goto(base + 'reconciliation/');
await r.locator('[data-stepper] [data-go="1"]').click();
const ra = await r.$$eval('[data-step-item]:not([hidden]), [data-step-item]:not([hidden]) *', (l) => l.map((x) => { const c = getComputedStyle(x); return Math.max(parseFloat(c.animationDuration), parseFloat(c.transitionDuration)); }));
ok(Math.max(...ra) <= 0.0001, `recon reduced motion max duration ${Math.max(...ra)}s`);
await rm.close();

// --- overflow ---
for (const w of [390, 1280]) for (const scheme of ['light', 'dark']) for (const path of ['reconciliation/', 'projects/simple-dynamo/', 'projects/']) {
  const c = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
  const pg = await c.newPage();
  await pg.goto(base + path);
  for (const btn of await pg.locator('[data-go="1"]').all()) { await btn.click(); await btn.click(); await btn.click(); }
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= w, `${path} ${w} ${scheme} no overflow (${sw})`);
  await c.close();
}

// --- links from projects ---
const lp = await b.newPage();
for (const [href, h1] of [['projects/simple-dynamo/', 'Simple Dynamo: a replicated key-value store'], ['reconciliation/', "Finding data that didn't arrive"]]) {
  await lp.goto(base + 'projects/');
  const a = lp.locator(`a[href="/my-site/${href}"]`);
  ok((await a.count()) === 1, `projects links to ${href}: "${(await a.textContent())?.trim()}"`);
  await a.click();
  await lp.waitForURL(`**/${href}`).catch(() => {}); // ClientRouter: same-document navigation
  await lp.waitForLoadState();
  ok((await lp.textContent('h1')) === h1, `click reaches ${href}`);
}
await b.close();
console.log(fails ? `${fails}/${n} FAIL` : `ALL PASS (${n} checks)`);
process.exit(fails ? 1 : 0);
