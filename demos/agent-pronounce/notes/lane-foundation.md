## Skills loaded

- `D:/projects/nx-video/.agents/skills/video-quality-bar/SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `D:/projects/nx-video/.agents/skills/threejs-scene-craft/SKILL.md`: "One renderer."
- `D:/projects/nx-video/.agents/skills/free-media-sourcing/SKILL.md`: "Never commit media."
- `D:/projects/nx-video/demos/agent-pronounce/node_modules/hyperframes/dist/skills/hyperframes-cli/SKILL.md`: "Prefer `--json` for agent and CI calls."
- `hyperframes-core`: unavailable in the supplied `.agents` and `.claude` paths, the episode HyperFrames install, and the repository skills directory. The installed CLI skill refers to it but does not supply its SKILL.md.

## Module map

- `src/craft.js`: `initCraft(renderer)`, `roomEnvironment()`, `whenTexturesReady()`, `V(x,y,z)`, `TP(path)`, `glb(path)`, `tex(path, options)`, `hdri(path)`, `fit(object, options)`, `shadows(object, cast, receive)`, `recolor(object, map)`, `yawToward(from,to)`, `robot(assets,name,at,lookAt,options)`, `canvas2d(width,height)`, `canvasTex(canvas,options)`, `bolt(a,b,seed,options)`, `sandMaterial(repeat)`, `stoneMaterial(tint,repeat)`, `dune(x,z)`, `sandGround()`, `dust(count,centre,spread,seed)`, `W`, `H`. The helpers retain their original geometry, material, texture, and seeded construction.
- `src/look-office.js`: `buildOfficeLook(assets, renderer, { boltMode = false })`; local `duskCity()` and `landingScreen(assets)`.
- `src/look-desert.js`: `buildDesertLook(assets, renderer)`; local `pyramid(at,options)`, `pylon(at,yaw)`, `banner(color,at)`, `ptahGod(assets,at,lookAt,scale)`.
- `src/look-vortex.js`: `buildVortexLook(assets, renderer)`; local `vortexTexture()`.
- `lookdev/lookdev.js`: thin static harness, the sole look-dev renderer, imports the builders and renders their returned scene/camera/bloom/exposure.
- `lookdev/compare.mjs`: decodes PNGs through Chrome canvas and reports channel mean/max.
- `src/tour.js`: `mountTour(cfg,scene,assets,duration,def,renderer)` is async; `ctx.useLook(kind,options)` awaits a look, installs its scene content and returns its camera, handles, bloom, and exposure.
- `src/scene.js`: `mount(cfg,canvas)` awaits the tour; `renderFrame(scene,camera,dof,post)` applies per-mount post settings.

All three builders return `{ scene, camera, bloom, exposure, handles }`.

## Handles

- Office and office-bolt: `sofa` (fitted model), `table` (coffee table), `laptop` (fitted model), `laptopScreen` (landing-page mesh), `codex`, `claude` (createRobot results), `bolts` (array of bolt groups; empty in ordinary office), `hemisphere`, `key`, `rim`, `dusk`, `lampGlow`, `spill`, `flash` (lights; flash null in ordinary office), `city` (dusk plane), `floor` (room floor).
- Desert: `ground` (sand mesh), `pyramid` (construction and ramp), `pylon` (temple), `ptah` (createRobot result), `sceptre` (was rig), `sofa` (fitted model), `claude`, `codex` (createRobot results), `crewRobots` (array of createRobot results), `sleds` (array of models), `banners` (array of flag groups), `rampRobots` (array of createRobot results), `inspector` (createRobot result), `dustPoints` (Points), `sun`, `hemisphere`, `front` (lights).
- Vortex: `tunnel` (inside mesh), `sunDisc` (end cap), `glow` (point light), `streaks` (array of meshes), `dustPoints` (Points), `tumble` (sofa and robot parent group), `sofa` (model), `codex`, `claude` (createRobot results), `key`, `back` (lights).

## Engine post hook

A tour set may define an async `build(scene, assets, ctx)`. `mountTour` awaits it inside the existing `TribunalReady.then(api => api.mount(...))`/`buildReady` path before planning, warming, and first render. `ctx.useLook` imports a look only when requested, initializes craft with the shared renderer, awaits the builder and pending textures, moves its scene objects into the mounted scene, and returns the builder result. A set uses the returned camera or copies its pose into its shot plan camera as needed. Example:

```js
async build(scene, assets, ctx) {
  const look = await ctx.useLook('office', { boltMode: false });
  return {
    robots: { codex: look.handles.codex, claude: look.handles.claude },
    handles: look.handles,
    lookCamera: look.camera,
    post: { bloom: look.bloom, exposure: look.exposure, toneMapping: 'aces', shadows: true },
  };
}
```

`world.post` is optional. The shared render path uses one `RenderPass`, optional `SoftFocusPass`, optional `UnrealBloomPass`, then `OutputPass` per opted-in mount, calling `composer.render(0)` once per frame. It restores tone mapping, exposure, shadow enabled state, and shadow type after every render. The non-opt-in branch still calls its prior direct render or focus chain.

## Parity

Both untouched baseline shoots matched each other exactly. After the split, channel differences against the first baseline were:

| Scene | Before run 1 vs 2 mean / max | Before vs split mean / max |
| --- | ---: | ---: |
| office | 0 / 0 | 0 / 0 |
| office-bolt | 0 / 0 | 0 / 0 |
| desert | 0 / 0 | 0 / 0 |
| vortex | 0 / 0 | 0 / 0 |

All values are 8-bit channel units; 0 is identical. Baselines: `snapshots/lookdev-before/` and `snapshots/lookdev-before-2/`. Split output: `snapshots/lookdev/`. The harness still reports the existing missing favicon request on the first shot; all four scenes rendered successfully.

## Checks

- `node lookdev/shoot.mjs office office-bolt desert vortex` twice before edits and once after: all four scenes rendered; compare script reports exact parity.
- `node lookdev/compare.mjs snapshots/lookdev-before snapshots/lookdev-before-2`: four means/maxima 0/0.
- `node lookdev/compare.mjs snapshots/lookdev-before snapshots/lookdev`: four means/maxima 0/0.
- `node node_modules/hyperframes/dist/cli.js check --json` before and after: both `ok: true`, 0 lint errors, 0 runtime errors. Existing warnings: 2 lint, 1 layout, 13 contrast; no new errors.
- `node node_modules/hyperframes/dist/cli.js snapshot --at 9,30 --output snapshots/foundation-check --timeout 120000`: succeeded. Its 9 s, 30 s, and added 60.884 s PNGs have byte-identical hashes to the baseline saved under `snapshots/lookdev-foundation-before/`.
- `node tools/guards/no-media.mjs` at repository root: passed, 304 files, no violations.
- `node --check` on the changed JS modules: passed.
- Ptah code/browser/report tools were absent from the connected tool list; native file search, Chrome/Puppeteer renders, and CLI checks were used.

## Decisions

- Left the approved camera, geometry, textures, light values, and construction order in place. The look harness still calls composer render twice, matching its baseline behavior; the engine opt-in chain renders once per frame and holds no temporal history.
- Existing sets have no `world.post`, so their render path is unchanged. Async tour build is awaited under the existing mount promise.
- No media was added or copied into tracked paths. No timeline, composition, index, or set modules were edited.

## Clarifications Needed

- The requested `hyperframes-core` SKILL.md was not available in the listed or installed skill paths. No composition authoring was performed in this lane.

## Look-dev match

Approved stills `snapshots/lookdev-before/office.png`, `office-bolt.png`, `desert.png`, and `vortex.png` match the rebuilt stills under `snapshots/lookdev/` exactly, channel by channel. The existing timeline frames at 9 s, 30 s, and 60.884 s match their baseline PNGs by file hash. The office still was opened and visually inspected against the approved composition: two robots on the sofa, the laptop and landing screen on the coffee table, window skyline, and warm rug all remain in place.

## Scorecard

This foundation lane did not author animated frames. The static look gate is approved and pixel-identical; later animation lanes own per-cue frame scorecards. Existing 9 s, 30 s, and 60.884 s snapshots were checked for exact baseline hashes, not assigned new visual scores.

## Credits

No new media or licences. Existing assets load from `assets/media.manifest.json` through the episode's third-party path pipeline.
