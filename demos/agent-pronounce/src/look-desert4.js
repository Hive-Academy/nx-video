// Episode 6, desert act, direction v4 look: an open temple-building site in the dunes at golden
// hour. A monumental wide screen is set into a sandstone facade, the Ptah colossus (src/ptah-colossus.js,
// the museum scan: a 24 m figure on its plinth) stands in the sand beyond it, three hauling crews drag
// blocks up ramps and the two visitors sit in their office chairs on the paved forecourt. Every robot is
// a bodied robot (src/robot-body.js): seated in the kit chair before the rise, standing after it (e).
//   buildDesert4Look(assets, renderer, { shot: 'a'|'b'|'c'|'d'|'e', aspect })
//     -> { scene, camera, exposure, film, handles, info }
// Metres throughout (crew robots 1.5 m standing, visitors 1.27 m). +Z points from the facade toward the audience; the
// screen faces +Z. Static and deterministic: every variation is seeded through util.hash.
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { assetUrl } from './assets.js';
import { glb, hdri, fit, shadows } from './craft.js';
import { environment, contactShadow, roomProbe, loungeChair, screenLight as kitScreenLight } from './look-kit.js';
import { ROBOT_SCALE } from './look-workspace.js';
import { createPtahColossus } from './ptah-colossus.js';
import { brazier } from './temple.js';
import { hash, hashRange } from './util.js';
import { createBodiedRobot, BODY } from './robot-body.js';
import { stone } from './desert4-stone.js';
import {
  V, planarUV, pbr, heightFog, mesh, battered, cornice, torusRoll, reliefTexture, rope, ropeMaterial,
  blockCourses, ramp, sledge, scaffold, hazeCard, shaft, motes, puffs, RoundedBoxGeometry,
} from './desert4-props.js';

const RS = 0.38; // the series ball-robot scale this set was laid out for (it sizes the chair)
// The visitors' swivel chair keeps the workspace's robot-to-chair ratio: there the chair is
// 1.17 x 0.63 = 0.737 tall for a robot at ROBOT_SCALE (0.25). Here the robot is at RS (0.38, the
// crews' size), so the chair scales up by RS / ROBOT_SCALE to 1.12 m, with the same cushion.
const CHAIR_K = RS / ROBOT_SCALE;
const CHAIR = { h: 1.17 * 0.63 * CHAIR_K, cushion: 0.06 * CHAIR_K, sink: 0.03 * CHAIR_K };
// The workspace robot treatment (approved two-shot): warm ceramic shell, dark glass visor with
// an agent-colour tint, creased normals. faceLight and envMap are set per use.
const ROBOT_LOOK = { shell: '#CCC3B5', env: 0.9, eyeBoost: 2.6, glass: 0.55, smooth: Math.PI / 4 };
// Outdoors the sky is far brighter than the workspace room, so the mirror visor and the shell
// take less of it: the visor stays dark glass with the agent tint, the shell keeps its shading.
const OUTDOOR_ENV = { shell: 0.6, screen: 0.45 };
// Bodied robot sizes (head radius u, src/robot-body.js). Visitors keep the workspace robot-to-chair
// ratio (0.15 in the 0.737 m chair, here x CHAIR_K: 1.27 m standing). Crews are the approved body-d
// crew size (0.27: 1.5 m standing).
const VIS_U = 0.15 * CHAIR_K;
const CREW_U = 0.27;
// A bodied robot with the workspace treatment and the outdoor env levels. Adds root / name / face()
// so the framing and crop checks below treat every robot alike.
function bodied(assets, name, { color = null, size, faceLight = 0, faceBoost = 1, quality = 'high' }) {
  const b = createBodiedRobot(assets, { agent: name, color, size, quality, shade: { ...ROBOT_LOOK, faceLight, faceBoost } });
  if (color) b.mats.screen.emissive.set(color).multiplyScalar(ROBOT_LOOK.glass * faceBoost); // crew hue on the visor tint
  b.mats.shell.envMapIntensity = OUTDOOR_ENV.shell;
  b.mats.screen.envMapIntensity = OUTDOOR_ENV.screen;
  b.root = b.group;
  b.name = name;
  b.face = () => b.handles.headPivot.localToWorld(V(0, BODY.headUp * size, 0.8 * size));
  return b;
}
export const SCREEN = { w: 14.4, h: 6.0, x: 0, y: 4.8, z: -29.86, border: 0.9, face: -30 };
// app.png is 16:9; the screen is 2.4:1, so cover-crop to the top 800 rows (the UI that matters).
export const SCREEN_CROP = { repeatY: 800 / 1080, offsetY: 1 - 800 / 1080 };
// Private names on the app still, in app.png pixels (1920 x 1080): the workspace list in the
// sidebar, the session cards and the voice status. Painted over with solid dark rectangles.
export const SCREEN_MASKS = [[6, 112, 236, 142], [980, 436, 790, 236], [1456, 86, 262, 32]];
const FACADE = { w: 20, h: 11, d: 5, front: -30, batter: 0.04 };
const SUN_DIR = V(-0.95, 0.27, 0.14).normalize(); // toward the sun: low, hard camera-left, raking across the facade
const CREW = { lead: 5.25, pairs: [2.4, 3.65], stagger: 0.5, lateral: [0.72, 0.84] };
// Crew hues, pushed apart for the read at phone size: Antigravity cyan-azure, Cursor violet.
const CREW_HUE = { Antigravity: '#1FB2F2', Cursor: '#B67BFF' };
// The Ptah colossus comes only through the createPtahColossus(assets, opts) API
// ({ group, height, handles, setState }), so a redesigned colossus drops in without edits here.
// The scan build is used at its native size (a 24 m figure on its plinth, about 29.4 m overall), as in
// the approved colossus stills. It faces +Z and has its origin at the plinth base. Never frame it
// tighter than waist-up: the scan is soft up close (user-approved framing rule).
export const PTAH = { at: [29.0, -66.0], faceAt: [0, -14] };
const SKY = 'hdri/mpumalanga_veld_puresky_2k.hdr';

