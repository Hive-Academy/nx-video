// Street kinds: door-cold (C1), t3-door (H1), ptah-door (P1) and both (E1-E3).
// All four mount the same street (set-street.js): the loft on the left, the temple
// on the right, the sidewalk in front. Front doors are exterior porch shots; the
// doors open onto lit interiors, so a door push-through lands inside the home.
import * as THREE from 'three';
import { STREET, buildStreet } from './set-street.js';
import { std, mesh, group } from './props-loft.js';
import { leadInLook, anticipate, actionTime, addRobot, tourSpec, wordTime, walkTo, face, faceToward, speak, hover, idle, hop, centreAt, posAt, TOUR_SCALE, CAST } from './cribs.js';
import { framed, keyed, follow, dirFromYaw, FOV } from './cribs-camera.js';
import { addSunglasses } from './robot.js';
import { clamp, hash, ease, smoothstep } from './util.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Z = STREET.facadeZ;
const D = STREET.loftDoor;
const GT = STREET.gate;
const GY = GT.steps * GT.step;
const GX = (GT.x0 + GT.x1) / 2;
const nullRow = (id, duration) => ({ id, localStart: 0, duration, end: duration, words: [], onsets: [], env: [] });
const specsOf = (W, ctx) => Object.fromEntries(Object.entries(W.robots).map(([n, r]) => [n, tourSpec(n, r.seat, { scale: r.scale, seedTag: ctx.seedTag })]));
const rowOr = (ctx, id) => ctx.row(id) || (ctx.rows.length === 1 ? ctx.rows[0] : null);

function streetWorld(scene, assets) {
  const S = buildStreet(scene, assets);
  return { S, robots: {} };
}

// ---------------------------------------------------------------- door-cold (C1)

const doorCold = {
  build(scene, assets) {
    const W = streetWorld(scene, assets);
    W.robots.Codex = addRobot(scene, assets, 'Codex', { x: D.x + 0.86, y: D.landing, z: Z + 0.4, yaw: -Math.PI / 2 + 0.28 });
    W.glasses = addSunglasses(W.robots.Codex);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const C = specs.Codex;
    const r = rowOr(ctx, 'C1') || nullRow('C1', ctx.duration);
    const t0 = r.localStart;
    if (ctx.rows.length) speak(C, r, { bounce: 0 });
    // leaning on the door frame (its right side, toward the door), cool and still
    C.leans.push({ t0: -99, t1: 99, roll: 0.24, wx: -0.07, pitch: 0.04, in: 0.1, out: 0.3 });
    const tBoth = actionTime(ctx, 'bothOfThem', wordTime(r, 'Both', 0.7));
    const tCrib = wordTime(r, 'crib', 0.35);
    C.leans.push({ t0: tCrib - 0.05, t1: tCrib + 0.5, nod: -0.16, in: 0.12, out: 0.3 });
    // "Both of them.": a glance over at the temple next door, then back to us
    faceToward(C, tBoth - 0.12, V(GX, 1, Z));
    faceToward(C, tBoth + 0.75, V(0.6, 1.0, 4));
    const tBell = actionTime(ctx, 'doorbell', t0 + 0.02);
    function update(t) {
      W.S.update(t);
      const u = t - tBell;
      W.S.loft.bellMat.emissiveIntensity = 0.1 + (u > 0 ? 2.4 * Math.exp(-u * 2.5) : 0);
    }
    const c0 = centreAt(C, 0);
    const A = framed('C1-A Codex at the door', c0, C.radius, V(0.22, 0.07, 1).normalize(), { fill: 0.27, ndcX: 0.08, ndcY: 0.12, push: 0.0, drift: 0.12 });
    const aPose = A.to;
    const wide = { pos: V(1.6, 0.86, 0.25), target: V(2.0, 1.75, -6.5), fov: FOV };
    const shots = [
      { t0, ...A },
      // B: on "Both" the operator pulls back and pans right: the temple next door
      { t0: tBoth - 0.08, whipOut: 0, ...keyed('C1-B pull back to both homes', [
        { t: tBoth - 0.08, pos: aPose.pos, target: aPose.target, fov: FOV },
        { t: tBoth + 0.85, pos: wide.pos, target: wide.target, fov: FOV, ease: ease.power3InOut },
        { t: r.end + 1, pos: wide.pos.clone().add(V(0.15, 0.04, -0.2)), target: wide.target, fov: FOV, ease: ease.sineInOut },
      ], { dist: 4 }) },
    ];
    return { start: -0.6, specs, shots, update };
  },
};

