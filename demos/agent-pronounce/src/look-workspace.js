// Episode 6 v4 opening: the evening workspace. Two robot developers in swivel chairs at two close
// walnut desks, one big hero screen between and in front of them showing Ptah. Static look only
// (the animation is a set-*.js job); renders through the look kit's film chain (`film` field).
//
// Units are world units at robot scale: furniture is real-world size x K (0.63), so a 0.79-tall
// robot reads as a developer at a desk. Axes: the screen wall is at -z, the window wall at +z.
// Codex sits at +x and Claude at -x, so the main dialogue angle (b, from the screen side) shows
// Codex on the left and Claude on the right.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { assetUrl } from './assets.js';
import { V, glb, tex, hdri, fit, shadows, robot, canvas2d, canvasTex, whenTexturesReady } from './craft.js';
import { environment, reshadeRobot, screenLight, practical, contactShadow, roomProbe, loungeChair } from './look-kit.js';
import { hash } from './util.js';

export const K = 0.63;
const M = (id) => glb(`workspace/${id}/${id}_1k.gltf`);
const TX = (id, res = '1k') => ({
  map: tex(`textures/workspace/${id}_diff_${res}.jpg`),
  normalMap: tex(`textures/workspace/${id}_nor_gl_${res}.jpg`, { srgb: false }),
  roughnessMap: tex(`textures/workspace/${id}_rough_${res}.jpg`, { srgb: false }),
});
const rep = (t, x, y) => { for (const k of ['map', 'normalMap', 'roughnessMap']) t[k].repeat.set(x, y); return t; };

// Layout (world units)
export const LAYOUT = {
  room: { x: 2.15, zFront: -1.02, zBack: 2.35, ceil: 1.78 },
  desk: { w: 1.06, d: 0.56, top: 0.47, at: 0.62, z: 0.06, yaw: 0.14 },
  seat: { x: 0.62, z: 0.68 },
  screen: { w: 2.04, h: 2.04 / (1920 / 904), at: [0, 0.99, -0.9] },
};

// The three stills. focal in mm (full-frame 36 mm gauge); focus in metres from the camera.
export const SHOTS = {
  // over the shoulder, high and back: chair backs and shells frame the hero screen; focus on the screen
  a: { pos: [0, 1.3, 2.2], target: [0, 0.9, -0.9], focal: 28, subject: [0, 0.99, -0.9], aperture: 0.0025, maxblur: 0.006, pose: 'work' },
  // two-shot from behind-left at seated eye level: both robots turned to each other, three-quarter faces,
  // the hero screen between them behind
  b: { pos: [-0.32, 0.98, 2.24], target: [0.04, 0.72, 0.0], focal: 24, subject: [0, 0.64, 0.72], aperture: 0.005, maxblur: 0.007, pose: 'talk' },
  // MCU of Codex turned toward Claude (off frame left), the screen soft behind
  c: { pos: [0.02, 0.8, 1.56], target: [0.68, 0.62, 0.6], focal: 42, subject: [0.62, 0.64, 0.72], aperture: 0.012, maxblur: 0.012, pose: 'talk' },
};
export const ROBOT_SCALE = 0.25; // seated figure ~0.85 world (~1.35 m real) to the top of the head; desk 0.47 (0.74 m)

