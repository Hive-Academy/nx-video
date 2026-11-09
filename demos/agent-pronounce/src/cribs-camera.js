// The Cribs camera: a handheld 28 mm (fov 62) operator who walks with the hosts.
//
// A shot is {cam, t0, t1, sample(t) -> {pos, target, fov}, whipIn, whipOut, dist}.
// Framing is solved in world space from the robots' bounding spheres (frameSphere /
// aimAt in camera.js). Follow shots read the simulated robot, smoothed with a short
// trailing box filter of samples, so the operator lags a little and never jitters.
// On top of every shot: seeded handheld wobble (0.8 deg roll, 10 px, 1.6 Hz) and
// 6-frame whip pans at room changes, which the mount turns into a horizontal smear.
import * as THREE from 'three';
import { frameSphere, aimAt, frame } from './camera.js';
import { ROBOT } from './robot.js';
import { ease, clamp, lerp, noise1, deg, FPS } from './util.js';

export const FOV = 62;
export const WHIP = 6 / FPS;
const HALF_WHIP = WHIP / 2;
const UP = new THREE.Vector3(0, 1, 0);

// Simulated ball centre of a robot (world), from the sampled physics pose.
export function simCentre(sim, spec, t, out = new THREE.Vector3()) {
  const p = sim.robotPose(spec.id, t);
  const s = spec.scale;
  return out.set(
    (p.px ?? spec.seat.x) + (p.wx || 0),
    spec.plan.y + (p.lift || 0) + (Math.max(0, p.hop || 0) + ROBOT.ballCenterY + (p.ballDy || 0)) * s,
    (p.pz ?? spec.seat.z) + (p.wz || 0),
  );
}

// Trailing average of the ball centre: the operator's reaction lag.
export function smoothCentre(sim, spec, t, { window = 0.3, n = 7, yWeight = 0.35 } = {}) {
  const acc = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let w = 0;
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n;
    simCentre(sim, spec, t - (window * i) / (n - 1), tmp);
    acc.addScaledVector(tmp, k);
    w += k;
  }
  acc.multiplyScalar(1 / w);
  // vertical hop motion is mostly ignored: the operator keeps the horizon steady
  const now = simCentre(sim, spec, t, tmp);
  const restY = spec.plan.y + ROBOT.ballCenterY * spec.scale;
  acc.y = lerp(restY + ((now.y - restY) * 0.2), acc.y, yWeight);
  return acc;
}

// Direction from a subject toward the camera: azimuth relative to a facing yaw.
export function dirFromYaw(yaw, azDeg = 0, elDeg = 6) {
  const a = yaw + deg(azDeg);
  const d = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
  const right = new THREE.Vector3().crossVectors(d, UP).normalize();
  return d.applyAxisAngle(right, deg(elDeg)).normalize();
}

const clonePose = (p) => ({ pos: p.pos.clone(), target: p.target.clone(), fov: p.fov });
function lerpPose(a, b, u) {
  return { pos: a.pos.clone().lerp(b.pos, u), target: a.target.clone().lerp(b.target, u), fov: lerp(a.fov, b.fov, u) };
}

// ---------------------------------------------------------------- shot makers

/** A framed single on a sphere (ball centre + radius), with a 12-frame push and a drift. */
export function framed(cam, centre, radius, dir, { fill = 0.34, fov = FOV, ndcX = 0, ndcY = 0.18, push = 0.35, pushDur = 12 / FPS, drift = 0.12, driftDir = null, ease: pe = ease.power2InOut } = {}) {
  const to = frameSphere({ centre, radius, dir, fov, fill, ndcX, ndcY });
  const back = dir.clone().multiplyScalar(push);
  const from = { pos: to.pos.clone().add(back), target: to.target.clone().add(back.clone().multiplyScalar(0.5)), fov };
  const dd = driftDir ? driftDir.clone().normalize() : dir.clone().negate();
  const end = { pos: to.pos.clone().addScaledVector(dd, drift), target: to.target.clone().addScaledVector(dd, drift * 0.4), fov };
  return {
    cam, dist: to.pos.distanceTo(centre), to,
    sample(t, shot) {
      const local = t - shot.t0;
      if (local < pushDur) return lerpPose(from, to, pe(local / pushDur));
      const span = Math.max(0.5, shot.t1 - shot.t0 - pushDur);
      return lerpPose(to, end, ease.sineInOut((local - pushDur) / span));
    },
  };
}

/** Fixed keyed camera: [{t (scene-local), pos, target, fov, ease}] interpolated. */
export function keyed(cam, keys, { dist = 3 } = {}) {
  const K = keys.map((k) => ({ ...k, pos: k.pos.clone(), target: k.target.clone(), fov: k.fov ?? FOV }));
  return {
    cam, dist,
    sample(t) {
      if (t <= K[0].t) return clonePose(K[0]);
      for (let i = 1; i < K.length; i++) {
        if (t < K[i].t) {
          const e = K[i].ease || ease.power2InOut;
          return lerpPose(K[i - 1], K[i], e((t - K[i - 1].t) / Math.max(1e-3, K[i].t - K[i - 1].t)));
        }
      }
      return clonePose(K[K.length - 1]);
    },
  };
}

