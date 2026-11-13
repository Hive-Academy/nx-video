// Desert v4 look-dev page: 1920x1080 stills of src/look-desert4.js.
//   desert4.html?shot=a|b|c|d|e[&post=base|preview][&time=N]
// post=base    : the look kit film chain without AO and DOF (fast iteration).
// post=preview : the full look kit film chain (AO + DOF + bloom + grade), the final stills.
import * as THREE from 'three';
import { renderFilm } from '../src/look-kit.js';
import { loadAssets } from '../src/assets.js';
import { initCraft, whenTexturesReady } from '../src/craft.js';
import { buildDesert4Look } from '../src/look-desert4.js';

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
    const assets = await loadAssets();
    const look = await buildDesert4Look(assets, renderer, { shot, aspect: W / H });
    const { scene, camera } = look;
    await whenTexturesReady();
    // the look kit's film chain; post=base drops the two costly passes (AO, DOF) for fast iteration
    const film = post === 'base' ? { ...look.film, ao: false, dof: false } : look.film;
    const draw = () => renderFilm(renderer, scene, camera, film, W, H, 0);
    draw(); draw();
    const gl = renderer.getContext();
    const px = new Uint8Array(4);
    const N = +(q.get('time') || 0);
    let ms = null;
    if (N > 0) {
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const t0 = performance.now(); // harness timing only; scene code never reads the clock
      for (let i = 0; i < N; i++) { draw(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
      ms = +((performance.now() - t0) / N).toFixed(1);
    }
    // scene cost: one plain beauty render (shadow maps included), counted on its own
    renderer.info.reset();
    renderer.info.autoReset = false;
    renderer.render(scene, camera);
    const cost = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    renderer.info.autoReset = true;
    draw();
    window.__lookdevInfo = { shot, post, msPerFrame: ms, ...cost, ...(look.info || {}) };
    window.__lookdev = 'done';
  } catch (e) {
    console.error(e);
    window.__lookdev = { error: String((e && e.stack) || e) };
  }
})();
