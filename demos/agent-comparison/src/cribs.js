// Episode 2 ("Agent Cribs") tour helpers: script rows and word times, robot specs
// for the tours, hop-walks, looks in world yaw, talking and listening.
//
// Rows arrive as {row: 'H5', speaker, start, duration, localStart, words:[{word,start,end}]}.
// Word times may be row-relative, absolute or scene-local; rowWords() normalises them to
// row-relative seconds. Every helper here only appends events to physics specs: the
// simulation (physics.js) runs once at mount, so frames stay pure functions of time.
import * as THREE from 'three';
import { envelopeFor, onsets } from './acting.js';
import { hash, clamp, FPS, yawToward, unwrapNear } from './util.js';
import { ROBOT, createRobot } from './robot.js';

export const TOUR_SCALE = 0.42;
export const CAST = ['Claude', 'Codex', 'Cursor', 'Antigravity', 'OpenCode'];
const G = 9.8;

export const normWord = (w) => String(w || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Word timings relative to the row start, whichever clock the generator used.
export function rowWords(row) {
  const ws = (row.words || []).filter((w) => Number.isFinite(Number(w.start)));
  if (!ws.length) return [];
  const offsets = [0, Number(row.start), Number(row.localStart)].filter(Number.isFinite);
  let best = 0;
  let bestErr = Infinity;
  for (const off of offsets) {
    let err = 0;
    for (const w of ws) {
      const s = Number(w.start) - off;
      if (s < -0.3) err += -0.3 - s;
      if (s > row.duration + 0.3) err += s - row.duration - 0.3;
    }
    if (err < bestErr - 1e-6) { bestErr = err; best = off; }
  }
  return ws.map((w) => {
    const start = Number(w.start) - best;
    const end = Number.isFinite(Number(w.end)) ? Number(w.end) - best : start + 0.25;
    return { word: w.word, norm: normWord(w.word), start, end: Math.max(end, start + 0.05) };
  });
}

// A talking envelope from word timings (used until the real voice envelope exists).
function wordEnvelope(words, duration) {
  const n = Math.max(2, Math.round(duration * FPS) + 2);
  const env = new Array(n).fill(0);
  for (const w of words) {
    const a = Math.max(0, Math.floor(w.start * FPS));
    const b = Math.min(n - 1, Math.ceil(w.end * FPS));
    const syl = Math.max(1, Math.round((w.end - w.start) / 0.16));
    for (let i = a; i <= b; i++) {
      const u = (i / FPS - w.start) / Math.max(0.05, w.end - w.start);
      if (u < 0 || u > 1) continue;
      env[i] = Math.max(env[i], 0.25 + 0.6 * Math.abs(Math.sin(Math.PI * u * syl)) * Math.sin(Math.PI * clamp(u * 1.4)));
    }
  }
  return env;
}

function synthEnvelope(duration, seed) {
  const n = Math.max(2, Math.round(duration * FPS));
  return Array.from({ length: n }, (_, i) => {
    const t = i / FPS;
    const syll = Math.abs(Math.sin(t * 11 + hash(seed) * 6));
    return clamp(0.15 + 0.6 * syll * Math.sin(Math.PI * clamp(t / duration)));
  });
}

export function prepareRows(cfg, cues) {
  return (cfg.rows || []).map((r) => {
    const duration = Math.max(0.2, Number(r.duration) || 1);
    const localStart = Number.isFinite(Number(r.localStart)) ? Number(r.localStart) : 0;
    const base = { ...r, duration, localStart };
    const words = rowWords(base);
    const env = envelopeFor(r.row, cues) || (words.length ? wordEnvelope(words, duration) : synthEnvelope(duration, r.row));
    return { ...base, id: String(r.row), end: localStart + duration, env, onsets: onsets(env), words };
  });
}

// Scene-local time of the first word matching `needle` (first token, punctuation
// ignored); falls back to a fraction of the row when the word is missing.
export function wordTime(row, needle, frac = 0.5, which = 'start') {
  if (!row) return 0;
  const n = normWord(String(needle).split(/\s+/)[0]);
  const w = row.words.find((x) => x.norm === n) || row.words.find((x) => n.length >= 3 && x.norm.startsWith(n));
  return row.localStart + (w ? w[which] : frac * row.duration);
}

// Phrase onsets (scene-local), with a fallback grid when the envelope is flat.
export function rowOnsets(row) {
  const o = row.onsets.length ? row.onsets : [0];
  return o.map((x) => row.localStart + x);
}

// ---------------------------------------------------------------- specs

export function tourSpec(name, seat, { scale = TOUR_SCALE, seedTag = '' } = {}) {
  return {
    id: name,
    seed: `${name}-${seedTag}`,
    scale,
    restYaw: seat.yaw,
    seat: { x: seat.x, z: seat.z },
    radius: ROBOT.ballRadius * scale,
    collide: false,
    talk: [], hops: [], bumps: [], looks: [], leans: [], shakes: [], eyes: [], lunges: [], lifts: [],
    plan: { pts: [{ t: -99, x: seat.x, z: seat.z }], lastLook: 0, y: seat.y || 0 },
  };
}

// Planned base position at time t (piecewise linear over the walk plan).
export function posAt(spec, t) {
  const P = spec.plan.pts;
  let prev = P[0];
  for (const p of P) {
    if (p.t > t) {
      const u = clamp((t - prev.t) / Math.max(1e-4, p.t - prev.t));
      return { x: prev.x + (p.x - prev.x) * u, z: prev.z + (p.z - prev.z) * u };
    }
    prev = p;
  }
  return { x: prev.x, z: prev.z };
}

// Planned ball centre (rest pose) in world space.
export function centreAt(spec, t, lift = 0) {
  const p = posAt(spec, t);
  return new THREE.Vector3(p.x, spec.plan.y + lift + ROBOT.ballCenterY * spec.scale, p.z);
}

// Turn to an absolute world yaw (the spring takes the short way round).
export function face(spec, t, yawWorld) {
  // unwrap against the look in effect at t (chronologically), so a look added
  // out of order never sends the body spinning the long way round
  let ref = spec.plan.lastLook;
  let best = -Infinity;
  for (const l of spec.looks) if (l.t <= t && l.t >= best) { best = l.t; ref = l.yaw; }
  const rel = unwrapNear(yawWorld - spec.restYaw, ref);
  spec.plan.lastLook = rel;
  spec.looks.push({ t, yaw: rel });
  spec.looks.sort((a, b) => a.t - b.t);
}

export function faceToward(spec, t, point) {
  face(spec, t, yawToward(posAt(spec, t), point));
}

export function yawAt(spec, t) {
  let cur = 0;
  for (const l of spec.looks) if (l.t <= t) cur = l.yaw;
  return spec.restYaw + cur;
}

export function talk(spec, t0, dur, env, gain = 1) {
  spec.talk.push({ t0, t1: t0 + dur + 0.1, env, envStart: t0, gain });
}

export function hop(spec, t, height = 0.08, extra = {}) {
  spec.hops.push({ t, height, anticip: 0.11, depth: 0.16, ...extra });
}

/**
 * Hop-walk to `to` ({x, z}, world m) starting at t. Each step is one physics hop:
 * anticipation squash, a ballistic hop whose airtime carries the base one stride,
 * a landing squash and the ball's spring settle; the body waddles (alternating roll
 * kicks) and leans into the walk. Returns the time the robot has settled.
 */
export function walkTo(spec, t, to, { stride = 0.3, height = 0.065, anticip = 0.085, gap = 0.045, turn = true, lean = -0.1, faceEnd = null } = {}) {
  const from = posAt(spec, t);
  const dx = to.x - from.x, dz = to.z - from.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.02) return t;
  let tt = t;
  if (turn) {
    const yaw = Math.atan2(-dz, dx);
    const turnBy = Math.abs(unwrapNear(yaw, yawAt(spec, t)) - yawAt(spec, t));
    face(spec, t, yaw);
    tt += Math.min(0.3, 0.06 + turnBy * 0.12);
  }
  const n = Math.max(1, Math.ceil(dist / stride));
  let take = tt + anticip;
  let prev = from;
  for (let i = 1; i <= n; i++) {
    const h = height * (0.9 + 0.2 * hash(spec.seed, 'wh', t, i));
    const air = 2 * Math.sqrt((2 * h) / G);
    const u = i / n;
    const p = { x: from.x + dx * u, z: from.z + dz * u };
    spec.hops.push({ t: take, height: h, anticip, depth: 0.11, to: [p.x, p.z] });
    spec.bumps.push({ t: take + 0.01, roll: (i % 2 ? 1 : -1) * 0.55 });
    spec.plan.pts.push({ t: take, x: prev.x, z: prev.z }, { t: take + air, x: p.x, z: p.z });
    prev = p;
    if (i < n) take += air + gap + anticip;
    else take += air;
  }
  const settled = take + 0.14;
  spec.leans.push({ t0: tt, t1: settled - 0.05, pitch: lean, in: 0.15, out: 0.25 });
  if (faceEnd !== null) face(spec, settled - 0.1, faceEnd);
  return settled;
}

