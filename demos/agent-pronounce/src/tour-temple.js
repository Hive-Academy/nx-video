// Ptah temple kinds: ptah-lanes (P2, P3), ptah-review (P4, P5), ptah-gate (P6, P7),
// ptah-fridge (P8) and ptah-tribunal (P9, P10). Stations stand in Episode 1's temple
// (set-tour.js); the Tribunal is Episode 1's table set. Beats come from the
// composition's SFX-synced actions (lanes, fileLands, stamp, reach, gavel, handoff,
// buzzer, reroute, fridgeOpen, disagree) with word-time fallbacks.
import * as THREE from 'three';
import { STATIONS, templeWorld, lanesStation, reviewStation, gateStation, stoneFridge, jobTablet, documentSheet, rubberStamp, gavelProp, folder } from './set-tour.js';
import { buildTableSet, seatOf, SET } from './set-table.js';
import { makeTableProps, gavelStrike } from './acting.js';
import { leadInLook, anticipate, actionTime, addRobot, tourSpec, wordTime, walkTo, glideTo, face, faceToward, speak, hover, idle, hop, centreAt, posAt, listen, CAST } from './cribs.js';
import { framed, keyed, dirFromYaw, FOV } from './cribs-camera.js';
import { placeRigid } from './tour.js';
import { lightCone, buildNightLights } from './lighting.js';
import { buildTemple } from './temple.js';
import { std, mesh } from './props-loft.js';
import { AGENTS } from './assets.js';
import { BOARD, scoreboard } from './set-scoreboard.js';
import { NIGHT, nightTable, diffScroll, lens, notesCard, dryRunSign } from './set-nightshift.js';
import { clamp, hash, ease } from './util.js';
import { PANEL } from './assets.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FLOOR = 0.04; // the stations stand on the stone dais
const nullRow = (id, duration) => ({ id, localStart: 0, duration, end: duration, words: [], onsets: [], env: [] });
const specsOf = (W, ctx) => Object.fromEntries(Object.entries(W.robots).map(([n, r]) => [n, tourSpec(n, r.seat, { scale: r.scale, seedTag: ctx.seedTag })]));
const CONDUCTOR_SCALE = 0.46;

// ---------------------------------------------------------------- ptah-lanes (P2, P3)

