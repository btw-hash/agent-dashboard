import { spr, inked, tone, INK } from '../../engine/pixel.js';
import { F } from '../../art/furniture.js';
import { label, box, createFx } from './_px.js';

// Memory match on the hall whiteboard: twelve sticky notes, six office things, find the pairs.
// A found pair flies into the bin. Wait too long and the cat knocks a note crooked (cosmetic).
const W = 160,
  H = 120,
  NW = 28,
  NH = 22,
  OX = 17,
  OY = 17,
  BIN = [143, 103];
const cx = (i) => OX + (i % 4) * (NW + 6);
const cy = (i) => OY + ((i / 4) | 0) * (NH + 4);
const PAPER = ['#fff3a3', '#ffd0f4', '#c8f0d0', '#c8dcff', '#ffe0b8', '#e5d4ff'];

const ICON = [
  (R) => {
    R(2, 2, 8, 11, '#f2ede2');
    R(2, 2, 8, 2, '#6e4526');
    R(2, 7, 8, 2, '#3b5bdb');
    R(2, 12, 8, 1, '#c9c0ae');
    R(10, 4, 3, 1, '#f2ede2');
    R(12, 4, 1, 6, '#f2ede2');
    R(10, 9, 3, 1, '#f2ede2');
  },
  (R) => {
    R(2, 4, 10, 8, '#f08a3c');
    R(2, 2, 2, 3, '#f08a3c');
    R(10, 2, 2, 3, '#f08a3c');
    R(3, 3, 1, 1, '#f7768e');
    R(10, 3, 1, 1, '#f7768e');
    R(6, 4, 2, 2, '#d9722a');
    R(4, 7, 1, 2, INK);
    R(9, 7, 1, 2, INK);
    R(6, 9, 2, 1, '#f7768e');
    R(2, 11, 10, 1, '#d9722a');
  },
  (R) => {
    R(5, 1, 4, 3, '#f4f4f0');
    R(6, 3, 3, 6, '#f4f4f0');
    R(2, 8, 10, 5, '#f4f4f0');
    R(9, 2, 4, 2, '#ff8a3d');
    R(7, 2, 1, 1, INK);
    R(3, 12, 8, 1, '#c9c9c2');
    R(3, 9, 5, 2, '#dfe3ee');
  },
  (R) => {
    R(1, 1, 12, 3, '#d9944a');
    for (let i = 0; i < 9; i++) R(2 + (i >> 1), 4 + i, 10 - i, 1, '#ffd23f');
    R(4, 5, 2, 2, '#c0392b');
    R(8, 6, 2, 2, '#c0392b');
    R(6, 9, 2, 2, '#c0392b');
  },
  (R) => {
    R(2, 7, 9, 5, '#ffd23f');
    R(6, 2, 5, 5, '#ffd23f');
    R(11, 4, 3, 2, '#ff8a3d');
    R(9, 3, 1, 1, INK);
    R(4, 8, 4, 2, '#e0af68');
    R(1, 6, 2, 2, '#ffd23f');
    R(3, 11, 7, 1, '#e0af68');
  },
  (R) => {
    R(5, 2, 4, 9, '#3f9b5b');
    R(2, 5, 3, 2, '#3f9b5b');
    R(2, 3, 1, 3, '#3f9b5b');
    R(9, 6, 3, 2, '#3f9b5b');
    R(11, 4, 1, 3, '#3f9b5b');
    R(7, 3, 1, 6, '#2f7a47');
    R(6, 0, 2, 2, '#f7768e');
    R(3, 10, 8, 4, '#d98b5f');
    R(3, 10, 8, 1, '#e9a57a');
  },
].map((fn) => inked(spr(14, 14, fn)));

function note(c, x, y, w, h, sym) {
  box(c, x - 1, y - 1, w + 2, h + 2, INK);
  const face = sym >= 0;
  box(c, x, y, w, h, face ? PAPER[sym] : '#ffe66b');
  box(c, x, y, w, 3, face ? tone(PAPER[sym], -0.1) : '#f0cf3f');
  box(c, x, y + h - 1, w, 1, 'rgba(18,19,42,.18)');
  if (w < 14) return;
  if (face) {
    if (w >= 22 && h >= 18) c.drawImage(ICON[sym], x + ((w - 16) >> 1), y + 3 + ((h - 19) >> 1));
  } else if (w >= 14) {
    box(c, x + ((w - 3) >> 1), y + 3, 3, 3, '#e03131');
    box(c, x + 4, y + 11, w - 8, 1, '#e0c24a');
    box(c, x + 4, y + 15, w - 14, 1, '#e0c24a');
  }
}

