// T3 Code loft kinds: t3-hall (H2, H5), t3-codex-room (H3), t3-antigravity-room (H4),
// t3-clock (H6), t3-phone (H7), t3-fridge (H8). Rows and word times drive every beat;
// shots follow the Cribs rules in SPEC.md (fov 62 handheld, face in the upper two
// thirds, the bottom 22 % left for captions, 6-frame whips between rooms).
import * as THREE from 'three';
import { LOFT, loftPalette, buildHallway, antigravityRoom, contactShadow } from './set-loft.js';
import { loftMaterials, group, mesh, std } from './props-loft.js';
import { tex, textPlate, canvas } from './textures-loft.js';
import { leadInLook, anticipate, actionTime, addRobot, tourSpec, wordTime, walkTo, face, faceToward, speak, hover, glideTo, idle, hop, posAt, centreAt } from './cribs.js';
import { framed, follow, keyed, dirFromYaw, FOV } from './cribs-camera.js';
import { placeRigid } from './tour.js';
import { clamp, hash, ease } from './util.js';
import { ROBOT } from './robot.js';
import { KINDS as ROOM_KINDS } from './tour-rooms.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function loftWorld(scene, assets) {
  const palette = loftPalette(assets);
  const M = loftMaterials(palette);
  return { palette, M, robots: {} };
}

// The sticky note (H5): a 0.2 m square of yellow paper, "TASK" on top.
function stickyNote(scene) {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#FFD84D';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(0,0,0,0.06)';
  g.fillRect(0, 0, 256, 34);
  g.fillStyle = '#2B2B2B';
  g.font = '64px "Archivo Black", "Arial Black", Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('TASK', 128, 112);
  g.strokeStyle = '#3A3A3A';
  g.lineWidth = 6;
  g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    for (let x = 40; x <= 216 - i * 30; x += 12) g.lineTo(x, 160 + i * 30 + Math.sin(x * 0.2 + i) * 4);
    g.stroke();
  }
  const top = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.8 });
  const side = std('#F2C83C', 0.8);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.004, 0.24), [side, side, top, side, side, side]);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

// ---------------------------------------------------------------- t3-hall

const H2_STOP = { x: 0.66, z: -0.98 };
const H5 = { door: -10.2, oc: { x: 0.08, z: -9.72 }, noteX: 0.5, noteZ: -10.32, noteRestX: 2.2, ag0: { x: 3.5, z: -8.8 }, ag1: { x: 2.62, z: -9.42 } };

function hallBuild(scene, assets, ctx) {
  const W = loftWorld(scene, assets);
  W.hall = buildHallway(scene, assets, W.M, W.palette);
  const h2 = ctx.row('H2');
  if (h2 || !ctx.has('H5')) {
    const r = h2 || { localStart: 0, duration: 3, words: [] };
    // walk-and-talk until the beat before "...Weird." (the composition's action), else past "Nobody"
    const tNobody = wordTime(r, 'Nobody', 0.38);
    const until = actionTime(ctx, 'beat', tNobody + 0.3);
    const walk = Math.max(0.9, until - r.localStart - 0.1);
    W.h2dist = clamp(0.8 * walk, 1.1, 2.6);
    W.robots.Cursor = addRobot(scene, assets, 'Cursor', { x: 0.28, z: H2_STOP.z - W.h2dist, yaw: -Math.PI / 2 + 0.12 });
  }
  if (ctx.has('H5')) {
    // Antigravity's room sits behind its hallway door (the door itself is the hall's)
    const g = group(scene, [LOFT.hall.x1 + LOFT.wallT, 0, H5.door]);
    W.agRoom = antigravityRoom(g, W.M, W.palette, assets, { door: 'opening' });
    const fill = new THREE.PointLight('#FFF1DE', 3.2, 6, 2);
    fill.position.set(LOFT.hall.x1 + 2.4, 2.2, H5.door + 0.4);
    scene.add(fill);
    W.robots.OpenCode = addRobot(scene, assets, 'OpenCode', { x: H5.oc.x, z: H5.oc.z, yaw: 0.9 });
    W.robots.Antigravity = addRobot(scene, assets, 'Antigravity', { x: H5.ag0.x, z: H5.ag0.z, yaw: Math.PI * 0.75 });
    W.note = stickyNote(scene);
  }
  return W;
}

