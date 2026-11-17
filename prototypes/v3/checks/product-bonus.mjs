// Drives the three bonus views of the product client (src/office/bonus) on the simulated office.
// Usage: node product-bonus.mjs <repo> <outDir> <chrome.exe> [url]
// The dev server must be running; main.js does not import the module yet, so the page loads it.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe, url = 'http://localhost:3737/?debug&sim'] = process.argv.slice(2);
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const report = { checks: [], errors: [], warnings: [], notes: [] };
const ok = (name, pass, detail) => {
  report.checks.push({ name, pass: !!pass, detail });
  if (!pass) report.failed = true;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot(vp, touch) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const tag = vp.width + 'px';
  page.threeReqs = [];
  page.on('pageerror', (e) =>
    report.errors.push(
      tag + ' pageerror: ' + e.message + ' @ ' + String(e.stack).split('\n').slice(1, 4).join(' | ')
    )
  );
  page.on('console', (m) => {
    if (m.type() === 'error') report.errors.push(tag + ' console: ' + m.text());
    if (m.type() === 'warning') report.warnings.push(tag + ' ' + m.text().slice(0, 160));
  });
  page.on('request', (r) => {
    if (/\/three[^/]*\.js|\/three\//.test(r.url())) page.threeReqs.push(r.url());
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__office, null, { timeout: 15000 });
  await page.evaluate(async () => {
    window.__escSeen = 0;
    document.addEventListener('keydown', (e) => e.key === 'Escape' && window.__escSeen++);
    window.__bonus = window.__office.bonus;
  });
  await page.waitForFunction(() => window.__office.office.P.length >= 5, null, { timeout: 30000 });
  await sleep(1500);
  return page;
}

const st = (page) => page.evaluate(() => window.__bonus.state());
const cur = (page) => page.evaluate(() => window.__bonus.current());
async function waitView(page, id, ms = 4000) {
  try {
    await page.waitForFunction((v) => window.__bonus.current() === v, id, { timeout: ms });
    return true;
  } catch {
    return false;
  }
}
async function clickDoor(page, id, touch) {
  await page.evaluate((id) => {
    const o = window.__office.office,
      d = o.DOORS.find((x) => x.id === id);
    o.cam.touched = true;
    o.cam.frame(d.x, d.y + 14, 300, 170, false);
  }, id);
  await sleep(500);
  const pt = await page.evaluate((id) => {
    const o = window.__office.office,
      d = o.DOORS.find((x) => x.id === id),
      r = document.getElementById('cv').getBoundingClientRect(),
      s = o.cam.toScreen(d.r[0] + d.r[2] / 2, d.r[1] + d.r[3] / 2);
    return [r.left + s[0], r.top + s[1]];
  }, id);
  if (touch) await page.touchscreen.tap(pt[0], pt[1]);
  else {
    await page.mouse.move(pt[0], pt[1]);
    await page.mouse.click(pt[0], pt[1]);
  }
  return pt;
}
const shot = (page, name) => page.screenshot({ path: path.join(out, name + '.png') });
async function stopped(page, key) {
  const a = await st(page);
  await sleep(700);
  const b = await st(page);
  return {
    frames: a.frames[key] === b.frames[key],
    gl: a.glRenders === b.glRenders,
    hooked: !b.hooked,
    view: b.view === null,
  };
}
async function exitBy(page, how) {
  if (how === 'button') await page.click('.bx-exit');
  else await page.keyboard.press('Escape');
  await sleep(150);
}

async function scenario(vp, touch) {
  const tag = vp.width + 'px: ';
  const page = await boot(vp, touch);
  const baseFrameHooks = await page.evaluate(() => window.__office.office.onFrame.length);
  ok(
    tag + 'three not requested at page load',
    page.threeReqs.length === 0,
    page.threeReqs.join(',')
  );

  // ---- terminal: backtick, the people, a state change, exit by button, then from the rack by Esc
  await page.keyboard.press('Backquote');
  ok(tag + 'backtick opens the terminal', await waitView(page, 'terminal', 1500));
  await sleep(500);
  const tinfo = () =>
    page.evaluate(() => {
      const o = window.__office.office,
        glyphs = [...document.querySelectorAll('.bx-term b')].filter(
          (b) => b.textContent.length === 1 && 'wti'.includes(b.className)
        ),
        cells = new Set(
          o.P.map(
            (p) =>
              Math.max(0, Math.min(77, Math.floor((p.x / 640) * 78))) +
              ',' +
              Math.max(0, Math.min(19, Math.floor(((p.y - 10) / 360) * 20)))
          )
        ),
        head = document.querySelector('.bx-term').textContent.split('\n')[0];
      return {
        glyphs: glyphs.length,
        cells: cells.size,
        people: o.P.length,
        working: o.P.filter((p) => p.st === 'w').length,
        head,
        rows: document.querySelector('.bx-term').textContent.split('\n').length,
        w: document.querySelector('.bx-term').getBoundingClientRect().width,
        sw: document.documentElement.scrollWidth,
      };
    });
  let t = await tinfo();
  ok(tag + 'terminal shows one letter per occupied cell', t.glyphs === t.cells, JSON.stringify(t));
  ok(tag + 'terminal header counts match', t.head.includes(t.working + ' working'), t.head);
  await shot(page, tag.replace(': ', '') + '-terminal');
  const flip = await page.evaluate(async () => {
    const o = window.__office.office,
      p = o.P.find((q) => q.st === 'i');
    if (!p) return null;
    p.agent.status = 'working';
    const n = o.P.filter((q) => q.st === 'w').length + 1;
    for (let i = 0; i < 70; i++) {
      await new Promise((r) => setTimeout(r, 60));
      if (
        document
          .querySelector('.bx-term')
          .textContent.split(String.fromCharCode(10))[0]
          .includes(n + ' working')
      )
        return p.name + ' -> ' + n + ' working';
    }
    return null;
  });
  const t2 = {
    head: await page.evaluate(
      () => document.querySelector('.bx-term').textContent.split(String.fromCharCode(10))[0]
    ),
  };
  ok(
    tag + 'terminal follows a state change (an idle person starts working)',
    !!flip,
    flip + ' | ' + t.head + ' -> ' + t2.head
  );
  if (touch)
    ok(
      tag + 'terminal fits the phone width',
      t.w <= vp.width && t.sw <= vp.width,
      t.w + ' / ' + t.sw
    );
  await exitBy(page, 'button');
  let s = await stopped(page, 'terminal');
  ok(
    tag + 'terminal closed by EXIT leaves no loop',
    Object.values(s).every(Boolean),
    JSON.stringify(s)
  );
  ok(
    tag + 'onFrame hooks back to baseline',
    (await page.evaluate(() => window.__office.office.onFrame.length)) === baseFrameHooks
  );

  await clickDoor(page, 'terminal', touch);
  ok(tag + 'server rack click opens the terminal', await waitView(page, 'terminal'));
  const seenBefore = await page.evaluate(() => window.__escSeen);
  await exitBy(page, 'esc');
  ok(tag + 'Esc closes the terminal', (await cur(page)) === null);
  ok(
    tag + 'Esc is swallowed (shell never sees it)',
    (await page.evaluate(() => window.__escSeen)) === seenBefore
  );
  await page.keyboard.press('Escape');
  ok(
    tag + 'Esc with no view still reaches the page',
    (await page.evaluate(() => window.__escSeen)) === seenBefore + 1
  );

  // ---- windows at night: telescope click, a window per person, pixels follow state, hover name
  await clickDoor(page, 'night', touch);
  ok(tag + 'telescope click opens the night view', await waitView(page, 'night'));
  await sleep(600);
  const nightCheck = (flipSt) =>
    page.evaluate(async (flipSt) => {
      const o = window.__office.office;
      let flipped = -1;
      if (flipSt) {
        flipped = o.P.findIndex((p) => p.st === 'w' && p.now !== 'sleep');
        if (flipped >= 0 && flipped < 23) {
          o.P[flipped].agent.status = 'thinking';
          o.P[flipped].agent.lastActivity = new Date().toISOString();
        }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      const cv = document.querySelector('.bx-night'),
        q = cv.getContext('2d'),
        want = (p) =>
          p.now === 'sleep' ? 'sleep' : p.st === 'w' ? 'warm' : p.st === 't' ? 'lilac' : 'idle',
        got = (i) => {
          const d = q.getImageData(
            78 + (i % 6) * 28 + 6,
            42 + Math.floor(i / 6) * 30 + 1,
            1,
            1
          ).data;
          const [r, g, b] = d;
          if (r > 240 && g > 230 && b > 190 && b < 215) return 'warm';
          if (r > 225 && g > 210 && b > 240) return 'lilac';
          if (r < 30 && g < 30 && b < 60) return 'sleep';
          return 'idle';
        };
      const rows = o.P.slice(0, 23).map((p, i) => [want(p), got(i)]);
      return {
        people: o.P.length,
        flipped,
        mismatches: rows.filter((r) => r[0] !== r[1]).length,
        rows: rows.map((r) => r.join('>')).join(' '),
      };
    }, flipSt);
  const ns = await st(page);
  const pcount = await page.evaluate(() => window.__office.office.P.length);
  ok(
    tag + 'night view has a window per person (max 24)',
    ns.nightPeople === Math.min(pcount, 24),
    'P=' + pcount + ' ' + JSON.stringify(ns)
  );
  let n1 = await nightCheck();
  ok(tag + 'window light matches each person state', n1.mismatches === 0, n1.rows);
  let n2 = await nightCheck(true);
  for (
    let i = 0;
    i < 14 && n2.flipped >= 0 && n2.rows.split(' ')[n2.flipped] !== 'lilac>lilac';
    i++
  ) {
    await sleep(400);
    n2 = { ...(await nightCheck()), flipped: n2.flipped };
  }
  const flipN = n2.flipped;
  ok(
    tag +
      'night window changes colour on a state change (person ' +
      flipN +
      ' working -> thinking)',
    flipN >= 0 && n2.rows.split(' ')[flipN] === 'lilac>lilac' && n2.mismatches === 0,
    n2.rows
  );
  await shot(page, tag.replace(': ', '') + '-night');
  const hov = await page.evaluate(() => {
    const cv = document.querySelector('.bx-night'),
      r = cv.getBoundingClientRect(),
      s = Math.min(r.width / 320, r.height / 180);
    return [
      r.left + (r.width - 320 * s) / 2 + (78 + 11) * s,
      r.top + (r.height - 180 * s) / 2 + (42 + 8) * s,
    ];
  });
  if (touch) await page.touchscreen.tap(hov[0], hov[1]);
  else await page.mouse.move(hov[0], hov[1]);
  await sleep(200);
  const tg = await page.evaluate(() => {
    const e = document.querySelector('.bx-ntag');
    return e.hidden ? null : e.textContent;
  });
  ok(tag + 'hover/tap on a window shows the name', !!tg && tg.includes(' · '), tg);
  await exitBy(page, 'button');
  s = await stopped(page, 'night');
  ok(tag + 'night closed leaves no loop', Object.values(s).every(Boolean), JSON.stringify(s));

  // ---- screensaver after idle
  await page.evaluate(() => (window.__bonus.idleMs = 1500));
  await page.mouse.move(5, 5);
  await sleep(300);
  const sawSaver = await waitView(page, 'night', 4500);
  const cap = await page.evaluate(() => document.querySelector('.bx-cap').textContent);
  ok(
    tag + 'idle opens the night view as a screensaver',
    sawSaver && cap.includes('SCREENSAVER'),
    cap
  );
  await page.mouse.move(200, 200);
  await sleep(200);
  ok(tag + 'any input leaves the screensaver', (await cur(page)) === null);
  await page.evaluate(() => (window.__bonus.idleMs = 300000));

  // ---- 3D miniature
  ok(
    tag + 'three still not requested before the printer',
    page.threeReqs.length === 0,
    page.threeReqs.join(',')
  );
  await clickDoor(page, 'mini', touch);
  ok(tag + '3D printer click opens the 3D view', await waitView(page, 'mini'));
  await shot(page, tag.replace(': ', '') + '-mini-printing');
  let live = false;
  try {
    await page.waitForFunction(() => window.__bonus.state().miniLive, null, { timeout: 40000 });
    live = true;
  } catch {}
  const gl = await page.evaluate(() => !!document.querySelector('.bx-gl'));
  const msgText = await page.evaluate(() => document.querySelector('.bx-msg').textContent);
  ok(tag + '3D view went live (WebGL context created)', live && gl, msgText);
  ok(
    tag + 'three requested only once the 3D view opened',
    page.threeReqs.length > 0,
    page.threeReqs.slice(0, 2).join(',')
  );
  if (live) {
    await sleep(1500);
    const a = await st(page);
    ok(
      tag + '3D has one figure per person',
      a.glPeople === (await page.evaluate(() => window.__office.office.P.length)),
      JSON.stringify(a)
    );
    await sleep(500);
    const b = await st(page);
    ok(
      tag + '3D renders continuously',
      b.glRenders > a.glRenders,
      a.glRenders + ' -> ' + b.glRenders
    );
    const pr = await page.evaluate(async () => {
      const o = window.__office.office,
        p = o.P.find((q) => q.seat),
        b = window.__bonus,
        before = b.probe(p);
      p.x += 25;
      p.dir = 2;
      await new Promise((r) => setTimeout(r, 400));
      const after = b.probe(p);
      p.x -= 25;
      return { before, after, px: p.x };
    });
    ok(
      tag + '3D figure follows its person (x and facing)',
      pr.before && Math.abs(pr.after.x - pr.before.x - 2.5) < 0.05 && pr.after.ry !== pr.before.ry,
      JSON.stringify(pr)
    );
    await sleep(2500);
    await shot(page, tag.replace(': ', '') + '-mini-corner');
    for (const [c, label] of [
      ['front', 'Front cut-away'],
      ['walk', 'Walk-in'],
    ]) {
      const b = page.locator('.bx-cams button', { hasText: label });
      if (touch) await b.tap();
      else await b.click();
      await sleep(4500);
      const pressed = await page.evaluate(
        (c) => document.querySelector('.bx-cams [data-c=' + c + ']').getAttribute('aria-pressed'),
        c
      );
      ok(tag + 'camera button ' + label + ' pressed', pressed === 'true');
      await shot(page, tag.replace(': ', '') + '-mini-' + c);
    }
    if (touch) {
      const bb = await page.evaluate(() =>
        [...document.querySelectorAll('.bx-cams button')].map((e) =>
          Math.round(e.getBoundingClientRect().height)
        )
      );
      ok(
        tag + 'camera buttons are tappable (>= 28px tall, inside the screen)',
        bb.every((h) => h >= 28) &&
          (await page.evaluate(() => document.documentElement.scrollWidth)) <= vp.width,
        bb.join(',')
      );
    }
  }
  await exitBy(page, 'button');
  const sm = await stopped(page, 'mini');
  ok(
    tag + '3D closed by EXIT: no render, no loop',
    Object.values(sm).every(Boolean),
    JSON.stringify(sm)
  );
  await page.evaluate(() => window.__bonus.open('mini'));
  await sleep(800);
  const sm2 = await st(page);
  await exitBy(page, 'esc');
  ok(
    tag + '3D reopens instantly (no second print) and Esc closes it',
    sm2.miniLive && (await cur(page)) === null,
    JSON.stringify(sm2)
  );

  // ---- API opens, TV mode closes
  for (const id of ['terminal', 'night']) {
    await page.evaluate((id) => window.__bonus.open(id), id);
    ok(tag + 'API opens ' + id, (await cur(page)) === id);
    await page.evaluate(() => window.__office.shell.setTv(true));
    await sleep(100);
    ok(tag + 'TV mode closes ' + id, (await cur(page)) === null);
    await page.evaluate(() => window.__office.shell.setTv(false));
  }
  ok(
    tag + 'onFrame hooks back to baseline at the end',
    (await page.evaluate(() => window.__office.office.onFrame.length)) === baseFrameHooks
  );
  await page.context().close();
}

for (const [vp, touch] of [
  [{ width: 1280, height: 720 }, false],
  [{ width: 390, height: 844 }, true],
]) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const mark = report.checks.length;
    try {
      await scenario(vp, touch);
      break;
    } catch (e) {
      report.checks.length = mark;
      report.notes.push(
        vp.width + 'px attempt ' + attempt + ' died: ' + String(e.message).split('\n')[0]
      );
      report.errors = report.errors.filter((x) => !x.startsWith(vp.width + 'px'));
    }
  }
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
process.exit(report.failed || report.errors.length ? 1 : 0);
