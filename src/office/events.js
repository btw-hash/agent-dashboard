import './events.css';
import { panel, CLOSE } from './shell/panels.js';
import { INK, LW, LH, text, hexA } from './engine/pixel.js';
import { NODE, WINS, bfs } from './world/plan.js';
import { SK } from './world/cast.js';
import { facing, nearNode, tidy, headTop } from './world/crowd.js';

// Guests and office-wide events: pizza, mail, cleaners, party, fire drill, blackout, holidays.
// One event runs at a time. A request while another runs is ignored; only the blackout caused by a
// lost connection waits for its turn (and is dropped if the connection comes back first).
export function installEvents(office, shell) {
  const { P, SEATS, SPOT, CAT, GOOSE, crowd, g, px, shadow } = office;
  const DOORWAY = [557, 58],
    MAT = [557, 84],
    WIN_X = WINS[1];
  const rnd = (a) => a[(Math.random() * a.length) | 0];
  const lanes = (a, b) => bfs(a, b).map((n) => NODE[n]);
  const pool = (lg, x, y, c, r, a) => {
    const gr = lg.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, hexA(c, a));
    gr.addColorStop(1, hexA(c, 0));
    lg.fillStyle = gr;
    lg.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const usable = (p) =>
    P.includes(p) &&
    !p.home &&
    !p.errand &&
    !p.leaving &&
    !p.gone &&
    !p.hold &&
    !p.joinSeat &&
    p.now !== 'sleep';
  const seatedNow = () => SEATS.filter((s) => s.who && !s.conf && usable(s.who));

  let TT = 0,
    small = false,
    cur = null,
    pendingDark = false,
    vid = 0;
  const LATER = [],
    later = (s, fn) => LATER.push([TT + s, fn]);
  const VIS = [],
    PARCELS = [],
    SHINE = [],
    BITS = [],
    HONK = { until: 0 };
  let SIGN = null,
    GLASS = 0,
    GLASS_T = 0,
    SHARDS = false,
    HOL = '',
    holMode = 'auto',
    PARTY = null,
    DRILL = null,
    DARK = null,
    binErrors = 0;
  const PIE = [null, null, null];
  // the three cafe tables; the last number is the side an eater stands on: 1 right of the table, -1 left
  const TABLES = [
    [446, 298, 'sipA', 1],
    [500, 320, 'sipB', 1],
    [590, 302, 'sipC', -1],
  ];

  // ── the panel ──────────────────────────────────────────────────
  const list = document.createElement('aside');
  list.className = 'evlist panel ui';
  list.hidden = true;
  document.querySelector('#app').appendChild(list);
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.id = 'eventsBtn';
  btn.textContent = 'Events';
  btn.setAttribute('aria-pressed', 'false');
  document.querySelector('#tools').insertBefore(btn, document.querySelector('#tvBtn'));
  const KINDS = [
    [
      'Guests',
      'g',
      [
        ['pizza', 'Pizza', 'a courier, three boxes'],
        ['mail', 'Mail', 'a parcel for a desk'],
        ['clean', 'Cleaners', 'mop and bucket'],
      ],
    ],
    [
      'Events',
      'e',
      [
        ['party', 'Party', 'dancing, about 17 s'],
        ['drill', 'Fire drill', 'out the window, about 25 s'],
        ['dark', 'Blackout', 'lights out for 10 s'],
      ],
    ],
  ];
  const HOLS = [
    ['auto', 'Auto'],
    ['', 'Off'],
    ['ny', 'New Year'],
    ['hw', 'Halloween'],
  ];
  function drawList() {
    list.innerHTML =
      '<h2><span>EVENTS</span><span id="evNow">' +
      (cur ? 'RUNNING' : 'QUIET') +
      '</span>' +
      CLOSE +
      '</h2>' +
      KINDS.map(
        (k) =>
          '<div class="evg"><h3>' +
          k[0] +
          '</h3><div class="el">' +
          k[2]
            .map(
              (e) =>
                '<button class="ev ' +
                k[1] +
                '" data-e="' +
                e[0] +
                '"' +
                (cur ? ' disabled' : '') +
                '><b>' +
                e[1] +
                '</b><span>' +
                e[2] +
                '</span></button>'
            )
            .join('') +
          '</div></div>'
      ).join('') +
      '<div class="evg"><h3>Holiday</h3><div class="hl">' +
      HOLS.map(
        (h) =>
          '<button class="hol" data-h="' +
          h[0] +
          '" aria-pressed="' +
          (holMode === h[0]) +
          '">' +
          h[1] +
          '</button>'
      ).join('') +
      '</div></div>' +
      '<p class="evnote" id="evLabel">' +
      (cur ? cur.label : 'Pick something to run it by hand.') +
      '</p>';
  }
  const listOpened = panel(office, 'events', list, () => setList(false));
  function setList(on) {
    list.hidden = !on;
    btn.setAttribute('aria-pressed', on);
    if (on) {
      drawList();
      listOpened();
    }
  }
  btn.onclick = () => setList(list.hidden);
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.ev'),
      h = e.target.closest('.hol');
    if (b && !b.disabled) {
      if (innerWidth <= 760) setList(false);
      run(b.dataset.e);
    } else if (h) {
      holMode = h.dataset.h;
      setHoliday();
      drawList();
    }
  });
  office.on('tv', (on) => on && setList(false));
  office.on('small', (s) => {
    small = s;
  });
  office.onFrame.push(() => {
    if (cur && cur.follow && small)
      office.cam.to(cur.follow.x, cur.follow.y - 12, office.cam.z, true);
  });

  // ── running one event ──────────────────────────────────────────
  function begin(name, label, follow, max) {
    if (cur) return false;
    cur = {
      name,
      label,
      follow: follow || null,
      t0: TT,
      max: max || 120,
      tick: null,
      cleanup: null,
    };
    if (!list.hidden) drawList();
    return true;
  }
  function finish() {
    if (!cur) return;
    const c = cur;
    if (c.cleanup) c.cleanup();
    cur = null;
    LATER.length = 0;
    if (!list.hidden) drawList();
    if (pendingDark) {
      pendingDark = false;
      dark(true);
    }
  }
  function none() {
    shell.toast('Nobody is free for that right now.', true);
    return false;
  }
  // everything a person may carry out of an event, cleared; sends them home if they are still away
  function release(p) {
    if (!P.includes(p)) return;
    p.hold = false;
    p.force = null;
    p.carry = false;
    p.eat = false;
    if (p.gone) {
      p.gone = false;
      if (p.home) walkIn(p);
    } else if (p.home && !(p.errand && p.errand.home)) crowd.back(p);
  }
  // out of the lift, along the lanes to their own place
  function walkIn(p) {
    const h = p.home,
      w0 = h.way[0] || [h.x, h.y];
    p.gone = false;
    p.x = DOORWAY[0];
    p.y = DOORWAY[1];
    p.errand = {
      route: tidy(
        [MAT].concat(
          bfs('uL', nearNode(w0[0], w0[1])).map((k) => NODE[k]),
          [w0, [h.x, h.y]]
        )
      ),
      home: true,
      speed: 78,
      then(q) {
        q.hold = false;
      },
    };
  }

  // ── guests: people who are not agents, out of the lift and back into it ─
  function visitor(look, prop, steps) {
    const v = crowd.guest(
      Object.assign(
        {
          skin: SK[vid++ % 5],
          hair: '#3b2a1e',
          shirt: '#e03131',
          pants: '#23263a',
          style: 'short',
          acc: 'cap',
          fit: 'tee',
          carry: true,
          x: DOORWAY[0],
          y: DOORWAY[1],
        },
        look
      )
    );
    Object.assign(v, {
      prop,
      wait: 0,
      steps: [{ wait: 0.6 }, MAT].concat(steps, [MAT, DOORWAY, { wait: 0.5 }]),
    });
    VIS.push(v);
    return v;
  }
  const drop = (v) => {
    v.prop = null;
    v.carry = false;
  };
  function walk(v, dt) {
    if (v.wait > 0) {
      v.wait -= dt;
      return;
    }
    let left = 28 * dt,
      moved = false;
    while (left > 0 && v.steps.length) {
      const s = v.steps[0];
      if (!Array.isArray(s)) {
        v.steps.shift();
        if (s.dir != null) v.dir = s.dir;
        if (s.do) s.do(v);
        if (s.wait) {
          v.wait = s.wait;
          v.pose = 'idle';
          return;
        }
        continue;
      }
      const dx = s[0] - v.x,
        dy = s[1] - v.y,
        d = Math.hypot(dx, dy);
      if (d > 0.01) v.dir = facing(dx, dy);
      if (d <= left) {
        v.x = s[0];
        v.y = s[1];
        v.dist += d;
        left -= d;
        v.steps.shift();
      } else {
        v.x += (dx / d) * left;
        v.y += (dy / d) * left;
        v.dist += left;
        left = 0;
      }
      moved = true;
    }
    v.pose = moved ? 'walk' : 'idle';
    if (!v.steps.length) v.gone = true;
  }
  const box = (x, y, w, h, c) => {
    px(x - 1, y - 1, w + 2, h + 2, INK);
    px(x, y, w, h, c);
  };
  const stack = (x, y, n) => {
    for (let i = 0; i < n; i++) {
      px(x - 1, y - i * 2 - 1, 14, 3, INK);
      px(x, y - i * 2, 12, 1, '#e3c9a0');
      px(x + 4, y - i * 2, 4, 1, '#c0392b');
    }
  };
  const crate = (x, y) => {
    box(x, y, 9, 6, '#b98450');
    px(x + 4, y, 1, 6, '#e3c9a0');
    px(x, y + 2, 9, 1, '#e3c9a0');
  };
  const pail = (x, y) => {
    box(x, y, 7, 6, '#ffd23f');
    px(x, y, 7, 2, '#8fd6ff');
    px(x, y + 6, 2, 1, INK);
    px(x + 5, y + 6, 2, 1, INK);
  };
  // what a guest carries rests on the hands of the sprite (waist height): 'back' is drawn before the body, 'front' after it
  const PROP = {
    pizza: {
      back(v) {
        if (v.dir === 1) stack(v.x - 6, v.y - 14, v.n);
      },
      front(v) {
        if (v.dir === 0) stack(v.x - 6, v.y - 14, v.n);
        else if (v.dir === 2) stack(v.x + 1, v.y - 15, v.n);
        else if (v.dir === 3) stack(v.x - 13, v.y - 15, v.n);
      },
    },
    parcel: {
      back(v) {
        if (v.dir === 1) crate(v.x - 4, v.y - 19);
      },
      front(v) {
        if (v.dir === 0) crate(v.x - 4, v.y - 19);
        else if (v.dir === 2) crate(v.x + 2, v.y - 20);
        else if (v.dir === 3) crate(v.x - 11, v.y - 20);
      },
    },
    // a bucket on wheels, pushed along by the mop that stands in it
    mop: {
      back() {},
      front(v) {
        if (v.dir > 1) {
          const k = v.dir === 3 ? -1 : 1,
            X = (i) => Math.round(v.x + k * (3 + i * 0.8));
          for (let i = 0; i <= 11; i++) px(X(i) - 1, v.y - 18 + i, 3, 1, INK);
          for (let i = 0; i <= 11; i++) px(X(i), v.y - 18 + i, 1, 1, '#c9a36a');
          pail(v.x + k * 11 - 3, v.y - 7);
        } else if (v.dir === 0) {
          px(v.x - 1, v.y - 14, 3, 9, INK);
          px(v.x, v.y - 14, 1, 9, '#c9a36a');
          pail(v.x - 3, v.y - 5);
        }
      },
    },
  };

  const GIFTS = [
    'a rubber duck. Again',
    'a mechanical keyboard',
    'stickers',
    'a plant that needs no water',
    'socks with semicolons',
    'a mug that says LGTM',
  ];

  function pizza() {
    const hungryAll = P.filter(usable).sort(() => Math.random() - 0.5),
      hungry = hungryAll
        .filter((p) => !(p.seat && p.st === 'w'))
        .concat(hungryAll.filter((p) => p.seat && p.st === 'w'));
    if (!hungry.length) return none();
    if (
      !begin(
        'pizza',
        'Pizza: a courier puts a box on each cafe table, someone walks over to eat',
        null,
        150
      )
    )
      return false;
    PIE.fill(null);
    const eaters = [];
    let courierGone = false;
    const nextEater = () => {
      while (hungry.length) {
        const p = hungry.pop();
        if (usable(p)) return p;
      }
      return null;
    };
    // a box goes on the table and opens; whoever is called over eats it one slice at a time
    const serve = (i) => ({
      do(v) {
        v.n--;
        if (!v.n) drop(v);
        const pie = (PIE[i] = { n: 6, open: false });
        later(0.5, () => {
          pie.open = true;
        });
        if (i === 0) shell.toast("Pizza's here. One box per table.");
        const p = nextEater();
        if (!p) return;
        const t = TABLES[i];
        p.hold = true;
        const sent = crowd.send(p, t[0] + 12 + t[3] * 28, t[1] + 14, {
          dir: t[3] > 0 ? 3 : 2,
          pose: 'eat',
          speed: 46,
          then() {
            p.eat = true;
            const bite = (k) =>
              later(1.2, () => {
                pie.n = Math.max(0, pie.n - 1);
                if (!P.includes(p) || !p.errand) {
                  if (PIE[i] === pie) PIE[i] = null;
                  return;
                }
                if (k > 1) return bite(k - 1);
                p.eat = false;
                crowd.back(p, () => {
                  if (PIE[i] === pie) PIE[i] = null;
                  p.hold = false;
                });
              });
            bite(6);
          },
        });
        if (sent) eaters.push(p);
        else p.hold = false;
      },
    });
    const at = (i) => [TABLES[i][0] + 12 - (SPOT[TABLES[i][2]].busy ? 13 : 0), TABLES[i][1] - 2];
    const v = visitor(
      { shirt: '#e03131' },
      'pizza',
      [].concat(
        lanes('uL', 'cV'),
        [at(0), { dir: 0, wait: 0.7 }, serve(0), { wait: 0.5 }, NODE.cV],
        lanes('cV', 'cC'),
        [at(1), { dir: 0, wait: 0.7 }, serve(1), { wait: 0.5 }, NODE.cC],
        lanes('cC', 'cE'),
        [at(2), { dir: 0, wait: 0.7 }, serve(2), { wait: 0.5 }, NODE.cE],
        lanes('cE', 'uL')
      )
    );
    v.n = 3;
    v.onGone = () => {
      courierGone = true;
    };
    cur.follow = v;
    cur.tick = () => {
      if (courierGone && eaters.every((p) => !P.includes(p) || (!p.home && !p.errand))) finish();
    };
    cur.cleanup = () => {
      eaters.forEach(release);
      PIE.fill(null);
    };
    return true;
  }
  function mail(want) {
    const s = want && usable(want) ? SEATS.find((q) => q.who === want) : rnd(seatedNow());
    if (!s) return none();
    const p = s.who,
      up = s.seat === 'F',
      sx = p.x + 16,
      sy = up ? 86 : 190;
    if (!begin('mail', 'Mail: a parcel for ' + p.name, null, 90)) return false;
    const v = visitor(
      { shirt: '#3b5bdb', pants: '#2e3350' },
      'parcel',
      lanes('uL', nearNode(sx, sy)).concat(
        [
          [sx, sy],
          { dir: up ? 0 : 1, wait: 0.9 },
          {
            do(v) {
              drop(v);
              PARCELS.push({ x: sx - 5, y: up ? sy + 7 : sy - 9, t: TT });
              if (PARCELS.length > 5) PARCELS.shift();
              if (P.includes(p)) p.once = { pose: 'wave', until: TT + 2.4 };
              shell.toast('Parcel for ' + p.name + ': ' + rnd(GIFTS) + '.');
            },
          },
          { wait: 0.5 },
        ],
        lanes(nearNode(sx, sy), 'uL')
      )
    );
    v.onGone = finish;
    cur.follow = v;
    return true;
  }
  function clean() {
    if (!begin('clean', 'Cleaners: mop the lower hall and leave', null, 90)) return false;
    const v = visitor(
      { shirt: '#39c5cf', pants: '#2e3350', style: 'bun', acc: '', hair: '#8a5a34', fit: '' },
      'mop',
      lanes('uL', 'l4').concat(
        [
          {
            do() {
              SHARDS = false;
              binErrors = 0;
              office.emit('cleaned');
              SIGN = { x: 476, y: 200 };
              shell.toast('Wet floor. The cat has been warned.');
            },
          },
        ],
        lanes('l4', 'l0'),
        [{ dir: 0, wait: 1.2 }],
        lanes('l0', 'l4'),
        [
          {
            do() {
              SIGN = null;
            },
          },
        ],
        lanes('l4', 'uL')
      )
    );
    v.mop = 0;
    v.onGone = finish;
    cur.follow = v;
    cur.cleanup = () => {
      SIGN = null;
    };
    return true;
  }

  // ── events ─────────────────────────────────────────────────────
  function party(want) {
    const s =
      want && usable(want) ? SEATS.find((q) => q.who === want && !q.conf) : rnd(seatedNow());
    if (!s) return none();
    const hero = s.who,
      up = s.seat === 'F';
    if (!begin('party', 'Party: ' + hero.name + ' closed task #100', hero, 70)) return false;
    hero.hold = true;
    const guests = P.filter((p) => p.roam && usable(p) && p !== hero).slice(0, 4);
    guests.forEach((p) => (p.hold = true));
    const others = P.filter((p) => !p.seat && usable(p) && !guests.includes(p) && p !== hero);
    PARTY = { hero, s, up, t0: TT, pop: 0, guests, others, over: false };
    shell.toast(hero.name + ' just closed task #100. The dance floor is open.');
    shell.news(hero.name + ' closed the 100th task. Cake at the desk.');
    guests.forEach((p, i) => {
      const ok = crowd.send(p, hero.x - 27 + i * 18, up ? 86 : 191, {
        dir: up ? 0 : 1,
        pose: 'cheer',
        speed: 64,
        then(q) {
          office.burst(q.x, headTop(q) - 2);
          q.errand.bx = q.x;
          q.errand.face = q.dir;
        },
      });
      if (!ok) p.hold = false;
    });
    later(17, () => {
      PARTY.over = true;
      guests.forEach((p) => P.includes(p) && p.home && crowd.back(p));
    });
    cur.tick = () => {
      if (PARTY.over && guests.every((p) => !P.includes(p) || (!p.home && !p.errand))) finish();
    };
    cur.cleanup = () => {
      guests.concat(hero).forEach(release);
      others.forEach((p) => P.includes(p) && (p.once = null));
      PARTY = null;
    };
    return true;
  }
  // four beats: arms up with a hop, a turn to the right, a wave, a turn to the left
  function dance(T) {
    const beat = T * 2.6;
    PARTY.guests.forEach((p, i) => {
      const e = p.errand;
      if (!P.includes(p) || !e || e.home || e.route.length || e.bx == null) return;
      const b = ((beat + i * 0.5) | 0) % 4;
      e.pose = b === 0 ? 'cheer' : b === 2 ? 'wave' : 'idle';
      p.dir = b === 1 ? 2 : b === 3 ? 3 : e.face;
      p.x = e.bx + [0, 1, 0, -1][b];
    });
    [PARTY.hero].concat(PARTY.others).forEach((p, i) => {
      if (
        !P.includes(p) ||
        p.now === 'sleep' ||
        p.errand ||
        p.leaving ||
        (p.roam && p.state === 'go')
      )
        return;
      const b = ((beat + i * 0.7) | 0) % 4;
      p.once = { pose: b % 2 ? 'wave' : 'cheer', until: T + 0.25 };
    });
  }

  // fire drill: gather under a window, the warden counts and breaks it, everyone climbs out, the lift brings them back
  function drill() {
    const all = P.filter(usable);
    if (!all.length) return none();
    if (
      !begin(
        'drill',
        'Fire drill: gather at the window, out through it, back by the lift',
        { x: 240, y: 110 },
        90
      )
    )
      return false;
    const warden = all.find((p) => p.seat) || all[0],
      rest = all
        .filter((p) => p !== warden)
        .sort((a, b) => Math.abs(a.x - 240) - Math.abs(b.x - 240));
    DRILL = {
      t0: TT,
      n: 0,
      in: 0,
      warden,
      members: [],
      phase: 'gather',
      over: false,
      names: office.names,
    };
    shell.toast('FIRE DRILL. Leave the coffee.', true);
    office.names = 'pips';
    const join = (p, x, y, o) => {
      p.hold = true;
      if (crowd.send(p, x, y, o)) DRILL.members.push(p);
      else p.hold = false;
    };
    join(warden, 290, 78, { dir: 3, speed: 72 });
    rest.forEach((p, i) =>
      join(p, 204 + (i % 8) * 11, 62 + (((i / 8) | 0) % 3) * 9, {
        dir: 1,
        speed: 72,
        then() {
          DRILL.in++;
        },
      })
    );
    DRILL.n = DRILL.members.filter((p) => p !== warden).length;
    cur.cleanup = () => {
      DRILL.members.forEach(release);
      office.names = DRILL.names;
      DRILL = null;
    };
    cur.tick = (T) => {
      const D = DRILL,
        alive = D.members.filter((p) => P.includes(p) && !p.leaving);
      if (D.phase === 'gather' && (D.in >= D.n || T - D.t0 > 15)) {
        D.phase = 'count';
        later(1.2, smash);
      } else if (D.phase === 'leave' && (alive.every((p) => p.gone) || T - D.leaveT > 9)) {
        D.phase = 'empty';
        later(1.3, comeBack);
      } else if (
        D.phase === 'return' &&
        T - D.backT > alive.length * 0.16 + 0.3 &&
        (alive.every((p) => !p.errand && !p.home) || T - D.backT > 40)
      )
        finish();
    };
    return true;
  }
  function breakGlass() {
    GLASS = 1;
    GLASS_T = TT;
    SHARDS = true;
    for (let i = 0; i < 18; i++)
      BITS.push({
        x: WIN_X + 10 + Math.random() * 16,
        y: 24 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 70,
        vy: -20 - Math.random() * 40,
        t: 0,
        c: i % 3 ? '#bfe3f2' : '#fff',
      });
    shell.toast('Emergency exit: the window. Facilities will love this.', true);
    later(0.5, leave);
  }
  function smash() {
    const w = DRILL.warden;
    DRILL.phase = 'smash';
    if (!P.includes(w) || !w.errand) return breakGlass();
    w.errand = {
      route: [[252, 56]],
      speed: 72,
      dir: 1,
      pose: 'board',
      then() {
        later(0.7, breakGlass);
      },
    };
  }
  function leave() {
    DRILL.phase = 'leave';
    DRILL.leaveT = TT;
    DRILL.members.forEach((p, i) =>
      later(i * 0.15, () => {
        if (!P.includes(p) || p.leaving || !p.home) return;
        p.errand = {
          route: [[236 + (i % 3) * 4, 50]],
          speed: 90,
          then(q) {
            q.gone = true;
          },
        };
      })
    );
  }
  function comeBack() {
    DRILL.over = true;
    DRILL.phase = 'return';
    DRILL.backT = TT;
    GLASS = 2;
    shell.toast(
      'All ' + DRILL.members.length + ' out in ' + Math.round(TT - DRILL.t0) + 's. Back by lift.'
    );
    DRILL.members.forEach((p, i) =>
      later(i * 0.16, () => {
        if (P.includes(p) && !p.leaving && p.home) walkIn(p);
      })
    );
  }

  // blackout: by hand it lasts 10 s; after a lost connection it lasts until the connection is back
  function dark(netLoss) {
    if (
      !begin(
        'dark',
        netLoss ? 'Blackout: connection lost' : 'Blackout: backup power in 10 s',
        null,
        netLoss ? 3600 : 40
      )
    )
      return false;
    DARK = { t0: TT, until: netLoss ? null : TT + 10, net: !!netLoss };
    shell.toast(
      netLoss ? 'Connection lost. Running on backup power.' : 'Power cut. Backup power in 10s.',
      true
    );
    P.forEach((p, i) => {
      if (p.seat && p.now === 'type') p.once = { pose: i % 3 ? 'idle' : 'palm', until: TT + 6 };
    });
    cur.tick = (T) => {
      if (DARK.until != null && T >= DARK.until) {
        shell.toast("Power's back. Unsaved work: all of it.");
        finish();
      }
    };
    cur.cleanup = () => {
      DARK = null;
    };
    return true;
  }
  const lightsOut = (T) => {
    if (!DARK) return false;
    const a = T - DARK.t0;
    if (a < 1.1 || (DARK.until != null && T > DARK.until - 1.3))
      return Math.sin(a * 37) + Math.sin(a * 13) > 0;
    return true;
  };

  const RUN = { pizza, mail, clean, party, drill, dark };
  function run(name, opt) {
    if (!RUN[name]) return false;
    return RUN[name](opt);
  }

  // ── holidays ───────────────────────────────────────────────────
  function holidayByDate(d) {
    const m = d.getMonth(),
      day = d.getDate();
    if ((m === 11 && day >= 20) || (m === 0 && day <= 7)) return 'ny';
    if (m === 9 && day >= 25) return 'hw';
    return '';
  }
  function setHoliday() {
    HOL = holMode === 'auto' ? holidayByDate(new Date()) : holMode;
  }
  setHoliday();
  const HAT = (x, top) => {
    px(x - 6, top - 1, 12, 3, INK);
    px(x - 5, top - 5, 10, 4, INK);
    px(x + 1, top - 8, 6, 4, INK);
    px(x - 4, top - 4, 8, 3, '#e03131');
    px(x + 2, top - 7, 3, 3, '#e03131');
    px(x - 5, top, 10, 1, '#fff');
    px(x + 5, top - 7, 2, 2, '#fff');
  };
  const pumpkin = (x, y, lit) => {
    box(x, y, 9, 7, '#ff8a3d');
    px(x + 1, y, 1, 7, '#e0661f');
    px(x + 7, y, 1, 7, '#e0661f');
    px(x + 4, y - 2, 2, 2, '#3f9b5b');
    const c = lit ? '#ffe066' : INK;
    px(x + 2, y + 2, 2, 2, c);
    px(x + 5, y + 2, 2, 2, c);
    px(x + 2, y + 5, 5, 1, c);
  };
  const PUMPKINS = [
    [524, 60],
    [232, 196],
    [96, 196],
    [468, 76],
    [38, 150],
  ];

  // ── drawing and ticking ────────────────────────────────────────
  let liftO = 0,
    liftOwned = false;
  office.extra.push((T, dt, put, FX) => {
    TT = T;
    for (let i = LATER.length - 1; i >= 0; i--) if (T >= LATER[i][0]) LATER.splice(i, 1)[0][1]();
    if (cur) {
      if (cur.tick) cur.tick(T, dt);
      if (cur && T - cur.t0 > cur.max) finish();
    }
    if (GLASS && T - GLASS_T > 1800 && !DRILL) {
      GLASS = 0;
      SHARDS = false;
    }

    // the lift opens for whoever stands in its doorway
    const inDoor =
      VIS.some((v) => v.y < 78) ||
      P.some((p) => p.errand && !p.gone && p.y < 78 && Math.abs(p.x - 557) < 22);
    if (inDoor || liftO >= 0.03) {
      liftO += ((inDoor ? 1 : 0) - liftO) * Math.min(1, dt * 6);
      office.lift = liftO < 0.03 ? 0 : liftO;
      liftOwned = true;
    } else if (liftOwned) {
      office.lift = null;
      liftOwned = false;
    }

    for (let i = VIS.length - 1; i >= 0; i--) {
      const v = VIS[i];
      walk(v, dt);
      if (v.mop != null && v.pose === 'walk' && Math.abs(v.y - 188) < 1 && v.dist - v.mop > 5) {
        v.mop = v.dist;
        SHINE.push({ x: v.x, y: v.y + 2 + Math.random() * 7, t: T });
      }
      if (Math.hypot(v.x - GOOSE.x, v.y - GOOSE.y) < 44) HONK.until = T + 1;
      if (v.gone) {
        VIS.splice(i, 1);
        crowd.dismiss(v);
        if (v.onGone) v.onGone();
        continue;
      }
      const pr = v.prop && PROP[v.prop];
      if (pr) {
        put(v.y - 0.01, () => pr.back(v, T));
        put(v.y + 0.01, () => pr.front(v, T));
      }
    }

    if (GLASS)
      put(0, () => {
        const X = WIN_X;
        px(X + 7, 12, 24, 18, '#1c2036');
        px(X + 4, 11, 7, 5, '#bfe3f2');
        px(X + 27, 11, 7, 4, '#bfe3f2');
        px(X + 4, 26, 6, 5, '#bfe3f2');
        px(X + 26, 25, 8, 6, '#bfe3f2');
        px(X + 11, 13, 3, 3, '#1c2036');
        px(X + 24, 27, 3, 2, '#1c2036');
        if (GLASS === 2) {
          box(X + 2, 14, 34, 3, '#8a5a34');
          box(X + 2, 23, 34, 3, '#6e4526');
          [16, 25].forEach((y) => {
            px(X + 4, y - 1, 1, 1, '#c9ccd8');
            px(X + 33, y - 1, 1, 1, '#c9ccd8');
          });
        }
        if (SHARDS)
          for (let i = 0; i < 8; i++)
            px(X + 4 + i * 4, 48 + (i % 3), 2, 1, i % 2 ? '#bfe3f2' : '#fff');
      });
    if (BITS.length)
      FX.push(() => {
        for (let i = BITS.length - 1; i >= 0; i--) {
          const c = BITS[i];
          c.t += dt;
          if (c.t > 1.4) {
            BITS.splice(i, 1);
            continue;
          }
          c.vy += 110 * dt;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          px(Math.round(c.x), Math.round(c.y), 2, 1, c.c);
        }
      });
    // things left on the floor
    put(48, () => {
      for (let i = SHINE.length - 1; i >= 0; i--) {
        const s = SHINE[i],
          a = (T - s.t) / 10;
        if (a >= 1) {
          SHINE.splice(i, 1);
          continue;
        }
        g.globalAlpha = (1 - a) * 0.55;
        px(Math.round(s.x) - 5, Math.round(s.y), 9, 1, '#fff');
        px(Math.round(s.x) - 2, Math.round(s.y) + 2, 6, 1, '#cfe8ff');
      }
      g.globalAlpha = 1;
    });
    if (SIGN)
      put(SIGN.y, () => {
        const x = SIGN.x,
          y = SIGN.y;
        px(x - 1, y - 13, 9, 14, INK);
        px(x, y - 12, 7, 11, '#ffd23f');
        px(x + 3, y - 10, 1, 5, INK);
        px(x + 3, y - 4, 1, 1, INK);
        px(x, y - 1, 2, 2, '#ffd23f');
        px(x + 5, y - 1, 2, 2, '#ffd23f');
      });
    for (let i = PARCELS.length - 1; i >= 0; i--) if (T - PARCELS[i].t > 600) PARCELS.splice(i, 1);
    PARCELS.forEach((b) => put(b.y + 8, () => crate(b.x, b.y)));
    PIE.forEach((b, i) => {
      if (!b) return;
      const t = TABLES[i];
      put(t[1] + 18.5, () => {
        const x = t[0] + 3,
          y = t[1] - 1;
        if (!b.open) {
          box(x + 1, y + 2, 16, 8, '#e3c9a0');
          px(x + 6, y + 5, 6, 2, '#c0392b');
          return;
        }
        box(x, y - 4, 18, 3, '#f2e6cf');
        px(x + 8, y - 3, 2, 1, '#c0392b');
        box(x, y, 18, 11, '#e3c9a0');
        px(x, y, 18, 1, '#cdb287');
        // round, seen at the angle of the table top; slice k is the k-th sixth of the circle
        for (let yy = 0; yy < 9; yy++)
          for (let xx = 0; xx < 16; xx++) {
            const nx = (xx - 7.5) / 8,
              ny = (yy - 4) / 4.5,
              r = nx * nx + ny * ny;
            if (r > 1) continue;
            const a = ((Math.atan2(ny, nx) / 6.2832 + 0.75) % 1) * 6,
              k = a | 0;
            if (k >= b.n) {
              if ((xx * 7 + yy * 3) % 11 === 0) px(x + 1 + xx, y + 1 + yy, 1, 1, '#c98a3d');
              continue;
            }
            px(
              x + 1 + xx,
              y + 1 + yy,
              1,
              1,
              r > 0.7
                ? '#c98a3d'
                : a - k < 0.14
                  ? '#e0a020'
                  : (xx * 5 + yy * 7) % 9 === 0 && r < 0.55
                    ? '#c0392b'
                    : '#ffd23f'
            );
          }
      });
    });
    // a slice in the hand of whoever eats: point to the mouth, crust out; it follows the arm of the 'eat' pose
    FX.push(() =>
      P.forEach((p) => {
        if (!p.eat || !p.errand || p.errand.route.length || p.gone) return;
        const up = ((T * 3) | 0) % 8 < 3,
          k = p.dir === 3 ? -1 : 1,
          x = Math.round(p.x),
          y = Math.round(p.y) - (up ? 22 : 17);
        const col = (dx, dy, h, c) => px(x + k * dx - (k < 0 ? 1 : 0), y + dy, 1, h, c),
          o = up ? 4 : 5;
        col(o, 1, 3, INK);
        col(o + 1, 0, 5, INK);
        col(o + 2, 0, 5, INK);
        col(o + 3, -1, 7, INK);
        col(o + 4, -1, 7, INK);
        col(o, 2, 1, '#ffd23f');
        col(o + 1, 1, 3, '#ffd23f');
        col(o + 2, 1, 3, '#ffd23f');
        col(o + 3, 0, 5, '#c98a3d');
        col(o + 2, 2, 1, '#c0392b');
      })
    );
    if (T < HONK.until)
      FX.push(() => {
        const x = Math.round(GOOSE.x) - 10,
          y = Math.round(GOOSE.y) - 30;
        px(x - 1, y, 23, 9, INK);
        px(x, y - 1, 21, 11, INK);
        px(x, y, 21, 9, '#fff');
        px(x + 8, y + 9, 2, 2, '#fff');
        text(g, 'HONK!', x + 1, y + 2, '#c0392b');
      });

    if (PARTY) {
      const h = PARTY.hero,
        s = PARTY.s,
        a = T - PARTY.t0;
      if (!PARTY.over) dance(T);
      if (!PARTY.over && a - PARTY.pop > 1.4) {
        PARTY.pop = a;
        office.burst(h.x - 30 + Math.random() * 60, (PARTY.up ? 70 : 150) + Math.random() * 20);
      }
      put(PARTY.up ? 119.5 : 154.5, () => {
        const x = s.dx + 3,
          y = PARTY.up ? 101 : 136;
        box(x, y, 9, 5, '#f7c9d8');
        px(x, y + 2, 9, 1, '#c0392b');
        px(x + 4, y - 3, 1, 3, '#fff');
        px(x + 4, y - 4, 1, 1, ((T * 8) | 0) % 2 ? '#ffd23f' : '#ff8a3d');
      });
      FX.push(() => {
        for (let i = 0; i < 3; i++) {
          const x = Math.round(h.x - 12 + i * 11),
            y = Math.round(headTop(h) - 20 + Math.sin(T * 2 + i * 2) * 2 - (i === 1 ? 4 : 0)),
            c = ['#f7768e', '#7aa2f7', '#ffd23f'][i];
          px(x + 2, y + 8, 1, 10, '#c8d3f5');
          px(x - 1, y + 1, 7, 6, INK);
          px(x, y, 5, 8, INK);
          px(x, y + 1, 5, 6, c);
          px(x + 1, y, 3, 8, c);
          px(x + 1, y + 2, 1, 2, '#fff');
        }
        // the ball hangs over the middle of the hall, the jukebox plays
        px(319, 46, 1, 9, '#8b90a8');
        px(315, 54, 9, 9, INK);
        for (let i = 0; i < 9; i++)
          px(
            316 + (i % 3) * 2 + (i % 3),
            55 + ((i / 3) | 0) * 2 + ((i / 3) | 0),
            2,
            2,
            (((T * 5) | 0) + i) % 3 ? '#aab0c8' : '#fff'
          );
        for (let i = 0; i < 3; i++) {
          const q = (T * 0.5 + i / 3) % 1,
            x = Math.round(288 + i * 6 + Math.sin(T * 3 + i) * 2),
            y = Math.round(222 - q * 22);
          g.globalAlpha = 1 - q;
          px(x, y, 1, 5, '#ffd23f');
          px(x - 2, y + 4, 3, 2, '#ffd23f');
          px(x + 1, y, 2, 1, '#ffd23f');
          g.globalAlpha = 1;
        }
      });
    }
    if (DRILL)
      FX.push(() => {
        const w = DRILL.warden;
        if (
          !P.includes(w) ||
          !w.errand ||
          w.errand.route.length ||
          (DRILL.phase !== 'gather' && DRILL.phase !== 'count')
        )
          return;
        const x = Math.round(w.x) - 18,
          y = Math.round(headTop(w)) - 13,
          s = String(DRILL.in).padStart(2, '0') + '-' + String(DRILL.n).padStart(2, '0');
        px(x - 1, y, 25, 9, INK);
        px(x, y - 1, 23, 11, INK);
        px(x, y, 23, 9, '#fff');
        px(x + 15, y + 9, 2, 2, '#fff');
        text(g, s, x + 2, y + 2, INK);
      });

    if (HOL === 'ny') {
      put(0, () =>
        WINS.forEach((X, w) => {
          for (let i = 0; i < 7; i++) {
            const q = (T * 0.22 + i * 0.37 + w * 0.21) % 1;
            px(
              X + 5 + ((i * 11 + w * 5) % 28) + Math.round(Math.sin(T + i) * 1),
              12 + ((q * 18) | 0),
              1,
              1,
              '#fff'
            );
          }
        })
      );
      put(78, () => {
        const X = 133,
          Y = 40,
          TIER = [
            [6, 4, 10, 9],
            [3, 11, 16, 10],
            [0, 19, 22, 12],
          ];
        shadow(X + 11, 78, 9);
        px(X + 8, Y + 30, 6, 7, INK);
        px(X + 9, Y + 31, 4, 5, '#6e4526');
        TIER.forEach((t) => px(X + t[0] - 1, Y + t[1] - 1, t[2] + 2, t[3] + 2, INK));
        TIER.forEach((t) => {
          px(X + t[0], Y + t[1], t[2], t[3], '#2f7a47');
          px(X + t[0], Y + t[1], t[2], 2, '#3f9b5b');
        });
        px(X + 8, Y - 2, 6, 6, INK);
        px(X + 9, Y - 1, 4, 4, '#ffd23f');
        [
          [8, 8],
          [13, 14],
          [5, 16],
          [16, 23],
          [3, 26],
          [10, 27],
        ].forEach((o, i) =>
          px(
            X + o[0],
            Y + o[1],
            2,
            2,
            (((T * 2) | 0) + i) % 3 ? ['#e03131', '#39d3ff', '#ffd23f'][i % 3] : '#fff'
          )
        );
      });
      FX.push(() => {
        P.forEach((p) => {
          if (p.now !== 'sleep' && !p.gone) HAT(Math.round(p.x), Math.round(headTop(p)));
        });
        crowd.guests.forEach((v) => !v.gone && HAT(Math.round(v.x), Math.round(headTop(v))));
      });
    }
    if (HOL === 'hw') {
      PUMPKINS.forEach((o) => put(o[1] + 7, () => pumpkin(o[0], o[1], false)));
      FX.push(() => {
        const x = Math.round(CAT.x) + (CAT.flip ? -8 : 3),
          y = Math.round(CAT.y) - (CAT.sit ? 13 : 12);
        px(x - 2, y - 2, 9, 3, INK);
        px(x, y - 7, 5, 6, INK);
        px(x - 1, y - 1, 7, 1, '#5c4a8a');
        px(x + 1, y - 6, 3, 5, '#5c4a8a');
        px(x + 1, y - 3, 3, 1, '#e0af68');
        for (let i = 0; i < 3; i++) {
          const bx = Math.round(120 + i * 190 + Math.sin(T * 0.7 + i * 2) * 40),
            by = Math.round(16 + Math.sin(T * 1.9 + i) * 6),
            f = ((T * 7 + i) | 0) % 2;
          px(bx, by, 3, 2, INK);
          px(bx - 3, by - (f ? 2 : 0), 3, 2, INK);
          px(bx + 3, by - (f ? 2 : 0), 3, 2, INK);
        }
      });
    }
  });

  office.onLight.push((lg, T, night) => {
    if (PARTY && !PARTY.over) {
      lg.globalCompositeOperation = 'multiply';
      lg.fillStyle = 'rgb(120,112,170)';
      lg.fillRect(0, 0, LW, LH);
      lg.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++)
        pool(
          lg,
          320 + Math.cos(T * 0.9 + i * 1.05) * 250,
          128 + Math.sin(T * 1.4 + i * 2.1) * 58,
          ['#ff4fd8', '#39d3ff', '#ffd23f', '#7cff6b', '#bb9af7', '#ff8a3d'][i],
          54,
          0.75
        );
    }
    if (DRILL && !DRILL.over) {
      const s = 0.5 + 0.5 * Math.sin(T * 9);
      lg.globalCompositeOperation = 'multiply';
      lg.fillStyle = 'rgb(255,' + ((130 + 110 * s) | 0) + ',' + ((130 + 110 * s) | 0) + ')';
      lg.fillRect(0, 0, LW, LH);
    }
    if (lightsOut(T)) {
      lg.globalCompositeOperation = 'source-over';
      lg.fillStyle = 'rgb(12,14,36)';
      lg.fillRect(0, 0, LW, LH);
      lg.globalCompositeOperation = 'lighter';
      const pulse = 0.55 + 0.45 * Math.sin(T * 5);
      pool(lg, 10, 54, '#ff3030', 90, 0.6 * pulse);
      pool(lg, 630, 54, '#ff3030', 90, 0.6 * pulse);
      pool(lg, 557, 34, '#3cff7a', 46, 0.7);
      P.forEach((p, i) => {
        if (i % 3 === 0 && p.now !== 'sleep' && !p.gone)
          pool(lg, p.x, p.y - 16, '#dfe9ff', 30, 0.85);
      });
    }
    if (HOL === 'hw') {
      lg.globalCompositeOperation = 'multiply';
      lg.fillStyle = 'rgb(255,222,196)';
      lg.fillRect(0, 0, LW, LH);
      if (night > 0.2) {
        lg.globalCompositeOperation = 'lighter';
        PUMPKINS.forEach((o) => pool(lg, o[0] + 4, o[1] + 3, '#ff9a3d', 26, 0.7 * night));
      }
    }
    if (HOL === 'ny' && night > 0.2) {
      lg.globalCompositeOperation = 'lighter';
      pool(lg, 144, 58, '#ffe9b8', 40, 0.55 * night);
    }
    lg.globalCompositeOperation = 'source-over';
  });

  office.glow.push((T) => {
    if (DRILL && !DRILL.over) {
      const on = ((T * 6) | 0) % 2;
      px(593, 12, 9, 9, INK);
      px(594, 13, 7, 7, on ? '#ff4b4b' : '#8f2a20');
      px(597, 20, 1, 2, '#ffd23f');
      if (on) {
        px(590, 15, 2, 1, '#ff4b4b');
        px(603, 15, 2, 1, '#ff4b4b');
        px(597, 9, 1, 2, '#ff4b4b');
      }
    }
    if (lightsOut(T)) {
      text(g, 'EXIT', 550, 0, '#3cff7a');
      const x = Math.round(CAT.x) + (CAT.flip ? -7 : 4),
        y = Math.round(CAT.y) - 9;
      px(x, y, 1, 1, '#7cff6b');
      px(x + 2, y, 1, 1, '#7cff6b');
    }
    if (HOL === 'ny')
      for (let x = 5, i = 0; x < 636; x += 9, i++)
        px(
          x,
          48 + Math.round(Math.sin(i * 0.9) * 1.5),
          2,
          2,
          (((T * 2.5) | 0) + i) % 4 === 0
            ? '#fff'
            : ['#ff4b4b', '#ffd23f', '#7cff6b', '#39d3ff'][i % 4]
        );
    if (HOL === 'hw') {
      PUMPKINS.forEach((o) => {
        if (Math.sin(T * 6 + o[0]) > -0.6) {
          px(o[0] + 2, o[1] + 2, 2, 2, '#ffe066');
          px(o[0] + 5, o[1] + 2, 2, 2, '#ffe066');
          px(o[0] + 2, o[1] + 5, 5, 1, '#ffe066');
        }
      });
      const gx = Math.round((T * 13) % 740) - 50,
        gy = Math.round(138 + Math.sin(T * 1.3) * 16);
      g.globalAlpha = 0.5 + 0.15 * Math.sin(T * 3);
      px(gx + 1, gy, 10, 12, '#eef3ff');
      px(gx, gy + 3, 12, 9, '#eef3ff');
      for (let i = 0; i < 3; i++) px(gx + i * 4 + (((T * 3) | 0) % 2), gy + 12, 3, 2, '#eef3ff');
      g.globalAlpha = 0.9;
      px(gx + 3, gy + 4, 2, 2, INK);
      px(gx + 7, gy + 4, 2, 2, INK);
      g.globalAlpha = 1;
    }
  });

  // ── triggers ───────────────────────────────────────────────────
  // fire drill: three tool errors within a minute
  // and not again for a quarter of an hour: a bad streak of errors is not a reason to keep
  // evacuating the office
  const palms = [];
  let lastDrill = -Infinity;
  // party: every hundredth finished task in this browser session
  let cheers = 0;
  // mail: a cheer from someone who had not finished anything for ten minutes
  const lastDone = new WeakMap();
  let lastMail = 0;
  office.on('event', (type, p) => {
    const now = performance.now();
    if (type === 'palm') {
      binErrors++;
      palms.push(now);
      while (palms.length && now - palms[0] > 60000) palms.shift();
      if (palms.length >= 3) {
        palms.length = 0;
        if (!cur && now - lastDrill > 900000) {
          lastDrill = now;
          drill();
        }
      }
    } else if (type === 'cheer') {
      cheers++;
      const prev = lastDone.get(p);
      lastDone.set(p, now);
      if (cheers % 100 === 0) {
        if (!cur) party(p);
      } else if (prev && now - prev > 600000 && now - lastMail > 600000 && !cur) {
        lastMail = now;
        mail(p);
      }
    }
  });
  // blackout: the connection to the server is lost, and the light returns with it
  office.on('net', (what) => {
    if (what === 'down') {
      if (cur) pendingDark = true;
      else dark(true);
    } else if (what === 'up') {
      pendingDark = false;
      if (cur && cur.name === 'dark' && DARK && DARK.net && DARK.until == null)
        DARK.until = Math.max(TT + 1.3, DARK.t0 + 5);
    } else if (what === 'sim') demoTimer();
  });
  // the demo: a random event every 4 to 7 minutes
  function demoTimer() {
    setTimeout(
      () => {
        if (!cur) run(rnd(Object.keys(RUN)));
        demoTimer();
      },
      (4 + Math.random() * 3) * 60000
    );
  }
  // clock signals: checked once a minute, each fires at most once a day
  const fired = {};
  let workStreak = 0;
  function minute() {
    const d = new Date(),
      day = d.toDateString(),
      h = d.getHours(),
      m = d.getMinutes();
    setHoliday();
    const once = (key, fn) => {
      if (fired[key] === day || cur) return;
      if (fn() !== false) fired[key] = day;
    };
    if (d.getDay() === 5 && h === 13 && m < 10) once('pizza-fri', () => pizza());
    if (h === 19 && m < 10) once('clean-eve', () => clean());
    // five people at their desks for two hours without a break
    const working = P.filter((p) => p.seat && p.st === 'w').length;
    workStreak = working >= 5 ? workStreak + 1 : 0;
    if (workStreak >= 120) {
      workStreak = 0;
      if (!cur) pizza();
    }
    // the bin fills with errors
    if (binErrors >= 8) once('clean-bin', () => clean());
    if (!cur && fired['clean-bin'] && binErrors < 8) delete fired['clean-bin'];
  }
  setInterval(minute, 60000);

  return {
    run,
    holiday(mode) {
      holMode = mode;
      setHoliday();
      if (!list.hidden) drawList();
    },
    busy: () => (cur ? cur.name : null),
    phase: () => (DRILL ? DRILL.phase : null),
    list: setList,
  };
}
