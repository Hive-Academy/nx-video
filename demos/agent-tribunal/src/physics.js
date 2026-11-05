// Deterministic physics for the Tribunal.
//
// Everything is simulated once, at mount, with a fixed 1/120 s step over the
// scene's duration and stored in Float32Arrays. Rendering only samples those
// arrays by time, so any frame renders the same in any order.
//
// Robots: ballistic hops (anticipation squash, airtime, landing squash), a
// damped spring between feet and ball (the ball lags and wobbles), voice-driven
// squash + nods, look/lean/shake springs, lateral jostle with sphere collisions.
// Props: rigid bodies on the table/floor (gravity, bounce, Coulomb friction,
// settle-flat), plus floating "telekinetic" props on springs. The table top is
// itself a spring that impulses (gavel, paper thud) excite.
import { STEP, FPS, clamp, hash, springCoeffs, sampleEnvelope, keyedHold } from './util.js';

export const PARAMS = {
  robot: {
    gravity: 9.8, // m/s^2, converted to model units per robot scale
    squash: { hz: 5.0, zeta: 0.38, min: 0.72, max: 1.28 },
    ball: { hz: 3.4, zeta: 0.4, min: -0.17, max: 0.14 }, // ball-to-feet gap spring (model units)
    lean: { hz: 2.2, zeta: 0.45 },
    nod: { hz: 3.2, zeta: 0.42 },
    yaw: { hz: 1.5, zeta: 0.5 },
    head: { hz: 2.6, zeta: 0.45 },
    lunge: { hz: 4.2, zeta: 0.4 },
    jostleGround: { hz: 2.6, zeta: 0.5 },
    jostleAir: { hz: 0.3, zeta: 0.2 },
    restitution: 0.18,
    collisionRestitution: 0.55,
    talkStretch: 0.075,
    envelopeLag: 2 / FPS,
  },
  table: { hz: 9, zeta: 0.25 },
  prop: { gravity: 9.8, flatten: { hz: 6, zeta: 0.5 } },
};

const CH_ROBOT = ['hop', 'squash', 'ballDy', 'pitch', 'roll', 'nod', 'yaw', 'headYaw', 'wx', 'wz', 'fx', 'eyeSX', 'eyeSY', 'blink', 'glow'];
const CH_PROP = ['x', 'y', 'z', 'rx', 'ry', 'rz'];

function track(n) { return new Float32Array(n + 1); }

export function sampleTrack(arr, t) {
  if (!arr) return 0;
  const x = clamp(t / STEP, 0, arr.length - 1);
  const i = Math.floor(x);
  if (i >= arr.length - 1) return arr[arr.length - 1];
  const f = x - i;
  const v = arr[i] * (1 - f) + arr[i + 1] * f;
  return Number.isFinite(v) ? v : 0;
}