function blueprintTexture() {
  const [c, g] = canvas2d(1024, 1400);
  g.fillStyle = '#163A6B'; g.fillRect(0, 0, 1024, 1400);
  g.strokeStyle = 'rgba(200,225,255,0.10)'; g.lineWidth = 1;
  for (let x = 0; x <= 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1400); g.stroke(); }
  for (let y = 0; y <= 1400; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  g.strokeStyle = 'rgba(232,242,255,0.9)'; g.lineWidth = 3;
  g.strokeRect(40, 40, 944, 1320);
  // elevation: a stepped pyramid, courses drawn
  const base = 760, apex = 210, cx = 512, half = 380;
  g.beginPath(); g.moveTo(cx - half, base); g.lineTo(cx, apex); g.lineTo(cx + half, base); g.closePath(); g.stroke();
  g.lineWidth = 1.5;
  for (let i = 1; i < 12; i++) {
    const y = base - (base - apex) * (i / 12), w = half * (1 - i / 12);
    g.beginPath(); g.moveTo(cx - w, y); g.lineTo(cx + w, y); g.stroke();
  }
  g.setLineDash([10, 8]); g.beginPath(); g.moveTo(cx, apex - 40); g.lineTo(cx, base + 40); g.stroke(); g.setLineDash([]);
  // plan view: square, diagonals, inner chambers
  const py = 1080, ps = 230;
  g.lineWidth = 2.5; g.strokeRect(cx - ps, py - ps * 0.9, ps * 2, ps * 1.8);
  g.beginPath(); g.moveTo(cx - ps, py - ps * 0.9); g.lineTo(cx + ps, py + ps * 0.9); g.moveTo(cx + ps, py - ps * 0.9); g.lineTo(cx - ps, py + ps * 0.9); g.stroke();
  g.strokeRect(cx - 50, py - 40, 100, 80);
  // dimension lines and tick annotations (no text)
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(cx - half, base + 70); g.lineTo(cx + half, base + 70); g.stroke();
  for (const x of [cx - half, cx + half]) { g.beginPath(); g.moveTo(x, base + 55); g.lineTo(x, base + 85); g.stroke(); }
  for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(232,242,255,0.7)'; g.fillRect(80, 1240 + i * 10, 60 + 160 * hash('bp', i), 3); }
  g.beginPath(); g.arc(880, 150, 46, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(880, 96); g.lineTo(880, 204); g.moveTo(826, 150); g.lineTo(934, 150); g.stroke();
  return canvasTex(c);
}

function keyboard(color = '#1C1D21') {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.29, 0.012, 0.1, 2, 0.004), new THREE.MeshStandardMaterial({ color: '#2A2C31', metalness: 0.7, roughness: 0.35 }));
  base.position.y = 0.006; g.add(base);
  const keyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const keys = new THREE.InstancedMesh(new RoundedBoxGeometry(0.0165, 0.006, 0.0165, 1, 0.002), keyMat, 15 * 4 + 1);
  const m4 = new THREE.Matrix4(); let i = 0;
  for (let r = 0; r < 4; r++) for (let k = 0; k < 15; k++) { m4.makeTranslation(-0.133 + k * 0.019, 0.014, -0.032 + r * 0.019 + (r === 3 ? 0 : 0)); keys.setMatrixAt(i++, m4); }
  m4.makeScale(7, 1, 1).setPosition(0, 0.014, 0.044); keys.setMatrixAt(i++, m4);
  g.add(keys);
  return shadows(g);
}
function mug(color) {
  const pts = [V(0, 0, 0), V(0.028, 0, 0), V(0.03, 0.002, 0), V(0.031, 0.07, 0), V(0.028, 0.07, 0), V(0.027, 0.006, 0), V(0, 0.006, 0)].map((p) => new THREE.Vector2(p.x, p.y));
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mat));
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 10, 24, Math.PI * 1.2), mat);
  h.position.set(0.032, 0.036, 0); h.rotation.z = -Math.PI * 0.6; g.add(h);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.027, 32), new THREE.MeshStandardMaterial({ color: '#2A160C', roughness: 0.15 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.058; g.add(coffee);
  return shadows(g);
}

function desk(walnut, steel) {
  const { w, d, top } = LAYOUT.desk;
  const g = new THREE.Group();
  const t = new THREE.Mesh(new RoundedBoxGeometry(w, 0.032, d, 3, 0.008), walnut);
  t.position.y = top - 0.016; g.add(t);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, top - 0.032, 0.03), steel);
    post.position.y = (top - 0.032) / 2;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, d * 0.92), steel); foot.position.y = 0.01;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, d * 0.92), steel); rail.position.y = top - 0.042;
    leg.add(post, foot, rail);
    leg.position.x = sx * (w / 2 - 0.06);
    g.add(leg);
  }
  const panel = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.16, 0.012), steel);
  panel.position.set(0, top - 0.12, -d / 2 + 0.05); g.add(panel);
  return shadows(g);
}

