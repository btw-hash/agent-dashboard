import { INK, tone } from '../../engine/pixel.js';
import { frameOf } from '../../art/people.js';
import { catSprite } from '../../art/pets.js';
import { SCENE_W as W, SCENE_H as H, label, box, makeLook, person, createFx } from './_px.js';

// The crystal ball shows a row of signs, one longer each round; give them back in the same
// order. One wrong card and the vision is gone.
// A scene at office proportions: the seer and the cat are as big as in the office and take a
// third of the screen, the ball is about the size of a head. The four cards are the
// interface and may be large.
const CX = 76,
  CY = 40,
  RAD = 9;
const CARDS = [
  { key: 'up', x: 76, y: 13, col: '#ffd23f', name: 'SUN' },
  { key: 'left', x: 48, y: 40, col: '#7aa2f7', name: 'MOON' },
  { key: 'right', x: 104, y: 40, col: '#9ece6a', name: 'LEAF' },
  { key: 'down', x: 76, y: 67, col: '#f7768e', name: 'HEART' },
];
const SIGN = [
  (R, x, y, c) => {
    R(x + 3, y + 3, 6, 6, c);
    R(x + 5, y, 2, 2, c);
    R(x + 5, y + 10, 2, 2, c);
    R(x, y + 5, 2, 2, c);
    R(x + 10, y + 5, 2, 2, c);
    R(x + 1, y + 1, 1, 1, c);
    R(x + 10, y + 1, 1, 1, c);
    R(x + 1, y + 10, 1, 1, c);
    R(x + 10, y + 10, 1, 1, c);
  },
  (R, x, y, c) => {
    R(x + 3, y + 1, 6, 10, c);
    R(x + 1, y + 3, 10, 6, c);
    R(x + 5, y + 1, 5, 7, '#fbf6ea');
    R(x + 6, y + 2, 5, 5, '#fbf6ea');
  },
  (R, x, y, c) => {
    R(x + 4, y + 1, 5, 2, c);
    R(x + 2, y + 3, 8, 4, c);
    R(x + 3, y + 7, 6, 2, c);
    R(x + 5, y + 2, 1, 9, tone(c, -0.3));
    R(x + 5, y + 9, 2, 3, tone(c, -0.3));
  },
  (R, x, y, c) => {
    R(x + 1, y + 2, 4, 4, c);
    R(x + 7, y + 2, 4, 4, c);
    R(x + 1, y + 4, 10, 3, c);
    R(x + 2, y + 7, 8, 2, c);
    R(x + 4, y + 9, 4, 1, c);
    R(x + 5, y + 10, 2, 1, c);
  },
];

