// Furniture and props for the T3 Code loft (Episode 2), in metres, Y up.
// Every builder adds meshes to `parent` and returns the parts that animate.
import * as THREE from 'three';
import { hash } from './util.js';
import { canvas, tex, oakPlanks, plaster, leaf, rug as rugCanvas, poster as posterCanvas, clockFace, textPlate, cardboard, roundRect } from './textures-loft.js';

export const std = (color, roughness = 0.6, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

export function mesh(parent, geo, mat, pos, { rot, cast = true, receive = true, name } = {}) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (name) m.name = name;
  parent.add(m);
  return m;
}

export function group(parent, pos = [0, 0, 0], yaw = 0) {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.y = yaw;
  parent.add(g);
  return g;
}

// Shared materials for one mount.
export function loftMaterials(palette) {
  const oakTex = tex(oakPlanks({ base: palette.oak }), { repeat: [1, 1] });
  const doorTex = tex(oakPlanks({ base: palette.door, boards: 3, seed: 'door' }), { repeat: [1, 1] });
  const leafA = tex(leaf({ hue: '#3E7B3C', seed: 'la' }));
  const leafB = tex(leaf({ hue: '#4E8A44', seed: 'lb', split: false }));
  return {
    floor: new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.5, metalness: 0, envMapIntensity: 0.55 }),
    oakTex,
    wall: new THREE.MeshStandardMaterial({ color: palette.wall, roughness: 0.92, envMapIntensity: 0.4 }),
    ceiling: std(palette.ceiling, 0.95),
    beam: std(palette.beam, 0.7, 0.05),
    steel: std(palette.steel, 0.42, 0.55, { envMapIntensity: 0.7 }),
    door: new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.55, envMapIntensity: 0.5 }),
    oak: new THREE.MeshStandardMaterial({ map: tex(oakPlanks({ base: palette.oak, boards: 4, seed: 'furn' })), roughness: 0.5 }),
    brass: std('#C9A25A', 0.3, 0.85),
    white: std('#F7F5F1', 0.45),
    black: std('#1B1B1D', 0.5, 0.1),
    terracotta: std('#C9774F', 0.75),
    ceramic: std('#F2EFEA', 0.35),
    soil: std('#3B2A1E', 0.95),
    accent: std(palette.accent, 0.55),
    glass: new THREE.MeshPhysicalMaterial({ color: '#E8F2F8', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.08, envMapIntensity: 1.2, depthWrite: false }),
    leafA: new THREE.MeshStandardMaterial({ map: leafA, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.55 }),
    leafB: new THREE.MeshStandardMaterial({ map: leafB, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.55 }),
    stem: std('#4F6B33', 0.7),
  };
}

// ---------------------------------------------------------------- plants

function pot(parent, M, { r = 0.2, h = 0.34, kind = 'terracotta' } = {}) {
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(r * 0.72, 0), new THREE.Vector2(r, h * 0.92), new THREE.Vector2(r * 1.04, h), new THREE.Vector2(r * 0.96, h)];
  const mat = kind === 'white' ? M.ceramic : kind === 'black' ? M.black : M.terracotta;
  mesh(parent, new THREE.LatheGeometry(pts, 28), mat, [0, 0, 0]);
  mesh(parent, new THREE.CircleGeometry(r * 0.95, 24), M.soil, [0, h * 0.94, 0], { rot: [-Math.PI / 2, 0, 0], cast: false });
}

