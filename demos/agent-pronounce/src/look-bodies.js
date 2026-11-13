// Episode 6 v4 look-dev: the bodied robots (src/robot-body.js) staged in the approved sets.
//   body-a    workspace, both robots seated and typing, two-shot from the screen side (faces lit by it)
//   body-a-b  the same staging through the literal workspace-b camera (their backs: for comparison)
//   body-b    turnaround of the Claude robot standing in neutral light (front, 3/4, side, back)
//   body-c    Codex mid stand-up beside its chair, three-quarter view, in the workspace
//   body-d    three crew robots standing in the desert set (look-desert4), mid-shot
// Each builder returns the look contract { scene, camera, film, handles } for lookdev/lookdev.js, and
// publishes contact measurements to window.__lookdevInfo.bodies (fingertip clearance, knee and desk).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildWorkspaceLook, LAYOUT, SHOTS } from './look-workspace.js';
import { buildDesert4Look, groundAt } from './look-desert4.js';
import { createBodiedRobot, BODY } from './robot-body.js';
import { contactShadow, practical } from './look-kit.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const BODY_SIZE = 0.15; // head radius (world) in the workspace: standing 0.83, seated head top ~0.9
const TIME = 2.35; // seek time for the loops (any value renders the same frame on every run)

const info = (patch) => { if (typeof window !== 'undefined') window.__lookdevInfo = { ...(window.__lookdevInfo || {}), bodies: { ...((window.__lookdevInfo || {}).bodies || {}), ...patch } }; };
const r3 = (v) => v.toArray().map((x) => +x.toFixed(3));

// The workspace keyboards: Groups holding the 61-key InstancedMesh.
function keyboards(scene) {
  const out = [];
  scene.traverse((o) => { if (o.isInstancedMesh && o.count === 61) out.push(o.parent); });
  return out;
}
// The contact-shadow decal nearest a floor point (moved with the chair).
function decalNear(scene, p) {
  let best = null, d = 0.05;
  for (const o of scene.children) if (o.isMesh && Math.abs(o.position.y - 0.014) < 0.002) { const k = Math.hypot(o.position.x - p.x, o.position.z - p.z); if (k < d) { best = o; d = k; } }
  return best;
}

// Stage the bodied robots in a built workspace look. mode 'typing' pulls each chair to its desk.
function stageWorkspace(look, assets, { mode = 'typing', pose = {} } = {}) {
  const { scene, handles } = look;
  const kbs = keyboards(scene);
  const bodies = {};
  const report = {};
  for (const [name, r] of Object.entries(handles.robots)) {
    r.root.visible = false;
    const side = r.side;
    const ch = r.chair;
    const kb = kbs.find((k) => Math.sign(k.position.x) === side);
    const yaw = side * LAYOUT.desk.yaw;
    const n = V(Math.sin(yaw), 0, Math.cos(yaw)); // desk front normal (toward the user)
    const robot = createBodiedRobot(assets, { agent: name, size: BODY_SIZE, shade: { faceBoost: name === 'Claude' ? 1.25 : 1 } });
    robot.setEnvMap(r.mats.shell.envMap);
    const old = decalNear(scene, ch.position);
    if (mode === 'typing') {
      kb.position.addScaledVector(n, 0.07); // keyboard to the desk's front edge (desk-local z 0.19)
      const seat = kb.position.clone().addScaledVector(n, pose.reach ?? 0.4).setY(0);
      ch.position.copy(seat);
      ch.rotation.y = yaw; // the chair faces -z: toward the desk
    }
    if (old) { old.position.x = ch.position.x; old.position.z = ch.position.z; }
    robot.group.position.copy(ch.position);
    robot.group.rotation.y = ch.rotation.y + Math.PI; // the body faces +z
    scene.add(robot.group);
    const u = BODY_SIZE;
    const front = 0.152; // cushion front lip, chair-local
    robot.setState({ seat: { y: ch.userData.seatY, front, z: front - BODY.thigh * u + 0.07 * u }, keys: kb, seed: name, standZ: front + 0.32 });
    bodies[name] = { robot, chair: ch, keyboard: kb, side };
    report[name] = { seatY: +ch.userData.seatY.toFixed(3), chair: r3(ch.position) };
  }
  return { bodies, report };
}

