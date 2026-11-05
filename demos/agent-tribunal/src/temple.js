// The temple of Ptah: the world the table sits in.
//
// The painted judgement hall (assets/backgrounds/temple-bg.webp, 1024 px) is mapped
// onto a far, shallow curved panel (r 20 m, 100 degrees) whose painted floor line
// (row 735) sits on the real floor, so its throne stands straight behind the
// Conductor's bench. Haze sits over it. Dark hieroglyph walls close the rest of
// the circle, and 3D pillars, two bronze braziers, a light shaft and a stone
// architrave carrying the gold TRIBUNAL inscription give near/mid parallax.
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { lightCone } from './lighting.js';
import { hash, noise1 } from './util.js';

export const TEMPLE = {
  fog: '#1C140C',
  fogDensity: 0.03,
  radius: 20,
  height: 35,
  arc: 1.75, // radians covered by the painting (35 m of wall)
  horizon: 735 / 1024, // painted floor line, from the top of the image
  architrave: { y: 4.35, z: -5.6, half: 3.3 },
};

const std = (color, roughness = 0.6, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

function canvasTexture(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

// Dark polished stone tiles (4 x 4 per canvas) with per-tile tone and faint gold veins.
function tileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  const n = 4, s = 1024 / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = hash('tile', x, y);
      const base = 20 + Math.round(v * 14);
      g.fillStyle = `rgb(${base + 10},${base + 4},${base - 4})`;
      g.fillRect(x * s, y * s, s, s);
      // mottling and a gold vein
      for (let k = 0; k < 40; k++) {
        const a = hash('m', x, y, k);
        g.fillStyle = `rgba(${a > 0.5 ? '60,44,26' : '8,6,4'},${0.05 + 0.08 * hash('ma', x, y, k)})`;
        g.beginPath();
        g.arc(x * s + hash('mx', x, y, k) * s, y * s + hash('my', x, y, k) * s, 8 + 40 * hash('mr', x, y, k), 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = 'rgba(170,120,50,0.18)';
      g.lineWidth = 1.5;
      g.beginPath();
      let px = x * s + hash('vx', x, y) * s, py = y * s;
      g.moveTo(px, py);
      for (let k = 1; k <= 8; k++) { px += (hash('vv', x, y, k) - 0.5) * 50; py += s / 8; g.lineTo(px, py); }
      g.stroke();
    }
  }
  g.strokeStyle = '#070503';
  g.lineWidth = 5;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(1024, i * s); g.stroke();
  }
  return c;
}

// Engraved hieroglyph columns in dull gold on dark stone.
function glyphTexture(seed, w = 256, h = 1024) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#1D140C';
  g.fillRect(0, 0, w, h);
  const cols = Math.max(1, Math.round(w / 128));
  const cw = w / cols;
  for (let col = 0; col < cols; col++) {
    const x0 = col * cw;
    g.strokeStyle = 'rgba(150,105,45,0.55)';
    g.lineWidth = 3;
    g.strokeRect(x0 + 10, 10, cw - 20, h - 20);
    for (let row = 0, y = 30; y < h - 60; row++) {
      const kind = Math.floor(hash(seed, col, row) * 6);
      const cx = x0 + cw / 2, sz = cw * 0.28;
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(0,0,0,0.6)';
      const draw = (dx, dy) => {
        g.beginPath();
        if (kind === 0) { g.arc(cx + dx, y + sz * 0.6 + dy, sz * 0.4, 0, Math.PI * 2); g.moveTo(cx + dx, y + sz + dy); g.lineTo(cx + dx, y + sz * 2.2 + dy); g.moveTo(cx - sz * 0.6 + dx, y + sz * 1.3 + dy); g.lineTo(cx + sz * 0.6 + dx, y + sz * 1.3 + dy); }
        else if (kind === 1) { g.ellipse(cx + dx, y + sz + dy, sz * 0.9, sz * 0.45, 0, 0, Math.PI * 2); g.moveTo(cx + sz * 0.15 + dx, y + sz + dy); g.arc(cx + dx, y + sz + dy, sz * 0.15, 0, Math.PI * 2); }
        else if (kind === 2) { for (let k = 0; k < 3; k++) { g.moveTo(cx - sz + dx, y + sz * (0.6 + k * 0.6) + dy); for (let z = 0; z < 6; z++) g.lineTo(cx - sz + (z + 1) * sz / 3 + dx, y + sz * (0.6 + k * 0.6) + (z % 2 ? -8 : 8) + dy); } }
        else if (kind === 3) { g.moveTo(cx + dx, y + dy); g.lineTo(cx + dx, y + sz * 2.2 + dy); g.moveTo(cx + dx, y + sz * 0.4 + dy); g.quadraticCurveTo(cx + sz + dx, y + sz * 0.2 + dy, cx + sz * 0.8 + dx, y + sz + dy); }
        else if (kind === 4) { g.rect(cx - sz * 0.8 + dx, y + dy, sz * 1.6, sz * 2); g.moveTo(cx - sz * 0.5 + dx, y + sz + dy); g.lineTo(cx + sz * 0.5 + dx, y + sz + dy); }
        else { g.moveTo(cx - sz + dx, y + sz * 2 + dy); g.quadraticCurveTo(cx + dx, y - sz * 0.3 + dy, cx + sz + dx, y + sz * 2 + dy); g.moveTo(cx + sz * 0.3 + dx, y + sz * 0.5 + dy); g.arc(cx + sz * 0.3 + dx, y + sz * 0.5 + dy, 4, 0, Math.PI * 2); }
        g.stroke();
      };
      draw(2, 2);
      g.strokeStyle = 'rgba(176,128,58,0.75)';
      draw(0, 0);
      y += sz * 2.6;
    }
  }
  return c;
}

