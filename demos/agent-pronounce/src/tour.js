// Episode 2 tour mount: one generic mount for every Cribs kind.
//
// A kind definition is { build(scene, assets, ctx) -> world, plan(world, ctx) -> plan }.
//   world.robots   {name: robot} placed by cribs.addRobot (robot.seat = {x, y, z, yaw})
//   plan.specs     {name: physics spec} (cribs.tourSpec + walks, looks, talk, ...)
//   plan.props     rigid / spring prop specs for physics.simulate
//   plan.channels  {id: simulateChannel spec} (door hinges, buttons, lids, stamps)
//   plan.shots     camera shots (cribs-camera.js) with t0 (scene-local)
//   plan.update(t, sim, ch)      poses everything that is not a robot
//   plan.prerender(renderer, t)  optional render-to-texture pass (the phone)
// The simulation runs once here; render(t) only samples it.
import * as THREE from 'three';
import { simulate, simulateChannel } from './physics.js';
import { prepareRows } from './cribs.js';
import { finalizeShots, sampleCamera, FOV } from './cribs-camera.js';
import { applyCamera, impactShake, frame } from './camera.js';
import { ease } from './util.js';
import { KINDS as LOFT_KINDS } from './tour-loft.js';
import { KINDS as STREET_KINDS } from './tour-street.js';
import { KINDS as TEMPLE_KINDS } from './tour-temple.js';
import { KINDS as OFFICE_KINDS } from './set-office.js';
import { KINDS as VORTEX_KINDS } from './set-vortex.js';
import { KINDS as DESERT_KINDS } from './set-desert.js';
import { KINDS as WORKSPACE_KINDS } from './set-workspace.js';

export const TOUR_KINDS = { ...LOFT_KINDS, ...STREET_KINDS, ...TEMPLE_KINDS, ...OFFICE_KINDS, ...VORTEX_KINDS, ...DESERT_KINDS, ...WORKSPACE_KINDS };

export function applyTourRobots(robots, sim, t) {
  for (const [name, robot] of Object.entries(robots)) {
    const p = sim.robotPose(name, t);
    const seat = robot.seat;
    const lift = p.lift || 0;
    robot.root.position.set((p.px ?? seat.x) + (p.wx || 0), seat.y + lift, (p.pz ?? seat.z) + (p.wz || 0));
    robot.root.rotation.y = seat.yaw + (p.yaw || 0);
    robot.apply({ ...p, bx: p.fx || 0, liftModel: lift / robot.scale });
  }
}

export function placeRigid(obj, pose) {
  if (!pose) return;
  obj.position.set(pose[0], pose[1], pose[2]);
  obj.rotation.order = 'YXZ';
  obj.rotation.set(pose[3], pose[4], pose[5]);
}

export async function mountTour(cfg, scene, assets, duration, def, renderer) {
  const rows = prepareRows(cfg, assets.cues);
  const simRef = { sim: null };
  const ctx = {
    cfg,
    rows,
    duration,
    cues: assets.cues || {},
    seedTag: cfg.id,
    row: (id) => rows.find((r) => r.id === String(id)) || null,
    has: (id) => rows.some((r) => r.id === String(id)),
    getSim: () => simRef.sim,
    renderer,
    // Async look import keeps legacy sets on their existing build path.
    async useLook(kind, options = {}) {
      const { initCraft, whenTexturesReady } = await import('./craft.js');
      initCraft(renderer);
      const builders = {
        office: () => import('./look-office.js').then((m) => m.buildOfficeLook(assets, renderer, options)),
        desert: () => import('./look-desert.js').then((m) => m.buildDesertLook(assets, renderer)),
        workspace: () => import('./look-workspace.js').then((m) => m.buildWorkspaceLook(assets, renderer, options)),
        vortex: () => import('./look-vortex.js').then((m) => m.buildVortexLook(assets, renderer)),
      };
      if (!builders[kind]) throw new Error(`Unknown look: ${kind}`);
      const look = await builders[kind]();
      await whenTexturesReady();
      scene.background = look.scene.background;
      scene.environment = look.scene.environment;
      scene.fog = look.scene.fog;
      scene.userData.noDepth = look.scene.userData.noDepth || []; // the film chain's depth pass skips these
      scene.backgroundIntensity = look.scene.backgroundIntensity;
      scene.environmentIntensity = look.scene.environmentIntensity;
      scene.backgroundRotation.copy(look.scene.backgroundRotation);
      scene.environmentRotation.copy(look.scene.environmentRotation);
      while (look.scene.children.length) scene.add(look.scene.children[0]);
      return look;
    },
  };
  const world = await def.build(scene, assets, ctx);
  const plan = def.plan(world, ctx);
  const start = plan.start ?? -0.6;
  const sim = simulate({ duration, start, robots: Object.values(plan.specs), props: plan.props || [], tableImpulses: plan.tableImpulses || [] });
  simRef.sim = sim;
  const ch = {};
  for (const [k, spec] of Object.entries(plan.channels || {})) ch[k] = simulateChannel(spec, { start, duration });
  const shots = finalizeShots(plan.shots, duration);
  const camera = new THREE.PerspectiveCamera(FOV, frame.aspect, plan.near ?? 0.03, plan.far ?? 260);
  const firstWord = rows.length ? Math.min(...rows.map((r) => r.localStart)) : 0;
  const settleDur = plan.noSettle ? 0 : Math.min(1.0, Math.max(0, firstWord));
  let last = null;
  function update(t) {
    applyTourRobots(world.robots, sim, t);
    plan.update?.(t, sim, ch);
    const c = sampleCamera(shots, t, duration, cfg.id);
    // lead-in settle: the operator eases into the room's first framing over the
    // room's lead-in (a small creep forward that lands as the first word starts)
    if (settleDur > 0 && t < settleDur) {
      const f = c.pose.target.clone().sub(c.pose.pos).normalize();
      c.offset.addScaledVector(f, -0.16 * (1 - ease.power2Out(t / settleDur)));
    }
    if (plan.hits?.length) {
      const k = impactShake(t, plan.hits);
      c.offset.add(new THREE.Vector3(k.x, k.y, 0));
    }
    applyCamera(camera, c.pose, { offset: c.offset, roll: c.roll, pan: c.pan });
    last = c;
    return { smear: c.smear, prerender: plan.prerender ? (renderer) => plan.prerender(renderer, t, ch) : null };
  }
  const info = {
    kind: cfg.kind,
    rows: rows.map((r) => ({ row: r.id, speaker: r.speaker, localStart: +r.localStart.toFixed(2), duration: +r.duration.toFixed(2), words: r.words.length })),
    shots: shots.map((s) => ({ cam: s.cam, t0: +s.t0.toFixed(2), t1: +Math.min(s.t1, duration).toFixed(2), whipIn: s.whipIn || 0, whipOut: s.whipOut || 0 })),
    ...(plan.info || {}),
  };
  return { world, camera, update, sim, shots, info, warm: shots.map((s) => Math.max(0, s.t0 + 0.05)), lastCamera: () => last };
}
