import { LW, LH } from './pixel.js';

const SLACK = 0.012;

// Zoom 0 shows the whole floor (at a whole-number scale when it fits); each step above adds one
// whole pixel of scale. SB is the scale the camera is heading for: on a glide the scale and the
// position ease together and land exactly on it, so pixels never end up stretched.
export function createCamera(stage, cv, { onSmall } = {}) {
  let S = 1,
    OX = 0,
    OY = 0,
    vw = 10,
    vh = 10,
    CX = LW / 2,
    CY = LH / 2,
    TX = LW / 2,
    TY = LH / 2,
    ZM = 0,
    SB = 1,
    RATE = 3.2,
    HOLD = false;

  function aim(glide) {
    const fit = Math.min(vw / LW, vh / LH),
      b = Math.floor(fit + SLACK);
    SB = ZM ? (b >= 1 ? b : 0) + ZM : b >= 1 ? b : fit;
    if (!glide) S = SB;
  }
  function place(soft) {
    OX =
      LW * S >= vw
        ? Math.min(0, Math.max(vw - LW * S, Math.round(vw / 2 - CX * S)))
        : Math.round((vw - LW * S) / 2);
    OY =
      LH * S >= vh
        ? Math.min(0, Math.max(vh - LH * S, Math.round(vh / 2 - CY * S)))
        : Math.round((vh - LH * S) / 2);
    if (!soft) {
      CX = (vw / 2 - OX) / S;
      CY = (vh / 2 - OY) / S;
      TX = CX;
      TY = CY;
    }
    cv.style.cursor = LW * S > vw || LH * S > vh ? 'grab' : '';
  }

  const cam = {
    touched: false,
    to(x, y, z, smooth, rate) {
      if (rate) RATE = rate;
      else if (z !== ZM) RATE = 3.2;
      ZM = z;
      TX = x;
      TY = y;
      HOLD = false;
      aim(!!smooth);
      if (!smooth) {
        CX = x;
        CY = y;
        place();
      } else place(true);
    },
    zoom(d) {
      const z = Math.max(0, Math.min(3, ZM + d));
      if (z === ZM) return;
      ZM = z;
      HOLD = true;
      RATE = 9;
      aim(true);
      place();
    },
    // show an area w by h around a point at the largest whole-number scale that fits it
    frame(x, y, w, h, smooth, rate) {
      const b = Math.floor(Math.min(vw / LW, vh / LH) + SLACK),
        s = Math.max(1, Math.min(Math.floor(vw / w), Math.floor(vh / h)));
      cam.to(x, y, Math.max(0, s - (b >= 1 ? b : 0)), smooth, rate);
    },
    jump(x, y) {
      HOLD = false;
      CX = x;
      CY = y;
      place();
    },
    get z() {
      return ZM;
    },
    get x() {
      return CX;
    },
    get y() {
      return CY;
    },
    get s() {
      return S;
    },
    get size() {
      return [vw, vh];
    },
    view: () => [(0 - OX) / S, (0 - OY) / S, vw / S, vh / S],
    toScreen: (x, y) => [OX + x * S, OY + y * S],
    toWorld(clientX, clientY) {
      const r = cv.getBoundingClientRect();
      return [(clientX - r.left - OX) / S, (clientY - r.top - OY) / S];
    },
    tick(dt) {
      const ease = 1 - Math.exp(-(dt || 0.016) * RATE);
      if (S !== SB) {
        S = Math.abs(SB - S) < 0.003 ? SB : S + (SB - S) * ease;
        place(!HOLD);
        if (S === SB && HOLD) {
          HOLD = false;
          RATE = 3.2;
        }
      }
      if (Math.abs(TX - CX) + Math.abs(TY - CY) > 0.4) {
        CX += (TX - CX) * ease;
        CY += (TY - CY) * ease;
        place(true);
      }
    },
    layout() {
      vw = Math.max(10, stage.clientWidth);
      vh = Math.max(10, stage.clientHeight);
      cv.width = vw;
      cv.height = vh;
      aim(false);
      place();
      // a screen too small for the whole floor at 2x opens on the desks instead: drag to look around
      if (!cam.touched) {
        const small = Math.min(vw / LW, vh / LH) + SLACK < 2;
        if (small) cam.to(300, 128, vw < LW ? 2 : 1);
        else cam.to(320, 180, 0);
        if (onSmall) onSmall(small);
      }
    },
    home() {
      cam.touched = false;
      cam.layout();
    },
    blit(ctx, base) {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05060d';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0, LW, LH, OX, OY, LW * S, LH * S);
    },
  };
  return cam;
}
