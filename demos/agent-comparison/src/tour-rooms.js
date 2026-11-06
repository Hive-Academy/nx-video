// T3 Code rooms: t3-codex-room (H3), t3-antigravity-room (H4), t3-clock (H6),
// t3-phone (H7), t3-fridge (H8). Each room stands in its own frame (set-loft.js
// roomShell: interior x 0..w, z -d/2..d/2); the camera works from the door side (-X)
// toward the far wall, so screen right is +Z.
import * as THREE from 'three';
import { loftPalette, loftLights, skyCard, shipRoom, antigravityRoom, clockRoom, phoneRoom, fridgeRoom, contactShadow } from './set-loft.js';
import { loftMaterials, std, mesh } from './props-loft.js';
import { leadInLook, anticipate, actionTime, addRobot, tourSpec, wordTime, walkTo, face, faceToward, speak, hover, idle, hop, centreAt, posAt } from './cribs.js';
import { framed, keyed, dirFromYaw, FOV } from './cribs-camera.js';
import { lightCone } from './lighting.js';
import { placeRigid } from './tour.js';
import { clamp, hash, ease, smoothstep } from './util.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const nullRow = (id, duration) => ({ id, localStart: 0, duration, end: duration, words: [], onsets: [], env: [] });

function roomBase(scene, assets, build, { sunPos, sunTarget, sky }) {
  const palette = loftPalette(assets);
  const M = loftMaterials(palette);
  const R = build(scene, M, palette, assets);
  loftLights(scene, { sunPos, sunTarget, extent: 6.5, depth: 32, mapSize: 2048 });
  skyCard(scene, sky);
  return { palette, M, R, robots: {} };
}

const specsOf = (W, ctx) => Object.fromEntries(Object.entries(W.robots).map(([n, r]) => [n, tourSpec(n, r.seat, { seedTag: ctx.seedTag })]));

// ---------------------------------------------------------------- H3: the ship room

