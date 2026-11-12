// Desert v4 look-dev page: 1920x1080 stills of src/look-desert4.js.
//   desert4.html?shot=a|b|c|d[&post=base|preview][&time=N]
// post=base    : the current engine path (render + bloom + output), what scene.js does today.
// post=preview : a harness-only preview of the coming look kit (GTAO + bokeh DOF + bloom), so the
//                director sees the intended frame. It is not the kit and is not used by the film.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
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
    const { scene, camera, bloom, exposure, toneMapping } = look;
    renderer.toneMappingExposure = exposure;
    if (toneMapping) renderer.toneMapping = toneMapping;
    await whenTexturesReady();
    const c = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
    c.setSize(W, H);
    c.addPass(new RenderPass(scene, camera));
    if (post === 'preview' && look.post?.ao) {
      const ao = new GTAOPass(scene, camera, W, H);
      ao.updateGtaoMaterial({ radius: look.post.ao.radius, distanceExponent: 1.6, thickness: look.post.ao.thickness ?? 1, scale: 1, samples: 12 });
      ao.blendIntensity = look.post.ao.intensity;
      c.addPass(ao);
    }
    if (post === 'preview' && look.post?.dof) {
      const d = look.post.dof;
      c.addPass(new BokehPass(scene, camera, { focus: d.focus, aperture: d.aperture, maxblur: d.maxblur }));
    }
    if (bloom) c.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom.strength, bloom.radius, bloom.threshold));
    c.addPass(new OutputPass());
    c.render(); c.render();
    const gl = renderer.getContext();
    const px = new Uint8Array(4);
    const N = +(q.get('time') || 0);
    let ms = null;
    if (N > 0) {
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const t0 = performance.now(); // harness timing only; scene code never reads the clock
      for (let i = 0; i < N; i++) { c.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
      ms = +((performance.now() - t0) / N).toFixed(1);
    }
    c.render();
    window.__lookdevInfo = { shot, post, msPerFrame: ms, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, ...(look.info || {}) };
    window.__lookdev = 'done';
  } catch (e) {
    console.error(e);
    window.__lookdev = { error: String((e && e.stack) || e) };
  }
})();