// A curved leaf card: a subdivided plane bent along its length.
function leafCard(parent, M, mat, size, bend = 0.25) {
  const geo = new THREE.PlaneGeometry(size * 0.85, size, 1, 6);
  geo.translate(0, size / 2, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / size;
    p.setZ(i, -bend * size * y * y);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** kind: 'monstera' | 'fig' | 'snake'. size scales the whole plant. */
export function plant(parent, M, { pos = [0, 0, 0], size = 1, kind = 'monstera', potKind = 'terracotta', seed = 'p' } = {}) {
  const g = group(parent, pos, hash(seed, 'yaw') * Math.PI * 2);
  g.scale.setScalar(size);
  const potH = kind === 'snake' ? 0.32 : 0.38;
  pot(g, M, { r: kind === 'fig' ? 0.2 : 0.22, h: potH, kind: potKind });
  if (kind === 'snake') {
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Group();
      s.position.set((hash(seed, 'sx', i) - 0.5) * 0.18, potH * 0.9, (hash(seed, 'sz', i) - 0.5) * 0.18);
      s.rotation.set((hash(seed, 'rx', i) - 0.5) * 0.35, hash(seed, 'ry', i) * Math.PI, (hash(seed, 'rz', i) - 0.5) * 0.35);
      g.add(s);
      const blade = leafCard(s, M, M.leafB, 0.55 + 0.4 * hash(seed, 'h', i), 0.08);
      blade.scale.x = 0.32;
    }
    return g;
  }
  if (kind === 'fig') {
    const trunkH = 1.0;
    mesh(g, new THREE.CylinderGeometry(0.025, 0.035, trunkH, 8), std('#6B5440', 0.8), [0, potH + trunkH / 2, 0]);
    for (let i = 0; i < 26; i++) {
      const a = hash(seed, 'a', i) * Math.PI * 2;
      const y = potH + 0.55 + 0.75 * hash(seed, 'y', i);
      const r = 0.08 + 0.22 * hash(seed, 'r', i) * (1 - (y - potH - 0.55) / 1.1);
      const s = new THREE.Group();
      s.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      s.rotation.set(-0.5 - 0.6 * hash(seed, 'tilt', i), -a + Math.PI / 2, (hash(seed, 'tw', i) - 0.5) * 0.6);
      g.add(s);
      leafCard(s, M, M.leafB, 0.2 + 0.07 * hash(seed, 's', i), 0.2);
    }
    return g;
  }
  // monstera: long stems arching out with big split leaves
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + hash(seed, 'a', i) * 0.6;
    const out = 0.6 + 0.5 * hash(seed, 'o', i);
    const h = 0.45 + 0.45 * hash(seed, 'h', i);
    const base = new THREE.Vector3(0, potH * 0.92, 0);
    const tip = new THREE.Vector3(Math.cos(a) * 0.3 * out, potH + h, Math.sin(a) * 0.3 * out);
    const mid = base.clone().lerp(tip, 0.5).add(new THREE.Vector3(0, 0.12, 0));
    const curve = new THREE.QuadraticBezierCurve3(base, mid, tip);
    mesh(g, new THREE.TubeGeometry(curve, 8, 0.008, 5, false), M.stem, null);
    const s = new THREE.Group();
    s.position.copy(tip);
    s.rotation.set(-1.0 - 0.5 * hash(seed, 'tilt', i), -a + Math.PI / 2, (hash(seed, 'tw', i) - 0.5) * 0.5);
    g.add(s);
    leafCard(s, M, M.leafA, 0.36 + 0.16 * hash(seed, 'ls', i), 0.3);
  }
  return g;
}

// ---------------------------------------------------------------- lights & decor

/** Dome pendant on a cord; returns its bulb material (for glow). */
export function pendant(parent, M, { pos, drop = 0.9, color = '#1B1B1D', light = true, intensity = 2.2 } = {}) {
  const g = group(parent, pos);
  mesh(g, new THREE.CylinderGeometry(0.006, 0.006, drop, 6), M.black, [0, -drop / 2, 0], { cast: false });
  const pts = [];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.sin(a) * 0.24 + 0.01, -Math.cos(a) * 0.17 + 0.17)); }
  const shade = new THREE.Mesh(new THREE.LatheGeometry(pts.reverse(), 32), [std(color, 0.4, 0.3)].map((m) => { m.side = THREE.DoubleSide; return m; })[0]);
  shade.position.y = -drop - 0.17;
  shade.castShadow = true;
  g.add(shade);
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#FFF3DC', emissive: '#FFD9A0', emissiveIntensity: 2.2, roughness: 0.3 });
  mesh(g, new THREE.SphereGeometry(0.05, 16, 12), bulbMat, [0, -drop - 0.12, 0], { cast: false });
  if (light) {
    const l = new THREE.PointLight('#FFD8A8', intensity, 4.5, 2);
    l.position.set(0, -drop - 0.2, 0);
    g.add(l);
  }
  return { group: g, bulbMat };
}

