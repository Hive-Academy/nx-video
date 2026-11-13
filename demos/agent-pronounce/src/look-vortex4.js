// Episode 6, direction v4: the vortex between the workspace and the desert (look-dev).
// The floor falls out from under the two office chairs and both bodied robots tumble, seated,
// down a swirling funnel of sand and hieroglyph-carved stone toward the desert below.
//
//   buildVortex4Look(assets, renderer, { shot: 'a'|'b'|'c'|'d', t })
//     -> { scene, camera, film, handles, update(t), info }
//
// Scene-local time t (s): 0 = the floor falls (the end of the white-out), LAND = 2.6 = the seats
// touch the sand (SPEC: vortex runs 3.5 s, `land` at 2.6 s). update(t) is a pure function of t.
//
// Frame: the chairs stay near the origin and the world streams past them. The funnel axis is
// +Y; the funnel (walls, tablets, sand) rises at FALL m/s, so its top (the hole the floor left)
// is at chair level at t = 0 and its bottom (the desert sand) reaches the chair feet at LAND.
// Metres at the workspace scale (robot head radius 0.15, chair 0.74 m tall).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { tex, hdri, canvas2d, canvasTex } from './craft.js';
import { environment, loungeChair, practical } from './look-kit.js';
import { createBodiedRobot, BODY } from './robot-body.js';
import { pbr } from './desert4-props.js';
import { hash, hashRange } from './util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
export const LAND = 2.6;
export const FALL = 8.0; // m/s the world rises past the chairs
const TOP0 = 0.0; // funnel top (the floor hole) at t = 0
const LEN = FALL * LAND; // funnel length: its bottom reaches y = 0 at LAND
export const BODY_SIZE = 0.15;
const CHAIR_H = 1.17 * 0.63;
const SKY = 'hdri/mpumalanga_veld_puresky_2k.hdr'; // the desert set's sky (look-desert4)

// The desert set's palette (look-desert4: SAND #D8C2A0, paving #E6BE90 / #B98E66, sun #FFC48A)
export const PAL = {
  deep: '#3B2416', umber: '#6E4528', mid: '#B98E66', sand: '#D8C2A0', pale: '#E6BE90', hi: '#FFE2B8', sun: '#FFC48A',
};
const C3 = (h) => new THREE.Color(h);

// Stills: scene time and a camera relative to the chairs' centre.
export const SHOTS = {
  // a: just after the floor falls. Low, looking up past the chairs into the bright hole they fell through.
  a: { t: 0.32, pos: [0.4, 0.7, 2.05], target: [0.0, 0.62, -0.5], focal: 19, subject: [0, 0.35, 0], aperture: 0.003, maxblur: 0.006 },
  // b: mid-tumble wide. The funnel, the tablets and both chairs; the desert glow far below.
  b: { t: 1.25, pos: [1.05, 0.95, 1.6], target: [-0.05, -0.05, 0.0], focal: 17, subject: [0, 0.35, 0], aperture: 0.0025, maxblur: 0.006 },
  // c: mid-tumble closer, on the chairs and the faces.
  c: { t: 1.85, pos: [-0.05, 0.7, 1.85], target: [0.05, 0.3, 0.0], focal: 24, subject: [0, 0.55, 0.2], aperture: 0.006, maxblur: 0.008 },
  // d: the moment before landing. High, looking down past the chairs at the sand rushing up.
  d: { t: 2.45, pos: [-1.55, 0.3, 1.35], target: [0.0, -0.3, 0.0], focal: 18, subject: [0, 0.3, 0], aperture: 0.003, maxblur: 0.006 },
};

