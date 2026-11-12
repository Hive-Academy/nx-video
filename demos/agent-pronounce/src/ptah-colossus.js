// The colossus of Ptah for the desert act: a weathered sandstone statue on a granite plinth.
//
// Iconography: a standing mummiform figure in a tight shroud, a close-fitting skull cap (no
// crown), a straight divine beard, a broad wesekh collar, and both hands emerging from the
// wrappings to hold one composite sceptre (was head, djed pillar and ankh). He stands on a
// maat pedestal on a plinth with a cavetto cornice, with a back pillar behind him.
//
// Build: every organic form is a signed-distance sculpt (smooth unions of ellipsoids, tapered
// capsules and rounded boxes, with noise erosion and seeded chips), meshed once with surface
// nets and projected onto the exact surface. The stone shader samples the Poly Haven CC0
// "worn_rock_natural_01" maps triplanar in object space (albedo, normal, roughness, AO, and the
// displacement map as a height for wear masks). Per-vertex paint carries sand accumulation, a
// signed distance to the gold inlay (collar rows, eye lines, sceptre) and a signed distance to
// the mouth seam, so the shader draws crisp lines on a coarse mesh.
//
// Units: metres at the native size, about 24 m tall, which is 30 small robots at their default
// 0.38 scale (ROBOT.height 2.086 * 0.38 = 0.79). opts.height rescales the whole group.
// Orientation: the statue faces +Z. Frame right for a camera in front of him is +X (his left).
// Origin: ground level, centre of the plinth base.
//
// Determinism: the build is a pure function of the code (hash-seeded noise, no clocks, no
// Math.random). setState() only sets transforms, uniforms and dust alpha.
import * as THREE from 'three';
import { assetUrl } from './assets.js';
import { hash } from './util.js';

const NATIVE_HEIGHT = 24.05; // measured: crown of the cap at 24.05
const Y0 = 3.0; // soles of the figure (top of the maat pedestal)
const HEAD_PIVOT = new THREE.Vector3(0, Y0 + 18.0, 0.45);
const GRIP = new THREE.Vector3(0, Y0 + 14.2, 1.98);

// ---------------------------------------------------------------- scalar SDF helpers
const { sqrt, abs, max, min, floor, cos, sin, pow, atan2, exp } = Math;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function smin(a, b, k) { const h = max(k - abs(a - b), 0) / k; return min(a, b) - h * h * k * 0.25; }
function smax(a, b, k) { const h = max(k - abs(a - b), 0) / k; return max(a, b) + h * h * k * 0.25; }
function ell(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = (px - cx) / rx, y = (py - cy) / ry, z = (pz - cz) / rz;
  const k0 = sqrt(x * x + y * y + z * z);
  const x1 = x / rx, y1 = y / ry, z1 = z / rz;
  const k1 = sqrt(x1 * x1 + y1 * y1 + z1 * z1);
  return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -min(rx, ry, rz);
}
// capsule with a linear radius taper from a (r1) to b (r2)
function taper(px, py, pz, ax, ay, az, bx, by, bz, r1, r2) {
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = clamp01((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return sqrt(dx * dx + dy * dy + dz * dz) - (r1 + (r2 - r1) * h);
}
function rbox(px, py, pz, cx, cy, cz, hx, hy, hz, r) {
  const qx = abs(px - cx) - hx + r, qy = abs(py - cy) - hy + r, qz = abs(pz - cz) - hz + r;
  const ox = max(qx, 0), oy = max(qy, 0), oz = max(qz, 0);
  return sqrt(ox * ox + oy * oy + oz * oz) + min(max(qx, qy, qz), 0) - r;
}
function cylY(px, py, pz, cx, cz, r, y0, y1, rr = 0) {
  const dx = sqrt((px - cx) * (px - cx) + (pz - cz) * (pz - cz)) - r + rr;
  const dy = abs(py - (y0 + y1) / 2) - (y1 - y0) / 2 + rr;
  const ox = max(dx, 0), oy = max(dy, 0);
  return sqrt(ox * ox + oy * oy) + min(max(dx, dy), 0) - rr;
}
function seg2(px, py, ax, ay, bx, by) {
  const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
  const h = clamp01((pax * bax + pay * bay) / (bax * bax + bay * bay));
  const dx = pax - bax * h, dy = pay - bay * h;
  return [sqrt(dx * dx + dy * dy), h];
}

// Seeded value noise (integer hash, no Math.random).
function ih(x, y, z, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440670441) ^ Math.imul(s, 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, z, s) {
  const xi = floor(x), yi = floor(y), zi = floor(z);
  let fx = x - xi, fy = y - yi, fz = z - zi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const a = ih(xi, yi, zi, s), b = ih(xi + 1, yi, zi, s), c = ih(xi, yi + 1, zi, s), d = ih(xi + 1, yi + 1, zi, s);
  const e = ih(xi, yi, zi + 1, s), f = ih(xi + 1, yi, zi + 1, s), g = ih(xi, yi + 1, zi + 1, s), k = ih(xi + 1, yi + 1, zi + 1, s);
  const x1 = a + (b - a) * fx, x2 = c + (d - c) * fx, x3 = e + (f - e) * fx, x4 = g + (k - g) * fx;
  const y1 = x1 + (x2 - x1) * fy, y2 = x3 + (x4 - x3) * fy;
  return (y1 + (y2 - y1) * fz) * 2 - 1;
}
function fbm(x, y, z, s, oct = 3) {
  let a = 0.5, t = 0;
  for (let i = 0; i < oct; i++) { t += a * vnoise(x, y, z, s + i * 17); x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; }
  return t;
}

// Seeded chips: spheres bitten out of edges. list of [x, y, z, r].
function chipsAlong(seed, count, a, b, rLo, rHi, jitter = 0.1) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = hash(seed, i, 't');
    out.push([
      a[0] + (b[0] - a[0]) * t + (hash(seed, i, 'x') - 0.5) * jitter,
      a[1] + (b[1] - a[1]) * t + (hash(seed, i, 'y') - 0.5) * jitter,
      a[2] + (b[2] - a[2]) * t + (hash(seed, i, 'z') - 0.5) * jitter,
      rLo + (rHi - rLo) * hash(seed, i, 'r'),
    ]);
  }
  return out;
}
function applyChips(d, x, y, z, chips, k) {
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i];
    const dx = x - c[0], dy = y - c[1], dz = z - c[2];
    const q = dx * dx + dy * dy + dz * dz;
    const lim = c[3] + k + 0.05;
    if (q < lim * lim) d = smax(d, c[3] - sqrt(q), k);
  }
  return d;
}

// ---------------------------------------------------------------- surface nets mesher
const CORNERS = [];
for (let c = 0; c < 8; c++) CORNERS.push([c & 1, (c >> 1) & 1, (c >> 2) & 1]);
const EDGES = [];
for (let a = 0; a < 8; a++) for (const bit of [1, 2, 4]) if (!(a & bit)) EDGES.push([a, a | bit]);

