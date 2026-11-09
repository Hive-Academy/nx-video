import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { assetUrl } from './assets.js';
import { createRobot } from './robot.js';
import { hash } from './util.js';
export const W = 1080, H = 1350;
let pmrem, craftRenderer;
export function initCraft(renderer) { if (craftRenderer !== renderer) { pmrem = new THREE.PMREMGenerator(renderer); craftRenderer = renderer; } }
export function roomEnvironment() { return pmrem.fromScene(new RoomEnvironment(), 0.04).texture; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// ------------------------------------------------------------------ loaders
const TP = (p) => assetUrl(`assets/third-party/${p}`);
const gltf = new GLTFLoader();
const texLoader = new THREE.TextureLoader();
const PENDING = [];
export const whenTexturesReady = () => Promise.all(PENDING);
const glb = async (p) => (await gltf.loadAsync(TP(`models/${p}`))).scene;
function tex(p, { srgb = true, repeat = 1 } = {}) {
  let done; PENDING.push(new Promise((r) => { done = r; }));
  const t = texLoader.load(TP(p), done, undefined, done);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}
async function hdri(p) {
  const loader = new HDRLoader().setDataType(THREE.FloatType);
  const t = await loader.loadAsync(TP(p));
  t.mapping = THREE.EquirectangularReflectionMapping;
  // the brightest pixel is the sun: returned as a direction in the HDRI's own frame
  const { data, width, height } = t.image;
  let best = 0, bx = 0, by = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const l = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
    if (l > best) { best = l; bx = x; by = y; }
  }
  const u = bx / width, v = 1 - by / height;
  return { tex: t, sunU: u, sunElev: (v - 0.5) * 180 };
}

// Scale, ground and place a model: s (uniform kit scale) or h (target height) or w (width).
function fit(obj, { s, h, w, at = [0, 0, 0], yaw = 0, sink = 0 } = {}) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const k = s ?? (h ? h / size.y : w / Math.max(size.x, size.z));
  obj.scale.multiplyScalar(k);
  const b = new THREE.Box3().setFromObject(obj);
  const c = b.getCenter(new THREE.Vector3());
  obj.position.sub(V(c.x, b.min.y, c.z));
  const wrap = new THREE.Group();
  wrap.add(obj);
  wrap.position.set(at[0], at[1] - sink, at[2]);
  wrap.rotation.y = yaw;
  wrap.userData.size = b.getSize(new THREE.Vector3());
  return wrap;
}
function shadows(o, cast = true, receive = true) {
  o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = receive; } });
  return o;
}
// Remap materials by name to the episode palette (Kenney kits name them carpet, wood, ...).
function recolor(o, map) {
  o.traverse((m) => {
    if (!m.isMesh) return;
    const one = !Array.isArray(m.material);
    const mats = (one ? [m.material] : m.material).map((mt) => {
      const r = map[mt.name] || map['*'];
      if (!r) return mt;
      const n = mt.clone();
      if (r.color) n.color.set(r.color);
      if (r.map) n.map = r.map;
      if (r.normalMap) n.normalMap = r.normalMap;
      if (r.roughness != null) n.roughness = r.roughness;
      if (r.metalness != null) n.metalness = r.metalness;
      if (r.emissive) { n.emissive = new THREE.Color(r.emissive); n.emissiveIntensity = r.ei ?? 1; }
      if (r.opacity != null) { n.transparent = true; n.opacity = r.opacity; n.depthWrite = false; }
      return n;
    });
    m.material = one ? mats[0] : mats;
  });
  return o;
}
// Robot facing: the rig faces +X; yaw so it faces the horizontal direction (dx, dz).
const yawToward = (from, to) => Math.atan2(-(to.z - from.z), to.x - from.x);
function robot(assets, name, at, lookAt, { scale = 0.38, pose = {}, badge = true } = {}) {
  const r = createRobot(assets, name, { scale, badge });
  r.root.position.copy(at);
  r.root.rotation.y = yawToward(at, lookAt);
  r.apply(pose);
  shadows(r.root);
  r.blob.castShadow = false;
  return r;
}
function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function canvasTex(c, { srgb = true, repeat = null } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 8;
  return t;
}
function bolt(a, b, seed, { depth = 6, jag = 0.32, core = 0.012, glow = 0.05, color = '#9CC8FF' } = {}) {
  let pts = [a.clone(), b.clone()];
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      const len = p.distanceTo(q);
      const m = p.clone().lerp(q, 0.5);
      m.x += (hash(seed, d, i, 'x') - 0.5) * len * jag;
      m.y += (hash(seed, d, i, 'y') - 0.5) * len * jag * 0.5;
      m.z += (hash(seed, d, i, 'z') - 0.5) * len * jag;
      next.push(m, q);
    }
    pts = next;
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 2, core, 6), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false })));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 2, glow, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })));
  g.userData.points = pts;
  return g;
}

function sandMaterial(repeat) {
  return new THREE.MeshStandardMaterial({
    color: '#E4C08C',
    normalScale: new THREE.Vector2(0.35, 0.35),
    normalMap: tex('textures/aerial_sand/aerial_sand_nor_gl_1k.jpg', { srgb: false, repeat }),
    roughnessMap: tex('textures/aerial_sand/aerial_sand_rough_1k.jpg', { srgb: false, repeat }),
    roughness: 1,
  });
}
function stoneMaterial(tint = '#E3C79A', repeat = 1) {
  // Rock030 is a grey-brown rock: lift it into sandstone with an over-unity tint
  const c = new THREE.Color(tint);
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color().setRGB(c.r * 2.5, c.g * 2.15, c.b * 1.6),
    map: tex('textures/rock030/Rock030_1K-JPG_Color.jpg', { repeat }),
    normalMap: tex('textures/rock030/Rock030_1K-JPG_NormalGL.jpg', { srgb: false, repeat }),
    roughnessMap: tex('textures/rock030/Rock030_1K-JPG_Roughness.jpg', { srgb: false, repeat }),
    roughness: 1,
  });
}
const dune = (x, z) => 0.9 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.038) + 0.45 * Math.sin(x * 0.11 + z * 0.07) + 0.18 * Math.sin(x * 0.31 - z * 0.23);
function sandGround() {
  const g = new THREE.PlaneGeometry(700, 700, 280, 280);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z - 4);
    const flat = Math.min(1, Math.max(0, (r - 6) / 30)); // flat work area near the camera
    p.setY(i, dune(x, z) * flat * (1 + Math.max(0, r - 60) / 40));
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, sandMaterial(150));
  m.receiveShadow = true;
  return m;
}
// Step pyramid under construction: instanced stone blocks on the outer ring of each tier
// (a plain core fills the inside); the top tiers are incomplete.
function dust(count, centre, spread, seed) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = centre.x + (hash(seed, i, 'x') - 0.5) * spread.x;
    pos[i * 3 + 1] = centre.y + hash(seed, i, 'y') * spread.y;
    pos[i * 3 + 2] = centre.z + (hash(seed, i, 'z') - 0.5) * spread.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const [c, x] = canvas2d(64, 64);
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,230,190,1)'); gr.addColorStop(1, 'rgba(255,230,190,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.05, map: canvasTex(c), transparent: true, opacity: 0.7, depthWrite: false, color: '#FFD9A0' }));
}


export { V, TP, glb, tex, hdri, fit, shadows, recolor, yawToward, robot, canvas2d, canvasTex, bolt, sandMaterial, stoneMaterial, dune, sandGround, dust };