const L = STATIONS.lanes;
const LANE_START = (x) => ({ x: x * 0.625, z: -1.45 });
const lanes = {
  build(scene, assets) {
    const W = { robots: {}, ...templeWorld(scene, assets) };
    W.st = lanesStation(scene);
    W.robots.Conductor = addRobot(scene, assets, 'Conductor', { x: 0, y: L.podiumTop, z: L.podiumZ, yaw: -Math.PI / 2 }, { scale: CONDUCTOR_SCALE });
    for (const [n, x] of Object.entries(L.xs)) {
      const p = LANE_START(x);
      W.robots[n] = addRobot(scene, assets, n, { x: p.x, y: FLOOR, z: p.z, yaw: -Math.PI / 2 });
    }
    W.tablets = Object.keys(L.xs).map((n) => jobTablet(scene, { label: 'JOB' }));
    W.sheet = documentSheet(scene, { title: 'DELIVERABLE', file: 'report.md' });
    W.stamp = rubberStamp(scene);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const p2 = ctx.row('P2'), p3 = ctx.row('P3');
    const first = ctx.rows[0] || nullRow('P2', ctx.duration);
    const tLanes = actionTime(ctx, 'lanes', first.localStart + 0.25);
    const tLands = actionTime(ctx, 'fileLands', p3 ? wordTime(p3, 'file', 0.3) : 99);
    const tStamp = actionTime(ctx, 'stamp', p3 ? p3.end - 0.2 : 99);
    const K = specs.Conductor;
    if (p2) speak(K, p2, { bounce: 0 });
    K.leans.push({ t0: tLanes - 0.1, t1: tLanes + 0.5, nod: -0.2, in: 0.1, out: 0.3 });
    hover(specs.Antigravity, -99, 0.16);
    specs.Antigravity.liftBob = (t) => 0.018 * Math.sin(t * 2.4);
    // the peel-off: each robot hops (Antigravity glides) down its own lane to its desk
    const names = Object.keys(L.xs);
    names.forEach((n, i) => {
      const sp = specs[n];
      faceToward(sp, -1, V(0, 1, L.podiumZ));
      const go = tLanes + 0.04 * Math.abs(i - 2) + 0.03 * hash(n, 'go');
      const dest = { x: L.xs[n], z: L.spotZ };
      if (n === 'Antigravity') glideTo(sp, go, dest, 1.4);
      else walkTo(sp, go, dest, { stride: 0.36, height: 0.07, gap: 0.03, anticip: 0.08 });
      face(sp, go + 1.9, -Math.PI / 2);
      idle(sp, go + 2.1, ctx.duration);
    });
    // job tablets fly from above the Conductor to each desk, landing flat
    const props = [];
    names.forEach((n, i) => {
      const x = L.xs[n];
      const fan = (i - 2) * 0.32;
      props.push({
        id: `job-${n}`, spring: true,
        keys: [
          { t: -99, pos: [fan, 1.62 + 0.05 * (2 - Math.abs(i - 2)), L.podiumZ + 0.15], rot: [0, 0, (i - 2) * 0.12], hz: 3, zeta: 0.6 },
          { t: tLanes + 0.05 * i, pos: [x - 0.24, FLOOR + L.deskTop + 0.012, L.deskZ - 0.02], rot: [-Math.PI / 2, 0.15 * (i - 2), 0], hz: 2.0, zeta: 0.6, rhz: 2.6 },
        ],
        bob: (t) => (t < tLanes ? [0, 0.02 * Math.sin(t * 2.6 + i), 0, 0, 0.05 * Math.sin(t * 1.7 + i), 0] : [0, 0, 0, 0, 0, 0]),
      });
    });
    // P3: the deliverable drops into Claude's tray, then the stamp slams on it
    const tr = W.st.trays.Claude;
    const trayY = tr.userData.floorY;
    const tx = tr.position.x, tz = tr.position.z;
    const H = 0.45;
    const release = tLands - 1 / 30 - Math.sqrt((2 * H) / 9.8);
    props.push({
      id: 'sheet', pos: [tx, trayY + H, tz], rot: [0, 0.08, 0], half: { h: 0.003 }, restitution: 0.18, friction: 0.6,
      held: [{ t0: -99, t1: release }],
      support: (x, z) => (Math.abs(x - tx) < 0.2 && Math.abs(z - tz) < 0.15 ? trayY : FLOOR + L.deskTop),
    });
    const sheetTop = trayY + 0.006;
    props.push({
      id: 'stamp', spring: true,
      keys: [
        // parked on the desk to the right of the tray, low (never in front of Claude's face)
        { t: -99, pos: [tx + 0.36, FLOOR + L.deskTop + 0.001, tz - 0.14], rot: [0, -0.4, 0], hz: 6, zeta: 0.8 },
        // a quick rise to just above the page (from the side, at desk height)
        { t: tStamp - 0.3, pos: [tx + 0.02, sheetTop + 0.13, tz + 0.04], rot: [0, -0.16, 0], hz: 9, zeta: 0.75 },
        { t: tStamp - 0.045, pos: [tx + 0.02, sheetTop - 0.004, tz + 0.04], rot: [0, -0.16, 0], hz: 24, zeta: 0.5 },
        // then clear away up and to the right, out of shot within ~6 frames
        { t: tStamp + 0.03, pos: [tx + 0.85, sheetTop + 0.75, tz + 0.15], rot: [0, -0.16, 0.5], hz: 5.5, zeta: 0.85 },
      ],
    });
    const C = specs.Claude;
    if (p3) {
      speak(C, p3, { bounce: 0.15 });
      // looks at the empty tray on "no file", up at us for "it didn't happen", flinches at the stamp
      faceToward(C, wordTime(p3, 'no', 0.15) - 0.1, V(tx, 0, tz + 0.6));
      C.leans.push({ t0: wordTime(p3, 'no', 0.15), t1: tLands + 0.1, nod: -0.32, in: 0.2, out: 0.25 });
      face(C, tLands + 0.35, -Math.PI / 2);
      C.eyes.push({ t0: tLands - 0.02, t1: tLands + 0.6, sx: 1.25, sy: 1.25 });
      C.bumps.push({ t: tStamp + 0.01, vy: 0.25, pitch: 0.4 });
      C.eyes.push({ t0: tStamp, t1: ctx.duration + 1, sx: 1.12, sy: 0.6 });
    }
    function update(t, sim) {
      names.forEach((n, i) => placeRigid(W.tablets[i], sim.propPose(`job-${n}`, t)));
      placeRigid(W.sheet.mesh, sim.propPose('sheet', t));
      W.sheet.mesh.visible = t > release - 0.4;
      W.sheet.setStamped(t >= tStamp - 1 / 30);
      const s = sim.propPose('stamp', t);
      placeRigid(W.stamp, s);
      W.stamp.position.y = Math.max(W.stamp.position.y, sheetTop + 0.001);
    }
    const shots = [];
    const s0 = first.localStart;
    shots.push({ t0: s0, whipIn: 1, ...keyed('P2-A the lanes wide', [
      { t: s0, pos: V(0.35, 1.9, 4.15), target: V(0, 0.6, -1.05), fov: FOV },
      { t: p3 ? p3.localStart : ctx.duration, pos: V(0.3, 1.82, 3.9), target: V(0, 0.6, -1.0), fov: FOV, ease: ease.sineInOut },
    ], { dist: 5 }) });
    if (p3) {
      const cC = V(0, FLOOR + 0.52, L.spotZ);
      shots.push({ t0: p3.localStart - 0.05, ...framed('P3-A Claude at its desk', cC, C.radius, V(0.12, 0.3, 1).normalize(), { fill: 0.36, ndcX: -0.08, ndcY: 0.2, push: 0.3, drift: 0.08 }) });
      // B: high over the tray: the file lands, the stamp slams; no whip out, the stamped page holds to the cut
      // the page sits in the middle of frame, Claude's face in the upper third above it
      shots.push({ t0: Math.min(tLands - 0.12, tStamp - 0.6), ...keyed('P3-B the tray and the stamp', [
        { t: Math.min(tLands - 0.12, tStamp - 0.6), pos: V(tx, 1.4, tz + 0.46), target: V(tx, trayY, tz - 0.02), fov: 58 },
        { t: ctx.duration + 0.2, pos: V(tx, 1.33, tz + 0.41), target: V(tx, trayY, tz - 0.02), fov: 58, ease: ease.sineInOut },
      ], { dist: 0.9 }) });
    }
    if (p2) leadInLook(K, p2, V(-1.2, 0.5, -1.2));
    if (p3) {
      anticipate(C, p3);
      // tail: a proud little nod at the stamped page
      C.leans.push({ t0: p3.end + 0.05, t1: ctx.duration + 1, nod: -0.22, in: 0.2 });
    }
    return { start: -0.8, specs, props, shots, update, hits: [{ t: tLands - 1 / 30, amp: 0.004 }, { t: tStamp - 1 / 30, amp: 0.01 }] };
  },
};

// ---------------------------------------------------------------- ptah-review (P4, P5)

