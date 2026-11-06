// The night shift (Episode 2, rows N1-N2): a long stone table on the dais of the
// temple at night. A scroll (a PR diff drawn as abstract code-like glyph lines, with
// added/removed markers; no real code) unrolls along it; four robots lean over it
// with magnifying lenses tinted in their own colours; the fifth checks their notes
// with a stamp; a small DRY RUN sign. Metres, Y up, cameras on +Z.
import * as THREE from 'three';
import { AGENTS } from './assets.js';
import { tex, canvas, textPlate, drawStamp, roundRect } from './textures-loft.js';
import { std, mesh, group } from './props-loft.js';
import { hash } from './util.js';

export const NIGHT = {
  table: { x: 0, z: -0.62, w: 2.9, d: 0.95, top: 0.44 },
  scroll: { w: 2.3, d: 0.46 },
  lensers: { Claude: -1.13, Codex: -0.38, Antigravity: 0.38, OpenCode: 1.13 },
  rowZ: -1.32,
  verifier: { name: 'Cursor', x: 1.95, z: -0.42 },
};

// A diff as abstract glyph lines: gutter numbers, +/- markers, coloured runs.
function diffTexture(seed = 'diff') {
  const c = canvas(2048, 410);
  const g = c.getContext('2d');
  g.fillStyle = '#EFE3C6';
  g.fillRect(0, 0, 2048, 410);
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(120,90,50,${0.03 + 0.04 * hash(seed, 'p', i)})`;
    g.fillRect(hash(seed, 'x', i) * 2048, hash(seed, 'y', i) * 410, 3, 2);
  }
  const lineH = 26;
  for (let col = 0; col < 3; col++) {
    const x0 = 40 + col * 680;
    for (let r = 0; r < 14; r++) {
      const y = 26 + r * lineH;
      const kind = hash(seed, col, r, 'k');
      const add = kind < 0.2, del = kind > 0.84;
      if (add || del) {
        g.fillStyle = add ? 'rgba(61,170,100,0.22)' : 'rgba(200,70,60,0.2)';
        g.fillRect(x0 - 8, y - 4, 640, lineH - 4);
        g.fillStyle = add ? '#2E8B57' : '#B33A2E';
        g.fillRect(x0 + 34, y + 6, 10, 4);
        if (add) g.fillRect(x0 + 37, y + 3, 4, 10);
      }
      g.fillStyle = 'rgba(80,60,40,0.45)';
      g.fillRect(x0, y + 4, 18, 8);
      let x = x0 + 60 + 20 * Math.floor(hash(seed, col, r, 'ind') * 4);
      const n = 2 + Math.floor(hash(seed, col, r, 'n') * 5);
      for (let k = 0; k < n && x < x0 + 620; k++) {
        const w = 30 + 90 * hash(seed, col, r, k, 'w');
        const pal = ['#3A3A3A', '#2F5D62', '#8E6224', '#6A4C93', '#3A3A3A'];
        g.fillStyle = pal[Math.floor(hash(seed, col, r, k, 'c') * pal.length)];
        roundRect(g, x, y + 3, w, 11, 4);
        g.fill();
        x += w + 12;
      }
    }
  }
  return c;
}

export function nightTable(scene) {
  const T = NIGHT.table;
  const g = group(scene, [T.x, 0, T.z]);
  const stone = std('#2E261E', 0.55, 0.05);
  const gold = std('#C99A42', 0.3, 0.85);
  mesh(g, new THREE.BoxGeometry(T.w, 0.07, T.d), stone, [0, T.top - 0.035, 0]);
  mesh(g, new THREE.BoxGeometry(T.w + 0.01, 0.014, T.d + 0.01), gold, [0, T.top - 0.072, 0], { cast: false });
  for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(0.3, T.top - 0.07, T.d - 0.2), std('#241D17', 0.6), [s * (T.w / 2 - 0.3), (T.top - 0.07) / 2 + 0.04, 0]);
  return g;
}

/** The scroll: a paper strip that unrolls along +X from a roller (set(u), u 0..1). */
export function diffScroll(scene) {
  const T = NIGHT.table, S = NIGHT.scroll;
  const y = T.top + 0.004;
  const x0 = T.x - S.w / 2;
  const tx = tex(diffTexture());
  const paper = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.85, emissive: '#FFFFFF', emissiveMap: tx, emissiveIntensity: 0.12 });
  const geo = new THREE.PlaneGeometry(1, S.d);
  geo.translate(0.5, 0, 0);
  const strip = new THREE.Mesh(geo, paper);
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(x0, y, T.z);
  strip.receiveShadow = true;
  scene.add(strip);
  const rollMat = std('#E6D5B0', 0.8);
  const rod = std('#C99A42', 0.3, 0.85);
  const roller = new THREE.Group();
  scene.add(roller);
  mesh(roller, new THREE.CylinderGeometry(0.05, 0.05, S.d + 0.02, 20), rollMat, [0, 0, 0], { rot: [Math.PI / 2, 0, 0] });
  mesh(roller, new THREE.CylinderGeometry(0.014, 0.014, S.d + 0.14, 8), rod, [0, 0, 0], { rot: [Math.PI / 2, 0, 0], cast: false });
  const stop = new THREE.Group();
  scene.add(stop);
  mesh(stop, new THREE.CylinderGeometry(0.03, 0.03, S.d + 0.02, 16), rollMat, [0, 0, 0], { rot: [Math.PI / 2, 0, 0] });
  mesh(stop, new THREE.CylinderGeometry(0.012, 0.012, S.d + 0.12, 8), rod, [0, 0, 0], { rot: [Math.PI / 2, 0, 0], cast: false });
  stop.position.set(x0, y + 0.03, T.z);
  function set(u) {
    const k = THREE.MathUtils.clamp(u, 0.001, 1);
    strip.scale.x = S.w * k;
    // texture shows the unrolled part only (no stretching)
    tx.repeat.set(k, 1);
    tx.offset.set(0, 0);
    const r = 0.05 * (1 - 0.45 * k);
    roller.position.set(x0 + S.w * k, y + r, T.z);
    roller.scale.set(1, r / 0.05, r / 0.05);
    roller.rotation.z = -k * S.w / 0.04;
  }
  set(0);
  return { strip, roller, set };
}

/** A magnifying lens: a ring in the robot's colour, tinted glass, a short handle. */
export function lens(scene, color) {
  const g = new THREE.Group();
  scene.add(g);
  const ring = std(color, 0.35, 0.3, { emissive: color, emissiveIntensity: 0.25 });
  mesh(g, new THREE.TorusGeometry(0.085, 0.014, 12, 36), ring, [0, 0, 0]);
  const glass = new THREE.MeshPhysicalMaterial({ color, roughness: 0.04, transparent: true, opacity: 0.32, clearcoat: 1, envMapIntensity: 1.4, depthWrite: false });
  mesh(g, new THREE.CircleGeometry(0.08, 32), glass, [0, 0, 0], { cast: false });
  mesh(g, new THREE.CylinderGeometry(0.012, 0.014, 0.13, 10), std('#3A2A1A', 0.5), [0, -0.15, 0]);
  return g;
}

/** The verifier's notes card and stamp; setStamped(true) shows the CHECKED mark. */
export function notesCard(scene) {
  const draw = (stamped) => {
    const c = canvas(320, 400);
    const g = c.getContext('2d');
    g.fillStyle = '#F7EFDC';
    g.fillRect(0, 0, 320, 400);
    g.fillStyle = '#3A2A1A';
    g.font = '34px "Archivo Black", "Arial Black", Arial, sans-serif';
    g.fillText('NOTES', 24, 52);
    ['#D97757', '#10A37F', '#4F8BF5', '#FFFFFF'].forEach((col, i) => {
      g.fillStyle = col === '#FFFFFF' ? '#222' : col;
      g.beginPath(); g.arc(36, 100 + i * 70, 12, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(40,30,20,0.4)';
      for (let k = 0; k < 2; k++) g.fillRect(60, 90 + i * 70 + k * 16, 150 + 80 * hash('nc', i, k), 7);
    });
    if (stamped) drawStamp(g, 170, 230, 'CHECKED', { size: 52, angle: -0.22 });
    return c;
  };
  const mPlain = new THREE.MeshStandardMaterial({ map: tex(draw(false)), roughness: 0.8 });
  const mStamp = new THREE.MeshStandardMaterial({ map: tex(draw(true)), roughness: 0.8 });
  const edge = std('#E8DCC0', 0.8);
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.006, 0.32), [edge, edge, mPlain, edge, edge, edge]);
  card.castShadow = card.receiveShadow = true;
  scene.add(card);
  return { mesh: card, setStamped: (on) => { card.material[2] = on ? mStamp : mPlain; } };
}

export function dryRunSign(scene) {
  const g = new THREE.Group();
  scene.add(g);
  const face = textPlate({ w: 512, h: 256, bg: '#F4EBD6', radius: 26, border: { color: '#2F5D62', width: 14, inset: 10 }, lines: [{ text: 'DRY RUN', size: 120, color: '#1F3F44', letter: 4 }] });
  const m = new THREE.MeshStandardMaterial({ map: tex(face), roughness: 0.6 });
  const edge = std('#C9B58E', 0.7);
  mesh(g, new THREE.BoxGeometry(0.42, 0.21, 0.016), [edge, edge, edge, edge, m, edge], [0, 0.2, 0]);
  mesh(g, new THREE.CylinderGeometry(0.01, 0.012, 0.3, 8), std('#6E4A24', 0.5), [0, -0.02, -0.01]);
  return g;
}
