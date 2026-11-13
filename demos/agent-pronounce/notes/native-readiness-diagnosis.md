# Integrated readiness diagnosis — 2026-11-13

Read-only source inspection by native vortex subagent. No browser/GPU work, process stops, dependency changes, or production edits. This note is the only write. The integrated check has **no completed verdict**; source inspection does not establish deadlock, asset failure, or GPU exhaustion.

## Concrete checker behavior

Installed HyperFrames is 0.8.98 (`node_modules/hyperframes/package.json`). All following dependency paths are relative to this demo's `node_modules/hyperframes/dist/`.

- `check-6KE5ZV6K.js:1312` documents `--timeout` as the **initial render-ready** timeout and navigation minimum. It is not a command deadline.
- `chunk-5BJFUD4T.js:76-94` catches render-ready timeout, prints a warning, and continues. Shader-transition readiness can then wait up to 90 seconds; `document.fonts.ready` has no explicit local deadline; normal settling adds 1.5 seconds.
- `checkBrowser-F6MKBAL3.js:153-172` then audits media durations and runs the grid. `chunk-6RC6OPDF.js:99-134` gives unresolved audio metadata another shared `options.timeout` budget. Thus a 120-second render-ready warning followed by another two minutes without a verdict is compatible with normal checker control flow. Whether audio metadata actually consumed this budget in the previous run is unmeasured.
- `check-6KE5ZV6K.js:403-479` runs the main samples, then an unconditional dense overlap sweep at 8 samples/second capped at 600. The 106.67-second episode reaches 600 timestamps. `--samples 3` and `--no-contrast` do **not** disable that sweep. Main motion assertions, if present, can also contribute up to 300 samples (`:201-228`).
- `check-6KE5ZV6K.js:948-970` enables a separate finding-crop browser pass only with `--snapshots`; omit that flag for this diagnostic retry.
- The supported argument table (`:1276-1353`) has no media-audit skip, overlap-sweep skip, whole-command timeout, or readiness-only mode. A guaranteed total completion bound cannot be derived from these flags.

## Actual project readiness path

- Generated office/vortex/desert compositions assign promises from `window.TribunalReady.then(api => api.mount(...))` to `window.__hf.buildReady[id]`. Bundled runtime `chunk-M5YNZQXZ.js:3224` discovers all thenable values in that registry and gates `window.__renderReady` on its build-ready tracking, in addition to timeline/runtime readiness.
- `src/scene.js:331-342`: mount awaits shared `loadAssets()`, then the selected tour builder. `src/assets.js:68-71` caches the base asset promise; that base batch is not fetched independently for each scene.
- `src/tour.js:61-72`: each tour builds the chosen look and awaits `whenTexturesReady()`. `src/craft.js:17-22` uses a module-global pending texture list, so concurrent builds can wait on textures registered by another look before that call. Texture callbacks resolve on success **and error**, so this code alone does not support blaming missing textures for a permanently pending gate. It also means an errored texture need not reject readiness.
- `src/craft.js:19,29-42`: model calls have no loader-level promise cache here; HDR loading includes a synchronous pixel scan. `src/look-desert4.js:443,466,532` includes sequential awaited model placements. These are concrete sources of loading work, not evidence of failure.
- `src/scene.js:360-374`: each mount renders every warm sample, including its postprocessing, and an initial frame **before** resolving. `src/tour.js:124` supplies one warm sample per shot, so workspace has multiple warm renders. A single scoped scene success does not measure the combined warm-up cost.
- `src/look-kit.js:130-162`: each film owns a retained composer chain, including a half-float render target with multisampling, GTAO, DOF, bloom, and grade. `src/scene.js:367-375` retains scene render closures and exposes the mounted scene/camera on `window.__tribunal3d`. All mounted scenes coexist in the integrated page. Resource pressure is plausible but was not measured; no GPU-OOM claim is justified.

## Bounded next action

Retry once after the GPU owner releases it, using the actual installed executable from `D:/projects/nx-video/demos/agent-pronounce`:

```powershell
node node_modules/hyperframes/bin/hyperframes.mjs check . --json --timeout 120000 --samples 3 --no-contrast --no-proxy --browser-gpu
```

These are supported flags. This is a reduced diagnostic contract/layout/runtime check, **not** the full contrast gate. `--no-proxy` omits automatic browser-hostile video transcoding; current root media is audio and scene canvases. Do not force `__renderReady=true`, strip real scene hosts, or interpret the initial timeout warning as the final verdict.

Use a separately tracked owned-process wall deadline (suggested operational budget: 12 minutes) if a bounded run is required. This is a stop budget, not a predicted completion time: navigation + initial readiness + shader readiness + audio metadata can alone consume roughly 7.5 minutes at these settings, before 600 overlap seeks; font waits/browser work have no proven total bound. Preserve a deadline expiration as incomplete, not pass or deadlock.

If readiness still expires, the smallest useful next diagnostic is timestamps for each existing buildReady promise's resolution/rejection, `__renderReady`, loaded `__tribunal3d` IDs, and audio elements with non-finite duration, captured from the same integrated page. That identifies the pending phase before changing production loading. No source fix is supported yet. Do not remove warm-up or introduce broad caching based only on elapsed time.

Earlier scoped scene captures, numeric seek checks, and composition review remain valid within their scope. They do not substitute for an integrated checker verdict.
