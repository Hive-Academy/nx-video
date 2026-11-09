---
name: threejs-scene-craft
description: How to build Three.js scenes for the nx-video series engine (demos/*/src: shared WebGL renderer, mount(config, canvas) via window.TribunalReady, the cute_robot.glb rig, seeded physics, the shot camera, rig lighting). Covers reusing engine modules, measuring and recolouring GLB models, lighting and set-dressing recipes, effects, determinism and seek-safe checks. Use it for any work on a 3D set, character, prop, camera move or effect in a series episode, including adding a new set kind or porting a set from an earlier episode.
---

# Three.js scene craft (series engine)

The engine is in each episode's `src/`. The canonical copy is `demos/agent-comparison/src/`.
Before you write anything new, read the module you are about to touch. Then load
`video-quality-bar`, because its scorecard is the target.

## Rules that break silently

1. **Reuse before you build.** Robots come only from `createRobot(assets, name)`
   (`robot.js`). Never rebuild a character. Light with the `lighting.js` builders, frame with
   `frameSphere` and `aimAt` (`camera.js`), move with the shot makers in `cribs-camera.js`
   (`framed`, `keyed`, `follow`), and texture with `textures.js`. A new set copies the structure
   of `set-loft.js` or `temple.js`.
2. **Hero assets are models, not primitives.** A god, a statue, a vehicle or a hero prop is a
   sourced GLB (see `free-media-sourcing`). Load it through `assets.js` and fit it with the GLB
   procedure in `references/models.md`. Primitives are for blocking and far-background filler
   only.
3. **Determinism.** Everything is a pure function of the seek time `t`. Seed variation with
   `hash`, `hashRange` and `noise1` (`util.js`). Simulate physics once per mount at `STEP`
   (1/120 s) into sampled arrays. Never call `Math.random`, `Date`, `performance.now`, timers,
   `requestAnimationFrame` loops or `mixer.update(dt)`. To play a GLB clip, set
   `action.time = t` and call `mixer.update(0)`.
4. **One renderer.** Do not create a `WebGLRenderer`. `scene.js` owns the single shared
   context and blits it into each composition's canvas. A new set kind registers in the `mount`
   dispatch and returns `{ world, camera, update(t) }`.
5. **Animate to cues.** Every scripted action (a spark, bolt, stamp or portal) is keyed to
   `config.cues[name]`, in scene-local seconds. Never hard-code a time. Effects must read at
   phone size: big, bright and lasting at least 8 frames.

## Look-dev first

Before any animation, render one still per scene at its hero cue, using final assets, lights
and camera, and get it approved (`video-quality-bar` §2). Make the still with
`node node_modules/hyperframes/dist/cli.js snapshot --at <t> --output snapshots/lookdev`.

## References

| Read | When you need to … |
| --- | --- |
| `references/models.md` | load, measure, scale, face, recolour or animate a GLB, or fit a sourced model next to the robots |
| `references/look-recipes.md` | light a set, dress it, add atmosphere, build an effect, or frame and move the camera |
| `references/failures.md` | check your shots against the defects that reviews have already caught, before you snapshot |
