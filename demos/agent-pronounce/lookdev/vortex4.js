// Vortex v4 look-dev page: 1920x1080 stills of src/look-vortex4.js.
//   vortex4.html?shot=a|b|c|d[&t=seconds][&post=base|preview]
// post=base    : the look kit film chain without AO and DOF (fast iteration).
// post=preview : the full film chain (AO + DOF + bloom + grade), the final stills.
import * as THREE from 'three';
import { renderFilm } from '../src/look-kit.js';
import { loadAssets } from '../src/assets.js';
import { initCraft, whenTexturesReady } from '../src/craft.js';
import { buildVortex4Look } from '../src/look-vortex4.js';

const W = 1920, H = 1080;
const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
initCraft(renderer);

(async () => {
  try {
    const shot = q.get('shot') || 'b';
    const post = q.get('post') || 'preview';
    const t = q.has('t') ? +q.get('t') : null;
    const assets = await loadAssets();
    const look = await buildVortex4Look(assets, renderer, { shot, t });
    const { scene, camera } = look;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    await whenTexturesReady();
    const film = post === 'base' ? { ...look.film, ao: false, dof: false } : look.film;
    const draw = () => renderFilm(renderer, scene, camera, film, W, H, 0);
    draw(); draw();
    renderer.info.reset();
    renderer.info.autoReset = false;
    renderer.render(scene, camera);
    const cost = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    renderer.info.autoReset = true;
    draw();
    window.__lookdevInfo = { post, ...cost, ...(look.info || {}) };
    window.__lookdev = 'done';
  } catch (e) {
    console.error(e);
    window.__lookdev = { error: String((e && e.stack) || e) };
  }
})();
