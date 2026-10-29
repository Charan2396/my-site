// Review screenshots (tests/e2e/.out/fb-*.png) and the print stylesheet.
import { base, launch, OUT } from './_setup.mjs';
const b = await launch();
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const shot = async (w, h, scheme, path, name, sel) => {
  const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
  await p.goto(base + path);
  if (sel) await p.locator(sel).screenshot({ path: OUT + name });
  else await p.screenshot({ path: OUT + name });
  await p.close();
};
await shot(1280, 900, 'light', '', 'fb-home-1280-light.png');
await shot(390, 844, 'light', '', 'fb-home-390-light.png');
await shot(820, 1000, 'light', '', 'fb-home-820-light-impact.png', '.impact');
await shot(1280, 900, 'dark', 'working-with-me/', 'fb-wwm-1280-dark-mapping.png', 'section:has(#other-names)');
const pp = await b.newPage({ viewport: { width: 1280, height: 900 } });
await pp.goto(base + 'projects/'); await pp.screenshot({ path: OUT + 'fb-projects-1280-light.png', fullPage: true });
await pp.close();

// print: every fig. 2 version and fig. 3 step visible, controls and motion hidden
const p = await b.newPage();
await p.goto(base); await p.waitForSelector('[data-controls]:not([hidden])');
await p.emulateMedia({ media: 'print' });
const pr = await p.evaluate(() => ({
  versions: [...document.querySelectorAll('[data-version]')].filter((x) => x.getBoundingClientRect().height > 0).length,
  steps: [...document.querySelectorAll('[data-step-item]')].filter((x) => x.getBoundingClientRect().height > 0).length,
  shown: [...document.querySelectorAll('.token, .packet, [data-controls], [data-icontrols], [data-replay]')].filter((x) => x.getBoundingClientRect().height > 0).length,
}));
ok(pr.versions === 5 && pr.steps === 7 && pr.shown === 0, `print: ${JSON.stringify(pr)}`);
await b.close();
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
