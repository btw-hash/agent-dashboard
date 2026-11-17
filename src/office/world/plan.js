import { LW, LH, INK, tone, text } from '../engine/pixel.js';

export const WALL = 46,
  MID = 206,
  RWALL = 240,
  FEND = 356,
  DW = 26;
// the rooms differ in width on purpose: the cafe is where people gather, the gym is a corner
export const ROOMS = [
  {
    id: 'games',
    name: 'GAMES',
    x0: 3,
    x1: 150,
    door: 70,
    wall: '#33265e',
    wallL: '#4b3a86',
    fc: '#2b2f52',
    accent: '#ff4fd8',
  },
  {
    id: 'gym',
    name: 'GYM',
    x0: 153,
    x1: 270,
    door: 212,
    wall: '#35566b',
    wallL: '#4f7a94',
    fc: '#46536a',
    accent: '#9ece6a',
  },
  {
    id: 'lounge',
    name: 'LOUNGE',
    x0: 273,
    x1: 430,
    door: 352,
    wall: '#4a1f33',
    wallL: '#74344f',
    fc: '#5a2238',
    accent: '#e0af68',
  },
  {
    id: 'cafe',
    name: 'CAFE',
    x0: 433,
    x1: 637,
    door: 520,
    wall: '#2f5d5a',
    wallL: '#458783',
    fc: '#ece5d6',
    accent: '#39c5cf',
  },
];
// ── navigation: lanes that stay clear of furniture ──────────────
export const NODE = {
  uA: [66, 84],
  u1: [112, 84],
  uW: [186, 84],
  u2: [240, 84],
  u3: [370, 84],
  u4: [490, 84],
  uL: [557, 84],
  uB: [600, 84],
  p0: [34, 134],
  l0: [34, 188],
  lG: [70, 188],
  l1: [112, 188],
  lY: [212, 188],
  l2: [240, 188],
  lN: [352, 188],
  l3: [370, 188],
  l4: [490, 188],
  lC: [520, 188],
  l5: [612, 188],
  gIn: [70, 250],
  gC: [70, 284],
  gW: [30, 284],
  gS: [122, 284],
  yIn: [212, 250],
  yC: [212, 300],
  yW: [176, 300],
  yE: [236, 300],
  yB: [222, 336],
  nIn: [352, 250],
  nC: [352, 284],
  nW: [318, 272],
  nE: [384, 274],
  nB: [352, 322],
  cIn: [520, 250],
  cC: [520, 286],
  cE: [576, 274],
  cV: [476, 274],
};
export const EDGE =
  'uA-u1 u1-uW uW-u2 u2-u3 u3-u4 u4-uL uL-uB u1-l1 u2-l2 u3-l3 u4-l4 p0-l0 l0-lG lG-l1 l1-lY lY-l2 l2-lN lN-l3 l3-l4 l4-lC lC-l5 lG-gIn lY-yIn lN-nIn lC-cIn gIn-gC gC-gW gC-gS yIn-yC yC-yW yC-yE yC-yB nIn-nC nC-nW nC-nE nC-nB cIn-cC cC-cE cC-cV'
    .split(' ')
    .map((e) => e.split('-'));
