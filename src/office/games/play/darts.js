import { INK, mk, text } from '../../engine/pixel.js';
import { frameOf } from '../../art/people.js';
import { F } from '../../art/furniture.js';
import { SCENE_W as W, SCENE_H as H, label, box, makeLook, person, createFx } from './_px.js';

// Darts in the games room. One of our people stands at the oche and throws at the cabinet on
// the wall; the board is shown enlarged in the framed panel, a real board with 20 sectors in
// the standard order, doubles, trebles and the bull. A crosshair drifts over it and the hand
// shakes more as the running score grows. Nine darts, three to a visit. The score is the total.
const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const PL = 29,
  PT = 2,
  PS = 68,
  CX = PL + 34,
  CY = PT + 34,
  BR = 25.5,
  BULL = 2.5,
  OUTER = 5,
  TRE = [13.5, 17.5],
  DBL = [22, 25.5],
  CAB = [100, 28],
  FLOOR = 62,
  FEET = 86,
  PX0 = 13;
const BLACK = '#1b1b2a',
  CREAM = '#e8dcc0',
  RED = '#d23c3c',
  GREEN = '#2f9e44';

const sector = (dx, dy) => {
  const a = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor((a + Math.PI / 20) / (Math.PI / 10)) % 20;
};
const rate = (dx, dy) => {
  const d = Math.hypot(dx, dy);
  if (d <= BULL) return { pts: 50, name: 'BULL' };
  if (d <= OUTER) return { pts: 25, name: '25' };
  if (d > BR) return { pts: 0, name: 'MISS' };
  const n = ORDER[sector(dx, dy)];
  if (d >= TRE[0] && d <= TRE[1]) return { pts: n * 3, name: 'T' + n };
  if (d >= DBL[0]) return { pts: n * 2, name: 'D' + n };
  return { pts: n, name: '' + n };
};

const BOARD = (() => {
  const c = mk(PS, PS),
    x = c.getContext('2d');
  const R = (a, b, w, h, col) => {
    x.fillStyle = col;
    x.fillRect(a, b, w, h);
  };
  for (let y = 0; y < PS; y++)
    for (let i = 0; i < PS; i++) {
      const dx = i + 0.5 - 34,
        dy = y + 0.5 - 34,
        d = Math.hypot(dx, dy);
      let col = (i + y) % 2 ? '#241a4a' : '#271d50';
      if (d <= 33.4) col = '#14122a';
      if (d <= BR) {
        const dark = sector(dx, dy) % 2 === 0;
        if (d <= BULL) col = RED;
        else if (d <= OUTER) col = GREEN;
        else if ((d >= TRE[0] && d <= TRE[1]) || d >= DBL[0]) col = dark ? RED : GREEN;
        else col = dark ? BLACK : CREAM;
      }
      R(i, y, 1, 1, col);
    }
  ORDER.forEach((n, k) => {
    const a = (k * Math.PI) / 10,
      s = String(n),
      w = s.length * 4 - 1;
    text(
      x,
      s,
      Math.round(34 + Math.sin(a) * 29.5 - w / 2),
      Math.round(34 - Math.cos(a) * 29.5 - 2.5),
      '#f2ede2'
    );
  });
  return c;
})();

const pip = (R, x, y, col) => {
  R(x, y + 1, 4, 1, col);
  R(x, y, 1, 3, col);
};

