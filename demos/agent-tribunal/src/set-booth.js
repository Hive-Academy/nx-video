// The Booth (confessional) and the Punch world share one small set:
// a cushioned, vertically pleated wall in the agent's colour, a padded stool, one robot.
import * as THREE from 'three';
import { AGENTS } from './assets.js';
import { createRobot } from './robot.js';
import { buildBoothLights } from './lighting.js';

export const BOOTH = {
  robotScale: 0.38,
  seatTop: 0.5,
  wallZ: -1.35,
  pleat: 0.16, // pleat period (m)
  pleatDepth: 0.035,
  lookRight: THREE.MathUtils.degToRad(22), // robot turns toward frame right (look room)
};

export function boothColour(name) {
  if (AGENTS[name].wall) return new THREE.Color(AGENTS[name].wall); // used as-is (OpenCode charcoal)
  const c = new THREE.Color(AGENTS[name].color);
  const hsl = {};
  c.getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, hsl.s * 0.85, hsl.l);
}

// Cushioned wall: rounded vertical pleats (~6% light contrast), not a flat plane.
function pleatedWall(width, height, period, depth, material) {
  const segX = Math.round((width / period) * 12);
  const geo = new THREE.PlaneGeometry(width, height, segX, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const u = Math.abs(Math.sin((Math.PI * x) / period));
    pos.setZ(i, depth * Math.sqrt(u));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.receiveShadow = true;
  return m;
}

export function buildBoothSet(scene, assets, name, { kind = 'booth' } = {}) {
  const wallColour = boothColour(name);
  scene.background = wallColour.clone().multiplyScalar(0.8);
  scene.fog = null;
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColour, roughness: 0.92, metalness: 0 });
  const wall = pleatedWall(9, 6, BOOTH.pleat, BOOTH.pleatDepth, wallMat);
  wall.position.set(0.6, 1.6, BOOTH.wallZ);
  scene.add(wall);
  // seam rail along the bottom of the padding, and a floor in a darker tone
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: wallColour.clone().multiplyScalar(0.45), roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // padded stool
  const stool = new THREE.Group();
  scene.add(stool);
  const leather = new THREE.MeshStandardMaterial({ color: '#2B1D17', roughness: 0.55 });
  const metal = new THREE.MeshStandardMaterial({ color: '#3A3F44', roughness: 0.35, metalness: 0.8 });
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.23, 0.08, 40), leather);
  cushion.position.y = BOOTH.seatTop - 0.04;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, BOOTH.seatTop - 0.08, 12), metal);
  post.position.y = (BOOTH.seatTop - 0.08) / 2;
  for (const m of [cushion, post]) { m.castShadow = m.receiveShadow = true; stool.add(m); }

  const robot = createRobot(assets, name, { scale: BOOTH.robotScale });
  robot.root.position.set(0, BOOTH.seatTop, 0);
  // face the camera (+Z), turned a little toward frame right
  const yaw = -Math.PI / 2 + (kind === 'punch' ? THREE.MathUtils.degToRad(8) : BOOTH.lookRight);
  robot.root.rotation.y = yaw;
  robot.seat = { x: 0, z: 0, y: BOOTH.seatTop, yaw };
  scene.add(robot.root);

  const lights = buildBoothLights(scene, { robotPos: new THREE.Vector3(0, BOOTH.seatTop, 0), wallColor: wallColour });
  if (wallColour.getHSL({}).l < 0.2) {
    // a dark wall would read as a void: rake white light across it so the pleats catch it
    const rake = new THREE.DirectionalLight('#FFFFFF', 2.2);
    rake.position.set(-7, 1.8, BOOTH.wallZ + 1.1);
    rake.target.position.set(4, 1.6, BOOTH.wallZ);
    scene.add(rake, rake.target);
  }

  const props = {};
  if (name === 'Codex' && kind === 'booth') {
    // the mug floats beside the robot on frame-left (Codex sips on the beat)
    const mug = new THREE.Group();
    const cream = new THREE.MeshStandardMaterial({ color: '#F3E6CE', roughness: 0.35 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.13, 28), cream);
    body.position.y = 0.065;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0615, 0.0615, 0.026, 28), new THREE.MeshStandardMaterial({ color: AGENTS.Codex.color, roughness: 0.45 }));
    band.position.y = 0.085;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.01, 8, 18), cream);
    handle.position.set(0.068, 0.068, 0);
    for (const m of [body, band, handle]) { m.castShadow = true; mug.add(m); }
    scene.add(mug);
    props.mug = { object: mug };
  }
  return { robots: { [name]: robot }, robot, props, wall, lights, wallColour };
}
