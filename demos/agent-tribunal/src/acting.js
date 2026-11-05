// Acting: turns the script rows of one scene into physics events.
//
// Row numbers follow SPEC.md. Times here are scene-local seconds; negative
// times are a pre-roll that settles earlier story beats (the paper stack, the
// floating laptop, scattered sheets) so every scene starts where the last left off.
import * as THREE from 'three';
import { PANEL } from './assets.js';
import { SET, seatOf, PAPER } from './set-table.js';
import { BOOTH } from './set-booth.js';
import { hash, hashRange, clamp, FPS } from './util.js';

// ---------------------------------------------------------------- inputs

export function envelopeFor(row, cues) {
  const fromPage = typeof window !== 'undefined' ? window.__tribunalEnvelopes?.[row] : null;
  if (Array.isArray(fromPage) && fromPage.length) return fromPage;
  for (const v of Object.values(cues?.voices || {})) {
    if (String(v.row) === String(row) && Array.isArray(v.envelope)) return v.envelope;
  }
  return null;
}

// Synthetic envelope when a line has none (keeps talking alive, never NaN).
function syntheticEnvelope(duration, seed) {
  const n = Math.max(2, Math.round(duration * FPS));
  return Array.from({ length: n }, (_, i) => {
    const t = i / FPS;
    const syll = Math.abs(Math.sin(t * 11 + hash(seed) * 6));
    return clamp(0.15 + 0.6 * syll * Math.sin(Math.PI * clamp(t / duration)));
  });
}

// Phrase onsets (s): envelope rises above 0.3 after >= 5 quiet frames.
export function onsets(env) {
  const out = [];
  let quiet = 99;
  for (let i = 0; i < (env?.length || 0); i++) {
    const v = Number(env[i]) || 0;
    if (v < 0.08) quiet++;
    else if (v > 0.3 && quiet >= 5) { out.push(i / FPS); quiet = 0; }
    else if (v >= 0.08) quiet = 0;
  }
  return out;
}

// Seconds from a row's start to a named sound effect's hit, from cues.json.
function hitRel(cues, sfxId, row, fallback) {
  const s = cues?.sfx?.[sfxId];
  const r = (cues?.timeline || []).find((x) => String(x.row) === String(row));
  if (s && r && Number.isFinite(s.hit) && Number.isFinite(r.start)) return s.hit - r.start;
  return fallback;
}

function voiceLayers(row, cues) {
  for (const v of Object.values(cues?.voices || {})) if (String(v.row) === String(row) && Array.isArray(v.layers)) return v.layers;
  return null;
}

// ---------------------------------------------------------------- geometry helpers

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const yawTo = (from, to) => Math.atan2(-(to.z - from.z), to.x - from.x);

function lookOffset(name, point, limit = 1.15) {
  const s = seatOf(name);
  return clamp(wrap(yawTo(s, point) - s.yaw), -limit, limit);
}

function headPoint(name) {
  const s = seatOf(name);
  const sc = name === 'Conductor' ? SET.judgeScale : SET.robotScale;
  return new THREE.Vector3(s.x, s.y + 1.23 * sc, s.z);
}

// Lean of `name` toward a world point: pitch/roll in the robot's frame + a lateral shift (m).
function leanToward(name, point, amount, shift) {
  const s = seatOf(name);
  const dx = point.x - s.x, dz = point.z - s.z;
  const len = Math.hypot(dx, dz) || 1;
  const fwd = (dx * Math.cos(s.yaw) - dz * Math.sin(s.yaw)) / len;
  const right = (dx * Math.sin(s.yaw) + dz * Math.cos(s.yaw)) / len;
  return { pitch: -amount * fwd, roll: amount * right, wx: (dx / len) * shift, wz: (dz / len) * shift };
}

// ---------------------------------------------------------------- spec builders

function emptyRobot(name, extra = {}) {
  const seat = extra.seat || seatOf(name);
  const scale = extra.scale ?? (name === 'Conductor' ? SET.judgeScale : SET.robotScale);
  return {
    id: name,
    seed: `${name}-${extra.seedTag || ''}`,
    scale,
    restYaw: seat.yaw,
    seat: { x: seat.x, z: seat.z },
    radius: 0.856 * scale,
    collide: false,
    talk: [], hops: [], bumps: [], looks: [], leans: [], shakes: [], eyes: [], lunges: [],
    ...extra.spec,
  };
}

