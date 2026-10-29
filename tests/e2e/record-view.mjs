import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
// (a) overflow + screenshots
for (const [w, h, scheme] of [[1280, 900, 'light'], [1280, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
  await p.goto(base);
  for (let i = 0; i < 5; i++) {
    await p.click(`[data-pick="${i}"]`);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) ok(false, `overflow ${w} ${scheme} stage ${i + 1}: ${sw}`);
  }
  ok(await p.evaluate(() => document.documentElement.scrollWidth) <= w, `no horizontal overflow at ${w} ${scheme} (all stages)`);
  await p.click('[data-pick="0"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + `m5-${w}-${scheme}.png`, fullPage: true });
  await p.close();
}
// counter: server-rendered and right after load (it once showed "0")
const html = await (await fetch(base)).text();
ok(/data-count[^>]*>1 \/ 5</.test(html), 'counter "1 / 5" in the initial HTML');
const p0 = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p0.goto(base); await p0.waitForSelector('[data-controls]:not([hidden])');
ok((await p0.textContent('[data-count]')) === '1 / 5', `counter after load: "${await p0.textContent('[data-count]')}"`);
await p0.waitForTimeout(1500);
ok((await p0.textContent('[data-count]')) === '1 / 5', 'counter still "1 / 5" after 1.5s');
await p0.click('[data-step="1"]');
ok((await p0.textContent('[data-count]')) === '2 / 5', 'counter "2 / 5" right after Next');
ok((await p0.getAttribute('[data-step="1"]', 'aria-label')) === 'Next stage' && (await p0.getAttribute('[data-step="-1"]', 'aria-label')) === 'Previous stage', 'fig. 2 buttons labelled Next/Previous stage');
await p0.close();
// scroll hint at 390: shown only for record boxes that overflow
const sh = await b.newPage({ viewport: { width: 390, height: 844 } });
await sh.goto(base); await sh.waitForSelector('[data-controls]:not([hidden])');
const hints = [];
for (let i = 0; i < 5; i++) {
  await sh.click(`[data-pick="${i}"]`);
  hints.push(await sh.$eval('[data-version]:not([hidden])', (li) => { const pre = li.querySelector('pre'); return [pre.scrollWidth > pre.clientWidth, !li.querySelector('.scroll-hint').hidden]; }));
}
ok(hints.every(([o, h]) => o === h), `hint shown exactly when overflowing: ${JSON.stringify(hints)}`);
ok(hints.some(([o]) => o), 'at least one record overflows at 390 (hint exercised)');
await sh.setViewportSize({ width: 1280, height: 900 }); await sh.waitForTimeout(100);
ok(await sh.$eval('[data-version]:not([hidden])', (li) => { const pre = li.querySelector('pre'); return (pre.scrollWidth > pre.clientWidth) === !li.querySelector('.scroll-hint').hidden; }), 'hint follows resize');
await sh.close();
// (b) click stage 4, (c) arrows, (e) live region
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(base);
const visible = () => p.evaluate(() => [...document.querySelectorAll('[data-version]')].filter((v) => !v.hidden).map((v) => v.querySelector('h3').textContent.trim()));
const live = () => p.textContent('[data-live]');
await p.click('[data-pick="3"]');
const v4 = await visible();
ok(v4.length === 1 && v4[0].startsWith('Store') && (await p.isVisible('text=MERGE INTO order_line')), `click stage 4 shows Oracle sample: ${v4}`);
ok((await p.getAttribute('[data-pick="3"]', 'aria-pressed')) === 'true', 'stage 4 aria-pressed=true');
ok((await live()).includes('Stage 4 of 5'), `live region: "${await live()}"`);
await p.focus('[data-pick="3"]');
await p.keyboard.press('ArrowRight');
ok((await visible())[0].startsWith('Consume') && (await live()).includes('Stage 5'), `ArrowRight -> ${await visible()} / "${await live()}"`);
ok(await p.evaluate(() => document.activeElement.dataset.pick === '4'), 'focus follows to stage 5 button');
await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft');
ok((await visible())[0].startsWith('Process'), `ArrowLeft x2 -> ${await visible()}`);
await p.click('text=Next →');
ok((await visible())[0].startsWith('Store'), `Next -> ${await visible()}`);
await p.click('text=← Prev'); await p.click('text=← Prev'); await p.click('text=← Prev'); await p.click('text=← Prev');
ok((await visible())[0].startsWith('Consume'), `Prev wraps -> ${await visible()}`);
// story link on box still navigates
await p.click('a.cta');
await p.waitForURL('**/stories/one-bad-message/').catch(() => {}); // ClientRouter: same-document navigation
ok(p.url().includes('/stories/one-bad-message/'), `box story link navigates: ${p.url()}`);
await p.close();
// (d) no JS
const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const q = await ctx.newPage();
await q.goto(base);
const n = await q.evaluate(() => [...document.querySelectorAll('[data-version]')].filter((v) => v.offsetParent !== null).length);
ok(n === 5, `no JS: ${n}/5 samples visible`);
ok(!(await q.isVisible('[data-pick="0"]')) && !(await q.isVisible('[data-controls]')), 'no JS: pick buttons and controls hidden');
ok(await q.evaluate(() => document.documentElement.scrollWidth) <= 390, 'no JS: no overflow at 390');
await q.screenshot({ path: OUT + 'm5-nojs-390.png', fullPage: true });
await b.close();
