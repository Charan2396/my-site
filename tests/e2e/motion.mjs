// Phase 4: client-side navigation, listener hygiene, motion layers, sticky replay strip, transitions.
import { base, launch, OUT, DIST } from './_setup.mjs';
import { readdirSync } from 'node:fs';
const b = await launch();
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };

// counts live window resize listeners; listeners registered with a signal leave the count on abort
const counter = () => {
  window.__resize = 0;
  const add = window.addEventListener, rem = window.removeEventListener;
  const live = new Set();
  window.addEventListener = function (type, fn, opts) {
    if (this === window && type === 'resize' && !live.has(fn)) {
      live.add(fn); window.__resize++;
      opts?.signal?.addEventListener('abort', () => { if (live.delete(fn)) window.__resize--; });
    }
    return add.call(this, type, fn, opts);
  };
  window.removeEventListener = function (type, fn, opts) {
    if (this === window && type === 'resize' && live.delete(fn)) window.__resize--;
    return rem.call(this, type, fn, opts);
  };
};

const visible = (p) => p.evaluate(() => [...document.querySelectorAll('[data-version]')].filter((v) => !v.hidden).map((v) => v.querySelector('h3').textContent.trim()));
const ready = (p) => p.waitForSelector('[data-pick="0"]:not([hidden])');
const checkHome = async (p, label) => {
  await ready(p);
  await p.click('[data-pick="3"]');
  const v = await visible(p);
  ok(v[0]?.startsWith('Store') && (await p.isVisible('text=MERGE INTO order_line')), `${label}: stage 4 shows Oracle sample`);
  await p.focus('[data-pick="3"]'); await p.keyboard.press('ArrowRight');
  ok((await visible(p))[0]?.startsWith('Consume'), `${label}: ArrowRight -> Consume`);
  await p.click('[data-replay]');
  await p.click('[data-istep="1"]'); await p.click('[data-istep="1"]');
  ok((await p.textContent('[data-live]')).startsWith('Incident step 3 of 7') && (await p.evaluate(() => document.querySelectorAll('[data-stage]')[2].classList.contains('is-error'))), `${label}: replay reaches step 3 with error`);
  await p.click('[data-exit]');
};

// (a) + (b)
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(counter);
const p = await ctx.newPage();
await p.goto(base);
await ready(p);
await p.evaluate(() => (window.__marker = 'same-document'));
const r0 = await p.evaluate(() => window.__resize);
ok(r0 === 1, `one resize listener on first load: ${r0}`);
await p.click('.pipeline a.cta >> nth=0');
await p.waitForURL('**/stories/one-bad-message/');
await p.waitForSelector('article h1');
ok((await p.evaluate(() => window.__marker)) === 'same-document', 'story reached by client-side navigation (no reload)');
ok((await p.textContent('article h1')).length > 0, `story h1: "${await p.textContent('article h1')}"`);
ok((await p.evaluate(() => window.__resize)) === 0, `resize listener released on the story page: ${await p.evaluate(() => window.__resize)}`);
await p.goBack(); await p.waitForURL(base);
ok((await p.evaluate(() => window.__marker)) === 'same-document', 'back is client-side too');
await checkHome(p, 'after story -> back');
const counts = [];
for (let i = 0; i < 3; i++) {
  await p.click('.pipeline a.cta >> nth=0'); await p.waitForURL('**/stories/**'); await p.waitForSelector('article h1');
  await p.goBack(); await p.waitForURL(base); await ready(p);
  counts.push(await p.evaluate(() => window.__resize));
}
ok(counts.every((c) => c === r0), `resize listeners after 3 round trips: ${counts} (start ${r0})`);
// home -> projects -> reconciliation -> stepper -> home
await p.click('nav a[href$="/projects/"]'); await p.waitForURL('**/projects/');
await p.click('a[href="/my-site/reconciliation/"]'); await p.waitForURL('**/reconciliation/');
const R = p.locator('[data-stepper]');
await R.locator('[data-controls]:not([hidden])').waitFor();
await R.locator('[data-go="1"]').click();
ok((await R.locator('[data-count]').textContent()) === '2 / 6', 'reconciliation stepper Next works after client nav');
await R.locator('[data-go="1"]').focus(); await p.keyboard.press('ArrowRight');
ok((await R.locator('[data-count]').textContent()) === '3 / 6', 'reconciliation ArrowRight works');
await p.click('a.brand'); await p.waitForURL(base);
ok((await p.evaluate(() => window.__marker)) === 'same-document', 'whole tour without a reload');
await checkHome(p, 'after reconciliation -> home');
ok((await p.evaluate(() => window.__resize)) === r0, `resize listeners at end: ${await p.evaluate(() => window.__resize)}`);
// (g) transition names
const names = await p.$$eval('[data-stage]', (els) => els.map((e) => e.hasAttribute('data-astro-transition-scope') && getComputedStyle(e).viewTransitionName));
ok(JSON.stringify(names) === JSON.stringify(['stage-source', 'stage-queue', 'stage-process', 'stage-store', 'stage-consume']), `home boxes carry view-transition-name: ${names}`);
await ctx.close();
const sp = await b.newPage();
for (const [slug, stage] of [['one-bad-message', 'source'], ['store-and-forward', 'queue'], ['splitter-30-seconds', 'process'], ['log-runaway', 'process'], ['backfill-16900', 'store'], ['pubsub-broker', 'consume']]) {
  await sp.goto(`${base}stories/${slug}/`);
  const vt = await sp.$$eval('[data-astro-transition-scope]', (els) => els.map((e) => getComputedStyle(e).viewTransitionName));
  ok(vt.length === 1 && vt[0] === `stage-${stage}`, `${slug} header: ${vt}`);
}
await sp.close();

