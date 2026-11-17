import { INK } from '../../engine/pixel.js';
import { F } from '../../art/furniture.js';
import { SCENE_W as W, SCENE_H as H, label, box, createFx } from './_px.js';
import {
  makeDeck,
  shuffle,
  handTotal,
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

// Blackjack against a dealer who sits behind the lounge table. The cards slide in one by one, the
// dealer's hole card is turned over when you stand. Bet 10, ten hands, broke, or cash out.
const START = 100,
  BET = 10,
  HANDS = 10;
const DECK = [78, 24],
  ME = [14, 66],
  POT = [92, 30],
  CPU = [84, 12];

const spread = (n) => (n < 2 ? 0 : Math.min(14, Math.floor(74 / (n - 1))));

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
      dealer = [],
      mineO = [],
      dealO = [],
      bet = 0,
      rigNext = null,
      phase = 'deal',
      bj = false,
      wait = 0,
      busy = 0,
      T = 0,
      sel = 0,
      fin = 0,
      done = false,
      cel = null,
      said = null,
      pressed = '',
      pressT = 0,
      lines = ['PRESS DEAL', 'TO START'],
      mcol = '#ffd090';

    const btns = () => {
      if (fin > 0 || done || phase === 'dealer') return [];
      const on = busy <= 0;
      if (phase === 'player') {
        return row(
          [
            { id: 'hit', label: 'HIT', col: '#f7768e', on },
            { id: 'stand', label: 'STAND', col: '#7dcfff', on },
            ...(mine.length === 2 && chips >= bet
              ? [{ id: 'double', label: 'DOUBLE', col: '#bb9af7', on }]
              : []),
          ],
          77,
          10,
          3,
          34,
          114,
          3
        );
      }
      return row(
        [
          { id: 'deal', label: 'DEAL ' + BET, col: '#9ece6a', on: on && chips >= BET },
          ...(hands > 0 ? [{ id: 'cash', label: 'CASH OUT', col: '#e0af68', on }] : []),
        ],
        77,
        10,
        3,
        54,
        114,
        3
      );
    };
    const say = (m, c) => {
      lines = wrap(m, 12);
      mcol = c;
    };
    const layout = () => {
      const sm = spread(mine.length),
        sd = spread(dealO.length);
      mineO.forEach((o, i) => (o.x = 3 + i * sm));
      dealO.forEach((o, i) => (o.x = 3 + i * sd));
    };
    const give = (to, list, hidden = false, delay = 0) => {
      const card = deck.pop();
      to.push(card);
      list.push(slot(card, 3, list === mineO ? 59 : 41, DECK, T + delay, hidden));
      layout();
      busy = Math.max(busy, delay + 0.32);
    };
    const resolve = () => {
      const pt = handTotal(mine).total,
        dt = handTotal(dealer).total;
      let pay = 0,
        who = 'cpu';
      if (pt > 21) {
        say(`BUST ${pt}`, '#f7768e');
        cel = { pose: 'cheer', left: 1.8 };
      } else if (bj && !(dealer.length === 2 && dt === 21)) {
        pay = Math.floor(bet * 2.5);
        say(`BLACKJACK WIN ${pay - bet}`, '#9ece6a');
        said = { s: '21!', left: 1.6 };
        cel = { pose: 'palm', left: 1.8 };
        who = 'me';
      } else if (dt > 21) {
        pay = bet * 2;
        say(`DEALER BUSTS WIN ${pay - bet}`, '#9ece6a');
        said = { s: 'BUST', left: 1.6 };
        cel = { pose: 'palm', left: 1.8 };
        who = 'me';
      } else if (pt > dt) {
        pay = bet * 2;
        say(`YOU WIN ${pt} VS ${dt}`, '#9ece6a');
        cel = { pose: 'palm', left: 1.8 };
        who = 'me';
      } else if (pt < dt) {
        say(`DEALER WINS ${dt} VS ${pt}`, '#f7768e');
        cel = { pose: 'cheer', left: 1.8 };
      } else {
        pay = bet;
        say(`PUSH ${pt} BET BACK`, '#ffd090');
        who = 'me';
      }
      if (pay > bet) {
        fx.burst(14, 66, ['#ffd23f', '#9ece6a', '#fff'], 14, 60);
      }
      chips += pay;
      finish(who);
    };
    const finish = (who) => {
      const n = Math.max(1, Math.min(4, bet / 5));
      for (let i = 0; i < n; i++)
        fly.send(
          POT[0],
          POT[1],
          who === 'me' ? ME[0] : CPU[0],
          who === 'me' ? ME[1] : CPU[1],
          i * 0.07
        );
      dealO.forEach((o) => flipUp(o, T));
      phase = 'resolved';
      bet = 0;
      sel = 0;
      api.score(chips);
      if (hands >= HANDS || chips < BET) fin = 2.4;
    };
    const toDealer = (pause = 0.8) => {
      phase = 'dealer';
      dealO.forEach((o) => flipUp(o, T));
      wait = pause;
    };
    const deal = () => {
      if (chips < BET) return;
      hands++;
      deck = shuffle(makeDeck());
      if (rigNext) {
        const want = rigNext.map((s) => ({ rank: s.slice(0, -1), suit: s.slice(-1) })),
          has = (c) => want.some((w) => w.rank === c.rank && w.suit === c.suit);
        deck = deck.filter((c) => !has(c)).concat(want.reverse());
        rigNext = null;
      }
      mine = [];
      dealer = [];
      mineO = [];
      dealO = [];
      bet = BET;
      chips -= BET;
      bj = false;
      cel = null;
      said = null;
      fly.send(ME[0], ME[1], POT[0], POT[1]);
      give(mine, mineO, false, 0.05);
      give(dealer, dealO, false, 0.25);
      give(mine, mineO, false, 0.45);
      give(dealer, dealO, true, 0.65);
      phase = 'player';
      sel = 0;
      say('HIT STAND OR DOUBLE', '#ffd090');
      if (handTotal(mine).total === 21) {
        bj = true;
        toDealer(1.3);
      }
    };
    const hit = () => {
      give(mine, mineO, false, 0.05);
      const t = handTotal(mine).total;
      if (t > 21) {
        say(`BUST ${t}`, '#f7768e');
        cel = { pose: 'cheer', left: 1.8 };
        finish('cpu');
      } else if (t === 21) toDealer(1);
    };
    const dbl = () => {
      if (mine.length !== 2 || chips < bet) return;
      chips -= bet;
      fly.send(ME[0], ME[1], POT[0] + 4, POT[1]);
      bet *= 2;
      give(mine, mineO, false, 0.05);
      const t = handTotal(mine).total;
      if (t > 21) {
        say(`BUST ON DOUBLE ${t}`, '#f7768e');
        cel = { pose: 'cheer', left: 1.8 };
        finish('cpu');
      } else toDealer(1);
    };
    const act = (id) => {
      pressed = id;
      pressT = 0.12;
      if (id === 'deal') deal();
      else if (id === 'cash') {
        done = true;
        api.over(chips);
      } else if (id === 'hit') hit();
      else if (id === 'stand') toDealer();
      else if (id === 'double') dbl();
    };

    let shown = chips;
    api.score(chips);

    return {
      state: () => ({
        phase,
        hands,
        chips,
        bet,
        busy: busy > 0,
        mine,
        dealer,
        bj,
        lines,
        said: said && said.s,
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
        busy -= dt;
        pressT -= dt;
        if (chips !== shown) api.score((shown = chips));
        if (cel && (cel.left -= dt) <= 0) cel = null;
        if (said && (said.left -= dt) <= 0) said = null;
        if (phase === 'dealer') {
          wait -= dt;
          if (wait <= 0) {
            const h = handTotal(dealer);
            if (h.total < 17 || (h.total === 17 && h.soft)) {
              give(dealer, dealO, false, 0);
              wait = 0.65;
            } else resolve();
          }
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
        const pose = cel ? cel.pose : busy > 0 || phase === 'dealer' ? 'talk' : 'idle';
        seat(c, L, pose, T, 84, 2, blinks(T));
        c.drawImage(F.bj, 66, 22);
        R(68, 24, 32, 7, '#2b6d74');
        R(68, 24, 32, 1, '#3f8f97');
        if (bet > 0) {
          label(c, 'BET ' + bet, 70, 26, '#ffd090');
          pile(c, 94, 31, Math.min(4, Math.ceil(bet / 5)));
        }
        if (said) bubble(c, 69, 3, said.s, 79);
        label(c, 'HAND ' + Math.min(hands, HANDS) + '/' + HANDS, 8, 1, '#e0af68');
        label(c, 'CHIPS ' + chips, 114, 1, chips >= BET ? '#9ece6a' : '#f7768e', 1, 'right');
        plate(c, 6, 9, 50, lines, mcol);
        panel(c, 1, 38, 118, 51, '#2b6d74');
        dealO.forEach((o) => putCard(c, o, T));
        mineO.forEach((o) => putCard(c, o, T));
        const hole = dealO.length > 1 && dealO[1].hidden && phase === 'player';
        if (dealer.length && dealO.every((o) => landed(o, T))) {
          const v = hole ? handTotal([dealer[0]]).total : handTotal(dealer).total;
          label(c, 'DEALER', 116, 42, '#c9e8ea', 1, 'right');
          if (hole) label(c, 'SHOWS ' + v, 116, 52, '#ffee88', 1, 'right');
          else label(c, v, 116, 49, v > 21 ? '#f7768e' : '#ffee88', 2, 'right');
        }
        if (mine.length && mineO.every((o) => landed(o, T))) {
          const t = handTotal(mine);
          label(c, 'YOU', 116, 60, '#c9e8ea', 1, 'right');
          label(c, t.total, 116, 66, t.total > 21 ? '#f7768e' : '#ffee88', 2, 'right');
        }
        if (!mine.length) label(c, 'TEN HANDS TO PLAY', 60, 58, '#c9e8ea', 1, 'center');
        drawBtns(c, btns(), okSel(btns(), sel), pressT > 0 ? pressed : '');
        fly.draw(c);
        fx.draw(c);
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