export default {
  size: [W, H],
  how: 'TAP',
  start(api) {
    const fx = createFx();
    const deck = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const cards = deck.map((sym) => ({ sym, a: 0, dir: 0, open: false, done: false, ox: 0 }));
    const flights = [];
    let up = [],
      lock = 0,
      moves = 0,
      pairs = 0,
      gone = 0,
      score = 0,
      fin = 0,
      idle = 0,
      paw = null,
      binK = 0,
      T = 0;

    function startPaw() {
      const free = cards
        .map((k, i) => i)
        .filter((i) => !cards[i].open && !cards[i].done && (i % 4 === 0 || i % 4 === 3));
      if (!free.length) return;
      const i = free[(Math.random() * free.length) | 0];
      paw = { i, t: 0, side: i % 4 === 0 ? 1 : -1 };
    }

    return {
      state: () => ({
        syms: cards.map((k) => k.sym),
        open: cards.map((k) => k.open),
        done: cards.map((k) => k.done),
        cells: cards.map((k, i) => [cx(i) + NW / 2, cy(i) + NH / 2]),
        lock,
        pairs,
        moves,
        score,
        paw: !!paw,
        pawT: paw ? paw.t : 0,
      }),
      tap(x, y) {
        idle = 0;
        if (lock > 0 || fin > 0 || up.length > 1) return;
        const i = cards.findIndex(
          (k, n) => x >= cx(n) && x < cx(n) + NW && y >= cy(n) && y < cy(n) + NH
        );
        if (i < 0 || cards[i].open || cards[i].done) return;
        cards[i].open = true;
        cards[i].dir = 1;
        up.push(i);
        if (up.length < 2) return;
        moves++;
        const [p, q] = up;
        if (cards[p].sym === cards[q].sym) {
          pairs++;
          const gain = Math.max(10, 30 - moves * 2);
          score += gain;
          cards[p].done = cards[q].done = true;
          flights.push({ i: p, t: -0.5 }, { i: q, t: -0.5 });
          up = [];
          fx.pop(cx(q) + NW / 2, cy(q) - 2, '+' + gain, '#2f9e44');
          if (pairs === 6) score += Math.max(0, 60 - moves * 5);
          api.score(score);
        } else lock = 0.9;
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        binK = Math.max(0, binK - dt);
        for (const k of cards) {
          if (!k.dir) continue;
          k.a = Math.max(0, Math.min(1, k.a + k.dir * 11 * dt));
          if (k.a === 0 || k.a === 1) k.dir = 0;
        }
        if (lock > 0) {
          lock -= dt;
          if (lock <= 0) {
            for (const i of up) {
              cards[i].open = false;
              cards[i].dir = -1;
            }
            up = [];
          }
        }
        for (let n = flights.length - 1; n >= 0; n--) {
          const f = flights[n];
          f.t += dt;
          if (f.t >= 0.8) {
            flights.splice(n, 1);
            gone++;
            binK = 0.25;
            fx.burst(BIN[0] + 6, BIN[1] + 2, ['#ffe66b', '#fff3a3', '#c8dcff'], 6, 30);
            if (gone === 12) fin = 1.4;
          }
        }
        if (paw) {
          paw.t += dt;
          const k = cards[paw.i];
          if (paw.t > 0.7 && paw.t < 0.95 && !k.open && !k.done) {
            const e = (paw.t - 0.7) / 0.25;
            k.ox = Math.round(paw.side * 3 * e);
            if (!paw.hit) {
              paw.hit = 1;
              fx.pop(cx(paw.i) + NW / 2, cy(paw.i) + 8, 'MRRP', '#e03131');
              fx.shake(2);
            }
          }
          if (paw.t > 1.8) paw = null;
        } else if (!lock && !fin && gone < 12 && (idle += dt) >= 6) {
          idle = 0;
          startPaw();
        }
        if (fin > 0) {
          fin -= dt;
          if (fin <= 0) api.over(score);
        }
      },
      draw(c) {
        const [ox, oy] = fx.offset();
        c.setTransform(1, 0, 0, 1, ox, oy);
        box(c, -4, -4, W + 8, H + 8, '#343b6b');
        for (let x = 6; x < W; x += 20) box(c, x, 0, 1, 98, '#2f3560');
        box(c, 0, 0, W, 1, '#3d4580');
        label(c, 'FIND 6 PAIRS', 80, 4, '#aab6e8', 1, 'center');
        // the whiteboard, framed: the notes on it are the interface
        box(c, 5, 12, 150, 85, INK);
        box(c, 6, 13, 148, 83, '#aab0c8');
        box(c, 6, 13, 148, 1, '#d4d8e6');
        box(c, 8, 15, 144, 79, '#f7f8fb');
        box(c, 8, 15, 144, 1, '#e3e6f0');
        cards.forEach((k, i) => {
          if (k.done) box(c, cx(i), cy(i), NW, NH, '#eceef5');
        });
        cards.forEach((k, i) => {
          if (k.done) return;
          const w = Math.round(NW * Math.abs(Math.cos(k.a * Math.PI))),
            x = cx(i) + k.ox + (NW - w) / 2;
          if (w < 2) return;
          if (up.length === 1 && up[0] === i) box(c, x - 2, cy(i) - 2, w + 4, NH + 4, '#ffd23f');
          note(c, x, cy(i), w, NH, k.a >= 0.5 ? k.sym : -1);
        });
        flights.forEach((f) => {
          const k = cards[f.i];
          if (f.t < 0) {
            note(c, cx(f.i) + k.ox, cy(f.i), NW, NH, k.sym);
            return;
          }
          const e = f.t / 0.8,
            s = e * e * (3 - 2 * e),
            w = Math.round(NW - 20 * s),
            h = Math.round(NH - 14 * s),
            x = cx(f.i) + k.ox + (BIN[0] + 1 - cx(f.i) - k.ox) * s,
            y = cy(f.i) + (BIN[1] - cy(f.i)) * s - Math.sin(Math.PI * s) * 16;
          note(c, x, y, w, h, k.sym);
        });
        if (paw) {
          const y = cy(paw.i) + 8,
            p = paw.t,
            ph = p < 0.35 ? p / 0.35 : p < 0.95 ? 1 : 1 - (p - 0.95) / 0.85,
            reach = ph * ph * (3 - 2 * ph);
          const near = paw.side > 0 ? cx(paw.i) - 2 : cx(paw.i) + NW + 2;
          const push =
            p > 0.7 && p < 0.95 ? ((p - 0.7) / 0.25) * 3 * paw.side : p >= 0.95 ? 3 * paw.side : 0;
          const tip =
            paw.side > 0 ? -6 + (near + push + 6) * reach : 166 - (166 - near - push) * reach;
          const len = Math.abs(tip - (paw.side > 0 ? -6 : 166));
          const x0 = paw.side > 0 ? -6 : tip;
          box(c, x0 - 1, y - 5, len + 2, 11, INK);
          box(c, x0, y - 4, len, 9, '#f08a3c');
          box(c, x0, y - 4, len, 1, '#f6a864');
          box(c, x0, y + 1, len, 1, '#d9722a');
          const px = paw.side > 0 ? tip - 7 : tip,
            u = (n, w = 1) => (paw.side > 0 ? px + n : px + 7 - n - w);
          box(c, px, y - 6, 7, 13, INK);
          box(c, px - 1, y - 5, 9, 11, INK);
          box(c, px, y - 5, 7, 11, '#f6a864');
          box(c, u(4, 3), y - 2, 3, 1, '#d9722a');
          box(c, u(4, 3), y + 2, 3, 1, '#d9722a');
          box(c, u(1, 3), y - 1, 3, 3, '#f7768e');
        }
        // the button bar: moves, score and the bin the pairs fly into
        box(c, 0, 99, W, H - 99, INK);
        box(c, 0, 100, W, 1, '#3a3f5c');
        label(c, 'MOVES ' + moves, 6, 104, '#aab6e8');
        label(c, 'PAIRS ' + pairs, 6, 112, '#9ece6a');
        label(c, 'SCORE', 100, 104, '#7a84ad', 1, 'right');
        label(c, score, 100, 112, '#ffd23f', 1, 'right');
        box(c, BIN[0] - 4, 100, 20, 19, '#aab0c8');
        box(c, BIN[0] - 3, 101, 18, 17, '#6a7090');
        c.drawImage(F.bin, BIN[0] - 1, BIN[1] - 1 + (binK > 0 ? 1 : 0));
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (fin > 0) {
          box(c, 40, 48, 80, 20, INK);
          box(c, 41, 49, 78, 18, '#2f9e44');
          label(c, 'ALL FOUND!', 80, 55, '#f7f8fb', 1, 'center');
        }
      },
    };
  },
};
