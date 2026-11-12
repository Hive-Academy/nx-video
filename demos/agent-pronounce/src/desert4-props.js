// Desert v4 set kit: PBR materials with world-scaled UVs, height fog with sun in-scatter,
// the carved monument frame, battered walls, block courses, ramps with timber sleepers,
// sledges with lashed blocks, ropes, scaffolding and atmosphere cards.
// Static geometry only; every variation is seeded with util.hash (no Math.random).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tex, canvas2d, canvasTex, shadows } from './craft.js';
import { hash, hashRange } from './util.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------ UVs and PBR
// Planar UVs from the dominant normal axis, in metres / tile (a cheap box projection).
export function planarUV(geo, tile = 2, { name = 'uv', ox = 0, oy = 0 } = {}) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az) { u = p.getZ(i) * Math.sign(n.getX(i) || 1); v = p.getY(i); }
    else if (ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else { u = -p.getX(i) * Math.sign(n.getZ(i) || 1); v = p.getY(i); }
    uv[i * 2] = u / tile + ox;
    uv[i * 2 + 1] = v / tile + oy;
  }
  geo.setAttribute(name, new THREE.BufferAttribute(uv, 2));
  return geo;
}

const MAPS = new Map();
function maps(id) {
  if (!MAPS.has(id)) {
    const b = `textures/ph/${id}/${id}`;
    MAPS.set(id, { map: tex(`${b}_diff_1k.jpg`), normalMap: tex(`${b}_nor_gl_1k.jpg`, { srgb: false }), arm: tex(`${b}_arm_1k.jpg`, { srgb: false }) });
  }
  return MAPS.get(id);
}
// Poly Haven PBR set (diffuse, GL normal, ARM). Geometry carries metre-scaled UVs.
export function pbr(id, { color = '#FFFFFF', normal = 1, roughness = 1, ao = 1, env = 1, metal = 0, spec } = {}) {
  const m = maps(id);
  const p = {
    color, map: m.map, normalMap: m.normalMap, normalScale: new THREE.Vector2(normal, normal),
    aoMap: m.arm, aoMapIntensity: ao, roughnessMap: m.arm, roughness, metalness: metal, envMapIntensity: env,
  };
  // spec < 1: a physical material with damped F0, so wide flat stone does not sheen grey at grazing angles
  return spec === undefined ? new THREE.MeshStandardMaterial(p) : new THREE.MeshPhysicalMaterial({ ...p, specularIntensity: spec });
}

// ------------------------------------------------------------------ height fog
// Patches the fog chunk of every material in the scene: distance fog weighted by height
// (dense in the valley floor, thin up high) plus a warm forward-scatter lobe toward the sun.
export function heightFog(scene, { color, sunColor, sunDir, density = 0.012, base = 0, falloff = 0.18, floor = 0.25, lobe = 6 }) {
  scene.fog = new THREE.FogExp2(color, density);
  const U = {
    hfSun: { value: sunDir.clone().normalize() }, hfSunCol: { value: new THREE.Color(sunColor) },
    hfDensity: { value: density }, hfBase: { value: base }, hfFall: { value: falloff }, hfFloor: { value: floor }, hfLobe: { value: lobe },
  };
  const patch = (mat) => {
    if (mat.userData.hf || !mat.fog || mat.isShaderMaterial || mat.isPointsMaterial || mat.isSpriteMaterial) return;
    mat.userData.hf = true;
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      prev?.call(mat, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <fog_pars_vertex>', '#include <fog_pars_vertex>\nvarying vec3 vHfW;')
        .replace('#include <fog_vertex>', `#include <fog_vertex>
  vec4 hfP = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  hfP = instanceMatrix * hfP;
  #endif
  vHfW = (modelMatrix * hfP).xyz;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <fog_pars_fragment>', `#include <fog_pars_fragment>
varying vec3 vHfW; uniform vec3 hfSun; uniform vec3 hfSunCol; uniform float hfDensity, hfBase, hfFall, hfFloor, hfLobe;`)
        .replace('#include <fog_fragment>', `#ifdef USE_FOG
  vec3 hfRay = vHfW - cameraPosition;
  float hfDist = length(hfRay);
  vec3 hfV = hfRay / max(hfDist, 1e-3);
  // optical depth of an exponential height layer along the ray
  float hfY0 = cameraPosition.y - hfBase, hfDy = hfRay.y;
  float hfK = hfFall;
  float hfOd = abs(hfDy) > 1e-3 ? (exp(-hfK * hfY0) - exp(-hfK * (hfY0 + hfDy))) / (hfK * hfDy) : exp(-hfK * hfY0);
  hfOd = max(hfOd, hfFloor);
  float hfF = 1.0 - exp(-hfDensity * hfDist * hfOd);
  float hfS = pow(max(dot(hfV, hfSun), 0.0), hfLobe);
  vec3 hfC = mix(fogColor, hfSunCol, hfS);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, hfC, hfF);
#endif`);
    };
    const pk = mat.customProgramCacheKey;
    mat.customProgramCacheKey = () => `hf1|${pk.call(mat)}`;
    mat.needsUpdate = true;
  };
  return { uniforms: U, apply: (root) => root.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(patch); }) };
}

