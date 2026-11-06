// The scoreboard (Episode 2, rows S1-S2): a carved basalt slab on the temple dais,
// one column per robot in cast order (never ranked), each with its icon medallion and
// name, then carved tally marks for DELIVERED and FAILED that fill with gold.
// Metres, Y up; the slab faces +Z (the cameras), front face at z = -1.45.
//
// The counts are deliberately close (every column mostly delivered, two or three
// misses each); Codex sits mid-pack.
import * as THREE from 'three';
import { AGENTS } from './assets.js';
import { tex, canvas, textPlate } from './textures-loft.js';
import { std, mesh, group } from './props-loft.js';
import { glyphTexture, canvasTexture } from './temple.js';

export const BOARD = {
  z: -1.45, w: 4.1, y0: 0.18, y1: 2.95, depth: 0.32,
  order: ['Claude', 'Codex', 'Cursor', 'Antigravity', 'OpenCode'],
  xs: [-1.2, -0.52, 0.16, 0.84, 1.52],
  counts: { Claude: [13, 2], Codex: [11, 3], Cursor: [12, 2], Antigravity: [10, 2], OpenCode: [12, 3] },
  rows: { delivered: [2.0, 1.72, 1.44], failed: [0.86] }, // centre y of each tally row
  labelX: -1.78,
};

function medallion(icon, color, letter) {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#F3D58A');
  grad.addColorStop(0.5, '#C99A42');
  grad.addColorStop(1, '#8E6224');
  g.fillStyle = grad;
  g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#F7EEDC';
  g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.fill();
  if (icon) {
    g.save();
    g.beginPath(); g.arc(128, 128, 96, 0, Math.PI * 2); g.clip();
    g.drawImage(icon, 128 - 72, 128 - 72, 144, 144);
    g.restore();
  } else {
    g.fillStyle = color;
    g.beginPath(); g.arc(128, 128, 90, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFF6E5';
    g.font = '110px "Archivo Black", "Arial Black", Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(letter, 128, 134);
  }
  return c;
}

/**
 * Tally marks for one count: groups of five (four strokes and a diagonal strike),
 * two groups per row. Returns [{x, y, rot, len}] in column-local coordinates.
 */
function tallyLayout(count, rowsY) {
  const marks = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 10);
    const inRow = i % 10;
    const grp = Math.floor(inRow / 5);
    const k = inRow % 5;
    const gx = (grp - 0.5) * 0.24;
    const y = rowsY[Math.min(row, rowsY.length - 1)];
    if (k < 4) marks.push({ x: gx - 0.066 + k * 0.044, y, rot: 0, len: 0.17 });
    else marks.push({ x: gx, y, rot: 1.1, len: 0.23 });
  }
  return marks;
}

export function scoreboard(scene, assets) {
  const B = BOARD;
  const g = group(scene, [0, 0, B.z]);
  const basalt = std('#2C251F', 0.6, 0.05);
  const glyphs = new THREE.MeshStandardMaterial({ map: canvasTexture(glyphTexture('score', 512, 1024), { repeat: [3, 1] }), color: '#6E6050', roughness: 0.7 });
  const gold = std('#D4A247', 0.3, 0.85);
  const h = B.y1 - B.y0;
  // the slab, a plinth, a gold frame and carved side panels
  mesh(g, new THREE.BoxGeometry(B.w, h, B.depth), [glyphs, glyphs, basalt, basalt, basalt, basalt], [0, B.y0 + h / 2, -B.depth / 2]);
  mesh(g, new THREE.BoxGeometry(B.w + 0.3, 0.2, B.depth + 0.25), std('#3A2F24', 0.6), [0, 0.1, -B.depth / 2]);
  mesh(g, new THREE.BoxGeometry(B.w + 0.2, 0.18, B.depth + 0.12), std('#3A2F24', 0.6), [0, B.y1 + 0.09, -B.depth / 2]);
  for (const y of [B.y1 - 0.04, B.y0 + 0.06]) mesh(g, new THREE.BoxGeometry(B.w - 0.1, 0.035, 0.02), gold, [0, y, 0.006], { cast: false });
  for (const x of [-B.w / 2 + 0.05, B.w / 2 - 0.05]) mesh(g, new THREE.BoxGeometry(0.035, h - 0.1, 0.02), gold, [x, B.y0 + h / 2, 0.006], { cast: false });
  // divider between delivered and failed
  mesh(g, new THREE.BoxGeometry(B.w - 0.3, 0.02, 0.015), gold, [0.12, 1.16, 0.006], { cast: false });
  // row labels carved in the left margin
  const label = (text, y) => {
    const c = textPlate({ w: 512, h: 128, bg: null, lines: [{ text, size: 84, color: '#E9C46A', letter: 4 }] });
    mesh(g, new THREE.PlaneGeometry(0.56, 0.14), new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, toneMapped: false }), [B.labelX, y, 0.008], { cast: false });
  };
  label('DELIVERED', 1.72);
  label('FAILED', 0.86);
  // columns
  const marks = [];
  B.order.forEach((name, ci) => {
    const x = B.xs[ci];
    const col = group(g, [x, 0, 0]);
    // column groove
    mesh(col, new THREE.BoxGeometry(0.56, 2.05, 0.01), std('#231D18', 0.75), [0, 1.45, 0.001], { cast: false });
    const icon = assets.icons?.[AGENTS[name].icon] || null;
    const med = new THREE.MeshStandardMaterial({ map: tex(medallion(icon, AGENTS[name].color, name[0])), roughness: 0.4, metalness: 0.2 });
    mesh(col, new THREE.CylinderGeometry(0.17, 0.17, 0.04, 40), [gold, med, gold], [0, 2.62, 0.02], { rot: [Math.PI / 2, 0, 0] }).rotateY(Math.PI);
    const nameTex = textPlate({ w: 512, h: 112, bg: null, lines: [{ text: name.toUpperCase(), size: 74, color: '#E9C46A', letter: 2 }] });
    mesh(col, new THREE.PlaneGeometry(0.52, 0.114), new THREE.MeshBasicMaterial({ map: tex(nameTex), transparent: true, toneMapped: false }), [0, 2.32, 0.008], { cast: false });
    const [del, fail] = B.counts[name];
    const add = (list, kind) => list.forEach((m, k) => {
      const mat = new THREE.MeshStandardMaterial({ color: '#1A1511', emissive: '#FFC35A', emissiveIntensity: 0, roughness: 0.4, metalness: 0.3 });
      const bar = mesh(col, new THREE.BoxGeometry(0.022, m.len, 0.012), mat, [m.x, m.y, 0.01], { cast: false });
      bar.rotation.z = m.rot;
      marks.push({ name, kind, k, mat, col: ci });
    });
    add(tallyLayout(del, B.rows.delivered), 'delivered');
    add(tallyLayout(fail, B.rows.failed), 'failed');
  });
  const glow = new THREE.PointLight('#FFC35A', 0, 4.5, 2);
  glow.position.set(0.1, 1.5, B.z + 0.9);
  scene.add(glow);
  return { group: g, marks, glow };
}
