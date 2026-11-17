import { INK } from '../../engine/pixel.js';
import { sprite, build } from '../../art/people.js';
import { catSprite } from '../../art/pets.js';
import { W, H, label, box, makeLook, createFx } from './_px.js';

// Tic-tac-toe on a neon arcade screen, as a ladder of three opponents: the intern (random move 60% of the
// time), the dev (20%) and the cat (never errs: the owner wants it unbeatable). Beat one to face the next.
// A draw replays the same opponent, at most twice; after that you move on with no points. A loss ends the
// run. Score: 10 per win, plus 5 for every draw against the cat, so 35 at most.
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const BX = 10,
  BY = 30,
  CELL = 38,
  PITCH = 40;
const FOES = [
  {
    name: 'THE INTERN',
    slip: 0.6,
    note: 'RANDOM 60',
    look: { fit: 'tee', acc: 'phones', style: 'spiky' },
  },
  {
    name: 'THE DEV',
    slip: 0.2,
    note: 'RANDOM 20',
    look: { fit: 'hood', acc: 'glasses', style: 'fringe' },
  },
  { name: 'THE CAT', slip: 0, note: 'NEVER ERRS', look: null },
];
const REPLAYS = 2;

const winLine = (b, who) => LINES.find((l) => l.every((i) => b[i] === who));
const full = (b) => b.every((v) => v);

function minimax(b, who, depth) {
  if (winLine(b, 'O')) return 10 - depth;
  if (winLine(b, 'X')) return depth - 10;
  if (full(b)) return 0;
  let best = who === 'O' ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = who;
    const v = minimax(b, who === 'O' ? 'X' : 'O', depth + 1);
    b[i] = '';
    best = who === 'O' ? Math.max(best, v) : Math.min(best, v);
  }
  return best;
}
function bestMoves(b) {
  let best = -Infinity,
    moves = [];
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = 'O';
    const v = minimax(b, 'X', 0);
    b[i] = '';
    if (v > best) {
      best = v;
      moves = [i];
    } else if (v === best) moves.push(i);
  }
  return moves;
}
const cellXY = (i) => [BX + (i % 3) * PITCH, BY + Math.floor(i / 3) * PITCH];
const ease = (t) => 1 - (1 - t) ** 3;

