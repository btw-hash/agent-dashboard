// Drives prototypes/games-all.html: every card opens its game in the cabinet and the game
// starts, on a desktop and on a phone; Jukebox rhythm is then played with the keyboard
// (desktop) and by tapping its buttons (phone) to see that input reaches the game. Sounds are
// counted as the oscillators and noise sources the page starts: every game must make some,
// and none may start once the sound button is off.
//   node games-all.mjs <repo> <outDir> <chrome.exe>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe] = process.argv.slice(2);
const { chromium } = createRequire(path.join(repo, 'package.json'))('playwright');
const html =
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style>' +
  fs.readFileSync(path.join(repo, 'prototypes/games-all.html'), 'utf8');
const browser = await chromium.launch({ executablePath: exe, args: ['--mute-audio'] });
const report = {};
for (const [name, viewport, touch] of [
  ['desktop', { width: 1280, height: 800 }, false],
  ['phone', { width: 390, height: 844 }, true],
]) {
  const page = await (
    await browser.newContext({ viewport, hasTouch: touch, deviceScaleFactor: touch ? 3 : 1 })
  ).newPage();
  await page.addInitScript(() => {
    window.__snd = 0;
    const AC = window.AudioContext;
    for (const m of ['createOscillator', 'createBufferSource']) {
      const make = AC.prototype[m];
      AC.prototype[m] = function () {
        window.__snd++;
        return make.call(this);
      };
    }
  });
  const snd = () => page.evaluate(() => window.__snd);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  await page.route('http://games.local/', (r) =>
    r.fulfill({ contentType: 'text/html', body: html })
  );
  await page.goto('http://games.local/');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(out, 'all-' + name + '-page.png') });
  const r = (report[name] = {
    errors,
    sideways: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    cards: await page.locator('#grid .g').count(),
    games: [],
  });
  const lit = () =>
    page.evaluate(() => {
      const c = document.querySelector('#screen'),
        d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 40) n++;
      return Math.round((n * 100) / (d.length / 4));
    });
  for (let i = 0; i < r.cards; i++) {
    await page.locator('#grid .g').nth(i).click();
    await page.waitForSelector('#go');
    const title = await page.locator('#cabT').textContent(),
      before = await snd();
    await page.locator('#go').click();
    await page.waitForTimeout(1300);
    const fits = await page.evaluate(() => {
      const b = document.querySelector('.cab').getBoundingClientRect();
      return b.left >= 0 && b.right <= innerWidth + 0.5 && b.bottom <= innerHeight + 0.5;
    });
    r.games.push({ title, lit: await lit(), fits, sounds: (await snd()) - before });
    if (name === 'phone' || [4, 14, 7].includes(i))
      await page.screenshot({ path: path.join(out, 'all-' + name + '-' + (i + 1) + '.png') });
    await page.locator('#cabX').click();
    if (!(await page.locator('.cabveil').isHidden())) r.games[i].stuck = true;
  }
  // Jukebox rhythm: its first note lands two seconds in, then one every second, then every half
  await page.locator('#grid .g').nth(4).click();
  await page.waitForSelector('#go');
  await page.locator('#go').click();
  const t0 = Date.now();
  const box = await page.locator('#screen').boundingBox();
  for (let at = 2000; at <= 9000; at += 500) {
    await page.waitForTimeout(Math.max(0, at - (Date.now() - t0)));
    if (touch)
      for (let l = 0; l < 4; l++)
        await page.touchscreen.tap(
          box.x + ((l * 30 + 15) / 120) * box.width,
          box.y + (81 / 90) * box.height
        );
    else
      for (const k of ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'])
        await page.keyboard.press(k);
  }
  r.jukebox = +(await page.locator('#cabS').textContent());
  // the sound button: off means not one new sound, and the choice shows on the button
  await page.locator('#cabSnd').click();
  await page.waitForTimeout(300);
  const quiet = await snd();
  await page.waitForTimeout(2500);
  r.muted = {
    pressed: await page.locator('#cabSnd').getAttribute('aria-pressed'),
    started: (await snd()) - quiet,
  };
  await page.locator('#cabSnd').click();
  await page.waitForTimeout(1500);
  r.unmuted = (await snd()) - quiet;
  await page.screenshot({ path: path.join(out, 'all-' + name + '-jukebox-play.png') });
  await page.keyboard.press('Escape');
}
console.log(JSON.stringify(report));
await browser.close();
