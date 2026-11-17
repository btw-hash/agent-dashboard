import { LW, LH, INK, mk, text, hexA } from './engine/pixel.js';
import { createCamera } from './engine/camera.js';
import { sprite, sleeper, frameOf, build } from './art/people.js';
import { chairBack, chairTop, F } from './art/furniture.js';
import { catSprite, gooseSprite } from './art/pets.js';
import { WALL, ROOMS, GAMES, DOORS, WINS, LIGHTS, SPOT, sky, paintBg } from './world/plan.js';
import { furnish, deskProps } from './world/furnish.js';
import { createCrowd, SEATS, sitting, spriteY, headTop, pipY } from './world/crowd.js';

const ACT = {
  type: 'typing',
  think: 'thinking it over',
  board: 'at the whiteboard',
  sip: 'coffee break',
  walk: 'on the move',
  talk: 'chatting',
  cheer: 'task done!',
  palm: 'hit a tool error',
  lift: 'lifting',
  sleep: 'asleep',
  idle: 'taking a breather',
  wave: 'waving',
  eat: 'eating',
};
const realHour = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};

export function createOffice({ stage, cv, tagsEl }) {
  const ctx = cv.getContext('2d'),
    base = mk(LW, LH),
    g = base.getContext('2d'),
    lm = mk(LW, LH),
    lg = lm.getContext('2d'),
    bgc = mk(LW, LH);
  const listeners = {};
  const emit = (type, ...a) => {
    for (const fn of listeners[type] || []) if (fn(...a) === true) return true;
    return false;
  };
  const HEARTS = [],
    BITS = [];
  function burst(x, y) {
    for (let i = 0; i < 18; i++)
      BITS.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 46,
        vy: -30 - Math.random() * 40,
        t: 0,
        c: ['#f7768e', '#7aa2f7', '#ffd23f', '#9ece6a', '#bb9af7', '#fff'][i % 6],
      });
  }
  const crowd = createCrowd({ emit: (type, p) => emit('event', type, p), burst });
  const P = crowd.P;
  const cam = createCamera(stage, cv, { onSmall: (small) => emit('small', small) });

  const CAT = {
    kind: 'cat',
    name: 'The Cat',
    role: 'office manager',
    st: 'i',
    quote: 'mrrp.',
    mood: 'in charge',
    energy: 99,
    coffees: 0,
    x: 596,
    y: 198,
    dist: 0,
    i: 0,
    wait: 4,
    flip: false,
    sit: true,
    path: [
      [596, 198, 5],
      [490, 188],
      [370, 188],
      [240, 188, 2],
      [112, 188],
      [112, 84],
      [240, 84, 2.5],
      [490, 84],
      [490, 188],
      [596, 198],
    ],
  };
  const GOOSE = {
    x: 612,
    y: 188,
    dist: 0,
    i: 0,
    wait: 0,
    flip: false,
    path: [
      [612, 188, 2],
      [520, 188],
      [520, 286, 2.5],
      [548, 300],
      [520, 286],
      [520, 188],
      [370, 188, 1.5],
      [520, 188],
      [612, 188],
    ],
  };

  let hour = realHour(),
    auto = true,
    night = 0,
    liftHold = 0,
    spotTag = null,
    drag = null,
    started = false;

  const Office = {
    P,
    SEATS,
    ROOMS,
    GAMES,
    DOORS,
    CAT,
    GOOSE,
    SPOT,
    base,
    g,
    cam,
    crowd,
    names: 'working',
    showGames: false,
    showDoors: false,
    picked: null,
    daysOk: 0,
    hov: null,
    paused: false,
    // a feature can add to the scene: extra(T, dt, put, FX) queues depth-sorted and on-top
    // drawing, onLight(lg, T, night) edits the light map, glow(T, dt) draws after the light
    extra: [],
    glow: [],
    onLight: [],
    onFrame: [],
    // 0..1 holds the lift doors that far open; null leaves them on their own timer
    lift: null,
    on(type, fn, first) {
      const l = (listeners[type] = listeners[type] || []);
      if (first) l.unshift(fn);
      else l.push(fn);
      return () => l.splice(l.indexOf(fn), 1);
    },
    emit,
    setHour(h) {
      auto = false;
      hour = h;
    },
    setAuto() {
      auto = true;
      hour = realHour();
    },
    hour: () => hour,
    night: () => night,
    clock: () =>
      String(Math.floor(hour) % 24).padStart(2, '0') +
      ':' +
      String(Math.floor((hour % 1) * 60)).padStart(2, '0'),
    phase: () =>
      hour < 5.5
        ? 'night'
        : hour < 8.5
          ? 'dawn'
          : hour < 17
            ? 'day'
            : hour < 20.5
              ? 'dusk'
              : 'night',
    act: (p) =>
      (p.kind === 'cat' ? (CAT.sit ? 'supervising' : 'on patrol') : ACT[p.now]) || 'on a break',
    headOf: (p) => [p.x, pipY(p)],
    headTop,
    burst,
    hearts(x, y) {
      for (let i = 0; i < 4; i++) HEARTS.push({ x: x - 8 + i * 5, y, t: -i * 0.12 });
    },
    px,
    blit,
    shadow,
    start,
  };

  function px(x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  }
  function shadow(x, y, rx) {
    g.fillStyle = 'rgba(18,19,42,.3)';
    g.fillRect(x - rx, y - 1, rx * 2, 2);
    g.fillRect(x - rx + 1, y - 2, rx * 2 - 2, 4);
  }
  function blit(s, x, y) {
    g.drawImage(s, Math.round(x), Math.round(y));
  }

  const ITEMS = [],
    WALLS = [];
  furnish({
    g,
    px,
    put0: (s, x, y, b, sh, fx) => ITEMS.push({ s, x, y, b, sh, fx }),
    wall: (s, x, y, fx) => WALLS.push({ s, x, y, fx }),
    Office,
  });

  function step(o, dt, speed) {
    if (o.wait > 0) {
      o.wait -= dt;
      return false;
    }
    for (let n = 0; n < 2; n++) {
      const p = o.path[(o.i + 1) % o.path.length],
        dx = p[0] - o.x,
        dy = p[1] - o.y,
        d = Math.hypot(dx, dy);
      if (d < 0.6) {
        o.i = (o.i + 1) % o.path.length;
        o.wait = p[2] || 0;
        if (o.wait > 0) return false;
        continue;
      }
      const s = Math.min(d, speed * dt);
      o.x += (dx / d) * s;
      o.y += (dy / d) * s;
      o.dist += s;
      o.flip = dx < 0;
      return true;
    }
    return true;
  }

  function mugs(x, y, n) {
    for (let i = 0; i < n; i++) {
      const X = x + (i % 3) * 5,
        Y = y + ((i / 3) | 0) * 4;
      px(X - 1, Y - 1, 5, 5, INK);
      px(X, Y, 3, 3, ['#f7768e', '#7aa2f7', '#e0af68', '#9ece6a', '#fff'][i % 5]);
    }
  }
  function notes(x, y, n) {
    for (let i = 0; i < n; i++) {
      px(x + i * 5 - 1, y - 1, 5, 5, INK);
      px(x + i * 5, y, 3, 3, ['#ffe066', '#9ee6ff', '#b6f09c', '#ff9ecb'][i % 4]);
    }
  }
  function poseOf(p, T) {
    let pose = p.pose,
      dir = p.dir || 0,
      z = 0;
    if (p.roam) {
      if (p.state === 'go' || !p.spot) pose = p.state === 'go' ? 'walk' : 'idle';
      else {
        pose = p.spot[3];
        dir = p.spot[4];
        z = p.spot[7] || 0;
        if (p.spot === SPOT.esp && p.stay < 1.6) {
          pose = 'sip';
          dir = 0;
        }
        if (pose === 'talk') {
          const other = p.spot === SPOT.talkA ? SPOT.talkB : SPOT.talkA,
            mate = P.some((q) => q !== p && q.spot === other && q.state === 'stay' && !q.errand),
            turn = ((T / 2.6) | 0) % 2 === (p.spot === SPOT.talkA ? 0 : 1);
          if (!mate || !turn) pose = 'idle';
        }
      }
    }
    if (p.errand) pose = p.errand.route.length ? 'walk' : p.errand.pose || 'idle';
    if (p.once) {
      if (T < p.once.until) pose = p.once.pose;
      else p.once = null;
    }
    if (p.force) {
      pose = p.force.pose;
      if (p.force.dir != null) dir = p.force.dir;
    }
    return [pose, dir, z];
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    const T = ts / 1000,
      dt = Office.paused ? 0 : Math.min(0.05, T - (frame.t || T));
    frame.t = T;
    if (auto) hour = realHour();
    const k = sky(hour);
    night = Math.max(
      0,
      Math.min(1, (1 - (0.3 * k.amb[0] + 0.59 * k.amb[1] + 0.11 * k.amb[2]) / 255) * 1.7)
    );
    const day = 1 - night;
    if (liftHold > 0) {
      liftHold -= dt;
      Office.lift = liftHold > 0 ? Math.min(1, liftHold * 2, (2.2 - liftHold) * 3) : null;
    }
    g.imageSmoothingEnabled = false;
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.drawImage(bgc, 0, 0);
    WINS.forEach((X) => {
      blit(F.win, X, 8);
      px(X + 3, 11, 32, 20, k.sky);
      g.fillStyle = 'rgba(255,255,255,' + 0.25 * day + ')';
      g.fillRect(X + 5, 13, 6, 3);
      g.fillRect(X + 22, 20, 8, 2);
      px(X + 18, 11, 2, 20, '#e8e2d4');
      px(X + 3, 20, 32, 1, '#e8e2d4');
      if (night > 0.5)
        [
          [8, 6],
          [26, 9],
          [14, 18],
          [30, 19],
        ].forEach((s) => px(X + s[0], 8 + s[1], 1, 1, '#fff'));
    });
    WALLS.forEach((w) => {
      blit(w.s, w.x, w.y);
      if (w.fx) w.fx(T, w.x, w.y);
    });
    px(343, 7, 12, 16, INK);
    px(341, 9, 16, 12, INK);
    px(344, 8, 10, 14, '#f2ede2');
    px(342, 10, 14, 10, '#f2ede2');
    const now = new Date(),
      hand = (a, l, c) => {
        g.fillStyle = c;
        for (let i = 0; i <= l; i++)
          g.fillRect(Math.round(348.5 + Math.sin(a) * i), Math.round(14.5 - Math.cos(a) * i), 1, 1);
      };
    hand((((now.getHours() % 12) + now.getMinutes() / 60) / 12) * 6.283, 3, INK);
    hand((now.getMinutes() / 60) * 6.283, 5, '#f7768e');

    const Q = [],
      FX = [];
    const put = (y, fn) => Q.push([y, fn]);
    ITEMS.forEach((it) =>
      put(it.b, () => {
        if (it.sh) shadow(it.x + (it.s.width >> 1), it.b + 1, it.sh);
        blit(it.s, it.x, it.y);
        if (it.fx) it.fx(T, it.x, it.y);
      })
    );
    SEATS.forEach((s, i) => {
      const who = s.who,
        X = s.dx,
        chair = who ? who.shirt : s.conf ? '#5fae8f' : '#4a5290';
      if (s.seat === 'F') put(s.y - 4, () => blit(chairTop(chair), s.x - 8, s.y - 16));
      else put(s.y + 3, () => blit(chairBack(chair), s.x - 8, s.y - 13));
      if (s.conf) return;
      if (s.seat === 'F')
        put(119, () => {
          shadow(X + 19, 120, 19);
          blit(F.deskBack, X, 93);
          if (who) {
            mugs(X + 3, 104, who.mugs);
            deskProps(px, i, X, 100);
          }
        });
      else
        put(154, () => {
          shadow(X + 19, 155, 19);
          blit(F.deskScreen, X, 128);
          px(X + 10, 130, 20, 8, '#0b1022');
          if (!who) return;
          mugs(X + 3, 140, who.mugs);
          notes(X + 10, 127, who.notes);
          deskProps(px, i, X, 137);
          if (who.st === 'i') return;
          const off = (T * (who.st === 'w' ? 6 : 2)) | 0;
          for (let r = 0; r < 3; r++) {
            const v = ((r + off + i) * 7919) % 97;
            px(
              X + 11 + (v % 3) * 2,
              131 + r * 2,
              4 + (v % 11),
              1,
              ['#7aa2f7', '#9ece6a', '#bb9af7', '#e0af68'][v % 4]
            );
          }
        });
    });

    crowd.tick(dt, T);
    const blinkNow = (p) => (T * 1000 + +p.id.slice(1) * 977) % 4200 < 140;
    P.concat(crowd.guests).forEach((p) => {
      if (p.gone) return;
      const d = build(p.intern),
        [pose, dir, z] = poseOf(p, T);
      p.now = pose;
      const sit = sitting(p),
        f =
          pose === 'walk'
            ? p.roam && p.state === 'stay' && !p.errand
              ? ((T * 8) | 0) % 6
              : Math.floor(p.dist / 2.6) % 6
            : frameOf(pose, T, p.st === 'w' ? 11 : 0);
      if (pose === 'sleep') {
        put(p.y + 9, () => {
          blit(sleeper(p), p.x - 19, p.y - 12 + (Math.sin(T * 1.4) > 0 ? 0 : 1));
        });
        FX.push(() => {
          for (let i = 0; i < 3; i++) {
            const q = (T * 0.35 + i / 3) % 1;
            g.globalAlpha = Math.sin(q * Math.PI);
            g.fillStyle = '#c8d3f5';
            const zx = Math.round(p.x - 18 + q * 10),
              zy = Math.round(p.y - 16 - q * 20),
              s = i % 2 ? 2 : 1;
            g.fillRect(zx, zy, 3 * s, s);
            g.fillRect(zx + s, zy + s, s, s);
            g.fillRect(zx, zy + 2 * s, 3 * s, s);
          }
          g.globalAlpha = 1;
        });
        return;
      }
      put(p.y + (p.errand ? 0 : z), () => {
        if (!sit) shadow(p.x, p.y + 1, 6);
        // a changed look is a different cached sprite, so it needs its own id
        const w = p.wear,
          L =
            p.carry || p.mug || w
              ? Object.assign({}, p, w && w.look, {
                  carry: !!p.carry,
                  mug: !p.carry && !!p.mug,
                  id: p.id + (p.carry ? 'c' : p.mug ? 'm' : '') + (w ? w.key : ''),
                })
              : p;
        blit(
          sprite(L, d, pose, dir, f, !(pose === 'type' && dir === 1) && blinkNow(p), sit),
          p.x - 13,
          spriteY(p)
        );
      });
      if (pose === 'palm')
        FX.push(() => {
          const x = p.x + 8,
            y = headTop(p) - 7 + (Math.sin(T * 9) > 0 ? 0 : 1);
          px(x - 1, y - 1, 4, 10, INK);
          px(x, y, 2, 5, '#ff4b4b');
          px(x, y + 6, 2, 2, '#ff4b4b');
        });
      if (pose === 'talk')
        FX.push(() => {
          const x = p.x + (dir === 2 ? -4 : -8),
            y = headTop(p) - 11;
          px(x - 1, y, 15, 9, INK);
          px(x, y - 1, 13, 11, INK);
          px(x, y, 13, 9, '#f7f8fb');
          px(x + (dir === 2 ? 8 : 3), y + 9, 2, 2, '#f7f8fb');
          for (let i = 0; i < 3; i++)
            px(x + 2 + i * 4, y + 3, 2, 2, ((T * 4) | 0) % 3 === i ? '#3b5bdb' : '#aab0c8');
        });
    });
    if (!CAT.hold) {
      const cm = step(CAT, dt, 17);
      CAT.sit = !cm;
    }
    put(CAT.y, () => {
      shadow(CAT.x, CAT.y + 1, 6);
      blit(
        catSprite(CAT.sit ? ((T * 2) | 0) % 2 : Math.floor(CAT.dist / 2.4) % 4, CAT.sit, CAT.flip),
        CAT.x - 10,
        CAT.y - 12
      );
    });
    const gm = GOOSE.hold ? false : step(GOOSE, dt, 11);
    put(GOOSE.y, () => {
      shadow(GOOSE.x, GOOSE.y + 1, 5);
      blit(
        gooseSprite(gm ? Math.floor(GOOSE.dist / 1.8) % 4 : 0, GOOSE.flip),
        GOOSE.x - 9,
        GOOSE.y - 18
      );
    });
    Office.extra.forEach((fn) => fn(T, dt, put, FX));
    Q.sort((a, b) => a[0] - b[0]).forEach((q) => q[1]());
    FX.forEach((fn) => fn());
    for (let i = HEARTS.length - 1; i >= 0; i--) {
      const h = HEARTS[i];
      h.t += dt;
      if (h.t > 1.4) {
        HEARTS.splice(i, 1);
        continue;
      }
      if (h.t < 0) continue;
      const x = Math.round(h.x + Math.sin(h.t * 6 + i) * 2),
        y = Math.round(h.y - h.t * 18);
      g.globalAlpha = 1 - h.t / 1.4;
      g.fillStyle = '#f7768e';
      g.fillRect(x, y, 2, 2);
      g.fillRect(x + 3, y, 2, 2);
      g.fillRect(x, y + 1, 5, 2);
      g.fillRect(x + 1, y + 3, 3, 1);
      g.fillRect(x + 2, y + 4, 1, 1);
    }
    g.globalAlpha = 1;
    for (let i = BITS.length - 1; i >= 0; i--) {
      const c = BITS[i];
      c.t += dt;
      if (c.t > 1.5) {
        BITS.splice(i, 1);
        continue;
      }
      c.vy += 110 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      g.globalAlpha = Math.min(1, (1.5 - c.t) * 2);
      g.fillStyle = c.c;
      g.fillRect(Math.round(c.x), Math.round(c.y), 2, ((c.t * 12) | 0) % 2 ? 1 : 2);
    }
    g.globalAlpha = 1;

    // light: the hour sets the base colour, each lamp adds one soft pool
    lg.globalCompositeOperation = 'source-over';
    lg.globalAlpha = 1;
    lg.fillStyle = 'rgb(' + k.amb.map((v) => v | 0).join(',') + ')';
    lg.fillRect(0, 0, LW, LH);
    if (night > 0.03) {
      lg.globalCompositeOperation = 'lighter';
      const pool = (x, y, c, r, a) => {
        const gr = lg.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, hexA(c, a));
        gr.addColorStop(0.55, hexA(c, a * 0.45));
        gr.addColorStop(1, hexA(c, 0));
        lg.fillStyle = gr;
        lg.fillRect(x - r, y - r, r * 2, r * 2);
      };
      LIGHTS.forEach((l, i) =>
        pool(
          l[0],
          l[1],
          l[2],
          l[3],
          l[4] *
            night *
            (0.92 + 0.08 * Math.sin(T * 3 + i * 1.7)) *
            (i === 0 && Math.sin(T * 1.3 + 7) > 0.96 ? 0.35 : 1)
        )
      );
      // a desk lamp and a screen glow only where somebody sits
      SEATS.forEach((s) => {
        if (s.who && !s.conf)
          pool(
            s.x,
            s.seat === 'B' ? s.y - 26 : s.y - 4,
            s.seat === 'B' ? '#8fd3ff' : '#ffd39a',
            s.seat === 'B' ? 36 : 26,
            0.55 * night
          );
      });
    }
    Office.onLight.forEach((fn) => fn(lg, T, night));
    g.globalCompositeOperation = 'multiply';
    g.drawImage(lm, 0, 0);
    g.globalCompositeOperation = 'source-over';
    if (day > 0.05) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255,236,190,' + 0.1 * day + ')';
      WINS.forEach((X) => {
        g.beginPath();
        g.moveTo(X + 3, WALL);
        g.lineTo(X + 35, WALL);
        g.lineTo(X + 75, WALL + 84);
        g.lineTo(X + 35, WALL + 84);
        g.fill();
      });
      g.globalCompositeOperation = 'source-over';
    }
    // status dots, drawn after the light so they read at night
    P.forEach((p) => {
      if (p.now === 'talk' || p.nopip || p.gone) return;
      const x = Math.round(p.x) - 2,
        y = Math.round(pipY(p)) + (p.now === 'cheer' ? -3 : p.now === 'lift' ? -5 : 0),
        c =
          p.st === 'w'
            ? ((T * 2) | 0) % 2
              ? '#9ece6a'
              : '#c5f08f'
            : p.st === 't'
              ? '#bb9af7'
              : '#8b90a8';
      px(x, y, 5, 5, INK);
      px(x + 1, y + 1, 3, 3, c);
    });
    if (night > 0.4 || Math.sin(T * 1.3 + 7) <= 0.96) blit(F.neon, 8, 10);
    Office.glow.forEach((fn) => fn(T, dt));
    const bob = ((T * 2) | 0) % 2;
    if (Office.showGames)
      GAMES.forEach((m) => {
        const w = m.n > 9 ? 11 : 7,
          x = m.x - (w >> 1),
          y = m.y - 4 - bob,
          hot = Office.hov === m || Office.picked === m;
        px(x - 1, y, w + 2, 9, INK);
        px(x, y - 1, w, 11, INK);
        px(x, y, w, 9, hot ? '#fff' : '#ffd23f');
        text(g, m.n, x + 2, y + 2, INK);
      });

    cam.tick(dt);
    cam.blit(ctx, base);
    P.forEach((p) => {
      if (!p.el) {
        p.el = document.createElement('div');
        p.el.className = 'tag';
        p.el.textContent = p.name;
        tagsEl.insertBefore(p.el, spotTag);
      }
      const show =
        !p.gone &&
        (Office.names === 'always' ||
          (Office.names !== 'pips' &&
            (p === Office.hov ||
              p === Office.picked ||
              (Office.names === 'working' && p.st === 'w' && !!p.seat))));
      p.el.hidden = !show;
      if (show) {
        const [sx, sy] = cam.toScreen(p.x, pipY(p) - 2);
        p.el.style.left = sx + 'px';
        p.el.style.top = sy + 'px';
      }
    });
    const h = Office.hov;
    if (h && (h.kind === 'game' || h.kind === 'door')) {
      spotTag.hidden = false;
      spotTag.textContent = h.name;
      const [sx, sy] = cam.toScreen(h.x, h.kind === 'game' ? h.y - 8 : h.r[1] - 4);
      spotTag.style.left = sx + 'px';
      spotTag.style.top = sy + 'px';
    } else spotTag.hidden = true;
    Office.onFrame.forEach((fn) => fn(T, dt));
  }

  function hit(e) {
    const [x, y] = cam.toWorld(e.clientX, e.clientY);
    Office.at = [x, y];
    if (Math.abs(x - CAT.x) < 10 && y > CAT.y - 13 && y < CAT.y + 2) return CAT;
    let best = null;
    P.forEach((p) => {
      if (p.gone) return;
      const ok =
        p.now === 'sleep'
          ? Math.abs(x - p.x) < 18 && Math.abs(y - (p.y - 6)) < 8
          : Math.abs(x - p.x) < 8 && y > headTop(p) - 3 && y < p.y + 2;
      if (ok && (!best || p.y > best.y)) best = p;
    });
    if (best) return best;
    const m = GAMES.find((m) => Math.abs(x - m.x) < 9 && Math.abs(y - m.y) < 10);
    if (m) return m;
    return (
      DOORS.find(
        (d) => x >= d.r[0] && x <= d.r[0] + d.r[2] && y >= d.r[1] && y <= d.r[1] + d.r[3]
      ) || null
    );
  }

  function start() {
    if (started) return;
    started = true;
    paintBg(bgc);
    spotTag = document.createElement('div');
    spotTag.className = 'tag spot';
    spotTag.hidden = true;
    tagsEl.appendChild(spotTag);
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, m: 0 };
    });
    cv.addEventListener('pointermove', (e) => {
      if (drag) {
        const dx = e.clientX - drag.x,
          dy = e.clientY - drag.y;
        drag.m = Math.max(drag.m, Math.abs(dx) + Math.abs(dy));
        if (drag.m > 4) {
          cam.jump(drag.cx - dx / cam.s, drag.cy - dy / cam.s);
          cam.touched = true;
          emit('drag');
        }
      } else {
        Office.hov = hit(e);
        cv.classList.toggle('hit', !!Office.hov);
      }
    });
    cv.addEventListener('pointerup', (e) => {
      const moved = drag && drag.m > 4;
      drag = null;
      if (moved) return;
      const a = hit(e);
      if (a === CAT) Office.hearts(CAT.x, CAT.y - 16);
      emit('pick', a, Office.at);
    });
    cv.addEventListener('pointercancel', () => {
      drag = null;
    });
    cv.addEventListener('pointerleave', () => {
      Office.hov = null;
    });
    // the wheel is the plus and minus buttons under a finger: one notch, one whole step, the
    // same soft move, and the view stays where it is. A touchpad sends a stream of small
    // deltas, so they add up to a notch and then rest for a moment.
    let wheel = 0,
      wheelAt = 0;
    cv.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const now = performance.now();
        if (now - wheelAt < 220) return;
        wheel += e.deltaMode ? e.deltaY * 40 : e.deltaY;
        if (Math.abs(wheel) < 40) return;
        cam.touched = true;
        cam.zoom(wheel < 0 ? 1 : -1);
        wheel = 0;
        wheelAt = now;
      },
      { passive: false }
    );
    Office.on('event', (type) => {
      if (type === 'arrive' || type === 'bye') liftHold = 2.2;
    });
    cam.layout();
    new ResizeObserver(() => cam.layout()).observe(stage);
    requestAnimationFrame(frame);
  }

  return Office;
}
