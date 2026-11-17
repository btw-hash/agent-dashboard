import { spr, inked, flip, tone, SHOE, INK } from '../engine/pixel.js';

// A person is parts on a grid. PW x PH is the drawing box, PCX its centre column, HY the top row of the head.
const PW = 24,
  PH = 42,
  PCX = 12,
  HY = 5;
const BUILD = { head: 'normal', legs: 'long', eyes: 'line' };
let D, DI;
const cache = new Map();
function metrics(d) {
  d.bt = HY + d.hh + d.neck - 1;
  d.ly = d.bt + d.bh;
  d.foot = d.ly + d.lh + 2;
  return d;
}
function design() {
  const big = BUILD.head === 'big',
    lh = BUILD.legs === 'long' ? 8 : 5;
  D = metrics({
    id: 'd',
    hw: big ? 12 : 10,
    hh: big ? 11 : 10,
    bw: 8,
    bh: 9,
    lh,
    neck: 1,
    round: [2, 1],
    eye: BUILD.eyes,
  });
  DI = metrics({
    id: 'i',
    hw: D.hw,
    hh: D.hh,
    bw: 8,
    bh: 7,
    lh: lh - 3,
    neck: 1,
    round: [2, 1],
    eye: BUILD.eyes,
  });
  cache.clear();
}
const LIFT_A = [2, 1, 0, 0, 0, 0],
  LIFT_B = [0, 0, 0, 2, 1, 0],
  BOB = [0, 1, 0, 0, 1, 0],
  SWING = [3, 2, 0, -3, -2, 0],
  HOP = [0, -2, -3, -2, 0, 0];

