// The T3 Code loft (Episode 2): a bright daylight loft built in metres, Y up.
//
// Look: light oak planks, warm-white plaster, black steel windows with the sun
// raking through them (the walls cast shadows, so light only lands where the
// window openings let it), a pale city skyline outside, plants, pendants, art
// prints and a warm accent taken from T3 Code's brand file (src/t3-brand.json) when
// present, else a terracotta neutral. Robots stand 0.88 m tall (scale 0.42) in a
// human-scale home: doors 2.05 m, ceilings 3.2 m.
//
// buildHallway(): x -1.5..1.5, z -17..4. Windows on the west wall (x -1.5), seven
// identical oak doors on the east wall (x +1.5) with nameplates, a big window at
// the far end. Rooms are built in their own frame (door on the room's x = 0 wall,
// facing +X) so a room can stand alone or sit behind its hallway door (H5).
import * as THREE from 'three';
import { AGENTS } from './assets.js';
import { tex, skyline, textPlate } from './textures-loft.js';
import { loftMaterials, std, mesh, group, plant, pendant, rug, framedPrint, desk, stool, sideTable, bookshelf, sofa, bigButton, lampPanel, installBox, wallClock, giantPhone, fridge } from './props-loft.js';
import { phoneStatus, canvas } from './textures-loft.js';

function subwayTiles() {
  const c = canvas(512, 512);
  const g = c.getContext('2d');
  g.fillStyle = '#C9C4BB';
  g.fillRect(0, 0, 512, 512);
  const tw = 128, th = 64;
  for (let r = 0; r < 8; r++) for (let x = -tw; x < 512 + tw; x += tw) {
    const off = r % 2 ? tw / 2 : 0;
    const grad = g.createLinearGradient(0, r * th, 0, r * th + th);
    grad.addColorStop(0, '#FBFAF7');
    grad.addColorStop(1, '#ECE9E3');
    g.fillStyle = grad;
    g.fillRect(x + off + 3, r * th + 3, tw - 6, th - 6);
  }
  return c;
}
import { contactShadowTexture } from './textures.js';

export const LOFT = {
  wallT: 0.16,
  h: 3.2,
  door: { w: 0.92, h: 2.05, gap: 0.014, plateY: 1.3 },
  hall: { x0: -1.5, x1: 1.5, z0: -17, z1: 4 },
  // hallway doors, near to far (z of each door centre on the east wall)
  doors: [
    { name: 'Cursor', z: -0.6 },
    { name: 'Claude', z: -3.0 },
    { name: 'Codex', z: -5.4 },
    { name: 'OpenCode', z: -7.8 },
    { name: 'Antigravity', z: -10.2 },
    { name: 'Grok', z: -12.6 },
    { name: 'Pi', z: -15.0 },
  ],
};

const HEX = /^#?[0-9a-f]{6}$/i;
function dig(obj, path) {
  return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}
function pickHex(obj, paths) {
  for (const p of paths) {
    const v = dig(obj, p);
    if (typeof v === 'string' && HEX.test(v.trim())) return v.trim().startsWith('#') ? v.trim() : `#${v.trim()}`;
    if (v && typeof v === 'object' && typeof v.hex === 'string' && HEX.test(v.hex)) return v.hex;
  }
  return null;
}

// T3 Code's own colours when the brand file exists; a warm neutral otherwise.
export function loftPalette(assets) {
  const b = assets.t3brand || {};
  const accent = pickHex(b, ['accent', 'primary', 'brand', 'colors.accent', 'colors.primary', 'colors.primaryLight', 'colors.siteAccent', 'colors.brand', 'palette.accent', 'palette.primary', 'colours.accent', 'colours.primary', 'theme.accent', 'theme.primary']) || '#D4704B';
  const dark = pickHex(b, ['dark', 'background', 'colors.background', 'colors.dark', 'palette.background', 'colours.background', 'theme.background']) || '#1D1E21';
  // a dark brand background stays an accent for steel; a light one would wash out
  const steel = new THREE.Color(dark).getHSL({}).l < 0.25 ? dark : '#1D1E21';
  return { oak: '#CDA77C', wall: '#F3EFE8', ceiling: '#F7F4EF', beam: '#232427', steel, door: '#D3AF86', accent, brandFound: !!assets.t3brand };
}