// ---------------------------------------------------------------- t3-door (H1)

const t3Door = {
  build(scene, assets) {
    const W = streetWorld(scene, assets);
    W.robots.Claude = addRobot(scene, assets, 'Claude', { x: D.x - 0.88, y: D.landing, z: Z + 0.5, yaw: -Math.PI / 2 + 0.3 });
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const C = specs.Claude;
    const r = rowOr(ctx, 'H1') || nullRow('H1', ctx.duration);
    const t0 = r.localStart;
    if (ctx.rows.length) speak(C, r, { bounce: 0.15 });
    const tT3 = wordTime(r, 'T3', 0.25);
    const tEvery = wordTime(r, 'Every', 0.5);
    const tRoom = wordTime(r, 'room', 0.85);
    // presents the door on "T3 Code" without turning away (a lean toward it), then on
    // "Every one of us" hop-walks in through the open door ahead of the camera, and on
    // "own room!" turns back to us inside the bright loft with a happy hop
    faceToward(C, -1, V(D.x + 0.1, 1.0, Z + 3.4));
    C.leans.push({ t0: tT3 - 0.1, t1: tT3 + 0.8, roll: -0.16, nod: 0.08, in: 0.2, out: 0.3 });
    // leaves after "Code." so it faces us for the name, and is through the door by "room!"
    const tGo = Math.max(wordTime(r, 'Code', 0.4, 'end') + 0.05, actionTime(ctx, 'doorOpen', tT3) + 0.04);
    const step = { stride: 0.45, height: 0.08, gap: 0.02, anticip: 0.07 };
    const inDoor = walkTo(C, tGo, { x: D.x - 0.1, z: Z + 0.25 }, step);
    const inside = walkTo(C, inDoor - 0.12, { x: D.x - 0.05, z: Z - 0.8 }, step);
    faceToward(C, Math.max(inside - 0.1, tRoom - 0.35), V(D.x + 0.3, 1.1, Z + 2));
    hop(C, Math.max(inside + 0.05, tRoom - 0.05), 0.09, { depth: 0.2 });
    C.eyes.push({ t0: tEvery, t1: r.end + 1, sx: 1.2, sy: 1.2 });
    const tOpen = actionTime(ctx, 'doorOpen', tT3 + 0.05);
    const channels = { door: { keys: [{ t: -99, x: 0, hz: 4, zeta: 0.6 }, { t: tOpen, x: -1.5, hz: 1.7, zeta: 0.5 }], min: -1.62, max: 0.02, restitution: 0.3 } };
    const tBell = actionTime(ctx, 'doorbell', 0.08);
    leadInLook(C, r, V(D.x, 1.2, Z));
    function update(t, sim, ch) {
      W.S.update(t);
      W.S.loft.door.hinge.rotation.y = ch.door(t);
      const u = t - tBell;
      W.S.loft.bellMat.emissiveIntensity = 0.1 + (u > 0 ? 2.4 * Math.exp(-u * 2.5) : 0);
    }
    const c0 = centreAt(C, 0);
    const shots = [
      { t0, ...keyed('H1-A the loft door', [
        { t: t0, pos: V(D.x + 0.05, 1.0, Z + 3.5), target: V(D.x - 0.2, 1.3, Z), fov: FOV },
        { t: tEvery, pos: V(D.x + 0.1, 1.0, Z + 3.25), target: V(D.x - 0.2, 1.32, Z), fov: FOV, ease: ease.sineInOut },
      ], { dist: 4 }) },
      // B: the operator follows Claude in through the doorway (back 3/4, then Claude
      // turns to us inside on "own room!")
      { t0: tGo - 0.05, ...follow('H1-B follow Claude through the door', ctx.getSim, C, { offset: V(0.28, 0.42, 1.65), ndcX: -0.06, ndcY: 0.1 }) },
    ];
    return { start: -0.6, specs, channels, shots, update };
  },
};