export default {
  size: [W, H],
  how: 'TAP A SQUARE',
  pad: true,
  a: 'PLACE',
  start(api) {
    const fx = createFx();
    const portraits = FOES.map((f, i) => {
      if (!f.look) return null;
      const L = Object.assign(makeLook(i * 7919 + 13), f.look);
      return sprite(L, build(false), 'idle', 0, 0, false, false);
    });
    let board = Array(9).fill(''),
      age = Array(9).fill(9),
      turn = 'X',
      opp = 0,
      draws = [0, 0, 0],
      beaten = [false, false, false],
      score = 0,
      result = '',
      line = null,
      wait = 0,
      pause = 0,
      cursor = 4,
      T = 0,
      end = '',
      msg = 'YOUR TURN',
      mcol = '#7cff6b';

    const place = (i, who) => {
      board[i] = who;
      age[i] = 0;
      const [x, y] = cellXY(i);
      fx.burst(
        x + 19,
        y + 19,
        who === 'X' ? ['#ff4fd8', '#ffd0f4'] : ['#39d3ff', '#d6f6ff'],
        8,
        50
      );
    };
    const finish = (r) => {
      result = r;
      pause = 1.5;
      if (r === 'X') {
        score += 10;
        beaten[opp] = true;
        msg = opp === 2 ? 'CAT BEATEN!' : 'YOU WIN!';
        mcol = '#7cff6b';
        fx.burst(100, 90, ['#ffd23f', '#7cff6b', '#ff4fd8', '#39d3ff'], 24, 110);
      } else if (r === 'O') {
        msg = 'YOU LOSE';
        mcol = '#ff6b8b';
        fx.shake(6);
        end = 'over';
      } else {
        draws[opp]++;
        if (opp === 2) {
          score += 5;
          fx.pop(206, 16, '+5', '#ffd23f');
        }
        msg = draws[opp] > REPLAYS ? 'DRAW - MOVE ON' : 'DRAW - REPLAY';
        mcol = '#ffd23f';
      }
      api.score(score);
    };
    const check = (who) => {
      line = winLine(board, who);
      if (line) finish(who);
      else if (full(board)) finish('D');
      return !!result;
    };
    const next = () => {
      if (end === 'over') return api.over(score);
      const advance = result === 'X' || draws[opp] > REPLAYS;
      if (advance && opp === 2) return api.over(score);
      if (advance) opp++;
      board = Array(9).fill('');
      age = Array(9).fill(9);
      result = '';
      line = null;
      turn = 'X';
      msg = 'YOUR TURN';
      mcol = '#7cff6b';
    };
    const play = (i) => {
      if (result || turn !== 'X' || board[i]) return;
      place(i, 'X');
      if (check('X')) return;
      turn = 'O';
      wait = 0.7;
      msg = FOES[opp].name + ' THINKS';
      mcol = '#c8d3f5';
    };
    api.score(0);

    return {
      state: () => ({
        board: board.slice(),
        turn,
        opp,
        draws: draws.slice(),
        result,
        score,
        cells: board.map((_, i) => cellXY(i).map((v) => v + CELL / 2)),
      }),
      key(k) {
        if (k === 'a') return play(cursor);
        const dx = k === 'left' ? -1 : k === 'right' ? 1 : 0,
          dy = k === 'up' ? -1 : k === 'down' ? 1 : 0;
        cursor =
          (((cursor % 3) + 3 + dx) % 3) + 3 * ((((Math.floor(cursor / 3) + dy) % 3) + 3) % 3);
      },
      tap(x, y) {
        const c = Math.floor((x - BX) / PITCH),
          r = Math.floor((y - BY) / PITCH);
        if (
          c < 0 ||
          c > 2 ||
          r < 0 ||
          r > 2 ||
          x - BX - c * PITCH > CELL ||
          y - BY - r * PITCH > CELL
        )
          return;
        cursor = r * 3 + c;
        play(cursor);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        for (let i = 0; i < 9; i++) age[i] += dt;
        if (result) {
          pause -= dt;
          if (pause <= 0) next();
        } else if (turn === 'O') {
          wait -= dt;
          if (wait <= 0) {
            const free = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0),
              moves = bestMoves(board),
              pick =
                Math.random() < FOES[opp].slip
                  ? free[(Math.random() * free.length) | 0]
                  : moves[(Math.random() * moves.length) | 0];
            place(pick, 'O');
            if (check('O')) return;
            turn = 'X';
            msg = 'YOUR TURN';
            mcol = '#7cff6b';
          }
        }
      },
      draw(c) {
        const [sx, sy] = fx.offset();
        c.setTransform(1, 0, 0, 1, sx, sy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        R(-8, -8, W + 16, H + 16, '#140a2e');
        label(c, 'TIC-TAC-TOE', 8, 6, '#ff4fd8', 2);
        label(c, 'TIC-TAC-TOE', 9, 7, '#ffd0f4', 2);
        label(c, 'SCORE', 232, 4, '#7a84ad', 1, 'right');
        label(c, score, 232, 11, '#ffd23f', 2, 'right');
        // the board in a neon frame
        R(BX - 4, BY - 4, 126, 126, '#ff4fd8');
        R(BX - 3, BY - 3, 124, 124, '#39d3ff');
        R(BX - 2, BY - 2, 122, 122, '#0b1030');
        for (let i = 0; i < 9; i++) {
          const [x, y] = cellXY(i);
          R(x, y, CELL, CELL, (i + ((i / 3) | 0)) % 2 ? '#111a44' : '#0f1640');
          if (cursor === i && turn === 'X' && !result) {
            R(x, y, CELL, 1, '#7cff6b');
            R(x, y + CELL - 1, CELL, 1, '#7cff6b');
            R(x, y, 1, CELL, '#7cff6b');
            R(x + CELL - 1, y, 1, CELL, '#7cff6b');
          }
        }
        for (let i = 0; i < 9; i++) {
          if (!board[i]) continue;
          const [x, y] = cellXY(i),
            k = ease(Math.min(1, age[i] / 0.18)),
            cx = x + CELL / 2,
            cy = y + CELL / 2,
            hot = line && line.includes(i),
            blink = hot && ((T * 6) | 0) % 2;
          if (board[i] === 'X') {
            const h = Math.round(12 * k);
            for (let d = -h; d <= h; d++) {
              R(cx + d - 2, cy + d - 2, 5, 5, '#12132a');
              R(cx + d - 2, cy - d - 2, 5, 5, '#12132a');
            }
            for (let d = -h; d <= h; d++) {
              R(cx + d - 1, cy + d - 1, 3, 3, blink ? '#fff' : '#ff4fd8');
              R(cx + d - 1, cy - d - 1, 3, 3, blink ? '#fff' : '#ff4fd8');
            }
          } else {
            const ro = Math.round(14 * k),
              ri = Math.round(9 * k);
            for (let dy = -ro; dy <= ro; dy++) {
              const wo = Math.round(Math.sqrt(ro * ro + 0.5 - dy * dy)),
                wi = Math.abs(dy) < ri ? Math.round(Math.sqrt(ri * ri + 0.5 - dy * dy)) : 0;
              const col = blink ? '#fff' : '#39d3ff';
              if (wi) {
                R(cx - wo - 1, cy + dy, wo - wi + 1, 1, '#12132a');
                R(cx + wi, cy + dy, wo - wi + 1, 1, '#12132a');
                R(cx - wo, cy + dy, wo - wi, 1, col);
                R(cx + wi + 1, cy + dy, wo - wi, 1, col);
              } else {
                R(cx - wo - 1, cy + dy, wo * 2 + 3, 1, '#12132a');
                R(cx - wo, cy + dy, wo * 2 + 1, 1, col);
              }
            }
          }
        }
        if (line) {
          const [a, , b] = line,
            [ax, ay] = cellXY(a),
            [bx, by] = cellXY(b),
            col = result === 'X' ? '#7cff6b' : '#ff6b8b';
          for (let k = 0; k <= 38; k++) {
            const px = ax + 19 + Math.round(((bx - ax) * k) / 38),
              py = ay + 19 + Math.round(((by - ay) * k) / 38);
            R(px - 1, py - 1, 3, 3, col);
          }
        }
        label(c, msg, 70, 160, mcol, 2, 'center');
        // the ladder of three opponents in a framed strip
        R(134, 24, 102, 146, '#ff4fd8');
        R(135, 25, 100, 144, '#39d3ff');
        R(136, 26, 98, 142, '#0b1030');
        FOES.forEach((f, i) => {
          const ey = 30 + i * 46,
            cur = i === opp && !end,
            done = beaten[i],
            bob = cur && ((T * 2.5) | 0) % 2 ? 1 : 0;
          R(139, ey, 46, 40, done ? '#2f9e44' : cur ? '#ffd23f' : '#3a3f5c');
          R(141, ey + 2, 42, 36, '#1b1450');
          const p = portraits[i];
          if (p) c.drawImage(p, 4, 4, 18, 18, 144, ey + 2 + bob, 36, 36);
          else {
            const cat = catSprite(((T * 2) | 0) % 2, true, true);
            c.drawImage(cat, 0, 0, cat.width, cat.height, 142, ey + 10 + bob, 40, 28);
          }
          if (done) {
            R(141, ey + 2, 42, 36, 'rgba(20,10,46,.55)');
            R(155, ey + 15, 4, 4, '#7cff6b');
            R(159, ey + 19, 4, 4, '#7cff6b');
            R(163, ey + 11, 4, 4, '#7cff6b');
            R(167, ey + 7, 4, 4, '#7cff6b');
          }
          label(c, f.name, 189, ey + 3, cur ? '#ffd0f4' : '#c8d3f5');
          label(c, f.note, 189, ey + 12, '#7a84ad');
          label(
            c,
            done ? 'BEATEN' : cur ? 'FACING' : 'WAITING',
            189,
            ey + 21,
            done ? '#7cff6b' : cur ? '#ffd23f' : '#5d6480'
          );
          for (let k = 0; k <= REPLAYS; k++)
            R(189 + k * 7, ey + 31, 5, 4, k < draws[i] ? '#ffd23f' : '#2a2f5c');
        });
        fx.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (end === 'over' && pause < 1.1) {
          R(56, 78, 128, 24, INK);
          R(57, 79, 126, 22, '#ff4fd8');
          R(58, 80, 124, 20, INK);
          label(c, 'GAME OVER', 120, 85, '#ffd0f4', 2, 'center');
        }
      },
    };
  },
};
