// Episode 6, desert act, direction v4 look: an open temple-building site in the dunes at golden
// hour. A monumental wide screen is set into a sandstone facade, the 24 m Ptah colossus
// (src/ptah-colossus.js) stands in the sand beyond it, three hauling crews drag blocks up ramps and the two visitors sit in their
// office chairs on the paved forecourt.
//   buildDesert4Look(assets, renderer, { shot: 'a'|'b'|'c'|'d'|'e', aspect })
//     -> { scene, camera, exposure, film, handles, info }
// Metres throughout (robot 0.79 m). +Z points from the facade toward the audience; the
// screen faces +Z. Static and deterministic: every variation is seeded through util.hash.
import * as THREE from 'three';
import { assetUrl } from './assets.js';
import { glb, hdri, fit, shadows, robot } from './craft.js';
import { environment, reshadeRobot, contactShadow, roomProbe, loungeChair, screenLight as kitScreenLight } from './look-kit.js';
import { ROBOT_SCALE } from './look-workspace.js';
import { createPtahColossus } from './ptah-colossus.js';
import { brazier } from './temple.js';
import { hash, hashRange } from './util.js';
import { ROBOT } from './robot.js';
import { stone } from './desert4-stone.js';
import {
  V, planarUV, pbr, heightFog, mesh, battered, cornice, torusRoll, reliefTexture, rope, ropeMaterial,
  blockCourses, ramp, sledge, scaffold, hazeCard, shaft, motes, puffs, RoundedBoxGeometry,
} from './desert4-props.js';

