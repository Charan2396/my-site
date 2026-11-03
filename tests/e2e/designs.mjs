// Design docs (/designs/), the store-and-forward trade-off toggle, and the decision log (/decisions/).
import { base, launch, OUT } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const slugs = ['cdc-pubsub-broker', 'store-and-forward', 'ems-mq-migration', 'reconciliation-engine', 'ad-auth-mq'];
const ORDER = ['Problem', 'Constraints', 'Options considered', 'Decision', 'Trade-offs & non-goals', 'Outcome', 'How it held up', 'Related'];

// index
let p = await b.newPage({ viewport: { width: 1280, height: 900 } });
ok((await p.goto(base + 'designs/')).status() === 200, '/designs/ 200');
const listed = await p.$$eval('.designs li a', (as) => as.map((a) => a.getAttribute('href')));
ok(listed.length === 5 && slugs.every((s, i) => listed[i].endsWith(`/designs/${s}/`)), `5 designs listed in order: ${listed}`);

// each design page
for (const s of slugs) {
  const r = await p.goto(base + `designs/${s}/`);
  ok(r.status() === 200, `${s} 200`);
  ok((await p.$$('h1')).length === 1, `${s} one h1`);
  ok((await p.textContent('.eyebrow')).startsWith('Design doc'), `${s} eyebrow "${await p.textContent('.eyebrow')}"`);
  // every section heading has content after it, and the doc sections keep their order
  const secs = await p.$$eval('article section > h2', (hs) => hs.map((h) => ({ t: h.textContent.trim(), body: h.parentElement.textContent.trim().length - h.textContent.trim().length })));
  ok(secs.every((x) => x.body > 0), `${s} no empty section headings`);
  const doc = secs.map((x) => x.t).filter((t) => ORDER.includes(t));
  ok(doc.every((t, i) => i === 0 || ORDER.indexOf(t) > ORDER.indexOf(doc[i - 1])), `${s} section order: ${doc.join(' · ')}`);
  ok(['Problem', 'Decision', 'Outcome'].every((t) => doc.includes(t)), `${s} has Problem, Decision, Outcome`);
  ok(!doc.includes('Options considered') && !doc.includes('Trade-offs & non-goals'), `${s} no unfilled options/trade-offs`);
  for (const h of await p.$$eval('article a[href]', (as) => as.map((a) => a.href).filter((u) => u.startsWith(location.origin)))) {
    const st = (await p.request.get(h)).status(); if (st !== 200) ok(false, `${s} link ${h} ${st}`);
  }
}
await p.goto(base + 'designs/cdc-pubsub-broker/');
ok(/co-buil/i.test(await p.textContent('h1')) && (await p.textContent('.lede')).includes('co-built'), 'broker says co-built in title and summary');
ok(!(await p.textContent('h1')).toLowerCase().includes('built from scratch'), 'broker title is not "built from scratch"');
const vt = await p.$$eval('[data-astro-transition-scope]', (els) => els.map((e) => getComputedStyle(e).viewTransitionName));
ok(vt.length === 1 && vt[0] === 'stage-consume', `broker header transition name: ${vt}`);
await p.goto(base + 'designs/ems-mq-migration/');
ok((await p.$$('[data-astro-transition-scope]')).length === 0, 'no-stage design has no transition name');
await p.goto(base + 'designs/reconciliation-engine/');
ok((await p.textContent('.proof')).includes('Proof of concept'), 'reconciliation labelled proof of concept');
ok((await p.locator('article a[href="/my-site/reconciliation/"]').count()) === 1, 'reconciliation links the explainer');
await p.close();

// toggle
const T = '[data-sf]';
const state = (q) => q.evaluate((T) => {
  const r = document.querySelector(T);
  return {
    modes: [...r.querySelectorAll('[data-mode]')].map((x) => x.getAttribute('aria-pressed')).join(','),
    outage: r.querySelector('[data-outage]').getAttribute('aria-pressed'),
    msgs: r.querySelector('[data-msgs]').className,
    live: r.querySelector('[data-live]').textContent,
    down: r.querySelector('[data-lane]').classList.contains('is-down'),
    bar: parseFloat(/scaleX\(([^)]*)\)/.exec(r.querySelector('[data-bar]').style.transform)?.[1] ?? '0'), // the spring's presentation value
  };
}, T);
const settle = (q, v) => q.waitForFunction(([T, v]) => document.querySelector(T + ' [data-bar]').style.transform === `scaleX(${v})`, [T, v], { timeout: 4000 }).then(() => true, () => false);
const c = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
p = await c.newPage();
await p.goto(base + 'designs/store-and-forward/');
ok(await p.isVisible(`${T} [data-controls]`) && !(await p.isVisible(`${T} [data-fallback]`)), 'JS: controls shown, fallback table hidden');
let s = await state(p);
ok(s.modes === 'true,false' && s.outage === 'false', `initial aria-pressed direct, no outage (${s.modes} ${s.outage})`);
// keyboard: focus Direct, Space on outage via Tab, arrows switch modes
await p.focus(`${T} [data-mode="direct"]`);
await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
ok(await p.evaluate(() => document.activeElement.hasAttribute('data-outage')), 'Tab reaches the outage toggle');
await p.keyboard.press('Space');
s = await state(p);
ok(s.outage === 'true' && s.down && s.msgs.includes('is-fail'), `direct + outage: error state (${s.msgs})`);
ok(s.live.includes('rejected — the destination is down'), `live: "${s.live}"`);
ok(await p.isVisible(`${T} .msgs.is-fail .msg`), 'rejected messages visible');
await p.waitForTimeout(400); // let the colour transitions finish
await p.screenshot({ path: OUT + 'w1-toggle-direct-outage-1280-dark.png', clip: await p.locator(T).boundingBox() });
await p.focus(`${T} [data-mode="direct"]`);
await p.keyboard.press('ArrowRight');
s = await state(p);
ok(s.modes === 'false,true' && await p.evaluate(() => document.activeElement.dataset.mode === 'sf'), `ArrowRight selects Store-and-forward (${s.modes})`);
await p.waitForTimeout(150); s = await state(p);
ok(s.msgs.includes('is-held') && s.live.includes('stored in the queue'), `sf + outage: held, live "${s.live}"`);
ok(s.bar > 0 && s.bar < 1, `backlog is growing (spring mid-flight, scaleX ${s.bar.toFixed(3)})`);
ok(await settle(p, 1), 'backlog settles full');
await p.screenshot({ path: OUT + 'w1-toggle-sf-outage-1280-dark.png', clip: await p.locator(T).boundingBox() });
await p.click(`${T} [data-outage]`);
s = await state(p);
await p.waitForTimeout(150); s = await state(p);
ok(s.outage === 'false' && s.live.includes('backlog drains') && s.msgs.includes('is-ok'), `outage over: drain (${s.live})`);
ok(s.bar > 0 && s.bar < 1, `backlog draining mid-flight (${s.bar.toFixed(3)})`);
ok(await settle(p, 0), 'backlog drains to empty');
await p.focus(`${T} [data-mode="sf"]`); await p.keyboard.press('ArrowLeft');
ok((await state(p)).modes === 'true,false', 'ArrowLeft back to Direct');
await c.close();