const R = STATIONS.review;
const review = {
  build(scene, assets) {
    const W = { robots: {}, ...templeWorld(scene, assets) };
    W.st = reviewStation(scene, assets);
    W.robots.Conductor = addRobot(scene, assets, 'Conductor', { x: 0, y: R.riserTop, z: R.riserZ, yaw: -Math.PI / 2 }, { scale: CONDUCTOR_SCALE });
    W.robots.Codex = addRobot(scene, assets, 'Codex', { x: -0.66, y: FLOOR, z: 0.66, yaw: 0.85 });
    W.robots.Claude = addRobot(scene, assets, 'Claude', { x: 1.75, y: FLOOR, z: 1.05, yaw: Math.PI - 0.3 });
    W.folder = folder(scene, { icon: assets.icons?.codex, color: '#10A37F', label: 'my code' });
    W.gavel = gavelProp(scene);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const p4 = ctx.row('P4'), p5 = ctx.row('P5');
    const first = ctx.rows[0] || nullRow('P4', ctx.duration);
    const Cx = specs.Codex, K = specs.Conductor, Cl = specs.Claude;
    const tReach = actionTime(ctx, 'reach', p4 ? wordTime(p4, 'review', 0.3) : 0.6);
    const tGavel = actionTime(ctx, 'gavel', p5 ? wordTime(p5, 'Next', 0.6) - 0.1 : 99);
    const tHand = actionTime(ctx, 'handoff', tGavel + 0.06);
    if (p4) speak(Cx, p4, { bounce: 0 });
    if (p5) speak(K, p5, { bounce: 0 });
    const deskTop = FLOOR + R.deskTop;
    const rest = [-0.12, deskTop + 0.006, 0.05];
    // Codex leans in and the folder floats to it; the gavel sends it back, then to Claude
    faceToward(Cx, -1, V(0.45, 0, 0.4));
    Cx.leans.push({ t0: tReach - 0.1, t1: tGavel, pitch: -0.18, nod: -0.12, in: 0.3, out: 0.15 });
    Cx.lunges.push({ t: tReach, dist: 0.35, anticip: 0.12, hold: Math.max(0.3, tGavel - tReach - 0.2) });
    faceToward(K, tReach + 0.3, centreAt(Cx, tReach));
    if (p5) {
      faceToward(Cx, p5.localStart + 0.1, centreAt(K, 0));
      faceToward(K, p5.localStart, V(0.4, 1.0, 2.8));
      Cx.bumps.push({ t: tGavel + 0.02, vy: 0.35, pitch: 0.5 });
      faceToward(Cx, tGavel + 0.15, V(0.2, 1.0, 3.0));
      Cx.leans.push({ t0: tGavel + 0.1, t1: ctx.duration + 1, squash: -0.09, nod: 0.2, in: 0.25 });
      Cx.eyes.push({ t0: tGavel + 0.05, t1: ctx.duration + 1, sx: 1.0, sy: 0.5 });
      walkTo(Cx, tGavel + 0.35, { x: -1.0, z: 0.85 }, { stride: 0.25, height: 0.04, turn: false, lean: 0 });
      // Claude (a different family) hops in from the right and takes it
      walkTo(Cl, p5.localStart + 0.05, { x: 0.68, z: 0.66 }, { stride: 0.34, height: 0.07 });
      faceToward(Cl, tHand - 0.2, V(0.1, 0.8, 0.2));
      faceToward(Cl, tHand + 0.3, V(0.2, 1.0, 3.0));
      hop(Cl, tHand + 0.45, 0.07);
      Cl.eyes.push({ t0: tHand + 0.3, t1: ctx.duration + 1, sx: 1.18, sy: 1.18 });
    }
    idle(K, -1, ctx.duration);
    const props = [{
      id: 'folder', spring: true,
      keys: [
        { t: -99, pos: rest, rot: [0, 0.12, 0], hz: 4, zeta: 0.6 },
        { t: tReach + 0.1, pos: [-0.36, deskTop + 0.22, 0.36], rot: [-0.9, 0.5, 0.1], hz: 1.8, zeta: 0.5 },
        { t: tGavel - 0.02, pos: rest, rot: [0, 0.12, 0], hz: 9, zeta: 0.4 },
        { t: tHand + 0.12, pos: [0.3, deskTop + 0.5, 0.82], rot: [1.3, -0.2, 0], hz: 2.6, zeta: 0.5 },
      ],
      bob: (t) => (t > tReach + 0.5 && t < tGavel ? [0.01 * Math.sin(t * 9), 0.012 * Math.sin(t * 3), 0, 0.04 * Math.sin(t * 5), 0, 0] : [0, 0, 0, 0, 0, 0]),
    }];
    const g0 = [0.42 + 0.3, deskTop + 0.035 + 0.042, R.deskZ - 0.12];
    props.push({
      id: 'gavel', spring: true,
      keys: [
        { t: -99, pos: g0, rot: [0, 0, 0], hz: 6, zeta: 0.6 },
        { t: tGavel - 0.5, pos: g0, rot: [0, 0, -1.1], hz: 4, zeta: 0.6 },
        { t: tGavel - 0.048, pos: g0, rot: [0, 0, 0.03], hz: 13, zeta: 0.32 },
        { t: tGavel + 0.2, pos: g0, rot: [0, 0, 0], hz: 5, zeta: 0.6 },
      ],
    });
    K.bumps.push({ t: tGavel - 1 / 30, pitch: -0.8 });
    function update(t, sim) {
      placeRigid(W.folder, sim.propPose('folder', t));
      const g = sim.propPose('gavel', t);
      if (g) { W.gavel.position.set(g[0], g[1], g[2]); W.gavel.rotation.set(0, 0, Math.min(g[5], 0.03)); }
    }
    const cX = centreAt(Cx, 0);
    const shots = [];
    // reverse across the desk: Codex faces this lens as it reaches for the folder
    shots.push({ t0: first.localStart, whipIn: 1, ...framed('P4-A Codex reaches for its own file', cX, Cx.radius, V(1.0, 0.24, 0.42).normalize(), { fill: 0.31, ndcX: -0.2, ndcY: 0.16, push: 0.3, drift: 0.1 }) });
    if (p5) {
      shots.push({ t0: p5.localStart - 0.05, whipOut: 1, ...keyed('P5-A the review desk, gavel and handoff', [
        { t: p5.localStart - 0.05, pos: V(0.4, 1.08, 2.75), target: V(0.1, 0.74, -0.3), fov: FOV },
        { t: ctx.duration + 0.3, pos: V(0.45, 1.06, 2.5), target: V(0.12, 0.74, -0.3), fov: FOV, ease: ease.sineInOut },
      ], { dist: 3 }) });
    }
    if (p4) {
      leadInLook(Cx, p4, V(-0.12, 0.5, 0.05));
      faceToward(Cl, p4.localStart + 0.3, centreAt(Cx, 0));
    }
    if (p5) {
      anticipate(K, p5);
      Cl.eyes.push({ t0: p5.localStart, t1: tGavel, sx: 1.1, sy: 0.7 });
    }
    return { start: -0.6, specs, props, shots, update, hits: [{ t: tGavel - 1 / 30, amp: 0.01 }] };
  },
};

// ---------------------------------------------------------------- ptah-gate (P6, P7)

