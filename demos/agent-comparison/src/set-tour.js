// Ptah tour stations (Episode 2), built inside Episode 1's temple (temple.js) and
// lit by its lights. Metres, Y up, cameras on the +Z side looking toward the
// painted throne hall (-Z). Furniture is robot-scale (robots stand 0.88 m).
//
//   lanes ........ the Conductor's podium (0.4 m) at z -2.2; five gold lane strips fan
//                  out to five stone work desks (0.46 m) at z 0.55, x -2.4..2.4
//   review desk .. a stone desk (0.5 m) at z 0, the Conductor on a riser (0.5 m) behind
//   limit gates .. two stone arches side by side (x -0.9 and 0.9), a red AT LIMIT light
//                  box and a lowered gold barrier on the left, OPEN (green) on the right
//   stone fridge . a sandstone cabinet with gold trim and a hinged stone door; inside,
//                  glowing scrolls on shelves with labels that read from both sides
import * as THREE from 'three';
import { buildTemple, glyphTexture, canvasTexture } from './temple.js';
import { buildTempleLights } from './lighting.js';
import { tex, textPlate, documentPage, drawStamp, lightBox, canvas, roundRect } from './textures-loft.js';
import { std, mesh, group } from './props-loft.js';
import { contactShadow } from './set-loft.js';
import { hash } from './util.js';
import { lightCone } from './lighting.js';

export const STATIONS = {
  lanes: { podiumZ: -2.2, podiumTop: 0.4, deskZ: 0.62, spotZ: 0.08, deskTop: 0.46, xs: { Cursor: -2.4, Codex: -1.2, Claude: 0, OpenCode: 1.2, Antigravity: 2.4 } },
  review: { deskZ: 0, deskTop: 0.5, riserZ: -1.05, riserTop: 0.5 },
  gates: { xs: [-0.95, 0.95], z: -0.6, w: 1.25, h: 2.0 },
  fridge: { x: 0.9, z: -0.9, w: 0.9, h: 1.95, d: 0.75 },
};

const stone = () => std('#3A2F24', 0.62, 0.05);
const stoneLight = () => std('#9C8466', 0.7);
let glyphStone = null;
const carved = () => {
  glyphStone = glyphStone || canvasTexture(glyphTexture('gate', 256, 1024), { repeat: [1, 1] });
  return new THREE.MeshStandardMaterial({ map: glyphStone, color: '#C9B08A', roughness: 0.75 });
};
const gold = () => std('#C99A42', 0.3, 0.85);

export function templeWorld(scene, assets) {
  const temple = buildTemple(scene, assets);
  const lights = buildTempleLights(scene);
  // the round stone dais from Episode 1 under the stations
  mesh(scene, new THREE.CylinderGeometry(3.6, 3.65, 0.04, 96), std('#2B2219', 0.42, 0.1), [0, 0.02, -0.3], { cast: false });
  mesh(scene, new THREE.TorusGeometry(3.62, 0.014, 8, 160), gold(), [0, 0.04, -0.3], { rot: [Math.PI / 2, 0, 0], cast: false });
  return { temple, lights };
}

// ---------------------------------------------------------------- shared props

export function workDesk(parent, { pos, yaw = 0, w = 0.95, d = 0.5, h = 0.46 }) {
  const g = group(parent, pos, yaw);
  mesh(g, new THREE.BoxGeometry(w, 0.06, d), stone(), [0, h - 0.03, 0]);
  mesh(g, new THREE.BoxGeometry(w - 0.12, h - 0.06, d - 0.14), std('#2E251C', 0.7), [0, (h - 0.06) / 2, 0]);
  mesh(g, new THREE.BoxGeometry(w + 0.01, 0.014, d + 0.01), gold(), [0, h - 0.064, 0], { cast: false });
  contactShadow(g, 0, 0, w * 1.5, d * 1.8, 0.55, 0.045);
  return g;
}

