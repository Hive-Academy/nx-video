// World-space camera rig and the shot plan.
//
// A shot is a pose ladder of {pos, target, fov} in metres/degrees. Framing is
// solved in 3D: we place the camera along a direction from the subject and
// solve distance (or fov) so the subject's ball projects to a given fraction of
// frame height, then rotate the view so the subject lands at a chosen NDC
// position, verified by projecting with a real PerspectiveCamera.
import * as THREE from 'three';
import { ease, clamp, lerp, noise1, FPS, deg } from './util.js';
import { restPoints } from './robot.js';
import { SET } from './set-table.js';

const ASPECT = 16 / 9;
const UP = new THREE.Vector3(0, 1, 0);
const PUSH = 12 / FPS; // 12-frame pushes
const WHIP = 6 / FPS; // 6-frame whips

const probe = new THREE.PerspectiveCamera(35, ASPECT, 0.05, 100);

function project(point, pos, target, fov) {
  probe.fov = fov;
  probe.aspect = ASPECT;
  probe.position.copy(pos);
  probe.up.copy(UP);
  probe.lookAt(target);
  probe.updateProjectionMatrix();
  probe.updateMatrixWorld(true);
  return point.clone().project(probe);
}

// Rotate the view so `centre` lands at (ndcX, ndcY); returns the target point.
function aimAt(pos, centre, fov, ndcX, ndcY) {
  const target = centre.clone();
  const d = pos.distanceTo(centre);
  const tanV = Math.tan(deg(fov) / 2);
  const tanH = tanV * ASPECT;
  for (let i = 0; i < 6; i++) {
    const p = project(centre, pos, target, fov);
    const ex = ndcX - p.x, ey = ndcY - p.y;
    if (Math.abs(ex) < 1e-4 && Math.abs(ey) < 1e-4) break;
    const f = target.clone().sub(pos).normalize();
    const r = new THREE.Vector3().crossVectors(f, UP).normalize();
    const u = new THREE.Vector3().crossVectors(r, f).normalize();
    target.addScaledVector(r, -ex * tanH * d).addScaledVector(u, -ey * tanV * d);
  }
  return target;
}

// Projected height (NDC units / 2 = fraction of frame height) of a sphere.
function sphereFill(pos, target, fov, centre, radius) {
  const f = target.clone().sub(pos).normalize();
  const r = new THREE.Vector3().crossVectors(f, UP).normalize();
  const u = new THREE.Vector3().crossVectors(r, f).normalize();
  const top = project(centre.clone().addScaledVector(u, radius), pos, target, fov);
  const bot = project(centre.clone().addScaledVector(u, -radius), pos, target, fov);
  return Math.abs(top.y - bot.y) / 2;
}

/** Place the camera along `dir` from the subject so the ball fills `fill` of frame height. */
export function frameSphere({ centre, radius, dir, fov, fill, ndcX = 0, ndcY = 0 }) {
  const tanA = clamp(fill, 0.05, 0.98) * Math.tan(deg(fov) / 2);
  let d = radius / Math.sin(Math.atan(tanA));
  const n = dir.clone().normalize();
  let pos = centre.clone().addScaledVector(n, d);
  let target = aimAt(pos, centre, fov, ndcX, ndcY);
  for (let i = 0; i < 3; i++) {
    const got = sphereFill(pos, target, fov, centre, radius);
    if (!(got > 1e-4)) break;
    d *= got / fill;
    pos = centre.clone().addScaledVector(n, d);
    target = aimAt(pos, centre, fov, ndcX, ndcY);
  }
  return { pos, target, fov };
}

/** Fixed camera position; solve fov so the ball fills `fill`, then compose. */
function fovToFill(pos, centre, radius, fill, ndcX, ndcY) {
  const d = pos.distanceTo(centre);
  const fov = clamp(2 * Math.atan(Math.tan(Math.asin(clamp(radius / d, 0, 0.99))) / fill) * (180 / Math.PI), 18, 50);
  return { pos: pos.clone(), target: aimAt(pos, centre, fov, ndcX, ndcY), fov };
}

const pose = (pos, target, fov) => ({ pos: pos.clone(), target: target.clone(), fov });
const dirFrom = (fwd, azDeg, elDeg) => {
  const d = fwd.clone().applyAxisAngle(UP, deg(azDeg));
  const right = new THREE.Vector3().crossVectors(d, UP).normalize();
  return d.applyAxisAngle(right, deg(elDeg)).normalize();
};

// ---------------------------------------------------------------- shot builders (table)

