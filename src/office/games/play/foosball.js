import { INK, tone, spr, inked, slab } from '../../engine/pixel.js';
import { frameOf } from '../../art/people.js';
import { W, H, label, box, makeLook, person, createFx } from './_px.js';

// Foosball. A wooden table seen from above: your rods follow the pointer (or the d-pad up and
// down), the three red rods answer on their own. First to 5. The little men are toys, so they
// are small; the two people in the strip below are ours, and they react to every goal.
const FX = 12,
  FY = 17,
  FW = 216,
  FH = 98,
  WIN = 5,
  BR = 3,
  MH = 6,
  MW = 3,
  BASE = 1.8,
  MAXV = 6,
  STEP = 1 / 60,
  MOUTH = 22,
  BLUE = '#3b5bdb',
  RED = '#e03131';
const RODS = [
  { me: true, x: 30, f: [0] },
  { me: false, x: 60, f: [-21, 0, 21] },
  { me: true, x: 91, f: [-18, 0, 18] },
  { me: false, x: 121, f: [-18, 0, 18] },
  { me: true, x: 156, f: [-21, 0, 21] },
  { me: false, x: 186, f: [0] },
];
const lo = (r) => MH - Math.min(...r.f),
  hi = (r) => FH - MH - Math.max(...r.f);

const man = (col) =>
  inked(
    spr(6, 12, (R) => {
      R(1, 0, 4, 1, '#23263a');
      R(1, 11, 4, 1, '#23263a');
      slab(R, 0, 1, 6, 10, col);
      R(1, 4, 4, 4, '#f0c8a0');
      R(1, 4, 4, 2, '#3a2e55');
      R(1, 7, 4, 1, '#c9a07a');
    })
  );
const MAN = { true: man(BLUE), false: man(RED) };
const BALL = [
  [2, 0],
  [4, 1],
  [6, 2],
  [6, 3],
  [4, 4],
  [2, 5],
];
const drawBall = (c, x, y, col, ox = 0) =>
  BALL.forEach(([w, r]) => box(c, x - w / 2 + ox, y - 3 + r + (ox ? 2 : 0), w, 1, col));

const clampTo = (v, a, b) => Math.max(a, Math.min(b, v));

