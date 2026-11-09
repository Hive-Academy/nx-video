// Ptah as a giant: a stylised, cute, low-poly sandstone figure as tall as the
// step pyramid, built purely from Three.js primitives + one canvas wrap-lines
// texture (no external models or images). Classic iconography: mummiform
// cloaked body, tight blue skullcap with a gold band, straight beard, both
// hands forward holding the was-sceptre topped with a djed pillar and an ankh.
// The eyes (and the djed/ankh, when Ptah speaks) glow.
//
// Faces +Z at group yaw 0. ~8.5 model units tall; the caller scales/places it.
// The build is static: set-desert's plan.update animates the returned
// { headGroup, eyeMat, djedMat, ankhMat, eyeLight } as pure functions of t.
import * as THREE from 'three';
import { std, mesh, group } from './props-loft.js';
import { canvas, tex } from './textures-loft.js';
import { hash } from './util.js';

// Fine mummy-wrap lines, the cloak's map.
function wrapLines() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#DCC49C';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10) {
    g.strokeStyle = `rgba(122, 96, 64, ${0.16 + hash('wrap', y) * 0.18})`;
    g.lineWidth = 1 + hash('wrap', 'w', y) * 1.5;
    g.beginPath();
    g.moveTo(0, y + hash('wrap', 'o', y) * 3);
    for (let x = 0; x <= 256; x += 32) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 1.5);
    g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const x = hash('wrap', 's', i) * 256;
    g.strokeStyle = 'rgba(122, 96, 64, 0.22)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 6, 256);
    g.stroke();
  }
  return c;
}

export function buildPtah() {
  const g = new THREE.Group();
  g.name = 'ptah';

  const stone = new THREE.MeshStandardMaterial({ map: tex(wrapLines(), { repeat: [5, 9] }), roughness: 0.88, envMapIntensity: 0.3 });
  const capBlue = std('#2B4C9B', 0.55);
  const beardMat = std('#6B5638', 0.7);
  const dark = std('#8A7050', 0.8);
  const gold = std('#E8B54A', 0.35, 0.7, { envMapIntensity: 0.9 });
  const djedMat = new THREE.MeshStandardMaterial({ color: '#F0C566', emissive: '#F2C14E', emissiveIntensity: 0.25, roughness: 0.35, metalness: 0.55, envMapIntensity: 0.9 });
  const ankhMat = djedMat.clone();
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#FFD27A', emissive: '#FFC24E', emissiveIntensity: 0.5, roughness: 0.3 });

  // plinth + feet
  mesh(g, new THREE.BoxGeometry(3.2, 0.55, 2.4), stone, [0, 0.275, 0]);
  for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(0.34, 0.24, 0.52), stone, [s * 0.3, 0.3, 0.72]);

  // mummiform cloaked body (a lathe: narrow base, full mid, tapering shoulders)
  const profile = [
    [1.02, 0.55], [1.06, 1.4], [1.1, 2.4], [1.12, 3.4], [1.13, 4.6],
    [1.1, 5.6], [1.0, 6.35], [0.78, 6.85], [0.5, 7.05], [0.46, 7.15],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  mesh(g, new THREE.LatheGeometry(profile, 28), stone, [0, 0, 0]);

  // shoulders and neck
  mesh(g, new THREE.SphereGeometry(1.02, 24, 16), stone, [0, 6.55, 0]).scale.set(1, 0.5, 0.8);
  mesh(g, new THREE.CylinderGeometry(0.45, 0.5, 0.5, 20), stone, [0, 7.3, 0]);

  // the head (turns down to the sofa at `rise`)
  const headGroup = group(g, [0, 7.75, 0.05]);
  mesh(headGroup, new THREE.SphereGeometry(0.72, 26, 18), stone, [0, 0, 0]).scale.set(0.92, 1, 0.88);
  // tight blue skullcap + gold band
  mesh(headGroup, new THREE.SphereGeometry(0.75, 26, 14, 0, Math.PI * 2, 0, Math.PI / 2), capBlue, [0, 0.09, 0]).scale.set(0.92, 1, 0.88);
  mesh(headGroup, new THREE.TorusGeometry(0.69, 0.035, 10, 32), gold, [0, 0.1, 0], { rot: [Math.PI / 2, 0, 0] });
  // glowing eyes + brows, nose, mouth, ears
  for (const s of [-1, 1]) {
    mesh(headGroup, new THREE.SphereGeometry(0.1, 16, 12), eyeMat, [s * 0.28, 0.06, 0.6]).scale.set(1, 1.25, 0.5);
    mesh(headGroup, new THREE.BoxGeometry(0.22, 0.035, 0.05), dark, [s * 0.28, 0.24, 0.62], { rot: [0, 0, -s * 0.12] });
    mesh(headGroup, new THREE.SphereGeometry(0.09, 12, 10), stone, [s * 0.66, 0.02, 0.05]);
  }
  mesh(headGroup, new THREE.BoxGeometry(0.1, 0.16, 0.12), stone, [0, -0.06, 0.68]);
  mesh(headGroup, new THREE.BoxGeometry(0.26, 0.035, 0.04), dark, [0, -0.26, 0.64]);
  // the straight ceremonial beard with a gold tip
  mesh(headGroup, new THREE.BoxGeometry(0.18, 0.72, 0.15), beardMat, [0, -0.62, 0.42], { rot: [-0.1, 0, 0] });
  mesh(headGroup, new THREE.BoxGeometry(0.16, 0.1, 0.13), gold, [0, -1.0, 0.47], { rot: [-0.1, 0, 0] });
  // the eye glow rides with the head
  const eyeLight = new THREE.PointLight('#FFC24E', 0, 7, 1.8);
  eyeLight.position.set(0, 0.1, 1.1);
  headGroup.add(eyeLight);

  // both hands forward on the sceptre shaft (mitten spheres: robots have no
  // fingers, and neither does a low-poly god)
  for (const s of [-1, 1]) mesh(g, new THREE.SphereGeometry(0.17, 14, 10), stone, [s * 0.42, 5.45, 1.05]).scale.set(0.8, 0.62, 1.15);

  // the was-sceptre: forked base, shaft, djed pillar, ankh
  const sceptre = group(g, [0, 0, 1.02], 0);
  sceptre.rotation.x = -0.06;
  mesh(sceptre, new THREE.CylinderGeometry(0.06, 0.085, 4.9, 14), gold, [0, 4.55, 0]);
  for (const s of [-1, 1]) mesh(sceptre, new THREE.CylinderGeometry(0.028, 0.035, 0.6, 10), gold, [s * 0.07, 1.85, 0.02], { rot: [0, 0, s * 0.32] });
  // djed pillar: column + four cross-bars
  mesh(sceptre, new THREE.CylinderGeometry(0.07, 0.07, 0.85, 12), djedMat, [0, 7.4, 0]);
  for (const [y, w] of [[7.72, 0.3], [7.56, 0.34], [7.4, 0.34], [7.24, 0.3]]) mesh(sceptre, new THREE.BoxGeometry(w, 0.09, 0.14), djedMat, [0, y, 0]);
  // ankh: loop + cross
  mesh(sceptre, new THREE.TorusGeometry(0.16, 0.045, 10, 24), ankhMat, [0, 8.3, 0]);
  mesh(sceptre, new THREE.BoxGeometry(0.075, 0.42, 0.075), ankhMat, [0, 8.05, 0]);
  mesh(sceptre, new THREE.BoxGeometry(0.36, 0.075, 0.075), ankhMat, [0, 8.18, 0]);

  return { group: g, headGroup, eyeMat, djedMat, ankhMat, eyeLight, height: 8.6 };
}
