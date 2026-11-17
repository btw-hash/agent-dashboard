import { INK } from '../../engine/pixel.js';
import { F } from '../../art/furniture.js';
import { W, H, label, box, makeLook, person, createFx } from './_px.js';
import { hitButton, row, lounge, panel, drawBtns, createFlyers, blinks } from './_cards.js';
import { frameOf } from '../../art/people.js';

// Roulette on the big screen: the strip on top is the lounge at 2x whole-pixel scale (a croupier by the wheel,
// office proportions kept), the felt panel holds the betting layout (tap a cell 5, hold -5). While the wheel runs the panel shows it close up and the ball settles with a few bounces.
const START = 100,
  UNIT = 5,
  SPINS = 10,
  DUR = 4.4,
  LINGER = 2;
const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const N = WHEEL.length,
  STEP = (Math.PI * 2) / N;
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const OUTSIDE = [
  { key: 'red', label: 'RED', bg: '#b01828', fg: '#fff' },
  { key: 'black', label: 'BLACK', bg: '#161a2c', fg: '#fff' },
  { key: 'even', label: 'EVEN', bg: '#2d5aa8', fg: '#fff' },
  { key: 'odd', label: 'ODD', bg: '#1f7f86', fg: '#fff' },
  { key: 'low', label: '1-18', bg: '#6b4aa0', fg: '#fff' },
  { key: 'high', label: '19-36', bg: '#a04a7a', fg: '#fff' },
];
const colorOf = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');
const FILL = { red: '#c4202e', black: '#161a2c', green: '#1f9a4a' };
const numAt = (col, r) => 3 - r + col * 3;
const ease = (t) => 1 - Math.pow(1 - t, 3);
const GX = 26,
  GY = 99,
  CW = 17,
  CHH = 15,
  OY = 146,
  OW = 37,
  OX = 10;
const WCX = 62,
  WCY = 137,
  SC = 1.42;

const cellBox = (key) => {
  if (key === 'n_0') return [10, GY, 15, CHH * 3 - 1];
  if (key.startsWith('n_')) {
    const n = +key.slice(2),
      col = Math.floor((n - 1) / 3),
      r = 3 - (n - col * 3);
    return [GX + col * CW, GY + r * CHH, CW - 1, CHH - 1];
  }
  const i = OUTSIDE.findIndex((o) => o.key === key);
  return [OX + i * OW, OY, OW - 1, 12];
};
const CELLS = [
  'n_0',
  ...Array.from({ length: 36 }, (_, i) => 'n_' + (i + 1)),
  ...OUTSIDE.map((o) => o.key),
];
const cellAt = (x, y) =>
  CELLS.find((k) => {
    const [bx, by, bw, bh] = cellBox(k);
    return x >= bx && x < bx + bw + 1 && y >= by && y < by + bh + 1;
  });

const RING = [];
for (let dy = -36; dy <= 36; dy++)
  for (let dx = -36; dx <= 36; dx++) {
    const d = Math.hypot(dx, dy);
    if (d > 17.5 * SC && d <= 23.5 * SC) RING.push([dx, dy, Math.atan2(dy, dx)]);
  }
const disc = (c, cx, cy, r, col) => {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.round(Math.sqrt(r * r + 0.5 - dy * dy));
    box(c, cx - w, cy + dy, w * 2 + 1, 1, col);
  }
};