function single(world, name, { az = 0, el = 4, fill = 0.48, fov = 32, ndcX = 0, ndcY = 0.1, push = 0.3, drift = 0.08, toward = null } = {}) {
  const r = world.robots[name];
  const p = restPoints(r);
  // `toward`: a reverse/POV single from another robot's side of the table
  const base = toward ? restPoints(world.robots[toward]).centre.clone().sub(p.centre).setY(0).normalize() : p.fwd;
  const dir = dirFrom(base, az, el);
  const to = frameSphere({ centre: p.centre, radius: p.radius, dir, fov, fill, ndcX, ndcY });
  const back = dir.clone().multiplyScalar(push);
  const from = pose(to.pos.clone().add(back), to.target.clone().add(back.clone().multiplyScalar(0.5)), fov);
  const end = pose(to.pos.clone().addScaledVector(dir, -drift), to.target, fov);
  return { kind: 'single', subject: name, from, to, end };
}

// Distance from point p to segment a-b.
function segDist(p, a, b) {
  const ab = b.clone().sub(a);
  const u = clamp(p.clone().sub(a).dot(ab) / Math.max(1e-6, ab.lengthSq()));
  return a.clone().addScaledVector(ab, u).distanceTo(p);
}

/**
 * Over-the-shoulder, solved for a readable speaker:
 *  - the camera sits beside the listener's head, near the speaker's eyeline, so the
 *    speaker (who looks at the listener) shows its screen to the lens within `maxFacing` deg;
 *  - the speaker's ball fills `fill` of frame height (fov solved per candidate);
 *  - the listener's ball is a sliver at one frame edge covering ~`cover` of the frame
 *    area (target 0.14, hard cap 0.25), measured by projecting its sphere;
 *  - candidates whose sight line passes through any other robot are rejected.
 */
// Fraction of the frame covered by each sphere, by casting a 24 x 14 grid of rays
// through the lens (exact for spheres, cheap enough to run per candidate).
function sphereCoverage(spheres, pos, target, fov) {
  const f = target.clone().sub(pos).normalize();
  const r = new THREE.Vector3().crossVectors(f, UP).normalize();
  const u = new THREE.Vector3().crossVectors(r, f).normalize();
  const tanV = Math.tan(deg(fov) / 2);
  const tanH = tanV * ASPECT;
  const hits = spheres.map(() => 0);
  const dir = new THREE.Vector3();
  const oc = new THREE.Vector3();
  const GX = 24, GY = 14;
  for (let gy = 0; gy < GY; gy++) {
    const y = -1 + (2 * gy + 1) / GY;
    for (let gx = 0; gx < GX; gx++) {
      const x = -1 + (2 * gx + 1) / GX;
      dir.copy(f).addScaledVector(r, x * tanH).addScaledVector(u, y * tanV).normalize();
      spheres.forEach((sp, i) => {
        oc.copy(pos).sub(sp.centre);
        const bq = oc.dot(dir);
        const disc = bq * bq - (oc.lengthSq() - sp.radius * sp.radius);
        if (disc > 0 && -bq + Math.sqrt(disc) > 0) hits[i]++;
      });
    }
  }
  return hits.map((h) => h / (GX * GY));
}

