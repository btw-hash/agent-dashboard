import { INK } from '../../engine/pixel.js';
import { frameOf } from '../../art/people.js';
import { F } from '../../art/furniture.js';
import { W, H, label, box, makeLook, person, createFx } from './_px.js';

// Ping-pong, the table from above. First to five. You move the racket with the pointer or
// the d-pad, the CPU gets quicker with every point you score. The shadow under the ball shows
// how high it flies. Two of our people watch from a framed strip and react to every point.
const WIN = 5,
  STEP = 1 / 60,
  TX0 = 13,
  TX1 = 227,
  TY0 = 61,
  TY1 = 171,
  MX = 26,
  CX = 214,
  BR = 3,
  CE = 12.9,
  SP0 = 1.3,
  SPI = 0.1,
  HALF = 11,
  FLOOR = ['#46536a', '#414e64'];

function disc(c, cx, cy, r, col) {
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    box(c, cx - hw, cy + dy, hw * 2 + 1, 1, col);
  }
}
function racket(c, x, y, col, side) {
  disc(c, x + 2, y + 3, 7, 'rgba(18,19,42,.3)');
  box(c, x - side * 11 - 2, y - 3, 7, 6, INK);
  box(c, x - side * 11 - 1, y - 2, 5, 4, '#c28a52');
  disc(c, x, y, 8, INK);
  disc(c, x, y, 7, col);
  box(c, x - 4, y - 4, 3, 2, 'rgba(255,255,255,.45)');
}

