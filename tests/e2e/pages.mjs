import { base, launch, OUT, DIST } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const pages = { 'projects/': 'Projects', 'build-log/': 'Build log', 'resume/': 'Resume', '': null };
for (const [path, label] of Object.entries(pages)) {
  const p = await b.newPage();
  const r = await p.goto(base + path);
  ok(r.status() === 200, `${path || '/'} status ${r.status()}`);
  const cur = await p.$$eval('nav a[aria-current="page"]', (as) => as.map((a) => a.textContent.trim())); // header or footer nav
  ok(label ? cur.length === 1 && cur[0] === label : cur.length === 0, `${path || '/'} aria-current: [${cur}]`);
  ok((await p.$$('h1')).length === 1, `${path || '/'} one h1`);
  ok(!(await p.content()).includes('Information-Retrieval'), `${path || '/'} no Information-Retrieval link`);
  await p.close();
}
for (const [w, h, scheme] of [[1280, 900, 'light'], [1280, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
  for (const path of ['projects/', 'build-log/', 'resume/']) {
    await p.goto(base + path);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(sw <= w, `no overflow ${path} ${w} ${scheme} (${sw})`);
    if (path !== 'resume/' && ((w === 1280 && scheme === 'light') || (w === 390 && scheme === 'dark')))
      await p.screenshot({ path: OUT + `p1-${path.slice(0, -1)}-${w}-${scheme}.png`, fullPage: true });
  }
  await p.close();
}
const p = await b.newPage();
await p.goto(base);
const header = await p.$$eval('nav[aria-label="Main"] a', (as) => as.map((a) => a.textContent.trim()));
const footer = await p.$$eval('footer a', (as) => as.map((a) => a.textContent.trim()));
ok(header.join('|') === 'Working with me|Projects|Resume', `header nav: ${header}`);
ok(footer.join('|') === 'Email|LinkedIn|GitHub|Build log', `footer links: ${footer}`);
await p.goto(base + 'build-log/');
const dates = await p.$$eval('.log time', (ts) => ts.map((t) => t.getAttribute('datetime')));
const ids = await p.$$eval('.log h2', (hs) => hs.map((h) => h.id));
ok(dates.every((d, i) => i === 0 || d <= dates[i - 1]), `build log dates desc: ${dates.join(',')}`);
ok(ids.every((d, i) => i === 0 || dates[i] !== dates[i - 1] || d < ids[i - 1]), `same-date ids desc: ${ids.join(',')}`);
ok(ids[0].includes('2026-10-28-'), `newest first: ${ids[0]}`);
await p.goto(base + 'projects/');
const links = await p.$$eval('.card a', (as) => as.map((a) => a.getAttribute('href')));
ok(links.length === 6, `project links (3 GitHub + 2 explainers + build log): ${links.join(' ')}`);
const order = await p.$$eval('.card h2', (h) => h.map((x) => x.id));
ok(order.join('|') === 'project-reconciliation|project-this-site|project-simple-dynamo|project-twitter-search-ir', `project order: ${order}`);
ok((await p.textContent('.card .caption')).includes('Proof of concept'), 'first card labelled proof of concept');
ok((await p.textContent('.also')).includes('Also from grad school'), 'ML coursework folded into one note');
await p.goto(base + 'stories/backfill-16900/');
const rl = p.locator('article a', { hasText: 'interactive explainer' });
ok((await rl.count()) === 1, 'backfill story links the reconciliation explainer');
const rr = await p.request.get(new URL(await rl.getAttribute('href'), p.url()).href);
ok(rr.status() === 200 && rr.url().endsWith('/my-site/reconciliation/'), `link resolves to ${rr.url()} ${rr.status()}`);
await b.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
