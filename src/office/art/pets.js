import { spr, inked, flip, tone, INK } from '../engine/pixel.js';

const petCache = new Map();
function catSprite(f, sit, fl) {
  const k = 'cat' + f + sit + fl;
  let s = petCache.get(k);
  if (s) return s;
  const c = '#f08a3c',
    d = '#d9722a';
  let b = spr(18, 12, (R) => {
    if (sit) {
      R(4, 4, 8, 7, c);
      R(5, 3, 6, 2, c);
      R(9, 1, 6, 5, c);
      R(9, 0, 2, 2, c);
      R(13, 0, 2, 2, c);
      R(11, 3, 1, 1, INK);
      R(13, 3, 1, 1, INK);
      R(5, 10, 7, 1, d);
      R(1, 8 + (f % 2), 4, 2, d);
      R(4, 6, 3, 3, d);
    } else {
      R(3, 4, 10, 5, c);
      R(3, 4, 10, 1, tone(c, 0.25));
      R(11, 1, 6, 5, c);
      R(11, 0, 2, 2, c);
      R(15, 0, 2, 2, c);
      R(13, 3, 1, 1, INK);
      R(15, 3, 1, 1, INK);
      R(5, 6, 5, 1, d);
      const p = [
        [0, 2],
        [1, 1],
        [2, 0],
        [1, 1],
      ][f % 4];
      R(4, 9, 2, 3 - p[0], d);
      R(11, 9, 2, 3 - p[1], d);
      R(7, 9, 2, 3 - p[1], c);
      R(13, 9, 2, 3 - p[0], c);
      R(0, 2 + (f % 2), 2, 2, d);
      R(1, 3, 3, 2, d);
    }
  });
  if (fl) b = flip(b);
  s = inked(b);
  petCache.set(k, s);
  return s;
}
function gooseSprite(f, fl) {
  const k = 'goose' + f + fl;
  let s = petCache.get(k);
  if (s) return s;
  const w = '#f4f4f0';
  let b = spr(16, 17, (R) => {
    R(2, 7, 10, 6, w);
    R(1, 8, 2, 3, w);
    R(3, 7, 8, 1, '#fff');
    R(3, 12, 8, 1, '#c9c9c2');
    R(10, 2, 3, 7, w);
    R(10, 0, 5, 4, w);
    R(13, 1, 1, 1, INK);
    R(15, 2, 1, 2, '#ff8a3d');
    const p = f % 4;
    R(5 + (p === 1 ? 1 : 0), 13, 1, 3 - (p === 0 ? 1 : 0), '#ff8a3d');
    R(8 - (p === 3 ? 1 : 0), 13, 1, 3 - (p === 2 ? 1 : 0), '#ff8a3d');
    R(4, 16, 3, 1, '#ff8a3d');
    R(7, 16, 3, 1, '#ff8a3d');
  });
  if (fl) b = flip(b);
  s = inked(b);
  petCache.set(k, s);
  return s;
}

export { catSprite, gooseSprite };
