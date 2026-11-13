// Episode 6 v4: the vortex scene kind (`vortex`). The approved look-vortex4 look, animated.
// SPEC v4.1 §3: the office ends inside the laptop storm at `through`; this scene opens inside the
// same storm (the workspace's stormVeil texture at full opacity), which thins over 0.35 s to show the
// funnel with both chairs tumbling. `land` (2.6 s) is the seats hitting the desert sand; the dust
// settles and the walls keep spinning until the cut to the desert (3.5 s).
// Everything is a pure function of the scene time t.
import * as THREE from 'three';
import { clamp, ease } from './util.js';
import { sceneCue } from './cribs.js';
import { custom } from './cribs-camera.js';
import { frame } from './camera.js';
import { vortexTexture } from './look-vortex.js';
import { LAND } from './look-vortex4.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
// PerspectiveCamera.setFocalLength: 35 mm film gauge across the wider side
const fovOf = (mm) => (2 * Math.atan((0.5 * 35) / Math.max(frame.aspect, 1) / mm) * 180) / Math.PI;

async function build(scene, assets, ctx) {
  const look = await ctx.useLook('vortex4');
  for (const s of look.handles.sand) s.material.uniforms.uRes.value.set(frame.w || 1920, frame.h || 1080);
  // the storm the office ended in: a camera-locked veil that thins as the funnel opens
  const veilMat = new THREE.MeshBasicMaterial({ map: vortexTexture(), transparent: true, opacity: 1, depthTest: false, depthWrite: false });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), veilMat);
  veil.renderOrder = 900; scene.add(veil);
  (scene.userData.noDepth ||= []).push(veil);
  return { robots: {}, look, veil, veilMat, post: { film: look.film, shadows: true, filmFrame: 0 } };
}

function plan(world, ctx) {
  const land = sceneCue(ctx, 'land', LAND);
  // the look is authored with LAND = 2.6; if the cue moves, stretch the fall and keep the settle
  const lt = (t) => (t < land ? (t * LAND) / land : LAND + (t - land));
  const look = world.look;
  const shot = custom('vortex', (t) => {
    const c = look.cameraAt(lt(t));
    return { pos: c.pos, target: c.target, fov: fovOf(c.focal), subject: c.subject, aperture: c.aperture, maxblur: c.maxblur, roll: c.roll };
  }, 3);
  shot.t0 = 0;
  shot.still = true; // the fall itself is the motion; no handheld wobble on top

  function update(t) {
    const tt = lt(t);
    const cam = look.cameraAt(tt);
    look.update(tt, cam.pos);
    // entry: the storm veil from the office thins over 0.35 s
    const k = 1 - ease.sineInOut(clamp(t / 0.35));
    world.veilMat.opacity = k;
    world.veil.visible = k > 0.001;
    if (world.veil.visible) {
      world.veil.position.copy(cam.pos).addScaledVector(cam.target.clone().sub(cam.pos).normalize(), 0.1);
      world.veil.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(cam.pos, cam.target, V(0, 1, 0)));
      world.veil.scale.setScalar(0.05);
    }
    const film = world.post.film;
    film.dof.focus = cam.pos.distanceTo(cam.subject);
    film.dof.aperture = cam.aperture;
    film.dof.maxblur = cam.maxblur;
    const hit = t > land ? Math.exp(-(t - land) / 0.25) : 0;
    film.bloom.strength = 0.42 + 0.25 * hit;
    film.exposure = 1.0 + 0.08 * hit;
    world.post.filmFrame = Math.round(t * 30);
  }

  return {
    start: -0.4, specs: {}, noSettle: true, shots: [shot], update,
    hits: [{ t: land, amp: 0.035 }], near: 0.03, far: 120,
    info: { cues: { land } },
  };
}

export const KINDS = { vortex: { build, plan } };