function talk(spec, t0, dur, env, gain = 1) {
  spec.talk.push({ t0, t1: t0 + dur + 0.1, env, envStart: t0, gain });
}

// ---------------------------------------------------------------- table scenes

function rowInfo(cfg, cues) {
  return cfg.rows.map((r) => {
    const env = envelopeFor(r.row, cues) || syntheticEnvelope(r.duration, r.row);
    return { ...r, env, onsets: onsets(env), end: r.localStart + r.duration };
  });
}

// Which story beats happened before this scene starts (for the pre-roll).
function priorBeats(rows) {
  const first = Math.min(...rows.map((r) => Number(r.row) || 0));
  return {
    paperDropped: first > 4,
    laptopFloating: first > 8,
    sheetsFlown: first > 17,
    gavelRaised: rows.some((r) => r.row === 18 && r.localStart < 0.2),
  };
}

export function buildTableActing(cfg, world, cues, shots) {
  const rows = rowInfo(cfg, cues);
  const beats = priorBeats(rows);
  const robots = Object.fromEntries([...PANEL, 'Conductor'].map((n) => [n, emptyRobot(n, { seedTag: cfg.id })]));
  for (const n of PANEL) robots[n].collide = true;
  const tableImpulses = [];
  const prop = makeTableProps(world, beats);
  const start = beats.sheetsFlown ? -9 : beats.paperDropped ? -4 : beats.gavelRaised ? -1 : -0.5;

  // pre-roll beats
  if (beats.paperDropped) paperDrop(prop, robots, tableImpulses, -3.6, { hop: false });
  if (beats.sheetsFlown) sheetsFly(prop, -2.8);
  if (beats.laptopFloating) laptopFloat(prop, start);
  if (beats.gavelRaised) gavelRaise(prop, -0.35);

  // everyone faces the table centre at rest; listeners track speakers
  for (const row of rows) actRow(row, rows, robots, prop, tableImpulses, cues, shots);
  playToCamera(robots, shots);

  return {
    start,
    robots: Object.values(robots),
    props: prop.list(),
    tableImpulses,
    visibility: prop.visibility,
    hits: prop.hits,
  };
}

function listen(robots, speaker, row, { except = [] } = {}) {
  const target = speaker === 'Conductor' ? headPoint('Conductor') : headPoint(speaker);
  for (const n of [...PANEL, 'Conductor']) {
    if (n === speaker || except.includes(n)) continue;
    const delay = n === 'Conductor' ? 0.5 + 0.3 * hash(n, row.row) : 0.1 + 0.38 * hash(n, row.row, 'd');
    robots[n].looks.push({ t: row.localStart + delay, yaw: lookOffset(n, target, n === 'Conductor' ? 0.5 : 0.75) });
  }
  // character habits while someone else talks
  if (speaker !== 'OpenCode' && row.duration > 1.5) {
    const t = row.localStart + 0.5 + hash('oc', row.row) * Math.max(0.2, row.duration - 1.4);
    robots.OpenCode.shakes.push({ t0: t, t1: t + 0.55, amp: 0.2, hz: 3.4 });
  }
  if (speaker !== 'Cursor' && speaker !== 'Conductor') {
    const l = leanToward('Cursor', headPoint(speaker), 0.07, 0.03);
    robots.Cursor.leans.push({ t0: row.localStart + 0.3, t1: row.end, ...l });
  }
  if (speaker !== 'Antigravity' && row.duration > 2.5) {
    const t = row.localStart + 0.8 + hash('ag', row.row) * (row.duration - 2.2);
    robots.Antigravity.leans.push({ t0: t, t1: t + 1.2, nod: 0.22, in: 0.3, out: 0.4 });
  }
}