/** Brass in-tray on a desk top; returns its group (contents sit at tray.floorY). */
export function tray(parent, { pos, w = 0.4, d = 0.3 }) {
  const g = group(parent, pos);
  const b = gold();
  mesh(g, new THREE.BoxGeometry(w, 0.012, d), b, [0, 0.006, 0]);
  for (const s of [-1, 1]) {
    mesh(g, new THREE.BoxGeometry(w, 0.05, 0.012), b, [0, 0.025, s * (d / 2)]);
    mesh(g, new THREE.BoxGeometry(0.012, 0.05, d), b, [s * (w / 2), 0.025, 0]);
  }
  g.userData.floorY = pos[1] + 0.012;
  return g;
}

export function oilLamp(parent, { pos }) {
  const g = group(parent, pos);
  mesh(g, new THREE.CylinderGeometry(0.05, 0.035, 0.05, 16), gold(), [0, 0.025, 0]);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFC870', toneMapped: false }));
  flame.scale.y = 1.8;
  flame.position.y = 0.075;
  g.add(flame);
  const l = new THREE.PointLight('#FFB060', 0.9, 1.6, 2);
  l.position.y = 0.12;
  g.add(l);
  return g;
}

/** A glowing job tablet (gold frame, warm face) used for jobs and the rerouted work. */
export function jobTablet(parent, { label = 'JOB', color = '#E8A33D' } = {}) {
  const g = new THREE.Group();
  parent.add(g);
  const face = textPlate({ w: 384, h: 256, bg: '#2A1D0E', radius: 22, border: { color: '#E9C46A', width: 10, inset: 8 }, lines: [{ text: label, size: 92, color: '#FFE6B0' }] });
  const m = new THREE.MeshStandardMaterial({ map: tex(face), emissive: '#FFFFFF', emissiveMap: tex(face), emissiveIntensity: 0.7, roughness: 0.4 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.018), [gold(), gold(), gold(), gold(), m, m]);
  box.castShadow = true;
  g.add(box);
  const glow = new THREE.PointLight(color, 0.6, 1.2, 2);
  g.add(glow);
  return g;
}

/** A sheet of paper (document) lying flat (+Y up); `stamped` shows the DELIVERED mark. */
export function documentSheet(parent, { w = 0.3, d = 0.4, title = 'DELIVERABLE', file = 'report.md' } = {}) {
  const plain = documentPage({ title, file, accent: '#2F5D62' });
  const stamped = documentPage({ title, file, accent: '#2F5D62', stamp: 'DELIVERED' });
  const mPlain = new THREE.MeshStandardMaterial({ map: tex(plain), roughness: 0.8 });
  const mStamped = new THREE.MeshStandardMaterial({ map: tex(stamped), roughness: 0.8 });
  const edge = std('#EFE6D4', 0.8);
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(w, 0.006, d), [edge, edge, mPlain, edge, edge, edge]);
  sheet.castShadow = sheet.receiveShadow = true;
  parent.add(sheet);
  return { mesh: sheet, setStamped: (on) => { sheet.material[2] = on ? mStamped : mPlain; } };
}

/** A rubber stamp: wooden knob and handle, a red-inked base. Pivot at the base. */
export function rubberStamp(parent) {
  const g = new THREE.Group();
  parent.add(g);
  mesh(g, new THREE.BoxGeometry(0.26, 0.05, 0.12), std('#5A3A20', 0.5), [0, 0.035, 0]);
  mesh(g, new THREE.BoxGeometry(0.25, 0.012, 0.11), std('#B3201B', 0.6), [0, 0.006, 0]);
  mesh(g, new THREE.CylinderGeometry(0.022, 0.03, 0.14, 12), std('#8B5A2B', 0.45), [0, 0.13, 0]);
  mesh(g, new THREE.SphereGeometry(0.05, 16, 12), std('#8B5A2B', 0.45), [0, 0.22, 0]);
  return g;
}

