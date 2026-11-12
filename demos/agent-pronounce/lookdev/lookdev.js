import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadAssets } from '../src/assets.js';
import { W, H, initCraft, whenTexturesReady } from '../src/craft.js';
import { buildOfficeLook } from '../src/look-office.js';
import { buildDesertLook } from '../src/look-desert.js';
import { buildVortexLook } from '../src/look-vortex.js';
import { buildWorkspaceLook } from '../src/look-workspace.js';
import { renderFilm } from '../src/look-kit.js';
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
initCraft(renderer);
const BUILDERS = {
  office: (a) => buildOfficeLook(a, renderer, {}),
  'office-bolt': (a) => buildOfficeLook(a, renderer, { boltMode: true }),
  desert: (a) => buildDesertLook(a, renderer),
  vortex: (a) => buildVortexLook(a, renderer),
  'workspace-a': (a) => buildWorkspaceLook(a, renderer, { shot: 'a' }),
  'workspace-b': (a) => buildWorkspaceLook(a, renderer, { shot: 'b' }),
  'workspace-c': (a) => buildWorkspaceLook(a, renderer, { shot: 'c' }),
};
// Force the GPU to finish so the timing measures the frame, not the command submission.
const sync = (() => { const px = new Uint8Array(4); return () => { const gl = renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }; })();
(async () => {
  try {
    const name = new URLSearchParams(location.search).get('scene') || 'office';
    const assets = await loadAssets();
    const look = await BUILDERS[name](assets);
    const { scene, camera, bloom, exposure, film } = look;
    await whenTexturesReady();
    let draw;
    if (film) {
      // Opt-in film chain (src/look-kit.js): the look sets its own size, tone mapping and passes.
      const [fw, fh] = film.size || [1920, 1080];
      canvas.width = fw; canvas.height = fh;
      canvas.style.width = `${fw}px`; canvas.style.height = `${fh}px`;
      renderer.setSize(fw, fh, false);
      camera.aspect = fw / fh; camera.updateProjectionMatrix();
      draw = () => renderFilm(renderer, scene, camera, film, fw, fh, 0);
    } else {
      renderer.toneMappingExposure = exposure;
      const c = new EffectComposer(renderer);
      c.setSize(W, H);
      c.addPass(new RenderPass(scene, camera));
      if (bloom) c.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom.strength, bloom.radius, bloom.threshold));
      c.addPass(new OutputPass());
      draw = () => c.render();
    }
    draw(); draw(); sync();
    const N = 3, t0 = performance.now();
    for (let i = 0; i < N; i++) { draw(); sync(); }
    const ms = Math.round((performance.now() - t0) / N);
    window.__lookdevInfo = { ...(window.__lookdevInfo || {}), ms, size: [canvas.width, canvas.height], calls: renderer.info.render.calls, tris: renderer.info.render.triangles, gpu: renderer.getContext().getParameter(renderer.getContext().RENDERER) };
    window.__lookdev = 'done';
  } catch (e) {
    console.error(e);
    window.__lookdev = { error: String(e && e.stack || e) };
  }
})();
