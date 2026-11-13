// Ptah colossus look-dev inside the approved desert v4 set (src/look-desert4.js), 1920x1080.
//   colossus4.html?shot=a|b|c|d|m[&bake=0][&post=base|preview][&quality=high|draft][&scan=0|<asset path>][&cam=x,y,z&tgt=x,y,z&mm=N]
// The figure is the museum scan when its file is present (scan=0 forces the procedural one). Shot distances
// and heights are authored for the 24.08 m procedural statue and scale with the built height (k below), so
// the framing carries over to any mesh.
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
  a: { set: 'b', world: { pos: [-22, 2.2, 50], tgt: [13.5, 9.0, -48] }, mm: 84, state: { voice: 0 }, rim: 0.8, shadow: 'wide' },
  // b: waist-up, three-quarter, voice 0.5: low heroic camera on a long lens
  b: { set: 'b', bearing: 32, dist: 46, eye: 8, look: [0, 18.6, 0], mm: 70, state: { voice: 0.5, eyeGlow: 1, headYaw: 0.1 }, rim: 2.6 },
  // c: head-and-shoulders, voice 1
  c: { set: 'b', bearing: 18, dist: 32, eye: 13, look: [0, 21.7, 0.6], mm: 85, state: { voice: 1, eyeGlow: 1, headPitch: 0.04 }, rim: 2.8 },
  // d: backlit at golden hour: a low frontal three-quarter looking up at the god against the deep anti-sun sky; the key light
  //    swings behind the statue, low and amber, so the shoulders, cap and sceptre are edged in gold and the front falls into shape
  // m: mid from the low desert angle on a 35 mm: the whole statue, plinth to crown, eyes lit at voice 1 (the closest the film goes)
  m: { set: 'b', bearing: 34, dist: 50, eye: 1.4, look: [0, 12.6, 0], mm: 35, state: { voice: 1, eyeGlow: 1 }, rim: 1.6 },
  d: { set: 'b', bearing: 24, dist: 58, eye: 1.4, look: [0, 13.2, 0], mm: 40, state: { voice: 0 }, rim: 0,
       golden: { side: 1.9, elev: 0.2, color: '#FF9440', sun: 12, env: 0.14, hemi: 0.2 } },
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
    const S = { ...SHOTS[shot] };
    // debug overrides for fit work: bear (deg), dist, eye, look=x,y,z (all in the 24.08 m authoring frame)
    if (q.get('bear')) { delete S.world; S.bearing = +q.get('bear'); S.dist = +(q.get('dist') || 40); S.eye = +(q.get('eye') || 12); S.look = (q.get('look') || '0,14,0').split(',').map(Number); }
    const post = q.get('post') || 'preview';
    const assets = await loadAssets();
    const look = await buildDesert4Look(assets, renderer, { shot: S.set, aspect: W / H });
    const { scene, camera, handles } = look;
    const A = handles.ptahAnchor;
    if (handles.ptahProxy) handles.ptahProxy.visible = false;
    const scanQ = q.get('scan');
    const god = await createPtahColossus(assets, { quality: q.get('quality') || 'high', ...(scanQ ? { scan: scanQ === '0' ? false : scanQ } : {}), ...(q.get('fit') ? { scanFit: JSON.parse(q.get('fit')) } : {}) });
    // pre-bake: a live fit is written once to the git-ignored cache next to the scan (the shooter accepts the PUT)
    if (god.scanBake && !god.scanBake.hit && q.get('bake') !== '0') {
      const r = await fetch(`../${god.scanBake.url}`, { method: 'PUT', body: god.scanBake.serialize() }).catch(() => null);
      if (!r || !r.ok) console.warn('colossus bake not written', r && r.status);
    }
    const k = god.height / 24.08; // framing scale against the procedural statue the shots were authored for
    god.group.position.copy(A.position);
    god.group.rotation.y = A.yaw;
    scene.add(god.group);
    god.setState({ ...S.state, ...(q.get('state') ? JSON.parse(q.get('state')) : {}) });
    if (q.get('glow4')) god.handles.eyeMaterial.emissiveIntensity *= 4; // as the desert scene does
    if (q.get('hide')) god.group.traverse((o) => { if (o.name === q.get('hide')) o.visible = false; }); // debug: hide a named mesh
    god.group.updateMatrixWorld(true);
    const local = (x, y, z) => god.group.localToWorld(new THREE.Vector3(x, y, z));

    // camera: world preset, or a bearing round the statue's facing
    let pos, tgt;
    if (S.world) { // world preset: pos y is the eye height above the ground
      pos = new THREE.Vector3(...S.world.pos); pos.y += groundAt(pos.x, pos.z);
      tgt = new THREE.Vector3(...S.world.tgt);
      tgt.y = A.position.y + (tgt.y - A.position.y) * k; // aim at the same fraction of a taller god
    }
    else {
      const b = (S.bearing * Math.PI) / 180;
      pos = local(Math.sin(b) * S.dist * k, 0, Math.cos(b) * S.dist * k);
      pos.y = A.position.y + S.eye * k;
      tgt = local(...S.look.map((v) => v * k));
    }
    if (q.get('cam')) pos = vec(q.get('cam'));
    if (q.get('tgt')) tgt = vec(q.get('tgt'));
    camera.setFocalLength(+(q.get('mm') || (S.world ? S.mm / k : S.mm))); // the wide holds its spot and widens instead
    camera.position.copy(pos);
    camera.lookAt(tgt);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // the sun's shadow frustum: recentre it on the statue (or between screen and statue for the wide)
    const sun = handles.sun;
    if (S.golden) {
      // golden hour behind the god: the key swings round behind the statue and drops low and amber, the sky
      // and hemisphere fill fall away so the front reads as a dark shape against the anti-sun sky, edged in gold
      const back = A.position.clone().sub(pos).setY(0).normalize();
      const side = new THREE.Vector3(-back.z, 0, back.x).multiplyScalar(S.golden.side);
      const dir = back.add(side).normalize().setY(S.golden.elev).normalize();
      sun.position.copy(sun.target.position).addScaledVector(dir, 110);
      sun.color.set(S.golden.color); sun.intensity = S.golden.sun;
      scene.environmentIntensity = S.golden.env;
      scene.traverse((o) => { if (o.isHemisphereLight) o.intensity *= S.golden.hemi; });
    }
    const toSun = sun.position.clone().sub(sun.target.position);
    const c = S.shadow === 'wide' ? new THREE.Vector3(14, 0, -46) : A.position.clone().add(new THREE.Vector3(0, 8 * k, 0));
    sun.target.position.copy(c); sun.position.copy(c).add(toSun);
    sun.target.updateMatrixWorld();
    if (S.shadow !== 'wide') Object.assign(sun.shadow.camera, { left: -26 * k, right: 26 * k, top: 26 * k, bottom: -26 * k });
    sun.shadow.camera.updateProjectionMatrix();

    // rim: a cool light from behind the statue, opposite the camera, to part the head from the sky
    if (S.rim > 0) {
      const back = A.position.clone().sub(pos).setY(0).normalize();
      const rim = new THREE.DirectionalLight('#BFD6FF', S.rim);
      rim.position.copy(A.position).addScaledVector(back, 60 * k).add(new THREE.Vector3(0, 40 * k, 0));
      rim.target.position.copy(local(0, 20 * k, 0));
      scene.add(rim, rim.target);
    }
    await whenTexturesReady();
    const dist = pos.distanceTo(local(0, 16 * k, 0));
    const film0 = { ...look.film, ...(S.film || {}) };
    const film = post === 'base' ? { ...film0, ao: false, dof: false } : { ...film0, dof: S.world ? false : { focus: dist, aperture: 0.00025, maxblur: 0.003 } };
    const draw = () => renderFilm(renderer, scene, camera, film, W, H, 0);
    draw(); draw();
    window.__lookdevInfo = { shot, post, triangles: god.triangles, source: god.source, bake: god.scanBake ? { url: god.scanBake.url, hit: god.scanBake.hit } : null, height: +god.height.toFixed(2), camera: { pos: pos.toArray().map((v) => +v.toFixed(2)), tgt: tgt.toArray().map((v) => +v.toFixed(2)) } };
    window.__lookdev = 'done';
  } catch (e) {
    console.error(e);
    window.__lookdev = { error: String((e && e.stack) || e) };
  }
})();
