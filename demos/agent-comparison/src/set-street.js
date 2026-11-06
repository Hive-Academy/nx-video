// The street (Episode 2): the two homes side by side, in metres, Y up, camera side +Z.
//
//   T3 Code loft ......... limewashed brick, x -13..-0.8, façade on z = -6, three floors
//                          (9.6 m), black steel windows, an oak pivot door at x = -2.6
//                          (1.1 x 2.4) on a concrete porch (two 0.15 m steps), a steel
//                          canopy, the T3 Code logo plate, a doorbell and house number.
//   garden gap ........... x -0.8..1.6: a tree, hedges, a gravel walk.
//   Ptah temple .......... a sandstone pylon: towers x 1.6..5.6 and 8.0..12.0 (7.5 m,
//                          battered), bronze gates (2 x 1.0 x 4.15) at x 5.8..7.8 under
//                          a lintel with the winged sun and the Ptah emblem, three steps,
//                          obelisks and braziers; Episode 1's painted hall seen inside.
//   sidewalk ............. pavers along x at z -1.6..0.6, walks to each door.
// Behind each door a lit interior, so an opening door reveals the home.
import * as THREE from 'three';
import { tex, brick, sandstone, grass, pavers, concrete, skyline, textPlate, canvas } from './textures-loft.js';
import { std, mesh, group, plant } from './props-loft.js';
import { loftMaterials } from './props-loft.js';
import { loftPalette, floorPlane, contactShadow } from './set-loft.js';
import { brazier } from './temple.js';
import { hash } from './util.js';

export const STREET = {
  facadeZ: -6,
  loft: { x0: -13, x1: -0.8, h: 9.6 },
  loftDoor: { x: -2.6, w: 1.1, h: 2.4, landing: 0.3 },
  temple: { left: [1.6, 5.6], right: [8.0, 12.0], h: 7.5 },
  gate: { x0: 5.8, x1: 7.8, h: 4.15, steps: 3, step: 0.12 },
  walkZ: [-1.6, 0.6],
};

// Box with its texture repeat scaled to its size (planar look across segments).
function texBox(parent, tx, mat0, [x0, x1], [y0, y1], [z0, z1], scale = 2) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  if (w <= 1e-3 || h <= 1e-3 || d <= 1e-3) return null;
  const mat = mat0.clone();
  mat.map = tx.clone();
  mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  mat.map.repeat.set(Math.max(w, d) / scale, h / scale);
  mat.map.offset.set(x0 / scale, y0 / scale);
  mat.map.needsUpdate = true;
  return mesh(parent, new THREE.BoxGeometry(w, h, d), mat, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]);
}

function steelWindow(parent, M, { x, y, w, h, z, cols = 3, rows = 3, glass }) {
  const g = group(parent, [x, y, z]);
  const f = 0.06;
  const bar = (bw, bh, px, py) => mesh(g, new THREE.BoxGeometry(bw, bh, 0.07), M.steel, [px, py, 0.03]);
  bar(w, f, 0, h / 2); bar(w, f, 0, -h / 2); bar(f, h, -w / 2, 0); bar(f, h, w / 2, 0);
  for (let i = 1; i < cols; i++) mesh(g, new THREE.BoxGeometry(0.03, h, 0.05), M.steel, [-w / 2 + (i * w) / cols, 0, 0.03]);
  for (let j = 1; j < rows; j++) mesh(g, new THREE.BoxGeometry(w, 0.03, 0.05), M.steel, [0, -h / 2 + (j * h) / rows, 0.03]);
  mesh(g, new THREE.PlaneGeometry(w, h), glass, [0, 0, 0.005], { cast: false });
  mesh(g, new THREE.BoxGeometry(w + 0.14, 0.06, 0.16), std('#D9D2C6', 0.7), [0, -h / 2 - 0.04, 0.06]);
  return g;
}

