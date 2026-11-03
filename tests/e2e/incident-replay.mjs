// Fig. 3, the incident replay: on the one-bad-message story page (moved off home 2026-11-03). Also the home record token.
import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const story = base + 'stories/one-bad-message/';
const shownStep = (p) => p.evaluate(() => [...document.querySelectorAll('[data-step-item]')].findIndex((s) => !s.hidden) + 1);
const err3 = (p) => p.evaluate(() => document.querySelectorAll('[data-incident] [data-stage]')[2].classList.contains('is-error'));
const tf = (p) => p.evaluate(() => getComputedStyle(document.querySelector('[data-token]')).transform);

// home: the record token still rides the stages; no replay here any more
const h = await b.newPage({ viewport: { width: 1280, height: 900 } });
await h.goto(base);
ok((await h.$$('[data-incident], [data-replay], [data-step-item]')).length === 0, 'home: no incident replay');
ok(!(await h.content()).includes('Story coming soon'), 'no "Story coming soon" in page');
await h.waitForSelector('[data-pick="3"]:not([hidden])');
const t1 = await tf(h);
await h.click('[data-pick="3"]'); await h.waitForTimeout(800);
const t4 = await tf(h);
ok(t1 !== t4, `token moves stage 1 -> 4: ${t1} -> ${t4}`);
ok((await h.getAttribute('[data-token]', 'aria-hidden')) === 'true', 'token aria-hidden');
await h.close();

const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(story);
ok((await p.$$('[data-incident]')).length === 1, 'story page has the replay');
ok(await p.$eval('[data-incident]', (f) => !!(document.querySelector('.prose').compareDocumentPosition(f) & 4)), 'replay sits after the story body');
ok((await p.textContent('[data-replay]')) === 'Watch one bad message break the pipeline (7 steps)', 'replay button label');
ok(await p.isVisible('.incident .intro'), 'plain sentence above the replay button');
ok(!(await p.isVisible('.strip')), 'stage row hidden before the replay');
const startColor = await p.$eval('[data-replay]', (e) => getComputedStyle(e).backgroundColor);
const token = (v) => p.evaluate((v) => { const d = document.createElement('i'); d.style.color = `var(${v})`; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, v);
const lineColor = await token('--accent');
ok(startColor === (await token('--accent-fill')), `replay button uses the accent fill, not error red: ${startColor}`);
await p.click('[data-replay]');
ok(await p.isVisible('.strip'), 'stage row visible during the replay');
ok(await p.isDisabled('[data-istep="-1"]') && !(await p.isDisabled('[data-istep="1"]')), 'step 1: Prev disabled, Next enabled');
ok((await shownStep(p)) === 1 && (await p.textContent('[data-live]')).startsWith('Incident step 1 of 7'), `replay step 1: "${await p.textContent('[data-live]')}"`);
ok(await p.isVisible('.steps mark'), 'step 1 shows corrupt sample with marked breaks');
ok((await p.getAttribute('[data-live]', 'aria-live')) === 'polite', 'live region is polite');
for (let n = 2; n <= 7; n++) {
  if (n % 2) await p.keyboard.press('ArrowRight'); else await p.click('[data-istep="1"]');
  const live = await p.textContent('[data-live]');
  ok((await shownStep(p)) === n && live.startsWith(`Incident step ${n} of 7`), `step ${n} via ${n % 2 ? 'ArrowRight' : 'Next'}: "${live}"`);
  if (n === 3) ok(await err3(p), 'stage 3 error state on step 3');
  if (n === 6) {
    ok(!(await err3(p)), 'stage 3 error cleared on step 6');
    const bar = await p.$eval('[data-step-item]:not([hidden]) .backlog .bar', (e) => getComputedStyle(e).borderColor);
    ok(bar === lineColor, `draining backlog bar uses --accent: ${bar}`);
  }
}
ok(await p.isDisabled('[data-istep="1"]'), 'step 7: Next disabled');
ok(await p.evaluate(() => document.activeElement?.dataset.istep === '-1'), 'focus moved from disabled Next to Prev');
await p.keyboard.press('ArrowRight');
ok((await shownStep(p)) === 7, 'ArrowRight on last step stays on step 7');
await p.keyboard.press('Escape');
ok((await p.isHidden('[data-steps]')) && (await p.isVisible('[data-replay]')) && !(await err3(p)) && (await p.textContent('[data-live]')).includes('Replay closed'), 'Escape returns to the start button');
ok(await p.evaluate(() => document.activeElement?.hasAttribute('data-replay')), 'focus back on the start button');
await p.click('[data-replay]');
await p.click('[data-exit]');
ok(await p.isHidden('[data-steps]') && !(await p.isVisible('.strip')), 'Exit replay closes it too');
await p.close();

// reduced motion: Play hidden
const r = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await r.goto(story);
await r.click('[data-replay]');
ok(await r.isHidden('[data-play]'), 'reduced motion: Play hidden');
await r.close();
const pl = await b.newPage({ viewport: { width: 1280, height: 900 } });
await pl.goto(story);
await pl.click('[data-replay]');
ok(await pl.isVisible('[data-play]'), 'Play shown with motion allowed');
await pl.click('[data-play]'); await pl.waitForTimeout(2300);
ok((await shownStep(pl)) === 2 && (await pl.textContent('[data-play]')) === 'Pause', 'Play advances one step per 2s');
await pl.click('[data-play]');
await pl.close();

// home reduced motion: the token jumps
const rh = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await rh.goto(base);
const dur = await rh.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-token]')).transitionDuration));
ok(dur < 0.001, `reduced motion: token transition-duration ${dur}s`);
await rh.waitForSelector('[data-pick="3"]:not([hidden])');
const tr0 = await rh.evaluate(() => getComputedStyle(document.querySelector('[data-token]')).transform);
const tr1 = await rh.evaluate(() => { document.querySelector('[data-pick="3"]').click(); return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok(getComputedStyle(document.querySelector('[data-token]')).transform)))); });
await rh.waitForTimeout(300);
ok(tr0 !== tr1 && tr1 === (await rh.evaluate(() => getComputedStyle(document.querySelector('[data-token]')).transform)), `reduced motion: token jumps, no travel (${tr1})`);
await rh.close();

