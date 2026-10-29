// Second review round (2026-10-29): hero, career strip, fig. 1/2 accuracy, explainers, projects.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const text = (p, s) => p.$eval(s, (e) => e.textContent.replace(/\s+/g, ' ').trim());

// hero + career strip
let p = await b.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
await p.goto(base);
ok((await text(p, '.lede')).startsWith('I own correctness for a real-time change-data-capture backbone'), 'hero positioning sentence');
const rows = await p.$$eval('.career li', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
ok(rows.length === 3 && rows[0].startsWith('2020–21') && rows[0].includes('Amazon') && rows[2].includes('Ingram Micro'), `career strip rows: ${rows.length}`);
ok((await p.locator('.career a[href="/my-site/resume/"]').count()) === 1, 'career strip links the resume');
ok(await p.$eval('.career', (c) => { const s = document.querySelector('.impact .stack'), h = document.querySelector('h2.tagline'); return !!(s.compareDocumentPosition(c) & 4) && !!(c.compareDocumentPosition(h) & 4); }), 'career strip between Stack line and tagline');
ok((await p.$$('.stories li p')).length === 0, 'home story list: titles only');
await p.screenshot({ path: OUT + 'r2-home-1280-light-top.png' });
await p.locator('.career').screenshot({ path: OUT + 'r2-home-1280-light-career.png' });
// fig. 2: base64 decodes to the JSON shown; MERGE guard
const consume = await p.$eval('[data-version]:nth-child(5) pre', (e) => e.textContent);
const data = consume.match(/"data": "([A-Za-z0-9+/=]+)"/)[1];
const shown = consume.split('data, decoded:\n')[1].trim();
ok(Buffer.from(data, 'base64').toString('utf8') === shown, 'Pub/Sub data decodes exactly to the JSON shown');
const proc = await p.$eval('[data-version]:nth-child(3) pre', (e) => e.textContent);
ok(JSON.stringify(JSON.parse(proc.split('\n\n')[0])) === shown, 'stage 3 JSON is the published record');
const merge = await p.$eval('[data-version]:nth-child(4) pre', (e) => e.textContent);
ok(merge.includes('WHEN NOT MATCHED THEN INSERT') && merge.includes('WHERE t.src_seq < s.src_seq'), 'MERGE has insert branch and src_seq guard');
ok((await text(p, '.records figcaption')).includes('Every byte checks'), 'fig. 2 caption: illustrative data');
ok((await text(p, '.pipeline figcaption')).includes('reads the same mainframe change stream'), 'fig. 1 caption: topology note');
await p.close();
// fig. 2 Store + Consume at 1280 dark
p = await b.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' });
await p.goto(base);
for (const [i, name] of [[3, 'store'], [4, 'consume']]) {
  await p.click(`[data-pick="${i}"]`);
  await p.locator('.records').screenshot({ path: OUT + `r2-fig2-${name}-1280-dark.png` });
}
await p.close();
// fig. 1 compact at 390
p = await b.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' });
await p.goto(base);
ok(await p.$$eval('.pipeline .detail', (d) => d.every((x) => getComputedStyle(x).display === 'none')), 'fig. 1 detail hidden at 390');
ok((await p.$$('.pipeline a.cta')).length === 5, 'fig. 1 story links kept at 390');
await p.screenshot({ path: OUT + 'r2-home-390-light-1.png' });
await p.evaluate(() => scrollTo(0, 844)); await p.screenshot({ path: OUT + 'r2-home-390-light-2.png' });
// stories eyebrow
await p.goto(base + 'stories/one-bad-message/');
ok(/^Stage 1 · Source/.test(await text(p, '.eyebrow')), `story eyebrow: ${await text(p, '.eyebrow')}`);
// reconciliation honest limit
await p.goto(base + 'reconciliation/');
ok((await text(p, '.limit')).includes('needs a value hash too'), 'recon honest limit');
ok(!(await p.content()).includes('step 4 above'), 'recon: no "step 4 above"');
await p.close();
// projects
p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(base + 'projects/');
ok((await p.$$eval('.card h2', (h) => h.map((x) => x.textContent))).join('|') === 'Cross-instance reconciliation|Simple Dynamo|This site', 'projects order');
ok((await p.locator('.also a[href="https://github.com/Charan2396/Twitter-Search"]').count()) === 1, 'Twitter-Search folded into grad-school line');
await p.screenshot({ path: OUT + 'r2-projects-1280.png', fullPage: true });
await p.close();
// no Information-Retrieval link anywhere in dist (local build only)
if (!process.env.BASE_URL || process.env.BASE_URL.includes('localhost')) {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(d + f).isDirectory() ? walk(d + f + '/') : [d + f]));
  const hits = walk(DIST).filter((f) => /\.(html|js|css|xml|txt)$/.test(f) && readFileSync(f, 'utf8').includes('Information-Retrieval'));
  ok(hits.length === 0, `no Information-Retrieval in dist ${hits}`);
}
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
