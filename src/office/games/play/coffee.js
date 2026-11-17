import { spr, tone, INK } from '../../engine/pixel.js';
import { frameOf } from '../../art/people.js';
import { catSprite } from '../../art/pets.js';
import { F } from '../../art/furniture.js';
import { SCENE_W as SW, SCENE_H as SH, label, box, makeLook, person, createFx } from './_px.js';

// Barista. People queue at the cafe counter, each wants a drink; build it in the glass in
// the right order before their patience runs out. Three walk-outs end the shift.
// Everything keeps the office's proportions: the counter and the machine are the office's
// own sprites, a person is as tall as in the office. The close-up is the small screen:
// a person takes a third of its height and the order sits right on the head.
const FLOOR = 70;
const ING = [
  { id: 'C', name: 'COFFEE', col: '#6e4526', hi: '#a8713f' },
  { id: 'M', name: 'MILK', col: '#f2ede2', hi: '#ffffff' },
  { id: 'F', name: 'FOAM', col: '#ffd9a0', hi: '#fff0d2' },
  { id: 'X', name: 'CHOC', col: '#3b2a1e', hi: '#8a5a34' },
];
const BY = Object.fromEntries(ING.map((g) => [g.id, g]));
const MENU = [
  ['ESPRESSO', 'C'],
  ['DOPPIO', 'CC'],
  ['LATTE', 'CM'],
  ['FLAT WHITE', 'CCM'],
  ['CAPPUCCINO', 'CMF'],
  ['MOCHA', 'CXM'],
  ['HOT CHOC', 'XMF'],
];
const SLOT = [70, 90, 110];
const GLASS = [24, 40];

const ICON = {
  C: spr(8, 8, (R) => {
    R(1, 0, 6, 8, '#6e4526');
    R(0, 2, 8, 4, '#6e4526');
    R(3, 1, 1, 6, '#3b2a1e');
    R(1, 1, 2, 1, '#a8713f');
  }),
  M: spr(8, 8, (R) => {
    R(1, 2, 6, 6, '#f2ede2');
    R(2, 0, 4, 2, '#dfe3ee');
    R(1, 4, 6, 2, '#3b5bdb');
    R(6, 2, 1, 6, '#c9c0ae');
  }),
  F: spr(8, 8, (R) => {
    R(1, 3, 6, 4, '#fff0d2');
    R(0, 4, 8, 2, '#fff0d2');
    R(2, 1, 3, 3, '#fff0d2');
    R(4, 2, 3, 2, '#ffd9a0');
    R(1, 6, 6, 1, '#e0af68');
  }),
  X: spr(8, 8, (R) => {
    R(0, 1, 8, 6, '#3b2a1e');
    R(1, 2, 2, 2, '#8a5a34');
    R(5, 2, 2, 2, '#6e4526');
    R(1, 5, 2, 1, '#6e4526');
    R(5, 5, 2, 1, '#8a5a34');
    R(3, 1, 1, 6, '#23160e');
  }),
};
const CAT = [0, 1].map((f) => catSprite(f, true, true));
const HEART = (R, x, y, c) => {
  R(x, y, 2, 2, c);
  R(x + 3, y, 2, 2, c);
  R(x, y + 1, 5, 2, c);
  R(x + 1, y + 3, 3, 1, c);
  R(x + 2, y + 4, 1, 1, c);
};

