// Drives the product office (v3.html?debug&sim on the dev server) through all seven events.
// Usage: node product-events.mjs <repo> <outDir> <chrome.exe> [url]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe, url = 'http://localhost:3737/?debug&sim'] = process.argv.slice(2);
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: exe });
const res = { errors: [], events: {}, shots: [] };
const page = await browser.newPage({
  viewport: { width: 1280, height: 860 },
  deviceScaleFactor: 2,
});
page.on('pageerror', (e) => res.errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && res.errors.push('console: ' + m.text()));

// the dev server reloads the page when another file under src/office changes: install again if it did
async function ensure() {
  for (let i = 0; i < 6; i++) {
    try {
      await page.waitForFunction(() => window.__office, null, { timeout: 15000 });
      const ok = await page.evaluate(async () => {
        if (window.__ev) return true;
        window.__ev = window.__office.events;
        window.__office.office.setHour(10);
        return true;
      });
      if (ok) return;
    } catch (e) {
      res.errors.push('ensure retry: ' + String(e.message).split('\n')[0]);
      await page.waitForTimeout(1500);
    }
  }
  throw new Error('could not install');
}
const safe = async (fn, tries = 4) => {
  for (let i = 0; i < tries; i++) {
    try {
      await ensure();
      return await fn();
    } catch (e) {
      res.errors.push('retry: ' + String(e.message).split('\n')[0]);
      await page.waitForTimeout(1000);
    }
  }
  throw new Error('gave up');
};
const ev = (fn, arg) => page.evaluate(fn, arg);

await page.goto(url, { waitUntil: 'load' });
await ensure();
await page.waitForTimeout(6000);

async function shot(name) {
  const f = path.join(out, name + '.png');
  await page.locator('#stage').screenshot({ path: f });
  res.shots.push(name);
}
// a close-up around a point of the floor, world coordinates
async function close(name, wx, wy, w = 170, h = 130) {
  const pt = await ev(
    ([x, y]) => {
      const o = window.__office.office,
        r = document.getElementById('stage').getBoundingClientRect(),
        s = o.cam.toScreen(x, y);
      return [r.left + s[0], r.top + s[1], o.cam.s];
    },
    [wx, wy]
  );
  const k = Math.max(1, pt[2] / 2.2);
  const cw = w * k,
    ch = h * k;
  await page.screenshot({
    path: path.join(out, name + '.png'),
    clip: {
      x: Math.max(0, pt[0] - cw / 2),
      y: Math.max(0, pt[1] - ch * 0.7),
      width: cw,
      height: ch,
    },
  });
  res.shots.push(name);
}
const snapshot = () =>
  ev(() => {
    const o = window.__office.office;
    window.__snap = new Map(
      o.P.map((p) => [
        p.id,
        {
          name: p.name,
          seated: !!p.seat && !p.errand,
          x: p.x,
          y: p.y,
          seatIdx: p.desk ? o.SEATS.indexOf(p.desk) : -1,
        },
      ])
    );
    return o.P.length;
  });
const audit = () =>
  ev(() => {
    const o = window.__office.office,
      bad = [];
    for (const p of o.P) {
      if (p.leaving || p.joinSeat) continue;
      const flags = ['force', 'hold', 'carry', 'gone', 'home', 'errand', 'eat'].filter((k) => p[k]);
      const s = window.__snap.get(p.id);
      if (p.errand || p.home || p.gone) {
        const young = !s;
        if (!young) bad.push(p.name + ' flags ' + flags.join(','));
        continue;
      }
      if (flags.length) bad.push(p.name + ' flags ' + flags.join(','));
      if (s && s.seated && s.seatIdx >= 0 && p.desk === o.SEATS[s.seatIdx]) {
        const d = p.desk;
        if (Math.abs(p.x - d.x) > 0.5 || Math.abs(p.y - d.y) > 0.5)
          bad.push(p.name + ' not at seat: ' + [p.x, p.y] + ' vs ' + [d.x, d.y]);
      }
    }
    return {
      bad,
      guests: o.crowd.guests.length,
      lift: o.lift,
      names: o.names,
      people: o.P.length,
      seatedBefore: [...window.__snap.values()].filter((s) => s.seated).length,
    };
  });
