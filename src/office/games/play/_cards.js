import { spr, inked, slab, tone, text, INK } from '../../engine/pixel.js';
import { sprite, build, frameOf } from '../../art/people.js';
import { label, box, makeLook } from './_px.js';

// Shared by the casino games (poker, blackjack, roulette, slots, tic-tac-toe): the cards and their
// rules, and the pixel pieces of the lounge picture - the backdrop, a seated dealer, the framed felt
// panel, buttons, chips and the speech bubble.
export const SUITS = ['S', 'H', 'D', 'C'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const SHAPE = {
  H: ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'],
  D: ['0001000', '0011100', '0111110', '1111111', '0111110', '0011100', '0001000'],
  S: ['0001000', '0011100', '0111110', '1111111', '1111111', '0001000', '0011100'],
  C: ['0011100', '0111110', '0011100', '1111111', '1111111', '0001000', '0011100'],
};

export function rankValue(r) {
  if (r === 'A') return 14;
  if (r === 'K') return 13;
  if (r === 'Q') return 12;
  if (r === 'J') return 11;
  return parseInt(r, 10);
}

export function makeDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
  return d;
}

export function shuffle(deck) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function handTotal(cards) {
  let total = 0,
    aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') {
      total += 11;
      aces++;
    } else if (c.rank === 'K' || c.rank === 'Q' || c.rank === 'J') total += 10;
    else total += parseInt(c.rank, 10);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

export function evaluatePokerHand(cards) {
  const vals = cards.map((c) => rankValue(c.rank)).sort((a, b) => b - a);
  const counts = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  const entries = Object.entries(counts)
    .map(([v, n]) => [parseInt(v, 10), n])
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : b[0] - a[0]));
  const pattern = entries.map((e) => e[1]).join('');
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const uniq = [...new Set(vals)].sort((a, b) => b - a);
  let straight = false,
    high = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) {
      straight = true;
      high = uniq[0];
    } else if (uniq.join() === '14,5,4,3,2') {
      straight = true;
      high = 5;
    }
  }
  const tiebreak = entries.flatMap(([v, n]) => Array(n).fill(v));
  if (straight && flush && high === 14) return { rank: 9, name: 'Royal Flush', tiebreak: [14] };
  if (straight && flush) return { rank: 8, name: 'Straight Flush', tiebreak: [high] };
  if (pattern === '41') return { rank: 7, name: 'Four of a Kind', tiebreak };
  if (pattern === '32') return { rank: 6, name: 'Full House', tiebreak };
  if (flush) return { rank: 5, name: 'Flush', tiebreak: vals };
  if (straight) return { rank: 4, name: 'Straight', tiebreak: [high] };
  if (pattern === '311') return { rank: 3, name: 'Three of a Kind', tiebreak };
  if (pattern === '221') return { rank: 2, name: 'Two Pair', tiebreak };
  if (pattern === '2111') return { rank: 1, name: 'One Pair', tiebreak };
  return { rank: 0, name: 'High Card', tiebreak: vals };
}