const G = STATIONS.gates;
const gate = {
  build(scene, assets) {
    const W = { robots: {}, ...templeWorld(scene, assets) };
    W.st = gateStation(scene);
    W.robots.OpenCode = addRobot(scene, assets, 'OpenCode', { x: G.xs[0], y: FLOOR, z: G.z + 0.85, yaw: -Math.PI / 2 + 0.15 });
    W.robots.Cursor = addRobot(scene, assets, 'Cursor', { x: G.xs[1] + 0.05, y: FLOOR, z: G.z + 0.55, yaw: -Math.PI / 2 - 0.2 });
    W.job = jobTablet(scene, { label: 'JOB' });
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const p6 = ctx.row('P6'), p7 = ctx.row('P7');
    const first = ctx.rows[0] || nullRow('P6', ctx.duration);
    const O = specs.OpenCode, Cu = specs.Cursor;
    const tBuzz = actionTime(ctx, 'buzzer', p6 ? wordTime(p6, 'mid-job', 0.55) : 1);
    const tRe = actionTime(ctx, 'reroute', p7 ? wordTime(p7, 'sent', 0.4) : 99);
    if (p6) speak(O, p6, { bounce: 0 });
    // OpenCode, mid-job, hits the limit: a jolt on the buzzer, then deflates
    O.bumps.push({ t: tBuzz + 0.02, vy: 0.3, pitch: 0.5 });
    O.shakes.push({ t0: tBuzz + 0.15, t1: tBuzz + 0.85, amp: 0.2, hz: 4 });
    O.leans.push({ t0: tBuzz + 0.3, t1: ctx.duration + 1, squash: -0.1, nod: 0.24, in: 0.35 });
    O.eyes.push({ t0: tBuzz + 0.2, t1: ctx.duration + 1, sx: 1.0, sy: 0.5 });
    faceToward(O, -1, V(-0.6, 1, 3.4));
    faceToward(Cu, -1, V(0.5, 1, 3.0));
    idle(Cu, -1, tRe);
    if (p7) {
      faceToward(O, tRe - 0.1, V(G.xs[1], 0.5, G.z + 0.85));
      faceToward(Cu, tRe + 0.2, V(G.xs[0], 0.5, G.z + 0.85));
      hop(Cu, tRe + 0.95, 0.09, { depth: 0.2 });
      faceToward(Cu, tRe + 1.25, V(0.4, 1, 3.0));
      Cu.eyes.push({ t0: tRe + 0.9, t1: ctx.duration + 1, sx: 1.2, sy: 1.2 });
    }
    // the job: hovers at OpenCode's side, drops into the floor channel, slides past to Cursor
    const chZ = G.z + 0.85 + 0.3;
    const props = [{
      id: 'job', spring: true,
      keys: [
        { t: -99, pos: [G.xs[0] + 0.42, FLOOR + 0.72, chZ - 0.1], rot: [0, -0.4, 0], hz: 3, zeta: 0.6 },
        { t: tBuzz + 0.05, pos: [G.xs[0] + 0.42, FLOOR + 0.58, chZ - 0.1], rot: [0.2, -0.4, 0.3], hz: 7, zeta: 0.25 },
        { t: tRe - 0.35, pos: [G.xs[0] + 0.45, FLOOR + 0.1, chZ], rot: [-Math.PI / 2, 0, 0], hz: 4, zeta: 0.6 },
        { t: tRe, pos: [G.xs[1] - 0.25, FLOOR + 0.1, chZ], rot: [-Math.PI / 2, 0.2, 0], hz: 1.6, zeta: 0.75 },
        { t: tRe + 0.95, pos: [G.xs[1] - 0.28, FLOOR + 0.78, chZ - 0.05], rot: [0, 0.35, 0], hz: 2.6, zeta: 0.5 },
      ],
      bob: (t) => (t < tRe - 0.4 || t > tRe + 1.3 ? [0, 0.015 * Math.sin(t * 2.6), 0, 0, 0.05 * Math.sin(t * 1.5), 0] : [0, 0, 0, 0, 0, 0]),
    }];
    const lim = W.st.gates[0];
    function update(t, sim) {
      placeRigid(W.job, sim.propPose('job', t));
      // the AT LIMIT box flashes with the buzzer
      const u = t - tBuzz;
      const flash = u >= 0 && u < 1.2 ? 0.5 + 0.5 * Math.cos(u * Math.PI * 2 * 3.3) : 1;
      lim.signMat.emissiveIntensity = 0.35 + 0.9 * flash;
      lim.light.intensity = 0.6 + 2.0 * flash * (u >= 0 && u < 1.2 ? 1 : 0.5);
      lim.pivot.rotation.z = u >= 0 && u < 0.6 ? 0.05 * Math.sin(u * 60) * (1 - u / 0.6) : 0;
    }
    const shots = [];
    shots.push({ t0: first.localStart, whipIn: 1, ...keyed('P6-A OpenCode under AT LIMIT', [
      { t: first.localStart, pos: V(G.xs[0] + 0.32, 0.5, 3.05), target: V(G.xs[0] - 0.05, 1.2, -0.6), fov: FOV },
      { t: p7 ? p7.localStart : ctx.duration, pos: V(G.xs[0] + 0.3, 0.52, 2.8), target: V(G.xs[0] - 0.05, 1.22, -0.6), fov: FOV, ease: ease.sineInOut },
    ], { dist: 3 }) });
    if (p7) {
      shots.push({ t0: p7.localStart - 0.05, whipOut: 1, ...keyed('P7-A the job slides past to Cursor', [
        { t: p7.localStart - 0.05, pos: V(-0.55, 0.66, 3.4), target: V(-0.3, 1.36, -0.3), fov: FOV },
        { t: tRe - 0.1, pos: V(-0.45, 0.66, 3.35), target: V(-0.22, 1.36, -0.3), fov: FOV, ease: ease.sineInOut },
        { t: tRe + 1.0, pos: V(0.5, 0.66, 3.2), target: V(0.6, 1.34, -0.3), fov: FOV, ease: ease.power2InOut },
        { t: ctx.duration + 0.3, pos: V(0.58, 0.66, 3.1), target: V(0.64, 1.34, -0.3), fov: FOV, ease: ease.sineInOut },
      ], { dist: 3 }) });
    }
    if (p6) {
      leadInLook(O, p6, V(G.xs[0], 2.6, G.z));
      // Cursor, at the open gate, watches OpenCode's bad news with a wince
      faceToward(Cu, p6.localStart + 0.4, V(G.xs[0], 0.6, G.z + 0.85));
      Cu.eyes.push({ t0: tBuzz + 0.1, t1: tBuzz + 0.9, sx: 1.05, sy: 0.6 });
    }
    if (p7) {
      // tail: OpenCode watches its job go, a small sigh
      O.leans.push({ t0: p7.end + 0.05, t1: ctx.duration + 1, squash: -0.06, nod: 0.18, in: 0.3 });
    }
    return { start: -0.6, specs, props, shots, update, hits: [{ t: tBuzz, amp: 0.005 }] };
  },
};

