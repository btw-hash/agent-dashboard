import { INK, tone, spr, inked, slab } from '../../engine/pixel.js';
import { W, H, label, box, createFx } from './_px.js';

// Bug sweeper on an arcade screen: the same 8x8 minesweeper with ten bugs hiding in it.
// Tap opens a cell, hold plants a flag, the d-pad moves the cursor and A opens. The first
// cell you open is always safe: the bugs are placed after it, away from it and its neighbours.
// Score is 100 minus the seconds on a win, 0 on a loss.
const N = 8,
  BUGS = 10,
  CELL = 16,
  OX = 8,
  OY = 30;
const NUM = [
  '',
  '#39d3ff',
  '#7cff6b',
  '#ffd23f',
  '#ff4fd8',
  '#ff8a3d',
  '#bb9af7',
  '#ff4060',
  '#ffffff',
];

const bugSprite = (f, col) =>
  inked(
    spr(12, 12, (R) => {
      const l = f ? 1 : 0;
      R(3, 0, 1, 2, '#ffd0f4');
      R(8, 0, 1, 2, '#ffd0f4');
      R(4, 1, 4, 3, '#3a1530');
      R(3, 3, 6, 8, col);
      R(2, 5, 8, 4, col);
      R(5, 4, 1, 7, tone(col, -0.3));
      R(3, 4, 6, 1, tone(col, 0.3));
      R(3, 6, 2, 2, '#2a0c1c');
      R(7, 8, 2, 2, '#2a0c1c');
      R(4, 2, 1, 1, '#fff');
      R(7, 2, 1, 1, '#fff');
      for (let i = 0; i < 3; i++) {
        const y = 4 + i * 2 + ((i + l) % 2);
        R(0, y, 2, 1, '#ffd0f4');
        R(10, y, 2, 1, '#ffd0f4');
      }
    })
  );
const BUG = [0, 1].map((f) => bugSprite(f, '#ff4f6d'));
const CAUGHT = [0, 1].map((f) => bugSprite(f, '#7cff6b'));