export async function buildWorkspaceLook(assets, renderer, { shot = 'b' } = {}) {
  const S = SHOTS[shot] || SHOTS.b;
  const L = LAYOUT;
  const scene = new THREE.Scene();
  scene.userData.noDepth = [];
  const [night, city] = await Promise.all([hdri('hdri/unfinished_office_night_1k.hdr'), hdri('hdri/shanghai_bund_2k.hdr')]);
  environment(renderer, scene, night.tex, { intensity: 0.62, rotation: 0.6, background: true, backgroundTex: city.tex, backgroundIntensity: 0.3 });
  scene.backgroundRotation = new THREE.Euler(0, 4.05, 0);

  // ---------------------------------------------------------------- room shell
  const R = L.room;
  const W2 = R.x * 2, D = R.zBack - R.zFront;
  const parquet = new THREE.MeshStandardMaterial({ ...rep(TX('herringbone_parquet', '2k'), W2 / 1.26, D / 1.26), roughness: 1, envMapIntensity: 0.25 });
  parquet.color.set('#C8B6A2');
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W2, D), parquet);
  floor.rotation.x = -Math.PI / 2; floor.position.z = (R.zFront + R.zBack) / 2; floor.receiveShadow = true;
  scene.add(floor);
  const plaster = (rx, ry, tint) => { const m = new THREE.MeshStandardMaterial({ ...rep(TX('plastered_wall_04'), rx, ry), envMapIntensity: 0.4 }); m.color.set(tint); return m; };
  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(D, R.ceil), plaster(D / 1.2, R.ceil / 1.2, '#8C8580'));
  sideL.rotation.y = Math.PI / 2; sideL.position.set(-R.x, R.ceil / 2, floor.position.z);
  const sideR = sideL.clone(); sideR.rotation.y = -Math.PI / 2; sideR.position.x = R.x;
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W2, D), new THREE.MeshStandardMaterial({ color: '#2B2928', roughness: 0.9 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, R.ceil, floor.position.z);
  scene.add(sideL, sideR, ceil);
  for (const m of [sideL, sideR, ceil]) m.receiveShadow = true;

  // back wall (+z) with a wide window onto the city at night
  const win = { x0: -1.45, x1: 0.75, y0: 0.38, y1: 1.62 };
  const backMat = plaster(W2 / 1.2, R.ceil / 1.2, '#8A837D');
  const backWall = new THREE.Group();
  const piece = (x0, x1, y0, y1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), backMat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); m.receiveShadow = true; backWall.add(m);
  };
  piece(-R.x, win.x0, 0, R.ceil); piece(win.x1, R.x, 0, R.ceil); piece(win.x0, win.x1, 0, win.y0); piece(win.x0, win.x1, win.y1, R.ceil);
  backWall.rotation.y = Math.PI; backWall.position.z = R.zBack;
  scene.add(backWall);
  const frameMat = new THREE.MeshStandardMaterial({ color: '#17181B', metalness: 0.6, roughness: 0.4 });
  const mull = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), frameMat); m.position.set(x, y, R.zBack - 0.01); scene.add(m); };
  mull(win.x1 - win.x0 + 0.04, 0.035, (win.x0 + win.x1) / 2, win.y0); mull(win.x1 - win.x0 + 0.04, 0.035, (win.x0 + win.x1) / 2, win.y1);
  for (let i = 0; i <= 3; i++) mull(0.03, win.y1 - win.y0, win.x0 + (win.x1 - win.x0) * (i / 3), (win.y0 + win.y1) / 2);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(win.x1 - win.x0, win.y1 - win.y0), new THREE.MeshPhysicalMaterial({ color: '#AFC3E0', roughness: 0.04, transparent: true, opacity: 0.1, envMapIntensity: 1.4, depthWrite: false }));
  glass.position.set((win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, R.zBack - 0.02); glass.rotation.y = Math.PI;
  scene.add(glass); scene.userData.noDepth.push(glass);
  const sill = new THREE.Mesh(new RoundedBoxGeometry(win.x1 - win.x0 + 0.1, 0.025, 0.12, 2, 0.006), new THREE.MeshStandardMaterial({ color: '#D8D2C8', roughness: 0.5 }));
  sill.position.set((win.x0 + win.x1) / 2, win.y0 - 0.0125, R.zBack - 0.05); scene.add(shadows(sill));

  // screen wall (-z): dark plaster with a walnut slat panel behind the hero screen
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W2, R.ceil), plaster(W2 / 1.2, R.ceil / 1.2, '#4A4644'));
  front.position.set(0, R.ceil / 2, R.zFront); front.receiveShadow = true; scene.add(front);
  const walnutTx = TX('american_walnut_veneer');
  const walnut = new THREE.MeshPhysicalMaterial({ ...walnutTx, color: '#C27A46', roughness: 1, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.45 });
  const slatTx = TX('american_walnut_veneer');
  for (const k of ['map', 'normalMap', 'roughnessMap']) { slatTx[k].repeat.set(0.05, 1.4); }
  const slatMat = new THREE.MeshStandardMaterial({ ...slatTx, roughness: 1, envMapIntensity: 0.25 });
  slatMat.color.set('#7A5A40');
  const slatW = 3.1, nSlats = 40;
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.036, R.ceil, 0.03), slatMat, nSlats);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < nSlats; i++) { m4.makeTranslation(-slatW / 2 + (i + 0.5) * (slatW / nSlats), R.ceil / 2, R.zFront + 0.03); slats.setMatrixAt(i, m4); }
  slats.castShadow = slats.receiveShadow = true; scene.add(slats);
  const slatBack = new THREE.Mesh(new THREE.PlaneGeometry(slatW, R.ceil), new THREE.MeshStandardMaterial({ color: '#141210', roughness: 0.9 }));
  slatBack.position.set(0, R.ceil / 2, R.zFront + 0.012); scene.add(slatBack);
  // warm cove strip along the top of the slat wall
  const cove = new THREE.Mesh(new THREE.BoxGeometry(slatW, 0.012, 0.02), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFB066').multiplyScalar(2.2) }));
  cove.position.set(0, R.ceil - 0.02, R.zFront + 0.07); scene.add(cove);

  // rug under the desks
  const rugTx = rep(TX('poly_wool_herringbone'), 2.4, 1.6);
  const rug = new THREE.Mesh(new RoundedBoxGeometry(2.7, 0.012, 1.75, 2, 0.005), new THREE.MeshStandardMaterial({ ...rugTx, roughness: 1, envMapIntensity: 0.3 }));
  rug.material.color.set('#7E7F86');
  rug.position.set(0, 0.006, 0.42); rug.receiveShadow = true; scene.add(rug);

  // ---------------------------------------------------------------- hero screen
  const sc = L.screen;
  const screenTex = await new THREE.TextureLoader().loadAsync(assetUrl('assets/live-demo/stills/landing-app.png'));
  screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 16;
  screenTex.generateMipmaps = true; screenTex.minFilter = THREE.LinearMipmapLinearFilter;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  screenMat.color.setScalar(1.55);
  const hero = new THREE.Group();
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(sc.w + 0.014, sc.h + 0.014, 0.022, 3, 0.005), new THREE.MeshPhysicalMaterial({ color: '#131417', metalness: 0.8, roughness: 0.3, clearcoat: 0.5 }));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(sc.w, sc.h), screenMat);
  panel.position.z = 0.0145;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(sc.w * 0.98, 0.006, 0.01), new THREE.MeshStandardMaterial({ color: '#C99A42', metalness: 1, roughness: 0.28 }));
  lip.position.set(0, -sc.h / 2 - 0.02, 0.01); // the warm gold accent: a brass lip under the screen
  hero.add(bezel, panel, lip);
  hero.position.set(...sc.at);
  scene.add(shadows(hero, true, false));
  panel.castShadow = false;
  const sl = screenLight(sc.w, sc.h, '#C2D6FF', 18);
  sl.position.set(sc.at[0], sc.at[1] + 0.16, sc.at[2] + 0.08); // forward of the sideboard: its near field would blow the top out sl.lookAt(0, sc.at[1] - 0.15, 2);
  scene.add(sl);
  // cool screen spill: reads on the screen-facing sides of the heads and on the desk tops
  const spill = new THREE.SpotLight('#9FC2FF', 3.2, 4.5, 0.75, 0.8, 1.6);
  spill.position.set(sc.at[0] + 0.5, sc.at[1] + 0.05, sc.at[2] + 0.15); spill.target.position.set(0, 0.8, 0.45);
  scene.add(spill, spill.target);
  // bias glow off the back of the screen onto the slats, and a cool spill down onto the sideboard top
  const back = screenLight(sc.w * 0.92, sc.h * 0.85, '#B4C8FF', 2.5);
  back.position.set(sc.at[0], sc.at[1], sc.at[2] - 0.02); back.lookAt(sc.at[0], sc.at[1], -10);
  scene.add(back);
  const sideSpill = practical('spot', { color: '#A8C0FF', intensity: 0.5, distance: 1.6, angle: 0.9, penumbra: 1, shadow: 0 });
  sideSpill.position.set(0, sc.at[1] - sc.h / 2 + 0.02, sc.at[2] + 0.12); sideSpill.target.position.set(0, 0, sc.at[2] + 0.55);
  scene.add(sideSpill, sideSpill.target);
  // the screen is a texture slot: the animation pass swaps in the masked tour clips
  const setScreenSource = (src) => {
    const t = src.isTexture ? src : (typeof HTMLVideoElement !== 'undefined' && src instanceof HTMLVideoElement) ? new THREE.VideoTexture(src) : new THREE.CanvasTexture(src);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    screenMat.map = t; screenMat.needsUpdate = true;
    return t;
  };

  // console under the screen
  const cab = fit(await M('modern_wooden_cabinet'), { w: 1.9, at: [0, 0, R.zFront + 0.27] });
  cab.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.roughness = Math.max(o.material.roughness, 0.7); o.material.envMapIntensity = 0.5; } });
  scene.add(shadows(cab));
  const vase = fit(await M('ceramic_vase_01'), { h: 0.16, at: [0.78, cab.userData.size.y, R.zFront + 0.25] });
  const books = fit(await M('book_encyclopedia_set_01'), { w: 0.3, at: [-0.72, cab.userData.size.y, R.zFront + 0.25], yaw: 0.1 });
  scene.add(shadows(vase), shadows(books));

  // the blueprint on the screen wall, right of the screen; a pendant globe over the desks
  const frame = fit(await M('hanging_picture_frame_01'), { h: 0.62, at: [-R.x + 0.035, 0.62, 1.05], yaw: Math.PI / 2 });
  const bp = blueprintTexture();
  frame.traverse((o) => { if (o.isMesh && /artwork/.test(o.material.name)) o.material = new THREE.MeshStandardMaterial({ map: bp, emissiveMap: bp, emissive: '#FFFFFF', emissiveIntensity: 0.22, roughness: 0.8 }); else if (o.isMesh && /glass/.test(o.material.name)) o.visible = false; });
  scene.add(shadows(frame));
  const frameWash = practical('spot', { color: '#FFB878', intensity: 2.4, distance: 2.6, angle: 0.42, penumbra: 1, shadow: 0 });
  frameWash.position.set(-1.2, R.ceil - 0.05, 1.05); frameWash.target.position.set(-R.x, 0.92, 1.05); scene.add(frameWash, frameWash.target);

  // ---------------------------------------------------------------- desks, chairs, robots
  const steel = new THREE.MeshStandardMaterial({ color: '#1A1B1E', metalness: 0.75, roughness: 0.42 });
  const lampSrc = await M('desk_lamp_arm_01');
  const pads = await M('office_notepads');
  const stationery = await M('stationery_supplies');
  const cat = await M('concrete_cat_statue');
  const plantSmall = await M('potted_plant_04');
  const robots = {};
  const lamps = [];
  for (const [name, side] of [['Codex', 1], ['Claude', -1]]) {
    const dk = desk(walnut, steel);
    dk.position.set(side * L.desk.at, 0, L.desk.z);
    dk.rotation.y = side * L.desk.yaw;
    scene.add(dk);
    const dc = contactShadow(scene, L.desk.w * 1.15, L.desk.d * 1.3, 0.35); dc.position.set(side * L.desk.at, 0.014, L.desk.z); dc.rotation.z = side * L.desk.yaw; scene.add(dc);
    const onDesk = (obj, x, z, yaw = 0) => { // desk-local placement
      const p = new THREE.Vector3(x, L.desk.top, z).applyAxisAngle(V(0, 1, 0), dk.rotation.y).add(dk.position);
      obj.position.copy(p); obj.rotation.y += dk.rotation.y + yaw; scene.add(obj); return obj;
    };
    onDesk(keyboard(), 0, 0.12, 0);
    const lamp = shadows(fit(lampSrc.clone(true), { h: side > 0 ? 0.32 : 0.42 }));
    const lx = side > 0 ? -0.42 : -0.44; // desk-local x: Codex inner back, Claude outer back
    lamp.traverse((o) => { if (o.isMesh && /light/.test(o.material.name)) { o.material = o.material.clone(); o.material.emissive = new THREE.Color('#FFC27A'); o.material.emissiveIntensity = 6; } });
    onDesk(lamp, lx, -0.22, side > 0 ? Math.PI * 0.25 : Math.PI * 0.25);
    const spot = practical('spot', { color: '#FFB46B', intensity: 1.15, distance: 2.2, angle: 0.75, penumbra: 0.9, shadow: 1024 });
    const lampHead = new THREE.Vector3(lx * 0.7, L.desk.top + 0.3, -0.08).applyAxisAngle(V(0, 1, 0), dk.rotation.y).add(dk.position);
    spot.position.copy(lampHead);
    spot.target.position.copy(dk.position).add(V(side * 0.05, L.desk.top, 0.05));
    scene.add(spot, spot.target);
    lamps.push(spot);
    onDesk(shadows(fit(pads.clone(true), { w: 0.18 })), side * 0.34, 0.1, side * 0.2);
    onDesk(mug(side > 0 ? '#E8E2D6' : '#2E3A46'), side * 0.38, -0.14);
    if (side > 0) {
      onDesk(shadows(fit(plantSmall.clone(true), { h: 0.17 })), 0.05, -0.2);
      onDesk(shadows(fit(stationery.clone(true), { w: 0.12 })), -0.16, -0.18, 0.3);
    } else {
      // Egyptian-builder motif: a small sandstone cat (Bastet) on Claude's desk
      const c = shadows(fit(cat.clone(true), { h: 0.15 }));
      c.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set('#E2B47C'); o.material.roughness = 0.85; } });
      onDesk(c, 0.1, -0.19, -0.5);
    }
    // chair: swivel shell chair, its back to the window
    const seatAt = V(side * L.seat.x, 0, L.seat.z + 0.1);
    // work: facing the screen; talk: swivelled toward each other and a little toward the window
    const look = S.pose === 'talk' ? V(-side * 0.5, 0, 1.6) : V(side * 0.25, 0, sc.at[2]);
    const ch = await loungeChair({ height: 1.17 * K, cushion: 0.06 });
    ch.position.copy(seatAt);
    ch.rotation.y = Math.atan2(-(look.x - seatAt.x), -(look.z - seatAt.z));
    scene.add(ch);
    const cc = contactShadow(scene, 0.7, 0.7, 0.5); cc.position.set(seatAt.x, 0.014, seatAt.z); scene.add(cc);
    // the robot sits back on the cushion (its ball against the chair back), body above the desk line
    const sink = V(look.x - seatAt.x, 0, look.z - seatAt.z).normalize().multiplyScalar(-0.03);
    const at = V(seatAt.x + sink.x, ch.userData.seatY, seatAt.z + sink.z);
    const pose = S.pose === 'talk' ? { pitch: -0.04, nod: 0.03, headYaw: 0 } : { pitch: -0.12, nod: -0.06, headYaw: 0 };
    const r = robot(assets, name, at, look, { pose, scale: ROBOT_SCALE });
    reshadeRobot(r, { faceLight: 0, shell: '#CCC3B5', env: 0.9, eyeBoost: 2.6, glass: 0.55, faceBoost: name === 'Claude' ? 1.25 : 1, smooth: Math.PI / 4 });
    scene.add(r.root);
    // animation handles: the set swivels the chair and re-seats the robot on it
    Object.assign(r, { chair: ch, seatAt, seatY: ch.userData.seatY, side });
    robots[name] = r;
  }

  // ---------------------------------------------------------------- back of the room
  const shelves = fit(await M('steel_frame_shelves_03'), { h: 1.45, at: [1.35, 0, R.zBack - 0.24], yaw: Math.PI });
  scene.add(shadows(shelves));
  const plantBig = fit(await M('pachira_aquatica_01'), { h: 1.2, at: [-1.78, 0, R.zBack - 0.35] });
  scene.add(shadows(plantBig));
  const plantFloor = fit(await M('potted_plant_02'), { h: 0.55, at: [1.85, 0, -0.55] });
  scene.add(shadows(plantFloor));
  const pendant = fit(await M('modern_ceiling_lamp_01'), { h: 0.26, at: [-1.25, R.ceil - 0.26, 0.95] });
  pendant.traverse((o) => { if (o.isMesh && /globe/.test(o.material.name)) { o.material = o.material.clone(); o.material.emissive = new THREE.Color('#FFC890'); o.material.emissiveIntensity = 3; } });
  scene.add(pendant);

  // ---------------------------------------------------------------- lights
  const bulb = practical('point', { color: '#FFC58A', intensity: 0.4, distance: 3.5, shadow: 512 });
  bulb.position.set(-1.25, R.ceil - 0.36, 0.95); scene.add(bulb);
  // city light through the window: cool key from behind the robots, gives the rim
  const moon = new THREE.DirectionalLight('#8EA6E8', 0.55);
  moon.position.set(-0.6, 2.4, 4.2); moon.target.position.set(0, 0.6, 0.4);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 0.5, far: 9 });
  moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.01;
  scene.add(moon, moon.target);
  const rim = practical('spot', { color: '#A9C2FF', intensity: 4, distance: 4, angle: 0.5, penumbra: 1, shadow: 0 });
  rim.position.set(0.2, 1.7, 2.1); rim.target.position.set(0, 0.78, 0.65); scene.add(rim, rim.target);
  // warm wash on the back-wall shelves (warm behind, cool in front)
  const wash = practical('spot', { color: '#FFB067', intensity: 2.2, distance: 3, angle: 0.6, penumbra: 1, shadow: 512 });
  wash.position.set(1.2, R.ceil - 0.05, 1.6); wash.target.position.set(1.35, 0.5, R.zBack); scene.add(wash, wash.target);
  const slatWash = practical('spot', { color: '#FFB067', intensity: 8, distance: 3, angle: 1.0, penumbra: 1, shadow: 0 });
  slatWash.position.set(0, R.ceil - 0.05, R.zFront + 0.45); slatWash.target.position.set(0, 0.2, R.zFront); scene.add(slatWash, slatWash.target);

  // warm soft key on the two robots (the room's practicals are warm): keeps the shells off-white ceramic
  const key = practical('spot', { color: '#FFD9B4', intensity: 9, distance: 3, angle: 0.62, penumbra: 1, shadow: 1024 });
  key.position.set(-0.35, R.ceil - 0.08, 1.45); key.target.position.set(0, 0.62, 0.7); scene.add(key, key.target);
  // soft bounce: a warm uplight scallop on Claude's side wall and a dim ceiling fill
  const up = practical('spot', { color: '#FFB878', intensity: 2.6, distance: 2.4, angle: 0.55, penumbra: 1, shadow: 0 });
  up.position.set(-R.x + 0.25, 0.06, 0.25); up.target.position.set(-R.x, 1.6, 0.25); scene.add(up, up.target);
  const ceilFill = practical('point', { color: '#D8C8B8', intensity: 0.35, distance: 3.2, shadow: 0 });
  ceilFill.position.set(-0.9, R.ceil - 0.25, 0.4); scene.add(ceilFill);

  // reflection probe of the finished room: the shells and desk tops mirror the real hero screen
  await whenTexturesReady();
  const probe = roomProbe(renderer, scene, { position: V(0, 0.82, 0.25), hide: Object.values(robots).map((r) => r.root) });
  for (const r of Object.values(robots)) for (const k of ['shell', 'feet', 'screen']) { r.mats[k].envMap = probe; r.mats[k].needsUpdate = true; }
  // night window glass mirrors the room: the bright hero screen reflects into the two-shot
  glass.material = new THREE.MeshStandardMaterial({ color: '#2E3A4E', metalness: 1, roughness: 0.05, envMap: probe, envMapIntensity: 0.6, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  walnut.envMap = probe; walnut.envMapIntensity = 0.5; walnut.clearcoat = 0.3; walnut.clearcoatRoughness = 0.22; walnut.needsUpdate = true;

  // ---------------------------------------------------------------- camera
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.03, 40);
  camera.setFocalLength(S.focal);
  camera.position.set(...S.pos);
  camera.lookAt(...S.target);
  camera.updateMatrixWorld();

  const film = {
    size: [1920, 1080], tone: 'aces', exposure: 0.95,
    ao: { radius: 0.16, thickness: 1, distanceExponent: 1.5, scale: 1, samples: 16, intensity: 0.85 },
    dof: { focus: V(...S.pos).distanceTo(V(...S.subject)), aperture: S.aperture, maxblur: S.maxblur },
    bloom: { strength: 0.22, radius: 0.55, threshold: 1.0 },
    grade: { vignette: 0.32, grain: 0.022, ca: 0.0012, lift: [0.003, 0.006, 0.012], seed: 6 },
  };
  return { scene, camera, bloom: null, exposure: film.exposure, film, handles: { robots, hero, panel, screenMat, screenLight: sl, setScreenSource, shot,
    lights: { bulb, moon, rim, wash, slatWash, key, up, ceilFill, spill, back, sideSpill, lamps } } };
}
