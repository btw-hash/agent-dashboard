// Plays one game module by itself, outside the cabinet, and saves frames of it.
//   node game-play.mjs <repo> <outDir> <chrome.exe> <file> [bot] [seconds] [shots]
// <file> is the module name in src/office/games/play/ without ".js". [bot] is the body of a
// function (run, T, api, held, shot, mem) called before every tick, or the path of a file that
// holds it: run is what start() returned, T the seconds played, mem an object the bot keeps
// between ticks. shot('name') freezes the game and saves <file>-name.png of the frame on
// screen (once per name); mem.speed = n plays n ticks per frame. A game may expose
// run.state() for the bot to read. Without a bot the game gets random taps and keys. The run
// stops early when the game is over. Needs the Vite dev server on :5174; the page it opens is blank,
// so the dev server reloading the office for other edits does not disturb a run.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe, file, botArg = '', seconds = '20', shots = '4'] = process.argv.slice(2);
const botSrc = botArg && fs.existsSync(botArg) ? fs.readFileSync(botArg, 'utf8') : botArg;
const { chromium } = createRequire(path.join(repo, 'package.json'))('playwright');
const browser = await chromium.launch({ executablePath: exe, args: ['--mute-audio'] });
const page = await (await browser.newContext({ viewport: { width: 800, height: 660 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
await page.route('http://localhost:5174/__blank', (r) =>
  r.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"><body style="margin:0;background:#080810">',
  })
);
await page.goto('http://localhost:5174/__blank');
await page.evaluate(() => document.fonts.load('8px "Press Start 2P"'));
await page.evaluate(
  async ({ file, botSrc }) => {
    const d = (await import('/office/games/play/' + file + '.js')).default;
    const cv = document.createElement('canvas');
    cv.id = 'g';
    [cv.width, cv.height] = d.size;
    cv.style.cssText = 'display:block;margin:10px;width:720px;image-rendering:pixelated';
    document.body.appendChild(cv);
    const c = cv.getContext('2d');
    const log = (window.__log = {
      scores: [],
      over: null,
      frames: 0,
      size: d.size,
      how: d.how,
      shots: [],
    });
    window.__want = null;
    const mem = {};
    const shot = (name) => {
      if (log.shots.includes(name)) return;
      log.shots.push(name);
      window.__want = name;
    };
    const held = new Set();
    const api = {
      w: d.size[0],
      h: d.size[1],
      font: '"Press Start 2P",monospace',
      held: (k) => held.has(k),
      score: (n) => log.scores.push(n),
      over: (n) => (log.over = n),
    };
    const run = (window.__run = d.start(api));
    const bot = botSrc
      ? new Function('run', 'T', 'api', 'held', 'shot', 'mem', botSrc)
      : (r, T) => {
          if (Math.random() > 0.08) return;
          const k = Math.random();
          if (k < 0.5 && r.tap) r.tap(Math.random() * d.size[0], Math.random() * d.size[1]);
          else if (r.key) r.key(['up', 'down', 'left', 'right', 'a'][(Math.random() * 5) | 0]);
          if (r.move) r.move(Math.random() * d.size[0], Math.random() * d.size[1], false);
        };
    let last = performance.now(),
      T = 0;
    const loop = (t) => {
      if (log.over !== null) return;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (window.__want) return requestAnimationFrame(loop);
      try {
        for (let i = 0; i < (mem.speed || 1) && log.over === null && !window.__want; i++) {
          T += dt;
          bot(run, T, api, held, shot, mem);
          if (window.__want) break;
          if (run.tick) run.tick(dt);
          log.frames++;
        }
        if (log.over === null && run.draw) run.draw(c);
      } catch (e) {
        log.error = String((e && e.stack) || e);
        return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  { file, botSrc }
);
const saved = [];
const save = async (name) => {
  const p = path.join(out, file + '-' + name + '.png');
  await page.locator('#g').screenshot({ path: p });
  saved.push(p);
};
const began = Date.now();
for (let i = 0; Date.now() - began < +seconds * 1000; ) {
  const s = await page.evaluate(() => ({
    want: window.__want,
    done: window.__log.over !== null || !!window.__log.error,
  }));
  if (s.want) {
    await save(s.want);
    await page.evaluate(() => (window.__want = null));
  } else if (s.done) break;
  if (i < +shots && Date.now() - began >= ((i + 1) * +seconds * 1000) / +shots) await save(i++);
  await page.waitForTimeout(25);
}
const log = await page.evaluate(() => ({
  ...window.__log,
  scores: window.__log.scores.slice(-3),
  state: window.__run.state ? window.__run.state() : null,
}));
console.log(JSON.stringify({ errors, log, saved }));
await browser.close();