// ---------------------------------------------------------------- lighting

/** Daylight: a warm sun (the only shadow caster), sky hemisphere fill, a soft bounce. */
export function loftLights(scene, { sunPos, sunTarget, extent = 8, depth = 40, intensity = 3.4, hemi = 1.15, mapSize = 2048 }) {
  const sun = new THREE.DirectionalLight('#FFF0D9', intensity);
  sun.position.copy(sunPos);
  sun.target.position.copy(sunTarget);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mapSize, mapSize);
  const c = sun.shadow.camera;
  c.left = -extent; c.right = extent; c.top = extent; c.bottom = -extent;
  c.near = 0.5; c.far = depth;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#E3EEFF', '#D9C3A3', hemi));
  const bounce = new THREE.DirectionalLight('#FFE6CC', 0.35);
  bounce.position.set(sunTarget.x - (sunPos.x - sunTarget.x), 1, sunTarget.z - (sunPos.z - sunTarget.z));
  bounce.target.position.copy(sunTarget);
  scene.add(bounce, bounce.target);
  scene.background = new THREE.Color('#EEF4F8');
  scene.fog = new THREE.Fog('#EEF2F2', 22, 70);
  return { sun };
}

// The sky and city beyond a window wall: a big flat card far outside.
export function skyCard(scene, { center, normalYaw, w = 90, h = 45, horizonY = -1.5, seed = 'sky' }) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(skyline({ seed })), fog: false }));
  // the painted horizon sits 66 % down the image (v = 0.34): put it at horizonY
  m.position.set(center.x, horizonY + 0.16 * h, center.z);
  m.rotation.y = normalYaw;
  scene.add(m);
  return m;
}

// ---------------------------------------------------------------- walls and windows

/** Black steel window unit filling an opening of size w x h (local, centred, facing +Z). */
function windowUnit(parent, M, w, h, { cols = null, rows = null } = {}) {
  const g = new THREE.Group();
  parent.add(g);
  const f = 0.05, m = 0.022;
  const bar = (bw, bh, x, y) => mesh(g, new THREE.BoxGeometry(bw, bh, 0.06), M.steel, [x, y, 0]);
  bar(w, f, 0, h / 2 - f / 2);
  bar(w, f, 0, -h / 2 + f / 2);
  bar(f, h, -w / 2 + f / 2, 0);
  bar(f, h, w / 2 - f / 2, 0);
  const nc = cols ?? Math.max(2, Math.round(w / 0.42));
  const nr = rows ?? Math.max(2, Math.round(h / 0.5));
  for (let i = 1; i < nc; i++) mesh(g, new THREE.BoxGeometry(m, h - 2 * f, 0.04), M.steel, [-w / 2 + (i * w) / nc, 0, 0]);
  for (let j = 1; j < nr; j++) mesh(g, new THREE.BoxGeometry(w - 2 * f, m, 0.04), M.steel, [0, -h / 2 + (j * h) / nr, 0]);
  const glass = mesh(g, new THREE.PlaneGeometry(w - 2 * f, h - 2 * f), M.glass, [0, 0, 0.005], { cast: false, receive: false });
  glass.renderOrder = 2;
  return g;
}

/**
 * A straight wall from (ax, az) to (bx, bz), interior side toward `inward` (unit
 * vector in xz), with openings [{a, b, sill, head, kind}] measured in metres along
 * the wall from its start. Windows get a steel unit and an oak sill.
 */
