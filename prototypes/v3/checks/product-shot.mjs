// One frame of the product. Usage:
//   node product-shot.mjs <repo> <out.png> <chrome.exe> [url] [width] [height] [waitMs] [js to run first]
import path from 'node:path';
import { createRequire } from 'node:module';

const [
  repo,
  out,
  exe,
  url = 'http://localhost:3737/?debug&sim',
  w = '1280',
  h = '800',
  wait = '4000',
  js = '',
] = process.argv.slice(2);
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: exe });
const page = await (
  await browser.newContext({ viewport: { width: +w, height: +h }, hasTouch: +w < 600 })
).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__office && window.__office.office.P.length > 0);
await page.evaluate(() => document.fonts.ready);
let result = null;
if (js) result = await page.evaluate(js);
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
console.log(JSON.stringify({ errors, result }));
await browser.close();
