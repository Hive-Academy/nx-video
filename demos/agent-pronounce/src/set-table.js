// The Table: a physical set in metres, standing in the temple of Ptah (temple.js).
//
// Plan view (Y up, camera side is +Z):
//   temple painting .......... curved panel r 20 m behind, throne on the centre line
//   TRIBUNAL architrave ...... gold on stone, y 4.95, z -5.6, pillars at x +-3.3
//   bronze braziers .......... (-3.4, -3.2) and (3.5, -2.9)
//   judge bench + riser ...... z -2.75 (bench top 1.15, riser top 1.00), stone and gold
//   round stone dais ......... r 3.1, 4 cm, gold lip
//   round table .............. r 1.05, top 0.78
//   five stools .............. r 1.45 around the far 200 degrees, top 0.56
import * as THREE from 'three';
import { AGENTS, PANEL } from './assets.js';
import { createRobot, ROBOT } from './robot.js';
import { nameplateTexture, paperTexture, laptopScreenTexture, paddleTexture, contactShadowTexture, woodTexture } from './textures.js';
import { buildTempleLights } from './lighting.js';
import { buildTemple } from './temple.js';

export const SET = {
  robotScale: 0.38,
  judgeScale: 0.42,
  riser: 0.04, // stage riser height under table and stools
  table: { radius: 1.05, top: 0.78, thickness: 0.06 },
  seat: { radius: 1.45, top: 0.56, cushion: 0.22 },
  seatDeg: { Claude: -100, Cursor: -50, Antigravity: 0, Codex: 50, OpenCode: 100 },
  bench: { z: -2.75, width: 1.6, depth: 0.6, top: 1.15, riserTop: 1.0 },
  truss: { y: 3.7, z: -0.9, half: 4.2 },
  floor: '#0F2A33',
  cyc: '#1B4654',
  walnut: '#3B2416',
};

export function seatOf(name) {
  if (name === 'Conductor') {
    const z = SET.bench.z - 0.2;
    return { x: 0, z, y: SET.bench.riserTop, yaw: -Math.PI / 2, deg: 0 };
  }
  const a = THREE.MathUtils.degToRad(SET.seatDeg[name]);
  const x = SET.seat.radius * Math.sin(a);
  const z = -SET.seat.radius * Math.cos(a);
  // face the table centre: model +X must point along (-x, -z)
  const yaw = Math.atan2(z, -x);
  return { x, z, y: SET.seat.top, yaw, deg: SET.seatDeg[name] };
}

// Position on the table top at radius r along an angle (deg) measured like seats.
export function onTable(deg, r) {
  const a = THREE.MathUtils.degToRad(deg);
  return new THREE.Vector3(r * Math.sin(a), SET.table.top, -r * Math.cos(a));
}

const std = (color, roughness = 0.6, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

function add(parent, geo, mat, pos, { cast = true, receive = true, rot } = {}) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}

let blobTex = null;
function contactShadow(parent, x, y, z, w, d, opacity = 0.7) {
  blobTex = blobTex || contactShadowTexture();
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity, toneMapped: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.renderOrder = 1;
  m.userData.noDepth = true;
  parent.add(m);
  return m;
}


function buildDais(scene) {
  add(scene, new THREE.CylinderGeometry(3.1, 3.15, SET.riser, 96), std('#2B2219', 0.42, 0.1), [0, SET.riser / 2, -0.3], { cast: false });
  add(scene, new THREE.TorusGeometry(3.12, 0.014, 8, 160), std('#C9993F', 0.3, 0.85), [0, SET.riser, -0.3], { cast: false, rot: [Math.PI / 2, 0, 0] });
}

function buildTable(scene) {
  const T = SET.table;
  const wood = std(SET.walnut, 0.55, 0.02, { map: woodTexture() });
  wood.map.repeat.set(2, 2);
  const group = new THREE.Group();
  scene.add(group);
  const top = add(group, new THREE.CylinderGeometry(T.radius, T.radius - 0.02, T.thickness, 96), wood, [0, T.top - T.thickness / 2, 0]);
  add(group, new THREE.TorusGeometry(T.radius - 0.004, 0.012, 10, 160), std('#C99A42', 0.32, 0.85), [0, T.top - 0.012, 0], { rot: [Math.PI / 2, 0, 0] });
  add(group, new THREE.CylinderGeometry(0.15, 0.2, T.top - T.thickness - SET.riser, 32), std('#2A190F', 0.5), [0, (T.top - T.thickness + SET.riser) / 2, 0]);
  add(group, new THREE.CylinderGeometry(0.55, 0.6, 0.05, 48), std('#2A190F', 0.5), [0, SET.riser + 0.025, 0]);
  contactShadow(scene, 0, SET.riser + 0.003, 0, 3.0, 3.0, 0.6);
  return { group, top };
}

