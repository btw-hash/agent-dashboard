import './cabinet.css';
import { GAMES } from '../world/plan.js';
import { sound } from './sfx.js';

// One frame for all 18 games. A game is a module in ./play/ whose default export is
//   { size: [w, h], how: 'D-PAD', pad: true, a: 'SPIN', low: false, unit: '', text: false, quiet: false, start(api) }
// and start(api) returns any of { key(k), up(k), tap(x, y), move(x, y), hold(x, y), char(ch), tick(dt), draw(ctx) }.
// k is 'up' | 'down' | 'left' | 'right' | 'a'. The frame owns the loop, the exit and the scores:
// the game reports through api.score(n) and ends with api.over(n). The frame clicks on every press unless
// the game is quiet: true and makes its own sounds (./sfx.js).
const MODS = import.meta.glob('./play/*.js');
export const FILE = {
  'Memory match': 'memory',
  'Typing test': 'typing',
  'Plant care': 'plant',
  'Coffee machine': 'coffee',
  'Jukebox rhythm': 'jukebox',
  'Crystal ball': 'crystal',
  Poker: 'poker',
  Roulette: 'roulette',
  Blackjack: 'blackjack',
  'Slot machine': 'slots',
  Foosball: 'foosball',
  Minesweeper: 'minesweeper',
  'Tic-tac-toe': 'tictactoe',
  'Connect 4': 'connect4',
  Darts: 'darts',
  'Reaction test': 'reaction',
  Snake: 'snake',
  'Ping-pong': 'pingpong',
};
const TINT = {
  Hall: '#7aa2f7',
  'Games room': '#ff4fd8',
  Gym: '#9ece6a',
  Lounge: '#e0af68',
  Cafe: '#39c5cf',
};
export const FONT = '"Press Start 2P",monospace';
const KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  ' ': 'a',
  Enter: 'a',
};
const STORE = 'agent_office_scores';

export function scores() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    return {};
  }
}
function keep(name, n, low) {
  const all = scores(),
    l = (all[name] || [])
      .concat(n)
      .sort((a, b) => (low ? a - b : b - a))
      .slice(0, 5);
  all[name] = l;
  try {
    localStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    // a private window: the table lives for this visit only
  }
  return l[0] === n;
}

