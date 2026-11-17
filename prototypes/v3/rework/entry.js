// The sample page for the games rework: the three reworked games in a stand-alone copy of
// the cabinet frame. The games themselves are the product's own modules.
import coffee from '../../../src/office/games/play/coffee.js';
import snake from '../../../src/office/games/play/snake.js';
import crystal from '../../../src/office/games/play/crystal.js';

const GAMES = {
  barista: { d: coffee, title: 'БАРИСТА', room: 'CAFE · БЫЛО: COFFEE MACHINE', tint: '#39c5cf' },
  snake: { d: snake, title: 'SNAKE', room: 'GAMES ROOM · ЭКРАН АВТОМАТА', tint: '#ff4fd8' },
  crystal: { d: crystal, title: 'ШАР', room: 'LOUNGE · БЫЛО: CRYSTAL BALL', tint: '#e0af68' },
};
const HOW = {
  barista: 'СОБЕРИ ЗАКАЗ',
  snake: 'СТРЕЛКИ',
  crystal: 'ПОВТОРИ ЗНАКИ',
};
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
const $ = (s) => document.querySelector(s);
const scr = $('#screen'),
  sx = scr.getContext('2d');
const CAB = { id: 'barista', run: null, state: 'title', last: 0 },
  best = {},
  held = new Set();

function slate(kind, score) {
  const c = $('#slate'),
    g = GAMES[CAB.id];
  c.hidden = false;
  c.innerHTML =
    kind === 'over'
      ? '<b>GAME OVER</b><span>СЧЁТ ' + score + '</span><button id="go">ЕЩЁ РАЗ</button>'
      : '<b>' +
        g.title +
        '</b><span>' +
        HOW[CAB.id] +
        '</span><button id="go" class="blink">PRESS START</button>';
  c.querySelector('#go').onclick = play;
}
function board() {
  const l = best[CAB.id] || [];
  $('#hi').innerHTML = [0, 1, 2, 3, 4]
    .map(
      (i) => '<li><span>' + (i + 1) + '.</span><b>' + (l[i] != null ? l[i] : '---') + '</b></li>'
    )
    .join('');
}
function open(id) {
  CAB.id = id;
  CAB.run = null;
  CAB.state = 'title';
  held.clear();
  const g = GAMES[id];
  $('#cab').style.setProperty('--c', g.tint);
  $('#cabT').textContent = g.title;
  $('#cabR').textContent = g.room;
  $('#cabHow').textContent = HOW[id];
  $('#cabS').textContent = '0';
  [scr.width, scr.height] = g.d.size;
  $('#dpad').style.visibility = g.d.pad ? 'visible' : 'hidden';
  const a = $('#btnA');
  a.style.visibility = g.d.a ? 'visible' : 'hidden';
  a.textContent = g.d.a || 'A';
  document
    .querySelectorAll('.pick')
    .forEach((b) => b.setAttribute('aria-pressed', b.dataset.g === id));
  // one frame of the game behind the title, so the screen is never blank
  const peek = g.d.start({
    w: scr.width,
    h: scr.height,
    font: 'monospace',
    held: () => false,
    score() {},
    over() {},
  });
  peek.tick(0.016);
  peek.draw(sx);
  slate('title');
  board();
}
function play() {
  const g = GAMES[CAB.id];
  $('#slate').hidden = true;
  $('#cabS').textContent = '0';
  CAB.state = 'play';
  held.clear();
  CAB.run = g.d.start({
    w: scr.width,
    h: scr.height,
    font: '"Press Start 2P",monospace',
    held: (k) => held.has(k),
    score: (n) => ($('#cabS').textContent = n),
    over(n) {
      if (CAB.state !== 'play') return;
      CAB.state = 'over';
      $('#cabS').textContent = n;
      best[CAB.id] = (best[CAB.id] || [])
        .concat(n)
        .sort((a, b) => b - a)
        .slice(0, 5);
      board();
      slate('over', n);
    },
  });
  CAB.last = performance.now();
  requestAnimationFrame(loop);
}
function loop(t) {
  if (CAB.state !== 'play' || !CAB.run) return;
  const dt = Math.min(0.05, (t - CAB.last) / 1000);
  CAB.last = t;
  CAB.run.tick(dt);
  if (CAB.state === 'play') CAB.run.draw(sx);
  requestAnimationFrame(loop);
}
function press(k) {
  if (CAB.state === 'play') {
    held.add(k);
    if (CAB.run.key) CAB.run.key(k);
  } else if (k === 'a') play();
}
document.querySelectorAll('#dpad button, #btnA').forEach((b) => {
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    press(b.dataset.k);
  });
  b.addEventListener('pointerup', () => held.delete(b.dataset.k));
});
scr.addEventListener('pointerdown', (e) => {
  if (CAB.state !== 'play' || !CAB.run.tap) return;
  const r = scr.getBoundingClientRect(),
    k = Math.min(r.width / scr.width, r.height / scr.height);
  CAB.run.tap(
    (e.clientX - r.left - (r.width - scr.width * k) / 2) / k,
    (e.clientY - r.top - (r.height - scr.height * k) / 2) / k
  );
});
document.addEventListener('keydown', (e) => {
  const k = KEYS[e.key] || KEYS[e.key.toLowerCase()];
  if (!k || (e.target.closest('button, a') && k === 'a')) return;
  const r = $('#cab').getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  e.preventDefault();
  if (!e.repeat) press(k);
});
document.addEventListener('keyup', (e) => held.delete(KEYS[e.key] || KEYS[e.key.toLowerCase()]));
document.querySelectorAll('.pick').forEach((b) => (b.onclick = () => open(b.dataset.g)));
open('barista');