export function rug(parent, { pos, w = 2.4, d = 1.6, accent, yaw = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex(rugCanvas({ accent })), roughness: 0.95 }));
  m.rotation.set(-Math.PI / 2, 0, yaw);
  m.position.set(pos[0], 0.006, pos[2]);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function framedPrint(parent, M, { pos, w = 0.6, h = 0.8, yaw = 0, seed = 'po', palette } = {}) {
  const g = group(parent, pos, yaw);
  mesh(g, new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.03), M.black, [0, 0, 0]);
  mesh(g, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(posterCanvas({ seed, palette })), roughness: 0.8 }), [0, 0, 0.016], { cast: false });
  return g;
}

// ---------------------------------------------------------------- furniture

export function desk(parent, M, { pos, w = 1.4, d = 0.7, h = 0.74, yaw = 0 } = {}) {
  const g = group(parent, pos, yaw);
  mesh(g, new THREE.BoxGeometry(w, 0.04, d), M.oak, [0, h - 0.02, 0]);
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.06);
    mesh(g, new THREE.BoxGeometry(0.035, h - 0.04, 0.035), M.steel, [x, (h - 0.04) / 2, d / 2 - 0.06]);
    mesh(g, new THREE.BoxGeometry(0.035, h - 0.04, 0.035), M.steel, [x, (h - 0.04) / 2, -d / 2 + 0.06]);
    mesh(g, new THREE.BoxGeometry(0.035, 0.035, d - 0.12), M.steel, [x, 0.08, 0]);
  }
  return g;
}

export function stool(parent, M, { pos, h = 0.5, r = 0.2 } = {}) {
  const g = group(parent, pos);
  mesh(g, new THREE.CylinderGeometry(r, r * 0.96, 0.05, 32), M.oak, [0, h - 0.025, 0]);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const top = new THREE.Vector3(Math.cos(a) * r * 0.6, h - 0.05, Math.sin(a) * r * 0.6);
    const foot = new THREE.Vector3(Math.cos(a) * r * 1.05, 0, Math.sin(a) * r * 1.05);
    const leg = mesh(g, new THREE.CylinderGeometry(0.014, 0.016, top.distanceTo(foot), 8), M.steel, null);
    leg.position.copy(top).add(foot).multiplyScalar(0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
  }
  mesh(g, new THREE.TorusGeometry(r * 0.82, 0.008, 6, 32), M.steel, [0, h * 0.35, 0], { rot: [Math.PI / 2, 0, 0] });
  return g;
}

export function sideTable(parent, M, { pos, r = 0.26, h = 0.55 } = {}) {
  const g = group(parent, pos);
  mesh(g, new THREE.CylinderGeometry(r, r, 0.035, 36), M.oak, [0, h - 0.0175, 0]);
  mesh(g, new THREE.CylinderGeometry(0.025, 0.025, h - 0.035, 10), M.steel, [0, (h - 0.035) / 2, 0]);
  mesh(g, new THREE.CylinderGeometry(r * 0.7, r * 0.75, 0.02, 32), M.steel, [0, 0.01, 0]);
  return g;
}

export function bookshelf(parent, M, { pos, w = 1.2, h = 1.8, d = 0.32, yaw = 0, seed = 'bs', palette = ['#2F5D62', '#C96F4A', '#E9D8B4', '#3A3A3A', '#7C9A6A'] } = {}) {
  const g = group(parent, pos, yaw);
  const shelves = 5;
  for (const sx of [-1, 1]) mesh(g, new THREE.BoxGeometry(0.03, h, d), M.oak, [sx * (w / 2 - 0.015), h / 2, 0]);
  for (let i = 0; i < shelves; i++) {
    const y = 0.04 + (i * (h - 0.06)) / (shelves - 1);
    mesh(g, new THREE.BoxGeometry(w, 0.025, d), M.oak, [0, y, 0]);
    if (i === shelves - 1) continue;
    let x = -w / 2 + 0.05;
    let k = 0;
    while (x < w / 2 - 0.1) {
      if (hash(seed, i, k, 'gap') < 0.15) { x += 0.12; k++; continue; }
      const bw = 0.025 + 0.025 * hash(seed, i, k, 'w');
      const bh = 0.2 + 0.1 * hash(seed, i, k, 'h');
      const col = palette[Math.floor(hash(seed, i, k, 'c') * palette.length)];
      mesh(g, new THREE.BoxGeometry(bw, bh, d * 0.75), std(col, 0.7), [x + bw / 2, y + 0.0125 + bh / 2, 0.01]);
      x += bw + 0.004;
      k++;
    }
  }
  return g;
}