export default {
  size: [W, H],
  how: 'POINTER',
  pad: true,
  a: 'SERVE',
  start(api) {
    const fx = createFx();
    const you = Object.assign(makeLook(4711), { shirt: BLUE, fit: 'tee' }),
      foe = Object.assign(makeLook(9182), { shirt: RED, fit: 'tee' });
    you.id += 'y';
    foe.id += 'f';
    const ball = { x: FW / 2, y: FH / 2, vx: 0, vy: 0 },
      rod = RODS.map(() => FH / 2);
    let me = 0,
      cpu = 0,
      py = FH / 2,
      st = 'serve',
      wait = 1.5,
      flash = 0,
      who = '',
      acc = 0,
      end = 0,
      dir = 1,
      T = 0,
      react = 0,
      spin = 0;
    const serve = () => {
      if (st !== 'serve') return;
      st = 'play';
      const ang = (Math.random() - 0.5) * 0.8;
      ball.vx = dir * BASE * Math.cos(ang);
      ball.vy = BASE * Math.sin(ang);
    };
    const reset = (scorer) => {
      ball.x = FW / 2;
      ball.y = FH / 2 + (Math.random() - 0.5) * 20;
      ball.vx = ball.vy = 0;
      dir = scorer === 'me' ? -1 : 1;
      st = 'serve';
      wait = 1.5;
    };
    const goal = (scorer) => {
      if (scorer === 'me') me++;
      else cpu++;
      who = scorer;
      flash = 1.2;
      react = 1.6;
      ball.x = scorer === 'me' ? FW + 4 : -4;
      ball.vx = ball.vy = 0;
      const gx = FX + (scorer === 'me' ? FW + 2 : -2);
      fx.shake(6);
      fx.burst(
        gx,
        FY + ball.y,
        scorer === 'me' ? [BLUE, '#fff', '#ffd23f'] : [RED, '#fff', '#ffd23f'],
        20,
        80
      );
      api.score(me * 10);
      if (me >= WIN || cpu >= WIN) {
        st = 'end';
        end = 2;
      } else {
        st = 'pause';
        wait = 0.9;
        dir = scorer === 'me' ? -1 : 1;
      }
    };
    const step = () => {
      RODS.forEach((r, i) => {
        if (r.me) rod[i] = clampTo(py, lo(r), hi(r));
        else {
          const d = ball.y - rod[i];
          rod[i] = clampTo(
            rod[i] + Math.sign(d) * Math.min(Math.abs(d) * 5 * STEP, 1.25),
            lo(r),
            hi(r)
          );
        }
      });
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.y - BR < 0) {
        ball.y = BR;
        ball.vy = Math.abs(ball.vy);
      }
      if (ball.y + BR > FH) {
        ball.y = FH - BR;
        ball.vy = -Math.abs(ball.vy);
      }
      RODS.forEach((r, i) => {
        if (Math.abs(ball.x - r.x) >= MW + BR + 1) return;
        for (const o of r.f) {
          const fy = rod[i] + o;
          if (Math.abs(ball.y - fy) < MH + BR) {
            const side = r.me ? 1 : -1,
              spd = Math.hypot(ball.vx, ball.vy),
              ns = Math.min(spd * 1.04, MAXV);
            ball.vx = side * Math.abs(ball.vx || 1) * (ns / spd) || side * ns;
            ball.vy += (ball.y - fy) * 0.1;
            ball.vy = clampTo(ball.vy, -ns * 0.9, ns * 0.9);
            ball.x += side * (MW + BR + 2);
            spin = 0.12;
            fx.burst(FX + ball.x, FY + ball.y, ['#fff', '#c9f2cf'], 3, 24);
            break;
          }
        }
      });
      const inMouth = Math.abs(ball.y - FH / 2) <= MOUTH;
      if (ball.x - BR < 0) {
        if (inMouth) goal('cpu');
        else {
          ball.x = BR;
          ball.vx = Math.abs(ball.vx);
        }
      } else if (ball.x + BR > FW) {
        if (inMouth) goal('me');
        else {
          ball.x = FW - BR;
          ball.vx = -Math.abs(ball.vx);
        }
      }
    };
    let total = 0;
    return {
      state: () => ({
        ball: { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy },
        top: FY,
        me,
        cpu,
        st,
        py,
        rod: rod.slice(),
      }),
      move(x, y) {
        py = y - FY;
      },
      key(k) {
        if (k === 'a') serve();
      },
      tap(x, y) {
        py = y - FY;
        serve();
      },
      tick(dt) {
        T += dt;
        total += dt;
        fx.tick(dt);
        flash = Math.max(0, flash - dt * 2);
        react = Math.max(0, react - dt);
        spin = Math.max(0, spin - dt);
        if (api.held('up')) py -= 75 * dt;
        if (api.held('down')) py += 75 * dt;
        py = clampTo(py, 0, FH);
        if (total > 240 && st !== 'end') {
          st = 'end';
          end = 0.5;
        }
        if (st === 'end') {
          end -= dt;
          if (end <= 0) api.over(me * 10);
          return;
        }
        if (st === 'pause') {
          wait -= dt;
          if (wait <= 0) reset(who);
          return;
        }
        if (st === 'serve') {
          wait -= dt;
          if (wait <= 0) serve();
          return;
        }
        acc += dt;
        while (acc >= STEP && st === 'play') {
          acc -= STEP;
          step();
        }
        if (st !== 'play') acc = 0;
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        R(-4, -4, W + 8, H + 8, '#2b2f52');
        for (let i = 0; i < 40; i++)
          R(
            (i * 53) % W,
            122 + ((i * 29) % 56),
            2,
            1,
            ['#ff4fd8', '#39d3ff', '#ffd23f', '#7cff6b'][i % 4]
          );
        // the score rail
        slab(R, 2, 0, 236, 11, '#8a5a34');
        R(24, 5, 40, 1, INK);
        R(176, 5, 40, 1, INK);
        label(c, 'YOU', 6, 3, '#f2ede2');
        label(c, 'CPU', 234, 3, '#f2ede2', 1, 'right');
        label(c, 'FIRST TO ' + WIN, 120, 3, '#f2ede2', 1, 'center');
        for (let i = 0; i < WIN; i++) {
          const a = i < me,
            b = i < cpu;
          R(24 + i * 8 - 1, 2, 7, 7, INK);
          R(24 + i * 8, 3, 5, 5, a ? BLUE : '#5e3d24');
          if (a) R(24 + i * 8, 3, 5, 1, '#9db4ff');
          R(176 + i * 8 - 1, 2, 7, 7, INK);
          R(176 + i * 8, 3, 5, 5, b ? RED : '#5e3d24');
          if (b) R(176 + i * 8, 3, 5, 1, '#ff9b9b');
        }
        // the table: frame, felt, lines
        slab(R, 2, 12, 236, 108, '#8a5a34');
        for (let x = 6; x < 236; x += 17) R(x, 13, 1, 106, '#7a4f2d');
        R(FX - 2, FY - 2, FW + 4, FH + 4, INK);
        for (let i = 0; i < 9; i++) R(FX + i * 24, FY, 24, FH, i % 2 ? '#2a9140' : '#2f9e44');
        const L = '#bfe9c6';
        R(FX + FW / 2, FY, 1, FH, L);
        for (let a = 0; a < 6.283; a += 0.04)
          R(
            FX + FW / 2 + Math.round(Math.cos(a) * 14),
            FY + FH / 2 + Math.round(Math.sin(a) * 14),
            1,
            1,
            L
          );
        R(FX + FW / 2 - 1, FY + FH / 2 - 1, 3, 3, L);
        [0, 1].forEach((s) => {
          const x = s ? FX + FW - 24 : FX;
          R(x, FY + FH / 2 - 26, 24, 1, L);
          R(x, FY + FH / 2 + 25, 24, 1, L);
          R(s ? x : x + 23, FY + FH / 2 - 26, 1, 52, L);
        });
        // the goals with their nets, in the end rails
        [0, 1].forEach((s) => {
          const gx = s ? FX + FW : 2,
            gw = 10,
            gy = FY + FH / 2 - MOUTH - 3,
            gh = (MOUTH + 3) * 2;
          R(gx, gy, gw, gh, INK);
          for (let yy = gy + 1; yy < gy + gh - 1; yy += 2)
            for (let xx = gx + (s ? 0 : 1); xx < gx + gw - (s ? 1 : 0); xx += 2)
              R(xx + ((yy >> 1) % 2), yy, 1, 1, '#8b90a8');
          R(s ? gx : gx + gw - 2, gy - 1, 2, 2, '#e9ffe9');
          R(s ? gx : gx + gw - 2, gy + gh - 1, 2, 2, '#e9ffe9');
        });
        // the ball sits on the felt, under the rods
        const bx = FX + Math.round(ball.x),
          by = FY + Math.round(ball.y);
        drawBall(c, bx, by, 'rgba(10,40,20,.45)', 2);
        RODS.forEach((r, i) => {
          const x = FX + r.x;
          R(x - 1, FY - 3, 2, FH + 7, '#c9ccd8');
          R(x, FY - 3, 1, FH + 7, '#8b90a8');
          R(x - 2, FY - 3, 4, 2, '#23263a');
          if (r.me) {
            R(x - 3, FY + FH + 1, 6, 5, INK);
            R(x - 2, FY + FH + 2, 4, 3, BLUE);
          }
        });
        drawBall(c, bx, by, '#f2ede2');
        R(bx - 1, by - 2, 1, 1, '#fff');
        if (spin > 0) R(bx + 1, by + 1, 1, 1, '#9aa0b8');
        RODS.forEach((r, i) =>
          r.f.forEach((o) => {
            const x = FX + r.x,
              y = FY + Math.round(rod[i] + o);
            R(x - 2, y - 4, 6, 12, 'rgba(10,40,20,.4)');
            c.drawImage(MAN[r.me], x - 4, y - 7);
          })
        );
        if (st === 'serve' && ((T * 3) | 0) % 2)
          label(c, 'TAP TO SERVE', FX + FW / 2, FY + FH - 12, '#fff', 1, 'center');
        if (flash > 0) {
          const t = who === 'me' ? 'GOAL!' : 'CPU SCORES';
          R(FX + FW / 2 - t.length * 5 - 4, FY + FH / 2 - 11, t.length * 10 + 7, 18, INK);
          label(
            c,
            t,
            FX + FW / 2,
            FY + FH / 2 - 7,
            who === 'me' ? '#9db4ff' : '#ff9b9b',
            2,
            'center'
          );
        }
        // the strip with two of our people
        R(3, 125, 234, 54, INK);
        R(4, 126, 232, 52, '#33265e');
        R(4, 126, 232, 3, '#4b3a86');
        R(4, 158, 232, 2, '#4b3a86');
        R(4, 160, 232, 18, '#2b2f52');
        for (let i = 0; i < 12; i++)
          R(10 + i * 20, 163 + ((i * 7) % 11), 2, 1, ['#ff4fd8', '#39d3ff', '#ffd23f'][i % 3]);
        label(c, me + ' - ' + cpu, 120, 138, '#ffd23f', 3, 'center');
        label(
          c,
          st === 'end'
            ? me > cpu
              ? 'YOU WIN'
              : 'CPU WINS'
            : react > 0
              ? who === 'me'
                ? 'NICE'
                : 'OUCH'
              : 'RODS FOLLOW YOU',
          120,
          162,
          st === 'end' ? (me > cpu ? '#9ece6a' : '#ff9b9b') : '#9aa0c8',
          1,
          'center'
        );
        const fin = st === 'end';
        const mood = (mine) => {
          const won = who === (mine ? 'me' : 'cpu');
          if (fin) return me > cpu === mine ? 'cheer' : 'palm';
          if (react > 0) return won ? 'cheer' : 'palm';
          return ((T * 0.5) | 0) % 5 === 4 && !mine ? 'think' : 'idle';
        };
        [
          [you, 38, true],
          [foe, 202, false],
        ].forEach(([p, x, mine]) => {
          const pose = mood(mine),
            d = pose === 'cheer' || pose === 'palm' ? 0 : mine ? 2 : 3;
          R(x - 7, 173, 14, 2, 'rgba(18,19,42,.35)');
          person(c, p, pose, d, frameOf(pose, T + x), x, 174, (T * 1000 + x * 37) % 4200 < 140);
        });
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (fin) {
          R(60, 60, 120, 22, INK);
          label(
            c,
            me > cpu ? 'YOU WIN' : 'CPU WINS',
            120,
            64,
            me > cpu ? '#9ece6a' : '#ff9b9b',
            2,
            'center'
          );
          label(c, me + ' - ' + cpu, 120, 76, '#c8d3f5', 1, 'center');
        }
      },
    };
  },
};
