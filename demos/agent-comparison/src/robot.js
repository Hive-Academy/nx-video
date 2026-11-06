// The cute robot rig: a floating ball (screen face) over a pair of dome feet.
//
// cute_robot.glb (faces +X, Y up), measured in model units with Box3:
//   Cube002_1   (feet, BODY + Material.001 soles)  y 0.000..0.154
//   Cylinder_0  (ball: BODY shell, GLOW ear ring, SCREEN face) y 0.374..2.086,
//               centre (0, 1.230, 0), radius 0.856, screen plane at x = 0.47
//   Plane_2 / Plane001_3 (EYES, one blink morph each) y 0.942..1.527 on x = 0.473
// Cube002_1 is the feet, not a head: the "head on a spring" is the ball riding
// above the feet, which is how this character is built.
import * as THREE from 'three';
import { AGENTS } from './assets.js';
import { badgeTexture, contactShadowTexture } from './textures.js';

export const ROBOT = {
  height: 2.086,
  feetTop: 0.154,
  ballBottom: 0.374,
  ballCenterY: 1.23,
  ballRadius: 0.856,
  screenX: 0.47,
  frontX: 0.639,
  eyeY: 1.235,
  screenTop: 1.759,
  screenBottom: 0.702,
};

const SHELL = new THREE.Color('#E9E4DA');
const FEET = new THREE.Color('#D3CCBF');
let shadowTex = null;

// Screen tint: a dark tint of the agent colour unless the agent overrides it
// (OpenCode is near-black). The judge gets a deeper, redder burnt amber.
const JUDGE_SCREEN = new THREE.Color('#E8A33D').multiply(new THREE.Color(0.2, 0.11, 0.05));

function makeMaterials(agent, name) {
  const tint = new THREE.Color(agent.color);
  const white = new THREE.Color('#FFFFFF');
  const screenColour = agent.screen ? new THREE.Color(agent.screen) : name === 'Conductor' ? JUDGE_SCREEN.clone() : tint.clone().multiplyScalar(0.24);
  const screenGlow = agent.screen ? new THREE.Color('#2A2A2A') : tint.clone().multiplyScalar(0.6);
  const eyeColour = agent.eyes ? new THREE.Color(agent.eyes) : tint.clone().lerp(white, 0.5);
  const eyeGlow = agent.eyes ? new THREE.Color(agent.eyes).multiplyScalar(0.85) : tint.clone().lerp(white, 0.42);
  const ring = agent.glow ? new THREE.Color(agent.glow) : tint;
  return {
    shell: new THREE.MeshStandardMaterial({ name: 'shell', color: SHELL, roughness: 0.45, metalness: 0.0, envMapIntensity: 0.3 }),
    feet: new THREE.MeshStandardMaterial({ name: 'feet', color: FEET, roughness: 0.5, metalness: 0.0, envMapIntensity: 0.45 }),
    glow: new THREE.MeshStandardMaterial({ name: 'glow', color: ring, emissive: ring, emissiveIntensity: 0.55, roughness: 0.4 }),
    screen: new THREE.MeshStandardMaterial({
      name: 'screen',
      color: screenColour,
      emissive: screenGlow,
      emissiveIntensity: 0.2,
      roughness: 0.22,
      metalness: 0.0,
      envMapIntensity: 0.9,
    }),
    eyes: new THREE.MeshStandardMaterial({
      name: 'eyes',
      color: eyeColour,
      emissive: eyeGlow,
      emissiveIntensity: 0.95,
      roughness: 0.3,
      side: THREE.DoubleSide,
    }),
    sole: new THREE.MeshStandardMaterial({ name: 'sole', color: ring.clone().multiplyScalar(0.7), emissive: ring, emissiveIntensity: 0.25, roughness: 0.5 }),
  };
}

// Wrap `node` in a group whose origin is the node's world-space bbox centre and whose
// axes are the rig's axes, so eyes can be scaled along robot up/right directly.
function wrapAtCentre(parent, node) {
  const box = new THREE.Box3().setFromObject(node);
  const centre = box.getCenter(new THREE.Vector3());
  const group = new THREE.Group();
  parent.add(group);
  parent.updateMatrixWorld(true);
  group.position.copy(parent.worldToLocal(centre.clone()));
  group.updateMatrixWorld(true);
  group.attach(node);
  return group;
}