export default {
  size: [W, H],
  how: 'TAP TO THROW',
  a: 'THROW',
  start(api) {
    const fx = createFx();
    const L = Object.assign(makeLook(555), { carry: true });
    const ch = { x: 4, y: -6 };
    let left = 9,
      total = 0,
      visit = [],
      darts = [],
      st = 'aim',
      fly = null,
      last = null,
      react = 0,
      reactPose = 'idle',
      throwT = 0,
      wait = 0,
      T = 0,
      ox = 0,
      oy = 0,
      flash = 0;
    const shakeAmp = () => Math.min(2.4, total / 80);
    const scatter = () => 0.5 + Math.min(3, total / 60);

    const ph = [0, 1, 2, 3].map(() => Math.random() * 6.28);
    const aim = () => {
      ch.x = 17 * Math.sin(T * 1.3 + ph[0]) + 6 * Math.sin(T * 2.9 + ph[1]);
      ch.y = 15 * Math.sin(T * 1.7 + ph[2]) + 6 * Math.sin(T * 3.3 + ph[3]);
    };
    const toss = () => {
      if (st !== 'aim') return;
      const sc = scatter();
      fly = {
        x: ch.x + ox + (Math.random() - 0.5) * 2 * sc,
        y: ch.y + oy + (Math.random() - 0.5) * 2 * sc,
        k: 0,
      };
      st = 'fly';
      throwT = 0.3;
    };
    const land = () => {
      const r = rate(fly.x, fly.y),
        col = ['#ff4fd8', '#39d3ff', '#ffd23f'][darts.length % 3];
      darts.push({ x: fly.x, y: fly.y, col });
      visit.push(r.pts);
      total += r.pts;
      last = r;
      left--;
      api.score(total);
      flash = 0.12;
      fx.shake(r.pts >= 40 ? 3 : 1);
      const sx = CX + fly.x,
        sy = CY + fly.y;
      fx.burst(
        sx,
        sy,
        r.pts >= 40 ? ['#ffd23f', '#fff', '#ff4fd8'] : ['#c8d3f5', '#fff'],
        r.pts >= 40 ? 14 : 5,
        50
      );
      if (r.name)
        fx.pop(sx, sy - 5, r.name, r.pts >= 40 ? '#ffd23f' : r.pts ? '#f2ede2' : '#ff9b9b');
      react = 1;
      reactPose = r.pts >= 40 ? 'cheer' : r.pts <= 3 ? 'palm' : 'idle';
      fly = null;
      if (left <= 0) {
        st = 'end';
        wait = 2.2;
      } else if (visit.length === 3) {
        st = 'visit';
        wait = 1.5;
      } else st = 'aim';
    };

    return {
      state: () => ({
        st,
        left,
        total,
        ch: { x: ch.x, y: ch.y },
        darts: darts.map((d) => ({ x: d.x, y: d.y })),
        rate,
        sector,
      }),
      key(k) {
        if (k === 'a') toss();
      },
      tap: toss,
      tick(dt) {
        T += dt;
        fx.tick(dt);
        flash = Math.max(0, flash - dt);
        react = Math.max(0, react - dt);
        throwT = Math.max(0, throwT - dt);
        const sh = shakeAmp();
        ox = sh ? Math.sin(T * 17) * sh * 0.7 + Math.sin(T * 29) * sh * 0.3 : 0;
        oy = sh ? Math.cos(T * 13) * sh * 0.7 + Math.sin(T * 23) * sh * 0.3 : 0;
        if (st === 'aim') aim();
        else if (st === 'fly') {
          fly.k += dt / 0.38;
          if (fly.k >= 1) land();
        } else if (st === 'visit') {
          wait -= dt;
          if (wait <= 0) {
            darts = [];
            visit = [];
            st = 'aim';
          }
        } else if (st === 'end') {
          wait -= dt;
          if (wait <= 0) api.over(total);
        }
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        R(-4, -4, W + 8, FLOOR + 4, '#33265e');
        R(-4, -4, W + 8, 4, '#4b3a86');
        for (let x = 6; x < W; x += 16) R(x, 4, 1, FLOOR - 6, '#2d2255');
        R(-4, FLOOR - 2, W + 8, 2, '#4b3a86');
        R(-4, FLOOR, W + 8, H - FLOOR + 4, '#2b2f52');
        for (let y = FLOOR; y < H; y += 16) R(0, y, W, 1, '#232744');
        for (let x = 4; x < W; x += 16) R(x, FLOOR, 1, H - FLOOR, '#232744');
        for (let i = 0; i < 14; i++)
          R(
            (i * 37) % W,
            FLOOR + 3 + ((i * 11) % 24),
            2,
            1,
            ['#ff4fd8', '#39d3ff', '#ffd23f', '#7cff6b'][i % 4]
          );
        R(30, FLOOR + 3, 2, H - FLOOR - 3, '#f2ede2');
        // the office's own cabinet, and the frame that magnifies its board
        R(CAB[0] + 1, FLOOR + 2, 18, 3, 'rgba(18,19,42,.4)');
        c.drawImage(F.darts, CAB[0], CAB[1]);
        R(CAB[0] + 4, CAB[1] + 4, 12, 1, '#e0af68');
        R(CAB[0] + 4, CAB[1] + 15, 12, 1, '#e0af68');
        R(CAB[0] + 4, CAB[1] + 4, 1, 12, '#e0af68');
        R(CAB[0] + 15, CAB[1] + 4, 1, 12, '#e0af68');
        darts.forEach((d) =>
          R(
            CAB[0] + 10 + Math.round((d.x / BR) * 4),
            CAB[1] + 10 + Math.round((d.y / BR) * 4),
            1,
            1,
            d.col
          )
        );
        R(PL + PS + 2, CY - 1, 2, 1, '#e0af68');
        R(PL + PS + 4, CY - 1, 2, 1, '#e0af68');
        // the panel
        R(PL - 2, PT - 2, PS + 4, PS + 4, INK);
        R(PL - 1, PT - 1, PS + 2, PS + 2, '#e0af68');
        c.drawImage(BOARD, PL, PT);
        darts.forEach((d) => {
          const x = Math.round(CX + d.x),
            y = Math.round(CY + d.y);
          R(x + 1, y - 2, 1, 1, '#c9ccd8');
          R(x + 2, y - 3, 1, 1, '#c9ccd8');
          R(x + 3, y - 5, 3, 3, INK);
          R(x + 4, y - 4, 2, 2, d.col);
          R(x, y, 1, 1, '#fff');
        });
        if (st === 'aim') {
          const x = Math.round(CX + ch.x + ox),
            y = Math.round(CY + ch.y + oy),
            k = ((T * 6) | 0) % 2 ? '#ff4fd8' : '#ffd0f4';
          R(x - 6, y, 4, 1, INK);
          R(x + 3, y, 4, 1, INK);
          R(x, y - 6, 1, 4, INK);
          R(x, y + 3, 1, 4, INK);
          R(x - 5, y, 3, 1, k);
          R(x + 3, y, 3, 1, k);
          R(x, y - 5, 1, 3, k);
          R(x, y + 3, 1, 3, k);
        }
        if (flash > 0) {
          c.globalAlpha = 0.25;
          R(PL, PT, PS, PS, '#fff');
          c.globalAlpha = 1;
        }
        // the thrower
        const px = PX0,
          pose =
            throwT > 0
              ? 'wave'
              : react > 0
                ? reactPose
                : st === 'visit' && visit.reduce((a, b) => a + b, 0) >= 60
                  ? 'cheer'
                  : 'idle',
          dir = pose === 'idle' ? 2 : 0,
          f = frameOf(pose, T);
        R(px - 7, FEET, 14, 2, 'rgba(18,19,42,.35)');
        person(c, L, pose, dir, f, px, FEET, (T * 1000) % 4200 < 140);
        if (pose === 'idle' && st === 'aim') {
          const b = f % 4 === 1 ? 1 : 0;
          R(px + 3, FEET - 15 + b, 2, 3, '#ff4fd8');
          R(px + 5, FEET - 14 + b, 5, 1, '#c9ccd8');
        }
        // the dart in the air, small, between the hand and the cabinet
        if (fly) {
          const k = fly.k,
            x = Math.round(px + 8 + (CAB[0] + 10 - px - 8) * k),
            y = Math.round(FEET - 18 + (CAB[1] + 10 - FEET + 18) * k - Math.sin(k * Math.PI) * 12);
          R(x - 3, y - 1, 3, 3, INK);
          R(x - 3, y, 2, 1, '#ff4fd8');
          R(x - 1, y, 5, 1, '#c9ccd8');
        }
        // what belongs to the thrower sits right at the head
        if (last && (react > 0 || st === 'visit')) {
          const t =
              st === 'visit'
                ? 'V' + visit.reduce((a, b) => a + b, 0)
                : last.pts
                  ? '' + last.pts
                  : 'MISS',
            w = t.length * 4 + 3,
            bx = Math.max(0, Math.min(27 - w, px - Math.round(w / 2)));
          R(bx, FEET - 40, w, 9, INK);
          R(
            bx + 1,
            FEET - 39,
            w - 2,
            7,
            st === 'visit' ? '#9ece6a' : last.pts >= 40 ? '#ffd23f' : '#f7f8fb'
          );
          label(c, t, bx + 2, FEET - 38, INK);
        }
        // the numbers
        const aimN = st === 'aim' ? rate(ch.x, ch.y) : null;
        R(33, 73, W - 29, H - 69, INK);
        R(33, 73, W - 29, 1, '#4b3a86');
        label(c, 'TOTAL', 36, 76, '#9aa0c8');
        label(c, total, 62, 76, '#ffd23f');
        label(c, aimN ? aimN.name || '-' : '', 117, 76, '#f2ede2', 1, 'right');
        for (let i = 0; i < 9; i++) pip(R, 36 + i * 5, 84, i < left ? '#e0af68' : '#3a3f5c');
        label(c, left + ' LEFT', 117, 83, '#9aa0c8', 1, 'right');
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (st === 'end') {
          c.globalAlpha = 0.88;
          R(PL, PT, PS, PS, INK);
          c.globalAlpha = 1;
          R(PL + 6, CY - 12, PS - 12, 24, INK);
          R(PL + 7, CY - 11, PS - 14, 22, '#e0af68');
          R(PL + 8, CY - 10, PS - 16, 20, '#241a4a');
          label(c, 'DONE', CX, CY - 8, '#ffd0f4', 1, 'center');
          label(c, total, CX, CY, '#ffd23f', 2, 'center');
        }
      },
    };
  },
};