const RS = 0.38; // robot scale
const BALL = ROBOT.ballRadius * RS; // 0.325 m
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
function lookRobot(r, opts) {
  reshadeRobot(r, { ...ROBOT_LOOK, ...opts });
  r.mats.shell.envMapIntensity = OUTDOOR_ENV.shell;
  r.mats.screen.envMapIntensity = OUTDOOR_ENV.screen;
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
// It is 24.05 m tall, faces +Z and has its origin at the plinth base. Never frame it tighter than
// head and shoulders (its face close-up is not approved).
export const PTAH = { at: [29.0, -66.0], height: 24.05, faceAt: [0, -14] };
const SKY = 'hdri/mpumalanga_veld_puresky_2k.hdr';

// Per-shot cameras (focal length on a 36 mm gate), visitor seats and post hints.
// Seats: chair centre [x, z], what the chair faces, extra yaw, the robot's head turn.
// focus: 'seats' puts the focal plane on the visitors' faces (measured after they are placed).
// ptah: the colossus state (setState). stand: the visitors stand beside their empty chairs.
const SHOTS = {
  a: {
    pos: [3.4, 0.82, -10.2], target: [-4.6, 1.75, -17.6], mm: 28, dof: { focus: 'seats', aperture: 0.0016, maxblur: 0.005 }, screenOn: false, ptah: { voice: 0, eyeGlow: 0 },
    seats: [{ name: 'Claude', chair: [0.15, -13.9], face: 'camera', yaw: -0.55, head: 0.1 }, { name: 'Codex', chair: [-1.55, -13.15], face: 'camera', yaw: -0.3, head: 0.18 }],
  },
  b: {
    pos: [1.0, 1.1, -9.8], target: [1.4, 4.75, -30], mm: 28, dof: { focus: 22.0, aperture: 0.0002, maxblur: 0.002 }, screenOn: true, ptah: { voice: 0.5, eyeGlow: 0.5 },
    seats: [{ name: 'Claude', chair: [-0.2, -16.8], face: 'screen', yaw: 0, head: 0.5 }, { name: 'Codex', chair: [2.1, -17.2], face: 'screen', yaw: 0, head: -0.5 }],
  },
  c: {
    pos: [0.45, 0.8, -12.9], target: [0.1, 4.0, -30], mm: 35, dof: { focus: 17.0, aperture: 0.0004, maxblur: 0.004 }, screenOn: true, ptah: { voice: 0.3, eyeGlow: 0.4 },
    seats: [{ name: 'Claude', chair: [-0.75, -21.3], face: 'screen', yaw: 0, head: 0.35 }, { name: 'Codex', chair: [1.65, -21.6], face: 'screen', yaw: 0, head: -0.35 }],
  },
  d: {
    pos: null, target: null, mm: 35, dof: { focus: 4.6, aperture: 0.0025, maxblur: 0.007 }, screenOn: true, ptah: { voice: 0.3, eyeGlow: 0.4 },
    seats: [{ name: 'Claude', chair: [-0.6, -13.0], face: 'screen', yaw: 0, head: 0.3 }, { name: 'Codex', chair: [1.6, -13.4], face: 'screen', yaw: 0, head: -0.3 }],
  },
  // e: the giant rises. Low and wide from the sand in front of the forecourt (far enough back that
  // the 24 m figure out-scales the 11 m facade): the lit screen at frame left, the whole
  // colossus standing at frame right, the two visitors on their feet, small, in the foreground.
  e: {
    pos: [12.0, 0.4, 30.0], target: [12.6, 13.0, -50.0], mm: 40, dof: { focus: 'seats', aperture: 0.00008, maxblur: 0.0015 }, screenOn: true, ptah: { voice: 0.2, eyeGlow: 0.7 },
    seats: [{ name: 'Claude', chair: [8.9, 12.6], at: [10.7, 14.2], face: 'camera', yaw: 0.9, head: -0.35, stand: true, chairYaw: 1.9 }, { name: 'Codex', chair: [15.0, 12.2], at: [12.9, 13.6], face: 'camera', yaw: -0.9, head: 0.35, stand: true, chairYaw: -1.3 }],
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

export async function buildDesert4Look(assets, renderer, { shot = 'b', aspect = 16 / 9 } = {}) {
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
    handles.ptahAnchor = { position: anchor.clone(), yaw, facing, height: PTAH.height, scale: 1, note: 'origin at plinth base, faces +Z rotated by yaw; the colossus group stands here' };
    const colossus = await createPtahColossus(assets, { height: PTAH.height, quality: 'high' });
    colossus.group.position.copy(anchor);
    colossus.group.rotation.y = yaw;
    // only the API: group, setState. Extra opts or state keys a later design ignores are harmless.
    if (colossus.setState) colossus.setState({ eyeGlow: 0, headYaw: 0, headPitch: 0, sceptreTilt: 0, voice: 0, ...S.ptah });
    scene.add(colossus.group);
    handles.colossus = colossus;
    handles.ptah = colossus.group;
  }

  // ---------------------------------------------------------------- crews
  const crewDefs = [
    { name: 'Antigravity', key: 'near', start: V(-1.55, 0, -24.25), dir: V(-0.17, 0, 0.985), len: 10, rise: 1.0, s: 3.4, seed: 101 },
    { name: 'Cursor', key: 'mid', start: V(4.2, 0, -27.35), dir: V(0.17, 0, 0.985), len: 12.5, rise: 1.6, s: 3.1, seed: 202 },
    { name: 'OpenCode', key: 'far', start: V(1.8, 0, -25.95), dir: V(-1, 0, 0), len: 15, rise: 2.2, s: 2.9, seed: 303 },
  ];
  for (const def of crewDefs) handles.crews.push(buildCrew(assets, scene, def, { blockMat, rubbleMat, woodMat, leather, ropeMat }));
  for (const c of handles.crews) {
    for (const r of c.robots) {
      lookRobot(r, { faceLight: shot === 'd' && c.key === 'mid' ? 0.25 : 0 });
      tintRobot(r, CREW_HUE[c.name] || r.color);
      if (r.blob) { r.blob.visible = true; r.blob.material.opacity = Math.max(r.blob.material.opacity ?? 0.5, 0.55); }
    }
  }

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
    let at;
    if (v.stand) {
      // on its feet on the sand, its empty chair behind it
      at = V(v.at[0], groundAt(v.at[0], v.at[1]), v.at[1]);
    } else {
      at = V(cx, c.userData.seatY + gy - 0.01, cz).addScaledVector(fwd, -CHAIR.sink);
    }
    const r = robot(assets, v.name, at, at.clone().add(fwd), { scale: RS, pose: { pitch: v.stand ? -0.06 : (v.name === 'Claude' ? 0.04 : 0), headYaw: v.head, nod: v.stand ? 0.12 : 0, eyeSX: 1.05, eyeSY: 1.05 } });
    lookRobot(r, { faceLight: shot === 'a' ? 0.35 : 0.12, faceBoost: v.name === 'Claude' ? 1.25 : 1 });
    if (r.blob) r.blob.visible = !!v.stand;
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
    const d = handles.visitors.map((r) => r.root.localToWorld(V(ROBOT.screenX, ROBOT.eyeY, 0)).distanceTo(pos));
    dof.focus = +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(2);
  }

  // reflection probe of the finished site from the forecourt: the robot shells and visors
  // mirror the real sand, facade and lit screen, as the workspace robots mirror their room
  {
    const all = [...handles.visitors, ...handles.crews.flatMap((c) => c.robots)];
    const probe = roomProbe(renderer, scene, { position: V(1.0, 1.4, -15), size: 256, near: 0.1, far: 900, hide: all.map((r) => r.root) });
    for (const r of all) for (const k of ['shell', 'feet', 'screen']) { r.mats[k].envMap = probe; r.mats[k].needsUpdate = true; }
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
    const top = proj(p.localToWorld(V(0, PTAH.height, 0)));
    const sl = proj(p.localToWorld(V(-2.5, 19, 0))), sr = proj(p.localToWorld(V(2.5, 19, 0)));
    info.ptah = { top: top.slice(0, 2).map((v) => +v.toFixed(3)), shoulders: [sl, sr].map((s) => s.slice(0, 2).map((v) => +v.toFixed(3))), dist: +p.position.distanceTo(pos).toFixed(1) };
  }
  info.faces = [...handles.visitors, ...handles.crews.flatMap((c) => c.robots)].map((r) => {
    const p = proj(r.root.localToWorld(V(ROBOT.screenX, ROBOT.eyeY, 0)));
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

// Recolour a crew robot (after reshadeRobot with glass) to its crew hue: ear ring, soles and the
// tint of the dark glass visor. The visor base stays near-black glass, as in the workspace.
function tintRobot(r, hex) {
  const c = new THREE.Color(hex);
  const m = r.mats;
  m.glow.color.copy(c); m.glow.emissive.copy(c).multiplyScalar(1.3 * 1.3);
  if (m.sole) { m.sole.color.copy(c).multiplyScalar(0.7); m.sole.emissive.copy(c); }
  m.screen.emissive.copy(c).multiplyScalar(ROBOT_LOOK.glass);
}

// One crew: a ramp along `dir`, a sledge with a lashed block at ramp distance s, four followers
// in two staggered files on two taut ropes, and a leader on the bridle. All in the ramp's local
// frame; every robot and the sledge are dropped onto the ramp surface by a ray cast.
function buildCrew(assets, scene, def, M) {
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
  const plat = blockCourses(M.blockMat, { len: 3.6, courses: Math.max(1, Math.round(def.rise / 0.55)), done: 1, seed: def.seed + 1, bl: 1.2, bh: def.rise / Math.max(1, Math.round(def.rise / 0.55)), bd: 3.4 });
  plat.position.set(0, 0, def.len + 1.6);
  g.add(plat);

  const sl = sledge(M.woodMat, M.blockMat, { seed: def.seed });
  sl.position.set(0, Math.min(surface(-0.5, def.s - 0.8), surface(0.5, def.s - 0.8), surface(0, def.s + 0.8)) - 0.01, def.s);
  sl.rotation.x = -rp.userData.slope;
  g.add(sl);

  const hueMat = new THREE.MeshStandardMaterial({ color: CREW_HUE[def.name] || '#3A3A40', roughness: 0.55, envMapIntensity: 0.8 });
  const robots = [];
  const place = (x, z, pose) => {
    const at = V(x, surface(x, z), z);
    const r = robot(assets, def.name, at, at.clone().add(V(0, 0, 1)), { scale: RS, pose });
    g.add(r.root);
    // harness band in the crew hue around the ball
    const hb = new THREE.Mesh(new THREE.TorusGeometry(ROBOT.ballRadius * 1.035, 0.06, 8, 40), CREW_HUE[def.name] ? hueMat : M.leather);
    hb.rotation.x = Math.PI / 2;
    hb.position.y = ROBOT.ballCenterY - ROBOT.ballBottom - 0.05;
    hb.castShadow = true;
    r.ballBase.add(hb);
    robots.push(r);
    return r;
  };
  const follower = (i, side) => ({ pitch: -0.2 - hash(def.seed, i, side) * 0.08, bx: 0.1, squash: 0.95, eyeSY: 0.62 + hash(def.seed, i, side, 'e') * 0.12, eyeSX: 1.08, nod: -0.06, headYaw: (hash(def.seed, i, side, 'h') - 0.5) * 0.25 });
  const files = { '-1': [], '1': [] };
  CREW.pairs.forEach((dz, i) => {
    for (const side of [-1, 1]) {
      const lat = CREW.lateral[(i + (side > 0 ? 1 : 0)) % 2] + hashRange(-0.03, 0.03, def.seed, i, side);
      const z = def.s + dz + (side > 0 ? CREW.stagger : 0) + hashRange(-0.08, 0.08, def.seed, i, side, 'z');
      files[side].push(place(side * lat, z, follower(i, side)));
    }
  });
  const leader = place(0.05, def.s + CREW.lead, { pitch: -0.28, bx: 0.14, squash: 0.93, eyeSY: 0.58, eyeSX: 1.1, nod: -0.05 });

  g.updateMatrixWorld(true);
  const toLocal = (obj, p) => g.worldToLocal(obj.localToWorld(p.clone()));
  const ballCentre = (r) => toLocal(r.ballBase, V(0, ROBOT.ballCenterY - ROBOT.ballBottom - 0.05, 0));
  const R = BALL * 1.06;
  const bridle = V(0, 0, def.s + CREW.lead - 0.85);
  bridle.y = surface(0, bridle.z) + 0.44;
  for (const side of [-1, 1]) {
    const a = toLocal(sl, sl.userData.attach[side < 0 ? 0 : 1]);
    const pts = [a];
    for (const r of files[side]) { const c = ballCentre(r); pts.push(c.clone().add(V(-side * R, 0, -0.12)), c.clone().add(V(-side * R, 0, 0.12))); }
    pts.push(bridle.clone());
    g.add(rope(pts, { r: 0.02, mat: M.ropeMat }));
  }
  const lc = ballCentre(leader);
  g.add(rope([bridle.clone(), lc.clone().add(V(0, 0, -R))], { r: 0.024, mat: M.ropeMat }));
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 24), M.ropeMat);
  coil.position.copy(toLocal(sl, V(0.42, sl.userData.blockTop + 0.03, 0.55)));
  coil.rotation.x = Math.PI / 2 - rp.userData.slope;
  g.add(coil);
  shadows(g);
  robots.forEach((r) => { r.blob.castShadow = false; r.blob.receiveShadow = false; });
  return { key: def.key, name: def.name, group: g, ramp: rp, sledge: sl, robots, leader, dir: def.dir.clone().normalize(), start: def.start.clone() };
}