export function wall(parent, M, { a, b, h = LOFT.h, openings = [], inward, mat = null, skirting = true }) {
  const A = new THREE.Vector3(a[0], 0, a[1]);
  const B = new THREE.Vector3(b[0], 0, b[1]);
  const L = A.distanceTo(B);
  const dir = B.clone().sub(A).normalize();
  const g = new THREE.Group();
  g.position.copy(A);
  // local +X along the wall, local +Z toward the interior
  const n = new THREE.Vector3(inward[0], 0, inward[1]).normalize();
  const basis = new THREE.Matrix4().makeBasis(dir, new THREE.Vector3(0, 1, 0), n);
  g.quaternion.setFromRotationMatrix(basis);
  parent.add(g);
  const T = LOFT.wallT;
  const wm = mat || M.wall;
  const box = (x0, x1, y0, y1) => {
    if (x1 - x0 < 1e-3 || y1 - y0 < 1e-3) return;
    mesh(g, new THREE.BoxGeometry(x1 - x0, y1 - y0, T), wm, [(x0 + x1) / 2, (y0 + y1) / 2, -T / 2]);
  };
  const ops = [...openings].sort((p, q) => p.a - q.a);
  let x = 0;
  for (const o of ops) {
    box(x, o.a, 0, h);
    box(o.a, o.b, 0, o.sill || 0);
    box(o.a, o.b, o.head, h);
    // reveals (the wall's thickness inside the opening)
    const ow = o.b - o.a, oh = o.head - (o.sill || 0);
    if (o.kind === 'window') {
      const unit = windowUnit(g, M, ow, oh, o);
      unit.position.set(o.a + ow / 2, (o.sill || 0) + oh / 2, -T * 0.55);
      mesh(g, new THREE.BoxGeometry(ow + 0.08, 0.035, T * 0.7), M.oak, [o.a + ow / 2, (o.sill || 0) + 0.0175, -T * 0.3]);
    }
    if (o.kind === 'door' && skirting) {
      // casing around a door opening
      const c = 0.05;
      mesh(g, new THREE.BoxGeometry(c, oh + c, 0.025), M.steel, [o.a - c / 2, oh / 2 + c / 2, 0.012]);
      mesh(g, new THREE.BoxGeometry(c, oh + c, 0.025), M.steel, [o.b + c / 2, oh / 2 + c / 2, 0.012]);
      mesh(g, new THREE.BoxGeometry(ow + 2 * c, c, 0.025), M.steel, [o.a + ow / 2, oh + c / 2, 0.012]);
    }
    x = o.b;
  }
  box(x, L, 0, h);
  if (skirting) {
    let s = 0;
    for (const o of [...ops.filter((o) => (o.sill || 0) < 0.05), { a: L, b: L }]) {
      if (o.a - s > 0.02) mesh(g, new THREE.BoxGeometry(o.a - s, 0.09, 0.015), M.white, [(s + o.a) / 2, 0.045, 0.0075], { cast: false });
      s = o.b;
    }
  }
  return { group: g, along: dir, inward: n, length: L, at: (s, y = 0, off = 0) => A.clone().addScaledVector(dir, s).addScaledVector(n, off).setY(y) };
}

export function floorPlane(parent, M, { x0, x1, z0, z1, plank = 1.45 }) {
  const w = x1 - x0, d = z1 - z0;
  const geo = new THREE.PlaneGeometry(w, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / plank), uv.getY(i) * (d / plank));
  const mat = M.floor.clone();
  mat.map = M.oakTex.clone();
  mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  mat.map.needsUpdate = true;
  const m = mesh(parent, geo, mat, [(x0 + x1) / 2, 0, (z0 + z1) / 2], { rot: [-Math.PI / 2, 0, 0], cast: false });
  return m;
}

export function ceiling(parent, M, { x0, x1, z0, z1, h = LOFT.h, beams = 'x', spacing = 2.4 }) {
  mesh(parent, new THREE.BoxGeometry(x1 - x0 + 0.4, 0.12, z1 - z0 + 0.4), M.ceiling, [(x0 + x1) / 2, h + 0.06, (z0 + z1) / 2]);
  if (beams === 'x') {
    for (let z = z1 - spacing / 2; z > z0; z -= spacing) {
      mesh(parent, new THREE.BoxGeometry(x1 - x0, 0.22, 0.12), M.beam, [(x0 + x1) / 2, h - 0.11, z]);
    }
  } else if (beams === 'z') {
    for (let x = x0 + spacing / 2; x < x1; x += spacing) mesh(parent, new THREE.BoxGeometry(0.12, 0.22, z1 - z0), M.beam, [x, h - 0.11, (z0 + z1) / 2]);
  }
}

let shadowTex = null;
export function contactShadow(parent, x, z, w, d, opacity = 0.5, y = 0.004) {
  shadowTex = shadowTex || contactShadowTexture();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.renderOrder = 1;
  m.userData.noDepth = true;
  parent.add(m);
  return m;
}

// ---------------------------------------------------------------- doors and nameplates

