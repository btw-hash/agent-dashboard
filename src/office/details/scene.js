import { INK, text } from '../engine/pixel.js';
import { SPOT, WINS, LIFT } from '../world/plan.js';
import { spriteY, headTop } from '../world/crowd.js';

// Waves 1 to 3 of the small details: things that happen inside the office.
// Each block is independent; all of them draw through the office's own layers.
const SCREEN = {
  Bash: 'term',
  PowerShell: 'term',
  Edit: 'diff',
  Write: 'diff',
  NotebookEdit: 'diff',
  WebFetch: 'web',
  WebSearch: 'web',
  Grep: 'find',
  Glob: 'find',
  Read: 'find',
  Agent: 'team',
  Task: 'team',
};
const hashDay = (salt) => {
  const d = new Date(),
    n = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) * 24 + salt;
  return ((Math.imul(n, 2654435761) >>> 0) % 1000) / 1000;
};

export function installScene(office, shell, stats) {
  const { P, SEATS, CAT, GOOSE, px, g } = office;
  const night = () => office.night();
  const hourNow = () => office.hour();

  // ── desks ──────────────────────────────────────────────────────
  // the monitor shows what the tool is: a terminal, a diff, a browser, a search
  function screen(kind, X, T, i) {
    const x = X + 10,
      y = 130;
    px(x, y, 20, 8, '#0b1022');
    if (kind === 'term') {
      const n = ((T * 3) | 0) % 4;
      for (let r = 0; r <= Math.min(2, n); r++) {
        px(x + 1, y + 1 + r * 2, 1, 1, '#7cff6b');
        px(x + 3, y + 1 + r * 2, 4 + ((r * 5 + i * 3) % 9), 1, '#9ece6a');
      }
      if (((T * 2) | 0) % 2) px(x + 3 + (n === 3 ? 0 : 6), y + 7, 2, 1, '#c5f08f');
    } else if (kind === 'diff') {
      const off = ((T * 1.5) | 0) % 3;
      for (let r = 0; r < 4; r++) {
        const add = (r + off + i) % 3;
        px(x + 1, y + r * 2, 1, 1, add ? '#9ece6a' : '#f7768e');
        px(x + 3, y + r * 2, 6 + ((r * 7 + off * 3) % 10), 1, add ? '#3f7a3a' : '#8a3040');
      }
    } else if (kind === 'web') {
      px(x, y, 20, 2, '#2a2e44');
      px(x + 1, y, 1, 1, '#f7768e');
      px(x + 3, y, 1, 1, '#ffd23f');
      px(x + 6, y, 12, 1, '#c8d3f5');
      px(x + 1, y + 3, 7, 4, '#7aa2f7');
      px(x + 10, y + 3, 8, 1, '#c8d3f5');
      px(x + 10, y + 5, 5 + (((T * 2) | 0) % 4), 1, '#7a84ad');
    } else if (kind === 'find') {
      const row = ((T * 2) | 0) % 4;
      for (let r = 0; r < 4; r++)
        px(x + 1, y + r * 2, 9 + ((r * 5 + i) % 8), 1, r === row ? '#ffd23f' : '#3d4480');
      px(x + 15, y + 1, 3, 3, '#c8d3f5');
      px(x + 16, y + 2, 1, 1, '#0b1022');
      px(x + 18, y + 4, 1, 1, '#c8d3f5');
    } else if (kind === 'team') {
      for (let k = 0; k < 3; k++) {
        const up = ((T * 2 + k) | 0) % 3 === 0 ? 1 : 0;
        px(x + 3 + k * 6, y + 1 - up + 1, 2, 2, '#f1c9a5');
        px(x + 2 + k * 6, y + 4 - up + 1, 4, 3, ['#f7768e', '#9ece6a', '#7aa2f7'][k]);
      }
    }
  }
  const printer = { until: 0, seen: new Map() };
  const flow = (p) => p.seat && p.st === 'w' && p.worked > 480;

  // ── creatures ──────────────────────────────────────────────────
  const cat = { job: null, bug: null, napUntil: 0, next: 60 + Math.random() * 90 };
  const goose = { note: 0, next: 50 };
  const mouse = { on: false, x: 0, next: 40 + Math.random() * 60 };
  function catGo(x, y, then) {
    CAT.hold = true;
    cat.job = { x, y, then };
  }
  office.on('event', (type, p) => {
    if (type !== 'palm' || !p.desk || cat.job) return;
    const front = p.desk.seat === 'F',
      lane = front ? 84 : 188,
      x = p.x + 14;
    catGo(x, lane, () => {
      cat.bug = { x, y: lane + (front ? 4 : -6), until: performance.now() + 25000 };
      shell.news('The cat brought ' + p.name + ' a bug. Helpful.');
      cat.napUntil = performance.now() + 1500;
    });
  });

  // ── weather, the clock, the bin ────────────────────────────────
  const raining = () => hashDay(Math.floor(hourNow())) < 0.22;
  const prints = [];
  let cuckoo = 0,
    lastHour = new Date().getHours(),
    trash = 0,
    monday = false;
  office.on('event', (type, p) => {
    if (type === 'cheer') trash = Math.min(9, trash + 1);
    if (type === 'arrive' && raining()) p.wet = 70;
  });
  office.on('cleaned', () => {
    trash = 0;
  });
  office.on('midnight', () => {
    trash = 0;
    shell.news('Midnight: the whiteboard has been wiped.');
  });
  const waved = new WeakMap();

  const FLOW = { key: 'f', look: { acc: 'phones' } };
  office.extra.push((T, dt, put, FX) => {
    const now = performance.now(),
      late = hourNow() < 5;
    office.daysOk = stats.daysOk();
    // headphones on while in flow
    P.forEach((p) => {
      if (!p.wear || p.wear === FLOW) p.wear = flow(p) ? FLOW : null;
    });

    // on the walls and floor, under everything that stands
    put(0, () => {
      // the whiteboard fills up with the day's finished tasks
      const done = Math.min(14, stats.day().done);
      for (let k = 0; k < done; k++) {
        const bx = 196 - ((k * 7) % 9) * 1 - (k % 2) * 3,
          by = 9 + ((k * 5) % 6) * 3;
        px(
          153 + ((k * 11) % 46),
          27 - ((k * 3) % 4),
          3,
          1,
          ['#3b5bdb', '#e03131', '#2f9e44'][k % 3]
        );
        if (k > 8) px(bx, by, 2, 1, '#8b90a8');
      }
      // the wall clock strikes the hour
      const h = new Date().getHours();
      if (h !== lastHour) {
        lastHour = h;
        cuckoo = now + 6000;
        shell.news('Cuckoo! It is ' + String(h).padStart(2, '0') + ':00.');
      }
      if (now < cuckoo) {
        const out = Math.sin(((cuckoo - now) / 600) * Math.PI) > 0 ? 1 : 0;
        px(357, 11 - out, 5 + out * 2, 5, INK);
        px(358, 12 - out, 3 + out * 2, 3, '#ffd23f');
        px(361 + out * 2, 13 - out, 2, 1, '#ff8a3d');
      }
      // rain on the windows
      if (raining()) {
        g.fillStyle = 'rgba(200,220,255,.55)';
        WINS.forEach((X, w) => {
          for (let k = 0; k < 9; k++) {
            const q = (T * 1.6 + k * 0.37 + w * 0.2) % 1,
              rx = X + 4 + ((k * 7 + w * 3) % 30),
              ry = 11 + ((q * 19) | 0);
            if (rx !== X + 18 && rx !== X + 19 && ry !== 20) g.fillRect(rx, ry, 1, 2);
          }
        });
      }
      for (let k = prints.length - 1; k >= 0; k--) {
        const f = prints[k];
        f.t += dt;
        if (f.t > 9) {
          prints.splice(k, 1);
          continue;
        }
        g.fillStyle = 'rgba(40,60,110,' + 0.32 * (1 - f.t / 9) + ')';
        g.fillRect(f.x, f.y, 2, 1);
      }
      // the mouse comes out at night
      if (mouse.on) {
        const mx = Math.round(mouse.x),
          hop = ((T * 12) | 0) % 2;
        px(mx, 199 - hop, 4, 2, '#8b90a8');
        px(mx + 3, 198 - hop, 2, 2, '#aab0c8');
        px(mx - 2, 200 - hop, 2, 1, '#f29b9b');
      }
      if (cat.bug) {
        const b = cat.bug,
          wig = ((T * 6) | 0) % 2;
        px(b.x - 1, b.y - 1, 5, 4, INK);
        px(b.x, b.y, 3, 2, '#7cff6b');
        px(b.x - 1 + wig, b.y + 2, 1, 1, '#7cff6b');
        px(b.x + 2 + wig, b.y + 2, 1, 1, '#7cff6b');
        if (now > b.until) cat.bug = null;
      }
    });

    // the bin fills with every finished task until the cleaners come
    if (trash)
      put(172.5, () => {
        for (let k = 0; k < trash; k++) {
          const tx = 224 + ((k * 3) % 7) - (k > 4 ? 6 : 0),
            ty = k < 3 ? 158 - k : 170 + (k % 2);
          px(tx - 1, ty - 1, 4, 4, INK);
          px(tx, ty, 2, 2, k % 2 ? '#f2ede2' : '#dfe3ee');
        }
      });

    // the plant by the printers: droops when nobody has played Plant care for two days
    put(204.5, () => {
      let watered = 0;
      try {
        watered = +localStorage.getItem('agent_office_watered') || 0;
      } catch {
        watered = 0;
      }
      if (watered && Date.now() - watered < 172800000) {
        px(15, 178, 3, 3, '#7fd38f');
        px(16, 176, 2, 2, '#f7768e');
      } else if (!watered || Date.now() - watered > 259200000) {
        px(6, 188, 3, 4, '#a8853f');
        px(17, 187, 3, 4, '#a8853f');
      }
    });

    // fish gather at the glass when somebody watches them
    if (SPOT.tank.busy && P.some((p) => p.spot === SPOT.tank && p.state === 'stay'))
      put(73.5, () => {
        for (let k = 0; k < 5; k++) {
          const fx = 98 + k * 4 + Math.round(Math.sin(T * 2 + k) * 1),
            fy = 51 + (k % 2) * 3;
          px(fx, fy, 3, 2, ['#ff8a3d', '#ffd23f', '#f7768e', '#fff', '#7cff6b'][k]);
          px(fx + 3, fy, 1, 2, ['#ff8a3d', '#ffd23f', '#f7768e', '#fff', '#7cff6b'][k]);
        }
      });

    // printer: a sheet comes out when somebody writes a file
    P.forEach((p) => {
      const h = p.agent && p.agent.toolHistory && p.agent.toolHistory[0];
      if (!h || h.tool !== 'Write') return;
      if (printer.seen.get(p) !== h.time) {
        if (printer.seen.has(p)) printer.until = now + 2600;
        printer.seen.set(p, h.time);
      }
    });
    if (now < printer.until)
      put(125.5, () => {
        const k = 1 - (printer.until - now) / 2600,
          out = Math.round(Math.min(1, k * 1.6) * 6);
        px(10, 98 - out, 14, out + 1, INK);
        px(11, 99 - out, 12, out, '#fff');
        for (let r = 1; r < out - 1; r += 2) px(13, 99 - out + r, 8, 1, '#aab0c8');
      });

    SEATS.forEach((s, i) => {
      const p = s.who;
      if (!p || s.conf) return;
      const X = s.dx,
        back = s.seat === 'B';
      if (back && p.st === 'w') {
        const kind = SCREEN[p.agent && p.agent.currentTool];
        if (kind) put(154, () => screen(kind, X, T, i));
      }
      // a trophy after five finished tasks in a row
      if (p.streak >= 5)
        put(back ? 154 : 119, () => {
          const tx = X + 24,
            ty = back ? 136 : 99;
          px(tx - 1, ty - 1, 6, 8, INK);
          px(tx, ty, 4, 3, '#ffd23f');
          px(tx + 1, ty + 3, 2, 2, '#b8901f');
          px(tx, ty + 5, 4, 1, '#b8901f');
          px(tx + 1, ty, 1, 1, '#fff6c8');
        });
      // do not disturb while in flow
      if (flow(p))
        put(back ? 154 : 119, () => {
          const tx = X + 1,
            ty = back ? 146 : 108;
          px(tx - 1, ty - 1, 9, 6, INK);
          px(tx, ty, 7, 4, '#e03131');
          px(tx + 1, ty + 1, 5, 2, '#fff');
        });
      // after midnight: a blanket over the shoulders and a cup of tea
      if (late && p.seat) {
        put(p.y + 0.2, () => {
          const y = spriteY(p) + 17;
          px(p.x - 7, y, 14, back ? 9 : 5, '#b5532a');
          px(p.x - 7, y, 14, 1, '#d9785f');
          for (let k = 0; k < 14; k += 4) px(p.x - 6 + k, y + 2, 2, 1, '#ffd23f');
        });
        put(back ? 154 : 119, () => {
          const tx = X + 22,
            ty = back ? 141 : 104;
          px(tx - 1, ty - 1, 5, 5, INK);
          px(tx, ty, 3, 3, '#f2ede2');
          px(tx, ty, 3, 1, '#b5532a');
          const q = (T * 0.6) % 1;
          g.fillStyle = 'rgba(255,255,255,' + 0.5 * (1 - q) + ')';
          g.fillRect(tx + 1, ty - 2 - Math.round(q * 5), 1, 2);
        });
      }
    });

    P.forEach((p) => {
      if (p.gone || p.guest) return;
      // wet footprints behind whoever just came in from the rain
      if (p.wet > 0 && p.roam && p.state === 'go') {
        const d = p.dist - (p.wetAt || 0);
        if (d >= 5) {
          p.wetAt = p.dist;
          p.wet -= 5;
          prints.push({
            x: Math.round(p.x) - 2 + ((p.dist / 5) & 1) * 3,
            y: Math.round(p.y),
            t: 0,
          });
        }
      }
      // burnt out after a long stretch of work
      if (p.seat && p.worked > 2700)
        FX.push(() => {
          const x = Math.round(p.x) - 6,
            y = Math.round(headTop(p)) - 6,
            k = ((T * 3) | 0) % 3;
          px(x + k, y, 3, 1, '#5d6480');
          px(x + 4 - k, y - 2, 4, 1, '#5d6480');
          px(x + 8, y - 1 + (k & 1), 2, 1, '#5d6480');
        });
      // thinking out loud at the rubber duck
      if (p.seat && p.st === 't' && (T + +p.id.slice(1) * 3.7) % 14 < 3.2)
        FX.push(() => {
          const x = Math.round(p.x) + 7,
            y = Math.round(headTop(p)) - 12;
          px(x - 1, y, 13, 10, INK);
          px(x, y - 1, 11, 12, INK);
          px(x, y, 11, 10, '#f7f8fb');
          px(x + 1, y + 10, 2, 2, '#f7f8fb');
          px(x + 3, y + 4, 6, 4, '#ffd23f');
          px(x + 6, y + 2, 3, 3, '#ffd23f');
          px(x + 9, y + 3, 2, 1, '#ff8a3d');
          px(x + 7, y + 3, 1, 1, INK);
        });
      // a wave for whoever is already standing where you arrive
      if (p.roam && p.state === 'stay' && p.spot && !p.errand && !waved.get(p)) {
        waved.set(p, true);
        const mate = P.find(
          (q) =>
            q !== p &&
            q.roam &&
            q.state === 'stay' &&
            !q.errand &&
            !q.spot?.[5] &&
            q.now !== 'sleep' &&
            Math.hypot(q.x - p.x, q.y - p.y) < 34
        );
        if (mate && !p.spot[5] && p.spot[3] === 'idle') {
          p.once = { pose: 'wave', until: T + 1.6 };
          if (mate.spot && mate.spot[3] === 'idle') mate.once = { pose: 'wave', until: T + 1.9 };
        }
      }
      if (p.roam && p.state === 'go') waved.delete(p);
    });

    // the cat: errands, naps on a warm keyboard, the mouse
    if (cat.job) {
      const j = cat.job,
        dx = j.x - CAT.x,
        dy = j.y - CAT.y,
        d = Math.hypot(dx, dy);
      if (d < 1) {
        cat.job = null;
        CAT.sit = true;
        if (j.then) j.then();
      } else {
        const s = Math.min(d, (j.speed || 34) * dt);
        CAT.x += (dx / d) * s;
        CAT.y += (dy / d) * s;
        CAT.dist += s;
        CAT.flip = dx < 0;
        CAT.sit = false;
      }
    } else if (CAT.hold && now > cat.napUntil) CAT.hold = false;
    else if (CAT.hold && cat.zzz)
      FX.push(() => {
        const q = (T * 0.4) % 1;
        g.globalAlpha = Math.sin(q * Math.PI);
        text(g, 'Z', Math.round(CAT.x + 4 + q * 6), Math.round(CAT.y - 16 - q * 10), '#c8d3f5');
        g.globalAlpha = 1;
      });
    if (!CAT.hold) cat.zzz = false;
    cat.next -= dt;
    if (cat.next < 0 && !CAT.hold) {
      cat.next = 150 + Math.random() * 200;
      const warm = SEATS.filter((s) => s.who && !s.conf && s.who.st === 'w').sort(
        (a, b) => b.who.worked - a.who.worked
      )[0];
      if (warm)
        catGo(warm.dx + 30, warm.seat === 'F' ? 121 : 156, () => {
          cat.napUntil = performance.now() + 18000;
          cat.zzz = true;
          shell.news('The cat is asleep next to the warmest keyboard: ' + warm.who.name + "'s.");
        });
    }
    mouse.next -= dt;
    if (!mouse.on && mouse.next < 0 && night() > 0.6) {
      mouse.on = true;
      mouse.x = 4;
      mouse.next = 120 + Math.random() * 240;
      if (!CAT.hold) catGo(180, 198, null);
      if (cat.job) cat.job.speed = 46;
    }
    if (mouse.on) {
      mouse.x += 58 * dt;
      if (cat.job && !cat.job.then) cat.job.x = Math.min(600, mouse.x - 26);
      if (mouse.x > 636) {
        mouse.on = false;
        if (cat.job && !cat.job.then) {
          cat.job = null;
          cat.napUntil = performance.now() + 2500;
        }
        shell.news('A mouse crossed the hall. The cat almost had it.');
      }
    }

    // the goose takes a sticky note now and then
    goose.next -= dt;
    if (goose.next < 0) {
      goose.next = 70 + Math.random() * 80;
      const victim = SEATS.map((s) => s.who).find(
        (p) => p && p.notes > 0 && p.desk && p.desk.seat === 'B' && Math.abs(p.x - GOOSE.x) < 90
      );
      if (victim && Math.abs(GOOSE.y - 188) < 4) {
        victim.notes--;
        goose.note = performance.now() + 20000;
        shell.news('The goose stole a sticky note from ' + victim.name + '.');
      }
    }
    if (performance.now() < goose.note)
      put(GOOSE.y + 0.1, () => {
        const bx = Math.round(GOOSE.x) + (GOOSE.flip ? -11 : 8),
          by = Math.round(GOOSE.y) - 15;
        px(bx - 1, by - 1, 5, 5, INK);
        px(bx, by, 3, 3, '#ffe066');
      });

    // Monday morning: the coffee machine works overtime
    const d = new Date();
    if (d.getDay() === 1 && d.getHours() === 9 && !monday) {
      monday = true;
      shell.news('Monday. The coffee machine is working overtime.');
    }
    if (d.getDay() === 1 && d.getHours() < 12)
      FX.push(() => {
        for (let k = 0; k < 4; k++) {
          const q = (T * 0.7 + k / 4) % 1;
          g.fillStyle = 'rgba(255,255,255,' + 0.55 * (1 - q) + ')';
          g.fillRect(573 + k * 2, 222 - Math.round(q * 14), 1, 2);
        }
      });
  });

  // dust in the sun shafts
  office.glow.push((T) => {
    const day = 1 - night();
    if (day < 0.3 || raining()) return;
    WINS.forEach((X, w) => {
      for (let k = 0; k < 7; k++) {
        const q = (T * 0.05 + k * 0.143 + w * 0.31) % 1,
          x = X + 12 + q * 44 + Math.sin(T * 0.6 + k * 2 + w) * 6,
          y = 50 + ((k * 23 + w * 11) % 72) + Math.sin(T * 0.4 + k) * 3;
        g.fillStyle = 'rgba(255,244,214,' + 0.5 * day * Math.sin(q * Math.PI) + ')';
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    });
  });

  // playing Plant care waters the real plant
  office.on('game', (m) => {
    if (m.name !== 'Plant care') return;
    try {
      localStorage.setItem('agent_office_watered', String(Date.now()));
    } catch {
      // no storage: the plant stays thirsty
    }
  });

  return { flow, daysOk: () => stats.daysOk(), lift: LIFT };
}