// Contact checks: the lowest fingertip above the key tops, the knees in front of the desk edge.
function measureTyping(bodies) {
  const out = {};
  for (const [name, b] of Object.entries(bodies)) {
    const keyTop = b.keyboard.localToWorld(V(0, 0.017, 0)).y;
    const tips = b.robot.fingertips();
    const minTip = Math.min(...tips.map((p) => p.y));
    const yaw = b.side * LAYOUT.desk.yaw;
    const n = V(Math.sin(yaw), 0, Math.cos(yaw));
    const deskFront = V(b.side * LAYOUT.desk.at, 0, LAYOUT.desk.z).addScaledVector(n, LAYOUT.desk.d / 2);
    const knees = ['L', 'R'].map((s) => b.robot.handles.legs[s].shin.getWorldPosition(V()));
    const kneeGap = Math.min(...knees.map((k) => k.clone().sub(deskFront).dot(n)));
    const kneeTop = Math.max(...knees.map((k) => k.y)) + 0.17 * BODY_SIZE;
    const wrists = ['L', 'R'].map((s) => b.robot.handles.arms[s].hand.getWorldPosition(V()));
    out[name] = { tipClear: +(minTip - keyTop).toFixed(4), kneeGap: +kneeGap.toFixed(3), kneeTop: +kneeTop.toFixed(3), deskUnder: +(LAYOUT.desk.top - 0.032).toFixed(3), wrists: wrists.map(r3), head: r3(b.robot.handles.headPivot.getWorldPosition(V())) };
  }
  return out;
}

function setCamera(look, { pos, target, focal, subject, aperture, maxblur }) {
  const c = look.camera;
  c.setFocalLength(focal);
  c.position.set(...pos);
  c.lookAt(...target);
  c.updateMatrixWorld();
  look.film.dof = { focus: V(...pos).distanceTo(V(...subject)), aperture, maxblur };
}

// ---------------------------------------------------------------- body-a / body-a-b
export async function buildBodyA(assets, renderer, { camera = 'screen' } = {}) {
  const look = await buildWorkspaceLook(assets, renderer, { shot: 'a' }); // 'work' layout: chairs face the desks
  const { bodies, report } = stageWorkspace(look, assets, { mode: 'typing' });
  for (const [name, b] of Object.entries(bodies)) {
    b.robot.setState({ typing: 1, lookAt: null });
    b.robot.setPose('seated-typing', TIME + (name === 'Codex' ? 0.37 : 0));
  }
  if (camera === 'screen') {
    // the set-workspace reverse two-shot: from in front of the hero screen, faces lit by it
    setCamera(look, { pos: [0.04, 0.9, -0.8], target: [0, 0.6, 0.6], focal: 24, subject: [0, 0.62, 0.55], aperture: 0.004, maxblur: 0.006 });
    // the hero screen is the faces' key while they work (as in set-workspace): a soft cool fill from it
    const fill = practical('spot', { color: '#D6E4FF', intensity: 2.2, distance: 3, angle: 0.9, penumbra: 1, shadow: 0 });
    fill.position.set(0, 0.95, -0.86); fill.target.position.set(0, 0.55, 0.65);
    look.scene.add(fill, fill.target);
  } else {
    const S = SHOTS.b;
    setCamera(look, { pos: S.pos, target: S.target, focal: S.focal, subject: S.subject, aperture: S.aperture, maxblur: S.maxblur });
  }
  info({ seats: report, typing: measureTyping(bodies) });
  look.handles.bodies = bodies;
  return look;
}

