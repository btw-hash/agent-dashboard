import { W, H, label, box, createFx } from './_px.js';

// Snake as a bright arcade screen: eat the bugs, grab the coffee for a rush, catch the star
// while it lasts. Walls and your own tail end the run.
const CELL = 8,
  COLS = 28,
  ROWS = 18,
  OX = 8,
  OY = 28;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export default {
  size: [W, H],
  how: 'D-PAD',
  pad: true,
  a: '',
  start(api) {
    const fx = createFx();
    let snake = [
        [14, 9],
        [13, 9],
        [12, 9],
      ],
      dir = DIRS.right,
      next = dir,
      acc = 0,
      T = 0,
      score = 0,
      rush = 0,
      dead = 0,
      bug = null,
      extra = null,
      extraIn = 7;
    const free = () => {
      let p;
      do p = [(Math.random() * COLS) | 0, (Math.random() * ROWS) | 0];
      while (
        snake.some((s) => s[0] === p[0] && s[1] === p[1]) ||
        (bug && bug[0] === p[0] && bug[1] === p[1])
      );
      return p;
    };
    bug = free();
    const px = (c) => [OX + c[0] * CELL, OY + c[1] * CELL];

    function turn(k) {
      const d = DIRS[k];
      if (d && (d[0] !== -dir[0] || d[1] !== -dir[1])) next = d;
    }
    function step() {
      dir = next;
      const h = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
      if (
        h[0] < 0 ||
        h[1] < 0 ||
        h[0] >= COLS ||
        h[1] >= ROWS ||
        snake.some((s) => s[0] === h[0] && s[1] === h[1])
      ) {
        dead = 0.001;
        fx.shake(7);
        const [x, y] = px(snake[0]);
        fx.burst(x + 4, y + 4, ['#fff', '#7cff6b', '#ff4fd8'], 22, 90);
        return;
      }
      snake.unshift(h);
      const [x, y] = px(h);
      if (h[0] === bug[0] && h[1] === bug[1]) {
        score += 1;
        fx.burst(x + 4, y + 4, ['#7cff6b', '#d6ffb8'], 8);
        fx.pop(x + 4, y - 4, '+1', '#d6ffb8');
        bug = free();
      } else if (extra && h[0] === extra.at[0] && h[1] === extra.at[1]) {
        const star = extra.kind === 'star';
        score += star ? 5 : 3;
        if (!star) rush = 4;
        fx.burst(x + 4, y + 4, star ? ['#ffd23f', '#fff6c8'] : ['#a8713f', '#fff'], 14, 70);
        fx.pop(x + 4, y - 4, star ? '+5' : 'RUSH +3', star ? '#ffd23f' : '#ffb347');
        extra = null;
        extraIn = 8 + Math.random() * 6;
        snake.pop();
      } else snake.pop();
      api.score(score);
    }

    return {
      state: () => ({ head: snake[0], dir, bug, len: snake.length, cols: COLS, rows: ROWS }),
      key: turn,
      tap(x, y) {
        const [hx, hy] = px(snake[0]),
          dx = x - hx - 4,
          dy = y - hy - 4;
        turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        if (dead) {
          dead += dt;
          if (dead > 1.3) api.over(score);
          return;
        }
        rush = Math.max(0, rush - dt);
        if (extra) {
          extra.left -= dt;
          if (extra.left <= 0) {
            extra = null;
            extraIn = 6 + Math.random() * 6;
          }
        } else {
          extraIn -= dt;
          if (extraIn <= 0)
            extra = { kind: Math.random() < 0.35 ? 'star' : 'coffee', at: free(), left: 6 };
        }
        acc += dt;
        const pace = Math.max(0.06, 0.14 - snake.length * 0.002) * (rush ? 0.68 : 1);
        while (acc > pace && !dead) {
          acc -= pace;
          step();
        }
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        box(c, -8, -8, W + 16, H + 16, '#140a2e');
        // marquee
        label(c, 'SNAKE', 8, 6, '#ff4fd8', 3);
        label(c, 'SNAKE', 9, 7, '#ffd0f4', 3);
        label(c, 'SCORE', W - 8, 5, '#7a84ad', 1, 'right');
        label(c, score, W - 8, 13, '#ffd23f', 2, 'right');
        if (rush) {
          box(c, 96, 8, 60, 9, '#3b2a1e');
          box(c, 97, 9, Math.round(58 * (rush / 4)), 7, '#ffb347');
          label(c, 'COFFEE RUSH', 126, 10, '#140a2e', 1, 'center');
        }
        // the field: a neon frame around a checkered night
        box(c, OX - 3, OY - 3, COLS * CELL + 6, ROWS * CELL + 6, '#ff4fd8');
        box(c, OX - 2, OY - 2, COLS * CELL + 4, ROWS * CELL + 4, '#39d3ff');
        box(c, OX - 1, OY - 1, COLS * CELL + 2, ROWS * CELL + 2, '#0b1030');
        for (let y = 0; y < ROWS; y++)
          for (let x = (y % 2) * 1; x < COLS; x += 2)
            box(c, OX + x * CELL, OY + y * CELL, CELL, CELL, '#111a44');
        // the bug wiggles its legs
        {
          const [x, y] = px(bug),
            w = ((T * 6) | 0) % 2;
          box(c, x + 1, y + 2, 6, 5, '#12132a');
          box(c, x + 2, y + 2, 4, 4, '#7cff6b');
          box(c, x + 3, y + 1, 2, 1, '#d6ffb8');
          box(c, x + w, y + 3, 1, 1, '#7cff6b');
          box(c, x + 7 - w, y + 3, 1, 1, '#7cff6b');
          box(c, x + 1 - w + 1, y + 6, 1, 1, '#7cff6b');
          box(c, x + 6 + w - 1, y + 6, 1, 1, '#7cff6b');
          box(c, x + 3, y + 3, 1, 1, '#12132a');
          box(c, x + 5, y + 3, 1, 1, '#12132a');
        }
        if (extra && (extra.left > 1.5 || ((T * 8) | 0) % 2)) {
          const [x, y] = px(extra.at);
          if (extra.kind === 'star') {
            box(c, x + 3, y, 2, 8, '#ffd23f');
            box(c, x, y + 3, 8, 2, '#ffd23f');
            box(c, x + 2, y + 2, 4, 4, '#fff6c8');
            box(c, x + 1, y + 1, 1, 1, '#ffd23f');
            box(c, x + 6, y + 1, 1, 1, '#ffd23f');
            box(c, x + 1, y + 6, 1, 1, '#ffd23f');
            box(c, x + 6, y + 6, 1, 1, '#ffd23f');
          } else {
            box(c, x + 1, y + 2, 5, 6, '#f2ede2');
            box(c, x + 1, y + 2, 5, 2, '#6e4526');
            box(c, x + 6, y + 3, 2, 3, '#f2ede2');
            box(c, x + 2 + (((T * 3) | 0) % 2), y, 1, 1, '#c8d3f5');
            box(c, x + 4 - (((T * 3) | 0) % 2), y - 1, 1, 1, '#c8d3f5');
          }
        }
        // the snake: tail first so the head sits on top
        const n = snake.length,
          gone = dead ? Math.floor((dead / 1.0) * n) : 0;
        for (let i = n - 1; i >= 0; i--) {
          if (dead && i >= n - gone) continue;
          const [x, y] = px(snake[i]),
            col = dead
              ? '#5d6480'
              : rush
                ? i % 2
                  ? '#ffb347'
                  : '#ffd23f'
                : i % 2
                  ? '#39d38a'
                  : '#7cff6b';
          box(c, x, y, CELL, CELL, '#12132a');
          box(c, x + 1, y + 1, CELL - 2, CELL - 2, col);
          box(c, x + 1, y + 1, CELL - 2, 1, dead ? '#8b90a8' : '#d6ffb8');
          if (i === 0) {
            // two eyes on the side the head is moving to
            const side = dir[0] > 0 || dir[1] > 0 ? 5 : 1;
            for (const o of [1, 5]) {
              const ex = dir[0] ? side : o,
                ey = dir[0] ? o : side;
              box(c, x + ex, y + ey, 2, 2, '#fff');
              box(c, x + ex + (dir[0] > 0 ? 1 : 0), y + ey + (dir[1] > 0 ? 1 : 0), 1, 1, '#12132a');
            }
          }
        }
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (dead > 0.4) {
          box(c, 56, 78, 128, 24, '#12132a');
          box(c, 57, 79, 126, 22, '#ff4fd8');
          box(c, 58, 80, 124, 20, '#12132a');
          label(c, 'GAME OVER', 120, 85, '#ffd0f4', 2, 'center');
        }
      },
    };
  },
};
