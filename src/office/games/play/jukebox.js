import { spr, tone, INK } from '../../engine/pixel.js';
import { frameOf } from '../../art/people.js';
import { catSprite } from '../../art/pets.js';
import { F } from '../../art/furniture.js';
import { SCENE_W as SW, SCENE_H as SH, label, box, makeLook, person, createFx } from './_px.js';
import { sound } from '../sfx.js';

// Jukebox rhythm. The lounge jukebox plays a song: arrows fall down its display and each
// wants a press as it lands on the row at the bottom. Hits warm the floor up: one dancer,
// then a second, then the lights and the mirror ball. A miss cools it down again.
// The jukebox and the people keep the office's proportions; the display is the enlarged
// thing, so it lives in a framed panel.
const FLOOR = 68,
  BEAT = 0.5,
  LEAD = 2,
  FALL = 1.3,
  PX = 70,
  LW = 11,
  HIT = 60,
  V = (HIT - 14) / FALL,
  PERFECT = 0.075,
  GOOD = 0.16;
const LANES = [
  { k: 'left', col: '#f7768e' },
  { k: 'down', col: '#e0af68' },
  { k: 'up', col: '#9ece6a' },
  { k: 'right', col: '#7aa2f7' },
];
// an arrow as rows of pixels pointing up: 7 px for the notes, 9 px for the buttons
const UP = ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'];
const UP9 = [
  '....#....',
  '...###...',
  '..#####..',
  '.#######.',
  '#########',
  '...###...',
  '...###...',
  '...###...',
  '...###...',
];
const TURN = {
  up: (m, x, y) => m[y][x],
  down: (m, x, y) => m[m.length - 1 - y][x],
  left: (m, x, y) => m[x][y],
  right: (m, x, y) => m[m.length - 1 - x][y],
};
// the tune: each lane is a tone of the bar's chord (C, A minor, F, G), so a clean run plays a melody
const CHORDS = [
  [0, 4],
  [-3, 3],
  [5, 4],
  [7, 4],
];
const pitch = (n) => {
  const [root, third] = CHORDS[((Math.floor((n.at - LEAD) / (4 * BEAT)) % 4) + 4) % 4];
  return 261.63 * 2 ** ((root + [0, third, 7, 12][n.lane]) / 12);
};
const arrows = new Map();
function arrow(k, col, m = UP) {
  const id = k + col + m.length;
  if (!arrows.has(id))
    arrows.set(
      id,
      spr(m.length, m.length, (R) => {
        for (let y = 0; y < m.length; y++)
          for (let x = 0; x < m.length; x++) if (TURN[k](m, x, y) === '#') R(x, y, 1, 1, col);
      })
    );
  return arrows.get(id);
}
const CAT = [0, 1].map((f) => catSprite(f, true, false));

// a song on a beat grid: a slow intro, a verse on every beat, doubles in the bridge and the
// chorus, a run down the stairs and back, one last note
function chart() {
  const notes = [];
  let t = LEAD,
    last = -1;
  const add = (at, twin) => {
    let l = last;
    if (!twin || last < 0)
      do l = (Math.random() * 4) | 0;
      while (l === last);
    last = l;
    notes.push({ lane: l, at, hit: 0 });
  };
  const bars = (n, steps) => {
    for (let i = 0; i < n; i++, t += 4 * BEAT) steps.forEach((s) => add(t + s * BEAT, s % 1 > 0));
  };
  bars(2, [0, 2]);
  bars(4, [0, 1, 2, 3]);
  bars(2, [0, 1, 1.5, 2, 3]);
  bars(4, [0, 1, 1.5, 2, 3, 3.5]);
  [0, 1, 2, 3, 3, 2, 1, 0].forEach((lane, i) =>
    notes.push({ lane, at: t + (i * BEAT) / 2, hit: 0 })
  );
  notes.push({ lane: (Math.random() * 4) | 0, at: t + 5 * BEAT, hit: 0 });
  return notes;
}

