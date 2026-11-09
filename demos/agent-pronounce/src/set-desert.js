// Episode 6 desert kind. The approved geometry, materials and hero camera live in
// look-desert.js (buildDesertLook). This module only animates that look:
// sofa landing, Ptah's speech glow, crew haul, Cursor's pass, the stamp and
// the pylon portal. src/ptah-god.js (the old wireframe god) is retired: nothing
// imports it.
//
// Every value is a pure function of seek time t. hash / noise1 only.
import * as THREE from 'three';
import { dune } from './craft.js';
import { createRobot } from './robot.js';
import {
  tourSpec, speak, listen, idle, anticipate, face, faceToward, glideTo, wordTime, sceneCue,
} from './cribs.js';
import { keyed } from './cribs-camera.js';
import { hash, noise1, ease, clamp, lerp, smoothstep, sampleEnvelope, yawToward } from './util.js';

// Mirrors sandGround() in craft.js so feet sit on the displaced dunes.
function sandY(x, z) {
  const r = Math.hypot(x, z - 4);
  const flat = Math.min(1, Math.max(0, (r - 6) / 30));
  return dune(x, z) * flat * (1 + Math.max(0, r - 60) / 40);
}

const _aim = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _posB = new THREE.Vector3();
const _side = new THREE.Vector3();
const _warm = new THREE.Color('#FF8A2A');
const _white = new THREE.Color('#FFF7EC');
const _col = new THREE.Color();

function pinSeat(robot) {
  robot.seat = {
    x: robot.root.position.x,
    y: robot.root.position.y,
    z: robot.root.position.z,
    yaw: robot.root.rotation.y,
  };
  return robot.seat;
}

function sampleKeys(keys, t, out) {
  if (t <= keys[0].t) return out.copy(keys[0].pos);
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i].t) {
      const e = keys[i].ease || ease.power2InOut;
      const u = e((t - keys[i - 1].t) / Math.max(1e-3, keys[i].t - keys[i - 1].t));
      return out.lerpVectors(keys[i - 1].pos, keys[i].pos, u);
    }
  }
  return out.copy(keys[keys.length - 1].pos);
}

function shot(cam, keys, dist, t0, still = false) {
  const s = keyed(cam, keys, { dist });
  if (cam === 'establish') {
    const sample = s.sample;
    s.sample = (t) => {
      const pose = sample(t);
      const dt = t - 0.3;
      if (dt >= 0 && dt < 0.15) pose.pos.y += 0.065 * Math.sin(dt * 95) * Math.exp(-17 * dt);
      return pose;
    };
  }
  s.t0 = t0;
  if (still) s.still = true;
  return s;
}

function faceLens(robot, cam) {
  _aim.copy(cam);
  _aim.x += 0.45;
  _aim.y = robot.root.position.y + 0.4;
  robot.root.rotation.y = yawToward(robot.root.position, _aim);
}

function findMesh(root, pred) {
  let found = null;
  root.traverse((o) => { if (!found && o.isMesh && pred(o)) found = o; });
  return found;
}

function forwardOf(yaw, out) {
  return out.set(Math.cos(yaw), 0, -Math.sin(yaw));
}

// ---------------------------------------------------------------- build