export function nameplate(assets, name, palette) {
  const icon = assets.icons?.[AGENTS[name]?.icon || name.toLowerCase()] || assets.extraIcons?.[name.toLowerCase()] || null;
  return textPlate({
    w: 1024, h: 288, bg: '#18191B', radius: 30,
    border: { color: palette.accent, width: 10, inset: 14 },
    icon: icon || false, iconBg: '#F4F1EA',
    lines: [{ text: name, size: 150, color: '#F6F2EA' }],
    align: 'left', pad: 54,
  });
}

/**
 * An oak door in a wall. `frame`: the wall's group-space placement {pos (centre of the
 * opening at the floor, world), yaw (the door faces along its local +Z, into the
 * corridor)}. The leaf hangs on the hinge at local -x; hinge.rotation.y opens it inward.
 */
export function door(parent, M, { pos, yaw, name = null, assets = null, palette, hingeSide = -1 }) {
  const D = LOFT.door;
  const g = group(parent, pos, yaw);
  const hinge = group(g, [hingeSide * D.w / 2, 0, -0.06]);
  const leaf = group(hinge, [-hingeSide * D.w / 2, 0, 0]);
  mesh(leaf, new THREE.BoxGeometry(D.w - 0.008, D.h - D.gap - 0.004, 0.045), M.door, [0, D.gap + (D.h - D.gap) / 2, 0]);
  // shaker panel lines
  for (const y of [0.55, 1.45]) mesh(leaf, new THREE.BoxGeometry(D.w * 0.72, 0.012, 0.004), std('#B8946C', 0.6), [0, y, 0.0245], { cast: false });
  // lever handle (on the side away from the hinge)
  const hx = -hingeSide * (D.w / 2 - 0.09);
  mesh(leaf, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 20), M.steel, [hx, 1.0, 0.028], { rot: [Math.PI / 2, 0, 0] });
  mesh(leaf, new THREE.BoxGeometry(0.13, 0.018, 0.018), M.steel, [hx + hingeSide * 0.05, 1.0, 0.045]);
  mesh(leaf, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 20), M.steel, [hx, 1.0, -0.028], { rot: [Math.PI / 2, 0, 0] });
  let plate = null;
  if (name && assets) {
    const m = new THREE.MeshStandardMaterial({ map: tex(nameplate(assets, name, palette)), roughness: 0.4, metalness: 0.1 });
    plate = mesh(leaf, new THREE.PlaneGeometry(0.52, 0.146), m, [0, D.plateY, 0.0235], { cast: false });
  }
  return { group: g, hinge, leaf, plate };
}

// ---------------------------------------------------------------- the hallway