// Time a walk of `dist` metres takes (same cadence as walkTo).
export function walkDuration(dist, { stride = 0.3, height = 0.065, anticip = 0.085, gap = 0.045 } = {}) {
  const n = Math.max(1, Math.ceil(dist / stride));
  const air = 2 * Math.sqrt((2 * height) / G);
  return anticip + n * air + (n - 1) * (gap + anticip) + 0.14;
}

/** Glide (no hops) to `to` over [t, t + dur], smoothstep; for hovering robots. */
export function glideTo(spec, t, to, dur, { face: turn = true, lean = -0.12 } = {}) {
  const from = posAt(spec, t);
  if (turn) face(spec, t, Math.atan2(-(to.z - from.z), to.x - from.x));
  (spec.glides || (spec.glides = [])).push({ t0: t, t1: t + dur, to: [to.x, to.z] });
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const e = u * u * (3 - 2 * u);
    spec.plan.pts.push({ t: t + dur * u, x: from.x + (to.x - from.x) * e, z: from.z + (to.z - from.z) * e });
  }
  spec.leans.push({ t0: t, t1: t + dur, pitch: lean, in: 0.2, out: 0.3 });
  return t + dur;
}

// Hover (Antigravity, the Conductor's float): spring to a height, optional bob.
export function hover(spec, t, y, { hz = 2.2, zeta = 0.45 } = {}) {
  spec.lifts.push({ t, y, hz, zeta });
  spec.lifts.sort((a, b) => a.t - b.t);
}

