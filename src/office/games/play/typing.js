import { INK } from '../../engine/pixel.js';
import { sprite, build, frameOf } from '../../art/people.js';
import { F, chairBack } from '../../art/furniture.js';
import { W, H, label, box, makeLook, createFx } from './_px.js';

// Typing test as a terminal: type the commit message before the build bar runs out.
// A wrong character turns the line red. A small framed strip shows our typist.
const SENTENCES = [
  'FIX THE FIX THAT FIXED THE FIX AND ADD MORE COFFEE TO THE BUILD SO THE TESTS PASS ON FRIDAY NIGHT',
  'ADD A BUTTON THAT DOES NOTHING AND REMOVE THE BUTTON THAT DID EVERYTHING - REVIEW LATER',
  'REVERT THE REVERT OF THE REVERT AND PRAY THAT THE BUILD STAYS GREEN UNTIL THE DEMO IS DONE',
  'RENAME TEMP TO TEMP2 THEN TO FINAL THEN TO FINAL-FINAL AND NEVER TOUCH THE CODE AGAIN',
  'MOVE THE CAT OUT OF THE SERVER ROOM AND ADD A SOFT BED NEXT TO THE COFFEE MACHINE - DONE!',
];
const LIMIT = 90,
  COLS = 26,
  LX = 12,
  LY = 44,
  LH = 12;

function wrap(t) {
  const lines = [];
  let cur = '';
  for (const w of t.split(' ')) {
    if (cur && (cur + w).length > COLS) {
      lines.push(cur);
      cur = '';
    }
    cur += w + ' ';
  }
  lines.push(cur.slice(0, -1));
  return lines;
}