export function gavelProp(parent) {
  const g = new THREE.Group();
  const wood = std('#6E4A24', 0.45);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.3, 10), wood);
  handle.rotation.z = Math.PI / 2;
  handle.position.x = 0.15;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.15, 18), wood);
  head.rotation.x = Math.PI / 2;
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.014, 18), gold());
  b1.rotation.x = Math.PI / 2; b1.position.z = 0.058;
  const b2 = b1.clone(); b2.position.z = -0.058;
  for (const m of [handle, head, b1, b2]) { m.castShadow = true; g.add(m); }
  const pivot = new THREE.Group();
  g.position.x = -0.3;
  pivot.add(g);
  parent.add(pivot);
  return pivot;
}

// ---------------------------------------------------------------- the lanes

export function lanesStation(scene) {
  const L = STATIONS.lanes;
  const g = group(scene);
  // podium
  mesh(g, new THREE.CylinderGeometry(0.62, 0.7, L.podiumTop, 48), stone(), [0, L.podiumTop / 2, L.podiumZ]);
  mesh(g, new THREE.TorusGeometry(0.62, 0.016, 8, 64), gold(), [0, L.podiumTop, L.podiumZ], { rot: [Math.PI / 2, 0, 0], cast: false });
  // gold lane strips from the podium to each robot's spot, and the desks
  const laneMat = std('#D4A247', 0.3, 0.9, { emissive: '#5A3A10', emissiveIntensity: 0.6 });
  const desks = {};
  const trays = {};
  for (const [name, x] of Object.entries(L.xs)) {
    const a = new THREE.Vector3(x * 0.18, 0.045, L.podiumZ + 0.7);
    const b = new THREE.Vector3(x, 0.045, L.spotZ - 0.25);
    const len = a.distanceTo(b);
    for (const s of [-1, 1]) {
      const strip = mesh(g, new THREE.BoxGeometry(0.02, 0.006, len), laneMat, null, { cast: false });
      const n = new THREE.Vector3(b.z - a.z, 0, -(b.x - a.x)).normalize().multiplyScalar(s * 0.23);
      strip.position.copy(a).add(b).multiplyScalar(0.5).add(n);
      strip.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    }
    desks[name] = workDesk(g, { pos: [x, 0.04, L.deskZ] });
    trays[name] = tray(g, { pos: [x + 0.12, 0.04 + L.deskTop, L.deskZ + 0.02] });
    oilLamp(g, { pos: [x - 0.3, 0.04 + L.deskTop, L.deskZ - 0.08] });
  }
  return { group: g, desks, trays };
}

// ---------------------------------------------------------------- the review desk

export function reviewStation(scene, assets) {
  const R = STATIONS.review;
  const g = group(scene);
  const d = workDesk(g, { pos: [0, 0.04, R.deskZ], w: 1.25, d: 0.6, h: R.deskTop });
  mesh(g, new THREE.BoxGeometry(1.0, R.riserTop, 0.8), stone(), [0, R.riserTop / 2, R.riserZ]);
  mesh(g, new THREE.BoxGeometry(1.02, 0.014, 0.82), gold(), [0, R.riserTop, R.riserZ], { cast: false });
  // the sound block for the gavel
  mesh(g, new THREE.CylinderGeometry(0.075, 0.08, 0.035, 28), std('#2A190F', 0.45), [0.42, 0.04 + R.deskTop + 0.0175, R.deskZ - 0.12]);
  // a small sign
  const sign = textPlate({ w: 768, h: 192, bg: '#2A1D0E', radius: 16, border: { color: '#D4A247', width: 10, inset: 10 }, lines: [{ text: 'REVIEW', size: 110, color: '#F3D58A', letter: 8 }] });
  mesh(g, new THREE.PlaneGeometry(0.62, 0.155), new THREE.MeshStandardMaterial({ map: tex(sign), roughness: 0.45, metalness: 0.3 }), [0, 0.3, R.deskZ + 0.236], { cast: false });
  return { group: g };
}

