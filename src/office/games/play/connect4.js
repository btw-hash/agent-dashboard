import { INK, tone, spr, inked } from '../../engine/pixel.js';
import { sprite, build, frameOf } from '../../art/people.js';
import { W, H, label, box, makeLook, createFx } from './_px.js';

// Connect 4 on the low table: the standing frame seen from the front, discs drop behind the
// blue plate and bounce. Your opponent, one of our people, sits across the table and thinks.
// The CPU takes a win, blocks yours, avoids a move that hands you a win, else likes the centre.
const COLS = 7,
  ROWS = 6,
  CELL = 20,
  BX = 9,
  BY = 28,
  HOVER = BY - 14,
  G = 520;
const PX = 162,
  PY = 26,
  PW = 74,
  PH = 74,
  TABLE = 156;
const COL = {
  P: { rim: '#8f1f1f', main: '#e03131', hi: '#ff9b9b' },
  C: { rim: '#b08a10', main: '#ffd23f', hi: '#fff6c8' },
};
const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];
const ORDER = [3, 2, 4, 1, 5, 0, 6];

const line = (b, r, c, who) => {
  for (const [dr, dc] of DIRS) {
    const cells = [[r, c]];
    for (const s of [1, -1])
      for (let k = 1; k < 4; k++) {
        const a = r + dr * k * s,
          q = c + dc * k * s;
        if (a < 0 || a >= ROWS || q < 0 || q >= COLS || b[a][q] !== who) break;
        cells.push([a, q]);
      }
    if (cells.length >= 4) return cells;
  }
  return null;
};
const rowOf = (b, c) => {
  for (let r = ROWS - 1; r >= 0; r--) if (!b[r][c]) return r;
  return -1;
};
const trial = (b, c, who, fn) => {
  const r = rowOf(b, c);
  if (r < 0) return null;
  b[r][c] = who;
  const out = fn(r);
  b[r][c] = '';
  return out;
};
const pick = (b) => {
  const open = ORDER.filter((c) => !b[0][c]);
  for (const who of ['C', 'P'])
    for (const c of open) if (trial(b, c, who, (r) => !!line(b, r, c, who))) return c;
  const gives = (c) => trial(b, c, 'C', () => trial(b, c, 'P', (r) => !!line(b, r, c, 'P')));
  const safe = open.filter((c) => !gives(c)),
    pool = safe.length ? safe : open;
  let best = pool[0],
    bs = -9;
  for (const c of pool) {
    const s = 3 - Math.abs(c - 3) + Math.random() * 1.5;
    if (s > bs) {
      bs = s;
      best = c;
    }
  }
  return best;
};

const circ = (R, cx, cy, r, col) => {
  for (let dy = -r; dy < r; dy++) {
    const t = dy + 0.5,
      hw = Math.round(Math.sqrt(r * r - t * t));
    R(cx - hw, cy + dy, hw * 2, 1, col);
  }
};
const disc = (R, cx, cy, who, lit) => {
  const k = COL[who];
  circ(R, cx, cy, 9, k.rim);
  circ(R, cx, cy, 7, lit ? k.hi : k.main);
  circ(R, cx, cy, 5, k.rim);
  circ(R, cx, cy, 4, lit ? k.hi : k.main);
  R(cx - 5, cy - 6, 2, 1, k.hi);
  R(cx - 6, cy - 5, 1, 2, k.hi);
};

const HW = [];
for (let dy = -8; dy < 8; dy++) HW.push(Math.round(Math.sqrt(64 - (dy + 0.5) ** 2)));
const BLUE = '#3b5bdb';
const PLATE = inked(
  spr(150, 134, (R) => {
    for (let y = 0; y < 130; y++) {
      const ly = (y - 5) % CELL,
        row = y >= 5 && y < 125 && ly >= 2 && ly < 18 ? HW[ly - 2] : 0;
      let x0 = 0;
      if (row)
        for (let q = 0; q < COLS; q++) {
          const cx = 5 + q * CELL + 10;
          R(x0, y, cx - row - x0, 1, BLUE);
          x0 = cx + row;
        }
      R(x0, y, 150 - x0, 1, BLUE);
    }
    R(0, 0, 150, 1, tone(BLUE, 0.3));
    R(0, 0, 1, 130, tone(BLUE, 0.2));
    R(149, 1, 1, 129, tone(BLUE, -0.25));
    R(0, 129, 150, 1, tone(BLUE, -0.3));
    R(2, 2, 146, 1, tone(BLUE, 0.12));
    R(14, 130, 22, 4, '#23263a');
    R(114, 130, 22, 4, '#23263a');
  })
);

