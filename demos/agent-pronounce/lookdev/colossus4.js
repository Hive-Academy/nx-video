// Ptah colossus look-dev inside the approved desert v4 set (src/look-desert4.js), 1920x1080.
//   colossus4.html?shot=a|b|c|d[&post=base|preview][&quality=high|draft][&cam=x,y,z&tgt=x,y,z&mm=N]
// The colossus replaces the set's Ptah proxy at handles.ptahAnchor, exactly as the integration does.
// Shot cameras are relative to the anchor: bearing is degrees from the statue's facing (+ = toward the
// statue's left, frame right in a frontal view), dist in metres, eye/look heights in metres.
import * as THREE from 'three';
import { renderFilm } from '../src/look-kit.js';
import { loadAssets } from '../src/assets.js';
import { initCraft, whenTexturesReady } from '../src/craft.js';
import { buildDesert4Look, groundAt } from '../src/look-desert4.js';
import { createPtahColossus } from '../src/ptah-colossus.js';

const SHOTS = {
  // a: low wide from the forecourt, god on its plinth beside the lit screen, crews tiny for scale
  a: { set: 'b', world: { pos: [-22, 2.2, 50], tgt: [13.5, 9.0, -48] }, mm: 70, state: { voice: 0 }, rim: 0.8, shadow: 'wide' },
  // b: waist-up, three-quarter, voice 0.5
  b: { set: 'b', bearing: 34, dist: 31, eye: 7.5, look: [0, 17.6, 0], mm: 40, state: { voice: 0.5, eyeGlow: 1, headYaw: 0.08 }, rim: 2.2 },
  // c: head-and-shoulders, voice 1
  c: { set: 'b', bearing: 22, dist: 23, eye: 15.5, look: [0, 21.4, 0.6], mm: 50, state: { voice: 1, eyeGlow: 1, headPitch: 0.03 }, rim: 2.4 },
  // d: backlit against the low sun: profile silhouette with the sceptre
  d: { set: 'b', world: { pos: [106, 1.5, -77.4], tgt: [29, 13.5, -66] }, mm: 35, state: { voice: 0 }, rim: 0, backlit: true },
};

const W = 1920, H = 1080;
const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
initCraft(renderer);
const vec = (s) => new THREE.Vector3(...s.split(',').map(Number));

(async () => {
  try {
    const shot = q.get('shot') || 'b';
    const S = SHOTS[shot];
    const post = q.get('post') || 'preview';
    const assets = await loadAssets();
    const look = await buildDesert4Look(assets, renderer, { shot: S.set, aspect: W / H });
    const { scene, camera, handles } = look;
    const A = handles.ptahAnchor;
    if (handles.ptahProxy) handles.ptahProxy.visible = false;
    const god = await createPtahColossus(assets, { quality: q.get('quality') || 'high' });
    god.group.position.copy(A.position);
    god.group.rotation.y = A.yaw;
    scene.add(god.group);
    god.setState(S.state);
    god.group.updateMatrixWorld(true);
    const local = (x, y, z) => god.group.localToWorld(new THREE.Vector3(x, y, z));

    // camera: world preset, or a bearing round the statue's facing
    let pos, tgt;
    if (S.world) { // world preset: pos y is the eye height above the ground
      pos = new THREE.Vector3(...S.world.pos); pos.y += groundAt(pos.x, pos.z);
      tgt = new THREE.Vector3(...S.world.tgt);
    }
    else {
      const b = (S.bearing * Math.PI) / 180;
      pos = local(Math.sin(b) * S.dist, 0, Math.cos(b) * S.dist);
      pos.y = A.position.y + S.eye;
      tgt = local(...S.look);
    }
    if (q.get('cam')) pos = vec(q.get('cam'));
    if (q.get('tgt')) tgt = vec(q.get('tgt'));
    camera.setFocalLength(+(q.get('mm') || S.mm));
    camera.position.copy(pos);
    camera.lookAt(tgt);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // the sun's shadow frustum: recentre it on the statue (or between screen and statue for the wide)
    const sun = handles.sun;
    const toSun = sun.position.clone().sub(sun.target.position);
    const c = S.shadow === 'wide' ? new THREE.Vector3(14, 0, -46) : A.position.clone().add(new THREE.Vector3(0, 8, 0));
    sun.target.position.copy(c); sun.position.copy(c).add(toSun);
    sun.target.updateMatrixWorld();
    if (S.shadow !== 'wide') Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26 });
    sun.shadow.camera.updateProjectionMatrix();

    // rim: a cool light from behind the statue, opposite the camera, to part the head from the sky
    if (S.rim > 0) {
      const back = A.position.clone().sub(pos).setY(0).normalize();
      const rim = new THREE.DirectionalLight('#BFD6FF', S.rim);
      rim.position.copy(A.position).addScaledVector(back, 60).add(new THREE.Vector3(0, 40, 0));
      rim.target.position.copy(local(0, 20, 0));
      scene.add(rim, rim.target);
    }
    await whenTexturesReady();
    const dist = pos.distanceTo(local(0, 16, 0));
    const film = post === 'base' ? { ...look.film, ao: false, dof: false } : { ...look.film, dof: S.world ? false : { focus: dist, aperture: 0.00025, maxblur: 0.003 } };
    const draw = () => renderFilm(renderer, scene, camera, film, W, H, 0);
    draw(); draw();
    window.__lookdevInfo = { shot, post, triangles: god.triangles, camera: { pos: pos.toArray().map((v) => +v.toFixed(2)), tgt: tgt.toArray().map((v) => +v.toFixed(2)) } };
    window.__lookdev = 'done';
  } catch (e) {
    console.error(e);
    window.__lookdev = { error: String((e && e.stack) || e) };
  }
})();