// Damped spring integrated with semi-implicit Euler.
class Spring {
  constructor(hz, zeta, x = 0) { this.x = x; this.v = 0; this.set(hz, zeta); }
  set(hz, zeta) { const { k, c } = springCoeffs(hz, zeta); this.k = k; this.c = c; }
  step(target, dt, force = 0) {
    const a = this.k * (target - this.x) - this.c * this.v + force;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

const activeAt = (list, t) => list.filter((e) => t >= e.t0 && t < e.t1);
const lastBefore = (list, t, fallback) => {
  let cur = fallback;
  for (const e of list) if (e.t <= t) cur = e;
  return cur;
};

// ---------------------------------------------------------------- robots

/**
 * spec: {
 *   id, scale, seed, restYaw (world yaw at rest), seat: {x, z} (world), collide,
 *   talk:   [{t0, t1, env, envStart, gain}]
 *   hops:   [{t, height (m), anticip (s), depth, vx, vz (m/s world)}]
 *   bumps:  [{t, vy (m/s), pitch, roll}]          (impulses, e.g. gavel shock)
 *   looks:  [{t, yaw}]                            (absolute world yaw targets)
 *   leans:  [{t0, t1, pitch, roll, wx, wz}]       (pitch/roll rad, wx/wz metres)
 *   shakes: [{t0, t1, amp, hz}]
 *   eyes:   [{t0, t1, sx, sy}]
 *   lunges: [{t, dist (model units), anticip}]
 * }
 */
function simulateRobot(spec, n, dt, t0) {
  const P = PARAMS.robot;
  const s = spec.scale;
  const g = P.gravity / s; // model units / s^2
  const out = Object.fromEntries(CH_ROBOT.map((c) => [c, track(n)]));
  const squash = new Spring(P.squash.hz, P.squash.zeta, 1);
  const ball = new Spring(P.ball.hz, P.ball.zeta);
  const pitch = new Spring(P.lean.hz, P.lean.zeta);
  const roll = new Spring(P.lean.hz, P.lean.zeta);
  const nod = new Spring(P.nod.hz, P.nod.zeta);
  const yaw = new Spring(spec.yawHz || P.yaw.hz, spec.yawZeta || P.yaw.zeta);
  const head = new Spring(P.head.hz, P.head.zeta);
  const fx = new Spring(P.lunge.hz, P.lunge.zeta);
  const jx = new Spring(P.jostleGround.hz, P.jostleGround.zeta);
  const jz = new Spring(P.jostleGround.hz, P.jostleGround.zeta);
  let hop = 0, vy = 0, air = false;
  let lastLow = -1, envPrev = 0;
  const hops = [...(spec.hops || [])].sort((a, b) => a.t - b.t);
  let hopIdx = 0;
  const bumps = [...(spec.bumps || [])].sort((a, b) => a.t - b.t);
  let bumpIdx = 0;
  const looks = [...(spec.looks || [])].sort((a, b) => a.t - b.t);
  const blinks = blinkSchedule(spec.seed, t0, t0 + n * dt);
  const state = { targets: { wxTarget: 0, wzTarget: 0 } };
  let returnAt = null; // knocked off the seat: hop back onto it

  function takeoff(h) {
    const height = Math.max(0.01, h.height ?? 0.1) / s;
    vy = Math.sqrt(2 * g * height);
    air = true;
    squash.v += vy * 0.9;
    ball.v -= vy * 0.45;
    if (h.vx || h.vz) { jx.v += h.vx || 0; jz.v += h.vz || 0; }
    pitch.v += (hash(spec.seed, h.t, 'p') - 0.5) * 1.2;
  }

  function step(i) {
    const t = t0 + i * dt;
    {
      // --- events that fire this step
      while (hopIdx < hops.length && hops[hopIdx].t <= t) takeoff(hops[hopIdx++]);
      if (returnAt !== null && t >= returnAt && !air) {
        returnAt = null;
        takeoff({ t, height: 0.06 });
        jx.v = -jx.x / 0.24; // airtime of a 6 cm hop is ~0.22 s
        jz.v = -jz.x / 0.24;
      }
      while (bumpIdx < bumps.length && bumps[bumpIdx].t <= t) {
        const b = bumps[bumpIdx++];
        if (b.vy) { vy = Math.max(vy, b.vy / s); air = true; ball.v -= (b.vy / s) * 0.6; squash.v -= (b.vy / s) * 0.5; }
        pitch.v += b.pitch || 0;
        roll.v += b.roll || 0;
        jx.v += b.vx || 0;
        jz.v += b.vz || 0;
      }

      // --- targets
      let squashTarget = 1, ballTarget = air ? 0.05 : 0, pitchTarget = 0, rollTarget = 0, nodTarget = 0;
      let fxTarget = 0, wxTarget = 0, wzTarget = 0;
      for (const h of hops) {
        const a = h.anticip ?? 0.12;
        if (t >= h.t - a && t < h.t) { squashTarget = Math.min(squashTarget, 1 - (h.depth ?? 0.16)); ballTarget = -0.06; }
      }
      for (const l of activeAt(spec.leans || [], t)) {
        const w = keyedHold(t, l.t0, l.t1, l.in ?? 0.25, l.out ?? 0.35);
        pitchTarget += (l.pitch || 0) * w;
        rollTarget += (l.roll || 0) * w;
        wxTarget += (l.wx || 0) * w;
        wzTarget += (l.wz || 0) * w;
        nodTarget += (l.nod || 0) * w;
        squashTarget += (l.squash || 0) * w;
      }
      for (const l of spec.lunges || []) {
        const a = l.anticip ?? 0.12;
        if (t >= l.t - a && t < l.t) { fxTarget = -0.2 * l.dist; squashTarget = Math.min(squashTarget, 0.87); pitchTarget += 0.2; }
        else if (t >= l.t && t < l.t + (l.hold ?? 10)) {
          // drive past the mark, then the spring recoils to a held 70%
          fxTarget = t < l.t + 0.14 ? l.dist : 0.7 * l.dist;
          pitchTarget += t < l.t + 0.12 ? -0.3 : 0;
        }
      }
      // --- voice: squash/stretch, glow and onset nods (sampled 2 frames late)
      let e = 0;
      for (const tk of spec.talk || []) {
        if (t < tk.t0 || t >= tk.t1) continue;
        e = Math.max(e, (tk.gain ?? 1) * sampleEnvelope(tk.env, t - tk.envStart - P.envelopeLag));
      }
      e = clamp(e, 0, 1.2);
      squashTarget += P.talkStretch * e;
      nodTarget += -0.05 * e;
      if (e < 0.2) lastLow = t;
      if (e > 0.42 && envPrev <= 0.42 && t - lastLow < 0.25) {
        nod.v -= 1.3 + 1.4 * hash(spec.seed, 'nod', i);
        roll.v += (hash(spec.seed, 'roll', i) - 0.5) * 0.9;
      }
      envPrev = e;

      // --- hop integration (model units)
      if (air) {
        vy -= g * dt;
        hop += vy * dt;
        if (hop <= 0) {
          hop = 0;
          const impact = -vy;
          squash.v -= impact * 1.1;
          ball.v -= impact * 0.55;
          pitch.v += (hash(spec.seed, 'land', i) - 0.5) * impact * 0.25;
          roll.v += (hash(spec.seed, 'landr', i) - 0.5) * impact * 0.2;
          if (impact * s > 0.9) vy = impact * P.restitution;
          else {
            vy = 0;
            air = false;
            if (spec.collide && Math.hypot(jx.x, jz.x) > 0.08) returnAt = t + 0.08;
          }
        }
      }
      // lateral jostle: loose while airborne, firm on the seat
      const js = air ? PARAMS.robot.jostleAir : PARAMS.robot.jostleGround;
      jx.set(js.hz, js.zeta);
      jz.set(js.hz, js.zeta);

      squash.step(squashTarget, dt);
      squash.x = clamp(squash.x, P.squash.min, P.squash.max);
      ball.step(ballTarget, dt);
      ball.x = clamp(ball.x, P.ball.min, P.ball.max);
      pitch.step(pitchTarget, dt);
      roll.step(rollTarget, dt);
      nod.step(nodTarget, dt);
      fx.step(fxTarget, dt);

      // look: body follows slowly, the head leads and returns
      const look = lastBefore(looks, t, { yaw: 0 });
      yaw.step(look.yaw, dt);
      head.step(clamp(look.yaw - yaw.x, -0.7, 0.7), dt);
      let shake = 0;
      for (const sh of activeAt(spec.shakes || [], t)) {
        shake += sh.amp * Math.sin(2 * Math.PI * sh.hz * (t - sh.t0)) * keyedHold(t, sh.t0, sh.t1, 0.08, 0.12);
      }

      const k = i;
      out.hop[k] = hop;
      out.squash[k] = squash.x;
      out.ballDy[k] = ball.x;
      out.pitch[k] = pitch.x;
      out.roll[k] = roll.x;
      out.nod[k] = nod.x;
      out.yaw[k] = yaw.x;
      out.headYaw[k] = head.x + shake;
      out.fx[k] = fx.x;
      out.glow[k] = e;
      let sx = 1, sy = 1;
      for (const ev of spec.eyes || []) {
        const w = keyedHold(t, ev.t0, ev.t1);
        sx += ((ev.sx ?? 1) - 1) * w;
        sy += ((ev.sy ?? 1) - 1) * w;
      }
      out.eyeSX[k] = sx;
      out.eyeSY[k] = sy;
      out.blink[k] = blinkAt(blinks, t) * (sy < 0.7 ? 0.3 : 1);
      state.targets = { wxTarget, wzTarget };
    }
  }
  // an impact from a neighbour pops this robot off its seat a little
  function knock(v) {
    vy = Math.max(vy, v / s);
    air = true;
    squash.v -= (v / s) * 0.5;
  }
  return { spec, out, step, state, jx, jz, pitch, roll, knock };
}

function blinkSchedule(seed, from, to) {
  const times = [];
  let t = from - hash(seed, 'b0') * 2.5;
  let i = 0;
  while (t < to + 1) {
    times.push(t);
    if (hash(seed, 'dbl', i) < 0.12) times.push(t + 0.24);
    t += 2.5 + 1.5 * hash(seed, 'gap', i++);
  }
  return times;
}

function blinkAt(times, t) {
  const d = 0.16;
  for (const b of times) {
    const u = (t - b) / d;
    if (u >= 0 && u < 1) return Math.sin(Math.PI * u);
  }
  return 0;
}

// Robots are simulated in lockstep so their balls can collide in world space.
function simulateRobots(specs, n, dt, t0) {
  const sims = specs.map((s) => simulateRobot(s, n, dt, t0));
  const P = PARAMS.robot;
  for (let i = 0; i <= n; i++) {
    for (const sim of sims) sim.step(i);
    // lateral jostle springs + sphere collisions between neighbours
    for (const sim of sims) {
      const tg = sim.state.targets || { wxTarget: 0, wzTarget: 0 };
      sim.jx.step(tg.wxTarget, dt);
      sim.jz.step(tg.wzTarget, dt);
      const lim = 0.7;
      sim.jx.x = clamp(sim.jx.x, -lim, lim);
      sim.jz.x = clamp(sim.jz.x, -lim, lim);
    }
    for (let a = 0; a < sims.length; a++) {
      for (let b = a + 1; b < sims.length; b++) {
        const A = sims[a], B = sims[b];
        if (!A.spec.collide || !B.spec.collide) continue;
        const ax = A.spec.seat.x + A.jx.x, az = A.spec.seat.z + A.jz.x;
        const bx = B.spec.seat.x + B.jx.x, bz = B.spec.seat.z + B.jz.x;
        const ay = A.out.hop[i] * A.spec.scale, by = B.out.hop[i] * B.spec.scale;
        const dx = bx - ax, dz = bz - az, dy = by - ay;
        const dist = Math.hypot(dx, dy, dz);
        const minD = A.spec.radius + B.spec.radius;
        if (dist >= minD || dist < 1e-6) continue;
        const nx = dx / dist, nz = dz / dist;
        // positional correction + velocity impulse along the contact normal
        const push = (minD - dist) / 2;
        A.jx.x -= nx * push; A.jz.x -= nz * push;
        B.jx.x += nx * push; B.jz.x += nz * push;
        const rel = (B.jx.v - A.jx.v) * nx + (B.jz.v - A.jz.v) * nz;
        if (rel < 0) {
          const j = -(1 + P.collisionRestitution) * rel / 2;
          A.jx.v -= j * nx; A.jz.v -= j * nz;
          B.jx.v += j * nx; B.jz.v += j * nz;
          // the impact rocks both balls
          const spin = Math.min(3, j * 4);
          kick(A, -nx, -nz, spin);
          kick(B, nx, nz, spin);
          A.knock(Math.min(0.9, j * 0.35));
          B.knock(Math.min(0.9, j * 0.35));
        }
      }
    }
    for (const sim of sims) {
      sim.out.wx[i] = sim.jx.x;
      sim.out.wz[i] = sim.jz.x;
    }
  }
  return Object.fromEntries(sims.map((s) => [s.spec.id, s.out]));
}

// A world-space push along (nx, nz) tips the ball's top the same way
// (pitch about the robot's right axis, roll about its forward axis).
function kick(sim, nx, nz, spin) {
  const yaw = sim.spec.restYaw;
  const f = nx * Math.cos(yaw) - nz * Math.sin(yaw); // along robot forward
  const r = nx * Math.sin(yaw) + nz * Math.cos(yaw); // along robot right
  sim.pitch.v -= f * spin; // negative pitch tips the top forward
  sim.roll.v += r * spin; // positive roll tips the top to the right
}

// ---------------------------------------------------------------- props

/**
 * Rigid prop: { id, pos:[x,y,z], rot:[x,y,z], half:{h, r} (half height, footprint radius),
 *   support(x, z, self, t) -> floor height under the prop, restitution, friction,
 *   held: [{t0, t1}] (kinematic hold at pos), events: [{t, v:[..], w:[..]}] }
 * Spring prop: { id, spring: true, keys: [{t, pos:[..], rot:[..], hz, zeta}] }
 */
function simulateProps(propSpecs, tableTrack, n, dt, t0) {
  const G = PARAMS.prop.gravity;
  const results = { __table: tableTrack };
  for (const p of propSpecs) {
    const out = Object.fromEntries(CH_PROP.map((c) => [c, track(n)]));
    if (p.spring) {
      const axes = [0, 1, 2].map((a) => new Spring(p.keys[0].hz || 3, p.keys[0].zeta || 0.45, p.keys[0].pos[a]));
      const rots = [0, 1, 2].map((a) => new Spring(p.keys[0].hz || 3, p.keys[0].zeta || 0.45, p.keys[0].rot?.[a] || 0));
      for (let i = 0; i <= n; i++) {
        const t = t0 + i * dt;
        const key = lastBefore(p.keys, t, p.keys[0]);
        const bob = p.bob ? p.bob(t) : [0, 0, 0, 0, 0, 0];
        axes.forEach((s, a) => { s.set(key.hz || 3, key.zeta || 0.45); s.step(key.pos[a], dt); });
        rots.forEach((s, a) => { s.set(key.rhz || key.hz || 3, key.rzeta || key.zeta || 0.45); s.step(key.rot?.[a] || 0, dt); });
        const ty = p.ridesTable ? tableTrack[i] : 0;
        out.x[i] = axes[0].x + bob[0];
        out.y[i] = axes[1].x + bob[1] + ty;
        out.z[i] = axes[2].x + bob[2];
        out.rx[i] = rots[0].x + bob[3];
        out.ry[i] = rots[1].x + bob[4];
        out.rz[i] = rots[2].x + bob[5];
      }
      results[p.id] = out;
      continue;
    }
    const pos = [...p.pos], vel = [0, 0, 0], rot = [...(p.rot || [0, 0, 0])], w = [0, 0, 0];
    const flat = [new Spring(PARAMS.prop.flatten.hz, PARAMS.prop.flatten.zeta, rot[0]), new Spring(PARAMS.prop.flatten.hz, PARAMS.prop.flatten.zeta, rot[2])];
    const events = [...(p.events || [])].sort((a, b) => a.t - b.t);
    let ei = 0;
    let grounded = !p.startAirborne;
    let tumbling = false;
    for (let i = 0; i <= n; i++) {
      const t = t0 + i * dt;
      const held = (p.held || []).find((h) => t >= h.t0 && t < h.t1);
      while (ei < events.length && events[ei].t <= t) {
        const e = events[ei++];
        if (e.pos) { pos[0] = e.pos[0]; pos[1] = e.pos[1]; pos[2] = e.pos[2]; }
        if (e.v) { vel[0] += e.v[0]; vel[1] += e.v[1]; vel[2] += e.v[2]; }
        if (e.w) { w[0] += e.w[0]; w[1] += e.w[1]; w[2] += e.w[2]; flat[0].v += e.w[0]; flat[1].v += e.w[2]; }
        if (p.tumble && e.v && e.v[1] > 1.5) tumbling = true;
        grounded = false;
      }
      if (held) {
        // kinematic: sits at its held pose until released
        out.x[i] = held.pos ? held.pos[0] : pos[0];
        out.y[i] = held.pos ? held.pos[1] : pos[1];
        out.z[i] = held.pos ? held.pos[2] : pos[2];
        out.rx[i] = rot[0]; out.ry[i] = rot[1]; out.rz[i] = rot[2];
        if (held.pos) { pos[0] = held.pos[0]; pos[1] = held.pos[1]; pos[2] = held.pos[2]; }
        vel[0] = vel[1] = vel[2] = 0; // a held prop ignores impulses
        w[0] = w[1] = w[2] = 0;
        continue;
      }
      const floor = p.support(pos[0], pos[2], i, results, pos[1]) + p.half.h;
      if (!grounded) {
        const drag = p.drag || 0;
        vel[1] -= G * dt;
        for (let a = 0; a < 3; a++) vel[a] -= vel[a] * drag * dt;
        if (p.flutter && tumbling) {
          vel[0] += Math.sin(t * 9 + p.seed * 7) * p.flutter * dt;
          vel[2] += Math.cos(t * 7.3 + p.seed * 3) * p.flutter * dt;
        }
        for (let a = 0; a < 3; a++) pos[a] += vel[a] * dt;
        rot[1] += w[1] * dt;
        if (tumbling) {
          // free spin in the air, slowed by air drag
          rot[0] += w[0] * dt;
          rot[2] += w[2] * dt;
          w[0] -= w[0] * drag * 0.5 * dt;
          w[2] -= w[2] * drag * 0.5 * dt;
        } else {
          rot[0] = flat[0].step(0, dt);
          rot[2] = flat[1].step(0, dt);
        }
        if (pos[1] <= floor) {
          pos[1] = floor;
          const impact = -vel[1];
          vel[1] = impact > 0.35 ? impact * (p.restitution ?? 0.2) : 0;
          if (vel[1] === 0) grounded = true;
          vel[0] *= 0.6; vel[2] *= 0.6;
          if (tumbling) {
            // a sheet lands on whichever face is nearer: settle to the nearest flat pose
            tumbling = false;
            flat[0].x = rot[0] - Math.PI * Math.round(rot[0] / Math.PI);
            flat[1].x = rot[2] - Math.PI * Math.round(rot[2] / Math.PI);
            flat[0].v = 0; flat[1].v = 0;
            rot[0] = flat[0].x; rot[2] = flat[1].x;
          }
          w[0] *= 0.3; w[2] *= 0.3;
        }
      } else {
        // sliding on the support with Coulomb friction; rides the table top
        const mu = (p.friction ?? 0.4) * G;
        const sp = Math.hypot(vel[0], vel[2]);
        if (sp > 1e-4) {
          const dec = Math.min(sp, mu * dt);
          vel[0] -= (vel[0] / sp) * dec;
          vel[2] -= (vel[2] / sp) * dec;
        }
        pos[0] += vel[0] * dt;
        pos[2] += vel[2] * dt;
        w[1] *= Math.max(0, 1 - 6 * dt);
        rot[1] += w[1] * dt;
        rot[0] = flat[0].step(0, dt);
        rot[2] = flat[1].step(0, dt);
        const f2 = p.support(pos[0], pos[2], i, results, pos[1]) + p.half.h;
        if (f2 < pos[1] - 0.004) {
          // support fell away (slid off an edge, or the prop below is falling):
          // leave the ground with the support's downward speed, not from rest
          const drop = pos[1] - f2;
          vel[1] = drop < 0.06 ? -drop / dt : 0;
          grounded = false;
        } else pos[1] = f2;
      }
      out.x[i] = pos[0]; out.y[i] = pos[1]; out.z[i] = pos[2];
      out.rx[i] = rot[0]; out.ry[i] = rot[1]; out.rz[i] = rot[2];
    }
    results[p.id] = out;
  }
  return results;
}

// Table top: a stiff damped spring; impulses in m/s.
function simulateTable(impulses, n, dt, t0) {
  const out = track(n);
  const s = new Spring(PARAMS.table.hz, PARAMS.table.zeta);
  const list = [...impulses].sort((a, b) => a.t - b.t);
  let k = 0;
  for (let i = 0; i <= n; i++) {
    const t = t0 + i * dt;
    while (k < list.length && list[k].t <= t) s.v += list[k++].v;
    out[i] = clamp(s.step(0, dt), -0.03, 0.03);
  }
  return out;
}

/**
 * Run the whole scene from `start` (may be negative: a pre-roll that settles
 * earlier events, e.g. the paper stack from an earlier scene) to `duration`.
 * Prop support functions receive (x, z, stepIndex, results, y) and may read the
 * tracks of props listed before them (stacking) and `results.__table`.
 */
export function simulate({ duration, start = 0, robots = [], props = [], tableImpulses = [] }) {
  const dt = STEP;
  const t0 = Math.min(0, start);
  const n = Math.max(1, Math.ceil((Math.max(0.1, duration + 0.5) - t0) / dt));
  const table = simulateTable(tableImpulses, n, dt, t0);
  const robotTracks = simulateRobots(robots, n, dt, t0);
  const propTracks = simulateProps(props.map((p) => ({ ...p, support: p.support || (() => 0) })), table, n, dt, t0);
  const at = (arr, t) => sampleTrack(arr, t - t0);
  return {
    duration,
    t0,
    table,
    robots: robotTracks,
    props: propTracks,
    robotPose(id, t) {
      const tr = robotTracks[id];
      const pose = {};
      if (!tr) return pose;
      for (const c of CH_ROBOT) pose[c] = at(tr[c], t);
      return pose;
    },
    propPose(id, t) {
      const tr = propTracks[id];
      if (!tr) return null;
      return CH_PROP.map((c) => at(tr[c], t));
    },
    tableDy(t) { return at(table, t); },
  };
}