function buildStool(scene, name) {
  const s = seatOf(name);
  const g = new THREE.Group();
  g.position.set(s.x, 0, s.z);
  scene.add(g);
  const leather = std('#2B1D17', 0.55);
  const metal = std('#3A3F44', 0.35, 0.8);
  add(g, new THREE.CylinderGeometry(SET.seat.cushion, SET.seat.cushion * 0.95, 0.07, 40), leather, [0, SET.seat.top - 0.035, 0]);
  add(g, new THREE.CylinderGeometry(0.03, 0.03, SET.seat.top - 0.07 - SET.riser, 12), metal, [0, (SET.seat.top - 0.07 + SET.riser) / 2, 0]);
  add(g, new THREE.TorusGeometry(0.15, 0.012, 8, 40), metal, [0, 0.22, 0], { rot: [Math.PI / 2, 0, 0] });
  add(g, new THREE.CylinderGeometry(0.2, 0.22, 0.025, 32), metal, [0, SET.riser + 0.0125, 0]);
  contactShadow(scene, s.x, SET.riser + 0.004, s.z, 0.75, 0.75, 0.55);
}

function buildBench(scene, assets) {
  const B = SET.bench;
  const g = new THREE.Group();
  g.position.set(0, 0, B.z);
  scene.add(g);
  const wood = std('#2E261E', 0.5, 0.05); // dark stone
  const panel = std('#3B3127', 0.45, 0.05);
  const brass = std('#C99A42', 0.3, 0.88);
  // body, overhanging top, raised front panels, brass rail
  add(g, new THREE.BoxGeometry(B.width, B.top - 0.05, B.depth), wood, [0, (B.top - 0.05) / 2, 0]);
  add(g, new THREE.BoxGeometry(B.width + 0.12, 0.05, B.depth + 0.1), wood, [0, B.top - 0.025, 0.02]);
  add(g, new THREE.BoxGeometry(B.width + 0.13, 0.018, 0.02), brass, [0, B.top - 0.06, B.depth / 2 + 0.07]);
  for (const x of [-0.5, 0, 0.5]) {
    add(g, new THREE.BoxGeometry(0.44, 0.64, 0.016), brass, [x, 0.5, B.depth / 2 + 0.006]);
    add(g, new THREE.BoxGeometry(0.4, 0.6, 0.02), panel, [x, 0.5, B.depth / 2 + 0.012]);
  }
  // riser the Conductor stands on, behind the bench
  add(g, new THREE.BoxGeometry(1.2, B.riserTop, 0.8), std('#2A190F', 0.6), [0, B.riserTop / 2, -0.55]);
  // bench nameplate: brass with the Ptah emblem, wide enough for CONDUCTOR
  const tex = nameplateTexture('Conductor', assets.emblem || assets.icons[AGENTS.Conductor.icon], AGENTS.Conductor.color, { emblem: !!assets.emblem });
  add(g, new THREE.PlaneGeometry(0.8, 0.2), std('#FFFFFF', 0.35, 0.4, { map: tex }), [0, 0.95, B.depth / 2 + 0.024], { cast: false });
  contactShadow(scene, 0, 0.003, B.z, 2.6, 1.4, 0.6);
  // sound block for the gavel
  add(g, new THREE.CylinderGeometry(0.075, 0.08, 0.035, 32), std('#2A190F', 0.45), [0.48, B.top + 0.0175, 0.1]);
  return g;
}




