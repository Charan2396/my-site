// npm run test:e2e: serve the existing dist/ with astro preview (unless BASE_URL is set), run every suite.
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const dir = new URL('./e2e/', import.meta.url);
const suites = readdirSync(dir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
const base = process.env.BASE_URL || 'http://localhost:4329/my-site/';

let preview;
if (!process.env.BASE_URL) {
  preview = spawn('npx', ['astro', 'preview', '--port', '4329'], { stdio: 'ignore', detached: true });
  for (let i = 0; ; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    if (i > 60) { console.error('preview did not start on 4329 (did you run npm run build?)'); stop(); process.exit(1); }
    await new Promise((r) => setTimeout(r, 500));
  }
}
function stop() { if (preview) try { process.kill(-preview.pid); } catch {} }

let failed = 0;
for (const f of suites) {
  const r = spawnSync('node', [new URL(f, dir).pathname], { encoding: 'utf8', env: { ...process.env, BASE_URL: base } });
  const out = r.stdout + r.stderr;
  const pass = (out.match(/^PASS/gm) || []).length;
  const fail = (out.match(/^FAIL/gm) || []).length;
  const bad = r.status !== 0 || fail > 0;
  if (bad) { failed++; console.log(out.split('\n').filter((l) => !l.startsWith('PASS')).join('\n')); }
  console.log(`${bad ? 'FAIL' : 'ok  '} ${f}: ${pass} passed, ${fail} failed${r.status ? ` (exit ${r.status})` : ''}`);
}
stop();
console.log(failed ? `${failed}/${suites.length} suites failed` : `all ${suites.length} suites passed`);
process.exit(failed ? 1 : 0);
