// Runs every event on the events sample page to its end in headless Chromium.
// Usage: node events-run.mjs <repo> <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const repo = process.argv[2];
const out = process.argv[3];
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');

const html = fs.readFileSync(path.join(repo, 'prototypes/office-events.html'), 'utf8');
const browser = await chromium.launch({ executablePath: process.argv[4] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
await page.route('http://sample.test/**', (r) =>
  r.fulfill({ contentType: 'text/html; charset=utf-8', body: html })
);
await page.goto('http://sample.test/page.html', { waitUntil: 'load' });
await page.waitForTimeout(1500);

const stage = page.locator('#stage');
const shot = (name) => stage.screenshot({ path: path.join(out, name + '.png') });
const idle = () => page.evaluate(() => !document.getElementById('now').classList.contains('on'));
const report = [];

async function run(id, shots, max) {
  const t0 = Date.now();
  await page.click(`.ev[data-e="${id}"]`);
  const label = await page.textContent('#now');
  for (const [at, name] of shots) {
    await page.waitForTimeout(Math.max(0, at * 1000 - (Date.now() - t0)));
    await shot(name);
  }
  let done = false;
  while (Date.now() - t0 < max * 1000) {
    if (await idle()) {
      done = true;
      break;
    }
    await page.waitForTimeout(500);
  }
  const toasts = await page.$$eval('.toast', (n) => n.map((t) => t.textContent));
  report.push({ id, label, finished: done, seconds: Math.round((Date.now() - t0) / 1000), toasts });
  if (!done) await shot(id + '-stuck');
  await page.waitForTimeout(800);
}

await shot('00-idle');
await run(
  'dark',
  [
    [0.6, 'dark-flicker'],
    [4, 'dark'],
  ],
  30
);
await run(
  'drill',
  [
    [6, 'drill-walk'],
    [15, 'drill-line'],
  ],
  90
);
await run('party', [[9, 'party']], 90);
await run('mail', [[9, 'mail']], 90);
await run('clean', [[19, 'clean']], 120);
await run(
  'pizza',
  [
    [15, 'pizza-drop'],
    [33, 'pizza-eat'],
  ],
  150
);
await page.click('.hol[data-h="ny"]');
await page.waitForTimeout(700);
await shot('ny-day');
await page.click('.hr[data-t="23"]');
await page.waitForTimeout(700);
await shot('ny-night');
await page.click('.hol[data-h="hw"]');
await page.waitForTimeout(700);
await shot('hw-night');
await page.click('.hr[data-t="10"]');
await page.waitForTimeout(700);
await shot('hw-day');

// everyone must be back where they started
const stray = await page.evaluate(() => document.querySelectorAll('.ev:disabled').length);
console.log(JSON.stringify({ report, errors, disabledButtonsAtEnd: stray }, null, 1));
await browser.close();
