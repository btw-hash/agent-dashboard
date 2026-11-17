import { text, tone } from '../engine/pixel.js';

const NW = 320,
  NH = 180,
  COLS = 6,
  ROWS = 4;
const WINS2 = [];
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) WINS2.push({ x: 78 + c * 28, y: 42 + r * 30 });

export function createNight(office, host) {
  const { P, CAT } = office;
  const cv = document.createElement('canvas');
  cv.className = 'bx-night';
  cv.width = NW;
  cv.height = NH;
  cv.setAttribute('aria-label', 'The office building at night, one window per agent');
  const tag = document.createElement('div');
  tag.className = 'tag bx-ntag';
  tag.hidden = true;
  const tags = document.createElement('div');
  tags.className = 'tags';
  tags.appendChild(tag);
  host.append(cv, tags);
  const nx = cv.getContext('2d');
  let hover = -1;

  const tenants = () => (P.length < WINS2.length ? P.concat([CAT]) : P.slice(0, WINS2.length));

  function draw(T) {
    const R = (x, y, w, h, c) => {
      nx.fillStyle = c;
      nx.fillRect(x | 0, y | 0, w | 0, h | 0);
    };
    nx.imageSmoothingEnabled = false;
    nx.globalAlpha = 1;
    const sk = nx.createLinearGradient(0, 0, 0, NH);
    sk.addColorStop(0, '#070b24');
    sk.addColorStop(0.6, '#1b1f52');
    sk.addColorStop(1, '#4a3570');
    nx.fillStyle = sk;
    nx.fillRect(0, 0, NW, NH);
    for (let i = 0; i < 60; i++)
      if ((((T * 1.4) | 0) + i) % 6)
        R((i * 73 + 11) % NW, (i * 37 + 5) % 104, 1, 1, i % 7 ? '#c8d3f5' : '#fff');
    const sh = (T * 0.07) % 1;
    if (sh < 0.06) {
      const q = sh / 0.06;
      R(40 + q * 120, 20 + q * 40, 6, 1, '#fff');
      R(34 + q * 120, 18 + q * 40, 6, 1, 'rgba(255,255,255,.4)');
    }
    R(262, 6, 34, 34, 'rgba(246,241,208,.05)');
    R(266, 10, 26, 26, 'rgba(246,241,208,.07)');
    R(272, 16, 14, 14, '#f6f1d0');
    R(277, 13, 12, 12, '#0c1030');
    for (let i = 0; i < 3; i++) {
      const x = ((T * (2.5 + i) + i * 140) % (NW + 90)) - 70,
        y = 26 + i * 20;
      R(x, y, 48, 5, 'rgba(70,80,150,.45)');
      R(x + 9, y - 3, 26, 4, 'rgba(70,80,150,.45)');
      R(x + 16, y + 5, 24, 2, 'rgba(70,80,150,.3)');
    }
    const pl = ((T * 13) % (NW + 60)) - 30;
    R(pl, 14, 3, 1, '#c8d3f5');
    R(pl - 2, 13, 2, 1, '#8b90a8');
    if (((T * 3) | 0) % 2) R(pl + 3, 14, 1, 1, '#ff4b4b');
    for (let i = 0; i < 15; i++) {
      const x = i * 23 - 6,
        h = 34 + ((i * 37) % 44);
      R(x, NH - h - 8, 21, h, '#1a1f4a');
      for (let k = 0; k < 5; k++)
        if ((i * 3 + k * 7) % 5 < 2)
          R(
            x + 3 + (k % 3) * 6,
            NH - h - 2 + ((k * 5) % (h - 12)),
            2,
            3,
            Math.sin(T * 0.5 + i + k) > 0.2 ? '#5a66b8' : '#2a3170'
          );
    }
    [
      [0, 104, 46, '#11142e'],
      [40, 88, 28, '#151838'],
      [256, 96, 38, '#151838'],
      [290, 114, 30, '#11142e'],
    ].forEach((b, i) => {
      R(b[0], b[1], b[2], NH - b[1], b[3]);
      R(b[0], b[1], b[2], 2, '#232847');
      for (let k = 0; k < 9; k++) {
        const on = (k * 5 + i * 3) % 4 === 0 || ((T * 0.2 + k + i) | 0) % 9 === 0;
        R(b[0] + 4 + (k % 3) * 9, b[1] + 8 + ((k / 3) | 0) * 14, 4, 5, on ? '#ffd39a' : '#1c2148');
      }
    });
    R(46, 78, 3, 10, '#151838');
    for (let i = 0; i < 3; i++) {
      const q = (T * 0.3 + i / 3) % 1;
      nx.globalAlpha = 0.5 * (1 - q);
      R(45 + Math.sin(T + i) * 2 + q * 6, 74 - q * 22, 4 + q * 4, 3, '#8b90a8');
    }
    nx.globalAlpha = 1;
    R(8, 92, 14, 12, '#1c2148');
    R(10, 104, 2, 4, '#1c2148');
    R(18, 104, 2, 4, '#1c2148');
    R(8, 92, 14, 2, '#2a2f5c');
    R(258, 80, 34, 14, '#0b0d22');
    R(260, 82, 30, 10, '#11142e');
    text(nx, 'OPEN', 267, 85, Math.sin(T * 2.1) > -0.85 ? '#39d3ff' : '#1f4a5a');
    R(272, 94, 2, 4, '#0b0d22');
    R(280, 94, 2, 4, '#0b0d22');
    R(66, 28, 188, 152, '#1c2040');
    R(66, 28, 3, 152, '#262b55');
    R(251, 28, 3, 152, '#151833');
    R(62, 24, 196, 5, '#2a2f5c');
    R(62, 24, 196, 1, '#3d4480');
    for (let r = 1; r < 4; r++) R(66, 36 + r * 30, 188, 1, '#232847');
    for (let i = 0; i < 40; i++) R(70 + ((i * 47) % 180), 32 + ((i * 29) % 140), 2, 1, '#20244a');
    R(78, 10, 18, 12, '#232847');
    R(78, 10, 18, 2, '#3d4480');
    R(80, 22, 2, 3, '#151833');
    R(92, 22, 2, 3, '#151833');
    R(196, 18, 12, 6, '#2a2f5c');
    R(198, 20, 3, 2, '#151833');
    R(212, 19, 9, 5, '#2a2f5c');
    R(240, 6, 2, 18, '#11142b');
    R(240, 4, 2, 2, ((T * 1.5) | 0) % 2 ? '#ff4b4b' : '#5a1a1a');
    R(108, 8, 56, 14, '#0b0d22');
    R(110, 10, 52, 11, '#0f1126');
    text(nx, 'AGENT OFFICE', 113, 13, Math.sin(T * 1.3 + 7) > 0.96 ? '#7a2a6c' : '#ff4fd8');

    const L = tenants();
    WINS2.forEach((w, i) => {
      const p = L[i],
        x = w.x,
        y = w.y;
      R(x - 1, y - 1, 24, 18, '#0f1126');
      if (!p) {
        R(x, y, 22, 16, '#171a36');
        R(x + 2, y + 10, 6, 6, '#11142b');
      } else if (p === CAT) {
        R(x, y, 22, 16, '#1d2147');
        R(x + 8, y + 9, 8, 7, '#11142b');
        R(x + 8, y + 6, 2, 3, '#11142b');
        R(x + 14, y + 6, 2, 3, '#11142b');
        if (((T * 0.7) | 0) % 5) {
          R(x + 10, y + 11, 1, 1, '#ffe066');
          R(x + 13, y + 11, 1, 1, '#ffe066');
        }
      } else if (p.now === 'sleep') {
        R(x, y, 22, 16, '#141733');
        const q = (T * 0.4) % 1;
        nx.globalAlpha = Math.sin(q * Math.PI);
        R(x + 9 + q * 6, y + 10 - q * 7, 3, 1, '#c8d3f5');
        R(x + 10 + q * 6, y + 11 - q * 7, 1, 1, '#c8d3f5');
        R(x + 9 + q * 6, y + 12 - q * 7, 3, 1, '#c8d3f5');
        nx.globalAlpha = 1;
      } else if (p.st === 'i') {
        R(
          x,
          y,
          22,
          16,
          Math.sin(T * 9 + i) + Math.sin(T * 3.7 + i * 2) > 0.4 ? '#5c8dff' : '#33407a'
        );
        R(x + 5, y + 11, 12, 5, '#1c2040');
        R(x + 9, y + 7, 5, 5, '#1c2040');
      } else {
        const think = p.st === 't',
          bob = think ? 0 : ((T * (7 + (i % 3))) | 0) % 2,
          sway = think ? Math.round(Math.sin(T * 0.9 + i) * 4) : 0;
        R(x, y, 22, 16, think ? '#d8c2ff' : '#ffd39a');
        R(x, y, 22, 3, think ? '#ece0ff' : '#fff0cf');
        if (i % 3 === 0) {
          R(x, y, 3, 16, think ? '#a98fe0' : '#e09a5c');
          R(x + 19, y, 3, 16, think ? '#a98fe0' : '#e09a5c');
        }
        if (i % 4 === 1) {
          R(x + 2, y + 11, 3, 5, '#3f9b5b');
          R(x + 1, y + 9, 5, 3, '#57b86c');
        }
        R(x + 8 + sway, y + 5 + bob, 6, 5, tone(p.hair, -0.3));
        R(x + 6 + sway, y + 10 + bob, 10, 6, tone(p.shirt, -0.25));
        if (!think) {
          R(x + 16, y + 8, 5, 6, '#1c2036');
          R(x + 17, y + 10, 3, 1, ['#7aa2f7', '#9ece6a'][((T * 6 + i) | 0) % 2]);
        }
        if (p.once) {
          R(x + 2, y + 2, 2, 2, '#fff');
          R(x + 18, y + 3, 2, 2, '#ffd23f');
          R(x + 5, y + 4, 1, 1, '#f7768e');
        }
      }
      R(x + 10, y, 2, 16, '#2a2f5c');
      R(x - 1, y + 16, 24, 2, '#2a2f5c');
      R(x - 1, y + 16, 24, 1, '#3d4480');
      if (i === hover && p) {
        nx.strokeStyle = '#fff';
        nx.lineWidth = 1;
        nx.strokeRect(x - 1.5, y - 1.5, 25, 18 + 1);
      }
    });
    R(142, 152, 36, 4, '#7a2f3f');
    for (let i = 0; i < 6; i++) R(142 + i * 6, 152, 3, 4, '#a85050');
    R(152, 158, 16, 16, '#11142b');
    R(154, 160, 12, 14, '#ffd39a');
    R(159, 160, 2, 14, '#11142b');
    R(148, 174, 24, 2, '#2a2f5c');
    R(0, 174, NW, 2, '#232847');
    R(0, 176, NW, 4, '#0b0d22');
    for (let i = 0; i < NW; i += 18) R(i, 178, 8, 1, '#232847');
    [26, 118, 206, 300].forEach((x) => {
      nx.fillStyle = 'rgba(255,211,154,.10)';
      nx.beginPath();
      nx.moveTo(x + 1, 150);
      nx.lineTo(x - 12, 174);
      nx.lineTo(x + 14, 174);
      nx.fill();
      R(x, 148, 2, 26, '#3a3f5c');
      R(x - 2, 146, 6, 3, '#ffd39a');
      R(x - 2, 146, 6, 1, '#fff0cf');
    });
    [
      [56, 150],
      [276, 152],
    ].forEach((t) => {
      R(t[0] + 5, t[1] + 12, 2, 12, '#3b2a1e');
      R(t[0], t[1], 12, 10, '#1f4a36');
      R(t[0] + 2, t[1] - 3, 8, 5, '#255a40');
      R(t[0] + 3, t[1] + 2, 3, 2, '#2f7a52');
    });
    R(88, 168, 14, 2, '#3b2a1e');
    R(89, 170, 2, 4, '#3b2a1e');
    R(99, 170, 2, 4, '#3b2a1e');
    R(88, 164, 14, 1, '#3b2a1e');
    const car = ((T * 26) % (NW + 80)) - 40;
    R(car, 171, 16, 5, '#23263a');
    R(car + 3, 168, 9, 3, '#2e3350');
    R(car + 15, 173, 2, 1, '#fff6c8');
    nx.fillStyle = 'rgba(255,246,200,.12)';
    nx.fillRect(car + 17, 172, 12, 3);
    R(car - 1, 173, 1, 1, '#ff4b4b');
  }

  function aim(e) {
    const r = cv.getBoundingClientRect(),
      s = Math.min(r.width / NW, r.height / NH),
      ox = (r.width - NW * s) / 2,
      oy = (r.height - NH * s) / 2,
      x = (e.clientX - r.left - ox) / s,
      y = (e.clientY - r.top - oy) / s,
      L = tenants();
    hover = WINS2.findIndex((w, i) => L[i] && x >= w.x && x < w.x + 22 && y >= w.y && y < w.y + 16);
    if (hover < 0) {
      tag.hidden = true;
      return;
    }
    const p = L[hover],
      w = WINS2[hover];
    tag.hidden = false;
    tag.textContent = p.name + ' · ' + office.act(p);
    tag.style.left = ox + (w.x + 11) * s + 'px';
    tag.style.top = oy + (w.y - 3) * s + 'px';
  }
  cv.addEventListener('pointermove', aim);
  cv.addEventListener('pointerdown', aim);
  cv.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    hover = -1;
    tag.hidden = true;
  });

  return {
    el: cv,
    frames: 0,
    tenants,
    frame(T) {
      this.frames++;
      draw(T);
    },
  };
}