function actRow(row, rows, robots, prop, tableImpulses, cues, shots) {
  const S = row.speaker;
  const t0 = row.localStart;
  if (row.row === 17) return chaos(row, robots, prop, tableImpulses, cues);
  if (row.row === 20) return unisonTurn(row, robots, cues, shots);
  if (robots[S]) {
    talk(robots[S], t0, row.duration, row.env);
    listen(robots, S, row);
  }
  const on = row.onsets;
  switch (row.row) {
    case 3: {
      const hit = t0 + hitRel(cues, 'gavel-1', 3, row.duration - 0.6);
      for (const n of PANEL) robots[n].looks.push({ t: t0 + 0.25 + 0.3 * hash(n, 'r3'), yaw: lookOffset(n, headPoint('Conductor'), 0.45) });
      gavelStrike(prop, robots, tableImpulses, hit);
      break;
    }
    case 4: {
      const hit = t0 + hitRel(cues, 'paper-thud', 4, 0.25);
      robots.Claude.hops.push({ t: t0 - 0.02, height: 0.07, anticip: 0.12 });
      paperDrop(prop, robots, tableImpulses, hit, { hop: true });
      robots.Claude.looks.push({ t: t0 + 0.6, yaw: lookOffset('Claude', new THREE.Vector3(0, 1, 2)) * 0.5 });
      break;
    }
    case 5: {
      const toClaude = leanToward('Cursor', headPoint('Claude'), 0.34, 0.16);
      const away = leanToward('Cursor', headPoint('Claude'), -0.1, -0.03);
      const r6 = rows.find((r) => r.row === 6);
      // Cursor is back on its seat before the row-6 reverse starts (it would block the lens)
      const release = r6 ? r6.localStart - 0.4 : row.end;
      robots.Cursor.leans.push({ t0: t0 - 0.14, t1: t0 + 0.06, ...away, in: 0.08, out: 0.06 });
      robots.Cursor.leans.push({ t0: t0 + 0.02, t1: release, ...toClaude, in: 0.22, out: 0.35 });
      // (Cursor's look at the lens beside Claude comes from playToCamera)
      const recoil = leanToward('Claude', headPoint('Cursor'), -0.12, -0.04);
      robots.Claude.leans.push({ t0: t0 + 0.45, t1: release, ...recoil });
      robots.Claude.looks.push({ t: t0 + 0.35, yaw: lookOffset('Claude', headPoint('Cursor')) });
      break;
    }
    case 6: {
      robots.Claude.eyes.push({ t0: t0 + 0.05, t1: row.end - 0.05, sx: 1.12, sy: 0.42 });
      // (Claude's look at the lens beside Cursor comes from playToCamera)
      const confront = leanToward('Claude', headPoint('Cursor'), 0.12, 0.03);
      robots.Claude.leans.push({ t0: t0 + 0.2, t1: row.end, ...confront, in: 0.4 });
      break;
    }
    case 8: {
      const rise = t0 + (on[1] ?? 1.2) - 0.1;
      laptopFloat(prop, rise);
      robots.Antigravity.leans.push({ t0: rise - 0.1, t1: rise + 1.2, nod: 0.16 });
      robots.Antigravity.hops.push({ t: t0 + (on[on.length - 1] ?? row.duration - 0.8), height: 0.05, anticip: 0.1 });
      break;
    }
    case 9: {
      robots.OpenCode.hops.push({ t: t0 + 0.02, height: 0.08, anticip: 0.12 });
      robots.OpenCode.shakes.push({ t0: t0 + 0.05, t1: t0 + 0.75, amp: 0.18, hz: 4 });
      paddleRaise(prop, t0 + 0.06, row.end + 0.4);
      break;
    }
    case 10: {
      // (Antigravity's look comes from playToCamera)
      robots.Antigravity.leans.push({ t0: t0 + (on[0] ?? 0.35), t1: row.end, squash: -0.07, nod: 0.08, in: 0.15 });
      break;
    }
    case 12: {
      const merged = t0 + (on[1] ?? 1.1);
      robots.Codex.hops.push({ t: merged - 0.02, height: 0.1, anticip: 0.14, depth: 0.2 });
      robots.Codex.leans.push({ t0: merged + 0.4, t1: row.end, nod: 0.1, squash: 0.04 });
      break;
    }
    case 13: {
      robots.Claude.eyes.push({ t0: t0 + 0.05, t1: row.end + 0.2, sx: 1.35, sy: 1.35 });
      robots.Claude.looks.push({ t: t0 - 0.1, yaw: lookOffset('Claude', headPoint('Codex')) });
      const lean = leanToward('Claude', headPoint('Codex'), 0.12, 0.04);
      robots.Claude.leans.push({ t0, t1: row.end + 0.2, ...lean });
      robots.Codex.looks.push({ t: t0 + 0.15, yaw: lookOffset('Codex', headPoint('Claude')) });
      break;
    }
    case 14: {
      const hit = t0 + hitRel(cues, 'mug-sip-14', 14, 1.5);
      mugSip(prop, hit);
      robots.Codex.looks.push({ t: t0, yaw: lookOffset('Codex', headPoint('Claude')) });
      break;
    }
    case 18: {
      const hit = t0 + hitRel(cues, 'gavel-2', 18, 0.05);
      gavelStrike(prop, robots, tableImpulses, hit, 1.35);
      for (const n of PANEL) robots[n].looks.push({ t: hit + 0.25 + 0.12 * hash(n, 18), yaw: lookOffset(n, headPoint('Conductor')) });
      break;
    }
    default:
      break;
  }
}