export default {
  size: [SW, SH],
  how: 'BUILD THE ORDER',
  pad: true,
  a: 'ADD',
  start(api) {
    const fx = createFx();
    const queue = [],
      leaving = [];
    let cup = [],
      lives = 3,
      score = 0,
      served = 0,
      sel = 0,
      spawn = 0.6,
      T = 0,
      pressed = -1,
      pressT = 0,
      pour = 0,
      spill = 0,
      end = 0,
      seed = (Math.random() * 1e6) | 0;

    function order() {
      const pool = served < 3 ? 3 : served < 7 ? 5 : MENU.length;
      return MENU[(Math.random() * pool) | 0];
    }
    function add() {
      const max = Math.max(5.5, 11 - served * 0.35);
      seed = (seed * 1103515245 + 12345) >>> 0;
      queue.push({
        L: makeLook(seed >>> 3),
        x: SW + 16,
        order: order(),
        max,
        left: max,
        state: 'in',
        t: 0,
        dist: 0,
      });
    }
    const front = () => (queue[0] && queue[0].state === 'wait' ? queue[0] : null);

    function put(i) {
      const f = front();
      pressed = i;
      pressT = 0.14;
      if (!f || end) return;
      cup.push(ING[i].id);
      pour = 0.25;
      const want = f.order[1],
        have = cup.join('');
      if (!want.startsWith(have)) {
        cup = [];
        spill = 0.6;
        f.left -= 1.5;
        fx.shake(3);
        fx.burst(GLASS[0] + 5, GLASS[1] + 8, [BY[ING[i].id].col, '#f2ede2'], 8, 40);
        return;
      }
      if (have !== want) return;
      const gain = want.length * 10 + Math.round((f.left / f.max) * 10);
      score += gain;
      served++;
      api.score(score);
      f.state = 'happy';
      f.t = 0;
      f.L = Object.assign({}, f.L, { mug: true, id: f.L.id + 'm' });
      fx.burst(f.x, FLOOR - 40, ['#ffd23f', '#9ece6a', '#7aa2f7', '#f7768e'], 12, 45);
      fx.pop(f.x, FLOOR - 40, '+' + gain, '#ffd23f');
      cup = [];
    }

    return {
      // what the screen is asking for right now; the headless check plays by it
      state: () => ({ want: front() ? front().order[1] : null, cup: cup.join(''), lives, served }),
      key(k) {
        if (k === 'left') sel = (sel + 3) % 4;
        else if (k === 'right') sel = (sel + 1) % 4;
        else if (k === 'a') put(sel);
      },
      tap(x, y) {
        if (y < 72) return;
        sel = Math.max(0, Math.min(3, Math.floor(x / 30)));
        put(sel);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        pressT -= dt;
        pour -= dt;
        spill -= dt;
        if (end) {
          end -= dt;
          if (end <= 0) api.over(score);
          return;
        }
        spawn -= dt;
        if (spawn <= 0 && queue.length < 3) {
          add();
          spawn = Math.max(1.6, 4 - served * 0.12) + Math.random();
        }
        for (let i = leaving.length - 1; i >= 0; i--) {
          const q = leaving[i];
          q.x += 34 * dt;
          q.dist += 34 * dt;
          if (q.x > SW + 20) leaving.splice(i, 1);
        }
        for (let i = 0; i < queue.length; i++) {
          const q = queue[i],
            tx = SLOT[Math.min(2, i)];
          q.t += dt;
          if (q.state === 'happy' || q.state === 'angry') {
            // a moment to cheer or to sulk, then out of the line
            if (q.t > (q.state === 'happy' ? 0.9 : 1.1)) {
              q.state = 'out';
              leaving.push(queue.splice(i--, 1)[0]);
            }
            continue;
          }
          if (q.x > tx + 0.5) {
            const step = Math.min(q.x - tx, 30 * dt);
            q.x -= step;
            q.dist += step;
            q.state = 'in';
          } else q.state = 'wait';
          if (i === 0 && q.state === 'wait') {
            q.left -= dt;
            if (q.left <= 0) {
              q.state = 'angry';
              q.t = 0;
              cup = [];
              lives--;
              fx.shake(4);
              fx.pop(q.x, FLOOR - 40, 'TOO SLOW', '#f7768e');
              if (lives <= 0) end = 1.4;
            }
          }
        }
      },
      draw(c) {
        const [ox, oy] = fx.offset();
        c.setTransform(1, 0, 0, 1, ox, oy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        // the cafe wall, the shelf of mugs, the checkered floor
        R(-4, -4, SW + 8, 50, '#2f5d5a');
        R(-4, 0, SW + 8, 2, '#458783');
        for (let x = 10; x < SW; x += 20) R(x, 2, 1, 41, '#2a5552');
        R(-4, 43, SW + 8, 3, '#234744');
        R(-4, 43, SW + 8, 1, '#458783');
        R(96, 10, 20, 2, '#6e4526');
        R(96, 12, 20, 1, '#4a2d18');
        [
          ['#f7768e', 98],
          ['#7aa2f7', 105],
          ['#9ece6a', 112],
        ].forEach((m) => {
          R(m[1] - 1, 3, 6, 7, INK);
          R(m[1], 4, 4, 5, m[0]);
        });
        for (let y = 46; y < 72; y += 8)
          for (let x = 0; x < SW; x += 8)
            R(x, y, 8, 8, ((x + y - 46) / 8) % 2 ? '#dcd3c0' : '#ece5d6');
        for (let i = 0; i < 4; i++) R(0, 46 + i, SW, 1, 'rgba(18,19,42,' + (0.2 - i * 0.05) + ')');
        // the counter comes up to a customer's neck and runs on below the frame, towards us;
        // the espresso machine, the glass and the cat stand on it

        c.drawImage(F.counter, -18, 50);
        c.drawImage(F.espresso, 2, 33);
        for (let i = 0; i < 2; i++) {
          const q = (T * 0.6 + i / 2) % 1;
          R(7 + i * 5, 31 - Math.round(q * 7), 1, 2, 'rgba(255,255,255,' + 0.5 * (1 - q) + ')');
        }
        const [gx, gy] = GLASS;
        if (pour > 0 && cup.length) R(gx + 4, gy - 8, 2, 8, BY[cup[cup.length - 1]].col);
        R(gx - 1, gy - 1, 12, 12, INK);
        R(gx, gy, 10, 10, '#bfe3f2');
        cup.forEach((g, i) => {
          R(gx, gy + 7 - i * 3, 10, 3, BY[g].col);
          R(gx, gy + 7 - i * 3, 10, 1, BY[g].hi);
        });
        R(gx + 1, gy, 1, 9, 'rgba(255,255,255,.6)');
        if (spill > 0) label(c, 'OOPS', gx + 5, gy - 9, '#f7768e', 1, 'center');
        c.drawImage(CAT[((T * 2) | 0) % 2], 36, 38);
        // people, back of the line first
        queue
          .concat(leaving)
          .sort((a, b) => b.x - a.x)
          .forEach((q) => {
            const out = q.state === 'out',
              pose =
                q.state === 'happy'
                  ? 'cheer'
                  : q.state === 'angry'
                    ? 'palm'
                    : q.state === 'in' || out
                      ? 'walk'
                      : 'idle',
              dir = pose === 'cheer' || pose === 'palm' ? 0 : out ? 2 : 3,
              f = pose === 'walk' ? Math.floor(q.dist / 2.6) % 6 : frameOf(pose, T + q.x);
            R(q.x - 6, FLOOR, 12, 2, 'rgba(18,19,42,.3)');
            person(c, q.L, pose, dir, f, q.x, FLOOR, (T * 1000 + q.x * 37) % 4200 < 140);
          });
        // the order sits right on the head of whoever is first in line
        const f = front();
        if (f) {
          const rec = [...f.order[1]],
            bw = Math.max(rec.length * 11 + 3, f.order[0].length * 4 + 5),
            bx = Math.max(34, Math.min(SW - bw - 2, Math.round(f.x - bw / 2))),
            by = 14;
          R(bx - 1, by - 1, bw + 2, 24, INK);
          R(bx, by, bw, 22, '#f7f8fb');
          R(Math.round(f.x) - 2, by + 23, 5, 1, INK);
          R(Math.round(f.x) - 1, by + 22, 3, 2, '#f7f8fb');
          label(c, f.order[0], bx + bw / 2, by + 2, '#3a3f5c', 1, 'center');
          rec.forEach((g, i) => {
            const ix = bx + Math.round((bw - (rec.length * 11 - 3)) / 2) + i * 11,
              done = i < cup.length,
              next = i === cup.length,
              iy = by + 9 - (next && ((T * 4) | 0) % 2 ? 1 : 0);
            R(ix - 1, iy - 1, 10, 10, next ? '#ffd23f' : INK);
            c.globalAlpha = done ? 0.35 : 1;
            c.drawImage(ICON[g], ix, iy);
            c.globalAlpha = 1;
            if (done) {
              R(ix + 1, iy + 4, 2, 2, '#2f9e44');
              R(ix + 3, iy + 5, 2, 2, '#2f9e44');
              R(ix + 5, iy + 2, 2, 3, '#2f9e44');
            }
          });
          const k = Math.max(0, f.left / f.max);
          R(bx + 2, by + 19, bw - 4, 2, '#c9ccd8');
          R(
            bx + 2,
            by + 19,
            Math.round((bw - 4) * k),
            2,
            k > 0.5 ? '#2f9e44' : k > 0.25 ? '#e0af68' : '#e03131'
          );
        } else if (!end && !queue.some((q) => q.state === 'happy'))
          label(c, 'NEXT, PLEASE', 86, 22, '#c9d8c0', 1, 'center');
        for (let i = 0; i < 3; i++) HEART(R, 3 + i * 8, 4, i < lives ? '#f7768e' : '#234744');
        label(c, 'SERVED ' + served, 3, 12, '#c9d8c0');
        fx.draw(c);
        // the four ingredients: the icon above its name
        R(-4, 72, SW + 8, 22, INK);
        ING.forEach((g, i) => {
          const x = i * 30,
            down = pressed === i && pressT > 0 ? 1 : 0;
          R(x, 73 + down, 30, 17 - down, i === sel ? '#ffd23f' : '#3a3f5c');
          R(x + 1, 74 + down, 28, 15 - down, tone(g.col, -0.12));
          R(x + 1, 74 + down, 28, 9, g.col);
          R(x + 1, 74 + down, 28, 1, g.hi);
          R(x + 10, 74 + down, 10, 10, INK);
          c.drawImage(ICON[g.id], x + 11, 75 + down);
          label(
            c,
            g.name,
            x + 15,
            84 + down,
            g.id === 'M' || g.id === 'F' ? '#3a3f5c' : '#f2ede2',
            1,
            'center'
          );
        });
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (end) {
          R(18, 22, 84, 16, INK);
          label(c, 'SHIFT OVER', 60, 25, '#f7768e', 2, 'center');
        }
      },
    };
  },
};