// ---------------------------------------------------------------- body-c
export async function buildBodyC(assets, renderer) {
  // the 'talk' layout: chairs swivelled away from the desks, so Codex stands into open floor
  const look = await buildWorkspaceLook(assets, renderer, { shot: 'b' });
  const { bodies, report } = stageWorkspace(look, assets, { mode: 'talk' });
  const cx = bodies.Codex, cl = bodies.Claude;
  // Codex's chair swivelled to face the window (+z): it stands up into the open floor
  cx.chair.rotation.y = Math.PI;
  cx.robot.group.rotation.y = 0;
  cx.robot.setState({ standZ: 0.152 + 0.24 });
  cx.robot.setPose('stand-up', 0.7, TIME);
  const head = cx.robot.handles.headPivot.getWorldPosition(V());
  cl.robot.setState({ lookAt: head.clone().add(V(0, 0.08, 0)) });
  cl.robot.setPose('seated-turn', 1, TIME);
  // three-quarter from the room's open floor, front-left of Codex (clear of the window plants)
  const at = cx.robot.group.position;
  const pos = V(at.x - 0.5, 0.82, at.z + 1.02);
  const tgt = V(at.x + 0.02, 0.38, at.z + 0.25);
  // whatever sits between the lens and Codex's head (plants) would hide the still
  const occl = new THREE.Raycaster(pos, head.clone().sub(pos).normalize(), 0.02, head.distanceTo(pos) - 0.2);
  occl.camera = look.camera;
  const blockers = occl.intersectObjects(look.scene.children, true).filter((h) => h.object.isMesh).map((h) => h.object.name || h.object.parent?.name || '?');
  info({ blockers });
  setCamera(look, { pos: pos.toArray(), target: tgt.toArray(), focal: 20, subject: [at.x, 0.5, at.z + 0.3], aperture: 0.004, maxblur: 0.006 });
  info({ seats: report, codexFeet: ['L', 'R'].map((s) => r3(cx.robot.handles.legs[s].foot.getWorldPosition(V()))), camera: { pos: r3(pos), target: r3(tgt) } });
  look.handles.bodies = bodies;
  return look;
}

// ---------------------------------------------------------------- body-b turnaround
export async function buildBodyB(assets, renderer) {
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.background = new THREE.Color('#77746F');
  // seamless sweep: floor curving up into the wall
  const sweepMat = new THREE.MeshStandardMaterial({ color: '#8C8984', roughness: 0.92, envMapIntensity: 0.4 });
  // profile in (y, z): flat floor to z -0.8, a 1 m radius cove up into the wall at z -1.8
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push([0, 3 - (i / 8) * 3.8]);
  for (let i = 1; i <= 24; i++) { const a = (i / 24) * Math.PI / 2; pts.push([1 - Math.cos(a), -0.8 - Math.sin(a)]); }
  for (let i = 1; i <= 6; i++) pts.push([1 + i * 0.6, -1.8]);
  const sw = new THREE.BufferGeometry();
  const posA = [], idx = [];
  for (const [y, z] of pts) { posA.push(-5, y, z, 5, y, z); }
  for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  sw.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3)); sw.setIndex(idx); sw.computeVertexNormals();
  const sweep = new THREE.Mesh(sw, sweepMat); sweep.receiveShadow = true; sweepMat.side = THREE.DoubleSide;
  scene.add(sweep);
  // three-point light, neutral 5600 K
  const hemi = new THREE.HemisphereLight('#E9ECF2', '#5E5A55', 0.55); scene.add(hemi);
  const key = new THREE.DirectionalLight('#FFF6EC', 1.7); key.position.set(-2.2, 3.2, 3.2); key.target.position.set(0, 0.4, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 10 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01; key.shadow.radius = 4;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight('#DDE6F5', 0.6); fill.position.set(3, 1.4, 2.5); scene.add(fill);
  const rim = new THREE.DirectionalLight('#FFFFFF', 1.4); rim.position.set(1.5, 2.6, -3); scene.add(rim);
  const robots = [];
  const yaws = [0, -Math.PI / 4, -Math.PI / 2, Math.PI];
  const gap = 0.5;
  yaws.forEach((y, i) => {
    const r = createBodiedRobot(assets, { agent: 'Claude', size: BODY_SIZE, shade: { faceBoost: 1.25, envMap: env } });
    r.setEnvMap(env);
    r.group.position.set((i - 1.5) * gap, 0, 0);
    r.group.rotation.y = y;
    r.setState({ standZ: 0, seed: `turn${i}` });
    r.setPose('standing-idle', 0.6);
    scene.add(r.group);
    const cs = contactShadow(scene, 0.34, 0.3, 0.45); cs.position.set((i - 1.5) * gap, 0.002, 0.01); scene.add(cs);
    robots.push(r);
  });
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 30);
  camera.filmGauge = 36; camera.setFocalLength(50);
  camera.position.set(0, 0.52, 2.75); camera.lookAt(0, 0.41, 0); camera.updateMatrixWorld();
  const film = {
    size: [1920, 1080], tone: 'aces', exposure: 0.9,
    ao: { radius: 0.12, thickness: 1, distanceExponent: 1.5, scale: 1, samples: 16, intensity: 0.8 },
    dof: { focus: 2.75, aperture: 0.0008, maxblur: 0.002 },
    bloom: { strength: 0.18, radius: 0.5, threshold: 1.0 },
    grade: { vignette: 0.22, grain: 0.012, ca: 0.0006, lift: [0.002, 0.003, 0.005], seed: 3 },
  };
  info({ turnaround: robots[0].info });
  return { scene, camera, bloom: null, exposure: film.exposure, film, handles: { robots } };
}

