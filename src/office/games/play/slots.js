import { spr, inked, INK } from '../../engine/pixel.js';
import { F } from '../../art/furniture.js';
import { frameOf } from '../../art/people.js';
import { catSprite, gooseSprite } from '../../art/pets.js';
import { SCENE_W as W, SCENE_H as H, label, box, makeLook, person, createFx } from './_px.js';
import { hitButton, lounge, panel, drawBtns, plate, bubble, blinks } from './_cards.js';

// The slot machine close up. Ten rounds. Spin once, then hold up to two reels and spin again (or take
// the first result): the last result pays. Three of a kind pays by symbol, any pair pays 3.
// A person stands by the machine in the lounge and reacts.
const ROUNDS = 10;
const PAY = [50, 30, 20, 20, 20, 20];
const RX = [4, 31, 58],
  RY = 53,
  RW = 24,
  RH = 22,
  STEP = 22;
const SPEED = 15;

const ART = [
  inked(
    spr(16, 16, (R) => {
      const g = '#ffd23f';
      [
        [7, 2],
        [7, 2],
        [6, 4],
        [6, 4],
        [1, 14],
        [2, 12],
        [3, 10],
        [4, 8],
        [4, 8],
        [3, 10],
      ].forEach((r, y) => R(r[0], y + 1, r[1], 1, g));
      R(3, 11, 4, 3, g);
      R(9, 11, 4, 3, g);
      R(2, 13, 3, 2, g);
      R(11, 13, 3, 2, g);
      R(6, 4, 2, 3, '#fff6c8');
      R(3, 6, 3, 1, '#fff6c8');
      R(8, 9, 3, 3, '#b8901f');
    })
  ),
  catSprite(0, true, true),
  inked(
    spr(16, 16, (R) => {
      R(2, 5, 9, 9, '#f2ede2');
      R(2, 5, 9, 1, '#fff');
      R(2, 9, 9, 2, '#3b5bdb');
      R(3, 5, 7, 2, '#6e4526');
      R(11, 7, 4, 2, '#f2ede2');
      R(13, 9, 2, 3, '#f2ede2');
      R(11, 12, 4, 2, '#f2ede2');
      R(2, 13, 9, 1, '#c9c0ae');
      R(4, 1, 1, 3, '#c8d3f5');
      R(7, 0, 1, 4, '#c8d3f5');
    })
  ),
  gooseSprite(0, false),
  inked(
    spr(16, 16, (R) => {
      for (let dy = -7; dy <= 7; dy++) {
        const w = Math.round(Math.sqrt(7.5 * 7.5 - dy * dy));
        R(8 - w, 8 + dy, w * 2, 1, '#d9a05b');
        const v = Math.round(Math.sqrt(5.5 * 5.5 - dy * dy));
        if (Math.abs(dy) <= 5) R(8 - v, 8 + dy, v * 2, 1, '#ffd96b');
      }
      for (let i = 2; i < 14; i++) {
        R(i, 8, 1, 1, '#d9a05b');
        R(8, i, 1, 1, '#d9a05b');
      }
      R(4, 4, 2, 2, '#c0392b');
      R(10, 5, 2, 2, '#c0392b');
      R(5, 10, 2, 2, '#c0392b');
      R(10, 10, 2, 2, '#c0392b');
    })
  ),
  inked(
    spr(16, 16, (R) => {
      const g = '#7cff6b';
      R(4, 4, 8, 9, g);
      R(3, 6, 10, 5, g);
      R(5, 2, 6, 3, '#39d38a');
      R(5, 0, 1, 3, g);
      R(10, 0, 1, 3, g);
      [6, 9, 12].forEach((y) => {
        R(0, y, 3, 1, g);
        R(13, y, 3, 1, g);
      });
      R(7, 7, 2, 2, '#39d38a');
      R(6, 3, 1, 1, INK);
      R(9, 3, 1, 1, INK);
      R(5, 5, 6, 1, '#d6ffb8');
    })
  ),
];
const evaluate = (r) =>
  r[0] === r[1] && r[1] === r[2]
    ? PAY[r[0]]
    : r[0] === r[1] || r[1] === r[2] || r[0] === r[2]
      ? 3
      : 0;
const ease = (t) => 1 - (1 - t) ** 3;

