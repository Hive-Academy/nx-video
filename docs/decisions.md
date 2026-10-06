# Decisions

Decisions carried over from Ptah `TASK_2026_582_a7db`. Add new decisions at the end, with a date.

## 2026-09-30 — Extract the video tooling from Ptah

- The Ptah repository stays focused on Ptah.
- The two mature video projects and their setup move to this public repository.
- This repository has two purposes: an Nx plugin and a Claude plugin marketplace.
- Ptah Setup Hub integration (marketplace install from the AI Team Builder, generator run from New Project, a video preset) is a later task in Ptah. It is not part of this repository's backlog.

## 2026-09-30 — Target shape

| Product | Contents |
|---|---|
| Nx plugin `@hive-academy/nx-video` | Generators `init`, `studio`, `scene`, `editor` (optional). Executors `capture`, `narrate`, `render`, `selfshot`, `doctor` |
| Marketplace | `.claude-plugin/marketplace.json` with the skills, the agents and the MCP servers. It must validate against the Ptah marketplace schema (`libs/backend/plugin-marketplace/src/lib/registry/marketplace-manifest.schema.ts:66-98` in Ptah) |
| Preset | `create-nx-video`, built on the same plugin |

The `doctor` executor turns the machine facts in Ptah `tools/video-editor/CLAUDE.md` into checks with fix messages.

`export-kit.mjs` and `PORT-TO-NEW-PROJECT.md` in Ptah are the manual form of the generators. Use them as the reference behavior.

## 2026-09-30 — Constraints

- **Private recordings must not leak.** Keep the `SELFSHOT_KIT_SLUGS` allowlist and the post-copy guard. CI fails on any slug that is not on the allowlist.
- **Git history.** Scan the history of every moved path for secrets and private media. Use a history-preserving extract only if the scan is clean.
- **Remotion license.** The README states the company-license requirement before installation.
- **Two render engines.** The documentation says which workflow uses which engine. The pipelines do not share code.
- **Pinned versions.** HyperFrames `0.8.30` (editor), `hyperframes@0.8.98` and `@hyperframes/shader-transitions@0.8.97` (projects), the vendored Resolve MCP commit. A bare `npx hyperframes` resolves the latest release, so executors call the pinned version.
- **Ptah must still record its videos.** Ptah scenes stay in Ptah. Ptah consumes the Director and the studio from this package, not from a copy.

## 2026-10-01 — Add the HyperFrames pipeline

Generic parts move: `render.mjs`, the fragment assembler (`assemble.mjs` + `src/index.tpl`), the kit build (`build.mjs` with `/*@include*/` partials), the kit runtime (`partials/runtime.js`), the playbook, and the brief and storyboard templates.

The `ptah-ui` kit components and the Ptah promo projects stay in Ptah.

Extra generators: `hyperframes-project`, `frame`, `kit`, `kit-component`, and a `promo` series preset.
Extra executors: `assemble`, `kit-build`, `check`, `snapshot`, `preview`, `render` (to `video-output/`).

Template quality gates:

- `check` passes with 0 errors.
- CI fails on `data-layout-ignore` and `data-layout-allow-*` in project sources.
- Prefer `cut` seams and match cuts to shader seams.
- Kit components do not nest inside a sub-composition. The fragment pipeline is the supported structure.

## 2026-10-06 — Repository setup

- Name: `Hive-Academy/nx-video`, public, MIT license (the same as Ptah).
- The initial commit contains documents and tasks only. No code or media is copied before `TASK_2026_001` clears the source paths.
- The Ptah-side acceptance criteria (Ptah records with the package, the moved paths are deleted, the `agent-lanes` projects render with the package) stay in Ptah `TASK_2026_582_a7db`.
