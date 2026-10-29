// Redesign (2026-10-29): fig. 2 carousel gestures, materials and accessibility preferences, press feedback.
// Screenshots: tests/e2e/.out/redesign-*.png, plus a swipe frame sequence redesign-swipe-*.png.
import { base, launch, OUT } from './_setup.mjs';
const b = await launch();
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };

const ready = (p) => p.waitForSelector('[data-pick="0"]:not([hidden])');
const count = (p) => p.textContent('[data-count]');
// translateX of every panel currently rendered (current + any peer), in px
const panels = (p) => p.$$eval('[data-version]', (l) => l.filter((v) => getComputedStyle(v).display !== 'none').map((v) => Math.round(new DOMMatrix(getComputedStyle(v).transform).m41)));
const box = async (p) => (await p.locator('[data-version]:not([hidden]) header').boundingBox());
const flick = async (p, dx, steps = 8) => {
  const r = await box(p);
  const x = r.x + r.width / 2, y = r.y + r.height / 2;
  await p.mouse.move(x, y); await p.mouse.down();
  for (let i = 1; i <= steps; i++) await p.mouse.move(x + (dx * i) / steps, y);
  await p.mouse.up();
};
const slowDrag = async (p, dx, { release = true, frames } = {}) => {
  const r = await box(p);
  const x = r.x + r.width / 2, y = r.y + r.height / 2;
  await p.mouse.move(x, y); await p.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await p.mouse.move(x + (dx * i) / 12, y);
    await p.waitForTimeout(40);
    if (frames && i % 4 === 0) await frames();
  }
  await p.waitForTimeout(150); // finger at rest before lifting: no momentum
  const during = await panels(p);
  if (release) await p.mouse.up();
  return during;
};

const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(base); await ready(p);
await p.locator('.records').scrollIntoViewIfNeeded();

// flick left: momentum projection picks the next stage, handoff into the spring, then it settles
await flick(p, -160);
ok((await count(p)) === '2 / 5' && (await p.textContent('[data-live]')).startsWith('Stage 2 of 5'), `flick left -> stage 2 (${await count(p)}, "${await p.textContent('[data-live]')}")`);
const flight = await panels(p);
ok(flight.length === 2, `mid-flight: the outgoing and incoming panels are both on screen (${flight})`);
await p.waitForTimeout(1200);
ok(JSON.stringify(await panels(p)) === '[0]', `settles: one panel at rest (${await panels(p)})`);
ok((await p.getAttribute('[data-pick="1"]', 'aria-pressed')) === 'true', 'diagram selection follows the swipe');
// flick right goes back
await flick(p, 160);
await p.waitForTimeout(1200);
ok((await count(p)) === '1 / 5', `flick right -> stage 1 (${await count(p)})`);

// slow, small drag: below the projection threshold, snaps back
const held = await slowDrag(p, -90);
// 1:1 from the point the 10px hysteresis was crossed (first step past it is 15px), so -90 tracks as -75
ok(held.length === 2 && held[0] === -75, `drag tracks 1:1 after the 10px hysteresis, neighbour peeks in (${held})`);
await p.waitForTimeout(1200);
ok((await count(p)) === '1 / 5' && JSON.stringify(await panels(p)) === '[0]', `slow small drag snaps back (${await count(p)}, ${await panels(p)})`);

// rubber band past the first and the last stage
const first = await slowDrag(p, 300);
ok(first.length === 1 && first[0] > 20 && first[0] < 300 * 0.6, `past stage 1: rubber-bands (${first[0]}px for a 300px drag), no neighbour`);
await p.waitForTimeout(1200);
ok((await count(p)) === '1 / 5' && JSON.stringify(await panels(p)) === '[0]', 'returns to rest at stage 1');
await p.click('[data-pick="4"]'); await p.waitForTimeout(1200);
await p.locator('.records').scrollIntoViewIfNeeded();
const last = await slowDrag(p, -300);
ok(last.length === 1 && last[0] < -20 && last[0] > -300 * 0.6, `past stage 5: rubber-bands (${last[0]}px for a -300px drag)`);
await p.waitForTimeout(1200);
ok((await count(p)) === '5 / 5' && JSON.stringify(await panels(p)) === '[0]', 'returns to rest at stage 5');

// interrupt: grab the panel mid-flight and it stops where it is (presentation value), no jump
await p.click('[data-step="-1"]');
await p.waitForTimeout(40);
const before = await panels(p);
const r = await box(p);
await p.mouse.move(r.x + 40, r.y + 10); await p.mouse.down();
await p.waitForTimeout(100);
const caught = await panels(p);
ok(before.length === 2 && caught.length === 2 && Math.abs(caught[0]) > 5, `grabbed mid-flight: held at ${caught} (was ${before})`);
await p.mouse.up(); await p.waitForTimeout(1200);
ok((await count(p)) === '4 / 5' && JSON.stringify(await panels(p)) === '[0]', 'released without moving: finishes the transition');