export function buildHallway(scene, assets, M, palette) {
  const H = LOFT.hall;
  const h = LOFT.h;
  floorPlane(scene, M, { x0: H.x0 - LOFT.wallT, x1: H.x1 + LOFT.wallT, z0: H.z0 - LOFT.wallT, z1: H.z1 + LOFT.wallT });
  ceiling(scene, M, { x0: H.x0, x1: H.x1, z0: H.z0, z1: H.z1, beams: 'x', spacing: 2.4 });
  // west wall: tall steel windows between plaster piers
  const winOpen = [];
  for (let z = H.z1 - 0.6; z - 1.7 > H.z0 + 0.4; z -= 2.4) winOpen.push({ a: H.z1 - z, b: H.z1 - z + 1.7, sill: 0.45, head: 2.75, kind: 'window', cols: 4, rows: 5 });
  wall(scene, M, { a: [H.x0, H.z1], b: [H.x0, H.z0], inward: [1, 0], openings: winOpen });
  // east wall: the doors
  const doorOpen = LOFT.doors.map((d) => ({ a: d.z - H.z0 - LOFT.door.w / 2, b: d.z - H.z0 + LOFT.door.w / 2, sill: 0, head: LOFT.door.h, kind: 'door' }));
  wall(scene, M, { a: [H.x1, H.z0], b: [H.x1, H.z1], inward: [-1, 0], openings: doorOpen });
  // far end: one big window; near end: plaster
  wall(scene, M, { a: [H.x0, H.z0], b: [H.x1, H.z0], inward: [0, 1], openings: [{ a: 0.35, b: 2.65, sill: 0.3, head: 2.85, kind: 'window', cols: 5, rows: 6 }] });
  wall(scene, M, { a: [H.x1, H.z1], b: [H.x0, H.z1], inward: [0, -1] });
  const doors = {};
  for (const d of LOFT.doors) {
    doors[d.name] = door(scene, M, { pos: [H.x1, 0, d.z], yaw: -Math.PI / 2, name: d.name, assets, palette });
    doors[d.name].z = d.z;
  }
  // decor: prints between doors, plants under windows, pendants, a runner
  const prints = [];
  LOFT.doors.forEach((d, i) => {
    if (i === LOFT.doors.length - 1) return;
    const z = d.z - 1.2;
    prints.push(framedPrint(scene, M, { pos: [H.x1 - 0.02, 1.55, z], yaw: -Math.PI / 2, w: 0.55, h: 0.72, seed: `hall${i}`, palette: [palette.accent, '#2F5D62', '#F2C14E', '#1E1E1E', '#E9D8B4'] }));
  });
  const plantSpots = [[-1.12, 2.3, 'fig', 1.0], [-1.15, -2.55, 'monstera', 0.95], [-1.15, -7.35, 'snake', 1.1], [-1.12, -12.1, 'monstera', 1.0], [1.12, -16.3, 'fig', 1.05]];
  plantSpots.forEach(([x, z, kind, s], i) => {
    plant(scene, M, { pos: [x, 0, z], kind, size: s, seed: `hp${i}`, potKind: i % 2 ? 'white' : 'terracotta' });
    contactShadow(scene, x, z, 0.7, 0.7, 0.45);
  });
  for (let z = H.z1 - 1.8; z > H.z0; z -= 2.4) pendant(scene, M, { pos: [0, h, z], drop: 0.75, light: false });
  // sun from the west (a little north) through the windows, low enough to throw window
  // patches across the floor and up the doors
  const lights = loftLights(scene, { sunPos: new THREE.Vector3(-9, 7, -9.5), sunTarget: new THREE.Vector3(0, 0, -6.5), extent: 12, depth: 40 });
  skyCard(scene, { center: new THREE.Vector3(-30, 0, -6), normalYaw: Math.PI / 2, w: 120, h: 50, seed: 'west' });
  skyCard(scene, { center: new THREE.Vector3(0, 0, -45), normalYaw: 0, w: 90, h: 45, seed: 'north' });
  return { doors, lights, bounds: H };
}

// ---------------------------------------------------------------- rooms

/**
 * A room shell in its own frame: interior x 0..w, z -d/2..d/2, door on the x = 0
 * wall at z = 0 (door faces +X, into the room), a window wall chosen by `window`.
 */
export function roomShell(parent, M, palette, { w = 4.2, d = 4.4, h = LOFT.h, windowWall = 'far', door: doorMode = 'leaf', assets = null, name = null, beams = 'z', farMat = null } = {}) {
  const hasDoor = doorMode === 'leaf' || doorMode === 'opening';
  const g = new THREE.Group();
  parent.add(g);
  floorPlane(g, M, { x0: 0, x1: w + 0.1, z0: -d / 2 - 0.1, z1: d / 2 + 0.1 });
  ceiling(g, M, { x0: 0, x1: w, z0: -d / 2, z1: d / 2, h, beams, spacing: 1.6 });
  const D = LOFT.door;
  const doorOps = hasDoor ? [{ a: d / 2 - D.w / 2, b: d / 2 + D.w / 2, sill: 0, head: D.h, kind: 'door' }] : [];
  const win = (L) => {
    const ww = Math.min(L - 0.8, 2.6);
    return [{ a: (L - ww) / 2, b: (L + ww) / 2, sill: 0.5, head: 2.75, kind: 'window', cols: Math.round(ww / 0.45), rows: 5 }];
  };
  // door wall (x = 0), far wall (x = w), side walls z = -d/2 (north) and z = d/2 (south)
  wall(g, M, { a: [0, d / 2], b: [0, -d / 2], inward: [1, 0], openings: doorOps.map((o) => ({ ...o, a: d - o.b, b: d - o.a })) });
  wall(g, M, { a: [w, -d / 2], b: [w, d / 2], inward: [-1, 0], openings: windowWall === 'far' ? win(d) : [], mat: farMat });
  wall(g, M, { a: [0, -d / 2], b: [w, -d / 2], inward: [0, 1], openings: windowWall === 'north' ? win(w) : [] });
  wall(g, M, { a: [w, d / 2], b: [0, d / 2], inward: [0, -1], openings: windowWall === 'south' ? win(w) : [] });
  let doorParts = null;
  if (doorMode === 'leaf') doorParts = door(g, M, { pos: [0, 0, 0], yaw: Math.PI / 2, name, assets, palette, hingeSide: 1 });
  return { group: g, door: doorParts, w, d, h };
}