function ots(world, listener, speaker, { fill = 0.48, side = 1, maxFacing = 32, cover = 0.13, ndcY = 0.06, drift = 0.05 } = {}) {
  const L = restPoints(world.robots[listener]);
  const S = restPoints(world.robots[speaker]);
  const others = Object.entries(world.robots).filter(([n]) => n !== listener && n !== speaker).map(([, r]) => restPoints(r));
  const u = L.centre.clone().sub(S.centre).setY(0).normalize(); // speaker -> listener
  let best = null;
  for (const sgn of [side, -side]) {
    const sv = new THREE.Vector3().crossVectors(UP, u).normalize().multiplyScalar(sgn);
    for (let beta = -0.2; beta <= 1.6; beta += 0.1) {
      for (let a = 0.35; a <= 1.6; a += 0.075) {
        for (const h of [0.0, 0.1, 0.22, 0.35]) {
          const pos = L.centre.clone().addScaledVector(u, beta).addScaledVector(sv, a).addScaledVector(UP, h);
          const toCam = pos.clone().sub(S.centre).setY(0).normalize();
          const facing = Math.acos(clamp(toCam.dot(u), -1, 1)) * (180 / Math.PI);
          if (facing > maxFacing) continue;
          if (L.centre.distanceTo(pos) < L.radius + 0.12) continue;
          if (segDist(L.centre, pos, S.centre) < L.radius + 0.04) continue;
          if (others.some((o) => segDist(o.centre, pos, S.centre) < o.radius + 0.06 || o.centre.distanceTo(pos) < o.radius + 0.25)) continue;
          if (Math.hypot(pos.x, pos.z) < SET.table.radius + 0.05 && pos.y < SET.table.top + 0.12) continue;
          const dS = pos.distanceTo(S.centre);
          const fov = clamp(2 * Math.atan(Math.tan(Math.asin(clamp(S.radius / dS, 0, 0.98))) / fill) * (180 / Math.PI), 20, 56);
          const lp = project(L.centre, pos, S.centre, fov);
          const nx = lp.x > 0 ? -0.2 : 0.2;
          const target = aimAt(pos, S.centre, fov, nx, ndcY);
          // the listener is the only foreground: a 3-20 % sliver; third robots stay out
          const [cov, ...rest] = sphereCoverage([L, ...others], pos, target, fov);
          if (cov > 0.22 || cov < 0.03) continue;
          if (rest.some((c, k) => c > 0.05 && others[k].centre.distanceTo(pos) < pos.distanceTo(S.centre))) continue;
          const score = Math.abs(cov - cover) * 20 + facing / 40 + Math.max(0, fov - 40) / 10 + h * 6 + (sgn === side ? 0 : 0.4);
          if (!best || score < best.score) best = { score, pos, sv, fov, target, cov, facing };
        }
      }
    }
  }
  if (!best) return single(world, speaker, { az: 0, el: 3, fill }); // no clean OTS: a straight single
  const { pos, sv } = best;
  const to = { pos: pos.clone(), target: best.target, fov: best.fov };
  // the push is a 12-frame lens tighten: moving the camera would grow the shoulder
  const from = pose(to.pos.clone(), to.target, to.fov * 1.06);
  const end = pose(to.pos.clone().addScaledVector(sv, -drift), to.target, to.fov);
  return { kind: 'ots', subject: speaker, foreground: listener, from, to, end, coverage: +best.cov.toFixed(3), facing: +best.facing.toFixed(1) };
}

function hero(world, side, { fill = 0.5, ndcX = 0, ndcY = 0.18 } = {}) {
  const C = restPoints(world.robots.Conductor);
  // low, between the panel and the bench, looking up past the bench's brass rail
  const pos = new THREE.Vector3(side * 0.7, 1.08, SET.bench.z + 1.5);
  const to = fovToFill(pos, C.centre, C.radius, fill, ndcX, ndcY);
  const from = pose(to.pos.clone().add(new THREE.Vector3(side * 0.08, -0.04, 0.2)), to.target, to.fov * 1.08);
  const end = pose(to.pos.clone().add(new THREE.Vector3(-side * 0.1, 0.02, -0.06)), to.target, to.fov);
  return { kind: 'hero', subject: 'Conductor', from, to, end };
}

function fixed(posArr, targetArr, fov, { endPos, endTarget, endFov } = {}) {
  const p = new THREE.Vector3(...posArr), t = new THREE.Vector3(...targetArr);
  const to = pose(p, t, fov);
  const end = pose(endPos ? new THREE.Vector3(...endPos) : p, endTarget ? new THREE.Vector3(...endTarget) : t, endFov ?? fov);
  return { kind: 'fixed', from: to, to, end };
}

function crane() {
  // from above the truss, descending through it to a wide of the table
  return {
    kind: 'crane',
    from: pose(new THREE.Vector3(0.4, 5.2, 5.4), new THREE.Vector3(0, 2.3, -1.2), 44),
    to: pose(new THREE.Vector3(0.15, 1.75, 4.9), new THREE.Vector3(0, 1.0, -0.9), 36),
    end: pose(new THREE.Vector3(0.1, 1.7, 4.6), new THREE.Vector3(0, 1.0, -0.9), 36),
    pushDur: 2.6,
    ease: ease.power2InOut,
  };
}

function whips(world, sequence) {
  // pivot at the table centre: every robot faces it, so every whip lands on a face
  const pivot = new THREE.Vector3(0, 1.12, 0.12);
  const looks = sequence.map(({ name, at }) => {
    if (name === 'wide') return { at, pos: new THREE.Vector3(0, 2.0, 4.4), target: new THREE.Vector3(0, 0.95, -0.7), fov: 40 };
    const p = restPoints(world.robots[name]);
    const tgt = aimAt(pivot, p.centre, 44, 0, 0.06);
    return { at, pos: pivot.clone(), target: tgt, fov: 44 };
  });
  return { kind: 'whips', looks };
}