// buttons, arrow keys and the diagram animate with the same spring
await p.click('[data-step="1"]');
ok((await panels(p)).length === 2, 'Next slides with the spring (two panels in flight)');
await p.waitForTimeout(1200);
await p.focus('[data-pick="4"]'); await p.keyboard.press('ArrowLeft');
ok((await count(p)) === '4 / 5' && (await panels(p)).length === 2, 'ArrowLeft slides too');
await p.waitForTimeout(1200);

// press feedback: scale on pointer-down, not on release
await p.locator('[data-step="1"]').hover(); await p.mouse.down(); await p.waitForTimeout(200);
const pressed = await p.$eval('[data-step="1"]', (e) => new DOMMatrix(getComputedStyle(e).transform).a);
await p.mouse.up();
ok(Math.abs(pressed - 0.97) < 0.001, `button :active scale ${pressed}`);
const ta = await p.$$eval('button, .btn', (l) => [...new Set(l.map((e) => getComputedStyle(e).touchAction))]);
ok(ta.length === 1 && ta[0] === 'manipulation', `buttons: touch-action ${ta}`);
await p.click('[data-pick="0"]'); await p.waitForTimeout(1000);

// header material
const hdr = (q) => q.$eval('.site-header', (e) => { const s = getComputedStyle(e); return { bf: s.backdropFilter, bg: s.backgroundColor, pos: s.position, border: s.borderBottomWidth }; });
const h = await hdr(p);
ok(h.pos === 'sticky' && h.bf.includes('blur(20px)') && h.bf.includes('saturate(1.8)') && /rgba\(.*0\.72\)/.test(h.bg) && h.border === '0px', `translucent sticky header, no hard divider: ${JSON.stringify(h)}`);
ok((await p.$eval('.brand', (a) => a.getAttribute('aria-label'))) === 'Sricharan Anand, home' && (await p.textContent('.brand')) === 'SA', 'SA monogram keeps the full-name label');
await p.close();

// swipe frame sequence (~50ms apart) for a visual check of the motion
const f = await b.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
await f.goto(base); await ready(f);
await f.locator('.records').scrollIntoViewIfNeeded();
let k = 0;
const frame = () => f.locator('.records').screenshot({ path: `${OUT}redesign-swipe-${++k}.png` });
await slowDrag(f, -420, { release: false, frames: frame });
await frame();
await f.mouse.up();
for (let i = 0; i < 4; i++) { await f.waitForTimeout(50); await frame(); }
ok(k === 8, `swipe frame sequence: ${k} frames`);
await f.close();

// phones: the record panel never blocks vertical scrolling (touch-action pan-y; real touch scroll)
const tc = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const t = await tc.newPage();
await t.goto(base); await ready(t);
await t.locator('.records').scrollIntoViewIfNeeded();
const tAct = await t.$eval('.versions', (e) => getComputedStyle(e).touchAction);
ok(tAct === 'pan-y', `record panel touch-action: ${tAct}`);
const pre = await t.$$eval('[data-version]:not([hidden]) pre', (l) => l.map((x) => `${x.scrollWidth > x.clientWidth}:${getComputedStyle(x).touchAction}`));
ok(pre.every((x) => x === 'true:pan-x pan-y' || x === 'false:pan-y'), `records that scroll sideways keep native panning: ${pre[0]}`);
const cdp = await tc.newCDPSession(t);
const rb = await t.locator('[data-version]:not([hidden]) header').boundingBox();
const y0 = await t.evaluate(() => scrollY);
await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(rb.x + rb.width / 2), y: Math.round(rb.y + 20), yDistance: -300, gestureSourceType: 'touch', speed: 1200 });
const y1 = await t.evaluate(() => scrollY);
ok(y1 > y0 + 100 && (await count(t)) === '1 / 5', `vertical touch scroll over the panel scrolls the page (${y0} -> ${y1}), stage unchanged`);
await t.waitForTimeout(1000); // let the vertical fling finish before measuring
await t.evaluate(() => document.querySelector('[data-version]:not([hidden])').scrollIntoView({ block: 'center' }));
const rb2 = await t.locator('[data-version]:not([hidden]) header').boundingBox();
await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(rb2.x + rb2.width - 40), y: Math.round(rb2.y + rb2.height / 2), xDistance: -260, gestureSourceType: 'touch', speed: 2000 });
await t.waitForTimeout(800);
ok((await count(t)) === '2 / 5', `horizontal touch swipe -> stage 2 (${await count(t)})`);
ok(await t.evaluate(() => document.documentElement.scrollWidth) <= 390, 'no horizontal overflow after the swipe');
await tc.close();