export function installGames(office) {
  const veil = document.createElement('div');
  veil.className = 'cabveil';
  veil.hidden = true;
  veil.innerHTML =
    '<div class="cab" role="dialog" aria-labelledby="cabT">' +
    '<div class="mq"><b id="cabT"></b><span id="cabR"></span><button id="cabSnd" aria-label="Sound" aria-pressed="true">&#9834;</button><button id="cabX" aria-label="Exit">EXIT</button></div>' +
    '<div class="crtw"><div class="crt" id="crt"><canvas id="screen" width="384" height="288"></canvas><div class="slate" id="slate"></div>' +
    '<input id="cabKeys" class="cabkeys" autocapitalize="off" autocomplete="off" spellcheck="false" aria-label="Type here"></div></div>' +
    '<div class="deck"><div class="dpad" id="dpad"><button data-k="up" aria-label="Up">&#9650;</button><button data-k="left" aria-label="Left">&#9664;</button>' +
    '<button data-k="right" aria-label="Right">&#9654;</button><button data-k="down" aria-label="Down">&#9660;</button></div>' +
    '<div class="how"><span id="cabHow"></span><b id="cabS">0</b>SCORE</div><div class="ab"><button id="btnA" data-k="a">A</button></div></div>' +
    '<aside class="hi"><h3>HI-SCORES</h3><ol id="hi"></ol><div class="coin" id="coin">1 CREDIT</div></aside></div>';
  document.querySelector('#app').appendChild(veil);
  const $ = (s) => veil.querySelector(s);
  const scr = $('#screen'),
    sx = scr.getContext('2d'),
    keysIn = $('#cabKeys');
  const CAB = { m: null, d: null, run: null, state: 'off', last: 0 },
    held = new Set();
  const fmt = (n) => n + ((CAB.d && CAB.d.unit) || '');

  function board() {
    const l = scores()[CAB.m.name] || [];
    $('#hi').innerHTML = [0, 1, 2, 3, 4]
      .map(
        (i) =>
          '<li><span>' + (i + 1) + '.</span><b>' + (l[i] != null ? fmt(l[i]) : '---') + '</b></li>'
      )
      .join('');
  }
  function slate(kind, score, record) {
    const c = $('#slate'),
      d = CAB.d;
    c.hidden = false;
    if (kind === 'over')
      c.innerHTML =
        '<b>GAME OVER</b><span>SCORE ' +
        fmt(score) +
        '</span>' +
        (record ? '<em>NEW RECORD</em>' : '') +
        '<button id="go">PLAY AGAIN</button>';
    else if (kind === 'load')
      c.innerHTML = '<b>' + CAB.m.name.toUpperCase() + '</b><span>LOADING</span>';
    else
      c.innerHTML =
        '<b>' +
        CAB.m.name.toUpperCase() +
        '</b>' +
        (d
          ? '<span>' + d.how + '</span><button id="go" class="blink">PRESS START</button>'
          : '<span>OUT OF ORDER</span>');
    const b = c.querySelector('#go');
    if (b) b.onclick = play;
  }
  async function open(m) {
    CAB.m = m;
    CAB.d = null;
    CAB.state = 'title';
    CAB.run = null;
    held.clear();
    veil.querySelector('.cab').style.setProperty('--c', TINT[m.room]);
    $('#cabT').textContent = m.name.toUpperCase();
    $('#cabR').textContent = m.room.toUpperCase() + ' · ' + m.n + '/18';
    $('#cabS').textContent = '0';
    veil.hidden = false;
    slate('load');
    office.picked = m;
    office.cam.touched = true;
    office.cam.frame(m.x, m.y + 10, 300, 170, true);
    const load = MODS['./play/' + FILE[m.name] + '.js'];
    let d = null;
    try {
      d = load ? (await load()).default : null;
    } catch {
      d = null;
    }
    if (CAB.m !== m || CAB.state === 'off') return;
    CAB.d = d;
    const [w, h] = d ? d.size : [384, 288];
    scr.width = w;
    scr.height = h;
    sx.fillStyle = '#04060a';
    sx.fillRect(0, 0, w, h);
    $('#dpad').style.visibility = d && d.pad ? 'visible' : 'hidden';
    const a = $('#btnA');
    a.style.visibility = d && d.a ? 'visible' : 'hidden';
    a.textContent = (d && d.a) || 'A';
    $('#cabHow').textContent = d ? d.how : '';
    $('#coin').textContent = d ? '1 CREDIT' : 'NO CREDIT';
    const crt = $('#crt');
    crt.classList.remove('on');
    void crt.offsetWidth;
    crt.classList.add('on');
    slate('title');
    board();
  }
  function play() {
    const d = CAB.d;
    if (!d) return;
    $('#slate').hidden = true;
    $('#cabS').textContent = fmt(0);
    sound.unlock();
    sound.play('start');
    CAB.state = 'play';
    held.clear();
    CAB.run = d.start({
      w: scr.width,
      h: scr.height,
      font: FONT,
      held: (k) => held.has(k),
      score(n) {
        $('#cabS').textContent = fmt(n);
      },
      over(n) {
        if (CAB.state !== 'play') return;
        CAB.state = 'over';
        $('#cabS').textContent = fmt(n);
        const rec = keep(CAB.m.name, n, d.low) && (d.low || n > 0);
        sound.play(rec ? 'record' : 'over');
        board();
        slate('over', n, rec);
        keysIn.blur();
        office.emit('game', CAB.m, n, rec);
      },
    });
    if (d.text) keysIn.focus();
    CAB.last = performance.now();
    requestAnimationFrame(loop);
  }
  function loop(t) {
    if (CAB.state !== 'play' || !CAB.run) return;
    const dt = Math.min(0.05, (t - CAB.last) / 1000);
    CAB.last = t;
    if (CAB.run.tick) CAB.run.tick(dt);
    if (CAB.state === 'play' && CAB.run.draw) CAB.run.draw(sx);
    requestAnimationFrame(loop);
  }
  function close() {
    CAB.state = 'off';
    CAB.run = null;
    veil.hidden = true;
    office.picked = null;
    keysIn.blur();
  }
  function press(k) {
    if (CAB.state === 'play') {
      held.add(k);
      click();
      if (CAB.run.key) CAB.run.key(k);
    } else if (k === 'a') play();
  }
  function release(k) {
    held.delete(k);
    if (CAB.state === 'play' && CAB.run.up) CAB.run.up(k);
  }
  const click = () => CAB.d.quiet || sound.play('click');
  const snd = $('#cabSnd');
  snd.setAttribute('aria-pressed', sound.on);
  snd.onclick = () => {
    sound.set(!sound.on);
    sound.unlock();
    snd.setAttribute('aria-pressed', sound.on);
    sound.play('click');
  };
  const at = (e) => {
    const r = scr.getBoundingClientRect(),
      k = Math.min(r.width / scr.width, r.height / scr.height);
    return [
      (e.clientX - r.left - (r.width - scr.width * k) / 2) / k,
      (e.clientY - r.top - (r.height - scr.height * k) / 2) / k,
    ];
  };

  $('#cabX').onclick = close;
  veil.addEventListener('pointerdown', (e) => {
    if (e.target === veil) close();
  });
  veil.querySelectorAll('#dpad button, #btnA').forEach((b) => {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      press(b.dataset.k);
    });
    const up = () => release(b.dataset.k);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
  });
  let down = null;
  scr.addEventListener('pointerdown', (e) => {
    if (CAB.state !== 'play') return;
    scr.setPointerCapture(e.pointerId);
    const [x, y] = at(e);
    down = { x, y, moved: 0, held: false };
    if (CAB.run.hold)
      down.timer = setTimeout(() => {
        if (down && down.moved < 6 && CAB.state === 'play') {
          down.held = true;
          CAB.run.hold(down.x, down.y);
        }
      }, 450);
    if (CAB.run.move) CAB.run.move(x, y, true);
    if (CAB.d.text) keysIn.focus();
  });
  scr.addEventListener('pointermove', (e) => {
    if (CAB.state !== 'play') return;
    const [x, y] = at(e);
    if (down) down.moved = Math.max(down.moved, Math.abs(x - down.x) + Math.abs(y - down.y));
    if (CAB.run.move) CAB.run.move(x, y, !!down);
  });
  const lift = (e) => {
    if (!down) return;
    clearTimeout(down.timer);
    const d = down;
    down = null;
    if (CAB.state !== 'play' || d.held || e.type === 'pointercancel') return;
    const [x, y] = at(e);
    click();
    if (CAB.run.tap) CAB.run.tap(x, y);
  };
  scr.addEventListener('pointerup', lift);
  scr.addEventListener('pointercancel', lift);

  document.addEventListener('keydown', (e) => {
    if (CAB.state === 'off') return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      return close();
    }
    if (CAB.state === 'play' && CAB.d.text) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && CAB.run.char) {
        e.preventDefault();
        click();
        CAB.run.char(e.key);
      } else if (e.key === 'Backspace' && CAB.run.char) {
        e.preventDefault();
        CAB.run.char('\b');
      } else if (e.key === 'Enter') press('a');
      return;
    }
    const k = KEYS[e.key] || KEYS[e.key.toLowerCase()];
    if (k) {
      e.preventDefault();
      if (!e.repeat) press(k);
    }
  });
  document.addEventListener('keyup', (e) => {
    const k = KEYS[e.key] || KEYS[e.key.toLowerCase()];
    if (k) release(k);
  });
  // soft keyboards send no usable keydown: read what lands in the hidden field instead
  keysIn.addEventListener('input', () => {
    const v = keysIn.value;
    keysIn.value = '';
    if (CAB.state === 'play' && CAB.run.char) for (const ch of v) CAB.run.char(ch);
  });

  // the list of all 18, opened from the top bar; while it is open the markers show in the office
  const list = document.createElement('aside');
  list.className = 'gamelist panel ui';
  list.hidden = true;
  document.querySelector('#app').appendChild(list);
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.id = 'gamesBtn';
  btn.textContent = 'Games';
  btn.setAttribute('aria-pressed', 'false');
  document.querySelector('#tools').insertBefore(btn, document.querySelector('#tvBtn'));
  function drawList() {
    const all = scores();
    list.innerHTML =
      '<h2><span>GAMES</span><span>18</span></h2><div class="gl">' +
      GAMES.map((m) => {
        const best = (all[m.name] || [])[0];
        return (
          '<button class="gm" data-n="' +
          m.n +
          '" style="--c:' +
          TINT[m.room] +
          '"><i>' +
          m.n +
          '</i><b>' +
          m.name +
          '</b><span>' +
          m.room +
          (best != null ? ' · best ' + best : '') +
          '</span></button>'
        );
      }).join('') +
      '</div>';
  }
  function setList(on) {
    list.hidden = !on;
    office.showGames = on;
    btn.setAttribute('aria-pressed', on);
    if (on) drawList();
  }
  btn.onclick = () => setList(list.hidden);
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.gm');
    if (!b) return;
    if (innerWidth <= 760) setList(false);
    open(GAMES[+b.dataset.n - 1]);
  });
  office.on(
    'pick',
    (a) => {
      if (!a || a.kind !== 'game') return false;
      open(a);
      return true;
    },
    true
  );
  office.on('tv', (on) => on && (close(), setList(false)));
  return { open, close, isOpen: () => CAB.state !== 'off' };
}
