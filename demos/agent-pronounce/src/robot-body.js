// Episode 6 v4: the bodied robot developer. The series head (the cute_robot ball shell, dark glass
// visor, two glowing eyes, ear ring, agent badge) on a sculpted, skeleton-driven body: torso, arms
// with three-finger hands that type and point, and legs that sit in the kit loungeChair and stand.
//
//   createBodiedRobot(assets, { agent, color, quality, size, shade })
//     -> { group, handles, setPose(name, t, time), setState(patch), mats, info }
//
//   agent    AGENTS key ('Claude', 'Codex', 'Antigravity', ...): the head rig and its default colour
//   color    optional hex: the accent (ear ring, visor tint, eyes, soles, body accent lines)
//   quality  'high' (48 lathe segments) | 'low' (24)
//   size     head radius in world units (default 0.15). Everything scales from it: standing height
//            is 5.55 x size (0.83), the head is 36 % of it (chibi, about one third).
//   shade    options for look-kit reshadeRobot (shell, glass, faceBoost, eyeBoost, env, envMap, smooth)
//
// Space: `group` is the robot's root. Its origin is on the floor; it faces local +z. Place it under the
// seat centre (seated poses) or between the feet (standing poses) and yaw it.
//
// Poses (setPose(name, t, time)): every pose is a pure function of its arguments and the state, so a
// seek renders the same frame. No mixer, no clock.
//   'seated-idle'    t = time (s)         sits back, hands on the thighs, slow breath, idle feet
//   'seated-typing'  t = time (s)         leans in, both hands on state.keys (a keyboard Object3D)
//   'seated-turn'    t = progress 0..1    turns the chest and head to state.lookAt, lifts the near hand
//   'stand-up'       t = progress 0..1    scoots to the seat edge, slides down onto its feet, straightens
//   'standing-idle'  t = time (s)         stands at state.standZ, arms relaxed, breathing
//   'point'          t = progress 0..1    standing, the right arm rises and points at state.pointAt
//   'haul'           t = time (s)         desert crews: leans into a chest strap, long stride, fists on
//                                         the strap; the rope ties on behind the state.haulSide shoulder
// `time` (seconds) drives the secondary motion (breath, blinks, taps) of the progress poses.
//
// State (setState(patch), merged): eyeGlow (1 = rest), typing (0..1 tap intensity), lookAt (world
// Vector3 or null), keys (keyboard Object3D: local +z is the user's side, keys top y 0.017),
// seat { y: seat top, front: root-local z of the seat's front lip, z: hip z }, standZ (root-local z of
// the feet when standing), pointAt (world Vector3), seed.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AGENTS } from './assets.js';
import { createRobot } from './robot.js';
import { reshadeRobot } from './look-kit.js';
import { hash, noise1 } from './util.js';

// Body proportions in head radii (u). Standing: ankle 0.24, hip 1.94, chest 2.39..3.51, head centre 4.55.
export const BODY = {
  ankleY: 0.24, shin: 0.86, thigh: 0.84, hipX: 0.34, hipLift: 0.3,
  spineY: 0.32, waist: 0.13, chestH: 1.12, chestW: 0.74, chestD: 0.74,
  shoulder: [0.84, 0.86], neckY: 1.06, neckH: 0.2, headUp: 0.84,
  upper: 0.78, fore: 0.74, palm: 0.34,
};
const HEAD_MODEL_R = 0.856; // cute_robot ball radius, model units
const KEY_TOP = 0.017; // look-workspace keyboard: key tops, keyboard-local y
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const mix = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ geometry
function lathe(pts, segs, { zs = 1, xs = 1, samples = 40 } = {}) {
  const curve = new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y)));
  const p = curve.getSpacedPoints(samples).map((v) => new THREE.Vector2(Math.max(0.0005, v.x), v.y));
  const g = new THREE.LatheGeometry(p, segs);
  g.scale(xs, 1, zs);
  return g;
}
// A limb shell hanging down -y from a joint at the origin: rounded ends, a bulge, gaps for the joints.
function limbShell(len, rTop, rMid, rBot, g1, g2, segs) {
  const y0 = -len + g2, y1 = -g1, L = y1 - y0;
  return lathe([[0.0005, y0], [rBot * 0.82, y0 + 0.035 * L], [rBot, y0 + 0.15 * L], [rMid, y0 + 0.5 * L], [rTop, y0 + 0.85 * L], [rTop * 0.8, y0 + 0.965 * L], [0.0005, y1]], segs, { samples: 36 });
}
function bellows(r, h, ripples, segs) {
  const p = [];
  const n = ripples * 8;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    p.push(new THREE.Vector2(r * (1 + 0.09 * Math.cos(k * Math.PI * 2 * ripples)) * (1 - 0.12 * Math.pow(2 * k - 1, 2)), k * h));
  }
  return new THREE.LatheGeometry(p, segs);
}
const ball = (r, segs) => new THREE.SphereGeometry(r, segs, Math.round(segs * 0.6));
const ring = (R, r, segs) => new THREE.TorusGeometry(R, r, 10, segs).rotateX(Math.PI / 2);

