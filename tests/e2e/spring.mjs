// Self-check for src/lib/spring.ts (pure math plus a manually ticked spring; no browser).
let T = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => T }, configurable: true });
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
const { springAt, createSpring, project, rubberband, MOMENTUM } = await import('../../src/lib/spring.ts');

let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };

// critically damped: converges, never crosses the target
const samples = Array.from({ length: 301 }, (_, i) => springAt(100, 0, i / 100)[0]);
ok(Math.abs(samples[200]) < 0.01, `critically damped settles within 2s: d(2s)=${samples[200].toExponential(2)}`);
ok(samples.every((d) => d >= 0), 'critically damped never overshoots');
ok(samples.every((d, i) => i === 0 || d <= samples[i - 1]), 'critically damped approaches monotonically from rest');
// a flick toward the target overshoots a little with damping 0.8, then settles
const flick = Array.from({ length: 301 }, (_, i) => springAt(100, -2000, i / 100, MOMENTUM)[0]);
ok(Math.min(...flick) < 0 && Math.abs(flick[300]) < 0.01, `damping 0.8 overshoots (${Math.min(...flick).toFixed(1)}) then settles`);
// velocity is the derivative of position
const [a] = springAt(100, 300, 0.2), [b] = springAt(100, 300, 0.2001), [, v] = springAt(100, 300, 0.20005);
ok(Math.abs((b - a) / 0.0001 - v) < 0.5, `velocity matches dx/dt: ${v.toFixed(1)} vs ${((b - a) / 0.0001).toFixed(1)}`);

// a live spring: converges to target exactly, and a retarget mid-flight keeps value and velocity continuous
const seen = [];
let rested = 0;
const s = createSpring((x) => seen.push(x), 0, 0.01, () => rested++);
T = 1000; s.to(100);
T = 1100; s.tick(T);
const before = [s.value, s.velocity];
s.to(-50); // retarget at the same instant
T = 1100.001; s.tick(T);
const after = [s.value, s.velocity];
ok(Math.abs(after[0] - before[0]) < 0.01, `retarget keeps position: ${before[0].toFixed(3)} -> ${after[0].toFixed(3)}`);
ok(before[1] > 0 && Math.abs(after[1] - before[1]) / before[1] < 0.01, `retarget keeps velocity: ${before[1].toFixed(1)} -> ${after[1].toFixed(1)}`);
T = 1200; s.tick(T);
ok(s.velocity < before[1], `then decelerates and turns toward the new target: v=${s.velocity.toFixed(1)}`);
for (T = 1200; T <= 4000; T += 16) s.tick(T);
ok(s.value === -50 && !s.running && rested === 1, `settles exactly on target and rests once: ${s.value}, running=${s.running}, onRest x${rested}`);
s.set(10);
ok(s.value === 10 && seen.at(-1) === 10 && !s.running, 'set() jumps without animating');

// gesture helpers
ok(Math.abs(project(1000) - 499) < 0.01, `project(1000 px/s) = ${project(1000).toFixed(1)} px (Apple, rate 0.998)`);
const rb = [10, 100, 400, 4000].map((o) => rubberband(o, 400));
ok(rb.every((r, i) => r < [10, 100, 400, 4000][i] && (i === 0 || r > rb[i - 1])) && rb[3] < 400, `rubberband resists more the further it goes: ${rb.map((r) => r.toFixed(0))}`);
ok(rubberband(-100, 400) === -rubberband(100, 400), 'rubberband is symmetric');

console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