// ---------------------------------------------------------------- ptah-fridge (P8)

const SF = STATIONS.fridge;
const ptahFridge = {
  build(scene, assets) {
    const W = { robots: {}, ...templeWorld(scene, assets) };
    W.fr = stoneFridge(scene, { pos: [SF.x, FLOOR, SF.z], labels: ['SESSION 3', 'SESSION 4', 'SESSION 1', 'SESSION 2', 'BM25', 'VECTORS'] });
    W.robots.Claude = addRobot(scene, assets, 'Claude', { x: SF.x + 0.82, y: FLOOR, z: SF.z + 1.15, yaw: -Math.PI / 2 - 0.5 });
    const f = new THREE.Vector3(SF.x, FLOOR + SF.h * 0.55, SF.z + SF.d / 2);
    W.cone = lightCone(f.clone(), f.clone().add(V(0.1, -0.9, 2.6)), { radius: 1.0, opacity: 0, color: '#FFC27A' });
    scene.add(W.cone);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const C = specs.Claude;
    const r = ctx.row('P8') || ctx.rows[0] || nullRow('P8', ctx.duration);
    if (ctx.rows.length) speak(C, r, { bounce: 0.2 });
    const tOpen = actionTime(ctx, 'fridgeOpen', wordTime(r, 'fridge', 0.15) + 0.2);
    const tBM = wordTime(r, 'BM25', 0.2);
    const tLeft = wordTime(r, 'Leftovers', 0.6);
    faceToward(C, -1, V(-0.4, 1, 2.8));
    faceToward(C, tOpen - 0.3, V(SF.x, 1, SF.z));
    const front = { x: SF.x + 0.04, z: SF.z + SF.d / 2 + 0.95 };
    face(C, tOpen + 0.05, Math.PI / 2);
    const arrive = walkTo(C, tOpen + 0.12, front, { stride: 0.36, height: 0.06, turn: false, lean: 0 });
    C.eyes.push({ t0: tOpen + 0.1, t1: ctx.duration + 1, sx: 1.25, sy: 1.25 });
    hop(C, tLeft + 0.05, 0.07, { depth: 0.18 });
    leadInLook(C, r, V(SF.x, 1.0, SF.z));
    C.leans.push({ t0: r.end + 0.05, t1: ctx.duration + 1, roll: 0.14, nod: 0.1, in: 0.2 });
    const channels = { door: { keys: [{ t: -99, x: 0, hz: 4, zeta: 0.6 }, { t: tOpen, x: -1.9, hz: 1.6, zeta: 0.5 }], min: -2.0, max: 0, restitution: 0.3 } };
    const F = W.fr;
    const tB = Math.max(tBM - 0.12, arrive - 0.2);
    function update(t, sim, ch) {
      const a = ch.door(t);
      F.hinge.rotation.y = a;
      const k = clamp(-a / 0.7);
      F.lamp.intensity = 3.2 * k;
      F.spill.intensity = 16 * k;
      F.liner.emissiveIntensity = 0.5 * k;
      F.scrollMat.emissiveIntensity = (0.3 + 0.06 * Math.sin(t * 5)) * k;
      F.endMat.emissiveIntensity = 0.3 * k;
      // the reverse is shot from just behind the fridge: its back panel is "removed" for that shot
      const inside = t >= tB;
      F.back.visible = !inside;
      F.linerMesh.visible = !inside;
      W.cone.material.uniforms.uOpacity.value = 0.075 * k;
    }
    const shots = [];
    shots.push({ t0: r.localStart, whipIn: 1, ...keyed('P8-A Claude and the stone fridge', [
      { t: r.localStart, pos: V(-0.55, 0.92, 2.55), target: V(1.25, 0.82, -0.55), fov: FOV },
      { t: tBM, pos: V(-0.42, 0.92, 2.35), target: V(1.2, 0.82, -0.55), fov: FOV, ease: ease.sineInOut },
    ], { dist: 3 }) });
    // B: the fridge-light reveal from inside, past the glowing scrolls, onto Claude
    const inCam = V(SF.x, FLOOR + 0.76, SF.z - SF.d / 2 - 0.42);
    const cIn = V(front.x, FLOOR + 0.54, front.z);
    shots.push({ t0: tB, whipOut: 1, ...keyed('P8-B inside the stone fridge', [
      { t: tB, pos: inCam, target: cIn, fov: FOV },
      { t: ctx.duration + 0.3, pos: inCam.clone().add(V(0.02, 0.01, 0.03)), target: cIn.clone().add(V(0, 0.04, 0)), fov: FOV - 4, ease: ease.sineInOut },
    ], { dist: 1.3 }) });
    return { start: -0.6, specs, channels, shots, update };
  },
};

// ---------------------------------------------------------------- ptah-tribunal (P9, P10)