export default {
  size: [W, H],
  how: 'TAP',
  start(api) {
    const fx = createFx(),
      fly = createFlyers();
    const L = Object.assign(makeLook(), { fit: 'suit', acc: '', beard: false });
    const bets = {};
    const hist = [];
    let chips = START,
      left = SPINS,
      spinning = false,
      t = 0,
      linger = 0,
      result = null,
      net = 0,
      fin = 0,
      done = false,
      T = 0,
      cel = null,
      pressed = '',
      pressT = 0,
      msg = 'TAP BETS 5 - HOLD TAKES BACK',
      mcol = '#e0af68';

    const staked = () => Object.values(bets).reduce((a, b) => a + b, 0);
    const view = () => (spinning || linger > 0 ? 'wheel' : 'bets');
    const btns = () =>
      fin > 0 || done || view() !== 'bets'
        ? []
        : row(
            [
              { id: 'spin', label: 'SPIN', col: '#e0af68', on: staked() > 0 },
              { id: 'clear', label: 'CLEAR', col: '#8a88b0', on: staked() > 0 },
              ...(left < SPINS
                ? [{ id: 'cash', label: 'CASH OUT', col: '#9ece6a', on: true }]
                : []),
            ],
            162,
            12,
            6,
            60,
            236,
            2
          );
    const say = (m, c) => {
      msg = m;
      mcol = c;
    };
    const chipOn = (key, d) => {
      const cur = bets[key] || 0;
      if (d > 0) {
        if (chips < UNIT) return say('NOT ENOUGH CHIPS', '#f7768e');
        chips -= UNIT;
        bets[key] = cur + UNIT;
      } else if (cur > 0) {
        chips += UNIT;
        if (cur === UNIT) delete bets[key];
        else bets[key] = cur - UNIT;
      }
      say(
        `STAKED ${staked()} ON ${Object.keys(bets).length} SPOT${Object.keys(bets).length > 1 ? 'S' : ''}`,
        '#e0af68'
      );
    };
    const clear = () => {
      for (const k in bets) {
        chips += bets[k];
        delete bets[k];
      }
      say('BETS CLEARED', '#e0af68');
    };
    const spin = () => {
      left--;
      spinning = true;
      t = 0;
      result = WHEEL[(Math.random() * N) | 0];
      cel = { pose: 'wave', left: DUR };
      say('NO MORE BETS', '#e0af68');
    };
    const resolve = () => {
      spinning = false;
      linger = LINGER;
      const n = result,
        col = colorOf(n),
        st = staked();
      let pay = 0;
      for (const k in bets) {
        const s = bets[k];
        if (k.startsWith('n_')) {
          if (+k.slice(2) === n) pay += s * 36;
        } else if (k === col) pay += s * 2;
        else if (n > 0 && k === 'even' && n % 2 === 0) pay += s * 2;
        else if (n > 0 && k === 'odd' && n % 2 === 1) pay += s * 2;
        else if (k === 'low' && n >= 1 && n <= 18) pay += s * 2;
        else if (k === 'high' && n >= 19) pay += s * 2;
        delete bets[k];
      }
      chips += pay;
      net = pay - st;
      hist.push(n);
      if (hist.length > 9) hist.shift();
      if (net > 0) {
        say(`WIN ${n} NET ${net}`, '#9ece6a');
        cel = { pose: 'palm', left: LINGER };
        fx.burst(120, 60, ['#ffd23f', '#9ece6a', '#fff'], 18, 80);
        for (let i = 0; i < Math.min(5, net / UNIT); i++) fly.send(130, 40, 40, 135, i * 0.08);
      } else if (net === 0) {
        say(`PUSH ${n}`, '#e0af68');
        cel = { pose: 'talk', left: LINGER };
      } else {
        say(`LOSS ${n} ${net}`, '#f7768e');
        cel = { pose: 'cheer', left: LINGER };
        for (let i = 0; i < Math.min(5, -net / UNIT); i++) fly.send(40, 135, 130, 40, i * 0.08);
      }
      api.score(chips);
      if (left <= 0 || chips < UNIT) fin = LINGER + 1.2;
    };
    const act = (id) => {
      pressed = id;
      pressT = 0.12;
      if (id === 'spin') spin();
      else if (id === 'clear') clear();
      else if (id === 'cash') {
        chips += staked();
        done = true;
        api.over(chips);
      }
    };

    let shown = chips;
    api.score(chips);

    const wheelAt = (p) => {
      const idx = WHEEL.indexOf(result),
        fin0 = -Math.PI / 2 - (idx + 0.5) * STEP;
      return fin0 - 5 * Math.PI * (1 - ease(p));
    };
    const ballAt = (p) => {
      let a = -Math.PI / 2 + 13 * Math.PI * (1 - (1 - (1 - p) ** 2)),
        r = 24 * SC;
      if (p > 0.62) {
        const q = (p - 0.62) / 0.38;
        r = (24 - 4 * ease(q) + 3.2 * Math.abs(Math.sin(q * Math.PI * 3.5)) * (1 - q) ** 1.4) * SC;
        a += 0.1 * (1 - q) * Math.sin(q * Math.PI * 5);
      }
      return [a, r];
    };

    return {
      state: () => ({
        view: view(),
        left,
        chips,
        staked: staked(),
        bets: { ...bets },
        buttons: btns().map((b) => ({ id: b.id, on: b.on, x: b.x + b.w / 2, y: b.y + b.h / 2 })),
        cell: (k) => {
          const [bx, by, bw, bh] = cellBox(k);
          return [bx + bw / 2, by + bh / 2];
        },
      }),
      key(k) {
        if (k === 'a' && view() === 'bets' && !fin && staked() > 0) spin();
      },
      tap(x, y) {
        if (view() !== 'bets' || fin) return;
        const b = hitButton(btns(), x, y);
        if (b) return act(b.id);
        const k = cellAt(x, y);
        if (k) chipOn(k, UNIT);
      },
      hold(x, y) {
        if (view() !== 'bets' || fin) return;
        const k = cellAt(x, y);
        if (k) chipOn(k, -UNIT);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        fly.tick(dt);
        pressT -= dt;
        if (chips !== shown) api.score((shown = chips));
        if (cel && (cel.left -= dt) <= 0) cel = null;
        if (spinning) {
          t += dt;
          if (t >= DUR) resolve();
        } else if (linger > 0) linger -= dt;
        if (fin > 0 && !spinning && linger <= 0) {
          fin -= dt;
          if (fin <= 0 && !done) {
            done = true;
            api.over(chips);
          }
        }
      },
      draw(c) {
        const [ox, oy] = fx.offset();
        c.setTransform(1, 0, 0, 1, ox, oy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        const p = spinning ? Math.min(1, t / DUR) : 1;
        // the lounge strip, drawn at 2x: the croupier, the wheel and the table keep the office's proportions
        c.setTransform(2, 0, 0, 2, ox, oy);
        c.imageSmoothingEnabled = false;
        c.save();
        c.beginPath();
        c.rect(0, 0, 120, 40);
        c.clip();
        lounge(c, 33, 120);
        c.drawImage(F.wheel, 12, 17);
        {
          const a = spinning ? ballAt(p)[0] : 0,
            rr = spinning && p < 0.8 ? 7 : 2;
          R(Math.round(24 + Math.cos(a) * rr), Math.round(29 + Math.sin(a) * rr), 1, 1, '#fff');
        }
        c.drawImage(F.roul, 40, 20);
        const pose = cel ? cel.pose : 'idle';
        R(98, 36, 12, 2, 'rgba(18,19,42,.35)');
        person(c, L, pose, 0, frameOf(pose, T), 106, 38, blinks(T));
        hist.forEach((n, i) => R(42 + i * 5, 4, 4, 2, FILL[colorOf(n)]));
        c.restore();
        c.setTransform(1, 0, 0, 1, ox, oy);
        R(0, 80, 240, 2, '#e0af68');
        R(0, 82, 240, 12, '#1a1030');
        label(
          c,
          'SPIN ' + Math.min(SPINS, SPINS - left + (view() === 'bets' ? 1 : 0)) + ' OF ' + SPINS,
          6,
          86,
          '#e0af68'
        );
        label(c, msg, 120, 86, mcol, 1, 'center');
        label(c, 'CHIPS ' + chips, 234, 86, chips >= UNIT ? '#9ece6a' : '#f7768e', 1, 'right');
        panel(c, 2, 95, 236, 83, '#1f6b3a');
        if (view() === 'bets') {
          CELLS.forEach((k) => {
            const [bx, by, bw, bh] = cellBox(k),
              n = k.startsWith('n_') ? +k.slice(2) : -1,
              o = OUTSIDE.find((q) => q.key === k),
              col = o ? o.bg : FILL[colorOf(n)];
            R(bx, by, bw, bh, col);
            R(bx, by, bw, 1, 'rgba(255,255,255,.22)');
            const st = bets[k];
            if (st) {
              const q = String(st),
                w = q.length * 4 + 3,
                cx = bx + Math.round((bw - w) / 2);
              R(cx, by + 2, w, bh - 4, INK);
              R(cx + 1, by + 3, w - 2, bh - 6, '#ffd23f');
              label(c, q, cx + 2, by + Math.round((bh - 5) / 2), INK);
            } else if (o) label(c, o.label, bx + bw / 2, by + 4, o.fg, 1, 'center');
            else label(c, n, bx + bw / 2, by + 5, '#fff', 1, 'center');
          });
          drawBtns(c, btns(), -1, pressT > 0 ? pressed : '');
        } else {
          disc(c, WCX, WCY, 39, INK);
          disc(c, WCX, WCY, 38, '#3b2a1e');
          disc(c, WCX, WCY, 36, '#7a5230');
          disc(c, WCX, WCY, 33, '#3b2a1e');
          const a0 = result === null ? T * 0.4 : spinning ? wheelAt(p) : wheelAt(1);
          RING.forEach(([dx, dy, ang]) => {
            const m = (((ang - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
              i = Math.floor(m / STEP),
              fr = m / STEP - i;
            R(WCX + dx, WCY + dy, 1, 1, fr < 0.24 ? '#e0af68' : FILL[colorOf(WHEEL[i])]);
          });
          disc(c, WCX, WCY, 24, '#5a3a1a');
          disc(c, WCX, WCY, 18, '#3b2a1e');
          disc(c, WCX, WCY, 8, '#e0af68');
          R(WCX - 3, WCY - 4, 4, 1, '#fff6c8');
          for (let k = 0; k < 4; k++) {
            const q = a0 * 1.5 + (k * Math.PI) / 2;
            R(
              WCX + Math.round(Math.cos(q) * 13),
              WCY + Math.round(Math.sin(q) * 13),
              3,
              3,
              '#e0af68'
            );
          }
          const [ba, br] = spinning ? ballAt(p) : [-Math.PI / 2, 20 * SC];
          const bx = Math.round(WCX + Math.cos(ba) * br),
            by = Math.round(WCY + Math.sin(ba) * br);
          R(bx - 3, by - 3, 6, 6, INK);
          R(bx - 2, by - 2, 4, 4, '#fff');
          R(WCX - 2, WCY - 43, 5, 4, '#ffd23f');
          if (spinning) {
            label(c, 'NO MORE', 170, 112, '#ffee88', 2, 'center');
            label(c, 'BETS', 170, 126, '#ffee88', 2, 'center');
            label(c, 'STAKED ' + staked(), 170, 148, '#c9d8c0', 1, 'center');
          } else if (result !== null) {
            R(135, 100, 70, 36, INK);
            R(136, 101, 68, 34, FILL[colorOf(result)]);
            R(136, 101, 68, 1, 'rgba(255,255,255,.25)');
            label(c, result, 170, 108, '#fff', 4, 'center');
            label(c, colorOf(result), 170, 142, '#c9d8c0', 1, 'center');
            label(
              c,
              net > 0 ? 'WIN ' + net : net === 0 ? 'PUSH' : 'LOSS ' + -net,
              170,
              154,
              net > 0 ? '#9ece6a' : net === 0 ? '#ffd090' : '#f7768e',
              2,
              'center'
            );
          }
        }
        fly.draw(c);
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (fin > 0 && !spinning && linger <= 0) {
          R(79, 120, 82, 22, INK);
          R(80, 121, 80, 20, '#e0af68');
          R(81, 122, 78, 18, '#1a1030');
          label(c, 'FINAL ' + chips, 120, 128, '#ffd23f', 2, 'center');
        }
      },
    };
  },
};
