// Entry point of the Tribunal's 3D layer.
//
// index.html loads this module and each scene composition calls
//   window.__hf.buildReady[id] = window.TribunalReady.then(api => api.mount(config, canvasEl))
// with config = {id, kind: 'table'|'chaos'|'verdict'|'booth'|'punch', agent, color,
// absoluteStart, rows: [{start, duration, speaker, row, localStart}]}.
//
// One shared WebGL renderer draws every scene into an offscreen canvas and each
// composition's own <canvas> receives a 2D copy. That keeps the page to a single
// WebGL context however many scenes are mounted (Chrome drops contexts past 16).
// Rendering is driven only by the HyperFrames seek time (hf-seek).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadAssets } from './assets.js';
import { buildTableSet, measureSet } from './set-table.js';
import { buildBoothSet } from './set-booth.js';
import { buildTableActing, buildBoothActing, buildPunchActing } from './acting.js';
import { simulate } from './physics.js';
import { planTableShots, boothShot, punchShot, sampleShot, activeShot, applyCamera, handheld, impactShake, frameSphere, setFrame } from './camera.js';
import { ROBOT } from './robot.js';
import { clamp, ease, FPS } from './util.js';
import { TOUR_KINDS, mountTour } from './tour.js';
import { renderFilm } from './look-kit.js';

const WIDTH = 1920;
const HEIGHT = 1080;

let shared = null;
const postChains = new WeakMap();
function sharedRenderer() {
  if (shared) return shared;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.debug.checkShaderErrors = false; // skip program-info-log reads (ANGLE prints noisy HLSL notes)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  shared = { renderer, env, focus: null, w: WIDTH, h: HEIGHT };
  return shared;
}

// The shared render target follows the composition canvas (Episode 6 renders
// 4:5, 1080x1350): blit() is a 1:1 copy, so a portrait canvas never gets a
// stretched 16:9 frame. The depth-of-field chain, when it exists, follows too.
function setRenderSize(w, h) {
  const s = sharedRenderer();
  if (!(w >= 16) || !(h >= 16) || (s.w === w && s.h === h)) return;
  s.renderer.setSize(w, h, false);
  if (s.focus) s.focus.composer.setSize(w, h);
  for (const chain of s.postChains || []) chain.composer.setSize(w, h);
  s.w = w;
  s.h = h;
}

// Depth of field for over-the-shoulder shots: the listener's ball in the
// foreground goes soft, the speaker stays sharp, the set behind softens a little.
// Additive cones and contact-shadow decals are hidden from the depth pass so
// they do not read as near geometry.
class SoftFocusPass extends BokehPass {
  constructor(scene, camera, params) {
    super(scene, camera, params);
    const m = this.materialBokeh;
    // sharp band around the focal plane; strong blur in front, gentle behind;
    // the defocused foreground is also pulled toward the haze colour (lower contrast)
    m.uniforms.uHaze = { value: new THREE.Color('#10303A') };
    m.fragmentShader = m.fragmentShader
      .replace('uniform float focus;', 'uniform float focus; uniform vec3 uHaze;')
      .replace(
        'float factor = ( focus + viewZ );',
        'float factor = ( focus + viewZ ); float nearAmt = max( 0.0, factor - 0.35 ); float farAmt = min( 0.0, factor + 0.6 ) * 0.1; factor = nearAmt > 0.0 ? nearAmt : farAmt;',
      )
      .replace(
        'gl_FragColor.a = 1.0;',
        'gl_FragColor.rgb = mix( gl_FragColor.rgb, uHaze, clamp( nearAmt * 0.6, 0.0, 0.42 ) ); gl_FragColor.a = 1.0;',
      );
    // read raw depth (half-float RGBA packing decodes wrong in r181): basic packing
    this._materialDepth.depthPacking = THREE.BasicDepthPacking;
    m.defines.DEPTH_PACKING = 0;
    m.needsUpdate = true;
    this.hide = [];
  }
  render(renderer, writeBuffer, readBuffer, dt, mask) {
    for (const o of this.hide) o.visible = false;
    super.render(renderer, writeBuffer, readBuffer, dt, mask);
    for (const o of this.hide) o.visible = true;
  }
}

function focusChain() {
  const s = sharedRenderer();
  if (s.focus) return s.focus;
  const dummyScene = new THREE.Scene();
  const dummyCam = new THREE.PerspectiveCamera(35, WIDTH / HEIGHT, 0.05, 80);
  const composer = new EffectComposer(s.renderer);
  composer.setPixelRatio(1);
  composer.setSize(WIDTH, HEIGHT);
  const renderPass = new RenderPass(dummyScene, dummyCam);
  const bokeh = new SoftFocusPass(dummyScene, dummyCam, { focus: 2.5, aperture: 0.018, maxblur: 0.01 });
  composer.addPass(renderPass);
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());
  s.focus = { composer, renderPass, bokeh };
  window.__tribunalFocus = s.focus;
  return s.focus;
}