const tribunal = {
  build(scene, assets) {
    const set = buildTableSet(scene, assets);
    const W = { robots: set.robots, set };
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    for (const n of PANEL) specs[n].collide = true;
    const p9 = ctx.row('P9'), p10 = ctx.row('P10');
    const first = ctx.rows[0] || nullRow('P9', ctx.duration);
    const tDis = actionTime(ctx, 'disagree', p9 ? wordTime(p9, 'disagree', 0.5) : 0.5);
    const tGavel = actionTime(ctx, 'gavel', p10 ? p10.end - 0.2 : ctx.duration - 0.4);
    const head = (n) => centreAt(specs[n], 0);
    for (const n of [...PANEL, 'Conductor']) faceToward(specs[n], -1, V(0, 1, 0));
    if (p9) {
      speak(specs.Cursor, p9, { bounce: 0 });
      listen(specs, 'Cursor', p9, { except: ['Conductor'] });
      // on "disagree": everybody turns on a neighbour at once, a little hop and a lean
      const pairs = { Claude: 'Cursor', Cursor: 'Claude', Antigravity: 'Codex', Codex: 'OpenCode', OpenCode: 'Codex' };
      for (const n of PANEL) {
        const t = tDis + 0.04 + 0.12 * hash(n, 'dis');
        faceToward(specs[n], t, head(pairs[n]));
        if (n !== 'Cursor') hop(specs[n], t + 0.05, 0.05 + 0.03 * hash(n, 'dh'));
        if (n === 'OpenCode') specs[n].shakes.push({ t0: t + 0.1, t1: t + 0.7, amp: 0.2, hz: 4 });
      }
    }
    if (p10) {
      speak(specs.Conductor, p10, { bounce: 0 });
      for (const n of PANEL) faceToward(specs[n], p10.localStart + 0.1 + 0.15 * hash(n, 'p10'), head('Conductor'));
    }
    const tableImpulses = [];
    const prop = makeTableProps(W.set, { paperDropped: false, laptopFloating: false, sheetsFlown: false, gavelRaised: false });
    // Episode 1's strike keys the head 0.07 s early and it closes in ~0.025 s
    gavelStrike(prop, specs, tableImpulses, tGavel + 0.022, 1.2);
    // the echo: a second, smaller rattle 0.35 s later
    const echo = tGavel + 0.38;
    tableImpulses.push({ t: echo, v: 0.12 });
    prop.plates.forEach((p, i) => p.events.push({ t: echo + 0.02, v: [0, 0.28 + 0.1 * hash('echo', i), 0], w: [(hash('ew', i) - 0.5) * 1.5, 0, (hash('ez', i) - 0.5) * 1.5] }));
    for (const n of PANEL) specs[n].bumps.push({ t: echo + 0.03, vy: 0.18, roll: (hash(n, 'er') - 0.5) * 0.6 });
    if (p10) anticipate(specs.Conductor, p10);
    const world = W.set;
    function update(t, sim) {
      for (const np of world.nameplates) placeRigid(np.object, sim.propPose(np.id, t));
      placeRigid(world.props.mug.object, sim.propPose('mug', t));
      placeRigid(world.props.laptop.object, sim.propPose('laptop', t));
      placeRigid(world.props.paddle.object, sim.propPose('paddle', t));
      world.props.stack.block.visible = false;
      world.props.stack.sheets.forEach((m) => { m.visible = false; });
      const g = sim.propPose('gavel', t);
      if (g) { g[5] = Math.min(g[5], 0.03); placeRigid(world.props.gavel.object, g); }
      world.table.group.position.y = sim.tableDy(t);
      world.temple.update(t);
    }
    const shots = [];
    shots.push({ t0: first.localStart, whipIn: 1, ...keyed('P9-A the Tribunal table (crane down)', [
      { t: first.localStart, pos: V(0.4, 2.7, 5.0), target: V(0, 1.15, -1.0), fov: FOV },
      { t: p10 ? p10.localStart : ctx.duration, pos: V(0.2, 1.85, 4.2), target: V(0, 0.98, -0.9), fov: FOV, ease: ease.power2InOut },
    ], { dist: 4.5 }) });
    if (p10) {
      shots.push({ t0: p10.localStart - 0.05, ...keyed('P10-A the Conductor under TRIBUNAL', [
        { t: p10.localStart - 0.05, pos: V(1.9, 2.25, -0.7), target: V(0, 2.05, -3.6), fov: FOV },
        { t: ctx.duration + 0.3, pos: V(1.72, 2.2, -0.95), target: V(0, 2.08, -3.6), fov: FOV - 4, ease: ease.sineInOut },
      ], { dist: 2.2 }) });
    }
    return { start: -0.6, specs, props: prop.list(), tableImpulses, shots, update, hits: prop.hits };
  },
};

// ---------------------------------------------------------------- ptah-scoreboard (S1, S2)