// ------------------------------------------------------------------ geometry helpers
export function mesh(geo, mat, at = [0, 0, 0], { rot = [0, 0, 0], cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...at);
  m.rotation.set(...rot);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
// A box whose top is pulled in (Egyptian batter). Optional bevel via rounded box.
export function battered(w, h, d, { batter = 0.08, tile = 3, round = 0, seg = 1, back = false } = {}) {
  const g = round > 0 ? new RoundedBoxGeometry(w, h, d, 2, round) : new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  g.translate(0, h / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / h;
    p.setX(i, p.getX(i) * (1 - batter * t * (2 * h) / w));
    if (back) p.setZ(i, p.getZ(i) * (1 - batter * t * (2 * h) / d));
  }
  g.computeVertexNormals();
  return planarUV(g, tile);
}
// The cavetto cornice: a concave flare topped by a flat abacus, run along X.
export function cornice(len, { h = 1.6, out = 1.1, tile = 2.5 } = {}) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.25, 0); // torus roll seat
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    s.lineTo(0.25 + out * Math.pow(t, 2.2), 0.28 + t * (h - 0.5));
  }
  s.lineTo(0.25 + out, h);
  s.lineTo(0, h);
  s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -len / 2);
  g.rotateY(-Math.PI / 2); // profile depth now along +Z, length along X
  g.computeVertexNormals();
  return planarUV(g, tile);
}
export function torusRoll(len, r, tile = 1.2) {
  const g = new THREE.CylinderGeometry(r, r, len, 20, 1);
  return planarUV(g, tile);
}

