// "Designed, then proven" (2026-11-03): hero positioning + proof chips, designs on home, one route per target,
// log-runaway reachable from fig. 1, Designs nav state, the type scale, jargon glosses. Screenshots: .out/w2-*.png
import { base, launch, OUT } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const text = (p, s) => p.$eval(s, (e) => e.textContent.replace(/\s+/g, ' ').trim());
// distinct computed font sizes of visible text on the page
const sizes = (p) => p.evaluate(() => [...new Set([...document.querySelectorAll('body *')].filter((e) => {
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
}).map((e) => getComputedStyle(e).fontSize))].sort((a, b) => parseFloat(a) - parseFloat(b)));

const p = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await p.goto(base);
// hero
ok((await text(p, '.hero .lede')) === 'I design and build data systems that move change data off legacy platforms and into the cloud: CDC streams, messaging architectures, reconciliation tooling, built so the teams downstream can trust them.', 'hero positioning line');
ok((await p.$$eval('.hero .contact a', (as) => as.map((a) => a.textContent.trim()))).join('|') === 'Email|LinkedIn|Resume', 'hero keeps Email, LinkedIn, Resume');
const chips = await p.$$eval('.hero .proof a', (as) => as.map((a) => `${a.textContent.trim()}=${a.getAttribute('href')}`));
ok(JSON.stringify(chips) === JSON.stringify(['CDC → Pub/Sub broker, co-built from scratch →=/my-site/designs/cdc-pubsub-broker/', '5,000+-queue migration architecture →=/my-site/designs/ems-mq-migration/', 'Reconciliation engine PoC across 3 instances →=/my-site/designs/reconciliation-engine/']), `3 proof chips link to designs: ${chips.join(' | ')}`);
for (const c of chips) ok((await p.request.get(new URL(c.split('=')[1], base).href)).status() === 200, `chip target 200: ${c.split('=')[1]}`);
// selected designs + held-up stories; no stories list, no "More to explore", no replay
const cards = await p.$$eval('.designs a', (as) => as.map((a) => a.getAttribute('href')));
ok(cards.length === 5 && cards.every((h) => h.startsWith('/my-site/designs/')), `5 design cards: ${cards.join(' ')}`);
ok(await p.$$eval('.designs a', (as) => as.every((a) => a.querySelector('.title') && a.querySelector('.chip'))), 'each design card has a title and a proof chip');
ok((await text(p, '#held-heading')) === 'From running it: incidents and fixes', 'held-up heading');
const held = await p.$$eval('.held a', (as) => as.map((a) => a.getAttribute('href').split('/').at(-2)));
ok(held.sort().join(',') === 'backfill-16900,log-runaway,one-bad-message,splitter-30-seconds', `4 stories under held-up: ${held}`);
ok(!(await p.textContent('main')).includes('More to explore') && (await p.$$('[data-incident]')).length === 0, 'no "More to explore", no replay on home');
// one route per target: count links per href in main
const counts = await p.$$eval('main a[href]', (as) => as.reduce((m, a) => ((m[a.getAttribute('href')] = (m[a.getAttribute('href')] || 0) + 1), m), {}));
ok(counts['/my-site/stories/one-bad-message/'] <= 2, `one-bad-message linked ${counts['/my-site/stories/one-bad-message/']}x on home (stage card + held-up list)`);
const over = Object.entries(counts).filter(([h, n]) => n > (h.includes('/designs/') ? 3 : 2));
ok(over.length === 0, `no target linked more than card + section (+ hero chip for designs): ${over.map((x) => x.join('=')).join(' ') || 'ok'}`);
ok(!counts['/my-site/resume/'] || counts['/my-site/resume/'] === 1, `Resume once in main (hero): ${counts['/my-site/resume/']}`);
ok(!counts['/my-site/projects/simple-dynamo/'] && !counts['/my-site/reconciliation/'], 'no Simple Dynamo / explainer duplicates of Projects on home');
// fig. 1: log-runaway reachable, intro copy matches behaviour
ok(await p.isVisible('.pipeline a.cta.also[href="/my-site/stories/log-runaway/"]'), 'log-runaway reachable from fig. 1 (Process card)');
ok((await text(p, '.pipeline figcaption')).includes('Select a stage to see the record there; each one links to the design or story behind it.'), 'fig. 1 intro matches behaviour');
await p.click('.pipeline a.cta.also'); await p.waitForURL('**/stories/log-runaway/');
ok(true, 'log-runaway link navigates');
// glosses
await p.goto(base);
const abbr = await p.$$eval('main abbr[title]', (as) => Object.fromEntries(as.map((a) => [a.textContent, a.title])));
for (const [t, g] of [['CDC', 'change data capture'], ['EBCDIC', 'mainframe text encoding'], ['MQMD', 'MQ message header'], ['PIC 9(7)V99', 'a 9-digit number with 2 implied decimal places'], ['CCSID 37', 'character set ID for EBCDIC'], ['IMS, Db2, VSAM', 'mainframe databases and files'], ['MERGE', 'update-or-insert']])
  ok(abbr[t] === g, `home gloss ${t}: "${abbr[t]}"`);