/**
 * Codex's ship room: Codex on a bar stool behind an oak desk, facing the door side
 * (-X) where the camera stands; the big button on the desk in front of it; the
 * COMMIT / PUSH / PR board on the far wall behind its head; a steel window on the
 * north wall (screen left) throwing sun across the desk.
 */
export function shipRoom(parent, M, palette) {
  const R = roomShell(parent, M, palette, { w: 4.4, d: 4.6, windowWall: 'north', door: false, farMat: std('#B7C9B0', 0.9) });
  const g = R.group;
  desk(g, M, { pos: [2.35, 0, 0], w: 1.5, d: 0.72, h: 0.74, yaw: Math.PI / 2 });
  contactShadow(g, 2.35, 0, 1.2, 1.9, 0.45);
  const button = bigButton(g, M, { pos: [2.5, 0.74, 0.0], color: palette.accent, label: 'SHIP' });
  button.group.rotation.y = -Math.PI / 2; // label faces the camera side (-X)
  stool(g, M, { pos: [3.1, 0, 0], h: 0.62, r: 0.19 });
  const board = lampPanel(g, M, { pos: [R.w - 0.04, 2.02, 0.66], yaw: -Math.PI / 2, color: '#3DDC84' });
  plant(g, M, { pos: [2.3, 0.74, -0.6], kind: 'snake', size: 0.42, seed: 'shipdesk', potKind: 'white' });
  const mug = group(g, [2.25, 0.74, 0.52]);
  mesh(mug, new THREE.CylinderGeometry(0.045, 0.04, 0.1, 24), std('#F3E6CE', 0.35), [0, 0.05, 0]);
  mesh(mug, new THREE.CylinderGeometry(0.0465, 0.0465, 0.02, 24), std(AGENTS.Codex.color, 0.45), [0, 0.068, 0]);
  bookshelf(g, M, { pos: [3.2, 0, 2.12], w: 1.4, h: 1.8, yaw: Math.PI, seed: 'shipshelf' });
  plant(g, M, { pos: [4.0, 0, -1.85], kind: 'monstera', size: 1.05, seed: 'shipm' });
  plant(g, M, { pos: [4.05, 0, 1.2], kind: 'fig', size: 0.9, seed: 'shipf', potKind: 'white' });
  rug(g, { pos: [2.6, 0, 0], w: 2.2, d: 2.8, accent: palette.accent });
  framedPrint(g, M, { pos: [R.w - 0.03, 1.6, -0.95], yaw: -Math.PI / 2, w: 0.55, h: 0.72, seed: 'ship1', palette: [palette.accent, '#2F5D62', '#F2C14E', '#1E1E1E'] });
  pendant(g, M, { pos: [2.4, R.h, 0], drop: 1.0, intensity: 1.4 });
  return { ...R, button, board, seat: { x: 3.1, y: 0.62, z: 0, yaw: Math.PI } };
}