// ---------------------------------------------------------------- plans

// Shot list per spoken row. Camera numbers are stations on the set.
export const TABLE_SHOTS = {
  3: [
    { at: 0, cam: 'C1 crane', make: () => crane() },
    { at: 3.0, cam: 'C2 bench front', make: (w) => single(w, 'Conductor', { az: 22, el: 6, fill: 0.44, fov: 30, ndcX: -0.1, ndcY: 0.12, push: 0.45 }) },
  ],
  4: [{ cam: 'C3 Claude 3/4', make: (w) => single(w, 'Claude', { az: -30, el: 3, fill: 0.48, ndcX: 0.12, push: 0.3 }) }],
  5: [{ cam: 'C4 OTS Claude>Cursor', make: (w) => ots(w, 'Claude', 'Cursor', { side: 1 }) }],
  6: [{ cam: 'C5 OTS Cursor>Claude', make: (w) => ots(w, 'Cursor', 'Claude', { side: 1, fill: 0.5 }) }],
  8: [{ cam: 'C6 Antigravity push', make: (w) => single(w, 'Antigravity', { az: -18, el: 6, fill: 0.46, ndcX: 0.12, push: 0.35 }) }],
  9: [{ cam: 'C7 OpenCode objection', make: (w) => single(w, 'OpenCode', { az: 30, el: 2, fill: 0.52, ndcX: -0.14, push: 0.32 }) }],
  // no clean OTS exists for row 10 (Codex sits on every OpenCode->Antigravity eyeline): straight single
  10: [{ cam: 'C8 Antigravity straight-on', make: (w) => single(w, 'Antigravity', { az: 0, el: 3, fill: 0.5, ndcX: 0, push: 0.25 }) }],
  12: [{ cam: 'C9 Codex push', make: (w) => single(w, 'Codex', { az: 14, el: 5, fill: 0.44, ndcX: -0.12, push: 0.3 }) }],
  13: [{ cam: 'C10 Claude reverse (Codex POV)', make: (w) => single(w, 'Claude', { toward: 'Codex', az: -22, el: 11, fill: 0.5, ndcX: 0.14, ndcY: 0.16, push: 0.25 }) }],
  14: [{ cam: 'C11 Codex reverse (Claude POV)', make: (w) => single(w, 'Codex', { toward: 'Claude', az: 14, el: 6, fill: 0.56, ndcX: 0.12, push: 0.22 }) }],
  17: [{ cam: 'C12 centre whips', make: (w, row) => whips(w, chaosSequence(row)) }],
  18: [
    { at: 0, cam: 'C13 high wide left', make: () => fixed([-2.9, 2.5, 3.3], [0.1, 0.95, -1.0], 40, { endPos: [-2.8, 2.45, 3.2] }) },
    { at: 0.6, cam: 'C14 low hero right', make: (w) => hero(w, 1) },
  ],
  19: [{ cam: 'C15 low hero left', make: (w) => hero(w, -1, { ndcX: 0, ndcY: 0.2 }) }],
  20: [{ cam: 'C16 front wide', make: () => fixed([0, 1.95, 4.7], [0, 1.02, -0.9], 38, { endPos: [0, 1.92, 4.5] }) }],
};

function chaosSequence(row) {
  const d = row.duration;
  return [
    { name: 'Claude', at: 0 },
    { name: 'Cursor', at: 0.5 },
    { name: 'Antigravity', at: 1.0 },
    { name: 'OpenCode', at: 1.5 },
    { name: 'Codex', at: 2.0 },
    { name: 'wide', at: Math.min(2.5, d - 0.35) },
  ];
}

export function planTableShots(world, rows, duration) {
  const shots = [];
  for (const row of rows) {
    const recipe = TABLE_SHOTS[row.row];
    if (!recipe) continue;
    for (const step of recipe) {
      const shot = step.make(world, row);
      shot.cam = step.cam;
      shot.row = row.row;
      shot.t0 = row.localStart + (step.at || 0);
      shots.push(shot);
    }
  }
  shots.sort((a, b) => a.t0 - b.t0);
  // row 19 -> 20 has a pause: cut to the wide when 19's line ends
  for (const s of shots) if (s.row === 20) {
    const r19 = rows.find((r) => r.row === 19);
    if (r19) s.t0 = Math.min(s.t0, r19.localStart + r19.duration + 0.05);
  }
  shots.forEach((s, i) => { s.t1 = i + 1 < shots.length ? shots[i + 1].t0 : duration + 1; });
  if (shots.length) shots[0].t0 = Math.min(shots[0].t0, 0);
  return shots;
}

