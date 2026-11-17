import './details.css';
import { mk } from '../engine/pixel.js';
import { ROOMS, MID } from '../world/plan.js';

// Wave 4 of the small details: everything around the office rather than in it.
const JOKES = [
  [4, 176, 18, 28, 'Plant. Thrives on neglect and stand-ups.'],
  [222, 160, 10, 12, 'Bin. Contains three abandoned refactors.'],
  [438, 216, 24, 46, 'Fridge. Somebody labelled the yoghurt DO NOT MERGE.'],
  [466, 222, 22, 40, 'Vending machine. Accepts coins and excuses.'],
  [492, 234, 11, 28, 'Water cooler. Rumours are served cold.'],
  [84, 40, 38, 32, 'Fish tank. They have seen every deploy.'],
  [341, 7, 16, 16, 'Wall clock. It is always five minutes to the deadline.'],
  [538, 6, 38, 40, 'Lift. Goes up, down, and occasionally sideways.'],
  [582, 46, 14, 34, 'Coat stand. One scarf has been here since March.'],
  [608, 146, 26, 34, 'Bookshelf. Mostly manuals nobody opened.'],
  [622, 318, 12, 26, 'Gumball machine. One in five is a bug.'],
  [584, 193, 18, 8, 'The bed of the cat. The cat prefers keyboards.'],
  [158, 213, 38, 20, 'Mirror. Rubber-duck debugging, deluxe edition.'],
  [242, 250, 22, 42, 'Punching bag. Named after a flaky test.'],
  [8, 10, 40, 16, 'Neon sign. Flickers when the build does.'],
  [454, 16, 26, 16, 'Trophies. Fewest meetings, 2026.'],
  [414, 12, 30, 20, 'Cork board. For the newspaper, click NEWS below.'],
  [490, 12, 38, 16, 'Days without a tool error. Do not jinx it.'],
  [604, 211, 30, 16, 'Menu. Today: coffee, with a side of coffee.'],
  [150, 6, 54, 30, 'Whiteboard. Wiped at midnight, like all good plans.'],
];
const BADGE = {
  'first-game': ['Insert coin', 'Finished a game in the cabinet'],
  record: ['High score', 'Set a new record'],
  cat: ['Cat person', 'Petted the cat five times in a day'],
  owl: ['Night owl', 'Visited the office after midnight'],
  ten: ['Shipping day', 'Ten tasks finished in one day'],
  full: ['Full house', 'Twelve agents working at once'],
  disco: ['Secret disco', 'Found the key combo'],
  tv: ['Couch mode', 'Switched on TV mode'],
  plug: ['Plugged in', 'Your own agent sat down at a desk'],
};
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