export const ADJ = {};
EDGE.forEach(([a, b]) => {
  (ADJ[a] = ADJ[a] || []).push(b);
  (ADJ[b] = ADJ[b] || []).push(a);
});
export function bfs(a, b) {
  const prev = { [a]: null },
    q = [a];
  while (q.length) {
    const n = q.shift();
    if (n === b) break;
    for (const m of ADJ[n])
      if (!(m in prev)) {
        prev[m] = n;
        q.push(m);
      }
  }
  const out = [];
  for (let n = b; n; n = prev[n]) out.unshift(n);
  return out;
}
// a place where someone does something: [node, x, y, pose, dir, seated, seconds, sort offset]
export const SPOT = {
  board: ['uW', 184, 60, 'board', 1, 0, 7],
  server: ['uA', 66, 80, 'type', 1, 0, 6],
  printer: ['p0', 30, 130, 'idle', 1, 0, 4],
  plant: ['l0', 32, 198, 'idle', 3, 0, 4],
  scope: ['uB', 600, 82, 'idle', 1, 0, 6],
  tank: ['u1', 104, 78, 'idle', 1, 0, 5],
  arcA: ['gW', 17, 268, 'type', 1, 0, 8],
  arcB: ['gW', 41, 268, 'type', 1, 0, 8],
  sofaL: ['gS', 110, 306, 'idle', 1, 1, 9],
  sofaR: ['gS', 134, 306, 'idle', 1, 1, 9],
  foos: ['gW', 32, 302, 'type', 0, 0, 7],
  tread: ['yW', 172, 290, 'walk', 2, 0, 10, 6],
  bag: ['yE', 236, 296, 'idle', 2, 0, 6],
  lift: ['yB', 222, 340, 'lift', 0, 0, 8],
  juke: ['nW', 291, 267, 'idle', 1, 0, 5],
  slot: ['nW', 316, 267, 'type', 1, 0, 6],
  poker: ['nE', 388, 300, 'think', 0, 1, 10],
  roul: ['nC', 310, 298, 'idle', 0, 0, 7],
  crystal: ['nE', 364, 268, 'idle', 2, 0, 5],
  bj: ['nB', 380, 328, 'idle', 0, 0, 7],
  esp: ['cE', 576, 270, 'idle', 1, 0, 4],
  sipA: ['cV', 458, 308, 'sip', 0, 1, 9],
  sipB: ['cC', 512, 330, 'sip', 0, 1, 8],
  sipC: ['cE', 602, 312, 'sip', 0, 1, 8],
  vend: ['cV', 477, 267, 'idle', 1, 0, 4],
  talkA: ['lC', 538, 152, 'talk', 2, 0, 12],
  talkB: ['lC', 557, 152, 'talk', 3, 0, 12],
  nap: ['gC', 86, 342, 'sleep', 0, 0, 40],
};
export const LIFT = [557, 62];
// the 18 games and the object each one opens from: [name, room, marker x, marker y]
export const GAMES = [
  ['Memory match', 'Hall', 177, 22],
  ['Typing test', 'Hall', 411, 134],
  ['Plant care', 'Hall', 13, 186],
  ['Coffee machine', 'Cafe', 576, 232],
  ['Jukebox rhythm', 'Lounge', 291, 236],
  ['Crystal ball', 'Lounge', 383, 246],
  ['Poker', 'Lounge', 395, 300],
  ['Roulette', 'Lounge', 309, 312],
  ['Blackjack', 'Lounge', 381, 338],
  ['Slot machine', 'Lounge', 316, 236],
  ['Foosball', 'Games room', 32, 318],
  ['Minesweeper', 'Games room', 17, 236],
  ['Tic-tac-toe', 'Games room', 41, 236],
  ['Connect 4', 'Games room', 121, 266],
  ['Darts', 'Games room', 135, 330],
  ['Reaction test', 'Gym', 256, 268],
  ['Snake', 'Games room', 132, 211],
  ['Ping-pong', 'Gym', 182, 326],
].map((a, i) => ({ kind: 'game', n: i + 1, name: a[0], room: a[1], x: a[2], y: a[3] }));
// objects that lead somewhere else (the bonus views)
export const DOORS = [
  { kind: 'door', id: 'terminal', name: 'Server rack', x: 66, y: 52, r: [54, 30, 24, 44] },
  { kind: 'door', id: 'night', name: 'Telescope', x: 618, y: 62, r: [607, 47, 22, 34] },
  { kind: 'door', id: 'mini', name: '3D printer', x: 42, y: 102, r: [32, 93, 20, 17] },
];