function guy(R0, L, D, pose, dir, f, blink, sit) {
  const HW = D.hw,
    HH = D.hh,
    BW = D.bw,
    BH = D.bh,
    LH = D.lh,
    cx = PCX,
    hx = cx - HW / 2,
    bt = D.bt,
    bx = cx - BW / 2,
    ly = D.ly,
    walk = pose === 'walk';
  const hop = pose === 'cheer' && !sit ? HOP[f % 6] : 0,
    R = (x, y, w, h, c) => R0(x, y + hop, w, h, c);
  const b = walk
    ? BOB[f]
    : (pose === 'idle' || pose === 'talk' || pose === 'sip' || pose === 'wave') && f % 4 === 1
      ? 1
      : 0;
  const sh = L.shirt,
    shD = tone(sh, -0.22),
    shL = tone(sh, 0.25),
    pa = L.skirt ? L.skin : L.pants,
    paD = tone(pa, -0.25),
    sk = L.skin,
    skD = tone(sk, -0.18),
    Hc = L.hair,
    HD = tone(Hc, -0.3),
    HL = tone(Hc, 0.3);
  const lw = 3,
    gap = BW - 2 * lw,
    al = BH - 2,
    post = [];
  // legs
  if (!sit) {
    if (dir < 2) {
      const a = Math.min(walk ? LIFT_A[f] : 0, LH - 1),
        c = Math.min(walk ? LIFT_B[f] : 0, LH - 1);
      R(bx, ly, lw, LH - a, pa);
      R(bx - 1, ly + LH - a, lw + 1, 2, SHOE);
      R(bx + lw + gap, ly, lw, LH - c, pa);
      R(bx + lw + gap, ly + LH - c, lw + 1, 2, SHOE);
      R(bx + lw - 1, ly, 1, LH - 1 - a, paD);
      if (L.skirt) {
        R(bx - 1, ly, BW + 2, 3, L.pants);
        R(bx - 1, ly + 2, BW + 2, 1, tone(L.pants, -0.25));
      }
    } else {
      const s = walk ? SWING[f] : 0,
        up = walk && (f === 2 || f === 5) ? 1 : 0,
        x0 = cx - 1,
        k = LH > 5 ? LH >> 1 : 0,
        hs = Math.sign(s) * Math.ceil(Math.abs(s) / 2);
      if (k) {
        R(x0 - hs, ly, lw, k, paD);
        R(x0 - s, ly + k, lw, LH - k, paD);
      } else R(x0 - s, ly, lw, LH, paD);
      R(x0 - s, ly + LH, lw + 1, 2, tone(SHOE, -0.3));
      if (k) {
        R(x0 + hs, ly, lw, k, pa);
        R(x0 + s, ly + k, lw, LH - k - up, pa);
      } else R(x0 + s, ly, lw, LH - up, pa);
      R(x0 + s, ly + LH - up, lw + 1, 2, SHOE);
      if (L.skirt) {
        R(cx - 3, ly, 6, 3, L.pants);
        R(cx - 3, ly + 2, 6, 1, tone(L.pants, -0.25));
      }
    }
  }
  // torso and arms
  if (dir < 2) {
    R(bx, bt + b, BW, BH, sh);
    R(bx, bt + b, BW, 1, shL);
    R(bx + BW - 1, bt + 1 + b, 1, BH - 1, shD);
    R(bx, bt + BH - 1 + b, BW, 1, shD);
    if (L.fit === 'stripe')
      for (let y = bt + 2; y < bt + BH - 1; y += 2) R(bx, y + b, BW - 1, 1, '#fff');
    if (L.fit === 'hood') {
      R(bx, bt + b, BW, 2, shL);
      if (dir === 1) R(cx - 2, bt + b, 4, 3, shD);
    }
    if (dir === 0) {
      if (L.fit === 'hood') {
        R(cx - 2, bt + BH - 3 + b, 4, 1, shD);
        R(cx - 2, bt + 2 + b, 1, 2, '#fff');
        R(cx + 1, bt + 2 + b, 1, 2, '#fff');
      } else if (L.fit === 'tie') {
        R(cx - 2, bt + b, 4, 1, '#fff');
        R(cx - 1, bt + 1 + b, 2, 4, '#e03131');
      } else if (L.fit === 'suit') {
        R(cx - 2, bt + b, 4, BH - 2, '#f2f2f2');
        R(cx - 1, bt + 1 + b, 2, 4, '#3b5bdb');
        R(cx - 3, bt + b, 1, BH - 3, shD);
        R(cx + 2, bt + b, 1, BH - 3, shD);
      } else if (L.fit === 'tee') {
        R(cx - 1, bt + b, 2, 1, sk);
        R(cx - 2, bt + 3 + b, 4, 3, '#fff');
        R(cx - 1, bt + 4 + b, 2, 1, shD);
      } else R(cx - 1, bt + b, 2, 1, sk);
    }
    const sL = hx - 2,
      sR = hx + HW;
    const down = (x, dy) => {
      R(x, bt + 1 + b + dy, 2, al, shD);
      R(x, bt + 1 + al + b + dy, 2, 2, sk);
    };
    const raised = (x, k) => {
      const o = x < cx ? -1 : 1;
      R(x, bt - 1 + k, 2, 3, shD);
      R(x + o, bt - 4 + k, 2, 3, shD);
      R(x + 2 * o, bt - 6 + k, 2, 2, sk);
      if (x < cx) R(x + 2, bt + 1, bx - x - 2, 2, shD);
      else R(bx + BW, bt + 1, x - bx - BW, 2, shD);
    };
    if (pose === 'type' && dir === 1) {
      const k = f % 2;
      R(bx - 2, bt + 2 + k, 2, 5, shD);
      R(bx - 2, bt + k, 2, 2, sk);
      R(bx + BW, bt + 3 - k, 2, 5, shD);
      R(bx + BW, bt + 1 - k, 2, 2, sk);
    } else if (pose === 'type') {
      const k = f % 2;
      R(bx - 2, bt + 1, 2, 5, shD);
      R(bx - 1, bt + 6 + k, 3, 2, sk);
      R(bx + BW, bt + 1, 2, 5, shD);
      R(bx + BW - 2, bt + 7 - k, 3, 2, sk);
    } else if (pose === 'think') {
      down(bx - 2, 0);
      R(bx + BW - 1, bt + 1, 3, 5, shD);
      post.push(() => R(cx + 1, bt - 1, 3, 2, sk));
    } else if (pose === 'board') {
      const k = f % 4 < 2 ? 0 : 1;
      down(bx - 2, 0);
      R(sR, bt - 4 - k, 2, 6, shD);
      R(sR, bt - 6 - k, 2, 2, sk);
      R(sR, bt - 7 - k, 1, 1, '#3b5bdb');
      R(bx + BW, bt + 1, sR - bx - BW, 2, shD);
    } else if (pose === 'sip') {
      down(bx - 2, 0);
      if (f % 8 < 3) {
        const my = HY + b + HH - 3;
        post.push(() => {
          R(bx + BW, bt - 1 + b, 2, 4, shD);
          R(cx - 1, my, 4, 4, '#fff');
          R(cx + 3, my + 1, 1, 2, '#fff');
          R(cx + 3, my + 3, 3, 2, sk);
        });
      } else {
        R(bx + BW, bt + 1 + b, 2, 4, shD);
        R(bx + BW - 3, bt + 3 + b, 4, 4, '#fff');
        R(bx + BW - 3, bt + 3 + b, 4, 1, '#8a5a34');
        R(bx + BW - 4, bt + 4 + b, 1, 2, '#fff');
        R(bx + BW, bt + 5 + b, 2, 2, sk);
      }
    } else if (pose === 'wave') {
      const s = f % 4 < 2 ? 0 : 1;
      down(bx - 2, 0);
      R(bx + BW, bt + 1 + b, sR - bx - BW, 2, shD);
      R(sR, bt - 2 + b, 2, 4, shD);
      R(sR + s, bt - 4 + b, 2, 2, sk);
    } else if (pose === 'cheer' || pose === 'lift') {
      const k = pose === 'lift' ? (f % 4 < 2 ? 0 : 3) : f % 6 < 3 ? 0 : 1;
      raised(sL, k);
      raised(sR, k);
      if (pose === 'lift') {
        R(sL - 3, bt - 7 + k, sR - sL + 8, 1, '#8b90a8');
        R(sL - 4, bt - 9 + k, 2, 5, '#23263a');
        R(sR + 4, bt - 9 + k, 2, 5, '#23263a');
      }
    } else if (pose === 'palm') {
      down(bx - 2, 0);
      const ey = HY + 1 + Math.round(HH * 0.56);
      post.push(() => {
        R(cx + 2, ey + 2, 3, bt - ey, shD);
        R(cx - 3, ey - 1, 6, 3, sk);
        R(cx - 3, ey + 1, 6, 1, skD);
      });
    } else if (L.carry) {
      R(bx - 2, bt + 1 + b, 2, 7, shD);
      R(bx + BW, bt + 1 + b, 2, 7, shD);
      if (dir === 0) {
        R(bx - 1, bt + 7 + b, 2, 2, sk);
        R(bx + BW - 1, bt + 7 + b, 2, 2, sk);
      }
    } else {
      let aL = 0,
        aR = 0;
      if (walk) {
        aL = f < 3 ? 1 : -1;
        aR = -aL;
      }
      down(bx - 2, aL);
      if (L.mug && walk && dir === 0) {
        R(bx + BW, bt + 1 + b, 2, 4, shD);
        R(bx + BW - 1, bt + 5 + b, 4, 4, '#fff');
        R(bx + BW - 1, bt + 5 + b, 4, 1, '#8a5a34');
        R(bx + BW + 3, bt + 6 + b, 1, 2, '#fff');
      } else down(bx + BW, aR);
    }
  } else {
    const tw = Math.max(4, BW - 2),
      tx = cx - (tw >> 1);
    R(tx, bt + b, tw, BH, sh);
    R(tx, bt + b, tw, 1, shL);
    R(tx, bt + BH - 1 + b, tw, 1, shD);
    if (L.fit === 'stripe')
      for (let y = bt + 2; y < bt + BH - 1; y += 2) R(tx, y + b, tw - 1, 1, '#fff');
    if (L.fit === 'suit') R(tx + tw - 1, bt + b, 1, BH - 2, '#f2f2f2');
    if (L.fit === 'hood') R(tx - 1, bt + b, 3, 3, shD);
    if (pose === 'eat') {
      if (f % 8 < 3) {
        R(cx - 1, bt + 1 + b, 2, 3, shD);
        R(cx + 1, bt + b, 2, 3, shD);
        R(cx + 3, bt - 2 + b, 2, 2, sk);
      } else {
        R(cx - 1, bt + 1 + b, 2, 5, shD);
        R(cx + 1, bt + 5 + b, 4, 2, shD);
        R(cx + 5, bt + 5 + b, 2, 2, sk);
      }
    } else if (L.carry) {
      R(cx - 1, bt + 1 + b, 2, 6, shD);
      R(cx + 1, bt + 6 + b, 4, 2, shD);
      R(cx + 5, bt + 6 + b, 2, 2, sk);
    } else if (L.mug && walk) {
      R(cx - 1, bt + 1 + b, 2, al - 2, shD);
      R(cx + 1, bt + al - 2 + b, 2, 2, sk);
      R(cx + 3, bt + al - 4 + b, 4, 4, '#fff');
      R(cx + 3, bt + al - 4 + b, 4, 1, '#8a5a34');
    } else {
      const s = walk ? -SWING[f] : 0,
        ax = cx - 1 + Math.sign(s) * Math.min(2, Math.abs(s));
      R(ax, bt + 1 + b, 2, al, shD);
      R(ax, bt + 1 + al + b, 2, 2, sk);
    }
  }
  // head
  const hy =
    HY + b + (pose === 'palm' ? 1 : 0) + (pose === 'type' && dir === 1 && f % 12 < 2 ? 1 : 0);
  const rd = D.round,
    ins = (r) => (r < rd.length ? rd[r] : HH - 1 - r < rd.length ? rd[HH - 1 - r] : 0),
    row = (r, c) => R(hx + ins(r), hy + r, HW - 2 * ins(r), 1, c),
    hr = Math.round(HH * 0.36),
    ey = hy + Math.round(HH * 0.56);
  if (dir === 1) {
    for (let r = 0; r < HH; r++) row(r, Hc);
    R(hx + 1, hy + HH - 3, HW - 2, 1, HD);
    R(hx + 2, hy + HH - 2, HW - 4, 1, HD);
    R(hx + 3, hy + 1, Math.max(2, (HW / 3) | 0), 1, HL);
    if (L.style === 'long') R(hx, hy + HH - 2, HW, 4, Hc);
    else row(HH - 1, skD);
  } else {
    for (let r = 0; r < HH; r++) row(r, sk);
    row(HH - 1, skD);
    for (let r = 0; r < hr; r++) row(r, Hc);
    if (dir === 0) {
      const sl = Math.round(HH * 0.3);
      R(hx, hy + hr, 2, sl, Hc);
      R(hx + HW - 2, hy + hr, 2, sl, Hc);
      if (L.style === 'fringe') R(hx + 2, hy + hr, Math.round(HW * 0.5), 1, Hc);
      if (L.style === 'long') {
        R(hx - 1, hy + hr, 2, HH - hr + 2, Hc);
        R(hx + HW - 1, hy + hr, 2, HH - hr + 2, Hc);
      }
      if (L.style === 'spiky') {
        R(hx + 2, hy - 1, 2, 1, Hc);
        R(hx + (HW >> 1), hy - 1, 2, 1, Hc);
        R(hx + HW - 3, hy - 1, 1, 1, Hc);
      }
      R(hx + 3, hy + 1, Math.max(2, (HW / 3) | 0), 1, HL);
      R(hx + 2, hy + hr - 1, HW - 4, 1, HD);
      if (L.beard) R(hx + 2, ey + 2, HW - 4, hy + HH - ey - 2, Hc);
      const e1 = hx + Math.round(HW * 0.22),
        e2 = hx + HW - Math.round(HW * 0.22) - 2,
        happy = pose === 'cheer',
        up = pose === 'think' && f % 8 < 4 ? 1 : 0;
      if (blink || happy) {
        const yy = happy ? ey : ey + 1;
        R(e1, yy, 2, 1, INK);
        R(e2, yy, 2, 1, INK);
      } else if (D.eye === 'dot') {
        R(e1, ey, 2, 2, INK);
        R(e2, ey, 2, 2, INK);
        R(e1 + up, ey, 1, 1, '#fff');
        R(e2 + up, ey, 1, 1, '#fff');
      } else {
        R(e1 + 1, ey - up, 1, 2, INK);
        R(e2, ey - up, 1, 2, INK);
      }
      if (happy) R(cx - 1, ey + 2, 2, HH > 10 ? 2 : 1, '#7a2430');
      else if (ey + 3 < hy + HH - 1) R(cx - 1, ey + 3, 2, 1, tone(sk, -0.35));
      if (L.acc === 'glasses') {
        R(e1 - 1, ey - 1, e2 - e1 + 4, 1, INK);
        R(e1 + 2, ey, e2 - e1 - 2, 1, INK);
      }
    } else {
      R(hx, hy + hr, Math.round(HW * 0.5), Math.round(HH * 0.45), Hc);
      if (L.style === 'long') R(hx, hy + hr, Math.round(HW * 0.4), HH - hr + 2, Hc);
      R(hx + 3, hy + 1, Math.max(2, (HW / 3) | 0), 1, HL);
      if (L.beard) R(hx + (HW >> 1), ey + 2, (HW >> 1) - 1, hy + HH - ey - 2, Hc);
      const e = hx + HW - Math.round(HW * 0.22) - 1;
      if (blink) R(e, ey + 1, 2, 1, INK);
      else if (D.eye === 'dot') {
        R(e, ey, 2, 2, INK);
        R(e + 1, ey, 1, 1, '#fff');
      } else R(e + 1, ey, 1, 2, INK);
      R(hx + HW, ey + 1, 1, 1, sk);
      if (pose === 'talk' && f % 2) R(hx + HW - 2, ey + 3, 2, 1, '#7a2430');
      if (L.acc === 'glasses') R(e - 1, ey - 1, 4, 1, INK);
    }
  }
  if (L.style === 'bun') {
    R(cx - 2, hy - 2, 4, 3, Hc);
    R(cx - 1, hy - 2, 2, 1, HL);
  }
  if (L.acc === 'cap') {
    const C = '#e0af68';
    row(0, C);
    for (let r = 1; r < hr; r++) row(r, C);
    R(hx + 3, hy + 1, 3, 1, tone(C, 0.3));
    if (dir === 0) R(hx, hy + hr, HW, 1, tone(C, -0.25));
    if (dir > 1) R(hx + (HW >> 1), hy + hr, (HW >> 1) + 2, 1, tone(C, -0.25));
  }
  if (L.acc === 'phones') {
    R(hx + 2, hy - 1, HW - 4, 1, INK);
    if (dir < 2) {
      R(hx - 2, hy + 3, 2, 4, '#f7768e');
      R(hx + HW, hy + 3, 2, 4, '#f7768e');
    } else R(hx + 2, hy + 3, 3, 4, '#f7768e');
  }
  if (L.acc === 'ears') {
    R(hx + 1, hy - 2, 2, 2, Hc);
    R(hx + HW - 3, hy - 2, 2, 2, Hc);
  }
  post.forEach((fn) => fn());
}
function sprite(L, d, pose, dir, f, blink, sit) {
  const k = d.id + L.id + pose + dir + '.' + f + (blink ? 'b' : '') + (sit ? 's' : '');
  let s = cache.get(k);
  if (s) return s;
  let c = spr(PW, PH, (R) => guy(R, L, d, pose, dir > 2 ? 2 : dir, f, blink, sit));
  if (dir === 3) c = flip(c);
  s = inked(c);
  cache.set(k, s);
  return s;
}
function sleeper(L) {
  const k = 'sl' + L.id;
  let v = cache.get(k);
  if (v) return v;
  v = inked(
    spr(36, 12, (R) => {
      const sk = L.skin;
      R(11, 3, 10, 7, L.shirt);
      R(11, 3, 10, 1, tone(L.shirt, 0.25));
      R(11, 9, 10, 1, tone(L.shirt, -0.22));
      R(21, 4, 10, 5, L.pants);
      R(21, 8, 10, 1, tone(L.pants, -0.25));
      R(31, 3, 3, 6, SHOE);
      R(13, 8, 5, 2, sk);
      R(1, 1, 10, 10, sk);
      R(0, 2, 12, 8, sk);
      R(0, 1, 4, 10, L.hair);
      R(1, 0, 9, 2, L.hair);
      R(5, 5, 2, 1, INK);
      R(5, 8, 2, 1, INK);
      R(8, 6, 1, 2, tone(sk, -0.35));
    })
  );
  cache.set(k, v);
  return v;
}
function frameOf(pose, T, rate) {
  return pose === 'walk' || pose === 'cheer'
    ? ((T * 8) | 0) % 6
    : pose === 'type'
      ? ((T * (rate || 9)) | 0) % 12
      : pose === 'idle'
        ? ((T * 2) | 0) % 4
        : pose === 'talk'
          ? ((T * 5) | 0) % 4
          : pose === 'wave'
            ? ((T * 6) | 0) % 8
            : ((T * 3) | 0) % 8;
}

design();
export const build = (intern) => (intern ? DI : D);
export { HY, sprite, sleeper, frameOf };