// ------------------------------------------------------------------ canvas textures
// Sunk relief band: hieroglyph-like registers (seeded), as a bump map (white = raised).
export function reliefTexture(seed, w = 256, h = 1024, cols = 1) {
  const [c, x] = canvas2d(w, h);
  x.fillStyle = '#8a8a8a'; x.fillRect(0, 0, w, h);
  const cell = w / cols;
  for (let col = 0; col < cols; col++) {
    let y = 10;
    x.fillStyle = '#4a4a4a'; x.fillRect(col * cell + 4, 0, 3, h); x.fillRect((col + 1) * cell - 7, 0, 3, h);
    while (y < h - 20) {
      const k = Math.floor(hash(seed, col, y, 'k') * 7);
      const sz = cell * hashRange(0.42, 0.62, seed, col, y, 's');
      const cx = col * cell + cell / 2, cy = y + sz / 2;
      x.save(); x.translate(cx, cy); x.fillStyle = '#d8d8d8'; x.strokeStyle = '#d8d8d8'; x.lineWidth = sz * 0.12; x.lineCap = 'round';
      x.beginPath();
      if (k === 0) { x.arc(0, -sz * 0.15, sz * 0.22, 0, Math.PI * 2); x.moveTo(0, sz * 0.05); x.lineTo(0, sz * 0.45); x.moveTo(-sz * 0.28, sz * 0.15); x.lineTo(sz * 0.28, sz * 0.15); x.stroke(); } // ankh
      else if (k === 1) { x.ellipse(0, 0, sz * 0.4, sz * 0.2, 0, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(0, 0, sz * 0.08, 0, Math.PI * 2); x.fill(); } // eye
      else if (k === 2) { for (let i = 0; i < 4; i++) { x.fillRect(-sz * 0.35, -sz * 0.4 + i * sz * 0.22, sz * 0.7, sz * 0.09); } x.fillRect(-sz * 0.08, -sz * 0.45, sz * 0.16, sz * 0.9); } // djed
      else if (k === 3) { x.moveTo(-sz * 0.4, sz * 0.3); x.quadraticCurveTo(0, -sz * 0.6, sz * 0.4, sz * 0.3); x.stroke(); } // sky arc
      else if (k === 4) { for (let i = -1; i <= 1; i++) { x.moveTo(-sz * 0.4, i * sz * 0.2); for (let j = 0; j <= 4; j++) x.lineTo(-sz * 0.4 + j * sz * 0.2, i * sz * 0.2 + (j % 2 ? -1 : 1) * sz * 0.07); } x.stroke(); } // water
      else if (k === 5) { x.moveTo(-sz * 0.3, sz * 0.4); x.lineTo(0, -sz * 0.4); x.lineTo(sz * 0.3, sz * 0.4); x.closePath(); x.fill(); } // pyramid
      else { x.arc(0, 0, sz * 0.3, 0, Math.PI * 2); x.fill(); x.fillStyle = '#8a8a8a'; x.beginPath(); x.arc(0, 0, sz * 0.14, 0, Math.PI * 2); x.fill(); } // sun ring
      x.restore();
      y += sz + cell * 0.18;
    }
  }
  return canvasTex(c, { srgb: false });
}
// Twisted rope: diagonal strands.
let ropeTexCache = null;
export function ropeMaterial() {
  if (!ropeTexCache) {
    const [c, x] = canvas2d(64, 256);
    x.fillStyle = '#b89462'; x.fillRect(0, 0, 64, 256);
    for (let i = -8; i < 24; i++) {
      x.strokeStyle = i % 2 ? '#7c5a33' : '#d9b882'; x.lineWidth = 7;
      x.beginPath(); x.moveTo(0, i * 16); x.lineTo(64, i * 16 + 40); x.stroke();
    }
    ropeTexCache = canvasTex(c, { repeat: [1, 1] });
    ropeTexCache.wrapS = ropeTexCache.wrapT = THREE.RepeatWrapping;
  }
  return new THREE.MeshStandardMaterial({ map: ropeTexCache, bumpMap: ropeTexCache, bumpScale: 1.5, roughness: 0.95, color: '#E8D2A8' });
}
export function rope(points, { r = 0.016, mat, tension = 0.0 } = {}) {
  // straight runs between points (taut), with a tiny sag in the middle of long spans
  const pts = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    for (let k = 0; k < 8; k++) {
      const t = k / 8;
      const p = a.clone().lerp(b, t);
      p.y -= tension * a.distanceTo(b) * 4 * t * (1 - t);
      pts.push(p);
    }
  }
  pts.push(points[points.length - 1].clone());
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const len = curve.getLength();
  const g = new THREE.TubeGeometry(curve, Math.max(8, Math.ceil(len * 12)), r, 6, false);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * len * 6);
  const m = new THREE.Mesh(g, mat || ropeMaterial());
  m.castShadow = true;
  return m;
}