export default {
  size: [SW, SH],
  how: 'ARROWS ON THE BEAT',
  pad: true,
  quiet: true,
  start(api) {
    const fx = createFx(true);
    const notes = chart(),
      songEnd = notes[notes.length - 1].at,
      seed = (Math.random() * 1e6) | 0;
    const A = { L: makeLook(seed), x: 38, walk: 0, dist: 0 },
      B = { L: makeLook(seed * 7 + 3), x: -16, walk: 0, dist: 0, on: false };
    const tunes = [],
      flash = [0, 0, 0, 0];
    let T = 0,
      score = 0,
      combo = 0,
      hits = 0,
      heat = 0.2,
      glow = 0,
      say = null,
      pressed = -1,
      pressT = 0,
      scratch = 0,
      palm = 0,
      half = -99,
      end = 0;

    function miss(stray) {
      if (combo >= 5) palm = 0.6;
      combo = 0;
      heat = Math.max(0, heat - (stray ? 0.1 : 0.2));
      scratch = 0.25;
      sound.play('scratch');
      say = { str: stray ? 'OOPS' : 'MISS', col: '#f7768e', t: 0.45 };
    }
    function press(i) {
      pressed = i;
      pressT = 0.12;
      flash[i] = 0.14;
      if (end) return;
      let n = null;
      for (const m of notes)
        if (
          !m.hit &&
          m.lane === i &&
          Math.abs(m.at - T) <= GOOD &&
          (!n || Math.abs(m.at - T) < Math.abs(n.at - T))
        )
          n = m;
      if (!n) return miss(true);
      const perfect = Math.abs(n.at - T) <= PERFECT;
      n.hit = 1;
      hits++;
      combo++;
      score += (perfect ? 10 : 5) * (1 + Math.min(3, (combo / 10) | 0));
      api.score(score);
      heat = Math.min(1, heat + (perfect ? 0.045 : 0.03));
      sound.play('note', pitch(n), perfect ? 0.5 : 0.3);
      say = perfect
        ? { str: 'PERFECT', col: '#ffd23f', t: 0.45 }
        : { str: 'GOOD', col: '#9ece6a', t: 0.45 };
      fx.burst(PX + i * LW + 5, HIT, [LANES[i].col, '#ffffff'], perfect ? 8 : 4, 30);
      tunes.push({ x: 27 + Math.random() * 4, y: 36, t: 0, col: LANES[i].col });
    }

    return {
      // what is coming down the display; the headless check plays by it
      state: () => ({
        T,
        score,
        combo,
        heat,
        hits,
        total: notes.length,
        next: notes.filter((n) => !n.hit).map((n) => ({ lane: n.lane, in: n.at - T })),
      }),
      key(k) {
        const i = LANES.findIndex((l) => l.k === k);
        if (i >= 0) press(i);
      },
      tap(x, y) {
        if (y >= 72) press(Math.max(0, Math.min(3, Math.floor(x / 30))));
        else if (x >= PX - 3) press(Math.max(0, Math.min(3, Math.floor((x - PX) / LW))));
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        pressT -= dt;
        scratch -= dt;
        palm -= dt;
        for (let i = 0; i < 4; i++) flash[i] = Math.max(0, flash[i] - dt);
        if (say && (say.t -= dt) <= 0) say = null;
        for (let i = tunes.length - 1; i >= 0; i--) {
          const n = tunes[i];
          n.t += dt;
          n.y -= 12 * dt;
          if (n.t > 1.3) tunes.splice(i, 1);
        }
        glow += ((heat >= 0.75 ? 1 : 0) - glow) * Math.min(1, dt * 4);
        // the second dancer comes when the floor is warm and goes when it cools
        if (!B.on && heat >= 0.45) B.on = true;
        else if (B.on && heat < 0.25 && !end) B.on = false;
        const tx = B.on ? 54 : -16,
          gap = tx - B.x;
        if (Math.abs(gap) > 0.5) {
          const step = Math.sign(gap) * Math.min(Math.abs(gap), 30 * dt);
          B.x += step;
          B.dist += Math.abs(step);
          B.walk = Math.sign(step);
        } else B.walk = 0;
        if (end) {
          end -= dt;
          if (end <= 0) api.over(score);
          return;
        }
        // the drum the song is played to: a kick on the beat, a hat between, two beats of count-in
        const h = Math.floor(((T - LEAD) / BEAT) * 2);
        if (h !== half && h >= -4 && T < songEnd + BEAT) {
          half = h;
          sound.play(h % 2 ? 'hat' : 'kick');
        }
        for (const n of notes)
          if (!n.hit && T > n.at + GOOD) {
            n.hit = -1;
            miss(false);
          }
        if (T > songEnd + 0.6) end = 1.8;
      },
      draw(c) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.imageSmoothingEnabled = false;
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        const beat = (T - LEAD) / BEAT,
          bi = Math.floor(beat),
          bf = beat - bi,
          on = beat >= -2 && !end,
          encore = hits >= notes.length * 0.8;
        // the lounge wall and the carpet
        R(0, 0, SW, 46, '#4a1f33');
        for (let y = 4; y < 42; y += 12)
          for (let x = ((y / 12) % 2) * 8 - 4; x < SW; x += 16) {
            R(x + 1, y, 2, 1, '#5a2238');
            R(x, y + 1, 4, 1, '#5a2238');
            R(x + 1, y + 2, 2, 1, '#5a2238');
          }
        R(0, 46, SW, 2, '#e0af68');
        R(0, 48, SW, 24, '#5a2238');
        for (let x = 4; x < SW; x += 12) R(x, 52 + ((x / 12) % 2) * 9, 3, 2, '#73304d');
        // when the floor is hot the mirror ball comes down and spots of light walk the carpet
        if (glow > 0.05) {
          const by = Math.round(-9 + glow * 12);
          R(47, 0, 1, by, '#8f96b3');
          R(44, by, 8, 8, INK);
          R(45, by - 1, 6, 10, INK);
          R(45, by, 6, 8, '#c9ccd8');
          R(44, by + 1, 8, 6, '#c9ccd8');
          for (let i = 0; i < 6; i++) {
            const k = (i * 5 + ((T * 6) | 0)) % 12;
            R(45 + (k % 3) * 2, by + 1 + ((k / 3) | 0) * 2 - (k > 8 ? 1 : 0), 1, 1, '#ffffff');
            R(46 + (k % 3) * 2, by + 2 + ((i * 2) % 5), 1, 1, '#8f96b3');
          }
          c.globalAlpha = 0.3 * glow;
          for (let i = 0; i < 4; i++) {
            const x = 6 + ((((bi + 64) * 19 + i * 17) % 44) | 0),
              y = 51 + ((i * 7 + (bi + 64) * 3) % 16);
            R(x, y, 12, 3, LANES[(bi + 64 + i) % 4].col);
            R(x + 2, y - 1, 8, 5, LANES[(bi + 64 + i) % 4].col);
            R(18 + i * 9 + ((bi + 64) % 3) * 4, 6 + ((i * 11 + (bi + 64) * 5) % 30), 2, 2, '#fff');
          }
          c.globalAlpha = 1;
        }
        // the jukebox with the cat on top; its screen keeps the beat and goes dark on a miss
        const jx = 2,
          jy = FLOOR + 2 - F.juke.height,
          m = (F.juke.width - 22) / 2;
        R(jx + 2, FLOOR + 1, F.juke.width - 2, 2, 'rgba(18,19,42,.3)');
        c.drawImage(F.juke, jx, jy);
        R(
          jx + m + 4,
          jy + m + 6,
          14,
          12,
          scratch > 0 || !on ? '#23263a' : LANES[(bi + 64) % 4].col
        );
        for (let i = 0; i < 4; i++) {
          const v = scratch > 0 || !on ? 4 : ((T * 8 + i * 2) | 0) % 5;
          R(jx + m + 6 + i * 3, jy + m + 8 + v, 2, 9 - v, 'rgba(18,19,42,.55)');
        }
        if (on && bf < 0.25) {
          R(jx + m + 1, jy + m + 6, 2, 27, '#ffd0f4');
          R(jx + m + 19, jy + m + 6, 2, 27, '#ffd0f4');
        }
        c.drawImage(CAT[on ? (bi + 64) % 2 : ((T * 2) | 0) % 2], jx + 2, jy - 11);
        tunes.forEach((n) => {
          const x = Math.round(n.x + Math.sin(n.t * 5) * 2),
            y = Math.round(n.y);
          c.globalAlpha = Math.min(1, (1.3 - n.t) * 2);
          R(x + 2, y, 1, 5, n.col);
          R(x + 2, y, 3, 1, n.col);
          R(x, y + 3, 3, 2, n.col);
          c.globalAlpha = 1;
        });
        // the display: four lanes, the row to hit, the song so far
        const fx0 = PX - 3,
          fw = 4 * LW + 6;
        R(fx0 - 2, 1, fw + 4, 70, INK);
        R(fx0 - 1, 2, fw + 2, 68, '#e0af68');
        R(fx0, 3, fw, 66, '#11132a');
        R(fx0, 3, 2, 66, on && bf < 0.25 ? '#ffd0f4' : '#ff4fd8');
        R(fx0 + fw - 2, 3, 2, 66, on && bf < 0.25 ? '#ffd0f4' : '#ff4fd8');
        R(PX, 3, 4 * LW, 9, '#1b1e3a');
        if (say) label(c, say.str, PX + 2 * LW, 5, say.col, 1, 'center');
        else if (T < LEAD - FALL) label(c, 'READY', PX + 2 * LW, 5, '#a9b1d6', 1, 'center');
        else {
          label(c, 'X' + (1 + Math.min(3, (combo / 10) | 0)), PX + 2, 5, '#ffd23f');
          if (combo > 1) label(c, combo, PX + 4 * LW - 2, 5, '#a9b1d6', 1, 'right');
        }
        R(PX, 12, 4 * LW, 1, '#2a2e44');
        R(
          PX,
          12,
          Math.round(4 * LW * Math.max(0, Math.min(1, (T - LEAD) / (songEnd - LEAD)))),
          1,
          '#bb9af7'
        );
        LANES.forEach((l, i) => {
          const x = PX + i * LW;
          R(x, 13, LW, 56, i % 2 ? '#181b38' : '#11132a');
          R(x, HIT - 5, LW, 11, flash[i] > 0 ? tone(l.col, -0.45) : '#23274a');
          c.drawImage(arrow(l.k, flash[i] > 0 ? '#ffffff' : tone(l.col, -0.5)), x + 2, HIT - 3);
        });
        notes.forEach((n) => {
          if (n.hit) return;
          const y = Math.round(HIT - (n.at - T) * V) - 3;
          if (y < 13 || y > 62) return;
          const x = PX + n.lane * LW + 2;
          c.drawImage(arrow(LANES[n.lane].k, INK), x, y + 1);
          c.drawImage(arrow(LANES[n.lane].k, LANES[n.lane].col), x, y);
        });
        // the dancers: arms up with a hop, a turn, a wave, a turn back, one move a beat
        [B, A].forEach((p, i) => {
          if (p.x < -14) return;
          let pose = 'idle',
            dir = 0,
            dx = 0,
            f = frameOf('idle', T + i);
          if (p.walk) {
            pose = 'walk';
            dir = p.walk > 0 ? 2 : 3;
            f = Math.floor(p.dist / 2.6) % 6;
          } else if (end) {
            pose = encore ? 'cheer' : 'idle';
            f = frameOf(pose, T + i);
          } else if (palm > 0 && p === A) {
            pose = 'palm';
            f = frameOf(pose, T);
          } else if (heat >= 0.15 && beat >= 0) {
            const b = (bi + i) % 4;
            pose = b === 0 ? 'cheer' : b === 2 ? 'wave' : 'idle';
            dir = b === 1 ? 2 : b === 3 ? 3 : 0;
            dx = [0, 1, 0, -1][b];
            f = pose === 'cheer' ? Math.min(5, (bf * 6) | 0) : frameOf(pose, T + i);
          }
          R(p.x + dx - 6, FLOOR, 12, 2, 'rgba(18,19,42,.3)');
          person(c, p.L, pose, dir, f, p.x + dx, FLOOR, (T * 1000 + i * 1700) % 4200 < 140);
        });
        fx.draw(c);
        // the four arrows to press
        R(0, 72, SW, SH - 72, INK);
        LANES.forEach((l, i) => {
          const x = i * 30,
            down = pressed === i && pressT > 0 ? 1 : 0;
          R(x, 73 + down, 30, 17 - down, '#3a3f5c');
          R(x + 1, 74 + down, 28, 15 - down, tone(l.col, -0.25));
          R(x + 1, 74 + down, 28, 12, l.col);
          R(x + 1, 74 + down, 28, 1, tone(l.col, 0.35));
          c.drawImage(arrow(l.k, INK, UP9), x + 10, 77 + down);
        });
        if (end) {
          R(18, 22, 84, 16, INK);
          label(
            c,
            encore ? 'ENCORE!' : 'SONG OVER',
            60,
            25,
            encore ? '#ffd23f' : '#f7768e',
            2,
            'center'
          );
        }
      },
    };
  },
};
