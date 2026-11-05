// Small pure helpers shared by every 3D module.
// Everything here is a function of its arguments: no clocks, no Math.random().

export const FPS = 30;
export const STEP = 1 / 120; // physics step

export function clamp(x, lo = 0, hi = 1) {
  if (!Number.isFinite(x)) return lo;
  return x < lo ? lo : x > hi ? hi : x;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

// GSAP-equivalent eases, so camera and acting read like the overlay motion.
export const ease = {
  linear: (t) => clamp(t),
  power2InOut: (t) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  power3InOut: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  power2Out: (t) => { t = clamp(t); return 1 - (1 - t) * (1 - t); },
  power3Out: (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 3); },
  power2In: (t) => { t = clamp(t); return t * t; },
  expoOut: (t) => { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
  sineInOut: (t) => { t = clamp(t); return -(Math.cos(Math.PI * t) - 1) / 2; },
};

// Seeded hash in [0, 1). Accepts numbers and strings.
export function hash(...parts) {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
  }
  return (h >>> 0) / 4294967296;
}

export const hashRange = (lo, hi, ...parts) => lo + (hi - lo) * hash(...parts);

// Smooth 1D value noise in [-1, 1], seeded; used for handheld wobble.
export function noise1(t, seed) {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash(seed, i) * 2 - 1;
  const b = hash(seed, i + 1) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

// Damped spring stiffness/damping from frequency (Hz) and damping ratio.
export function springCoeffs(hz, zeta) {
  const w = 2 * Math.PI * hz;
  return { k: w * w, c: 2 * zeta * w };
}

// Sample a 30 fps envelope array at time t (seconds), linear, clamped.
export function sampleEnvelope(env, t, fps = FPS) {
  if (!env || !env.length) return 0;
  const x = t * fps;
  if (!(x > 0)) return Number(env[0]) || 0;
  const i = Math.floor(x);
  if (i >= env.length - 1) return Number(env[env.length - 1]) || 0;
  const f = x - i;
  return (Number(env[i]) || 0) * (1 - f) + (Number(env[i + 1]) || 0) * f;
}

// Keyed state ease: 0 before `start`, ramps in over `inDur`, holds, ramps out over `outDur` ending at `end`.
export function keyedHold(t, start, end, inDur = 8 / FPS, outDur = 10 / FPS) {
  if (t <= start || t >= end) return 0;
  const a = ease.power2InOut((t - start) / Math.max(1e-3, inDur));
  const b = ease.power2InOut((end - t) / Math.max(1e-3, outDur));
  return Math.min(a, b);
}

export const deg = (d) => (d * Math.PI) / 180;
