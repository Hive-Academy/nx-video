// 1920x1080 look-dev page for the Ptah colossus: ?shot=colossus-a|colossus-b|colossus-c[&quality=draft]
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadAssets } from '../src/assets.js';
import { initCraft, whenTexturesReady } from '../src/craft.js';
import { buildColossusLook } from '../src/look-colossus.js';

const W = 1920, H = 1080;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
initCraft(renderer);
(async () => {
  try {
    const q = new URLSearchParams(location.search);
    const shot = q.get('shot') || 'colossus-a';
    const assets = await loadAssets();
    const { scene, camera, bloom, exposure, info } = await buildColossusLook(assets, renderer, shot, { quality: q.get('quality') || 'high' });
    renderer.toneMappingExposure = exposure;
    await whenTexturesReady();
    const c = new EffectComposer(renderer);
    c.setSize(W, H);
    c.addPass(new RenderPass(scene, camera));
    if (bloom) c.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom.strength, bloom.radius, bloom.threshold));
    c.addPass(new OutputPass());
    c.render(); c.render();
    window.__lookdevInfo = info;
    window.__lookdev = 'done';
  } catch (e) {
    console.error(e);
    window.__lookdev = { error: String((e && e.stack) || e) };
  }
})();
