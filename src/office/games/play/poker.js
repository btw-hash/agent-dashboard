import { INK } from '../../engine/pixel.js';
import { F } from '../../art/furniture.js';
import { SCENE_W as W, SCENE_H as H, label, box, createFx } from './_px.js';
import {
  makeDeck,
  shuffle,
  rankValue,
  evaluatePokerHand,
  comparePokerHands,
  hitButton,
  okSel,
  stepSel,
  row,
  slot,
  landed,
  flipUp,
  putCard,
  lounge,
  seat,
  blinks,
  dealerLook,
  panel,
  drawBtns,
  pile,
  createFlyers,
  wrap,
  plate,
  bubble,
} from './_cards.js';

// Heads-up hold'em against a person at the lounge table. Ante 10, the flop is dealt at once, then you
// check, bet or fold on each street. The deck is fair; the opponent gives tells (a quick palm, a too-eager
// cheer) that hint at its hand but are not always true. Ten hands, broke, or cash out.
const START = 100,
  ANTE = 10,
  BET = 10,
  HANDS = 10;
const DECK = [78, 24],
  ME = [14, 66],
  POT = [84, 30],
  CPU = [84, 12];

function bestOfSeven(cards) {
  let best = null;
  const n = cards.length;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            const ev = evaluatePokerHand([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (!best || comparePokerHands(ev, best) > 0) best = ev;
          }
  return best;
}

function preflop(hole) {
  const v1 = rankValue(hole[0].rank),
    v2 = rankValue(hole[1].rank),
    hi = Math.max(v1, v2),
    lo = Math.min(v1, v2);
  let s = (hi - 2) / 12;
  if (v1 === v2) s = 0.5 + (hi - 2) / 24;
  else {
    s += (lo - 2) / 36;
    if (hole[0].suit === hole[1].suit) s += 0.08;
    const gap = hi - lo;
    if (gap === 1) s += 0.05;
    else if (gap > 4) s -= 0.06;
  }
  return Math.max(0, Math.min(1, s));
}

export default {
  size: [W, H],
  how: 'BUTTONS',
  pad: true,
  a: 'OK',
  start(api) {
    const fx = createFx(),
      fly = createFlyers();
    const L = dealerLook();
    let chips = START,
      hands = 0,
      deck = [],
      mine = [],
      cpu = [],
      board = [],
      mineO = [],
      cpuO = [],
      boardO = [],
      pot = 0,
      inPot = 0,
      phase = 'deal',
      folded = false,
      resp = null,
      sel = 0,
      fin = 0,
      done = false,
      T = 0,
      busy = 0,
      think = 0,
      pending = null,
      tellWait = false,
      tell = null,
      cel = null,
      said = null,
      curS = 0,
      cpuName = '',
      cpuFold = false,
      rigNext = null,
      pressed = '',
      pressT = 0,
      lines = ['PRESS DEAL', 'TO START'],
      mcol = '#e0af68';

    const live = () => phase === 'flop' || phase === 'turn' || phase === 'river';
    const btns = () => {
      if (fin > 0 || done) return [];
      const on = busy <= 0 && think <= 0;
      if (!live()) {
        return row(
          [
            { id: 'deal', label: 'DEAL ' + ANTE, col: '#e0af68', on: on && chips >= ANTE },
            ...(hands > 0 ? [{ id: 'cash', label: 'CASH OUT', col: '#9ece6a', on }] : []),
          ],
          77,
          10,
          3,
          54,
          114,
          3
        );
      }
      if (resp) {
        return row(
          [
            {
              id: 'call',
              label: 'CALL ' + resp.toCall,
              col: '#7dcfff',
              on: on && chips >= resp.toCall,
            },
            { id: 'fold', label: 'FOLD', col: '#f7768e', on },
          ],
          77,
          10,
          3,
          54,
          114,
          3
        );
      }
      return row(
        [
          { id: 'check', label: 'CHECK', col: '#9ece6a', on },
          { id: 'bet', label: 'BET ' + BET, col: '#ffbb44', on: on && chips >= BET },
          { id: 'fold', label: 'FOLD', col: '#f7768e', on },
        ],
        77,
        10,
        3,
        34,
        114,
        3
      );
    };
    const say = (m, c) => {
      lines = wrap(m, 11);
      mcol = c;
      sel = 0;
    };
    const bubbleSay = (s) => (said = { s, left: 1.3 });
    const cheer = (pose) => (cel = { pose, left: 1.6 });
    const maybeTell = () => {
      if (Math.random() > 0.6) return;
      const r = Math.random();
      tell = {
        left: 99,
        pose:
          curS > 0.62
            ? r < 0.7
              ? 'cheer'
              : 'palm'
            : curS < 0.4
              ? r < 0.7
                ? 'palm'
                : 'cheer'
              : r < 0.5
                ? 'cheer'
                : 'palm',
      };
    };
    const strength = () => {
      let base;
      if (!board.length) base = preflop(cpu);
      else {
        const ev = bestOfSeven([...cpu, ...board]);
        base = Math.max(0.3 + Math.min(0.65, (ev.rank / 9) * 0.65), preflop(cpu));
      }
      return Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.24));
    };
    const chipsTo = (to, n, from) => {
      const k = Math.max(1, Math.min(4, n));
      for (let i = 0; i < k; i++) fly.send(from[0], from[1], to[0], to[1], i * 0.07);
    };
    const settle = (winner) => {
      if (pot > 0) chipsTo(winner === 'me' ? ME : winner === 'cpu' ? CPU : POT, pot / 10, POT);
      phase = 'show';
      pot = 0;
      resp = null;
      pending = null;
      api.score(chips);
      if (hands >= HANDS || chips < ANTE) fin = 2.4;
      sel = 0;
    };
    const showdown = () => {
      cpuO.forEach((o) => flipUp(o, T));
      busy = 0.7;
      const p = bestOfSeven([...mine, ...board]),
        c = bestOfSeven([...cpu, ...board]),
        r = comparePokerHands(p, c),
        n = pot - inPot;
      cpuName = c.name;
      if (r > 0) {
        chips += pot;
        say(`YOU WIN ${n}`, '#9ece6a');
        cheer('palm');
        settle('me');
        fx.burst(14, 66, ['#ffd23f', '#9ece6a', '#fff'], 14, 60);
      } else if (r < 0) {
        say('CPU WINS', '#f7768e');
        cheer('cheer');
        settle('cpu');
      } else {
        chips += Math.floor(pot / 2);
        say('SPLIT POT', '#e0af68');
        settle('me');
      }
    };
    const street = () => {
      curS = strength();
      tellWait = true;
    };
    const advance = () => {
      if (phase === 'flop' || phase === 'turn') {
        const i = board.length;
        board.push(deck.pop());
        boardO.push(slot(board[i], 36 + i * 14, 41, DECK, T + 0.1));
        busy = 0.45;
        phase = phase === 'flop' ? 'turn' : 'river';
        say(phase === 'turn' ? 'TURN' : 'RIVER', '#e0af68');
        street();
      } else showdown();
    };
    const deal = () => {
      if (chips < ANTE) return;
      hands++;
      chips -= ANTE;
      pot = ANTE * 2;
      inPot = ANTE;
      deck = shuffle(makeDeck());
      if (rigNext) {
        const want = rigNext.map((s) => ({ rank: s.slice(0, -1), suit: s.slice(-1) })),
          has = (c) => want.some((w) => w.rank === c.rank && w.suit === c.suit);
        deck = deck.filter((c) => !has(c)).concat(want.reverse());
        rigNext = null;
      }
      cpuName = '';
      cpuFold = false;
      mine = [deck.pop(), deck.pop()];
      cpu = [deck.pop(), deck.pop()];
      board = [deck.pop(), deck.pop(), deck.pop()];
      let k = 0;
      const at = () => T + 0.05 + k++ * 0.16;
      mineO = [slot(mine[0], 3, 59, DECK, at())];
      cpuO = [slot(cpu[0], 3, 41, DECK, at(), true)];
      mineO.push(slot(mine[1], 17, 59, DECK, at()));
      cpuO.push(slot(cpu[1], 17, 41, DECK, at(), true));
      boardO = board.map((b, i) => slot(b, 36 + i * 14, 41, DECK, at()));
      busy = k * 0.16 + 0.3;
      fly.send(ME[0], ME[1], POT[0], POT[1]);
      fly.send(CPU[0], CPU[1], POT[0] + 6, POT[1]);
      folded = false;
      resp = null;
      tell = null;
      cel = null;
      said = null;
      think = 0;
      pending = null;
      phase = 'flop';
      say('FLOP', '#e0af68');
      street();
    };
    const bet = () => {
      if (chips < BET) return;
      chips -= BET;
      pot += BET;
      inPot += BET;
      fly.send(ME[0], ME[1], POT[0], POT[1]);
      think = 0.9;
      pending = () => {
        const s = curS;
        if (s < 0.35) {
          bubbleSay('FOLD');
          chips += pot;
          cpuFold = true;
          say(`CPU FOLDS YOU WIN ${pot - inPot}`, '#9ece6a');
          cheer('palm');
          fx.burst(14, 66, ['#ffd23f', '#9ece6a', '#fff'], 12, 50);
          settle('me');
        } else if (s < 0.75) {
          bubbleSay('CALL');
          pot += BET;
          fly.send(CPU[0], CPU[1], POT[0] + 6, POT[1]);
          advance();
        } else {
          bubbleSay('RAISE');
          pot += BET * 2;
          fly.send(CPU[0], CPU[1], POT[0] + 6, POT[1]);
          fly.send(CPU[0], CPU[1], POT[0] + 9, POT[1], 0.1);
          resp = { toCall: BET };
          say('CPU RAISES 10', '#ffbb44');
          maybeTell();
        }
      };
    };
    const check = () => {
      think = 0.9;
      pending = () => {
        const s = curS;
        if (s < 0.5) {
          bubbleSay('CHECK');
          advance();
        } else {
          const b = s >= 0.8 ? BET * 2 : BET;
          bubbleSay('BET');
          pot += b;
          fly.send(CPU[0], CPU[1], POT[0] + 6, POT[1]);
          resp = { toCall: b };
          say(`CPU BETS ${b}`, '#ffbb44');
          maybeTell();
        }
      };
    };
    const call = () => {
      const n = Math.min(chips, resp.toCall);
      chips -= n;
      pot += n;
      inPot += n;
      fly.send(ME[0], ME[1], POT[0], POT[1]);
      resp = null;
      advance();
    };
    const fold = () => {
      folded = true;
      say('YOU FOLD', '#f7768e');
      cheer('cheer');
      settle('cpu');
    };
    const act = (id) => {
      pressed = id;
      pressT = 0.12;
      tell = null;
      if (id === 'deal') deal();
      else if (id === 'cash') {
        done = true;
        api.over(chips);
      } else if (id === 'bet') bet();
      else if (id === 'check') check();
      else if (id === 'call') call();
      else if (id === 'fold') fold();
    };

    let shown = chips;
    api.score(chips);

    return {
      state: () => ({
        phase,
        hands,
        chips,
        pot,
        busy: busy > 0 || think > 0,
        mine,
        cpu,
        board,
        resp,
        folded,
        cpuFold,
        cpuName,
        curS,
        tell: tell && tell.pose,
        said: said && said.s,
        lines,
        buttons: btns().map((b) => ({ id: b.id, on: b.on, x: b.x + b.w / 2, y: b.y + b.h / 2 })),
      }),
      rig: (cards) => (rigNext = cards),
      key(k) {
        const l = btns();
        if (!l.length) return;
        sel = okSel(l, sel);
        if (k === 'left' || k === 'up') sel = stepSel(l, sel, -1);
        else if (k === 'right' || k === 'down') sel = stepSel(l, sel, 1);
        else if (k === 'a' && l[sel].on) act(l[sel].id);
      },
      tap(x, y) {
        const b = hitButton(btns(), x, y);
        if (b) act(b.id);
      },
      tick(dt) {
        T += dt;
        fx.tick(dt);
        fly.tick(dt);
        pressT -= dt;
        busy -= dt;
        if (chips !== shown) api.score((shown = chips));
        if (said && (said.left -= dt) <= 0) said = null;
        if (cel && (cel.left -= dt) <= 0) cel = null;
        if (tell && (tell.left -= dt) <= 0) tell = null;
        if (think > 0) {
          think -= dt;
          if (think <= 0 && pending) {
            const p = pending;
            pending = null;
            p();
          }
        } else if (tellWait && busy <= 0 && live() && !resp) {
          tellWait = false;
          maybeTell();
        }
        if (fin > 0) {
          fin -= dt;
          if (fin <= 0 && !done) {
            done = true;
            api.over(chips);
          }
        }
      },
      draw(c) {
        const [ox, oy] = fx.offset();
        c.setTransform(1, 0, 0, 1, ox, oy);
        const R = (x, y, w, h, col) => box(c, x, y, w, h, col);
        lounge(c, 36);
        const pose = think > 0 ? 'think' : tell ? tell.pose : cel ? cel.pose : 'idle';
        seat(c, L, pose, T, 84, 2, blinks(T));
        c.drawImage(F.cards, 62, 22);
        R(64, 24, 38, 9, '#2f7a47');
        R(64, 24, 38, 1, '#3f9b5b');
        if (pot > 0) {
          label(c, 'POT ' + pot, 66, 27, '#ffee88');
          pile(c, 92, 32, Math.min(8, Math.ceil(pot / 10)));
        }
        if (think > 0) bubble(c, 67, 3, 'HMM', 78);
        else if (said) bubble(c, 67, 3, said.s, 78);
        label(c, 'HAND ' + Math.min(hands, HANDS) + '/' + HANDS, 8, 1, '#e0af68');
        label(c, 'CHIPS ' + chips, 114, 1, chips >= ANTE ? '#9ece6a' : '#f7768e', 1, 'right');
        plate(c, 7, 9, 46, lines, mcol);
        panel(c, 1, 38, 118, 51);
        fx.draw(c);
        cpuO.forEach((o) => putCard(c, o, T));
        for (let i = boardO.length; i < 5; i++) {
          R(36 + i * 14, 41, 13, 16, '#27683c');
          R(37 + i * 14, 42, 11, 14, '#2f7a47');
        }
        boardO.forEach((o) => putCard(c, o, T));
        mineO.forEach((o) => putCard(c, o, T));
        if (mine.length && mineO.every((o) => landed(o, T)) && boardO.every((o) => landed(o, T))) {
          const ev = bestOfSeven([...mine, ...board]);
          label(c, ev.name, 34, 61, '#ffee88');
          label(
            c,
            phase === 'show'
              ? folded
                ? 'FOLDED'
                : cpuFold
                  ? 'CPU FOLDED'
                  : 'CPU ' + cpuName
              : resp
                ? 'TO CALL ' + resp.toCall
                : 'YOUR MOVE',
            34,
            69,
            '#c9d8c0'
          );
        } else if (!mine.length) label(c, 'TEN HANDS TO PLAY', 34, 64, '#c9d8c0');
        drawBtns(c, btns(), okSel(btns(), sel), pressT > 0 ? pressed : '');
        fly.draw(c);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (fin > 0) {
          R(29, 51, 62, 22, INK);
          R(30, 52, 60, 20, '#e0af68');
          R(31, 53, 58, 18, '#1a1030');
          label(c, 'FINAL ' + chips, 60, 59, '#ffd23f', 1, 'center');
        }
      },
    };
  },
};
