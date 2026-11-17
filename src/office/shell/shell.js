import { LW, LH } from '../engine/pixel.js';

const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );
const FEED = [
  'The goose was seen near the cafe again.',
  'Cat status: in charge.',
  'Whiteboard gets wiped at midnight. Save your boxes and arrows.',
  'Reminder: the plant by the printers likes water.',
  'The lift is working as intended. Mostly.',
  'Fresh coffee in the cafe.',
];
const TIMES = [null, 10, 19.6, 23];

export function createShell(office, net) {
  const { P, CAT, ROOMS, cam } = office;
  const app = $('#app');
  let follow = null,
    tv = false,
    chosen = null,
    awaited = null,
    lastEvent = null;
  const touch = () => {
    cam.touched = true;
  };
  const isMobile = () => innerWidth <= 760;

  function counts() {
    const w = P.filter((p) => p.st === 'w').length,
      t = P.filter((p) => p.st === 't').length;
    return [w, t, P.length - w - t];
  }
  let teamSig = '';
  function drawTeam(force) {
    const sig = P.map((p) => p.id + p.st).join() + (chosen ? chosen.id || 'cat' : '');
    if (!force && sig === teamSig) return;
    teamSig = sig;
    const c = counts();
    $('#count').innerHTML =
      '<span><i class="dot w"></i>' +
      c[0] +
      ' working</span><span><i class="dot t"></i>' +
      c[1] +
      ' thinking</span><span><i class="dot"></i>' +
      c[2] +
      ' on a break</span>';
    $('#teamN').textContent = P.length;
    const order = P.slice().sort((a, b) => 'wti'.indexOf(a.st) - 'wti'.indexOf(b.st));
    $('#list').innerHTML = order
      .map(
        (p) =>
          '<li><button class="who" data-id="' +
          p.id +
          '" aria-pressed="' +
          (p === chosen) +
          '"><i class="dot ' +
          (p.st === 'i' ? '' : p.st) +
          '"></i><b>' +
          esc(p.name) +
          '</b><span>' +
          esc(office.act(p)) +
          '</span></button></li>'
      )
      .join('');
    document.title = (c[0] ? '(' + c[0] + ') ' : '') + 'Agent Office';
  }
  $('#list').addEventListener('click', (e) => {
    const b = e.target.closest('.who');
    if (!b) return;
    const p = P.find((x) => x.id === b.dataset.id);
    if (!p) return;
    pick(p, true);
    if (isMobile()) setTeam(false);
  });

  const nowText = (p) =>
    p === CAT
      ? office.act(p)
      : p.st === 'w' && p.seat && p.agent.currentToolLabel
        ? p.agent.currentToolLabel
        : office.act(p);
  function pick(a, fly) {
    chosen = a && (a === CAT || !a.kind) ? a : null;
    office.picked = chosen;
    follow = null;
    const c = $('#card');
    if (!chosen) {
      c.hidden = true;
      drawTeam(true);
      return;
    }
    const p = chosen;
    c.innerHTML =
      '<div><h3>' +
      esc(p.name) +
      '</h3><div class="role">' +
      esc(p.role) +
      '</div></div><div class="now" id="cardNow"></div>' +
      '<div class="meter"><span>energy</span><i><u id="cardBar"></u></i><span id="cardPct"></span></div>' +
      '<div class="row facts"><span>mood: <b>' +
      esc(p.mood) +
      '</b></span><span>coffees: <b id="cardCups"></b></span></div>' +
      '<div class="quote">&ldquo;' +
      esc(p.quote) +
      '&rdquo;</div><div class="row"><button class="btn" id="fl" aria-pressed="false">Follow</button><button class="btn" id="cx">Close</button></div>';
    c.hidden = false;
    $('#cx').onclick = () => pick(null);
    $('#fl').onclick = (e) => {
      follow = follow ? null : p;
      e.currentTarget.setAttribute('aria-pressed', !!follow);
      touch();
    };
    cardLive();
    if (fly) {
      touch();
      cam.frame(p.x, p.y - 12, 420, 250, true);
    }
    drawTeam(true);
  }
  function cardLive() {
    if (!chosen) return;
    if (chosen !== CAT && !P.includes(chosen)) return pick(null);
    const e = Math.round(chosen.energy);
    $('#cardNow').textContent = nowText(chosen);
    $('#cardBar').style.width = e + '%';
    $('#cardPct').textContent = e + '%';
    $('#cardCups').textContent = chosen.coffees;
  }
  office.on('pick', (a) => {
    if (a && (a.kind === 'game' || a.kind === 'door')) return;
    pick(a, false);
  });
  office.on('drag', () => {
    follow = null;
    const f = $('#fl');
    if (f) f.setAttribute('aria-pressed', 'false');
  });

  function toast(msg, bad) {
    const t = document.createElement('div');
    t.className = 'toast panel' + (bad ? ' bad' : '');
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 3300);
  }
  let feedI = 0;
  const feedHot = [];
  function news() {
    const el = $('#news'),
      msg = feedHot.length ? feedHot.shift() : FEED[feedI++ % FEED.length];
    el.style.opacity = 0;
    setTimeout(() => {
      el.textContent = msg;
      el.style.opacity = 1;
    }, 300);
  }
  office.on('event', (type, p) => {
    if (type === 'cheer') {
      lastEvent = { p, at: performance.now() };
      feedHot.push(p.name + ' finished a task.');
      if (!tv) toast(p.name + ' finished a task');
    }
    if (type === 'palm') {
      lastEvent = { p, at: performance.now() };
      feedHot.push(p.name + ' hit a tool error. Again.');
      if (!tv) toast(p.name + ' hit a tool error', true);
    }
    if (type === 'join') {
      feedHot.push(p.name + ' joined the office.');
      toast(p.name + ' is at the desk');
    }
    if (type === 'arrive' && awaited && p.name === awaited) {
      awaited = null;
      pick(p, false);
      touch();
      cam.frame(520, 110, 420, 250, true);
      follow = p;
      $('#fl').setAttribute('aria-pressed', 'true');
    }
    if (type === 'gone') feedHot.push(p.name + ' went home.');
  });
  office.on('net', (what) => {
    if (what === 'sim') {
      $('#modeTag').hidden = false;
      $('#tryLede').textContent =
        'This demo runs on simulated agents. Send it an event and watch who walks out of the lift.';
    }
    if (what === 'down') toast('Lost the connection to the office server', true);
    if (what === 'up') drawTeam(true);
  });

  let timeI = 0;
  function clock() {
    $('#clock').textContent =
      office.clock() +
      (isMobile() ? '' : ' ' + office.phase().toUpperCase() + (timeI === 0 ? ' · LIVE' : ''));
    $('#tvclock').textContent = office.clock();
  }
  $('#clock').onclick = () => {
    timeI = (timeI + 1) % TIMES.length;
    if (TIMES[timeI] === null) office.setAuto();
    else office.setHour(TIMES[timeI]);
    clock();
  };
  $('#zin').onclick = () => {
    touch();
    cam.zoom(1);
  };
  $('#zout').onclick = () => {
    touch();
    cam.zoom(-1);
  };

  const mini = $('#mini'),
    mx = mini.getContext('2d');
  mx.imageSmoothingEnabled = false;
  function miniGo(e) {
    const r = mini.getBoundingClientRect();
    touch();
    follow = null;
    cam.to(
      ((e.clientX - r.left) / r.width) * LW,
      ((e.clientY - r.top) / r.height) * LH,
      Math.max(1, cam.z)
    );
  }
  let miniDown = false;
  mini.addEventListener('pointerdown', (e) => {
    miniDown = true;
    mini.setPointerCapture(e.pointerId);
    miniGo(e);
  });
  mini.addEventListener('pointermove', (e) => {
    if (miniDown) miniGo(e);
  });
  mini.addEventListener('pointerup', () => {
    miniDown = false;
  });

  // TV mode: no panels, a director picks what to look at
  let shotAt = 0,
    shotI = 0,
    subject = null;
  function shot() {
    shotI++;
    subject = null;
    const hot =
        lastEvent && performance.now() - lastEvent.at < 9000 && P.includes(lastEvent.p)
          ? lastEvent.p
          : null,
      k = shotI % 4;
    if (hot && k !== 0) {
      subject = hot;
      lastEvent = null;
    } else if (k === 1) {
      const m = P.filter((p) => p.roam && p.state === 'go');
      subject = m[shotI % Math.max(1, m.length)] || P[shotI % Math.max(1, P.length)] || null;
    } else if (k === 3) {
      const m = P.filter((p) => p.seat);
      subject = m[(shotI * 5) % Math.max(1, m.length)] || null;
    }
    if (subject) {
      cam.frame(subject.x, subject.y - 12, 330, 190, true, 1.9);
      $('#tvA').textContent = subject.name;
      $('#tvB').textContent = office.act(subject) + ' · ' + subject.role;
      return;
    }
    if (k === 2) {
      const r = ROOMS[(shotI >> 2) % 4],
        n = P.filter((p) => p.y > 240 && p.x >= r.x0 && p.x < r.x1).length;
      cam.frame((r.x0 + r.x1) / 2, 284, r.x1 - r.x0 + 12, 160, true, 1.9);
      $('#tvA').textContent = r.name;
      $('#tvB').textContent = n === 1 ? '1 person inside' : n + ' people inside';
      return;
    }
    const c = counts();
    cam.to(320, 180, 0, true, 1.9);
    $('#tvA').textContent = 'AGENT OFFICE';
    $('#tvB').textContent = c[0] + ' working · ' + c[1] + ' thinking · ' + c[2] + ' on a break';
  }
  function setTv(on) {
    tv = on;
    app.classList.toggle('tv', on);
    ['#tvcap', '#tvclock', '#tvX'].forEach((s) => ($(s).hidden = !on));
    $('#veil').hidden = true;
    follow = null;
    if (on) {
      pick(null);
      cam.touched = true;
      shotI = 0;
      shotAt = 0;
    } else cam.home();
    office.emit('tv', on);
  }
  $('#tvBtn').onclick = () => setTv(true);
  $('#tvX').onclick = () => setTv(false);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#veil').hidden) $('#veil').hidden = true;
    else if (tv) setTv(false);
  });

  $('#connectBtn').onclick = () => {
    $('#veil').hidden = false;
  };
  $('#shX').onclick = () => {
    $('#veil').hidden = true;
  };
  $('#veil').addEventListener('pointerdown', (e) => {
    if (e.target.id === 'veil') $('#veil').hidden = true;
  });
  $$('.cp').forEach(
    (b) =>
      (b.onclick = () => {
        const el = $('#' + b.dataset.c),
          ok = () => {
            b.textContent = 'Copied';
            setTimeout(() => (b.textContent = 'Copy'), 1400);
          };
        const fallback = () => {
          const r = document.createRange();
          r.selectNodeContents(el);
          const s = getSelection();
          s.removeAllRanges();
          s.addRange(r);
          try {
            if (document.execCommand('copy')) ok();
            else b.textContent = 'Select + copy';
          } catch {
            b.textContent = 'Select + copy';
          }
        };
        try {
          navigator.clipboard.writeText(el.textContent.trim()).then(ok, fallback);
        } catch {
          fallback();
        }
      })
  );
  $$('.st').forEach(
    (b) =>
      (b.onclick = async () => {
        const name = ($('#tryName').value.trim() || 'my-bot').slice(0, 14),
          state = b.dataset.s,
          msg = $('#tryMsg'),
          known = P.some((p) => p.name === name);
        if (!known) awaited = name;
        const ok = await net.report(name, state).catch(() => false);
        msg.textContent = !ok
          ? 'The office server refused the event.'
          : known
            ? name + ' is now ' + state + '.'
            : name + ' is walking in from the lift. Close this sheet to watch.';
      })
  );

  function setTeam(on) {
    app.classList.toggle('team', on);
    $('#teamBtn').setAttribute('aria-pressed', on);
  }
  $('#teamBtn').onclick = () => setTeam(!app.classList.contains('team'));

  let slow = 0;
  office.onFrame.push((T) => {
    if (follow) {
      if (P.includes(follow) || follow === CAT) cam.to(follow.x, follow.y - 12, cam.z, true);
      else follow = null;
    }
    if (tv) {
      if (T - shotAt > 7) {
        shotAt = T;
        shot();
      }
      if (subject && P.includes(subject)) {
        cam.to(subject.x, subject.y - 12, cam.z, true);
        $('#tvB').textContent = office.act(subject) + ' · ' + subject.role;
      }
    }
    if (!isMobile()) {
      mx.drawImage(office.base, 0, 0, 160, 90);
      const v = cam.view();
      mx.strokeStyle = '#fff';
      mx.lineWidth = 1;
      mx.strokeRect(
        Math.max(0, v[0] / 4) + 0.5,
        Math.max(0, v[1] / 4) + 0.5,
        Math.min(159, v[2] / 4),
        Math.min(89, v[3] / 4)
      );
    }
    if (T - slow > 0.6) {
      slow = T;
      clock();
      cardLive();
      drawTeam();
      $$('.who').forEach((b) => {
        const p = P.find((x) => x.id === b.dataset.id);
        if (!p) return;
        const s = b.lastElementChild,
          a = office.act(p);
        if (s.textContent !== a) s.textContent = a;
      });
    }
  });

  drawTeam(true);
  clock();
  news();
  setInterval(news, 5200);
  return { toast, pick, setTv, news: (msg) => feedHot.push(msg), isTv: () => tv };
}