export default {
  size: [W, H],
  how: 'TAP AND HOLD',
  pad: true,
  a: 'OPEN',
  start(api) {
    const fx = createFx();
    const grid = Array.from({ length: N }, () => Array(N).fill(0)),
      shown = Array.from({ length: N }, () => Array(N).fill(false)),
      flag = Array.from({ length: N }, () => Array(N).fill(false)),
      seen = Array.from({ length: N }, () => Array(N).fill(false)),
      caught = Array.from({ length: N }, () => Array(N).fill(false));
    let st = 'play',
      time = 0,
      T = 0,
      cur = null,
      curT = 0,
      planted = false,
      bugs = [],
      hit = null,
      queue = [],
      qt = 0,
      done = 0,
      score = 0,
      msg = 'FIRST TAP IS SAFE';
    const inside = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
    const px = (r, c) => [OX + c * CELL, OY + r * CELL];

    function plant(r0, c0) {
      const free = [];
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
          if (Math.abs(r - r0) > 1 || Math.abs(c - c0) > 1) free.push([r, c]);
      for (let i = free.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [free[i], free[j]] = [free[j], free[i]];
      }
      bugs = free.slice(0, BUGS);
      bugs.forEach(([r, c]) => (grid[r][c] = -1));
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          if (grid[r][c] === -1) continue;
          let n = 0;
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++)
              if (inside(r + dr, c + dc) && grid[r + dr][c + dc] === -1) n++;
          grid[r][c] = n;
        }
      planted = true;
      msg = 'TAP OPENS  HOLD FLAGS';
    }
    const finish = (won) => {
      st = won ? 'win' : 'lose';
      score = won ? Math.max(0, Math.round(100 - time)) : 0;
      api.score(score);
      qt = 0.5;
      done = 0;
      if (won) {
        msg = 'ALL BUGS CAUGHT';
        queue = bugs.slice();
        for (let i = queue.length - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0;
          [queue[i], queue[j]] = [queue[j], queue[i]];
        }
      } else {
        msg = 'IT BIT YOU';
        queue = bugs
          .filter(([r, c]) => r !== hit[0] || c !== hit[1])
          .sort(
            (a, b) =>
              Math.hypot(a[0] - hit[0], a[1] - hit[1]) - Math.hypot(b[0] - hit[0], b[1] - hit[1])
          );
        fx.shake(7);
        const [x, y] = px(hit[0], hit[1]);
        fx.burst(x + 8, y + 8, ['#ff4f6d', '#fff', '#ffd23f'], 22, 90);
      }
    };
    const open = (r, c) => {
      if (!inside(r, c) || shown[r][c] || flag[r][c]) return;
      if (!planted) plant(r, c);
      shown[r][c] = true;
      const [x, y] = px(r, c);
      fx.burst(x + 8, y + 8, ['#39d3ff', '#3a4cad'], 2, 24);
      if (grid[r][c] === -1) {
        hit = [r, c];
        seen[r][c] = true;
        return finish(false);
      }
      if (grid[r][c] === 0)
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) if (dr || dc) open(r + dr, c + dc);
      if (st !== 'play') return;
      let hidden = 0;
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (!shown[a][b]) hidden++;
      if (hidden === BUGS) finish(true);
    };
    const at = (x, y) => [Math.floor((y - OY) / CELL), Math.floor((x - OX) / CELL)];

    return {
      state: () => ({
        st,
        planted,
        time,
        grid: planted ? grid.map((r) => r.slice()) : null,
        shown: shown.map((r) => r.slice()),
        flag: flag.map((r) => r.slice()),
        bugs,
        ox: OX,
        oy: OY,
        cell: CELL,
        n: N,
        done,
      }),
      tap(x, y) {
        const [r, c] = at(x, y);
        if (st !== 'play' || !inside(r, c)) return;
        cur = [r, c];
        curT = T;
        open(r, c);
      },
      hold(x, y) {
        const [r, c] = at(x, y);
        if (st !== 'play' || !inside(r, c) || shown[r][c]) return;
        cur = [r, c];
        curT = T;
        flag[r][c] = !flag[r][c];
        const [fx0, fy0] = px(r, c);
        fx.burst(fx0 + 8, fy0 + 6, ['#ff4fd8', '#ffd0f4'], 5, 30);
      },
      key(k) {
        if (st !== 'play') return;
        curT = T;
        if (!cur) cur = [0, 0];
        else if (k === 'up') cur = [Math.max(0, cur[0] - 1), cur[1]];
        else if (k === 'down') cur = [Math.min(N - 1, cur[0] + 1), cur[1]];
        else if (k === 'left') cur = [cur[0], Math.max(0, cur[1] - 1)];
        else if (k === 'right') cur = [cur[0], Math.min(N - 1, cur[1] + 1)];
        else if (k === 'a') open(cur[0], cur[1]);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        if (st === 'play') {
          time += dt;
          return;
        }
        qt -= dt;
        if (qt > 0) return;
        if (queue.length) {
          const [r, c] = queue.shift(),
            [x, y] = px(r, c);
          if (st === 'win') {
            caught[r][c] = true;
            fx.burst(x + 8, y + 8, ['#7cff6b', '#d6ffb8', '#fff'], 10, 60);
            qt = 0.24;
          } else {
            seen[r][c] = true;
            fx.burst(x + 8, y + 8, ['#ff4f6d', '#ffd0f4'], 6, 40);
            qt = 0.11;
          }
          done++;
        } else if (qt < -1.3) api.over(score);
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        R(-8, -8, W + 16, H + 16, '#140a2e');
        label(c, 'BUG SWEEPER', 8, 6, '#ff4fd8', 2);
        label(c, 'BUG SWEEPER', 9, 7, '#ffd0f4', 2);
        R(OX - 3, OY - 3, N * CELL + 6, N * CELL + 6, '#ff4fd8');
        R(OX - 2, OY - 2, N * CELL + 4, N * CELL + 4, '#39d3ff');
        R(OX - 1, OY - 1, N * CELL + 2, N * CELL + 2, '#0b1030');
        for (let r = 0; r < N; r++)
          for (let q = 0; q < N; q++) {
            const [x, y] = px(r, q),
              isHit = hit && hit[0] === r && hit[1] === q,
              wig = ((T * 14) | 0) % 2;
            if (shown[r][q] && !isHit) {
              R(x, y, CELL, CELL, '#0f1747');
              R(x, y, CELL, 1, '#0b1030');
              R(x, y, 1, CELL, '#0b1030');
              if (grid[r][q] > 0) label(c, grid[r][q], x + 5, y + 3, NUM[grid[r][q]], 2);
            } else if (isHit) {
              R(x, y, CELL, CELL, ((T * 8) | 0) % 2 ? '#ff3b5c' : '#b02040');
              c.drawImage(BUG[wig], x + 1 + (wig ? 1 : -1), y + 1 + (((T * 9) | 0) % 2));
            } else if (caught[r][q]) {
              R(x, y, CELL, CELL, '#103a2a');
              slab(R, x + 1, y + 1, 14, 14, '#1f7a4a');
              c.drawImage(CAUGHT[((T * 6) | 0) % 2], x + 1, y + 1);
              R(x + 1, y + 1, 14, 1, '#7cff6b');
              for (let i = 3; i < 14; i += 3) R(x + i, y + 1, 1, 14, 'rgba(124,255,107,.45)');
            } else if (seen[r][q]) {
              R(x, y, CELL, CELL, '#2a1030');
              c.drawImage(BUG[((T * 5 + r + q) | 0) % 2], x + 1, y + 1);
            } else {
              R(x, y, CELL, CELL, '#0b1030');
              slab(R, x + 1, y + 1, 14, 14, (r + q) % 2 ? '#3a4cad' : '#3446a0');
              if (flag[r][q]) {
                R(x + 6, y + 3, 1, 10, '#c8d3f5');
                R(x + 7, y + 3, 6, 5, '#ff4fd8');
                R(x + 7, y + 3, 6, 1, '#ffd0f4');
                R(x + 4, y + 12, 6, 1, INK);
                if (st === 'lose' && planted && grid[r][q] !== -1) {
                  R(x + 2, y + 2, 12, 12, 'rgba(255,40,70,.55)');
                  label(c, 'X', x + 7, y + 5, '#fff');
                }
              }
            }
          }
        if (cur && st === 'play' && T - curT < 3.5) {
          const [x, y] = px(cur[0], cur[1]),
            k = ((T * 5) | 0) % 2 ? '#ffd23f' : '#fff6c8';
          R(x, y, CELL, 2, k);
          R(x, y + CELL - 2, CELL, 2, k);
          R(x, y, 2, CELL, k);
          R(x + CELL - 2, y, 2, CELL, k);
        }
        // the side panel
        const PX = 150,
          flags = flag.flat().filter(Boolean).length;
        R(PX, OY - 3, 82, N * CELL + 6, '#ff4fd8');
        R(PX + 1, OY - 2, 80, N * CELL + 4, '#39d3ff');
        R(PX + 2, OY - 1, 78, N * CELL + 2, '#0b1030');
        label(c, 'TIME', PX + 8, OY + 5, '#7a84ad');
        label(c, Math.floor(time), PX + 74, OY + 14, '#ffd23f', 2, 'right');
        label(c, 'BUGS LEFT', PX + 8, OY + 34, '#7a84ad');
        label(c, Math.max(0, BUGS - flags), PX + 74, OY + 43, '#ff4fd8', 2, 'right');
        R(PX + 20, OY + 64, 42, 42, '#12132a');
        R(PX + 21, OY + 65, 40, 40, '#1b2260');
        R(PX + 22, OY + 66, 38, 38, '#0f1747');
        const bw = st === 'win' ? CAUGHT : BUG,
          mf = ((T * (st === 'lose' ? 12 : st === 'win' ? 8 : 3)) | 0) % 2,
          bob = st === 'win' ? Math.round(Math.sin(T * 10) * 2) : 0,
          bs = bw[mf];
        c.imageSmoothingEnabled = false;
        c.drawImage(bs, PX + 41 - 14, OY + 85 - 14 + bob, 28, 28);
        label(
          c,
          st === 'play' ? 'WANTED' : st === 'win' ? 'CAUGHT' : 'BUSTED',
          PX + 41,
          OY + 110,
          '#9aa0c8',
          1,
          'center'
        );
        label(
          c,
          msg,
          120,
          164,
          st === 'win' ? '#7cff6b' : st === 'lose' ? '#ff4f6d' : '#9aa0c8',
          1,
          'center'
        );
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (st !== 'play' && queue.length === 0 && qt < 0) {
          R(54, 72, 132, 28, '#12132a');
          R(55, 73, 130, 26, st === 'win' ? '#7cff6b' : '#ff4fd8');
          R(56, 74, 128, 24, '#12132a');
          label(
            c,
            st === 'win' ? 'CLEARED' : 'GAME OVER',
            120,
            80,
            st === 'win' ? '#d6ffb8' : '#ffd0f4',
            2,
            'center'
          );
          label(c, 'SCORE ' + score, 120, 91, '#ffd23f', 1, 'center');
        }
      },
    };
  },
};