export default {
  size: [W, H],
  how: 'HOLD REELS',
  pad: true,
  a: 'SPIN',
  start(api) {
    const fx = createFx();
    const L = makeLook();
    const reels = [0, 1, 2].map((i) => ({
      sym: i * 2,
      pos: i * 2,
      mode: 'rest',
      t: 0,
      stop: 0,
      from: 0,
      to: 0,
      hold: false,
    }));
    let phase = 'ready',
      round = 0,
      credits = 0,
      cursor = 0,
      T = 0,
      wait = 0,
      cel = null,
      said = null,
      fin = 0,
      pressed = '',
      pressT = 0,
      win = 0;

    const holds = () => reels.filter((r) => r.hold).length;
    const btns = () => [
      {
        id: 'spin',
        label: 'SPIN',
        x: 88,
        y: 53,
        w: 28,
        h: 11,
        col: '#e0af68',
        on: phase === 'ready' || phase === 'hold',
      },
      {
        id: 'take',
        label: 'TAKE',
        x: 88,
        y: 66,
        w: 28,
        h: 11,
        col: '#9ece6a',
        on: phase === 'hold',
      },
    ];
    const say = (s, left = 1.6) => (said = { s, left });
    const spinReels = () => {
      reels.forEach((r, i) => {
        if (r.hold) return;
        r.sym = (Math.random() * 6) | 0;
        r.mode = 'run';
        r.t = 0;
        r.stop = 0.75 + i * 0.32;
      });
      cel = null;
    };
    const settled = () => reels.every((r) => r.mode === 'rest');
    const pay = () => {
      const w = evaluate(reels.map((r) => r.sym));
      win = w;
      credits += w;
      api.score(credits);
      phase = 'result';
      wait = 1.3;
      if (w) {
        cel = { pose: 'cheer', left: 1.5 };
        say(w >= 20 ? 'JACKPOT ' + w : 'PAIR ' + w);
        fx.burst(59, 64, ['#ffd23f', '#fff6c8', '#ff8a3d'], 18, 80);
        fx.shake(w >= 20 ? 3 : 1);
      } else {
        cel = { pose: 'palm', left: 1.5 };
        say('NO LUCK');
      }
      reels.forEach((r) => (r.hold = false));
    };
    const act = (id) => {
      pressed = id;
      pressT = 0.12;
      if (id === 'spin' && phase === 'ready') {
        round++;
        reels.forEach((r) => (r.hold = false));
        spinReels();
        phase = 'spin1';
        said = null;
      } else if (id === 'spin' && phase === 'hold') {
        spinReels();
        phase = 'spin2';
        said = null;
      } else if (id === 'take' && phase === 'hold') pay();
    };
    const toggle = (i) => {
      if (phase !== 'hold') return;
      cursor = i;
      if (!reels[i].hold && holds() >= 2) return say('MAX 2', 1);
      reels[i].hold = !reels[i].hold;
    };
    api.score(0);

    return {
      state: () => ({
        phase,
        round,
        credits,
        syms: reels.map((r) => r.sym),
        holds: reels.map((r) => r.hold),
        buttons: btns().map((b) => ({ id: b.id, on: b.on, x: b.x + b.w / 2, y: b.y + b.h / 2 })),
        reels: RX.map((x) => [x + RW / 2, RY + RH / 2]),
      }),
      key(k) {
        if (k === 'a') act('spin');
        else if (phase === 'hold') {
          if (k === 'left') cursor = (cursor + 2) % 3;
          else if (k === 'right') cursor = (cursor + 1) % 3;
          else if (k === 'up') toggle(cursor);
          else if (k === 'down') act('take');
        }
      },
      tap(x, y) {
        const b = hitButton(btns(), x, y);
        if (b) return act(b.id);
        if (y >= RY && y <= 86) {
          const i = RX.findIndex((rx) => x >= rx && x < rx + RW);
          if (i >= 0) toggle(i);
        }
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        pressT -= dt;
        if (said && (said.left -= dt) <= 0) said = null;
        if (cel && (cel.left -= dt) <= 0) cel = null;
        reels.forEach((r) => {
          if (r.mode === 'run') {
            r.t += dt;
            r.pos += SPEED * dt;
            if (r.t >= r.stop) {
              const base = Math.ceil(r.pos);
              r.from = r.pos;
              r.to = base + ((((r.sym - base) % 6) + 6) % 6) + 6;
              r.mode = 'stop';
              r.t = 0;
            }
          } else if (r.mode === 'stop') {
            r.t += dt;
            const k = Math.min(1, r.t / 0.5);
            r.pos = r.from + (r.to - r.from) * ease(k);
            if (k >= 1) {
              r.mode = 'rest';
              r.pos = r.to % 6;
            }
          }
        });
        if ((phase === 'spin1' || phase === 'spin2') && settled()) {
          if (phase === 'spin1') {
            phase = 'hold';
            cursor = 0;
            cel = { pose: 'think', left: 99 };
            say('HOLD 2', 99);
          } else pay();
        }
        if (phase === 'hold' && !cel) cel = { pose: 'think', left: 99 };
        if (phase === 'result') {
          wait -= dt;
          if (wait <= 0) {
            if (round >= ROUNDS) {
              phase = 'over';
              fin = 1.2;
            } else phase = 'ready';
          }
        }
        if (phase === 'over') {
          fin -= dt;
          if (fin <= 0) {
            phase = 'done';
            api.over(credits);
          }
        }
      },
      draw(c) {
        const [ox, oy] = fx.offset();
        c.setTransform(1, 0, 0, 1, ox, oy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        lounge(c, 38);
        c.drawImage(F.slot, 48, 11);
        c.drawImage(F.flamp, 105, 10);
        const pose = cel ? cel.pose : 'idle';
        person(c, L, pose, 0, frameOf(pose, T), 88, 46, blinks(T));
        if (said) bubble(c, 88, 5, said.s, 88);
        plate(c, 4, 9, 40, ['STAR 50', 'CAT 30', 'ANY 3 20', 'PAIR 3'], '#ffee88');
        label(
          c,
          'SPIN ' + Math.min(round + (phase === 'ready' ? 1 : 0), ROUNDS) + ' OF ' + ROUNDS,
          8,
          1,
          '#e0af68'
        );
        label(c, 'WON ' + credits, 114, 1, '#ffd23f', 1, 'right');
        panel(c, 1, 50, 118, 39, '#8f2a20');
        const syms = reels.map((r) => r.sym);
        reels.forEach((r, i) => {
          const x = RX[i];
          R(x - 1, RY - 1, RW + 2, RH + 2, INK);
          R(x, RY, RW, RH, '#f7f1e0');
          c.save();
          c.beginPath();
          c.rect(x, RY, RW, RH);
          c.clip();
          const p = r.mode === 'rest' ? r.sym : r.pos,
            base = Math.floor(p),
            off = Math.round((p - base) * STEP);
          for (let k = -1; k <= 1; k++) {
            const s = (((base + k) % 6) + 6) % 6,
              spr0 = ART[s];
            c.drawImage(
              spr0,
              x + Math.round((RW - spr0.width) / 2),
              RY + Math.round((RH - spr0.height) / 2) + off - k * STEP
            );
          }
          c.restore();
          R(x, RY, RW, 3, 'rgba(18,19,42,.22)');
          R(x, RY + RH - 3, RW, 3, 'rgba(18,19,42,.22)');
          const hot =
            phase === 'result' &&
            win > 0 &&
            (win === 3 ? syms.filter((v) => v === syms[i]).length > 1 : true);
          if (hot && (T * 6) % 2 < 1) R(x - 1, RY - 1, RW + 2, 1, '#ffd23f');
          if (phase === 'hold' && cursor === i) {
            R(x - 2, RY - 2, RW + 4, 1, '#ffd23f');
            R(x - 2, RY + RH + 1, RW + 4, 1, '#ffd23f');
            R(x - 2, RY - 2, 1, RH + 4, '#ffd23f');
            R(x + RW + 1, RY - 2, 1, RH + 4, '#ffd23f');
          }
          const on = r.hold;
          R(x - 1, 77, RW + 2, 9, INK);
          R(x, 78, RW, 7, on ? '#ffd23f' : phase === 'hold' ? '#c9ccd8' : '#4a2d28');
          label(
            c,
            'HOLD',
            x + RW / 2,
            79,
            on ? INK : phase === 'hold' ? '#3a3f5c' : '#7a5a52',
            1,
            'center'
          );
        });
        drawBtns(c, btns(), -1, pressT > 0 ? pressed : '');
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (phase === 'over' || phase === 'done') {
          R(29, 51, 62, 22, INK);
          R(30, 52, 60, 20, '#e0af68');
          R(31, 53, 58, 18, '#1a1030');
          label(c, 'WON ' + credits, 60, 59, '#ffd23f', 1, 'center');
        }
      },
    };
  },
};