// ------------------------------------------------------------------ hieroglyphs
// The funnel's glyph bands: columns of Egyptian hieroglyphs (wedjat eye, ankh, vulture, reed,
// water, cartouche, djed, sun disc, feather, mouth, bread) drawn on canvas. A data texture, not
// colour: BG 0.61 (no glyph), FG 0.95 (the glyph, carved), RIM 0.48 (the lit edge around each
// glyph and the column rules). The shader thresholds FG > 0.62 and RIM 0.42..0.56.
// One tile maps to ~1.1 m x 3.7 m of wall, so the glyphs are drawn squashed by SQ to read square.
function hieroglyphTexture(seed) {
  const W = 512, H = 1024, SQ = 0.9, COL = W / 2;
  const [c, x] = canvas2d(W, H);
  const BG = '#9C9C9C', FG = '#F2F2F2', RIM = '#7A7A7A';
  x.fillStyle = BG; x.fillRect(0, 0, W, H);
  x.lineCap = 'round'; x.lineJoin = 'round';
  // in the rim pass every shape is also stroked wide in RIM; the FG pass draws on top
  let rim = false;
  const F = () => { x.fill(); if (rim) x.stroke(); };
  const S = () => x.stroke();
  const G = {
    ankh(s) {
      x.beginPath(); x.ellipse(0, -0.24 * s, 0.15 * s, 0.2 * s, 0, 0, TAU); S();
      x.beginPath(); x.rect(-0.36 * s, -0.04 * s, 0.72 * s, 0.11 * s); F();
      x.beginPath(); x.rect(-0.065 * s, -0.04 * s, 0.13 * s, 0.5 * s); F();
    },
    eye(s) { // wedjat: brow, almond eye, pupil, the drop and the spiral cheek mark
      x.beginPath(); x.moveTo(-0.44 * s, -0.24 * s); x.quadraticCurveTo(0, -0.42 * s, 0.46 * s, -0.22 * s); x.lineTo(0.46 * s, -0.15 * s); x.quadraticCurveTo(0, -0.33 * s, -0.44 * s, -0.17 * s); x.closePath(); F();
      x.beginPath(); x.moveTo(-0.42 * s, 0); x.quadraticCurveTo(0, -0.26 * s, 0.44 * s, 0); x.quadraticCurveTo(0, 0.17 * s, -0.42 * s, 0); S();
      x.beginPath(); x.arc(0.02 * s, -0.03 * s, 0.1 * s, 0, TAU); F();
      x.beginPath(); x.moveTo(-0.08 * s, 0.1 * s); x.lineTo(-0.1 * s, 0.44 * s); S();
      x.beginPath(); x.moveTo(0.1 * s, 0.1 * s); x.quadraticCurveTo(0.2 * s, 0.4 * s, 0.38 * s, 0.38 * s); x.arc(0.32 * s, 0.3 * s, 0.08 * s, 0.9, -1.8, true); S();
    },
    bird(s) { // vulture in profile, facing left
      x.beginPath(); x.ellipse(0.02 * s, -0.02 * s, 0.3 * s, 0.17 * s, -0.35, 0, TAU); F();
      x.beginPath(); x.arc(-0.24 * s, -0.3 * s, 0.1 * s, 0, TAU); F();
      x.beginPath(); x.moveTo(-0.32 * s, -0.33 * s); x.lineTo(-0.45 * s, -0.24 * s); x.lineTo(-0.3 * s, -0.25 * s); x.closePath(); F();
      x.beginPath(); x.moveTo(-0.2 * s, -0.2 * s); x.lineTo(-0.12 * s, -0.1 * s); S();
      x.beginPath(); x.moveTo(0.22 * s, 0.04 * s); x.lineTo(0.46 * s, 0.24 * s); x.lineTo(0.34 * s, 0.28 * s); x.lineTo(0.14 * s, 0.12 * s); x.closePath(); F();
      x.beginPath(); x.moveTo(-0.04 * s, 0.12 * s); x.lineTo(-0.06 * s, 0.44 * s); x.lineTo(-0.18 * s, 0.46 * s); x.moveTo(0.08 * s, 0.12 * s); x.lineTo(0.08 * s, 0.44 * s); x.lineTo(-0.04 * s, 0.46 * s); S();
    },
    reed(s) { // flowering reed
      x.beginPath(); x.moveTo(0, 0.46 * s); x.lineTo(0, -0.08 * s); S();
      x.beginPath(); x.moveTo(-0.02 * s, -0.06 * s); x.quadraticCurveTo(-0.12 * s, -0.36 * s, 0.1 * s, -0.48 * s); x.quadraticCurveTo(0.06 * s, -0.24 * s, 0.1 * s, -0.08 * s); x.closePath(); F();
      x.beginPath(); x.moveTo(0, 0.12 * s); x.quadraticCurveTo(0.16 * s, 0.06 * s, 0.2 * s, -0.1 * s); S();
    },
    water(s) { // three ripples
      for (let r = -1; r <= 1; r++) { x.beginPath(); x.moveTo(-0.44 * s, r * 0.24 * s); for (let j = 1; j <= 8; j++) x.lineTo(-0.44 * s + j * 0.11 * s, r * 0.24 * s + (j % 2 ? -0.07 : 0.07) * s); S(); }
    },
    djed(s) {
      x.beginPath(); x.rect(-0.09 * s, -0.3 * s, 0.18 * s, 0.78 * s); F();
      for (let i = 0; i < 4; i++) { x.beginPath(); x.rect(-0.3 * s, -0.46 * s + i * 0.12 * s, 0.6 * s, 0.07 * s); F(); }
      x.beginPath(); x.rect(-0.22 * s, 0.4 * s, 0.44 * s, 0.08 * s); F();
    },
    sun(s) { x.beginPath(); x.arc(0, 0, 0.3 * s, 0, TAU); S(); x.beginPath(); x.arc(0, 0, 0.08 * s, 0, TAU); F(); },
    feather(s) { // maat
      x.beginPath(); x.moveTo(0.04 * s, 0.46 * s); x.quadraticCurveTo(-0.12 * s, 0, 0.0, -0.4 * s); x.quadraticCurveTo(0.26 * s, -0.5 * s, 0.2 * s, -0.3 * s); x.quadraticCurveTo(0.1 * s, 0, 0.1 * s, 0.46 * s); x.closePath(); F();
    },
    mouth(s) {
      x.beginPath(); x.ellipse(0, 0, 0.4 * s, 0.12 * s, 0, 0, TAU); F();
      if (!rim) { x.save(); x.strokeStyle = BG; x.lineWidth = 0.035 * s; x.beginPath(); x.moveTo(-0.3 * s, 0); x.lineTo(0.3 * s, 0); S(); x.restore(); }
    },
    bread(s) { x.beginPath(); x.moveTo(-0.3 * s, 0.12 * s); x.arc(0, 0.12 * s, 0.3 * s, Math.PI, 0); x.closePath(); F(); },
  };
  const NAMES = ['ankh', 'eye', 'bird', 'reed', 'water', 'djed', 'sun', 'feather', 'bird', 'eye', 'ankh', 'reed'];
  function glyph(name, cx, cy, s) {
    for (const pass of [true, false]) {
      rim = pass;
      x.save(); x.translate(cx, cy); x.scale(1, SQ);
      x.fillStyle = pass ? RIM : FG; x.strokeStyle = pass ? RIM : FG;
      x.lineWidth = 0.09 * s + (pass ? 16 : 0);
      G[name](s);
      x.restore();
    }
  }
  // column rules, continuous so the tile wraps vertically
  x.fillStyle = RIM;
  for (const cx of [0, COL, W]) x.fillRect(cx - 5, 0, 10, H);
  for (let col = 0; col < 2; col++) {
    const cx = col * COL + COL / 2;
    const s = 196, step = s * SQ + 22;
    let y = 24, i = 0;
    while (y + step < H - 12) {
      const r = hash(seed, col, i, 'k');
      if (r < 0.2 && y + 3 * step < H - 12) {
        // cartouche: a royal-name ring with its tie bar, three small signs inside
        const h = 3 * step - 20;
        for (const pass of [true, false]) {
          x.save(); x.strokeStyle = pass ? RIM : FG; x.lineWidth = pass ? 30 : 13;
          x.beginPath(); x.roundRect(cx - 92, y + 6, 184, h - 26, 90 * SQ); x.stroke();
          x.beginPath(); x.moveTo(cx - 70, y + h - 6); x.lineTo(cx + 70, y + h - 6); x.stroke();
          x.restore();
        }
        const inner = ['sun', 'feather', 'water', 'reed', 'bird', 'ankh'];
        for (let j = 0; j < 3; j++) glyph(inner[Math.floor(hash(seed, col, i, j, 'in') * inner.length)], cx, y + 20 + (j + 0.5) * (h - 46) / 3, 118);
        y += 3 * step; i++;
        continue;
      }
      if (r < 0.32) { glyph('mouth', cx - 54, y + step * 0.5, 100); glyph('bread', cx + 54, y + step * 0.5, 100); } // a pair of small signs
      else glyph(NAMES[Math.floor(hash(seed, col, i, 'g') * NAMES.length)], cx, y + step * 0.5, s);
      y += step; i++;
    }
  }
  return canvasTex(c, { srgb: false });
}