function backdrop(scene, image) {
  const T = TEMPLE;
  const geo = new THREE.CylinderGeometry(T.radius, T.radius, T.height, 72, 1, true, Math.PI - T.arc / 2, T.arc);
  let mat;
  if (image) {
    const tex = new THREE.Texture(image);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1; // seen from inside the cylinder: flip so the painting is not mirrored
    tex.offset.x = 1;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: true, color: new THREE.Color(0.92, 0.9, 0.88) });
  } else {
    mat = new THREE.MeshBasicMaterial({ color: '#1E1208', side: THREE.BackSide, fog: true });
  }
  const m = new THREE.Mesh(geo, mat);
  // painted floor line on the real floor: bottom of the panel sits below ground
  m.position.y = T.height / 2 - (1 - T.horizon) * T.height;
  m.position.z = -0.8;
  scene.add(m);
  // dark engraved walls close the rest of the circle (cameras sometimes look sideways)
  const wallTex = canvasTexture(glyphTexture('wall', 512, 1024), { repeat: [14, 1] });
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(T.radius + 0.05, T.radius + 0.05, T.height, 96, 1, true, Math.PI + T.arc / 2, Math.PI * 2 - T.arc),
    new THREE.MeshStandardMaterial({ map: wallTex, color: '#8A7A66', roughness: 0.85, side: THREE.BackSide }),
  );
  wall.position.copy(m.position);
  scene.add(wall);
  return m;
}

function floor(scene) {
  const tex = canvasTexture(tileTexture(), { repeat: [90 / 3.2, 90 / 3.2] });
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex, color: '#E8D6B8', roughness: 0.24, metalness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 0.5,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), mat);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  scene.add(m);
}

function pillar(scene, x, z, { h = 9, r = 0.6, seed = 0 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  const tex = canvasTexture(glyphTexture(`p${seed}`, 512, 1024), { repeat: [2, 1.6] });
  const stone = new THREE.MeshStandardMaterial({ map: tex, color: '#B8A68C', roughness: 0.75 });
  const dark = std('#211810', 0.7);
  const gold = std('#B88A3E', 0.35, 0.8);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, h, 32), stone);
  shaft.position.y = h / 2;
  const base = new THREE.Mesh(new THREE.BoxGeometry(r * 2.6, 0.35, r * 2.6), dark);
  base.position.y = 0.175;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.08, 0.12, 32), gold);
  band.position.y = 0.6;
  for (const m of [shaft, base, band]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  return g;
}

