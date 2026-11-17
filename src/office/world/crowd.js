import { NODE, SPOT, LIFT, bfs } from './plan.js';
import { SK, HR, SH, STY, ACC, FIT, ROLES, QUOTES } from './cast.js';
import { build, HY } from '../art/people.js';

const NAMES =
  'Bug-Hunt Heisen-X Blanky Grid-G Lint Regex Stacky Cron Diff Yaml Merge Null-Ptr Semi-Colon Commit-D Blocky Arches Reps Lucky Pixel Snooze Kernel Mutex Tabby Cache Daemon Patch Vim Tux Async Buffer Stash Rebase Grep Sudo Ping Nano Byte Hex Octo Fork'.split(
    ' '
  );
const PLANS = [
  ['esp', 'board', 'server', 'sipC'],
  ['juke', 'sofaL', 'arcA', 'roul'],
  ['scope', 'plant', 'printer', 'tank'],
  ['tread', 'lift', 'vend', 'bag'],
  ['poker', 'slot', 'sipA', 'bj'],
  ['arcB', 'foos', 'sofaR', 'sipB'],
  ['talkA', 'esp', 'tank', 'sipB'],
  ['talkB', 'vend', 'crystal', 'sofaL'],
  ['nap', 'esp', 'juke', 'sipC'],
  ['board', 'talkA', 'arcA', 'sipA'],
  ['bag', 'talkB', 'scope', 'slot'],
  ['printer', 'roul', 'tread', 'esp'],
];
const MOODS = ['focused', 'chatty', 'sleepy', 'curious', 'proud', 'hungry'];
// Claude Code never reports "idle": a session that has been quiet this long counts as resting.
const REST_MS = 120_000;
const WALK = 24,
  GAP = 16;

export const SEATS = [];
[124, 262, 392].forEach((X) => {
  SEATS.push(
    { x: X + 19, y: 107, seat: 'F', dx: X },
    { x: X + 65, y: 107, seat: 'F', dx: X + 46 },
    { x: X + 19, y: 166, seat: 'B', dx: X },
    { x: X + 65, y: 166, seat: 'B', dx: X + 46 }
  );
});
SEATS.push(
  { x: 526, y: 104, seat: 'F', conf: true },
  { x: 558, y: 104, seat: 'F', conf: true },
  { x: 526, y: 133, seat: 'B', conf: true },
  { x: 558, y: 133, seat: 'B', conf: true }
);
const laneOf = (s) => (s.seat === 'F' ? 84 : 188);

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
export const facing = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : dy > 0 ? 0 : 1);
export const nearNode = (x, y) =>
  Object.keys(NODE).reduce((a, n) =>
    Math.hypot(NODE[n][0] - x, NODE[n][1] - y) < Math.hypot(NODE[a][0] - x, NODE[a][1] - y) ? n : a
  );
