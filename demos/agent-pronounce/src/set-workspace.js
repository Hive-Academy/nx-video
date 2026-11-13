// Episode 6 v4 opening, animated: the approved evening workspace (look-workspace.js, hero frame b)
// from the first frame to the cue where the vortex starts (`through`).
//
// Shot grammar (scene-local seconds; every time is a cue or a line time from ctx):
//   a crane   0 .. N1-0.4       high over the shoulders, both at work facing the hero screen
//   reverse   N1-0.4 .. N2end-0.4  from the screen side: Codex reads the screen (not looking up),
//                                 Claude swivels half toward him to ask
//   insert    .. landingOut+     push to a straight-on hold on the hero screen; the 2D landing clip
//                                 sits exactly over the panel (build-timing.mjs, HOLD below); both
//                                 swivel to talk off camera; pull back to the approved b two-shot
//   c Codex   N5-0.4 ..         MCU (the tightest framing; the visor rim steps at anything tighter)
//   b' Claude O1-0.4 ..         two-shot leaning to Claude, the screen between them: spark and dip
//   c Codex   O3-0.5 ..         MCU
//   storm     rumble-0.2 .. through  b, the storm grows on the screen, lights dip, push into it
//
// The robots stay the ball rig. Life is head yaw, nod, bob, squash, visor glow, blinks and the
// chair swivel. Everything is a pure function of t: hash and noise1 only.
import * as THREE from 'three';
import { hash, noise1, clamp, ease } from './util.js';
import { tourSpec, speak, listen, idle, anticipate, sceneCue } from './cribs.js';
import { custom } from './cribs-camera.js';
import { bolt as makeBolt } from './craft.js';
import { vortexTexture } from './look-vortex.js';
import { assetUrl } from './assets.js';
import { LAYOUT, SHOTS } from './look-workspace.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const pulse = (t, at, w) => (t < at ? 0 : Math.exp(-3 * ((t - at) / w) ** 2));
const win = (t, a, b, ramp) => ease.sineInOut(clamp((t - a) / ramp)) * (1 - ease.sineInOut(clamp((t - b) / ramp)));
const mix = (a, b, u) => a + (b - a) * u;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// vertical fov (deg) of a focal length on three's 35 mm film gauge at 16:9
const fovOf = (mm) => (2 * Math.atan((0.5 * 35) / (16 / 9) / mm) * 180) / Math.PI;
const yawToward = (from, to) => Math.atan2(-(to.z - from.z), to.x - from.x);

// The straight-on screen hold. build-timing.mjs places the landing clip at this exact rect:
// width HOLD.px centred in 1920x1080, so the clip lands on the 3D panel pixel for pixel.
export const HOLD = { d: 1.2, px: 1650 };

