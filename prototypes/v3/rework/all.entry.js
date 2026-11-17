// The page with all 18 games: the product's own cabinet and game modules, hung on a
// stand-in for the office. Each card shows a live frame of its game.
import { installGames, FILE } from '../../../src/office/games/cabinet.js';
import { GAMES } from '../../../src/office/world/plan.js';

const MODS = import.meta.glob('../../../src/office/games/play/*.js', { eager: true });
const mod = (name) => {
  const k = Object.keys(MODS).find((p) => p.endsWith('/' + FILE[name] + '.js'));
  return k ? MODS[k].default : null;
};
const TINT = {
  Hall: '#7aa2f7',
  'Games room': '#ff4fd8',
  Gym: '#9ece6a',
  Lounge: '#e0af68',
  Cafe: '#39c5cf',
};
const ROOM = {
  Hall: 'Холл',
  'Games room': 'Игровая',
  Gym: 'Спортзал',
  Lounge: 'Лаунж',
  Cafe: 'Кафе',
};
// tag: ok = accepted by the owner, sample = shown as a sample, new = new mechanic,
// skin = same rules with a new look
const INFO = {
  'Memory match': {
    tag: 'skin',
    what: 'Стикеры на доске: найди шесть пар. Задумаешься — кот смахнёт стикер.',
    keys: 'тап',
  },
  'Typing test': {
    tag: 'skin',
    what: 'Набери сообщение коммита, пока идёт сборка.',
    keys: 'клавиатура',
  },
  'Plant care': {
    tag: 'new',
    what: 'Пять растений, 45 секунд. Поливай сухие, не залей.',
    keys: 'тап по растению',
  },
  'Coffee machine': {
    name: 'Бариста',
    tag: 'ok',
    what: 'Собери заказ по слоям, пока у гостя хватает терпения.',
    keys: 'тап по кнопкам',
  },
  'Jukebox rhythm': {
    tag: 'skin',
    what: 'Жми стрелки, когда они доходят до ряда внизу. Попадания разогревают танцпол.',
    keys: 'стрелки или тап',
  },
  'Crystal ball': {
    name: 'Шар',
    tag: 'sample',
    what: 'Шар показывает знаки. Повтори по порядку.',
    keys: 'тап по картам',
  },
  Poker: {
    tag: 'skin',
    what: 'Холдем на десять раздач. Колода честная, соперник выдаёт себя.',
    keys: 'кнопки',
  },
  Roulette: {
    tag: 'skin',
    what: 'Ставь фишки на поле, крупье крутит колесо. Десять спинов.',
    keys: 'тап по полю',
  },
  Blackjack: {
    tag: 'skin',
    what: 'Десять раздач против дилера: ещё, хватит, удвоить.',
    keys: 'кнопки',
  },
  'Slot machine': {
    tag: 'new',
    what: 'После первого вращения удержи до двух барабанов и крути ещё раз.',
    keys: 'кнопки',
  },
  Foosball: {
    tag: 'skin',
    what: 'Кикер до пяти голов. Штанги ходят за пальцем.',
    keys: 'палец или мышь',
  },
  Minesweeper: {
    name: 'Bug sweeper',
    tag: 'skin',
    what: 'Сапёр с жуками. Первый тап всегда безопасный.',
    keys: 'тап, долгий тап — флажок',
  },
  'Tic-tac-toe': {
    tag: 'new',
    what: 'Лестница из трёх соперников: стажёр, разработчик, кот.',
    keys: 'тап по клетке',
  },
  'Connect 4': {
    tag: 'skin',
    what: 'Четыре в ряд против коллеги.',
    keys: 'тап по столбцу',
  },
  Darts: {
    tag: 'new',
    what: 'Настоящая мишень с секторами, девять дротиков.',
    keys: 'тап — бросок',
  },
  'Reaction test': {
    tag: 'new',
    what: 'Светофор, пять попыток. Жми на зелёный, счёт по среднему.',
    keys: 'тап',
  },
  Snake: {
    tag: 'sample',
    what: 'Жуки, кофе даёт разгон, звезда появляется ненадолго.',
    keys: 'стрелки',
  },
  'Ping-pong': {
    tag: 'skin',
    what: 'Стол сверху, игра до пяти очков.',
    keys: 'палец или мышь',
  },
};
const TAG = { ok: 'ПРИНЯТ', sample: 'ОБРАЗЕЦ', new: 'НОВАЯ МЕХАНИКА', skin: 'НОВЫЙ ВИД' };

const office = {
  picked: null,
  showGames: false,
  cam: { touched: false, frame() {} },
  on() {},
  emit() {},
};
const cab = installGames(office);

// a frame of the game after a few seconds of nobody playing
function frame(cv, d) {
  [cv.width, cv.height] = d.size;
  const run = d.start({
    w: d.size[0],
    h: d.size[1],
    font: '"Press Start 2P",monospace',
    held: () => false,
    score() {},
    over() {},
  });
  for (let i = 0; i < 110; i++) if (run.tick) run.tick(1 / 60);
  if (run.draw) run.draw(cv.getContext('2d'));
}

const grid = document.querySelector('#grid');
GAMES.forEach((m) => {
  const info = INFO[m.name],
    b = document.createElement('button');
  b.className = 'g';
  b.style.setProperty('--c', TINT[m.room]);
  b.innerHTML =
    '<canvas width="120" height="90"></canvas><span class="row"><i>' +
    m.n +
    '</i><b></b></span><em class="tag ' +
    info.tag +
    '">' +
    TAG[info.tag] +
    '</em><span class="what"></span><span class="room"></span>';
  b.querySelector('b').textContent = info.name || m.name;
  b.querySelector('.what').textContent = info.what;
  b.querySelector('.room').textContent = ROOM[m.room] + ' · ' + info.keys;
  b.onclick = () => cab.open(m);
  grid.appendChild(b);
});
const paint = () =>
  GAMES.forEach((m, i) => {
    const d = mod(m.name);
    try {
      if (d) frame(grid.children[i].querySelector('canvas'), d);
    } catch {
      // a card without a picture still opens its game
    }
  });
const fonts = document.fonts;
Promise.race([
  fonts ? fonts.load('8px "Press Start 2P"') : null,
  new Promise((r) => setTimeout(r, 1500)),
]).then(paint, paint);