// reduced motion: cross-fade in place, no transform animation
const rm = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await rm.goto(base); await ready(rm);
const samples = await rm.evaluate(() => new Promise((done) => {
  document.querySelector('[data-step="1"]').click();
  const v = document.querySelectorAll('[data-version]');
  const out = [];
  const t0 = performance.now();
  const tick = () => {
    out.push([getComputedStyle(v[1]).opacity, getComputedStyle(v[0]).opacity, getComputedStyle(v[1]).transform, getComputedStyle(v[0]).transform, getComputedStyle(v[0]).display]);
    if (performance.now() - t0 < 600) requestAnimationFrame(tick); else done(out);
  };
  requestAnimationFrame(tick);
}));
const mids = samples.filter(([a]) => +a > 0.05 && +a < 0.95);
ok(mids.length >= 3 && mids.every(([a, o, , , d]) => d !== 'none' && Math.abs(+a + +o - 1) < 0.02), `reduced: incoming fades in while outgoing fades out (${mids.length} mid frames, e.g. ${mids[1]?.slice(0, 2)})`);
ok(samples.every(([, , t1, t0]) => t1 === 'none' && t0 === 'none'), 'reduced: no transform on either panel at any frame');
ok(samples.at(-1)[0] === '1' && samples.at(-1)[4] === 'none', 'reduced: settles on the new panel alone');
await rm.close();

// reduced transparency: solid header, no blur (Chrome reads the media feature; emulated via CDP)
const rt = await b.newPage({ viewport: { width: 1280, height: 900 } });
await (await rt.context().newCDPSession(rt)).send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
await rt.goto(base);
const ht = await hdr(rt);
ok(ht.bf === 'none' && !ht.bg.startsWith('rgba'), `reduced transparency: ${JSON.stringify(ht)}`);
await rt.close();

// more contrast: solid header with a border, cards get defined borders
const mc = await b.newContext({ viewport: { width: 1280, height: 900 }, contrast: 'more' });
const m = await mc.newPage();
await m.goto(base);
const hc = await hdr(m);
const borders = await m.$$eval('.stage, [data-version], .impact ul, .stories .story', (l) => [...new Set(l.map((e) => { const s = getComputedStyle(e); return `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`; }))]);
ok(hc.bf === 'none' && hc.border === '1px' && !hc.bg.startsWith('rgba'), `more contrast header: ${JSON.stringify(hc)}`);
ok(borders.length === 1 && borders[0] === '1px solid rgb(29, 29, 31)', `more contrast cards: ${borders}`);
await mc.close();

// review screenshots (reduced motion so nothing is mid-animation)
const shot = async (w, h, scheme, path, name, opts = {}) => {
  const q = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
  await q.goto(base + path); await q.waitForTimeout(200);
  if (opts.full) await q.screenshot({ path: OUT + name, fullPage: true });
  for (const [i, y] of (opts.scrolls ?? []).entries()) { await q.evaluate((y) => scrollTo(0, y), y); await q.waitForTimeout(150); await q.screenshot({ path: OUT + name.replace('.png', `-${i + 1}.png`) }); }
  for (const [label, sel] of opts.parts ?? []) await q.locator(sel).screenshot({ path: OUT + name.replace('.png', `-${label}.png`) });
  if (!opts.full && !opts.scrolls && !opts.parts) await q.screenshot({ path: OUT + name });
  await q.close();
};
await shot(1280, 900, 'light', '', 'redesign-home-1280-light.png', { scrolls: [0], parts: [['diagram', '.pipeline'], ['fig2', '.records']] });
await shot(1280, 900, 'light', '', 'redesign-home-1280-light-full.png', { full: true });
await shot(1280, 900, 'dark', '', 'redesign-home-1280-dark.png', { full: true });
await shot(390, 844, 'light', '', 'redesign-home-390-light.png', { scrolls: [0, 844, 1688] });
await shot(1280, 900, 'light', 'stories/one-bad-message/', 'redesign-story-1280.png', { full: true });
await shot(1280, 900, 'light', 'working-with-me/', 'redesign-wwm-1280.png', { full: true });
await shot(390, 844, 'dark', 'projects/', 'redesign-projects-390-dark.png', { full: true });

await b.close();
console.log(fails ? `${fails}/${n} FAIL` : `ALL PASS (${n} checks)`);
process.exit(fails ? 1 : 0);
