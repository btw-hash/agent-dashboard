// Opens every game of the product in the cabinet, plays a little with random input and
// saves a frame of each. Usage: node product-games.mjs <repo> <outDir> <chrome.exe> [url] [width] [height]
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe, url = 'http://localhost:3737/?debug&sim', w = '1280', h = '800'] =
  process.argv.slice(2);
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: exe, args: ['--mute-audio'] });
const ctx = await browser.newContext({
  viewport: { width: +w, height: +h },
  hasTouch: +w < 600,
});
const page = await ctx.newPage();
const res = { errors: [], games: {} };
page.on('pageerror', (e) => res.errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && res.errors.push('console: ' + m.text()));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__office && window.__office.office.P.length > 0);
await page.evaluate(() => document.fonts.ready);

const names = await page.evaluate(() => window.__office.office.GAMES.map((m) => m.name));
for (const name of names) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const g = (res.games[name] = {});
  await page.evaluate((n) => {
    const o = window.__office;
    o.games.open(o.office.GAMES.find((m) => m.name === n));
  }, name);
  await page.waitForFunction(() => !/LOADING/.test(document.querySelector('#slate').textContent));
  g.title = await page.textContent('#slate');
  if (!(await page.$('#go'))) {
    g.missing = true;
    continue;
  }
  await page.click('#go');
  await page.waitForTimeout(700);
  const box = await page.locator('#screen').boundingBox();
  g.fits = box.x >= 0 && box.y >= 0 && box.x + box.width <= +w + 1 && box.y + box.height <= +h + 1;
  await page.locator('.cab').screenshot({ path: path.join(out, slug + '-' + w + '-start.png') });
  // random play: taps on the screen, d-pad and A, a few typed letters
  for (let i = 0; i < 40; i++) {
    const over = await page.evaluate(
      () =>
        /GAME OVER/.test(document.querySelector('#slate').textContent) &&
        !document.querySelector('#slate').hidden
    );
    if (over) break;
    const r = Math.random();
    if (r < 0.6)
      await page.mouse.click(
        box.x + 8 + Math.random() * (box.width - 16),
        box.y + 8 + Math.random() * (box.height - 16)
      );
    else if (r < 0.8)
      await page.keyboard.press(
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][(Math.random() * 4) | 0]
      );
    else if (r < 0.9) await page.keyboard.press('Enter');
    else await page.keyboard.type('asdf the'[(Math.random() * 8) | 0]);
    await page.waitForTimeout(140);
  }
  await page.locator('.cab').screenshot({ path: path.join(out, slug + '-' + w + '-play.png') });
  g.score = await page.textContent('#cabS');
  g.over = await page.evaluate(
    () =>
      /GAME OVER/.test(document.querySelector('#slate').textContent) &&
      !document.querySelector('#slate').hidden
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  g.closed = await page.evaluate(() => document.querySelector('.cabveil').hidden);
}
console.log(JSON.stringify(res, null, 1));
await browser.close();