let flameTex = null;
function flameTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.filter = 'blur(7px)';
  const grad = g.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, 'rgba(255,240,190,1)');
  grad.addColorStop(0.25, 'rgba(255,190,80,0.95)');
  grad.addColorStop(0.6, 'rgba(255,110,25,0.6)');
  grad.addColorStop(1, 'rgba(200,40,0,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(64, 14);
  g.bezierCurveTo(86, 80, 116, 140, 108, 196);
  g.bezierCurveTo(100, 240, 28, 240, 20, 196);
  g.bezierCurveTo(12, 140, 44, 80, 64, 14);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function brazier(scene, x, z, seed) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  const bronze = std('#7A5428', 0.38, 0.85);
  const H = 1.25;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const top = new THREE.Vector3(Math.cos(a) * 0.22, H - 0.1, Math.sin(a) * 0.22);
    const foot = new THREE.Vector3(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, top.distanceTo(foot), 8), bronze);
    leg.position.copy(top).add(foot).multiplyScalar(0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
    leg.castShadow = true;
    g.add(leg);
  }
  const profile = [];
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * (Math.PI / 2); profile.push(new THREE.Vector2(0.05 + Math.sin(a) * 0.45, H - Math.cos(a) * 0.28)); }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), new THREE.MeshStandardMaterial({ color: '#7A5428', roughness: 0.38, metalness: 0.85, side: THREE.DoubleSide }));
  bowl.castShadow = true;
  g.add(bowl);
  const ember = new THREE.Mesh(new THREE.CircleGeometry(0.44, 32), new THREE.MeshBasicMaterial({ color: '#FF7A1A', toneMapped: false }));
  ember.rotation.x = -Math.PI / 2;
  ember.position.y = H - 0.02;
  g.add(ember);
  // flame: three crossed additive cards with a soft teardrop texture, flickered by seeded noise of time
  flameTex = flameTex || flameTexture();
  const flames = [0, 1, 2].map((i) => {
    const geo = new THREE.PlaneGeometry(0.62, 1.05);
    geo.translate(0, 0.5, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: flameTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
    m.position.y = H - 0.12;
    m.rotation.y = (i * Math.PI) / 3;
    m.userData.noDepth = true;
    g.add(m);
    return m;
  });
  const light = new THREE.PointLight('#FF8A3D', 9, 9, 2);
  light.position.set(0, H + 0.35, 0);
  g.add(light);
  return {
    group: g,
    update(t) {
      flames.forEach((m, i) => {
        const n1 = noise1(t * (6 + i * 2.3), `${seed}f${i}`);
        const n2 = noise1(t * (4.1 + i), `${seed}w${i}`);
        m.scale.set(1 + 0.1 * n2, 1 + 0.2 * n1, 1);
        m.rotation.y = (i * Math.PI) / 3 + 0.25 * n2;
      });
      light.intensity = 9 * (1 + 0.18 * noise1(t * 9, `${seed}l`));
    },
  };
}

function architrave(scene, font) {
  const A = TEMPLE.architrave;
  const g = new THREE.Group();
  g.position.set(0, 0, A.z);
  scene.add(g);
  const stone = std('#3A2E22', 0.7);
  const gold = std('#D4A247', 0.3, 0.9, { emissive: '#3A2208', emissiveIntensity: 0.4 });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(A.half * 2 + 1.6, 0.85, 0.75), stone);
  lintel.position.y = A.y;
  lintel.castShadow = lintel.receiveShadow = true;
  g.add(lintel);
  for (const y of [A.y - 0.45, A.y + 0.45]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(A.half * 2 + 1.7, 0.06, 0.8), gold);
    trim.position.y = y;
    g.add(trim);
  }
  if (font) {
    const geo = new TextGeometry('TRIBUNAL', { font, size: 0.48, depth: 0.05, curveSegments: 5, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2 });
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, 0);
    const text = new THREE.Mesh(geo, gold);
    text.position.set(0, A.y, 0.38);
    g.add(text);
  }
  return g;
}

export function buildTemple(scene, assets) {
  scene.background = new THREE.Color(TEMPLE.fog);
  scene.fog = new THREE.FogExp2(TEMPLE.fog, TEMPLE.fogDensity);
  floor(scene);
  backdrop(scene, assets.temple);
  const A = TEMPLE.architrave;
  // the architrave's pillars frame the bench and the painted throne behind it
  pillar(scene, -A.half, A.z, { h: A.y - 0.42, r: 0.42, seed: 1 });
  pillar(scene, A.half, A.z, { h: A.y - 0.42, r: 0.42, seed: 2 });
  architrave(scene, assets.font);
  // a ring of tall pillars around the hall for parallax in side-looking shots
  const ring = [-150, -118, -62, 62, 118, 150, 180];
  ring.forEach((d, i) => {
    const a = THREE.MathUtils.degToRad(d);
    const R = 8.5;
    pillar(scene, R * Math.sin(a), -R * Math.cos(a), { h: 10, r: 0.62, seed: 10 + i });
  });
  const braziers = [brazier(scene, -3.4, -3.2, 'bl'), brazier(scene, 3.5, -2.9, 'br')];
  // light shaft from the roof onto the dais, echoing the painting's skylight
  scene.add(lightCone(new THREE.Vector3(0.3, 9.5, -1.6), new THREE.Vector3(0, 0.2, -0.6), { radius: 1.9, opacity: 0.06, color: '#FFE2B0' }));
  return {
    braziers,
    update(t) { for (const b of braziers) b.update(t); },
  };
}