// Collects geometry per (group, material) and merges it into one mesh each: few draw calls.
class Builder {
  constructor() { this.parts = new Map(); }
  add(group, mat, geo, { pos, rot, scl, cast = true } = {}) {
    const m = new THREE.Matrix4().compose(pos || V(), new THREE.Quaternion().setFromEuler(rot || new THREE.Euler()), scl || V(1, 1, 1));
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    const key = `${group.uuid}|${mat.uuid}|${cast}`;
    if (!this.parts.has(key)) this.parts.set(key, { group, mat, cast, geos: [] });
    this.parts.get(key).geos.push(g);
  }
  build() {
    let n = 0;
    for (const { group, mat, cast, geos } of this.parts.values()) {
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat);
      mesh.castShadow = cast; mesh.receiveShadow = true;
      group.add(mesh); n++;
    }
    return n;
  }
}

// A tube that runs over the chest's front surface (lathe radius function r(y), depth scale zs).
function surfaceLine(rOf, zs, pts, radius, lift = 0.012) {
  const v = pts.map(([phi, y]) => { const r = rOf(y) + lift; return V(r * Math.sin(phi), y, r * zs * Math.cos(phi)); });
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v), 64, radius, 8, false);
}

// ------------------------------------------------------------------ basis helpers
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _pq = new THREE.Quaternion();
// Set obj's WORLD orientation so its local -y runs along `dir` and its local x along `xHint` (orthogonalised).
function aimY(obj, dir, xHint) {
  const y = dir.clone().normalize().negate();
  const x = xHint.clone().sub(y.clone().multiplyScalar(xHint.dot(y)));
  if (x.lengthSq() < 1e-8) x.set(1, 0, 0).sub(y.clone().multiplyScalar(y.x));
  x.normalize();
  const z = V().crossVectors(x, y).normalize();
  setWorldQ(obj, _q.setFromRotationMatrix(_m.makeBasis(x, y, z)));
}
// local -y along `dir`, local +z toward `zHint` (the back of a hand).
function aimYZ(obj, dir, zHint) {
  const y = dir.clone().normalize().negate();
  const z = zHint.clone().sub(y.clone().multiplyScalar(zHint.dot(y))).normalize();
  const x = V().crossVectors(y, z).normalize();
  setWorldQ(obj, _q.setFromRotationMatrix(_m.makeBasis(x, y, z)));
}
function setWorldQ(obj, qWorld) {
  obj.parent.updateWorldMatrix(true, false);
  obj.parent.getWorldQuaternion(_pq);
  obj.quaternion.copy(_pq.invert().multiply(qWorld));
  obj.updateMatrixWorld(true);
}
const wpos = (o) => o.getWorldPosition(V());

// Two-bone IK in world space. Returns the elbow/knee and the reachable end point, plus the hinge axis.
function twoBone(S, T, a, b, pole) {
  const d = T.clone().sub(S);
  const L = clamp(d.length(), Math.abs(a - b) + 1e-4, (a + b) * 0.9995);
  const u = d.normalize();
  const cosA = clamp((a * a + L * L - b * b) / (2 * a * L), -1, 1);
  const v = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u)));
  if (v.lengthSq() < 1e-8) v.set(0, 0, 1);
  v.normalize();
  const E = S.clone().addScaledVector(u, a * cosA).addScaledVector(v, a * Math.sqrt(1 - cosA * cosA));
  return { E, T: S.clone().addScaledVector(u, L), hinge: V().crossVectors(v, u).normalize() };
}