export function sofa(parent, M, { pos, yaw = 0, w = 2.0, color = '#D8CFC2' } = {}) {
  const g = group(parent, pos, yaw);
  const fab = std(color, 0.95);
  mesh(g, new THREE.BoxGeometry(w, 0.42, 0.9), fab, [0, 0.21, 0]);
  mesh(g, new THREE.BoxGeometry(w, 0.45, 0.2), fab, [0, 0.62, -0.35]);
  for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(0.18, 0.6, 0.9), fab, [s * (w / 2 - 0.09), 0.3, 0]);
  for (let i = 0; i < 2; i++) mesh(g, new THREE.BoxGeometry(w / 2 - 0.2, 0.14, 0.62), fab, [(i - 0.5) * (w / 2 - 0.18), 0.49, 0.06]);
  mesh(g, new THREE.BoxGeometry(0.4, 0.36, 0.12), std('#C96F4A', 0.9), [-w / 2 + 0.45, 0.68, -0.18], { rot: [0.2, 0.2, 0.1] });
  return g;
}

// ---------------------------------------------------------------- the ship room

/** The big physical button: black housing, steel collar, dome cap. cap moves down on press. */
export function bigButton(parent, M, { pos, color = '#E5484D', label = 'SHIP' } = {}) {
  const g = group(parent, pos);
  mesh(g, new THREE.CylinderGeometry(0.15, 0.17, 0.07, 40), M.black, [0, 0.035, 0]);
  mesh(g, new THREE.TorusGeometry(0.115, 0.016, 10, 40), std('#C9CDD2', 0.25, 0.9), [0, 0.072, 0], { rot: [Math.PI / 2, 0, 0] });
  const capMat = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.05, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  const cap = new THREE.Group();
  cap.position.y = 0.07;
  g.add(cap);
  mesh(cap, new THREE.SphereGeometry(0.105, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), capMat, [0, 0.0, 0]).scale.set(1, 0.55, 1);
  mesh(cap, new THREE.CylinderGeometry(0.105, 0.105, 0.03, 40), capMat, [0, -0.012, 0]);
  const glow = new THREE.PointLight(color, 0, 1.6, 2);
  glow.position.set(0, 0.16, 0.05);
  g.add(glow);
  // engraved label on the housing front
  const plate = textPlate({ w: 256, h: 64, bg: '#111', radius: 10, lines: [{ text: label, size: 44, color: '#F5F5F5' }] });
  mesh(g, new THREE.PlaneGeometry(0.14, 0.035), new THREE.MeshStandardMaterial({ map: tex(plate), roughness: 0.5 }), [0, 0.036, 0.162], { rot: [-0.28, 0, 0], cast: false });
  return { group: g, cap, capMat, glow };
}

/** Wall panel with three lamps labelled COMMIT / PUSH / PR; returns the lamp materials. */
export function lampPanel(parent, M, { pos, yaw = 0, labels = ['COMMIT', 'PUSH', 'PR'], color = '#3DDC84' } = {}) {
  const g = group(parent, pos, yaw);
  const w = 1.5, h = 0.5;
  mesh(g, new THREE.BoxGeometry(w, h, 0.05), std('#202326', 0.5, 0.3), [0, 0, 0]);
  const lamps = labels.map((label, i) => {
    const x = (i - 1) * 0.46;
    const mat = new THREE.MeshStandardMaterial({ color: '#2A302C', emissive: color, emissiveIntensity: 0, roughness: 0.3 });
    mesh(g, new THREE.CylinderGeometry(0.075, 0.075, 0.03, 32), mat, [x, 0.07, 0.035], { rot: [Math.PI / 2, 0, 0], cast: false });
    mesh(g, new THREE.TorusGeometry(0.08, 0.012, 8, 32), std('#9AA1A8', 0.3, 0.9), [x, 0.07, 0.04], { cast: false });
    const t = textPlate({ w: 256, h: 72, bg: null, lines: [{ text: label, size: 46, color: '#E9EDF0', letter: 3 }] });
    mesh(g, new THREE.PlaneGeometry(0.36, 0.1), new THREE.MeshBasicMaterial({ map: tex(t), transparent: true, toneMapped: false }), [x, -0.15, 0.027], { cast: false });
    return mat;
  });
  return { group: g, lamps };
}