/** Antigravity's room: a bright bedroom-studio with the opened install box on a rug. */
export function antigravityRoom(parent, M, palette, assets, { door: doorMode = 'leaf' } = {}) {
  const R = roomShell(parent, M, palette, { w: 4.4, d: 4.4, windowWall: 'far', door: doorMode, assets, name: null });
  const g = R.group;
  rug(g, { pos: [2.3, 0, 0.1], w: 2.6, d: 2.0, accent: '#4F8BF5' });
  const box = installBox(g, M, { pos: [2.7, 0, -0.25], size: [0.72, 0.46, 0.6], ribbon: palette.accent, yaw: -Math.PI / 2 + 0.25 });
  contactShadow(g, 2.7, -0.25, 1.1, 1.0, 0.5);
  sofa(g, M, { pos: [3.7, 0, 1.5], yaw: -Math.PI / 2 - 0.3, w: 1.8 });
  plant(g, M, { pos: [4.0, 0, -1.8], kind: 'fig', size: 1.0, seed: 'agf' });
  plant(g, M, { pos: [0.5, 0, -1.85], kind: 'snake', size: 1.0, seed: 'ags' });
  bookshelf(g, M, { pos: [2.0, 0, -2.04], w: 1.2, h: 1.5, seed: 'agshelf' });
  framedPrint(g, M, { pos: [1.5, 1.6, 2.13], yaw: Math.PI, w: 0.6, h: 0.8, seed: 'ag1', palette: ['#4F8BF5', '#F2C14E', '#1E1E1E', palette.accent] });
  framedPrint(g, M, { pos: [2.3, 1.7, 2.13], yaw: Math.PI, w: 0.45, h: 0.6, seed: 'ag2', palette: ['#4F8BF5', '#E9D8B4', '#2F5D62'] });
  pendant(g, M, { pos: [2.4, R.h, 0.2], drop: 0.95, intensity: 1.6 });
  return { ...R, box };
}

/** The time machine: a wall of clocks of many sizes, a side table with a stack of books. */
export function clockRoom(parent, M, palette) {
  const R = roomShell(parent, M, palette, { w: 4.6, d: 5.0, windowWall: 'south', door: false, farMat: std('#2D5A5E', 0.85) });
  const g = R.group;
  // the clock wall is the far wall (x = w), facing -X
  const clocks = [];
  const specs = [
    [0.0, 1.75, 0.42, 1, 'oak'], [-0.95, 2.25, 0.24, 0, 'black'], [0.95, 2.3, 0.28, 2, 'brass'], [-1.05, 1.35, 0.3, 2, 'white'],
    [1.05, 1.42, 0.22, 0, 'black'], [-1.85, 1.9, 0.26, 1, 'black'], [1.85, 1.95, 0.32, 0, 'oak'], [-0.45, 2.75, 0.18, 0, 'brass'],
    [0.5, 2.8, 0.2, 2, 'black'], [-1.9, 2.75, 0.17, 2, 'oak'], [1.9, 2.75, 0.18, 1, 'white'], [-1.6, 1.05, 0.16, 0, 'brass'],
    [1.65, 1.05, 0.2, 1, 'black'], [0.0, 2.6, 0.13, 2, 'white'],
  ];
  specs.forEach(([z, y, r, style, frame], i) => {
    const c = wallClock(g, M, { pos: [R.w - 0.03, y, z], r, style, frame, yaw: -Math.PI / 2 });
    c.phase = { h: (i * 0.71) % (Math.PI * 2), m: (i * 2.3) % (Math.PI * 2), s: (i * 1.3) % (Math.PI * 2) };
    clocks.push(c);
  });
  const table = sideTable(g, M, { pos: [3.1, 0, 1.25], r: 0.26, h: 0.56 });
  contactShadow(g, 3.1, 1.25, 0.8, 0.8, 0.45);
  sofa(g, M, { pos: [1.2, 0, -2.0], yaw: 0, w: 2.0, color: '#CFC6B8' });
  plant(g, M, { pos: [4.1, 0, -2.1], kind: 'monstera', size: 1.0, seed: 'clm' });
  plant(g, M, { pos: [0.5, 0, 2.05], kind: 'fig', size: 0.95, seed: 'clf' });
  rug(g, { pos: [2.6, 0, 0.1], w: 2.6, d: 2.2, accent: '#2D5A5E' });
  pendant(g, M, { pos: [2.6, R.h, 0], drop: 0.9, intensity: 1.4 });
  return { ...R, clocks, table: { x: 3.1, z: 1.25, top: 0.56, r: 0.26 } };
}

