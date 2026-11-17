import './bonus.css';
import { DOORS } from '../world/plan.js';
import { furnish } from '../world/furnish.js';
import { createTerminal } from './terminal.js';
import { createNight } from './night.js';
import { createMini } from './mini3d.js';

const CAPS = { terminal: 'TERMINAL', night: 'WINDOWS AT NIGHT', mini: '3D MINIATURE' };
const IDLE_MS = 5 * 60 * 1000;
const PRINT_MS = 1500;

// Three read-only views of the same live office, entered from the server rack, the telescope and
// the 3D printer. The sprites and wall pieces are collected by running the furniture list once
// against collectors, because the office keeps its own lists private.
export function installBonus(office, shell) {
  const app = document.querySelector('#app'),
    items = [],
    walls = [];
  furnish({
    g: null,
    px() {},
    put0: (s, x, y, b) => items.push({ s, x, y, b }),
    wall: (s, x, y) => walls.push({ s, x, y }),
    Office: { P: office.P, lift: null },
  });

  const root = document.createElement('div');
  root.className = 'bx';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.innerHTML =
    '<div class="bx-view bx-vterm" data-v="terminal" hidden></div>' +
    '<div class="bx-view bx-vnight" data-v="night" hidden></div>' +
    '<div class="bx-view bx-vmini" data-v="mini" hidden><div class="bx-host"></div>' +
    '<div class="bx-print"><b class="bx-msg">PRINTING THE OFFICE</b><div class="bx-bar"><i></i></div></div></div>' +
    '<div class="bx-top"><button class="btn bx-exit" type="button" aria-label="Exit view">EXIT</button>' +
    '<span class="bx-cap"></span><span class="bx-cams" hidden>' +
    '<button class="btn" type="button" data-c="corner" aria-pressed="true">Corner</button>' +
    '<button class="btn" type="button" data-c="front" aria-pressed="false">Front cut-away</button>' +
    '<button class="btn" type="button" data-c="walk" aria-pressed="false">Walk-in</button></span></div>';
  app.appendChild(root);
  const $ = (s) => root.querySelector(s),
    views = {
      terminal: $('[data-v=terminal]'),
      night: $('[data-v=night]'),
      mini: $('[data-v=mini]'),
    },
    print = $('.bx-print'),
    msg = $('.bx-msg'),
    cams = $('.bx-cams');

  const term = createTerminal(office, views.terminal, items),
    night = createNight(office, views.night),
    mini = createMini(office, $('.bx-host'), { items, walls });

  let view = null,
    byIdle = false,
    pending = 0,
    miniLive = false,
    miniTok = 0,
    lastAct = performance.now();
  const bonus = { idleMs: IDLE_MS };

  function tick(T) {
    if (view === 'terminal') term.frame(T);
    else if (view === 'night') night.frame(T);
    else if (view === 'mini' && miniLive) mini.frame(T);
  }
  const hooked = () => office.onFrame.includes(tick);

  const blocked = () =>
    shell.isTv() ||
    !!document.querySelector('.cabveil:not([hidden])') ||
    !document.querySelector('#veil').hidden;

  async function startMini() {
    const tok = ++miniTok,
      fresh = !mini.ready,
      t0 = performance.now();
    miniLive = false;
    print.hidden = !fresh;
    if (fresh) {
      msg.textContent = 'PRINTING THE OFFICE';
      const bar = $('.bx-bar i');
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
      $('.bx-bar').hidden = false;
    }
    try {
      await mini.load();
    } catch (e) {
      if (tok === miniTok && view === 'mini') {
        msg.textContent = /webgl/i.test(e.message)
          ? 'NO WEBGL ON THIS DEVICE'
          : 'THE 3D ENGINE DID NOT LOAD';
        $('.bx-bar').hidden = true;
        print.hidden = false;
      }
      return;
    }
    const left = fresh ? Math.max(0, PRINT_MS - (performance.now() - t0)) : 0;
    setTimeout(() => {
      if (tok !== miniTok || view !== 'mini') return;
      print.hidden = true;
      mini.size();
      miniLive = true;
    }, left);
  }

  function close() {
    clearTimeout(pending);
    pending = 0;
    if (!view) return;
    views[view].hidden = true;
    root.hidden = true;
    cams.hidden = true;
    miniTok++;
    miniLive = false;
    const i = office.onFrame.indexOf(tick);
    if (i >= 0) office.onFrame.splice(i, 1);
    view = null;
    byIdle = false;
    lastAct = performance.now();
  }

  function open(id, idle) {
    close();
    const d = DOORS.find((x) => x.id === id),
      el = views[id],
      s = office.cam.toScreen(d.x, d.y);
    el.style.setProperty('--ox', s[0] + 'px');
    el.style.setProperty('--oy', s[1] + 'px');
    view = id;
    byIdle = !!idle;
    el.hidden = false;
    root.hidden = false;
    $('.bx-cap').textContent = CAPS[id] + (idle ? ' · SCREENSAVER' : '');
    cams.hidden = id !== 'mini';
    office.onFrame.push(tick);
    if (id === 'terminal') term.show(performance.now() / 1000);
    if (id === 'mini') startMini();
  }

  function go(id) {
    if (view || pending || blocked()) return;
    const d = DOORS.find((x) => x.id === id);
    office.cam.touched = true;
    office.cam.frame(d.x, d.y + 14, 300, 170, true);
    pending = setTimeout(() => {
      pending = 0;
      open(id);
    }, 850);
  }

  $('.bx-exit').onclick = close;
  cams.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    mini.setCam(b.dataset.c);
    cams.querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', o === b));
  });
  new ResizeObserver(() => {
    if (view === 'mini' && miniLive) mini.size();
  }).observe(root);

  office.on(
    'pick',
    (a) => {
      if (!a || a.kind !== 'door') return false;
      go(a.id);
      return true;
    },
    true
  );
  office.on('tv', (on) => on && close());

  const typing = (t) => /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
  window.addEventListener(
    'keydown',
    (e) => {
      lastAct = performance.now();
      if (view && byIdle) return close();
      if (e.key === 'Escape' && (view || pending)) {
        e.stopPropagation();
        e.preventDefault();
        close();
      } else if (
        (e.key === '`' || e.code === 'Backquote') &&
        !typing(e.target) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (view === 'terminal') close();
        else if (!blocked()) {
          clearTimeout(pending);
          pending = 0;
          open('terminal');
        }
      }
    },
    true
  );
  ['pointermove', 'pointerdown', 'wheel', 'touchstart'].forEach((t) =>
    window.addEventListener(
      t,
      () => {
        lastAct = performance.now();
        if (view && byIdle) close();
      },
      { passive: true, capture: true }
    )
  );
  setInterval(() => {
    if (!view && !pending && !blocked() && performance.now() - lastAct > bonus.idleMs)
      open('night', true);
  }, 500);

  return Object.assign(bonus, {
    open: (id) => open(id),
    go,
    close,
    current: () => view,
    state: () => ({
      view,
      hooked: hooked(),
      frames: { terminal: term.frames, night: night.frames, mini: mini.frames },
      glRenders: mini.renders(),
      glPeople: mini.people(),
      miniLive,
      nightPeople: night.tenants().filter((p) => p !== office.CAT).length,
    }),
    probe: (p) => mini.probe(p),
  });
}
