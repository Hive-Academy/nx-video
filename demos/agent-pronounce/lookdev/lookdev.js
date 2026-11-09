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
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
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
};
(async () => {
  try {
    const name = new URLSearchParams(location.search).get('scene') || 'office';
    const assets = await loadAssets();
    const { scene, camera, bloom, exposure } = await BUILDERS[name](assets);
    renderer.toneMappingExposure = exposure;
    await whenTexturesReady();
    const c = new EffectComposer(renderer);
    c.setSize(W, H);
    c.addPass(new RenderPass(scene, camera));
    if (bloom) c.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom.strength, bloom.radius, bloom.threshold));
    c.addPass(new OutputPass());
    c.render(); c.render();
    window.__lookdev = 'done';
  } catch (e) {
    console.error(e);
    window.__lookdev = { error: String(e && e.stack || e) };
  }
})();