const scoreboardKind = {
  build(scene, assets) {
    const W = { robots: {}, ...templeWorld(scene, assets) };
    W.board = scoreboard(scene, assets);
    mesh(scene, new THREE.BoxGeometry(0.9, 0.3, 0.8), std('#3A2F24', 0.6), [2.45, 0.15, -0.95]);
    W.robots.Conductor = addRobot(scene, assets, 'Conductor', { x: 2.45, y: 0.3, z: -0.95, yaw: -Math.PI / 2 - 0.3 }, { scale: CONDUCTOR_SCALE });
    W.robots.Codex = addRobot(scene, assets, 'Codex', { x: -2.5, y: FLOOR, z: -1.0, yaw: -Math.PI / 2 + 0.45 });
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const s1 = ctx.row('S1'), s2 = ctx.row('S2');
    const first = ctx.rows[0] || nullRow('S1', ctx.duration);
    const K = specs.Conductor, Cx = specs.Codex;
    // the tallies fill in step with the line: delivered from "score" to "delivered", failed on the last word
    const tD0 = actionTime(ctx, 'score', s1 ? wordTime(s1, 'score', 0.3) : 0.3) - 0.05;
    const tD1 = Math.max(tD0 + 0.5, actionTime(ctx, 'tallyDelivered', s1 ? wordTime(s1, 'delivered', 0.6) : 1.2) - 1 / 30);
    const tF0 = actionTime(ctx, 'tallyFailed', s1 ? wordTime(s1, 'didnt', 0.85) + 0.02 : 1.5);
    if (s1) {
      speak(K, s1, { bounce: 0 });
      faceToward(K, tD0 - 0.15, V(0.4, 1.6, BOARD.z));
      faceToward(K, tF0 + 0.35, V(0.0, 1.0, 3.6));
    }
    faceToward(Cx, -1, V(0.3, 1.0, 3.6));
    idle(Cx, -1, ctx.duration);
    if (s2) {
      speak(Cx, s2, { bounce: 0 });
      // up at its own column, then away, then a tiny sheepish hop
      const tUp = actionTime(ctx, 'lookUp', s2.localStart - 0.35);
      faceToward(Cx, tUp, V(BOARD.xs[1], 1.7, BOARD.z));
      Cx.leans.push({ t0: tUp, t1: s2.localStart + 0.55, nod: 0.38, in: 0.25, out: 0.3 });
      const tAway = actionTime(ctx, 'sheepish', s2.localStart + 0.85) - 0.4;
      faceToward(Cx, tAway, V(-1.6, 0.9, 2.6));
      Cx.eyes.push({ t0: tAway, t1: ctx.duration + 1, sx: 1.08, sy: 0.62 });
      hop(Cx, tAway + 0.4, 0.035, { anticip: 0.1, depth: 0.12 });
      Cx.leans.push({ t0: tAway + 0.2, t1: ctx.duration + 1, roll: 0.08, squash: -0.04, in: 0.3 });
    }
    const marks = W.board.marks;
    const maxDel = Math.max(...Object.values(BOARD.counts).map((c) => c[0]));
    function update(t) {
      let lit = 0;
      for (const m of marks) {
        const on = m.kind === 'delivered' ? tD0 + ((tD1 - tD0) * (m.k + 1)) / maxDel - 0.1 + 0.01 * m.col : tF0 - 1 / 30 + 0.12 * m.k + 0.015 * m.col;
        const u = clamp((t - on) / 0.1);
        m.mat.emissiveIntensity = u * (1.15 + 0.6 * Math.exp(-(t - on) * 6));
        m.mat.color.setRGB(0.1 + 0.6 * u, 0.08 + 0.45 * u, 0.06 + 0.15 * u);
        lit += u;
      }
      W.board.glow.intensity = 2.2 * (lit / marks.length);
      W.temple.update(t);
    }
    const shots = [{ t0: first.localStart, whipIn: 1, ...keyed('S1-A the scoreboard', [
      { t: first.localStart, pos: V(0.22, 1.1, 2.75), target: V(-0.15, 1.45, -1.45), fov: FOV },
      { t: s2 ? s2.localStart : ctx.duration, pos: V(0.16, 1.1, 2.5), target: V(-0.15, 1.45, -1.45), fov: FOV, ease: ease.sineInOut },
    ], { dist: 5 }) }];
    if (s2) {
      const c = centreAt(Cx, 0);
      shots.push({ t0: s2.localStart - 0.45, whipOut: 1, ...keyed('S2-A Codex and the whole board (low, from the left)', [
        { t: s2.localStart - 0.45, pos: V(-3.55, 0.82, 1.45), target: V(-0.95, 1.3, -1.45), fov: FOV },
        { t: ctx.duration + 0.3, pos: V(-3.4, 0.82, 1.25), target: V(-0.95, 1.32, -1.45), fov: FOV, ease: ease.sineInOut },
      ], { dist: 3 }) });
    }
    if (s1) {
      leadInLook(K, s1, V(0.0, 1.8, BOARD.z));
      faceToward(Cx, s1.localStart + 0.5, V(0.0, 1.8, BOARD.z));
      Cx.eyes.push({ t0: tF0 - 0.05, t1: tF0 + 0.6, sx: 1.05, sy: 0.65 });
    }
    if (s2) {
      anticipate(Cx, s2);
      faceToward(K, s2.localStart - 0.1, centreAt(Cx, 0));
      // tail: Codex shuffles sideways, off its column
      walkTo(Cx, Math.max(s2.end + 0.02, actionTime(ctx, 'sheepish', s2.end) + 0.35), { x: -2.95, z: -0.7 }, { stride: 0.22, height: 0.04, turn: false, lean: 0 });
    }
    return { start: -0.6, specs, shots, update };
  },
};

// ---------------------------------------------------------------- ptah-nightshift (N1, N2)