// Tent-style brass nameplate on the table in front of a robot, facing the table centre.
function buildNameplate(scene, assets, name) {
  const s = seatOf(name);
  const pos = onTable(s.deg, 0.86);
  const g = new THREE.Group();
  g.position.copy(pos);
  g.rotation.y = Math.atan2(-pos.x, -pos.z); // +Z faces the centre
  scene.add(g);
  const tex = nameplateTexture(name, assets.icons[AGENTS[name].icon], AGENTS[name].color);
  const w = 0.4, h = 0.1, lean = 0.32;
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.55, envMapIntensity: 0.9 });
  const back = std('#B8893A', 0.35, 0.8);
  const front = add(g, new THREE.PlaneGeometry(w, h), face, [0, (h / 2) * Math.cos(lean), (h / 2) * Math.sin(lean)], { rot: [-lean, 0, 0] });
  const rear = add(g, new THREE.PlaneGeometry(w, h), back, [0, (h / 2) * Math.cos(lean), -(h / 2) * Math.sin(lean)], { rot: [lean, Math.PI, 0] });
  add(g, new THREE.BoxGeometry(w, 0.006, h * Math.sin(lean) * 2 + 0.01), back, [0, 0.003, 0]);
  front.material.side = THREE.FrontSide;
  rear.material.side = THREE.FrontSide;
  return { id: `plate-${name}`, object: g, half: { h: 0.0, r: 0.2 }, rest: g.position.clone(), restRot: new THREE.Euler(0, g.rotation.y, 0) };
}

// ---------------------------------------------------------------- props

export const PAPER = { w: 0.21, d: 0.297, sheet: 0.007, block: 0.15, loose: 6 };

function buildProps(scene) {
  const props = {};
  // Claude's paper stack: a solid block plus loose top sheets that can slide and fly.
  const claude = seatOf('Claude');
  const stackPos = onTable(claude.deg - 20, 0.6);
  const paperSide = std('#E9DECD', 0.8);
  const sheets = [];
  const block = new THREE.Mesh(new THREE.BoxGeometry(PAPER.w, PAPER.block, PAPER.d), [paperSide, paperSide, std('#F4ECDC', 0.75, 0, { map: paperTexture(1) }), paperSide, paperSide, paperSide]);
  block.castShadow = block.receiveShadow = true;
  scene.add(block);
  for (let i = 0; i < PAPER.loose; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(PAPER.w, PAPER.sheet, PAPER.d), [paperSide, paperSide, std('#F6EFE2', 0.75, 0, { map: paperTexture(i) }), paperSide, paperSide, paperSide]);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    sheets.push(m);
  }
  const stackYaw = Math.atan2(-stackPos.x, -stackPos.z) + 0.25;
  props.stack = { block, sheets, pos: stackPos, yaw: stackYaw };

  // Codex's mug
  const codex = seatOf('Codex');
  const mugPos = onTable(codex.deg - 16, 0.74);
  const mug = new THREE.Group();
  const cream = std('#F3E6CE', 0.35);
  add(mug, new THREE.CylinderGeometry(0.048, 0.044, 0.105, 28), cream, [0, 0.0525, 0]);
  add(mug, new THREE.CylinderGeometry(0.0495, 0.0495, 0.022, 28), std(AGENTS.Codex.color, 0.45), [0, 0.07, 0]);
  add(mug, new THREE.TorusGeometry(0.028, 0.008, 8, 18), cream, [0.055, 0.055, 0], { rot: [0, 0, 0] });
  add(mug, new THREE.CircleGeometry(0.043, 20), std('#3A1F10', 0.25), [0, 0.098, 0], { rot: [-Math.PI / 2, 0, 0], cast: false });
  mug.position.copy(mugPos);
  scene.add(mug);
  props.mug = { object: mug, pos: mugPos, yaw: Math.atan2(-mugPos.x, -mugPos.z) };

  // Antigravity's laptop (lid open) that floats up on row 8
  const anti = seatOf('Antigravity');
  const lapPos = onTable(anti.deg + 24, 0.7);
  const laptop = new THREE.Group();
  const alu = std('#A9B4BE', 0.35, 0.7);
  add(laptop, new THREE.BoxGeometry(0.3, 0.014, 0.21), alu, [0, 0.007, 0]);
  const lid = new THREE.Group();
  lid.position.set(0, 0.014, -0.105);
  lid.rotation.x = -1.85 + Math.PI / 2;
  laptop.add(lid);
  add(lid, new THREE.BoxGeometry(0.3, 0.21, 0.01), alu, [0, 0.105, -0.005]);
  add(lid, new THREE.PlaneGeometry(0.27, 0.18), new THREE.MeshStandardMaterial({ map: laptopScreenTexture(AGENTS.Antigravity.color), emissive: '#FFFFFF', emissiveMap: laptopScreenTexture(AGENTS.Antigravity.color), emissiveIntensity: 0.55, roughness: 0.3 }), [0, 0.105, 0.0015], { cast: false });
  laptop.position.copy(lapPos);
  scene.add(laptop);
  props.laptop = { object: laptop, pos: lapPos, yaw: Math.atan2(-lapPos.x, -lapPos.z) + Math.PI };

  // OpenCode's objection paddle, lying flat until row 9
  const open = seatOf('OpenCode');
  const padPos = onTable(open.deg - 22, 0.66);
  const paddle = new THREE.Group();
  add(paddle, new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10), std('#A47340', 0.5), [0, 0.1, 0]);
  add(paddle, new THREE.BoxGeometry(0.2, 0.2, 0.012), [std('#F4E9D3', 0.6), std('#F4E9D3', 0.6), std('#F4E9D3', 0.6), std('#F4E9D3', 0.6), std('#FFFFFF', 0.55, 0, { map: paddleTexture() }), std('#F4E9D3', 0.6)], [0, 0.3, 0]);
  paddle.position.copy(padPos);
  scene.add(paddle);
  props.paddle = { object: paddle, pos: padPos, yaw: Math.atan2(-padPos.x, -padPos.z) };

  // Conductor's gavel on the bench
  const gavel = new THREE.Group();
  const gavelWood = std('#6E4A24', 0.45);
  const handle = add(gavel, new THREE.CylinderGeometry(0.012, 0.014, 0.26, 10), gavelWood, [0.13, 0, 0], { rot: [0, 0, Math.PI / 2] });
  handle.name = 'handle';
  const headG = add(gavel, new THREE.CylinderGeometry(0.035, 0.035, 0.13, 18), gavelWood, [0, 0, 0], { rot: [Math.PI / 2, 0, 0] });
  add(gavel, new THREE.CylinderGeometry(0.037, 0.037, 0.012, 18), std('#C99A42', 0.3, 0.85), [0, 0, 0.05], { rot: [Math.PI / 2, 0, 0] });
  add(gavel, new THREE.CylinderGeometry(0.037, 0.037, 0.012, 18), std('#C99A42', 0.3, 0.85), [0, 0, -0.05], { rot: [Math.PI / 2, 0, 0] });
  headG.name = 'head';
  // pivot sits at the handle's end; rest pose has the head on the sound block
  const gavelPivot = new THREE.Group();
  gavelPivot.add(gavel);
  gavel.position.set(-0.26, 0, 0);
  const gavelRest = new THREE.Vector3(0.48 + 0.26, SET.bench.top + 0.035 + 0.036, SET.bench.z + 0.1);
  gavelPivot.position.copy(gavelRest);
  scene.add(gavelPivot);
  props.gavel = { object: gavelPivot, pos: gavelRest };

  return props;
}

