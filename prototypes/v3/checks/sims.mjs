// Exercises the Sims-mode sample page, then re-shoots two frames of the events page.
// Usage: node sims-run.mjs <repo> <outDir> <chrome.exe>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe] = process.argv.slice(2);
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: exe });
const res = { errors: [] };

async function open(file, viewport) {
  // the test needs to read the scene, so it hangs the engine's own objects on window (test copy only)
  const html = fs
    .readFileSync(path.join(repo, 'prototypes', file), 'utf8')
    .replace(
      /Office\.start\(\);\s*\}\)\(\);/,
      'window.__t={Office,SPOT,P,SEATS};Office.start();})();'
    );
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (e) => res.errors.push(file + ' pageerror: ' + e.message));
  page.on(
    'console',
    (m) => m.type() === 'error' && res.errors.push(file + ' console: ' + m.text())
  );
  await page.route('http://sample.test/**', (r) =>
    r.fulfill({ contentType: 'text/html; charset=utf-8', body: html })
  );
  await page.goto('http://sample.test/page.html', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  return page;
}
const who = (page, name) =>
  page.evaluate((n) => {
    const p = window.__t.P.find((q) => q.name === n);
    return {
      x: Math.round(p.x),
      y: Math.round(p.y),
      state: p.state,
      ordered: !!p.ordered,
      queue: (p.queue || []).length,
      errand: !!p.errand,
    };
  }, name);
async function clickWorld(page, x, y) {
  const pt = await page.evaluate(
    ([wx, wy]) => {
      const r = document.getElementById('cv').getBoundingClientRect(),
        s = window.__t.Office.toScreen(wx, wy);
      return [r.left + s[0], r.top + s[1]];
    },
    [x, y]
  );
  await page.mouse.move(pt[0], pt[1]);
  await page.mouse.click(pt[0], pt[1]);
}
const stage = (page, name) =>
  page.locator('#stage').screenshot({ path: path.join(out, name + '.png') });

// ── Sims mode ──
let page = await open('sims-mode.html', { width: 1280, height: 860 });
await page.locator('#stage').scrollIntoViewIfNeeded();
res.freeChips = await page.$$eval('.who', (n) => n.map((b) => b.textContent));
const spot = (k) => page.evaluate((k) => window.__t.SPOT[k].slice(0, 3), k);
// 1. pick Reps on the canvas itself, send him to the vending machine, queue the espresso machine
const reps0 = await who(page, 'Reps');
await clickWorld(page, reps0.x, reps0.y - 14);
res.statusAfterPick = await page.textContent('#now');
const vend = await spot('vend'),
  esp = await spot('esp');
await clickWorld(page, vend[1], vend[2] - 10);
await page.waitForTimeout(400);
res.repsSent = await who(page, 'Reps');
await page.waitForTimeout(1500);
await clickWorld(page, esp[1], esp[2] - 10);
await page.waitForTimeout(300);
res.repsQueued = await who(page, 'Reps');
await stage(page, 'sims-path');
// 2. a working agent refuses
const heis = await who(page, 'Heisen-X');
await clickWorld(page, heis.x, heis.y - 20);
await page.waitForTimeout(300);
await stage(page, 'sims-busy');
res.statusAfterBusy = await page.textContent('#now');
// 3. wait for both legs
let t = 0,
  atVend = null;
while (t < 60) {
  const r = await who(page, 'Reps');
  if (!atVend && r.state === 'stay' && Math.abs(r.x - vend[1]) < 2 && Math.abs(r.y - vend[2]) < 2)
    atVend = t;
  if (r.state === 'stay' && Math.abs(r.x - esp[1]) < 2 && Math.abs(r.y - esp[2]) < 2) break;
  await page.waitForTimeout(500);
  t += 0.5;
}
res.reachedVendAfterS = atVend;
res.reachedEspressoAfterS = t;
res.repsEnd = await who(page, 'Reps');
// 4. "wait for orders": nobody moves for 25 seconds
await page.click('.auto[data-a="0"]');
await page.waitForTimeout(16000); // let those already walking arrive
const before = await page.evaluate(() =>
  window.__t.P.filter((p) => p.roam).map((p) => [p.name, Math.round(p.x), Math.round(p.y), p.state])
);
await page.waitForTimeout(25000);
const after = await page.evaluate(() =>
  window.__t.P.filter((p) => p.roam).map((p) => [p.name, Math.round(p.x), Math.round(p.y), p.state])
);
res.waitModeMoved = after
  .filter((a, i) => a[1] !== before[i][1] || a[2] !== before[i][2])
  .map((a) => a[0]);
res.waitModeStates = after.map((a) => a[3]);
// 5. select all, send to the games room, then switch the mode off
await page.click('#allBtn');
await clickWorld(page, 30, 290);
await page.waitForTimeout(600);
res.groupSent = await page.evaluate(() =>
  window.__t.P.filter((p) => p.roam && p.ordered).map((p) => p.name)
);
await page.click('#simsBtn');
res.statusOff = await page.textContent('#now');
await page.close();

// phone width
page = await open('sims-mode.html', { width: 390, height: 780 });
res.phoneSideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
await page.click('.who[data-i="1"]');
await page.waitForTimeout(1500);
await page.locator('#stage').scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(out, 'sims-phone.png') });
await page.close();

// ── events page: the two frames that changed ──
page = await open('office-events.html', { width: 1280, height: 860 });
await page.locator('#stage').scrollIntoViewIfNeeded();
await page.click('.ev[data-e="drill"]');
await page.waitForTimeout(15000);
await stage(page, 'drill-line2');
let done = false;
for (let i = 0; i < 80 && !done; i++) {
  done = await page.evaluate(() => !document.getElementById('now').classList.contains('on'));
  if (!done) await page.waitForTimeout(500);
}
res.drillFinished = done;
res.everyoneHome = await page.evaluate(() =>
  window.__t.P.filter((p) => p.errand || p.home).map((p) => p.name)
);
res.namesBack = await page.evaluate(() => window.__t.Office.names);
await page.click('.hol[data-h="ny"]');
await page.waitForTimeout(600);
await stage(page, 'ny-day2');
await page.close();
page = await open('office-events.html', { width: 390, height: 780 });
res.eventsPhoneSideways = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth
);
await page.click('.ev[data-e="mail"]');
await page.waitForTimeout(6000);
await page.screenshot({ path: path.join(out, 'events-phone.png') });
await browser.close();
console.log(JSON.stringify(res, null, 1));