async function build(scene, assets, ctx) {
  const look = await ctx.useLook('workspace', { shot: 'b' });
  const h = look.handles;
  const sc = LAYOUT.screen;
  const panelZ = sc.at[2] + 0.0145;
  const screenCenter = V(sc.at[0], sc.at[1], panelZ);

  // screen sources: the approved mockup, then the landing clip's first and last frames
  // (scripts/live-demo/landing-stills.mjs), so the 2D insert cross-fades onto a matching frame
  const loader = new THREE.TextureLoader();
  const still = async (p) => {
    const t = await loader.loadAsync(assetUrl(p));
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    return t;
  };
  const sources = {
    mockup: h.screenMat.map,
    first: await still('assets/live-demo/stills/landing-first.png'),
    last: await still('assets/live-demo/stills/landing-last.png'),
  };
  // the landing clip as a 10 fps frame sequence (landing-stills.mjs): the hero screen plays it through
  // setScreenSource under the 2D insert, so the insert's fades never show a mismatched frame. One
  // texture per frame keeps it seek-safe; a VideoTexture would show the browser's last decoded frame.
  const SEQ = { fps: 10, count: 45 };
  const seq = await Promise.all(Array.from({ length: SEQ.count }, (_, i) =>
    still(`assets/live-demo/stills/landing-seq/${String(i + 1).padStart(3, '0')}.jpg`)));
  for (const t of seq) t.generateMipmaps = true;
  const screenColor = h.screenMat.color.clone();

  // the storm on the hero screen: the vortex texture on a plane just in front of the panel
  const stormTex = vortexTexture();
  stormTex.wrapS = stormTex.wrapT = THREE.RepeatWrapping;
  stormTex.repeat.set(1, 0.5);
  const stormScreenMat = new THREE.MeshBasicMaterial({ map: stormTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: true });
  stormScreenMat.color.setScalar(1.6);
  const stormScreen = new THREE.Mesh(new THREE.PlaneGeometry(sc.w, sc.h), stormScreenMat);
  stormScreen.position.set(sc.at[0], sc.at[1], panelZ + 0.002);
  stormScreen.renderOrder = 2;
  scene.add(stormScreen);

  // the spark: a bolt that jumps off the screen's lower-left corner toward Claude, plus trails and embers
  const sparkPos = V(-sc.w / 2 + 0.16, sc.at[1] - sc.h / 2 + 0.12, panelZ + 0.03);
  const sparkArc = makeBolt(sparkPos, sparkPos.clone().add(V(-0.12, 0.42, 0.55)), 613, { depth: 5, core: 0.012, glow: 0.06 });
  sparkArc.visible = false; scene.add(sparkArc);
  const sparkTrails = [];
  for (let i = 0; i < 6; i++) {
    const end = sparkPos.clone().add(V((hash('ws-spark-x', i) - 0.6) * 0.6, 0.1 + hash('ws-spark-y', i) * 0.45, 0.15 + hash('ws-spark-z', i) * 0.4));
    const trail = makeBolt(sparkPos, end, 820 + i, { depth: 3, core: 0.005, glow: 0.024 });
    trail.visible = false; scene.add(trail); sparkTrails.push(trail);
  }
  const n = 28, geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#E1F4FF', size: 0.03, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  sparks.visible = false; scene.add(sparks);
  const sparkVel = Array.from({ length: n }, (_, i) => {
    const a = hash('ws-ember', i) * Math.PI * 2;
    return V(Math.cos(a) * 0.8, 0.5 + hash('ws-ember-y', i), 0.6 + 0.6 * hash('ws-ember-z', i)).multiplyScalar(0.4 + 0.7 * hash('ws-ember-v', i));
  });

  // sand and wind pouring out of the screen (pull)
  const windGeo = new THREE.BufferGeometry();
  windGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(420 * 3), 3));
  const wind = new THREE.Points(windGeo, new THREE.PointsMaterial({ color: '#D9A85A', size: 0.022, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  wind.visible = false; scene.add(wind);

  // the veil that takes the frame at `through` (the vortex scene starts on the same texture)
  const stormMat = new THREE.MeshBasicMaterial({ map: vortexTexture(), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const stormVeil = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), stormMat);
  stormVeil.renderOrder = 900; stormVeil.visible = false; scene.add(stormVeil);
  // effects stay out of the depth pass, so they never pull the focus plane
  (scene.userData.noDepth ||= []).push(sparkArc, ...sparkTrails, sparks, wind, stormVeil);

  // light rest values, so the dips scale from the approved look
  const L = h.lights;
  const base = new Map();
  for (const l of [L.bulb, L.moon, L.rim, L.wash, L.slatWash, L.key, L.up, L.ceilFill, L.spill, L.back, L.sideSpill, h.screenLight, ...L.lamps]) base.set(l, l.intensity);
  const slColor = h.screenLight.color.clone();

  // seats: work faces the hero screen, talk swivels toward each other and the window (look-workspace.js)
  const cast = { Codex: h.robots.Codex, Claude: h.robots.Claude };
  for (const r of Object.values(cast)) {
    const s = r.side;
    r.yawWork = yawToward(r.seatAt, V(s * 0.25, 0, sc.at[2]));
    r.yawTalk = yawToward(r.seatAt, V(-s * 0.5, 0, 1.6));
  }
  for (const r of Object.values(cast)) r.yawPeer = yawToward(r.seatAt, (r === cast.Codex ? cast.Claude : cast.Codex).seatAt);

  return {
    robots: {}, cast, h, sources, seq, seqFps: SEQ.fps, screenColor, stormScreen, stormScreenMat, stormTex, sparkPos, sparkArc, sparkTrails,
    sparks, sparkVel, wind, stormVeil, stormMat, base, slColor, screenCenter,
    post: { film: look.film, shadows: true, filmFrame: 0 },
  };
}

function plan(world, ctx) {
  const duration = ctx.duration;
  const row = (id, start, end) => ctx.row(id) || { localStart: start, duration: end - start, end, words: [] };
  const N1 = row('N1', 4, 6.694), N2 = row('N2', 7.794, 10.127), N3 = row('N3', 11.227, 16.753), N4 = row('N4', 17.853, 19.478);
  const N5 = row('N5', 20.578, 26.151), O1 = row('O1', 27.251, 29.584), O3 = row('O3', 30.684, 33.47);
  const end = (r) => r.localStart + r.duration;
  const landingIn = sceneCue(ctx, 'landingIn', 10.827), landingOut = sceneCue(ctx, 'landingOut', 15.327);
  const tah = sceneCue(ctx, 'tah', 21.338), spark = sceneCue(ctx, 'spark', 29.047), dip = sceneCue(ctx, 'dip', spark + 0.2);
  const rumble = sceneCue(ctx, 'rumble', 34.07), pull = sceneCue(ctx, 'pull', 35.47), through = sceneCue(ctx, 'through', duration);

  // voice acting from the shared cribs: talk squash and visor glow, onset bounces, listener nods
  const specs = {};
  for (const name of ['Codex', 'Claude']) {
    const r = world.cast[name];
    specs[name] = tourSpec(name, { x: r.seatAt.x, z: r.seatAt.z, yaw: 0 }, { scale: r.scale, seedTag: 'workspace' });
  }
  for (const id of ['N1', 'N2', 'N3', 'N4', 'N5', 'O1', 'O3']) {
    const rw = ctx.row(id); if (!rw || !specs[rw.speaker]) continue;
    anticipate(specs[rw.speaker], rw); speak(specs[rw.speaker], rw); listen(specs, rw.speaker, rw);
  }
  idle(specs.Codex, 0, duration); idle(specs.Claude, 0, duration);
  for (const spec of Object.values(specs)) spec.eyes.push({ t0: rumble, t1: duration + 1, sx: 1.3, sy: 1.3 });

  // speaker windows (for head turns and focus)
  const lines = [['Codex', N1], ['Claude', N2], ['Codex', N3], ['Claude', N4], ['Codex', N5], ['Claude', O1], ['Codex', O3]];
  const speakerAt = (t) => { let s = null; for (const [n, r] of lines) if (t >= r.localStart - 0.15 && t < end(r) + 0.35) s = n; return s; };

  // ---------------------------------------------------------------- camera
  const P = (a) => V(...a);
  const A = SHOTS.a, B = SHOTS.b, C = SHOTS.c;
  const drift = (t, k, amp = 1) => V(0.012 * amp * noise1(t * 0.35, `ws-dx-${k}`), 0.006 * amp * noise1(t * 0.3, `ws-dy-${k}`), 0.008 * amp * noise1(t * 0.27, `ws-dz-${k}`));
  const sc = LAYOUT.screen;
  const center = world.screenCenter;
  const holdFov = (2 * Math.atan(((sc.w * 1920) / (2 * HOLD.d * HOLD.px)) * (9 / 16)) * 180) / Math.PI;
  const hold = { pos: center.clone().add(V(0, 0, HOLD.d)), target: center.clone(), fov: holdFov };
  const codex = world.cast.Codex.seatAt, claude = world.cast.Claude.seatAt;
  const face = (p) => V(p.x, 0.66, p.z); // seated head height, for focus
  const shots = [];
  const add = (label, t0, sample) => { const s = custom(label, sample, 0); s.t0 = t0; s.still = true; shots.push(s); return s; };

  // a: a short crane down onto the approved over-the-shoulder still
  const tA = N1.localStart - 0.4;
  add('a crane', 0, (t) => {
    const u = ease.sineInOut(clamp(t / tA));
    return { pos: P(A.pos).add(V(0.16 * (1 - u), 0.3 * (1 - u), 0.1 * (1 - u))).add(drift(t, 'a')), target: P(A.target), fov: fovOf(A.focal), subject: P(A.subject), aperture: A.aperture };
  });
  // reverse: from in front of the hero screen, both faces lit by it; focus racks to Claude on her line
  const tR = end(N2) - 0.4;
  add('reverse two-shot', tA, (t) => {
    const u = clamp((t - tA) / (tR - tA));
    const rack = ease.sineInOut(clamp((t - (N2.localStart - 0.5)) / 0.6));
    return { pos: V(0.04, 1.02, -0.52 + 0.08 * u).add(drift(t, 'r')), target: V(0, 0.66, 0.78), fov: fovOf(24),
      subject: face(codex).lerp(face(claude), rack), aperture: 0.004 };
  });
  // insert: push into the straight-on hold, hold still for the 2D clip, pull back to the approved b
  const pushA = tR + 0.1, pushB = landingIn - 0.04, backA = landingOut + 0.32, backB = backA + 1.9;
  const mid = { pos: V(0, 1.1, 1.35), target: V(0, 0.97, sc.at[2]), fov: fovOf(22) };
  const tC1 = N5.localStart - 0.4;
  add('insert', tR, (t) => {
    if (t < backA) {
      const u = ease.sineInOut(clamp((t - pushA) / (pushB - pushA)));
      return { pos: mid.pos.clone().lerp(hold.pos, u), target: mid.target.clone().lerp(hold.target, u), fov: mix(mid.fov, hold.fov, u), subject: center.clone(), aperture: 0.002 };
    }
    const u = ease.sineInOut(clamp((t - backA) / (backB - backA)));
    const settle = clamp((t - backB) / 2);
    return { pos: hold.pos.clone().lerp(P(B.pos), u).add(drift(t, 'b', settle)), target: hold.target.clone().lerp(P(B.target), u), fov: mix(hold.fov, fovOf(B.focal), u),
      subject: center.clone().lerp(P(B.subject), u), aperture: mix(0.002, B.aperture, u) };
  });
  // c: the approved Codex MCU
  // the target drops 4 cm from the still so the visor clears the caption band (lower 16%)
  const cShot = (k) => (t) => ({ pos: P(C.pos).add(drift(t, k, 0.7)), target: P(C.target).add(V(0, -0.04, 0)), fov: fovOf(C.focal), subject: P(C.subject), aperture: C.aperture });
  add('c Codex N5', tC1, cShot('c1'));
  // b': the two-shot leaning to Claude, the screen and its spark between them
  const tB2 = O1.localStart - 0.4;
  add("b' Claude O1", tB2, (t) => ({ pos: V(-0.5, 0.98, 2.1).add(drift(t, 'b2')), target: V(-0.2, 0.72, 0.0), fov: fovOf(26), subject: face(claude), aperture: 0.005 }));
  const tC2 = O3.localStart - 0.5;
  add('c Codex O3', tC2, cShot('c2'));
  // storm: back to b as the screen boils, then the 1.6 s push into the screen
  const tS = rumble - 0.2;
  const into = { pos: center.clone().add(V(0, 0, 0.1)), target: center.clone() };
  add('storm push', tS, (t) => {
    const u = ease.power2In(clamp((t - pull) / (through - pull)));
    const shake = 0.006 * ease.sineInOut(clamp((t - rumble) / 0.6)) * (1 - u);
    const k = V(shake * noise1(t * 23, 'ws-shx'), shake * noise1(t * 19, 'ws-shy'), 0);
    return { pos: P(B.pos).lerp(into.pos, u).add(k).add(drift(t, 's', 1 - u)), target: P(B.target).lerp(into.target, ease.sineInOut(clamp((t - pull) / 0.9))), fov: mix(fovOf(B.focal), 40, u),
      subject: P(B.subject).lerp(center, u), aperture: B.aperture * (1 - u) + 0.001 };
  });

  // swivel: 0 = work (facing the screen), 1 = talk; Claude half-turns to ask on N2
  const swivel = {
    Codex: (t) => ease.sineInOut(clamp((t - (landingIn + 1.2)) / 1.1)),
    Claude: (t) => 0.38 * ease.sineInOut(clamp((t - (N2.localStart - 0.55)) / 0.7)) + 0.62 * ease.sineInOut(clamp((t - (landingIn + 1.6)) / 1.1)),
  };
  // seeded blinks: 2.2-4.2 s apart, 0.14 s each
  const blinks = {};
  for (const name of ['Codex', 'Claude']) {
    blinks[name] = [];
    for (let t = 0.4 + hash('ws-blink0', name) * 1.5; t < duration + 1; t += 2.2 + 2.0 * hash('ws-blink', name, Math.round(t * 100))) blinks[name].push(t);
  }
  const blinkAt = (name, t) => { let b = 0; for (const s of blinks[name]) { const u = (t - s) / 0.14; if (u >= 0 && u < 1) b = Math.max(b, Math.sin(Math.PI * u)); } return b; };

  function update(t) {
    const h = world.h;
    const tahPulse = pulse(t, tah, 0.35);
    const sparkU = (t - spark) / 0.32;
    const sparkGlow = sparkU >= 0 && sparkU < 1 ? (1 - sparkU) * (0.7 + 0.3 * noise1(t * 60, 'ws-arc')) : 0;
    const firstDip = 0.55 * ease.sineInOut(clamp((t - dip) / 0.1)) * (1 - ease.sineInOut(clamp((t - (dip + 0.6)) / 0.6)));
    const build = ease.sineInOut(clamp((t - rumble) / 0.6));
    const flicker = 0.7 + 0.3 * noise1(t * 21, 'ws-flicker');
    const dim = Math.min(0.7, firstDip + 0.55 * build * flicker);
    const grip = ease.sineInOut(clamp((t - pull) / 0.35));
    const danger = build;

    // ------------------------------------------------ robots
    const spk = speakerAt(t);
    for (const name of ['Codex', 'Claude']) {
      const r = world.cast[name];
      const p = ctx.getSim().robotPose(name, t);
      const w = swivel[name](t);
      const yaw = r.yawWork + wrap(r.yawTalk - r.yawWork) * w;
      const fdir = V(Math.cos(yaw), 0, -Math.sin(yaw));
      const lift = p.lift || 0;
      r.root.position.set(r.seatAt.x - 0.03 * fdir.x, r.seatY + lift, r.seatAt.z - 0.03 * fdir.z + 0.05 * grip);
      r.root.rotation.y = yaw;
      r.chair.rotation.y = yaw - Math.PI / 2;
      // head: listeners turn a little toward the speaker; Codex reads the screen through N1-N3
      const speaking = spk === name;
      let gaze = 0;
      if (spk && !speaking) gaze = clamp(wrap(r.yawPeer - yaw), -0.45, 0.45) * 0.55;
      if (speaking) gaze = clamp(wrap(r.yawPeer - yaw), -0.45, 0.45) * 0.25;
      if (name === 'Codex' && t < landingIn + 1.2) gaze = 0.04 * noise1(t * 0.6, 'ws-read'); // not looking up
      const screenGaze = clamp(wrap(yawToward(r.seatAt, center) - yaw), -0.6, 0.6);
      const toScreen = Math.max(0.55 * tahPulse * (name === 'Claude' ? 1 : 0.4), 0.75 * build);
      const headYaw = mix(gaze, screenGaze, toScreen) + 0.035 * noise1(t * 0.9, `ws-hy-${name}`);
      const work = 1 - w;
      const breathe = 0.014 * Math.sin(2.0 * t + (name === 'Claude' ? 1.3 : 0));
      const flinch = 0.18 * pulse(t, dip, 0.4) * (name === 'Claude' ? 1 : 0.6);
      const tahLean = name === 'Claude' ? 0.08 * win(t, tah - 0.2, tah + 1.6, 0.5) : 0;
      r.apply({
        hop: (p.hop || 0) * 0.5, ballDy: p.ballDy || 0, squash: p.squash || 0,
        roll: (p.roll || 0) + 0.04 * noise1(t * 0.5, `ws-roll-${name}`),
        pitch: mix(-0.04, -0.12, work) + (p.pitch || 0) + breathe + flinch + 0.2 * danger - 0.18 * grip + tahLean,
        nod: mix(0.03, -0.06, work) + (p.nod || 0) + 0.06 * tahPulse,
        headYaw: headYaw + 0.12 * danger * (name === 'Codex' ? 1 : -1),
        bx: (p.fx || 0) - 0.1 * grip, liftModel: lift / r.scale,
        eyeSX: (p.eyeSX || 1) + 0.18 * tahPulse, eyeSY: (p.eyeSY || 1) + 0.18 * tahPulse,
        blink: Math.max(p.blink || 0, blinkAt(name, t)),
        glow: (p.glow || 0) + 0.5 * tahPulse + 0.6 * sparkGlow + 0.35 * build,
      });
    }

    // ------------------------------------------------ hero screen
    // mockup, then the clip's first frame for the push, the clip itself (same clock as the 2D insert,
    // which starts its video at landingIn), and its last frame for the rest of the scene
    const seqI = Math.floor((t - landingIn) * world.seqFps);
    const tex = t < pushA ? world.sources.mockup
      : t < landingIn ? world.sources.first
      : seqI < world.seq.length ? world.seq[Math.max(0, seqI)] : world.sources.last;
    if (h.screenMat.map !== tex) h.setScreenSource(tex);
    const load = pulse(t, pushA, 0.25); // the page swap reads as a reload
    const screenK = 1 + 0.28 * tahPulse + 0.15 * load - 0.35 * firstDip + 0.9 * sparkGlow - 0.25 * build * flicker;
    h.screenMat.color.copy(world.screenColor).multiplyScalar(screenK);
    world.stormTex.offset.set(0.03 * Math.sin(t * 0.7), -t * 0.22);
    world.stormScreenMat.opacity = 0.95 * build;
    world.stormScreen.visible = build > 0;

    // ------------------------------------------------ lights
    const L = h.lights, base = world.base;
    const room = 1 - dim;
    for (const l of [L.bulb, L.wash, L.slatWash, L.key, L.up, L.ceilFill, ...L.lamps]) l.intensity = base.get(l) * room;
    for (const l of [L.moon, L.rim]) l.intensity = base.get(l) * (1 - 0.3 * dim);
    const screenLightK = screenK + 1.4 * build * flicker;
    for (const l of [L.spill, L.back, L.sideSpill, h.screenLight]) l.intensity = base.get(l) * screenLightK;
    const sand = new THREE.Color('#FFB46A');
    for (const l of [L.spill, h.screenLight]) l.color.copy(world.slColor).lerp(sand, 0.6 * build);

    // ------------------------------------------------ spark
    world.sparkArc.visible = sparkGlow > 0.05;
    world.sparkTrails.forEach((tr, i) => { tr.visible = sparkU >= 0.04 * i && sparkU < 0.55 + 0.04 * i; });
    const eu = (t - spark) / 0.9;
    world.sparks.visible = eu >= 0 && eu < 1;
    if (world.sparks.visible) {
      const a = world.sparks.geometry.attributes.position.array;
      world.sparkVel.forEach((v, i) => {
        a[i * 3] = world.sparkPos.x + v.x * eu * 0.6;
        a[i * 3 + 1] = world.sparkPos.y + v.y * eu * 0.6 - 0.35 * eu * eu;
        a[i * 3 + 2] = world.sparkPos.z + v.z * eu * 0.6;
      });
      world.sparks.geometry.attributes.position.needsUpdate = true;
      world.sparks.material.opacity = 1 - eu;
    }

    // ------------------------------------------------ wind and the veil
    const pour = ease.sineInOut(clamp((t - pull) / 0.5));
    world.wind.visible = pour > 0;
    if (world.wind.visible) {
      const a = world.wind.geometry.attributes.position.array;
      for (let i = 0; i < a.length / 3; i++) {
        const ph = hash('ws-wind', i), ang = hash('ws-wind-a', i) * Math.PI * 2;
        const tr = ((t - pull) * 1.6 + ph + 10) % 1;
        a[i * 3] = center.x + Math.cos(ang) * (0.15 + tr * 1.8);
        a[i * 3 + 1] = center.y + Math.sin(ang) * (0.08 + tr * 0.7);
        a[i * 3 + 2] = center.z + 0.05 + tr * 2.4;
      }
      world.wind.geometry.attributes.position.needsUpdate = true;
      world.wind.material.opacity = 0.75 * pour;
    }
    const cam = activeSample(t);
    world.stormVeil.position.copy(cam.pos).addScaledVector(cam.target.clone().sub(cam.pos).normalize(), 0.1);
    world.stormVeil.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(cam.pos, cam.target, V(0, 1, 0)));
    world.stormVeil.scale.setScalar(0.05);
    world.stormMat.opacity = ease.sineInOut(clamp((t - (through - 0.55)) / 0.45));
    world.stormVeil.visible = world.stormMat.opacity > 0;

    // ------------------------------------------------ film: per-shot focus, bloom with the effects
    const film = world.post.film;
    film.dof.focus = cam.pos.distanceTo(cam.subject);
    film.dof.aperture = cam.aperture;
    film.bloom.strength = 0.22 + 0.18 * tahPulse + 0.5 * sparkGlow + 0.35 * build;
    film.exposure = 0.95 * (1 - 0.15 * firstDip - 0.12 * build);
    world.post.filmFrame = Math.round(t * 30);
  }
  const activeSample = (t) => { let cur = shots[0]; for (const s of shots) if (t >= s.t0) cur = s; return cur.sample(t); };

  return {
    start: -0.6, specs, shots, update, hits: [], noSettle: true, near: 0.03, far: 40,
    info: { cues: { landingIn, landingOut, tah, spark, dip, rumble, pull, through }, hold: { ...HOLD, fov: +holdFov.toFixed(3) },
      shots: shots.map((s) => ({ label: s.cam, t0: +s.t0.toFixed(2) })) },
  };
}

export const KINDS = { workspace: { build, plan } };