export default {
  size: [W, H],
  how: 'REPEAT THE SIGNS',
  pad: true,
  a: '',
  start(api) {
    const fx = createFx();
    const seer = makeLook(90210);
    const seq = [],
      lit = [0, 0, 0, 0];
    let state = 'rest',
      t = 0.9,
      pos = 0,
      round = 0,
      show = -1,
      idle = 0,
      T = 0;
    const on = () => Math.max(0.22, 0.5 - round * 0.02);

    function press(i) {
      if (state !== 'input') return;
      lit[i] = 0.22;
      idle = 0;
      if (i !== seq[pos]) {
        state = 'fail';
        t = 1.6;
        fx.shake(4);
        fx.burst(CX, CY, ['#5c4a8a', '#bb9af7', '#fff'], 14, 50);
        return;
      }
      pos++;
      if (pos < seq.length) return;
      round++;
      api.score(round);
      state = 'won';
      t = 0.9;
      fx.burst(CX, CY, ['#ffd23f', '#9ece6a', '#7aa2f7', '#f7768e'], 12, 45);
    }

    return {
      state: () => ({ state, seq: seq.slice(), pos, round }),
      key(k) {
        const i = CARDS.findIndex((c) => c.key === k);
        if (i >= 0) press(i);
      },
      tap(x, y) {
        let best = -1,
          d = 18;
        CARDS.forEach((c, i) => {
          const q = Math.hypot(x - c.x, y - c.y);
          if (q < d) {
            d = q;
            best = i;
          }
        });
        if (best >= 0) press(best);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        for (let i = 0; i < 4; i++) lit[i] = Math.max(0, lit[i] - dt);
        t -= dt;
        if (state === 'rest' || state === 'won') {
          if (t <= 0) {
            seq.push((Math.random() * 4) | 0);
            state = 'show';
            show = -1;
            t = 0.3;
          }
        } else if (state === 'show') {
          if (t <= 0) {
            show++;
            if (show >= seq.length) {
              state = 'input';
              pos = 0;
              idle = 0;
            } else {
              lit[seq[show]] = on();
              t = on() + 0.14;
            }
          }
        } else if (state === 'input') {
          idle += dt;
          if (idle > 5) {
            state = 'fail';
            t = 1.6;
            fx.shake(4);
          }
        } else if (state === 'fail' && t <= 0) api.over(round);
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        const glow = lit.findIndex((v) => v > 0),
          fail = state === 'fail';
        // the lounge wall, curtains and carpet
        R(-4, -4, W + 8, 78, '#4a1f33');
        for (let y = 4; y < 70; y += 12)
          for (let x = ((y / 12) % 2) * 8 - 4; x < W; x += 16) {
            R(x + 1, y, 2, 1, '#5a2238');
            R(x, y + 1, 4, 1, '#5a2238');
            R(x + 1, y + 2, 2, 1, '#5a2238');
          }
        R(-4, 72, W + 8, 2, '#e0af68');
        R(-4, 74, W + 8, H - 74 + 4, '#5a2238');
        for (let x = 4; x < W; x += 12) R(x, 78 + ((x / 12) % 2) * 6, 3, 2, '#73304d');
        [0, W - 6].forEach((x) => {
          R(x, 0, 6, 72, '#74344f');
          R(x + 2, 0, 1, 72, '#4a1f33');
          R(x + 4, 0, 1, 72, '#4a1f33');
          R(x, 0, 6, 3, '#e0af68');
        });
        // the cards float around the ball
        CARDS.forEach((k, i) => {
          const hot = lit[i] > 0,
            bob = Math.round(Math.sin(T * 1.6 + i * 1.7)) - (hot ? 1 : 0),
            x = k.x - 10,
            y = k.y - 12 + bob,
            turn = state === 'input' && !hot;
          if (hot) {
            c.fillStyle = k.col;
            c.globalAlpha = 0.35;
            c.fillRect(x - 2, y - 2, 24, 28);
            c.globalAlpha = 1;
          }
          R(x - 1, y - 1, 22, 26, hot ? '#fff' : INK);
          R(x, y, 20, 24, hot ? tone(k.col, 0.35) : '#fbf6ea');
          R(x, y, 20, 1, k.col);
          R(x, y + 23, 20, 1, k.col);
          SIGN[i](R, x + 4, y + 3, hot ? '#fff' : k.col);
          label(
            c,
            k.name,
            x + 10,
            y + 17,
            hot ? '#fff' : turn ? '#3a3f5c' : '#aab0c8',
            1,
            'center'
          );
        });
        // the ball, about the size of a head
        const by = CY + Math.round(Math.sin(T * 1.2)),
          inner = fail ? '#23263a' : glow >= 0 ? CARDS[glow].col : '#7b6bb0';
        for (let dy = -RAD - 1; dy <= RAD + 1; dy++) {
          const w = Math.round(Math.sqrt((RAD + 1) ** 2 - dy * dy));
          R(CX - w, by + dy, w * 2, 1, INK);
        }
        for (let dy = -RAD; dy <= RAD; dy++) {
          const w = Math.round(Math.sqrt(RAD * RAD - dy * dy));
          R(CX - w, by + dy, w * 2, 1, fail ? '#3a3f5c' : '#5c4a8a');
        }
        for (let dy = -RAD + 2; dy <= RAD - 2; dy++) {
          const w = Math.round(Math.sqrt((RAD - 2) ** 2 - dy * dy));
          R(CX - w, by + dy, w * 2, 1, inner);
        }
        if (!fail) {
          for (let i = 0; i < 3; i++) {
            const a = T * (0.9 + i * 0.2) + i * 1.3,
              r = 2 + i * 1.6;
            R(
              CX + Math.round(Math.cos(a) * r),
              by + Math.round(Math.sin(a) * r * 0.7),
              1,
              1,
              '#e9d9ff'
            );
          }
          R(CX - 5, by - 6, 2, 1, '#fff');
          R(CX - 6, by - 5, 1, 2, '#fff');
        } else {
          R(CX - 4, by - 5, 1, 5, INK);
          R(CX - 3, by - 1, 3, 1, INK);
          R(CX, by, 1, 5, INK);
          R(CX + 3, by - 4, 1, 7, INK);
        }
        // the seer on the left, the cat on the carpet
        const pose =
            state === 'fail'
              ? 'palm'
              : state === 'won'
                ? 'cheer'
                : state === 'show'
                  ? 'think'
                  : 'idle',
          f = frameOf(pose, T);
        R(11, 86, 12, 2, 'rgba(18,19,42,.35)');
        person(c, seer, pose, 0, f, 17, 86, (T * 1000) % 4200 < 140);
        R(96, 87, 14, 2, 'rgba(18,19,42,.35)');
        c.drawImage(catSprite(((T * 2) | 0) % 2, true, true), 94, 75);
        // hud, in the free corner above the seer
        label(c, 'ROUND ' + (round + 1), 9, 4, '#e0af68');
        const msg =
          state === 'show' ? 'WATCH' : state === 'input' ? 'YOUR TURN' : fail ? 'VISION LOST' : '';
        label(c, msg, 9, 11, fail ? '#f7768e' : state === 'input' ? '#9ece6a' : '#c8d3f5');
        for (let i = 0; i < seq.length; i++)
          R(
            9 + (i % 8) * 4,
            18 + ((i / 8) | 0) * 4,
            3,
            3,
            state === 'input' && i < pos ? '#9ece6a' : '#74344f'
          );
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
      },
    };
  },
};
