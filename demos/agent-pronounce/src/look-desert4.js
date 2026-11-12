// Episode 6, desert act, direction v4 look: a temple-building site at golden hour with a
// monumental wide screen set into a sandstone facade, the Ptah stand-in beside it, three
// hauling crews and the two visitors in their office chairs.
//   buildDesert4Look(assets, renderer, { shot: 'a'|'b'|'c'|'d', aspect })
//     -> { scene, camera, bloom, exposure, toneMapping, post, handles, info }
// Metres throughout (robot 0.79 m). +Z points from the facade toward the audience; the
// screen faces +Z. Static and deterministic: every variation is seeded through util.hash.
import * as THREE from 'three';
import { assetUrl } from './assets.js';
import { glb, hdri, fit, shadows, recolor, robot, dune } from './craft.js';
import { buildPtah } from './ptah-god.js';
import { environment, reshadeRobot, screenLight as kitScreenLight } from './look-kit.js';
import { brazier } from './temple.js';
import { hash, hashRange } from './util.js';
import { ROBOT } from './robot.js';
import {
  V, planarUV, pbr, heightFog, mesh, battered, cornice, torusRoll, reliefTexture, rope, ropeMaterial,
  blockCourses, ramp, sledge, scaffold, hazeCard, shaft, motes, puffs, RoundedBoxGeometry,
} from './desert4-props.js';

const RS = 0.38; // robot scale
const BALL = ROBOT.ballRadius * RS; // 0.325 m
export const SCREEN = { w: 14.4, h: 6.0, x: 0, y: 6.8, z: -29.86, border: 0.9, face: -30 };
// app.png is 16:9; the screen is 2.4:1, so cover-crop to the top 800 rows (the UI that matters).
export const SCREEN_CROP = { repeatY: 800 / 1080, offsetY: 1 - 800 / 1080 };
const SUN_DIR = V(-0.97, 0.16, 0.12).normalize(); // toward the sun: low, hard camera-left, raking across the facade
const CREW = { lead: 4.85, pairs: [2.45, 3.55], lateral: 0.77 };

// Per-shot cameras (35 mm-equivalent focal on a 36 mm-wide gate) and post hints.
const SHOTS = {
  a: { pos: [1.0, 0.66, -10.9], target: [4.6, 3.3, -27], mm: 28, dof: { focus: 3.7, aperture: 0.004, maxblur: 0.006 }, screenOn: false },
  b: { pos: [0.2, 0.92, -5.6], target: [2.6, 5.3, -30], mm: 35, dof: { focus: 24.0, aperture: 0.0002, maxblur: 0.0025 }, screenOn: true },
  c: { pos: [0, 3.9, -12.9], target: [0, 6.95, -30], mm: 35, dof: { focus: 17.0, aperture: 0.0006, maxblur: 0.005 }, screenOn: true },
  d: { pos: null, target: null, mm: 45, dof: { focus: 4.6, aperture: 0.003, maxblur: 0.008 }, screenOn: true },
};