// The animated camera: the four approved stills are keys, plus the push in out of the storm (t 0),
// the landing (LAND) and the settle (3.5). Offsets are relative to the chairs' centre; a Catmull-Rom
// spline through the keys, focal / roll / aperture eased between them. roll = dutch (rad).
export const CAM_KEYS = [
  { t: 0.0, pos: [0.6, 1.0, 2.95], target: [0.0, 0.6, -0.5], focal: 17, roll: 0.16, subject: [0, 0.35, 0], aperture: 0.002, maxblur: 0.006 },
  { ...SHOTS.a, roll: 0.12 },
  { ...SHOTS.b, roll: -0.1 },
  { ...SHOTS.c, roll: 0.0 },
  { ...SHOTS.d, roll: 0.0 },
  { t: LAND, pos: [-1.5, 0.42, 1.5], target: [0.0, -0.12, 0.0], focal: 18, roll: 0.0, subject: [0, 0.3, 0], aperture: 0.003, maxblur: 0.006 },
  { t: 3.5, pos: [-1.85, 0.62, 2.25], target: [0.05, 0.42, 0.0], focal: 18, roll: 0.0, subject: [0, 0.35, 0], aperture: 0.003, maxblur: 0.006 },
];
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const catmull = (p0, p1, p2, p3, u) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
function keyAt(tt) {
  const K = CAM_KEYS;
  let i = 0;
  while (i < K.length - 2 && tt > K[i + 1].t) i++;
  const a = K[Math.max(0, i - 1)], b = K[i], c = K[i + 1], d = K[Math.min(K.length - 1, i + 2)];
  const u = clamp01((tt - b.t) / (c.t - b.t));
  const sm = u * u * (3 - 2 * u);
  const v3 = (k) => [0, 1, 2].map((j) => catmull(a[k][j], b[k][j], c[k][j], d[k][j], u));
  const lin = (k) => b[k] + (c[k] - b[k]) * sm;
  return { pos: v3('pos'), target: v3('target'), subject: v3('subject'), focal: lin('focal'), roll: lin('roll'), aperture: lin('aperture'), maxblur: lin('maxblur') };
}

// ------------------------------------------------------------------ shader chunks
const NOISE = /* glsl */`
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
  float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
`;

