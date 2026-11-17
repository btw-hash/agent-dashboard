// Sims mode on the product client (src/office/sims.js), driven with real clicks on the canvas.
// Usage: node product-sims.mjs <repo> <outDir> <chrome.exe> [url]
// Runs against the built page on :3737 by default (the modules are wired in main.js). The dev server reloads the page when another file under
// src/office changes: a reload mid-run restarts the whole scenario (up to 4 times).
import path from 'node:path';
import { createRequire } from 'node:module';

const [repo, out, exe, url = 'http://localhost:3737/?debug&sim'] = process.argv.slice(2);
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: exe });

async function scenario(viewport, touch) {
  const res = { viewport: viewport.width + 'x' + viewport.height, asserts: [], errors: [] };
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  let reloaded = false,
    ready = false;
  page.on('pageerror', (e) =>
    res.errors.push(
      'pageerror: ' +
        e.message +
        ' @ ' +
        String(e.stack).split(String.fromCharCode(10)).slice(1, 3).join(' | ')
    )
  );
  page.on('console', (m) => m.type() === 'error' && res.errors.push('console: ' + m.text()));
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame() && ready) reloaded = true;
  });
  const ok = (name, cond, info) => {
    res.asserts.push({ name, pass: !!cond, info });
    console.log(
      (cond ? 'PASS ' : 'FAIL ') +
        '[' +
        res.viewport +
        '] ' +
        name +
        (info !== undefined ? ' ' + JSON.stringify(info) : '')
    );
  };
  const shot = (name) =>
    page.screenshot({ path: path.join(out, res.viewport + '-' + name + '.png') });
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.__office && window.__office.office.P.length > 4, null, {
      timeout: 30000,
    });
    await page.evaluate(async () => {
      window.__sims = window.__office.sims;
    });
    ready = true;
    await page.waitForTimeout(2500);

    const world = (fn, arg) => page.evaluate(fn, arg);
    // screen point of a scene point, taken from the live camera
    const scr = (x, y) =>
      page.evaluate(
        ([x, y]) => {
          const r = document.getElementById('cv').getBoundingClientRect(),
            s = __office.office.cam.toScreen(x, y);
          return [r.left + s[0], r.top + s[1], innerWidth, innerHeight];
        },
        [x, y]
      );
    const press = async (x, y) => {
      const [sx, sy] = await scr(x, y);
      if (touch) await page.touchscreen.tap(sx, sy);
      else {
        await page.mouse.move(sx, sy);
        await page.mouse.click(sx, sy);
      }
      return [sx, sy];
    };
    const who = (name) =>
      page.evaluate((n) => {
        const o = __office.office,
          p = o.P.find((q) => q.name === n);
        if (!p) return null;
        return {
          name: p.name,
          x: +p.x.toFixed(1),
          y: +p.y.toFixed(1),
          head: o.headTop(p),
          now: p.now,
          st: p.st,
          errand: !!p.errand,
          home: !!p.home,
          left: p.errand ? p.errand.route.length : -1,
          end: p.errand && p.errand.route.length ? p.errand.route[p.errand.route.length - 1] : null,
          spot: Object.keys(o.SPOT).find((k) => o.SPOT[k] === p.spot) || null,
          state: p.state,
        };
      }, name);
    const pressPerson = async (name) => {
      const w = await who(name);
      return press(w.x, (w.head + w.y) / 2);
    };
    const spotXY = (k) => page.evaluate((k) => __office.office.SPOT[k].slice(1, 3), k);
    const freeNames = () =>
      page.evaluate(() =>
        __office.office.P.filter(
          (p) =>
            p.roam &&
            !p.seat &&
            !p.joinSeat &&
            !p.leaving &&
            !p.errand &&
            p.st === 'i' &&
            p.now !== 'sleep'
        ).map((p) => p.name)
      );
    const freeSpots = () =>
      page.evaluate(() =>
        Object.keys(__office.office.SPOT).filter(
          (k) => !__office.office.SPOT[k].busy && !['talkA', 'talkB', 'nap'].includes(k)
        )
      );
    const hint = () => page.textContent('.simsnow');
    const pressed = () =>
      page.$$eval('.simschip[aria-pressed="true"]', (n) => n.map((b) => b.textContent));
    const invariant = () =>
      page.evaluate(() => {
        const o = __office.office;
        return {
          dangling: o.P.filter((p) => p.errand || p.home).map((p) => p.name),
          orphanBusy: Object.keys(o.SPOT).filter(
            (k) => o.SPOT[k].busy && !o.P.some((p) => p.spot === o.SPOT[k])
          ),
          mutedPips: o.P.filter((p) => p.nopip).map((p) => p.name),
        };
      });
    const waitFor = async (fn, arg, ms) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        if (await page.evaluate(fn, arg)) return (Date.now() - t0) / 1000;
        await page.waitForTimeout(150);
      }
      return null;
    };

    // 1. toggle on
    await page.click('#simsBtn');
    await page.waitForTimeout(400);
    ok(
      'button pressed after click',
      (await page.getAttribute('#simsBtn', 'aria-pressed')) === 'true'
    );
    ok('hint strip visible', await page.isVisible('.simsbar'));
    const chips = await page.$$eval('.simschip', (n) => n.map((b) => b.textContent));
    const free = await freeNames();
    ok('one chip per free person', chips.length === free.length && chips.length >= 2, {
      chips,
      free,
    });
    ok(
      'free people have no status pip while on',
      (await invariant()).mutedPips.length === chips.length,
      (await invariant()).mutedPips
    );
    await shot('1-plumbobs');

    // 2. pick a free person on the canvas, order a place
    const inView = await page.evaluate(() => {
      const o = __office.office,
        v = o.cam.view();
      return o.P.filter(
        (p) =>
          p.roam &&
          !p.seat &&
          !p.errand &&
          p.st === 'i' &&
          p.now !== 'sleep' &&
          p.x > v[0] + 10 &&
          p.x < v[0] + v[2] - 10 &&
          p.y > v[1] + 30 &&
          p.y < v[1] + v[3] - 90
      ).map((p) => p.name);
    });
    const A = touch && inView.length ? inView[0] : free[0];
    if (touch) res.phoneVisibleFree = inView;
    await pressPerson(A);
    await page.waitForTimeout(250);
    ok(
      'person selected (chip pressed, hint names them)',
      (await pressed()).includes(A) && (await hint()).includes(A),
      { pressed: await pressed(), hint: await hint() }
    );
    ok('card did not open (click consumed)', await page.$eval('#card', (n) => n.hidden));
    const sp = await freeSpots();
    const pick = (list) => list.find((k) => sp.includes(k));
    const wa = await who(A);
    const near = await page.evaluate(
      ([x, y]) =>
        Object.keys(__office.office.SPOT)
          .filter(
            (k) =>
              !__office.office.SPOT[k].busy &&
              !['talkA', 'talkB', 'nap'].includes(k) &&
              __office.office.SPOT[k][2] < 300
          )
          .map((k) => [
            k,
            Math.hypot(__office.office.SPOT[k][1] - x, __office.office.SPOT[k][2] - y),
          ])
          .sort((a, b) => a[1] - b[1])
          .map((a) => a[0]),
      [wa.x, wa.y]
    );
    const k1 = touch
        ? near.find((k) => k !== near[0]) || near[0]
        : pick(['vend', 'tank', 'scope', 'board']),
      k2 = pick(['esp', 'printer', 'plant', 'server']);
    const [x1, y1] = await spotXY(k1);
    const [x2, y2] = await spotXY(k2);
    if (touch) {
      // the camera followed the selection; give the glide time to land
      await page.waitForTimeout(1500);
    }
    await press(x1, y1 - 10);
    await page.waitForTimeout(500);
    let w = await who(A);
    ok(
      'ordered: person walking on an errand to the place',
      w.errand && w.home && w.end && Math.abs(w.end[0] - x1) < 1 && Math.abs(w.end[1] - y1) < 1,
      w
    );
    ok('destination reserved (busy)', await page.evaluate((k) => __office.office.SPOT[k].busy, k1));
    await shot('2-selected-path');
    // 3. queue a second place while walking
    if (!touch) {
      await press(x2, y2 - 10);
      await page.waitForTimeout(200);
      ok('second order did not restart the walk', (await who(A)).errand);
      await shot('3-queued');
    }
    const t1 = await waitFor(
      ([n, k]) => {
        const p = __office.office.P.find((q) => q.name === n);
        return p && !p.errand && p.spot === __office.office.SPOT[k] && p.state === 'stay';
      },
      [A, k1],
      60000
    );
    w = await who(A);
    if (t1 === null && w.st === 'w') {
      console.log(
        'RETRY: the simulated agent ' +
          A +
          ' started working mid-walk (order released, as designed)'
      );
      throw new Error('retry-working');
    }
    ok(
      'arrived at first place',
      t1 !== null &&
        Math.abs(w.x - x1) < 1.5 &&
        Math.abs(w.y - y1) < 1.5 &&
        !w.errand &&
        !w.home &&
        w.spot === k1,
      { afterS: t1, w }
    );
    await shot('4-arrival');
    if (!touch) {
      const t2 = await waitFor(
        ([n, k]) => {
          const p = __office.office.P.find((q) => q.name === n);
          return p && !p.errand && p.spot === __office.office.SPOT[k] && p.state === 'stay';
        },
        [A, k2],
        90000
      );
      w = await who(A);
      ok(
        'queued order ran: arrived at second place',
        t2 !== null && Math.abs(w.x - x2) < 1.5 && Math.abs(w.y - y2) < 1.5 && w.spot === k2,
        { afterS: t2, w }
      );
      const inv = await invariant();
      ok(
        'after arrival: no errand/home left, first place freed',
        inv.dangling.length === 0 &&
          !(await page.evaluate((k) => __office.office.SPOT[k].busy, k1)),
        inv
      );
    }

    if (!touch) {
      // 4. a seated person refuses
      const seated = await page.evaluate(() =>
        __office.office.P.filter((p) => p.seat && p.st === 'w').map((p) => p.name)
      );
      const S = seated[0];
      await pressPerson(S);
      await page.waitForTimeout(120);
      const white = await page.evaluate((n) => {
        const o = __office.office,
          p = o.P.find((q) => q.name === n);
        const x = Math.round(p.x) - 10,
          y = Math.round(o.headTop(p)) - 22;
        const d = o.g.getImageData(Math.max(0, x), Math.max(0, y), 22, 10).data;
        let c = 0;
        for (let i = 0; i < d.length; i += 4)
          if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) c++;
        return c;
      }, S);
      ok('seated person answers BUSY (white bubble drawn)', white > 40, { S, whitePixels: white });
      ok('seated person did not open the card', await page.$eval('#card', (n) => n.hidden));
      await shot('5-busy');
      const none = await invariant();
      ok('seated person not selected', !(await pressed()).includes(S));

      // 5. two selected people take two different places
      await page.waitForTimeout(1500);
      const fr = (await freeNames()).filter((n) => n !== A);
      const [C, D] = fr;
      // clear the selection first
      await page.click('.simsbar [data-a="none"]');
      await pressPerson(C);
      await pressPerson(D);
      await page.waitForTimeout(200);
      ok('two people selected', (await pressed()).length === 2, await pressed());
      const sp2 = await freeSpots();
      const kk = ['tread', 'bag', 'lift', 'foos', 'arcA', 'arcB', 'juke', 'slot'].filter((k) =>
        sp2.includes(k)
      );
      const [x3, y3] = await spotXY(kk[0]);
      await press(x3, y3 - 10);
      await page.waitForTimeout(500);
      const wc = await who(C),
        wd = await who(D);
      ok(
        'both walking, to two different places',
        wc.errand &&
          wd.errand &&
          wc.end &&
          wd.end &&
          (wc.end[0] !== wd.end[0] || wc.end[1] !== wd.end[1]),
        { C: wc.end, D: wd.end }
      );
      await shot('6-two-people');
      // 6. release: C's agent starts working mid-walk
      await page.evaluate((n) => {
        __office.office.P.find((q) => q.name === n).agent.status = 'working';
      }, C);
      await page.waitForTimeout(400);
      const wc2 = await who(C);
      ok('agent started working: order released at once', !wc2.errand && !wc2.home, wc2);
      ok(
        '...and the reserved place was freed',
        (
          await page.evaluate(
            ([a, b]) =>
              Object.keys(__office.office.SPOT).filter(
                (k) =>
                  __office.office.SPOT[k].busy &&
                  !__office.office.P.some((p) => p.spot === __office.office.SPOT[k])
              ),
            [0, 0]
          )
        ).length === 1,
        'only the place still reserved by the other walker'
      );
      await page.waitForTimeout(6000);
      const wc3 = await who(C);
      ok(
        'that person then goes to a desk (seat set or on the way)',
        await page.evaluate((n) => {
          const p = __office.office.P.find((q) => q.name === n);
          return !!(p.seat || p.joinSeat);
        }, C),
        wc3
      );
      // 7. toggle off with D still walking
      const wd2 = await who(D);
      await page.click('#simsBtn');
      await page.waitForTimeout(100);
      const off = await invariant();
      ok(
        'sims off: nobody has errand/home, no busy place without an owner, no muted pips',
        off.dangling.length === 0 && off.orphanBusy.length === 0 && off.mutedPips.length === 0,
        { off, DwasWalking: wd2.errand }
      );
      ok(
        'sims off: bar hidden, button not pressed',
        !(await page.isVisible('.simsbar')) &&
          (await page.getAttribute('#simsBtn', 'aria-pressed')) === 'false'
      );
      await page.waitForTimeout(8000);
      const later = await invariant();
      ok(
        '8 s later still clean',
        later.dangling.length === 0 && later.orphanBusy.length === 0,
        later
      );
      // with sims off a click on a person opens the card again
      const w0 = await who(D);
      await pressPerson(D);
      await page.waitForTimeout(300);
      ok(
        'sims off: click opens the agent card again',
        !(await page.$eval('#card', (n) => n.hidden))
      );
      // 8. TV mode switches it off
      await page.click('#simsBtn');
      ok('sims on again', await page.isVisible('.simsbar'));
      await page.click('#tvBtn');
      await page.waitForTimeout(400);
      ok(
        'TV mode switched sims off',
        (await page.getAttribute('#simsBtn', 'aria-pressed')) === 'false' &&
          !(await page.isVisible('.simsbar'))
      );
      await page.click('#tvX');
    } else {
      // phone: the strip must fit and not overflow the page
      const box = await page.$eval('.simsbar', (n) => {
        const r = n.getBoundingClientRect();
        return [Math.round(r.left), Math.round(r.right), Math.round(r.top), Math.round(r.bottom)];
      });
      ok('strip inside the 390 px viewport', box[0] >= 0 && box[1] <= 390, box);
      ok(
        'no sideways scroll',
        !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      );
      await shot('7-phone-end');
    }
    const fin = await invariant();
    ok('final state clean (after the scenario)', fin.dangling.length === 0 || touch, fin);
    ok('no console/page errors', res.errors.length === 0, res.errors);
    if (reloaded) throw new Error('reload');
  } catch (e) {
    await page.waitForTimeout(800);
    if (
      reloaded ||
      /context was destroyed|navigation|Target closed|retry-working/.test(String(e))
    ) {
      await ctx.close();
      return 'reload';
    }
    ok('scenario did not throw', false, String(e.stack || e).slice(0, 600));
    await shot('crash').catch(() => {});
  }
  await ctx.close();
  return res;
}

const all = [];
for (const [vp, touch] of [
  [{ width: 1280, height: 800 }, false],
  [{ width: 390, height: 780 }, true],
]) {
  let r = 'reload';
  for (let i = 0; i < 4 && r === 'reload'; i++) {
    if (i) console.log('page reloaded by the dev server, restarting scenario');
    r = await scenario(vp, touch);
  }
  all.push(r);
}
await browser.close();
const failed = all.flatMap((r) =>
  r === 'reload' ? [{ name: 'kept reloading' }] : r.asserts.filter((a) => !a.pass)
);
console.log(
  '\nTOTAL asserts:',
  all.reduce((n, r) => n + (r.asserts ? r.asserts.length : 0), 0),
  'failed:',
  failed.length
);
process.exit(failed.length ? 1 : 0);