// (c) motion: normal vs reduced
for (const [w, rm] of [[1280, 'no-preference'], [390, 'no-preference'], [1280, 'reduce'], [390, 'reduce']]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: rm });
  const q = await c.newPage();
  await q.goto(base); await ready(q);
  const m = await q.evaluate(() => {
    const pk = [...document.querySelectorAll('.packet')].map((e) => { const s = getComputedStyle(e); return s.display === 'none' ? 'none' : s.animationName; });
    return { draw: document.querySelector('.pipeline').classList.contains('draw'), stage: getComputedStyle(document.querySelector('.stage')).animationName, pk };
  });
  if (rm === 'reduce') {
    ok(m.pk.length === 4 && m.pk.every((x) => x === 'none'), `reduced ${w}: packets not rendered: ${m.pk}`);
    ok(m.stage === 'none', `reduced ${w}: draw-in skipped (stage animation ${m.stage})`);
  } else {
    ok(m.pk.every((x) => x === (w > 900 ? 'flow-x' : 'flow-y')), `${w}: packets ${m.pk}`);
    ok(m.draw && m.stage === 'pen', `${w}: first visit draws in (${m.stage})`);
    await q.waitForTimeout(2600);
    const settled = await q.evaluate(() => { const s = getComputedStyle(document.querySelector('.stage')); return s.clipPath + '|' + s.opacity; });
    ok(settled === 'none|1', `${w}: settled boxes unclipped: ${settled}`);
    await q.click('[data-replay]');
    ok(await q.$$eval('.packet', (e) => e.every((x) => getComputedStyle(x).animationPlayState === 'paused')), `${w}: packets paused during replay`);
    await q.click('[data-exit]');
    await q.reload(); await ready(q);
    ok(!(await q.evaluate(() => document.querySelector('.pipeline').classList.contains('draw'))), `${w}: draw-in once per visit (not on reload)`);
  }
  await c.close();
}

