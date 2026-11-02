# Context

## Intent

The kit and promo half of the HyperFrames pipeline. It was split out of `TASK_2026_009_4b9a` when the extract plan was approved (2026-10-26). See `TASK_2026_002_dcb6/implementation-plan.md`, section "Order of work".

## Scope

- Generators: `kit`, `kit-component`, `promo` (series preset and `storyboard.html` review sheet).
- Executors: `kit-build`, `snapshot` (scene midpoints and both sides of every cut), `preview` (background start, status and stop).
- Spike A10 from the plan.

All executors run the pinned HyperFrames CLI (`hyperframes@0.8.98`, `@hyperframes/shader-transitions@0.8.97`) through node and npm's `npx-cli.js`, with no shell. The code stays in the HyperFrames engine zone and shares nothing with the Remotion zone.

The kit lessons listed in `TASK_2026_009_4b9a/context.md` that concern kits (empty variable falls back to the default, running cue after the label entrance, no kit components inside a sub-composition) become tests here.

## Dependencies

- Depends on `TASK_2026_009_4b9a`.
- Required by `TASK_2026_013_156e`: `kit-build` is needed for Ptah's AC10 migration, and these generators are part of the public package.
