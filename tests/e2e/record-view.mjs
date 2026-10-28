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