// (d) no JS
const nj = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
const z = await nj.newPage();
await z.goto(base);
const vis = await z.evaluate(() => {
  const out = [];
  for (const li of document.querySelectorAll('.pipeline li')) {
    for (const [el, pseudo] of [[li.querySelector('.stage'), null], [li, '::after'], [li, '::before']]) {
      const s = getComputedStyle(el, pseudo);
      if (pseudo && s.content === 'none') continue;
      out.push(`${s.opacity}|${s.clipPath}|${s.animationName}`);
    }
  }
  return out;
});
ok(vis.length === 13 && vis.every((v) => v === '1|none|none'), `no JS: 5 boxes + 8 connector parts fully visible: ${[...new Set(vis)]}`);
ok(await z.$$eval('.packet', (e) => e.every((x) => getComputedStyle(x).display === 'none')), 'no JS: no packets');
await nj.close();

// (e) sticky strip at 390
const s = await b.newPage({ viewport: { width: 390, height: 844 } });
await s.goto(base); await ready(s);
ok(!(await s.isVisible('.strip')), 'strip hidden before replay');
await s.click('[data-replay]'); await s.click('[data-istep="1"]'); await s.click('[data-istep="1"]');
ok(await s.isVisible('.strip'), 'strip visible during replay at 390');
const strip = () => s.$$eval('.strip li', (l) => l.map((x) => (x.classList.contains('is-error') ? 'E' : x.classList.contains('is-on') ? 'L' : '-')).join(''));
ok((await strip())[2] === 'E', `strip mirrors step 3 error: ${await strip()}`);
const mirror = await s.$$eval('[data-stage]', (l) => l.map((x) => (x.classList.contains('is-error') ? 'E' : x.classList.contains('is-on') ? 'L' : '-')).join(''));
ok(mirror === (await strip()), `strip matches fig. 1: ${mirror}`);
await s.evaluate(() => { const f = document.querySelector('.incident'); scrollTo(0, f.getBoundingClientRect().top + scrollY + 120); });
const top = await s.evaluate(() => { const r = document.querySelector('.strip').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; });
ok(top[0] >= 0 && top[0] <= 2 && top[1] < 844, `strip pinned in viewport after scrolling within fig. 3: ${top}`);
await s.waitForTimeout(600); await s.screenshot({ path: OUT + 'p4-390-light-replay-step3.png' });
await s.click('[data-istep="1"]'); await s.click('[data-istep="1"]'); await s.click('[data-istep="1"]');
ok(!(await strip()).includes('E'), `strip error clears at step 6: ${await strip()}`);
await s.click('[data-exit]');
ok(!(await s.isVisible('.strip')), 'strip hidden after exit');
await s.setViewportSize({ width: 1280, height: 900 });
await s.click('[data-replay]');
ok(!(await s.isVisible('.strip')), 'strip hidden on wide screens');
await s.close();

// (f) overflow on all pages
const slugs = readdirSync(DIST + 'stories');
const pages = ['', 'working-with-me/', 'projects/', 'projects/simple-dynamo/', 'reconciliation/', 'build-log/', 'resume/', ...slugs.map((x) => `stories/${x}/`)];
for (const [w, scheme] of [[390, 'light'], [390, 'dark'], [1280, 'light'], [1280, 'dark']]) {
  const q = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
  const bad = [];
  for (const pg of pages) {
    await q.goto(base + pg);
    const sw = await q.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) bad.push(`${pg || '/'}=${sw}`);
  }
  ok(bad.length === 0, `no overflow ${w} ${scheme} on ${pages.length} pages ${bad.join(' ')}`);
  await q.close();
}

// screenshots
const sc = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
const a = await sc.newPage();
await a.goto(base, { waitUntil: 'commit' });
await a.waitForSelector('.pipeline.draw'); await a.waitForTimeout(700);
await a.locator('.pipeline').screenshot({ path: OUT + 'p4-1280-light-drawin.png' });
await a.waitForTimeout(3000);
await a.locator('.pipeline').screenshot({ path: OUT + 'p4-1280-light-settled.png' });
await sc.close();
const d = await b.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
await d.goto(base); await ready(d); await d.waitForTimeout(2800);
await d.hover('[data-pick="2"]'); await d.waitForTimeout(300);
await d.locator('.pipeline').screenshot({ path: OUT + 'p4-1280-dark-hover.png' });
await d.close();

await b.close();
console.log(fails ? `${fails}/${n} FAIL` : `ALL PASS (${n} checks)`);