const codexRoom = {
  build(scene, assets) {
    const W = roomBase(scene, assets, (s, M, p) => shipRoom(s, M, p), {
      sunPos: V(2.6, 7.2, -8.5), sunTarget: V(2.4, 0, 0.6),
      sky: { center: V(2.2, 0, -32), normalYaw: 0, w: 100, h: 50, seed: 'shipsky' },
    });
    W.robots.Codex = addRobot(scene, assets, 'Codex', W.R.seat);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const C = specs.Codex;
    const r = ctx.row('H3') || ctx.rows[0] || nullRow('H3', ctx.duration);
    const t0 = r.localStart;
    if (ctx.rows.length) speak(C, r, { bounce: 0 });
    // a rising bounce on each item of "Commit, push, PR"
    ['Commit', 'push', 'PR'].forEach((w, i) => hop(C, wordTime(r, w, 0.05 + 0.1 * i) - 0.03, 0.022 + 0.014 * i, { anticip: 0.08, depth: 0.1 }));
    const tPress = actionTime(ctx, 'press', wordTime(r, 'button', 0.45) + 0.06);
    const tLove = wordTime(r, 'love', 0.72);
    // the bonk: anticipation, a forward lunge with the face tipping down onto the cap
    // contact one frame before the button SFX
    const tHit = tPress - 1 / 30;
    C.lunges.push({ t: tHit - 0.05, dist: 0.62, anticip: 0.16, hold: 0.2 });
    C.leans.push({ t0: tHit - 0.2, t1: tHit + 0.12, nod: -0.42, in: 0.1, out: 0.22 });
    C.eyes.push({ t0: tPress - 0.05, t1: tPress + 0.25, sx: 1.1, sy: 0.35 });
    C.eyes.push({ t0: tLove - 0.1, t1: r.end + 1, sx: 1.22, sy: 1.22 });
    hop(C, tLove + 0.02, 0.07, { depth: 0.18 });
    hop(C, tLove + 0.42, 0.05, { depth: 0.14 });
    const channels = {
      cap: { keys: [{ t: -99, x: 0, hz: 8, zeta: 0.4 }, { t: tHit - 0.03, x: -0.04, hz: 26, zeta: 0.55 }, { t: tHit + 0.15, x: 0, hz: 6, zeta: 0.3 }], min: -0.042, max: 0.012, restitution: 0.2 },
    };
    const lampsOn = [0, 1, 2].map((i) => tHit + 0.16 + i * 0.17);
    const B = W.R.button;
    const lamps = W.R.board.lamps;
    leadInLook(C, r, V(2.5, 0.8, 0));
    C.leans.push({ t0: r.end + 0.02, t1: ctx.duration + 1, roll: 0.12, in: 0.18, out: 0.2 }, { t0: r.end + 0.25, t1: ctx.duration + 1, roll: -0.24, in: 0.18 });
    function update(t, sim, ch) {
      B.cap.position.y = 0.07 + ch.cap(t);
      const since = t - tHit;
      // the lead-in glint: the cap catches the light twice before Codex speaks
      const glint = t < t0 ? 0.9 * Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.12) / 0.3)))) + 0.6 * Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.38) / 0.18)))) : 0;
      const flash = since >= 0 ? 1.6 * Math.exp(-since * 2.2) + 0.55 : 0.05 + glint;
      B.capMat.emissiveIntensity = flash;
      B.glow.intensity = since >= 0 ? 2.5 * Math.exp(-since * 1.5) + 0.6 : 0;
      lamps.forEach((m, i) => {
        const u = clamp((t - lampsOn[i]) / 0.07);
        m.emissiveIntensity = u > 0 ? 1.7 * u + 0.8 * Math.exp(-(t - lampsOn[i]) * 6) : 0;
      });
    }
    // A: front single across the desk, board above Codex's head
    const c0 = centreAt(C, t0);
    const shots = [
      { t0, whipIn: 1, ...framed('H3-A ship room single', c0, C.radius, dirFromYaw(Math.PI, -16, 7), { fill: 0.29, ndcX: -0.06, ndcY: 0.16, push: 0.3, drift: 0.12 }) },
      // B: low over the button for the press and the board lighting up behind
      { t0: tPress - 0.32, whipOut: 1, ...framed('H3-B button hero', c0, C.radius, V(1.55, 0.96, 0.62).sub(c0).normalize(), { fill: 0.33, ndcX: 0.16, ndcY: 0.28, push: 0.12, drift: 0.08 }) },
    ];
    return { start: -0.6, specs, channels, shots, update, hits: [{ t: tHit, amp: 0.008 }] };
  },
};

// ---------------------------------------------------------------- H4: Antigravity's room