const NV = NIGHT.verifier;
const nightshiftKind = {
  build(scene, assets) {
    const temple = buildTemple(scene, assets, { night: true });
    const lights = buildNightLights(scene);
    mesh(scene, new THREE.CylinderGeometry(3.6, 3.65, 0.04, 96), std('#221C16', 0.42, 0.1), [0, 0.02, -0.3], { cast: false });
    const W = { robots: {}, temple, lights };
    nightTable(scene);
    W.scroll = diffScroll(scene);
    W.lenses = {};
    for (const [n, x] of Object.entries(NIGHT.lensers)) {
      W.robots[n] = addRobot(scene, assets, n, { x, y: FLOOR, z: NIGHT.rowZ - 0.16, yaw: -Math.PI / 2 });
      const col = n === 'OpenCode' ? '#E8E8E8' : AGENTS[n].color;
      W.lenses[n] = lens(scene, col);
    }
    W.robots.Cursor = addRobot(scene, assets, 'Cursor', { x: NV.x, y: FLOOR, z: NV.z, yaw: Math.PI });
    W.notes = notesCard(scene);
    W.notes.mesh.position.set(1.18, NIGHT.table.top + 0.004, -0.5);
    W.notes.mesh.rotation.y = 0.2;
    W.stamp = rubberStamp(scene);
    W.sign = dryRunSign(scene);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const n1 = ctx.row('N1'), n2 = ctx.row('N2');
    const first = ctx.rows[0] || nullRow('N1', ctx.duration);
    const Cu = specs.Cursor;
    const t0 = first.localStart;
    const tFour = actionTime(ctx, 'lenses', n1 ? wordTime(n1, 'Four', 0.6) : 99);
    const tVer = actionTime(ctx, 'verifier', n1 ? wordTime(n1, 'verifier', 0.88) + 0.1 : 99);
    const tDry = n2 ? actionTime(ctx, 'drySign', wordTime(n2, 'Dry', 0.1)) : 99;
    const tMan = n2 ? actionTime(ctx, 'manners', wordTime(n2, 'manners', 0.75)) : 99;
    const names = Object.keys(NIGHT.lensers);
    // the four lean over the scroll, heads down, with seeded little scans
    names.forEach((n) => {
      const sp = specs[n];
      sp.leans.push({ t0: -99, t1: 99, pitch: -0.2, nod: -0.24, in: 0.2, out: 0.3 });
      if (n1 && n === 'Claude') {
        speak(sp, n1, { bounce: 0 });
        faceToward(sp, n1.localStart - 0.1, V(-0.3, 1.2, 2.4));
        sp.leans.push({ t0: n1.localStart, t1: tFour, pitch: 0.18, nod: 0.3, in: 0.25, out: 0.3 });
        return;
      }
      for (let t = 0.3 + 0.5 * hash(n, 'sc'); t < ctx.duration; t += 1.1 + 0.6 * hash(n, 'sct', t)) {
        sp.looks.push({ t, yaw: (hash(n, 'sy', t) - 0.5) * 0.5 });
      }
    });
    // the verifier: stamps the notes on "verifier", then (N2) turns to us with the DRY RUN sign
    faceToward(Cu, -1, V(1.18, 0.4, -0.5));
    Cu.leans.push({ t0: -99, t1: tVer + 0.35, pitch: -0.16, nod: -0.2, in: 0.2, out: 0.3 });
    Cu.bumps.push({ t: tVer - 1 / 30, vy: 0.2, pitch: 0.35 });
    if (n2) {
      speak(Cu, n2, { bounce: 0 });
      faceToward(Cu, n2.localStart - 0.25, V(1.0, 1.0, 2.2));
      Cu.leans.push({ t0: tMan - 0.05, t1: tMan + 0.55, pitch: -0.22, nod: -0.2, in: 0.15, out: 0.3 });
      Cu.eyes.push({ t0: tDry, t1: ctx.duration + 1, sx: 1.1, sy: 0.7 });
    }
    const props = [];
    names.forEach((n, i) => {
      const x = NIGHT.lensers[n];
      const base = [x, NIGHT.table.top + 0.24, -0.8];
      props.push({
        id: `lens-${n}`, spring: true,
        keys: [
          { t: -99, pos: base, rot: [-1.05, 0, 0], hz: 2.4, zeta: 0.6 },
          { t: tFour + 0.06 * i, pos: [x, base[1] + 0.12, base[2] + 0.05], rot: [-0.65, 0, 0], hz: 3.2, zeta: 0.45 },
          { t: tFour + 0.55 + 0.06 * i, pos: base, rot: [-1.05, 0, 0], hz: 2.4, zeta: 0.55 },
        ],
        bob: (t) => [0.05 * Math.sin(t * 0.9 + i * 1.7), 0.012 * Math.sin(t * 2.3 + i), 0.03 * Math.sin(t * 0.7 + i), 0, 0, 0.08 * Math.sin(t * 1.3 + i)],
      });
    });
    const card = W.notes.mesh.position;
    props.push({
      id: 'stamp', spring: true,
      keys: [
        { t: -99, pos: [NV.x - 0.35, 0.95, NV.z - 0.15], rot: [0, 0.2, 0.3], hz: 3, zeta: 0.6 },
        { t: tVer - 0.55, pos: [card.x, card.y + 0.28, card.z], rot: [0, 0.2, 0], hz: 4.5, zeta: 0.55 },
        { t: tVer - 0.04, pos: [card.x, card.y + 0.004, card.z], rot: [0, 0.2, 0], hz: 22, zeta: 0.5 },
        { t: tVer + 0.08, pos: [card.x + 0.32, card.y + 0.5, card.z - 0.18], rot: [0, 0.2, 0.35], hz: 6, zeta: 0.6 },
      ],
    });
    props.push({
      id: 'sign', spring: true,
      keys: [
        { t: -99, pos: [NV.x + 0.1, -0.5, NV.z - 0.1], rot: [0, -0.4, 0], hz: 3, zeta: 0.7 },
        { t: tDry - 0.1, pos: [NV.x - 0.12, 0.98, NV.z + 0.18], rot: [0, -0.5, 0.08], hz: 3.4, zeta: 0.42 },
      ],
      // after "manners" the sign gives a polite wobble
      bob: (t) => {
        const b = t > tDry + 0.6 ? [0, 0.01 * Math.sin(t * 2.2), 0, 0, 0, 0.03 * Math.sin(t * 1.4)] : [0, 0, 0, 0, 0, 0];
        const u = t - tMan - 0.2;
        if (u > 0) b[5] += 0.16 * Math.sin(u * 2 * Math.PI * 2.6) * Math.exp(-u * 2.2);
        return b;
      },
    });
    const tUnroll = actionTime(ctx, 'unroll', t0 + 0.1) - 0.15;
    function update(t, sim) {
      W.scroll.set(ease.power2Out((t - tUnroll) / 1.0));
      names.forEach((n) => placeRigid(W.lenses[n], sim.propPose(`lens-${n}`, t)));
      placeRigid(W.stamp, sim.propPose('stamp', t));
      W.stamp.position.y = Math.max(W.stamp.position.y, card.y + 0.004);
      W.notes.setStamped(t >= tVer - 1 / 30);
      placeRigid(W.sign, sim.propPose('sign', t));
      W.sign.visible = t > tDry - 0.3;
      W.temple.update(t);
    }
    const shots = [{ t0, whipIn: 1, ...keyed('N1-A the night shift over the scroll', [
      { t: t0, pos: V(-0.2, 1.22, 1.75), target: V(-0.05, 0.66, -0.95), fov: FOV },
      { t: n1 ? tVer - 0.35 : ctx.duration, pos: V(-0.1, 1.18, 1.55), target: V(0.0, 0.66, -0.95), fov: FOV, ease: ease.sineInOut },
    ], { dist: 3 }) }];
    if (n1) {
      shots.push({ t0: tVer - 0.22, ...keyed('N1-B the verifier stamps the notes', [
        { t: tVer - 0.22, pos: V(0.55, 0.98, 0.75), target: V(1.45, 0.52, -0.45), fov: FOV },
        { t: n2 ? n2.localStart : ctx.duration, pos: V(0.62, 0.96, 0.68), target: V(1.47, 0.52, -0.45), fov: FOV, ease: ease.sineInOut },
      ], { dist: 1.7 }) });
    }
    if (n2) {
      const c = centreAt(Cu, 0);
      shots.push({ t0: n2.localStart - 0.05, whipOut: 1, ...framed('N2-A Cursor: DRY RUN', c, Cu.radius, V(-0.1, 0.12, 1).normalize(), { fill: 0.34, ndcX: 0.2, ndcY: 0.12, push: 0.3, drift: 0.1 }) });
    }
    if (n2) {
      anticipate(Cu, n2);
      names.forEach((n, i) => { if (n !== 'Claude') faceToward(specs[n], n2.localStart + 0.15 + 0.1 * i, centreAt(Cu, 0)); });
      if (specs.Claude) faceToward(specs.Claude, n2.localStart + 0.2, centreAt(Cu, 0));
    }
    return { start: -0.6, specs, props, shots, update, hits: [{ t: tVer - 1 / 30, amp: 0.006 }] };
  },
};

export const KINDS = {
  'ptah-scoreboard': scoreboardKind,
  'ptah-nightshift': nightshiftKind,
  'ptah-lanes': lanes,
  'ptah-review': review,
  'ptah-gate': gate,
  'ptah-fridge': ptahFridge,
  'ptah-tribunal': tribunal,
};