// Per-shot cameras (focal length on a 36 mm gate), visitor seats and post hints.
// Seats: chair centre [x, z], what the chair faces, extra yaw, what the robot looks at (look: 'screen',
// 'camera', 'ptah' or the other visitor's name; seated-turn when it is a name).
// focus: 'seats' puts the focal plane on the visitors' faces (measured after they are placed).
// ptah: the colossus state (setState). stand: the visitors stand beside their empty chairs.
const SHOTS = {
  a: {
    pos: [3.4, 0.82, -10.2], target: [-4.6, 1.75, -17.6], mm: 28, dof: { focus: 'seats', aperture: 0.0016, maxblur: 0.005 }, screenOn: false, ptah: { voice: 0, eyeGlow: 0 },
    seats: [{ name: 'Claude', chair: [0.15, -13.9], face: 'camera', yaw: -0.55, look: 'Codex' }, { name: 'Codex', chair: [0.05, -12.48], face: 'camera', yaw: -0.3, look: 'camera' }],
  },
  b: {
    pos: [1.0, 1.1, -9.8], target: [1.4, 4.75, -30], mm: 28, dof: { focus: 22.0, aperture: 0.0002, maxblur: 0.002 }, screenOn: true, ptah: { voice: 0.5, eyeGlow: 0.5 },
    seats: [{ name: 'Claude', chair: [-0.2, -16.8], face: 'screen', yaw: 0, look: 'Codex' }, { name: 'Codex', chair: [2.1, -17.2], face: 'screen', yaw: 0, look: 'screen' }],
  },
  c: {
    pos: [0.45, 0.8, -12.9], target: [0.1, 4.0, -30], mm: 35, dof: { focus: 17.0, aperture: 0.0004, maxblur: 0.004 }, screenOn: true, ptah: { voice: 0.3, eyeGlow: 0.4 },
    seats: [{ name: 'Claude', chair: [0.6, -20.0], face: 'screen', yaw: 0, look: 'screen' }, { name: 'Codex', chair: [2.2, -20.3], face: 'screen', yaw: 0, look: 'screen' }],
  },
  d: {
    pos: null, target: null, mm: 35, dof: { focus: 4.6, aperture: 0.0025, maxblur: 0.007 }, screenOn: true, ptah: { voice: 0.3, eyeGlow: 0.4 },
    seats: [{ name: 'Claude', chair: [-0.6, -13.0], face: 'screen', yaw: 0, look: 'screen' }, { name: 'Codex', chair: [1.6, -13.4], face: 'screen', yaw: 0, look: 'screen' }],
  },
  // e: the giant rises, a low hero angle. 18 mm (24 mm cropped the crown once the scan colossus
  // went to its native 29.4 m), about 42 m from the colossus and tilted up about 8.5 degrees: the
  // whole figure on its plinth, a wide shot (the framing rule allows waist-up at the tightest). The two visitors stand 1.9 m and 2.45 m in front of the
  // lens, seen from the rear three-quarters, looking up. The colossus sits at about 0.72 of the
  // frame width, plinth on the horizon, crown near the top edge. The facade's side is at the left
  // edge as context. The head turns a little toward the visitors (headYaw), and eyeGain lifts the
  // eye emissive from the scene side so the eyes read at 49 m. The rim is a spot with a distance
  // cutoff, so it lights the giant but not the visitors. Layout maths: lookdev/e-geom.mjs (args: camX camZ camHeight offsetDeg tiltDeg).
  e: {
    pos: [42.8, 0.84, -26.3], target: [29.37, 3.9, -41.12], mm: 18, dof: { focus: 'seats', aperture: 0.00012, maxblur: 0.003 }, screenOn: true,
    ptah: { voice: 0.2, eyeGlow: 1, headYaw: 0.4, headPitch: 0.1 }, eyeGain: 4,
    haze: true, rim: true, bounce: true,
    // Codex is 0.15 m nearer the lens than in the integration pass (it was 29.2 % of the frame height)
    seats: [{ name: 'Claude', chair: [37.19, -28.77], at: [40.17, -28.3], face: 'ptah', yaw: -0.4, look: 'ptah', stand: true, chairYaw: 0.6 }, { name: 'Codex', chair: [41.86, -31.66], at: [40.70, -29.05], face: 'ptah', yaw: -0.6, look: 'ptah', stand: true, chairYaw: -0.9 }],
  },
};

// ------------------------------------------------------------------ terrain
const ridge = (u) => 1 - Math.abs(Math.sin(u));
// Wind-built dunes: two crossing ridge fields under a slow domain warp, 0..1.
function duneField(x, z) {
  const w = Math.sin(x * 0.011 + z * 0.007) * 2.2 + Math.cos(z * 0.0043 - x * 0.002) * 1.4;
  const a = Math.pow(ridge(x * 0.021 + z * 0.012 + w), 1.8);
  const b = Math.pow(ridge(x * 0.047 - z * 0.019 + w * 0.6 + 1.3), 2.0);
  const c = 0.5 + 0.5 * Math.sin(x * 0.13 + z * 0.09);
  return 0.68 * a + 0.26 * b + 0.06 * c;
}
// Sand patches over the paving (-1..1), small and irregular.
const patch = (x, z) => 0.5 * Math.sin(x * 0.9 + Math.sin(z * 0.7) * 1.3) * Math.cos(z * 0.8 - x * 0.3) + 0.3 * Math.sin(x * 2.1 + z * 1.7 + 1.1) + 0.2 * Math.sin(x * 0.23 - z * 0.31);
// Distance from (x, z) to an axis-aligned rectangle.
const rectDist = (x, z, x0, x1, z0, z1) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
const PAVE = { x0: -13, x1: 13, z0: -29.6, z1: -6, top: 0.06 };
// Ground height: paving level inside the site with sand blown over it in patches, drifts banked
// against the podium, facade and tower, dunes rising beyond about 40 m.
export function groundAt(x, z) {
  const r = Math.hypot(x * 0.85, z + 20);
  const flat = THREE.MathUtils.smoothstep(r, 38, 78);
  const edge = THREE.MathUtils.smoothstep(rectDist(x, z, PAVE.x0, PAVE.x1, PAVE.z0, PAVE.z1), 0, 4);
  let site = 0.0 + 0.16 * edge + 0.07 * edge * patch(x * 0.5, z * 0.5);
  const wall = Math.min(rectDist(x, z, -10.75, 10.75, -30, -27.4), rectDist(x, z, -10.3, 10.3, -35, -30), rectDist(x, z, -21, -12, -36, -30));
  site += 0.6 * Math.exp(-wall / 1.15) * (0.75 + 0.25 * Math.sin(x * 0.9 + z * 0.4));
  const A = 2 + 7 * THREE.MathUtils.smoothstep(r, 40, 170) + Math.min(10, 0.03 * Math.max(0, r - 170));
  const dunes = A * duneField(x, z) - 0.6;
  return site * (1 - flat) + dunes * flat;
}