// The speaker of a single plays half to the lens; in an over-the-shoulder the
// speaker looks at the listener (who is next to the lens).
function playToCamera(robots, shots) {
  const centre = new THREE.Vector3(0, SET.table.top, 0);
  for (const s of shots) {
    const who = robots[s.subject];
    if (!who || s.subject === 'Conductor') continue;
    if (s.kind === 'single') {
      const aim = s.to.pos.clone().lerp(centre, 0.35);
      who.looks.push({ t: s.t0 - 0.15, yaw: lookOffset(s.subject, aim, 0.9) });
    } else if (s.kind === 'ots' && s.foreground) {
      // talk to the listener but play to the lens beside it, so the screen reads
      const aim = headPoint(s.foreground).lerp(s.to.pos, 0.85);
      who.looks.push({ t: s.t0 - 0.25, yaw: lookOffset(s.subject, aim, 1.6) });
    }
  }
}

// Row 17: five fragments overlap; robots hop into each other and the sheets fly.
function chaos(row, robots, prop, tableImpulses, cues) {
  const t0 = row.localStart;
  const layers = voiceLayers(17, cues) || PANEL.map((n, i) => ({ speaker: n, offset: i * 0.5, duration: 1 }));
  // who barges into whom on their fragment; Antigravity floats straight up and
  // OpenCode hops in place behind its paddle (so nobody passes through the paddle)
  const neighbour = { Claude: 'Cursor', Cursor: 'Antigravity', Antigravity: 'float', OpenCode: 'hop', Codex: 'OpenCode' };
  for (const l of layers) {
    const n = l.speaker;
    if (!robots[n]) continue;
    const at = t0 + (l.offset || 0);
    talk(robots[n], at, l.duration || 1, row.env, 1.1);
    if (neighbour[n] === 'hop') {
      robots[n].hops.push({ t: at + 0.04, height: 0.1, anticip: 0.1 });
    } else if (neighbour[n] !== 'float') {
      const nb = seatOf(neighbour[n]);
      const me = seatOf(n);
      const d = new THREE.Vector2(nb.x - me.x, nb.z - me.z).normalize();
      const v = 2.5 + 0.3 * hash(n, 'jv');
      robots[n].hops.push({ t: at + 0.04, height: 0.12 + 0.03 * hash(n, 'jh'), anticip: 0.1, vx: d.x * v, vz: d.y * v });
    } else {
      robots[n].hops.push({ t: at + 0.04, height: 0.24, anticip: 0.14, depth: 0.2 });
    }
    // glance around wildly, but shout your fragment at the middle of the table
    PANEL.filter((m) => m !== n).forEach((m, k) => {
      const t = t0 + 0.3 + k * 0.55 + 0.2 * hash(n, k);
      if (hash(n, m, 'look') < 0.5 && (t < at - 0.25 || t > at + 0.55)) robots[n].looks.push({ t, yaw: lookOffset(n, headPoint(m)) });
    });
    robots[n].looks.push({ t: at - 0.12, yaw: 0 });
  }
  robots.OpenCode.shakes.push({ t0: t0 + 1.5, t1: t0 + 2.3, amp: 0.22, hz: 4.5 });
  sheetsFly(prop, t0 + 0.12);
  paddleRaise(prop, t0 + 1.52, t0 + 1.85);
  tableImpulses.push({ t: t0 + 0.6, v: 0.12 }, { t: t0 + 1.6, v: 0.1 });
  // the Conductor, deadpan, lifts the gavel at the very end (it lands in table-verdict)
  robots.Conductor.looks.push({ t: t0 + 0.4, yaw: 0 });
  gavelRaise(prop, t0 + row.duration - 0.32);
}