/** A manila folder with a coloured tab and the owner's icon (the code under review). */
export function folder(parent, { icon = null, color = '#10A37F', label = 'my code' } = {}) {
  const c = canvas(512, 384);
  const g2 = c.getContext('2d');
  g2.fillStyle = '#E9C98E';
  g2.fillRect(0, 0, 512, 384);
  g2.fillStyle = color;
  g2.fillRect(0, 0, 512, 40);
  if (icon) {
    g2.fillStyle = '#FFF6E5';
    g2.beginPath(); g2.arc(110, 200, 74, 0, Math.PI * 2); g2.fill();
    g2.drawImage(icon, 56, 146, 108, 108);
  }
  g2.fillStyle = '#3A2A1A';
  g2.font = '54px "Archivo Black", "Arial Black", Arial, sans-serif';
  g2.fillText(label, 210, 220);
  const top = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.8 });
  const edge = std('#D9B87A', 0.8);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.25), [edge, edge, top, edge, edge, edge]);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

// ---------------------------------------------------------------- the limit gates

export function gateStation(scene) {
  const G = STATIONS.gates;
  const g = group(scene);
  const gates = G.xs.map((x, i) => {
    const a = group(g, [x, 0, G.z]);
    const pier = (s) => {
      mesh(a, new THREE.BoxGeometry(0.3, G.h, 0.44), carved(), [s * (G.w / 2 + 0.15), G.h / 2, 0]);
      mesh(a, new THREE.BoxGeometry(0.36, 0.16, 0.5), stone(), [s * (G.w / 2 + 0.15), 0.08, 0]);
      mesh(a, new THREE.BoxGeometry(0.32, 0.04, 0.46), gold(), [s * (G.w / 2 + 0.15), 0.6, 0], { cast: false });
    };
    pier(-1); pier(1);
    mesh(a, new THREE.BoxGeometry(G.w + 0.8, 0.34, 0.5), stone(), [0, G.h + 0.17, 0]);
    mesh(a, new THREE.BoxGeometry(G.w + 0.86, 0.04, 0.54), gold(), [0, G.h + 0.36, 0], { cast: false });
    const limit = i === 0;
    const signTex = tex(lightBox({ text: limit ? 'AT LIMIT' : 'OPEN', bg: limit ? '#B3201B' : '#1E7A4C', w: 1024, h: 300 }));
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: '#FFFFFF', emissiveMap: signTex, emissiveIntensity: limit ? 0.9 : 0.55, roughness: 0.35 });
    mesh(a, new THREE.BoxGeometry(G.w + 0.2, 0.36, 0.08), [std('#1A1410', 0.5), std('#1A1410', 0.5), std('#1A1410', 0.5), std('#1A1410', 0.5), signMat, std('#1A1410', 0.5)], [0, G.h + 0.6, 0.06]);
    const light = new THREE.PointLight(limit ? '#FF3B2F' : '#3DDC84', limit ? 1.6 : 0.8, 3.2, 2);
    light.position.set(0, G.h + 0.5, 0.6);
    a.add(light);
    // barrier: a gold bar pivoting at the left pier (down when at limit)
    const pivot = group(a, [-G.w / 2, 0.62, 0.3]);
    mesh(pivot, new THREE.BoxGeometry(G.w, 0.05, 0.05), std(limit ? '#C8342B' : '#D4A247', 0.35, 0.6), [G.w / 2, 0, 0]);
    for (let k = 0; k < 4; k++) mesh(pivot, new THREE.BoxGeometry(0.1, 0.052, 0.052), std('#F4EEE6', 0.5), [0.15 + k * 0.3, 0, 0], { cast: false });
    pivot.rotation.z = limit ? 0 : 1.35;
    return { group: a, signMat, light, pivot };
  });
  // a floor channel the job slides along, from the left gate to the right one
  mesh(g, new THREE.BoxGeometry(2.6, 0.012, 0.16), std('#D4A247', 0.3, 0.9, { emissive: '#5A3A10', emissiveIntensity: 0.5 }), [0, 0.046, G.z + 0.85], { cast: false });
  return { group: g, gates };
}

// ---------------------------------------------------------------- the stone fridge