// reduced motion: the bar jumps (no transform animation)
const rc = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
p = await rc.newPage();
await p.goto(base + 'designs/store-and-forward/');
await p.click(`${T} [data-mode="sf"]`); await p.click(`${T} [data-outage]`);
ok((await state(p)).bar === 1, 'reduced: backlog full at once');
await p.click(`${T} [data-outage]`);
ok((await state(p)).bar === 0, 'reduced: backlog empty at once');
const tr = await p.$$eval(`${T} *`, (els) => els.filter((e) => parseFloat(getComputedStyle(e).transitionDuration) > 0.01 && getComputedStyle(e).transitionProperty.includes('transform')).length);
ok(tr === 0, `reduced: no transform transitions (${tr})`);
await rc.close();

// no JS: the comparison table
const nj = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
p = await nj.newPage();
await p.goto(base + 'designs/store-and-forward/');
ok(await p.isVisible(`${T} table`) && !(await p.isVisible(`${T} [data-controls]`)) && !(await p.isVisible(`${T} [data-lane]`)), 'no-JS: table shown, controls hidden');
const heads = await p.$$eval(`${T} thead th`, (t) => t.map((x) => x.textContent.trim()));
ok(heads[1] === 'Direct' && heads[2] === 'Store-and-forward', `no-JS table columns ${heads}`);
await nj.close();

// decisions
p = await b.newPage({ viewport: { width: 1280, height: 900 } });
ok((await p.goto(base + 'decisions/')).status() === 200, '/decisions/ 200');
ok((await p.textContent('h1')) === 'Decision log', 'decisions h1');
ok((await p.textContent('.lede')).includes('short records of a design choice: the context, the decision, and what followed'), 'plain ADR intro');
const n = await p.$$eval('.log > li', (l) => l.length);
ok(n >= 8, `${n} decision entries`);
const empty = await p.$$eval('.log > li', (l) => l.filter((x) => !x.querySelector('h2')?.textContent.trim() || x.querySelectorAll('dd').length < 2).length);
ok(empty === 0, 'every entry has a title, context and decision');
for (const h of [...new Set(await p.$$eval('.log a[href]', (as) => as.map((a) => a.href)))]) {
  const st = (await p.request.get(h)).status(); ok(st === 200, `decision link ${h} ${st}`);
}
await p.close();

// overflow and screenshots
const pages = ['designs/', ...slugs.map((s) => `designs/${s}/`), 'decisions/'];
for (const [w, scheme] of [[390, 'light'], [390, 'dark'], [1280, 'light'], [1280, 'dark']]) {
  const q = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
  const bad = [];
  for (const pg of pages) {
    await q.goto(base + pg);
    if (pg.includes('store-and-forward')) { await q.click(`${T} [data-mode="sf"]`); await q.click(`${T} [data-outage]`); }
    const sw = await q.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) bad.push(`${pg}=${sw}`);
  }
  ok(bad.length === 0, `no overflow ${w} ${scheme} ${bad.join(' ')}`);
  if (w === 1280 && scheme === 'light') { await q.goto(base + 'designs/store-and-forward/'); await q.screenshot({ path: OUT + 'w1-design-1280-light.png', fullPage: true }); }
  if (w === 390 && scheme === 'light') {
    await q.goto(base + 'decisions/'); await q.screenshot({ path: OUT + 'w1-decisions-390-light.png', fullPage: true });
    await q.goto(base + 'designs/store-and-forward/'); await q.click(`${T} [data-mode="sf"]`); await q.click(`${T} [data-outage]`);
    await q.waitForTimeout(1500); await q.locator(T).screenshot({ path: OUT + 'w1-toggle-390-light.png' });
  }
  await q.close();
}
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