// ---------------------------------------------------------------- Antigravity's room

/** An opened shipping box with tissue paper and a ribbon + bow. */
export function installBox(parent, M, { pos, size = [0.7, 0.5, 0.6], ribbon = '#D6455D', yaw = 0, title = 'ANTIGRAVITY' } = {}) {
  const [w, h, d] = size;
  const g = group(parent, pos, yaw);
  const kraft = new THREE.MeshStandardMaterial({ map: tex(cardboard({ lines: [{ text: title, size: 64 }, { text: 'SETUP INCLUDED', size: 36, color: '#7A2E1E' }], arrows: true, top: 0.2 })), roughness: 0.85 });
  const plain = new THREE.MeshStandardMaterial({ map: tex(cardboard({ lines: [], seed: 'cb2' })), roughness: 0.85, side: THREE.DoubleSide });
  // open box: four walls + floor
  const t = 0.012;
  mesh(g, new THREE.BoxGeometry(w, t, d), plain, [0, t / 2, 0]);
  mesh(g, new THREE.BoxGeometry(w, h, t), [plain, plain, plain, plain, kraft, plain], [0, h / 2, d / 2 - t / 2]);
  mesh(g, new THREE.BoxGeometry(w, h, t), plain, [0, h / 2, -d / 2 + t / 2]);
  mesh(g, new THREE.BoxGeometry(t, h, d), plain, [w / 2 - t / 2, h / 2, 0]);
  mesh(g, new THREE.BoxGeometry(t, h, d), plain, [-w / 2 + t / 2, h / 2, 0]);
  // flaps folded open
  const flap = (x, z, ry, len, along) => {
    const f = new THREE.Group();
    f.position.set(x, h, z);
    f.rotation.y = ry;
    g.add(f);
    const m = mesh(f, new THREE.BoxGeometry(along, t, len), plain, [0, 0, len / 2]);
    f.rotation.x = 0;
    f.rotateX(-0.55); // folded open: up and out, clear of the printed side
    return m;
  };
  flap(0, d / 2, 0, d * 0.48, w);
  flap(0, -d / 2, Math.PI, d * 0.48, w);
  flap(w / 2, 0, Math.PI / 2, w * 0.45, d);
  flap(-w / 2, 0, -Math.PI / 2, w * 0.45, d);
  // tissue paper puffs
  const tissue = std('#F7F1EA', 0.9, 0, { side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const p = mesh(g, new THREE.IcosahedronGeometry(0.11 + 0.05 * hash('ts', i), 0), tissue, [(hash('tx', i) - 0.5) * (w - 0.2), h - 0.03 + 0.04 * hash('ty', i), (hash('tz', i) - 0.5) * (d - 0.2)]);
    p.scale.set(1.4, 0.5, 1.2);
    p.rotation.set(hash('r1', i) * 3, hash('r2', i) * 3, 0);
  }
  // ribbon bands round the box and a bow on the front-left corner of the rim
  const rib = new THREE.MeshStandardMaterial({ color: ribbon, roughness: 0.35, metalness: 0.1, emissive: ribbon, emissiveIntensity: 0.06 });
  mesh(g, new THREE.BoxGeometry(w + 0.01, 0.06, d + 0.01), rib, [0, h * 0.2, 0], { cast: false });
  mesh(g, new THREE.BoxGeometry(0.06, h + 0.006, d + 0.014), rib, [w * 0.32, h / 2, 0], { cast: false });
  const bow = group(g, [w * 0.32, h + 0.02, d / 2 + 0.01]);
  for (const s of [-1, 1]) {
    const loop = mesh(bow, new THREE.TorusGeometry(0.075, 0.022, 10, 24), rib, [s * 0.075, 0.045, 0]);
    loop.scale.set(1.2, 0.75, 0.6);
    loop.rotation.z = s * 0.35;
    const tail = mesh(bow, new THREE.BoxGeometry(0.045, 0.16, 0.012), rib, [s * 0.045, -0.06, 0.02]);
    tail.rotation.z = s * 0.4;
  }
  mesh(bow, new THREE.SphereGeometry(0.035, 16, 12), rib, [0, 0.04, 0.005]);
  return { group: g, bow, height: h };
}

// ---------------------------------------------------------------- the time machine

/** A wall clock; hands rotate about the face normal (+Z). */
export function wallClock(parent, M, { pos, r = 0.3, style = 0, frame = 'black', yaw = 0 } = {}) {
  const g = group(parent, pos, yaw);
  const frameMat = frame === 'oak' ? M.oak : frame === 'brass' ? M.brass : frame === 'white' ? M.white : M.black;
  mesh(g, new THREE.CylinderGeometry(r * 1.08, r * 1.08, 0.05, 48), frameMat, [0, 0, 0.0], { rot: [Math.PI / 2, 0, 0] });
  mesh(g, new THREE.CircleGeometry(r, 48), new THREE.MeshStandardMaterial({ map: tex(clockFace({ style })), roughness: 0.6 }), [0, 0, 0.026], { cast: false });
  const handMat = style === 2 ? std('#F3EDE2', 0.5) : std('#1C1C1C', 0.5);
  const mkHand = (len, wid, z) => {
    const h = new THREE.Group();
    h.position.z = z;
    g.add(h);
    mesh(h, new THREE.BoxGeometry(wid, len, 0.006), handMat, [0, len / 2 - len * 0.12, 0], { cast: false });
    return h;
  };
  const hour = mkHand(r * 0.55, r * 0.07, 0.034);
  const minute = mkHand(r * 0.82, r * 0.045, 0.04);
  const second = mkHand(r * 0.88, r * 0.012, 0.046);
  second.children[0].material = std('#D9483B', 0.5);
  mesh(g, new THREE.CylinderGeometry(r * 0.05, r * 0.05, 0.02, 16), std('#1C1C1C', 0.4), [0, 0, 0.048], { rot: [Math.PI / 2, 0, 0], cast: false });
  // glass dome highlight
  mesh(g, new THREE.CircleGeometry(r, 48), M.glass, [0, 0, 0.052], { cast: false });
  return { group: g, hour, minute, second };
}

// ---------------------------------------------------------------- the remote

/** A giant phone on a wall mount. Returns the screen mesh (map set by the RT pass). */
export function giantPhone(parent, M, { pos, h = 1.5, yaw = 0, status } = {}) {
  const w = h * 0.49;
  const g = group(parent, pos, yaw);
  const shape = new THREE.Shape();
  roundShape(shape, -w / 2, -h / 2, w, h, w * 0.16);
  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 12 });
  mesh(g, body, std('#17181B', 0.3, 0.6, { envMapIntensity: 1.0 }), [0, 0, 0]);
  const sw = w * 0.92, sh = h * 0.955;
  const scr = new THREE.Shape();
  roundShape(scr, -sw / 2, -sh / 2, sw, sh, sw * 0.13);
  const sgeo = new THREE.ShapeGeometry(scr, 12);
  // UVs 0..1 over the screen rectangle
  const uv = sgeo.attributes.uv;
  const pp = sgeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pp.getX(i) + sw / 2) / sw, (pp.getY(i) + sh / 2) / sh);
  const screenMat = new THREE.MeshBasicMaterial({ color: '#0B0C0E', toneMapped: false });
  const screen = mesh(g, sgeo, screenMat, [0, 0, 0.0635], { cast: false });
  const overlayMat = new THREE.MeshBasicMaterial({ map: status ? tex(status) : null, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const overlay = mesh(g, sgeo.clone(), overlayMat, [0, 0, 0.0645], { cast: false });
  // dynamic island + side buttons
  const isl = new THREE.Shape();
  roundShape(isl, -w * 0.14, -0.022, w * 0.28, 0.044, 0.022);
  mesh(g, new THREE.ShapeGeometry(isl, 8), new THREE.MeshBasicMaterial({ color: '#050506' }), [0, sh / 2 - 0.05, 0.066], { cast: false });
  mesh(g, new THREE.BoxGeometry(0.012, 0.14, 0.03), std('#2A2B2F', 0.3, 0.7), [w / 2 + 0.012, h * 0.18, 0.03]);
  mesh(g, new THREE.BoxGeometry(0.012, 0.09, 0.03), std('#2A2B2F', 0.3, 0.7), [-w / 2 - 0.012, h * 0.22, 0.03]);
  // wall bracket
  mesh(g, new THREE.BoxGeometry(w * 0.5, h * 0.3, 0.08), M.steel, [0, 0, -0.05]);
  return { group: g, screen, screenMat, overlay, overlayMat, w, h, sw, sh };
}

function roundShape(s, x, y, w, h, r) {
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
}

// ---------------------------------------------------------------- the fridge

function jarLabel(text, accent) {
  const c = canvas(256, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#FBF7EF';
  roundRect(g, 4, 4, 248, 120, 14);
  g.fill();
  g.strokeStyle = accent;
  g.lineWidth = 6;
  roundRect(g, 10, 10, 236, 108, 10);
  g.stroke();
  g.fillStyle = '#1E1E1E';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 46;
  g.font = `${size}px "Archivo Black", "Arial Black", Arial, sans-serif`;
  while (size > 14 && g.measureText(text).width > 220) { size -= 2; g.font = `${size}px "Archivo Black", "Arial Black", Arial, sans-serif`; }
  g.fillText(text, 128, 66);
  return c;
}

/** A glass jar with a lid, contents and a front label facing +Z. */
export function jar(parent, { pos, r = 0.07, h = 0.2, label = 'EVENTS', fill = '#E9C46A', lid = '#2B2B2B', accent = '#2F5D62' } = {}) {
  const g = group(parent, pos);
  mesh(g, new THREE.CylinderGeometry(r * 0.92, r * 0.92, h * 0.72, 24), std(fill, 0.6), [0, h * 0.37, 0]);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.04, transmission: 0, transparent: true, opacity: 0.22, clearcoat: 1, envMapIntensity: 1.4, depthWrite: false });
  mesh(g, new THREE.CylinderGeometry(r, r, h, 28, 1, true), glass, [0, h / 2, 0], { cast: false });
  mesh(g, new THREE.CylinderGeometry(r * 1.04, r * 1.04, h * 0.14, 28), std(lid, 0.4, 0.5), [0, h + h * 0.06, 0]);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.002, r + 0.002, h * 0.36, 28, 1, true, -0.95, 1.9), new THREE.MeshStandardMaterial({ map: tex(jarLabel(label, accent)), roughness: 0.7 }));
  lab.position.y = h * 0.45;
  lab.rotation.y = Math.PI; // centre of the label arc faces +Z
  g.add(lab);
  // a second label on the back, so the jar reads from inside the fridge too
  const back = lab.clone();
  back.rotation.y = 0;
  g.add(back);
  return g;
}

