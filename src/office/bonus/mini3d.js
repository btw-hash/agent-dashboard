import { LW, LH, mk, text } from '../engine/pixel.js';
import { WINS, ROOMS, paintBg } from '../world/plan.js';
import { F, chairTop, chairBack } from '../art/furniture.js';
import { sitting } from '../world/crowd.js';

const fz = (y) => (y < 206 ? (y - 46) / 10 : y < 240 ? 16 + (y - 206) / 85 : 16.4 + (y - 240) / 10);
const TURN = [0, Math.PI, Math.PI / 2, -Math.PI / 2];
const DIRS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

function avgColor(s) {
  const d = s.getContext('2d').getImageData(0, 0, s.width, s.height).data;
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (let i = 0; i < d.length; i += 12)
    if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] > 150) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      n++;
    }
  return n ? [(r / n) | 0, (g / n) | 0, (b / n) | 0] : [115, 120, 150];
}

// The model is papercraft: floors and walls carry the painted 2D floor, every piece of furniture
// is a block with its own sprite on the front face. Furniture is built once; people are live.
export function createMini(office, host, { items, walls }) {
  let M = null,
    camMode = 'corner',
    lead = null,
    leadAt = 0,
    last = 0,
    loading = null;

  async function build() {
    const THREE = await import('three');
    const rn = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const big = host.clientWidth > 700;
    rn.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rn.shadowMap.enabled = true;
    rn.shadowMap.type = THREE.PCFShadowMap;
    rn.domElement.className = 'bx-gl';
    host.appendChild(rn.domElement);
    const sc = new THREE.Scene(),
      cam = new THREE.PerspectiveCamera(34, 1, 0.5, 500),
      C = (h) => new THREE.Color(h),
      lam = (o) => new THREE.MeshLambertMaterial(o),
      bgc = mk(LW, LH);
    paintBg(bgc);
    const PI = Math.PI;
    sc.add(new THREE.HemisphereLight(0xffffff, 0xc8b8a0, 0.9 * PI));
    const sun = new THREE.DirectionalLight(0xfff1d6, 0.75 * PI);
    sun.position.set(14, 48, 34);
    sun.castShadow = true;
    sun.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024);
    sun.shadow.bias = -0.0006;
    Object.assign(sun.shadow.camera, {
      left: -44,
      right: 44,
      top: 38,
      bottom: -38,
      near: 1,
      far: 150,
    });
    sun.target.position.set(32, 0, 14);
    sc.add(sun, sun.target);

    const tex = (c) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      return t;
    };
    const crop = (src, x, y, w, h, k) => {
      const c = mk(w * k, h * k),
        q = c.getContext('2d');
      q.imageSmoothingEnabled = false;
      q.drawImage(src, x, y, w, h, 0, 0, w * k, h * k);
      return c;
    };
    const box = (w, h, d, mat, x, y, z, cast) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        mat.isMaterial || Array.isArray(mat) ? mat : lam({ color: mat })
      );
      m.position.set(x, y, z);
      m.castShadow = cast !== false;
      m.receiveShadow = true;
      sc.add(m);
      return m;
    };
    const flat = (w, d, c, x, y, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lam({ map: tex(c) }));
      m.rotation.x = -PI / 2;
      m.position.set(x, y, z);
      m.receiveShadow = true;
      sc.add(m);
    };
    const face = (t, a, b, total, h, x, y, z) => {
      const gm = new THREE.PlaneGeometry((b - a) / 10, h),
        uv = gm.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, (a + uv.getX(i) * (b - a)) / total);
      const m = new THREE.Mesh(gm, lam({ map: t }));
      m.position.set(x, y, z);
      m.receiveShadow = true;
      sc.add(m);
    };

    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 200),
      new THREE.ShadowMaterial({ opacity: 0.16 })
    );
    gnd.rotation.x = -PI / 2;
    gnd.position.set(32, -1.22, 14);
    gnd.receiveShadow = true;
    sc.add(gnd);
    box(66, 1.2, 30.6, C('#e9dcc6'), 32, -0.61, 14);
    flat(64, 16.4, crop(bgc, 0, 46, 640, 164, 4), 32, 0.02, 8.2);
    flat(64, 11.6, crop(bgc, 0, 240, 640, 116, 4), 32, 0.02, 22.2);

    const wc = mk(640, 46),
      wq = wc.getContext('2d');
    wq.drawImage(bgc, 0, 0, 640, 46, 0, 0, 640, 46);
    WINS.forEach((X) => {
      wq.drawImage(F.win, X, 8);
      wq.fillStyle = '#a4d6ff';
      wq.fillRect(X + 3, 11, 32, 20);
      wq.fillStyle = '#e8e2d4';
      wq.fillRect(X + 18, 11, 2, 20);
      wq.fillRect(X + 3, 20, 32, 1);
    });
    walls.forEach((w) => {
      if (w.y < 46) wq.drawImage(w.s, w.x, w.y);
    });
    text(wq, 'DAYS OK', 495, 16, '#8b90a8');
    text(wq, '042', 503, 22, '#9ece6a');
    box(64, 4.6, 0.5, C('#343b6b'), 32, 2.3, -0.25);
    face(tex(crop(wc, 0, 0, 640, 46, 4)), 0, 640, 640, 4.6, 32, 2.3, 0.01);
    box(0.4, 1.5, 28.6, C('#2a2f5c'), 0.2, 0.75, 14.1);
    box(0.4, 1.5, 28.6, C('#2a2f5c'), 63.8, 0.75, 14.1);

    const mc = mk(640, 34),
      mq = mc.getContext('2d');
    mq.drawImage(bgc, 0, 206, 640, 34, 0, 0, 640, 34);
    walls.forEach((w) => {
      if (w.y > 200) mq.drawImage(w.s, w.x, w.y - 206);
    });
    const mt = tex(crop(mc, 0, 0, 640, 34, 4));
    ROOMS.forEach((rm) => {
      [
        [rm.x0, rm.door - 13],
        [rm.door + 13, rm.x1],
      ].forEach((g) => {
        const w = (g[1] - g[0]) / 10,
          cx = (g[0] + g[1]) / 20;
        box(w, 3.4, 0.4, C(rm.wall), cx, 1.7, 16.2);
        face(mt, g[0], g[1], 640, 3.4, cx, 1.7, 16.41);
      });
    });
    ROOMS.slice(1).forEach((rm) => box(0.3, 3.4, 11.8, C('#232847'), rm.x0 / 10 - 0.15, 1.7, 22.3));

    const block = (s, x, base, depth) => {
      const w = s.width / 10,
        h = s.height / 10,
        d = depth || Math.min(1.8, Math.max(0.6, w * 0.5)),
        a = avgColor(s),
        c = mk(s.width, s.height),
        q = c.getContext('2d');
      q.fillStyle = 'rgb(' + a.join(',') + ')';
      q.fillRect(0, 0, s.width, s.height);
      q.drawImage(s, 0, 0);
      const shade = (k) =>
          new THREE.Color().setRGB(
            (a[0] / 255) * k,
            (a[1] / 255) * k,
            (a[2] / 255) * k,
            THREE.SRGBColorSpace
          ),
        side = lam({ color: shade(0.82) }),
        top = lam({ color: shade(1) });
      return box(
        w,
        h,
        d,
        [side, side, top, side, lam({ map: tex(crop(c, 0, 0, s.width, s.height, 4)) }), side],
        x / 10,
        h / 2,
        fz(base) - d / 2
      );
    };
    items.forEach((it) => block(it.s, it.x + it.s.width / 2, it.b));
    office.SEATS.forEach((s) => {
      if (s.conf)
        block(
          s.seat === 'F' ? chairTop('#5fae8f') : chairBack('#5fae8f'),
          s.x,
          s.seat === 'F' ? s.y - 4 : s.y + 3,
          0.8
        );
      else
        block(
          s.seat === 'F' ? F.deskBack : F.deskScreen,
          s.dx + 20,
          s.seat === 'F' ? 119 : 154,
          1.5
        );
    });

    const nc = mk(60, 9),
      nq = nc.getContext('2d');
    nq.fillStyle = '#11132a';
    nq.fillRect(0, 0, 60, 9);
    text(nq, 'AGENT OFFICE', 7, 2, '#ff4fd8');
    face(tex(crop(nc, 0, 0, 60, 9, 8)), 0, 60, 60, 0.9, 32, -0.6, 29.31);

    const unit = new THREE.BoxGeometry(1, 1, 1),
      ppl = new Map(),
      mkP = (p) => {
        const gp = new THREE.Group(),
          mats = [],
          m = (w, h, d, c, x, y, z, parent) => {
            const mat = lam({ color: C(c) });
            mats.push(mat);
            const b = new THREE.Mesh(unit, mat);
            b.scale.set(w, h, d);
            b.position.set(x, y, z || 0);
            b.castShadow = true;
            (parent || gp).add(b);
            return b;
          };
        const legs = new THREE.Group();
        gp.add(legs);
        [-0.2, 0.2].forEach((x) => {
          m(0.32, 0.95, 0.4, p.skirt ? p.skin : p.pants, x, 0.58, 0, legs);
          m(0.34, 0.16, 0.5, '#23263a', x, 0.08, 0.05, legs);
        });
        gp.userData.legs = legs;
        m(0.86, 1, 0.5, p.shirt, 0, 1.55);
        gp.userData.arms = [
          m(0.2, 0.85, 0.26, p.shirt, -0.53, 1.6),
          m(0.2, 0.85, 0.26, p.shirt, 0.53, 1.6),
        ];
        m(0.2, 0.2, 0.26, p.skin, -0.53, 1.1);
        m(0.2, 0.2, 0.26, p.skin, 0.53, 1.1);
        m(0.82, 0.78, 0.72, p.skin, 0, 2.45);
        m(0.9, 0.34, 0.8, p.hair, 0, 2.94);
        m(0.9, 0.5, 0.2, p.hair, 0, 2.6, -0.36);
        m(0.12, 0.14, 0.04, '#12132a', -0.18, 2.5, 0.37);
        m(0.12, 0.14, 0.04, '#12132a', 0.18, 2.5, 0.37);
        if (p.intern) gp.scale.setScalar(0.8);
        gp.userData.mats = mats;
        sc.add(gp);
        ppl.set(p, gp);
        return gp;
      };
    const cat = box(1, 0.5, 0.45, C('#f08a3c'), 0, 0.25, 0),
      goose = box(0.6, 0.9, 0.5, C('#f4f4f0'), 0, 0.45, 0);
    M = { rn, sc, cam, ppl, mkP, cat, goose, pos: null, look: null };
  }

  function size() {
    if (!M || !host.clientWidth || !host.clientHeight) return;
    M.rn.setSize(host.clientWidth, host.clientHeight);
    M.cam.aspect = host.clientWidth / host.clientHeight;
    M.cam.updateProjectionMatrix();
    M.pos = null;
  }

  return {
    get ready() {
      return !!M;
    },
    frames: 0,
    load() {
      if (!loading)
        loading = build().catch((e) => {
          loading = null;
          throw e;
        });
      return loading;
    },
    size,
    setCam(c) {
      camMode = c;
    },
    people: () => (M ? M.ppl.size : 0),
    probe(p) {
      const gp = M && M.ppl.get(p);
      return gp
        ? { x: gp.position.x, ry: gp.rotation.y, rz: gp.rotation.z, legs: gp.userData.legs.visible }
        : null;
    },
    renders: () => (M ? M.rn.info.render.frame : 0),
    frame(T) {
      if (!M) return;
      this.frames++;
      const dt = Math.min(0.1, Math.max(0, T - (last || T)));
      last = T;
      const { P, CAT, GOOSE } = office;
      for (const [p, gp] of M.ppl)
        if (!P.includes(p)) {
          M.sc.remove(gp);
          gp.userData.mats.forEach((m) => m.dispose());
          M.ppl.delete(p);
        }
      P.forEach((p) => {
        const gp = M.ppl.get(p) || M.mkP(p),
          sit = sitting(p),
          lying = p.now === 'sleep',
          walking = p.now === 'walk',
          sw = walking ? Math.sin(p.dist * 0.55) : 0;
        gp.userData.legs.visible = !sit;
        gp.position.set(
          p.x / 10,
          (lying ? 0.5 : sit ? -0.5 : 0) + (walking ? Math.abs(sw) * 0.1 : 0),
          fz(p.y)
        );
        gp.userData.arms[0].rotation.x = sw * 0.7;
        gp.userData.arms[1].rotation.x = -sw * 0.7;
        gp.rotation.set(0, TURN[p.dir || 0], lying ? Math.PI / 2 : 0);
      });
      M.cat.position.set(CAT.x / 10, 0.25, fz(CAT.y));
      M.goose.position.set(GOOSE.x / 10, 0.45, fz(GOOSE.y));

      if (!P.includes(lead) || (lead.seat && T - leadAt > 8)) {
        lead = P.find((p) => p.roam && p.state === 'go') || P.find((p) => p.roam) || P[0] || null;
        leadAt = T;
      }
      const far = Math.max(1, 1.55 / M.cam.aspect);
      let pos, look;
      if (camMode === 'walk' && lead) {
        const d = DIRS[lead.dir || 0];
        pos = [lead.x / 10 - d[0] * 7, 3.6, fz(lead.y) - d[1] * 7];
        look = [lead.x / 10 + d[0] * 5, 1.6, fz(lead.y) + d[1] * 5];
      } else if (camMode === 'front') {
        pos = [32, 24 * far, 13 + 62 * far];
        look = [32, 0, 12];
      } else {
        const a = -0.6 + Math.sin(T * 0.14) * 0.28;
        pos = [32 + Math.sin(a) * 66 * far, 34 * far, 13 + Math.cos(a) * 66 * far];
        look = [32, 0, 13];
      }
      if (!M.pos) {
        M.pos = pos;
        M.look = look;
      } else {
        const k = 1 - Math.exp(-dt * (camMode === 'walk' ? 2.8 : 4.3));
        for (let i = 0; i < 3; i++) {
          M.pos[i] += (pos[i] - M.pos[i]) * k;
          M.look[i] += (look[i] - M.look[i]) * k;
        }
      }
      M.cam.position.set(M.pos[0], M.pos[1], M.pos[2]);
      M.cam.lookAt(M.look[0], M.look[1], M.look[2]);
      M.rn.render(M.sc, M.cam);
    },
  };
}