// ------------------------------------------------------------------ blocks, ramps, sledges
// Instanced course wall: rows of cut blocks with seeded size jitter; the top course is partial.
export function blockCourses(mat, { len, courses, done = 1, bl = 1.3, bh = 0.62, bd = 1.0, seed = 1, gap = 0.035 }) {
  const geo = planarUV(new RoundedBoxGeometry(bl - gap, bh - gap, bd - gap, 2, 0.045), 1.6);
  const per = Math.ceil(len / bl);
  const n = courses * per;
  const im = new THREE.InstancedMesh(geo, mat, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V(1, 1, 1), p = V(0, 0, 0), col = new THREE.Color();
  let k = 0;
  for (let c = 0; c < courses; c++) {
    const last = c === courses - 1;
    const off = (c % 2) * bl * 0.5;
    for (let i = 0; i < per; i++) {
      const x = -len / 2 + off + (i + 0.5) * bl;
      if (x > len / 2 - bl * 0.3) continue;
      if (last && hash(seed, i, 'top') > done) continue;
      p.set(x, c * bh + bh / 2, (hash(seed, c, i, 'z') - 0.5) * 0.06);
      q.setFromEuler(new THREE.Euler(0, (hash(seed, c, i, 'r') - 0.5) * 0.03, 0));
      m4.compose(p, q, s);
      im.setMatrixAt(k, m4);
      const v = hashRange(0.86, 1.08, seed, c, i, 'c');
      im.setColorAt(k, col.setRGB(v, v * hashRange(0.96, 1.0, seed, c, i, 'g'), v * hashRange(0.9, 1.0, seed, c, i, 'b')));
      k++;
    }
  }
  im.count = k;
  im.castShadow = true; im.receiveShadow = true;
  return im;
}
// Construction ramp along +Z of its group: packed rubble wedge with timber sleepers.
export function ramp(stone, wood, { len = 12, w = 2.6, rise = 3, sleeper = 0.85, seed = 3 } = {}) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, rise); s.lineTo(len + 0.01, rise); s.lineTo(0, 0.02);
  const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 2, steps: 1 });
  geo.translate(0, 0, -w / 2);
  geo.rotateY(-Math.PI / 2); // length now along +Z, width along X
  geo.computeVertexNormals();
  g.add(mesh(planarUV(geo, 2.2), stone));
  const slope = Math.atan2(rise, len);
  const sl = planarUV(new RoundedBoxGeometry(w + 0.1, 0.12, 0.22, 1, 0.03), 1.4);
  for (let z = 0.6; z < len - 0.2; z += sleeper) {
    const y = (z / len) * rise;
    const b = mesh(sl, wood, [hashRange(-0.05, 0.05, seed, z), y + 0.07, z], { rot: [-slope, hashRange(-0.03, 0.03, seed, z, 'y'), 0] });
    g.add(b);
  }
  g.userData = { len, rise, slope, w, heightAt: (z) => Math.max(0, Math.min(1, z / len)) * rise + 0.1 };
  return g;
}
// Wooden sledge (runners + deck + cross beam) carrying one rope-lashed block. Built along +Z.
export function sledge(wood, block, { L = 1.9, W = 1.15, bw = 1.25, bh = 0.85, bd = 1.0, seed = 5 } = {}) {
  const g = new THREE.Group();
  const runner = new THREE.Shape();
  runner.moveTo(-L / 2, 0); runner.lineTo(L / 2 - 0.25, 0); runner.quadraticCurveTo(L / 2 + 0.05, 0.02, L / 2 + 0.1, 0.26); runner.lineTo(L / 2 - 0.05, 0.26); runner.lineTo(-L / 2, 0.2); runner.lineTo(-L / 2, 0);
  const rg = new THREE.ExtrudeGeometry(runner, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 });
  rg.rotateY(-Math.PI / 2); rg.computeVertexNormals(); planarUV(rg, 1.2);
  for (const sx of [-1, 1]) g.add(mesh(rg, wood, [sx * (W / 2 - 0.08) - 0.065, 0, 0]));
  const plank = planarUV(new RoundedBoxGeometry(W + 0.12, 0.07, 0.24, 1, 0.02), 1.2);
  for (let i = 0; i < 7; i++) g.add(mesh(plank, wood, [0, 0.235, -L / 2 + 0.17 + i * 0.26], { rot: [0, hashRange(-0.02, 0.02, seed, i), 0] }));
  const beam = planarUV(new RoundedBoxGeometry(W + 0.5, 0.12, 0.12, 1, 0.03), 1.2);
  g.add(mesh(beam, wood, [0, 0.33, L / 2 - 0.12]));
  const bg = planarUV(new RoundedBoxGeometry(bw, bh, bd, 3, 0.06), 1.4, { ox: hash(seed, 'ox'), oy: hash(seed, 'oy') });
  const blk = mesh(bg, block, [0, 0.27 + bh / 2, -0.1], { rot: [0, hashRange(-0.04, 0.04, seed, 'b'), 0] });
  g.add(blk);
  // lashings: two rope loops over the block, tied down to the runners
  const rm = ropeMaterial();
  const top = 0.27 + bh + 0.015;
  for (const z of [-0.42, 0.24]) {
    const zz = z - 0.1;
    g.add(rope([V(-W / 2 + 0.02, 0.24, zz), V(-bw / 2 - 0.01, top - 0.04, zz), V(bw / 2 + 0.01, top - 0.04, zz), V(W / 2 - 0.02, 0.24, zz)].map((p, i) => (i === 1 || i === 2 ? p.setY(top) : p)), { r: 0.017, mat: rm }));
  }
  shadows(g);
  g.userData = { attach: [V(-(W + 0.4) / 2, 0.33, L / 2 - 0.12), V((W + 0.4) / 2, 0.33, L / 2 - 0.12)], blockTop: top };
  return g;
}
// Lashed scaffold: poles and ledgers in a grid facing +Z, with plank decks.
export function scaffold(wood, { w = 6, h = 6, d = 1.4, bays = 3, lifts = 3, seed = 7 } = {}) {
  const g = new THREE.Group();
  const pole = (a, b, r = 0.07) => {
    const len = a.distanceTo(b);
    const geo = planarUV(new THREE.CylinderGeometry(r * 0.9, r, len, 8), 0.9);
    const m = mesh(geo, wood);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    g.add(m);
  };
  const rm = ropeMaterial();
  for (let i = 0; i <= bays; i++) {
    const x = -w / 2 + (i * w) / bays + hashRange(-0.06, 0.06, seed, i);
    for (const z of [0, d]) pole(V(x, -0.2, z), V(x + hashRange(-0.08, 0.08, seed, i, z), h + 0.4, z), 0.075);
  }
  for (let j = 1; j <= lifts; j++) {
    const y = (j * h) / lifts;
    for (const z of [0, d]) pole(V(-w / 2 - 0.3, y, z), V(w / 2 + 0.3, y + hashRange(-0.05, 0.05, seed, j), z), 0.055);
    for (let i = 0; i <= bays; i++) {
      const x = -w / 2 + (i * w) / bays;
      pole(V(x, y - 0.06, -0.15), V(x, y - 0.06, d + 0.15), 0.05);
      // lashing knots
      for (const z of [0, d]) g.add(mesh(new THREE.TorusGeometry(0.085, 0.022, 6, 12), rm, [x, y, z], { rot: [Math.PI / 2, 0, hash(seed, i, j) * 3] }));
    }
    const deck = planarUV(new RoundedBoxGeometry(w + 0.2, 0.06, d - 0.1, 1, 0.02), 1.2);
    g.add(mesh(deck, wood, [0, y + 0.03, d / 2]));
  }
  // diagonal braces
  for (let i = 0; i < bays; i++) {
    const x0 = -w / 2 + (i * w) / bays, x1 = -w / 2 + ((i + 1) * w) / bays;
    pole(V(x0, 0.1, d + 0.08), V(x1, h / lifts * 2, d + 0.08), 0.045);
  }
  return g;
}