// Row 20: the only deliberate unison move: all five turn to camera together.
function unisonTurn(row, robots, cues, shots) {
  const t = row.localStart - 0.12;
  const wide = shots.find((s) => s.row === 20);
  const cam = wide ? wide.to.pos : new THREE.Vector3(0, 1.9, 4.6);
  for (const n of PANEL) {
    robots[n].looks.push({ t, yaw: lookOffset(n, cam, 1.6) });
    robots[n].yawHz = 2.4;
    robots[n].yawZeta = 0.42;
    talk(robots[n], row.localStart, row.duration, row.env, 0.9);
  }
}

// ---------------------------------------------------------------- props

function supportFactory(prop) {
  // floor -> riser -> table top (riding the table spring) -> other paper (stacking)
  return (selfIndex) => (x, z, i, results, y) => {
    let h = Math.hypot(x, z + 0.3) < 3.1 ? SET.riser : 0;
    if (Math.hypot(x, z) < SET.table.radius - 0.01) h = SET.table.top + (results.__table?.[i] || 0);
    for (let k = 0; k < selfIndex; k++) {
      const other = prop.paper[k];
      const tr = results[other.id];
      if (!tr) continue;
      const ox = tr.x[i], oz = tr.z[i], oy = tr.y[i];
      const yaw = tr.ry[i];
      const lx = (x - ox) * Math.cos(yaw) - (z - oz) * Math.sin(yaw);
      const lz = (x - ox) * Math.sin(yaw) + (z - oz) * Math.cos(yaw);
      if (Math.abs(lx) < other.hw && Math.abs(lz) < other.hd) {
        const top = oy + other.half.h;
        if (top <= (y ?? 9) + 0.02) h = Math.max(h, top);
      }
    }
    return h;
  };
}

function makeTableProps(world, beats) {
  const P = world.props;
  const prop = { paper: [], list: null, visibility: {} };
  const support = supportFactory(prop);
  const stack = P.stack;
  const restY = SET.table.top;
  // paper: block + loose sheets, all rigid; visible once dropped
  const block = { id: 'paper-block', pos: [stack.pos.x, restY + PAPER.block / 2, stack.pos.z], rot: [0, stack.yaw, 0], half: { h: PAPER.block / 2 }, hw: PAPER.w / 2, hd: PAPER.d / 2, restitution: 0.12, friction: 0.6, events: [], held: [] };
  prop.paper.push(block);
  for (let i = 0; i < PAPER.loose; i++) {
    prop.paper.push({
      id: `paper-${i}`,
      pos: [stack.pos.x, restY + PAPER.block + (i + 0.5) * PAPER.sheet, stack.pos.z],
      rot: [0, stack.yaw + (hash('sheet', i) - 0.5) * 0.08, 0],
      half: { h: PAPER.sheet / 2 }, hw: PAPER.w / 2, hd: PAPER.d / 2,
      restitution: 0.05, friction: 0.32, events: [], held: [], seed: i,
    });
  }
  prop.paper.forEach((p, i) => { p.support = support(i); });
  if (!beats.paperDropped) prop.visibility.paper = 1e9; // shown when dropped

  const plates = world.nameplates.map((np) => ({ id: np.id, pos: np.rest.toArray(), rot: [0, np.restRot.y, 0], half: { h: 0 }, restitution: 0.25, friction: 0.7, events: [], support: () => SET.table.top + 0 }));
  plates.forEach((p) => { p.support = (x, z, i, results) => SET.table.top + (results.__table?.[i] || 0); });
  const mugRest = P.mug.pos;
  const mug = { id: 'mug', spring: true, ridesTable: true, keys: [{ t: -99, pos: mugRest.toArray(), rot: [0, P.mug.yaw, 0], hz: 3, zeta: 0.5 }] };
  const lap = P.laptop.pos;
  const laptop = { id: 'laptop', spring: true, ridesTable: true, keys: [{ t: -99, pos: lap.toArray(), rot: [0, P.laptop.yaw, 0], hz: 2.2, zeta: 0.45 }] };
  const pad = P.paddle.pos;
  const paddle = { id: 'paddle', spring: true, ridesTable: true, keys: [{ t: -99, pos: [pad.x, pad.y + 0.012, pad.z], rot: [-Math.PI / 2, P.paddle.yaw, 0], hz: 4, zeta: 0.4 }] };
  const g = P.gavel.pos;
  const gavel = { id: 'gavel', spring: true, keys: [{ t: -99, pos: g.toArray(), rot: [0, 0, 0], hz: 6, zeta: 0.6 }] };
  prop.plates = plates;
  prop.mug = mug;
  prop.laptop = laptop;
  prop.paddle = paddle;
  prop.gavel = gavel;
  prop.hits = []; // camera shake cues
  prop.list = () => [...prop.paper, ...plates, mug, laptop, paddle, gavel];
  return prop;
}