function renderFrame(scene, camera, dof, post) {
  const { renderer } = sharedRenderer();
  // opt-in film chain from look-kit.js (AO, DOF, bloom, grade); a post without `film` is unchanged
  if (post && post.film) {
    const oldShadows = renderer.shadowMap.enabled;
    if (post.shadows) renderer.shadowMap.enabled = true;
    try { renderFilm(renderer, scene, camera, post.film, shared.w, shared.h, post.filmFrame ?? 0); } finally { renderer.shadowMap.enabled = oldShadows; }
    return;
  }
  if (post) {
    const old = { toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure, shadows: renderer.shadowMap.enabled, shadowType: renderer.shadowMap.type };
    try {
      renderer.toneMapping = post.toneMapping === 'aces' ? THREE.ACESFilmicToneMapping : old.toneMapping;
      renderer.toneMappingExposure = post.exposure ?? old.exposure;
      if (post.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
      let chain = postChains.get(post);
      if (!chain) {
        const composer = new EffectComposer(renderer);
        composer.setPixelRatio(1);
        composer.setSize(shared.w, shared.h);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        let bokeh = null;
        if (dof) { bokeh = new SoftFocusPass(scene, camera, { focus: 2.5, aperture: 0.018, maxblur: 0.01 }); composer.addPass(bokeh); }
        let bloomPass = null;
        if (post.bloom) {
          const { strength, radius, threshold } = post.bloom;
          bloomPass = new UnrealBloomPass(new THREE.Vector2(shared.w, shared.h), strength, radius, threshold);
          composer.addPass(bloomPass);
        }
        composer.addPass(new OutputPass());
        chain = { composer, renderPass, bokeh, bloomPass };
        postChains.set(post, chain);
        (shared.postChains ||= []).push(chain);
      }
      chain.renderPass.scene = scene; chain.renderPass.camera = camera;
      // Sets animate world.post.bloom per frame (bolt and flash spikes), so copy it every render.
      if (chain.bloomPass && post.bloom) {
        chain.bloomPass.strength = post.bloom.strength;
        chain.bloomPass.radius = post.bloom.radius;
        chain.bloomPass.threshold = post.bloom.threshold;
      }
      if (chain.bokeh && dof) {
        chain.bokeh.scene = scene; chain.bokeh.camera = camera;
        chain.bokeh.hide = scene.userData.noDepth || [];
        chain.bokeh.uniforms.focus.value = dof.focus;
        if (scene.fog) chain.bokeh.materialBokeh.uniforms.uHaze.value.copy(scene.fog.color);
      }
      chain.composer.render(0);
    } finally {
      renderer.toneMapping = old.toneMapping;
      renderer.toneMappingExposure = old.exposure;
      renderer.shadowMap.enabled = old.shadows;
      renderer.shadowMap.type = old.shadowType;
    }
    return;
  }
  if (!dof) { renderer.render(scene, camera); return; }
  const f = focusChain();
  f.renderPass.scene = scene;
  f.renderPass.camera = camera;
  f.bokeh.scene = scene;
  f.bokeh.camera = camera;
  f.bokeh.hide = scene.userData.noDepth || [];
  f.bokeh.uniforms.focus.value = dof.focus;
  if (scene.fog) f.bokeh.materialBokeh.uniforms.uHaze.value.copy(scene.fog.color);
  f.composer.render(0);
}

function sceneDuration(cfg, canvas) {
  // Compiled sub-composition hosts may lose data-duration; config stays scene-local.
  const c = Number(cfg.duration);
  if (Number.isFinite(c) && c > 0) return c;
  const host = canvas.closest?.('[data-duration]');
  const d = Number(host?.getAttribute('data-duration'));
  if (Number.isFinite(d) && d > 0) return d;
  return Math.max(0.5, ...(cfg.rows || []).map((r) => (Number(r.localStart) || 0) + (Number(r.duration) || 0))) + 0.25;
}

const isBoothKind = (k) => k === 'booth' || k === 'punch';

// ---------------------------------------------------------------- pose application

function applyRobots(world, sim, t) {
  for (const [name, robot] of Object.entries(world.robots)) {
    const p = sim.robotPose(name, t);
    const seat = robot.seat;
    robot.root.position.set(seat.x + (p.wx || 0), seat.y, seat.z + (p.wz || 0));
    robot.root.rotation.y = seat.yaw + (p.yaw || 0);
    robot.apply({ ...p, bx: p.fx || 0 });
  }
}

function placeRigid(obj, pose) {
  if (!pose) return;
  obj.position.set(pose[0], pose[1], pose[2]);
  obj.rotation.order = 'YXZ';
  obj.rotation.set(pose[3], pose[4], pose[5]);
}

function applyTableProps(world, sim, t, acting) {
  const P = world.props;
  const paperVisible = t >= (acting.visibility.paper ?? -1e9);
  P.stack.block.visible = paperVisible;
  placeRigid(P.stack.block, sim.propPose('paper-block', t));
  P.stack.sheets.forEach((m, i) => {
    m.visible = paperVisible;
    placeRigid(m, sim.propPose(`paper-${i}`, t));
  });
  for (const np of world.nameplates) placeRigid(np.object, sim.propPose(np.id, t));
  placeRigid(P.mug.object, sim.propPose('mug', t));
  placeRigid(P.laptop.object, sim.propPose('laptop', t));
  placeRigid(P.paddle.object, sim.propPose('paddle', t));
  const g = sim.propPose('gavel', t);
  if (g) {
    g[5] = Math.min(g[5], 0.03); // the head never sinks into the sound block
    placeRigid(P.gavel.object, g);
  }
  world.table.group.position.y = sim.tableDy(t);
}

// ---------------------------------------------------------------- worlds

function mountTable(cfg, scene, assets, duration) {
  const world = buildTableSet(scene, assets);
  const shots = planTableShots(world, cfg.rows, duration);
  const acting = buildTableActing(cfg, world, assets.cues, shots);
  const sim = simulate({ duration, start: acting.start, robots: acting.robots, props: acting.props, tableImpulses: acting.tableImpulses });
  const hits = acting.hits || [];
  const camera = new THREE.PerspectiveCamera(36, WIDTH / HEIGHT, 0.1, 80);
  function update(t) {
    applyRobots(world, sim, t);
    applyTableProps(world, sim, t, acting);
    world.temple.update(t);
    const shot = activeShot(shots, t);
    const p = sampleShot(shot, t);
    const shake = impactShake(t, hits);
    applyCamera(camera, p, { offset: new THREE.Vector3(shake.x, shake.y, 0) });
    if (shot.kind === 'ots') {
      const speaker = world.robots[shot.subject];
      speaker.ballHead.getWorldPosition(focusPoint);
      return { dof: { focus: Math.max(0.5, camera.position.distanceTo(focusPoint)) } };
    }
    return null;
  }
  const focusPoint = new THREE.Vector3();
  return { world, camera, update, shots, sim, info: { shots: shots.map((s) => ({ row: s.row, cam: s.cam, t0: +s.t0.toFixed(2), kind: s.kind, coverage: s.coverage, facing: s.facing, fov: s.to?.fov ? +s.to.fov.toFixed(1) : undefined, pos: s.to?.pos?.toArray().map((v) => +v.toFixed(2)) })), bounds: measureSet(world) } };
}

function mountBooth(cfg, scene, assets, duration) {
  const world = buildBoothSet(scene, assets, cfg.agent, { kind: 'booth' });
  const shot = boothShot(world);
  const acting = buildBoothActing(cfg, world, assets.cues);
  const sim = simulate({ duration, start: acting.start, robots: acting.robots, props: acting.props });
  const camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 0.05, 50);
  const dist = shot.to.pos.distanceTo(shot.to.target);
  function update(t) {
    applyRobots(world, sim, t);
    if (world.props.mug) placeRigid(world.props.mug.object, sim.propPose('mug', t));
    const h = handheld(t, cfg.id, dist, shot.to.fov);
    const right = new THREE.Vector3(1, 0, 0);
    applyCamera(camera, shot.to, { offset: right.multiplyScalar(h.dx).add(new THREE.Vector3(0, h.dy, 0)), roll: h.roll, pan: h.pan });
  }
  return { world, camera, update, sim, info: { shots: [{ cam: shot.cam, t0: 0, kind: 'booth' }] } };
}