function scrollLabel(text) {
  const c = canvas(384, 160);
  const g = c.getContext('2d');
  g.fillStyle = '#F2E2BC';
  roundRect(g, 6, 6, 372, 148, 18);
  g.fill();
  g.strokeStyle = '#8E6224';
  g.lineWidth = 8;
  roundRect(g, 14, 14, 356, 132, 12);
  g.stroke();
  g.fillStyle = '#3A2410';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 70;
  g.font = `${size}px "Archivo Black", "Arial Black", Arial, sans-serif`;
  while (size > 18 && g.measureText(text).width > 330) { size -= 2; g.font = `${size}px "Archivo Black", "Arial Black", Arial, sans-serif`; }
  g.fillText(text, 192, 84);
  return c;
}

export function stoneFridge(scene, { pos, yaw = 0, labels = [] }) {
  const F = STATIONS.fridge;
  const g = group(scene, pos, yaw);
  const body = std('#3B3128', 0.55, 0.05);
  const t = 0.07;
  const { w, h, d } = F;
  const back = mesh(g, new THREE.BoxGeometry(w, h, t), body, [0, h / 2, -d / 2 + t / 2]);
  for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(t, h, d), body, [s * (w / 2 - t / 2), h / 2, 0]);
  mesh(g, new THREE.BoxGeometry(w + 0.08, 0.1, d + 0.06), std('#2E261E', 0.6), [0, h + 0.05, 0]);
  mesh(g, new THREE.BoxGeometry(w + 0.1, 0.03, d + 0.08), gold(), [0, h + 0.115, 0], { cast: false });
  mesh(g, new THREE.BoxGeometry(w, 0.1, d), body, [0, 0.05, 0]);
  const liner = new THREE.MeshStandardMaterial({ color: '#2A1E14', emissive: '#FFB45A', emissiveIntensity: 0, roughness: 0.8 });
  const linerMesh = mesh(g, new THREE.PlaneGeometry(w - 2 * t, h - 0.1), liner, [0, h / 2 + 0.05, -d / 2 + t + 0.002], { cast: false });
  // shelves of scrolls: rolled parchment lying across each shelf (axis along X, so
  // nothing points at a lens inside), wooden end caps and knobs, the rolled paper
  // edge on each end, and a tag hung from the shelf's front lip that reads from both sides
  const shelfYs = [0.42, 0.86, 1.3];
  const parch = canvas(256, 128);
  {
    const pg = parch.getContext('2d');
    pg.fillStyle = '#EAD7AE';
    pg.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 120; i++) { pg.fillStyle = `rgba(120,80,30,${0.04 + 0.05 * hash('pa', i)})`; pg.fillRect(hash('px', i) * 256, hash('py', i) * 128, 6 + 20 * hash('pw', i), 2); }
    pg.fillStyle = 'rgba(90,60,25,0.35)';
    for (let r = 0; r < 6; r++) pg.fillRect(20, 14 + r * 19, 120 + 90 * hash('pl', r), 4);
  }
  const spiral = canvas(128, 128);
  {
    const sg = spiral.getContext('2d');
    sg.fillStyle = '#E2CC9C';
    sg.fillRect(0, 0, 128, 128);
    sg.strokeStyle = 'rgba(110,75,30,0.75)';
    sg.lineWidth = 3;
    sg.beginPath();
    for (let a = 0; a < Math.PI * 9; a += 0.08) { const r = 4 + a * 2.0; sg.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
    sg.stroke();
  }
  const scrollMat = new THREE.MeshStandardMaterial({ map: tex(parch), roughness: 0.75, emissive: '#FFC870', emissiveIntensity: 0 });
  const endMat = new THREE.MeshStandardMaterial({ map: tex(spiral), roughness: 0.8, emissive: '#FFC870', emissiveIntensity: 0 });
  const wood = std('#5E3A1E', 0.5);
  const scrolls = [];
  const tags = [];
  let k = 0;
  shelfYs.forEach((y, si) => {
    mesh(g, new THREE.BoxGeometry(w - 2 * t, 0.025, d - t - 0.04), std('#5A4A38', 0.7), [0, y, -0.01], { cast: false });
    mesh(g, new THREE.BoxGeometry(w - 2 * t, 0.03, 0.02), gold(), [0, y, d / 2 - 0.05], { cast: false });
    for (const sx of [-0.2, 0.2]) {
      for (const [dz, dy] of [[0.04, 0], [-0.08, 0], [-0.02, 0.07]]) {
        const s = group(g, [sx, y + 0.0125 + 0.036 + dy, dz]);
        s.rotation.y = (hash('sy', si, sx, dz) - 0.5) * 0.12;
        mesh(s, new THREE.CylinderGeometry(0.036, 0.036, 0.22, 20), [scrollMat, endMat, endMat], [0, 0, 0], { rot: [0, 0, Math.PI / 2] });
        for (const e of [-1, 1]) {
          mesh(s, new THREE.CylinderGeometry(0.014, 0.014, 0.03, 10), wood, [e * 0.125, 0, 0], { rot: [0, 0, Math.PI / 2], cast: false });
          mesh(s, new THREE.SphereGeometry(0.02, 12, 8), wood, [e * 0.148, 0, 0], { cast: false });
        }
        scrolls.push(s);
      }
      const text = labels[k++] || 'SESSION';
      const lt = tex(scrollLabel(text));
      const tag = new THREE.MeshStandardMaterial({ map: lt, roughness: 0.6, emissive: '#FFFFFF', emissiveMap: lt, emissiveIntensity: 0.3, side: THREE.FrontSide });
      const ty = y - 0.075;
      const tz = d / 2 - 0.045;
      mesh(g, new THREE.BoxGeometry(0.004, 0.04, 0.004), std('#3A2A1A', 0.6), [sx, y - 0.025, tz], { cast: false });
      for (const [z, ry] of [[tz + 0.004, 0], [tz - 0.004, Math.PI]]) tags.push(mesh(g, new THREE.PlaneGeometry(0.2, 0.083), tag, [sx, ty, z], { rot: [0, ry, 0], cast: false }));
    }
  });
  // door hinged on the left front edge
  const hinge = group(g, [-w / 2, 0, d / 2]);
  const door = group(hinge, [w / 2, 0, 0]);
  const doorMat = new THREE.MeshStandardMaterial({ map: canvasTexture(glyphTexture('fridge', 256, 512)), color: '#D9C29A', roughness: 0.65 });
  mesh(door, new THREE.BoxGeometry(w, h - 0.02, 0.07), [body, body, body, body, doorMat, body], [0, h / 2, 0.035]);
  mesh(door, new THREE.BoxGeometry(0.04, 0.5, 0.04), gold(), [w / 2 - 0.1, h * 0.58, 0.1]);
  // a gold ankh-ish medallion on the door
  mesh(door, new THREE.TorusGeometry(0.07, 0.016, 8, 24), gold(), [0, h * 0.78, 0.075], { cast: false });
  mesh(door, new THREE.BoxGeometry(0.03, 0.22, 0.02), gold(), [0, h * 0.64, 0.075], { cast: false });
  mesh(door, new THREE.BoxGeometry(0.16, 0.03, 0.02), gold(), [0, h * 0.7, 0.075], { cast: false });
  const lamp = new THREE.PointLight('#FFC27A', 0, 2.4, 2);
  lamp.position.set(0, h * 0.7, 0.05);
  g.add(lamp);
  const spill = new THREE.SpotLight('#FFD39A', 0, 5, 0.8, 0.6, 1.4);
  spill.position.set(0, h * 0.55, d / 2 - 0.1);
  spill.target.position.set(0, 0.7, d / 2 + 2);
  g.add(spill, spill.target);
  contactShadow(g, 0, 0, w * 1.6, d * 1.6, 0.6, 0.045);
  return { group: g, hinge, lamp, spill, liner, scrollMat, endMat, shelfYs, w, h, d, back, linerMesh };
}