export default {
  size: [W, H],
  how: 'TAP A COLUMN',
  pad: true,
  a: 'DROP',
  start(api) {
    const fx = createFx();
    const foe = makeLook(31337);
    let board,
      st = 'me',
      wait = 0,
      wins = 0,
      col = 3,
      hx = 3,
      target = 3,
      drop = null,
      win = null,
      mood = 'idle',
      msg = '',
      T = 0;
    const fresh = () => {
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
      st = 'me';
      win = null;
      mood = 'idle';
    };
    fresh();
    const full = () => board[0].every((v) => v);
    const start = (c, who) => {
      drop = { c, r: rowOf(board, c), y: HOVER, vy: 0, who, hit: 0 };
      st = 'drop';
    };
    const play = (c) => {
      if (st !== 'me' || c < 0 || c >= COLS || board[0][c]) return;
      col = c;
      hx = c;
      start(c, 'P');
    };
    const land = () => {
      const { c, r, who } = drop;
      board[r][c] = who;
      drop = null;
      const cells = line(board, r, c, who);
      if (cells) {
        win = cells;
        const [x, y] = [BX + c * CELL + 10, BY + r * CELL + 10];
        fx.burst(
          x,
          y,
          who === 'P' ? ['#e03131', '#ffd23f', '#fff'] : ['#ffd23f', '#fff6c8', '#fff'],
          22,
          90
        );
        fx.shake(4);
        wait = 1.8;
        if (who === 'P') {
          wins++;
          api.score(wins);
          st = 'won';
          mood = 'palm';
          msg = 'YOU WIN';
        } else {
          st = 'end';
          mood = 'cheer';
          msg = 'CPU WINS';
        }
      } else if (full()) {
        st = 'end';
        wait = 1.5;
        mood = 'idle';
        msg = 'DRAW';
      } else if (who === 'P') {
        st = 'think';
        wait = 0.8 + Math.random() * 0.5;
        target = pick(board);
        mood = 'think';
      } else {
        st = 'me';
        mood = 'idle';
      }
    };
    return {
      state: () => ({
        board: board.map((r) => r.slice()),
        st,
        wins,
        col,
        pick,
        line,
        win,
        cell: CELL,
        bx: BX,
        by: BY,
      }),
      tap(x) {
        play(Math.floor((x - BX) / CELL));
      },
      key(k) {
        if (st !== 'me') return;
        if (k === 'left') col = Math.max(0, col - 1);
        else if (k === 'right') col = Math.min(COLS - 1, col + 1);
        else if (k === 'a') play(col);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        if (st === 'me') hx += (col - hx) * Math.min(1, dt * 18);
        else if (st === 'think') hx += (target - hx) * Math.min(1, dt * 5);
        if (st === 'drop') {
          drop.vy += G * dt;
          drop.y += drop.vy * dt;
          const floor = BY + drop.r * CELL + 10;
          if (drop.y >= floor) {
            drop.y = floor;
            if (drop.vy > 70) {
              drop.vy = -drop.vy * 0.34;
              drop.hit++;
              fx.burst(BX + drop.c * CELL + 10, floor + 8, ['#8b90a8', '#fff'], 3, 20);
            } else {
              land();
            }
          }
          return;
        }
        if (st === 'me') return;
        wait -= dt;
        if (wait > 0) return;
        if (st === 'think') {
          hx = target;
          start(target, 'C');
        } else if (st === 'won') fresh();
        else if (st === 'end') api.over(wins);
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        // the games room wall and the low table
        R(-4, -4, W + 8, TABLE + 4, '#33265e');
        R(-4, -4, W + 8, 6, '#4b3a86');
        for (let x = 0; x < W; x += 20) R(x, 6, 1, TABLE - 6, '#2d2255');
        R(-4, TABLE, W + 8, 6, '#a8713f');
        R(-4, TABLE, W + 8, 1, '#d19a62');
        R(-4, TABLE + 6, W + 8, H - TABLE, '#5e3d24');
        for (let x = 12; x < W; x += 30) R(x, TABLE + 9, 1, H, '#4a2d18');
        R(BX - 3, TABLE + 1, 146, 2, 'rgba(18,19,42,.35)');
        // behind the plate: the wall seen through the holes, then every disc
        R(BX, BY, COLS * CELL, ROWS * CELL, '#241a4a');
        for (let r = 0; r < ROWS; r++)
          for (let q = 0; q < COLS; q++) {
            const v = board[r][q];
            if (!v) continue;
            const hot = win && win.some((w) => w[0] === r && w[1] === q);
            disc(R, BX + q * CELL + 10, BY + r * CELL + 10, v, hot && ((T * 6) | 0) % 2);
          }
        if (drop) disc(R, BX + drop.c * CELL + 10, Math.round(drop.y), drop.who);
        else if (st === 'me' || st === 'think') {
          const x = BX + Math.round(hx * CELL) + 10;
          if (st === 'think' || ((T * 3) | 0) % 2 || true)
            disc(R, x, HOVER + (((T * 4) | 0) % 2), st === 'me' ? 'P' : 'C');
        }
        c.drawImage(PLATE, BX - 6, BY - 6);
        if (win && ((T * 6) | 0) % 2)
          win.forEach(([r, q]) => {
            const cx = BX + q * CELL + 10,
              cy = BY + r * CELL + 10;
            for (let dy = -10; dy < 10; dy++) {
              const t = dy + 0.5,
                wo = Math.round(Math.sqrt(100 - t * t)),
                wi = Math.abs(dy + 0.5) < 8 ? Math.round(Math.sqrt(64 - t * t)) : 0;
              R(cx - wo, cy + dy, wo - wi, 1, '#fff');
              R(cx + wi, cy + dy, wo - wi, 1, '#fff');
            }
          });
        // the right column: score, the opponent's seat, whose turn
        label(c, 'WINS', PX, 6, '#9aa0c8');
        label(c, wins, PX, 12, '#ffd23f', 2);
        R(PX - 1, PY - 1, PW + 2, PH + 2, INK);
        R(PX, PY, PW, PH, '#4a3a86');
        R(PX, PY, PW, 4, '#5b4a9c');
        R(PX, PY + 4, PW, 50, '#33265e');
        for (let x = PX + 8; x < PX + PW; x += 14) R(x, PY + 5, 1, 49, '#2d2255');
        R(PX, PY + 54, PW, 2, '#4b3a86');
        R(PX, PY + 56, PW, PH - 56, '#2b2f52');
        const cx = PX + 30,
          pose = mood,
          f = frameOf(pose, T),
          blink = (T * 1000) % 4200 < 140;
        c.imageSmoothingEnabled = false;
        c.drawImage(
          sprite(foe, build(false), pose, 0, f, blink, true),
          cx - 26,
          PY - 6 + (pose === 'cheer' ? -2 * ((f % 6 < 3) | 0) : 0),
          52,
          88
        );
        R(PX + 2, PY + 38, 70, 3, '#d19a62');
        R(PX + 2, PY + 41, 70, 5, '#a8713f');
        R(PX + 2, PY + 46, 70, 1, '#6e4526');
        R(PX + 6, PY + 47, 4, 12, '#5e3d24');
        R(PX + 64, PY + 47, 4, 12, '#5e3d24');
        for (let i = 0; i < 6; i++) R(PX + 6 + i * 12, PY + 42 + (i % 2), 3, 1, '#c98a52');
        const bub = (fill) => {
          R(cx + 11, PY + 3, 32, 11, INK);
          R(cx + 12, PY + 4, 30, 9, fill);
          R(cx + 9, PY + 12, 3, 3, INK);
          R(cx + 10, PY + 12, 2, 2, fill);
        };
        if (st === 'think' || (drop && drop.who === 'C')) {
          bub('#f7f8fb');
          const n = ((T * 3) | 0) % 4;
          for (let i = 0; i < 3; i++) R(cx + 17 + i * 7, PY + 7, 3, 3, i < n ? INK : '#c9ccd8');
        } else if (mood === 'cheer') {
          bub('#ffd23f');
          label(c, 'GG!', cx + 27, PY + 6, INK, 1, 'center');
        } else if (mood === 'palm') {
          bub('#f7f8fb');
          label(c, 'OH NO', cx + 27, PY + 6, '#e03131', 1, 'center');
        }
        label(c, 'CPU', PX + 37, PY + PH - 9, '#9aa0c8', 1, 'center');
        // whose turn
        R(PX - 1, 105, PW + 2, 46, INK);
        R(PX, 106, PW, 44, '#1b1840');
        R(PX, 106, PW, 1, '#4b3a86');
        const who =
          st === 'me'
            ? 'P'
            : st === 'think' || (drop && drop.who === 'C')
              ? 'C'
              : win
                ? st === 'won'
                  ? 'P'
                  : 'C'
                : 'P';
        disc((x, y, w, h, k) => R(x, y, w, h, k), PX + 14, 123, who, false);
        const l1 =
            st === 'me'
              ? 'YOUR'
              : st === 'think' || (drop && drop.who === 'C')
                ? 'CPU'
                : msg.split(' ')[0],
          l2 =
            st === 'me'
              ? 'TURN'
              : st === 'think' || (drop && drop.who === 'C')
                ? 'THINKS'
                : msg.split(' ')[1] || '',
          tc = st === 'won' ? '#9ece6a' : st === 'end' ? '#ff9b9b' : '#f2ede2';
        label(c, l1, PX + 28, 116, tc);
        label(c, l2, PX + 28, 124, tc);
        label(c, st === 'me' ? 'TAP A COLUMN' : '', PX + 37, 140, '#7a84ad', 1, 'center');
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
      },
    };
  },
};