const busy = () => ev(() => (window.__ev ? window.__ev.busy() : 'RELOAD'));
async function waitEnd(max) {
  const t0 = Date.now();
  while (Date.now() - t0 < max * 1000) {
    const b = await busy();
    if (b === 'RELOAD') throw new Error('page reloaded');
    if (!b) return true;
    await page.waitForTimeout(250);
  }
  return false;
}
async function runOne(name, during) {
  for (let k = 0; k < 4; k++) {
    try {
      return await runOnce(name, during);
    } catch (e) {
      res.errors.push('rerun ' + name + ': ' + String(e.message).slice(0, 80));
      await page.waitForTimeout(2000);
    }
  }
}
async function runOnce(name, during) {
  const origin = await ev(() => performance.timeOrigin);
  const t0 = Date.now();
  await safe(async () => {
    await page.waitForFunction(() => !window.__ev.busy(), null, { timeout: 5000 });
    res.events[name] = { people: await snapshot() };
    const started = await ev((n) => window.__ev.run(n) !== false, name);
    res.events[name].started = started;
  });
  if (during) await during();
  const ended = await waitEnd(200);
  if ((await ev(() => performance.timeOrigin)) !== origin) throw new Error('page reloaded');
  if ((await busy()) === 'RELOAD') throw new Error('page reloaded');
  const a = await audit();
  Object.assign(res.events[name], {
    ended,
    seconds: Math.round((Date.now() - t0) / 100) / 10,
    audit: a,
  });
}
const guestNow = () =>
  ev(() => {
    const v = window.__office.office.crowd.guests[0];
    return v ? { x: v.x, y: v.y, dir: v.dir, prop: v.prop, carry: !!v.carry, pose: v.pose } : null;
  });
async function catchDir(name, dirs, max = 40) {
  dirs = [].concat(dirs);
  for (let i = 0; i < max * 8; i++) {
    const v = await guestNow().catch(() => null);
    if (v && v.prop && v.carry && dirs.includes(v.dir) && (v.pose === 'walk' || dirs.includes(0))) {
      await close(name, v.x, v.y, 90, 80);
      return true;
    }
    await page.waitForTimeout(125);
  }
  return false;
}

