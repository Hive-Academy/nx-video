// Look-dev set for the Ptah colossus (16:9): desert sand, golden-hour HDRI, warm haze, distant
// pyramids, rubble at the plinth and one robot for scale. Owns all lighting; the colossus module
// owns none.
import * as THREE from 'three';
import { V, glb, hdri, fit, shadows, robot, sandGround, dust } from './craft.js';
import { createPtahColossus, createRubble } from './ptah-colossus.js';

// shot presets: camera, target, fov, statue state
export const COLOSSUS_SHOTS = {
  'colossus-a': { cam: [-10.5, 1.3, 35], at: [0.5, 11.6, 0], fov: 44, state: { eyeGlow: 0, voice: 0 }, robot: true },
  'colossus-b': { cam: [4.2, 21.3, 12.0], at: [0, 22.0, 0], fov: 30, state: { eyeGlow: 1, voice: 1, headPitch: 0.04 } },
  // iteration-only head checks (not deliverables)
  'head-front': { cam: [0, 22.3, 7.5], at: [0, 22.1, 0], fov: 26, state: { eyeGlow: 0, voice: 0 } },
  'head-34': { cam: [-5.2, 22.3, 5.4], at: [0, 22.1, 0.3], fov: 28, state: { eyeGlow: 0, voice: 0 } },
  'colossus-c': { cam: [-12, 16.8, 14], at: [0.6, 18.9, 0], fov: 34, state: { eyeGlow: 1, voice: 0.25, sceptreTilt: 0.22, headYaw: -0.14 } },
};

export async function buildColossusLook(assets, renderer, shot = 'colossus-a', { quality = 'high' } = {}) {
  const S = COLOSSUS_SHOTS[shot];
  const scene = new THREE.Scene();
  const sky = await hdri('hdri/qwantani_late_afternoon_puresky_2k.hdr');
  // sun from camera-left front, low: rotate the HDRI so its sun sits in the same direction as the key
  const sunDir = V(-0.78, 0.3, 0.55).normalize();
  const wantPhi = Math.atan2(sunDir.z, sunDir.x);
  const sunPhi = (sky.sunU - 0.5) * Math.PI * 2;
  const rot = sunPhi - wantPhi;
  scene.background = sky.tex;
  scene.environment = sky.tex;
  scene.backgroundRotation.set(0, rot, 0);
  scene.environmentRotation.set(0, rot, 0);
  scene.backgroundIntensity = 0.42;
  scene.environmentIntensity = 0.5;
  scene.fog = new THREE.FogExp2('#E2B07E', 0.0055);

  scene.add(sandGround());

  const colossus = await createPtahColossus(assets, { quality });
  scene.add(colossus.group);
  colossus.setState(S.state);

  // distant pyramids in the haze
  try {
    const p1 = shadows(fit(await glb('desert/pyramid.glb'), { h: 46, at: [-70, 0, -150], yaw: 0.4 }));
    const p2 = shadows(fit(await glb('desert/pyramid.glb'), { h: 30, at: [-15, 0, -190], yaw: 0.9 }));
    const p3 = shadows(fit(await glb('desert/pyramid.glb'), { h: 22, at: [85, 0, -175], yaw: 0.2 }));
    scene.add(p1, p2, p3);
  } catch (e) { console.warn('pyramid models missing', e); }

  // fallen fragments at the plinth
  const rub = [
    [5.6, 0, 3.2, 0.8, 0.3, 1], [-5.4, 0, 4.4, 1.1, 1.2, 2], [6.4, 0, -1.5, 0.6, 2.1, 3], [-3.2, 0, 6.2, 0.45, 0.7, 4], [3.6, 0, 7.4, 0.35, 2.6, 5],
  ];
  for (const [x, y, z, s, yaw, seed] of rub) {
    const m = createRubble(colossus, seed, s);
    m.position.set(x, y - 0.12 * s, z);
    m.rotation.set(0.08 * Math.sin(seed), yaw, 0.1 * Math.cos(seed * 2));
    scene.add(m);
  }

  let bot = null;
  if (S.robot) {
    bot = robot(assets, 'Claude', V(3.1, 0.06, 6.0), V(-6, 0, 30), { pose: { pitch: -0.25, nod: -0.25 } });
    scene.add(bot.root);
  }

  // light: low warm key matched to the HDRI sun, cool sky rim from behind-right, hemisphere fill
  const sun = new THREE.DirectionalLight('#FFB772', 3.6);
  sun.position.copy(sunDir).multiplyScalar(80).add(V(0, 0, 0));
  sun.target.position.set(0, 10, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 26, bottom: -22, near: 20, far: 160 });
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight('#9FB8E8', 1.1);
  rim.position.set(40, 30, -50);
  scene.add(rim);
  const hemi = new THREE.HemisphereLight('#F3D5B0', '#B07A48', 0.45);
  scene.add(hemi);

  // drifting haze dust in the air
  const air = dust(900, V(0, 0, 4), V(60, 26, 50), 'colossus-air');
  air.material.size = 0.06;
  air.material.opacity = 0.35;
  scene.add(air);

  const camera = new THREE.PerspectiveCamera(S.fov, 16 / 9, 0.1, 900);
  camera.position.set(...S.cam);
  camera.lookAt(...S.at);

  return {
    scene, camera, colossus, robot: bot,
    bloom: { strength: 0.55, radius: 0.5, threshold: 0.82 },
    exposure: 1.0,
    info: { triangles: colossus.triangles, height: +colossus.height.toFixed(2), rot: +rot.toFixed(2), sunElev: +sky.sunElev.toFixed(1) },
  };
}
