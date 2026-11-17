import { spr, inked, slab, INK } from '../../engine/pixel.js';
import { frameOf } from '../../art/people.js';
import { SCENE_W as W, SCENE_H as H, label, box, makeLook, person, createFx } from './_px.js';

// Plant care on the hall windowsill: five pots, each drying out at its own speed.
// Walk the can to a plant and water it while its leaves are still green. A plant that is
// already wet gets a puddle and costs points. 45 seconds.
// Score: plant-seconds spent green, summed over the five plants, minus 15 per puddle.
const TIME = 45,
  SILL = 68,
  XS = [15, 38, 61, 84, 107],
  RATE = [0.03, 0.021, 0.038, 0.026, 0.034],
  GREEN = 0.5,
  WET = 0.7;
const PAL = [
  ['#3f9b5b', '#57b86c', '#2f7a47', '#7fd38f'],
  ['#a9a63a', '#c9c24a', '#8a7f2a', '#e2dc72'],
  ['#8a5a34', '#a8713f', '#5e3d24', '#c28a52'],
];
const POT = (c) => (R) => {
  slab(R, 5, 19, 8, 9, '#d98b5f');
  R(4, 18, 10, 2, '#e9a57a');
  R(6, 19, 6, 1, c);
};
const PLANT = [0, 1, 2].map((s) =>
  inked(
    spr(18, 28, (R) => {
      POT('#3b2a1e')(R);
      const [a, b, d, h] = PAL[s];
      if (s === 0) {
        R(8, 4, 2, 15, d);
        R(3, 7, 5, 8, a);
        R(2, 9, 3, 4, a);
        R(10, 5, 5, 9, a);
        R(13, 8, 3, 5, b);
        R(6, 0, 5, 7, b);
        R(7, 1, 2, 3, h);
        R(4, 8, 2, 3, b);
        R(11, 6, 2, 3, h);
        R(5, 13, 3, 3, d);
        R(10, 13, 4, 3, d);
      } else if (s === 1) {
        R(8, 6, 2, 13, d);
        R(6, 3, 5, 6, b);
        R(7, 4, 2, 2, h);
        R(2, 9, 6, 5, a);
        R(1, 11, 3, 6, a);
        R(10, 8, 6, 5, a);
        R(14, 10, 3, 6, b);
        R(4, 13, 3, 3, d);
        R(11, 13, 3, 3, d);
      } else {
        R(8, 10, 2, 9, d);
        R(9, 8, 2, 3, d);
        R(5, 7, 6, 3, b);
        R(4, 9, 2, 7, b);
        R(2, 12, 5, 3, a);
        R(1, 13, 2, 5, a);
        R(11, 11, 5, 3, a);
        R(15, 12, 2, 6, a);
        R(6, 15, 2, 2, d);
      }
    })
  )
);
const CAN = [
  inked(
    spr(18, 12, (R) => {
      slab(R, 4, 3, 9, 8, '#7aa2f7');
      R(0, 3, 4, 2, '#5a82d8');
      R(0, 2, 2, 4, '#aab0c8');
      R(13, 3, 4, 1, '#5a82d8');
      R(16, 3, 1, 6, '#5a82d8');
      R(13, 8, 4, 1, '#5a82d8');
      R(5, 4, 7, 1, '#bcd0ff');
    })
  ),
  inked(
    spr(18, 14, (R) => {
      slab(R, 4, 3, 9, 8, '#7aa2f7');
      R(0, 7, 4, 2, '#5a82d8');
      R(0, 7, 2, 4, '#aab0c8');
      R(13, 3, 4, 1, '#5a82d8');
      R(16, 3, 1, 6, '#5a82d8');
      R(13, 8, 4, 1, '#5a82d8');
      R(5, 4, 7, 1, '#bcd0ff');
    })
  ),
];

