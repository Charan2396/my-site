import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const FINAL = ['300+', '30+', '~10M', '3'];
const vals = (p) => p.$$eval('.impact .value', (e) => e.map((x) => x.textContent.trim()));

// page, nav, h1, links
let p = await b.newPage();
const r = await p.goto(base + 'working-with-me/');
ok(r.status() === 200, `/working-with-me/ ${r.status()}`);
const cur = await p.$$eval('nav a[aria-current="page"]', (as) => as.map((a) => a.textContent.trim()));
ok(cur.length === 1 && cur[0] === 'Working with me', `aria-current [${cur}]`);
const nav = await p.$$eval('nav[aria-label="Main"] a', (as) => as.map((a) => a.textContent.trim()));
ok(nav.join('|') === 'Working with me|Projects|Build log|Resume', `nav order ${nav}`);
ok((await p.$$('h1')).length === 1, 'one h1');
ok((await p.$$('#testimonials')).length === 0, 'no testimonials section without file');
const links = [...new Set(await p.$$eval('main a[href]', (as) => as.map((a) => a.href)))];
const internal = links.filter((u) => u.startsWith(base));
const stories = internal.filter((u) => u.includes('/stories/'));
ok(stories.length === 6, `links to 6 stories (${stories.length})`);
for (const u of internal) {
  if (u.includes('#')) { const id = u.split('#')[1]; ok(await p.$(`#${id}`) !== null, `anchor #${id} exists`); continue; }
  const s = (await p.request.get(u)).status(); ok(s === 200, `${u} ${s}`);
}
ok(links.includes('mailto:sricharan23@gmail.com') && links.includes('https://linkedin.com/in/charansri'), 'contact links');
await p.close();

// overflow
for (const [w, h, scheme] of [[1280, 900, 'light'], [1280, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
  const q = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
  for (const path of ['working-with-me/', '']) {
    await q.goto(base + path);
    const sw = await q.evaluate(() => document.documentElement.scrollWidth);
    ok(sw <= w, `no overflow /${path} ${w} ${scheme} (${sw})`);
  }
  if (w === 1280 && scheme === 'light') {
    await q.goto(base + 'working-with-me/'); await q.screenshot({ path: OUT + 'p3-wwm-1280-light.png', fullPage: true });
    await q.goto(base); await q.waitForTimeout(1200); await q.screenshot({ path: OUT + 'p3-home-1280-light.png' });
  }
  if (w === 390 && scheme === 'dark') { await q.goto(base + 'working-with-me/'); await q.screenshot({ path: OUT + 'p3-wwm-390-dark.png', fullPage: true }); }
  await q.close();
}

// impact strip: no JS, reduced motion, JS count-up
let c = await b.newContext({ javaScriptEnabled: false }); p = await c.newPage(); await p.goto(base);
ok(JSON.stringify(await vals(p)) === JSON.stringify(FINAL), `no-JS final values ${await vals(p)}`);
const sr = await p.$$eval('.impact .sr-only', (e) => e.map((x) => x.textContent));
ok(sr[0].startsWith('300+ tables') && sr.length === 4, `sr text: ${sr[0]}`);
ok(await p.$$eval('.impact .figure', (e) => e.every((x) => x.getAttribute('aria-hidden') === 'true')), 'visual figures aria-hidden');
await c.close();
c = await b.newContext({ reducedMotion: 'reduce' }); p = await c.newPage(); await p.goto(base); await p.waitForTimeout(300);
ok(JSON.stringify(await vals(p)) === JSON.stringify(FINAL), `reduced motion final values ${await vals(p)}`);
ok(await p.$$eval('.impact [data-counted]', (e) => e.length) === 0, 'reduced motion: no counting');
await c.close();
c = await b.newContext({ viewport: { width: 1280, height: 900 } }); p = await c.newPage(); await p.goto(base);
await p.waitForTimeout(120);
const mid = await vals(p);
console.log('  mid-count values:', mid);
ok(JSON.stringify(mid) !== JSON.stringify(FINAL), 'values animating shortly after load');
await p.waitForTimeout(1200);
ok(JSON.stringify(await vals(p)) === JSON.stringify(FINAL), `JS count-up reaches final ${await vals(p)}`);
ok(await p.$$eval('.impact [data-counted]', (e) => e.length) === 4, 'all 4 marked data-counted');
// below the fold at 390: count starts only on scroll
await c.close();
c = await b.newContext({ viewport: { width: 390, height: 300 } }); p = await c.newPage(); await p.goto(base);
await p.waitForTimeout(1200);
const last = (await vals(p))[3];
await p.evaluate(() => document.querySelectorAll('.impact li')[3].scrollIntoView());
await p.waitForTimeout(1200);
ok(JSON.stringify(await vals(p)) === JSON.stringify(FINAL), `after scroll final ${await vals(p)} (offscreen tile before scroll: ${last})`);
await c.close();
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