// ---------------------------------------------------------------- ptah-door (P1)

function gavel(scene) {
  const g = new THREE.Group();
  const wood = std('#6E4A24', 0.45);
  const brass = std('#C99A42', 0.3, 0.85);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.3, 10), wood);
  handle.rotation.z = Math.PI / 2;
  handle.position.x = 0.15;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.15, 18), wood);
  head.rotation.x = Math.PI / 2;
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.014, 18), brass);
  b1.rotation.x = Math.PI / 2; b1.position.z = 0.058;
  const b2 = b1.clone(); b2.position.z = -0.058;
  for (const m of [handle, head, b1, b2]) { m.castShadow = true; g.add(m); }
  // pivot at the handle's end
  const pivot = new THREE.Group();
  g.position.x = -0.3;
  pivot.add(g);
  scene.add(pivot);
  return pivot;
}

const ptahDoor = {
  build(scene, assets) {
    const W = streetWorld(scene, assets);
    W.robots.Conductor = addRobot(scene, assets, 'Conductor', { x: GX - 0.62, y: GY, z: Z + 0.62, yaw: -Math.PI / 2 + 0.22 }, { scale: 0.46 });
    // a stone plinth for the gavel beside the Conductor
    const top = GY + 0.78;
    mesh(scene, new THREE.BoxGeometry(0.36, 0.78, 0.36), std('#CDB28A', 0.75), [GX + 0.42, GY + 0.39, Z + 0.62]);
    mesh(scene, new THREE.BoxGeometry(0.44, 0.06, 0.44), std('#B88A3E', 0.35, 0.7), [GX + 0.42, top + 0.03, Z + 0.62]);
    mesh(scene, new THREE.CylinderGeometry(0.08, 0.085, 0.035, 28), std('#2A190F', 0.45), [GX + 0.42, top + 0.075, Z + 0.62]);
    W.gavel = gavel(scene);
    W.gavel.scale.setScalar(1.8);
    W.gavelRest = V(GX + 0.42 + 0.3 * 1.8, top + 0.09 + 0.042 * 1.8, Z + 0.62);
    W.gavel.position.copy(W.gavelRest);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const C = specs.Conductor;
    const r = rowOr(ctx, 'P1') || nullRow('P1', ctx.duration);
    const t0 = r.localStart;
    if (ctx.rows.length) speak(C, r, { bounce: 0 });
    const tTemple = actionTime(ctx, 'doorOpen', wordTime(r, 'temple', 0.3));
    const tHere = wordTime(r, 'Here', 0.45);
    const tGavel = actionTime(ctx, 'gavel', wordTime(r, 'gavel', 0.88) + 0.05);
    faceToward(C, tGavel - 0.5, V(GX + 0.42, 1, Z + 0.62));
    faceToward(C, tGavel + 0.35, V(GX + 0.9, 1.2, Z + 3.5));
    C.bumps.push({ t: tGavel - 1 / 30, pitch: -0.8 });
    const channels = { gates: { keys: [{ t: -99, x: 0, hz: 3, zeta: 0.7 }, { t: tTemple - 0.05, x: 1.32, hz: 1.2, zeta: 0.55 }], min: 0, max: 1.4, restitution: 0.25 } };
    // the gavel: rests on the plinth's sound block, lifts, strikes on "gavel"
    const props = [{
      id: 'gavel', spring: true,
      keys: [
        { t: -99, pos: W.gavelRest.toArray(), rot: [0, 0, 0], hz: 6, zeta: 0.6 },
        { t: tGavel - 0.55, pos: W.gavelRest.toArray(), rot: [0, 0, -1.1], hz: 4, zeta: 0.6 },
        { t: tGavel - 0.048, pos: W.gavelRest.toArray(), rot: [0, 0, 0.03], hz: 13, zeta: 0.32 },
        { t: tGavel + 0.2, pos: W.gavelRest.toArray(), rot: [0, 0, 0], hz: 5, zeta: 0.6 },
      ],
    }];
    function update(t, sim, ch) {
      W.S.update(t);
      const a = ch.gates(t);
      W.S.temple.gates[0].rotation.y = a;
      W.S.temple.gates[1].rotation.y = -a;
      const g = sim.propPose('gavel', t);
      if (g) {
        W.gavel.position.set(g[0], g[1], g[2]);
        W.gavel.rotation.set(g[3], g[4], Math.min(g[5], 0.03));
      }
    }
    const c0 = centreAt(C, 0);
    const shots = [
      { t0, whipIn: 1, smearAt: (t) => (t < t0 ? 70 * Math.sin(Math.PI * Math.min(1, Math.max(0, t / t0))) : 0), ...keyed('P1-A travel from the loft to the temple gate, then low on the gate', [
        { t: 0, pos: V(D.x + 1.3, 1.05, Z + 3.4), target: V(D.x + 1.9, 1.3, Z), fov: FOV },
        { t: Math.max(0.5, t0 - 0.05), pos: V(GX - 0.1, 0.72, Z + 4.4), target: V(GX - 0.05, 1.75, Z), fov: FOV, ease: ease.power2InOut },
        { t: t0, pos: V(GX - 0.1, 0.72, Z + 4.4), target: V(GX - 0.05, 1.75, Z), fov: FOV },
        { t: tHere, pos: V(GX - 0.05, 0.74, Z + 4.0), target: V(GX - 0.05, 1.8, Z), fov: FOV, ease: ease.sineInOut },
      ], { dist: 4 }) },
      { t0: tHere - 0.1, whipOut: 1, ...framed('P1-B Conductor and the gavel', c0, C.radius, V(0.55, 0.1, 1).normalize(), { fill: 0.31, ndcX: -0.22, ndcY: 0.14, push: 0.3, drift: 0.1 }) },
    ];
    leadInLook(C, r, V(GX, 2.0, Z - 1), { back: 0.3 });
    return { start: -0.6, specs, props, channels, shots, update, noSettle: true, hits: [{ t: tGavel - 1 / 30, amp: 0.01 }] };
  },
};