// f(x,y,z) -> signed distance (negative inside). box = [x0,y0,z0,x1,y1,z1].
// paint(x,y,z,nx,ny,nz,out) fills out = [sand, inlay, glow, r, g, b].
function polygonize(f, box, cell, paint, C = 4) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const nx = Math.ceil((x1 - x0) / cell / C) * C + 1;
  const ny = Math.ceil((y1 - y0) / cell / C) * C + 1;
  const nz = Math.ceil((z1 - z0) / cell / C) * C + 1;
  const sxy = nx * ny;
  const idx = (i, j, k) => i + nx * j + sxy * k;
  const val = new Float32Array(nx * ny * nz);
  const done = new Uint8Array(nx * ny * nz);
  const bx = (nx - 1) / C, by = (ny - 1) / C, bz = (nz - 1) / C;
  const cv = new Float32Array((bx + 1) * (by + 1) * (bz + 1));
  const ci = (i, j, k) => i + (bx + 1) * (j + (by + 1) * k);
  for (let k = 0; k <= bz; k++) for (let j = 0; j <= by; j++) for (let i = 0; i <= bx; i++) {
    const v = f(x0 + i * C * cell, y0 + j * C * cell, z0 + k * C * cell);
    cv[ci(i, j, k)] = v;
    const fi = idx(i * C, j * C, k * C);
    val[fi] = v; done[fi] = 1;
  }
  const thr = cell * C * 1.9;
  const act = new Uint8Array(bx * by * bz);
  const bi = (i, j, k) => i + bx * (j + by * k);
  for (let k = 0; k < bz; k++) for (let j = 0; j < by; j++) for (let i = 0; i < bx; i++) {
    let mn = Infinity, mx = -Infinity, am = Infinity;
    for (const [dx, dy, dz] of CORNERS) {
      const v = cv[ci(i + dx, j + dy, k + dz)];
      if (v < mn) mn = v; if (v > mx) mx = v; if (abs(v) < am) am = abs(v);
    }
    if ((mn < 0 && mx > 0) || am < thr) {
      for (let c = -1; c <= 1; c++) for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
        const ii = i + a, jj = j + b, kk = k + c;
        if (ii >= 0 && jj >= 0 && kk >= 0 && ii < bx && jj < by && kk < bz) act[bi(ii, jj, kk)] = 1;
      }
    }
  }
  for (let k = 0; k < bz; k++) for (let j = 0; j < by; j++) for (let i = 0; i < bx; i++) {
    if (!act[bi(i, j, k)]) continue;
    for (let c = 0; c <= C; c++) for (let b = 0; b <= C; b++) for (let a = 0; a <= C; a++) {
      const I = i * C + a, J = j * C + b, K = k * C + c;
      const fi = idx(I, J, K);
      if (!done[fi]) { val[fi] = f(x0 + I * cell, y0 + J * cell, z0 + K * cell); done[fi] = 1; }
    }
  }
  for (let K = 0; K < nz; K++) for (let J = 0; J < ny; J++) for (let I = 0; I < nx; I++) {
    const fi = idx(I, J, K);
    if (done[fi]) continue;
    const v = cv[ci(min(floor(I / C), bx), min(floor(J / C), by), min(floor(K / C), bz))];
    val[fi] = v < 0 ? -thr : thr;
  }
  // one vertex per sign-changing cell
  const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cidx = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [];
  const cvv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    if (!act[bi(min(floor(i / C), bx - 1), min(floor(j / C), by - 1), min(floor(k / C), bz - 1))]) continue;
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const v = val[idx(i + CORNERS[c][0], j + CORNERS[c][1], k + CORNERS[c][2])];
      cvv[c] = v; if (v < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      const va = cvv[a], vb = cvv[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      sx += CORNERS[a][0] + (CORNERS[b][0] - CORNERS[a][0]) * t;
      sy += CORNERS[a][1] + (CORNERS[b][1] - CORNERS[a][1]) * t;
      sz += CORNERS[a][2] + (CORNERS[b][2] - CORNERS[a][2]) * t;
      n++;
    }
    cellVert[cidx(i, j, k)] = pos.length / 3;
    pos.push(x0 + (i + sx / n) * cell, y0 + (j + sy / n) * cell, z0 + (k + sz / n) * cell);
  }
  const ind = [];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) ind.push(a, b, c, a, c, d); else ind.push(a, c, b, a, d, c);
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v0 = val[idx(i, j, k)];
    const in0 = v0 < 0;
    if (i < nx - 1 && j > 0 && k > 0 && j < ny - 1 && k < nz - 1 && in0 !== (val[idx(i + 1, j, k)] < 0)) {
      quad(cellVert[cidx(i, j - 1, k - 1)], cellVert[cidx(i, j, k - 1)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j - 1, k)], in0);
    }
    if (j < ny - 1 && i > 0 && k > 0 && i < nx - 1 && k < nz - 1 && in0 !== (val[idx(i, j + 1, k)] < 0)) {
      quad(cellVert[cidx(i - 1, j, k - 1)], cellVert[cidx(i - 1, j, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j, k - 1)], in0);
    }
    if (k < nz - 1 && i > 0 && j > 0 && i < nx - 1 && j < ny - 1 && in0 !== (val[idx(i, j, k + 1)] < 0)) {
      quad(cellVert[cidx(i - 1, j - 1, k)], cellVert[cidx(i, j - 1, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i - 1, j, k)], in0);
    }
  }
  // project onto the exact surface, take normals from the gradient, paint
  const vc = pos.length / 3;
  const nrm = new Float32Array(vc * 3);
  const paintA = new Float32Array(vc * 3);
  const col = new Float32Array(vc * 3);
  const h = cell * 0.35;
  const out = [0, 1, 1, 1, 1, 1];
  const grad = (x, y, z, g) => {
    g[0] = (f(x + h, y, z) - f(x - h, y, z)) / (2 * h);
    g[1] = (f(x, y + h, z) - f(x, y - h, z)) / (2 * h);
    g[2] = (f(x, y, z + h) - f(x, y, z - h)) / (2 * h);
  };
  const g = [0, 0, 0];
  for (let v = 0; v < vc; v++) {
    let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    for (let it = 0; it < 2; it++) {
      const d = f(x, y, z);
      grad(x, y, z, g);
      const g2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (g2 < 1e-10) break;
      let s = d / g2;
      const stepLen = abs(s) * sqrt(g2);
      if (stepLen > cell) s *= cell / stepLen;
      x -= s * g[0]; y -= s * g[1]; z -= s * g[2];
    }
    grad(x, y, z, g);
    const gl = sqrt(g[0] * g[0] + g[1] * g[1] + g[2] * g[2]) || 1;
    const nx_ = g[0] / gl, ny_ = g[1] / gl, nz_ = g[2] / gl;
    pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
    nrm[v * 3] = nx_; nrm[v * 3 + 1] = ny_; nrm[v * 3 + 2] = nz_;
    out[0] = 0; out[1] = 1; out[2] = 1; out[3] = 1; out[4] = 1; out[5] = 1;
    paint(x, y, z, nx_, ny_, nz_, out);
    paintA[v * 3] = out[0]; paintA[v * 3 + 1] = out[1]; paintA[v * 3 + 2] = out[2];
    col[v * 3] = out[3]; col[v * 3 + 1] = out[4]; col[v * 3 + 2] = out[5];
  }
  // winding check against the gradient normals
  let score = 0;
  for (let t = 0; t < ind.length; t += 3) {
    const a = ind[t] * 3, b = ind[t + 1] * 3, c = ind[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
    score += (uy * wz - uz * wy) * nrm[a] + (uz * wx - ux * wz) * nrm[a + 1] + (ux * wy - uy * wx) * nrm[a + 2];
  }
  if (score < 0) for (let t = 0; t < ind.length; t += 3) { const s = ind[t + 1]; ind[t + 1] = ind[t + 2]; ind[t + 2] = s; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute('aPaint', new THREE.BufferAttribute(paintA, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(vc > 65535 ? new THREE.Uint32BufferAttribute(ind, 1) : new THREE.Uint16BufferAttribute(ind, 1));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

// ---------------------------------------------------------------- the head
// Local frame: origin at the neck pivot, +Y up, +Z out of the face.
const EYE = { x: 0.37, y: 1.735, z: 0.925 };
const capEdge = (z) => 1.05 + 1.17 * sstep(-0.35, 0.55, z);
const HEAD_CHIPS = [
  [0.2, -0.76, 0.9, 0.07], [-0.21, -0.74, 0.62, 0.06], [0.33, 2.25, 0.96, 0.05], [-0.62, 2.2, 0.78, 0.045],
  [1.1, 2.0, -0.08, 0.06], [-1.08, 1.25, 0.1, 0.05], [0.09, 1.31, 1.34, 0.03], [-0.55, 2.9, -0.4, 0.09],
  [0.75, 2.6, -0.75, 0.08],
];
function headBase(x, y, z) {
  let d = ell(x, y, z, 0, 1.85, -0.12, 0.95, 1.12, 1.12);
  d = smin(d, ell(x, y, z, 0, 1.45, 0.3, 0.8, 1.05, 0.78), 0.35);
  d = smin(d, ell(x, y, z, 0, 0.88, 0.28, 0.66, 0.5, 0.66), 0.3);
  return d;
}
function beardSDF(x, y, z) {
  const ax = abs(x);
  const t = clamp01((0.45 - y) / 1.1);
  const hx = 0.21 + 0.06 * t;
  const zc = 0.74 + 0.1 * t;
  const r = 0.06;
  const qx = ax - hx + r, qy = abs(y + 0.1) - 0.55 + r, qz = abs(z - zc) - 0.18 + r;
  const ox = max(qx, 0), oy = max(qy, 0), oz = max(qz, 0);
  let d = sqrt(ox * ox + oy * oy + oz * oz) + min(max(qx, qy, qz), 0) - r;
  // plaited bands: narrow horizontal grooves
  const c = 0.5 + 0.5 * cos((2 * Math.PI * (y + 0.02)) / 0.115);
  d += 0.014 * c * c * c * c * c * c * sstep(0.42, 0.3, y);
  return d;
}
function headSDF(x, y, z) {
  const ax = abs(x);
  const base = headBase(x, y, z);
  let d = smin(base, taper(x, y, z, 0, -1.1, -0.15, 0, 0.9, -0.15, 0.74, 0.62), 0.3);
  if (z > 0.15 && y > 0.25 && y < 2.45 && ax < 1.0) {
    d = smin(d, ell(x, y, z, 0, 0.58, 0.78, 0.3, 0.2, 0.22), 0.18); // chin
    d = smin(d, ell(ax, y, z, 0.47, 1.42, 0.7, 0.32, 0.28, 0.3), 0.25); // cheekbones
    d = smin(d, ell(ax, y, z, 0.37, 1.955, 0.86, 0.34, 0.07, 0.1), 0.07); // brow band
    d = smax(d, -ell(ax, y, z, 0.37, 1.735, 1.04, 0.27, 0.15, 0.17), 0.07); // socket
    d = smin(d, ell(ax, y, z, 0.37, 1.8, 0.955, 0.25, 0.065, 0.1), 0.03); // upper lid
    d = smin(d, ell(ax, y, z, 0.37, 1.672, 0.94, 0.22, 0.045, 0.08), 0.03); // lower lid
    d = smin(d, taper(x, y, z, 0, 1.86, 0.98, 0, 1.32, 1.22, 0.075, 0.12), 0.1); // nose bridge
    d = smin(d, ell(x, y, z, 0, 1.25, 1.2, 0.15, 0.115, 0.13), 0.06); // nose tip
    d = smin(d, ell(ax, y, z, 0.15, 1.24, 1.09, 0.1, 0.09, 0.1), 0.05); // nostril wings
    d = smax(d, -ell(ax, y, z, 0.075, 1.155, 1.16, 0.045, 0.03, 0.05), 0.02); // nostrils
    d = smin(d, ell(x, y, z, 0, 0.975, 1.02, 0.31, 0.095, 0.14), 0.05); // upper lip
    d = smin(d, ell(x, y, z, 0, 0.85, 1.0, 0.27, 0.1, 0.14), 0.05); // lower lip
    d = smax(d, -ell(x, y, z, 0, 0.912, 1.12, 0.27, 0.016, 0.1), 0.02); // mouth line
    d = smax(d, -ell(ax, y, z, 0.285, 0.915, 0.97, 0.04, 0.035, 0.05), 0.02); // mouth corners
  }
  // skull cap: an offset shell of the head mass above the cap line
  let cap = smax(base - 0.06, capEdge(z) - y, 0.015);
  cap = smax(cap, -(base + 0.5), 0.01);
  cap = smax(cap, -ell(ax, y, z, 0.96, 1.58, 0.06, 0.32, 0.56, 0.36), 0.03); // the cap leaves the ears free
  d = min(d, cap);
  if (ax > 0.6 && y > 1.0 && y < 2.2 && z > -0.45 && z < 0.4) {
    d = smin(d, ell(ax, y, z, 0.96, 1.58, 0.06, 0.13, 0.4, 0.25), 0.06); // ear
    d = smax(d, -ell(ax, y, z, 1.07, 1.56, 0.1, 0.07, 0.27, 0.15), 0.04); // concha
  }
  if (y < 0.75 && ax < 0.5 && z > 0.3) d = smin(d, beardSDF(x, y, z), 0.12);
  // weathering
  d += 0.009 * fbm(x * 4, y * 4, z * 4, 11) + 0.0035 * vnoise(x * 15, y * 15, z * 15, 12);
  d = applyChips(d, x, y, z, HEAD_CHIPS, 0.015);
  return d;
}
function headPaint(x, y, z, nx, ny, nz, out) {
  const ax = abs(x);
  out[0] = 0.35;
  // gold inlay field (signed metres, negative = gold)
  let gold = 1;
  if (z > 0.45 && y > 1.5 && y < 2.1) {
    const ex = (ax - EYE.x) / 0.235, ey = (y - EYE.y) / 0.1;
    const rim = abs((sqrt(ex * ex + ey * ey) - 1) * 0.1) - 0.012;
    const [cl, ch] = seg2(ax, y, 0.58, 1.735, 0.87, 1.705);
    const line = cl - (0.022 - 0.008 * ch);
    const b1 = seg2(ax, y, 0.13, 1.93, 0.37, 1.99)[0], b2 = seg2(ax, y, 0.37, 1.99, 0.62, 1.94)[0], b3 = seg2(ax, y, 0.62, 1.94, 0.82, 1.87)[0];
    const brow = min(b1, b2, b3) - 0.024;
    gold = min(rim, line, brow);
  }
  out[1] = Math.max(-0.04, Math.min(0.04, gold));
  // mouth seam field: lights with the voice
  out[2] = 1;
  // mouth seam distance: continuous over the whole front of the face (no region edge to show)
  if (z > 0.5) out[2] = Math.max(-0.04, Math.min(1, seg2(x, y, -0.255, 0.912, 0.255, 0.912)[0] - 0.01 + 1.5 * Math.max(0, 0.95 - z)));
  // tint: dark granite cap with lapis traces; sandstone face with patchy weathering
  const onCap = y > capEdge(z) - 0.01 && headBase(x, y, z) > 0.015;
  const w = 0.9 + 0.12 * fbm(x * 1.3, y * 1.3, z * 1.3, 21);
  if (onCap) {
    const lap = 0.35 + 0.65 * sstep(-0.2, 0.4, fbm(x * 2.2, y * 2.2, z * 2.2, 22) + 0.15);
    out[3] = (0.34 + (0.2 - 0.34) * lap) * w; out[4] = (0.33 + (0.27 - 0.33) * lap) * w; out[5] = (0.36 + (0.52 - 0.36) * lap) * w;
    out[0] = 0.2;
  } else {
    out[3] = w; out[4] = w * 0.985; out[5] = w * 0.96;
  }
}

// ---------------------------------------------------------------- the body
// Figure frame: soles at y = 0. Statue space adds Y0.
// Keyframes: y, half-width a, half-depth b, centre z, superellipse exponent n.
const BODY_KEYS = [
  [0.0, 1.15, 1.2, 0.42, 2.6], [0.7, 1.2, 1.22, 0.38, 2.5], [1.4, 1.12, 0.98, 0.04, 2.3],
  [4.0, 1.3, 1.02, 0.0, 2.3], [6.0, 1.38, 1.02, -0.02, 2.3], [9.0, 1.72, 1.12, 0.0, 2.4],
  [11.0, 1.98, 1.25, 0.05, 2.5], [12.5, 2.04, 1.28, 0.08, 2.5], [14.0, 2.22, 1.4, 0.14, 2.6],
  [15.6, 2.56, 1.42, 0.14, 2.7], [16.8, 2.68, 1.25, 0.05, 2.9], [17.5, 2.32, 1.0, 0.05, 2.6],
  [17.9, 1.75, 0.9, 0.05, 2.3], [18.2, 1.0, 0.75, 0.1, 2.1], [18.7, 0.72, 0.62, 0.15, 2.0],
];
const BODY_LUT_STEP = 0.02;
const BODY_LUT = (() => {
  const n = Math.ceil(19 / BODY_LUT_STEP) + 1;
  const lut = new Float32Array(n * 4);
  const K = BODY_KEYS;
  for (let s = 0; s < n; s++) {
    const y = s * BODY_LUT_STEP;
    let i = 0;
    while (i < K.length - 2 && y > K[i + 1][0]) i++;
    const p0 = K[max(i - 1, 0)], p1 = K[i], p2 = K[i + 1], p3 = K[min(i + 2, K.length - 1)];
    const t = clamp01((y - p1[0]) / (p2[0] - p1[0]));
    for (let c = 1; c <= 4; c++) {
      // Catmull-Rom on each channel (uniform parameter is enough for a smooth silhouette)
      const a = p0[c], b = p1[c], cc = p2[c], d = p3[c];
      lut[s * 4 + c - 1] = 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t);
    }
  }
  return lut;
})();
const COLLAR_C = [0, 18.12, 0.15];
const COLLAR_R0 = 1.02, COLLAR_ROW = 0.17;
// worn pigment of the bead rows, inner to outer: gold, lapis, carnelian, turquoise, gold, ...
const COLLAR_ROWS = ['gold', [0.42, 0.5, 0.78], [0.92, 0.55, 0.42], [0.5, 0.78, 0.72], 'gold', [0.42, 0.5, 0.78], [0.92, 0.55, 0.42], 'gold'];
const BODY_CHIPS = [
  ...chipsAlong('bchip-sh', 6, [-2.6, 17.0, 0.2], [2.6, 17.0, 0.2], 0.08, 0.2, 0.6),
  ...chipsAlong('bchip-ft', 5, [-1.0, 0.75, 1.55], [1.0, 0.75, 1.55], 0.07, 0.16, 0.3),
  ...chipsAlong('bchip-bp', 7, [-0.92, 2.0, -1.72], [0.92, 17.4, -1.72], 0.1, 0.28, 0.3),
  ...chipsAlong('bchip-cl', 8, [-2.0, 16.3, 1.25], [2.0, 16.3, 1.25], 0.05, 0.12, 0.5),
];
function torsoSDF(x, y, z) {
  const ax = abs(x);
  const s = min(max(y, 0), 18.98) / BODY_LUT_STEP;
  const i = floor(s), t = s - i;
  const l = BODY_LUT;
  const a = l[i * 4] + (l[i * 4 + 4] - l[i * 4]) * t;
  const b = l[i * 4 + 1] + (l[i * 4 + 5] - l[i * 4 + 1]) * t;
  const cz = l[i * 4 + 2] + (l[i * 4 + 6] - l[i * 4 + 2]) * t;
  const n = l[i * 4 + 3] + (l[i * 4 + 7] - l[i * 4 + 3]) * t;
  const qx = ax / a, qz = abs(z - cz) / b;
  const r = pow(pow(qx, n) + pow(qz, n), 1 / n);
  let d = (r - 1) * min(a, b) * 0.92;
  // feet under the shroud
  d = smin(d, rbox(x, y, z, 0, 0.36, 0.85, 0.92, 0.36, 0.85, 0.32), 0.4);
  // arms under the shroud: upper arms at the sides, forearms folded to the hands at the chest
  if (y > 12.8 && y < 17.6) {
    const sx = x < 0 ? -1 : 1;
    const wy = sx < 0 ? 14.55 : 13.85;
    let arm = taper(ax, y, z, 2.08, 16.6, 0.05, 2.02, 14.5, 0.4, 0.62, 0.55);
    arm = smin(arm, taper(ax, y, z, 2.02, 14.5, 0.4, 0.62, wy, 1.5, 0.55, 0.36), 0.4);
    d = smin(d, arm, 0.7);
  }
  d = max(d, -y);
  d = smax(d, y - 18.95, 0.2);
  return d;
}
function collarSDF(x, y, z, torso) {
  const dx = x - COLLAR_C[0], dy = y - COLLAR_C[1], dz = z - COLLAR_C[2];
  const rho = sqrt(dx * dx + dy * dy + dz * dz);
  if (rho > 2.7) return 1;
  const phi = atan2(x, z - 0.15);
  const rc = 2.28 + 0.075 * sqrt(abs(cos(phi * 19)));
  let c = smax(torso - 0.15, rho - rc, 0.03);
  c = smax(c, 0.92 - rho, 0.04); // open ring: the neck rises clear of the collar
  c = smax(c, y - 18.3, 0.06);
  // bead-row grooves at the row boundaries, and a beaded texture along each row
  const g = 0.5 + 0.5 * cos((2 * Math.PI * (rho - COLLAR_R0)) / COLLAR_ROW);
  c += 0.026 * pow(g, 12) * sstep(0.95, 1.1, rho);
  c += 0.008 * pow(0.5 + 0.5 * cos(phi * (40 + 14 * floor((rho - COLLAR_R0) / COLLAR_ROW))), 4) * sstep(1.0, 1.2, rho);
  return c;
}
function backPillar(x, y, z) {
  return rbox(x, y, z, 0, 8.8, -1.35, 0.95, 8.8, 0.5, 0.06);
}
function bodySDF(x, y, z) {
  const torso = torsoSDF(x, y, z);
  let d = torso;
  if (y > 15.0) d = min(d, collarSDF(x, y, z, torso));
  if (z < -0.6 && abs(x) < 1.2) d = smin(d, backPillar(x, y, z), 0.12);
  // tight wrapping bands below the collar
  if (y < 16.2) {
    const w = 0.5 + 0.5 * cos((2 * Math.PI * y) / 0.62 + 0.6 * sin(x * 0.7));
    d += 0.012 * w * w * w * w * sstep(0.2, 1.0, y);
  }
  d += 0.03 * fbm(x * 0.9, y * 0.9, z * 0.9, 31) + 0.009 * fbm(x * 3.6, y * 3.6, z * 3.6, 32, 2);
  d = applyChips(d, x, y, z, BODY_CHIPS, 0.03);
  return d;
}
function bodyPaint(x, y, z, nx, ny, nz, out) {
  out[0] = 0.5 + 0.4 * sstep(1.2, 0.1, y);
  const dx = x - COLLAR_C[0], dy = y - COLLAR_C[1], dz = z - COLLAR_C[2];
  const rho = sqrt(dx * dx + dy * dy + dz * dz);
  let gold = 1;
  const w = 0.88 + 0.14 * fbm(x * 0.35, y * 0.35, z * 0.35, 41) - 0.12 * sstep(3, 0, y);
  out[3] = w; out[4] = w * 0.98; out[5] = w * 0.95;
  if (y > 15.0 && rho < 2.45 && rho > 0.95 && torsoSDF(x, y, z) > 0.03) { // on the collar shell, not the shroud
    const ri = floor((rho - COLLAR_R0) / COLLAR_ROW);
    const fr = (rho - COLLAR_R0) / COLLAR_ROW - ri;
    const row = COLLAR_ROWS[min(max(ri, 0), COLLAR_ROWS.length - 1)];
    const edge = min(fr, 1 - fr) * COLLAR_ROW; // metres to the row boundary
    if (row === 'gold') gold = 0.012 - edge;
    else {
      const wear = 0.5 + 0.3 * sstep(-0.3, 0.3, fbm(x * 1.7, y * 1.7, z * 1.7, 42));
      for (let c = 0; c < 3; c++) out[3 + c] = out[3 + c] * (1 - wear) + row[c] * w * wear;
    }
    // outermost row: gold pendant drops
    const phi = atan2(x, z - 0.15);
    const drop = max(abs(rho - 2.3) - 0.05, 0.25 - sqrt(abs(cos(phi * 19))));
    gold = min(gold, drop);
  }
  out[1] = max(-0.04, min(0.04, gold));
  out[2] = 1;
}

// ---------------------------------------------------------------- hands and the sceptre
// Local frame: origin at the grip (between the fists), the staff on the local Y axis.
const STAFF_BOTTOM = -(GRIP.y - 2.83); // rests on the sloped front of the maat pedestal
function fistsSDF(x, y, z) {
  let d = 1e9;
  for (const [cy, side] of [[0.36, -1], [-0.36, 1]]) {
    let f = rbox(x, y, z, 0, cy, 0.02, 0.42, 0.33, 0.36, 0.15);
    // finger grooves seen from the front
    const g = 0.5 + 0.5 * cos((2 * Math.PI * (y - cy - 0.0825)) / 0.165);
    f += 0.02 * pow(g, 8) * sstep(-0.05, 0.2, z) * sstep(0.3, 0.28, abs(y - cy));
    // wrist into the wrapping
    f = smin(f, taper(x, y, z, side * 0.22, cy, -0.15, side * 0.85, cy - 0.06, -0.8, 0.27, 0.3), 0.12);
    d = min(d, f);
  }
  // thumb of the upper hand over the top of the fist
  d = smin(d, taper(x, y, z, -0.34, 0.6, 0.0, 0.0, 0.6, 0.3, 0.1, 0.085), 0.1);
  return d;
}
function sceptreGold(x, y, z) {
  let g = cylY(x, y, z, 0, 0, 0.205, 0.8, 0.9, 0.01); // band above the fists
  g = min(g, rbox(x, y, z, 0, 1.29, 0, 0.42, 0.07, 0.1, 0.03)); // ankh crossbar
  const ex = x / 0.25, ey = (y - 1.72) / 0.36;
  const e = (sqrt(ex * ex + ey * ey) - 1) * 0.28;
  g = min(g, sqrt(e * e + z * z) - 0.075); // ankh loop
  g = min(g, cylY(x, y, z, 0, 0, 0.215, 3.22, 3.32, 0.02)); // abacus band
  return g;
}
function sceptreStone(x, y, z) {
  let s = cylY(x, y, z, 0, 0, 0.16, -1.0, 1.3, 0.02); // staff through the fists into the ankh
  s = smin(s, taper(x, y, z, 0, 2.1, 0, 0, 2.26, 0, 0.23, 0.17), 0.04); // djed foot
  s = min(s, cylY(x, y, z, 0, 0, 0.17, 2.1, 3.3, 0.02)); // djed column
  for (let i = 0; i < 4; i++) s = min(s, cylY(x, y, z, 0, 0, 0.36 - i * 0.012, 2.6 + i * 0.15, 2.7 + i * 0.15, 0.03)); // djed discs
  s = min(s, cylY(x, y, z, 0, 0, 0.11, 3.28, 3.52, 0.02)); // was neck
  s = smin(s, taper(x, y, z, 0, 3.46, -0.1, 0, 3.66, 0.38, 0.14, 0.07), 0.05); // was head
  s = min(s, rbox(abs(x), y, z, 0.07, 3.66, -0.06, 0.035, 0.08, 0.05, 0.02)); // ears
  return s;
}
const SCEPTRE_CHIPS = [[0.36, 3.12, 0.22, 0.06], [-0.3, 2.86, -0.18, 0.05], [0.42, -0.6, 0.3, 0.06], [-0.38, 0.62, 0.36, 0.05]];
function sceptreSDF(x, y, z) {
  let d = min(fistsSDF(x, y, z), sceptreStone(x, y, z));
  d = min(d, sceptreGold(x, y, z));
  d += 0.006 * fbm(x * 5, y * 5, z * 5, 51);
  return applyChips(d, x, y, z, SCEPTRE_CHIPS, 0.015);
}
function sceptrePaint(x, y, z, nx, ny, nz, out) {
  out[0] = 0.4;
  const g = sceptreGold(x, y, z), s = min(fistsSDF(x, y, z), sceptreStone(x, y, z));
  out[1] = max(-0.03, min(0.03, g - s));
  out[2] = 1;
  const w = 0.9 + 0.1 * fbm(x * 1.5, y * 1.5, z * 1.5, 61);
  out[3] = w; out[4] = w * 0.98; out[5] = w * 0.95;
}
function staffGeometry() {
  // the long lower staff: a lathe with raised gold rings and a foot
  const pts = [];
  const y0 = STAFF_BOTTOM, y1 = -0.7;
  pts.push(new THREE.Vector2(0.0, y0));
  pts.push(new THREE.Vector2(0.24, y0 + 0.02));
  pts.push(new THREE.Vector2(0.25, y0 + 0.16));
  pts.push(new THREE.Vector2(0.18, y0 + 0.34));
  const rings = [];
  for (let y = y0 + 0.5; y < y1; y += 0.05) {
    const k = (y - y0) % 2.6;
    const ring = k > 2.3 && k < 2.48 ? 0.035 * sin(((k - 2.3) / 0.18) * Math.PI) : 0;
    if (ring > 0.001) rings.push(y);
    pts.push(new THREE.Vector2(0.16 + 0.006 * (1 - (y - y0) / (y1 - y0)) + ring, y));
  }
  pts.push(new THREE.Vector2(0.16, y1));
  pts.push(new THREE.Vector2(0.0, y1 + 0.01));
  const geo = new THREE.LatheGeometry(pts, 40);
  const p = geo.attributes.position, n = p.count;
  const paintA = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = p.getY(i), r = Math.hypot(p.getX(i), p.getZ(i));
    paintA[i * 3] = 0.3;
    paintA[i * 3 + 1] = r > 0.172 && y > y0 + 0.4 ? -0.02 : 0.02;
    paintA[i * 3 + 2] = 1;
    const w = 0.9 + 0.1 * fbm(p.getX(i) * 2, y * 0.8, p.getZ(i) * 2, 71);
    col[i * 3] = w; col[i * 3 + 1] = w * 0.98; col[i * 3 + 2] = w * 0.95;
  }
  geo.setAttribute('aPaint', new THREE.BufferAttribute(paintA, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// ---------------------------------------------------------------- the plinth
const PLINTH_CHIPS = [];
{
  const E = [
    [[-4.3, 0.6, 3.8], [4.3, 0.6, 3.8]], [[-4.3, 0.6, -3.8], [4.3, 0.6, -3.8]], [[4.3, 0.6, -3.8], [4.3, 0.6, 3.8]], [[-4.3, 0.6, -3.8], [-4.3, 0.6, 3.8]],
    [[-4.24, 2.7, 3.74], [4.24, 2.7, 3.74]], [[4.24, 2.7, -3.74], [4.24, 2.7, 3.74]], [[-4.24, 2.7, -3.74], [-4.24, 2.7, 3.74]],
    [[3.9, 0.6, 3.4], [3.9, 2.3, 3.4]], [[-3.9, 0.6, 3.4], [-3.9, 2.3, 3.4]], [[4.3, 0.0, 3.8], [4.3, 0.6, 3.8]], [[-4.3, 0.0, 3.8], [-4.3, 0.6, 3.8]],
    [[-1.55, 3.0, 1.8], [1.55, 3.0, 1.8]],
  ];
  E.forEach(([a, b], i) => PLINTH_CHIPS.push(...chipsAlong(`pchip-${i}`, i === 11 ? 3 : 6, a, b, 0.12, i < 7 ? 0.42 : 0.25, 0.15)));
}
function plinthSDF(x, y, z) {
  const ax = abs(x), az = abs(z);
  let d = rbox(x, y, z, 0, 0.3, 0, 4.3, 0.3, 3.8, 0.05);
  d = min(d, rbox(x, y, z, 0, 1.45, 0, 3.9, 0.9, 3.4, 0.04));
  d = min(d, rbox(x, y, z, 0, 2.3, 0, 3.98, 0.09, 3.48, 0.09)); // torus roll
  {
    const t = clamp01((y - 2.36) / 0.26);
    const fl = 0.32 * t * t;
    d = min(d, max(ax - (3.9 + fl), az - (3.4 + fl), abs(y - 2.49) - 0.13)); // cavetto cornice
  }
  d = min(d, rbox(x, y, z, 0, 2.66, 0, 4.24, 0.04, 3.74, 0.02)); // top slab
  // maat pedestal with its sloped front
  let pd = rbox(x, y, z, 0, 2.85, 0.3, 1.55, 0.16, 1.85, 0.03);
  pd = max(pd, (z - 2.15 + (y - 2.7) * 1.33) * 0.6);
  d = min(d, pd);
  // recessed front panel with a worn incised inscription
  if (z > 3.2 && ax < 3.5 && y > 0.6 && y < 2.3) {
    d = smax(d, -rbox(x, y, z, 0, 1.45, 3.4, 3.35, 0.62, 0.05, 0.01), 0.01);
    if (ax < 3.15 && y > 0.95 && y < 1.95) {
      const gx = 0.5, gy = 0.5;
      const cx = floor(x / gx), cy = floor((y - 0.95) / gy);
      const u = x - (cx + 0.5) * gx, v = y - 0.95 - (cy + 0.5) * gy;
      const k = hash('glyph', cx, cy), k2 = hash('glyph2', cx, cy);
      let g;
      if (k < 0.3) g = max(abs(u) - (0.08 + 0.08 * k2), abs(v) - 0.17);
      else if (k < 0.5) g = sqrt(u * u + v * v) - (0.11 + 0.05 * k2);
      else if (k < 0.7) g = max(abs(u) - 0.18, abs(v) - (0.05 + 0.04 * k2));
      else if (k < 0.85) g = min(max(abs(u) - 0.05, abs(v) - 0.18), max(abs(u) - 0.16, abs(v - 0.1) - 0.05));
      else g = abs(sqrt(u * u + v * v) - 0.12) - 0.04;
      d = smax(d, -max(g, abs(z - 3.36) - 0.06), 0.008);
    }
  }
  d += 0.028 * fbm(x * 0.8, y * 0.8, z * 0.8, 81) + 0.01 * fbm(x * 3.2, y * 3.2, z * 3.2, 82, 2);
  return applyChips(d, x, y, z, PLINTH_CHIPS, 0.04);
}
function plinthPaint(x, y, z, nx, ny, nz, out) {
  out[0] = 1;
  out[1] = 1; out[2] = 1;
  const w = 0.85 + 0.15 * fbm(x * 0.5, y * 0.5, z * 0.5, 91);
  // darker, cooler granite-like plinth; the maat pedestal in the statue's sandstone
  if (y > 2.69) { out[3] = w; out[4] = w * 0.98; out[5] = w * 0.95; }
  else { out[3] = 0.5 * w; out[4] = 0.47 * w; out[5] = 0.46 * w; }
}

// ---------------------------------------------------------------- sand drift against the plinth
function sandDriftGeometry() {
  const g = new THREE.PlaneGeometry(26, 26, 130, 130);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const qx = abs(x) - 4.3, qz = abs(z) - 3.8;
    const out = sqrt(max(qx, 0) ** 2 + max(qz, 0) ** 2) + min(max(qx, qz), 0);
    const th = atan2(z, x);
    const amp = 0.55 + 0.4 * (0.5 + 0.5 * cos(th - 2.4)) + 0.2 * fbm(x * 0.25, 0, z * 0.25, 101);
    const L = 1.6 + 1.2 * (0.5 + 0.5 * cos(th - 2.4));
    let h = out < 0 ? amp : amp * exp(-out / L);
    h += 0.04 * sin(x * 1.7 + z * 0.9 + 2 * fbm(x * 0.3, 1, z * 0.3, 102)) * sstep(0, 1.5, out);
    h *= sstep(12.5, 8, Math.hypot(x, z));
    p.setY(i, max(h, 0) - 0.02);
    uv.setXY(i, x / 4.67, z / 4.67);
  }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- textures and materials
const ROCK = 'assets/third-party/textures/worn_rock_natural_01/worn_rock_natural_01_';
const SAND = 'assets/third-party/textures/aerial_sand/aerial_sand_';
async function loadTex(path, srgb) {
  try {
    const t = await new THREE.TextureLoader().loadAsync(assetUrl(path));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  } catch {
    const t = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1); // never fail the build
    t.needsUpdate = true;
    return t;
  }
}

function glowUniforms() {
  return {
    uInlayGlow: { value: 0 }, uInlayColor: { value: new THREE.Color('#FF9F3A') },
    uVoiceGlow: { value: 0 }, uVoiceColor: { value: new THREE.Color('#5FF2E0') },
    uSand: { value: new THREE.Color('#D9B079') }, uGold: { value: new THREE.Color('#E0A940') },
  };
}
function makeStoneMaterial(maps, shared, { tint = '#FFFFFF', scale = 0.36, normalScale = 0.7 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: tint, roughness: 1, metalness: 0, vertexColors: true, envMapIntensity: 0.8 });
  const u = {
    tDiff: { value: maps.diff }, tNor: { value: maps.nor }, tRough: { value: maps.rough }, tAO: { value: maps.ao }, tDisp: { value: maps.disp },
    uScale: { value: scale }, uNormalScale: { value: normalScale },
    ...shared,
  };
  m.userData.uniforms = u;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
attribute vec3 aPaint;
varying vec3 vPaint; varying vec3 vObjPos; varying vec3 vObjN; varying vec3 vAx; varying vec3 vAy; varying vec3 vAz;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vPaint = aPaint; vObjPos = position; vObjN = normal;
vAx = normalize(normalMatrix * vec3(1.0, 0.0, 0.0)); vAy = normalize(normalMatrix * vec3(0.0, 1.0, 0.0)); vAz = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D tDiff; uniform sampler2D tNor; uniform sampler2D tRough; uniform sampler2D tAO; uniform sampler2D tDisp;
uniform float uScale; uniform float uNormalScale; uniform float uInlayGlow; uniform float uVoiceGlow;
uniform vec3 uInlayColor; uniform vec3 uVoiceColor; uniform vec3 uSand; uniform vec3 uGold;
varying vec3 vPaint; varying vec3 vObjPos; varying vec3 vObjN; varying vec3 vAx; varying vec3 vAy; varying vec3 vAz;
vec3 triW; vec2 tuvX; vec2 tuvY; vec2 tuvZ;
vec4 tri(sampler2D t) { return texture2D(t, tuvX) * triW.x + texture2D(t, tuvY) * triW.y + texture2D(t, tuvZ) * triW.z; }`)
      .replace('#include <map_fragment>', `
vec3 on = normalize(vObjN);
triW = pow(abs(on), vec3(4.0)); triW /= (triW.x + triW.y + triW.z);
vec3 sp = vObjPos * uScale;
tuvX = sp.zy; tuvY = sp.xz + vec2(0.37, 0.61); tuvZ = sp.xy + vec2(0.13, 0.29);
vec3 alb = tri(tDiff).rgb;
float gH = tri(tDisp).r;
float gAO = tri(tAO).r;
float gR = tri(tRough).r;
float macro = texture2D(tDisp, vObjPos.xz * 0.045 + vObjPos.y * 0.03).r;
float sandM = vPaint.x * smoothstep(0.42, 0.85, on.y);
sandM = smoothstep(0.32, 0.6, sandM + (0.5 - gH) * 0.7 + (macro - 0.5) * 0.5);
float fwI = max(fwidth(vPaint.y), 1e-4);
float gGold = 1.0 - smoothstep(-fwI, fwI, vPaint.y);
gGold *= smoothstep(0.1, 0.18, gH + (macro - 0.5) * 0.15);
gGold *= 1.0 - sandM;
diffuseColor.rgb *= alb * (0.72 + 0.28 * gAO);`)
      .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, uSand * (0.85 + 0.3 * gH), sandM);
diffuseColor.rgb = mix(diffuseColor.rgb, uGold * (0.8 + 0.3 * gH), gGold);`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor = mix(mix(roughness * (0.55 + 0.5 * gR), 1.0, sandM), 0.36 + 0.25 * gR, gGold);`)
      .replace('#include <metalnessmap_fragment>', `float metalnessFactor = gGold;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  vec3 nX = texture2D(tNor, tuvX).xyz * 2.0 - 1.0;
  vec3 nY = texture2D(tNor, tuvY).xyz * 2.0 - 1.0;
  vec3 nZ = texture2D(tNor, tuvZ).xyz * 2.0 - 1.0;
  float ns = uNormalScale * (1.0 - 0.75 * max(sandM, gGold));
  nX.xy *= ns; nY.xy *= ns; nZ.xy *= ns;
  nX = vec3(nX.xy + on.zy, abs(nX.z) * on.x);
  nY = vec3(nY.xy + on.xz, abs(nY.z) * on.y);
  nZ = vec3(nZ.xy + on.xy, abs(nZ.z) * on.z);
  vec3 pn = normalize(nX.zyx * triW.x + nY.xzy * triW.y + nZ.xyz * triW.z);
  normal = normalize(pn.x * vAx + pn.y * vAy + pn.z * vAz) * faceDirection;
}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += uInlayColor * uInlayGlow * gGold;
float fwG = max(fwidth(vPaint.z), 1e-4);
float seam = 1.0 - smoothstep(-fwG * 1.5, fwG * 1.5, vPaint.z);
seam += 0.35 * exp(-max(vPaint.z, 0.0) / 0.025);
totalEmissiveRadiance += uVoiceColor * uVoiceGlow * seam;`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
reflectedLight.indirectDiffuse *= mix(gAO, 1.0, 0.3);
reflectedLight.indirectSpecular *= gAO;`);
  };
  m.customProgramCacheKey = () => 'ptah-colossus-stone-v1';
  return m;
}