function paperDrop(prop, robots, tableImpulses, hit, { hop }) {
  const fall = 0.42;
  const tFall = Math.sqrt((2 * fall) / 9.8);
  const release = hit - tFall;
  prop.visibility.paper = release - 1 / FPS;
  prop.paper.forEach((p, i) => {
    const held = [p.pos[0], p.pos[1] + fall, p.pos[2]];
    p.held.push({ t0: -99, t1: release, pos: held });
    if (i > 0 && i >= PAPER.loose - 4) {
      // the top sheets keep sliding after the thud
      const a = hash('slide', i) * Math.PI * 2;
      const v = 0.35 + 0.4 * hash('slidev', i);
      p.events.push({ t: hit + 0.02, v: [Math.cos(a) * v, 0, Math.sin(a) * v], w: [0, (hash('spin', i) - 0.5) * 6, 0] });
    }
  });
  tableImpulses.push({ t: hit, v: 0.16 });
  prop.hits.push({ t: hit, amp: 0.004 });
  if (hop) {
    robots.Cursor.bumps.push({ t: hit + 0.03, vy: 0.35, pitch: 0.4 });
    robots.Claude.bumps.push({ t: hit + 0.01, vy: 0.2, pitch: -0.5 });
  }
}

function sheetsFly(prop, t) {
  prop.paper.forEach((p, i) => {
    if (i === 0) return;
    const out = new THREE.Vector2(p.pos[0], p.pos[2]).normalize();
    const side = new THREE.Vector2(-out.y, out.x);
    const vo = 0.9 + 0.9 * hash('fly', i);
    const vs = (hash('flys', i) - 0.5) * 1.6;
    p.events.push({ t: t + i * 0.02, v: [out.x * vo + side.x * vs, 2.3 + 0.9 * hash('flyy', i), out.y * vo + side.y * vs], w: [(hash('wx', i) - 0.5) * 14, (hash('wy', i) - 0.5) * 10, (hash('wz', i) - 0.5) * 14] });
    p.drag = 1.4;
    p.flutter = 2.5;
    p.tumble = 1;
  });
  prop.paper[0].events.push({ t: t + 0.03, v: [0.15, 0.6, 0.1], w: [0, 1.5, 0] });
}

function laptopFloat(prop, t) {
  const k = prop.laptop.keys[0];
  const up = [k.pos[0] * 0.92, k.pos[1] + 0.46, k.pos[2] * 0.92];
  prop.laptop.keys.push({ t, pos: up, rot: [0.2, k.rot[1] + Math.PI + 0.25, 0.06], hz: 1.6, zeta: 0.42 });
  const t0 = t;
  prop.laptop.bob = (tt) => {
    if (tt < t0 + 0.8) return [0, 0, 0, 0, 0, 0];
    const u = tt - t0;
    return [0, 0.025 * Math.sin(u * 2.2), 0, 0.05 * Math.sin(u * 1.7), 0.08 * Math.sin(u * 0.9), 0.04 * Math.sin(u * 1.3)];
  };
}

function paddleRaise(prop, t, until) {
  const k = prop.paddle.keys[0];
  const open = seatOf('OpenCode');
  // raised to OpenCode's front-right: clear of its ball and of the row-9 lens
  const fwd = new THREE.Vector3(Math.cos(open.yaw), 0, -Math.sin(open.yaw));
  const right = new THREE.Vector3(Math.sin(open.yaw), 0, Math.cos(open.yaw));
  const side = new THREE.Vector3(open.x, 0, open.z).addScaledVector(fwd, 0.45).addScaledVector(right, 0.36);
  prop.paddle.keys.push({ t, pos: [side.x, SET.table.top + 0.38, side.z], rot: [0, open.yaw + Math.PI / 2, 0.15], hz: 4.2, zeta: 0.32 });
  prop.paddle.keys.push({ t: until, pos: k.pos, rot: k.rot, hz: 3, zeta: 0.55 });
  prop.paddle.keys.sort((a, b) => a.t - b.t);
  const prev = prop.paddle.bob;
  prop.paddle.bob = (tt) => {
    const base = prev ? prev(tt) : [0, 0, 0, 0, 0, 0];
    if (tt < t + 0.15 || tt > t + 0.95) return base;
    const u = tt - t - 0.15;
    base[5] += 0.28 * Math.sin(u * 2 * Math.PI * 4.5) * Math.exp(-u * 1.5);
    return base;
  };
}