const BOX = { x: 2.7, z: -0.2 };
const antigravityKind = {
  build(scene, assets) {
    const W = roomBase(scene, assets, (s, M, p, a) => antigravityRoom(s, M, p, a, { door: false }), {
      sunPos: V(12, 7.5, -5), sunTarget: V(2.4, 0, 0.6),
      sky: { center: V(34, 0, 0), normalYaw: -Math.PI / 2, w: 100, h: 50, seed: 'agsky' },
    });
    W.R.box.group.position.set(BOX.x, 0, BOX.z);
    W.R.box.group.rotation.y = -Math.PI / 2 + 0.22;
    W.robots.Antigravity = addRobot(scene, assets, 'Antigravity', { x: BOX.x, y: 0, z: BOX.z, yaw: Math.PI - 0.15 });
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const A = specs.Antigravity;
    const r = ctx.row('H4') || ctx.rows[0] || nullRow('H4', ctx.duration);
    const t0 = r.localStart;
    if (ctx.rows.length) speak(A, r, { bounce: 0 });
    // jack-in-the-box: sunk in the box, a jiggle, then up out of it with overshoot
    const tPop = t0 + 0.1;
    A.lifts.push({ t: -99, y: -0.34, hz: 3, zeta: 0.6 }, { t: tPop, y: 0.5, hz: 2.5, zeta: 0.3 });
    A.liftBob = (t) => (t > tPop + 0.8 ? 0.022 * Math.sin((t - tPop) * 2.3) : 0);
    A.eyes.push({ t0: tPop, t1: tPop + 0.5, sx: 1.25, sy: 1.25 });
    const tFeel = wordTime(r, 'feel', 0.6);
    const tSeen = actionTime(ctx, 'seen', wordTime(r, 'seen', 0.85));
    // "I feel so seen": a full happy spin, eyes wide and glowing
    A.yawHz = 2.1;
    A.yawZeta = 0.55;
    const tSpin = Math.min(tPop + 0.55, tFeel - 0.75);
    A.looks.push({ t: tSpin, yaw: A.plan.lastLook - 0.15 + Math.PI * 2 });
    A.plan.lastLook += Math.PI * 2;
    A.eyes.push({ t0: tSeen - 0.1, t1: r.end + 1, sx: 1.32, sy: 1.32 });
    A.leans.push({ t0: tSeen - 0.05, t1: r.end + 1, squash: 0.06, nod: 0.1, in: 0.2 });
    A.lifts.push({ t: r.end + 0.05, y: 0.64, hz: 1.6, zeta: 0.5 });
    const box = W.R.box.group;
    const by = box.rotation.y;
    function update(t) {
      // the box jiggles just before the pop, and once more as the robot clears it
      const j = Math.max(0, 1 - Math.abs(t - (tPop - 0.08)) / 0.2) + 0.6 * Math.max(0, 1 - Math.abs(t - (tPop + 0.2)) / 0.15) + 0.7 * Math.max(0, 1 - Math.abs(t - Math.max(0.15, tPop - 0.4)) / 0.14);
      box.rotation.set(0.05 * j * Math.sin(t * 70), by + 0.03 * j * Math.sin(t * 53), 0.05 * j * Math.sin(t * 61 + 1));
    }
    const cEnd = centreAt(A, tFeel, 0.5);
    const shots = [
      { t0, whipIn: 1, ...keyed('H4-A box wide', [
        { t: t0, pos: V(0.85, 0.95, 0.95), target: V(2.65, 0.62, -0.3), fov: FOV },
        { t: tFeel, pos: V(1.05, 0.98, 0.82), target: V(2.65, 0.78, -0.28), fov: FOV, ease: ease.sineInOut },
      ], { dist: 2.1 }) },
      { t0: tFeel - 0.12, whipOut: 1, ...framed('H4-B so seen, low single', cEnd, A.radius, dirFromYaw(Math.PI, 24, -4), { fill: 0.36, ndcX: -0.12, ndcY: 0.18, push: 0.25, drift: 0.1 }) },
    ];
    return { start: -0.8, specs, shots, update };
  },
};

// ---------------------------------------------------------------- H6: the time machine

