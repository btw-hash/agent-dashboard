import { INK } from '../../engine/pixel.js';
import { W, H, label, box, createFx } from './_px.js';

// Reaction test as a traffic light: five rounds. Red, then amber, then after a random wait
// green: tap as fast as you can. A tap before green is a false start and counts 600 MS.
// The score is the average of the five rounds, lower is better.
const ROUNDS = 5,
  FAIL = 600,
  LX = 28,
  LY = 22,
  LW = 44,
  LAMP = [
    { y: 48, on: '#ff3b3b', off: '#4a1a22', halo: '#7a2330' },
    { y: 86, on: '#ffb52e', off: '#4a3a1a', halo: '#7a5a23' },
    { y: 124, on: '#39e87a', off: '#173a2a', halo: '#237a4a' },
  ];

function disc(c, cx, cy, r, col) {
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    box(c, cx - hw, cy + dy, hw * 2 + 1, 1, col);
  }
}

export default {
  size: [W, H],
  how: 'TAP ON GREEN',
  a: 'TAP',
  low: true,
  unit: ' MS',
  start(api) {
    const fx = createFx();
    const res = [];
    let round = 0,
      phase = 'red',
      t = 0,
      wait = 1 + Math.random() * 2.4,
      shown = 0,
      grade = ['', '#fff'],
      down = false,
      fin = 0,
      avg = 0,
      T = 0;

    function done(ms, label2, col) {
      res.push(ms);
      phase = 'result';
      t = 0;
      shown = ms;
      avg = Math.round(res.reduce((a, b) => a + b, 0) / res.length);
      api.score(avg);
      grade = [label2, col];
      if (ms >= FAIL) fx.shake(5);
      else fx.burst(LX + LW / 2, LAMP[2].y, ['#39e87a', '#d6ffb8', '#ffd23f'], 14, 80);
    }
    function hit() {
      if (fin || phase === 'result') return;
      if (phase === 'go') {
        const ms = Math.max(1, Math.round(t * 1000));
        done(ms, ms < 250 ? 'FAST!' : ms < 400 ? 'GOOD' : 'SLOW', ms < 250 ? '#ffd23f' : '#d6ffb8');
      } else done(FAIL, 'TOO SOON!', '#ff3b3b');
    }

    return {
      state: () => ({ phase, t, round, res: res.slice(), avg, wait }),
      key(k) {
        if (k === 'a') hit();
      },
      move(x, y, d) {
        if (d && !down) {
          down = true;
          hit();
        } else if (!d) down = false;
      },
      tap() {
        if (down) down = false;
        else hit();
      },
      hold() {
        down = false;
      },
      tick(dt) {
        T += dt;
        t += dt;
        fx.tick(dt);
        if (fin) {
          fin -= dt;
          if (fin <= 0) api.over(avg);
          return;
        }
        if (phase === 'red' && t >= 0.9) {
          phase = 'amber';
          t = 0;
        } else if (phase === 'amber' && t >= wait) {
          phase = 'go';
          t = 0;
        } else if (phase === 'go' && t >= 1.6) done(FAIL, 'TOO SLOW!', '#ff3b3b');
        else if (phase === 'result' && t >= 1.3) {
          round++;
          if (round >= ROUNDS) {
            fin = 2;
            phase = 'end';
            fx.burst(120, 90, ['#ffd23f', '#ff4fd8', '#39d3ff'], 24, 90);
          } else {
            phase = 'red';
            t = 0;
            wait = 1 + Math.random() * 2.4;
          }
        }
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        box(
          c,
          -8,
          -8,
          W + 16,
          H + 16,
          phase === 'go' ? '#0a2a1c' : phase === 'result' && shown >= FAIL ? '#2a0a1a' : '#140a2e'
        );
        label(c, 'REACTION', 8, 6, '#39d3ff', 2);
        label(
          c,
          'ROUND ' + Math.min(round + 1, ROUNDS) + ' OF ' + ROUNDS,
          W - 8,
          8,
          '#7a84ad',
          1,
          'right'
        );
        // the traffic light on its pole
        box(c, LX + LW / 2 - 4, LY + 130, 8, 40, INK);
        box(c, LX + LW / 2 - 3, LY + 130, 6, 40, '#3a3f5c');
        box(c, LX - 2, LY - 2, LW + 4, 134, INK);
        box(c, LX, LY, LW, 130, '#2a2e44');
        box(c, LX, LY, LW, 2, '#5a6090');
        box(c, LX + LW - 2, LY + 2, 2, 128, '#1c2036');
        const lit =
          phase === 'red'
            ? 0
            : phase === 'amber'
              ? 1
              : phase === 'go'
                ? 2
                : phase === 'result'
                  ? shown >= FAIL
                    ? 0
                    : 2
                  : -1;
        LAMP.forEach((l, i) => {
          const cx = LX + LW / 2,
            on = i === lit && (phase !== 'result' || shown < FAIL || ((T * 8) | 0) % 2 === 0);
          box(c, cx - 15, l.y - 18, 30, 3, INK);
          disc(c, cx, l.y, 14, INK);
          disc(c, cx, l.y, 12, on ? l.halo : '#1c2036');
          disc(c, cx, l.y, 10, on ? l.on : l.off);
          if (on) {
            box(c, cx - 6, l.y - 6, 4, 2, '#fff');
            box(c, cx - 7, l.y - 4, 2, 2, '#fff');
          }
        });
        // the five results as they come
        box(c, 98, 26, 134, 112, '#ff4fd8');
        box(c, 99, 27, 132, 110, '#39d3ff');
        box(c, 100, 28, 130, 108, '#0b1030');
        for (let i = 0; i < ROUNDS; i++) {
          const y = 32 + i * 21,
            v = res[i],
            cur = i === round && !fin;
          if (cur) box(c, 102, y - 2, 126, 19, '#1b2552');
          label(c, 'R' + (i + 1), 106, y, cur ? '#ffd23f' : '#7a84ad');
          if (v === undefined) {
            label(c, '---', 226, y, '#3a4170', 1, 'right');
            box(c, 106, y + 8, 118, 5, '#141b44');
          } else {
            const bad = v >= FAIL;
            label(
              c,
              bad ? 'FALSE START' : v + ' MS',
              226,
              y,
              bad ? '#ff6b6b' : '#d6ffb8',
              1,
              'right'
            );
            box(c, 106, y + 8, 118, 5, '#141b44');
            box(
              c,
              106,
              y + 8,
              Math.max(2, Math.round((118 * Math.min(v, FAIL)) / FAIL)),
              5,
              bad ? '#ff3b3b' : v < 250 ? '#39e87a' : v < 400 ? '#ffd23f' : '#ff8a3d'
            );
          }
        }
        // the call: what the light means right now
        box(c, 98, 144, 134, 30, '#ff4fd8');
        box(c, 99, 145, 132, 28, '#39d3ff');
        box(c, 100, 146, 130, 26, '#0b1030');
        const msg =
          phase === 'red'
            ? ['WAIT', '#ff6b6b']
            : phase === 'amber'
              ? ['GET READY', '#ffb52e']
              : phase === 'go'
                ? ['TAP NOW!', '#39e87a']
                : phase === 'end'
                  ? ['AVERAGE', '#ffd23f']
                  : shown >= FAIL
                    ? ['FALSE START', '#ff6b6b']
                    : [shown + ' MS', '#d6ffb8'];
        label(
          c,
          msg[0],
          165,
          phase === 'end' ? 150 : phase === 'result' || phase === 'go' ? 152 : 155,
          msg[1],
          phase === 'go' || phase === 'result' ? 2 : 1,
          'center'
        );
        if (phase === 'go')
          label(c, Math.round(t * 1000) + ' MS', 165, 166, '#d6ffb8', 1, 'center');
        if (phase === 'result') label(c, grade[0], 165, 166, grade[1], 1, 'center');
        if (phase === 'end') label(c, avg + ' MS', 165, 160, '#fff', 2, 'center');
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
      },
    };
  },
};