export function installUi(office, shell, stats, features) {
  const { P, CAT, cam } = office;
  const app = document.querySelector('#app');
  const award = (id) => {
    if (!stats.award(id)) return;
    shell.toast('Achievement: ' + BADGE[id][0]);
    shell.news('Achievement unlocked: ' + BADGE[id][0] + '. ' + BADGE[id][1] + '.');
  };

  // boot: the rooms light up one by one
  const t0 = performance.now(),
    order = [null, ...ROOMS];
  const boot = (lg) => {
    const t = (performance.now() - t0) / 1000;
    if (t > 0.45 * order.length + 0.4) {
      office.onLight.splice(office.onLight.indexOf(boot), 1);
      return;
    }
    lg.globalCompositeOperation = 'source-over';
    order.forEach((r, i) => {
      const k = Math.max(0, Math.min(1, (t - 0.2 - i * 0.45) / 0.25));
      if (k >= 1) return;
      lg.fillStyle = 'rgba(10,11,26,' + (1 - k) * 0.92 + ')';
      if (r) lg.fillRect(r.x0, MID, r.x1 - r.x0, 360 - MID);
      else lg.fillRect(0, 0, 640, MID);
    });
  };
  office.onLight.push(boot);

  // favicon: the cat sleeps while nobody works and types when somebody does
  const ico = mk(16, 16),
    ic = ico.getContext('2d'),
    link = document.querySelector('link[rel="icon"]');
  let icoKey = '';
  function favicon(T) {
    const busy = P.some((p) => p.st === 'w'),
      f = busy ? ((T * 3) | 0) % 2 : 0,
      key = busy + ':' + f;
    if (key === icoKey || !link) return;
    icoKey = key;
    const R = (x, y, w, h, c) => {
      ic.fillStyle = c;
      ic.fillRect(x, y, w, h);
    };
    ic.clearRect(0, 0, 16, 16);
    R(2, 4, 12, 9, '#f08a3c');
    R(2, 1, 3, 4, '#f08a3c');
    R(11, 1, 3, 4, '#f08a3c');
    R(3, 2, 1, 2, '#ffc4c4');
    R(12, 2, 1, 2, '#ffc4c4');
    R(7, 9, 2, 1, '#7a2430');
    if (busy) {
      R(4, 6, 2, 2, '#12132a');
      R(10, 6, 2, 2, '#12132a');
      R(1, 13, 14, 3, '#2a2e44');
      R(3 + f * 2, 12, 3, 2, '#d9722a');
      R(10 - f * 2, 12, 3, 2, '#d9722a');
    } else {
      R(4, 7, 3, 1, '#12132a');
      R(9, 7, 3, 1, '#12132a');
      R(12, 0, 3, 1, '#c8d3f5');
      R(13, 1, 1, 1, '#c8d3f5');
      R(12, 2, 3, 1, '#c8d3f5');
    }
    link.type = 'image/png';
    link.href = ico.toDataURL();
  }

  // tooltip jokes over the furniture
  const tip = document.createElement('div');
  tip.className = 'tip panel';
  tip.hidden = true;
  app.appendChild(tip);
  let tipAt = 0,
    tipFor = null;
  const cv = document.querySelector('#cv');
  function hideTip() {
    tipFor = null;
    tip.hidden = true;
  }
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return hideTip();
    const [x, y] = cam.toWorld(e.clientX, e.clientY),
      j = office.hov
        ? null
        : JOKES.find((r) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]) || null;
    if (j !== tipFor) {
      tipFor = j;
      tipAt = performance.now();
      tip.hidden = true;
    }
    if (j) {
      const r = app.getBoundingClientRect();
      tip.style.left = Math.min(r.width - 250, Math.max(8, e.clientX - r.left + 14)) + 'px';
      tip.style.top = e.clientY - r.top + 18 + 'px';
    }
  });
  cv.addEventListener('pointerleave', hideTip);
  cv.addEventListener('pointerdown', hideTip);

  // sound: a quiet lo-fi pad and typing that follows how many agents work. Off until asked for.
  const snd = document.createElement('button');
  snd.className = 'btn';
  snd.id = 'soundBtn';
  snd.textContent = 'Sound';
  snd.setAttribute('aria-pressed', 'false');
  document.querySelector('#tools').insertBefore(snd, document.querySelector('#teamBtn'));
  let audio = null;
  function soundOn() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ac = new AC(),
      out = ac.createGain(),
      lp = ac.createBiquadFilter();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.5, ac.currentTime + 1.5);
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    lp.connect(out).connect(ac.destination);
    [110, 164.8, 220.6, 277.2].forEach((f, i) => {
      const o = ac.createOscillator(),
        g = ac.createGain(),
        lfo = ac.createOscillator(),
        depth = ac.createGain();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      g.gain.value = 0.035;
      lfo.frequency.value = 0.07 + i * 0.031;
      depth.gain.value = 0.025;
      lfo.connect(depth).connect(g.gain);
      o.connect(g).connect(lp);
      o.start();
      lfo.start();
    });
    const noise = ac.createBuffer(1, 2048, ac.sampleRate),
      d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    const click = () => {
      const s = ac.createBufferSource(),
        g = ac.createGain(),
        hp = ac.createBiquadFilter();
      s.buffer = noise;
      s.playbackRate.value = 0.8 + Math.random() * 0.8;
      hp.type = 'highpass';
      hp.frequency.value = 1800;
      g.gain.value = 0.05 + Math.random() * 0.05;
      s.connect(hp).connect(g).connect(out);
      s.start();
    };
    let timer = null;
    const loop = () => {
      const n = P.filter((p) => p.st === 'w' && p.seat).length;
      if (n && !document.hidden) click();
      timer = setTimeout(loop, n ? (90 + Math.random() * 260) / Math.min(4, 0.5 + n / 3) : 600);
    };
    loop();
    return {
      stop() {
        clearTimeout(timer);
        out.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4);
        setTimeout(() => ac.close(), 600);
      },
    };
  }
  snd.onclick = () => {
    if (audio) {
      audio.stop();
      audio = null;
    } else audio = soundOn();
    snd.setAttribute('aria-pressed', !!audio);
  };

  // the daily newspaper, behind the NEWS label of the ticker
  const paper = document.createElement('div');
  paper.className = 'veil';
  paper.hidden = true;
  app.appendChild(paper);
  function openPaper() {
    const d = stats.day(),
      top = Object.entries(d.by).sort((a, b) => b[1] - a[1])[0],
      w = P.filter((p) => p.st === 'w').length,
      cups = P.reduce((n, p) => n + p.coffees, 0),
      plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's'),
      lead =
        d.done >= 10
          ? 'SHIPPING DAY: ' + d.done + ' TASKS OUT THE DOOR'
          : d.errors > d.done
            ? 'TOOLS FIGHT BACK: ' + plural(d.errors, 'ERROR') + ' AND COUNTING'
            : d.done
              ? plural(d.done, 'TASK') + ' FINISHED, MORALE STEADY'
              : 'QUIET DAY AT THE OFFICE, CAT REMAINS IN CHARGE';
    paper.innerHTML =
      '<div class="sheet panel paper" role="dialog" aria-label="Office newspaper"><div class="row between"><h2>THE DAILY COMMIT</h2><button class="btn" id="paperX">Close</button></div><p class="dateline">' +
      new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) +
      ' &middot; ' +
      office.phase() +
      ' edition</p><h3>' +
      lead +
      '</h3><ul><li><b>' +
      w +
      '</b> at work right now, <b>' +
      (P.length - w) +
      '</b> elsewhere in the building.</li><li>Employee of the day: <b>' +
      (top ? esc(top[0]) + '</b> with ' + plural(top[1], 'task') : 'nobody yet</b>') +
      '.</li><li>Tool errors today: <b>' +
      d.errors +
      '</b>. Days without one: <b>' +
      stats.daysOk() +
      '</b>.</li><li>Coffees carried from the cafe: <b>' +
      cups +
      '</b>. New arrivals: <b>' +
      d.joins +
      '</b>.</li><li>Games played in the cabinet: <b>' +
      d.games +
      '</b>. The cat was petted <b>' +
      plural(d.pets, 'time') +
      '</b>.</li></ul><p class="small">Printed fresh every midnight. Kept in this browser only.</p></div>';
    paper.hidden = false;
    paper.querySelector('#paperX').onclick = () => (paper.hidden = true);
  }
  paper.addEventListener('pointerdown', (e) => {
    if (e.target === paper) paper.hidden = true;
  });
  const chip = document.querySelector('.ticker em');
  chip.setAttribute('role', 'button');
  chip.tabIndex = 0;
  chip.title = 'Open the office newspaper';
  chip.onclick = openPaper;
  chip.onkeydown = (e) => (e.key === 'Enter' || e.key === ' ') && openPaper();

  // achievements and the secret combo
  office.on('game', (m, n, rec) => {
    award('first-game');
    if (rec) award('record');
  });
  office.on('pick', (a) => {
    if (a === CAT && stats.pet() >= 5) award('cat');
  });
  office.on('tv', (on) => on && award('tv'));
  office.on('event', (type, p) => {
    if (type === 'cheer' && stats.day().done >= 10) award('ten');
    if (type === 'join' && p.agent.source === 'reported') award('plug');
  });
  let typed = '';
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !paper.hidden) paper.hidden = true;
    if ((e.target.closest && e.target.closest('input, textarea')) || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed === 'disco' && features.events && features.events.run('party') !== false)
      award('disco');
  });

  let slow = 0;
  office.onFrame.push((T) => {
    if (tipFor && tip.hidden && performance.now() - tipAt > 700) {
      tip.textContent = tipFor[4];
      tip.hidden = false;
    }
    if (T - slow < 0.33) return;
    slow = T;
    favicon(T);
    if (new Date().getHours() < 5) award('owl');
    if (P.filter((p) => p.st === 'w').length >= 12) award('full');
  });
  return { openPaper, award };
}
