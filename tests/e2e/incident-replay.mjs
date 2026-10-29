import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
const shownStep = (p) => p.evaluate(() => [...document.querySelectorAll('[data-step-item]')].findIndex((s) => !s.hidden) + 1);
const err3 = (p) => p.evaluate(() => document.querySelectorAll('[data-stage]')[2].classList.contains('is-error'));
const tf = (p) => p.evaluate(() => getComputedStyle(document.querySelector('[data-token]')).transform);

const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(base);
ok(!(await p.content()).includes('Story coming soon'), 'no "Story coming soon" in page');
const t1 = await tf(p);
await p.click('[data-pick="3"]'); await p.waitForTimeout(800);
const t4 = await tf(p);
ok(t1 !== t4, `token moves stage 1 -> 4: ${t1} -> ${t4}`);
ok((await p.getAttribute('[data-token]', 'aria-hidden')) === 'true', 'token aria-hidden');
await p.click('[data-pick="0"]');
ok((await p.textContent('[data-replay]')) === 'Watch one bad message break the pipeline (7 steps)', 'replay button label');
ok(await p.isVisible('.incident .intro'), 'plain sentence above the replay button');
// redesign: the replay button is the filled primary pill (--accent-fill); the drained bar uses --accent
const startColor = await p.$eval('[data-replay]', (e) => getComputedStyle(e).backgroundColor);
const token = (v) => p.evaluate((v) => { const d = document.createElement('i'); d.style.color = `var(${v})`; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, v);
const lineColor = await token('--accent');
ok(startColor === (await token('--accent-fill')), `replay button uses the accent fill, not error red: ${startColor}`);
await p.click('[data-replay]');
ok(await p.isDisabled('[data-istep="-1"]') && !(await p.isDisabled('[data-istep="1"]')), 'step 1: Prev disabled, Next enabled');
ok((await shownStep(p)) === 1 && (await p.textContent('[data-live]')).startsWith('Incident step 1 of 7'), `replay step 1: "${await p.textContent('[data-live]')}"`);
ok(await p.isVisible('.steps mark'), 'step 1 shows corrupt sample with marked breaks');
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
ok(await p.isVisible('.steps a[href$="/stories/one-bad-message/"]'), 'step 7 links the story');
ok(await p.isDisabled('[data-istep="1"]'), 'step 7: Next disabled');
ok(await p.evaluate(() => document.activeElement?.dataset.istep === '-1'), 'focus moved from disabled Next to Prev');
await p.keyboard.press('ArrowRight');
ok((await shownStep(p)) === 7, 'ArrowRight on last step stays on step 7');
await p.click('[data-exit]');
ok((await p.isHidden('[data-steps]')) && (await p.isVisible('[data-replay]')) && !(await err3(p)) && (await p.textContent('[data-live]')).includes('Replay closed'), 'Exit returns to normal view');
ok(await p.evaluate(() => document.querySelectorAll('[data-version]:not([hidden])').length === 1), 'record view still one version');
await p.close();

// reduced motion
const r = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await r.goto(base);
const dur = await r.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-token]')).transitionDuration));
ok(dur < 0.001, `reduced motion: token transition-duration ${dur}s`);
// the token is spring-driven; under reduced motion it jumps to the new stage in the same frame
await r.waitForSelector('[data-pick="3"]:not([hidden])');
const tr0 = await r.evaluate(() => getComputedStyle(document.querySelector('[data-token]')).transform);
// one frame after the click (the global reduced-motion rule leaves a 0.01ms transition), then unchanged
const tr1 = await r.evaluate(() => { document.querySelector('[data-pick="3"]').click(); return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok(getComputedStyle(document.querySelector('[data-token]')).transform)))); });
await r.waitForTimeout(300);
ok(tr0 !== tr1 && tr1 === (await r.evaluate(() => getComputedStyle(document.querySelector('[data-token]')).transform)), `reduced motion: token jumps, no travel (${tr1})`);
await r.click('[data-pick="0"]');
await r.click('[data-replay]');
ok(await r.isHidden('[data-play]'), 'reduced motion: Play hidden');
await r.close();

// overflow, light + dark, normal + replay step 3
for (const [w, h, scheme] of [[1280, 900, 'light'], [1280, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
  const q = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
  await q.goto(base);
  let worst = await q.evaluate(() => document.documentElement.scrollWidth);
  if (w === 1280 && scheme === 'light') await q.screenshot({ path: OUT + 'm5c-1280-light.png', fullPage: true });
  await q.click('[data-replay]');
  for (let n = 1; n < 7; n++) { worst = Math.max(worst, await q.evaluate(() => document.documentElement.scrollWidth)); await q.click('[data-istep="1"]'); }
  ok(worst <= w, `no overflow ${w} ${scheme} (all replay steps): ${worst}`);
  await q.click('[data-istep="-1"]'); for (let n = 0; n < 4; n++) await q.click('[data-istep="-1"]'); // step 2
  await q.click('[data-istep="1"]'); await q.waitForTimeout(1800); // step 3
  if (w === 1280 && scheme === 'dark') await q.screenshot({ path: OUT + 'm5c-1280-dark-step3.png', fullPage: true });
  if (w === 390 && scheme === 'light') await q.screenshot({ path: OUT + 'm5c-390-light-step3.png', fullPage: true });
  await q.close();
}

// no JS
const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const n = await ctx.newPage();
await n.goto(base);
const visibleSteps = await n.evaluate(() => [...document.querySelectorAll('[data-step-item]')].filter((s) => s.offsetParent !== null).length);
ok(visibleSteps === 7, `no JS: ${visibleSteps}/7 timeline steps visible`);
ok(await n.isHidden('[data-replay]') && await n.isHidden('[data-token]'), 'no JS: replay button and token hidden');
ok(await n.evaluate(() => document.documentElement.scrollWidth) <= 390, 'no JS: no overflow at 390');
ok(!(await n.content()).includes('Story coming soon'), 'no JS: no "Story coming soon"');
await n.screenshot({ path: OUT + 'm5c-390-nojs.png', fullPage: true });
await b.close();