const clockKind = {
  build(scene, assets) {
    const W = roomBase(scene, assets, (s, M, p) => clockRoom(s, M, p), {
      sunPos: V(2.2, 7.5, 9.5), sunTarget: V(2.6, 0, -0.4),
      sky: { center: V(2.3, 0, 34), normalYaw: Math.PI, w: 100, h: 50, seed: 'clsky' },
    });
    W.robots.Claude = addRobot(scene, assets, 'Claude', { x: 3.4, y: 0, z: 0.3, yaw: Math.PI - 0.12 });
    // three books and a little vase on the side table
    const T = W.R.table;
    const cols = [W.palette.accent, '#2F5D62', '#E9D8B4'];
    W.books = [[0.2, 0.045, 0.27], [0.18, 0.038, 0.25], [0.16, 0.05, 0.22]].map((d, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(d[0], d[1], d[2]), [std('#F4EFE6', 0.8), std('#F4EFE6', 0.8), std(cols[i], 0.6), std(cols[i], 0.6), std(cols[i], 0.6), std(cols[i], 0.6)]);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
      return { mesh: m, size: d };
    });
    W.table = T;
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const C = specs.Claude;
    const r = ctx.row('H6') || ctx.rows[0] || nullRow('H6', ctx.duration);
    const t0 = r.localStart;
    if (ctx.rows.length) speak(C, r, { bounce: 0.25 });
    const T = W.table;
    const tCheck = wordTime(r, 'checkpoint', 0.3);
    const tMess = wordTime(r, 'Mess', 0.55);
    const tRew = actionTime(ctx, 'rewind', wordTime(r, 'Rewind', 0.78));
    // a glance up at the clocks on "checkpoint"
    C.leans.push({ t0: tCheck - 0.1, t1: tCheck + 0.6, nod: 0.25, in: 0.2, out: 0.3 });
    // "Mess up?": a sideways hop into the side table
    const home = posAt(C, 0);
    const tableSide = { x: T.x + 0.08, z: T.z - T.r - 0.33 };
    const land = walkTo(C, tMess - 0.36, tableSide, { stride: 0.5, height: 0.07, turn: false, lean: 0 });
    const hit = land - 0.12;
    C.bumps.push({ t: hit, roll: 1.6, pitch: 0.3 });
    C.eyes.push({ t0: hit, t1: tRew - 0.05, sx: 1.3, sy: 1.3 });
    // "Rewind!": the books fly back, the clocks spin backwards, Claude hops back to its mark
    walkTo(C, tRew + 0.1, home, { stride: 0.42, height: 0.06, turn: false, lean: 0 });
    hop(C, tRew + 0.75, 0.08, { depth: 0.2 });
    C.eyes.push({ t0: tRew, t1: r.end + 1, sx: 1.15, sy: 0.6 });
    faceToward(C, tRew + 0.6, V(0.8, 1, 0.9));
    // books: rigid bodies stacked on the table; the bump throws them off toward the camera side
    const props = [];
    const stackY = [0, 0.045, 0.083];
    W.books.forEach((b, i) => {
      const half = b.size[1] / 2;
      props.push({
        id: `book-${i}`, pos: [T.x + 0.02 * i, T.top + stackY[i] + half, T.z - 0.02 * i], rot: [0, 0.3 + 0.35 * i, 0], half: { h: half },
        restitution: 0.25, friction: 0.5, drag: 0.4, tumble: 1,
        events: [{ t: hit + 0.02 + 0.03 * i, v: [-0.7 - 0.25 * i, 1.6 + 0.3 * i, 0.55 + 0.2 * (i - 1)], w: [(hash('bw', i) - 0.5) * 9, (hash('by', i) - 0.5) * 5, (hash('bz', i) - 0.5) * 9] }],
        support: (x, z, k, results, y) => {
          let h = Math.hypot(x - T.x, z - T.z) < T.r ? T.top : 0;
          for (let j = 0; j < i; j++) {
            const o = results[`book-${j}`];
            if (!o) continue;
            if (Math.hypot(x - o.x[k], z - o.z[k]) < 0.11) { const top = o.y[k] + W.books[j].size[1] / 2; if (top <= (y ?? 9) + 0.02) h = Math.max(h, top); }
          }
          return h;
        },
      });
    });
    // time map for the props: forward, then played backwards fast from "Rewind"
    const rewSpeed = 2.4;
    const propTime = (t) => (t < tRew ? t : Math.max(hit - 0.05, tRew - (t - tRew) * rewSpeed));
    const spinDur = 1.25;
    const S = (u) => { u = clamp(u); return u - Math.sin(2 * Math.PI * u) / (2 * Math.PI); };
    const clocks = W.R.clocks;
    function update(t, sim) {
      const pt = propTime(t);
      W.books.forEach((b, i) => placeRigid(b.mesh, sim.propPose(`book-${i}`, pt)));
      const back = S((t - tRew) / spinDur);
      const tick = Math.floor(t) + smoothstep((t % 1) / 0.12);
      clocks.forEach((c, i) => {
        c.second.rotation.z = -(c.phase.s + (tick * Math.PI) / 30) + back * Math.PI * 2 * (6 + (i % 3));
        c.minute.rotation.z = -(c.phase.m + t * 0.01) + back * Math.PI * 2 * (2 + (i % 2));
        c.hour.rotation.z = -(c.phase.h + t * 0.001) + back * Math.PI * (0.6 + 0.2 * (i % 3));
      });
    }
    const c0 = centreAt(C, t0);
    const shots = [
      { t0, whipIn: 1, ...framed('H6-A clock wall single', c0, C.radius, dirFromYaw(Math.PI, -22, 9), { fill: 0.27, ndcX: -0.1, ndcY: 0.08, push: 0.3, drift: 0.12 }) },
      { t0: tMess - 0.45, whipOut: 1, ...keyed('H6-B mess and rewind', [
        { t: tMess - 0.45, pos: V(1.55, 0.7, 1.9), target: V(3.45, 0.62, 0.45), fov: FOV },
        { t: r.end + 0.3, pos: V(1.66, 0.72, 1.78), target: V(3.45, 0.68, 0.42), fov: FOV, ease: ease.sineInOut },
      ], { dist: 2.4 }) },
    ];
    leadInLook(C, r, V(4.6, 2.0, -0.4));
    C.leans.push({ t0: r.end + 0.05, t1: ctx.duration + 1, roll: 0.14, nod: 0.12, in: 0.2 });
    return { start: -0.6, specs, props, shots, update, info: { tMess, tRew } };
  },
};

