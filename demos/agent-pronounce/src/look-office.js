import * as THREE from 'three';
import { hash } from './util.js';
import { V, W, H, glb, tex, fit, shadows, recolor, robot, canvas2d, canvasTex, bolt, roomEnvironment } from './craft.js';
function duskCity(detailed = false) {
  const [c, g] = canvas2d(2048, 1024);
  const grad = g.createLinearGradient(0, 0, 0, 1024);
  [[0, '#141A36'], [0.42, '#2E3566'], [0.66, '#73587A'], [0.78, '#D9845A'], [0.84, '#F2A86A'], [1, '#2A2133']].forEach(([s, col]) => grad.addColorStop(s, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 2048, 1024);
  for (let layer = 0; layer < 3; layer++) {
    let x = -40;
    const base = 900 - layer * 18;
    while (x < 2090) {
      const w = 50 + hash(7, layer, 'w', x) * (150 - layer * 30);
      const h = 80 + hash(7, layer, 'h', x) * (380 - layer * 90);
      g.fillStyle = ['#1E1A30', '#2A2440', '#3A3254'][layer];
      g.fillRect(x, base - h, w, h + 200);
      if (layer === 0 || detailed) {
        for (let i = 6; i < w - 8; i += 16) for (let j = 10; j < h - 10; j += 22) {
          const r = hash(7, 'lit', x, i, j);
          if (r < (detailed ? 0.58 : 0.22)) { g.fillStyle = r < 0.27 ? '#FFC98A' : r < 0.45 ? '#A9C2F0' : '#FFE3B1'; g.fillRect(x + i, base - h + j, 8, 11); }
        }
        if (hash(7, 'beacon', x) < 0.25) { g.fillStyle = '#FF4A3D'; g.beginPath(); g.arc(x + w / 2, base - h - 6, 5, 0, 7); g.fill(); }
      }
      x += w + 4 + hash(7, layer, 'gap', x) * 30;
    }
  }
  return canvasTex(c);
}
function cityDetailLayer(layer) {
  const [canvas, g] = canvas2d(2048, 1024);
  const base = [850, 900, 940][layer];
  const ink = ['#303049', '#27243D', '#191D31'][layer];
  let x = -30;
  let index = 0;
  while (x < 2090) {
    const w = 65 + Math.floor(hash('city-width', layer, index) * 95);
    const height = 135 + Math.floor(hash('city-height', layer, index) * (310 - layer * 50));
    const y = base - height;
    g.fillStyle = ink;
    g.fillRect(x, y, w, height + 130);
    // Stepped rooflines, parapets and a few aerials make each silhouette distinct.
    if (hash('city-roof', layer, index) > 0.45) {
      g.fillRect(x + w * 0.1, y - 12, w * 0.55, 13);
      g.fillRect(x + w * 0.63, y - 7, w * 0.25, 8);
    }
    if (hash('city-aerial', layer, index) > 0.73) g.fillRect(x + w * 0.5, y - 27, 3, 27);
    for (let wx = 9; wx < w - 8; wx += 14) for (let wy = 14; wy < height - 8; wy += 19) {
      const r = hash('city-window', layer, index, wx, wy);
      if (r < 0.64) continue;
      g.fillStyle = r < 0.78 ? '#E6B982' : r < 0.9 ? '#A9BBD8' : '#F4D7A6';
      g.globalAlpha = 0.45 + 0.45 * hash('city-luminance', layer, index, wx, wy);
      g.fillRect(x + wx, y + wy, 5 + Math.floor(r * 2), 8);
    }
    g.globalAlpha = 1;
    x += w + 3 + Math.floor(hash('city-gap', layer, index) * 13);
    index++;
  }
  if (layer < 2) {
    const haze = g.createLinearGradient(0, 650, 0, 970);
    haze.addColorStop(0, 'rgba(171,142,171,0)');
    haze.addColorStop(0.7, 'rgba(171,142,171,0.08)');
    haze.addColorStop(1, 'rgba(218,151,127,0.24)');
    g.fillStyle = haze; g.fillRect(0, 650, 2048, 320);
  }
  return canvasTex(canvas);
}
function landingScreen(assets) {
  // The Ptah landing page: the lightning-over-the-temple hero with its headline.
  const [c, g] = canvas2d(1024, 640);
  g.fillStyle = '#0B0A12';
  g.fillRect(0, 0, 1024, 640);
  if (assets.temple) g.drawImage(assets.temple, 0, 40, 1024, 600);
  const shade = g.createLinearGradient(0, 0, 0, 640);
  shade.addColorStop(0, 'rgba(8,8,16,0.85)'); shade.addColorStop(0.45, 'rgba(8,8,16,0.1)'); shade.addColorStop(1, 'rgba(8,8,16,0.6)');
  g.fillStyle = shade; g.fillRect(0, 0, 1024, 640);
  g.fillStyle = '#16141F'; g.fillRect(0, 0, 1024, 40);
  g.fillStyle = '#E8A33D'; g.font = 'bold 22px sans-serif'; g.fillText('PTAH', 28, 28);
  g.fillStyle = '#F4EBDD'; g.font = 'bold 64px Georgia, serif'; g.textAlign = 'center';
  g.fillText('PTAH', 512, 170);
  g.font = '28px sans-serif'; g.fillStyle = '#D9CFC0';
  g.fillText('The builder for your agents', 512, 215);
  g.fillStyle = '#E8A33D'; g.fillRect(412, 560, 200, 46);
  g.fillStyle = '#1A1208'; g.font = 'bold 22px sans-serif'; g.fillText('Download', 512, 591);
  return canvasTex(c);
}

export async function buildOfficeLook(assets, renderer, { boltMode = false } = {}) {
  const scene = new THREE.Scene();
  scene.environment = roomEnvironment();
  scene.environmentIntensity = 0.35;
  scene.background = new THREE.Color('#141A2C');
  renderer.toneMappingExposure = 1.0;
  const K = 2.04; // Kenney kit scale: robot (0.79 tall) sits on a 0.42 seat
  const [sofa, table, laptop, plant, plantS, lamp, rug, shelf] = await Promise.all(
    ['sofa', 'coffee-table', 'laptop', 'potted-plant', 'plant-small', 'lamp-floor', 'rug', 'bookcase'].map((n) => glb(`office/${n}.glb`)));
  const fabric = { color: '#2F3B52', roughness: 0.92 };
  const walnut = { color: '#5A3B27', roughness: 0.55 };
  const brushed = { color: '#B9B4AA', roughness: 0.35, metalness: 0.8 };

  // room shell: walnut floor, plaster side wall, floor-to-ceiling glass to the dusk city
  const floorTex = tex('textures/aerial_sand/aerial_sand_rough_1k.jpg', { srgb: false, repeat: 6 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshStandardMaterial({ color: '#6B4C36', roughness: 0.48, roughnessMap: floorTex, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: '#CFC6B8', roughness: 0.9 });
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), wallMat);
  sideWall.position.set(-3.1, 1.7, 0);
  sideWall.rotation.y = Math.PI / 2;
  sideWall.receiveShadow = true;
  scene.add(sideWall);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ color: '#1D2854' }));
  ceil.position.y = 3.3; ceil.rotation.x = Math.PI / 2;
  scene.add(ceil);
  const cityOriginalMap = duskCity();
  const cityDetailedMap = duskCity(true);
  const city = new THREE.Mesh(new THREE.PlaneGeometry(26, 13), new THREE.MeshBasicMaterial({ map: cityOriginalMap, toneMapped: true }));
  city.position.set(0, 2.2, -11);
  scene.add(city);
  const cityLayers = [0, 1, 2, 1, 2].map((layer, i) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(26, 13), new THREE.MeshBasicMaterial({ map: cityDetailLayer(layer), transparent: true, opacity: 1, depthWrite: false, toneMapped: true }));
    mesh.position.set(i < 3 ? 0 : -0.2, i < 3 ? 4.15 : 3.7, -10.65 + i * 0.32);
    mesh.renderOrder = i + 1;
    scene.add(mesh);
    return mesh;
  });
  const cityBeacons = Array.from({ length: 18 }, (_, i) => {
    const beacon = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.055), new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? '#FF7A67' : '#FFE6B5', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    beacon.position.set(-11.5 + 23 * hash('beacon-x', i), 2.1 + 2.5 * hash('beacon-y', i), -9.45);
    scene.add(beacon);
    return beacon;
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#15171D', roughness: 0.4, metalness: 0.6 });
  const zWin = -2.5;
  for (let i = -3; i <= 3; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.3, 0.08), frameMat);
    m.position.set(i * 1.05, 1.65, zWin);
    scene.add(m);
  }
  for (const y of [0.05, 3.25]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.12), frameMat);
    m.position.set(0, y, zWin);
    scene.add(m);
  }
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.3), new THREE.MeshPhysicalMaterial({ color: '#9FB3D9', roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.08, envMapIntensity: 1.5 }));
  glass.position.set(0, 1.65, zWin + 0.01);
  scene.add(glass);

  // furniture (Kenney Furniture Kit, CC0), recoloured to one palette
  const sofaG = shadows(fit(recolor(sofa, { carpet: fabric, wood: walnut }), { s: K, at: [0, 0, -1.55], yaw: Math.PI }));
  scene.add(sofaG);
  scene.add(shadows(fit(recolor(rug, { carpet: { color: '#9C5440', roughness: 1 }, carpetDarker: { color: '#5E3428', roughness: 1 } }), { s: K, at: [0, 0, -0.35] }), false, true));
  const tableG = shadows(fit(recolor(table, { metal: brushed, glass: { color: '#C9DCE0', roughness: 0.05, opacity: 0.35 } }), { s: K, at: [0, 0, -0.5] }));
  scene.add(tableG);
  const tableTop = tableG.userData.size.y;
  const lapG = shadows(fit(recolor(laptop, { metal: brushed, metalMedium: { color: '#6E6A66', metalness: 0.7, roughness: 0.4 }, metalDark: { color: '#25272C', roughness: 0.5 } }), { s: K * 0.85, at: [0.1, tableTop, -0.48], yaw: Math.PI + 0.2 }));
  scene.add(lapG);
  scene.add(shadows(fit(recolor(lamp, { metal: { color: '#2A2A2E', metalness: 0.7, roughness: 0.35 }, lamp: { color: '#D3B897', emissive: '#C98048', ei: 0.35 } }), { s: K, at: [1.55, 0, -1.75] })));
  scene.add(shadows(fit(recolor(plant, { wood: { color: '#C7C0B4', roughness: 0.7 }, woodDark: { color: '#3B2E26' }, plant: { color: '#3F7F4E', roughness: 0.8 } }), { s: K, at: [-1.6, 0, -1.9] })));
  scene.add(shadows(fit(recolor(shelf, { wood: walnut }), { s: K, at: [-2.75, 0, -0.6], yaw: Math.PI / 2 })));
  scene.add(shadows(fit(recolor(plantS, { wood: { color: '#C7C0B4' }, plant: { color: '#4E8F5A' } }), { s: K, at: [-0.3, tableTop, -0.35] })));

  // the laptop lid shows the Ptah landing page (temple under lightning)
  const lb = new THREE.Box3().setFromObject(lapG);
  const ls = lb.getSize(new THREE.Vector3());
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(ls.x * 0.8, ls.x * 0.8 * 0.6), new THREE.MeshBasicMaterial({ map: landingScreen(assets), toneMapped: false, color: '#CFCFCF' }));
  const lc = lb.getCenter(new THREE.Vector3());
  lapG.updateMatrixWorld(true);
  const probeFrom = V(0.1, 1.32, 2.95); // the office camera (cam, below)
  const probeTo = V(lc.x, lb.min.y + ls.y * 0.66, lc.z);
  const hit = new THREE.Raycaster(probeFrom, probeTo.clone().sub(probeFrom).normalize()).intersectObject(lapG, true)[0];
  if (hit) {
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (n.dot(probeFrom.clone().sub(hit.point)) < 0) n.negate();
    screen.position.copy(hit.point).addScaledVector(n, 0.006);
    screen.lookAt(hit.point.clone().add(n));
  }
  scene.add(screen);

  // cast: Codex (left) and Claude (right) on the sofa, turned toward each other and the laptop
  const seat = sofaG.userData.size.y * 0.47;
  const cam = V(0.1, 1.32, 2.95);
  const lapPos = screen.position.clone();
  const codexAt = V(-0.43, seat, -1.45), claudeAt = V(0.45, seat, -1.42);
  const mid = (a, b, k) => a.clone().lerp(b, k);
  const surprise = boltMode ? { eyeSX: 1.35, eyeSY: 1.35, pitch: -0.12 } : {};
  const codex = robot(assets, 'Codex', codexAt, mid(cam, claudeAt, 0.35), { pose: { headYaw: boltMode ? 0.3 : 0.25, nod: boltMode ? 0.25 : -0.05, ...surprise } });
  const claude = robot(assets, 'Claude', claudeAt, mid(cam, codexAt, 0.4), { pose: { headYaw: -0.15, nod: boltMode ? 0.3 : -0.12, ...surprise } });
  scene.add(codex.root, claude.root);

  // light: warm lamp key, cool window rim, the laptop's blue spill
  const hemisphere = new THREE.HemisphereLight('#7884B8', '#3A2A22', 0.35);
  scene.add(hemisphere);
  const key = new THREE.SpotLight('#FFD3A1', 26, 9, 0.75, 0.6, 1.6);
  key.position.set(2.2, 2.6, 1.6);
  key.target.position.set(0, 0.7, -1.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#8CA2FF', 1.1);
  rim.position.set(-1.5, 2.4, -6);
  scene.add(rim);
  const dusk = new THREE.DirectionalLight('#FF9A62', 0.7);
  dusk.position.set(3, 1.0, -6);
  scene.add(dusk);
  const lampGlow = new THREE.PointLight('#FFB86B', 3.2, 4, 1.8);
  lampGlow.position.set(1.55, 1.6, -1.75);
  scene.add(lampGlow);
  const spill = new THREE.PointLight('#8FB8FF', boltMode ? 4 : 0.7, 2.2, 1.8);
  spill.position.copy(lapPos).add(V(0, 0.1, 0.3));
  scene.add(spill);

  const bolts = [];
  let flash = null;
  let bloom = { strength: 0.22, radius: 0.5, threshold: 0.95 };
  if (boltMode) {
    // the bolt leaves the laptop, forks across the room and hits the ceiling
    const a = lapPos.clone().add(V(0, 0.08, 0.02));
    const main = bolt(a, V(-0.6, 3.28, -1.1), 61, { glow: 0.06 });
    const fork = bolt(main.userData.points[22], V(1.4, 3.28, -1.9), 62, { depth: 5, core: 0.008, glow: 0.04 });
    scene.add(main, fork);
    bolts.push(main, fork);
    flash = new THREE.PointLight('#A8CCFF', 6, 6, 1.6);
    flash.position.set(-0.3, 2.6, -1.0);
    scene.add(flash);
    key.intensity *= 0.35; lampGlow.intensity = 0.8; spill.intensity = 2.2; // the room dips as the bolt fires
    bloom = { strength: 0.6, radius: 0.5, threshold: 0.93 };
  }

  const camera = new THREE.PerspectiveCamera(boltMode ? 46 : 40, W / H, 0.05, 60);
  camera.position.copy(boltMode ? V(0.25, 1.15, 2.9) : cam);
  camera.lookAt(boltMode ? V(0, 1.35, -1.2) : V(0, 0.7, -1.2));
  return { scene, camera, bloom, exposure: 1.0, handles: { sofa: sofaG, table: tableG, laptop: lapG, laptopScreen: screen, codex, claude, bolts, hemisphere, key, rim, dusk, lampGlow, spill, flash, city, cityOriginalMap, cityDetailedMap, cityLayers, cityBeacons, ceiling: ceil, floor } };
}