async function build(scene, assets, ctx) {
  const look = await ctx.useLook('desert');
  const h = look.handles;

  pinSeat(h.claude);
  pinSeat(h.codex);
  const hostMaterials = [];
  const portalRims = [];
  for (const host of [h.claude, h.codex]) host.root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (m?.color && !hostMaterials.some((v) => v.m === m)) hostMaterials.push({ m, color: m.color.clone(), emissive: m.emissive?.clone() });
    }
  });
  for (const host of [h.claude, h.codex]) {
    const meshes = [];
    host.root.traverse((o) => { if (o.isMesh && o.geometry) meshes.push(o); });
    for (const mesh of meshes) {
      const rim = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: '#FFAA36', side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
      rim.scale.setScalar(1.24);
      rim.visible = false;
      mesh.add(rim);
      portalRims.push(rim);
    }
  }

  const door = findMesh(h.pylon, (o) => o.geometry?.parameters?.width === 2.2 && o.geometry?.parameters?.height === 4.8);
  if (door) {
    door.material = door.material.clone();
    door.material.emissive = new THREE.Color('#000000');
    door.material.emissiveIntensity = 0;
  }
  const portalCanvas = document.createElement('canvas');
  portalCanvas.width = 256; portalCanvas.height = 512;
  const pc = portalCanvas.getContext('2d');
  const grad = pc.createRadialGradient(128, 255, 25, 128, 255, 285);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.36, '#FFF8D9');
  grad.addColorStop(0.72, '#FFD98C');
  grad.addColorStop(1, '#AD5927');
  pc.fillStyle = grad; pc.fillRect(0, 0, 256, 512);
  const portalTex = new THREE.CanvasTexture(portalCanvas);
  portalTex.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.05, 4.55),
    new THREE.MeshBasicMaterial({ map: portalTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, fog: false }),
  );
  glow.position.set(0, 2.42, 0.14);
  glow.userData.noDepth = true;
  glow.renderOrder = 2;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 1.25, 8.2, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: '#FFD2A0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, fog: false, toneMapped: false,
    }),
  );
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(0, 2.7, 4.3);
  shaft.userData.noDepth = true;
  const doorLight = new THREE.PointLight('#FFB060', 0, 18, 1.35);
  doorLight.position.set(0, 2.7, 1.5);
  h.pylon.add(glow, shaft, doorLight);
  const rays = [];
  for (let i = 0; i < 5; i++) {
    const ray = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8 + i * 0.45, 6 + i * 1.0),
      new THREE.MeshBasicMaterial({ color: i % 2 ? '#FFF0BD' : '#FFE2A0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }),
    );
    ray.rotation.x = -Math.PI / 2;
    ray.rotation.z = (i - 2) * 0.2;
    ray.position.set((i - 2) * 0.28, 0.035, 3.1 + i * 0.65);
    h.pylon.add(ray); rays.push(ray);
  }
  const reliefMat = new THREE.MeshStandardMaterial({ color: '#C69B51', roughness: 0.52, metalness: 0.2 });
  for (const x of [-1.23, 1.23]) for (let j = 0; j < 7; j++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.08), reliefMat);
    band.position.set(x, 0.8 + j * 0.56, 0.2);
    h.pylon.add(band);
  }
  h.pylon.updateWorldMatrix(true, true);
  const doorWorld = h.pylon.localToWorld(new THREE.Vector3(0, 2.45, 0.2));
  const pylonYaw = h.pylon.rotation.y;
  // Pylon local +Z is the doorway. rotation.y maps it to (sin yaw, 0, cos yaw),
  // which is not the robot forward (cos yaw, 0, -sin yaw).
  const pylonFront = new THREE.Vector3(Math.sin(pylonYaw), 0, Math.cos(pylonYaw));

  const golds = [];
  h.sceptre.traverse((o) => {
    if (!o.isMesh || !o.material?.color) return;
    const c = o.material.color;
    if (c.r > 0.75 && c.g > 0.55 && c.b < 0.42 && !golds.includes(o.material)) golds.push(o.material);
  });

  const blocks = [];
  const scatterBlocks = [];
  const ropes = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.geometry?.parameters) return;
    const p = o.geometry.parameters;
    if (p.width === 1.1 && p.height === 0.75 && p.depth === 0.8) blocks.push(o);
    if (p.width === 1 && p.height === 0.7 && p.depth === 0.8) scatterBlocks.push(o);
    if (p.radiusTop === 0.015 && p.height === 3.2) ropes.push(o);
  });

  const crewHomes = h.crewRobots.map((robot, i) => ({
    robot,
    crew: Math.floor(i / 4),
    slot: i % 4,
    home: robot.root.position.clone(),
    phase: hash('crew', i, 'ph'),
  }));
  const crewHaulRopes = Array.from({ length: 15 }, (_, i) => {
    const radius = i % 5 === 0 ? 0.038 : 0.021;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 8), new THREE.MeshStandardMaterial({ color: '#D5A568', roughness: 1 }));
    rope.visible = false;
    scene.add(rope);
    return rope;
  });
  const ramp = h.pyramid.userData.ramp;
  const foot = new THREE.Vector3(h.pyramid.position.x + ramp.x, 0, h.pyramid.position.z + ramp.z0);
  const sledHomes = h.sleds.map((sled, i) => ({
    sled,
    crew: i,
    home: sled.position.clone(),
    baseY: sled.position.y,
  }));
  const blockHomes = blocks.map((block) => ({
    block,
    home: block.position.clone(),
    baseY: block.position.y,
    sled: sledHomes.reduce((best, s) => {
      const d = s.home.distanceTo(block.position);
      return !best || d < best.d ? { s, d } : best;
    }, null)?.s || null,
  }));
  const ropeHomes = ropes.map((rope) => {
    const sled = sledHomes.reduce((best, s) => {
      const d = new THREE.Vector2(s.home.x, s.home.z).distanceTo(new THREE.Vector2(rope.position.x, rope.position.z));
      return !best || d < best.d ? { s, d } : best;
    }, null)?.s || null;
    return { rope, home: rope.position.clone(), baseY: rope.position.y, sled };
  });

  const banners = h.banners.map((group, i) => {
    const cloth = findMesh(group, (o) => o.geometry?.type === 'PlaneGeometry');
    const base = cloth ? new Float32Array(cloth.geometry.attributes.position.array) : null;
    const markCanvas = document.createElement('canvas');
    markCanvas.width = 128; markCanvas.height = 128;
    const mc = markCanvas.getContext('2d');
    mc.fillStyle = '#F8E7BA';
    mc.beginPath();
    if (i % 3 === 0) { mc.moveTo(64, 20); mc.lineTo(105, 99); mc.lineTo(23, 99); }
    else if (i % 3 === 1) { mc.moveTo(64, 13); mc.lineTo(112, 64); mc.lineTo(64, 115); mc.lineTo(16, 64); }
    else { mc.arc(64, 64, 37, 0, Math.PI * 2); }
    mc.closePath(); mc.fill();
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.38), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(markCanvas), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    mark.position.set(0.36, 2.55, 0.045);
    mark.visible = false;
    group.add(mark);
    return { group, home: group.position.clone(), cloth, base, mark, i };
  });

  const baseRamp = findMesh(h.pyramid, (o) => o.geometry?.parameters?.width === 3.2 && o.geometry?.parameters?.depth === 26);
  const extraRamps = [];
  const rampHomeX = baseRamp?.position.x;
  if (baseRamp) for (const x of [8, 18]) {
    const copy = baseRamp.clone();
    copy.position.x = x;
    copy.material = baseRamp.material.clone();
    copy.material.color.set('#E6B978');
    copy.material.emissive.set('#8B4D21');
    copy.material.emissiveIntensity = 0.28;
    copy.visible = false;
    h.pyramid.add(copy);
    extraRamps.push(copy);
  }
  if (baseRamp) {
    baseRamp.scale.set(0.64, 1, 0.62);
    baseRamp.material = baseRamp.material.clone();
    baseRamp.material.color.set('#E6B978');
    baseRamp.material.emissive.set('#8B4D21');
    baseRamp.material.emissiveIntensity = 0.9;
    for (const copy of extraRamps) { copy.scale.copy(baseRamp.scale); copy.material.emissiveIntensity = 0.9; }
  }

  const dustAttr = h.dustPoints.geometry.attributes.position;
  const dustBase = new Float32Array(dustAttr.array);

  const sofaRest = {
    y: h.sofa.position.y,
    x: h.sofa.rotation.x,
    z: h.sofa.rotation.z,
  };

  // Landing dust, seeded once. Positions are rewritten from these velocities.
  const N = 160;
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const dustVel = [];
  for (let i = 0; i < N; i++) {
    const a = hash('land', i, 'a') * Math.PI * 2;
    const sp = 0.7 + hash('land', i, 's') * 1.5;
    dustVel.push({
      x: Math.cos(a) * sp,
      z: Math.sin(a) * sp * 0.85,
      y: 0.45 + hash('land', i, 'y') * 1.15,
    });
  }
  const dustCanvas = document.createElement('canvas');
  dustCanvas.width = dustCanvas.height = 64;
  const dustCtx = dustCanvas.getContext('2d');
  const dustGrad = dustCtx.createRadialGradient(32, 32, 3, 32, 32, 32);
  dustGrad.addColorStop(0, 'rgba(239,210,166,0.8)');
  dustGrad.addColorStop(0.55, 'rgba(239,210,166,0.35)');
  dustGrad.addColorStop(1, 'rgba(239,210,166,0)');
  dustCtx.fillStyle = dustGrad;
  dustCtx.fillRect(0, 0, 64, 64);
  const landDust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(dustCanvas), color: '#F0D2A4', size: 0.72, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true,
  }));
  landDust.userData.noDepth = true;
  landDust.visible = false;
  scene.add(landDust);
  const puffCanvas = document.createElement('canvas');
  puffCanvas.width = puffCanvas.height = 128;
  const puffCtx = puffCanvas.getContext('2d');
  const puffGrad = puffCtx.createRadialGradient(64, 64, 14, 64, 64, 64);
  puffGrad.addColorStop(0, 'rgba(239,210,166,0)');
  puffGrad.addColorStop(0.38, 'rgba(190,139,89,0.85)');
  puffGrad.addColorStop(0.72, 'rgba(190,139,89,0.55)');
  puffGrad.addColorStop(1, 'rgba(239,210,166,0)');
  puffCtx.fillStyle = puffGrad;
  puffCtx.fillRect(0, 0, 128, 128);
  const landPuff = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(puffCanvas), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  landPuff.rotation.x = -Math.PI / 2;
  landPuff.visible = false;
  scene.add(landPuff);

  // Cursor, the series rig, parked beside the inspector until his pass.
  const inspector = h.inspector;
  inspector.root.scale.multiplyScalar(1.65);
  const insHome = inspector.root.position.clone();
  const gyIns = sandY(insHome.x, insHome.z);
  inspector.root.position.y = insHome.y + gyIns;
  const faceDir = forwardOf(inspector.root.rotation.y, new THREE.Vector3());
  const up = new THREE.Vector3(0, 1, 0);
  const camRight = new THREE.Vector3().crossVectors(up, faceDir).normalize();
  const passFrom = insHome.clone().add(new THREE.Vector3(0.55, 0, -0.35));
  const passTo = insHome.clone().add(new THREE.Vector3(2.8, 0, -0.35));
  passFrom.y = sandY(passFrom.x, passFrom.z);
  passTo.y = sandY(passTo.x, passTo.z);

  const cursor = createRobot(assets, 'Cursor', { scale: 0.42 });
  cursor.root.position.copy(passFrom);
  cursor.root.rotation.y = yawToward(passFrom, insHome.clone().addScaledVector(faceDir, 2.4));
  const carried = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.35, 0.42),
    new THREE.MeshStandardMaterial({ color: '#E4C59A', roughness: 0.82 }),
  );
  carried.position.set(0.12, 0.94, 0);
  carried.castShadow = true;
  cursor.ballHead.add(carried);
  scene.add(cursor.root);
  pinSeat(cursor);

  const lines = new THREE.Group();
  const streaks = [];
  const trailShape = new THREE.BufferGeometry();
  trailShape.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.035, 0, 0, 0.035, 0, -1, 0, 0], 3));
  trailShape.setAttribute('color', new THREE.Float32BufferAttribute([1, 0.88, 0.5, 1, 0.88, 0.5, 0.15, 0.05, 0.01], 3));
  trailShape.setIndex([0, 1, 2]);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(
      trailShape,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    );
    m.userData.noDepth = true;
    lines.add(m);
    streaks.push(m);
  }
  scene.add(lines);

  const zipDustGeo = new THREE.BufferGeometry();
  zipDustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
  const zipDust = new THREE.Points(zipDustGeo, new THREE.PointsMaterial({
    color: '#E8C8A0', size: 0.16, transparent: true, opacity: 0, depthWrite: false,
  }));
  zipDust.userData.noDepth = true;
  scene.add(zipDust);

  // Stamp rig sits on the block nearest the inspector (Cursor's crew block).
  let stampBlock = null;
  let bestD = Infinity;
  for (const b of blocks) {
    const d = b.position.distanceTo(new THREE.Vector3(-2, 0.75, -21));
    if (d < bestD) { bestD = d; stampBlock = b; }
  }
  const stampG = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#E8B54A', metalness: 0.75, roughness: 0.32, emissive: '#E8B54A', emissiveIntensity: 0.2 });
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.36, 0.24, 24), gold);
  head.rotation.x = Math.PI / 2;
  stampG.add(head);
  const stampGlyph = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const stroke = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.035), new THREE.MeshBasicMaterial({ color: '#FFF0B0', side: THREE.DoubleSide }));
    stroke.rotation.z = i * Math.PI / 3;
    stampGlyph.add(stroke);
  }
  stampGlyph.position.z = 0.13;
  stampG.add(stampGlyph);
  scene.add(stampG);
  const gripLink = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), new THREE.MeshBasicMaterial({ color: '#7BE8E5', blending: THREE.AdditiveBlending, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
  scene.add(gripLink);
  const seal = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.38, 36),
    new THREE.MeshStandardMaterial({ color: '#F2C14E', emissive: '#F2C14E', emissiveIntensity: 0.4, roughness: 0.35, side: THREE.DoubleSide }),
  );
  // Put the imprint on the camera-facing face so it reads at phone size.
  seal.rotation.x = 0;
  for (let i = 0; i < 3; i++) {
    const glyph = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.055), gold);
    glyph.rotation.z = i * Math.PI / 3;
    glyph.position.z = 0.015;
    seal.add(glyph);
  }
  seal.visible = false;
  scene.add(seal);
  const stampDust = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.54, 40),
    new THREE.MeshBasicMaterial({ color: '#FFF0C6', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
  );
  stampDust.rotation.x = -Math.PI / 2;
  scene.add(stampDust);

  // Beside the block, on the inspector's face side, so the lens is not inside the stone.
  // View the inspector from the open south side of the work lane. The old
  // camera looked along the sled and put its stone block across the frame.
  const passCam = insHome.clone().add(new THREE.Vector3(0.5, 1.5, 3.5));
  const passLook = insHome.clone().add(new THREE.Vector3(-0.75, 0.78, -0.15));

  // Portal foreground. Spots flank the doorway; face points turn each robot
  // toward the door and three-quarters toward the lens.
  const side = new THREE.Vector3(pylonFront.z, 0, -pylonFront.x);
  const claudeSpot = doorWorld.clone().addScaledVector(pylonFront, 3.25).addScaledVector(side, 0.88);
  const codexSpot = doorWorld.clone().addScaledVector(pylonFront, 3.1).addScaledVector(side, -0.88);
  claudeSpot.y = sandY(claudeSpot.x, claudeSpot.z);
  codexSpot.y = sandY(codexSpot.x, codexSpot.z);
  const claudeFace = claudeSpot.clone().addScaledVector(pylonFront, 2).addScaledVector(side, -1.8);
  claudeFace.y = 1.15;
  const codexFace = codexSpot.clone().addScaledVector(pylonFront, 2).addScaledVector(side, 1.8);
  codexFace.y = 1.15;
  const portalCam = doorWorld.clone().addScaledVector(pylonFront, 10.7).addScaledVector(side, 0.05);
  portalCam.y = 1.5;
  const portalLook = doorWorld.clone();
  portalLook.y = 1.55;

  return {
    robots: { Claude: h.claude, Codex: h.codex, Cursor: cursor },
    handles: h,
    post: { bloom: look.bloom, exposure: look.exposure, toneMapping: 'aces', shadows: true },
    door, glow, shaft, doorLight, rays, hostMaterials, portalRims, golds, doorWorld, pylonFront, side,
    crewHomes, crewHaulRopes, scatterBlocks, foot, sledHomes, blockHomes, ropeHomes, banners, extraRamps, baseRamp, rampHomeX,
    dustAttr, dustBase, sofaRest, landDust, landPuff, dustVel,
    inspector, stampG, gripLink, seal, stampDust, stampBlock, streaks, zipDust,
    passFrom, passTo, passCam, passLook, camRight, faceDir,
    claudeSpot, codexSpot, claudeFace, codexFace, portalCam, portalLook,
    lookPose: {
      Claude: { eyeSX: 1.35, eyeSY: 1.4, pitch: -0.1, nod: 0.06, headYaw: 0 },
      Codex: { eyeSX: 1.2, eyeSY: 1.3, pitch: 0, nod: 0.02, headYaw: -0.25 },
    },
  };
}