function mountPunch(cfg, scene, assets, duration) {
  const world = buildBoothSet(scene, assets, cfg.agent, { kind: 'punch' });
  const base = punchShot(world);
  const acting = buildPunchActing(cfg, world, assets.cues);
  const sim = simulate({ duration, start: acting.start, robots: acting.robots, props: [] });
  const camera = new THREE.PerspectiveCamera(34, WIDTH / HEIGHT, 0.05, 50);
  const head = new THREE.Vector3();
  const lungeAt = acting.lungeAt;
  function update(t) {
    applyRobots(world, sim, t);
    // punch-in: 4-frame fov snap at the lunge, then the camera keeps the face on the left
    const u = (t - lungeAt) / (4 / FPS);
    const fov = 34 - 6 * ease.expoOut(u);
    world.robot.ballHead.updateWorldMatrix(true, false);
    world.robot.ballHead.getWorldPosition(head);
    const framed = frameSphere({ centre: head, radius: ROBOT.ballRadius * world.robot.scale, dir: base.to.pos.clone().sub(head).normalize(), fov, fill: 0.5, ndcX: -0.36, ndcY: 0.08 });
    // keep the camera position fixed (the robot comes to us); only aim and fov follow
    const pos = base.to.pos;
    const aim = framed.target.clone().sub(framed.pos).normalize().multiplyScalar(pos.distanceTo(head)).add(pos);
    const shake = impactShake(t, [{ t: lungeAt + 0.1, amp: 0.012 }]);
    applyCamera(camera, { pos, target: aim, fov }, { offset: new THREE.Vector3(shake.x, shake.y, 0) });
  }
  return { world, camera, update, sim, info: { shots: [{ cam: base.cam, t0: 0, kind: 'punch' }] } };
}

