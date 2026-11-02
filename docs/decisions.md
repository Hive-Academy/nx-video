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
| Nx plugin `@hive-academy/nx-video` | Generators `init`, `studio`, `scene`, `hyperframes-project`, `frame`, `kit`, `kit-component`, `promo`, `preset`, `editor` (later minor release). Remotion executors `studio`, `capture`, `narrate`, `caption`, `render`, `selfshot`, `master`, `outro`, `qr`, `tui-frames`, `export-kit`. HyperFrames executors `assemble`, `kit-build`, `check`, `snapshot`, `preview`, `hyperframes-render`. Engine-neutral executor `doctor`. Subpath exports `./manifest` and `./capture` (updated 2026-10-26) |
| Marketplace | `.claude-plugin/marketplace.json` with the skills and the agents. The `davinci-resolve` MCP server is machine-specific and is configured per machine by the `editor` generator in the workspace `.mcp.json`, not shipped in the marketplace (updated 2026-10-26). It must validate against the Ptah marketplace schema (`libs/backend/plugin-marketplace/src/lib/registry/marketplace-manifest.schema.ts:66-98` in Ptah) |
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

## 2026-10-26 — Extract plan approved

The user approved `TASK_2026_002_dcb6/implementation-plan.md` on 2026-10-26. The plan's decision log is `TASK_2026_002_dcb6/decisions.md`.

- **Nx:** develop on Nx 24.0.1. Peer range `>=23 <25`.
- **Publishing:** a granular npm token (`NPM_TOKEN` GitHub secret) with provenance. Not OIDC trusted publishing.
- **Remotion license:** the Free License applies (single developer). The README keeps the Remotion license notice.
- **davinci-resolve-mcp:** the `editor` generator downloads `samuelgursky/davinci-resolve-mcp` at the pinned SHA `6eca4bfc371a1c2f7cb2961efee651ab07436378` (MIT). The upstream is not confirmed yet. The editor ships in a later minor release.
- **First release:** everything except the editor. The real render smoke for AC2, AC4 and AC8 (`render-smoke.yml`) is a required pre-publish gate.
- **HyperFrames:** pinned npm dependencies in generated projects. The editor runs its pinned version through npx.
- **Studio (D1):** a runtime library in the package plus a thin generated shell.
- **Contract (D1b):** manifest and capture ship as subpath exports (`./manifest`, `./capture`) of `@hive-academy/nx-video`, not as a separate package.
- **Ptah hooks (D6, overturned by the user):** `prewarm.ts` and `config-menu.ts` move as generic selector-driven hooks (`createMenuSurfaces`, `createPrewarm`). Ptah supplies its own selectors.
- **Engine isolation (D13):** ESLint import-boundary blocks plus an isolation test.
- **Pins (D15):** `init` always enforces the engine pins. There is no keep-existing bypass.
- **Layout overrides (D9)** and **cache policy (D8):** as written in the plan.
- **Marketplace:** skills and agents only (see "Target shape").
- **Roadmap:** 004 retitled, 009 split into 009 and the new kit/promo task `TASK_2026_014_deaa`, 008 moved after 013. See `docs/roadmap.md`.
