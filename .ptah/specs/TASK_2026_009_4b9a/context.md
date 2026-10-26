# Context

## Intent

The HyperFrames side: promos and motion-kit films built from HTML fragments.

## Source

`tools/hyperframes/` in Ptah: `render.mjs`, `PLAYBOOK.md`, `README.md`, `HANDOFF.md`, `kits/ptah-ui/build.mjs`, `kits/ptah-ui/src/partials/runtime.js` and `base.css`, `kits/ptah-ui/SPEC.md`, `projects/*/assemble.mjs` and `src/index.tpl`. The `ptah-ui` kit components and the Ptah promo projects stay in Ptah.

## Generators

- `hyperframes-project`: the fragment pipeline (`compositions/frames/NN-*.html`, `src/index.tpl`, `assemble.mjs`), the pinned CLI in `package.json` (`hyperframes@0.8.98`, `@hyperframes/shader-transitions@0.8.97`), `BRIEF.md` and `STORYBOARD.md` templates, the music beat grid, and git-ignored asset folders with restore steps in the README.
- `frame`: one fragment skeleton (root attributes, `data-seam-in`, `data-duck`, frame-local times, the `(tl, T0)` script body).
- `kit` and `kit-component`: a UI motion kit with the shared runtime (`cues`, `preroll`, `focus`, `dimOthers`, design-unit scaling) and a SPEC table for each component.
- `promo` preset: the series grammar (one caption per beat in title-safe, at most one kit component on screen, one continuous world, a prompt-first opening, a lockup with the feature name and the CTA) and a `storyboard.html` review sheet.

## Executors

`assemble`, `kit-build`, `check`, `snapshot` (scene midpoints and both sides of every cut), `preview` (background start, status and stop), and `render` (to `video-output/<project>/` in the main checkout, never `dist/` or a worktree). All of them run the pinned CLI through node and `npx-cli.js`, with no shell.

## Kit lessons to keep as tests

- An empty string variable falls back to the default.
- A running cue comes after the label entrance. Open a running row with `preroll`.
- Kit components do not nest inside a sub-composition (duplicate mounts collapse onto one `#root`).
- Prefer `cut` seams and match cuts to shader seams. Shader seams make Studio slow to prepare and can show the wrong scene after a seek.

## Acceptance

- AC8: in an empty Nx workspace, `hyperframes-project` + `frame` + `assemble` + `check` give a project that passes `check` with 0 errors, and `render` writes the MP4 to `video-output/`.

## Scope change (2026-10-26)

The approved extract plan split this task. The `kit`, `kit-component` and `promo` generators and the `kit-build`, `snapshot` and `preview` executors moved to `TASK_2026_014_deaa`. This task keeps `hyperframes-project`, `frame`, `assemble`, `check` and `hyperframes-render` (target name `render`, plan D14), the createNodes support for `hyperframes.json`, and spike A9. Build from `TASK_2026_002_dcb6/implementation-plan.md`.