function mugSip(prop, hit) {
  const k = prop.mug.keys[0];
  const codex = seatOf('Codex');
  const lift = new THREE.Vector3(k.pos[0], 0, k.pos[2]).lerp(new THREE.Vector3(codex.x, 0, codex.z), 0.45);
  prop.mug.keys.push({ t: hit - 0.6, pos: [lift.x, SET.table.top + 0.32, lift.z], rot: [0, k.rot[1], 0], hz: 2.6, zeta: 0.5 });
  prop.mug.keys.push({ t: hit - 0.12, pos: [lift.x, SET.table.top + 0.36, lift.z], rot: [0.0, k.rot[1], 0.75], hz: 3, zeta: 0.55 });
  prop.mug.keys.push({ t: hit + 0.45, pos: k.pos, rot: k.rot, hz: 2.6, zeta: 0.5 });
}

function gavelRaise(prop, t) {
  const k = prop.gavel.keys[0];
  prop.gavel.keys.push({ t, pos: k.pos, rot: [0, 0, -1.15], hz: 3.5, zeta: 0.6 });
  prop.gavel.keys.sort((a, b) => a.t - b.t);
}

function gavelStrike(prop, robots, tableImpulses, hit, strength = 1) {
  const k = prop.gavel.keys[0];
  if (!prop.gavel.keys.some((x) => x.t < hit && x.t > hit - 1)) prop.gavel.keys.push({ t: hit - 0.42, pos: k.pos, rot: [0, 0, -1.1], hz: 3.5, zeta: 0.6 });
  prop.gavel.keys.push({ t: hit - 0.07, pos: k.pos, rot: [0, 0, 0.03], hz: 13, zeta: 0.32 });
  prop.gavel.keys.push({ t: hit + 0.25, pos: k.pos, rot: [0, 0, 0], hz: 5, zeta: 0.6 });
  prop.gavel.keys.sort((a, b) => a.t - b.t);
  tableImpulses.push({ t: hit + 0.02, v: 0.32 * strength });
  prop.hits.push({ t: hit, amp: 0.012 * strength });
  // the shock lifts everything on the table and the seated robots
  prop.plates.forEach((p, i) => p.events.push({ t: hit + 0.03, v: [0, 0.75 * strength + 0.25 * hash('pl', i), 0], w: [(hash('plw', i) - 0.5) * 3, (hash('ply', i) - 0.5) * 2, (hash('plz', i) - 0.5) * 3] }));
  prop.paper.forEach((p, i) => p.events.push({ t: hit + 0.03 + i * 0.004, v: [(hash('pp', i) - 0.5) * 0.1, (0.55 + 0.25 * hash('ppy', i)) * strength, (hash('ppz', i) - 0.5) * 0.1], w: [0, (hash('ppw', i) - 0.5) * 1.5, 0] }));
  for (const sp of [prop.mug, prop.laptop, prop.paddle]) {
    const bob = sp.bob;
    sp.bob = (tt) => {
      const b = bob ? bob(tt) : [0, 0, 0, 0, 0, 0];
      const u = tt - hit - 0.03;
      if (u > 0 && u < 0.7) {
        const h = 0.045 * strength * Math.abs(Math.sin(u * 9)) * Math.exp(-u * 5);
        b[1] += h;
        b[3] += 0.12 * strength * Math.sin(u * 15) * Math.exp(-u * 6);
      }
      return b;
    };
  }
  for (const n of PANEL) {
    const s = seatOf(n);
    const delay = Math.hypot(s.x, s.z - SET.bench.z) / 9;
    robots[n].bumps.push({ t: hit + 0.03 + delay, vy: (0.55 + 0.2 * hash(n, 'gv')) * strength, pitch: (hash(n, 'gp') - 0.5) * 1.4, roll: (hash(n, 'gr') - 0.5) * 1.2 });
  }
  robots.Conductor.bumps.push({ t: hit, pitch: -0.9 });
}

// ---------------------------------------------------------------- booth & punch

