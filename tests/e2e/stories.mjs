import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const p = await b.newPage();
await p.goto(base);
// each stage card links to its design (queue, store, consume) or its story (source, process)
const cards = await p.$$eval('.pipeline a.cta:not(.also)', (as) => as.map((a) => `${a.textContent.replace(/\s+/g, ' ').trim()}=${a.getAttribute('href')}`));
const want = ['Read the story: Source stage →=/my-site/stories/one-bad-message/', 'Read the design: Queue stage →=/my-site/designs/store-and-forward/', 'Read the story: Process stage →=/my-site/stories/splitter-30-seconds/', 'Read the design: Store stage →=/my-site/designs/reconciliation-engine/', 'Read the design: Consume stage →=/my-site/designs/cdc-pubsub-broker/'];
ok(JSON.stringify(cards) === JSON.stringify(want), `5 stage cards: design or story by type: ${cards.join(' | ')}`);
const links = await p.$$eval('.pipeline a.cta', (as) => as.map((a) => a.href));
const uniq = [...new Set(links)];
for (const u of uniq) { const r = await p.request.get(u); ok(r.status() === 200, `${u} ${r.status()}`); }
// pubsub-broker and store-and-forward moved to /designs/ (tests/e2e/designs.mjs)
const stories = ['one-bad-message', 'splitter-30-seconds', 'backfill-16900', 'log-runaway'];
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const s of stories) {
  const r = await m.goto(base + `stories/${s}/`);
  ok(r.status() === 200, `${s} 200`);
  ok((await m.$$('h1')).length === 1, `${s} one h1`);
  const n = await m.$$eval('ul.metrics li', (l) => l.length);
  console.log(`  ${s} metrics: ${n}`);
  ok(n > 0, `${s} has metrics list`);
  const sw = await m.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, `${s} no overflow at 390 (${sw})`);
}
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