// drop lane points that would make someone walk back on themselves
export function tidy(pts) {
  const r = pts.filter((p, i) => !i || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  for (let k = 1; k < r.length - 1; k++) {
    const a = r[k - 1],
      b = r[k],
      c = r[k + 1],
      onX = a[1] === b[1] && b[1] === c[1],
      onY = a[0] === b[0] && b[0] === c[0];
    if ((onX && (b[0] - a[0]) * (c[0] - b[0]) < 0) || (onY && (b[1] - a[1]) * (c[1] - b[1]) < 0)) {
      r.splice(k, 1);
      k = Math.max(0, k - 2);
    }
  }
  return r;
}

export const sitting = (p) =>
  !p.errand && (!!p.seat || (p.roam && p.state === 'stay' && !!p.spot && !!p.spot[5]));
export const spriteY = (p) => {
  const d = build(p.intern);
  return sitting(p) ? p.y - 6 - (d.ly + 1) : p.y - (d.foot + 1);
};
export const headTop = (p) => spriteY(p) + 1 + HY;
export const pipY = (p) => (p.now === 'sleep' ? p.y - 19 : headTop(p) - 8);

function walk(p, route, speed, dt) {
  let left = speed * dt;
  while (left > 0 && route.length) {
    const t = route[0],
      dx = t[0] - p.x,
      dy = t[1] - p.y,
      d = Math.hypot(dx, dy);
    if (d > 0.01) p.dir = facing(dx, dy);
    if (d <= left) {
      p.x = t[0];
      p.y = t[1];
      p.dist += d;
      left -= d;
      route.shift();
    } else {
      p.x += (dx / d) * left;
      p.y += (dy / d) * left;
      p.dist += left;
      left = 0;
    }
  }
}

export function createCrowd({ emit, burst, now = () => Date.now() }) {
  const P = [];
  const byAgent = new Map();
  const taken = new Set();
  const guests = [];
  let seq = 0;

  function person(agent) {
    const h = hash(agent.id),
      intern = !!agent.isSubagent;
    let name = agent.source === 'reported' ? String(agent.slug).slice(0, 14) : null;
    if (!name) {
      for (let k = 0; k < NAMES.length && !name; k++) {
        const n = NAMES[(h + k * 7) % NAMES.length];
        if (!taken.has(n)) name = n;
      }
      name = name || 'Agent-' + (h % 97);
      if (intern) name = 'Sub-' + ((h % 89) + 1);
    }
    taken.add(name);
    return {
      id: 'p' + seq++,
      aid: agent.id,
      agent,
      name,
      intern,
      role: intern ? ROLES[ROLES.length - 1] : ROLES[(h >>> 5) % (ROLES.length - 1)],
      quote: intern ? QUOTES[QUOTES.length - 1] : QUOTES[(h >>> 8) % (QUOTES.length - 1)],
      skin: SK[h % 5],
      hair: HR[(h >>> 3) % 9],
      shirt: SH[(h >>> 6) % 12],
      pants: ['#2e3350', '#3a2e55', '#23263a'][(h >>> 9) % 3],
      style: STY[(h >>> 11) % 6],
      acc: ACC[(h >>> 14) % 6],
      fit: FIT[(h >>> 17) % 6],
      beard: (h >>> 20) % 5 === 0,
      skirt: (h >>> 23) % 4 === 0,
      mood: MOODS[(h >>> 12) % 6],
      energy: 55 + ((h >>> 4) % 40),
      coffees: 0,
      mugs: 1,
      notes: 0,
      streak: 0,
      worked: 0,
      plan: PLANS[(h >>> 2) % PLANS.length],
      pi: -1,
      st: 'i',
      pose: 'idle',
      dir: 0,
      dist: 0,
      x: LIFT[0],
      y: LIFT[1],
      roam: true,
      state: 'stay',
      stay: 0,
      route: [],
      spot: null,
      node: 'uL',
    };
  }

  function want(agent) {
    if (agent.status === 'working') return 'working';
    if (agent.status === 'thinking')
      return now() - Date.parse(agent.lastActivity) > REST_MS ? 'idle' : 'thinking';
    return 'idle';
  }
  function freeSpot(p) {
    if (p.spot) p.spot.busy = false;
    p.spot = null;
  }
  function seatDown(p) {
    const s = p.joinSeat;
    p.joinSeat = null;
    s.res = null;
    s.who = p;
    p.desk = s;
    p.roam = false;
    p.route = [];
    p.x = s.x;
    p.y = s.y;
    p.seat = s.seat;
    p.dir = s.seat === 'F' ? 0 : 1;
    p.chair = p.shirt;
    p.pose = p.st === 't' ? 'think' : 'type';
    if (p.fresh) {
      p.fresh = false;
      emit('join', p);
    }
  }
  const leadOf = (p) => (p.intern && p.agent.parent ? byAgent.get(p.agent.parent) : null);
  function goSit(p) {
    const free = SEATS.filter((x) => !x.who && !x.res),
      lead = leadOf(p),
      near = lead && (lead.desk || lead.joinSeat),
      s = near
        ? free.sort(
            (a, b) =>
              Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y)
          )[0]
        : free[0];
    if (!s) return;
    p.trailing = false;
    s.res = p;
    p.joinSeat = s;
    const lane = laneOf(s),
      known = p.pre || (p.state === 'stay' && p.spot),
      from = known ? p.node : nearNode(p.x, p.y);
    freeSpot(p);
    p.route = tidy(
      (p.pre || []).concat(
        bfs(from, nearNode(s.x, lane)).map((n) => NODE[n]),
        [
          [s.x, lane],
          [s.x, s.y],
        ]
      )
    );
    p.pre = null;
    p.node = nearNode(s.x, lane);
    p.state = 'go';
  }
  function standUp(p) {
    if (p.joinSeat) {
      p.joinSeat.res = null;
      p.joinSeat = null;
      p.state = 'stay';
      p.stay = 0;
      p.node = nearNode(p.x, p.y);
      return;
    }
    const s = p.desk;
    s.who = null;
    p.desk = null;
    p.seat = null;
    p.roam = true;
    p.pose = 'idle';
    p.pre = [[p.x, laneOf(s)]];
    p.node = nearNode(p.x, laneOf(s));
    p.state = 'stay';
    p.stay = 0;
  }
  function leave(p) {
    if (p.seat || p.joinSeat) standUp(p);
    freeSpot(p);
    p.leaving = true;
    p.route = tidy(
      (p.pre || []).concat(
        bfs(p.pre ? p.node : nearNode(p.x, p.y), 'uL').map((n) => NODE[n]),
        [LIFT]
      )
    );
    p.pre = null;
    p.state = 'go';
    emit('leave', p);
  }
  // one place to turn what the server says into where the person should be
  function apply(p) {
    if (p.leaving || p.errand || p.home || p.hold) return;
    const w = want(p.agent);
    p.st = w === 'working' ? 'w' : w === 'thinking' ? 't' : 'i';
    if (w === 'idle') {
      if (p.seat || p.joinSeat) standUp(p);
    } else if (p.seat) p.pose = w === 'working' ? 'type' : 'think';
    else if (!p.joinSeat) goSit(p);
  }
  function once(p, pose) {
    p.once = { pose, until: performance.now() / 1000 + 2.6 };
    if (pose === 'cheer') burst(p.x, headTop(p) - 2);
    emit(pose, p);
  }

  function nextSpot(p) {
    for (let k = 0; k < p.plan.length; k++) {
      p.pi = (p.pi + 1) % p.plan.length;
      const s = SPOT[p.plan[p.pi]];
      if (s.busy) continue;
      p.mug = p.spot === SPOT.esp;
      if (p.mug) p.coffees++;
      freeSpot(p);
      s.busy = true;
      p.route = tidy(
        (p.pre || []).concat(
          bfs(p.node, s[0]).map((n) => NODE[n]),
          [[s[1], s[2]]]
        )
      );
      p.pre = null;
      p.node = s[0];
      p.spot = s;
      p.state = 'go';
      return true;
    }
    return false;
  }
  // a sub-agent on a break keeps a few steps behind its lead, as an intern would
  function trail(p, lead, dt) {
    if (!lead.trail) {
      lead.trail = [];
      lead.mark = lead.dist;
    }
    if (!p.trailing) {
      const gap = Math.hypot(lead.x - p.x, lead.y - p.y);
      if (gap > 44) {
        if (p.state !== 'go' || !p.route.length) {
          freeSpot(p);
          p.route = tidy(
            (p.pre || []).concat(
              bfs(nearNode(p.x, p.y), nearNode(lead.x, lead.y)).map((n) => NODE[n])
            )
          );
          p.pre = null;
          p.state = 'go';
        }
        walk(p, p.route, 30, dt);
        return;
      }
      freeSpot(p);
      p.route = [];
      p.trailing = true;
    }
    const t = lead.trail.length >= GAP ? lead.trail[0] : null,
      dx = t ? t[0] - p.x : 0,
      dy = t ? t[1] - p.y : 0,
      d = Math.hypot(dx, dy);
    if (t && d > 0.5) {
      const s = Math.min(d, 27 * dt);
      p.x += (dx / d) * s;
      p.y += (dy / d) * s;
      p.dist += s;
      p.dir = d < 3 ? t[2] : facing(dx, dy);
      p.state = 'go';
    } else {
      p.state = 'stay';
      p.stay = 1;
      p.dir = facing(lead.x - p.x, lead.y - p.y);
    }
  }
  function roam(p, dt) {
    const lead = !p.joinSeat && !p.leaving && leadOf(p);
    if (lead && lead.roam && !lead.leaving && !lead.errand) return trail(p, lead, dt);
    if (p.trailing) {
      p.trailing = false;
      p.node = nearNode(p.x, p.y);
      p.state = 'stay';
      p.stay = 1;
    }
    if (p.state === 'go') {
      walk(p, p.route, p.leaving ? 34 : p.joinSeat ? 30 : WALK, dt);
      if (p.route.length) return;
      if (p.leaving) {
        // a wave at the lift doors before going home
        if (!p.bye) {
          p.bye = performance.now();
          p.force = { pose: 'wave', dir: 0 };
          emit('bye', p);
        } else if (performance.now() - p.bye > 1300) drop(p);
        return;
      }
      if (p.joinSeat) return seatDown(p);
      p.state = 'stay';
      p.stay = p.spot ? p.spot[6] * (0.8 + Math.random() * 0.5) : 1;
      p.mug = false;
      return;
    }
    p.stay -= dt;
    if (p.stay > 0) return;
    if (!nextSpot(p)) p.stay = 3;
  }
  // someone called away from their place: walk the route, wait there, and come home by the same way
  function errand(p, dt) {
    const e = p.errand;
    walk(p, e.route, e.speed || 30, dt);
    if (e.route.length) return;
    if (e.home) {
      p.dir = p.home.dir;
      p.home = null;
      p.errand = null;
      if (e.then) e.then(p);
    } else if (!e.done) {
      e.done = true;
      if (e.dir != null) p.dir = e.dir;
      if (e.then) e.then(p);
    }
  }
  function drop(p) {
    const i = P.indexOf(p);
    if (i >= 0) P.splice(i, 1);
    taken.delete(p.name);
    if (p.el) p.el.remove();
    emit('gone', p);
  }

  let recheck = 0;
  return {
    P,
    SEATS,
    guests,
    // a visitor who is not an agent: drawn and walked like anyone else, never listed or counted
    guest(look) {
      const g = Object.assign(
        {
          id: 'g' + seq++,
          guest: true,
          nopip: true,
          name: 'Guest',
          st: 'i',
          pose: 'idle',
          dir: 0,
          dist: 0,
          x: LIFT[0],
          y: LIFT[1],
          roam: false,
          skin: SK[0],
          hair: HR[1],
          shirt: SH[2],
          pants: '#2e3350',
          style: 'short',
          acc: '',
          fit: '',
        },
        look
      );
      guests.push(g);
      return g;
    },
    dismiss(g) {
      const i = guests.indexOf(g);
      if (i >= 0) guests.splice(i, 1);
    },
    add(agent, initial) {
      if (byAgent.has(agent.id)) return this.update(agent);
      const p = person(agent);
      byAgent.set(agent.id, p);
      P.push(p);
      const w = want(agent);
      p.st = w === 'working' ? 'w' : w === 'thinking' ? 't' : 'i';
      if (initial) {
        const s = w !== 'idle' && SEATS.find((x) => !x.who && !x.res);
        if (s) {
          p.joinSeat = s;
          seatDown(p);
        } else {
          for (let k = 0; k < p.plan.length && !p.spot; k++) {
            p.pi = (p.pi + 1) % p.plan.length;
            const sp = SPOT[p.plan[p.pi]];
            if (!sp.busy) p.spot = sp;
          }
          const sp = p.spot || Object.values(SPOT).find((x) => !x.busy);
          if (sp) {
            sp.busy = true;
            p.spot = sp;
            p.x = sp[1];
            p.y = sp[2];
            p.node = sp[0];
            p.stay = 1 + Math.random() * sp[6];
          }
        }
      } else {
        p.fresh = true;
        p.pre = [[LIFT[0], 84]];
        emit('arrive', p);
        apply(p);
      }
      return p;
    },
    update(agent) {
      const p = byAgent.get(agent.id);
      if (!p) return this.add(agent, false);
      const prev = p.agent;
      p.agent = agent;
      const ev = agent.lastEvent;
      if (ev && (!prev.lastEvent || prev.lastEvent.at !== ev.at) && p.seat) {
        if (ev.type === 'done') {
          p.notes = Math.min(4, p.notes + 1);
          p.streak++;
          once(p, 'cheer');
        } else if (ev.type === 'error') {
          p.streak = 0;
          once(p, 'palm');
        }
      }
      apply(p);
      return p;
    },
    remove(id) {
      const p = byAgent.get(id);
      if (!p) return;
      byAgent.delete(id);
      if (p.errand || p.home) {
        p.errand = null;
        p.home = null;
      }
      leave(p);
    },
    clear() {
      P.slice().forEach((p) => {
        if (p.el) p.el.remove();
      });
      P.length = 0;
      byAgent.clear();
      taken.clear();
      SEATS.forEach((s) => {
        s.who = null;
        s.res = null;
      });
      Object.values(SPOT).forEach((s) => {
        s.busy = false;
      });
    },
    find: (id) => byAgent.get(id),
    tick(dt, T) {
      P.slice().forEach((p) => {
        if (p.errand) errand(p, dt);
        else if (p.roam) roam(p, dt);
        if (p.trail && p.dist - p.mark >= 1) {
          p.mark = p.dist;
          p.trail.push([p.x, p.y, p.dir]);
          if (p.trail.length > GAP) p.trail.shift();
        }
        if (p.seat && p.st === 'w') {
          p.worked += dt;
          p.mugs = Math.min(6, 1 + Math.floor(p.worked / 600));
          p.energy = Math.max(8, p.energy - dt / 40);
        } else if (p.roam) p.energy = Math.min(99, p.energy + dt / 12);
      });
      guests.forEach((g) => g.errand && errand(g, dt));
      if (T - recheck > 2) {
        recheck = T;
        P.forEach(apply);
      }
    },
    // o: { pose, dir, speed, then }: what to do on arrival
    send(p, x, y, o) {
      if (p.now === 'sleep' || p.home || p.leaving) return false;
      if (p.joinSeat) standUp(p);
      const out = p.seat ? [[p.x, p.seat === 'F' ? 84 : 188]] : [],
        from = out.length ? out[0] : [p.x, p.y],
        way = tidy(
          out.concat(
            bfs(
              p.roam && p.state === 'stay' && p.spot ? p.node : nearNode(from[0], from[1]),
              nearNode(x, y)
            ).map((n) => NODE[n])
          )
        );
      p.home = { x: p.x, y: p.y, dir: p.dir, way };
      p.errand = Object.assign({ route: way.concat([[x, y]]) }, o);
      return true;
    },
    back(p, then) {
      if (!p.home || (p.errand && p.errand.home)) return;
      p.errand = {
        route: p.home.way
          .slice()
          .reverse()
          .concat([[p.home.x, p.home.y]]),
        home: true,
        speed: p.errand && p.errand.speed,
        then,
      };
    },
    once,
  };
}