export function buildTableSet(scene, assets) {
  const temple = buildTemple(scene, assets);
  buildDais(scene);
  const table = buildTable(scene);
  for (const name of PANEL) buildStool(scene, name);
  const bench = buildBench(scene, assets);
  const lights = buildTempleLights(scene);

  const robots = {};
  for (const name of [...PANEL, 'Conductor']) {
    const seat = seatOf(name);
    const r = createRobot(assets, name, { scale: name === 'Conductor' ? SET.judgeScale : SET.robotScale });
    r.root.position.set(seat.x, seat.y, seat.z);
    r.root.rotation.y = seat.yaw;
    r.seat = seat;
    scene.add(r.root);
    robots[name] = r;
  }
  const nameplates = PANEL.map((n) => buildNameplate(scene, assets, n));
  const props = buildProps(scene);
  return { table, bench, temple, lights, robots, nameplates, props };
}

// Bounding boxes used for placement checks and the report.
export function measureSet(set) {
  const out = {};
  for (const [name, r] of Object.entries(set.robots)) {
    r.root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(r.root);
    out[name] = { min: b.min.toArray().map((v) => +v.toFixed(3)), max: b.max.toArray().map((v) => +v.toFixed(3)) };
  }
  out.ballGapToTableEdge = +(SET.seat.radius - ROBOT.ballRadius * SET.robotScale - SET.table.radius).toFixed(3);
  return out;
}