export function createRobot(assets, name, { scale = 0.38, badge = true } = {}) {
  const agent = AGENTS[name];
  const mats = makeMaterials(agent, name);
  const model = assets.gltf.scene.clone(true);

  const root = new THREE.Group(); // placed on the seat, yawed toward its look direction
  root.name = `robot-${name}`;
  const body = new THREE.Group(); // hop + lateral jostle (model units)
  const feet = new THREE.Group();
  const ballBase = new THREE.Group(); // spring gap + lean, pivots at the ball's bottom
  const ballSquash = new THREE.Group(); // squash/stretch about the ball's bottom
  const ballHead = new THREE.Group(); // nod + head yaw about the ball centre
  root.add(body);
  body.add(feet, ballBase);
  ballBase.position.set(0, ROBOT.ballBottom, 0);
  ballBase.add(ballSquash);
  ballSquash.add(ballHead);
  ballHead.position.set(0, ROBOT.ballCenterY - ROBOT.ballBottom, 0);

  root.add(model);
  root.updateMatrixWorld(true);
  const node = (n) => {
    const o = model.getObjectByName(n);
    if (!o) throw new Error(`cute_robot.glb is missing node ${n}`);
    return o;
  };
  const ball = node('Cylinder_0');
  const feetNode = node('Cube002_1');
  const eyeNodes = [node('Plane_2'), node('Plane001_3')];
  ballHead.attach(ball);
  feet.attach(feetNode);
  const eyeGroups = eyeNodes.map((e) => wrapAtCentre(ballHead, e));
  root.remove(model);

  const eyes = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const original = o.material.name;
    const inFeet = feetNode === o || feetNode.getObjectById(o.id);
    if (original === 'BODY') o.material = inFeet ? mats.feet : mats.shell;
    else if (original === 'GLOW') o.material = mats.glow;
    else if (original === 'SCREEN') o.material = mats.screen;
    else if (original === 'EYES') { o.material = mats.eyes; eyes.push(o); }
    else o.material = mats.sole;
    o.castShadow = original !== 'EYES' && original !== 'SCREEN';
    o.receiveShadow = true;
  });

  // Round chest badge with the provider icon, under the screen on the ball's front.
  if (badge) {
    const tex = agent.emblem
      ? badgeTexture(assets.emblemGold || assets.emblem || assets.icons[agent.icon], agent.color, name[0], { emblem: true, face: assets.emblemGold ? '#2A1D0E' : '#F7EEDC' })
      : badgeTexture(assets.icons[agent.icon], agent.color, name[0], agent.badge || {});
    const r = 0.2;
    const geo = new THREE.CylinderGeometry(r, r, 0.05, 48);
    const brass = new THREE.MeshStandardMaterial({ color: '#C99A42', metalness: 0.75, roughness: 0.35, envMapIntensity: 0.8 });
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.1 });
    const disc = new THREE.Mesh(geo, [brass, face, brass]);
    const a = THREE.MathUtils.degToRad(-50);
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    disc.position.copy(dir).multiplyScalar(ROBOT.ballRadius + 0.005);
    disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    disc.rotateY(-Math.PI / 2); // icon upright when seen from the front
    disc.castShadow = true;
    ballHead.add(disc);
  }

  // Contact shadow on whatever the feet stand on; stays put while the body hops.
  shadowTex = shadowTex || contactShadowTexture();
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.85, toneMapped: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.012;
  blob.renderOrder = 1;
  blob.userData.noDepth = true;
  root.add(blob);

  root.scale.setScalar(scale);
  const eyeBase = eyeGroups.map((g) => g.scale.clone());
  const base = {
    screenGlow: mats.screen.emissiveIntensity,
    eyeGlow: mats.eyes.emissiveIntensity,
    ringGlow: mats.glow.emissiveIntensity,
  };

  // Apply one sampled pose. All angles in radians, offsets in model units.
  function apply(p) {
    body.position.set(p.bx || 0, Math.max(0, p.hop || 0), p.bz || 0);
    ballBase.position.y = ROBOT.ballBottom + (p.ballDy || 0);
    ballBase.rotation.set(p.roll || 0, 0, p.pitch || 0);
    const sq = THREE.MathUtils.clamp(p.squash ?? 1, 0.7, 1.3);
    const side = 1 / Math.sqrt(sq);
    ballSquash.scale.set(side, sq, side);
    ballHead.rotation.set(0, p.headYaw || 0, p.nod || 0);
    feet.rotation.y = p.feetYaw || 0;
    eyeGroups.forEach((g, i) => {
      g.scale.set(eyeBase[i].x * (p.eyeSX ?? 1), eyeBase[i].y * (p.eyeSY ?? 1), eyeBase[i].z * (p.eyeSX ?? 1));
    });
    for (const e of eyes) if (e.morphTargetInfluences) e.morphTargetInfluences[0] = THREE.MathUtils.clamp(p.blink || 0, 0, 1);
    const g = p.glow || 0;
    mats.screen.emissiveIntensity = base.screenGlow + 0.22 * g;
    mats.eyes.emissiveIntensity = base.eyeGlow + 0.35 * g;
    mats.glow.emissiveIntensity = base.ringGlow + 0.5 * g;
    // the contact shadow stays on the ground under a hop or a hover (liftModel: hover in model units)
    const hover = Math.max(0, p.liftModel || 0);
    const lift = Math.max(0, p.hop || 0) + hover;
    const k = 1 / (1 + lift * 1.6);
    blob.position.y = 0.012 - hover;
    blob.scale.setScalar(k);
    blob.material.opacity = 0.85 * k;
  }

  return { name, root, body, feet, ballBase, ballSquash, ballHead, eyes, eyeGroups, mats, scale, apply, color: agent.color, blob };
}