function hallPlan(W, ctx) {
  const specs = {};
  for (const [n, r] of Object.entries(W.robots)) specs[n] = tourSpec(n, r.seat, { seedTag: ctx.seedTag });
  const shots = [];
  const props = [];
  let noteSwitch = Infinity;
  let noteRest = null;

  const h2 = ctx.row('H2');
  if (specs.Cursor) {
    const C = specs.Cursor;
    const r = h2 || { localStart: 0, duration: ctx.duration, end: ctx.duration, id: 'H2', words: [], onsets: [], env: [] };
    const t0 = r.localStart;
    const tWeird = actionTime(ctx, 'weird', wordTime(r, 'Weird', 0.82));
    if (h2) speak(C, r, { bounce: 0 });
    const arrive = walkTo(C, t0 + 0.02, H2_STOP, { stride: 0.3 });
    // looks at its own door (east, +X) on "Nobody to interrupt", then at us on "Weird"
    face(C, Math.max(arrive - 0.05, wordTime(r, 'Nobody', 0.4) + 0.1), -0.72);
    // the beat: a slow look round the empty hall before "...Weird."
    const tBeat = actionTime(ctx, 'beat', tWeird - 0.9);
    face(C, tBeat + 0.05, -1.95);
    const camB = V(H2_STOP.x - 1.55, 0.86, H2_STOP.z + 1.45);
    faceToward(C, tWeird - 0.22, camB);
    C.eyes.push({ t0: tWeird - 0.1, t1: r.end + 1, sx: 1.08, sy: 0.6 });
    C.leans.push({ t0: tWeird - 0.05, t1: tWeird + 0.55, squash: -0.07, nod: 0.12, in: 0.12, out: 0.3 });
    // the tail hold: a look down the empty hallway, then back up it, then at us
    C.looks.push({ t: r.end + 0.02, yaw: C.plan.lastLook + 0.9 }, { t: r.end + 0.32, yaw: C.plan.lastLook - 0.7 });
    C.looks.sort((a, b) => a.t - b.t);
    // A: walk-and-talk, the operator walks backwards ahead of Cursor down the long hallway
    shots.push({
      t0, whipIn: 0,
      ...follow('H2-A walk-and-talk', ctx.getSim, C, { offset: V(-0.42, 0.3, 2.05), ndcX: 0.06, ndcY: 0.14 }),
    });
    // B: off-axis single for the awkward "...Weird." (Cursor turns to this lens)
    const centre = centreAt(C, tWeird);
    const dir = camB.clone().sub(centre).normalize();
    shots.push({ t0: tWeird - 0.18, ...framed('H2-B Weird single', centre, C.radius, dir, { fill: 0.42, ndcX: 0.16, ndcY: 0.16, push: 0.2, drift: 0.1 }) });
  }

  const h5 = ctx.row('H5');
  if (h5) {
    const O = specs.OpenCode, A = specs.Antigravity;
    const t0 = h5.localStart;
    const tSlide = actionTime(ctx, 'noteSlide', wordTime(h5, 'Slide', 0.3));
    const tUnder = actionTime(ctx, 'noteUnder', tSlide + 0.6);
    const tThey = actionTime(ctx, 'noteArrives', Math.max(tSlide + 1.6, wordTime(h5, 'They', 0.62)));
    const tGossip = wordTime(h5, 'gossip', 0.86);
    speak(O, h5, { bounce: 0.2 });
    const camA = V(-0.95, 0.74, -11.7);
    faceToward(O, t0 - 0.5, camA);
    // drop the note, turn to it, shove it under the door with a forward lunge
    const noteY = 0.6;
    faceToward(O, tSlide - 0.42, V(H5.noteX, 0, H5.noteZ));
    O.lunges.push({ t: tSlide - 0.07, dist: 0.55, anticip: 0.12, hold: 0.32 });
    O.hops.push({ t: tSlide - 0.1, height: 0.05, anticip: 0.1, depth: 0.14 });
    faceToward(O, tSlide + 0.55, camA);
    // slide timing from the SFX beats: under the door at tUnder, at rest as Antigravity
    // picks it up (tThey). Constant friction: x(t) = D (1 - (1 - t/T)^2).
    const tKick = tSlide - 1 / 30; // the shove lands one frame before the slide SFX
    const Dn = H5.noteRestX - H5.noteX, d1 = LOFT.hall.x1 - H5.noteX;
    const T = Math.max(0.6, (tUnder - tKick) / (1 - Math.sqrt(Math.max(0.01, 1 - d1 / Dn))));
    const v0 = (2 * Dn) / T;
    const mu = v0 / T / 9.8;
    noteRest = H5.noteRestX;
    props.push({
      id: 'note', pos: [H5.noteX, noteY, H5.noteZ], rot: [0, 0.18, 0], half: { h: 0.002 },
      restitution: 0.05, friction: mu, drag: 2.2,
      held: [{ t0: -99, t1: t0 + 0.22 }],
      events: [{ t: tKick, v: [v0, 0, 0], slide: true }],
      support: () => 0,
    });
    // inside the room: the note arrives, Antigravity glides over, lifts it, reads, eyes the door
    const restZ = H5.noteZ;
    hover(A, -99, 0.27);
    A.liftBob = (t) => 0.022 * Math.sin(t * 2.3);
    idle(A, -1, tSlide);
    glideTo(A, tUnder - 0.1, H5.ag1, 0.9);
    faceToward(A, tSlide + 1.0, V(H5.noteRestX - 0.1, 0, restZ));
    A.leans.push({ t0: tSlide + 0.9, t1: tThey + 0.1, nod: 0.32, in: 0.25, out: 0.3 });
    noteSwitch = tThey;
    props.push({
      id: 'note-lift', spring: true,
      keys: [
        { t: -99, pos: [0, 0, 0], rot: [0, 0, 0], hz: 3, zeta: 0.6 },
        { t: tThey, pos: [0.0, 0.84, 0.26], rot: [1.2, 0.4, 0], hz: 2.4, zeta: 0.5 },
      ],
      bob: (t) => (t > tThey + 0.5 ? [0, 0.012 * Math.sin((t - tThey) * 2.4), 0, 0.03 * Math.sin((t - tThey) * 1.7), 0, 0] : [0, 0, 0, 0, 0, 0]),
    });
    A.eyes.push({ t0: tThey + 0.15, t1: tGossip - 0.1, sx: 1.2, sy: 1.2 });
    faceToward(A, tGossip - 0.1, V(LOFT.hall.x1, 0.4, H5.door - 0.15));
    A.eyes.push({ t0: tGossip, t1: h5.end + 1, sx: 1.1, sy: 0.55 });
    A.leans.push({ t0: tGossip, t1: h5.end + 1, pitch: -0.12, in: 0.3 });
    // A: OpenCode beside Antigravity's door (hallway side); the door and the note to its left
    const cO = centreAt(O, t0);
    shots.push({ t0, whipIn: 1, ...framed('H5-A note at the door', cO, O.radius, camA.clone().sub(cO).normalize(), { fill: 0.28, ndcX: 0.22, ndcY: 0.12, push: 0.25, drift: 0.1 }) });
    // B: inside the room at floor level: the note shoots out from under the door toward us
    const pB = V(3.02, 0.42, H5.door - 1.72);
    shots.push({
      t0: tUnder - 0.12, whipOut: 1,
      ...keyed('H5-B inside, under the door', [
        { t: tUnder - 0.12, pos: pB, target: V(2.36, 0.4, H5.door + 0.3), fov: FOV },
        { t: h5.end + 0.3, pos: pB.clone().add(V(0.05, 0.04, -0.12)), target: V(2.4, 0.46, H5.door + 0.34), fov: FOV, ease: ease.sineInOut },
      ], { dist: 1.2 }),
    });
  }
  if (h2 && !h5) shots[shots.length - 1].whipOut = 1;
  // lead-ins: the host eyes the room's gag, then turns to us just before the first word
  if (h2 && specs.Cursor) leadInLook(specs.Cursor, h2, V(1.5, 1.0, W.robots.Cursor.seat.z - 0.4));
  if (h5 && specs.OpenCode) {
    leadInLook(specs.OpenCode, h5, V(H5.noteX, 0.62, H5.noteZ));
    // tail: Antigravity leans in to the door to eavesdrop, with a little hop
    specs.Antigravity.leans.push({ t0: h5.end + 0.02, t1: ctx.duration + 1, pitch: -0.2, roll: 0.1, in: 0.25 });
    hop(specs.Antigravity, h5.end + 0.1, 0.03);
  }

  function update(t, sim) {
    if (!W.note) return;
    const rigid = sim.propPose('note', t);
    if (t < noteSwitch || !rigid) { placeRigid(W.note, rigid); return; }
    const off = sim.propPose('note-lift', t);
    const base = sim.propPose('note', noteSwitch);
    placeRigid(W.note, base.map((v, i) => v + off[i]));
  }
  return { start: -0.8, specs, props, shots, update, info: { noteRest } };
}

export const KINDS = {
  't3-hall': { build: hallBuild, plan: hallPlan },
  ...ROOM_KINDS,
};