for (const [path, t, g] of [['stories/log-runaway/', 'DogStatsD', 'custom health metrics'], ['stories/backfill-16900/', 'idempotent', 'safe to re-run']]) {
  await p.goto(base + path);
  ok((await p.$$eval('main abbr[title]', (as) => as.map((a) => `${a.textContent}=${a.title}`))).includes(`${t}=${g}`), `${path} gloss ${t}`);
}
// the Pub/Sub sample still decodes after glossing (glosses only wrap text, never change it)
await p.goto(base);
const consume = await p.$eval('[data-version]:nth-child(5) pre', (e) => e.textContent);
ok(Buffer.from(consume.match(/"data": "([A-Za-z0-9+/=]+)"/)[1], 'base64').toString('utf8') === consume.split('data, decoded:\n')[1].trim(), 'fig. 2 base64 still decodes to the JSON shown');
// type scale: few distinct sizes on home
const s1280 = await sizes(p);
ok(s1280.length <= 8, `home 1280: ${s1280.length} distinct font sizes (${s1280.join(' ')})`);
const p390 = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await p390.goto(base);
const s390 = await sizes(p390);
await p390.close();
ok(s390.length <= 8, `home 390: ${s390.length} distinct font sizes (${s390.join(' ')})`);
await p.close();

// nav: Designs active on /designs/ and its children; no overflow at 390; one line next to the monogram
const n = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const [path, want] of [['designs/', 'Designs'], ['designs/store-and-forward/', 'Designs'], ['decisions/', 'Decisions'], ['', '']]) {
  await n.goto(base + path);
  const cur = await n.$$eval('nav a[aria-current]', (as) => as.map((a) => a.textContent.trim()));
  ok(cur.join('|') === want, `${path || '/'}: current nav [${cur}]`);
  const bar = await n.evaluate(() => { const h = document.querySelector('.site-header .bar'), b = document.querySelector('.brand').getBoundingClientRect(), l = [...document.querySelectorAll('.site-header nav a')].map((a) => a.getBoundingClientRect()); return { sw: document.documentElement.scrollWidth, oneLine: l.every((r) => Math.abs(r.top - l[0].top) < 2) && Math.abs(l[0].top + l[0].height / 2 - (b.top + b.height / 2)) < 4 }; });
  ok(bar.sw <= 390 && bar.oneLine, `${path || '/'} 390: nav fits on one line with the monogram (${JSON.stringify(bar)})`);
}
await n.close();

// screenshots
const shot = async (w, h, scheme, path, name, opts = {}) => {
  const q = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
  await q.goto(base + path); await q.waitForTimeout(200);
  if (opts.replay) { await q.click('[data-replay]'); for (let i = 0; i < 2; i++) await q.click('[data-istep="1"]'); await q.evaluate(() => scrollTo(0, document.querySelector('.incident').getBoundingClientRect().top + scrollY - 60)); await q.waitForTimeout(300); }
  if (opts.scrolls) for (const [i, y] of opts.scrolls.entries()) { await q.evaluate((y) => scrollTo(0, y), y); await q.waitForTimeout(150); await q.screenshot({ path: OUT + name.replace('.png', `-${i + 1}.png`) }); }
  else await q.screenshot({ path: OUT + name, fullPage: !!opts.full });
  await q.close();
};
await shot(1280, 900, 'light', '', 'w2-home-1280-light.png', { full: true });
await shot(390, 844, 'light', '', 'w2-home-390-light.png', { scrolls: [0, 844, 1688] });
await shot(1280, 900, 'dark', '', 'w2-home-1280-dark.png', { full: true });
await shot(390, 844, 'light', 'stories/one-bad-message/', 'w2-story-replay-390-light.png', { replay: true });
await shot(390, 844, 'light', 'stories/one-bad-message/', 'w2-story-390-light-full.png', { full: true });
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