// pizza: carry side and front, then a box on a table with an eater, then the slices going
await runOne('pizza', async () => {
  res.events.pizza.carrySide = await catchDir('pizza-carry-side', [2, 3]);
  res.events.pizza.carryFront = await catchDir('pizza-carry-front', 0);
  let e = null;
  for (let i = 0; i < 400 && !e; i++) {
    e = await ev(() => {
      const p = window.__office.office.P.find((q) => q.eat && q.errand && !q.errand.route.length);
      return p ? { x: p.x, y: p.y, dir: p.dir } : null;
    });
    if (!e) await page.waitForTimeout(250);
  }
  res.events.pizza.eater = e;
  if (e) {
    await close('pizza-eater-1', e.x + (e.dir === 3 ? -14 : 14), e.y, 110, 90);
    await page.waitForTimeout(3600);
    await close('pizza-eater-2', e.x + (e.dir === 3 ? -14 : 14), e.y, 110, 90);
    await shot('pizza-cafe-wide');
  }
});
await runOne('mail', async () => {
  res.events.mail.carrySide = await catchDir('mail-carry-side', [2, 3]);
  res.events.mail.carryFront = await catchDir('mail-carry-front', 0);
  await page.waitForTimeout(500);
});
await runOne('clean', async () => {
  res.events.clean.carryFront = await catchDir('mop-front', 0);
  res.events.clean.carrySide = await catchDir('mop-side', [2]);
  res.events.clean.carrySideL = await catchDir('mop-side-left', 3, 30);
});
await runOne('party', async () => {
  await page.waitForTimeout(9000);
  const c = await ev(() => {
    const o = window.__office.office,
      d = o.P.filter(
        (p) => p.errand && !p.errand.home && !p.errand.route.length && p.errand.bx != null
      );
    return d.map((p) => [p.x, p.y, p.errand.pose, p.dir]);
  });
  res.events.party.dancers = c.length;
  if (c.length) {
    await close('dance-1', c[0][0], c[0][1] + 10, 220, 170);
    await page.waitForTimeout(400);
    await close('dance-2', c[0][0], c[0][1] + 10, 220, 170);
    await page.waitForTimeout(400);
    await close('dance-3', c[0][0], c[0][1] + 10, 220, 170);
  }
  await shot('party-wide');
});
await runOne('drill', async () => {
  const seen = {};
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    const st = await ev(() => ({
      ph: window.__ev.phase(),
      gone: window.__office.office.P.filter((p) => p.gone).length,
      busy: window.__ev.busy(),
    }));
    if (!st.busy) break;
    const t = (Date.now() - t0) / 1000;
    const key =
      st.ph === 'leave' && st.gone === 0 ? 'leave0' : st.ph + (st.ph === 'empty' ? '' : '');
    if (st.ph && !seen[key]) {
      seen[key] = +t.toFixed(1);
      if (st.ph === 'gather') {
        await page.waitForTimeout(2500);
        await shot('drill-1-gather');
      } else if (st.ph === 'count') {
        await close('drill-2-count', 290, 78, 200, 150);
      } else if (st.ph === 'smash') {
        await page.waitForTimeout(1200);
        await close('drill-3-glass', 240, 80, 200, 150);
      } else if (st.ph === 'leave') {
        await page.waitForTimeout(500);
        await shot('drill-4-leaving');
      } else if (st.ph === 'empty') {
        await page.waitForTimeout(500);
        await shot('drill-5-empty');
      } else if (st.ph === 'return') {
        await page.waitForTimeout(2200);
        await shot('drill-6-returning');
      }
    }
    await page.waitForTimeout(100);
  }
  res.events.drill.phases = seen;
});
await shot('drill-7-after');
await close('drill-8-window-boarded', 240, 80, 200, 150);
await runOne('dark', async () => {
  await page.waitForTimeout(2500);
  await shot('dark-1');
  await page.waitForTimeout(3000);
  await shot('dark-2');
});

// blackout from the connection: down then up
await safe(async () => {
  await ev(() => window.__office.office.emit('net', 'down'));
  await page.waitForTimeout(3000);
  res.netDown = await ev(() => window.__ev.busy());
  await shot('dark-net');
  await ev(() => window.__office.office.emit('net', 'up'));
  res.netUpEnded = await waitEnd(15);
});

// holidays
await safe(async () => {
  await ev(() => window.__ev.holiday('ny'));
  await page.waitForTimeout(800);
  await shot('holiday-ny-day');
  await ev(() => window.__office.office.setHour(23));
  await page.waitForTimeout(800);
  await shot('holiday-ny-night');
  await ev(() => {
    window.__ev.holiday('hw');
    window.__office.office.setHour(10);
  });
  await page.waitForTimeout(800);
  await shot('holiday-hw-day');
  await ev(() => window.__office.office.setHour(23));
  await page.waitForTimeout(800);
  await shot('holiday-hw-night');
  await ev(() => {
    window.__ev.holiday('');
    window.__office.office.setHour(10);
  });
});
// the list in the top bar
await safe(async () => {
  await page.click('#eventsBtn');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'events-list.png') });
  res.shots.push('events-list');
  res.second = await ev(() => {
    window.__ev.run('clean');
    return window.__ev.run('pizza');
  });
  await ev(() => window.__ev.busy());
});
await waitEnd(120);
res.finalAudit = await audit();
await browser.close();
console.log(JSON.stringify(res, null, 1));
