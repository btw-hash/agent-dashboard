import { F } from '../art/furniture.js';
import { INK, text } from '../engine/pixel.js';
import { SPOT } from './plan.js';

export function furnish({ g, px, put0, wall, Office }) {
  const P = Office.P;
  function arcadeFx(kind) {
    return (T, X, Y) => {
      px(X + 4, Y + 11, 16, 13, '#07122a');
      if (kind)
        for (let i = 0; i < 9; i++)
          px(
            X + 6 + (i % 3) * 4,
            Y + 13 + ((i / 3) | 0) * 4,
            3,
            3,
            (((T * 1.5) | 0) + i) % 4 ? '#39d3ff' : '#ffd23f'
          );
      else {
        const p = X + 8 + Math.round(Math.sin(T * 2) * 4);
        px(p, Y + 21, 4, 1, '#7cff6b');
        for (let i = 0; i < 8; i++)
          px(
            X + 5 + (i % 4) * 4,
            Y + 13 + ((i / 4) | 0) * 3 + (Math.sin(T * 2 + i) > 0.5 ? 1 : 0),
            2,
            2,
            ['#ff4fd8', '#39d3ff', '#ffd23f'][i % 3]
          );
      }
    };
  }
  // hall, along the back wall
  wall(F.neon, 8, 10);
  wall(F.board, 150, 6);
  wall(F.status, 272, 8, (T, X, Y) => {
    const w = P.filter((p) => p.st === 'w').length,
      t = P.filter((p) => p.st === 't').length;
    text(g, 'WORKING', X + 5, Y + 5, '#7a84ad');
    text(g, w, X + 38, Y + 5, '#9ece6a');
    text(g, 'THINKING', X + 5, Y + 12, '#7a84ad');
    text(g, t, X + 42, Y + 12, '#bb9af7');
    for (let i = 0; i < 12; i++) {
      const h = 1 + (((Math.sin(T * 0.8 + i * 1.7) * 0.5 + 0.5) * 3) | 0);
      px(X + 5 + i * 4, Y + 22 - h, 3, h, i < w ? '#9ece6a' : '#2e3566');
    }
  });
  wall(F.cork, 414, 12);
  wall(F.trophy, 454, 16);
  wall(F.days, 490, 12, (T, X, Y) => {
    text(g, 'DAYS OK', X + 5, Y + 4, '#8b90a8');
    text(g, String(Math.min(999, Office.daysOk)).padStart(3, '0'), X + 13, Y + 10, '#9ece6a');
  });
  wall(F.lift, 538, 6, (T, X, Y) => {
    const c = Office.lift == null ? T % 24 : 20,
      open =
        Office.lift != null
          ? Office.lift
          : c > 19 && c < 23
            ? Math.min(1, (c - 19) * 2, (23 - c) * 2)
            : 0,
      w = Math.round(open * 13);
    if (w) {
      px(X + 20 - w, Y + 11, w * 2, 29, '#ffe9b8');
      px(X + 20 - w, Y + 11, w * 2, 2, '#fff6dc');
    }
    text(g, c > 19 ? '1' : String(1 + (((c / 5) | 0) % 4)), X + 13, Y + 3, '#ffd23f');
    px(X + 21, Y + 3 + (((T * 2) | 0) % 2), 3, 1, '#9ece6a');
    px(X + 22, Y + 4 + (((T * 2) | 0) % 2), 1, 2, '#9ece6a');
  });
  // hall, standing on the floor
  put0(F.server, 54, 30, 74, 11, (T, X, Y) => {
    for (let i = 0; i < 6; i++) {
      px(X + 15, Y + 5 + i * 6, 2, 1, Math.sin(T * (3 + i) + i * 2) > 0 ? '#7cff6b' : '#1f5a33');
      px(X + 18, Y + 5 + i * 6, 2, 1, Math.sin(T * (1.7 + i) + i) > 0.6 ? '#ffb347' : '#5a3d14');
    }
  });
  put0(F.tank, 84, 40, 73, 19, (T, X, Y) => {
    for (let i = 0; i < 4; i++) {
      const fx = X + 11 + Math.round(Math.sin(T * (0.5 + i * 0.13) + i * 1.3) * 9) + i * 3,
        fy = Y + 6 + i * 2,
        r = Math.cos(T * (0.5 + i * 0.13) + i * 1.3) > 0;
      px(fx, fy, 3, 2, ['#ff8a3d', '#ffd23f', '#f7768e', '#fff'][i]);
      px(r ? fx - 1 : fx + 3, fy, 1, 2, ['#ff8a3d', '#ffd23f', '#f7768e', '#fff'][i]);
    }
    for (let i = 0; i < 2; i++) {
      const q = (T * 0.3 + i / 2) % 1;
      px(X + 30 + i * 3, Y + 14 - Math.round(q * 11), 1, 1, '#d5f1ff');
    }
  });
  put0(F.printers, 6, 94, 125, 24, (T, X, Y) => {
    const q = (T * 0.12) % 1,
      h = Math.round(q * 7);
    px(X + 33, Y + 12 - h, 6, h, '#39c5cf');
    px(X + 31 + Math.round((Math.sin(T * 5) * 0.5 + 0.5) * 8), Y + 10 - h, 3, 1, '#e0af68');
  });
  put0(F.plant, 4, 176, 204, 7);
  put0(F.bin, 222, 160, 172, 5);
  put0(F.flamp, 220, 112, 146, 5);
  put0(F.conf, 508, 98, 125, 31);
  put0(F.coat, 582, 46, 80, 6);
  put0(F.scope, 608, 48, 80, 8);
  put0(F.shelf, 608, 146, 181, 13);
  put0(F.catbed, 584, 193, 200, 0);
  // games room
  wall(F.tv, 118, 214, (T, X, Y) => {
    px(X + 3, Y + 3, 24, 13, '#0b1530');
    px(X + 5 + (((T * 14) % 20) | 0), Y + 5 + Math.abs((((T * 9) % 16) - 8) | 0), 2, 2, '#ffd23f');
    px(X + 4, Y + 9 + ((Math.sin(T * 2) * 3) | 0), 1, 4, '#7cff6b');
    px(X + 25, Y + 9 + ((Math.cos(T * 2.3) * 3) | 0), 1, 4, '#ff4fd8');
  });
  put0(F.arcade, 6, 222, 262, 11, arcadeFx(0));
  put0(F.arcade2, 30, 222, 262, 11, arcadeFx(1));
  put0(F.low, 106, 262, 274, 14);
  put0(F.gsofa, 96, 292, 318, 26);
  put0(F.foos, 10, 306, 334, 21);
  put0(F.darts, 126, 318, 354, 8);
  put0(F.bean, 62, 334, 350, 22);
  // gym
  wall(F.mirror, 158, 213);
  wall(F.hoop, 250, 211, (T, X, Y) => {
    const b = Math.abs(Math.sin(T * 2.2));
    px(X + 6, Y + 34 - Math.round(b * 20), 6, 6, INK);
    px(X + 7, Y + 35 - Math.round(b * 20), 4, 4, '#ff8a3d');
  });
  put0(F.tread, 158, 262, 294, 15);
  put0(F.bagstand, 242, 250, 292, 10);
  put0(F.rack, 232, 320, 344, 17);
  put0(F.pong, 160, 316, 340, 21);
  put0(F.kettle, 250, 300, 310, 8);
  put0(F.mats, 157, 244, 262, 6);
  // lounge
  put0(F.juke, 280, 224, 262, 11, (T, X, Y) => {
    px(X + 5, Y + 7, 14, 12, ['#39d3ff', '#ff4fd8', '#ffd23f', '#7cff6b'][((T * 1.5) | 0) % 4]);
    for (let i = 0; i < 4; i++) {
      const v = ((T * 4 + i * 2) | 0) % 5;
      px(X + 6 + i * 3 + 1, Y + 9 + v, 2, 9 - v, 'rgba(18,19,42,.55)');
    }
  });
  put0(F.slot, 306, 224, 262, 10, (T, X, Y) => {
    for (let i = 0; i < 3; i++)
      px(
        X + 4 + i * 4,
        Y + 12,
        3,
        7,
        ['#ffd23f', '#f7768e', '#7cff6b', '#39d3ff'][
          (((T * (SPOT.slot.busy ? 9 : 1.2)) | 0) + i * 3) % 4
        ]
      );
  });
  put0(F.flamp, 276, 270, 304, 5);
  put0(F.crystal, 374, 240, 264, 8, (T, X, Y) => {
    px(X + 8, Y + 6 + (((T * 2) | 0) % 2), 2, 2, '#fff');
    px(X + 10, Y + 8, 1, 1, '#e9d9ff');
  });
  put0(F.slot, 404, 224, 262, 10, (T, X, Y) => {
    for (let i = 0; i < 3; i++)
      px(
        X + 4 + i * 4,
        Y + 12,
        3,
        7,
        ['#ffd23f', '#f7768e', '#7cff6b', '#39d3ff'][(((T * 1.4) | 0) + i * 2) % 4]
      );
  });
  put0(F.roul, 284, 300, 328, 24, (T, X, Y) => {
    px(
      X + 11 + Math.round(Math.cos(T * 3) * 4),
      Y + 8 + Math.round(Math.sin(T * 3) * 3),
      1,
      1,
      '#fff'
    );
  });
  put0(F.cards, 374, 290, 314, 20);
  put0(F.bj, 364, 330, 350, 16);
  put0(F.plant, 410, 322, 350, 7);
  // cafe
  wall(F.menu, 604, 211);
  wall(F.espresso, 568, 226, (T, X, Y) => {
    for (let i = 0; i < 2; i++) {
      const q = (T * 0.5 + i / 2) % 1;
      px(X + 7 + i * 2, Y - 2 - Math.round(q * 8), 1, 2, 'rgba(255,255,255,' + 0.6 * (1 - q) + ')');
    }
  });
  wall(F.micro, 592, 229);
  put0(F.fridge, 438, 216, 262, 12);
  put0(F.vend, 466, 222, 262, 11);
  put0(F.cooler, 492, 234, 262, 6);
  put0(F.counter, 562, 240, 266, 36, (T, X, Y) => {
    [
      ['#7aa2f7', 52],
      ['#f7768e', 57],
      ['#9ece6a', 62],
    ].forEach((m) => {
      px(X + m[1] - 1, Y - 5, 5, 6, INK);
      px(X + m[1], Y - 4, 3, 4, m[0]);
    });
  });
  [
    [446, 298],
    [500, 320],
    [590, 302],
  ].forEach((t) => {
    put0(F.ctable, t[0], t[1], t[1] + 18, 10);
    put0(F.stool, t[0] - 10, t[1] + 6, t[1] + 16, 0);
    put0(F.stool, t[0] + 26, t[1] + 6, t[1] + 16, 0);
  });
  put0(F.gum, 622, 318, 344, 5);
  put0(F.plant, 436, 326, 354, 7);
}