export function buildBoothActing(cfg, world, cues) {
  const name = cfg.agent;
  const rows = rowInfo(cfg, cues);
  const robot = emptyRobot(name, { seat: world.robot.seat, scale: BOOTH.robotScale, seedTag: cfg.id });
  const props = [];
  const restYaw = world.robot.seat.yaw;
  const toCamera = -Math.PI / 2 - restYaw; // offset that turns the screen to the lens
  for (const row of rows) {
    const t0 = row.localStart;
    talk(robot, t0, row.duration, row.env);
    // confessional habit: glance to the lens on alternate phrases, back to the producer
    row.onsets.forEach((o, i) => {
      robot.looks.push({ t: t0 + o - 0.08, yaw: i % 2 ? toCamera * 0.8 : 0.05 * (hash(name, i) - 0.5) });
      if (i > 0 && hash(name, row.row, i, 'h') < 0.35) robot.hops.push({ t: t0 + o - 0.02, height: 0.025 + 0.02 * hash(name, i), anticip: 0.1, depth: 0.12 });
    });
    if (name === 'OpenCode') row.onsets.forEach((o, i) => { if (i < 4) robot.shakes.push({ t0: t0 + o + 0.1, t1: t0 + o + 0.6, amp: 0.14, hz: 3.8 }); });
    if (name === 'Antigravity') {
      const sun = t0 + (row.onsets[1] ?? 1.5);
      robot.leans.push({ t0: sun, t1: sun + 1.6, nod: 0.3, in: 0.35, out: 0.5 });
    }
    if (name === 'Cursor') {
      const last = t0 + (row.onsets[row.onsets.length - 1] ?? row.duration - 1);
      robot.leans.push({ t0: last, t1: row.end + 0.3, pitch: -0.14, in: 0.3 });
    }
    if (name === 'Claude') robot.leans.push({ t0: t0 + 0.2, t1: row.end, pitch: -0.05, in: 0.6 });
    if (name === 'Codex' && world.props.mug) {
      const hit = t0 + hitRel(cues, 'mug-sip', row.row, 1.5);
      props.push(boothMug(world, hit));
    }
    if (name === 'Codex' && row.row === 21) robot.leans.push({ t0: row.end - 0.4, t1: row.end + 1, squash: -0.06, nod: -0.08 });
  }
  return { start: -0.5, robots: [robot], props, tableImpulses: [] };
}

function boothMug(world, hit) {
  const s = BOOTH.robotScale;
  const rest = [-0.5, 0.66, 0.1]; // floats beside the robot, clear of the lower-third
  const sip = [-0.36, BOOTH.seatTop + 1.0 * s, 0.22];
  return {
    id: 'mug', spring: true,
    keys: [
      { t: -99, pos: rest, rot: [0, 0.4, 0], hz: 2.4, zeta: 0.5 },
      { t: hit - 0.55, pos: sip, rot: [0, 0.4, 0], hz: 2.8, zeta: 0.5 },
      { t: hit - 0.1, pos: [sip[0] + 0.03, sip[1] + 0.03, sip[2]], rot: [0, 0.4, -0.8], hz: 3, zeta: 0.55 },
      { t: hit + 0.5, pos: rest, rot: [0, 0.4, 0], hz: 2.4, zeta: 0.5 },
    ],
    bob: (t) => [0, 0.012 * Math.sin(t * 2.1), 0, 0, 0, 0.03 * Math.sin(t * 1.3)],
  };
}

export function buildPunchActing(cfg, world, cues) {
  const name = cfg.agent;
  const rows = rowInfo(cfg, cues);
  const robot = emptyRobot(name, { seat: world.robot.seat, scale: BOOTH.robotScale, seedTag: cfg.id });
  const row = rows[0];
  // the word overlay slams at row.localImpact: the lunge peaks there
  const impact = Number.isFinite(row?.localImpact) ? row.localImpact : (row ? row.localStart + (row.onsets[0] ?? 0.14) : 0.14);
  const lungeAt = Math.max(0.1, impact - 0.06);
  robot.lunges.push({ t: lungeAt, dist: 1.0, anticip: 0.12 });
  robot.eyes.push({ t0: lungeAt - 0.05, t1: (row?.end ?? 0.8) + 0.3, sx: 1.3, sy: 1.3 });
  if (row) talk(robot, row.localStart, row.duration, row.env, 1.2);
  return { start: -0.4, robots: [robot], props: [], tableImpulses: [], lungeAt };
}