function grassBlades(parent, { pos, r = 0.3, h = 0.7, n = 40, seed = 'gb' }) {
  const mat = std('#7A9A55', 0.8, 0, { side: THREE.DoubleSide });
  const g = group(parent, pos);
  for (let i = 0; i < n; i++) {
    const a = hash(seed, i) * Math.PI * 2;
    const rr = r * Math.sqrt(hash(seed, 'r', i));
    const bh = h * (0.6 + 0.5 * hash(seed, 'h', i));
    const geo = new THREE.PlaneGeometry(0.025, bh, 1, 3);
    geo.translate(0, bh / 2, 0);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const yy = p.getY(k) / bh; p.setZ(k, 0.18 * bh * yy * yy); p.setX(k, p.getX(k) * (1 - yy * 0.8)); }
    const m = new THREE.Mesh(geo, mat);
    m.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
    m.rotation.y = hash(seed, 'y', i) * Math.PI * 2;
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

function tree(parent, { pos, s = 1, seed = 't' }) {
  const g = group(parent, pos);
  g.scale.setScalar(s);
  mesh(g, new THREE.CylinderGeometry(0.12, 0.18, 2.4, 10), std('#6B5440', 0.85), [0, 1.2, 0]);
  const greens = ['#5E8A4A', '#6F9A55', '#527D40'];
  for (let i = 0; i < 6; i++) {
    const r = 0.8 + 0.5 * hash(seed, 'r', i);
    const m = mesh(g, new THREE.IcosahedronGeometry(r, 1), std(greens[i % 3], 0.85, 0, { flatShading: true }), [(hash(seed, 'x', i) - 0.5) * 1.6, 2.7 + hash(seed, 'y', i) * 1.4, (hash(seed, 'z', i) - 0.5) * 1.4]);
    m.rotation.set(hash(seed, 'a', i) * 3, hash(seed, 'b', i) * 3, 0);
  }
  return g;
}

// A frustum (battered) box: bottom w x d, top inset on X by `inset`.
function pylonTower(parent, matFn, { x0, x1, z0, z1, h, inset }) {
  const geo = new THREE.BoxGeometry(x1 - x0, h, z1 - z0, 1, 1, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) p.setX(i, p.getX(i) - Math.sign(p.getX(i)) * inset);
  }
  geo.computeVertexNormals();
  const m = mesh(parent, geo, matFn(x1 - x0, h), [(x0 + x1) / 2, h / 2, (z0 + z1) / 2]);
  return m;
}

function sunDiscTexture() {
  const c = canvas(1024, 256);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 256);
  const gold = g.createLinearGradient(0, 0, 0, 256);
  gold.addColorStop(0, '#F6D98A');
  gold.addColorStop(0.5, '#C9973F');
  gold.addColorStop(1, '#8E6224');
  g.fillStyle = gold;
  // wings: feathered bands either side of the disc
  for (const s of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      const y = 70 + k * 26;
      g.moveTo(512 + s * 90, y);
      g.quadraticCurveTo(512 + s * 300, y - 30 + k * 6, 512 + s * (480 - k * 50), y + 10 + k * 4);
      g.lineTo(512 + s * (470 - k * 50), y + 26);
      g.quadraticCurveTo(512 + s * 300, y - 4 + k * 8, 512 + s * 90, y + 22);
      g.closePath();
      g.fill();
    }
  }
  g.beginPath(); g.arc(512, 120, 78, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#6B4718'; g.lineWidth = 6; g.stroke();
  // uraei (two little cobras) as simple curls
  for (const s of [-1, 1]) { g.beginPath(); g.arc(512 + s * 86, 190, 16, 0, Math.PI * 2); g.fill(); }
  return c;
}

function studdedDoor(parent, mat, stud, { w, h }) {
  const g = new THREE.Group();
  parent.add(g);
  mesh(g, new THREE.BoxGeometry(w, h, 0.09), mat, [0, h / 2, 0]);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 9; j++) {
    mesh(g, new THREE.SphereGeometry(0.028, 10, 8), stud, [-w / 2 + 0.16 + (i * (w - 0.32)) / 4, 0.35 + (j * (h - 0.7)) / 8, 0.05], { cast: false });
  }
  for (const y of [0.9, h - 0.9]) mesh(g, new THREE.BoxGeometry(w, 0.07, 0.11), stud, [0, y, 0.005]);
  return g;
}