// ---------------------------------------------------------------- body-d desert crew
export async function buildBodyD(assets, renderer) {
  const look = await buildDesert4Look(assets, renderer, { shot: 'b' });
  const { scene, handles } = look;
  // the seated visitors belong to shot b; this still is the crew standing
  for (const v of handles.visitors || []) v.root.visible = false;
  for (const c of handles.chairs || []) c.visible = false;
  const u = 0.27; // standing ~1.5 m beside the series' 0.8 m ball robots: a real crew
  const crew = [
    { agent: 'Antigravity', color: '#1FB2F2', at: [-1.3, -12.45], yaw: -0.25, pose: 'point', t: 1 },
    { agent: 'Cursor', color: '#B67BFF', at: [-0.4, -12.15], yaw: -0.05, pose: 'standing-idle', t: 1.1 },
    { agent: 'OpenCode', color: '#D9DADC', at: [0.5, -12.6], yaw: -0.4, pose: 'standing-idle', t: 3.7 },
  ];
  const bodies = [];
  // Antigravity points out past the lens, camera-left; the crew turn their faces that way (3/4 to camera)
  const target = V(-2.6, 1.25, -9.2);
  // ground each robot on whatever is under it (paving top, not the bare terrain height)
  const ray = new THREE.Raycaster();
  ray.camera = look.camera;
  const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  const floorAt = (x, z) => {
    ray.set(V(x, 3, z), V(0, -1, 0));
    const hits = ray.intersectObjects(scene.children, true).filter((h) => h.object.isMesh && shown(h.object) && h.point.y < 0.3);
    return hits.length ? hits[0].point.y : groundAt(x, z);
  };
  for (const c of crew) {
    const r = createBodiedRobot(assets, { agent: c.agent === 'OpenCode' ? 'OpenCode' : c.agent, color: c.color, size: u });
    const [x, z] = c.at;
    r.group.position.set(x, floorAt(x, z), z);
    r.group.rotation.y = c.yaw; // the body faces +z (towards the camera), turned a little
    r.setState({ standZ: 0, seed: c.agent, pointAt: target, lookAt: c.pose === 'point' ? target : null });
    r.setPose(c.pose, c.t, c.t + 2);
    scene.add(r.group);
    const cs = contactShadow(scene, 0.6, 0.55, 0.5); cs.position.set(x, r.group.position.y + 0.01, z); scene.add(cs);
    bodies.push(r);
  }
  // Cursor and OpenCode look at Antigravity's pointing hand's target
  bodies[1].setState({ lookAt: target }); bodies[1].setPose('standing-idle', 1.1, 3.1);
  bodies[2].setState({ lookAt: target }); bodies[2].setPose('standing-idle', 3.7, 5.7);
  const cam = look.camera;
  cam.setFocalLength(40);
  cam.position.set(0.15, 1.2, -8.6);
  cam.lookAt(-0.4, 0.82, -12.4);
  cam.updateMatrixWorld();
  look.film.dof = { focus: cam.position.distanceTo(V(-0.4, 0.9, -12.3)), aperture: 0.0016, maxblur: 0.006 };
  info({ crew: bodies.map((b) => ({ feet: ['L', 'R'].map((s) => r3(b.handles.legs[s].foot.getWorldPosition(V()))), ground: +b.group.position.y.toFixed(3) })) });
  handles.bodies = bodies;
  return look;
}