/**
 * Walk-and-talk follow: the camera keeps `offset` (world m) from the subject's
 * smoothed ball centre, at robot height, composing the face at (ndcX, ndcY).
 * offset may be a function of t (a slow arc). `lead` slides the camera ahead.
 */
export function follow(cam, getSim, spec, { offset, fov = FOV, ndcX = 0, ndcY = 0.18, aimY = 0, minY = 0.35 } = {}) {
  return {
    cam,
    dist: typeof offset === 'function' ? offset(0).length() : offset.length(),
    sample(t) {
      const c = smoothCentre(getSim(), spec, t);
      const off = typeof offset === 'function' ? offset(t) : offset;
      const pos = c.clone().add(off);
      pos.y = Math.max(minY, pos.y);
      const aim = c.clone();
      aim.y += aimY;
      return { pos, target: aimAt(pos, aim, fov, ndcX, ndcY), fov };
    },
  };
}

/** Any custom sampler. */
export function custom(cam, sample, dist = 3) {
  return { cam, dist, sample };
}

// ---------------------------------------------------------------- plan + sampling

/**
 * shots: [{t0, ...shot}] in time order. Fills t1, clamps the first to 0.
 * whipIn / whipOut: +1 (pan right) or -1 (pan left) for 6-frame whips at the seams.
 */
export function finalizeShots(shots, duration) {
  shots.sort((a, b) => a.t0 - b.t0);
  shots.forEach((s, i) => { s.t1 = i + 1 < shots.length ? shots[i + 1].t0 : duration + 1; });
  if (shots.length) shots[0].t0 = Math.min(0, shots[0].t0);
  return shots;
}

export function activeShotAt(shots, t) {
  let cur = shots[0];
  for (const s of shots) if (t >= s.t0) cur = s;
  return cur;
}

// Whip pan as an extra yaw after lookAt (radians) and its angular speed.
const WHIP_ANGLE = deg(38);
function whipAt(shot, t, duration) {
  let angle = 0, speed = 0;
  const into = t - shot.t0;
  if (shot.whipIn && into < HALF_WHIP) {
    // arriving: the pan lands, decelerating (second half of the whip)
    const u = clamp(into / HALF_WHIP);
    angle = -shot.whipIn * WHIP_ANGLE * (1 - ease.power2Out(u));
    speed = WHIP_ANGLE * 2 * (1 - u) / HALF_WHIP;
  }
  const end = Math.min(shot.t1, duration);
  const left = end - t;
  if (shot.whipOut && left < HALF_WHIP && left >= -1e-6) {
    const u = clamp(1 - left / HALF_WHIP);
    angle += shot.whipOut * WHIP_ANGLE * ease.power2In(u);
    speed = Math.max(speed, WHIP_ANGLE * 2 * u / HALF_WHIP);
  }
  return { angle, speed };
}

// Cribs handheld: 0.8 deg roll, ~10 px translation, 1.6 Hz, seeded per shot.
export function cribsHandheld(t, seed, distance, fov) {
  const px = (10 / frame.h) * 2 * Math.max(0.5, distance) * Math.tan(deg(fov) / 2);
  const f = 1.6;
  return {
    dx: noise1(t * f, `${seed}x`) * px,
    dy: noise1(t * f + 17, `${seed}y`) * px * 0.8,
    roll: noise1(t * f * 0.9 + 5, `${seed}r`) * deg(0.8),
    pan: noise1(t * f * 1.1 + 9, `${seed}p`) * deg(0.3),
  };
}

/** Sample the camera at t: pose, extra pan/roll, offset and the whip smear (px). */
export function sampleCamera(shots, t, duration, seed) {
  const shot = activeShotAt(shots, t);
  const pose = shot.sample(t, shot);
  const h = shot.still ? { dx: 0, dy: 0, roll: 0, pan: 0 } : cribsHandheld(t, `${seed}-${shot.cam}`, shot.dist || 3, pose.fov);
  const f = pose.target.clone().sub(pose.pos).normalize();
  const right = new THREE.Vector3().crossVectors(f, UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, f).normalize();
  const offset = right.multiplyScalar(h.dx).addScaledVector(up, h.dy);
  const w = whipAt(shot, t, duration);
  // horizontal smear: angular speed x focal length in px over one frame
  const focalPx = (frame.h / 2) / Math.tan(deg(pose.fov) / 2);
  let smear = Math.min(180, (w.speed / FPS) * focalPx * 0.6);
  if (shot.smearAt) smear = Math.max(smear, shot.smearAt(t));
  return { shot, pose, offset, roll: h.roll, pan: h.pan - w.angle, smear: smear > 2 ? smear : 0 };
}
