// Episode 6 look kit: the film post chain and the lighting/shading helpers every v4 scene adopts.
//
// OPT-IN. A look (src/look-<name>.js) returns `{ scene, camera, bloom, exposure, handles }`; add ONE
// field, `film`, to switch that look to this chain. Looks without `film` render exactly as before
// (lookdev/lookdev.js and src/scene.js only branch on `film`). A set passes the same object as
// `world.post = { film }`.
//
// film = {
//   size:     [w, h]   px. Look-dev canvas size (default [1920, 1080]); scene.js uses the composition size.
//   tone:     'aces' | 'agx' | 'neutral'                         (default 'aces')
//   exposure: 0.6..1.6, linear multiplier before tone mapping     (default 1)
//   msaa:     0 | 4      samples on the HDR target                (default 4; ~free on GPU, costly on SwiftShader)
//   ao:       { radius 0.05..0.5 m, thickness 0.5..2, distanceExponent 1..3, scale 0.5..2,
//               samples 8..24, intensity 0..1 }  or false.  GTAO + Poisson denoise.  COST: one extra
//               normal/depth scene render + 2 full-screen passes (the most expensive pass, ~35%).
//   dof:      { focus m (camera to subject), aperture 0.002..0.04 (blur per metre of defocus),
//               maxblur 0.002..0.02 (UV) }  or false.  BokehPass with the r181 depth fix (basic depth
//               packing) and `scene.userData.noDepth` objects hidden from the depth render.
//               COST: one depth-only scene render + one 40-tap pass (~25%).
//   bloom:    { strength 0..0.6, radius 0..1, threshold 0.7..1.2 (linear HDR) } or false.
//               UnrealBloom, 5 mips. COST: ~10%.
//   grade:    { vignette 0..0.6, grain 0..0.06, ca 0..0.004 (edge chromatic shift, UV),
//               lift [r,g,b] (shadow tint, 0..0.03), seed int }.  One full-screen pass, ~3%.
//               Grain is hashed from pixel + seed (+ frame in scene.js): deterministic.
// }
// Shadow maps render once per frame (the depth/normal passes reuse them).
//
// Helpers: environment(renderer, scene, hdriTex, opts)  HDRI -> PMREM env (+ optional backdrop)
//          reshadeRobot(robot, opts)                   clearcoat shell, glossy visor, lit face light
//                    opts: env, faceLight, eyeBoost, shell (hex), envMap (texture for shell/feet/visor),
//                          faceBoost (emissive multiplier on the visor; 1 = unchanged)
//          roomProbe(renderer, scene, { position, size, near, far, sigma, hide })
//                                                      PMREM cube of the set itself (call after
//                                                      whenTexturesReady); `hide` objects are left out
//          screenLight(w, h, color, intensity)         RectAreaLight sized to a screen
//          practical(kind, opts)                       warm/cool Spot or Point light, soft shadows
//          contactShadow(w, d, opacity)                soft decal under furniture (noDepth)
//          renderFilm(renderer, scene, camera, film, w, h, frame)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { contactShadowTexture } from './textures.js';

const TONES = { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping };
export const FILM_DEFAULTS = {
  size: [1920, 1080], tone: 'aces', exposure: 1, msaa: 4,
  ao: { radius: 0.18, thickness: 1, distanceExponent: 1.6, scale: 1, samples: 16, intensity: 0.9 },
  dof: { focus: 2, aperture: 0.01, maxblur: 0.008 },
  bloom: { strength: 0.25, radius: 0.5, threshold: 0.95 },
  grade: { vignette: 0.3, grain: 0.025, ca: 0.0012, lift: [0.004, 0.006, 0.012], seed: 7 },
};
const pick = (v, d) => (v === false ? false : v ? { ...d, ...v } : d);

// ------------------------------------------------------------------ passes
const hideNoDepth = (scene) => {
  const list = scene.userData.noDepth || [];
  const was = list.map((o) => o.visible);
  for (const o of list) o.visible = false;
  return () => list.forEach((o, i) => { o.visible = was[i]; });
};