/**
 * A tall fridge. The door hangs on a hinge at the cabinet's left front edge (seen
 * from the front, +Z); door.rotation.y opens it (0 closed, negative = opens toward -X... set by caller).
 * interior: shelves with jars; an interior point light and a spill spot.
 */
export function fridge(parent, M, { pos, yaw = 0, w = 0.75, h = 1.85, d = 0.7, body = '#E8E2D6', inside = '#F4F7F8', jars = [], accent = '#2F5D62', handle = '#C9CDD2' } = {}) {
  const g = group(parent, pos, yaw);
  const bodyMat = std(body, 0.32, 0.08, { envMapIntensity: 0.8 });
  const t = 0.04;
  // cabinet shell open at the front (+Z)
  mesh(g, new THREE.BoxGeometry(w, h, t), bodyMat, [0, h / 2, -d / 2 + t / 2]);
  mesh(g, new THREE.BoxGeometry(t, h, d), bodyMat, [-w / 2 + t / 2, h / 2, 0]);
  mesh(g, new THREE.BoxGeometry(t, h, d), bodyMat, [w / 2 - t / 2, h / 2, 0]);
  mesh(g, new THREE.BoxGeometry(w, t, d), bodyMat, [0, h - t / 2, 0]);
  mesh(g, new THREE.BoxGeometry(w, 0.08, d), bodyMat, [0, 0.04, 0]);
  const liner = new THREE.MeshStandardMaterial({ color: inside, emissive: '#EAF3FF', emissiveIntensity: 0.0, roughness: 0.5 });
  mesh(g, new THREE.BoxGeometry(w - 2 * t - 0.002, h - 0.12 - t, 0.01), liner, [0, (h - t + 0.08) / 2, -d / 2 + t + 0.006], { cast: false });
  mesh(g, new THREE.PlaneGeometry(d - t, h - 0.12 - t), liner, [-w / 2 + t + 0.001, (h - t + 0.08) / 2, t / 2], { rot: [0, Math.PI / 2, 0], cast: false });
  mesh(g, new THREE.PlaneGeometry(d - t, h - 0.12 - t), liner, [w / 2 - t - 0.001, (h - t + 0.08) / 2, t / 2], { rot: [0, -Math.PI / 2, 0], cast: false });
  // glass shelves
  const shelfMat = new THREE.MeshPhysicalMaterial({ color: '#DDEFF5', roughness: 0.1, transparent: true, opacity: 0.45, depthWrite: false });
  const shelfYs = [0.42, 0.82, 1.22];
  for (const y of shelfYs) {
    mesh(g, new THREE.BoxGeometry(w - 2 * t, 0.012, d - t - 0.04), shelfMat, [0, y, -0.01], { cast: false });
    mesh(g, new THREE.BoxGeometry(w - 2 * t, 0.02, 0.012), std('#C8CED2', 0.3, 0.6), [0, y + 0.004, d / 2 - 0.06], { cast: false });
  }
  const placed = [];
  jars.forEach((j, i) => {
    const shelf = j.shelf ?? Math.floor(i / 3);
    const slot = j.slot ?? i % 3;
    const y = (shelf < 0 ? 0.08 : shelfYs[shelf]) + 0.008;
    const x = (slot - 1) * (w - 2 * t) * 0.31;
    placed.push(jar(g, { pos: [x, y, 0.06 + (j.dz || 0)], label: j.label, fill: j.fill, r: j.r || 0.065, h: j.h || 0.19, accent }));
  });
  // door, hinged on the left front edge
  const hinge = group(g, [-w / 2, 0, d / 2]);
  const door = group(hinge, [w / 2, 0, 0]);
  mesh(door, new THREE.BoxGeometry(w, h - 0.01, 0.06), bodyMat, [0, h / 2, 0.03]);
  mesh(door, new THREE.BoxGeometry(w - 0.06, h - 0.07, 0.012), liner, [0, h / 2, -0.003], { cast: false });
  // door bins
  for (const y of [0.5, 0.95, 1.4]) mesh(door, new THREE.BoxGeometry(w - 0.12, 0.08, 0.08), std('#E9EEF0', 0.3, 0, { transparent: true, opacity: 0.85 }), [0, y, -0.05], { cast: false });
  mesh(door, new THREE.BoxGeometry(0.03, 0.55, 0.03), std(handle, 0.25, 0.9), [w / 2 - 0.07, h * 0.62, 0.09]);
  mesh(door, new THREE.BoxGeometry(0.03, 0.03, 0.06), std(handle, 0.25, 0.9), [w / 2 - 0.07, h * 0.62 + 0.26, 0.065]);
  mesh(door, new THREE.BoxGeometry(0.03, 0.03, 0.06), std(handle, 0.25, 0.9), [w / 2 - 0.07, h * 0.62 - 0.26, 0.065]);
  // interior light: a cool point light, and a spill that throws light out of the door
  const lamp = new THREE.PointLight('#EAF4FF', 0, 2.2, 2);
  lamp.position.set(0, h - 0.2, 0.1);
  g.add(lamp);
  const spill = new THREE.SpotLight('#EEF6FF', 0, 5, 0.75, 0.6, 1.4);
  spill.position.set(0, h * 0.6, d / 2 - 0.12);
  spill.target.position.set(0, 0.9, d / 2 + 2);
  g.add(spill, spill.target);
  return { group: g, hinge, door, lamp, spill, liner, jars: placed, w, h, d, shelfYs };
}
