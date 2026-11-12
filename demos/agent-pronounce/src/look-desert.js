import * as THREE from 'three';
import { hash } from './util.js';
import { V, W, H, glb, hdri, tex, fit, shadows, recolor, robot, canvas2d, canvasTex, sandMaterial, stoneMaterial, dune, sandGround, dust } from './craft.js';
function pyramid(at, { n = 22, b = 1.6, bh = 1.1, tiers = 11, done = 8 } = {}) {
  const g = new THREE.Group();
  g.position.copy(at);
  const mat = stoneMaterial('#E6C99B');
  const core = new THREE.MeshStandardMaterial({ color: '#B99568', roughness: 1 });
  const geo = new THREE.BoxGeometry(b * 0.97, bh * 0.96, b * 0.97);
  const cells = [];
  for (let k = 0; k < tiers; k++) {
    const side = n - 2 * k;
    if (side < 3) break;
    const half = (side - 1) / 2;
    for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) {
      const ring = i === 0 || j === 0 || i === side - 1 || j === side - 1;
      if (!ring) continue;
      if (k >= done && hash(3, k, i, j) < (k - done + 1) * 0.3) continue;
      cells.push([(i - half) * b, k * bh + bh / 2, (j - half) * b, hash(4, k, i, j)]);
    }
    const c = new THREE.Mesh(new THREE.BoxGeometry((side - 2) * b, bh, (side - 2) * b), core);
    c.position.y = k * bh + bh / 2 - (k >= done ? 0.3 : 0);
    c.receiveShadow = true;
    g.add(c);
  }
  const inst = new THREE.InstancedMesh(geo, mat, cells.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  cells.forEach(([x, y, z, r], i) => {
    q.setFromAxisAngle(V(0, 1, 0), (r - 0.5) * 0.03);
    m4.compose(V(x, y, z), q, V(1, 1, 1));
    inst.setMatrixAt(i, m4);
    inst.setColorAt(i, col.setHSL(0.09, 0.35 + r * 0.15, 0.62 + r * 0.12));
  });
  inst.castShadow = inst.receiveShadow = true;
  g.add(inst);
  // a mudbrick ramp up the front face to the working tier
  const rampLen = 26, rampH = done * bh;
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, rampLen), new THREE.MeshStandardMaterial({ color: '#A8825A', roughness: 1, map: tex('textures/aerial_sand/aerial_sand_diff_1k.jpg', { repeat: 2 }) }));
  const ang = Math.asin(rampH / rampLen);
  ramp.rotation.x = ang;
  ramp.position.set(-n * b * 0.22, rampH / 2, n * b / 2 + Math.cos(ang) * rampLen / 2 - 0.5);
  ramp.castShadow = ramp.receiveShadow = true;
  g.add(ramp);
  g.userData.ramp = { x: ramp.position.x, ang, len: rampLen, z0: n * b / 2 - 0.5 + Math.cos(ang) * rampLen, h: rampH };
  return g;
}
// The temple pylon: two battered towers with a cavetto cornice and a doorway between.
function pylon(at, yaw) {
  const g = new THREE.Group();
  g.position.copy(at);
  g.rotation.y = yaw;
  const mat = stoneMaterial('#EBD3A8', 2);
  const tower = (x) => {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 4, 1);
    geo.rotateY(Math.PI / 4);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const top = p.getY(i) > 0;
      p.setX(i, p.getX(i) * (top ? 2.6 : 3.2) / Math.SQRT2 * Math.SQRT2);
      p.setZ(i, p.getZ(i) * (top ? 0.9 : 1.3));
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(1, 9, 1);
    m.position.set(x, 4.5, 0);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.5, 2.1), mat);
    cornice.position.set(x, 9.2, 0);
    cornice.castShadow = true;
    g.add(cornice);
  };
  tower(-3.6); tower(3.6);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 1.6), mat);
  lintel.position.set(0, 5.6, 0);
  lintel.castShadow = true;
  g.add(lintel);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.8), new THREE.MeshStandardMaterial({ color: '#2B1D12', roughness: 1 }));
  door.position.set(0, 2.4, 0.05);
  g.add(door);
  // painted relief bands on the tower faces
  const [c, x2] = canvas2d(512, 1024);
  x2.fillStyle = 'rgba(0,0,0,0)'; x2.clearRect(0, 0, 512, 1024);
  for (let r = 0; r < 6; r++) {
    x2.fillStyle = ['#2F5F8A', '#B5462E', '#C9A046'][r % 3];
    x2.globalAlpha = 0.55;
    x2.fillRect(40, 90 + r * 150, 432, 10);
    x2.globalAlpha = 0.5;
    for (let k = 0; k < 4; k++) { x2.beginPath(); x2.arc(110 + k * 100, 150 + r * 150, 26, 0, 7); x2.fill(); }
  }
  const relief = new THREE.MeshStandardMaterial({ map: canvasTex(c), transparent: true, roughness: 1, depthWrite: false });
  for (const x of [-3.6, 3.6]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 7.4), relief);
    p.position.set(x, 4.4, 1.13);
    p.rotation.x = -0.04;
    g.add(p);
  }
  return g;
}
function banner(color, at) {
  const g = new THREE.Group();
  g.position.copy(at);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 3.2, 6), new THREE.MeshStandardMaterial({ color: '#5B3E25', roughness: 0.9 }));
  pole.position.y = 1.6;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.1, 6, 6), new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide }));
  const p = cloth.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, 0.06 * Math.sin(p.getX(i) * 7 + p.getY(i) * 2));
  cloth.geometry.computeVertexNormals();
  cloth.position.set(0.36, 2.55, 0);
  g.add(pole, cloth);
  return shadows(g);
}
// Ptah: the Conductor rig at god scale in sandstone, with a lapis skullcap, a plaited
// straight beard and a was-sceptre planted beside him.
function ptahGod(assets, at, lookAt, scale) {
  const r = robot(assets, 'Conductor', at, lookAt, { scale, pose: { nod: -0.12 } });
  const m = r.mats;
  const stone = stoneMaterial('#E8CFA2', 2);
  m.shell.color.set('#DDBE8C'); m.shell.map = null; m.shell.normalMap = null; m.shell.roughnessMap = null; m.shell.roughness = 0.82; m.shell.metalness = 0; m.shell.envMapIntensity = 0.8;
  m.feet.color.set('#C9A97A'); m.feet.map = null; m.feet.normalMap = null; m.feet.roughness = 0.85;
  m.screen.color.set('#1A1512'); m.screen.emissive.set('#3A1E08'); m.screen.emissiveIntensity = 0.3; m.screen.roughness = 0.25;
  m.eyes.color.set('#FFC470'); m.eyes.emissive.set('#FFA640'); m.eyes.emissiveIntensity = 2.4;
  m.glow.color.set('#D6A848'); m.glow.emissive.set('#B07A20'); m.glow.emissiveIntensity = 0.6; m.glow.metalness = 0.9; m.glow.roughness = 0.3;
  m.sole.color.set('#B8873A'); m.sole.emissive.set('#6A4512');
  const lapis = new THREE.MeshStandardMaterial({ color: '#2C4F8C', roughness: 0.35, metalness: 0.25 });
  const gold = new THREE.MeshStandardMaterial({ color: '#D9AE52', roughness: 0.3, metalness: 0.9 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.885, 48, 24, 0, Math.PI * 2, 0, 0.92), lapis);
  const capRim = new THREE.Mesh(new THREE.TorusGeometry(0.885 * Math.sin(0.92), 0.03, 8, 64), gold);
  capRim.rotation.x = Math.PI / 2;
  capRim.position.y = 0.885 * Math.cos(0.92);
  const beard = new THREE.Group();
  const bMat = new THREE.MeshStandardMaterial({ color: '#2B241E', roughness: 0.6 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.42, 12), bMat);
  beard.add(shaft);
  for (let i = 0; i < 4; i++) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115 + i * 0.008, 0.115 + i * 0.008, 0.035, 12), gold);
    band.position.y = 0.15 - i * 0.1;
    beard.add(band);
  }
  beard.position.set(0.7, -0.66, 0);
  beard.rotation.z = 0.12;
  r.ballHead.add(cap, capRim, beard);
  shadows(r.root);
  // was-sceptre, world space, planted in the sand at the god's right
  const s = scale;
  const was = new THREE.Group();
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 2.3 * s, 10), gold);
  staff.position.y = 1.15 * s;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34 * s, 0.11 * s, 0.11 * s), gold);
  head.position.set(0.1 * s, 2.34 * s, 0);
  head.rotation.z = 0.5;
  const fork = new THREE.Mesh(new THREE.TorusGeometry(0.1 * s, 0.03 * s, 8, 16, Math.PI), gold);
  fork.rotation.z = Math.PI;
  fork.position.y = 0.02 * s;
  for (let i = 0; i < 5; i++) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.062 * s, 0.062 * s, 0.05 * s, 10), lapis);
    band.position.y = (0.5 + i * 0.36) * s;
    was.add(band);
  }
  was.add(staff, head, fork);
  const side = V(0, 0, 1).applyAxisAngle(V(0, 1, 0), r.root.rotation.y);
  was.position.copy(at).addScaledVector(side, 1.05 * s);
  was.position.y = at.y;
  shadows(was);
  return { r, was };
}
export async function buildDesertLook(assets, renderer) {
  const scene = new THREE.Scene();
  const sky = await hdri('hdri/qwantani_late_afternoon_puresky_2k.hdr');
  // put the low sun at camera-left, behind the pyramid: the HDRI is rotated so its sun azimuth lands there
  const wantAz = THREE.MathUtils.degToRad(-165); // keep the HDRI sun just outside the left edge
  const sunAz = (sky.sunU - 0.5) * Math.PI * 2;
  const rot = sunAz - wantAz;
  scene.background = sky.tex;
  scene.environment = sky.tex;
  scene.backgroundRotation.set(0, rot, 0);
  scene.environmentRotation.set(0, rot, 0);
  scene.backgroundIntensity = 0.34;
  scene.environmentIntensity = 0.55;
  renderer.toneMappingExposure = 0.95;
  scene.fog = new THREE.FogExp2('#E7B37E', 0.0075);

  const ground = sandGround();
  scene.add(ground);
  const pyr = pyramid(V(-16, -0.2, -70), { n: 26, b: 2, bh: 1.5, tiers: 13, done: 9 });
  scene.add(pyr);
  const py = pylon(V(-17, 0, -27), 0.45);
  scene.add(py);
  // the god stands in front of the work site, looking down at the visitors
  const visitors = V(-0.3, 0, 2.6);
  const god = ptahGod(assets, V(2.4, 0, -3.8), V(0.2, 0, 6), 3.5);
  scene.add(god.r.root, god.was);

  // the sofa came too: half sunk in the sand, tipped over
  const sofa = await glb('office/sofa.glb');
  const sofaG = shadows(fit(recolor(sofa, { carpet: { color: '#2F3B52', roughness: 0.92 }, wood: { color: '#5A3B27' } }), { s: 2.04, at: [-2.2, 0, 1.0], yaw: Math.PI + 0.5, sink: 0.12 }));
  sofaG.rotation.z = 0.06;
  scene.add(sofaG);
  // Codex and Claude, small at the god's feet, looking up
  const lens = V(0.9, 0.45, 6.2);
  const claude = robot(assets, 'Claude', V(0.75, 0, 2.6), lens.clone().add(V(-1.2, 0, 0)), { pose: { eyeSX: 1.35, eyeSY: 1.4, pitch: -0.1, nod: 0.06 } });
  scene.add(claude.root);
  const codex = robot(assets, 'Codex', V(-0.25, 0, 2.85), lens.clone().add(V(1.0, 0, 0)), { pose: { eyeSX: 1.2, eyeSY: 1.3, headYaw: -0.25, nod: 0.02 } });
  scene.add(codex.root);

  // work crews: robots haul sleds of stone toward the ramp under their crew banners
  const sled = await glb('desert/sled.glb');
  const blockMat = stoneMaterial('#E6C99B');
  const crews = [['Claude', '#D97757', V(-9, 0, -26)], ['Codex', '#8C8CFF', V(-2, 0, -21)], ['Antigravity', '#4F8BF5', V(-15, 0, -34)], ['Codex', '#10A37F', V(4, 0, -17)]];
  const rampFoot = V(pyr.position.x + pyr.userData.ramp.x, 0, pyr.position.z + pyr.userData.ramp.z0);
  const crewRobots = [], sleds = [], banners = [], rampRobots = [];
  let inspector = null;
  crews.forEach(([name, color, at], ci) => {
    const dir = rampFoot.clone().sub(at).setY(0).normalize();
    const yaw = Math.atan2(-dir.z, dir.x);
    const s = sled.clone(true);
    const sg = shadows(fit(s, { w: 1.5, at: [at.x, 0, at.z], yaw: yaw + Math.PI / 2 }));
    scene.add(sg);
    sleds.push(sg);
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.8), blockMat);
    block.position.set(at.x, sg.userData.size.y + 0.37, at.z);
    block.rotation.y = yaw;
    shadows(block);
    scene.add(block);
    for (let k = 0; k < 4; k++) {
      const p = at.clone().addScaledVector(dir, 1.3 + k * 0.62).add(V(-dir.z, 0, dir.x).multiplyScalar((k % 2 ? 0.28 : -0.28)));
      const worker = robot(assets, name, p, p.clone().add(dir), { scale: 0.3, badge: false, pose: { pitch: 0.18 } });
      scene.add(worker.root); crewRobots.push(worker);
    }
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.2, 5), new THREE.MeshStandardMaterial({ color: '#7A5C3A' }));
    rope.position.copy(at).addScaledVector(dir, 1.7).setY(0.35);
    rope.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
    scene.add(rope);
    const flag = banner(color, at.clone().addScaledVector(dir, 3.4).add(V(-dir.z, 0, dir.x).multiplyScalar(0.9)));
    scene.add(flag); banners.push(flag);
    if (ci === 1) {
      // the inspector with the stamp beside the middle crew's block
      const ins = robot(assets, 'Conductor', at.clone().add(V(1.4, 0, 0.4)), at, { scale: 0.32, badge: true, pose: { nod: -0.2 } });
      scene.add(ins.root); inspector = ins;
    }
  });
  // robots on the ramp
  const rmp = pyr.userData.ramp;
  for (let k = 0; k < 6; k++) {
    const f = 0.15 + k * 0.13;
    const p = V(pyr.position.x + rmp.x + (k % 2 ? 0.6 : -0.6), Math.sin(rmp.ang) * rmp.len * (1 - f) + 0.3, pyr.position.z + rmp.z0 - Math.cos(rmp.ang) * rmp.len * (1 - f));
    const name = ['Claude', 'Codex', 'Claude', 'Antigravity'][k % 4];
    const worker = robot(assets, name, p, p.clone().add(V(0, 0, -1)), { scale: 0.3, badge: false });
    scene.add(worker.root); rampRobots.push(worker);
  }
  // palms around the pylon, a stone pillar stump, scattered blocks
  const palm = await glb('desert/palm-a.glb');
  [[15.5, -27, 9.5, 0.3], [17.5, -33, 8, 1.4], [2.5, -34, 7.2, 2.2], [-27, -24, 8.5, 0.8], [11, -12, 6.5, 2.8]].forEach(([x, z, h, yaw]) => scene.add(shadows(fit(palm.clone(true), { h, at: [x, 0, z], yaw }))));
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 0.8), blockMat);
    b.position.set(-6 + hash(9, i, 'x') * 16, 0.3, -12 - hash(9, i, 'z') * 14);
    b.rotation.y = hash(9, i, 'r') * 3;
    shadows(b);
    scene.add(b);
  }

  // golden-hour light: a low warm sun matched to the HDRI, sky fill, warm ground bounce
  const sun = new THREE.DirectionalLight('#FFB46A', 3.4);
  const el = THREE.MathUtils.degToRad(13);
  sun.position.set(-Math.cos(el) * 0.62 * 60, Math.sin(el) * 60, -Math.cos(el) * 0.78 * 60);
  sun.target.position.set(0, 0, -8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const hemisphere = new THREE.HemisphereLight('#9DB4E0', '#C68A52', 0.6);
  scene.add(hemisphere);
  const front = new THREE.DirectionalLight('#FFD8B0', 0.9); // soft fill from camera side for the faces
  front.position.set(4, 3, 10);
  scene.add(front);
  const dustPoints = dust(900, V(0, 0, -2), V(16, 4, 14), 21);
  scene.add(dustPoints);

  const camera = new THREE.PerspectiveCamera(60, W / H, 0.05, 800);
  camera.position.copy(lens);
  camera.lookAt(V(0.6, 1.5, -3.8));
  window.__lookdevInfo = { sunU: +sky.sunU.toFixed(3), sunElev: +sky.sunElev.toFixed(1), rot: +rot.toFixed(2) };
  return { scene, camera, bloom: { strength: 0.3, radius: 0.6, threshold: 0.9 }, exposure: 0.95, handles: { ground, pyramid: pyr, pylon: py, ptah: god.r, sceptre: god.was, sofa: sofaG, claude, codex, crewRobots, sleds, banners, rampRobots, inspector, dustPoints, sun, hemisphere, front } };
}

// ------------------------------------------------------------------ vortex