// ---------------------------------------------------------------- H7: the remote

const phoneKind = {
  build(scene, assets) {
    const W = roomBase(scene, assets, (s, M, p, a) => phoneRoom(s, M, p, a), {
      sunPos: V(2.4, 7.5, -9.5), sunTarget: V(2.6, 0, 0.6),
      sky: { center: V(2.5, 0, -34), normalYaw: 0, w: 100, h: 50, seed: 'phsky' },
    });
    W.robots.Cursor = addRobot(scene, assets, 'Cursor', { x: 3.95, y: 0, z: -0.82, yaw: Math.PI - 0.35 });
    // the phone's live view: a high corner camera rendered into a portrait texture
    W.rt = new THREE.WebGLRenderTarget(432, 912, { samples: 4 });
    W.rt.texture.colorSpace = THREE.SRGBColorSpace;
    W.rtCam = new THREE.PerspectiveCamera(58, 432 / 912, 0.05, 60);
    W.rtCam.position.set(4.55, 1.62, 0.2);
    W.rtCam.lookAt(3.6, -0.55, -0.85);
    W.scene = scene;
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const C = specs.Cursor;
    const r = ctx.row('H7') || ctx.rows[0] || nullRow('H7', ctx.duration);
    const t0 = r.localStart;
    if (ctx.rows.length) speak(C, r, { bounce: 0 });
    const tBoss = wordTime(r, 'boss', 0.4);
    const tAround = wordTime(r, 'around', 0.55);
    const tPhone = wordTime(r, 'phone', 0.85);
    const P = W.R.phone;
    const tOn = actionTime(ctx, 'phoneLight', t0 + 0.08);
    const tBuzz = actionTime(ctx, 'phoneBuzz', tPhone + 0.1);
    // the phone buzzes on "boss": Cursor jumps to attention, scurries, then looks at us
    C.eyes.push({ t0: tBoss, t1: tPhone, sx: 1.3, sy: 1.3 });
    hop(C, tBoss + 0.04, 0.12, { depth: 0.2 });
    const home = posAt(C, 0);
    const back = walkTo(C, tAround, { x: home.x - 0.3, z: home.z + 0.35 }, { stride: 0.35, height: 0.05, turn: false, lean: 0 });
    walkTo(C, back + 0.02, { x: home.x - 0.15, z: home.z + 0.15 }, { stride: 0.35, height: 0.05, turn: false, lean: 0 });
    faceToward(C, tBoss - 0.1, V(4.85, 1.32, 0.25));
    faceToward(C, tPhone - 0.2, V(1.2, 1.0, 0.5));
    const camA = V(2.0, 0.76, -0.4);
    faceToward(C, -1, camA);
    const status = P.overlayMat;
    function update(t) {
      const buzz = t > tBuzz - 0.02 && t < tBuzz + 0.5 ? Math.sin(t * 95) * 0.014 * (1 - (t - tBuzz + 0.02) / 0.52) : 0;
      P.group.rotation.z = buzz;
      P.group.position.y = 1.32 + buzz * 0.4;
      const on = smoothstep((t - tOn) / (6 / 30));
      W.screenOn = on;
      status.opacity = on;
    }
    function prerender(renderer) {
      const on = W.screenOn ?? 1;
      if (on <= 0.001) { P.screenMat.map = null; P.screenMat.color.set('#0B0C0E'); P.screenMat.needsUpdate = true; return; }
      // the phone shows the room it hangs in: render without its own screen content
      P.screenMat.map = null;
      P.screenMat.color.set('#0B0C0E');
      status.visible = false;
      renderer.setRenderTarget(W.rt);
      renderer.render(W.scene, W.rtCam);
      renderer.setRenderTarget(null);
      status.visible = true;
      P.screenMat.map = W.rt.texture;
      P.screenMat.color.setScalar(on);
      P.screenMat.needsUpdate = true;
    }
    const c0 = centreAt(C, t0);
    const shots = [
      { t0, whipIn: 1, ...keyed('H7-A Cursor and the giant phone', [
        { t: t0, pos: camA, target: V(4.4, 0.92, -0.25), fov: FOV },
        { t: tBoss, pos: camA.clone().add(V(0.2, 0.02, 0.04)), target: V(4.4, 0.94, -0.23), fov: FOV, ease: ease.sineInOut },
      ], { dist: 2.6 }) },
      { t0: tBoss - 0.08, whipOut: 1, ...keyed('H7-B push on the phone screen', [
        { t: tBoss - 0.08, pos: V(2.75, 1.36, 0.95), target: V(4.8, 1.5, 0.22), fov: 56 },
        { t: r.end + 0.3, pos: V(2.98, 1.38, 0.82), target: V(4.82, 1.52, 0.23), fov: 52, ease: ease.power2Out },
      ], { dist: 2.0 }) },
    ];
    leadInLook(C, r, V(4.85, 1.32, 0.25));
    hop(C, tBuzz + 0.04, 0.09, { depth: 0.2 });
    faceToward(C, tBuzz + 0.02, V(4.6, 1.32, 0.25)); // spins to the buzzing phone: its face fills the screen
    C.eyes.push({ t0: tBuzz, t1: ctx.duration + 1, sx: 1.3, sy: 1.3 });
    return { start: -0.6, specs, shots, update, prerender };
  },
};

