import './sims.css';
import { panel, CLOSE } from './shell/panels.js';
import { INK, text } from './engine/pixel.js';
import { nearNode } from './world/crowd.js';

const LABEL = {
  board: 'WHITEBOARD',
  server: 'SERVER',
  printer: 'PRINTER',
  plant: 'PLANT',
  scope: 'TELESCOPE',
  tank: 'AQUARIUM',
  arcA: 'ARCADE',
  arcB: 'ARCADE',
  sofaL: 'SOFA',
  sofaR: 'SOFA',
  foos: 'FOOSBALL',
  tread: 'TREADMILL',
  bag: 'PUNCH BAG',
  lift: 'WEIGHTS',
  juke: 'JUKEBOX',
  slot: 'SLOTS',
  poker: 'POKER',
  roul: 'ROULETTE',
  crystal: 'CRYSTAL BALL',
  bj: 'BLACKJACK',
  esp: 'COFFEE',
  sipA: 'CAFE TABLE',
  sipB: 'CAFE TABLE',
  sipC: 'CAFE TABLE',
  vend: 'SNACKS',
};
const WORDS = ['NICE!', 'WOW!', 'YAY!', 'TOP!', 'COOL!'];
const SPEED = 24;
const LOST = 90;

export function installSims(office, shell) {
  const { P, SPOT, crowd, cam, g, px, headTop } = office;
  const KEYS = Object.keys(LABEL).filter((k) => SPOT[k]);
  const SEL = new Set(),
    ORD = new Map(),
    MUTED = new Set(),
    SAY = [];
  let on = false,
    TT = 0,
    msg = '',
    msgUntil = 0,
    sig = '',
    chipList = [];

  const app = document.querySelector('#app');
  const bar = document.createElement('div');
  bar.className = 'simsbar panel ui';
  bar.hidden = true;
  bar.innerHTML =
    '<div class="simsnow" role="status"></div>' +
    '<div class="simsrow"><div class="simschips"></div>' +
    '<button class="btn" data-a="all">All</button><button class="btn" data-a="none">None</button>' +
    CLOSE +
    '</div>';
  app.appendChild(bar);
  const nowEl = bar.querySelector('.simsnow'),
    chipsEl = bar.querySelector('.simschips');
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.id = 'simsBtn';
  btn.textContent = 'Sims';
  btn.setAttribute('aria-pressed', 'false');
  document.querySelector('#tools').insertBefore(btn, document.querySelector('#tvBtn'));

  const small = () => {
    const [vw, vh] = cam.size;
    return Math.min(vw / 640, vh / 360) < 2;
  };
  const alive = (p) => P.includes(p) && !p.gone;
  const free = (p) =>
    alive(p) &&
    p.roam &&
    !p.seat &&
    !p.joinSeat &&
    !p.leaving &&
    p.now !== 'sleep' &&
    (ORD.has(p) || (!p.errand && !p.home && p.st === 'i'));
  const say = (text, ms) => {
    msg = text;
    msgUntil = TT + (ms || 3);
  };
  const bubble = (p, word, col) => SAY.push({ p, word, col: col || '#12132a', until: TT + 1.5 });

  function leg(p, k) {
    const s = SPOT[k];
    const o = ORD.get(p) || { queue: null, dwell: 0 };
    const ok = crowd.send(p, s[1], s[2], { speed: SPEED, then: (q) => arrive(q) });
    if (!ok) return false;
    s.busy = true;
    p.mug = false;
    o.dest = s;
    o.err = p.errand;
    o.t0 = TT;
    ORD.set(p, o);
    return true;
  }
  // the walk ends here: the person becomes an ordinary one at the new place and the crowd takes over
  function arrive(p) {
    const o = ORD.get(p);
    if (!o || o.err !== p.errand) return;
    if (p.spot && p.spot !== o.dest) p.spot.busy = false;
    p.spot = o.dest;
    p.node = o.dest[0];
    p.state = 'stay';
    p.stay = 16;
    p.mug = false;
    p.errand = null;
    p.home = null;
    o.err = null;
    o.dest = null;
    office.burst(p.x, headTop(p) - 2);
    bubble(p, WORDS[(Math.random() * WORDS.length) | 0]);
    if (o.queue) o.dwell = TT + 3;
    else ORD.delete(p);
  }
  function order(p, k) {
    const s = SPOT[k],
      o = ORD.get(p);
    if (s.busy) return false;
    if (o) {
      if (o.queue) SPOT[o.queue].busy = false;
      o.queue = k;
      s.busy = true;
      return true;
    }
    return leg(p, k);
  }
  // stop an order: free what it reserved and, if the person is still walking, let the crowd take over where they stand
  function release(p) {
    const o = ORD.get(p);
    if (!o) return;
    ORD.delete(p);
    if (o.queue) SPOT[o.queue].busy = false;
    if (o.dest) o.dest.busy = false;
    if (!o.err || !alive(p)) return;
    if (p.errand === o.err) {
      p.errand = null;
      p.home = null;
      if (p.state === 'stay') {
        if (p.spot) p.spot.busy = false;
        p.spot = null;
        p.node = nearNode(p.x, p.y);
        p.stay = 0;
      }
    }
  }
  function nearestFree(x, y, taken, r) {
    let best = null,
      bd = r;
    KEYS.forEach((k) => {
      const s = SPOT[k];
      if (s.busy || taken.has(k)) return;
      const d = Math.hypot(s[1] - x, s[2] - 10 - y);
      if (d < bd) {
        bd = d;
        best = k;
      }
    });
    return best;
  }
  function select(p) {
    if (SEL.has(p)) SEL.delete(p);
    else SEL.add(p);
    if (small() && SEL.has(p)) {
      cam.touched = true;
      cam.to(p.x, p.y - 12, cam.z, true);
    }
  }
  function send(at) {
    const taken = new Set();
    let sent = 0;
    [...SEL].forEach((p) => {
      if (!free(p)) return;
      const k = nearestFree(at[0], at[1], taken, sent ? 150 : 46);
      if (k && order(p, k)) {
        taken.add(k);
        sent++;
      }
    });
    if (!sent) say('No free spot there. Tap closer to a ring.');
  }

  office.on(
    'pick',
    (a, at) => {
      if (!on) return false;
      if (a && a.kind === 'cat') return true;
      if (a && P.includes(a)) {
        if (free(a)) select(a);
        else bubble(a, a.now === 'sleep' ? 'ZZZ' : 'BUSY', '#c0392b');
        return true;
      }
      if (SEL.size) send(at || office.at);
      return true;
    },
    true
  );

  const barOpened = panel(office, 'sims', bar, () => on && setOn(false));
  function setOn(v) {
    on = v;
    btn.setAttribute('aria-pressed', v);
    bar.hidden = !v;
    if (v) barOpened();
    if (!v) {
      [...ORD.keys()].forEach(release);
      SEL.clear();
      MUTED.forEach((p) => (p.nopip = false));
      MUTED.clear();
      sig = '';
    }
  }
  btn.onclick = () => setOn(!on);
  office.on('tv', (t) => t && setOn(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && on) SEL.clear();
  });
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.a === 'all') chipList.forEach((p) => free(p) && SEL.add(p));
    else if (b.dataset.a === 'none') SEL.clear();
    else if (b.dataset.i != null) {
      const p = chipList[+b.dataset.i];
      if (p && free(p)) select(p);
    }
  });

  function refresh() {
    chipList = P.filter(free);
    const names = chipList.map((p) => p.name + (SEL.has(p) ? '*' : '')).join('|');
    let hint;
    if (msg && TT < msgUntil) hint = msg;
    else if (!chipList.length) hint = 'Nobody is on a break right now.';
    else if (!SEL.size) hint = 'Tap someone with a green gem, or a name below.';
    else {
      const n = [...SEL].map((p) => p.name);
      hint =
        n.slice(0, 2).join(', ') +
        (n.length > 2 ? ' +' + (n.length - 2) : '') +
        ' chosen. Tap a place.';
    }
    const now = names + '#' + hint;
    if (now === sig) return;
    sig = now;
    nowEl.textContent = hint;
    chipsEl.replaceChildren(
      ...chipList.map((p, i) => {
        const b = document.createElement('button');
        b.className = 'btn simschip';
        b.dataset.i = i;
        b.textContent = p.name;
        b.setAttribute('aria-pressed', SEL.has(p));
        return b;
      })
    );
  }

  office.extra.push((T, dt, put) => {
    TT = T;
    for (const s of [...SEL]) if (!free(s)) SEL.delete(s);
    for (const [p, o] of [...ORD]) {
      if (!alive(p) || p.leaving) {
        release(p);
        continue;
      }
      if (o.err && p.errand !== o.err) {
        if (o.dest) o.dest.busy = false;
        if (o.queue) SPOT[o.queue].busy = false;
        ORD.delete(p);
        continue;
      }
      if ((p.agent && p.agent.status === 'working') || (o.err && T - o.t0 > LOST)) release(p);
      else if (!o.err && o.queue && T >= o.dwell) {
        const k = o.queue;
        o.queue = null;
        SPOT[k].busy = false;
        if (!leg(p, k)) ORD.delete(p);
      }
    }
    for (const p of P) {
      const mute = on && free(p);
      if (mute && !p.nopip) {
        p.nopip = true;
        MUTED.add(p);
      } else if (!mute && MUTED.has(p)) {
        p.nopip = false;
        MUTED.delete(p);
      }
    }
    for (const p of MUTED) if (!P.includes(p)) MUTED.delete(p);
    if (!on) return;
    put(49, () =>
      ORD.forEach((o, p) => {
        if (!o.err || p.errand !== o.err) return;
        let x = p.x,
          y = p.y,
          n = 0;
        p.errand.route.forEach((t) => {
          const d = Math.hypot(t[0] - x, t[1] - y),
            k = Math.max(1, Math.round(d / 5));
          for (let i = 1; i <= k; i++, n++)
            if ((n + ((T * 6) | 0)) % 2)
              px(
                Math.round(x + ((t[0] - x) * i) / k),
                Math.round(y + ((t[1] - y) * i) / k),
                2,
                1,
                '#7cff6b'
              );
          x = t[0];
          y = t[1];
        });
        px(x - 5, y, 10, 1, '#7cff6b');
        px(x - 3, y - 2, 6, 1, '#7cff6b');
        px(x - 3, y + 2, 6, 1, '#7cff6b');
        if (o.queue) {
          const q = SPOT[o.queue];
          px(q[1] - 4, q[2], 8, 1, '#ff9e64');
          px(q[1] - 2, q[2] - 2, 4, 1, '#ff9e64');
          px(q[1] - 2, q[2] + 2, 4, 1, '#ff9e64');
        }
      })
    );
    SEL.forEach((p) =>
      put(p.y - 0.5, () => {
        const x = Math.round(p.x),
          y = Math.round(p.y);
        px(x - 7, y, 14, 1, '#fff');
        px(x - 5, y - 2, 10, 1, '#fff');
        px(x - 5, y + 2, 10, 1, '#fff');
        px(x - 8, y - 1, 2, 1, '#fff');
        px(x + 6, y - 1, 2, 1, '#fff');
        px(x - 8, y + 1, 2, 1, '#fff');
        px(x + 6, y + 1, 2, 1, '#fff');
      })
    );
  });

  office.glow.push((T) => {
    for (let i = SAY.length - 1; i >= 0; i--) {
      const s = SAY[i];
      if (T > s.until || !alive(s.p)) {
        SAY.splice(i, 1);
        continue;
      }
      const w = s.word.length * 4 + 3,
        x = Math.round(s.p.x) - (w >> 1),
        y = Math.round(headTop(s.p)) - 22;
      px(x - 1, y, w + 2, 9, INK);
      px(x, y - 1, w, 11, INK);
      px(x, y, w, 9, '#fff');
      px(x + (w >> 1) - 1, y + 9, 2, 2, '#fff');
      text(g, s.word, x + 2, y + 2, s.col);
    }
    if (!on) return;
    if (SEL.size) {
      const at = office.at || [-99, -99];
      let hot = null,
        hd = 14;
      KEYS.forEach((k) => {
        const s = SPOT[k],
          c = s.busy ? '#5d6480' : '#7cff6b',
          x = s[1],
          y = s[2];
        px(x - 4, y + 3, 8, 1, c);
        px(x - 6, y + 2, 2, 1, c);
        px(x + 4, y + 2, 2, 1, c);
        const d = Math.hypot(x - at[0], y - 10 - at[1]);
        if (d < hd) {
          hd = d;
          hot = k;
        }
      });
      if (hot) {
        const s = SPOT[hot],
          str = LABEL[hot] + (s.busy ? ' - TAKEN' : ''),
          w = str.length * 4 + 3,
          x = Math.round(s[1]) - (w >> 1),
          y = s[2] - 44;
        px(x - 1, y - 1, w + 2, 9, INK);
        px(x, y, w, 7, s.busy ? '#aab0c8' : '#7cff6b');
        text(g, str, x + 2, y + 1, INK);
      }
    }
    P.forEach((p) => {
      if (!free(p)) return;
      const sel = SEL.has(p),
        x = Math.round(p.x),
        y = Math.round(headTop(p)) - (sel ? 15 : 12) + (Math.sin(T * 3 + p.x) > 0 ? 0 : 1),
        c = sel ? '#fff' : '#7cff6b',
        d = sel ? '#c5f08f' : '#2f9e44';
      px(x - 1, y - 1, 3, 1, INK);
      px(x - 2, y, 5, 1, INK);
      px(x - 3, y + 1, 7, 5, INK);
      px(x - 2, y + 6, 5, 1, INK);
      px(x - 1, y + 7, 3, 1, INK);
      px(x, y + 8, 1, 1, INK);
      px(x, y, 1, 1, c);
      px(x - 1, y + 1, 3, 1, c);
      px(x - 2, y + 2, 5, 2, c);
      px(x - 2, y + 4, 5, 1, d);
      px(x - 1, y + 5, 3, 1, d);
      px(x, y + 6, 1, 2, d);
      px(x - 1, y + 2, 1, 2, '#fff');
    });
  });
  office.onFrame.push(() => on && refresh());

  return { isOn: () => on, set: setOn };
}
