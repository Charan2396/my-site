import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const p = await b.newPage();
await p.goto(base);
const links = await p.$$eval('a', (as) => as.filter((a) => a.textContent.includes('Read the story')).map((a) => a.href));
const uniq = [...new Set(links)];
const stages = await p.$$eval('a', (as) => as.filter((a) => a.textContent.includes('Read the story')).map((a) => a.querySelector('.sr-only')?.textContent));
ok(new Set(stages).size === 5, `5 stages have Read the story: ${[...new Set(stages)]}`);
for (const u of uniq) { const r = await p.request.get(u); ok(r.status() === 200, `${u} ${r.status()}`); }
const stories = ['one-bad-message', 'store-and-forward', 'splitter-30-seconds', 'backfill-16900', 'pubsub-broker', 'log-runaway'];
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const s of stories) {
  const r = await m.goto(base + `stories/${s}/`);
  ok(r.status() === 200, `${s} 200`);
  ok((await m.$$('h1')).length === 1, `${s} one h1`);
  const n = await m.$$eval('ul.metrics li', (l) => l.length);
  console.log(`  ${s} metrics: ${n}`);
  if (s !== 'pubsub-broker') ok(n > 0, `${s} has metrics list`);
  const sw = await m.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, `${s} no overflow at 390 (${sw})`);
}
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