export async function buildDesert4Look(assets, renderer, { shot = 'b', aspect = 16 / 9, ptahQuality = 'high' } = {}) {
  const S = SHOTS[shot] || SHOTS.b;
  const scene = new THREE.Scene();
  const handles = { crews: [], visitors: [], chairs: [], braziers: [] };

  // ---------------------------------------------------------------- sky, IBL, sun
  const sky = await hdri(SKY);
  // rotate the HDRI so its sun sits on SUN_DIR (equirect u = atan2(z, x) / 2pi + 0.5)
  const hdriAz = (sky.sunU - 0.5) * Math.PI * 2;
  const wantAz = Math.atan2(SUN_DIR.z, SUN_DIR.x);
  const rotY = hdriAz - wantAz;
  // look kit: PMREM image light + the HDRI as backplate (the kit rotates the env; the backplate rotation is set here)
  environment(renderer, scene, sky.tex, { intensity: 0.6, rotation: rotY, background: true, backgroundIntensity: 1.0 });
  scene.backgroundRotation.set(0, rotY, 0);

  const sun = new THREE.DirectionalLight('#FFC48A', 3.7);
  // the shadow box reaches the colossus at (29, -66): its self-shadowing and its long shadow on
  // the dunes read in b and e
  sun.position.copy(SUN_DIR).multiplyScalar(130).add(V(8, 0, -38));
  sun.target.position.set(8, 0, -38);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 52, bottom: -52, near: 10, far: 300 });
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#8FB0E6', '#A88C6C', 0.4);
  scene.add(hemi);
  handles.sun = sun;

  // ---------------------------------------------------------------- materials
  // Three stone sets, all world-triplanar with a second rotated sample and a macro tint to
  // break the tiling, sand in the joints and a darker band where the sand meets the wall.
  const SAND = '#D8C2A0';
  const facadeMat = stone(pbr('sandstone_blocks_08', { color: '#D2CCC4', normal: 1.0, env: 0.8 }), { scale: 3.4, tintA: '#F4EDE3', tintB: '#D6CABA', sand: SAND, ground: 0.9, drift: 0.3, band: 1.5, bandDark: 0.74 });
  const paveMat = stone(pbr('sandstone_blocks_08', { color: '#C7A584', normal: 1.0, env: 0.22, spec: 0.15 }), { scale: 2.2, tintA: '#E6BE90', tintB: '#B98E66', sand: '#A9845C', ground: -1, drift: 0.001, band: 0.001, bandDark: 1, joint: 0.95, cover: 0.3 });
  const carve = (o = {}) => stone(pbr('worn_rock_natural_01', { color: '#D8CFC2', normal: 0.9, env: 0.8 }), { scale: 2.2, tintA: '#F3ECE2', tintB: '#D9CCBA', sand: SAND, ground: 0.9, drift: 0.25, band: 1.2, ...o });
  const carveMat = carve();
  const blockMat = stone(pbr('old_sandstone_02', { color: '#D8CEBF', normal: 0.9, env: 0.8 }), { scale: 1.3, tintA: '#F5EEE4', tintB: '#D8CBB8', sand: SAND, ground: 0.05, drift: 0.22, band: 0.8, bandDark: 0.8 });
  const rubbleMat = stone(pbr('worn_rock_natural_01', { color: '#D4C8B6', normal: 1.0, env: 0.8 }), { scale: 2.6, tintA: '#EFE6DA', tintB: '#D2C3AE', sand: SAND, ground: 0.05, drift: 0.35, band: 0.9, joint: 1.0 });
  const woodMat = pbr('wood_planks', { color: '#C9A47E', normal: 0.8, env: 0.7 });
  const sandMat = stone(pbr('sand_01', { color: '#F4DDB8', normal: 0.45, env: 0.7 }), { scale: 5.0, tintA: '#FFFFFF', tintB: '#EEDCC0', sand: SAND, ground: -100, drift: 0.001, band: 0.001, bandDark: 1, joint: 0 });
  sandMat.vertexColors = true;
  const gold = new THREE.MeshStandardMaterial({ color: '#E2B35C', metalness: 1, roughness: 0.3, envMapIntensity: 1.3 });
  const lapis = new THREE.MeshStandardMaterial({ color: '#244A9A', roughness: 0.55, envMapIntensity: 0.6 });
  const leather = new THREE.MeshStandardMaterial({ color: '#5B3A22', roughness: 0.75 });
  const ropeMat = ropeMaterial();

  // ---------------------------------------------------------------- ground: near detail, far dunes to the horizon
  const terrain = (size, segs, cx, cz, below) => {
    const g = new THREE.PlaneGeometry(size[0], size[1], segs[0], segs[1]);
    g.rotateX(-Math.PI / 2);
    g.translate(cx, 0, cz);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, groundAt(x, z) - (below ? below(x, z) : 0));
      // crests paler, troughs and wind-packed bands darker
      const n = duneField(x, z);
      const band = 0.5 + 0.5 * Math.sin(x * 0.07 + z * 0.05) * Math.sin(z * 0.11 - x * 0.03);
      const v = 0.82 + 0.14 * n + 0.06 * band;
      col[i * 3] = v; col[i * 3 + 1] = v * 0.975; col[i * 3 + 2] = v * 0.94;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    planarUV(g, 3.6);
    const m = new THREE.Mesh(g, sandMat);
    m.receiveShadow = true;
    m.castShadow = size[0] < 1000;
    scene.add(m);
    return m;
  };
  const NEAR = { x0: -170, x1: 170, z0: -230, z1: 60 };
  terrain([NEAR.x1 - NEAR.x0, NEAR.z1 - NEAR.z0], [567, 483], (NEAR.x0 + NEAR.x1) / 2, (NEAR.z0 + NEAR.z1) / 2);
  // the far sheet ducks under the near one inside its footprint so the two never fight
  terrain([3200, 3200], [320, 320], 0, -300, (x, z) => 0.8 * (1 - THREE.MathUtils.smoothstep(rectDist(x, z, NEAR.x0 + 12, NEAR.x1 - 12, NEAR.z0 + 12, NEAR.z1 - 12), 0, 10)));

  const site = new THREE.Group();
  scene.add(site);
  // the paved forecourt; the sand surface pokes through it in patches and covers its edges
  site.add(mesh(new THREE.BoxGeometry(PAVE.x1 - PAVE.x0, 0.12, PAVE.z1 - PAVE.z0), paveMat, [(PAVE.x0 + PAVE.x1) / 2, PAVE.top - 0.06, (PAVE.z0 + PAVE.z1) / 2], { cast: false }));

  // ---------------------------------------------------------------- facade and screen
  const top = FACADE.w - 2 * FACADE.batter * FACADE.h;
  site.add(mesh(battered(FACADE.w, FACADE.h, FACADE.d, { batter: FACADE.batter, tile: 4.2 }), facadeMat, [0, 0, FACADE.front - FACADE.d / 2]));
  // cavetto cornice + torus roll along the top, corner rolls down the sides
  site.add(mesh(cornice(top + 0.6, { h: 1.5, out: 1.0 }), carveMat, [0, FACADE.h, FACADE.front - 0.35]));
  site.add(mesh(torusRoll(top + 0.4, 0.2), carveMat, [0, FACADE.h + 0.05, FACADE.front - 0.05], { rot: [0, 0, Math.PI / 2] }));
  for (const s of [-1, 1]) {
    const hw = FACADE.w / 2 - FACADE.batter * FACADE.h / 2 - 0.06;
    site.add(mesh(torusRoll(FACADE.h + 0.1, 0.2), carveMat, [s * hw, FACADE.h / 2, FACADE.front - 0.05], { rot: [0, 0, s * FACADE.batter] }));
  }
  // relief geometry carrying a 0..1 uv1 across its face for the carved bump texture
  const reliefBox = (bw, bh, bd, tile = 2.4) => {
    const geo = planarUV(new THREE.BoxGeometry(bw, bh, bd), tile);
    const pp = geo.attributes.position;
    const u1 = new Float32Array(pp.count * 2);
    for (let i = 0; i < pp.count; i++) { u1[i * 2] = pp.getX(i) / bw + 0.5; u1[i * 2 + 1] = pp.getY(i) / bh + 0.5; }
    geo.setAttribute('uv1', new THREE.BufferAttribute(u1, 2));
    return geo;
  };
  const bumped = (t, scale) => { const m = carve(); m.bumpMap = t; m.bumpScale = scale; t.channel = 1; return m; };
  {
    // a band of relief under the cornice
    const band = reliefTexture(41, 256, 1024, 1);
    band.wrapS = band.wrapT = THREE.RepeatWrapping;
    band.center.set(0.5, 0.5); band.rotation = Math.PI / 2; band.repeat.set(1, 10);
    site.add(mesh(reliefBox(top - 1.4, 0.75, 0.16), bumped(band, 3.2), [0, FACADE.h - 0.55, FACADE.front + 0.05]));
  }
  // raised relief pilasters either side of the frame
  for (const s of [-1, 1]) {
    const t = reliefTexture(60 + s, 256, 1024, 1);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2.0);
    site.add(mesh(reliefBox(1.0, 9.0, 0.22), bumped(t, 3.0), [s * 8.85, 1.0 + 4.5, FACADE.front + 0.05]));
  }

  // the carved frame: four relief bars proud of the facade, gold lip, lapis fillet
  const frame = new THREE.Group();
  frame.name = 'screenFrame';
  {
    const { w, h, x, y, border: b, face } = SCREEN;
    const proud = 0.5;
    const bar = (bw, bh, cx, cy, vertical, seed) => {
      const t = reliefTexture(seed, 256, 1024, 1);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      const len = vertical ? bh : bw, thick = vertical ? bw : bh;
      t.repeat.set(1, len / (thick * 3.2));
      if (!vertical) { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; t.repeat.set(len / (thick * 3.2), 1); }
      const geo = planarUV(new RoundedBoxGeometry(bw, bh, proud, 2, 0.06), 2.2);
      const u1 = new Float32Array(geo.attributes.position.count * 2), pp = geo.attributes.position;
      for (let i = 0; i < pp.count; i++) { u1[i * 2] = pp.getX(i) / bw + 0.5; u1[i * 2 + 1] = pp.getY(i) / bh + 0.5; }
      geo.setAttribute('uv1', new THREE.BufferAttribute(u1, 2));
      frame.add(mesh(geo, bumped(t, 4), [cx, cy, face + proud / 2]));
    };
    bar(w + 2 * b, b, x, y + h / 2 + b / 2, false, 71);
    bar(w + 2 * b, b, x, y - h / 2 - b / 2, false, 72);
    bar(b, h, x - w / 2 - b / 2, y, true, 73);
    bar(b, h, x + w / 2 + b / 2, y, true, 74);
    // gold inlay: an inner lip around the glass and a thin outer line
    const lip = 0.07;
    for (const [bw, bh, cx, cy] of [[w + 2 * lip, lip, x, y + h / 2 + lip / 2], [w + 2 * lip, lip, x, y - h / 2 - lip / 2], [lip, h, x - w / 2 - lip / 2, y], [lip, h, x + w / 2 + lip / 2, y]]) {
      frame.add(mesh(new THREE.BoxGeometry(bw, bh, 0.52), gold, [cx, cy, face + 0.26], { cast: false }));
    }
    const ow = w + 2 * b, oh = h + 2 * b, ln = 0.045;
    for (const [bw, bh, cx, cy] of [[ow - 0.3, ln, x, y + oh / 2 - 0.15], [ow - 0.3, ln, x, y - oh / 2 + 0.15], [ln, oh - 0.3, x - ow / 2 + 0.15, y], [ln, oh - 0.3, x + ow / 2 - 0.15, y]]) {
      frame.add(mesh(new THREE.BoxGeometry(bw, bh, 0.04), gold, [cx, cy, face + 0.505], { cast: false }));
    }
    // lapis fillet just outside the gold lip
    for (const [bw, bh, cx, cy] of [[w + 0.5, 0.12, x, y + h / 2 + 0.16], [w + 0.5, 0.12, x, y - h / 2 - 0.16], [0.12, h + 0.2, x - w / 2 - 0.16, y], [0.12, h + 0.2, x + w / 2 + 0.16, y]]) {
      frame.add(mesh(new THREE.BoxGeometry(bw, bh, 0.505), lapis, [cx, cy, face + 0.2525], { cast: false }));
    }
    // winged sun disk above the frame
    const dy = y + oh / 2 + 0.85;
    frame.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.22, 48), gold, [x, dy, face + 0.2], { rot: [Math.PI / 2, 0, 0] }));
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0.25); sh.quadraticCurveTo(2.2, 0.75, 4.3, 0.42); sh.lineTo(4.1, 0.05);
      sh.quadraticCurveTo(2.3, -0.12, 0, -0.32); sh.lineTo(0, 0.25);
      const wg = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
      const wm = mesh(wg, gold, [x + s * 0.55, dy, face + 0.1]);
      wm.scale.x = s;
      frame.add(wm);
      for (let k = 0; k < 5; k++) {
        frame.add(mesh(new THREE.BoxGeometry(0.06, 0.42 - k * 0.04, 0.03), lapis, [x + s * (1.0 + k * 0.62), dy + 0.02 + Math.sin(k * 0.5) * 0.12, face + 0.255], { cast: false, rot: [0, 0, s * 0.25] }));
      }
      frame.add(mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), gold, [x + s * 0.78, dy - 0.33, face + 0.25]));
    }
  }
  site.add(frame);

  // the screen: emissive glass showing the app still with the private names masked.
  // Off (shot a) it is dark polished glass that mirrors the sky.
  const appImg = await new THREE.ImageLoader().loadAsync(assetUrl('assets/live-demo/stills/app.png'));
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = appImg.width; maskCanvas.height = appImg.height;
  {
    const ctx = maskCanvas.getContext('2d');
    ctx.drawImage(appImg, 0, 0);
    const kx = appImg.width / 1920, ky = appImg.height / 1080;
    ctx.fillStyle = '#0F1013';
    for (const [x, y, w, h] of SCREEN_MASKS) ctx.fillRect(x * kx, y * ky, w * kx, h * ky);
  }
  const screenTexture = (src) => {
    const t = src.isTexture ? src : (typeof HTMLVideoElement !== 'undefined' && src instanceof HTMLVideoElement ? new THREE.VideoTexture(src) : new THREE.CanvasTexture(src));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    t.repeat.set(1, SCREEN_CROP.repeatY);
    t.offset.set(0, SCREEN_CROP.offsetY);
    t.needsUpdate = true;
    return t;
  };
  const screenMat = S.screenOn
    ? new THREE.MeshStandardMaterial({ color: '#000000', roughness: 1, metalness: 0, envMapIntensity: 0, emissive: '#FFFFFF', emissiveMap: screenTexture(maskCanvas), emissiveIntensity: 1.55, fog: false })
    : new THREE.MeshStandardMaterial({ color: '#4A525E', roughness: 0.1, metalness: 0.9, envMapIntensity: 1.25, emissive: '#FFFFFF', emissiveMap: screenTexture(maskCanvas), emissiveIntensity: 0 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), screenMat);
  screen.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  screen.name = 'screen';
  site.add(screen);
  site.add(mesh(new THREE.BoxGeometry(SCREEN.w + 0.1, SCREEN.h + 0.1, 0.1), new THREE.MeshStandardMaterial({ color: '#0B0A09', roughness: 0.9 }), [SCREEN.x, SCREEN.y, SCREEN.face + 0.06], { cast: false }));
  const screenLight = kitScreenLight(SCREEN.w, SCREEN.h, '#A8C4F0', S.screenOn ? 1.6 : 0);
  screenLight.position.set(SCREEN.x, SCREEN.y, SCREEN.z + 0.12);
  screenLight.lookAt(SCREEN.x, SCREEN.y, 10);
  site.add(screenLight);
  handles.screen = screen;
  handles.screenFrame = frame;
  handles.screenLight = screenLight;
  handles.screenCrop = SCREEN_CROP;
  handles.screenMasks = SCREEN_MASKS;
  // texture slot: a video or canvas (already masked by the caller) replaces the still; the
  // cover crop is kept. Returns the texture so the caller can flag needsUpdate per frame.
  handles.setScreenSource = (src) => {
    const t = screenTexture(src);
    screenMat.emissiveMap?.dispose?.();
    screenMat.emissiveMap = t;
    screenMat.needsUpdate = true;
    return t;
  };

  // podium steps in front of the facade
  for (let i = 0; i < 3; i++) {
    const d = 2.6 - i * 0.8;
    site.add(mesh(new RoundedBoxGeometry(21.5 - i * 0.8, 0.3 * (i + 1), d, 1, 0.03), blockMat, [0, 0.15 * (i + 1), FACADE.front + d / 2]));
  }

  // a low unfinished tower stub at the left with its scaffold; everything else is open sand
  site.add(mesh(battered(9, 4.6, 6, { batter: 0.05, tile: 4.2 }), facadeMat, [-16.5, 0, -33]));
  {
    const t = blockCourses(blockMat, { len: 8.0, courses: 2, done: 0.55, seed: 21, bl: 1.4, bh: 0.62, bd: 5.6 });
    t.position.set(-16.4, 4.6, -33);
    site.add(t);
    const sc = scaffold(woodMat, { w: 8.5, h: 7.4, d: 1.5, bays: 4, lifts: 3, seed: 22 });
    sc.position.set(-16.5, 0, -29.9);
    site.add(sc);
  }
  // half-raised forecourt wall at the left of the site
  {
    const wall = blockCourses(blockMat, { len: 11, courses: 4, done: 0.5, seed: 31, bl: 1.25, bh: 0.6, bd: 1.1 });
    wall.rotation.y = Math.PI / 2;
    wall.position.set(-8.6, 0, -23.5);
    site.add(wall);
    const lad = await glb('ph/wooden_ladder/wooden_ladder_1k.gltf');
    const l = fit(lad, { h: 2.9, at: [-7.85, 0, -21.2], yaw: Math.PI / 2 });
    l.rotation.set(0, Math.PI / 2, -0.28);
    site.add(shadows(l));
  }

  // ---------------------------------------------------------------- the Ptah colossus (true size, at the anchor)
  {
    const [px, pz] = PTAH.at;
    const anchor = V(px, groundAt(px, pz) - 0.35, pz);
    const yaw = Math.atan2(PTAH.faceAt[0] - px, PTAH.faceAt[1] - pz);
    const facing = V(Math.sin(yaw), 0, Math.cos(yaw));
    const colossus = await createPtahColossus(assets, { quality: ptahQuality });
    handles.ptahAnchor = { position: anchor.clone(), yaw, facing, height: colossus.height, scale: 1, note: 'origin at plinth base, faces +Z rotated by yaw; the colossus group stands here' };
    colossus.group.position.copy(anchor);
    colossus.group.rotation.y = yaw;
    // only the API: group, setState. Extra opts or state keys a later design ignores are harmless.
    // eyeGain: a scene-side multiplier on the eye emissive for distant shots, kept across later
    // setState calls. Skipped when a design has no handles.eyeMaterial.
    const eyeMat = colossus.handles && colossus.handles.eyeMaterial;
    if (S.eyeGain && eyeMat && colossus.setState) {
      const base = colossus.setState;
      colossus.setState = (s) => { base(s); eyeMat.emissiveIntensity *= S.eyeGain; };
    }
    if (colossus.setState) colossus.setState({ eyeGlow: 0, headYaw: 0, headPitch: 0, sceptreTilt: 0, voice: 0, ...S.ptah });
    scene.add(colossus.group);
    handles.colossus = colossus;
    handles.ptah = colossus.group;
  }

  // ---------------------------------------------------------------- crews
  const crewDefs = [
    { name: 'Antigravity', key: 'near', start: V(-1.55, 0, -24.25), dir: V(-0.17, 0, 0.985), len: 10, rise: 1.0, s: 3.4, seed: 101, fit: { shift: [1.0, 0], ds: -2.5 } },
    { name: 'Cursor', key: 'mid', start: V(4.2, 0, -27.35), dir: V(0.17, 0, 0.985), len: 12.5, rise: 1.6, s: 3.1, seed: 202, fit: { shift: [-1.38, 0.24], ds: -2.5, k: 0.9, ro: -0.15 } },
    { name: 'OpenCode', key: 'far', start: V(1.8, 0, -25.95), dir: V(-1, 0, 0), len: 15, rise: 2.2, s: 2.9, seed: 303, fit: { shift: [-0.4, -0.6], ds: -1.5 } },
  ];
  for (const def of crewDefs) handles.crews.push(buildCrew(assets, scene, { ...def, faceLight: shot === 'd' && def.key === 'mid' ? 0.25 : 0 }, { blockMat, rubbleMat, woodMat, leather, ropeMat }));

  // stockpiles of cut blocks and site clutter
  const pile = (x, z, yaw, n, seed) => {
    const b = blockCourses(blockMat, { len: n * 1.3, courses: 2, done: 0.6, seed, bl: 1.3, bh: 0.7, bd: 1.0 });
    b.position.set(x, 0.02, z); b.rotation.y = yaw; site.add(b);
  };
  pile(-5.2, -27.0, 0.05, 3, 51);
  pile(9.0, -21.0, -0.5, 2, 52);
  pile(-12.4, -17.0, 1.2, 3, 53);
  pile(14.5, -18.0, 0.3, 3, 54);
  const props = [
    ['ph/wooden_crate_01/wooden_crate_01_1k.gltf', { h: 0.62, at: [-6.2, 0.04, -21.3], yaw: 0.4 }],
    ['ph/wooden_crate_01/wooden_crate_01_1k.gltf', { h: 0.62, at: [-6.5, 0.04, -20.4], yaw: 1.1 }],
    ['ph/wooden_crate_01/wooden_crate_01_1k.gltf', { h: 0.6, at: [7.9, 0.04, -19.4], yaw: -0.3 }],
    ['ph/ceramic_vase_02/ceramic_vase_02_1k.gltf', { h: 0.72, at: [-5.6, 0.04, -22.4], yaw: 0 }],
    ['ph/ceramic_vase_02/ceramic_vase_02_1k.gltf', { h: 0.6, at: [8.6, 0.04, -20.4], yaw: 1 }],
    ['ph/wicker_basket_01/wicker_basket_01_1k.gltf', { h: 0.38, at: [-5.5, 0.04, -19.6], yaw: 0.2 }],
    ['ph/wicker_basket_01/wicker_basket_01_1k.gltf', { h: 0.36, at: [7.4, 0.04, -18.4], yaw: 0.7 }],
    ['ph/stone_fire_pit/stone_fire_pit_1k.gltf', { w: 1.3, at: [-4.6, 0.04, -10.6], yaw: 0 }],
    ['ph/sand_rocks_small_01/sand_rocks_small_01_1k.gltf', { w: 2.6, at: [5.6, 0.02, -10.8], yaw: 0.6 }],
    ['ph/sand_rocks_small_01/sand_rocks_small_01_1k.gltf', { w: 3.0, at: [-10.5, 0.1, -11.0], yaw: 2.1 }],
  ];
  for (const [p, o] of props) site.add(shadows(fit(await glb(p), o)));

  // braziers on the podium flanking the screen, and a fire in the pit
  for (const [x, z, sd] of [[-8.6, -28.4, 1], [8.6, -28.4, 2], [-4.6, -10.6, 3]]) {
    const b = brazier(scene, x, z, `d4b${sd}`, { intensity: sd === 3 ? 7 : 11, flame: sd === 3 ? 1.2 : 1 });
    if (sd !== 3) b.group.position.y = 0.9;
    else { b.group.position.y = -0.8; b.group.scale.setScalar(1.3); b.group.children.forEach((c) => { if (c.isMesh && c.material.metalness > 0.5) c.visible = false; }); }
    b.update(0.37 * sd);
    handles.braziers.push(b);
  }

  // ---------------------------------------------------------------- visitors in their chairs (seated in every shot)
  // The kit's swivel chair (look-kit loungeChair, the workspace chair) at the workspace
  // robot-to-chair ratio; each robot sits on the chair's userData.seatY, back against the shell.
  const camPos = S.pos ? V(...S.pos) : V(0, 1, 0);
  for (const v of S.seats) {
    const [cx, cz] = v.chair;
    const gy = v.stand ? groundAt(cx, cz) : PAVE.top;
    const ptahAt = handles.ptahAnchor.position;
    const lookAt = v.face === 'camera' ? camPos.clone().setY(0) : v.face === 'ptah' ? V(ptahAt.x, 0, ptahAt.z) : V(SCREEN.x + (cx < 0.5 ? -1.2 : 1.2), 0, SCREEN.face);
    const [ox, oz] = v.at || v.chair; // where the robot is (standing robots are off their chairs)
    const yaw = Math.atan2(lookAt.x - ox, lookAt.z - oz) + v.yaw;
    const fwd = V(Math.sin(yaw), 0, Math.cos(yaw));
    const c = await loungeChair({ height: CHAIR.h, cushion: CHAIR.cushion });
    // the kit chair faces -Z at rotation 0; turn it so its front faces `fwd`. A standing robot
    // has left its chair: the empty chair stays where it landed, swung a little off its line.
    c.position.set(cx, gy - 0.01, cz);
    c.rotation.y = yaw + Math.PI + (v.chairYaw || 0);
    scene.add(c);
    handles.chairs.push(c);
    scene.add(puffs(V(cx, gy, cz), { n: 5, r: 0.6, seed: hash(v.name), opacity: shot === 'a' ? 0.12 : 0.08, size: 0.8 }));
    // what the robot looks at: the screen, the lens, the giant's face, or the other visitor (seated-turn)
    const other = S.seats.find((o) => o.name === v.look);
    const gaze = v.look === 'camera' ? camPos.clone()
      : v.look === 'ptah' ? ptahAt.clone().add(V(0, handles.ptahAnchor.height * 0.9, 0))
      : other ? V(...((other.at || other.chair).slice(0, 1)), PAVE.top + 1.0, (other.at || other.chair)[1])
      : V(SCREEN.x + (cx < 0.5 ? -1.2 : 1.2), SCREEN.y, SCREEN.face);
    const r = bodied(assets, v.name, { size: VIS_U, faceLight: shot === 'a' ? 0.35 : 0.12, faceBoost: v.name === 'Claude' ? 1.25 : 1 });
    const time = 2.0 + hash(v.name, shot) * 3;
    if (v.stand) {
      // on its feet on the sand (the giant has risen), its empty chair behind it
      r.group.position.set(v.at[0], groundAt(v.at[0], v.at[1]), v.at[1]);
      r.group.rotation.y = yaw; // the body faces +z: turned onto fwd
      r.setState({ standZ: 0, seed: v.name, lookAt: gaze });
      r.setPose('standing-idle', time, time);
      const cs = contactShadow(scene, 0.55, 0.5, 0.5);
      cs.position.copy(r.group.position).add(V(0, 0.01, 0));
      scene.add(cs);
    } else {
      // seated in the kit chair: the body sits on its seatY, at the workspace robot-to-chair ratio
      const front = 0.152 * CHAIR_K; // cushion front lip, chair-local
      r.group.position.copy(c.position);
      r.group.rotation.y = c.rotation.y + Math.PI; // the chair faces -z, the body +z
      r.setState({ seat: { y: c.userData.seatY, front, z: front - BODY.thigh * VIS_U + 0.07 * VIS_U }, standZ: front + 0.32 * CHAIR_K, seed: v.name, lookAt: gaze });
      if (other) r.setPose('seated-turn', 1, time);
      else r.setPose('seated-idle', time, time);
    }
    scene.add(r.root);
    handles.visitors.push(r);
  }
  // a cool rim from the screen side so the backs of the visitors read against the forecourt
  if (S.screenOn && shot !== 'd') {
    const mid = V(0, 0, 0);
    for (const s of S.seats) mid.add(V(s.chair[0], 0.75, s.chair[1]));
    mid.multiplyScalar(1 / S.seats.length);
    const rim = new THREE.SpotLight('#B4CCFF', 28, 0, 0.26, 0.8, 2);
    rim.position.set(mid.x + 0.5, 3.6, mid.z - 7.5);
    rim.target.position.copy(mid);
    scene.add(rim, rim.target);
    handles.rim = rim;
  }

  // ---------------------------------------------------------------- background: dunes, pyramids, a few rocks and palms
  {
    const onGround = (x, z, sink = 0) => [x, groundAt(x, z) - sink, z];
    const bgItems = [
      ['desert/pyramid.glb', { h: 46, at: onGround(121, -205, 1.5), yaw: 0.25 }],
      ['desert/step-pyramid.glb', { h: 30, at: onGround(-89, -165, 1.0), yaw: -0.3 }],
      ['desert/pyramid.glb', { h: 34, at: onGround(-150, -48, 1.0), yaw: 0.6 }],
      ['desert/pyramid.glb', { h: 22, at: onGround(-118, -92, 0.8), yaw: 1.1 }],
      ['ph/namaqualand_boulder_02/namaqualand_boulder_02_1k.gltf', { w: 6, at: onGround(-30, -50, 0.6), yaw: 0.4 }],
      ['ph/namaqualand_boulder_05/namaqualand_boulder_05_1k.gltf', { w: 7, at: onGround(38, -60, 0.8), yaw: 1.2 }],
      ['ph/namaqualand_boulder_05/namaqualand_boulder_05_1k.gltf', { w: 4.5, at: onGround(24, -6, 0.4), yaw: 0.2 }],
      ['ph/dead_quiver_trunk/dead_quiver_trunk_1k.gltf', { h: 4.2, at: onGround(-15.5, -10.5, 0.1), yaw: 0.8 }],
      ['ph/dead_quiver_trunk/dead_quiver_trunk_1k.gltf', { h: 3.4, at: onGround(21, -15, 0.1), yaw: 2.2 }],
      ['desert/palm-a.glb', { h: 7.5, at: onGround(-27, -38, 0.2), yaw: 0.3 }],
      ['desert/palm-b.glb', { h: 8.5, at: onGround(-30, -33, 0.2), yaw: 1.3 }],
    ];
    for (const [p, o] of bgItems) scene.add(shadows(fit(await glb(p), o)));
  }

  // ---------------------------------------------------------------- atmosphere: a light height haze, shafts, dust
  const fog = heightFog(scene, { color: '#D7BFA6', sunColor: '#FFCE98', sunDir: SUN_DIR, density: 0.0042, base: 0, falloff: 0.075, floor: 0.2, lobe: 5 });
  for (const [x, z, w, h, o, c] of [[0, -150, 520, 14, 0.12, '#E0BE9E'], [0, -21, 70, 1.6, 0.06, '#F0C9A0']]) {
    const hc = hazeCard(w, h, { color: c, opacity: o, seed: x + z });
    hc.position.set(x, groundAt(x, z) - 0.3, z);
    scene.add(hc);
  }
  const into = SUN_DIR.clone().negate();
  for (let i = 0; i < 6; i++) {
    const from = V(-30 + i * 1.7, 8 + hash(7, i) * 3, -32 + i * 0.9);
    scene.add(shaft(from, into, { len: 28, w: 1.0 + hash(8, i) * 2.0, opacity: 0.03 + hash(9, i) * 0.025 }));
  }
  scene.add(motes(900, V(0, 0, -20), V(40, 7, 28), 77, { size: 0.045, opacity: 0.5 }));
  scene.add(motes(300, V(0, 0.08, -18), V(30, 0.6, 20), 78, { size: 0.12, opacity: 0.2, color: '#F3D2A8' }));

  // e: haze between the visitors and the giant (scale through air), and a warm rim from behind it
  if (S.haze || S.rim) {
    const cam = V(...S.pos), giant = V(PTAH.at[0], 0, PTAH.at[1]);
    if (S.haze) {
      for (const [t, w, h, o] of [[0.45, 24, 6, 0.2], [0.6, 30, 10, 0.22], [0.75, 34, 14, 0.2], [0.88, 40, 9, 0.16]]) {
        const p = cam.clone().setY(0).lerp(giant, t);
        const hc = hazeCard(w, h, { color: '#E6C29C', opacity: o, seed: Math.round(t * 100) });
        hc.position.set(p.x, groundAt(p.x, p.z) - 0.3, p.z);
        hc.lookAt(cam.x, hc.position.y, cam.z);
        scene.add(hc);
      }
    }
    if (S.rim) {
      const away = giant.clone().sub(cam).setY(0).normalize();
      // three.js light layers only filter against the camera, not per object, so the visitors
      // are kept out of the rim with a distance cutoff instead: decay 0, the light ends about
      // 22 m past the giant, and the visitors stand about 90 m from it.
      const rimSun = new THREE.SpotLight('#FFB476', 9, 62, 0.32, 0.5, 0);
      rimSun.position.copy(giant).addScaledVector(away, 40).setY(16);
      rimSun.target.position.copy(giant).setY(14);
      scene.add(rimSun, rimSun.target);
      handles.ptahRim = rimSun;
    }
  }
  // e: a bounce card for the facade's side face (+x), which the low sun leaves in shade at the
  // left edge of the frame. A one-sided warm area light standing on the sand 6 m out, facing the
  // face: it lights the stone, not the visitors behind it (about 30 m away, on its unlit side).
  if (S.bounce) {
    RectAreaLightUniformsLib.init();
    const card = new THREE.RectAreaLight('#F0C08C', 5.0, 9, 8);
    card.position.set(16.0, 4.2, -32.0);
    card.lookAt(9.9, 4.6, -32.5);
    scene.add(card);
    handles.bounce = card;
  }

  fog.apply(scene);
  // look kit: transparent atmosphere (dust, haze cards, shafts, motes, flames, decals) stays out of the AO and DOF depth renders
  scene.userData.noDepth = scene.userData.noDepth || [];
  scene.traverse((o) => { const m = o.material; if ((o.isMesh || o.isPoints || o.isSprite) && m && !Array.isArray(m) && m.transparent && !scene.userData.noDepth.includes(o)) scene.userData.noDepth.push(o); });

  // ---------------------------------------------------------------- camera
  const camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 2400);
  camera.filmGauge = 36;
  camera.setFocalLength(S.mm);
  let pos = S.pos && V(...S.pos), target = S.target && V(...S.target);
  if (shot === 'd') {
    const c = handles.crews.find((k) => k.key === 'mid');
    const leader = c.leader.root.getWorldPosition(V(0, 0, 0));
    const sled = c.sledge.getWorldPosition(V(0, 0, 0));
    const dir = c.dir;
    const side = V(dir.z, 0, -dir.x); // camera-left of the hauling line, looking back down it
    pos = leader.clone().addScaledVector(dir, 3.0).addScaledVector(side, 2.7).setY(leader.y + 1.75);
    target = leader.clone().lerp(sled, 0.55).add(V(0, 0.15, 0));
    S.dof.focus = pos.distanceTo(leader.clone().lerp(sled, 0.35));
  }
  camera.position.copy(pos);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  // focus on the visitors' faces: the mean camera distance to their visor centres
  const dof = { ...S.dof };
  if (dof.focus === 'seats') {
    const d = handles.visitors.map((r) => r.face().distanceTo(pos));
    dof.focus = +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(2);
  }

  // reflection probe of the finished site from the forecourt: the robot shells and visors
  // mirror the real sand, facade and lit screen, as the workspace robots mirror their room
  {
    const all = [...handles.visitors, ...handles.crews.flatMap((c) => c.robots)];
    const probe = roomProbe(renderer, scene, { position: V(1.0, 1.4, -15), size: 256, near: 0.1, far: 900, hide: all.map((r) => r.root) });
    for (const r of all) r.setEnvMap(probe);
    handles.robotProbe = probe;
  }

  // screen fill: projected glass corners
  const proj = (p) => { const q = p.clone().project(camera); return [(q.x + 1) / 2, (1 - q.y) / 2, q.z]; };
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => proj(V(SCREEN.x + sx * SCREEN.w / 2, SCREEN.y + sy * SCREEN.h / 2, SCREEN.z)));
  const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
  const clip = (v) => Math.min(1, Math.max(0, v));
  const info = {
    screenFill: +(Math.max(...xs) - Math.min(...xs)).toFixed(3),
    screenX: [+Math.min(...xs).toFixed(3), +Math.max(...xs).toFixed(3)],
    screenY: [+Math.min(...ys).toFixed(3), +Math.max(...ys).toFixed(3)],
    screenArea: +((clip(Math.max(...xs)) - clip(Math.min(...xs))) * (clip(Math.max(...ys)) - clip(Math.min(...ys)))).toFixed(3),
    camera: { pos: pos.toArray().map((v) => +v.toFixed(2)), target: target.toArray().map((v) => +v.toFixed(2)), mm: S.mm },
  };
  {
    const p = handles.ptah;
    p.updateMatrixWorld(true);
    const top = proj(p.localToWorld(V(0, handles.ptahAnchor.height, 0)));
    const sl = proj(p.localToWorld(V(-2.5, 19, 0))), sr = proj(p.localToWorld(V(2.5, 19, 0)));
    info.ptah = { top: top.slice(0, 2).map((v) => +v.toFixed(3)), shoulders: [sl, sr].map((s) => s.slice(0, 2).map((v) => +v.toFixed(3))), dist: +p.position.distanceTo(pos).toFixed(1) };
  }
  // robots cut by a frame edge (partly in frame): [name, crew key or 'visitor', robot index]
  info.cropped = [];
  {
    const box = new THREE.Box3();
    const groups = [['visitor', handles.visitors], ...handles.crews.map((c) => [c.key, c.robots])];
    for (const [key, list] of groups) list.forEach((r, i) => {
      box.setFromObject(r.root);
      const pts = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => proj(V(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z)));
      if (pts.some((p) => p[2] >= 1)) return; // behind the camera
      const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
      const y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
      const inFrame = x1 > 0 && x0 < 1 && y1 > 0 && y0 < 1;
      if (inFrame && (x0 < 0 || x1 > 1 || y0 < 0 || y1 > 1)) info.cropped.push([r.name.slice(0, 2), key, i, +x0.toFixed(2), +x1.toFixed(2)]);
    });
  }
  // visitor height as a fraction of the frame height
  info.visitorH = handles.visitors.map((r) => {
    const b = new THREE.Box3().setFromObject(r.root), c = b.getCenter(V());
    return +(proj(V(c.x, b.min.y, c.z))[1] - proj(V(c.x, b.max.y, c.z))[1]).toFixed(3);
  });
  info.faces = [...handles.visitors, ...handles.crews.flatMap((c) => c.robots)].map((r) => {
    const p = proj(r.face());
    return [r.name.slice(0, 2), +p[0].toFixed(2), +p[1].toFixed(2)];
  }).filter((f) => f[1] > -0.05 && f[1] < 1.05 && f[2] > -0.05 && f[2] < 1.05);

  // look kit film chain (src/look-kit.js). AO radius is larger than the workspace's: the set is metres of stone, not a desk.
  const film = {
    size: [1920, 1080], tone: 'aces', exposure: 0.9, msaa: 4,
    ao: { radius: 0.45, thickness: 1.2, distanceExponent: 1.6, scale: 1, samples: 16, intensity: 0.85 },
    dof,
    bloom: { strength: 0.28, radius: 0.55, threshold: 1.05 },
    grade: { vignette: 0.28, grain: 0.02, ca: 0.0012, lift: [0.004, 0.006, 0.014], seed: 4 },
  };
  return { scene, camera, bloom: null, exposure: film.exposure, film, handles, info };
}

