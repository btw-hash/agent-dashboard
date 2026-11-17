// Runs the pizza event on the events page and watches the boxes on the cafe tables.
// Usage: node pizza-run.mjs <repo> <outDir> <chrome.exe>
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
    'window.__t={Office,SPOT,P,SEATS,VIS,PIE};Office.start();})();'
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

async function clip(name, wx, wy, w, h) {
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
    clip: { x: pt[0], y: pt[1], width: w, height: h },
  });
}
const state = () =>
  page.evaluate(() => ({
    pie: window.__t.PIE.map((b) => (b ? (b.open ? 'open' : 'shut') + b.n : '-')).join(' '),
    eaters: window.__t.P.filter((p) => p.eat)
      .map((p) => p.name)
      .join(','),
    away: window.__t.P.filter((p) => p.home).length,
    courier: window.__t.VIS.length ? window.__t.VIS[0].n : null,
    idle: !document.getElementById('now').classList.contains('on'),
  }));

const t0 = Date.now();
await page.click('.ev[data-e="pizza"]');
const log = [];
let last = '',
  shots = 0;
while (Date.now() - t0 < 120000) {
  const st = await state();
  const key = st.pie + ' | ' + st.eaters + ' | courier ' + st.courier;
  if (key !== last) {
    log.push(((Date.now() - t0) / 1000).toFixed(1) + 's  ' + key);
    last = key;
  }
  // the cafe: world x 430..640, y 250..345
  if (shots === 0 && /open/.test(st.pie)) {
    await clip('pizza-first-box', 430, 250, 420, 200);
    shots++;
  }
  if (shots === 1 && st.eaters.split(',').filter(Boolean).length >= 2) {
    await clip('pizza-eating-a', 430, 250, 420, 200);
    await page.waitForTimeout(700);
    await clip('pizza-eating-b', 430, 250, 420, 200);
    shots++;
  }
  if (st.idle) break;
  await page.waitForTimeout(250);
}
res.seconds = Math.round((Date.now() - t0) / 1000);
res.log = log;
res.end = await state();
await browser.close();
console.log(JSON.stringify(res, null, 1));