// ------------------------------------------------------------------ the robot
export function createBodiedRobot(assets, { agent = 'Claude', color = null, quality = 'high', size = 0.15, shade = {}, badge = true } = {}) {
  const u = size;
  const segs = quality === 'low' ? 24 : 48;
  const accentHex = color || AGENTS[agent].color;
  const accent = new THREE.Color(accentHex);

  // ---- the series head, unchanged in shape: shell, glass visor, eyes, ear ring, badge
  const head = createRobot(assets, agent, { scale: 1, badge });
  if (color) recolourHead(head, accent);
  head.feet.visible = false;
  if (head.blob) head.blob.visible = false;
  reshadeRobot(head, { faceLight: 0, shell: '#CCC3B5', env: 0.9, eyeBoost: 2.6, glass: 0.55, smooth: Math.PI / 4, ...shade });
  const m = head.mats;

  // ---- body materials: the head's clearcoat shell, a graphite joint material, an accent line
  const shell = m.shell;
  const joint = new THREE.MeshPhysicalMaterial({ name: 'joint', color: '#2A2C31', roughness: 0.38, metalness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 0.9 });
  const rubber = new THREE.MeshPhysicalMaterial({ name: 'rubber', color: '#24262B', roughness: 0.62, metalness: 0.05, sheen: 0.3, sheenRoughness: 0.6, sheenColor: new THREE.Color('#6B6F78') });
  const trim = new THREE.MeshPhysicalMaterial({ name: 'trim', color: '#8D8A86', roughness: 0.3, metalness: 0.8, clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 1.1 });
  const accentMat = new THREE.MeshStandardMaterial({ name: 'accent', color: accent.clone().multiplyScalar(0.6), emissive: accent.clone(), emissiveIntensity: 1.6, roughness: 0.35 });
  const sole = new THREE.MeshPhysicalMaterial({ name: 'sole', color: accent.clone().multiplyScalar(0.55), emissive: accent.clone(), emissiveIntensity: 0.18, roughness: 0.5, clearcoat: 0.4 });
  if (shade.envMap) for (const mt of [joint, trim, rubber]) mt.envMap = shade.envMap;

  // ---- skeleton
  const B = BODY;
  const group = new THREE.Group(); group.name = `bodied-${agent}`;
  const pelvis = new THREE.Group(); pelvis.name = 'pelvis';
  const spine = new THREE.Group(); spine.name = 'spine'; spine.position.y = B.spineY * u;
  const chest = new THREE.Group(); chest.name = 'chest'; chest.position.y = B.waist * u;
  const neck = new THREE.Group(); neck.name = 'neck'; neck.position.set(0, B.neckY * u, -0.03 * u);
  const headPivot = new THREE.Group(); headPivot.name = 'headPivot'; headPivot.position.y = B.neckH * u;
  const headMount = new THREE.Group(); headMount.name = 'headMount';
  headMount.position.y = B.headUp * u;
  headMount.rotation.y = -Math.PI / 2; // the cute_robot face is +X; the body faces +z
  headMount.scale.setScalar(u / HEAD_MODEL_R);
  group.add(pelvis); pelvis.add(spine); spine.add(chest); chest.add(neck); neck.add(headPivot); headPivot.add(headMount);
  headMount.add(head.ballHead);
  head.ballHead.position.set(0, 0, 0);
  head.ballHead.rotation.set(0, 0, 0);

  const limb = (parent, name, len) => { const g = new THREE.Group(); g.name = name; parent.add(g); const end = new THREE.Group(); end.name = `${name}-end`; end.position.y = -len * u; g.add(end); return { g, end }; };
  const arms = {}, legs = {};
  const bld = new Builder();
  for (const s of [1, -1]) { // s = +1 left (+x), -1 right
    const side = s > 0 ? 'L' : 'R';
    const sh = new THREE.Group(); sh.position.set(s * B.shoulder[0] * u, B.shoulder[1] * u, 0); chest.add(sh);
    const up = limb(sh, `upper${side}`, B.upper);
    const fo = limb(up.end, `fore${side}`, B.fore);
    const hand = new THREE.Group(); hand.name = `hand${side}`; fo.end.add(hand);
    arms[side] = { s, sh, upper: up.g, fore: fo.g, hand, fingers: [] };
    const hp = new THREE.Group(); hp.position.set(s * B.hipX * u, 0, 0); pelvis.add(hp);
    const th = limb(hp, `thigh${side}`, B.thigh);
    const sn = limb(th.end, `shin${side}`, B.shin);
    const foot = new THREE.Group(); foot.name = `foot${side}`; sn.end.add(foot);
    legs[side] = { s, hp, thigh: th.g, shin: sn.g, foot };

    // arm meshes
    bld.add(sh, joint, ball(0.2 * u, segs));
    bld.add(up.g, shell, new THREE.SphereGeometry(0.29 * u, segs, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), { pos: V(0, 0.02 * u, 0) }); // pauldron
    bld.add(up.g, shell, limbShell(B.upper * u, 0.19 * u, 0.185 * u, 0.15 * u, 0.12 * u, 0.1 * u, segs));
    bld.add(up.end, joint, ball(0.15 * u, segs));
    bld.add(fo.g, rubber, bellows(0.13 * u, 0.12 * u, 2, segs), { pos: V(0, -0.15 * u, 0) });
    bld.add(fo.g, shell, limbShell(B.fore * u, 0.165 * u, 0.205 * u, 0.165 * u, 0.13 * u, 0.06 * u, segs));
    bld.add(fo.g, accentMat, ring(0.172 * u, 0.018 * u, segs), { pos: V(0, -0.6 * B.fore * u, 0) });
    bld.add(fo.end, joint, ball(0.1 * u, segs));
    // hand: graphite palm, shell back plate, three fingers and a thumb (separate joints)
    bld.add(hand, joint, new RoundedBoxGeometry(0.42 * u, 0.36 * u, 0.2 * u, 3, 0.07 * u), { pos: V(0, -0.2 * u, 0) });
    bld.add(hand, shell, new RoundedBoxGeometry(0.38 * u, 0.28 * u, 0.09 * u, 3, 0.04 * u), { pos: V(0, -0.2 * u, 0.085 * u) });
    bld.add(hand, accentMat, new RoundedBoxGeometry(0.2 * u, 0.03 * u, 0.02 * u, 2, 0.009 * u), { pos: V(0, -0.27 * u, 0.13 * u) });
    for (let i = 0; i < 4; i++) {
      const thumb = i === 3;
      const base = new THREE.Group();
      if (thumb) { base.position.set(-s * 0.2 * u, -0.12 * u, -0.04 * u); base.rotation.set(0.5, 0, -s * 0.75); }
      else base.position.set((i - 1) * 0.13 * u, -0.37 * u, 0);
      hand.add(base);
      const l1 = (thumb ? 0.13 : 0.14) * u, l2 = (thumb ? 0.11 : 0.12) * u, r = (thumb ? 0.06 : 0.056) * u;
      const seg2 = new THREE.Group(); seg2.position.y = -l1; base.add(seg2);
      const tip = new THREE.Group(); tip.position.y = -l2 - r * 0.72; seg2.add(tip); // the finger pad's end
      bld.add(base, joint, new THREE.CapsuleGeometry(r, l1 - r * 0.4, 6, 16), { pos: V(0, -l1 / 2, 0) });
      bld.add(base, joint, ball(r * 1.08, 16));
      bld.add(seg2, joint, new THREE.CapsuleGeometry(r * 0.94, l2 - r * 0.4, 6, 16), { pos: V(0, -l2 / 2, 0) });
      bld.add(seg2, shell, new THREE.CapsuleGeometry(r * 0.7, l2 * 0.35, 4, 12), { pos: V(0, -l2 * 0.55, r * 0.55), scl: V(1, 1, 0.6) }); // nail plate
      arms[side].fingers.push({ base, seg2, tip, thumb, rest: base.rotation.clone() });
    }

    // leg meshes
    bld.add(hp, joint, ball(0.21 * u, segs));
    bld.add(th.g, shell, limbShell(B.thigh * u, 0.27 * u, 0.255 * u, 0.2 * u, 0.0, 0.12 * u, segs));
    bld.add(th.g, joint, ring(0.255 * u, 0.022 * u, segs), { pos: V(0, -0.5 * B.thigh * u, 0) });
    bld.add(th.end, joint, ball(0.17 * u, segs));
    bld.add(sn.g, shell, new THREE.SphereGeometry(0.15 * u, segs, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), { pos: V(0, -0.02 * u, 0.13 * u), rot: new THREE.Euler(Math.PI / 2, 0, 0), scl: V(1, 1, 0.5) }); // kneecap
    bld.add(sn.g, shell, limbShell(B.shin * u, 0.18 * u, 0.2 * u, 0.235 * u, 0.12 * u, 0.1 * u, segs));
    bld.add(sn.g, accentMat, ring(0.226 * u, 0.018 * u, segs), { pos: V(0, -0.72 * B.shin * u, 0) });
    bld.add(sn.end, joint, ball(0.13 * u, segs));
    // foot: the series dome foot, with its coloured sole
    bld.add(foot, shell, lathe([[0.0005, 0], [0.42, 0.0], [0.44, 0.05], [0.4, 0.13], [0.27, 0.21], [0.0005, 0.24]].map(([r, y]) => [r * u, y * u]), segs, { xs: 0.56, zs: 1.0 }), { pos: V(0, -B.ankleY * u, 0.12 * u) });
    bld.add(foot, sole, lathe([[0.0005, 0], [0.45, 0], [0.46, 0.025], [0.0005, 0.03]].map(([r, y]) => [r * u, y * u]), segs, { xs: 0.56 }), { pos: V(0, -B.ankleY * u - 0.012 * u, 0.12 * u) });
  }

  // pelvis, waist, chest, neck
  bld.add(pelvis, shell, lathe([[0.0005, -0.34], [0.3, -0.33], [0.5, -0.23], [0.6, -0.02], [0.58, 0.17], [0.47, 0.29], [0.0005, 0.33]].map(([r, y]) => [r * u, y * u]), segs, { zs: 0.78 }));
  bld.add(pelvis, joint, ring(0.585 * u, 0.025 * u, segs), { scl: V(1, 1, 0.78), pos: V(0, 0.08 * u, 0) });
  bld.add(pelvis, accentMat, new RoundedBoxGeometry(0.26 * u, 0.06 * u, 0.04 * u, 2, 0.02 * u), { pos: V(0, -0.02 * u, 0.47 * u) }); // belt light
  bld.add(spine, rubber, bellows(0.4 * u, (B.waist + 0.06) * u, 3, segs), { pos: V(0, -0.03 * u, 0), scl: V(1, 1, 0.82) });
  const CH = [[0.0005, 0], [0.5, 0.03], [0.66, 0.16], [0.74, 0.42], [0.76, 0.64], [0.7, 0.86], [0.5, 1.02], [0.24, 1.1], [0.0005, 1.12]];
  const chestCurve = new THREE.SplineCurve(CH.map(([r, y]) => new THREE.Vector2(r * u, y * u)));
  const chestPts = chestCurve.getSpacedPoints(200);
  const rOf = (y) => { let best = chestPts[0]; for (const p of chestPts) if (Math.abs(p.y - y) < Math.abs(best.y - y) && p.x > 0.01 * u) best = p; return best.x; };
  bld.add(chest, shell, lathe(CH.map(([r, y]) => [r * u, y * u]), segs, { zs: B.chestD }));
  // panel seam (graphite groove) and the accent line: a chevron across the chest under the collar
  const seam = [];
  for (let i = 0; i <= 12; i++) { const k = i / 12 * 2 - 1; seam.push([k * 1.15, (0.3 + 0.07 * Math.abs(k) ** 1.5) * u]); }
  bld.add(chest, joint, surfaceLine(rOf, B.chestD, seam, 0.022 * u, 0.0));
  const chev = [];
  for (let i = 0; i <= 16; i++) { const k = i / 16 * 2 - 1; chev.push([k * 0.75, (0.66 + 0.17 * Math.abs(k)) * u]); }
  bld.add(chest, accentMat, surfaceLine(rOf, B.chestD, chev, 0.024 * u, 0.006 * u));
  // collar: graphite ring, accent ring, short neck bellows
  bld.add(chest, trim, ring(0.31 * u, 0.045 * u, segs), { pos: V(0, 1.08 * u, -0.03 * u) });
  bld.add(neck, rubber, bellows(0.17 * u, B.neckH * u + 0.04 * u, 2, segs), { pos: V(0, -0.02 * u, 0) });
  bld.add(headPivot, accentMat, ring(0.2 * u, 0.025 * u, segs), { pos: V(0, 0.02 * u, 0) });
  // back pack: a graphite power cell with two accent status lights
  bld.add(chest, joint, new RoundedBoxGeometry(0.62 * u, 0.56 * u, 0.2 * u, 3, 0.08 * u), { pos: V(0, 0.6 * u, -0.5 * u) });
  for (const k of [-1, 1]) bld.add(chest, accentMat, ball(0.035 * u, 12), { pos: V(k * 0.12 * u, 0.74 * u, -0.6 * u) });
  for (let i = 0; i < 3; i++) bld.add(chest, trim, new RoundedBoxGeometry(0.4 * u, 0.04 * u, 0.04 * u, 2, 0.015 * u), { pos: V(0, (0.44 + i * 0.08) * u, -0.6 * u) });
  const meshCount = bld.build();

  // ---------------------------------------------------------------- state and poses
  const state = { eyeGlow: 1, typing: 1, lookAt: null, keys: null, seat: { y: 0.3, front: 0.16, z: 0.02 }, standZ: 0, pointAt: null, seed: agent };
  const base = { eyes: m.eyes.emissiveIntensity, screen: m.screen.emissiveIntensity, glow: m.glow.emissiveIntensity };
  const L = (x, y, z) => group.localToWorld(V(x, y, z));
  const Ld = (x, y, z) => V(x, y, z).applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const hipStand = (B.ankleY + B.shin + B.thigh - 0.05) * u;

  function seatedHip() { return V(0, state.seat.y + B.hipLift * u, state.seat.z); }
  function dangleAnkle(s, hip, time) {
    const sw = 0.06 * u * Math.sin(time * 1.3 + (s > 0 ? 0 : 2.1) + hash(state.seed, 'feet') * 6);
    return V(s * 0.42 * u, Math.max(state.seat.y - 0.66 * u, B.ankleY * u), hip.z + 0.98 * u + sw);
  }
  // A full pose description in root-local space. Arms: { wrist, fingerDir, back, pole, curl[4] } or 'hang'.
  function describe(name, t, time) {
    const breath = Math.sin(time * Math.PI * 2 / 3.6 + hash(state.seed, 'b') * 6);
    const P = { hip: null, hipRot: V(), spine: V(), chestRot: V(), legs: {}, arms: {}, look: state.lookAt, headBias: V() };
    const hangArm = (s, k = 0) => ({ wrist: V(s * 1.0 * u, (B.ankleY + B.shin + B.thigh + B.spineY + B.waist + B.shoulder[1] - B.upper - B.fore + 0.08) * u, 0.1 * u + k), fingerDir: V(s * 0.12, -1, 0.15), back: V(s, 0, -0.15), pole: V(s * 0.4, 0, -1), curl: [0.35, 0.4, 0.45, 0.2] });
    const standLegs = (z) => { for (const s of [1, -1]) P.legs[s] = { ankle: V(s * 0.4 * u, B.ankleY * u, z + 0.02 * u), pole: V(0, 0, 1), pitch: 0 }; };
    const lapArm = (s, hip, lift = 0) => ({ wrist: V(s * 0.46 * u, hip.y + (0.36 + lift) * u, hip.z + 0.42 * u), fingerDir: V(-s * 0.18, -0.55, 1), back: V(s * 0.25, 1, 0.2), pole: V(s, -0.5, -0.8), curl: [0.45, 0.5, 0.55, 0.25] });
    if (name === 'seated-idle' || name === 'seated-typing' || name === 'seated-turn') {
      const hip = seatedHip();
      P.hip = hip.add(V(0, 0.006 * u * breath, 0));
      for (const s of [1, -1]) P.legs[s] = { ankle: dangleAnkle(s, hip, time), pole: V(0, 1, 0.4), pitch: 0.25 };
      if (name === 'seated-typing') {
        P.spine.set(0.16 + 0.01 * breath, 0, 0); P.chestRot.set(0.08, 0, 0);
        P.typing = true;
      } else if (name === 'seated-idle') {
        P.spine.set(-0.06 + 0.012 * breath, 0, 0);
        for (const s of [1, -1]) P.arms[s] = lapArm(s, hip);
      } else { // seated-turn: t = progress
        const k = smooth(0, 1, t);
        P.spine.set(-0.02, 0, 0);
        P.turn = k;
        for (const s of [1, -1]) P.arms[s] = lapArm(s, hip);
      }
    } else if (name === 'stand-up') {
      // 0..0.3 scoot to the seat edge and lean in, hands on the cushion; 0.28..0.6 slide off into a
      // crouch (the short legs reach the floor partway: the feet hang straight until they can plant);
      // 0.55..1 straighten, the hands go from the knees to the sides.
      const seat = seatedHip();
      const a = smooth(0, 0.3, t), b = smooth(0.28, 0.6, t), c = smooth(0.55, 1, t);
      const edge = V(0, seat.y, state.seat.front - 0.12 * u);
      const crouch = V(0, hipStand - 0.34 * u, state.standZ - 0.1 * u);
      const standHip = V(0, hipStand, state.standZ);
      const hip = seat.clone().lerp(edge, a).lerp(crouch, b).lerp(standHip, c);
      hip.y += 0.006 * u * breath * c;
      P.hip = hip;
      P.spine.set(0.5 * smooth(0, 0.3, t) * (1 - c), 0, 0);
      const land = smooth(0.2, 0.42, t);
      for (const s of [1, -1]) {
        const dang = dangleAnkle(s, seat, time);
        const floor = V(s * 0.4 * u, B.ankleY * u, state.standZ + 0.02 * u);
        P.legs[s] = { ankle: dang.lerp(floor, land), pole: V(0, 0.6 * (1 - land), 1), pitch: 0.25 * (1 - land), plant: land > 0.99 };
      }
      const push = (s) => ({ wrist: V(s * 0.72 * u, state.seat.y + 0.1 * u, state.seat.front - 0.1 * u), fingerDir: V(s * 0.15, -1, 0.5), back: V(s * 0.3, 0.2, -1), pole: V(s, 0.3, -0.6), curl: [0.2, 0.2, 0.25, 0.15] });
      for (const s of [1, -1]) {
        const seatK = smooth(0.05, 0.25, t) * (1 - smooth(0.32, 0.52, t)); // hands on the cushion edge
        const knee = lapArm(s, hip);
        knee.wrist.add(V(s * 0.05 * u, 0.0, 0.3 * u));
        const hang = hangArm(s);
        hang.wrist.z += hip.z;
        hang.wrist.y += (hip.y - hipStand);
        const p = push(s);
        const lerpArm = (x, y, k) => ({ wrist: x.wrist.clone().lerp(y.wrist, k), fingerDir: x.fingerDir.clone().lerp(y.fingerDir, k), back: x.back.clone().lerp(y.back, k), pole: x.pole.clone().lerp(y.pole, k), curl: x.curl.map((v, i) => mix(v, y.curl[i], k)) });
        let arm = lerpArm(lapArm(s, seat), p, seatK);
        if (t > 0.3) arm = lerpArm(p, knee, smooth(0.32, 0.52, t));
        P.arms[s] = lerpArm(arm, hang, smooth(0.62, 1, t));
      }
    } else if (name === 'haul') {
      // Leans into a chest strap: long stride, knees bent, chest well forward, both fists on the strap
      // in front of the chest. The rope ties on behind the shoulder on state.haulSide (+1 = +x side), so
      // the rear (push-off) foot is on that side. Arm specs are chest-local (chest: true).
      const s0 = state.haulSide || 1;
      const sway = 0.04 * u * Math.sin(time * 1.7 + hash(state.seed, 'st') * 6);
      P.hip = V(0, hipStand - 0.2 * u + 0.006 * u * breath, state.standZ + 0.1 * u);
      P.spine.set(0.42 + 0.01 * breath, 0, 0); P.chestRot.set(0.08, 0, 0);
      P.legs[-s0] = { ankle: V(-s0 * 0.38 * u, B.ankleY * u, state.standZ + 0.5 * u + sway), pole: V(0, 0, 1), pitch: 0 };
      P.legs[s0] = { ankle: V(s0 * 0.4 * u, B.ankleY * u + 0.1 * u, state.standZ - 0.6 * u - sway), pole: V(0, 0, 1), pitch: 0.3 };
      if (state.haulCycle) {
        const phase=time*2.4+hash(state.seed,'step')*6;
        for (const s of [1,-1]) {
          const a=phase+(s>0?0:Math.PI), step=Math.sin(a);
          P.legs[s]={ankle:V(s*.4*u,B.ankleY*u+Math.max(0,Math.cos(a))*.12*u,state.standZ+step*.52*u),pole:V(0,0,1),pitch:Math.max(0,Math.cos(a))*.22};
        }
      }
      for (const s of [1, -1]) P.arms[s] = { chest: true, wrist: V(s * 0.3 * u, 0.62 * u, 0.95 * u), fingerDir: V(-s, -0.25, -0.2), back: V(0.25 * s, 0, 1), pole: V(s, -0.6, -0.4), curl: [1.0, 1.05, 1.05, 0.7] };
    } else { // standing-idle, point
      P.hip = V(0, hipStand + 0.006 * u * breath, state.standZ);
      P.spine.set(0.02 * breath * 0.5, 0, 0);
      standLegs(state.standZ);
      for (const s of [1, -1]) { const h = hangArm(s); h.wrist.z += state.standZ; h.wrist.x += 0.02 * u * s * breath; P.arms[s] = h; }
      if (name === 'point') P.point = smooth(0, 1, t);
    }
    return P;
  }

  const _tmp = V();
  function lookAngles(target, frameObj, fromObj) {
    const inv = frameObj.getWorldQuaternion(new THREE.Quaternion()).invert();
    const d = target.clone().sub(wpos(fromObj)).applyQuaternion(inv);
    return { yaw: Math.atan2(d.x, d.z), pitch: Math.atan2(-d.y, Math.hypot(d.x, d.z)) };
  }

  function solveArm(side, spec) {
    const A = arms[side];
    const S = wpos(A.sh);
    const ik = twoBone(S, spec.wrist, B.upper * u, B.fore * u, spec.pole);
    aimY(A.upper, ik.E.clone().sub(S), ik.hinge);
    aimY(A.fore, ik.T.clone().sub(ik.E), ik.hinge);
    aimYZ(A.hand, spec.fingerDir, spec.back);
    A.fingers.forEach((f, i) => {
      const c = spec.curl[i] ?? 0.3;
      f.base.rotation.set(f.rest.x + c * (f.thumb ? 0.6 : 1), f.rest.y, f.rest.z);
      f.seg2.rotation.set(c * (f.thumb ? 0.8 : 1.15), 0, 0);
    });
  }
  function solveLeg(side, spec) {
    const G = legs[side];
    const S = wpos(G.hp);
    const ik = twoBone(S, spec.ankle, B.thigh * u, B.shin * u, spec.pole);
    aimY(G.thigh, ik.E.clone().sub(S), ik.hinge);
    aimY(G.shin, ik.T.clone().sub(ik.E), ik.hinge);
    // the foot stays level with the root (heading), pitched by spec.pitch (toes down when dangling)
    const q = group.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(spec.pitch || 0, 0, 0)));
    setWorldQ(G.foot, q);
  }

  function setPose(name, t = 0, time = t) {
    const P = describe(name, t, time);
    pelvis.position.copy(P.hip);
    pelvis.rotation.set(P.hipRot.x, P.hipRot.y, P.hipRot.z);
    spine.rotation.set(P.spine.x, P.spine.y, P.spine.z);
    chest.rotation.set(P.chestRot.x, P.chestRot.y, P.chestRot.z);
    neck.rotation.set(0, 0, 0); headPivot.rotation.set(0, 0, 0);
    group.updateMatrixWorld(true);
    // turn toward the neighbour: chest takes 35 %, the head the rest
    let look = P.look;
    if (P.turn != null && state.lookAt) {
      const { yaw } = lookAngles(state.lookAt, pelvis, chest);
      spine.rotation.y = clamp(yaw * 0.35, -0.55, 0.55) * P.turn;
      group.updateMatrixWorld(true);
    }
    if (P.point != null && state.pointAt) {
      const { yaw } = lookAngles(state.pointAt, pelvis, chest);
      spine.rotation.y = clamp(yaw * 0.3, -0.5, 0.5) * P.point;
      group.updateMatrixWorld(true);
      look = state.pointAt;
    }
    // legs first (they do not depend on the torso), then arms
    for (const s of [1, -1]) { const sp = P.legs[s]; solveLeg(s > 0 ? 'L' : 'R', { ...sp, ankle: group.localToWorld(sp.ankle.clone()), pole: Ld(sp.pole.x, sp.pole.y, sp.pole.z) }); }
    for (const s of [1, -1]) {
      const side = s > 0 ? 'L' : 'R';
      let spec = P.arms[s];
      if (P.typing) spec = typingArm(s, time);
      else if (spec && spec.chest) {
        const q = chest.getWorldQuaternion(new THREE.Quaternion());
        const d = (v) => v.clone().applyQuaternion(q).normalize();
        spec = { ...spec, wrist: chest.localToWorld(spec.wrist.clone()), fingerDir: d(spec.fingerDir), back: d(spec.back), pole: d(spec.pole) };
      } else if (spec) spec = { ...spec, wrist: group.localToWorld(spec.wrist.clone()), fingerDir: Ld(spec.fingerDir.x, spec.fingerDir.y, spec.fingerDir.z), back: Ld(spec.back.x, spec.back.y, spec.back.z), pole: Ld(spec.pole.x, spec.pole.y, spec.pole.z) };
      if (P.turn != null && state.lookAt && spec) spec = turnGesture(s, spec, P.turn, time);
      if (P.point != null && state.pointAt && s < 0) spec = pointArm(spec, P.point);
      if (spec) solveArm(side, spec);
      // typing contact: lift or drop the wrist until the lowest fingertip sits on the key tops
      if (P.typing && state.keys && spec) {
        const kb = state.keys;
        const up = V(0, 1, 0).applyQuaternion(kb.getWorldQuaternion(new THREE.Quaternion()));
        for (let it = 0; it < 3; it++) {
          let minY = Infinity;
          for (const f of arms[side].fingers) minY = Math.min(minY, kb.worldToLocal(wpos(f.tip)).y);
          const d = KEY_TOP + 0.002 - minY;
          if (Math.abs(d) < 0.0005) break;
          spec.wrist.addScaledVector(up, d);
          solveArm(side, spec);
        }
      }
    }
    // head: look at the target within limits, else a small idle drift
    let yaw = 0.05 * noise1(time * 0.4, `${state.seed}-hy`), pitch = 0.03 * noise1(time * 0.35, `${state.seed}-hp`);
    if (look) {
      const a = lookAngles(look, chest, headPivot);
      yaw = clamp(a.yaw, -1.0, 1.0); pitch = clamp(a.pitch, -0.45, 0.45);
    } else if (P.typing) pitch = 0.12 + pitch;
    neck.rotation.set(pitch * 0.4, yaw * 0.4, 0, 'YXZ');
    headPivot.rotation.set(pitch * 0.6, yaw * 0.6, 0, 'YXZ');
    // blink (seeded, 2.2..4.2 s apart) and glow
    const n = Math.floor(time / 3.2);
    const at = n * 3.2 + hash(state.seed, 'blink', n) * 2.0;
    const blink = clamp(1 - Math.abs(time - at) / 0.07);
    for (const e of head.eyes) if (e.morphTargetInfluences) e.morphTargetInfluences[0] = blink;
    m.eyes.emissiveIntensity = base.eyes * state.eyeGlow;
    m.screen.emissiveIntensity = base.screen * (0.6 + 0.4 * state.eyeGlow);
    m.glow.emissiveIntensity = base.glow * state.eyeGlow;
    group.updateMatrixWorld(true);
  }

  // Typing: wrists hover in front of the keyboard's home row, fingertips just over the keys; seeded taps.
  function typingArm(s, time) {
    const kb = state.keys;
    let wrist, fwd, upv;
    if (kb) {
      kb.updateWorldMatrix(true, false);
      const q = kb.getWorldQuaternion(new THREE.Quaternion());
      fwd = V(0, 0, -1).applyQuaternion(q); upv = V(0, 1, 0).applyQuaternion(q);
      const side = V(1, 0, 0).applyQuaternion(q);
      // the robot faces the keyboard, so its left (+s) is the keyboard's -x
      wrist = kb.localToWorld(V(-s * 0.06, 0.05, 0.072));
    } else {
      fwd = Ld(0, 0, 1); upv = Ld(0, 1, 0);
      wrist = L(s * 0.5 * u, state.seat.y + 1.3 * u, 1.3 * u);
    }
    const slot = Math.floor(time * 7.5 + hash(state.seed, s) * 3);
    const ph = time * 7.5 + hash(state.seed, s) * 3 - slot;
    const active = Math.floor(hash(state.seed, 'k', s, slot) * 4);
    const on = hash(state.seed, 'on', s, slot) < 0.8 * state.typing;
    const tap = on ? Math.sin(Math.PI * ph) * 0.42 : 0;
    const curl = [0.78, 0.84, 0.86, 0.3].map((c, i) => c + (i === active ? tap : 0));
    wrist.addScaledVector(upv, 0.003 * Math.sin(time * 5.1 + s) * state.typing);
    const toCentre = V().crossVectors(upv, fwd).multiplyScalar(-s * 0.12); // fingers angle in a little
    const fingerDir = fwd.clone().addScaledVector(upv, -0.16).add(toCentre).normalize(); // palm near level, fingers curl down
    const back = upv.clone().addScaledVector(fwd, 0.25).addScaledVector(V().crossVectors(fwd, upv), s * 0.15).normalize();
    const pole = upv.clone().multiplyScalar(-0.45).addScaledVector(fwd, -1).addScaledVector(V().crossVectors(upv, fwd), s * 0.9).normalize();
    return { wrist, fingerDir, back, pole, curl };
  }
  // Seated turn: the hand on the neighbour's side lifts into a small open-palm gesture.
  function turnGesture(s, spec, k, time) {
    const { yaw } = lookAngles(state.lookAt, pelvis, pelvis);
    if (Math.sign(yaw) !== Math.sign(s)) return spec;
    const g = smooth(0.3, 1, k);
    const hip = wpos(pelvis);
    const wrist = hip.clone().add(Ld(s * 0.62 * u, (0.95 + 0.04 * Math.sin(time * 2.2)) * u, 0.62 * u));
    return { wrist: spec.wrist.clone().lerp(wrist, g), fingerDir: spec.fingerDir.clone().lerp(Ld(s * 0.4, 0.05, 1), g).normalize(), back: spec.back.clone().lerp(Ld(-s * 0.3, -1, 0), g).normalize(), pole: spec.pole, curl: spec.curl.map((c) => mix(c, 0.15, g)) };
  }
  // Point: the right arm swings up to the target, the index straight, the others curled.
  function pointArm(spec, k) {
    const S = wpos(arms.R.sh);
    const dir = state.pointAt.clone().sub(S).normalize();
    const reach = (B.upper + B.fore) * u * 0.93;
    const wrist = S.clone().addScaledVector(dir, reach);
    const e = smooth(0, 1, k);
    return {
      wrist: spec.wrist.clone().lerp(wrist, e),
      fingerDir: spec.fingerDir.clone().lerp(dir, e).normalize(),
      back: spec.back.clone().lerp(V(0, 1, 0).sub(dir.clone().multiplyScalar(dir.y)).normalize(), e).normalize(),
      pole: spec.pole.clone().lerp(V(0, -1, 0), e).normalize(),
      curl: [mix(spec.curl[0], 1.35, e), mix(spec.curl[1], 0.0, e), mix(spec.curl[2], 1.35, e), mix(spec.curl[3], 0.9, e)],
    };
  }

  function setState(patch = {}) {
    Object.assign(state, patch);
    if (patch.seat) state.seat = { ...{ y: 0.3, front: 0.16, z: 0.02 }, ...patch.seat };
  }

  // fingertip world positions (for contact checks in look-dev)
  function fingertips() { const out = []; for (const A of Object.values(arms)) for (const f of A.fingers) out.push(wpos(f.tip)); return out; }
  const mats = { ...m, shell, joint, rubber, trim, accent: accentMat, sole };
  function setEnvMap(tex) { for (const k of ['shell', 'feet', 'screen', 'joint', 'trim', 'rubber']) { mats[k].envMap = tex; mats[k].needsUpdate = true; } }

  setPose('standing-idle', 0);
  let tris = 0;
  group.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return {
    group, setPose, setState, mats, setEnvMap, fingertips, state,
    handles: { head, ballHead: head.ballHead, pelvis, spine, chest, neck, headPivot, arms, legs },
    info: { meshes: meshCount, tris: Math.round(tris), standingHeight: (B.ankleY + B.shin + B.thigh + B.spineY + B.waist + B.neckY + B.neckH + B.headUp + 1) * u, headRadius: u },
  };
}

function recolourHead(head, c) {
  const m = head.mats;
  const white = new THREE.Color('#FFFFFF');
  m.glow.color.copy(c); m.glow.emissive.copy(c);
  m.eyes.color.copy(c).lerp(white, 0.5); m.eyes.emissive.copy(c).lerp(white, 0.42);
  m.screen.color.copy(c).multiplyScalar(0.24); m.screen.emissive.copy(c).multiplyScalar(0.6);
  if (m.sole) { m.sole.color.copy(c).multiplyScalar(0.7); m.sole.emissive.copy(c); }
  head.color = `#${c.getHexString()}`;
}
