import { LW, LH } from '../engine/pixel.js';

const TC = 78,
  TR = 20,
  LEFT = 80;
const tcol = (x) => Math.max(0, Math.min(TC - 1, Math.floor((x / LW) * TC)));
const trow = (y) => Math.max(0, Math.min(TR - 1, Math.floor((y / LH) * TR)));
const esc = (s) =>
  String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const B = (k, s) => '<b class="' + k + '">' + esc(s) + '</b>';

export function createTerminal(office, host, items) {
  const { P, SEATS, ROOMS, CAT, GOOSE } = office;
  const el = document.createElement('pre');
  el.className = 'bx-term';
  el.setAttribute('aria-label', 'The office in plain characters');
  host.appendChild(el);

  const log = [];
  const note = (msg) => {
    log.push([office.clock(), msg]);
    if (log.length > 8) log.shift();
  };
  office.on('event', (type, p) => {
    if (type === 'cheer') note(p.name + ' finished a task');
    else if (type === 'palm') note(p.name + ' hit a tool error');
    else if (type === 'join') note(p.name + ' joined');
    else if (type === 'gone') note(p.name + ' went home');
  });
  note('watching ' + P.length + ' agents');

  let at = -1;
  function draw(T) {
    const gr = [];
    for (let r = 0; r < TR; r++) gr.push(Array.from({ length: TC }, () => [' ', '']));
    const say = (c, r, s, k) => {
      for (let i = 0; i < s.length; i++)
        if (c + i < TC && c + i >= 0) gr[r][c + i] = [s[i], k || ''];
    };
    const WR = trow(215);
    for (let c = 0; c < TC; c++) {
      gr[2][c] = ['-', 'd'];
      gr[WR][c] = ['=', 'd'];
    }
    ROOMS.forEach((rm) => {
      const dc = tcol(rm.door);
      for (let i = -1; i <= 1; i++) gr[WR][dc + i] = [' ', ''];
      say(tcol(rm.x0) + 2, WR + 1, rm.name, 'd');
    });
    ROOMS.slice(1).forEach((rm) => {
      for (let r = WR + 1; r < TR; r++) gr[r][tcol(rm.x0)] = ['|', 'd'];
      gr[WR][tcol(rm.x0)] = ['+', 'd'];
    });
    say(tcol(54), 1, '[SRV]', 'd');
    say(tcol(84) + 2, 1, '[FISH]', 'd');
    say(tcol(150) + 3, 1, '[BOARD]', 'd');
    say(tcol(272) + 1, 1, '[STATUS]', 'd');
    say(tcol(538), 1, '[LIFT]', 'd');
    say(tcol(606), 1, '[o<]', 'd');
    items.forEach((it) => {
      if (it.b > 240 && it.s.width > 20)
        say(tcol(it.x + it.s.width / 2) - 1, trow(it.b - 6), '::', 'd');
    });
    SEATS.forEach((s) => {
      if (!s.conf) say(tcol(s.dx + 8), trow(s.seat === 'F' ? 124 : 138), '###', s.who ? 'k' : 'd');
    });
    P.forEach((p) => say(tcol(p.x), trow(p.y - 10), p.now === 'sleep' ? 'z' : p.name[0], p.st));
    say(tcol(CAT.x), trow(CAT.y - 4), '^', 'c');
    say(tcol(GOOSE.x), trow(GOOSE.y - 4), 'g', 'c');

    const w = P.filter((p) => p.st === 'w').length,
      t = P.filter((p) => p.st === 't').length,
      rest = P.length - w - t,
      line = '-'.repeat(TC),
      left = [];
    const L = (html, len) => left.push(html + ' '.repeat(Math.max(0, LEFT - len)));
    const clock = office.clock(),
      h1 = ' AGENT OFFICE   ' + w + ' working   ' + t + ' thinking   ' + rest + ' on a break';
    L(
      ' ' +
        B('h', 'AGENT OFFICE') +
        '   ' +
        B('w', w + ' working') +
        '   ' +
        B('t', t + ' thinking') +
        '   ' +
        B('i', rest + ' on a break') +
        ' '.repeat(Math.max(1, LEFT - h1.length - clock.length - 1)) +
        clock,
      LEFT
    );
    L(B('d', '+' + line + '+'), LEFT);
    gr.forEach((r) =>
      L(B('d', '|') + r.map((c) => (c[1] ? B(c[1], c[0]) : esc(c[0]))).join('') + B('d', '|'), LEFT)
    );
    L(B('d', '+' + line + '+'), LEFT);
    L(' ' + B('d', 'NAME          STATE      DOING                  ENERGY'), 53);
    P.slice()
      .sort((a, b) => 'wti'.indexOf(a.st) - 'wti'.indexOf(b.st))
      .slice(0, 9)
      .forEach((p) => {
        const e = Math.max(0, Math.min(10, Math.round(p.energy / 10)));
        L(
          ' ' +
            B(p.st, p.name.slice(0, 13).padEnd(13)) +
            ' ' +
            { w: 'working ', t: 'thinking', i: 'break   ' }[p.st] +
            '   ' +
            esc(office.act(p).padEnd(22)) +
            ' ' +
            B('k', '#'.repeat(e)) +
            B('d', '.'.repeat(10 - e)),
          59
        );
      });
    if (P.length > 9) L(' ' + B('d', '+ ' + (P.length - 9) + ' more'), 9);
    L(
      ' ' + B('d', 'letters are people · ^ cat · g goose · # desks · backtick or Esc to leave'),
      74
    );
    L(' &gt; tail -f office.log ' + (((performance.now() / 500) | 0) % 2 ? '_' : ' '), 24);

    const wide = host.clientWidth >= 760,
      right = [];
    if (wide) {
      const inRoom = (rm) => P.filter((p) => p.y > 240 && p.x >= rm.x0 && p.x < rm.x1).length,
        bar = (n) => B('k', '#'.repeat(Math.min(12, n))) + ' ' + n;
      right.push('', B('h', 'ROOMS'), 'HALL    ' + bar(P.filter((p) => p.y <= 240).length));
      ROOMS.forEach((rm) => right.push(rm.name.padEnd(8) + bar(inRoom(rm))));
      right.push('', B('h', 'EVENTS'));
      log.forEach((e) => right.push(B('d', e[0]) + ' ' + esc(e[1].slice(0, 22))));
      for (let i = log.length; i < 8; i++) right.push('');
      right.push(
        '',
        B('h', 'PETS'),
        'cat     ' + (CAT.sit ? 'sitting' : 'on patrol'),
        'goose   ' + (GOOSE.y > 240 ? 'raiding the cafe' : 'loose in the hall'),
        '',
        B('h', 'LIGHT'),
        clock + ' ' + office.phase(),
        '',
        B('h', 'UP NEXT'),
        B('d', 'lift arrives in ' + Math.ceil((19 - (T % 24) + 24) % 24) + 's')
      );
    }
    const byWidth = (host.clientWidth - 28) / ((wide ? 112 : 80) * 0.62),
      byHeight = (host.clientHeight - (host.clientWidth <= 760 ? 102 : 68)) / (left.length * 1.25);
    el.style.fontSize = Math.max(5.5, Math.min(15, byWidth, byHeight)) + 'px';
    el.innerHTML = left
      .map((l, i) => l + (wide && right[i] !== undefined ? '   ' + right[i] : ''))
      .join('\n');
  }

  return {
    el,
    frames: 0,
    frame(T) {
      if (T - at < 0.33) return;
      at = T;
      this.frames++;
      draw(T);
    },
    show(T) {
      at = -1;
      this.frame(T);
    },
  };
}