// Codex's sunglasses, built from primitives and worn on the screen face.
// Authored in ballHead space (model units, origin at the ball centre y 1.23):
// two wayfarer lenses over the eyes (eyes at z +-0.047..0.226, y 0.942..1.527 on the
// screen plane x 0.47; the shell rim is at x 0.639), a brow bar, a bridge, and arms
// that run over the rim and along the shell to the ear ring.
export function addSunglasses(robot) {
  const group = new THREE.Group();
  group.name = 'sunglasses';
  const frame = new THREE.MeshStandardMaterial({ color: '#0E0E10', roughness: 0.32, metalness: 0.2, envMapIntensity: 0.9 });
  const lensMat = new THREE.MeshPhysicalMaterial({ color: '#0A0B0D', roughness: 0.06, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6 });
  const y = 1.29 - ROBOT.ballCenterY;
  const x = 0.665;
  const lensShape = () => {
    // wayfarer: wider at the top, rounded corners
    const w = 0.3, h = 0.27, r = 0.055, taper = 0.03;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, h / 2);
    s.lineTo(w / 2 - r, h / 2);
    s.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - r);
    s.lineTo(w / 2 - taper, -h / 2 + r);
    s.quadraticCurveTo(w / 2 - taper, -h / 2, w / 2 - taper - r, -h / 2);
    s.lineTo(-w / 2 + taper + r, -h / 2);
    s.quadraticCurveTo(-w / 2 + taper, -h / 2, -w / 2 + taper, -h / 2 + r);
    s.lineTo(-w / 2, h / 2 - r);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2 + r, h / 2);
    return s;
  };
  for (const side of [1, -1]) {
    const rimGeo = new THREE.ExtrudeGeometry(lensShape(), { depth: 0.035, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 8 });
    const rim = new THREE.Mesh(rimGeo, frame);
    // shape is drawn in (u = z, v = y); face +X
    rim.rotation.y = Math.PI / 2;
    rim.position.set(x - 0.02, y, side * 0.168);
    const lensGeo = new THREE.ShapeGeometry(lensShape(), 8);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.y = Math.PI / 2;
    lens.scale.setScalar(0.9);
    lens.position.set(x + 0.031, y + 0.004, side * 0.168);
    group.add(rim, lens);
    // arm: over the rim, then hugging the shell round behind the silhouette
    const pts = [[0.66, 0.0, 0.31], [0.67, 0.005, 0.5], [0.62, 0.01, 0.62], [0.45, 0.02, 0.73], [0.2, 0.03, 0.83], [-0.1, 0.03, 0.855], [-0.36, 0.03, 0.795]]
      .map(([px, py, pz]) => new THREE.Vector3(px, y + py + 0.06, side * pz));
    const arm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 8, false), frame);
    group.add(arm);
  }
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.66), frame);
  brow.position.set(x + 0.012, y + 0.115, 0);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.08), frame);
  bridge.position.set(x + 0.01, y + 0.06, 0);
  group.add(brow, bridge);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  robot.ballHead.add(group);
  // u = 1: worn; u = 0: lifted above the head, tilted
  function set(u, tilt = 0) {
    const k = THREE.MathUtils.clamp(u, -0.2, 1.2);
    group.position.set(0.25 * (1 - k), 1.6 * (1 - k), 0);
    group.rotation.set(0.0, 0, (1 - k) * 0.9 + tilt);
    group.visible = k > -0.15;
  }
  set(1);
  return { group, set };
}

// World-space box of the ball (head + screen) for framing.
export function headBox(robot, target = new THREE.Box3()) {
  robot.root.updateMatrixWorld(true);
  const c = new THREE.Vector3(0, ROBOT.ballCenterY - ROBOT.ballBottom, 0);
  robot.ballSquash.localToWorld(c);
  const r = ROBOT.ballRadius * robot.scale;
  target.min.set(c.x - r, c.y - r, c.z - r);
  target.max.set(c.x + r, c.y + r, c.z + r);
  return target;
}

// Rest-pose world points, independent of the current animated pose.
export function restPoints(robot) {
  const s = robot.scale;
  const p = robot.root.position;
  const yaw = robot.root.rotation.y;
  const fwd = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const right = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const centre = new THREE.Vector3(p.x, p.y + ROBOT.ballCenterY * s, p.z);
  return {
    centre,
    eye: centre.clone().add(fwd.clone().multiplyScalar(ROBOT.screenX * s)),
    top: new THREE.Vector3(p.x, p.y + ROBOT.height * s, p.z),
    base: p.clone(),
    fwd,
    right,
    radius: ROBOT.ballRadius * s,
  };
}