// ---------------------------------------------------------------- plan

function plan(world, ctx) {
  const duration = ctx.duration;
  const D1 = ctx.row('D1');
  const D2 = ctx.row('D2');
  const D3 = ctx.row('D3');
  const D4 = ctx.row('D4');
  const D5 = ctx.row('D5');
  const D6 = ctx.row('D6');
  const rows = ctx.rows;
  const ptahRows = rows.filter((r) => String(r.speaker || '').toLowerCase() === 'conductor');

  const sofaLand = sceneCue(ctx, 'sofaLand', 0.3);
  const rise = sceneCue(ctx, 'rise', D1 ? D1.localStart : 0.3);
  const pan = sceneCue(ctx, 'pan', D3 ? wordTime(D3, 'Look', 0, 'start') : 10);
  const cursorPass = sceneCue(ctx, 'cursorPass', D4 ? D4.localStart : 15);
  const stamp = sceneCue(ctx, 'stamp', D4 ? wordTime(D4, 'checked', 0, 'start') : cursorPass + 0.1);
  const portal = sceneCue(ctx, 'portal', D5 ? wordTime(D5, 'desktop', 0.85, 'end') : 20);

  // Six shots, each held at least 2.5 s. The hero framing stays put through the
  // landing so the approved still can match; the low angle starts once that hold
  // is long enough, which is still inside D1.
  const tHero = 0;
  const tLow = 2.55;
  const tTwo = Math.max(tLow + 2.55, D2 ? D2.localStart + 0.5 : 5.22);
  const tPan = Math.max(tTwo + 2.55, D3 ? D3.localStart - 0.5 : pan);
  const tPass = Math.max(tPan + 2.55, cursorPass - 0.5);
  const tReturn = 20.01;
  const tPortal = Math.max(tPass + 2.55, portal);

  const claudeSeat = world.robots.Claude.seat;
  const codexSeat = world.robots.Codex.seat;
  const specs = {
    Claude: tourSpec('Claude', claudeSeat, { scale: world.robots.Claude.scale, seedTag: 'desert' }),
    Codex: tourSpec('Codex', codexSeat, { scale: world.robots.Codex.scale, seedTag: 'desert' }),
    Cursor: tourSpec('Cursor', world.robots.Cursor.seat, { scale: world.robots.Cursor.scale, seedTag: 'desert' }),
  };

  const contact = sofaLand;
  for (const n of ['Claude', 'Codex']) {
    specs[n].bumps.push({ t: contact, vy: 0.42, pitch: 0.12, roll: (n === 'Claude' ? 1 : -1) * 0.1 });
    idle(specs[n], 1.1, duration);
  }
  const ptahPos = world.handles.ptah.root.position;
  const ptahHead = new THREE.Vector3(ptahPos.x, 3.6, ptahPos.z);
  for (const n of ['Claude', 'Codex']) faceToward(specs[n], rise + 0.35, ptahHead);

  if (D2) {
    anticipate(specs.Claude, D2);
    speak(specs.Claude, D2);
    listen(specs, 'Claude', D2);
    face(specs.Claude, D2.localStart - 0.25, claudeSeat.yaw);
  }
  if (D4) {
    anticipate(specs.Cursor, D4);
    speak(specs.Cursor, D4);
    listen(specs, 'Cursor', D4, { except: ['Claude', 'Codex'] });
  }
  if (D6) {
    anticipate(specs.Codex, D6);
    speak(specs.Codex, D6, { gain: 0.65 });
    listen(specs, 'Codex', D6, { except: ['Cursor'] });
    specs.Codex.eyes.push({ t0: D6.localStart, t1: duration + 1, sx: 1.02, sy: 0.58 });
  }

  const claudeYaw = yawToward(world.claudeSpot, world.claudeFace);
  const codexYaw = yawToward(world.codexSpot, world.codexFace);
  const glideStart = Math.max(tPass + 1.6, tPortal - 2.45);
  const glideDur = Math.max(2.05, tPortal - 0.35 - glideStart);
  glideTo(specs.Claude, glideStart, { x: world.claudeSpot.x, z: world.claudeSpot.z }, glideDur, { face: false, lean: -0.06 });
  glideTo(specs.Codex, glideStart + 0.08, { x: world.codexSpot.x, z: world.codexSpot.z }, glideDur, { face: false, lean: -0.06 });
  face(specs.Claude, glideStart, claudeYaw);
  face(specs.Codex, glideStart + 0.08, codexYaw);
  if (D6) {
    // listen() may schedule a glance as late as localStart + 0.4; turn back after it
    face(specs.Claude, D6.localStart + 0.55, claudeYaw);
    face(specs.Codex, D6.localStart + 0.18, codexYaw);
  }

  const zipDur = 1.2;
  const zipStart = tPass;
  glideTo(specs.Cursor, zipStart, { x: world.passTo.x, z: world.passTo.z }, zipDur, { face: false, lean: -0.18 });
  face(specs.Cursor, -0.6, yawToward(world.passFrom, world.passCam));

  // --- cameras
  const heroPos = new THREE.Vector3(0.9, 0.45, 6.2);
  const heroLook = new THREE.Vector3(0.6, 1.5, -3.8);
  const heroKeys = [
    { t: tHero, pos: heroPos, target: heroLook, fov: 60 },
  ];

  // Low angle stays on Ptah's face side and south of the visitors, so their backs stay out.
  const lowA = new THREE.Vector3(8.5, 0.85, 3.8);
  const lowB = new THREE.Vector3(8.1, 0.95, 3.6);
  const lowLookA = new THREE.Vector3(ptahPos.x, 2.8, ptahPos.z);
  const lowLookB = new THREE.Vector3(ptahPos.x, 2.95, ptahPos.z);
  const lowKeys = [
    { t: tLow, pos: lowA, target: lowLookA, fov: 56 },
    { t: tTwo, pos: lowB, target: lowLookB, fov: 53, ease: ease.sineInOut },
  ];

  // Claude in the foreground, three-quarter, looking up at Ptah.
  const twoA = new THREE.Vector3(-0.25, 1.05, 4.8);
  const twoB = new THREE.Vector3(-0.15, 1.12, 4.6);
  const twoLookA = new THREE.Vector3(0.75, 0.32, 2.6);
  const twoLookB = new THREE.Vector3(0.75, 0.34, 2.6);
  const twoKeys = [
    { t: tTwo, pos: twoA, target: twoLookA, fov: 42 },
    { t: tPan, pos: twoB, target: twoLookB, fov: 40, ease: ease.sineInOut },
  ];

  // Track the actual work lanes in front of the pylon, then reveal the ramp.
  const panA = new THREE.Vector3(-9.8, 1.75, -9.5);
  const panLookA = new THREE.Vector3(-4.3, -1.0, -18.5);
  const panB = new THREE.Vector3(-9.1, 1.8, -10.0);
  const panLookB = new THREE.Vector3(-3.9, -0.9, -19.0);
  const panC = new THREE.Vector3(-8.7, 1.85, -9.5);
  const panLookC = new THREE.Vector3(-3.5, -0.8, -19.0);
  const panKeys = [
    { t: tPan, pos: panA, target: panLookA, fov: 57 },
    { t: lerp(tPan, tPass, 0.48), pos: panB, target: panLookB, fov: 56, ease: ease.sineInOut },
    { t: tPass, pos: panC, target: panLookC, fov: 57, ease: ease.sineInOut },
  ];

  const passClose = world.passCam.clone().lerp(world.passLook, 0.12);
  const passKeys = [
    { t: tPass, pos: world.passCam.clone(), target: world.passLook.clone(), fov: 53 },
    { t: tReturn, pos: passClose, target: world.passLook.clone(), fov: 48, ease: ease.sineInOut },
  ];

  const returnKeys = [
    { t: tReturn, pos: heroPos.clone(), target: heroLook.clone(), fov: 60 },
  ];

  const portalFar = world.portalCam.clone();
  const portalNear = world.portalCam.clone().addScaledVector(world.pylonFront, -0.55);
  const portalKeys = [
    { t: tPortal, pos: portalFar, target: world.portalLook.clone(), fov: 46 },
    { t: duration, pos: portalNear, target: world.portalLook.clone(), fov: 42, ease: ease.sineInOut },
  ];

  const camKeys = [
    { t0: tHero, keys: heroKeys },
    { t0: tLow, keys: lowKeys },
    { t0: tTwo, keys: twoKeys },
    { t0: tPan, keys: panKeys },
    { t0: tPass, keys: passKeys },
    { t0: tReturn, keys: returnKeys },
    { t0: tPortal, keys: portalKeys },
  ];
  const camScratch = new THREE.Vector3();
  function camAt(t) {
    let cur = camKeys[0];
    for (const c of camKeys) if (t >= c.t0) cur = c;
    return sampleKeys(cur.keys, t, camScratch);
  }

  const shots = [
    shot('establish', heroKeys, 10, tHero, true),
    shot('ptahLow', lowKeys, 7, tLow, true),
    shot('claudeTwo', twoKeys, 3.2, tTwo),
    shot('panCrews', panKeys, 24, tPan),
    shot('cursorStamp', passKeys, 2.8, tPass, true),
    shot('ptahAnswer', returnKeys, 10, tReturn, true),
    shot('portal', portalKeys, 8, tPortal, true),
  ];

  const ptahPulse = (t) => ptahRows.reduce((a, r) => a + sampleEnvelope(r.env, t - r.localStart), 0);
  const h = world.handles;
  const haulDir = world.crewHomes.map((c) => world.foot.clone().sub(c.home).setY(0));
  haulDir.forEach((d) => { if (d.lengthSq() > 1e-4) d.normalize(); });

  function plant(home, x, z) {
    return home.y + (sandY(x, z) - sandY(home.x, home.z));
  }

  function poseVisitors(sim, t) {
    for (const name of ['Claude', 'Codex']) {
      const robot = world.robots[name];
      const base = world.lookPose[name];
      const p = sim.robotPose(name, t);
      const headExtra = t < rise + 0.45 ? base.headYaw : 0;
      robot.apply({
        ...p,
        bx: p.fx || 0,
        nod: (p.nod || 0) + base.nod,
        pitch: (p.pitch || 0) + base.pitch,
        headYaw: (p.headYaw || 0) + headExtra,
        eyeSX: base.eyeSX + ((p.eyeSX || 1) - 1),
        eyeSY: base.eyeSY + ((p.eyeSY || 1) - 1),
        liftModel: (p.lift || 0) / robot.scale,
      });
      const g0 = name === 'Claude' ? glideStart : glideStart + 0.08;
      const e = smoothstep(clamp((t - g0) / glideDur));
      const destY = name === 'Claude' ? world.claudeSpot.y : world.codexSpot.y;
      robot.root.position.y = lerp(robot.seat.y, destY, e) + (p.lift || 0);
    }
  }

  function update(t, sim) {
    const cam = camAt(t);
    poseVisitors(sim, t);
    const crewShot = t >= tPan && t < tPass;
    world.scatterBlocks.forEach((b) => { b.visible = !crewShot; });
    const twoShot = t >= tTwo && t < tPan;
    h.ptah.root.visible = !twoShot;
    h.sceptre.visible = !twoShot;
    world.extraRamps.forEach((r) => { r.visible = false; });
    if (world.baseRamp) world.baseRamp.visible = !crewShot;
    world.stampG.visible = !crewShot;
    world.gripLink.visible = !crewShot;
    world.banners.forEach((b) => {
      b.mark.visible = crewShot;
      b.group.position.copy(b.home);
      if (crewShot && b.i < 2) b.group.position.z += b.i === 0 ? 6 : 3;
    });
    world.post.exposure = crewShot ? 0.62 : (t >= tLow && t < tTwo ? 0.8 : 0.95);
    h.pyramid.parent.backgroundIntensity = crewShot ? 0.44 : (t >= tLow && t < tTwo ? 0.32 : 0.9);

    // Sofa thump. At sofaLand it is on the authored rest pose; dust hangs on.
    const sofa = h.sofa;
    if (t < sofaLand) {
      const u = clamp(t / Math.max(0.05, sofaLand));
      sofa.position.y = world.sofaRest.y + 1.55 * (1 - u * u);
      sofa.rotation.x = world.sofaRest.x;
    } else {
      const s = t - sofaLand;
      sofa.position.y = world.sofaRest.y + 0.14 * Math.exp(-6.2 * s) * Math.abs(Math.sin(14 * s));
      sofa.rotation.x = world.sofaRest.x + 0.045 * Math.exp(-4.2 * s) * Math.sin(12 * s);
    }
    sofa.rotation.z = world.sofaRest.z;

    const du = (t - sofaLand) / 0.55;
    if (du >= 0 && du < 1) {
      world.landDust.visible = true;
      world.landPuff.visible = true;
      const impactX = lerp(h.sofa.position.x, h.codex.root.position.x, 0.45);
      const impactZ = lerp(h.sofa.position.z, h.codex.root.position.z, 0.45);
      world.landPuff.position.set(impactX, 0.065, impactZ);
      world.landPuff.scale.setScalar(1 + du * 1.3);
      world.landPuff.material.opacity = 0.9 * (1 - du);
      const arr = world.landDust.geometry.attributes.position.array;
      const ox = impactX;
      const oz = impactZ;
      for (let i = 0; i < world.dustVel.length; i++) {
        const v = world.dustVel[i];
        arr[i * 3] = ox + v.x * (0.45 + du * 1.8);
        arr[i * 3 + 1] = 0.1 + v.y * (0.25 + du) * (1 - du * 0.45);
        arr[i * 3 + 2] = oz + v.z * (0.45 + du * 1.8);
      }
      world.landDust.geometry.attributes.position.needsUpdate = true;
      world.landDust.material.opacity = 0.82 * (1 - du);
      world.landDust.material.size = 0.72 + 0.32 * du;
    } else {
      world.landDust.visible = false;
      world.landPuff.visible = false;
    }

    // Ptah: eyes and sceptre on his words, head nods. Body yaw stays the look.
    const rg = ease.power2Out(clamp((t - rise) / 1.35));
    const pulse = ptahPulse(t);
    const talk = clamp(pulse * 2.2);
    h.ptah.apply({
      nod: -0.12 - 0.18 * rg + 0.05 * Math.sin(t * 1.55) * talk,
      headYaw: 0.2 * rg,
      pitch: -0.05 * rg,
      glow: 0,
    });
    const eyeI = 2.4 + 1.15 * rg + 3.4 * pulse;
    h.ptah.mats.eyes.emissiveIntensity = eyeI;
    h.ptah.mats.screen.emissiveIntensity = 0.3 + 0.25 * pulse;
    h.ptah.mats.glow.emissiveIntensity = 0.6 + 0.8 * pulse;
    const sceptreI = 0.04 + 0.45 * rg + 2.6 * pulse;
    for (const m of world.golds) {
      m.emissive.set('#E8B84A');
      m.emissiveIntensity = sceptreI;
    }

    // Crews haul toward the ramp. The inspector's crew (index 1) holds so the stamp reads.
    const leadDelta = new Map();
    for (const c of world.crewHomes) {
      c.robot.root.visible = !(t >= tPass && t < tReturn);
      const dir = haulDir[c.crew * 4 + c.slot] || haulDir[0];
      const trip = 16 + hash('trip', c.crew) * 4;
      const u = c.crew === 1 ? 0 : (t / trip + c.phase) % 1;
      const reach = c.crew === 1 ? 0 : 7.5;
      const along = u * reach;
      const wob = c.crew === 1 ? 0 : Math.sin(t * 2.6 + c.phase * 6.2) * 0.1;
      _side.set(-dir.z, 0, dir.x);
      _pos.copy(c.home).addScaledVector(dir, along).addScaledVector(_side, wob);
      if (crewShot && c.crew < 3) {
        const advance = (t - tPan) * 0.18;
        _pos.set(-8.2 + c.crew * 3.5 + c.slot * 0.9, 0, -12.5 - c.crew * 2.0 - c.slot * 1.1 - advance);
        c.robot.root.scale.setScalar(c.crew === 0 ? 0.39 : c.crew === 1 ? 0.31 : 0.25);
      } else {
        c.robot.root.scale.setScalar(0.3);
      }
      c.robot.root.position.x = _pos.x;
      c.robot.root.position.z = _pos.z;
      c.robot.root.position.y = crewShot && c.crew < 3 ? sandY(_pos.x, _pos.z) + 0.1 : plant(c.home, _pos.x, _pos.z);
      const ph = t * 2.3 * Math.PI + c.phase * 5;
      c.robot.apply({
        hop: 0.16 * Math.abs(Math.sin(ph)),
        squash: 1,
        roll: 0.1 * Math.sin(ph),
        pitch: 0.16 + 0.04 * Math.sin(ph * 0.5),
        feetYaw: 0.4 * Math.sin(ph),
        nod: 0.04 * Math.sin(ph * 0.7),
        glow: 0.15,
      });
      if (crewShot) c.robot.root.rotation.y = Math.PI; else faceLens(c.robot, cam);
      if (c.slot === 0) leadDelta.set(c.crew, { x: _pos.x - c.home.x, z: _pos.z - c.home.z, y: c.robot.root.position.y - c.home.y });
    }
    for (const s of world.sledHomes) {
      const d = leadDelta.get(s.crew) || { x: 0, z: 0, y: 0 };
      s.sled.position.set(s.home.x + d.x, s.baseY + d.y, s.home.z + d.z);
      if (crewShot && s.crew < 3) s.sled.position.set(-4.5 + s.crew * 3.5, 0.18, -18.4 - s.crew * 2 - (t - tPan) * 0.18);
    }
    world.crewHaulRopes.forEach((rope, i) => {
      rope.visible = crewShot;
      if (!crewShot) return;
      const crew = Math.floor(i / 5);
      const slot = i % 5;
      const lead = world.crewHomes[crew * 4].robot.root.position;
      const sled = world.sledHomes[crew].sled.position;
      const lineA = lead.clone().add(new THREE.Vector3(-0.68, 0.27, 0.15));
      const lineB = sled.clone().add(new THREE.Vector3(-0.68, 0.18, 0.7));
      const a = slot === 0 ? lineA : world.crewHomes[crew * 4 + slot - 1].robot.root.position.clone().add(new THREE.Vector3(0, 0.42, 0));
      const b = slot === 0 ? lineB : lineA.clone().lerp(lineB, (slot - 1) / 4);
      rope.position.copy(a).add(b).multiplyScalar(0.5);
      rope.scale.y = a.distanceTo(b);
      rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    });
    for (const b of world.blockHomes) {
      const d = b.sled ? (leadDelta.get(b.sled.crew) || { x: 0, z: 0, y: 0 }) : { x: 0, z: 0, y: 0 };
      b.block.position.set(b.home.x + d.x, b.baseY + d.y, b.home.z + d.z);
      if (crewShot && b.sled?.crew < 3) b.block.position.set(-4.5 + b.sled.crew * 3.5, 1.08, -18.4 - b.sled.crew * 2 - (t - tPan) * 0.18);
      b.block.visible = !crewShot || (b.sled?.crew < 3 && world.blockHomes.find((candidate) => candidate.sled === b.sled) === b);
    }
    for (const r of world.ropeHomes) {
      const d = r.sled ? (leadDelta.get(r.sled.crew) || { x: 0, z: 0, y: 0 }) : { x: 0, z: 0, y: 0 };
      r.rope.position.set(r.home.x + d.x, r.baseY + d.y * 0.25, r.home.z + d.z);
      if (crewShot && r.sled?.crew < 3) r.rope.visible = false; else r.rope.visible = true;
    }

    // Ramp walk. along matches the look at t = 0 (1 - f0), then climbs.
    const rmp = h.pyramid.userData.ramp;
    const pyrP = h.pyramid.position;
    h.rampRobots.forEach((robot, k) => {
      robot.root.visible = !crewShot;
      const f0 = 0.15 + k * 0.13;
      const along = (1 - f0 + t * 0.05) % 1;
      const sideX = k % 2 ? 0.6 : -0.6;
      const laneX = crewShot ? [-1.5, 8, 18][Math.floor(k / 2)] : rmp.x;
      robot.root.position.set(
        pyrP.x + laneX + sideX,
        Math.sin(rmp.ang) * rmp.len * along * (crewShot ? 0.62 : 1) + 0.3,
        pyrP.z + rmp.z0 - Math.cos(rmp.ang) * rmp.len * along * (crewShot ? 0.62 : 1),
      );
      const ph = t * 2.5 * Math.PI + k;
      robot.apply({
        hop: 0.14 * Math.abs(Math.sin(ph)),
        roll: 0.08 * Math.sin(ph),
        pitch: 0.12,
        feetYaw: 0.35 * Math.sin(ph),
        squash: 1 - 0.05 * Math.max(0, -Math.cos(ph * 2)),
      });
      faceLens(robot, cam);
    });

    world.banners.forEach((b) => {
      if (!b.cloth || !b.base) return;
      const p = b.cloth.geometry.attributes.position;
      const base = b.base;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const rest = Math.sin(x * 5 + y * 2 + b.i * 1.7);
        const wave = Math.sin(x * 5 + y * 2 + b.i * 1.7 + t * 2.2);
        p.setZ(i, base[i * 3 + 2] + 0.09 * (wave - rest));
      }
      p.needsUpdate = true;
    });

    const dArr = world.dustAttr.array;
    const dBase = world.dustBase;
    const nDust = dBase.length / 3;
    for (let i = 0; i < nDust; i++) {
      const s = i * 0.017;
      dArr[i * 3] = dBase[i * 3] + 0.18 * (noise1(t * 0.22 + s, 'dx') - noise1(s, 'dx'));
      dArr[i * 3 + 1] = dBase[i * 3 + 1] + 0.1 * (noise1(t * 0.16 + s, 'dy') - noise1(s, 'dy'));
      dArr[i * 3 + 2] = dBase[i * 3 + 2] + 0.18 * (noise1(t * 0.2 + s, 'dz') - noise1(s, 'dz'));
    }
    world.dustAttr.needsUpdate = true;

    // Cursor zip: face the lens, trail dust and streaks while he is moving.
    const cursor = world.robots.Cursor;
    const cp = sim.robotPose('Cursor', t);
    cursor.root.position.x = cp.px ?? world.passFrom.x;
    cursor.root.position.z = cp.pz ?? world.passFrom.z;
    cursor.root.position.y = sandY(cursor.root.position.x, cursor.root.position.z) + (cp.lift || 0);
    cursor.apply({ ...cp, squash: 1 });
    faceLens(cursor, cam);
    _pos.set(cursor.root.position.x, cursor.root.position.y + 0.45, cursor.root.position.z);
    const prev = sim.robotPose('Cursor', t - 0.08);
    _posB.set(prev.px ?? cursor.seat.x, 0, prev.pz ?? cursor.seat.z);
    const speed = _pos.distanceTo(_posB.set(_posB.x, _pos.y, _posB.z)) / 0.08;
    const plannedZip = smoothstep(clamp((t - zipStart - 0.05) / 0.12)) * (1 - smoothstep(clamp((t - stamp - 0.12) / 0.22)));
    const moving = Math.max(speed > 0.4 ? clamp((speed - 0.4) / 2.2) : 0, plannedZip);
    const dirX = _pos.x - (prev.px ?? cursor.seat.x);
    const dirZ = _pos.z - (prev.pz ?? cursor.seat.z);
    const dirL = Math.hypot(dirX, dirZ) || 1;
    world.streaks.forEach((m, i) => {
      const back = 0.15 + i * 0.08;
      const lat = (hash('streak', i) - 0.5) * 0.35;
      m.position.set(
        _pos.x - (dirX / dirL) * back + (-dirZ / dirL) * lat,
        _pos.y + 0.15 + (i % 3) * 0.12,
        _pos.z - (dirZ / dirL) * back + (dirX / dirL) * lat,
      );
      m.lookAt(m.position.x + dirX / dirL, m.position.y, m.position.z + dirZ / dirL);
      m.scale.set(1, 2.2, 0.35 + moving * 0.7);
      m.material.opacity = 0.8 * moving * (1 - i / 8);
    });
    const zArr = world.zipDust.geometry.attributes.position.array;
    for (let i = 0; i < 36; i++) {
      const k = hash('zd', i);
      const back = 0.2 + k * 1.3;
      zArr[i * 3] = _pos.x - (dirX / dirL) * back + (hash('zd', i, 'x') - 0.5) * 0.4;
      zArr[i * 3 + 1] = _pos.y + hash('zd', i, 'y') * 0.6;
      zArr[i * 3 + 2] = _pos.z - (dirZ / dirL) * back + (hash('zd', i, 'z') - 0.5) * 0.4;
    }
    world.zipDust.geometry.attributes.position.needsUpdate = true;
    world.zipDust.material.opacity = 0.65 * moving;

    // Inspector stamp: squash, tool slam, gold seal.
    const su = t - stamp;
    let hop = 0.03 * Math.abs(Math.sin(t * 2.2));
    let raise = 0.75;
    if (su < -0.1) {
      raise = 0.75 + 0.68 * smoothstep(clamp((su + 0.6) / 0.5));
    } else if (su < 0) {
      const k = (su + 0.1) / 0.1;
      raise = lerp(1.43, 0, ease.power2In(k));
      hop = 0;
    } else {
      const e = Math.exp(-su * 6.5);
      hop = 0.06 * e * Math.abs(Math.sin(su * 16));
      raise = 0.05 + 1.05 * smoothstep(clamp(su / 0.28));
    }
    world.inspector.apply({
      nod: -0.22,
      pitch: 0.12 + (su > -0.2 && su < 0.15 ? -0.25 : 0),
      hop,
      glow: su > -0.05 && su < 0.4 ? 0.8 : 0.12,
    });
    const bp = world.stampBlock ? world.stampBlock.position : world.inspector.root.position;
    world.inspector.root.position.set(bp.x + 1.12, sandY(bp.x + 1.12, bp.z + 0.15), bp.z + 0.15);
    faceLens(world.inspector, cam);
    world.stampG.position.set(bp.x + 0.12, bp.y + raise, bp.z + 0.53 + (su < 0 ? 0.28 * smoothstep(clamp((su + 0.6) / 0.5)) : 0));
    world.stampG.rotation.x = su < 0 ? -0.34 * smoothstep(clamp((su + 0.6) / 0.5)) * (1 - smoothstep(clamp((su + 0.1) / 0.1))) : 0;
    world.stampG.rotation.y = Math.PI;
    const gripA = world.stampG.position.clone();
    const gripB = new THREE.Vector3(world.inspector.root.position.x, world.inspector.root.position.y + 0.82 + hop, world.inspector.root.position.z + 0.12);
    world.gripLink.position.copy(gripA).add(gripB).multiplyScalar(0.5);
    world.gripLink.scale.y = gripA.distanceTo(gripB);
    world.gripLink.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), gripB.sub(gripA).normalize());
    const sealU = clamp((t - stamp) / 0.09);
    world.seal.visible = sealU > 0;
    if (world.seal.visible) {
      const pop = sealU < 1 ? (1 - Math.pow(1 - sealU, 3)) * (1 + 0.18 * Math.sin(sealU * Math.PI)) : 1;
      world.seal.position.set(bp.x + 0.12, bp.y, bp.z + 0.43);
      world.seal.scale.setScalar(Math.max(0.001, pop));
      world.seal.material.emissiveIntensity = su < 0.6 ? 2.2 : 0.55;
    }
    world.stampDust.position.set(bp.x, sandY(bp.x, bp.z) + 0.05, bp.z);
    world.stampDust.visible = su >= 0 && su < 0.65;
    if (world.stampDust.visible) {
      world.stampDust.scale.setScalar(1 + 2.6 * su);
      world.stampDust.material.opacity = 0.75 * Math.exp(-su * 5);
    }

    // Portal: warm, then white, plus a shaft. Bloom picks up the untonemapped plane.
    const pu = clamp((t - portal) / 1.1);
    const warm = clamp(pu / 0.12);
    const white = clamp(pu / 0.6);
    const flick = 0.94 + 0.06 * noise1(t * 1.8, 'portal');
    _col.copy(_warm).lerp(_white, white);
    if (world.door) {
      world.door.material.emissive.set('#B87A3A');
      world.door.material.emissiveIntensity = 0.8 * warm * flick;
    }
    world.glow.material.opacity = (0.96 * warm + 0.04 * white) * flick;
    world.shaft.material.color.copy(_col);
    world.shaft.material.opacity = 0.12 * pu * flick;
    world.rays.forEach((ray, i) => { ray.material.opacity = (0.025 + i * 0.008) * pu * flick; });
    world.doorLight.color.copy(_col);
    world.doorLight.intensity = 17 * pu * flick;
    const silhouette = clamp((t - (portal - 0.15)) / 0.1);
    for (const { m, color, emissive } of world.hostMaterials) {
      m.color.copy(color);
      if (emissive) m.emissive.copy(emissive);
    }
    for (const rim of world.portalRims) { rim.visible = silhouette > 0; rim.material.opacity = silhouette; }
  }

  return {
    start: -0.6,
    noSettle: true,
    specs,
    shots,
    update,
    hits: [{ t: stamp, amp: 0.022 }],
    info: { cues: { sofaLand, rise, pan, cursorPass, stamp, portal, tHero, tLow, tTwo, tPan, tPass, tReturn, tPortal } },
  };
}

export const KINDS = { desert: { build, plan } };