// ------------------------------------------------------------------ atmosphere
function softTexture(seed, { w = 256, h = 256, streak = false } = {}) {
  const [c, x] = canvas2d(w, h);
  const img = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = i / w, v = j / h;
    let n = 0, amp = 0.5, f = 2;
    for (let o = 0; o < 4; o++) {
      n += amp * (0.5 + 0.5 * Math.sin((u * f + hash(seed, o) * 10) * 6.283 + Math.sin(v * f * (streak ? 0.3 : 1.3) * 6.283 + o)) * Math.sin(v * f * (streak ? 0.2 : 1) * 6.283 + hash(seed, o, 'p') * 7));
      amp *= 0.5; f *= 2;
    }
    const edgeU = Math.sin(Math.PI * u), edgeV = streak ? Math.sin(Math.PI * v) : Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.0)), 1.5) * (1 - v * 0.6);
    const a = Math.max(0, Math.min(1, (0.55 + 0.6 * (n - 0.45)) * edgeU * edgeV));
    const k = (j * w + i) * 4;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = a * 255;
  }
  x.putImageData(img, 0, 0);
  return canvasTex(c, { srgb: true });
}
let hazeTex = null, shaftTex = null;
// A vertical haze card facing +Z (the caller yaws it to face the lens). Alpha peaks low and fades up.
export function hazeCard(w, h, { color = '#E8B888', opacity = 0.25, seed = 1 } = {}) {
  hazeTex = hazeTex || softTexture(11, { w: 256, h: 128 });
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: hazeTex, color, transparent: true, opacity, depthWrite: false, fog: true }));
  m.renderOrder = 2;
  m.userData.seed = seed;
  return m;
}
// A sun shaft: a long additive card along `dir`, soft at both ends.
export function shaft(from, dir, { len = 30, w = 2.5, color = '#FFC88A', opacity = 0.08 } = {}) {
  shaftTex = shaftTex || softTexture(23, { w: 64, h: 256, streak: true });
  const geo = new THREE.PlaneGeometry(w, len);
  geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: shaftTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  m.position.copy(from);
  m.quaternion.setFromUnitVectors(V(0, -1, 0), dir.clone().normalize());
  m.renderOrder = 3;
  return m;
}
// Drifting dust motes and sand streaks near the ground.
export function motes(count, centre, spread, seed, { size = 0.06, color = '#FFE2B8', opacity = 0.6 } = {}) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = centre.x + (hash(seed, i, 'x') - 0.5) * spread.x;
    pos[i * 3 + 1] = centre.y + Math.pow(hash(seed, i, 'y'), 2) * spread.y;
    pos[i * 3 + 2] = centre.z + (hash(seed, i, 'z') - 0.5) * spread.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const [c, x] = canvas2d(64, 64);
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return new THREE.Points(g, new THREE.PointsMaterial({ size, map: canvasTex(c), transparent: true, opacity, depthWrite: false, color, blending: THREE.AdditiveBlending, fog: false }));
}
// Settling dust puffs: soft sprites in a ring (for the chairs' landing).
export function puffs(centre, { n = 10, r = 0.9, seed = 9, color = '#E9C89A', opacity = 0.35, size = 1.2 } = {}) {
  const g = new THREE.Group();
  const t = softTexture(31, { w: 128, h: 128, streak: true });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(seed, i) * 0.6;
    const rr = r * hashRange(0.7, 1.3, seed, i, 'r');
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color, transparent: true, opacity: opacity * hashRange(0.5, 1, seed, i, 'o'), depthWrite: false, rotation: hash(seed, i, 'rot') * 6.28 }));
    const s = size * hashRange(0.6, 1.3, seed, i, 's');
    sp.scale.set(s * 1.4, s * 0.7, 1);
    sp.position.set(centre.x + Math.cos(a) * rr, centre.y + s * 0.25, centre.z + Math.sin(a) * rr);
    sp.renderOrder = 4;
    g.add(sp);
  }
  return g;
}

export { mergeGeometries, RoundedBoxGeometry };