/** The remote: a living room with the giant phone mounted on the wall like a TV. */
export function phoneRoom(parent, M, palette, assets) {
  const R = roomShell(parent, M, palette, { w: 5.0, d: 5.2, windowWall: 'north', door: false, farMat: std('#E3CDB1', 0.9) });
  const g = R.group;
  const status = phoneStatus({ accent: '#FFFFFF', name: 'T3 Code' });
  const phone = giantPhone(g, M, { pos: [R.w - 0.12, 1.32, 0.25], h: 1.9, yaw: -Math.PI / 2, status });
  sofa(g, M, { pos: [1.15, 0, 0.3], yaw: Math.PI / 2, w: 2.1, color: '#D9D0C3' });
  rug(g, { pos: [2.7, 0, 0.3], w: 2.8, d: 2.4, accent: '#8C8CFF' });
  sideTable(g, M, { pos: [1.15, 0, 1.75], r: 0.22, h: 0.5 });
  plant(g, M, { pos: [4.5, 0, -1.9], kind: 'fig', size: 1.05, seed: 'phf' });
  plant(g, M, { pos: [4.5, 0, 2.2], kind: 'monstera', size: 0.95, seed: 'phm' });
  bookshelf(g, M, { pos: [2.8, 0, 2.43], w: 1.6, h: 1.5, yaw: Math.PI, seed: 'phshelf' });
  pendant(g, M, { pos: [2.7, R.h, 0.3], drop: 0.9, intensity: 1.4 });
  return { ...R, phone };
}

/** The kitchen: a pastel fridge (accent colour) between oak cabinets. */
export function fridgeRoom(parent, M, palette) {
  const tiles = new THREE.MeshStandardMaterial({ map: tex(subwayTiles(), { repeat: [3, 2] }), roughness: 0.35, envMapIntensity: 0.6 });
  const R = roomShell(parent, M, palette, { w: 4.6, d: 5.0, windowWall: 'south', door: false, farMat: tiles });
  const g = R.group;
  const body = new THREE.Color(palette.accent).lerp(new THREE.Color('#F4EEE6'), 0.55);
  const jars = [
    { label: 'THREADS', fill: '#E9C46A', shelf: 2, slot: 0 }, { label: 'RUNS', fill: '#F4A261', shelf: 2, slot: 1 }, { label: 'NODES', fill: '#E76F51', shelf: 2, slot: 2 },
    { label: 'EVENTS', fill: '#8AB17D', shelf: 1, slot: 0 }, { label: 'SQLITE', fill: '#F2E8CF', shelf: 1, slot: 1, r: 0.085, h: 0.24 }, { label: 'EVENTS', fill: '#90BEDE', shelf: 1, slot: 2 },
    { label: 'EVENTS', fill: '#C3B1E1', shelf: 0, slot: 0 }, { label: 'FRESH', fill: '#A7C957', shelf: 0, slot: 2 },
  ];

  // fridge against the far wall (x = w), facing -X
  const F = fridge(g, M, { pos: [R.w - 0.38, 0, 0.1], yaw: -Math.PI / 2, body: `#${body.getHexString()}`, jars, accent: palette.accent });
  // cabinets either side, an oak counter
  for (const s of [-1, 1]) {
    const z = 0.1 + s * 1.05;
    mesh(g, new THREE.BoxGeometry(0.62, 0.88, 1.3), M.white, [R.w - 0.35, 0.44, z]);
    mesh(g, new THREE.BoxGeometry(0.66, 0.04, 1.32), M.oak, [R.w - 0.35, 0.9, z]);
    mesh(g, new THREE.BoxGeometry(0.02, 0.02, 0.5), M.steel, [R.w - 0.67, 0.75, z]);
  }
  plant(g, M, { pos: [R.w - 0.4, 0.92, 1.45], kind: 'snake', size: 0.45, seed: 'kit' });
  const bowl = group(g, [R.w - 0.4, 0.92, -1.3]);
  mesh(bowl, new THREE.SphereGeometry(0.14, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.ceramic, [0, 0.14, 0]);
  for (let i = 0; i < 4; i++) mesh(bowl, new THREE.SphereGeometry(0.05, 16, 12), std(['#E9A23B', '#D9483B', '#8AB17D', '#E9A23B'][i], 0.5), [Math.cos(i * 1.6) * 0.06, 0.12, Math.sin(i * 1.6) * 0.06]);
  pendant(g, M, { pos: [2.4, R.h, 0.1], drop: 0.9, intensity: 1.3 });
  rug(g, { pos: [2.2, 0, 0.1], w: 2.2, d: 1.6, accent: palette.accent });
  return { ...R, fridge: F };
}