// ---------------------------------------------------------------- both (E1-E3)

const LINE = { Claude: -0.95, Cursor: 0.0, Antigravity: 0.95, Codex: 1.9, OpenCode: 2.85 };
const LINE_Z = -2.3;
const both = {
  build(scene, assets) {
    const W = streetWorld(scene, assets);
    for (const n of CAST) W.robots[n] = addRobot(scene, assets, n, { x: LINE[n], y: 0, z: LINE_Z + (n === 'Antigravity' ? -0.15 : 0), yaw: -Math.PI / 2 });
    W.glasses = addSunglasses(W.robots.Codex);
    W.glasses.set(-0.3);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const e1 = ctx.row('E1'), e2 = ctx.row('E2'), e3 = ctx.row('E3');
    const first = ctx.rows[0] || nullRow('E1', ctx.duration);
    hover(specs.Antigravity, -99, 0.22);
    specs.Antigravity.liftBob = (t) => 0.02 * Math.sin(t * 2.2);
    const loftPt = V(D.x, 1.2, Z), templePt = V(GX, 1.5, Z);
    // before the question: a little debate, half looking at each home
    const tQ = actionTime(ctx, 'scratch', e1 ? e1.localStart : first.localStart);
    for (const n of CAST) {
      const sp = specs[n];
      idle(sp, -1, ctx.duration);
      faceToward(sp, -1, n === 'Claude' || n === 'Cursor' ? loftPt : n === 'Antigravity' ? V(LINE.Antigravity, 3, LINE_Z - 3) : templePt);
      // the record scratch: everyone snaps to look at each other
      const other = n === 'Claude' ? 'Codex' : n === 'Codex' ? 'Claude' : n === 'Cursor' ? 'OpenCode' : n === 'OpenCode' ? 'Cursor' : 'Claude';
      faceToward(sp, tQ + 0.06 + 0.03 * hash(n, 'q'), centreAt(specs[other], 0));
    }
    const camWide = V(1.0, 0.98, 3.7);
    const camE2 = V(0.95, 0.78, 1.9);
    if (e2) {
      // the only unison move: all five turn to the lens together and say it
      // the silence after the card: all five turn slowly, together, landing on "Both"
      const t = e1 ? Math.min(actionTime(ctx, 'turn', e1.end), e1.end) : actionTime(ctx, 'turn', e2.localStart - 0.5);
      for (const n of CAST) {
        const sp = specs[n];
        sp.yawHz = 1.15;
        sp.yawZeta = 1.0;
        faceToward(sp, t, camE2);
        speak(sp, e2, { gain: 0.9, bounce: 0 });
        sp.eyes.push({ t0: e2.localStart, t1: e2.end + 0.2, sx: 1.15, sy: 1.15 });
        // the 0.8 s hold: a small settle bob in turn, not in unison
        hop(sp, e2.end + 0.12 + 0.08 * CAST.indexOf(n), 0.025, { anticip: 0.08, depth: 0.08 });
      }
    }
    let tMIT = Infinity;
    if (e3) {
      const C = specs.Codex;
      speak(C, e3, { bounce: 0.2 });
      tMIT = actionTime(ctx, 'sunglasses', wordTime(e3, 'MIT', 0.8));
      const step = { x: LINE.Codex - 0.15, z: LINE_Z + 0.55 };
      walkTo(C, e3.localStart - 0.05, step, { stride: 0.3, height: 0.05 });
      faceToward(C, e3.localStart + 0.45, V(1.0, 0.9, 1.6));
      C.leans.push({ t0: tMIT + 0.1, t1: e3.end + 1, roll: 0.16, pitch: 0.04, in: 0.3 });
      for (const n of CAST) if (n !== 'Codex') faceToward(specs[n], e3.localStart + 0.2 + 0.2 * hash(n, 'e3'), centreAt(C, e3.localStart + 0.4));
    }
    // the glasses drop from above the frame and land on the face at the sunglasses beat
    const channels = { glasses: { keys: [{ t: -99, x: -0.3, hz: 3, zeta: 0.6 }, ...(Number.isFinite(tMIT) ? [{ t: tMIT - 0.3, x: 1, hz: 3.4, zeta: 0.42 }] : [])] } };
    function update(t, sim, ch) {
      W.S.update(t);
      const u = ch.glasses(t);
      W.glasses.set(u, (1 - clamp(u)) * 0.5);
    }
    const shots = [];
    const startT = first.localStart;
    shots.push({ t0: startT, whipIn: 1, ...keyed('E1-A both homes wide', [
      { t: startT, pos: camWide, target: V(1.3, 1.6, -6.5), fov: FOV },
      { t: (e2 ? e2.localStart : ctx.duration), pos: camWide.clone().add(V(0, 0, -0.35)), target: V(1.3, 1.58, -6.5), fov: FOV, ease: ease.sineInOut },
    ], { dist: 6 }) });
    if (e2) {
      const tE2 = e1 ? e1.end : e2.localStart - 0.15;
      shots.push({ t0: tE2, ...keyed('E2-A all five turn (closer wide)', [
        { t: tE2, pos: camE2, target: V(1.0, 1.55, -6.5), fov: FOV },
        { t: e2.end + 0.6, pos: camE2.clone().add(V(0.04, 0.02, -0.12)), target: V(1.0, 1.55, -6.5), fov: FOV, ease: ease.sineInOut },
      ], { dist: 4 }) });
    }
    if (e3) {
      const C = specs.Codex;
      const cC = centreAt(C, e3.localStart + 0.6);
      shots.push({ t0: e3.localStart - 0.05, ...framed('E3-A Codex single, glasses on', cC, C.radius, V(-0.35, 0.08, 1).normalize(), { fill: 0.31, ndcX: 0.16, ndcY: 0.1, push: 0.25, drift: 0.1 }) });
    }
    return { start: -1, specs, channels, shots, update };
  },
};

export const KINDS = {
  'door-cold': doorCold,
  't3-door': t3Door,
  'ptah-door': ptahDoor,
  both,
};
