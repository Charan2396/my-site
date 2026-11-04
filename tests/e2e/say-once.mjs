// "Say it once" (2026-11-04): headline numbers live on their own page; decision log holds standalone ADRs only;
// design docs render optional sections only when filled; home has no hero chips. Screenshots: .out/t-*.png
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { base, launch, OUT, DIST } from './_setup.mjs';
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };

// dist grep: each headline appears on its home page, and at most twice anywhere else (the resume is the source, not counted)
const pages = readdirSync(DIST, { recursive: true }).filter((f) => f.endsWith('.html')).map((f) => [f.replace(/index\.html$/, ''), readFileSync(join(DIST, f), 'utf8')]);
const headlines = [
  ['over 90', 'designs/store-and-forward/'],
  ['5,000+', 'designs/ems-mq-migration/'],
  ['65-invitee', 'designs/ems-mq-migration/'],
  ['converts raw mainframe CDC messages into JSON and publishes them', 'designs/cdc-pubsub-broker/'],
];
for (const [t, home] of headlines) {
  const n = (h) => h.split(t).length - 1;
  const own = pages.find(([f]) => f === home);
  ok(own && n(own[1]) >= 1, `"${t}" on its page /${home}`);
  const elsewhere = pages.filter(([f]) => f !== home && f !== 'resume/').map(([f, h]) => [f, n(h)]).filter(([, c]) => c > 0);
  const total = elsewhere.reduce((s, [, c]) => s + c, 0);
  ok(total <= 2, `"${t}" ${total}x outside its page (${elsewhere.map((x) => x.join('=')).join(' ') || 'none'})`);
}
ok(pages.find(([f]) => f === 'designs/store-and-forward/')[1].split('over 90').length - 1 === 1, '"over 90" once on store-and-forward (Outcome only)');

const b = await launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
// home: no hero chips; contact links stay
await p.goto(base);
ok((await p.$$('.hero .proof, .hero .chip')).length === 0, 'home: no hero proof chips');
ok((await p.$$eval('.hero .contact a', (as) => as.map((a) => a.textContent.trim()))).join('|') === 'Email|LinkedIn|Resume', 'home: Email, LinkedIn, Resume');
const stack = await p.textContent('.impact .stack');
ok(!stack.includes('BigQuery') && !stack.includes('PL/SQL') && !stack.includes('Event-driven'), `stack trimmed: ${stack}`);

// decisions: standalone only, numbered 01.., each with a Status and a Revisit line
await p.goto(base + 'decisions/');
const adrs = await p.$$eval('.log > li', (l) => l.map((x) => ({ id: x.id, title: x.querySelector('h2').textContent.trim(), status: x.querySelector('.status')?.textContent.trim(), revisit: x.querySelector('.revisit')?.textContent.trim() })));
ok(adrs.length === 5 && adrs.every((a, i) => a.id === `adr-0${i + 1}`), `5 ADRs numbered 01-05: ${adrs.map((a) => a.id)}`);
ok(adrs.every((a) => ['PoC', 'In progress', 'In place'].includes(a.status)), `each ADR has a status: ${adrs.map((a) => a.status)}`);
ok(adrs.every((a) => a.revisit?.startsWith('Revisit if')), 'each ADR has a "Revisit if" line');
ok(!adrs.some((a) => /store-and-forward|Pub\/Sub|read-only|Active Directory/i.test(a.title)), `no design-duplicate ADRs: ${adrs.map((a) => a.title).join(' | ')}`);

// designs: optional sections only when filled
const secs = async (slug) => { await p.goto(base + `designs/${slug}/`); return p.$$eval('article section > h2', (h) => h.map((x) => x.textContent.trim())); };
const recon = await secs('reconciliation-engine');
for (const h of ['Why this approach', 'What it guards against', 'Known limits']) ok(recon.includes(h), `reconciliation has ${h}`);
ok((await p.textContent('#limits ~ ul')).includes('value hash'), 'reconciliation known limit: value drift needs a value hash');
ok((await p.textContent('.decision .status')).includes('PoC') && (await p.textContent('.decision .revisit')).startsWith('Revisit if value drift'), 'reconciliation decision box: status + revisit');
const ems = await secs('ems-mq-migration');
ok(!['Who it serves', 'Why this approach', 'What it guards against', 'Known limits', 'What went wrong along the way'].some((h) => ems.includes(h)) && (await p.$$('.decision .status')).length === 0, `unfilled design renders no optional sections: ${ems.join(' · ')}`);
ok((await secs('cdc-pubsub-broker')).includes('Who it serves'), 'broker has Who it serves');
ok((await p.textContent('#guards ~ ul')).includes('The sample record on the home page shows'), 'broker: illustrative fields framed as the home-page sample');
ok((await secs('store-and-forward')).includes('What went wrong along the way'), 'store-and-forward has What went wrong along the way');
ok((await p.textContent('[data-sf] .outcome')).includes('Outcome') && !(await p.textContent('[data-sf]')).includes('90'), 'toggle caption points at Outcome, no number');
await p.screenshot({ path: OUT + 't-store-and-forward-1280-light.png', fullPage: true });

// working-with-me: 90-day plan and concept table stay; the method moved to the design
await p.goto(base + 'working-with-me/');
ok((await p.$$('#first-90 ~ ol > li')).length === 5, '90-day plan: 5 items');
ok((await p.$$('#other-names ~ table tbody tr')).length === 6, 'concept table: 6 rows');
ok((await p.$$('#your-problem ~ ol')).length === 0, 'no method steps on the team page');

// screenshots
const shot = async (w, path, name) => {
  const q = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
  await q.goto(base + path); await q.waitForTimeout(200);
  await q.screenshot({ path: OUT + name, fullPage: true }); await q.close();
};
await shot(1280, '', 't-home-1280-light.png');
await shot(1280, 'designs/reconciliation-engine/', 't-recon-1280-light.png');
await shot(390, 'decisions/', 't-decisions-390-light.png');
await shot(1280, 'working-with-me/', 't-wwm-1280-light.png');
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