// overflow, light + dark, all replay steps
for (const [w, h, scheme] of [[1280, 900, 'light'], [1280, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
  const q = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
  await q.goto(story);
  let worst = await q.evaluate(() => document.documentElement.scrollWidth);
  await q.click('[data-replay]');
  for (let n = 1; n < 7; n++) { worst = Math.max(worst, await q.evaluate(() => document.documentElement.scrollWidth)); await q.click('[data-istep="1"]'); }
  ok(worst <= w, `no overflow ${w} ${scheme} (all replay steps): ${worst}`);
  for (let n = 0; n < 4; n++) await q.click('[data-istep="-1"]'); // step 3
  await q.waitForTimeout(1800);
  if (w === 1280 && scheme === 'dark') await q.screenshot({ path: OUT + 'm5c-1280-dark-step3.png', fullPage: true });
  await q.close();
}

// no JS: the seven steps as a static timeline
const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const n = await ctx.newPage();
await n.goto(story);
const visibleSteps = await n.evaluate(() => [...document.querySelectorAll('[data-step-item]')].filter((s) => s.offsetParent !== null).length);
ok(visibleSteps === 7, `no JS: ${visibleSteps}/7 timeline steps visible`);
ok(await n.isHidden('[data-replay]') && await n.isHidden('.strip') && await n.isHidden('[data-icontrols]'), 'no JS: button, stage row and controls hidden');
ok(await n.evaluate(() => document.documentElement.scrollWidth) <= 390, 'no JS: no overflow at 390');
await n.screenshot({ path: OUT + 'm5c-390-nojs.png', fullPage: true });
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