export async function buildDesert4Look(assets, renderer, { shot = 'b', aspect = 16 / 9 } = {}) {
  const S = SHOTS[shot] || SHOTS.b;
  const scene = new THREE.Scene();
  const handles = { crews: [], visitors: [], chairs: [], braziers: [] };

  // ---------------------------------------------------------------- sky, IBL, sun
  const sky = await hdri('hdri/qwantani_dusk_2_puresky_2k.hdr');
  // rotate the HDRI so its sun sits on SUN_DIR (equirect u = atan2(z, x) / 2pi + 0.5)
  const hdriAz = (sky.sunU - 0.5) * Math.PI * 2;
  const wantAz = Math.atan2(SUN_DIR.z, SUN_DIR.x);
  const rotY = hdriAz - wantAz;
  // look kit: PMREM image light + the HDRI as backplate (the kit rotates the env; the backplate rotation is set here)
  environment(renderer, scene, sky.tex, { intensity: 0.55, rotation: rotY, background: true, backgroundIntensity: 0.95 });
  scene.backgroundRotation.set(0, rotY, 0);

  const sun = new THREE.DirectionalLight('#FFCC98', 3.2);
  sun.position.copy(SUN_DIR).multiplyScalar(90).add(V(0, 0, -18));
  sun.target.position.set(0, 0, -18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -36, right: 36, top: 30, bottom: -30, near: 10, far: 200 });
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#9DB4DC', '#A08A70', 0.42);
  scene.add(hemi);
  handles.sun = sun;

  // ---------------------------------------------------------------- materials
  const facadeMat = pbr('large_sandstone_blocks', { color: '#CBC4BA', normal: 1.1, env: 0.8 });
  const carveMat = pbr('sandstone_cracks', { color: '#D0C7BB', normal: 0.9, env: 0.8 });
  const blockMat = pbr('sandstone_cracks', { color: '#DAD0C1', normal: 0.9, env: 0.8 });
  const rubbleMat = pbr('sand_01', { color: '#CFC1AC', normal: 1.0 });
  const woodMat = pbr('wood_planks', { color: '#D9B48A', normal: 0.8, env: 0.7 });
  const sandMat = pbr('sand_01', { color: '#D6C6AE', normal: 0.85, env: 0.9 });
  sandMat.vertexColors = true;
  const gold = new THREE.MeshStandardMaterial({ color: '#E7B65A', metalness: 1, roughness: 0.28, envMapIntensity: 1.4 });
  const lapis = new THREE.MeshStandardMaterial({ color: '#244A9A', roughness: 0.55, envMapIntensity: 0.6 });
  const leather = new THREE.MeshStandardMaterial({ color: '#5B3A22', roughness: 0.75 });
  const ropeMat = ropeMaterial();

  // ---------------------------------------------------------------- ground
  {
    const g = new THREE.PlaneGeometry(900, 900, 300, 300);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const r = Math.hypot(x * 0.8, z + 22);
      const flat = THREE.MathUtils.smoothstep(r, 34, 70);
      const y = dune(x, z) * 0.35 * (1 - flat) * 0.25 + (dune(x * 0.6, z * 0.6) * 4 + 2.2) * flat * (1 + Math.max(0, r - 90) / 50);
      p.setY(i, y);
      // macro variation: darker wind-packed bands, paler drifts
      const n = 0.5 + 0.25 * Math.sin(x * 0.07 + z * 0.05) * Math.sin(z * 0.11 - x * 0.03) + 0.25 * Math.sin(x * 0.23 + 1.7) * Math.cos(z * 0.19);
      const v = 0.86 + 0.2 * n;
      col[i * 3] = v; col[i * 3 + 1] = v * 0.97; col[i * 3 + 2] = v * 0.93;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    planarUV(g, 3.2);
    const m = new THREE.Mesh(g, sandMat);
    m.receiveShadow = true;
    scene.add(m);
  }

  // ---------------------------------------------------------------- facade and screen
  const site = new THREE.Group();
  scene.add(site);
  // main facade: 28 x 14 x 5, front face at z = -30, battered sides
  site.add(mesh(battered(21, 14, 5, { batter: 0.04, tile: 4.2 }), facadeMat, [0, 0, -32.5]));
  // cavetto cornice + torus roll along the top, corner rolls down the sides
  {
    const top = 21 - 0.04 * 2 * 14;
    site.add(mesh(cornice(top + 0.6, { h: 1.7, out: 1.15 }), carveMat, [0, 14, -30.35]));
    site.add(mesh(torusRoll(top + 0.4, 0.2), carveMat, [0, 14.05, -30.05], { rot: [0, 0, Math.PI / 2] }));
    for (const s of [-1, 1]) {
      const r = mesh(torusRoll(14.1, 0.2), carveMat, [s * (10.5 - 0.56), 7.0, -30.05], { rot: [0, 0, s * 0.04] });
      site.add(r);
    }
    // a band of relief under the cornice
    const band = reliefTexture(41, 256, 1024, 1);
    band.wrapS = band.wrapT = THREE.RepeatWrapping;
    band.center.set(0.5, 0.5); band.rotation = Math.PI / 2; band.repeat.set(1, 10);
    const bm = carveMat.clone(); bm.bumpMap = band; bm.bumpScale = 3.2; bm.bumpMap.channel = 1;
    const bg = planarUV(new THREE.BoxGeometry(top - 1.4, 0.75, 0.16), 2.4);
    bg.setAttribute('uv1', bg.attributes.uv.clone());
    const buv = bg.getAttribute('uv1');
    // rebuild uv1 as 0..1 across the band face so the relief runs along it
    const bbox = new THREE.Box3().setFromBufferAttribute(bg.attributes.position);
    for (let i = 0; i < buv.count; i++) buv.setXY(i, (bg.attributes.position.getY(i) - bbox.min.y) / 0.75, (bg.attributes.position.getX(i) - bbox.min.x) / (top - 1.4));
    site.add(mesh(bg, bm, [0, 13.35, -29.95]));
  }
  // raised relief pilasters either side of the frame
  for (const s of [-1, 1]) {
    const t = reliefTexture(60 + s, 256, 1024, 1);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2.2);
    const m = carveMat.clone(); m.bumpMap = t; m.bumpScale = 3.5; t.channel = 1;
    const geo = planarUV(new THREE.BoxGeometry(2.2, 9.6, 0.22), 2.4);
    geo.setAttribute('uv1', new THREE.BufferAttribute(new Float32Array(geo.attributes.uv.count * 2), 2));
    const u1 = geo.getAttribute('uv1'), pp = geo.attributes.position;
    for (let i = 0; i < u1.count; i++) u1.setXY(i, pp.getX(i) / 2.2 + 0.5, pp.getY(i) / 9.6 + 0.5);
    site.add(mesh(geo, m, [s * 9.3, 2.4 + 4.8, -29.95]));
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
      const m = carveMat.clone(); m.bumpMap = t; m.bumpScale = 4; t.channel = 1;
      const geo = planarUV(new RoundedBoxGeometry(bw, bh, proud, 2, 0.06), 2.2);
      const u1 = new Float32Array(geo.attributes.position.count * 2), pp = geo.attributes.position;
      for (let i = 0; i < pp.count; i++) { u1[i * 2] = pp.getX(i) / bw + 0.5; u1[i * 2 + 1] = pp.getY(i) / bh + 0.5; }
      geo.setAttribute('uv1', new THREE.BufferAttribute(u1, 2));
      frame.add(mesh(geo, m, [cx, cy, face + proud / 2]));
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
    const disk = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.22, 48), gold, [x, y + oh / 2 + 1.05, face + 0.2], { rot: [Math.PI / 2, 0, 0] });
    frame.add(disk);
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0.25); sh.quadraticCurveTo(2.2, 0.75, 4.3, 0.42); sh.lineTo(4.1, 0.05);
      sh.quadraticCurveTo(2.3, -0.12, 0, -0.32); sh.lineTo(0, 0.25);
      const wg = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
      const wm = mesh(wg, gold, [x + s * 0.55, y + oh / 2 + 1.05, face + 0.1]);
      wm.scale.x = s;
      frame.add(wm);
      // feather lines in lapis
      for (let k = 0; k < 5; k++) {
        const f = mesh(new THREE.BoxGeometry(0.06, 0.42 - k * 0.04, 0.03), lapis, [x + s * (1.0 + k * 0.62), y + oh / 2 + 1.07 + Math.sin(k * 0.5) * 0.12, face + 0.255], { cast: false, rot: [0, 0, s * 0.25] });
        frame.add(f);
      }
      // uraeus loops beside the disk
      frame.add(mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), gold, [x + s * 0.78, y + oh / 2 + 0.72, face + 0.25]));
    }
  }
  site.add(frame);

  // the screen: emissive glass, cover-cropped app still
  const appTex = await new THREE.TextureLoader().loadAsync(assetUrl('assets/live-demo/stills/app.png'));
  appTex.colorSpace = THREE.SRGBColorSpace;
  appTex.anisotropy = 16;
  appTex.repeat.set(1, SCREEN_CROP.repeatY);
  appTex.offset.set(0, SCREEN_CROP.offsetY);
  appTex.generateMipmaps = true;
  const screenMat = new THREE.MeshStandardMaterial({
    // off: polished obsidian that catches the sky; on: pure emission, no veil
    color: S.screenOn ? '#000000' : '#0B0B0E', roughness: S.screenOn ? 1 : 0.22, metalness: 0, envMapIntensity: S.screenOn ? 0 : 0.9,
    emissive: '#FFFFFF', emissiveMap: appTex, emissiveIntensity: S.screenOn ? 1.55 : 0.0, fog: false,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), screenMat);
  screen.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  screen.name = 'screen';
  site.add(screen);
  // the dark recess behind the glass edge
  site.add(mesh(new THREE.BoxGeometry(SCREEN.w + 0.1, SCREEN.h + 0.1, 0.1), new THREE.MeshStandardMaterial({ color: '#0B0A09', roughness: 0.9 }), [SCREEN.x, SCREEN.y, SCREEN.face + 0.06], { cast: false }));
  // the screen as a cool area light on the forecourt
  const screenLight = kitScreenLight(SCREEN.w, SCREEN.h, '#9CC0FF', S.screenOn ? 5.5 : 0);
  screenLight.position.set(SCREEN.x, SCREEN.y, SCREEN.z + 0.12);
  screenLight.lookAt(SCREEN.x, SCREEN.y, 10);
  site.add(screenLight);
  handles.screen = screen;
  handles.screenFrame = frame;
  handles.screenLight = screenLight;
  handles.screenCrop = SCREEN_CROP;

  // podium steps in front of the facade
  for (let i = 0; i < 3; i++) {
    const d = 2.6 - i * 0.8;
    site.add(mesh(planarUV(new RoundedBoxGeometry(21.5 - i * 0.8, 0.3 * (i + 1), d, 1, 0.03), 2.4), carveMat, [0, 0.15 * (i + 1), -30 + d / 2]));
  }

  // left tower, unfinished: battered core, a ragged top course, scaffolding in front
  site.add(mesh(battered(11, 6.4, 6, { batter: 0.05, tile: 4.2 }), facadeMat, [-19.6, 0, -33]));
  {
    const top = blockCourses(blockMat, { len: 10.0, courses: 2, done: 0.55, seed: 21, bl: 1.4, bh: 0.62, bd: 5.6 });
    top.position.set(-19.4, 6.4, -33);
    site.add(top);
    const sc = scaffold(woodMat, { w: 9.5, h: 9.4, d: 1.5, bays: 4, lifts: 4, seed: 22 });
    sc.position.set(-19.6, 0, -29.9);
    site.add(sc);
  }
  // right tower, finished, the backdrop for Ptah
  site.add(mesh(battered(11, 8.6, 6, { batter: 0.05, tile: 4.2 }), facadeMat, [19.6, 0, -33]));
  site.add(mesh(cornice(10.4, { h: 1.5, out: 1.0 }), carveMat, [19.6, 8.6, -30.32]));

  // half-raised forecourt wall at the left of the site
  {
    const wall = blockCourses(blockMat, { len: 11, courses: 4, done: 0.5, seed: 31, bl: 1.25, bh: 0.6, bd: 1.1 });
    wall.rotation.y = Math.PI / 2;
    wall.position.set(-8.6, 0, -23.5);
    site.add(wall);
    const lad = await glb('ph/wooden_ladder/wooden_ladder_1k.gltf');
    const l = fit(lad, { h: 2.9, at: [-7.85, 0, -21.2], yaw: Math.PI / 2 });
    l.rotation.z = 0.0; l.children[0].rotation.x = 0;
    l.rotation.set(0, Math.PI / 2, -0.28);
    site.add(shadows(l));
  }

  // ---------------------------------------------------------------- Ptah stand-in
  {
    const p = buildPtah();
    const k = 11.6 / p.height;
    p.group.scale.setScalar(k);
    p.group.position.set(10.75, 0, -27.4);
    p.group.rotation.y = -0.32;
    const stone = pbr('sandstone_cracks', { color: '#CCC2B4', normal: 0.8, env: 0.7 });
    p.group.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m.map && !m.emissiveMap && m.emissiveIntensity === 1 && m.emissive?.getHex() === 0) {
        if (!o.geometry.userData.pv) { planarUV(o.geometry, 1.4); o.geometry.userData.pv = true; }
        o.material = stone;
      }
    });
    p.eyeMat.emissiveIntensity = S.screenOn ? 1.6 : 0.15;
    p.djedMat.emissiveIntensity = S.screenOn ? 0.6 : 0.05;
    p.ankhMat.emissiveIntensity = S.screenOn ? 0.6 : 0.05;
    shadows(p.group);
    scene.add(p.group);
    const fwd = V(Math.sin(p.group.rotation.y), 0, Math.cos(p.group.rotation.y));
    handles.ptah = p;
    handles.ptahAnchor = { position: p.group.position.clone(), facing: fwd, yaw: p.group.rotation.y, height: p.height * k, scale: k };
  }

  // ---------------------------------------------------------------- crews
  const crewDefs = [
    { name: 'Antigravity', key: 'near', start: V(-1.55, 0, -24.25), dir: V(-0.17, 0, 0.985), len: 10, rise: 1.0, s: 3.4, seed: 101 },
    { name: 'Cursor', key: 'mid', start: V(4.2, 0, -27.35), dir: V(0.17, 0, 0.985), len: 12.5, rise: 1.6, s: 3.1, seed: 202 },
    { name: 'OpenCode', key: 'far', start: V(1.8, 0, -25.95), dir: V(-1, 0, 0), len: 15, rise: 2.2, s: 2.9, seed: 303 },
  ];
  for (const def of crewDefs) handles.crews.push(buildCrew(assets, scene, def, { blockMat, rubbleMat, woodMat, leather, ropeMat }));
  // look kit robot shading; a face light only where faces are read up close (shot d crew), the blob kept for sand contact
  for (const c of handles.crews) for (const r of c.robots) { reshadeRobot(r, { faceLight: shot === 'd' && c.key === 'mid' ? 0.22 : 0 }); if (r.blob) r.blob.visible = true; }

  // stockpiles of cut blocks and site clutter
  const pile = (x, z, yaw, n, seed) => {
    const b = blockCourses(blockMat, { len: n * 1.3, courses: 2, done: 0.6, seed, bl: 1.3, bh: 0.7, bd: 1.0 });
    b.position.set(x, 0, z); b.rotation.y = yaw; site.add(b);
  };
  pile(-5.2, -27.0, 0.05, 3, 51);
  pile(9.0, -21.0, -0.5, 2, 52);
  pile(-12.4, -17.0, 1.2, 3, 53);
  pile(14.5, -18.0, 0.3, 3, 54);
  const props = [
    ['ph/wooden_crate_01/wooden_crate_01_1k.gltf', { h: 0.62, at: [-6.2, 0, -21.3], yaw: 0.4 }],
    ['ph/wooden_crate_01/wooden_crate_01_1k.gltf', { h: 0.62, at: [-6.5, 0, -20.4], yaw: 1.1 }],
    ['ph/wooden_crate_01/wooden_crate_01_1k.gltf', { h: 0.6, at: [7.9, 0, -19.4], yaw: -0.3 }],
    ['ph/ceramic_vase_02/ceramic_vase_02_1k.gltf', { h: 0.72, at: [-5.6, 0, -22.4], yaw: 0 }],
    ['ph/ceramic_vase_02/ceramic_vase_02_1k.gltf', { h: 0.6, at: [8.6, 0, -20.4], yaw: 1 }],
    ['ph/wicker_basket_01/wicker_basket_01_1k.gltf', { h: 0.38, at: [-5.5, 0, -19.6], yaw: 0.2 }],
    ['ph/wicker_basket_01/wicker_basket_01_1k.gltf', { h: 0.36, at: [7.4, 0, -18.4], yaw: 0.7 }],
    ['ph/stone_fire_pit/stone_fire_pit_1k.gltf', { w: 1.3, at: [-3.9, 0, -13.2], yaw: 0 }],
    ['ph/sand_rocks_small_01/sand_rocks_small_01_1k.gltf', { w: 2.6, at: [5.2, 0, -12.6], yaw: 0.6 }],
    ['ph/sand_rocks_small_01/sand_rocks_small_01_1k.gltf', { w: 3.0, at: [-9.5, 0, -12.0], yaw: 2.1 }],
  ];
  for (const [p, o] of props) site.add(shadows(fit(await glb(p), o)));

  // braziers on the podium flanking the screen, and a fire in the pit
  for (const [x, z, sd] of [[-8.6, -28.4, 1], [8.6, -28.4, 2], [-3.9, -13.2, 3]]) {
    const b = brazier(scene, x, z, `d4b${sd}`, { intensity: sd === 3 ? 7 : 11, flame: sd === 3 ? 1.2 : 1 });
    if (sd !== 3) b.group.position.y = 0.9;
    else { b.group.position.y = -0.85; b.group.scale.setScalar(1.3); b.group.children.forEach((c) => { if (c.isMesh && c.material.metalness > 0.5) c.visible = false; }); }
    b.update(0.37 * sd);
    handles.braziers.push(b);
  }

  // ---------------------------------------------------------------- visitors and chairs
  const chairSrc = await glb('workspace/mid_century_lounge_chair/mid_century_lounge_chair_1k.gltf');
  const visitorDefs = shot === 'a'
    ? [{ name: 'Claude', chair: [0.55, -14.55], yaw: -0.18, tilt: [0.06, 0.04], seated: true }, { name: 'Codex', chair: [2.1, -14.85], yaw: 0.22, tilt: [-0.05, -0.06], seated: true }]
    : [{ name: 'Claude', chair: [-0.35, -12.6], yaw: 2.6, tilt: [0.06, 0.04], at: [0.35, -13.3] }, { name: 'Codex', chair: [2.45, -12.9], yaw: -2.4, tilt: [-0.05, -0.06], at: [1.7, -13.55] }];
  for (const v of visitorDefs) {
    const c = fit(chairSrc.clone(true), { h: 0.74, at: [v.chair[0], 0, v.chair[1]], yaw: v.yaw, sink: 0.09 });
    c.rotation.x = v.tilt[0]; c.rotation.z = v.tilt[1];
    shadows(c);
    scene.add(c);
    handles.chairs.push(c);
    scene.add(puffs(V(v.chair[0], 0, v.chair[1]), { n: shot === 'a' ? 8 : 5, r: shot === 'a' ? 0.75 : 0.6, seed: hash(v.name), opacity: shot === 'a' ? 0.2 : 0.14, size: shot === 'a' ? 1.1 : 0.8 }));
    let r;
    if (v.seated) {
      c.updateMatrixWorld(true);
      const seatY = seatHeight(c);
      const fwd = V(Math.sin(v.yaw), 0, Math.cos(v.yaw));
      const at = V(v.chair[0], seatY - 0.02, v.chair[1]).addScaledVector(fwd, 0.02);
      r = robot(assets, v.name, at, at.clone().add(fwd), { scale: RS, pose: { pitch: v.name === 'Claude' ? 0.08 : 0.05, headYaw: v.name === 'Claude' ? 0.12 : -0.15, nod: 0.06, eyeSX: 1.05, eyeSY: 1.05 } });
      r.blob.visible = false;
    } else {
      const at = V(v.at[0], 0, v.at[1]);
      r = robot(assets, v.name, at, V(SCREEN.x + (v.name === 'Claude' ? -1 : 1), 0, -30), { scale: RS, pose: { pitch: 0.12, nod: 0.05 } });
    }
    reshadeRobot(r, { faceLight: shot === 'a' ? 0.35 : 0 });
    if (!v.seated && r.blob) r.blob.visible = true;
    scene.add(r.root);
    handles.visitors.push(r);
  }

  // ---------------------------------------------------------------- background
  {
    const bgItems = [
      ['ph/namaqualand_cliff_01/namaqualand_cliff_01_1k.gltf', { w: 150, at: [-95, -3, -175], yaw: 0.3 }],
      ['ph/namaqualand_cliff_02/namaqualand_cliff_02_1k.gltf', { w: 170, at: [70, -4, -205], yaw: -0.4 }],
      ['ph/namaqualand_cliff_01/namaqualand_cliff_01_1k.gltf', { w: 120, at: [175, -3, -150], yaw: 2.0 }],
      ['ph/namaqualand_cliff_02/namaqualand_cliff_02_1k.gltf', { w: 130, at: [-200, -4, -120], yaw: 1.4 }],
      ['ph/namaqualand_boulder_02/namaqualand_boulder_02_1k.gltf', { w: 7, at: [-30, -0.6, -48], yaw: 0.4 }],
      ['ph/namaqualand_boulder_05/namaqualand_boulder_05_1k.gltf', { w: 9, at: [34, -0.8, -52], yaw: 1.2 }],
      ['ph/namaqualand_boulder_02/namaqualand_boulder_02_1k.gltf', { w: 5, at: [-24, -0.4, -9], yaw: 2.4 }],
      ['ph/namaqualand_boulder_05/namaqualand_boulder_05_1k.gltf', { w: 4.5, at: [24, -0.4, -6], yaw: 0.2 }],
      ['ph/dead_quiver_trunk/dead_quiver_trunk_1k.gltf', { h: 4.2, at: [-15.5, 0, -10.5], yaw: 0.8 }],
      ['ph/dead_quiver_trunk/dead_quiver_trunk_1k.gltf', { h: 3.4, at: [21, 0, -15], yaw: 2.2 }],
      ['desert/pyramid.glb', { h: 38, at: [-62, 0, -118], yaw: 0.2 }],
      ['desert/step-pyramid.glb', { h: 30, at: [52, 0, -112], yaw: -0.3 }],
      ['desert/palm-a.glb', { h: 7.5, at: [-28, 0, -36], yaw: 0.3 }],
      ['desert/palm-b.glb', { h: 8.5, at: [-31, 0, -31], yaw: 1.3 }],
      ['desert/palm-a.glb', { h: 7.0, at: [30, 0, -38], yaw: 2.1 }],
    ];
    for (const [p, o] of bgItems) scene.add(shadows(fit(await glb(p), o)));
  }

  // ---------------------------------------------------------------- atmosphere
  const fog = heightFog(scene, { color: '#C4B2A2', sunColor: '#FFD09A', sunDir: SUN_DIR, density: 0.0105, base: 0, falloff: 0.11, floor: 0.22, lobe: 5 });
  // layered haze cards facing the audience
  for (const [x, z, w, h, o, c] of [[0, -42, 140, 9, 0.18, '#E9B98E'], [-20, -75, 220, 16, 0.22, '#D9AE92'], [30, -125, 320, 26, 0.28, '#C9A39A'], [0, -22, 70, 2.2, 0.08, '#F0C9A0']]) {
    const hc = hazeCard(w, h, { color: c, opacity: o, seed: x + z });
    hc.position.set(x, -0.2, z);
    scene.add(hc);
  }
  // sun shafts raking in from camera-left through the scaffolding
  const into = SUN_DIR.clone().negate();
  for (let i = 0; i < 7; i++) {
    const from = V(-34 + i * 1.9, 14 + hash(7, i) * 4, -33 + i * 0.9);
    scene.add(shaft(from, into, { len: 34, w: 1.2 + hash(8, i) * 2.4, opacity: 0.035 + hash(9, i) * 0.03 }));
  }
  scene.add(motes(900, V(0, 0, -20), V(40, 7, 28), 77, { size: 0.045, opacity: 0.55 }));
  scene.add(motes(300, V(0, 0.05, -18), V(30, 0.6, 20), 78, { size: 0.12, opacity: 0.22, color: '#F3D2A8' }));

  fog.apply(scene);
  // look kit: transparent atmosphere (dust, haze cards, shafts, motes, flames) stays out of the AO and DOF depth renders
  scene.userData.noDepth = scene.userData.noDepth || [];
  scene.traverse((o) => { const m = o.material; if ((o.isMesh || o.isPoints || o.isSprite) && m && !Array.isArray(m) && m.transparent) scene.userData.noDepth.push(o); });

  // ---------------------------------------------------------------- camera
  const camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 1200);
  camera.filmGauge = 36;
  camera.setFocalLength(S.mm);
  let pos = S.pos && V(...S.pos), target = S.target && V(...S.target);
  if (shot === 'd') {
    const c = handles.crews.find((k) => k.key === 'mid');
    const leader = c.leader.root.getWorldPosition(V(0, 0, 0));
    const dir = c.dir;
    const side = V(dir.z, 0, -dir.x); // camera-left of the hauling line
    pos = leader.clone().addScaledVector(dir, 3.6).addScaledVector(side, 3.4).setY(leader.y + 0.55);
    target = leader.clone().addScaledVector(dir, -2.0).addScaledVector(side, 0.3).add(V(0, 0.55, 0));
  }
  camera.position.copy(pos);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  if (S.dof && shot === 'd') S.dof.focus = pos.distanceTo(handles.crews.find((k) => k.key === 'mid').leader.root.getWorldPosition(V(0, 0, 0))) + 0.4;

  // screen fill: projected glass corners
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => V(SCREEN.x + sx * SCREEN.w / 2, SCREEN.y + sy * SCREEN.h / 2, SCREEN.z).project(camera));
  const xs = corners.map((c) => (c.x + 1) / 2), ys = corners.map((c) => (1 - c.y) / 2);
  const info = {
    screenFill: +(Math.max(...xs) - Math.min(...xs)).toFixed(3),
    screenX: [+Math.min(...xs).toFixed(3), +Math.max(...xs).toFixed(3)],
    screenY: [+Math.min(...ys).toFixed(3), +Math.max(...ys).toFixed(3)],
    camera: { pos: pos.toArray().map((v) => +v.toFixed(2)), target: target.toArray().map((v) => +v.toFixed(2)), mm: S.mm },
  };
  // where each robot's face lands (fraction of frame from the top)
  info.faces = [...handles.visitors, ...handles.crews.flatMap((c) => c.robots)].map((r) => {
    const p = r.root.localToWorld(V(ROBOT.screenX, ROBOT.eyeY, 0)).project(camera);
    return [r.name.slice(0, 2), +((p.x + 1) / 2).toFixed(2), +((1 - p.y) / 2).toFixed(2)];
  }).filter((f) => f[1] > -0.05 && f[1] < 1.05 && f[2] > -0.05 && f[2] < 1.05);

  // look kit film chain (src/look-kit.js). AO radius is larger than the workspace's: the set is metres of stone, not a desk.
  const film = {
    size: [1920, 1080], tone: 'aces', exposure: 0.92, msaa: 4,
    ao: { radius: 0.45, thickness: 1.2, distanceExponent: 1.6, scale: 1, samples: 16, intensity: 0.8 },
    dof: S.dof,
    bloom: { strength: 0.3, radius: 0.55, threshold: 1.05 },
    grade: { vignette: 0.3, grain: 0.022, ca: 0.0012, lift: [0.006, 0.006, 0.012], seed: 4 },
  };
  return {
    scene, camera,
    bloom: null, exposure: film.exposure, film,
    handles, info,
  };
}

