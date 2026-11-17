// Exercises the arcade-frame sample page in headless Chromium.
// Usage: node games-run.mjs <repo> <outDir> <chrome.exe>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe] = process.argv.slice(2);
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
const html = fs.readFileSync(path.join(repo, 'prototypes/arcade-frame.html'), 'utf8');
const browser = await chromium.launch({ executablePath: exe });
const res = { errors: [] };

async function open(viewport, hasTouch) {
  const ctx = await browser.newContext({ viewport, hasTouch: !!hasTouch });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => res.errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && res.errors.push('console: ' + m.text()));
  await page.route('http://sample.test/**', (r) =>
    r.fulfill({ contentType: 'text/html; charset=utf-8', body: html })
  );
  await page.goto('http://sample.test/page.html', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  return page;
}
const text = (page, sel) => page.textContent(sel);

// desktop
let page = await open({ width: 1280, height: 800 });
res.cards = await page.$$eval('.gm', (n) => n.map((b) => b.textContent));
await page.screenshot({ path: path.join(out, 'games-page.png') });

// 1. Snake: start with the keyboard, steer, run into the wall
await page.click('.gm[data-n="17"]');
await page.waitForTimeout(700);
res.snakeTitle = [await text(page, '#cabT'), await text(page, '#cabR'), await text(page, '#card')];
await page.screenshot({ path: path.join(out, 'games-snake-title.png') });
await page.keyboard.press('Enter');
await page.waitForTimeout(500);
res.snakeCardHiddenWhilePlaying = await page.$eval('#card', (c) => c.hidden);
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(350);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(out, 'games-snake-play.png') });
await page.waitForTimeout(4000); // straight into the right wall
res.snakeOver = await text(page, '#card');
res.snakeBoard = await text(page, '#hi');
await page.keyboard.press('Escape');
res.closedByEsc = await page.$eval('#veil', (v) => v.hidden);

// 2. Reaction test: wait for green, press A
await page.click('.gm[data-n="16"]');
await page.waitForTimeout(500);
await page.click('#go');
await page.waitForTimeout(4600);
await page.click('#btnA');
await page.waitForTimeout(300);
res.reactionOver = await text(page, '#card');
res.reactionColour = await page.$eval('#cab', (c) => getComputedStyle(c).getPropertyValue('--c'));
await page.click('#cabX');

// 3. Slot machine: ten spins by tapping the screen
await page.click('.gm[data-n="10"]');
await page.waitForTimeout(500);
await page.click('#go');
for (let i = 0; i < 10; i++) {
  await page.click('#screen');
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: path.join(out, 'games-slot.png') });
await page.waitForTimeout(1700);
res.slotOver = await text(page, '#card');
await page.click('#cabX');

// 4. A game that is not playable in the sample
await page.click('.gm[data-n="8"]');
await page.waitForTimeout(600);
res.rouletteCard = await text(page, '#card');
res.rouletteScreen = await page.$eval('#screen', (c) => [c.width, c.height]);
res.rouletteControls = await page.$$eval('#dpad, #btnA', (n) => n.map((e) => e.style.visibility));
await page.screenshot({ path: path.join(out, 'games-roulette.png') });
await page.click('#cabX');

// 5. opening from a marker in the office itself
const hit = await page.evaluate(() => {
  const cv = document.getElementById('cv'),
    r = cv.getBoundingClientRect();
  return { r: [r.left, r.top, r.width, r.height] };
});
res.stageRect = hit.r;
// scores survive a reload of the stored value
res.stored = await page.evaluate(() => localStorage.getItem('agent_office_scores'));
await page.context().close();

// phone
page = await open({ width: 390, height: 780 }, true);
await page.tap('.gm[data-n="17"]');
await page.waitForTimeout(700);
res.phoneFits = await page.$eval('#cab', (c) => {
  const r = c.getBoundingClientRect();
  return {
    w: Math.round(r.width),
    h: Math.round(r.height),
    bottom: Math.round(r.bottom),
    vw: innerWidth,
    vh: innerHeight,
  };
});
await page.tap('#go');
await page.waitForTimeout(400);
await page.tap('#dpad [data-k="down"]');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(out, 'games-phone.png') });
res.phonePlaying = await page.$eval('#card', (c) => c.hidden);
res.pageScrollsSideways = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth
);
await browser.close();
console.log(JSON.stringify(res, null, 1));