// The scene's colour render; after it, shadow maps are frozen for the depth/normal passes.
class FilmRenderPass extends RenderPass {
  render(renderer, w, r, dt, mask) {
    super.render(renderer, w, r, dt, mask);
    renderer.shadowMap.autoUpdate = false;
  }
}
class FilmAOPass extends GTAOPass {
  render(renderer, w, r, dt, mask) {
    const restore = hideNoDepth(this.scene);
    try { super.render(renderer, w, r, dt, mask); } finally { restore(); }
  }
}
class FilmBokehPass extends BokehPass {
  constructor(scene, camera, p) {
    super(scene, camera, p);
    // r181: the half-float RGBA depth packing decodes wrong; read raw depth instead
    this._materialDepth.depthPacking = THREE.BasicDepthPacking;
    this.materialBokeh.defines.DEPTH_PACKING = 0;
    // MeshDepthMaterial with BasicDepthPacking writes 1 - z in r181: invert on read
    this.materialBokeh.fragmentShader = this.materialBokeh.fragmentShader.replace(
      'return texture2D( tDepth, screenPosition ).x;',
      'return 1.0 - texture2D( tDepth, screenPosition ).x;',
    );
    this.materialBokeh.needsUpdate = true;
  }
  render(renderer, w, r, dt, mask) {
    const restore = hideNoDepth(this.scene);
    try { super.render(renderer, w, r, dt, mask); } finally { restore(); }
  }
}

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uSeed: { value: 0 }, uGrain: { value: 0.02 }, uVignette: { value: 0.3 },
    uCA: { value: 0.001 }, uLift: { value: new THREE.Vector3() }, uAspect: { value: 16 / 9 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uSeed, uGrain, uVignette, uCA, uAspect; uniform vec3 uLift;
    varying vec2 vUv;
    float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main(){
      vec2 d = vUv - 0.5;
      vec2 off = d * uCA * dot(d, d) * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float r = length(d * vec2(uAspect, 1.0)) / length(vec2(uAspect, 1.0) * 0.5);
      c *= 1.0 - uVignette * smoothstep(0.35, 1.05, r);
      c += uLift * (1.0 - smoothstep(0.0, 0.35, dot(c, vec3(0.299, 0.587, 0.114))));
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      float n = h12(gl_FragCoord.xy + uSeed * 17.31) + h12(gl_FragCoord.yx * 1.37 + uSeed * 3.7) - 1.0;
      c += n * uGrain * (0.35 + 0.65 * (1.0 - abs(l * 2.0 - 1.0)));
      gl_FragColor = vec4(c, 1.0);
    }`,
};

const chains = new WeakMap();
function buildChain(renderer, scene, camera, film, w, h) {
  const target = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: film.msaa ?? 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1);
  composer.setSize(w, h);
  const render = new FilmRenderPass(scene, camera);
  composer.addPass(render);
  const ao = pick(film.ao, FILM_DEFAULTS.ao);
  let aoPass = null;
  if (ao) {
    aoPass = new FilmAOPass(scene, camera, w, h);
    aoPass.updateGtaoMaterial({ radius: ao.radius, thickness: ao.thickness, distanceExponent: ao.distanceExponent, scale: ao.scale, samples: ao.samples });
    aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    aoPass.blendIntensity = ao.intensity;
    composer.addPass(aoPass);
  }
  const dof = pick(film.dof, FILM_DEFAULTS.dof);
  let dofPass = null;
  if (dof) { dofPass = new FilmBokehPass(scene, camera, dof); composer.addPass(dofPass); }
  const bloom = pick(film.bloom, FILM_DEFAULTS.bloom);
  let bloomPass = null;
  if (bloom) { bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), bloom.strength, bloom.radius, bloom.threshold); composer.addPass(bloomPass); }
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  return { composer, render, aoPass, dofPass, bloomPass, grade, w, h };
}

// Render one frame of `scene` through the film chain. Restores the renderer state it changes.
export function renderFilm(renderer, scene, camera, film, w, h, frame = 0) {
  let c = chains.get(film);
  if (!c) { c = buildChain(renderer, scene, camera, film, w, h); chains.set(film, c); }
  if (c.w !== w || c.h !== h) { c.composer.setSize(w, h); if (c.aoPass) c.aoPass.setSize(w, h); c.w = w; c.h = h; }
  for (const p of [c.render, c.aoPass, c.dofPass]) if (p) { p.scene = scene; p.camera = camera; }
  // per-frame values (sets may animate focus, bloom and grade)
  const dof = pick(film.dof, FILM_DEFAULTS.dof);
  if (c.dofPass && dof) {
    const u = c.dofPass.uniforms;
    u.focus.value = dof.focus; u.aperture.value = dof.aperture; u.maxblur.value = dof.maxblur;
    u.nearClip.value = camera.near; u.farClip.value = camera.far; u.aspect.value = camera.aspect;
  }
  const bloom = pick(film.bloom, FILM_DEFAULTS.bloom);
  if (c.bloomPass && bloom) { c.bloomPass.strength = bloom.strength; c.bloomPass.radius = bloom.radius; c.bloomPass.threshold = bloom.threshold; }
  const g = { ...FILM_DEFAULTS.grade, ...(film.grade || {}) };
  const gu = c.grade.uniforms;
  gu.uSeed.value = (g.seed || 0) * 101 + (frame % 4096); gu.uGrain.value = g.grain; gu.uVignette.value = g.vignette;
  gu.uCA.value = g.ca; gu.uLift.value.set(...g.lift); gu.uAspect.value = w / h;
  const old = { tm: renderer.toneMapping, ex: renderer.toneMappingExposure, au: renderer.shadowMap.autoUpdate };
  try {
    renderer.toneMapping = TONES[film.tone || 'aces'] ?? THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = film.exposure ?? 1;
    renderer.shadowMap.autoUpdate = true;
    c.composer.render(0);
  } finally {
    renderer.toneMapping = old.tm; renderer.toneMappingExposure = old.ex; renderer.shadowMap.autoUpdate = old.au;
  }
}

// ------------------------------------------------------------------ environment
// hdriTex: an equirect texture (craft.js hdri(p).tex). intensity 0.1..1.5; rotation radians (Y);
// background: true (the HDRI itself, e.g. a city seen through a window; DOF blurs it), a colour, or null.
export function environment(renderer, scene, hdriTex, { intensity = 0.4, rotation = 0, background = null, backgroundIntensity = 1, backgroundBlurriness = 0, backgroundTex = null } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(hdriTex).texture;
  pmrem.dispose();
  scene.environment = env;
  scene.environmentIntensity = intensity;
  scene.environmentRotation = new THREE.Euler(0, rotation, 0);
  if (background === true) {
    scene.background = backgroundTex || hdriTex;
    scene.backgroundIntensity = backgroundIntensity;
    scene.backgroundBlurriness = backgroundBlurriness;
  } else if (background) scene.background = new THREE.Color(background);
  return env;
}

// ------------------------------------------------------------------ robot shading
// Re-shade a createRobot() rig in place: clearcoat shell, glossy visor, brighter eyes, and a small
// agent-coloured point light in front of the face (the face lights the desk a little).
// faceLight: candela (0..1.5 at this scale); env: shell envMapIntensity (0.6..1.4).
// envMap (optional): a roomProbe() texture so the shell reflects the real room and screen.
// faceBoost (optional, default 1): multiplies the visor's emissive colour so dark-tinted faces
// (e.g. #D97757 at the rig's 0.24 tint) read as their agent colour under film tone mapping.
export function reshadeRobot(robot, { env = 1, faceLight = 0.5, eyeBoost = 1.6, shell = null, envMap = null, faceBoost = 1 } = {}) {
  const m = robot.mats;
  const phys = (src, extra) => {
    const p = new THREE.MeshPhysicalMaterial({
      name: src.name, color: src.color.clone(), roughness: src.roughness, metalness: src.metalness,
      emissive: src.emissive.clone(), emissiveIntensity: src.emissiveIntensity, map: src.map, envMapIntensity: env, ...extra,
    });
    if (envMap) p.envMap = envMap;
    return p;
  };
  const swap = {
    shell: phys(m.shell, { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color('#FFF4E6'), ...(shell ? { color: new THREE.Color(shell) } : {}) }),
    feet: phys(m.feet, { roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
    screen: phys(m.screen, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: env * 1.3 }),
  };
  robot.root.traverse((o) => {
    if (!o.isMesh) return;
    for (const k of Object.keys(swap)) if (o.material === m[k]) o.material = swap[k];
  });
  Object.assign(m, swap);
  // apply() rewrites emissiveIntensity every pose, so brighten through the emissive colour instead
  m.eyes.emissive.multiplyScalar(eyeBoost);
  m.glow.emissive.multiplyScalar(1.3);
  if (faceBoost !== 1) m.screen.emissive.multiplyScalar(faceBoost);
  let light = null;
  if (faceLight > 0) {
    light = new THREE.PointLight(robot.color, faceLight, 1.2, 2);
    light.position.set(1.15, 1.23, 0); // model units: in front of the screen face (+X)
    robot.ballHead.add(light);
  }
  if (robot.blob) robot.blob.visible = false; // seated: GTAO gives the contact
  return { light };
}

// A reflection probe of the built room (PMREM of a cube render from `position`), for materials
// that should mirror the real set: robot shells, glossy desks. Objects in `hide` (e.g. the robots
// themselves) are left out of the capture. Call once, after the set is built. Returns a texture
// for `material.envMap` (it does not replace scene.environment).
export function roomProbe(renderer, scene, { position = new THREE.Vector3(0, 1, 0), size = 256, near = 0.05, far = 30, sigma = 0, hide = [] } = {}) {
  const pm = new THREE.PMREMGenerator(renderer);
  const vis = hide.map((o) => o.visible);
  hide.forEach((o) => { o.visible = false; });
  const restoreND = hideNoDepth(scene);
  let rt;
  try { rt = pm.fromScene(scene, sigma, near, far, { size, position }); } finally {
    restoreND(); hide.forEach((o, i) => { o.visible = vis[i]; }); pm.dispose();
  }
  return rt.texture;
}

// ------------------------------------------------------------------ lights
let rectInit = false;
// A screen's emitted light. w, h in metres (match the panel); intensity ~2..12 (nits-like).
export function screenLight(w, h, color = '#CFE0FF', intensity = 6) {
  if (!rectInit) { RectAreaLightUniformsLib.init(); rectInit = true; }
  return new THREE.RectAreaLight(color, intensity, w, h);
}
// kind 'spot' (desk lamp, wall washer) or 'point' (pendant, bulb). Warm 2700 K = '#FFB46B'.
// intensity in candela at this scale (0.5..6); shadow: map size or 0.
export function practical(kind, { color = '#FFB46B', intensity = 2, distance = 4, angle = 0.7, penumbra = 0.8, shadow = 1024, radius = 6, bias = -0.0004 } = {}) {
  const l = kind === 'spot' ? new THREE.SpotLight(color, intensity, distance, angle, penumbra, 2) : new THREE.PointLight(color, intensity, distance, 2);
  if (shadow) {
    l.castShadow = true;
    l.shadow.mapSize.set(shadow, shadow);
    l.shadow.radius = radius;
    l.shadow.bias = bias;
    l.shadow.normalBias = 0.01;
    l.shadow.camera.near = 0.05;
  }
  return l;
}
// Soft contact decal: w x d metres, lies on y = 0 of its parent; hidden from depth/AO passes.
export function contactShadow(scene, w, d, opacity = 0.5) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: contactShadowTexture(), transparent: true, depthWrite: false, opacity, color: '#000' }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.003;
  m.renderOrder = 1;
  (scene.userData.noDepth ||= []).push(m);
  return m;
}