// A funnel shell: helical sand streaks, carved glyph bands riding the flow, bright gaps where the
// desert light leaks through, a white rim at the top (the office white-out) and a gold glow toward the
// desert end. Colours are linear HDR; the film chain tone-maps.
function funnelMaterial({ glyphTex, opacity = 1, twist = 0.08, spin = 0.12, scroll = 0.9, seed = 1, glyph = 0.8, carved = true, leak = 1, density = 1, transparent = false }) {
  return new THREE.ShaderMaterial({
    transparent, depthWrite: !transparent, side: THREE.DoubleSide, fog: false,
    uniforms: {
      uT: { value: 0 }, uTop: { value: 0 }, uLen: { value: LEN }, uOpacity: { value: opacity }, uTwist: { value: twist },
      uSpin: { value: spin }, uScroll: { value: scroll }, uSeed: { value: seed }, uGlyphAmt: { value: glyph }, uCarved: { value: carved ? 1 : 0 },
      uLeak: { value: leak }, uDensity: { value: density }, uWhite: { value: 1 }, uGlyph: { value: glyphTex },
      cDeep: { value: C3(PAL.deep) }, cUmber: { value: C3(PAL.umber) }, cMid: { value: C3(PAL.mid) }, cSand: { value: C3(PAL.sand) },
      cHi: { value: C3(PAL.hi) }, cSun: { value: C3(PAL.sun) },
    },
    vertexShader: /* glsl */`
      varying float vA; varying float vY; varying vec3 vW; varying vec3 vN;
      void main(){
        vA = atan(position.z, position.x) / 6.2831853 + 0.5;
        vY = position.y;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uT, uTop, uLen, uOpacity, uTwist, uSpin, uScroll, uSeed, uGlyphAmt, uCarved, uLeak, uDensity, uWhite;
      uniform sampler2D uGlyph;
      uniform vec3 cDeep, cUmber, cMid, cSand, cHi, cSun;
      varying float vA; varying float vY; varying vec3 vW; varying vec3 vN;
      ${NOISE}
      void main(){
        // depth along the funnel: 0 at the top hole, 1 at the desert end
        float d01 = clamp(-vY / uLen, 0.0, 1.0);
        // helical flow coordinates: u across the streaks, v along them
        float u = vA + vY * uTwist + uT * uSpin + uSeed * 0.37;
        float v = vY * 0.18 + uT * uScroll;
        vec2 q = vec2(u * 9.0, v);
        float warp = fbm(q * vec2(1.0, 0.6) + uSeed);
        float streak = fbm(vec2(u * 46.0 + warp * 3.0, v * 0.9 + warp));
        float fine = fbm(vec2(u * 190.0 + warp * 6.0, v * 3.5 + warp * 2.0));
        float body = fbm(vec2(u * 7.0 + warp * 1.5, v * 0.45 - uSeed));
        float dens = smoothstep(0.28, 0.72, body * 0.65 + streak * 0.55) * uDensity;
        // colour: deep umber in the folds, sand on the crests, pale highlights on the fine streaks
        vec3 col = mix(cDeep * 0.6, cUmber, smoothstep(0.25, 0.6, body));
        col = mix(col, cMid, smoothstep(0.5, 0.82, streak));
        col = mix(col, cSand, smoothstep(0.66, 0.92, streak * 0.7 + body * 0.4));
        col *= 0.72 + 0.56 * fine; // grain: sheets of sand, not paint
        col += cHi * pow(smoothstep(0.64, 0.92, fine * 0.5 + streak * 0.6), 3.0) * 0.9;
        // carved glyph bands riding the flow (the relief texture: light glyphs on mid grey)
        float band = smoothstep(0.4, 0.5, fbm(vec2(u * 4.0, v * 0.3 + uSeed * 2.0)));
        vec2 guv = vec2(fract(u * 16.0), fract(v * 1.0));
        float g = texture2D(uGlyph, guv).r;
        float glyphM = smoothstep(0.62, 0.78, g) * band * uGlyphAmt;
        float rimM = smoothstep(0.42, 0.5, g) * (1.0 - smoothstep(0.5, 0.56, g)) * band * uGlyphAmt;
        vec3 carvedC = mix(cDeep * 0.45, cSun * 2.2, 1.0 - uCarved);
        col = mix(col, carvedC, glyphM * (0.6 + 0.4 * fine));
        col += cSun * rimM * 0.7;
        // light leaking through thin gaps in the storm (the desert sun behind it), stronger with depth
        float gap = 1.0 - smoothstep(0.2, 0.36, body + streak * 0.22);
        vec3 leakC = cSun * (3.0 + 6.0 * d01) * gap * uLeak * (0.6 + 0.6 * fine);
        col = col * (0.42 + 0.7 * d01) + leakC;
        // the top hole's white rim (the white-out), fading as the hole recedes
        float top = smoothstep(-2.5, 0.0, vY) * uWhite;
        col = mix(col, vec3(3.0, 2.15, 1.25), top * 0.8);
        // the desert end glows gold
        col += cSun * smoothstep(0.82, 1.0, d01) * 3.0;
        float a = uOpacity * mix(dens, 1.0, step(0.999, uOpacity));
        a = clamp(a + glyphM * uOpacity * 0.8 + gap * uLeak * 0.25 * uOpacity, 0.0, 1.0);
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// Funnel shell geometry: an open tube along y from 0 (top) to -LEN, flaring at both ends, with a
// slow lobed wobble so it reads as a storm, not a pipe.
function funnelGeometry(r, seed) {
  const g = new THREE.CylinderGeometry(r, r, LEN + 4, 160, 220, true);
  g.translate(0, -LEN / 2 + 1, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const d = -y / LEN;
    const flare = 1 + 0.55 * Math.exp(-Math.max(0, -y) / 1.6) + 1.6 * Math.pow(THREE.MathUtils.clamp(d, 0, 1.2), 4);
    const lobe = 1 + 0.07 * Math.sin(a * 3 + y * 0.35 + seed) + 0.04 * Math.sin(a * 7 - y * 0.6 + seed * 2);
    const k = flare * lobe;
    p.setX(i, Math.cos(a) * r * k);
    p.setZ(i, Math.sin(a) * r * k);
  }
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------ particles
// Motion-streaked sand: instanced quads stretched along each grain's screen-space velocity.
// Per instance: a0 (angle), r (radius), y0, k (speed factor), s (size), rnd. The grain orbits the axis
// and rises with the funnel at FALL * k; y wraps inside [lo, hi]. Shutter = streak length in seconds.
function sandStreaks(count, { seed, rMin, rMax, lo, hi, size = [0.004, 0.012], rise = [0.6, 1.0], spin = [0.8, 1.6], color = PAL.hi, opacity = 0.9, shutter = 1 / 60, additive = true, soft = 0.5 }) {
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  const A = new Float32Array(count * 4), B = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    A[i * 4] = hash(seed, i, 'a') * TAU;
    A[i * 4 + 1] = Math.sqrt(hashRange(rMin * rMin, rMax * rMax, seed, i, 'r'));
    A[i * 4 + 2] = hashRange(lo, hi, seed, i, 'y');
    A[i * 4 + 3] = hashRange(rise[0], rise[1], seed, i, 'k');
    B[i * 4] = hashRange(size[0], size[1], seed, i, 's');
    B[i * 4 + 1] = hashRange(spin[0], spin[1], seed, i, 'w') * (hash(seed, i, 'dir') < 0.08 ? -0.6 : 1);
    B[i * 4 + 2] = hash(seed, i, 'c');
    B[i * 4 + 3] = hash(seed, i, 'o');
  }
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4));
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = count;
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uT: { value: 0 }, uLo: { value: lo }, uHi: { value: hi }, uFall: { value: FALL }, uShutter: { value: shutter },
      uColor: { value: C3(color) }, uColor2: { value: C3(PAL.sun) }, uOpacity: { value: opacity }, uSoft: { value: soft }, uRes: { value: new THREE.Vector2(1920, 1080) } },
    vertexShader: /* glsl */`
      attribute vec4 aA; attribute vec4 aB;
      uniform float uT, uLo, uHi, uFall, uShutter; uniform vec2 uRes;
      varying vec2 vUv; varying float vC; varying float vO;
      vec3 at(float t){
        float ang = aA.x + aB.y * t / max(aA.y, 0.3);
        float span = uHi - uLo;
        float y = uLo + mod(aA.z - uLo + uFall * aA.w * t, span);
        return vec3(cos(ang) * aA.y, y, sin(ang) * aA.y);
      }
      void main(){
        vec3 p1 = at(uT), p0 = at(uT - uShutter);
        if (distance(p1, p0) > 2.0) p0 = p1 - vec3(0.0, 0.01, 0.0); // across the wrap
        vec4 c1 = projectionMatrix * viewMatrix * vec4(p1, 1.0);
        vec4 c0 = projectionMatrix * viewMatrix * vec4(p0, 1.0);
        vec2 s1 = c1.xy / c1.w * uRes * 0.5, s0 = c0.xy / c0.w * uRes * 0.5;
        vec2 dir = s1 - s0; float len = length(dir);
        dir = len > 1e-3 ? dir / len : vec2(0.0, 1.0);
        vec2 nrm = vec2(-dir.y, dir.x);
        float w = max(aB.x * uRes.y * projectionMatrix[1][1] / c1.w * 0.5, 1.1);
        vec2 mid = (s1 + s0) * 0.5;
        vec2 sp = mid + dir * position.y * (len + w) + nrm * position.x * w;
        gl_Position = vec4(sp / (uRes * 0.5) * c1.w, c1.z, c1.w);
        vUv = uv; vC = aB.z; vO = aB.w;
        if (c1.w < 0.05 || c0.w < 0.05) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor, uColor2; uniform float uOpacity, uSoft;
      varying vec2 vUv; varying float vC; varying float vO;
      void main(){
        vec2 d = vUv - 0.5;
        float a = 1.0 - smoothstep(0.5 - uSoft * 0.5, 0.5, length(d * vec2(1.0, 0.9)) );
        vec3 c = mix(uColor, uColor2, vC);
        gl_FragColor = vec4(c, a * uOpacity * (0.45 + 0.55 * vO));
      }`,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return mesh;
}

// ------------------------------------------------------------------ props
// Hieroglyph tablets: sandstone slabs with carved glyph columns (bump from the desert relief
// texture), torn from the walls and orbiting with the storm. Box UVs are 0..1 per face.
// Carved glyph map for a tablet face: white stone, the glyphs cut dark (used as AO and bump).
function carvedTexture(seed) {
  const [c, x] = canvas2d(512, 768);
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 512, 768);
  x.strokeStyle = '#2A2A2A'; x.fillStyle = '#2A2A2A'; x.lineCap = 'round'; x.lineJoin = 'round';
  // register lines between the columns, as on a temple wall
  x.lineWidth = 6;
  for (const cx of [20, 256, 492]) { x.beginPath(); x.moveTo(cx, 16); x.lineTo(cx, 752); x.stroke(); }
  for (let col = 0; col < 2; col++) {
    let y = 40;
    while (y < 700) {
      const k = Math.floor(hash(seed, col, y) * 7), s = hashRange(70, 110, seed, col, y, 's');
      const X = 138 + col * 236, Y = y + s / 2;
      x.save(); x.translate(X, Y); x.lineWidth = s * 0.13; x.beginPath();
      if (k === 0) { x.arc(0, -s * 0.2, s * 0.2, 0, TAU); x.moveTo(0, 0); x.lineTo(0, s * 0.45); x.moveTo(-s * 0.3, s * 0.08); x.lineTo(s * 0.3, s * 0.08); x.stroke(); }
      else if (k === 1) { x.ellipse(0, 0, s * 0.42, s * 0.2, 0, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, s * 0.1, 0, TAU); x.fill(); x.beginPath(); x.moveTo(-s * 0.1, s * 0.2); x.quadraticCurveTo(-s * 0.2, s * 0.45, s * 0.1, s * 0.48); x.stroke(); }
      else if (k === 2) { for (let i = 0; i < 4; i++) x.fillRect(-s * 0.36, -s * 0.42 + i * s * 0.2, s * 0.72, s * 0.08); x.fillRect(-s * 0.08, -s * 0.45, s * 0.16, s * 0.92); }
      else if (k === 3) { x.moveTo(0, s * 0.45); x.lineTo(0, -s * 0.35); x.quadraticCurveTo(s * 0.32, -s * 0.55, s * 0.08, -s * 0.15); x.stroke(); }
      else if (k === 4) { for (let i = -1; i <= 1; i++) { x.moveTo(-s * 0.42, i * s * 0.2); for (let j = 0; j <= 6; j++) x.lineTo(-s * 0.42 + j * s * 0.14, i * s * 0.2 + (j % 2 ? -1 : 1) * s * 0.06); } x.stroke(); }
      else if (k === 5) { x.moveTo(-s * 0.36, s * 0.4); x.lineTo(0, -s * 0.4); x.lineTo(s * 0.36, s * 0.4); x.closePath(); x.stroke(); }
      else { x.arc(0, 0, s * 0.3, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, s * 0.08, 0, TAU); x.fill(); }
      x.restore();
      y += s + 26;
    }
  }
  return canvasTex(c, { srgb: false });
}
function glyphTablets(count, seed) {
  const mats = [0, 1, 2].map((k) => {
    const m = pbr('old_sandstone_02', { color: ['#D9C4A2', '#CDB48E', '#E2D0B2'][k], normal: 0.9, env: 0.5 });
    const carved = carvedTexture(seed * 10 + k);
    m.aoMap = carved; m.aoMapIntensity = 0.85;
    m.bumpMap = carved; m.bumpScale = 3;
    m.roughness = 1; m.roughnessMap = null; m.map = null; m.needsUpdate = true;
    return m;
  });
  const out = [];
  for (let i = 0; i < count; i++) {
    const w = hashRange(0.3, 0.75, seed, i, 'w'), h = w * hashRange(1.2, 1.9, seed, i, 'h'), d = hashRange(0.05, 0.12, seed, i, 'd');
    const geo = new RoundedBoxGeometry(w, h, d, 2, 0.015);
    const m = new THREE.Mesh(geo, mats[i % 3]);
    m.castShadow = m.receiveShadow = true;
    m.userData.p = {
      a0: hash(seed, i, 'a') * TAU, r: hashRange(1.55, 3.0, seed, i, 'r'), y0: hashRange(-14, 6, seed, i, 'y'),
      k: hashRange(0.35, 0.75, seed, i, 'k'), w: hashRange(0.35, 0.8, seed, i, 'om'),
      rx: hashRange(-2, 2, seed, i, 'rx'), ry: hashRange(-2, 2, seed, i, 'ry'), rz: hashRange(-2, 2, seed, i, 'rz'), ph: hash(seed, i, 'ph') * TAU,
    };
    out.push(m);
  }
  return out;
}
// Parquet planks from the workspace floor that fell with the chairs (fade into the storm by ~1.2 s).
function floorShards(count, seed) {
  const map = tex('textures/workspace/herringbone_parquet_diff_2k.jpg');
  const mat = new THREE.MeshStandardMaterial({ map, color: '#C8B6A2', roughness: 0.8, envMapIntensity: 0.3 });
  const out = [];
  for (let i = 0; i < count; i++) {
    const w = hashRange(0.12, 0.42, seed, i, 'w'), l = hashRange(0.25, 0.8, seed, i, 'l');
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.022, l), mat);
    m.castShadow = true;
    const a = hash(seed, i, 'a') * TAU, r = hashRange(0.5, 2.2, seed, i, 'r');
    m.userData.p = { a, r, out: hashRange(0.3, 1.1, seed, i, 'o'), up: hashRange(0.15, 0.9, seed, i, 'u'), y0: hashRange(-0.6, 0.4, seed, i, 'y'),
      rx: hashRange(-4, 4, seed, i, 'rx'), rz: hashRange(-4, 4, seed, i, 'rz') };
    out.push(m);
  }
  return out;
}

// Dust skirt: an open cone of wind-blown sand over the desert floor, dense at the ground and
// fading upward; the near side is cut so the camera sees through to the sand.
function dustMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: { uT: { value: 0 }, cA: { value: C3(PAL.sand) }, cB: { value: C3(PAL.sun) } },
    vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform float uT; uniform vec3 cA, cB; varying vec2 vUv; varying vec3 vW; ${NOISE}
      void main(){
        float a = vUv.x * 6.2831853;
        vec2 q = vec2(vUv.x * 14.0 + uT * 0.9, vUv.y * 3.0 - uT * 1.6);
        float n = fbm(q) * 0.7 + fbm(q * 2.7 + 3.1) * 0.5;
        // vUv.y is 0 at the ground and 1 at the top of the skirt
        float alpha = smoothstep(0.35, 0.9, n) * smoothstep(1.0, 0.0, vUv.y) * smoothstep(0.0, 0.08, vUv.y) * 0.85;
        vec3 col = mix(cA, cB * 1.8, smoothstep(0.5, 1.1, n));
        gl_FragColor = vec4(col, alpha);
      }`,
  });
}

const ARM_RAISE = -1.6, ARM_SPLAY = 0.55;
const SUN_BELOW = new THREE.Vector3(1.5, -6, 2.5), SUN_ABOVE = new THREE.Vector3(4.5, 3.2, -1.5);

// ------------------------------------------------------------------ build
export async function buildVortex4Look(assets, renderer, { shot = 'b', t = null } = {}) {
  const S = SHOTS[shot] || SHOTS.b;
  const T = t ?? S.t;
  const scene = new THREE.Scene();
  const handles = { chairs: [], robots: [], tablets: [], shards: [], shells: [], sand: [] };

  // image light: the desert sky (dim), so the shells and the chair leather pick up its warmth
  const sky = await hdri(SKY);
  environment(renderer, scene, sky.tex, { intensity: 0.28, rotation: 0, background: null });
  scene.background = C3('#1E120A');
  scene.fog = new THREE.FogExp2('#4A2E1C', 0.035);

  // ---------------------------------------------------------------- the funnel
  const glyphTex = hieroglyphTexture(61);
  glyphTex.wrapS = glyphTex.wrapT = THREE.RepeatWrapping;
  const funnel = new THREE.Group();
  scene.add(funnel);
  const shellSpec = [
    { r: 4.6, opacity: 1, seed: 1.0, twist: 0.05, spin: 0.08, scroll: 0.6, glyph: 0.9, carved: true, leak: 1.0, density: 1 },
    { r: 3.6, opacity: 0.72, seed: 2.3, twist: 0.07, spin: 0.16, scroll: 1.0, glyph: 0.55, carved: false, leak: 0.35, density: 0.9, transparent: true },
    { r: 2.75, opacity: 0.38, seed: 3.7, twist: 0.1, spin: 0.26, scroll: 1.4, glyph: 0.0, carved: false, leak: 0.0, density: 0.7, transparent: true },
  ];
  for (const sp of shellSpec) {
    const m = new THREE.Mesh(funnelGeometry(sp.r, sp.seed), funnelMaterial({ glyphTex, ...sp }));
    m.renderOrder = sp.transparent ? 2 : 0;
    if (sp.transparent) (scene.userData.noDepth ||= []).push(m);
    funnel.add(m); handles.shells.push(m);
  }
  // the hole the floor left: a hot white disc above (the white-out), parquet rim around it
  const hole = new THREE.Mesh(new THREE.CircleGeometry(6.5, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 2.5, 1.45), fog: false, toneMapped: true }));
  hole.rotation.x = Math.PI / 2; hole.position.y = 1.2;
  funnel.add(hole);
  // the desert at the bottom: sand ground, lit by the low sun, and a haze above it
  const sandMat = pbr('sand_01', { color: '#F4DDB8', normal: 0.6, env: 0.6 });
  for (const k of ['map', 'normalMap', 'aoMap', 'roughnessMap']) if (sandMat[k]) sandMat[k].repeat.set(70, 70);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 96), sandMat);
  sandMat.color.set('#F4E4CE');
  ground.rotation.x = -Math.PI / 2; ground.position.y = -LEN; ground.receiveShadow = true;
  funnel.add(ground);
  const haze = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshBasicMaterial({ color: C3(PAL.sun).multiplyScalar(1.6), transparent: true, opacity: 0.5, depthWrite: false, fog: false }));
  haze.rotation.x = -Math.PI / 2; haze.position.y = -LEN + 0.9; haze.renderOrder = 3;
  (scene.userData.noDepth ||= []).push(haze);
  funnel.add(haze);
  const dust = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 4.2, 2.2, 96, 1, true), dustMaterial());
  dust.position.y = -LEN + 1.1; dust.renderOrder = 3;
  (scene.userData.noDepth ||= []).push(dust);
  funnel.add(dust); handles.dust = dust;

  // ---------------------------------------------------------------- tablets, shards, sand
  for (const m of glyphTablets(24, 7)) { scene.add(m); handles.tablets.push(m); }
  for (const m of floorShards(26, 11)) { scene.add(m); handles.shards.push(m); }
  const sandLayers = [
    // far fine grains near the walls: bright, many
    sandStreaks(9000, { seed: 21, rMin: 2.4, rMax: 4.4, lo: -16, hi: 6, size: [0.01, 0.026], rise: [0.7, 1.2], spin: [1.0, 2.0], color: PAL.hi, opacity: 0.6, shutter: 1 / 30 }),
    // mid grains around the chairs
    sandStreaks(3200, { seed: 22, rMin: 0.9, rMax: 2.6, lo: -8, hi: 5, size: [0.006, 0.016], rise: [0.5, 1.0], spin: [0.8, 1.5], color: PAL.pale, opacity: 0.85, shutter: 1 / 30 }),
    // dark sand clumps: silhouettes and depth (normal blending)
    sandStreaks(1400, { seed: 23, rMin: 0.8, rMax: 3.6, lo: -8, hi: 5, size: [0.012, 0.035], rise: [0.5, 0.9], spin: [0.6, 1.2], color: PAL.umber, opacity: 0.5, shutter: 1 / 60, additive: false, soft: 0.8 }),
    // foreground blur: big soft out-of-focus motes close to the lens
    sandStreaks(260, { seed: 24, rMin: 1.2, rMax: 2.6, lo: -6, hi: 5, size: [0.03, 0.07], rise: [0.6, 1.0], spin: [0.7, 1.2], color: PAL.sand, opacity: 0.22, shutter: 1 / 60, soft: 1.0 }),
  ];
  for (const m of sandLayers) { m.renderOrder = 4; scene.add(m); handles.sand.push(m); (scene.userData.noDepth ||= []).push(m); }

  // ---------------------------------------------------------------- chairs and robots
  // The shared kit chair (the workspace chair) and the approved bodied robots, seated.
  const seatCfg = [
    { name: 'Codex', theta: 2.55, r: 0.62, y: 0.1, ph: 0.0, arms: 'up' },
    { name: 'Claude', theta: -0.35, r: 0.62, y: -0.12, ph: 1.9, arms: 'grip' },
  ];
  for (const cfg of seatCfg) {
    const chair = await loungeChair({ height: CHAIR_H });
    const pivot = new THREE.Group(); // tumbles about the seat centre
    const rig = new THREE.Group(); // chair + robot, origin on the chair's floor point
    pivot.add(rig);
    rig.add(chair);
    const robot = createBodiedRobot(assets, { agent: cfg.name, size: BODY_SIZE, shade: { faceBoost: cfg.name === 'Claude' ? 1.3 : 1.05, eyeBoost: 3.0 } });
    robot.group.rotation.y = Math.PI; // the chair faces -z; the body faces +z
    rig.add(robot.group);
    const u = BODY_SIZE, front = 0.152;
    robot.setState({ seat: { y: chair.userData.seatY, front, z: front - BODY.thigh * u + 0.07 * u }, seed: cfg.name, standZ: front + 0.32, eyeGlow: 1.35 });
    rig.position.y = -chair.userData.seatY; // pivot at the seat
    scene.add(pivot);
    handles.chairs.push({ ...cfg, pivot, rig, chair, robot });
    handles.seatY = chair.userData.seatY;
    handles.robots.push(robot);
  }

  // ---------------------------------------------------------------- light
  // key: the desert sun leaking up from below (warm, low); top: the white-out from the hole (fades);
  // rim: gold from the far side of the storm; fill: a dim warm hemisphere.
  const sunKey = new THREE.DirectionalLight('#FFC48A', 3.2);
  sunKey.position.set(1.5, -6, 2.5); sunKey.target.position.set(0, 0.3, 0);
  sunKey.castShadow = true; sunKey.shadow.mapSize.set(2048, 2048);
  Object.assign(sunKey.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 0.5, far: 20 });
  sunKey.shadow.bias = -0.0004; sunKey.shadow.normalBias = 0.02;
  const topLight = new THREE.DirectionalLight('#FFD9AE', 4.0);
  topLight.position.set(-0.6, 6, 0.8); topLight.target.position.set(0, 0, 0);
  const rim = new THREE.DirectionalLight('#FFB060', 2.4);
  rim.position.set(-3, 0.5, -3.5); rim.target.position.set(0, 0.3, 0);
  const front = practical('spot', { color: '#FFD6A8', intensity: 5, distance: 6, angle: 0.6, penumbra: 1, shadow: 0 });
  const hemi = new THREE.HemisphereLight('#E8B888', '#4A2C18', 0.55);
  scene.add(sunKey, sunKey.target, topLight, topLight.target, rim, rim.target, front, front.target, hemi);
  Object.assign(handles, { funnel, hole, ground, haze, sunKey, topLight, rim, front, hemi });

  // ---------------------------------------------------------------- camera and film
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.03, 120);
  camera.setFocalLength(S.focal);
  const film = {
    tone: 'aces', exposure: 1.0, msaa: 4,
    ao: { radius: 0.12, intensity: 0.7, samples: 12 },
    dof: { focus: 2, aperture: S.aperture, maxblur: S.maxblur },
    bloom: { strength: 0.42, radius: 0.65, threshold: 1.0 },
    grade: { vignette: 0.38, grain: 0.03, ca: 0.0016, lift: [0.012, 0.007, 0.003], seed: 13 },
  };

  // ---------------------------------------------------------------- landing dust (t >= LAND)
  // A burst of sand thrown out from each chair base when the seats hit, then a slow cloud that
  // thickens toward the cut to the desert. Positions are a pure function of the time since LAND.
  const sprite = (() => {
    const [cv, g] = canvas2d(64, 64);
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return canvasTex(cv);
  })();
  function dustLayer(n, seed, size, color) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: sprite, color, size, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    pts.frustumCulled = false; pts.visible = false; pts.renderOrder = 5;
    pts.userData.p = Array.from({ length: n }, (_, i) => ({
      chair: i % 2, a: hash(seed, i, 'a') * TAU, v: hashRange(0.4, 1.0, seed, i, 'v'), up: hashRange(0.05, 1.0, seed, i, 'u'), r0: hashRange(0.2, 0.45, seed, i, 'r'),
    }));
    scene.add(pts); (scene.userData.noDepth ||= []).push(pts);
    return pts;
  }
  const burst = dustLayer(900, 71, 0.16, '#F0D2A4');
  const cloud = dustLayer(260, 72, 0.9, '#E8CDA2');
  Object.assign(handles, { burst, cloud });

  // ---------------------------------------------------------------- update(t, camPos): a pure function of t
  const SEAT = handles.seatY;
  const smooth = THREE.MathUtils.smoothstep;
  const SUN0 = C3('#FFC48A'), SUN1 = C3('#FFE0BE');
  const FOG0 = C3('#4A2E1C'), FOG1 = C3('#CDB596');
  const HS0 = C3('#E8B888'), HS1 = C3('#8FB0E6'), HG0 = C3('#4A2C18'), HG1 = C3('#A88C6C');
  // the seat (pivot) of a chair at t: orbit the axis, bob, settle onto the sand at LAND, thump
  function pivotPos(c, tt, out = V()) {
    const tl = Math.min(tt, LAND);
    const th = c.theta + 0.55 * tl;
    const k = 1 - smooth(tt, LAND - 0.8, LAND);
    let y = k * (c.y + 0.08 * Math.sin(tl * 2.3 + c.ph));
    if (tt > LAND) {
      const u = tt - LAND;
      y += -0.035 * Math.sin(Math.PI * clamp01(u / 0.14)) + 0.012 * Math.sin(Math.PI * clamp01((u - 0.14) / 0.12));
    }
    return out.set(Math.cos(th) * c.r, y, Math.sin(th) * c.r);
  }
  const centreAt = (tt) => handles.chairs.reduce((a, c) => a.add(pivotPos(c, tt)), V()).multiplyScalar(0.5);
  // the keyed camera at t, in world space
  function cameraAt(tt) {
    const k = keyAt(Math.max(0, tt));
    const ctr = centreAt(tt);
    return { ...k, pos: ctr.clone().add(V(...k.pos)), target: ctr.clone().add(V(...k.target)), subject: ctr.clone().add(V(...k.subject)) };
  }

  function update(tt, camPos = null) {
    const tl = Math.min(tt, LAND), after = Math.max(0, tt - LAND);
    // the world rises past the chairs and stops dead when the sand meets the chair feet at LAND
    funnel.position.y = -SEAT + FALL * tl;
    const white = Math.exp(-tt / 0.22);
    for (const s of handles.shells) { s.material.uniforms.uT.value = tt; s.material.uniforms.uWhite.value = white; } // walls keep swirling
    hole.material.color.setRGB(3.4, 2.5, 1.45).multiplyScalar(0.25 + 0.75 * white);
    const ts = tl + 0.3 * after; // the sand and the tablets slow once the fall stops
    for (const s of handles.sand) s.material.uniforms.uT.value = ts;
    handles.dust.material.uniforms.uT.value = tt;
    // tablets: orbit the axis and rise slower than the walls (they fall with the chairs)
    for (const m of handles.tablets) {
      const p = m.userData.p;
      const ang = p.a0 + p.w * ts;
      const span = 20, lo = -14;
      const y = lo + ((p.y0 - lo + FALL * p.k * ts) % span + span) % span;
      m.position.set(Math.cos(ang) * p.r, y, Math.sin(ang) * p.r);
      m.rotation.set(p.rx * ts + p.ph, p.ry * ts + ang, p.rz * ts);
      // tablets near the top hole are still forming: they grow out of the storm; none below the sand
      m.scale.setScalar(smooth(funnel.position.y - y, 0.4, 2.0) * smooth(y - (funnel.position.y - LEN), 0.2, 1.0));
      m.visible = m.scale.x > 0.01;
    }
    // floor shards: fly outward and up with the funnel top, swallowed by ~1.2 s
    for (const m of handles.shards) {
      const p = m.userData.p;
      const r = p.r + p.out * tt * 1.6;
      const ang = p.a + 0.7 * tt;
      m.position.set(Math.cos(ang) * r, p.y0 + FALL * tt * p.up + 0.3, Math.sin(ang) * r);
      m.rotation.set(p.rx * tt, ang, p.rz * tt);
      m.scale.setScalar(1 - smooth(tt, 0.7, 1.3));
      m.visible = m.scale.x > 0.01;
    }
    // chairs: orbit, bob and tumble; the yaw turns each robot's face toward the camera (3/4 view)
    for (const c of handles.chairs) {
      pivotPos(c, tt, c.pivot.position);
      const live = smooth(tt, 0.0, 0.5) * (1 - smooth(tt, LAND - 0.45, LAND));
      let yaw = Math.PI + (c.name === 'Codex' ? 0.55 : -0.55);
      if (camPos) {
        const dx = camPos.x - c.pivot.position.x, dz = camPos.z - c.pivot.position.z;
        yaw = Math.atan2(-dx, -dz) + (c.name === 'Codex' ? 0.32 : -0.32);
      }
      yaw += 0.4 * (1 - smooth(tt, LAND - 0.9, LAND - 0.2)) * Math.sin(tt * 0.9 + c.ph);
      const rock = after > 0 ? 0.06 * Math.exp(-after / 0.18) * Math.sin(after * 26 + c.ph) : 0;
      c.pivot.rotation.set(live * (0.55 * Math.sin(tt * 2.1 + c.ph) + 0.25) + rock, yaw, live * 0.65 * Math.sin(tt * 1.6 + c.ph + 1.0), 'YXZ');
      c.robot.setPose('seated-idle', 2.35 + tt + c.ph);
      // reaction: Codex throws both arms high, Claude braces on the seat; the arms drop after the landing
      const A = c.robot.handles.arms;
      const up = (0.6 + 0.4 * smooth(tt, 0.0, 0.35)) * (1 - 0.8 * smooth(tt, LAND + 0.05, LAND + 0.6));
      if (c.arms === 'up') {
        // the arms are IK-solved onto the lap: swing each upper arm up about the body's lateral axis,
        // then splay it out about the body's forward axis (both in the shoulder's parent space)
        c.pivot.updateMatrixWorld(true);
        const gq = c.robot.group.getWorldQuaternion(new THREE.Quaternion());
        for (const [s, arm] of [[1, A.L], [-1, A.R]]) {
          const pq = arm.upper.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
          const lat = V(1, 0, 0).applyQuaternion(gq).applyQuaternion(pq);
          const fwd = V(0, 0, 1).applyQuaternion(gq).applyQuaternion(pq);
          arm.upper.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(lat, ARM_RAISE * up));
          arm.upper.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(fwd, s * ARM_SPLAY * up));
          arm.fore.rotateX(-0.35 * up);
        }
      } else {
        for (const [s, arm] of [[1, A.L], [-1, A.R]]) { arm.upper.rotateZ(s * 0.45); arm.upper.rotateX(0.35); }
      }
      c.robot.handles.headPivot.rotation.x += c.arms === 'up' ? -0.25 * up : 0.18;
    }
    // landing dust: the burst races out low and settles; the cloud rises slowly and thickens
    const ground = -SEAT;
    const bases = handles.chairs.map((c) => pivotPos(c, LAND));
    for (const [layer, kind] of [[burst, 'burst'], [cloud, 'cloud']]) {
      layer.visible = after > 0;
      if (!layer.visible) continue;
      const arr = layer.geometry.attributes.position.array;
      layer.userData.p.forEach((p, i) => {
        const b = bases[p.chair];
        const rr = kind === 'burst' ? p.r0 + 1.6 * p.v * (1 - Math.exp(-after / 0.28)) : p.r0 + 0.9 * p.v * (1 - Math.exp(-after / 0.55));
        const yy = kind === 'burst' ? ground + 0.04 + 0.45 * p.up * (1 - Math.exp(-after / 0.18)) * Math.exp(-after / 0.9) : ground + 0.12 + 0.8 * p.up * (1 - Math.exp(-after / 0.5));
        arr[i * 3] = b.x + Math.cos(p.a) * rr; arr[i * 3 + 1] = yy; arr[i * 3 + 2] = b.z + Math.sin(p.a) * rr;
      });
      layer.geometry.attributes.position.needsUpdate = true;
      layer.material.opacity = kind === 'burst' ? 0.95 * smooth(after, 0, 0.03) * (1 - 0.6 * smooth(after, 0.25, 0.9)) : 0.5 * smooth(after, 0.05, 0.85);
    }
    // the practical front light rides with the camera onto the faces
    if (camPos) { front.position.copy(camPos).add(V(0.2, 0.4, 0)); front.target.position.copy(centreAt(tt)).add(V(0, 0.35, 0)); }
    scene.updateMatrixWorld(true);
    // lights track the white-out fade and the desert approach; the grade cools to the desert's
    const near = smooth(tt, 1.4, LAND);
    topLight.intensity = 0.6 + 5.5 * white;
    sunKey.intensity = 2.2 + 1.5 * near;
    sunKey.color.lerpColors(SUN0, SUN1, near);
    // the sun leaks up from below during the fall, then swings over the rim as the desert opens
    sunKey.position.lerpVectors(SUN_BELOW, SUN_ABOVE, near);
    handles.haze.material.opacity = 0.5 * (1 - near);
    hemi.intensity = 0.55 - 0.1 * near;
    hemi.color.lerpColors(HS0, HS1, near * 0.85);
    hemi.groundColor.lerpColors(HG0, HG1, near);
    scene.fog.color.lerpColors(FOG0, FOG1, near);
    scene.fog.density = 0.035 - 0.017 * near;
    rim.intensity = 2.4;
  }

  // the stills: the keyed camera at T (the same camera the composition flies)
  const cam = cameraAt(T);
  update(T, cam.pos);
  camera.setFocalLength(cam.focal);
  camera.position.copy(cam.pos); camera.lookAt(cam.target); camera.updateMatrixWorld();
  camera.rotateZ(cam.roll);
  film.dof.focus = cam.pos.distanceTo(cam.subject);
  film.dof.aperture = cam.aperture; film.dof.maxblur = cam.maxblur;
  for (const s of handles.sand) s.material.uniforms.uRes.value.set(1920, 1080);

  const info = { shot, t: T, land: LAND, funnelTop: +funnel.position.y.toFixed(2), groundY: +(funnel.position.y - LEN).toFixed(2), focus: +film.dof.focus.toFixed(2) };
  return { scene, camera, film, handles, update, cameraAt, centreAt, info };
}