export function buildStreet(scene, assets, { interiors = true } = {}) {
  const palette = loftPalette(assets);
  const M = loftMaterials(palette);
  const Z = STREET.facadeZ;
  scene.background = new THREE.Color('#BFD9F0');
  scene.fog = new THREE.Fog('#D7E6F0', 30, 110);

  // ---------------- ground
  const grassMat = new THREE.MeshStandardMaterial({ map: tex(grass(), { repeat: [60, 30] }), roughness: 0.95 });
  mesh(scene, new THREE.PlaneGeometry(160, 80), grassMat, [0, -0.002, -10], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const paverTex = tex(pavers(), { repeat: [1, 1] });
  const paverMat = new THREE.MeshStandardMaterial({ map: paverTex, roughness: 0.8 });
  const strip = (x0, x1, z0, z1, y = 0.004) => {
    const w = x1 - x0, d = z1 - z0;
    const geo = new THREE.PlaneGeometry(w, d);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * w) / 1.6, (z0 + uv.getY(i) * d) / 1.6);
    return mesh(scene, geo, paverMat, [(x0 + x1) / 2, y, (z0 + z1) / 2], { rot: [-Math.PI / 2, 0, 0], cast: false });
  };
  strip(-30, 30, STREET.walkZ[0], STREET.walkZ[1]);
  strip(-3.5, -1.7, -4.4, STREET.walkZ[0]);
  strip(5.4, 8.2, -4.95, STREET.walkZ[0]);
  strip(-0.35, 0.95, -9, STREET.walkZ[0], 0.003);
  // the street itself beyond the kerb
  mesh(scene, new THREE.PlaneGeometry(160, 9), std('#5D5E60', 0.9), [0, -0.05, 6.2], { rot: [-Math.PI / 2, 0, 0], cast: false });
  mesh(scene, new THREE.BoxGeometry(160, 0.14, 0.25), std('#BDB7AC', 0.8), [0, 0.02, 1.7]);

  // ---------------- the loft
  const L = STREET.loft, D = STREET.loftDoor;
  const brickTex = tex(brick({ base: '#A98C78', wash: 0.8 }), { repeat: [1, 1] });
  const brickMat = new THREE.MeshStandardMaterial({ roughness: 0.88, color: '#FFFFFF' });
  const loft = group(scene);
  const dx0 = D.x - D.w / 2, dx1 = D.x + D.w / 2;
  const T = 0.3;
  texBox(loft, brickTex, brickMat, [L.x0, dx0], [0, L.h], [Z - T, Z]);
  texBox(loft, brickTex, brickMat, [dx1, L.x1], [0, L.h], [Z - T, Z]);
  texBox(loft, brickTex, brickMat, [dx0, dx1], [D.h + D.landing, L.h], [Z - T, Z]);
  texBox(loft, brickTex, brickMat, [L.x1 - T, L.x1], [0, L.h], [Z - 9, Z - T]);
  mesh(loft, new THREE.BoxGeometry(L.x1 - L.x0 + 0.3, 0.35, 0.5), std('#E6DFD3', 0.8), [(L.x0 + L.x1) / 2, L.h + 0.05, Z + 0.1]);
  mesh(loft, new THREE.BoxGeometry(L.x1 - L.x0 + 0.1, 0.2, 9), std('#3A3B3E', 0.8), [(L.x0 + L.x1) / 2, L.h - 0.05, Z - 4.5]);
  // windows: big storefront left of the door, then two upper floors of tall steel windows
  const glass = new THREE.MeshPhysicalMaterial({ color: '#34495A', roughness: 0.06, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.5 });
  steelWindow(loft, M, { x: -6.3, y: 1.65, w: 4.6, h: 2.3, z: Z + 0.01, cols: 6, rows: 3, glass });
  steelWindow(loft, M, { x: -11.2, y: 1.65, w: 2.6, h: 2.3, z: Z + 0.01, cols: 3, rows: 3, glass });
  for (const y of [4.6, 7.7]) {
    for (const x of [-11.4, -8.6, -5.8, -3.0]) steelWindow(loft, M, { x, y, w: 2.0, h: 2.3, z: Z + 0.01, cols: 3, rows: 4, glass });
    steelWindow(loft, M, { x: -1.6, y, w: 1.0, h: 2.3, z: Z + 0.01, cols: 1, rows: 4, glass });
  }
  // porch: concrete landing and two steps, a steel canopy, planters with grasses
  const conc = new THREE.MeshStandardMaterial({ map: tex(concrete(), { repeat: [2, 1] }), roughness: 0.85 });
  mesh(loft, new THREE.BoxGeometry(2.8, D.landing, 1.3), conc, [D.x, D.landing / 2, Z + 0.65]);
  mesh(loft, new THREE.BoxGeometry(2.0, 0.15, 0.34), conc, [D.x, 0.075, Z + 1.47]);
  mesh(loft, new THREE.BoxGeometry(2.0, 0.04, 0.9), M.steel, [D.x, D.landing + 2.95, Z + 0.45]);
  for (const s of [-1, 1]) mesh(loft, new THREE.CylinderGeometry(0.008, 0.008, 1.1, 6), M.steel, [D.x + s * 0.9, D.landing + 3.35, Z + 0.4], { rot: [0.85, 0, 0], cast: false });
  const downlight = new THREE.PointLight('#FFD9A8', 1.2, 4, 2);
  downlight.position.set(D.x, D.landing + 2.6, Z + 0.6);
  loft.add(downlight);
  for (const x of [D.x - 1.65, D.x + 1.62]) {
    mesh(loft, new THREE.BoxGeometry(0.5, 0.55, 0.5), M.steel, [x, 0.275, Z + 0.9]);
    grassBlades(loft, { pos: [x, 0.55, Z + 0.9], r: 0.2, h: 0.75, n: 46, seed: `pl${x}` });
    contactShadow(loft, x, Z + 0.9, 0.9, 0.9, 0.5);
  }
  // the door: oak pivot leaf with a long black pull, hinged on its right edge (opens inward)
  const doorHinge = group(loft, [dx1, D.landing, Z - T / 2]);
  const doorLeaf = group(doorHinge, [-D.w / 2, 0, 0]);
  mesh(doorLeaf, new THREE.BoxGeometry(D.w - 0.01, D.h - 0.01, 0.06), M.door, [0, D.h / 2, 0]);
  for (const y of [0.6, 1.2, 1.8]) mesh(doorLeaf, new THREE.BoxGeometry(D.w * 0.86, 0.01, 0.004), std('#B8946C', 0.6), [0, y, 0.031], { cast: false });
  mesh(doorLeaf, new THREE.BoxGeometry(0.035, 1.2, 0.035), M.steel, [-D.w / 2 + 0.14, 1.15, 0.07]);
  for (const y of [0.6, 1.7]) mesh(doorLeaf, new THREE.BoxGeometry(0.025, 0.025, 0.06), M.steel, [-D.w / 2 + 0.14, y, 0.045]);
  // casing
  for (const x of [dx0 - 0.04, dx1 + 0.04]) mesh(loft, new THREE.BoxGeometry(0.08, D.h + 0.08, 0.08), M.steel, [x, D.landing + D.h / 2, Z + 0.02]);
  mesh(loft, new THREE.BoxGeometry(D.w + 0.16, 0.08, 0.08), M.steel, [D.x, D.landing + D.h + 0.04, Z + 0.02]);
  // T3 Code logo plate (the real logo when the overlay agent has fetched it), bell, number
  const logoCanvas = (() => {
    if (assets.t3logo) {
      const c = canvas(512, 512);
      const g = c.getContext('2d');
      g.fillStyle = '#141416';
      g.fillRect(0, 0, 512, 512);
      const img = assets.t3logo;
      const k = Math.min(380 / img.width, 380 / img.height);
      g.drawImage(img, 256 - (img.width * k) / 2, 256 - (img.height * k) / 2, img.width * k, img.height * k);
      return c;
    }
    return textPlate({ w: 512, h: 512, bg: '#141416', radius: 0, lines: [{ text: 'T3', size: 200, color: '#F6F2EA' }, { text: 'Code', size: 120, color: '#F6F2EA' }] });
  })();
  const plate = mesh(loft, new THREE.BoxGeometry(0.42, 0.42, 0.03), [M.steel, M.steel, M.steel, M.steel, new THREE.MeshStandardMaterial({ map: tex(logoCanvas), roughness: 0.4, metalness: 0.15 }), M.steel], [D.x + 1.05, D.landing + 1.55, Z + 0.016]);
  const bellPlate = mesh(loft, new THREE.CylinderGeometry(0.06, 0.06, 0.02, 24), M.brass, [D.x + 1.05, D.landing + 1.08, Z + 0.012], { rot: [Math.PI / 2, 0, 0] });
  const bellMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#FFC870', emissiveIntensity: 0.1, roughness: 0.3 });
  const bellButton = mesh(loft, new THREE.CylinderGeometry(0.026, 0.026, 0.025, 20), bellMat, [D.x + 1.05, D.landing + 1.08, Z + 0.03], { rot: [Math.PI / 2, 0, 0] });
  const number = textPlate({ w: 256, h: 256, bg: '#C9A25A', radius: 24, border: { color: '#7A5A22', width: 8, inset: 10 }, lines: [{ text: '3', size: 170, color: '#2B1F10' }] });
  mesh(loft, new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshStandardMaterial({ map: tex(number), roughness: 0.35, metalness: 0.6 }), [D.x - 0.95, D.landing + 1.75, Z + 0.006], { cast: false });

  let loftInside = null;
  if (interiors) {
    // a lit glimpse of the loft behind the door
    const room = group(scene);
    floorPlane(room, M, { x0: D.x - 1.8, x1: D.x + 1.8, z0: Z - 4.5, z1: Z - T });
    mesh(room, new THREE.BoxGeometry(3.6, 3.4, 0.1), M.wall, [D.x, 1.7, Z - 4.5]);
    for (const s of [-1, 1]) mesh(room, new THREE.BoxGeometry(0.1, 3.4, 4.3), M.wall, [D.x + s * 1.8, 1.7, Z - 2.35]);
    mesh(room, new THREE.BoxGeometry(3.7, 0.1, 4.4), M.ceiling, [D.x, 3.1, Z - 2.35]);
    plant(room, M, { pos: [D.x + 0.9, 0, Z - 3.9], kind: 'monstera', size: 1.0, seed: 'inside' });
    mesh(room, new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.8 }), [D.x - 0.5, 1.6, Z - 4.44]);
    const warm = new THREE.PointLight('#FFE7C4', 7, 7, 2);
    warm.position.set(D.x, 2.4, Z - 2.0);
    room.add(warm);
    room.position.y = D.landing;
    loftInside = room;
  }

  // ---------------- garden gap
  tree(scene, { pos: [0.4, 0, -8.2], s: 1.15, seed: 'gap' });
  tree(scene, { pos: [-15.5, 0, -7.5], s: 1.3, seed: 'farl' });
  tree(scene, { pos: [14.3, 0, -7.2], s: 1.25, seed: 'farr' });
  // round shrubs along the garden walk
  [[1.4, -5.0, 0.4], [1.45, -3.7, 0.34], [-0.5, -6.6, 0.4], [-4.6, -4.6, 0.38], [-13.6, -5.3, 0.5]].forEach(([x, z, r], i) => {
    const b = mesh(scene, new THREE.IcosahedronGeometry(r, 1), std(i % 2 ? '#5E8A4A' : '#6B9653', 0.85, 0, { flatShading: true }), [x, r * 0.8, z]);
    b.scale.y = 0.85;
    contactShadow(scene, x, z, r * 2.6, r * 2.6, 0.45);
  });

  // ---------------- the temple of Ptah
  const TP = STREET.temple, GT = STREET.gate;
  const ssTex = tex(sandstone({ base: '#D6C3A2' }), { repeat: [1, 1] });
  const ssMat = (w, h) => {
    const m = new THREE.MeshStandardMaterial({ map: ssTex.clone(), roughness: 0.85 });
    m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping;
    m.map.repeat.set(w / 3, h / 3);
    m.map.needsUpdate = true;
    return m;
  };
  const temple = group(scene);
  pylonTower(temple, ssMat, { x0: TP.left[0], x1: TP.left[1], z0: Z - 2.6, z1: Z, h: TP.h, inset: 0.4 });
  pylonTower(temple, ssMat, { x0: TP.right[0], x1: TP.right[1], z0: Z - 2.6, z1: Z, h: TP.h, inset: 0.4 });
  for (const [x0, x1] of [TP.left, TP.right]) {
    mesh(temple, new THREE.BoxGeometry(x1 - x0 - 0.6, 0.45, 2.9), std('#CFAE7C', 0.8), [(x0 + x1) / 2, TP.h + 0.1, Z - 1.25]);
    mesh(temple, new THREE.BoxGeometry(x1 - x0 - 0.5, 0.12, 2.95), std('#B88A3E', 0.4, 0.6), [(x0 + x1) / 2, TP.h - 0.12, Z - 1.25]);
  }
  // portal between the towers: jamb blocks, the lintel and its cornice
  mesh(temple, new THREE.BoxGeometry(TP.right[0] - TP.left[1] + 0.2, 1.5, 1.2), ssMat(2.6, 1.5), [(TP.left[1] + TP.right[0]) / 2, GT.h + GT.steps * GT.step + 0.75, Z - 0.45]);
  mesh(temple, new THREE.BoxGeometry(TP.right[0] - TP.left[1] + 0.6, 0.35, 1.4), std('#CFAE7C', 0.8), [(TP.left[1] + TP.right[0]) / 2, GT.h + GT.steps * GT.step + 1.6, Z - 0.45]);
  for (const x of [GT.x0 - 0.1, GT.x1 + 0.1]) mesh(temple, new THREE.BoxGeometry(0.2 + 0.2, GT.h + GT.steps * GT.step, 1.2), ssMat(0.4, 4.4), [x + (x < 6.8 ? -0.1 : 0.1), (GT.h + GT.steps * GT.step) / 2, Z - 0.45]);
  const disc = mesh(temple, new THREE.PlaneGeometry(2.3, 0.58), new THREE.MeshStandardMaterial({ map: tex(sunDiscTexture()), transparent: true, roughness: 0.3, metalness: 0.7, emissive: '#5A3A10', emissiveIntensity: 0.25 }), [(GT.x0 + GT.x1) / 2, GT.h + GT.steps * GT.step + 0.78, Z + 0.17], { cast: false });
  // steps up to the gate
  for (let i = 0; i < GT.steps; i++) {
    mesh(temple, new THREE.BoxGeometry(GT.x1 - GT.x0 + 1.6 - i * 0.3, GT.step * (i + 1), 1.2 - i * 0.32), std('#D6BE96', 0.8), [(GT.x0 + GT.x1) / 2, (GT.step * (i + 1)) / 2, Z + 0.6 - i * 0.16]);
  }
  const gy = GT.steps * GT.step;
  // bronze gates: two studded leaves hinged at the jambs, opening inward (-Z)
  const bronze = std('#7A5428', 0.38, 0.85, { envMapIntensity: 0.9 });
  const studMat = std('#D4A247', 0.3, 0.9);
  const leafW = (GT.x1 - GT.x0) / 2;
  const gates = [GT.x0, GT.x1].map((hx, i) => {
    const hinge = group(temple, [hx, gy, Z - 0.6]);
    const leaf = studdedDoor(hinge, bronze, studMat, { w: leafW - 0.01, h: GT.h });
    leaf.position.x = i === 0 ? leafW / 2 : -leafW / 2;
    return hinge;
  });
  // the Ptah emblem above the gate and a cartouche plaque on the left tower
  if (assets.emblemGold || assets.emblem) {
    const em = new THREE.MeshStandardMaterial({ map: new THREE.Texture(assets.emblemGold || assets.emblem), transparent: true, roughness: 0.35, metalness: 0.5 });
    em.map.colorSpace = THREE.SRGBColorSpace;
    em.map.needsUpdate = true;
    mesh(temple, new THREE.PlaneGeometry(0.5, 0.5), em, [(GT.x0 + GT.x1) / 2, GT.h + gy + 0.78, Z + 0.19], { cast: false });
  }
  const cart = textPlate({ w: 300, h: 640, bg: '#E9D3A6', radius: 140, border: { color: '#8E6224', width: 14, inset: 12 }, lines: [{ text: 'P', size: 120, color: '#5A3A10' }, { text: 'T', size: 120, color: '#5A3A10' }, { text: 'A', size: 120, color: '#5A3A10' }, { text: 'H', size: 120, color: '#5A3A10' }] });
  mesh(temple, new THREE.PlaneGeometry(0.42, 0.9), new THREE.MeshStandardMaterial({ map: tex(cart), roughness: 0.6 }), [TP.left[1] - 0.75, 2.0, Z + 0.02], { cast: false });
  // obelisks and braziers
  for (const x of [4.3, 9.3]) {
    const geo = new THREE.CylinderGeometry(0.18, 0.3, 4.2, 4, 1);
    geo.rotateY(Math.PI / 4);
    mesh(temple, geo, std('#D3B585', 0.8), [x, 2.1 + 0.3, Z + 1.5]);
    const cap = new THREE.ConeGeometry(0.26, 0.42, 4);
    cap.rotateY(Math.PI / 4);
    mesh(temple, cap, std('#D4A247', 0.3, 0.9), [x, 4.6 + 0.3, Z + 1.5]);
    mesh(temple, new THREE.BoxGeometry(0.8, 0.3, 0.8), std('#BFA278', 0.8), [x, 0.15, Z + 1.5]);
  }
  const braziers = [brazier(scene, 5.0, Z + 0.75, 'sbl', { intensity: 1.6 }), brazier(scene, 8.6, Z + 0.75, 'sbr', { intensity: 1.6 })];
  braziers.forEach((b) => b.group.scale.setScalar(0.8));

  let templeInside = null;
  if (interiors) {
    // Episode 1's painted hall through the gate, in warm haze
    const hall = group(scene);
    mesh(hall, new THREE.PlaneGeometry(4, 12), std('#2A2017', 0.4, 0.2), [(GT.x0 + GT.x1) / 2, gy + 0.001, Z - 6.5], { rot: [-Math.PI / 2, 0, 0], cast: false });
    for (const s of [-1, 1]) mesh(hall, new THREE.BoxGeometry(0.2, 7, 12), std('#2B2016', 0.8), [(GT.x0 + GT.x1) / 2 + s * 1.9, 3.5, Z - 6.5]);
    mesh(hall, new THREE.BoxGeometry(4.2, 0.2, 12), std('#1F170F', 0.9), [(GT.x0 + GT.x1) / 2, 6.0, Z - 6.5]);
    if (assets.temple) {
      const t = new THREE.Texture(assets.temple);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      mesh(hall, new THREE.PlaneGeometry(6.4, 6.4), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.9, 0.85, 0.78) }), [(GT.x0 + GT.x1) / 2, gy + 2.2, Z - 11.8], { cast: false });
    }
    const glow = new THREE.PointLight('#FFB45A', 5, 7, 2);
    glow.position.set((GT.x0 + GT.x1) / 2, 2.8, Z - 4.0);
    hall.add(glow);
    templeInside = hall;
  }

  // ---------------- sky, sun
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(260, 110), new THREE.MeshBasicMaterial({ map: tex(skyline({ seed: 'street', horizon: 0.72 })), fog: false }));
  sky.position.set(0, 110 * (0.72 - 0.5) - 1.0, -80);
  scene.add(sky);
  const sun = new THREE.DirectionalLight('#FFE6C4', 3.3);
  sun.position.set(-14, 13, 15);
  sun.target.position.set(0, 0, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const c = sun.shadow.camera;
  c.left = -18; c.right = 18; c.top = 14; c.bottom = -12; c.near = 1; c.far = 70;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#D6E8FF', '#A3B58E', 1.05));

  return {
    palette, M,
    loft: { door: { hinge: doorHinge, leaf: doorLeaf }, plate, bellMat, inside: loftInside },
    temple: { gates, braziers, inside: templeInside },
    update(t) { for (const b of braziers) b.update(t); },
  };
}