export default {
  size: [W, H],
  how: 'TAP A PLANT',
  pad: true,
  a: 'WATER',
  start(api) {
    const fx = createFx(),
      pops = [];
    const plants = XS.map((x, i) => ({
      x,
      m: [0.9, 0.75, 0.6, 0.85, 0.7][i],
      rate: RATE[i],
      puddle: 0,
    }));
    const guest = { L: makeLook(31337), x: -20, dir: 2, dist: 0, wave: 0, go: 9 };
    let sel = 2,
      canx = XS[2],
      pending = false,
      pour = 0,
      left = TIME,
      green = 0,
      wet = 0,
      score = 0,
      fin = 0,
      T = 0;

    const stage = (p) => (p.m > GREEN ? 0 : p.m > 0.25 ? 1 : 2);
    function water() {
      const p = plants[sel];
      pending = false;
      pour = 0.55;
      if (p.m > WET) {
        wet++;
        p.puddle = 6;
        fx.shake(2);
        pop(Math.max(24, Math.min(W - 24, p.x)), SILL - 48, 'TOO WET -15', '#f7768e');
      } else {
        fx.burst(p.x, SILL - 20, ['#9ece6a', '#d6ffb8', '#7fd38f'], 8, 40);
        if (p.m < GREEN) pop(p.x, SILL - 48, 'SAVED!', '#9ece6a');
      }
      p.m = Math.min(1, p.m + 0.65);
    }
    const pop = (x, y, str, col) => pops.push({ x, y, str, col, t: 0 });
    const want = (i) => {
      sel = i;
      pending = true;
    };

    return {
      state: () => ({
        plants: plants.map((p) => ({ x: p.x, m: p.m })),
        sel,
        canx,
        pour,
        left,
        score,
        wet,
      }),
      key(k) {
        if (fin) return;
        if (k === 'left') sel = Math.max(0, sel - 1);
        else if (k === 'right') sel = Math.min(4, sel + 1);
        else if (k === 'a') pending = true;
      },
      tap(x, y) {
        if (fin || y < 10 || y > 98) return;
        let b = 0;
        XS.forEach((px, i) => {
          if (Math.abs(px - x) < Math.abs(XS[b] - x)) b = i;
        });
        want(b);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        for (let i = pops.length - 1; i >= 0; i--) {
          pops[i].t += dt;
          pops[i].y -= 8 * dt;
          if (pops[i].t > 1.2) pops.splice(i, 1);
        }
        if (fin) {
          fin -= dt;
          if (fin <= 0) api.over(score);
          return;
        }
        left -= dt;
        for (const p of plants) {
          p.m = Math.max(0, p.m - p.rate * dt);
          p.puddle = Math.max(0, p.puddle - dt);
          if (p.m > GREEN) green += dt;
        }
        const sc = Math.max(0, Math.round(green) - 15 * wet);
        if (sc !== score) {
          score = sc;
          api.score(score);
        }
        pour = Math.max(0, pour - dt);
        const d = XS[sel] - canx;
        if (!pour && d) canx += Math.sign(d) * Math.min(Math.abs(d), 230 * dt);
        if (pending && !pour && !(XS[sel] - canx)) water();
        guest.go -= dt;
        if (guest.go <= 0 && guest.x < -19) {
          guest.dir = Math.random() < 0.5 ? 2 : 3;
          guest.x = guest.dir === 2 ? -16 : W + 16;
          guest.wave = 0;
          guest.mid = 30 + Math.random() * 60;
          guest.go = 15 + Math.random() * 6;
          guest.on = 1;
        }
        if (guest.on) {
          const sp = guest.dir === 2 ? 1 : -1,
            near = Math.abs(guest.x - guest.mid) < 2;
          if (near && guest.wave < 1.4) guest.wave += dt;
          else {
            guest.x += sp * 28 * dt;
            guest.dist += 28 * dt;
          }
          if (guest.x < -20 || guest.x > W + 20) {
            guest.on = 0;
            guest.x = -40;
          }
        }
        if (left <= 0) {
          fin = 1.5;
          fx.burst(60, 30, ['#9ece6a', '#ffd23f', '#d6ffb8'], 18, 70);
        }
      },
      draw(c) {
        const [ox, oy] = fx.offset();
        c.setTransform(1, 0, 0, 1, ox, oy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        const tag = (str, x, y, col) => {
          const w = str.length * 4 - 1;
          R(x - ((w / 2) | 0) - 2, y - 2, w + 4, 9, 'rgba(18,19,42,.85)');
          label(c, str, x, y, col, 1, 'center');
        };
        R(-4, -4, W + 8, 90, '#343b6b');
        for (let x = 10; x < W; x += 20) R(x, 9, 1, 75, '#2f3560');
        // a long window behind the sill
        R(2, 9, 116, 62, INK);
        R(3, 10, 114, 60, '#e8e2d4');
        R(5, 12, 110, 57, '#9fd0e8');
        R(5, 12, 110, 10, '#b9e0f2');
        R(5, 54, 110, 15, '#c2e6f0');
        R(8, 15, 12, 2, '#fff');
        R(11, 14, 6, 1, '#fff');
        R(92, 24, 14, 2, '#fff');
        R(95, 23, 8, 1, '#fff');
        for (const x of [26, 49, 72, 95]) R(x, 10, 2, 58, '#e8e2d4');
        R(5, 12, 110, 1, '#d6f0fa');
        // sun patches on the sill
        R(3, SILL, 114, 4, '#c99d6c');
        R(3, SILL, 114, 1, '#e3c08a');
        R(1, SILL + 4, 118, 12, '#a8713f');
        R(1, SILL + 4, 118, 1, '#c28a52');
        R(1, SILL + 15, 118, 1, '#6e4526');
        for (const x of [40, 80]) R(x, SILL + 10, 1, 6, '#8a5a34');
        R(-4, 84, W + 8, 10, '#c99d6c');
        for (let x = 0; x < W; x += 30) R(x + 10, 86, 1, 4, '#c2935f');
        R(-4, 84, W + 8, 2, '#8a5a34');
        // plants and their gauges
        plants.forEach((p, i) => {
          if (p.puddle > 0) {
            R(p.x - 9, SILL + 1, 18, 2, '#5a82d8');
            R(p.x - 6, SILL + 1, 8, 1, '#bcd0ff');
            if (((T * 6) | 0) % 2) R(p.x + 8, SILL + 4, 1, 3, '#5a82d8');
          }
          const s = stage(p),
            wob = s === 0 && Math.sin(T * 1.6 + i * 2) > 0.8 ? 1 : 0;
          c.drawImage(PLANT[s], p.x - 10, SILL - 28 + (wob ? 0 : 0));
          const gx = p.x - 9,
            gy = SILL + 5;
          R(
            gx - (i === sel ? 1 : 0),
            gy - (i === sel ? 1 : 0),
            18 + (i === sel ? 2 : 0),
            7 + (i === sel ? 2 : 0),
            i === sel ? '#ffd23f' : INK
          );
          R(gx + 1, gy + 1, 16, 5, '#1c2036');
          const k = Math.round(16 * p.m);
          R(gx + 1, gy + 1, k, 5, p.m > GREEN ? '#5aa0ff' : p.m > 0.25 ? '#e0af68' : '#f7768e');
          R(gx + 1, gy + 1, k, 1, 'rgba(255,255,255,.4)');
          R(gx + 1 + Math.round(16 * WET), gy + 1, 1, 5, 'rgba(255,255,255,.35)');
          if (s === 2 && ((T * 2) | 0) % 2) tag('!', p.x, SILL - 35, '#f7768e');
        });
        // the can and its water
        const pouring = pour > 0,
          cs = CAN[pouring ? 1 : 0],
          cxp = Math.round(canx) - 2,
          cyp = SILL - 41 + (pouring ? 2 : Math.round(Math.sin(T * 4)));
        c.drawImage(cs, cxp, cyp);
        if (pouring) {
          for (let i = 0; i < 3; i++) {
            const q = (T * 3 + i / 3) % 1,
              y = cyp + 10 + Math.round(q * (SILL - 28 - cyp - 4));
            R(Math.round(canx) + (i % 2), y, 1, 3, '#7ab8ff');
          }
        }
        // our people walk past in front of the sill
        if (guest.on) {
          const waving = guest.wave > 0 && guest.wave < 1.4 && Math.abs(guest.x - guest.mid) < 2,
            pose = waving ? 'wave' : 'walk',
            f = waving ? frameOf('wave', T) : Math.floor(guest.dist / 2.6) % 6;
          R(guest.x - 6, 87, 12, 2, 'rgba(18,19,42,.3)');
          person(c, guest.L, pose, waving ? 0 : guest.dir, f, guest.x, 89, (T * 1000) % 4200 < 140);
        }
        // the bar with time and score
        R(0, 0, W, 8, INK);
        label(c, 'TIME ' + Math.max(0, Math.ceil(left)), 4, 1, left < 10 ? '#f7768e' : '#aab6e8');
        label(c, 'SCORE ' + score, W - 4, 1, '#ffd23f', 1, 'right');
        fx.draw(c);
        pops.forEach((b) => tag(b.str, Math.round(b.x), Math.round(b.y), b.col));
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (fin) {
          R(26, 26, 68, 20, INK);
          R(27, 27, 66, 18, '#2f9e44');
          label(c, 'WATERING DONE', 60, 32, '#f7f8fb', 1, 'center');
          label(c, score + ' POINTS', 60, 39, '#fff3a3', 1, 'center');
        }
      },
    };
  },
};