// One crew: a ramp along `dir`, a sledge with a lashed block at ramp distance s, four followers
// in two staggered files on two taut ropes, and a leader on the bridle. All in the ramp's local
// frame; every robot and the sledge are dropped onto the ramp surface by a ray cast.
function buildCrew(assets, scene, def0, M) {
  // fit: frame-edge fit for stills b and c (notes): shift moves the ramp in world metres, ds moves the
  // crew along its ramp (haul progress), k narrows the two files, ro moves crew and sledge across the ramp.
  const fit = def0.fit || {};
  const def = { ...def0, s: def0.s + (fit.ds || 0), start: def0.start.clone().add(V((fit.shift || [0, 0])[0], 0, (fit.shift || [0, 0])[1])) };
  const ro = fit.ro || 0, k = fit.k ?? 1;
  const g = new THREE.Group();
  g.position.copy(def.start);
  g.rotation.y = Math.atan2(def.dir.x, def.dir.z);
  scene.add(g);
  const rp = ramp(M.rubbleMat, M.woodMat, { len: def.len, w: 2.7, rise: def.rise, seed: def.seed });
  g.add(rp);
  g.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const surface = (x, z) => {
    ray.set(g.localToWorld(V(x, def.rise + 5, z)), V(0, -1, 0));
    const hit = ray.intersectObject(rp, true)[0];
    return hit ? g.worldToLocal(hit.point.clone()).y : (Math.max(0, Math.min(def.len, z)) / def.len) * def.rise;
  };
  const toLocal = (obj, p) => g.worldToLocal(obj.localToWorld(p.clone()));
  const plat = blockCourses(M.blockMat, { len: 3.6, courses: Math.max(1, Math.round(def.rise / 0.55)), done: 1, seed: def.seed + 1, bl: 1.2, bh: def.rise / Math.max(1, Math.round(def.rise / 0.55)), bd: 3.4 });
  plat.position.set(0, 0, def.len + 1.6);
  g.add(plat);

  const sl = sledge(M.woodMat, M.blockMat, { seed: def.seed });
  sl.position.set(ro, Math.min(surface(ro - 0.5, def.s - 0.8), surface(ro + 0.5, def.s - 0.8), surface(ro, def.s + 0.8)) - 0.01, def.s);
  sl.rotation.x = -rp.userData.slope;
  g.add(sl);

  const hue = CREW_HUE[def.name] || null;
  const hueMat = new THREE.MeshStandardMaterial({ color: hue || '#3A3A40', roughness: 0.55, envMapIntensity: 0.8 });
  const robots = [];
  const u = CREW_U;
  const tieAt = (b) => toLocal(b.handles.chest, V((b.state.haulSide || 1) * 0.55 * u, 0.85 * u, -0.62 * u)); // strap, behind the rope-side shoulder
  // haulSide: the side the rope ties on (each file's inner side, toward the ramp centre)
  const place = (x, z, haulSide, i) => {
    const at = V(x, surface(x, z), z);
    const b = bodied(assets, def.name, { color: hue, size: u, quality: 'low', faceLight: def.faceLight || 0 });
    b.group.position.copy(at);
    g.add(b.group);
    // chest strap in the crew hue: a sash over the rope-side shoulder
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.98 * u, 0.07 * u, 8, 48), hue ? hueMat : M.leather);
    sash.scale.set(1, 0.8, 1);
    sash.rotation.set(Math.PI / 2, 0, haulSide * 0.42, 'ZYX');
    sash.position.y = 0.62 * u;
    sash.castShadow = true;
    b.handles.chest.add(sash);
    g.updateMatrixWorld(true);
    // looks ahead up the ramp
    b.setState({ haulSide, standZ: 0, seed: `${def.name}${i}`, lookAt: g.localToWorld(V(x, at.y + 1.1, z + 8)) });
    b.setPose('haul', 0, hash(def.seed, i, 'haul') * 10);
    robots.push(b);
    return b;
  };
  const files = { '-1': [], '1': [] };
  CREW.pairs.forEach((dz, i) => {
    for (const side of [-1, 1]) {
      const lat = CREW.lateral[(i + (side > 0 ? 1 : 0)) % 2] * k + hashRange(-0.03, 0.03, def.seed, i, side);
      const z = def.s + dz + (side > 0 ? CREW.stagger : 0) + hashRange(-0.08, 0.08, def.seed, i, side, 'z');
      files[side].push(place(ro + side * lat, z, -side, `${i}${side}`));
    }
  });
  const leader = place(ro + 0.05, def.s + CREW.lead, 1, 'lead');

  g.updateMatrixWorld(true);
  const bridle = V(ro, 0, def.s + CREW.lead - 0.85);
  bridle.y = surface(ro, bridle.z) + 0.44;
  for (const side of [-1, 1]) {
    // the main rope: sledge -> a knot beside each hauler (low, behind, on the inner side) -> bridle;
    // a short tether climbs from each knot to the strap behind the shoulder
    const a = toLocal(sl, sl.userData.attach[side < 0 ? 0 : 1]);
    const pts = [a];
    for (const b of files[side]) {
      const tie = tieAt(b);
      const knot = tie.clone().add(V(-side * 0.1, -0.3, -0.42));
      pts.push(knot);
      g.add(rope([tie, tie.clone().lerp(knot, 0.5).add(V(0, -0.02, 0)), knot], { r: 0.013, mat: M.ropeMat }));
    }
    pts.push(bridle.clone());
    g.add(rope(pts, { r: 0.02, mat: M.ropeMat }));
  }
  g.add(rope([bridle.clone(), tieAt(leader)], { r: 0.022, mat: M.ropeMat }));
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 24), M.ropeMat);
  coil.position.copy(toLocal(sl, V(0.42, sl.userData.blockTop + 0.03, 0.55)));
  coil.rotation.x = Math.PI / 2 - rp.userData.slope;
  g.add(coil);
  shadows(g);
  return { key: def.key, name: def.name, group: g, ramp: rp, sledge: sl, robots, leader, dir: def.dir.clone().normalize(), start: def.start.clone() };
}
