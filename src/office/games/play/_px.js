import { mk, text } from '../../engine/pixel.js';
import { sprite, build } from '../../art/people.js';
import { SK, HR, SH, STY, ACC, FIT } from '../../world/cast.js';
import { sound } from '../sfx.js';

// Shared by the games drawn in the office's own manner: a low-resolution screen that the
// cabinet scales up in whole pixels, the 3x5 pixel font, our people as characters.
// Two screen sizes. An arcade screen (W x H) has room for a playing field. A scene
// (SCENE_W x SCENE_H) is a close-up of a place in the office: people and furniture keep the
// office's own proportions there, and it is the small screen that brings them close, never
// bigger furniture. A standing figure is about 31 px tall, a third of the scene: with the
// feet at y = 70 the head is at about y = 39, and whatever a person says or orders sits
// right at the head. Playing pieces (cards, buttons) may be large: they are the interface.
export const W = 240,
  H = 180,
  SCENE_W = 120,
  SCENE_H = 90;

const labels = new Map();
// text in the pixel font; s is a whole-number scale, align is 'left' | 'center' | 'right'
export function label(c, str, x, y, col, s = 1, align = 'left') {
  str = String(str).toUpperCase();
  const k = str + col;
  let t = labels.get(k);
  if (!t) {
    if (labels.size > 300) labels.clear();
    t = mk(Math.max(1, str.length * 4 - 1), 5);
    text(t.getContext('2d'), str, 0, 0, col);
    labels.set(k, t);
  }
  const w = t.width * s,
    X = align === 'center' ? Math.round(x - w / 2) : align === 'right' ? x - w : x;
  c.imageSmoothingEnabled = false;
  c.drawImage(t, X, y, w, 5 * s);
  return w;
}

export const box = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(x | 0, y | 0, w | 0, h | 0);
};

let looks = 0;
export function makeLook(n = (Math.random() * 1e6) | 0) {
  return {
    id: 'play' + looks++,
    skin: SK[n % 5],
    hair: HR[(n >> 2) % 9],
    shirt: SH[(n >> 4) % 12],
    pants: ['#2e3350', '#3a2e55', '#23263a'][(n >> 7) % 3],
    style: STY[(n >> 9) % 6],
    acc: ACC[(n >> 11) % 6],
    fit: FIT[(n >> 13) % 6],
    beard: (n >> 15) % 5 === 0,
    skirt: (n >> 17) % 4 === 0,
  };
}
// one of our people, feet at (x, y)
export function person(c, L, pose, dir, f, x, y, blink) {
  const d = build(false);
  c.drawImage(
    sprite(L, d, pose, dir, f, !!blink, false),
    Math.round(x) - 13,
    Math.round(y) - (d.foot + 1)
  );
}

// particles, floating labels and the screen shake. A burst cheers and a shake groans, unless
// the game is quiet and makes its own sounds
export function createFx(quiet = false) {
  const bits = [];
  let shake = 0;
  return {
    burst(x, y, cols, n = 12, speed = 50) {
      if (!quiet && n >= 6) sound.play('good');
      for (let i = 0; i < n; i++)
        bits.push({
          x,
          y,
          vx: (Math.random() - 0.5) * speed,
          vy: -Math.random() * speed * 0.9 - 8,
          t: 0,
          life: 0.5 + Math.random() * 0.5,
          c: cols[i % cols.length],
        });
    },
    pop(x, y, str, col) {
      bits.push({ x, y, vx: 0, vy: -16, t: 0, life: 0.9, str, c: col, float: true });
    },
    shake(n) {
      if (!quiet) sound.play('bad');
      shake = Math.max(shake, n);
    },
    tick(dt) {
      shake = Math.max(0, shake - dt * 14);
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.t += dt;
        if (b.t > b.life) {
          bits.splice(i, 1);
          continue;
        }
        if (!b.float) b.vy += 140 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
    },
    // call before drawing the scene: nudges everything while the screen shakes
    offset: () =>
      shake > 0.2
        ? [Math.round((Math.random() - 0.5) * shake), Math.round((Math.random() - 0.5) * shake)]
        : [0, 0],
    draw(c) {
      bits.forEach((b) => {
        if (b.str) label(c, b.str, Math.round(b.x), Math.round(b.y), b.c, 1, 'center');
        else box(c, b.x, b.y, 2, b.t > b.life * 0.6 ? 1 : 2, b.c);
      });
    },
  };
}