// ---------------------------------------------------------------- mount

// Copy the shared renderer's frame into the composition canvas. During a whip pan
// the copy is smeared horizontally: 8 offset copies averaged (equal weights), which
// reads as motion blur along the pan.
function blit(ctx, src, canvas, smear) {
  const w = canvas.width, h = canvas.height;
  ctx.globalAlpha = 1;
  ctx.drawImage(src, 0, 0, w, h);
  if (!(smear > 2)) return;
  const k = 8;
  for (let i = 1; i < k; i++) {
    const dx = (i / (k - 1) - 0.5) * smear;
    ctx.globalAlpha = 1 / (i + 1);
    ctx.drawImage(src, dx, 0, w, h);
  }
  ctx.globalAlpha = 1;
}

async function mount(cfg, canvas) {
  const assets = await loadAssets();
  const { renderer, env } = sharedRenderer();
  // compose and render for the composition's own frame shape (4:5 in Episode 6)
  setFrame(canvas.width, canvas.height);
  setRenderSize(canvas.width, canvas.height);
  const scene = new THREE.Scene();
  scene.environment = env;
  scene.environmentIntensity = 0.38;
  const duration = sceneDuration(cfg, canvas);
  const kind = cfg.kind || 'table';
  const mounted = TOUR_KINDS[kind] ? await mountTour(cfg, scene, assets, duration, TOUR_KINDS[kind], renderer)
    : kind === 'booth' ? mountBooth(cfg, scene, assets, duration)
    : kind === 'punch' ? mountPunch(cfg, scene, assets, duration)
    : mountTable(cfg, scene, assets, duration);
  const { camera, update } = mounted;
  scene.userData.noDepth = [];
  scene.traverse((o) => { if (o.userData.noDepth) scene.userData.noDepth.push(o); });
  const ctx = canvas.getContext('2d');
  const start = Number(cfg.absoluteStart) || 0;

  function render(local) {
    const t = clamp(local, 0, duration);
    const extra = update(t);
    if (extra?.prerender) extra.prerender(renderer);
    renderFrame(scene, camera, extra?.dof, mounted.world?.post);
    blit(ctx, renderer.domElement, canvas, extra?.smear || 0);
  }

  // warm every shader variant (incl. the depth-of-field chain) inside buildReady
  const warm = mounted.warm || [0, ...(mounted.shots || []).filter((s) => s.kind === 'ots').map((s) => s.t0 + 0.3)];
  for (const t of warm) {
    const extra = update(Math.min(duration, t));
    if (extra?.prerender) extra.prerender(renderer);
    renderFrame(scene, camera, extra?.dof, mounted.world?.post);
  }
  window.addEventListener('hf-seek', (e) => {
    const local = Number(e.detail?.time) - start;
    // only the scene on screen draws; a margin covers the boundary frames
    if (!(local >= -2 / FPS && local <= duration + 2 / FPS)) return;
    render(local);
  });
  const now = Number(window.__hfThreeTime);
  render(Number.isFinite(now) && now - start >= 0 && now - start <= duration ? now - start : 0);
  window.__tribunal3d = window.__tribunal3d || {};
  window.__tribunal3d[cfg.id] = { ...mounted.info, render, duration, sim: mounted.sim, scene, camera };
  return true;
}

if (typeof window !== 'undefined' && typeof window.__tribunalResolve === 'function') {
  window.__tribunalResolve({ mount });
}

export { mount, isBoothKind };