// small personal things, so that no two desks look the same
export function deskProps(px, i, X, Y) {
  const k = (i * 5 + 2) % 6;
  if (k === 0) {
    px(X + 31, Y - 2, 5, 7, INK);
    px(X + 32, Y - 3, 3, 5, '#5fae5a');
    px(X + 32, Y + 2, 3, 2, '#c9744a');
  }
  if (k === 1) {
    px(X + 30, Y, 6, 6, INK);
    px(X + 31, Y + 2, 4, 3, '#ffd23f');
    px(X + 33, Y + 1, 2, 2, '#ffd23f');
    px(X + 35, Y + 2, 1, 1, '#ff8a3d');
  }
  if (k === 2) {
    px(X + 30, Y - 1, 7, 7, INK);
    px(X + 31, Y, 5, 5, '#f2ede2');
    px(X + 32, Y + 1, 3, 3, '#7aa2f7');
  }
  if (k === 3) {
    px(X + 30, Y + 1, 7, 5, INK);
    px(X + 31, Y + 2, 5, 1, '#e03131');
    px(X + 31, Y + 3, 5, 1, '#3b5bdb');
    px(X + 31, Y + 4, 5, 1, '#2f9e44');
  }
  if (k === 4) {
    px(X + 31, Y - 2, 5, 8, INK);
    px(X + 32, Y - 1, 3, 3, '#f7768e');
    px(X + 33, Y + 2, 1, 3, '#8b90a8');
    px(X + 32, Y + 5, 3, 1, '#8b90a8');
  }
  if (k === 5) {
    px(X + 30, Y, 6, 6, INK);
    px(X + 31, Y + 1, 4, 4, '#bb9af7');
    px(X + 32, Y + 2, 1, 1, '#fff');
  }
}