// Highest point of a chair's seat under its centre (ray cast down through the model).
function seatHeight(chair) {
  const box = new THREE.Box3().setFromObject(chair);
  const c = box.getCenter(V(0, 0, 0));
  const ray = new THREE.Raycaster(V(c.x, box.max.y + 1, c.z), V(0, -1, 0));
  const hits = ray.intersectObject(chair, true).filter((h) => h.point.y < box.min.y + (box.max.y - box.min.y) * 0.75);
  return hits.length ? hits[0].point.y : box.min.y + (box.max.y - box.min.y) * 0.5;
}

// One crew: a ramp along `dir`, a sledge with a lashed block at ramp distance s, four followers
// in two files on two taut ropes, and a leader on the bridle. All in the ramp's local frame.
function buildCrew(assets, scene, def, M) {
  const g = new THREE.Group();
  g.position.copy(def.start);
  g.rotation.y = Math.atan2(def.dir.x, def.dir.z);
  scene.add(g);
  const rp = ramp(M.rubbleMat, M.woodMat, { len: def.len, w: 2.7, rise: def.rise, seed: def.seed });
  g.add(rp);
  const hAt = (z) => (Math.max(0, Math.min(def.len, z)) / def.len) * def.rise + 0.1;
  // the landing platform the ramp climbs to
  const plat = blockCourses(M.blockMat, { len: 3.6, courses: Math.max(1, Math.round(def.rise / 0.55)), done: 1, seed: def.seed + 1, bl: 1.2, bh: def.rise / Math.max(1, Math.round(def.rise / 0.55)), bd: 3.4 });
  plat.position.set(0, 0, def.len + 1.6);
  g.add(plat);

  const sl = sledge(M.woodMat, M.blockMat, { seed: def.seed });
  sl.position.set(0, hAt(def.s) - 0.1, def.s);
  sl.rotation.x = -rp.userData.slope;
  g.add(sl);

  const fwdLocal = V(0, 0, 1);
  const robots = [];
  const place = (x, z, pose) => {
    const at = V(x, hAt(z), z);
    const r = robot(assets, def.name, at, at.clone().add(fwdLocal), { scale: RS, pose });
    g.add(r.root);
    // harness band around the ball
    const hb = new THREE.Mesh(new THREE.TorusGeometry(ROBOT.ballRadius * 1.035, 0.055, 8, 40), M.leather);
    hb.rotation.x = Math.PI / 2;
    hb.position.y = ROBOT.ballCenterY - ROBOT.ballBottom - 0.05;
    hb.castShadow = true;
    r.ballBase.add(hb);
    robots.push(r);
    return r;
  };
  const follower = (i, side) => ({ pitch: -0.2 - hash(def.seed, i, side) * 0.08, bx: 0.1, squash: 0.95, eyeSY: 0.62 + hash(def.seed, i, side, 'e') * 0.12, eyeSX: 1.08, nod: -0.06, headYaw: (hash(def.seed, i, side, 'h') - 0.5) * 0.25 });
  const front = def.s + 0.95;
  const files = { '-1': [], '1': [] };
  CREW.pairs.forEach((dz, i) => {
    for (const side of [-1, 1]) files[side].push(place(side * CREW.lateral, def.s + dz, follower(i, side)));
  });
  const leader = place(0, def.s + CREW.lead, { pitch: -0.28, bx: 0.14, squash: 0.93, eyeSY: 0.58, eyeSX: 1.1, nod: -0.05 });

  g.updateMatrixWorld(true);
  const toLocal = (obj, p) => g.worldToLocal(obj.localToWorld(p.clone()));
  const ballCentre = (r) => toLocal(r.ballBase, V(0, ROBOT.ballCenterY - ROBOT.ballBottom - 0.05, 0));
  const R = BALL * 1.06;
  const bridle = V(0, 0, def.s + CREW.lead - 0.85);
  bridle.y = hAt(bridle.z) + 0.44;
  for (const side of [-1, 1]) {
    const a = toLocal(sl, sl.userData.attach[side < 0 ? 0 : 1]);
    const pts = [a];
    for (const r of files[side]) { const c = ballCentre(r); pts.push(c.clone().add(V(-side * R, 0, -0.12)), c.clone().add(V(-side * R, 0, 0.12))); }
    pts.push(bridle.clone());
    g.add(rope(pts, { r: 0.02, mat: M.ropeMat }));
  }
  const lc = ballCentre(leader);
  g.add(rope([bridle.clone(), lc.clone().add(V(0, 0, -R))], { r: 0.024, mat: M.ropeMat }));
  // a coil of spare rope on the sledge and a stake at the ramp foot
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 24), M.ropeMat);
  coil.position.copy(toLocal(sl, V(0.42, sl.userData.blockTop + 0.03, 0.55)));
  coil.rotation.x = Math.PI / 2 - rp.userData.slope;
  g.add(coil);
  shadows(g);
  robots.forEach((r) => { r.blob.castShadow = false; r.blob.receiveShadow = false; });
  return { key: def.key, name: def.name, group: g, ramp: rp, sledge: sl, robots, leader, dir: def.dir.clone().normalize(), start: def.start.clone() };
}