// ---------------------------------------------------------------- booth / punch

export function boothShot(world) {
  const r = world.robot;
  const p = restPoints(r);
  // camera straight down +Z at eye height; robot on the left third, eyes 1/3 from top
  const dir = new THREE.Vector3(0, 0, 1);
  const shot = frameSphere({ centre: p.centre, radius: p.radius, dir, fov: 30, fill: 0.58, ndcX: -0.34, ndcY: 0.333 });
  return { kind: 'booth', cam: 'B1 booth', from: shot, to: shot, end: shot, t0: 0, t1: 1e9 };
}

export function punchShot(world) {
  const r = world.robot;
  const p = restPoints(r);
  const dir = new THREE.Vector3(0.05, 0.02, 1).normalize();
  const shot = frameSphere({ centre: p.centre, radius: p.radius, dir, fov: 34, fill: 0.5, ndcX: -0.38, ndcY: 0.1 });
  return { kind: 'punch', cam: 'P1 punch', from: shot, to: shot, end: shot, t0: 0, t1: 1e9 };
}

// ---------------------------------------------------------------- sampling

function lerpPose(a, b, u) {
  return {
    pos: a.pos.clone().lerp(b.pos, u),
    target: a.target.clone().lerp(b.target, u),
    fov: lerp(a.fov, b.fov, u),
  };
}

function sampleWhips(shot, t) {
  const L = shot.looks;
  const local = t - shot.t0;
  let i = 0;
  while (i + 1 < L.length && local >= L[i + 1].at - WHIP) i++;
  const cur = L[i];
  const next = L[i + 1];
  if (next && local >= next.at - WHIP) {
    const u = ease.power2InOut((local - (next.at - WHIP)) / WHIP);
    return lerpPose(cur, next, u);
  }
  // small push while holding on a face
  const hold = clamp((local - cur.at) / 0.45);
  const p = lerpPose(cur, cur, 0);
  p.fov = cur.fov * (1 - 0.06 * ease.power2Out(hold));
  return p;
}

export function sampleShot(shot, t) {
  if (shot.kind === 'whips') return sampleWhips(shot, t);
  const local = Math.max(0, t - shot.t0);
  const pushDur = shot.pushDur ?? PUSH;
  const e = shot.ease || ease.power2InOut;
  if (local < pushDur) return lerpPose(shot.from, shot.to, e(local / pushDur));
  const span = Math.max(0.5, (shot.t1 ?? shot.t0 + 4) - shot.t0 - pushDur);
  return lerpPose(shot.to, shot.end, ease.sineInOut((local - pushDur) / span));
}

export function activeShot(shots, t) {
  let cur = shots[0];
  for (const s of shots) if (t >= s.t0) cur = s;
  return cur;
}

// Seeded handheld: 0.6 deg rotation, ~8 px translation, around 2 Hz.
export function handheld(t, seed, distance, fov) {
  const pxToWorld = (8 / 1080) * 2 * distance * Math.tan(deg(fov) / 2);
  const f = 2;
  return {
    dx: noise1(t * f, `${seed}x`) * pxToWorld,
    dy: noise1(t * f + 17, `${seed}y`) * pxToWorld,
    roll: noise1(t * f * 0.9 + 5, `${seed}r`) * deg(0.6),
    pan: noise1(t * f * 1.1 + 9, `${seed}p`) * deg(0.25),
  };
}

// Damped shake after an impact (gavel); amplitude in metres.
export function impactShake(t, hits) {
  let x = 0, y = 0;
  for (const h of hits) {
    const u = t - h.t;
    if (u < 0 || u > 0.6) continue;
    const a = h.amp * Math.exp(-u * 9);
    x += a * Math.sin(2 * Math.PI * 13 * u + 0.6);
    y += a * Math.sin(2 * Math.PI * 17 * u);
  }
  return { x, y };
}

export function applyCamera(camera, p, extra = {}) {
  const pos = p.pos.clone();
  const target = p.target.clone();
  if (extra.offset) { pos.add(extra.offset); target.add(extra.offset); }
  camera.position.copy(pos);
  camera.up.copy(UP);
  camera.lookAt(target);
  if (extra.pan) camera.rotateY(extra.pan);
  if (extra.roll) camera.rotateZ(extra.roll);
  camera.fov = clamp(p.fov, 10, 80);
  camera.aspect = ASPECT;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