export const KEY = [
  [0, [58, 66, 140], '#0b1030'],
  [5, [64, 70, 146], '#151b48'],
  [6.8, [255, 176, 138], '#ff9e7a'],
  [9, [255, 246, 230], '#a4d6ff'],
  [13, [255, 255, 255], '#8fd0ff'],
  [17, [255, 234, 200], '#a8d4ff'],
  [19.3, [255, 156, 112], '#ff8a5c'],
  [21, [78, 72, 152], '#1a1f55'],
  [24, [58, 66, 140], '#0b1030'],
];
export function sky(hour) {
  let a = KEY[0],
    b = KEY[1];
  for (let i = 0; i < KEY.length - 1; i++)
    if (hour >= KEY[i][0] && hour <= KEY[i + 1][0]) {
      a = KEY[i];
      b = KEY[i + 1];
      break;
    }
  const t = (hour - a[0]) / (b[0] - a[0] || 1);
  const amb = a[1].map((v, i) => v + (b[1][i] - v) * t),
    pa = parseInt(a[2].slice(1), 16),
    pb = parseInt(b[2].slice(1), 16),
    mix = (sh) => (((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t) | 0;
  return { amb, sky: 'rgb(' + mix(16) + ',' + mix(8) + ',' + mix(0) + ')' };
}
export const WINS = [86, 222, 366, 598];
// light sources: [x, y, colour, radius, strength]. Every pool has a lamp, a screen or a sign under it
export const LIGHTS = [
  [28, 22, '#ff4fd8', 60, 0.9],
  [66, 56, '#7cff6b', 36, 0.5],
  [104, 56, '#39d3ff', 44, 0.7],
  [300, 20, '#8fd3ff', 46, 0.6],
  [225, 126, '#ffd39a', 96, 0.85],
  [557, 60, '#ffe2a8', 60, 0.7],
  [42, 106, '#39c5cf', 34, 0.5],
  [166, 118, '#ffe2a8', 70, 0.5],
  [304, 118, '#ffe2a8', 70, 0.5],
  [434, 118, '#ffe2a8', 70, 0.5],
  [540, 112, '#ffe2a8', 74, 0.6],
  [32, 246, '#39d3ff', 50, 0.85],
  [134, 224, '#bb9af7', 46, 0.8],
  [76, 214, '#ff4fd8', 90, 0.5],
  [212, 236, '#e6f6fb', 110, 0.75],
  [291, 244, '#ff4fd8', 40, 0.7],
  [316, 244, '#ffd23f', 34, 0.6],
  [280, 278, '#ffd39a', 86, 0.9],
  [383, 250, '#bb9af7', 34, 0.75],
  [395, 300, '#ffd39a', 60, 0.5],
  [520, 280, '#ffe2a8', 120, 0.8],
  [576, 236, '#ffe2a8', 50, 0.5],
  [477, 244, '#7aa2f7', 38, 0.6],
];

// ── static background: floors, walls, doors ─────────────────────
export function paintBg(bgc) {
  const x = bgc.getContext('2d'),
    R = (X, Y, W, H, c) => {
      if (W > 0 && H > 0) {
        x.fillStyle = c;
        x.fillRect(X, Y, W, H);
      }
    };
  const pl = ['#c99d6c', '#c2935f', '#d0a674', '#bf9160'];
  for (let r = 0; r < (MID - WALL) / 8; r++) {
    const y = WALL + r * 8,
      c = pl[(r * 3) % 4];
    R(0, y, LW, 8, c);
    R(0, y, LW, 1, tone(c, 0.14));
    R(0, y + 7, LW, 1, '#8a5a34');
    for (let i = 0; i < 13; i++) R((i * 61 + r * 37) % LW, y + 1, 1, 6, '#9b6b3e');
  }
  R(0, 0, LW, WALL, '#343b6b');
  R(0, 0, LW, 4, '#4a5290');
  R(0, 4, LW, 1, '#5d66a8');
  R(0, 32, LW, 10, '#2e3566');
  R(0, 32, LW, 1, '#252a54');
  for (let X = 16; X < LW; X += 32) R(X, 33, 1, 9, '#252a54');
  R(0, 42, LW, 4, '#232847');
  R(0, 42, LW, 1, '#3d4480');
  for (let i = 0; i < 12; i++) R(0, WALL + i, LW, 1, 'rgba(18,19,42,' + (0.26 - i * 0.02) + ')');
  // rugs: muted, and each one with its own pattern so the clusters do not read as copies
  const rug = (X, Y, W, H, c, kind) => {
    R(X, Y, W, H, tone(c, -0.2));
    R(X + 2, Y + 2, W - 4, H - 4, c);
    const l = tone(c, 0.16),
      d = tone(c, -0.1);
    if (kind === 0) {
      R(X + 5, Y + 5, W - 10, 1, l);
      R(X + 5, Y + H - 6, W - 10, 1, l);
      R(X + 5, Y + 5, 1, H - 10, l);
      R(X + W - 6, Y + 5, 1, H - 10, l);
    }
    if (kind === 1) for (let i = X + 8; i < X + W - 8; i += 8) R(i, Y + 4, 1, H - 8, d);
    if (kind === 2)
      for (let yy = Y + 8; yy < Y + H - 6; yy += 10)
        for (let xx = X + 8 + (((yy - Y) / 10) % 2) * 5; xx < X + W - 8; xx += 10) {
          R(xx, yy, 2, 2, l);
        }
    if (kind === 3) {
      R(X + 8, Y + 8, W - 16, H - 16, d);
      R(X + 12, Y + 12, W - 24, H - 24, c);
      R(X + (W >> 1) - 6, Y + (H >> 1) - 4, 12, 8, l);
    }
    for (let i = X + 1; i < X + W; i += 3) {
      R(i, Y - 1, 1, 1, l);
      R(i, Y + H, 1, 1, l);
    }
  };
  rug(114, 86, 104, 96, '#4a4a8c', 0);
  rug(252, 86, 104, 96, '#3f6f72', 1);
  rug(382, 86, 104, 96, '#7c5468', 2);
  rug(500, 90, 84, 76, '#46527f', 3);
  R(546, 48, 26, 10, '#8a3f3f');
  R(548, 50, 22, 6, '#a85050');
  text(x, 'HI', 555, 51, '#f6d0d0');
  ROOMS.forEach((r) => {
    const w = r.x1 - r.x0,
      y0 = RWALL,
      h = FEND - RWALL,
      X0 = r.x0;
    R(X0, y0, w, h, r.fc);
    if (r.id === 'games')
      for (let ty = 0; ty < h; ty += 16)
        for (let tx = 0; tx < w; tx += 16) {
          R(X0 + tx, y0 + ty, Math.min(16, w - tx), 1, '#232744');
          R(X0 + tx, y0 + ty, 1, Math.min(16, h - ty), '#232744');
          const s = (tx * 7 + ty * 13) % 5;
          if (tx + 12 < w && ty + 12 < h) {
            R(
              X0 + tx + 3 + s * 2,
              y0 + ty + 4 + s,
              2,
              1,
              ['#ff4fd8', '#39d3ff', '#ffd23f', '#7cff6b', '#bb9af7'][s]
            );
            R(X0 + tx + 9 - s, y0 + ty + 10, 1, 2, '#3d4480');
          }
        }
    if (r.id === 'gym') {
      for (let ty = 0; ty < h; ty += 14)
        for (let tx = 0; tx < w; tx += 14) {
          const c = ((tx + ty) / 14) % 2 ? '#414e64' : '#46536a';
          R(X0 + tx, y0 + ty, Math.min(14, w - tx), Math.min(14, h - ty), c);
          R(X0 + tx, y0 + ty, Math.min(14, w - tx), 1, '#3a465a');
          R(X0 + tx, y0 + ty, 1, Math.min(14, h - ty), '#3a465a');
        }
      R(X0 + 3, y0 + 18, 42, 40, '#2f5f8a');
      R(X0 + 3, y0 + 18, 42, 1, '#4a86bd');
      R(X0 + 3, y0 + 57, 42, 1, '#234a6e');
      R(X0 + 52, y0 + 84, 60, 30, '#8a6a4a');
      R(X0 + 52, y0 + 84, 60, 1, '#b08a62');
      R(X0 + 52, y0 + 113, 60, 1, '#5e4630');
      R(X0 + 62, y0 + 85, 40, 28, '#3a3f5c');
      R(X0 + 62, y0 + 85, 40, 1, '#4a5290');
    }
    if (r.id === 'lounge') {
      for (let ty = 0; ty < h; ty += 12)
        for (let tx = ((ty / 12) % 2) * 6; tx < w - 4; tx += 12) {
          R(X0 + tx + 1, y0 + ty + 3, 2, 1, '#73304d');
          R(X0 + tx, y0 + ty + 4, 4, 1, '#73304d');
          R(X0 + tx + 1, y0 + ty + 5, 2, 1, '#73304d');
        }
      R(X0 + 6, y0 + 42, w - 12, 1, '#e0af68');
      R(X0 + 6, y0 + h - 6, w - 12, 1, '#e0af68');
      R(X0 + 6, y0 + 42, 1, h - 48, '#e0af68');
      R(X0 + w - 7, y0 + 42, 1, h - 48, '#e0af68');
    }
    if (r.id === 'cafe')
      for (let ty = 0; ty < h; ty += 10)
        for (let tx = 0; tx < w; tx += 10) {
          if (((tx + ty) / 10) % 2)
            R(X0 + tx, y0 + ty, Math.min(10, w - tx), Math.min(10, h - ty), '#dcd3c0');
          R(X0 + tx, y0 + ty, Math.min(10, w - tx), 1, '#cfc5b0');
        }
    R(X0, MID + 4, w, RWALL - MID - 4, r.wall);
    R(X0, MID + 4, w, 1, r.wallL);
    R(X0, MID + 12, w, 1, tone(r.wall, -0.14));
    R(X0, RWALL - 5, w, 5, tone(r.wall, -0.32));
    R(X0, RWALL - 5, w, 1, r.wallL);
    for (let i = 0; i < 8; i++) R(X0, RWALL + i, w, 1, 'rgba(18,19,42,' + (0.24 - i * 0.03) + ')');
  });
  // posters on the room walls
  const poster = (X, Y, c, fn) => {
    R(X - 1, Y - 1, 14, 18, INK);
    R(X, Y, 12, 16, c);
    fn(X, Y);
  };
  R(0, MID, LW, 4, '#232847');
  R(0, MID, LW, 1, '#3d4480');
  ROOMS.forEach((r) => {
    const d = r.door - DW / 2;
    R(d, MID, DW, RWALL - MID, r.fc);
    R(d, MID, DW, RWALL - MID, 'rgba(18,19,42,.22)');
    R(d + 3, MID + 2, DW - 6, 3, r.accent);
    R(d - 2, MID, 2, RWALL - MID, r.wallL);
    R(d + DW, MID, 2, RWALL - MID, r.wallL);
    R(d - 2, MID, DW + 4, 1, '#5d66a8');
    const tw = r.name.length * 4 + 3;
    R(d + DW + 5, MID + 9, tw + 2, 9, INK);
    R(d + DW + 6, MID + 10, tw, 7, '#11132a');
    text(x, r.name, d + DW + 8, MID + 11, r.accent);
  });
  ROOMS.slice(1).forEach((r) => {
    const X = r.x0 - 3;
    R(X, MID, 3, LH - MID, INK);
    R(X + 1, MID, 1, LH - MID, '#3d4480');
  });
  R(0, 0, 3, LH, INK);
  R(LW - 3, 0, 3, LH, INK);
  R(0, LH - 4, LW, 4, '#232847');
  R(0, LH - 4, LW, 1, '#3d4480');
}