// Everyone listed glances at the speaker with seeded, staggered delays.
export function listen(specs, speaker, row, { except = [], at = null, delay = [0.08, 0.4] } = {}) {
  const S = specs[speaker];
  for (const [n, sp] of Object.entries(specs)) {
    if (n === speaker || except.includes(n)) continue;
    const t = row.localStart + delay[0] + (delay[1] - delay[0]) * hash(n, row.id, 'listen');
    const target = at || (S ? centreAt(S, t) : null);
    if (target) faceToward(sp, t, target);
  }
}

// Voice: the speaker's squash, glow and onset nods; plus a seeded idle bounce on
// phrase onsets so a long line never reads as frozen.
export function speak(spec, row, { gain = 1, bounce = 0.3 } = {}) {
  talk(spec, row.localStart, row.duration, row.env, gain);
  row.onsets.forEach((o, i) => {
    if (i > 0 && hash(spec.id, row.id, i, 'b') < bounce) hop(spec, row.localStart + o - 0.02, 0.025 + 0.02 * hash(spec.id, i), { anticip: 0.09, depth: 0.1 });
  });
}

// Robots that are not in a row still blink and breathe; a seeded small sway.
export function idle(spec, from, to) {
  for (let t = from + 0.6 * hash(spec.id, 'idle0'); t < to; t += 1.6 + 1.2 * hash(spec.id, 'idle', t)) {
    spec.leans.push({ t0: t, t1: t + 0.9, nod: (hash(spec.id, 'in', t) - 0.5) * 0.12, roll: (hash(spec.id, 'ir', t) - 0.5) * 0.06, in: 0.35, out: 0.45 });
  }
}

/** Create a robot for a tour and stand it at `seat` {x, y, z, yaw}. */
export function addRobot(scene, assets, name, seat, { scale = TOUR_SCALE } = {}) {
  const r = createRobot(assets, name, { scale });
  r.root.position.set(seat.x, seat.y || 0, seat.z);
  r.root.rotation.y = seat.yaw || 0;
  r.seat = { x: seat.x, y: seat.y || 0, z: seat.z, yaw: seat.yaw || 0 };
  scene.add(r.root);
  return r;
}

/**
 * Scene-local time of a named action from the composition config (cfg.actions, the
 * overlay agent's SFX-synced beats: doorbell, press, noteSlide, gavel, ...), else the
 * fallback (usually a word time).
 */
export function actionTime(ctx, key, fallback) {
  const v = Number(ctx.cfg?.actions?.[key]);
  return Number.isFinite(v) ? v : fallback;
}

/**
 * Lead-in (the 0.6-1.0 s before a room's first word): the host looks at the room's
 * gag first, then turns back to the lens just before it speaks. The turn back
 * re-asserts whatever look was planned for the first word.
 */
export function leadInLook(spec, row, gag, { back = 0.32 } = {}) {
  if (!row || row.localStart < 0.35) return;
  const tBack = row.localStart - back;
  let planned = null;
  for (const l of spec.looks) if (l.t <= tBack) planned = l;
  const restore = planned ? planned.yaw : 0;
  const p = posAt(spec, 0);
  const gagYaw = unwrapNear(Math.atan2(-(gag.z - p.z), gag.x - p.x) - spec.restYaw, restore);
  spec.looks.push({ t: -0.5, yaw: gagYaw }, { t: tBack, yaw: restore });
  spec.looks.sort((a, b) => a.t - b.t);
}

/** The next speaker gathers itself just before its line: a small inhale and lift. */
export function anticipate(spec, row) {
  if (!row) return;
  spec.leans.push({ t0: row.localStart - 0.38, t1: row.localStart + 0.12, squash: -0.05, nod: 0.1, in: 0.18, out: 0.2 });
}