function radialTexture(stops, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The eye inlay: an almond lens, pointed at the outer corner.
function eyeGeometry(side) {
  const g = new THREE.SphereGeometry(1, 48, 24);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const outer = x * side > 0 ? 1.08 : 0.95;
    y *= 1 - 0.38 * x * x;
    const X = x * outer * 0.205;
    // follow the curve of the face so the outer corner sinks into the socket
    p.setXYZ(i, X, y * 0.092, z * 0.06 - 1.5 * X * X);
  }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- dust that shakes loose when he speaks
const DUST_VERT = `
attribute float aSize; attribute float aThresh; attribute float aFade;
uniform float uVoice; uniform float uPointScale;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPointScale / max(-mv.z, 0.1);
  vA = smoothstep(aThresh, aThresh + 0.18, uVoice) * aFade;
}`;
const DUST_FRAG = `
uniform vec3 uColor; varying float vA;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = dot(q, q);
  if (r > 1.0) discard;
  gl_FragColor = vec4(uColor, vA * (1.0 - r) * (1.0 - r));
  #include <colorspace_fragment>
}`;
function dustPoints(sources, seed) {
  // sources: [{ p: [x,y,z], n: [nx,ny,nz] }]; each spawns a falling stream and a small puff.
  const pos = [], size = [], thr = [], fade = [];
  sources.forEach((s, si) => {
    const [x, y, z] = s.p, [nx, , nz] = s.n;
    const stream = 70;
    const len = 2.5 + 3 * hash(seed, si, 'len');
    for (let k = 0; k < stream; k++) {
      const f = hash(seed, si, k, 'f');
      const drop = 0.05 + len * f * f;
      const spread = 0.05 + 0.35 * f;
      pos.push(x + nx * (0.06 + 0.3 * f) + (hash(seed, si, k, 'x') - 0.5) * spread, y - drop, z + nz * (0.06 + 0.3 * f) + (hash(seed, si, k, 'z') - 0.5) * spread);
      size.push(0.015 + 0.03 * hash(seed, si, k, 's') + 0.025 * f);
      thr.push(0.04 + 0.55 * f * hash(seed, si, 'th') + 0.2 * hash(seed, si, k, 't'));
      fade.push(0.9 * (1 - f * 0.7));
    }
    for (let k = 0; k < 40; k++) {
      const a = hash(seed, si, k, 'pa') * Math.PI * 2, r = 0.08 + 0.4 * hash(seed, si, k, 'pr');
      pos.push(x + nx * 0.1 + cos(a) * r, y + (hash(seed, si, k, 'py') - 0.4) * 0.35, z + nz * 0.1 + sin(a) * r);
      size.push(0.02 + 0.04 * hash(seed, si, k, 'ps'));
      thr.push(0.1 + 0.6 * hash(seed, si, k, 'pt'));
      fade.push(0.22);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  g.setAttribute('aThresh', new THREE.Float32BufferAttribute(thr, 1));
  g.setAttribute('aFade', new THREE.Float32BufferAttribute(fade, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uVoice: { value: 0 }, uPointScale: { value: 540 }, uColor: { value: new THREE.Color('#E8C79A') } },
    vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.onBeforeRender = (renderer, scene, camera) => {
    const h = renderer.getRenderTarget() ? renderer.getRenderTarget().height : renderer.getDrawingBufferSize(new THREE.Vector2()).y;
    mat.uniforms.uPointScale.value = 0.5 * h * camera.projectionMatrix.elements[5];
  };
  return pts;
}
function projectTo(f, x, y, z) {
  const h = 0.01;
  for (let it = 0; it < 8; it++) {
    const d = f(x, y, z);
    const gx = (f(x + h, y, z) - f(x - h, y, z)) / (2 * h), gy = (f(x, y + h, z) - f(x, y - h, z)) / (2 * h), gz = (f(x, y, z + h) - f(x, y, z - h)) / (2 * h);
    const g2 = gx * gx + gy * gy + gz * gz || 1;
    x -= (d * gx) / g2; y -= (d * gy) / g2; z -= (d * gz) / g2;
  }
  const gx = (f(x + h, y, z) - f(x - h, y, z)), gy = (f(x, y + h, z) - f(x, y - h, z)), gz = (f(x, y, z + h) - f(x, y, z - h));
  const l = Math.hypot(gx, gy, gz) || 1;
  return { p: [x, y, z], n: [gx / l, gy / l, gz / l] };
}

// ---------------------------------------------------------------- geometry build (cached per page)
const geoCache = new Map();
function buildGeometry(quality) {
  if (geoCache.has(quality)) return geoCache.get(quality);
  const q = quality === 'draft' ? 1.7 : 1;
  const bodyF = (x, y, z) => bodySDF(x, y - Y0, z);
  const bodyP = (x, y, z, nx, ny, nz, o) => bodyPaint(x, y - Y0, z, nx, ny, nz, o);
  const geos = {
    plinth: polygonize(plinthSDF, [-4.75, -0.3, -4.25, 4.75, 3.15, 4.25], 0.095 * q, plinthPaint),
    bodyLower: polygonize(bodyF, [-3.0, Y0 - 0.1, -2.0, 3.0, Y0 + 13.3, 2.3], 0.1 * q, bodyP),
    bodyUpper: polygonize(bodyF, [-3.2, Y0 + 13.0, -2.0, 3.2, Y0 + 19.1, 2.2], 0.055 * q, bodyP),
    head: polygonize(headSDF, [-1.25, -1.15, -1.4, 1.25, 3.15, 1.5], 0.024 * q, headPaint),
    sceptre: polygonize(sceptreSDF, [-1.25, -1.0, -1.15, 1.25, 3.85, 0.65], 0.03 * q, sceptrePaint),
    staff: staffGeometry(),
    drift: sandDriftGeometry(),
    eyeR: eyeGeometry(-1), eyeL: eyeGeometry(1),
  };
  const dust = {
    body: [
      ...[-1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05].map((a) => projectTo(bodyF, sin(a) * 2.3, Y0 + 16.6 + 0.5 * abs(sin(a)), 1.7 * cos(a))),
      projectTo(bodyF, -2.55, Y0 + 17.2, 0.1), projectTo(bodyF, 2.55, Y0 + 17.2, 0.1),
      ...[-3.2, -1.6, 0, 1.6, 3.2].map((x) => projectTo(plinthSDF, x, 2.62, 3.85)),
    ],
    head: [
      projectTo(headSDF, 0, -0.8, 0.8), projectTo(headSDF, 0.5, 2.27, 0.95), projectTo(headSDF, -0.5, 2.27, 0.95),
      projectTo(headSDF, 1.1, 1.25, 0.0), projectTo(headSDF, -1.1, 1.25, 0.0),
    ],
  };
  const out = { geos, dust };
  geoCache.set(quality, out);
  return out;
}

// ---------------------------------------------------------------- public API
/**
 * createPtahColossus(assets, opts) -> { group, height, handles, setState, materials, triangles }
 * opts.height   target height in scene units (default 24.05 = native, about 30 robots)
 * opts.quality  'high' (default) or 'draft' (coarser mesh, for fast look-dev)
 * opts.eyeColor glow colour of the eyes and the mouth seam (default teal #5FF2E0)
 * opts.drift    false to leave out the sand drift around the plinth (when the set has its own)
 */
export async function createPtahColossus(assets, opts = {}) {
  const { height = NATIVE_HEIGHT, quality = 'high', eyeColor = '#5FF2E0', drift = true } = opts;
  const [diff, nor, rough, ao, disp, sNor, sRough] = await Promise.all([
    loadTex(`${ROCK}diff_2k.jpg`, true), loadTex(`${ROCK}nor_gl_2k.jpg`, false), loadTex(`${ROCK}rough_2k.jpg`, false),
    loadTex(`${ROCK}ao_2k.jpg`, false), loadTex(`${ROCK}disp_2k.jpg`, false),
    loadTex(`${SAND}nor_gl_1k.jpg`, false), loadTex(`${SAND}rough_1k.jpg`, false),
  ]);
  const { geos, dust } = buildGeometry(quality);
  const maps = { diff, nor, rough, ao, disp };
  const shared = glowUniforms();
  const stone = makeStoneMaterial(maps, shared, { tint: '#EBD4B0', scale: 0.42 });
  const fine = makeStoneMaterial(maps, shared, { tint: '#EBD4B0', scale: 1.05, normalScale: 0.55 });
  const granite = makeStoneMaterial(maps, shared, { tint: '#E0C6A6', scale: 0.3, normalScale: 0.9 });
  const eyeCol = new THREE.Color(eyeColor);
  shared.uVoiceColor.value.copy(eyeCol);

  const group = new THREE.Group();
  group.name = 'ptah-colossus';
  const root = new THREE.Group();
  group.add(root);
  const mk = (geo, mat, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name; m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  const plinth = mk(geos.plinth, granite, 'plinth');
  root.add(plinth);
  root.add(mk(geos.bodyLower, stone, 'body-lower'), mk(geos.bodyUpper, stone, 'body-upper'));
  if (drift) {
    const sandMat = new THREE.MeshStandardMaterial({ color: '#E4C08C', roughness: 1, normalMap: sNor, roughnessMap: sRough, normalScale: new THREE.Vector2(0.4, 0.4) });
    const d = mk(geos.drift, sandMat, 'sand-drift');
    d.castShadow = false;
    root.add(d);
  }

  // head on its pivot
  const head = new THREE.Group();
  head.name = 'head-pivot';
  head.position.copy(HEAD_PIVOT);
  head.rotation.order = 'YXZ';
  root.add(head);
  head.add(mk(geos.head, fine, 'head'));
  const eyeMat = new THREE.MeshStandardMaterial({
    color: '#0A0807', roughness: 0.5, metalness: 0.0, envMapIntensity: 0.12, emissive: eyeCol, emissiveIntensity: 0,
    emissiveMap: radialTexture([[0, '#FFFFFF'], [0.35, '#E8FFFC'], [1, '#6A8F8C']], 64),
  });
  const glowTex = radialTexture([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(160,255,245,0.55)'], [0.5, 'rgba(80,230,220,0.12)'], [1, 'rgba(80,230,220,0)']]);
  const eyes = [], flares = [];
  for (const side of [-1, 1]) {
    const e = new THREE.Mesh(side < 0 ? geos.eyeR : geos.eyeL, eyeMat);
    e.name = side < 0 ? 'eye-right' : 'eye-left';
    e.position.set(side * EYE.x, EYE.y, EYE.z);
    e.rotation.y = side * 0.4;
    head.add(e);
    eyes.push(e);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: eyeCol, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    fl.position.set(side * EYE.x, EYE.y, EYE.z + 0.12);
    fl.scale.setScalar(0.9);
    fl.visible = false;
    head.add(fl);
    flares.push(fl);
  }

  // sceptre and hands on the grip pivot
  const sceptre = new THREE.Group();
  sceptre.name = 'sceptre-pivot';
  sceptre.position.copy(GRIP);
  root.add(sceptre);
  sceptre.add(mk(geos.sceptre, fine, 'hands-sceptre'), mk(geos.staff, fine, 'staff'));

  // dust
  const bodyDust = dustPoints(dust.body, 'dust-body');
  const headDust = dustPoints(dust.head, 'dust-head');
  bodyDust.visible = headDust.visible = false;
  root.add(bodyDust);
  head.add(headDust);

  const k = height / NATIVE_HEIGHT;
  group.scale.setScalar(k);
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3(new THREE.Vector3(-4.3 * k, 0, -3.8 * k), new THREE.Vector3(4.3 * k, NATIVE_HEIGHT * k, 3.8 * k));
  const anchors = {
    eyes: new THREE.Vector3(0, HEAD_PIVOT.y + EYE.y, HEAD_PIVOT.z + EYE.z).multiplyScalar(k),
    chest: new THREE.Vector3(0, Y0 + 15.8, 1.6).multiplyScalar(k),
    sceptreTop: new THREE.Vector3(0, GRIP.y + 3.7, GRIP.z).multiplyScalar(k),
    plinthTop: new THREE.Vector3(0, 2.7, 0).multiplyScalar(k),
    plinthFront: new THREE.Vector3(0, 0, 3.8).multiplyScalar(k),
  };
  let triangles = 0;
  root.traverse((o) => { if (o.isMesh) triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });

  const inlay = shared;
  const state = { eyeGlow: 0, headYaw: 0, headPitch: 0, sceptreTilt: 0, voice: 0 };
  function setState(s = {}) {
    Object.assign(state, s);
    const eg = clamp01(state.eyeGlow), v = clamp01(state.voice);
    head.rotation.y = state.headYaw;
    head.rotation.x = state.headPitch;
    sceptre.rotation.z = -state.sceptreTilt;
    sceptre.rotation.x = 0.12 * abs(state.sceptreTilt);
    eyeMat.emissiveIntensity = eg * (2.4 + 2.2 * v);
    eyeMat.color.setRGB(0.08 * (1 - eg) + 0.03, 0.07 * (1 - eg) + 0.03, 0.06 * (1 - eg) + 0.03);
    for (const fl of flares) {
      fl.visible = eg > 0.01;
      fl.material.opacity = eg * (0.5 + 0.5 * v);
      fl.scale.setScalar(0.75 + 0.35 * eg + 0.35 * v);
    }
    inlay.uInlayGlow.value = 0.06 * eg + 0.4 * v * (0.4 + 0.6 * eg);
    inlay.uVoiceGlow.value = 1.6 * v * eg;
    bodyDust.visible = headDust.visible = v > 0.01;
    bodyDust.material.uniforms.uVoice.value = v;
    headDust.material.uniforms.uVoice.value = v;
  }
  setState();

  return {
    group,
    height: NATIVE_HEIGHT * k,
    handles: { head, eyes, eyeMaterial: eyeMat, eyeFlares: flares, sceptre, sceptreArm: sceptre, chestGlow: inlay.uInlayGlow, plinth, bounds, anchors },
    setState,
    getState: () => ({ ...state }),
    materials: { stone, fine, granite, eye: eyeMat },
    triangles: Math.round(triangles),
  };
}

// Broken fragments of stone for set dressing near the statue (same stone and shader).
export function createRubble(colossus, seed = 0, size = 1) {
  const s = size;
  const chips = chipsAlong(`rub-${seed}`, 6, [-s, s * 0.5, -s], [s, s * 0.5, s], 0.15 * s, 0.45 * s, s);
  const f = (x, y, z) => {
    let d = rbox(x, y, z, 0, s * 0.42, 0, s * (0.9 + 0.3 * hash(seed, 'w')), s * 0.42, s * (0.7 + 0.3 * hash(seed, 'd')), 0.08 * s);
    d += 0.06 * s * fbm(x / s * 1.2, y / s * 1.2, z / s * 1.2, 300 + seed);
    d = max(d, -y);
    return applyChips(d, x, y, z, chips, 0.05 * s);
  };
  const geo = polygonize(f, [-1.5 * s, -0.05, -1.3 * s, 1.5 * s, s, 1.3 * s], 0.07 * s, (x, y, z, nx, ny, nz, o) => {
    o[0] = 1; o[1] = 1; o[2] = 1; const w = 0.85 + 0.15 * fbm(x, y, z, 400 + seed); o[3] = w; o[4] = w * 0.98; o[5] = w * 0.95;
  });
  const m = new THREE.Mesh(geo, colossus.materials.stone);
  m.castShadow = m.receiveShadow = true;
  return m;
}