// ---------------------------------------------------------------- H8: the fridge

const fridgeKind = {
  build(scene, assets) {
    const W = roomBase(scene, assets, (s, M, p) => fridgeRoom(s, M, p), {
      sunPos: V(2.0, 7.5, 9.5), sunTarget: V(2.6, 0, -0.4),
      sky: { center: V(2.3, 0, 34), normalYaw: Math.PI, w: 100, h: 50, seed: 'frsky' },
    });
    W.robots.Codex = addRobot(scene, assets, 'Codex', { x: 3.55, y: 0, z: 0.95, yaw: Math.PI + 0.35 });
    const F = W.R.fridge;
    // the spill: a soft additive cone out of the opening
    const front = new THREE.Vector3();
    F.group.updateMatrixWorld(true);
    F.group.localToWorld(front.set(0, F.h * 0.62, F.d / 2));
    W.cone = lightCone(front.clone(), front.clone().add(V(-2.4, -1.0, 0.1)), { radius: 0.9, opacity: 0.0, color: '#EAF4FF' });
    scene.add(W.cone);
    return W;
  },
  plan(W, ctx) {
    const specs = specsOf(W, ctx);
    const C = specs.Codex;
    const r = ctx.row('H8') || ctx.rows[0] || nullRow('H8', ctx.duration);
    const t0 = r.localStart;
    if (ctx.rows.length) speak(C, r, { bounce: 0.2 });
    const F = W.R.fridge;
    const tFridge = wordTime(r, 'fridge', 0.12);
    const tEvent = wordTime(r, 'Event', 0.35);
    const tFresh = wordTime(r, 'fresh', 0.85);
    const tOpen = actionTime(ctx, 'fridgeOpen', tFridge + 0.05);
    // Codex presents the fridge, then hops round in front of it and looks inside
    faceToward(C, -1, V(1.6, 1, 1.2));
    faceToward(C, tFridge - 0.15, V(4.2, 1, 0.1));
    const inFront = { x: 2.78, z: 0.14 };
    walkTo(C, tOpen + 0.3, inFront, { stride: 0.32, height: 0.06, faceEnd: 0 });
    face(C, tEvent - 0.2, 0.02);
    C.eyes.push({ t0: tFresh - 0.05, t1: r.end + 1, sx: 1.1, sy: 0.55 });
    C.leans.push({ t0: tFresh - 0.1, t1: r.end + 1, pitch: -0.12, nod: 0.08, in: 0.25 });
    leadInLook(C, r, V(4.2, 1.0, 0.1));
    C.leans.push({ t0: r.end + 0.05, t1: ctx.duration + 1, nod: -0.18, pitch: -0.1, in: 0.25 });
    const channels = { door: { keys: [{ t: -99, x: 0, hz: 4, zeta: 0.6 }, { t: tOpen, x: -1.92, hz: 2.3, zeta: 0.42 }, { t: r.end + 0.15, x: -1.15, hz: 1.4, zeta: 0.6 }], min: -2.02, max: 0, restitution: 0.35 } };
    function update(t, sim, ch) {
      const a = ch.door(t);
      F.hinge.rotation.y = a;
      const k = clamp(-a / 0.7);
      F.lamp.intensity = 2.2 * k;
      F.spill.intensity = 14 * k;
      F.liner.emissiveIntensity = 0.55 * k;
      W.cone.material.uniforms.uOpacity.value = 0.07 * k;
    }
    const c0 = centreAt(C, t0);
    const cIn = centreAt(C, 99);
    const fridgeCam = V(F.group.position.x + 0.3, 0.66, F.group.position.z + 0.0);
    const shots = [
      { t0, whipIn: 1, ...keyed('H8-A fridge and Codex', [
        { t: t0, pos: V(1.55, 0.95, 1.35), target: V(3.95, 0.86, 0.38), fov: FOV },
        { t: tEvent, pos: V(1.85, 0.92, 1.05), target: V(3.95, 0.86, 0.3), fov: FOV, ease: ease.sineInOut },
      ], { dist: 2.5 }) },
      // B: the fridge-light reveal from inside, past the jars, onto Codex's lit face
      { t0: tEvent - 0.1, whipOut: 1, ...keyed('H8-B inside the fridge', [
        { t: tEvent - 0.1, pos: fridgeCam, target: V(cIn.x, cIn.y + 0.05, cIn.z), fov: FOV },
        { t: r.end + 0.3, pos: fridgeCam.clone().add(V(-0.03, 0.01, 0)), target: V(cIn.x, cIn.y + 0.08, cIn.z), fov: FOV - 3, ease: ease.sineInOut },
      ], { dist: 1.3 }) },
    ];
    return { start: -0.6, specs, channels, shots, update };
  },
};

export const KINDS = {
  't3-codex-room': codexRoom,
  't3-antigravity-room': antigravityKind,
  't3-clock': clockKind,
  't3-phone': phoneKind,
  't3-fridge': fridgeKind,
};
