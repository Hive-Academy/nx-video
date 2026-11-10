import * as THREE from 'three';
import { hash } from './util.js';
import { V, W, H, glb, fit, shadows, recolor, robot, canvas2d, canvasTex, dust, roomEnvironment } from './craft.js';
function vortexTexture() {
  const [c, g] = canvas2d(1024, 2048);
  const grad = g.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, '#6B3E1E'); grad.addColorStop(0.5, '#C98A48'); grad.addColorStop(1, '#6B3E1E');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 2048);
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = `rgba(${hash(5, i) < 0.5 ? '255,214,150' : '90,50,22'},${0.15 + hash(5, i, 'a') * 0.35})`;
    g.lineWidth = 2 + hash(5, i, 'w') * 10;
    const x = hash(5, i, 'x') * 1024;
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 60, 700, x - 60, 1400, x, 2048); g.stroke();
  }
  // carved glyph rows: ankh, eye, sun disc, reed, water
  g.strokeStyle = 'rgba(255,226,170,0.9)'; g.fillStyle = 'rgba(255,226,170,0.9)'; g.lineWidth = 7; g.lineCap = 'round';
  for (let row = 0; row < 8; row++) for (let k = 0; k < 5; k++) {
    const x = 100 + k * 205 + (row % 2) * 100, y = 140 + row * 250, kind = (row + k) % 5;
    g.beginPath();
    if (kind === 0) { g.ellipse(x, y - 34, 20, 26, 0, 0, 7); g.moveTo(x, y - 8); g.lineTo(x, y + 60); g.moveTo(x - 34, y + 6); g.lineTo(x + 34, y + 6); }
    if (kind === 1) { g.ellipse(x, y, 44, 20, 0, 0, 7); g.moveTo(x + 12, y); g.arc(x, y, 12, 0, 7); g.moveTo(x - 10, y + 20); g.quadraticCurveTo(x - 20, y + 54, x + 10, y + 60); }
    if (kind === 2) { g.arc(x, y, 30, 0, 7); for (let a = 0; a < 8; a++) { g.moveTo(x + Math.cos(a) * 42, y + Math.sin(a) * 42); g.lineTo(x + Math.cos(a) * 58, y + Math.sin(a) * 58); } }
    if (kind === 3) { g.moveTo(x, y + 60); g.lineTo(x, y - 40); g.quadraticCurveTo(x + 30, y - 60, x + 6, y - 20); }
    if (kind === 4) { for (let w = 0; w < 3; w++) { g.moveTo(x - 50, y + w * 22); for (let s = 0; s < 6; s++) g.lineTo(x - 50 + s * 20 + 10, y + w * 22 + (s % 2 ? -10 : 10)); } }
    g.stroke();
  }
  return canvasTex(c);
}
export async function buildVortexLook(assets, renderer) {
  const scene = new THREE.Scene();
  scene.environment = roomEnvironment();
  scene.environmentIntensity = 0.5;
  scene.background = new THREE.Color('#1A0D05');
  renderer.toneMappingExposure = 1.05;
  scene.fog = new THREE.Fog('#5A3216', 14, 70);
  const t = vortexTexture();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 4);
  // a funnel twisting toward a hot gold light at the far end
  const g = new THREE.CylinderGeometry(3.4, 9, 80, 96, 60, true);
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) + uv.getY(i) * 1.6);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), a = Math.atan2(pos.getZ(i), pos.getX(i));
    const r = Math.hypot(pos.getX(i), pos.getZ(i)) * (1 + 0.08 * Math.sin(a * 5 + y * 0.4));
    pos.setX(i, Math.cos(a) * r); pos.setZ(i, Math.sin(a) * r);
  }
  g.computeVertexNormals();
  const tunnel = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, side: THREE.BackSide, roughness: 0.9, emissive: '#5A2A0C', emissiveMap: t, emissiveIntensity: 0.35 }));
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.z = -34;
  scene.add(tunnel);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(3.6, 64), new THREE.MeshBasicMaterial({ color: '#FFE3A6', toneMapped: false }));
  sunDisc.position.z = -73;
  scene.add(sunDisc);
  const glow = new THREE.PointLight('#FFC679', 60, 60, 1.2);
  glow.position.set(0, 0, -20);
  scene.add(glow);
  // streaks of sand rushing past the camera
  const streakMat = new THREE.MeshBasicMaterial({ color: '#FFD9A0', transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const streaks = [];
  for (let i = 0; i < 160; i++) {
    const a = hash(8, i) * Math.PI * 2, r = 1.6 + hash(8, i, 'r') * 2.6, len = 1.5 + hash(8, i, 'l') * 4;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, len), streakMat);
    s.position.set(Math.cos(a) * r, Math.sin(a) * r, -2 - hash(8, i, 'z') * 30);
    s.rotation.z = a;
    s.rotation.y = 0.12 * Math.sin(a);
    scene.add(s); streaks.push(s);
  }
  const dustPoints = dust(1200, V(0, -2.5, -10), V(7, 5, 22), 33);
  scene.add(dustPoints);
  // the sofa and both robots tumbling through it
  const sofa = await glb('office/sofa.glb');
  const tumble = new THREE.Group();
  const sofaG = shadows(fit(recolor(sofa, { carpet: { color: '#2F3B52', roughness: 0.92 }, wood: { color: '#5A3B27' } }), { s: 2.04, yaw: Math.PI }));
  tumble.add(sofaG);
  const seat = sofaG.userData.size.y * 0.47;
  const cam = V(0, 0.3, 3.6);
  const codex = robot(assets, 'Codex', V(-0.42, seat, 0.08), V(0, 0, 4), { pose: { eyeSX: 1.4, eyeSY: 1.4, pitch: -0.2, roll: 0.15, hop: 0.25 } });
  const claude = robot(assets, 'Claude', V(0.45, seat + 0.1, 0.12), V(0, 0, 4), { pose: { eyeSX: 1.3, eyeSY: 1.45, pitch: -0.25, roll: -0.2, hop: 0.4 } });
  tumble.add(codex.root, claude.root);
  tumble.position.set(0, -0.65, -0.4);
  tumble.rotation.set(0.25, -0.35, 0.42);
  scene.add(tumble);
  // A remnant of the office floor drops from beneath the sofa as the whiteout clears.
  const fallingFloor = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.09, 48), new THREE.MeshStandardMaterial({ color: '#6B4C36', roughness: 0.85, transparent: true }));
  fallingFloor.position.set(0, -1.55, -0.4);
  scene.add(fallingFloor);
  const key = new THREE.DirectionalLight('#FFE0B0', 1.2);
  key.position.set(-2, 3, 4);
  scene.add(key);
  const back = new THREE.DirectionalLight('#FF9440', 1.6);
  back.position.set(0, 1, -10);
  scene.add(back);
  const camera = new THREE.PerspectiveCamera(58, W / H, 0.05, 200);
  camera.position.copy(cam);
  camera.lookAt(V(0, -0.15, -3));
  camera.rotateZ(-0.12);
  return { scene, camera, bloom: { strength: 0.5, radius: 0.7, threshold: 0.95 }, exposure: 1.05, handles: { tunnel, sunDisc, glow, streaks, dustPoints, tumble, sofa: sofaG, codex, claude, key, back, fallingFloor } };
}

