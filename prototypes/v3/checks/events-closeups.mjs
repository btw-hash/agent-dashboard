// Second pass over the events page: close-ups of what guests carry, the dance, the new fire drill.
// Usage: node events2-run.mjs <repo> <outDir> <chrome.exe>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe] = process.argv.slice(2);
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: exe });
const res = { errors: [] };
const html = fs
  .readFileSync(path.join(repo, 'prototypes/office-events.html'), 'utf8')
  .replace(
    /Office\.start\(\);\s*\}\)\(\);/,
    'window.__t={Office,SPOT,P,SEATS,VIS};Office.start();})();'
  );
const page = await browser.newPage({
  viewport: { width: 1280, height: 860 },
  deviceScaleFactor: 2,
});
page.on('pageerror', (e) => res.errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && res.errors.push('console: ' + m.text()));
await page.route('http://sample.test/**', (r) =>
  r.fulfill({ contentType: 'text/html; charset=utf-8', body: html })
);
await page.goto('http://sample.test/page.html', { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.locator('#stage').scrollIntoViewIfNeeded();

const idle = () => page.evaluate(() => !document.getElementById('now').classList.contains('on'));
const stage = (name) => page.locator('#stage').screenshot({ path: path.join(out, name + '.png') });
// a close-up around a point of the floor
async function close(name, wx, wy, w = 150, h = 110) {
  const pt = await page.evaluate(
    ([x, y]) => {
      const r = document.getElementById('cv').getBoundingClientRect(),
        s = window.__t.Office.toScreen(x, y);
      return [r.left + s[0], r.top + s[1]];
    },
    [wx, wy]
  );
  await page.screenshot({
    path: path.join(out, name + '.png'),
    clip: { x: Math.max(0, pt[0] - w / 2), y: Math.max(0, pt[1] - h * 0.7), width: w, height: h },
  });
}
const guest = () =>
  page.evaluate(() => {
    const v = window.__t.VIS[0];
    return v ? { x: v.x, y: v.y, dir: v.dir, prop: v.prop } : null;
  });
async function finish(id, max) {
  const t0 = Date.now();
  while (Date.now() - t0 < max * 1000 && !(await idle())) await page.waitForTimeout(400);
  return idle();
}
// catch a guest facing a given way while still carrying
async function catchDir(name, dir, max = 30) {
  for (let i = 0; i < max * 5; i++) {
    const v = await guest();
    if (v && v.prop && v.dir === dir) {
      await close(name, v.x, v.y);
      return true;
    }
    await page.waitForTimeout(200);
  }
  return false;
}

// pizza: side view, then front view
let t0 = Date.now();
await page.click('.ev[data-e="pizza"]');
res.pizzaSide = await catchDir('carry-pizza-side', 3);
res.pizzaFront = await catchDir('carry-pizza-front', 0);
res.pizzaDone = await finish('pizza', 120);
res.pizzaSeconds = Math.round((Date.now() - t0) / 1000);

// cleaner: front (walking down), then side on the lower lane
await page.click('.ev[data-e="clean"]');
res.mopFront = await catchDir('carry-mop-front', 0);
res.mopSide = await catchDir('carry-mop-side', 3);
res.cleanDone = await finish('clean', 120);

// mail
await page.click('.ev[data-e="mail"]');
res.parcelSide = await catchDir('carry-parcel-side', 3);
res.mailDone = await finish('mail', 120);

// party: two frames of the dance around the hero
await page.click('.ev[data-e="party"]');
await page.waitForTimeout(11000);
const hero = await page.evaluate(() => {
  const n = document.getElementById('now').textContent.match(/Party: (\S+)/)[1];
  const p = window.__t.P.find((q) => q.name === n);
  return [p.x, p.y];
});
await close('dance-1', hero[0], hero[1] + 10, 260, 200);
await page.waitForTimeout(420);
await close('dance-2', hero[0], hero[1] + 10, 260, 200);
res.dancerPoses = [];
for (let i = 0; i < 6; i++) {
  res.dancerPoses.push(
    await page.evaluate(() =>
      window.__t.P.filter((p) => p.errand && !p.errand.home && !p.errand.route.length)
        .map((p) => p.errand.pose + p.dir)
        .join(' ')
    )
  );
  await page.waitForTimeout(300);
}
res.partyDone = await finish('party', 60);

// fire drill
t0 = Date.now();
await page.click('.ev[data-e="drill"]');
const phases = {};
let last = '';
while (Date.now() - t0 < 60000) {
  const st = await page.evaluate(() => ({
    gone: window.__t.P.filter((p) => p.gone).length,
    away: window.__t.P.filter((p) => p.home).length,
    idle: !document.getElementById('now').classList.contains('on'),
  }));
  const t = (Date.now() - t0) / 1000;
  const key = st.idle
    ? 'done'
    : st.gone === 0 && st.away && !phases.allOut
      ? 'gathering'
      : st.gone > 0 && st.gone < 20 && !phases.allOut
        ? 'leaving'
        : st.gone === 20
          ? 'allOut'
          : 'returning';
  if (key === 'allOut') phases.allOut = phases.allOut || +t.toFixed(1);
  if (key !== last) {
    phases['start_' + key] = +t.toFixed(1);
    last = key;
    if (key === 'leaving') await stage('drill2-leaving');
    if (key === 'returning') {
      await page.waitForTimeout(1500);
      await stage('drill2-returning');
    }
  }
  if (!phases.shotGather && t > 6.5 && key === 'gathering') {
    phases.shotGather = true;
    await stage('drill2-gather');
  }
  if (st.idle) break;
  await page.waitForTimeout(150);
}
res.drillPhases = phases;
res.drillSeconds = Math.round((Date.now() - t0) / 1000);
res.afterDrill = await page.evaluate(() => ({
  away: window.__t.P.filter((p) => p.home || p.errand || p.gone).map((p) => p.name),
  names: window.__t.Office.names,
}));
await stage('drill2-after');
await browser.close();
console.log(JSON.stringify(res, null, 1));