export default {
  size: [W, H],
  how: 'KEYBOARD',
  text: true,
  start(api) {
    const fx = createFx();
    const text = SENTENCES[(Math.random() * SENTENCES.length) | 0],
      lines = wrap(text),
      look = makeLook(4711),
      dsn = build(false);
    let typed = '',
      clock = null,
      elapsed = 0,
      wpm = 0,
      errs = 0,
      fin = 0,
      won = false,
      hurt = 0,
      typeT = 0,
      busy = 0,
      T = 0;
    const calc = () => {
      let ok = 0;
      for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) ok++;
      return clock === null ? 0 : Math.round(ok / 5 / (Math.max(clock, 1) / 60));
    };
    const bad = () => typed.length > 0 && typed !== text.slice(0, typed.length);
    const at = (i) => {
      let n = i;
      for (let l = 0; l < lines.length; l++) {
        if (n < lines[l].length || l === lines.length - 1)
          return [LX + Math.min(n, COLS) * 8, LY + l * LH];
        n -= lines[l].length;
      }
    };
    function finish(ok) {
      wpm = calc();
      api.score(wpm);
      won = ok;
      fin = 1.3;
      if (ok) fx.burst(120, 70, ['#9ece6a', '#d6ffb8', '#ffd23f'], 24, 90);
      else fx.shake(5);
    }

    return {
      state: () => ({ text, typed, left: LIMIT - elapsed, wpm, errs, fin }),
      char(ch) {
        if (fin > 0) return;
        if (ch === '\b') typed = typed.slice(0, -1);
        else {
          ch = ch.toUpperCase();
          if (!/^[A-Z0-9 \-!]$/.test(ch) || typed.length >= text.length) return;
          if (clock === null) clock = 0;
          const [x, y] = at(typed.length);
          typed += ch;
          busy = 0.35;
          if (ch === text[typed.length - 1]) fx.burst(x + 4, y + 4, ['#9ece6a', '#d6ffb8'], 2, 30);
          else {
            errs++;
            hurt = 1;
            fx.shake(3);
            fx.burst(x + 4, y + 4, ['#f7768e', '#ffd0d8'], 6, 50);
          }
        }
        wpm = calc();
        api.score(wpm);
        if (typed === text) finish(true);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        hurt = Math.max(0, hurt - dt);
        busy = Math.max(0, busy - dt);
        if (busy > 0) typeT += dt;
        if (fin > 0) {
          fin -= dt;
          if (fin <= 0) api.over(wpm);
          return;
        }
        elapsed += dt;
        if (clock !== null) {
          clock += dt;
          wpm = calc();
        }
        if (elapsed >= LIMIT) finish(false);
      },
      draw(c) {
        const [ox, oy] = fx.offset();
        c.setTransform(1, 0, 0, 1, ox, oy);
        const err = bad();
        box(c, -4, -4, W + 8, H + 8, '#140a2e');
        // the monitor: bezel, title bar, the build bar, the terminal
        box(c, 3, 3, 234, 120, INK);
        box(c, 4, 4, 232, 118, '#3a3f5c');
        box(c, 4, 4, 232, 1, '#5a6090');
        box(c, 7, 7, 226, 112, hurt > 0.5 ? '#f7768e' : INK);
        box(c, 8, 8, 224, 110, '#0d1226');
        box(c, 8, 8, 224, 11, '#1c2036');
        box(c, 12, 11, 4, 4, '#f7768e');
        box(c, 18, 11, 4, 4, '#e0af68');
        box(c, 24, 11, 4, 4, '#9ece6a');
        label(c, 'TERMINAL - GIT COMMIT', 120, 12, '#8b90a8', 1, 'center');
        const k = Math.min(1, elapsed / LIMIT),
          bc = k < 0.6 ? '#9ece6a' : k < 0.85 ? '#e0af68' : '#f7768e';
        label(c, 'BUILD', 12, 23, '#aab6e8');
        box(c, 36, 22, 156, 8, INK);
        box(c, 37, 23, 154, 6, '#1c2036');
        const n = Math.round(k * 38);
        for (let i = 0; i < n; i++) box(c, 37 + i * 4, 23, 3, 6, bc);
        label(c, Math.max(0, Math.ceil(LIMIT - elapsed)) + ' S', 228, 23, bc, 1, 'right');
        box(c, 12, 35, 3, 1, '#9ece6a');
        box(c, 13, 36, 3, 1, '#9ece6a');
        box(c, 12, 37, 3, 1, '#9ece6a');
        label(
          c,
          typed.length ? 'MESSAGE' : 'TAP, THEN TYPE',
          20,
          34,
          typed.length ? '#7a84ad' : '#e0af68'
        );
        if (err) label(c, 'ERROR - BACKSPACE', 228, 34, '#f7768e', 1, 'right');
        // the message: green is right, grey waits, red is a slip
        const slip = err ? at([...typed].findIndex((ch, i) => ch !== text[i])) : null;
        if (slip) box(c, 9, slip[1] - 2, 222, LH, '#4a1626');
        let idx = 0;
        lines.forEach((line, li) => {
          for (let i = 0; i < line.length; i++, idx++) {
            const ch = line[i],
              x = LX + i * 8,
              y = LY + li * LH;
            let col = '#7a84ad';
            if (idx < typed.length) {
              if (typed[idx] === ch) col = '#9ece6a';
              else {
                col = '#f7768e';
                box(c, x, y - 1, 7, 9, '#7a2430');
              }
            } else if (idx === typed.length) {
              box(c, x - 1, y - 1, 8, 10, err ? '#f7768e' : '#ffd23f');
              col = '#0d1226';
            }
            if (ch !== ' ') label(c, ch, x, y, col, 2);
          }
        });
        label(c, 'LINT OK', 12, 107, '#3f6b4a');
        label(
          c,
          err ? 'TESTS FAIL' : 'TESTS PASS',
          228,
          107,
          err ? '#f7768e' : '#3f6b4a',
          1,
          'right'
        );
        // our typist in a small framed strip: typing along, palm on a slip
        box(c, 3, 125, 98, 54, INK);
        box(c, 4, 126, 96, 52, '#343b6b');
        for (let x = 10; x < 100; x += 20) box(c, x, 126, 1, 36, '#2f3560');
        for (let y = 160; y < 178; y += 6)
          for (let x = 4; x < 100; x += 16)
            box(c, x, y, 16, 6, ((x + y) / 2) % 2 ? '#c99d6c' : '#c2935f');
        c.drawImage(F.plant, 80, 148);
        const px = 46,
          py = 168,
          dx = px - 19;
        c.drawImage(F.deskScreen, dx, 130);
        box(c, dx + 10, 132, 20, 8, '#0b1022');
        for (let r = 0; r < 3; r++) {
          const v = (r * 5 + ((T * 6) | 0)) % 11;
          box(c, dx + 11, 133 + r * 2, 4 + v, 1, ['#7aa2f7', '#9ece6a', '#bb9af7'][r]);
        }
        const pose = fin > 0 && won ? 'cheer' : hurt > 0 || (fin > 0 && !won) ? 'palm' : 'type';
        c.drawImage(
          sprite(
            look,
            dsn,
            pose,
            1,
            pose === 'type' ? frameOf('type', typeT, 11) : frameOf(pose, T),
            false,
            true
          ),
          px - 13,
          py - 6 - (dsn.ly + 1)
        );
        c.drawImage(chairBack('#4a5290'), px - 8, py - 13);
        // the numbers beside it
        box(c, 105, 125, 132, 54, INK);
        box(c, 106, 126, 130, 52, '#1c2036');
        label(c, 'WPM', 116, 132, '#7a84ad');
        label(c, wpm, 116, 142, '#9ece6a', 4);
        label(c, 'ERRORS', 226, 132, '#7a84ad', 1, 'right');
        label(c, errs, 226, 142, errs ? '#f7768e' : '#aab6e8', 2, 'right');
        box(c, 110, 166, 122, 6, INK);
        box(c, 111, 167, 120, 4, '#2a2e44');
        box(
          c,
          111,
          167,
          Math.round((120 * typed.length) / text.length),
          4,
          err ? '#f7768e' : '#9ece6a'
        );
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (fin > 0) {
          box(c, 48, 62, 144, 22, INK);
          box(c, 49, 63, 142, 20, won ? '#2f9e44' : '#c0392b');
          label(c, won ? 'BUILD PASSED!' : 'BUILD FAILED', 120, 68, '#f7f8fb', 1, 'center');
          label(c, 'WPM ' + wpm, 120, 76, '#fff3a3', 1, 'center');
        }
      },
    };
  },
};