export default {
  size: [W, H],
  how: 'POINTER',
  pad: true,
  a: 'SERVE',
  start(api) {
    const fx = createFx();
    const L = [makeLook(11), makeLook(222)];
    const ball = { x: 120, y: 116, vx: 0, vy: 0 };
    let py = 116,
      me = 116,
      cpu = 116,
      cerr = 0,
      ms = 0,
      cs = 0,
      st = 'serve',
      wait = 1.5,
      power = false,
      acc = 0,
      end = 0,
      cheer = 0,
      cheerWho = 0,
      z = 0,
      T = 0;
    const clampY = (y) => Math.max(TY0 + 9, Math.min(TY1 - 9, y));
    const serve = () => {
      if (st !== 'serve') return;
      st = 'play';
      const dir = Math.random() > 0.5 ? 1 : -1;
      ball.vx = dir * (1.9 + Math.random() * 0.6);
      ball.vy = (Math.random() - 0.5) * 1.2;
    };
    const point = (mine) => {
      if (mine) ms++;
      else cs++;
      api.score(ms);
      cheer = 1.4;
      cheerWho = mine ? 0 : 1;
      fx.shake(mine ? 3 : 4);
      fx.burst(ball.x, ball.y, mine ? ['#9ece6a', '#fff'] : ['#f7768e', '#fff'], 12, 70);
      ball.x = 120;
      ball.y = 116;
      ball.vx = ball.vy = 0;
      if (ms >= WIN || cs >= WIN) {
        st = 'end';
        end = 2;
      } else {
        st = 'serve';
        wait = 1.6;
      }
    };
    const step = () => {
      me = clampY(py);
      const d = ball.y + cerr - cpu;
      cpu += Math.sign(d) * Math.min(SP0 + ms * SPI, Math.abs(d));
      cpu = clampY(cpu);
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.y - BR < TY0) {
        ball.y = TY0 + BR;
        ball.vy = Math.abs(ball.vy);
      }
      if (ball.y + BR > TY1) {
        ball.y = TY1 - BR;
        ball.vy = -Math.abs(ball.vy);
      }
      if (
        ball.vx < 0 &&
        ball.x - BR < MX + 6 &&
        ball.x - BR > MX - 4 &&
        Math.abs(ball.y - me) < HALF
      ) {
        ball.x = MX + 6 + BR;
        ball.vx = Math.min(Math.abs(ball.vx) * (power ? 1.5 : 1.05), 6);
        ball.vy = ((ball.y - me) / HALF) * 1.8 + (Math.random() - 0.5) * 0.5;
        if (power) fx.pop(ball.x + 8, ball.y - 10, 'SMASH', '#ffd23f');
        power = false;
        cerr = (Math.random() * 2 - 1) * CE;
        fx.burst(ball.x, ball.y, ['#fff', '#7aa2f7'], 4, 40);
      }
      if (
        ball.vx > 0 &&
        ball.x + BR > CX - 6 &&
        ball.x + BR < CX + 4 &&
        Math.abs(ball.y - cpu) < HALF
      ) {
        ball.x = CX - 6 - BR;
        ball.vx = -Math.min(Math.abs(ball.vx) * 1.04, 6);
        ball.vy = ((ball.y - cpu) / HALF) * 1.8 + (Math.random() - 0.5) * 0.5;
        fx.burst(ball.x, ball.y, ['#fff', '#f7768e'], 4, 40);
      }
      if (ball.x < 8) point(false);
      else if (ball.x > 232) point(true);
    };
    const act = () => {
      if (st === 'serve') serve();
      else if (ball.x < 70) power = true;
    };

    return {
      state: () => ({ ball: { ...ball }, me, cpu, ms, cs, st, py }),
      move(x, y) {
        py = y;
      },
      key(k) {
        if (k === 'a') act();
      },
      tap(x, y) {
        py = y;
        act();
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        cheer = Math.max(0, cheer - dt);
        if (api.held('up')) py -= 100 * dt;
        if (api.held('down')) py += 100 * dt;
        py = Math.max(TY0, Math.min(TY1, py));
        if (st === 'end') {
          end -= dt;
          if (end <= 0) api.over(ms);
          return;
        }
        if (st === 'serve') {
          me = clampY(py);
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
        z = 1 + 10 * Math.abs(Math.sin(((ball.x - TX0 - 53) / 107) * Math.PI));
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        // the gym floor around the table
        for (let x = -8; x < W + 8; x += 16) box(c, x, 50, 16, H - 50, FLOOR[(x / 16) & 1]);
        // the table: shadow, frame, green top, the lines and the net
        box(c, 12, 62, 224, 120, 'rgba(18,19,42,.3)');
        box(c, 7, 55, 226, 122, INK);
        box(c, 8, 56, 224, 120, '#1f5a33');
        box(c, 8, 56, 224, 1, '#2f7a47');
        box(c, TX0 - 1, TY0 - 1, TX1 - TX0 + 3, TY1 - TY0 + 3, '#143d22');
        box(c, TX0, TY0, TX1 - TX0 + 1, TY1 - TY0 + 1, '#2f7a47');
        box(c, TX0, TY0, TX1 - TX0 + 1, 1, '#e9ffe9');
        box(c, TX0, TY1, TX1 - TX0 + 1, 1, '#e9ffe9');
        box(c, TX0, TY0, 1, TY1 - TY0 + 1, '#e9ffe9');
        box(c, TX1, TY0, 1, TY1 - TY0 + 1, '#e9ffe9');
        box(c, TX0, 116, TX1 - TX0 + 1, 1, '#e9ffe9');
        box(c, 119, TY0 - 4, 3, TY1 - TY0 + 9, INK);
        for (let y = TY0; y < TY1; y += 2) box(c, 120, y, 1, 1, y % 4 ? '#fff' : '#c9d0e8');
        box(c, 116, TY0 - 6, 9, 4, '#3a3f5c');
        box(c, 116, TY1 + 3, 9, 4, '#3a3f5c');
        // the ball and its shadow: the gap is the height
        if (st !== 'end' && (st !== 'serve' || ((T * 4) | 0) % 2 === 0)) {
          const h = st === 'play' ? Math.round(z) : 3;
          disc(c, ball.x, ball.y + 2, 3 - (h > 8 ? 1 : 0), 'rgba(18,19,42,.45)');
          disc(c, ball.x, ball.y - h, BR, INK);
          disc(c, ball.x, ball.y - h, BR - 1, '#fffbe8');
        }
        racket(c, MX, Math.round(me), '#3b5bdb', 1);
        racket(c, CX, Math.round(cpu), '#e03131', -1);
        if (st === 'serve') label(c, 'TAP TO SERVE', 120, 92, '#ffd23f', 1, 'center');
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        // the framed strip: our two spectators and the score board
        box(c, 3, 1, 234, 53, INK);
        box(c, 4, 2, 232, 51, '#35566b');
        for (let x = 10; x < 236; x += 20) box(c, x, 2, 1, 36, '#2f4d60');
        box(c, 4, 38, 232, 15, FLOOR[0]);
        box(c, 4, 38, 232, 1, '#5b6a86');
        c.drawImage(F.hoop, 62, 6);
        c.drawImage(F.hoop, 160, 6);
        box(c, 91, 5, 58, 40, INK);
        box(c, 92, 6, 56, 38, '#0b1030');
        box(c, 92, 6, 56, 1, '#39d3ff');
        label(c, 'YOU', 106, 10, '#7aa2f7', 1, 'center');
        label(c, 'CPU', 134, 10, '#f7768e', 1, 'center');
        label(c, ms, 106, 20, '#ffd23f', 3, 'center');
        label(c, cs, 134, 20, '#ffd23f', 3, 'center');
        label(c, '-', 120, 22, '#7a84ad', 2, 'center');
        label(c, 'FIRST TO ' + WIN, 120, 38, '#7a84ad', 1, 'center');
        [0, 1].forEach((i) => {
          const x = i ? 204 : 36,
            won = cheer > 0 && cheerWho === i,
            lost = cheer > 0 && cheerWho !== i,
            pose = won ? 'cheer' : lost ? 'palm' : 'idle';
          box(c, x - 7, 49, 14, 2, 'rgba(18,19,42,.3)');
          person(
            c,
            L[i],
            pose,
            won || lost ? 0 : i ? 3 : 2,
            frameOf(pose, T + i),
            x,
            50,
            (T * 1000 + i * 900) % 4200 < 140
          );
        });
        if (st === 'end') {
          box(c, 62, 96, 116, 34, INK);
          box(c, 63, 97, 114, 32, ms >= WIN ? '#2f9e44' : '#c0392b');
          label(c, ms >= WIN ? 'YOU WIN!' : 'CPU WINS', 120, 102, '#f7f8fb', 2, 'center');
          label(c, ms + ' - ' + cs, 120, 118, '#fff3a3', 1, 'center');
        }
      },
    };
  },
};
