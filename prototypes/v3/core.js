// Shared by every v3 sample page. build.mjs joins: core.js + the people, furniture and pet
// blocks cut out of ../office-workers.html + scene.js, and inlines the result into each page.
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const LW = 640,
  LH = 360,
  SHOE = '#23263a',
  INK = '#12132a';
function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function tone(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16,
    gg = (n >> 8) & 255,
    b = n & 255;
  if (f < 0) {
    const k = 1 + f;
    r = r * k;
    gg = gg * k;
    b = Math.min(255, b * k - f * 26);
  } else {
    r += (255 - r) * f;
    gg += (255 - gg) * f;
    b += (255 - b) * f * 0.75;
  }
  return 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')';
}
function spr(w, h, fn) {
  const c = mk(w, h),
    x = c.getContext('2d');
  fn((X, Y, W, H, col) => {
    if (W > 0 && H > 0) {
      x.fillStyle = col;
      x.fillRect(X | 0, Y | 0, W | 0, H | 0);
    }
  });
  return c;
}
function inked(c) {
  const w = c.width,
    h = c.height,
    o = mk(w + 2, h + 2),
    x = o.getContext('2d'),
    d = c.getContext('2d').getImageData(0, 0, w, h).data;
  x.fillStyle = INK;
  for (let y = 0; y < h; y++)
    for (let X = 0; X < w; X++)
      if (d[(y * w + X) * 4 + 3] > 40) {
        x.fillRect(X, y + 1, 3, 1);
        x.fillRect(X + 1, y, 1, 3);
      }
  x.drawImage(c, 1, 1);
  return o;
}
function flip(c) {
  const m = mk(c.width, c.height),
    x = m.getContext('2d');
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(c, 0, 0);
  return m;
}
function slab(R, x, y, w, h, c) {
  R(x, y, w, h, c);
  R(x, y, w, 1, tone(c, 0.28));
  R(x + w - 1, y + 1, 1, h - 1, tone(c, -0.2));
  R(x, y + h - 1, w, 1, tone(c, -0.28));
}
// 3x5 pixel font for signs and badges drawn inside the scene
const GLY = {
  A: '25755',
  B: '65656',
  C: '34443',
  D: '65556',
  E: '74647',
  F: '74644',
  G: '34553',
  H: '55755',
  I: '72227',
  J: '11152',
  K: '55655',
  L: '44447',
  M: '57755',
  N: '65555',
  O: '25552',
  P: '65644',
  Q: '25573',
  R: '65655',
  S: '34216',
  T: '72222',
  U: '55557',
  V: '55552',
  W: '55775',
  X: '55255',
  Y: '55222',
  Z: '71247',
  0: '75557',
  1: '26227',
  2: '71747',
  3: '71717',
  4: '55711',
  5: '74717',
  6: '74757',
  7: '71222',
  8: '75757',
  9: '75717',
  '-': '00700',
  '!': '22202',
};
function text(c, str, x, y, col) {
  c.fillStyle = col;
  for (const ch of String(str)) {
    const gl = GLY[ch];
    if (gl)
      for (let r = 0; r < 5; r++) {
        const v = +gl[r];
        for (let b = 0; b < 3; b++) if (v & (4 >> b)) c.fillRect(x + b, y + r, 1, 1);
      }
    x += 4;
  }
}