export function comparePokerHands(a, b) {
  if (a.rank !== b.rank) return a.rank > b.rank ? 1 : -1;
  const n = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < n; i++) {
    const av = a.tiebreak[i] || 0,
      bv = b.tiebreak[i] || 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

export function hitButton(list, x, y) {
  return list.find((b) => b.on && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
}

export function okSel(list, sel) {
  if (list[sel] && list[sel].on) return sel;
  const i = list.findIndex((b) => b.on);
  return i < 0 ? 0 : i;
}

export function stepSel(list, sel, d) {
  const n = list.length;
  for (let k = 1; k <= n; k++) {
    const i = (((sel + d * k) % n) + n) % n;
    if (list[i].on) return i;
  }
  return sel;
}

export function row(labels, y, h, gap, w, total, ox = 0) {
  const n = labels.length,
    bw = Math.min(w, Math.floor((total - gap * (n + 1)) / n)),
    x0 = ox + Math.round((total - (bw * n + gap * (n - 1))) / 2);
  return labels.map((b, i) => ({ ...b, x: x0 + i * (bw + gap), y, w: bw, h }));
}

// ---- the cards in pixels: 11x14 and an ink outline, a rank and a pip
export const CARD_W = 13,
  CARD_H = 16;
const cardCache = new Map();
export function cardSprite(card) {
  const k = card ? card.rank + card.suit : 'back';
  let s = cardCache.get(k);
  if (s) return s;
  const red = card && (card.suit === 'H' || card.suit === 'D'),
    ink = red ? '#d03040' : '#23263a';
  const base = spr(11, 14, (R) => {
    const bg = card ? '#fbf6ea' : '#e0af68';
    R(1, 0, 9, 14, bg);
    R(0, 1, 11, 12, bg);
    if (card) {
      SHAPE[card.suit].forEach((r, j) => {
        for (let i = 0; i < 7; i++) if (r[i] === '1') R(2 + i, 7 + j, 1, 1, ink);
      });
    } else {
      R(2, 2, 7, 10, '#1a2a4e');
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 2; i++) R(3 + i * 3 + (j % 2), 3 + j * 3, 2, 2, '#3a5a8e');
    }
  });
  if (card) text(base.getContext('2d'), card.rank, 1, 1, ink);
  s = inked(base);
  cardCache.set(k, s);
  return s;
}
// k is the flip: 0 shows the back, 1 the face, in between the card turns edge-on
export function drawCard(c, x, y, card, k = 1) {
  const face = card && k >= 0.5,
    s = cardSprite(face ? card : null),
    w = Math.max(2, Math.round(s.width * (card && k < 1 ? Math.abs(1 - 2 * k) : 1)));
  c.imageSmoothingEnabled = false;
  c.drawImage(s, Math.round(x + (s.width - w) / 2), Math.round(y), w, s.height);
}
const SLIDE = 0.2,
  TURN = 0.3;
// a card on its way: starts at `from` when the clock reaches `at`, lands at (x, y)
export const slot = (card, x, y, from, at, hidden = false) => ({
  card,
  x,
  y,
  from,
  at,
  hidden,
  flipAt: -1,
});
export const landed = (o, T) => T - o.at >= SLIDE;
export const flipUp = (o, T) => {
  if (o.hidden && o.flipAt < 0) o.flipAt = T;
};
export function putCard(c, o, T) {
  const p = (T - o.at) / SLIDE;
  if (p < 0) return;
  const e = p >= 1 ? 1 : 1 - (1 - p) ** 3,
    k = !o.hidden ? 1 : o.flipAt < 0 ? 0 : Math.min(1, (T - o.flipAt) / TURN);
  drawCard(c, o.from[0] + (o.x - o.from[0]) * e, o.from[1] + (o.y - o.from[1]) * e, o.card, k);
}

// ---- the lounge: wine wall with its pattern, gold trim, carpet, drapes at the sides
export function lounge(c, floor, W = 120) {
  const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
  R(-4, -4, W + 8, floor + 2, '#4a1f33');
  for (let y = 3; y < floor - 4; y += 12)
    for (let x = ((y / 12) % 2) * 8 - 4; x < W; x += 16) {
      R(x + 1, y, 2, 1, '#5a2238');
      R(x, y + 1, 4, 1, '#5a2238');
      R(x + 1, y + 2, 2, 1, '#5a2238');
    }
  R(-4, floor - 2, W + 8, 2, '#e0af68');
  R(-4, floor, W + 8, 130, '#5a2238');
  for (let x = 4; x < W; x += 12) R(x, floor + 4 + ((x / 12) % 2) * 5, 3, 2, '#73304d');
  [0, W - 6].forEach((x) => {
    R(x, 0, 6, floor - 2, '#74344f');
    R(x + 2, 0, 1, floor - 2, '#4a1f33');
    R(x + 4, 0, 1, floor - 2, '#4a1f33');
    R(x, 0, 6, 3, '#e0af68');
  });
}

// a person sitting behind a table: no legs drawn, the table hides the rest. y is the top of the picture.
export function seat(c, L, pose, T, x, y, blink) {
  c.drawImage(
    sprite(L, build(false), pose, 0, frameOf(pose, T), !!blink, true),
    Math.round(x) - 13,
    Math.round(y)
  );
}
export const blinks = (T, k = 0) => (T * 1000 + k * 977) % 4200 < 140;
export const dealerLook = () =>
  Object.assign(makeLook(), { fit: 'suit', acc: '', beard: false, style: 'fringe' });

// ---- a felt panel with a gold edge: the close-up interface, sized larger than the lounge around it
export function panel(c, x, y, w, h, felt = '#2f7a47') {
  box(c, x - 1, y - 1, w + 2, h + 2, INK);
  box(c, x, y, w, h, '#e0af68');
  box(c, x, y, w, 1, '#f6d58f');
  box(c, x + 1, y + 1, w - 2, h - 2, tone(felt, -0.3));
  box(c, x + 2, y + 2, w - 4, h - 4, felt);
  const dark = tone(felt, -0.1);
  for (let j = y + 3; j < y + h - 3; j += 4)
    for (let i = x + 3 + ((((j - y) / 4) | 0) % 2) * 2; i < x + w - 3; i += 4)
      box(c, i, j, 1, 1, dark);
}

// ---- buttons: flat slabs, the chosen one has a yellow frame
export function drawBtns(c, list, sel, pressed) {
  list.forEach((b, i) => {
    const dn = pressed === b.id ? 1 : 0;
    if (b.on && i === sel) box(c, b.x - 2, b.y - 2, b.w + 4, b.h + 4, '#ffd23f');
    box(c, b.x - 1, b.y - 1, b.w + 2, b.h + 2, INK);
    if (b.on) {
      slab((x, y, w, h, col) => box(c, x, y, w, h, col), b.x, b.y + dn, b.w, b.h - dn, b.col);
      label(c, b.label, b.x + b.w / 2, b.y + Math.round((b.h - 5) / 2) + dn, INK, 1, 'center');
    } else {
      box(c, b.x, b.y, b.w, b.h, '#3a3f5c');
      label(c, b.label, b.x + b.w / 2, b.y + Math.round((b.h - 5) / 2), '#7a84ad', 1, 'center');
    }
  });
}

// ---- chips
const CHIP = ['#e03131', '#3b5bdb', '#2f9e44', '#ffd23f'];
export function chip(c, x, y, col) {
  box(c, x + 1, y, 5, 5, INK);
  box(c, x, y + 1, 7, 3, INK);
  box(c, x + 1, y + 1, 5, 3, col);
  box(c, x + 2, y + 1, 3, 1, tone(col, 0.35));
  box(c, x + 1, y + 3, 5, 1, tone(col, -0.25));
}
// n chips as small stacks, bottom-left at (x, y)
export function pile(c, x, y, n, cap = 4) {
  for (let i = 0; i < n; i++) {
    const s = (i / cap) | 0,
      yy = y - (i % cap) * 2,
      col = CHIP[s % 4],
      sx = x + s * 6;
    box(c, sx, yy - 1, 6, 4, INK);
    box(c, sx + 1, yy, 4, 1, tone(col, 0.3));
    box(c, sx + 1, yy + 1, 4, 1, col);
  }
}
// chips in flight: send() them from one place to another, a little arc on the way
export function createFlyers() {
  const l = [],
    DUR = 0.45;
  return {
    send(x0, y0, x1, y1, delay = 0, col = '#ffd23f') {
      l.push({ x0, y0, x1, y1, t: -delay, col });
    },
    tick(dt) {
      for (let i = l.length - 1; i >= 0; i--) {
        l[i].t += dt;
        if (l[i].t > DUR) l.splice(i, 1);
      }
    },
    draw(c) {
      l.forEach((f) => {
        if (f.t < 0) return;
        const e = f.t / DUR;
        chip(
          c,
          Math.round(f.x0 + (f.x1 - f.x0) * e),
          Math.round(f.y0 + (f.y1 - f.y0) * e - Math.sin(e * Math.PI) * 9),
          f.col
        );
      });
    },
    busy: () => l.length > 0,
  };
}

// ---- words: a box with the line it says, wrapped to the width
export function wrap(str, n) {
  const out = [];
  let cur = '';
  String(str)
    .toUpperCase()
    .split(' ')
    .forEach((w) => {
      if (cur && (cur + ' ' + w).length > n) {
        out.push(cur);
        cur = w;
      } else cur = cur ? cur + ' ' + w : w;
    });
  if (cur) out.push(cur);
  return out;
}
export function plate(c, x, y, w, lines, col = '#f2ede2') {
  const h = lines.length * 7 + 3;
  box(c, x - 1, y - 1, w + 2, h + 2, INK);
  box(c, x, y, w, h, '#e0af68');
  box(c, x + 1, y + 1, w - 2, h - 2, '#1a1030');
  lines.forEach((s, i) => label(c, s, x + w / 2, y + 3 + i * 7, col, 1, 'center'));
}
// a white speech bubble over a head; tx is where its little tail points
export function bubble(c, cx, y, str, tx) {
  const w = str.length * 4 + 3,
    x = Math.round(cx - w / 2);
  box(c, x - 1, y - 1, w + 2, 9, INK);
  box(c, x, y, w, 7, '#f7f8fb');
  box(c, tx - 1, y + 7, 3, 3, INK);
  box(c, tx, y + 7, 1, 2, '#f7f8fb');
  label(c, str, x + 2, y + 1, '#3a3f5c');
}
