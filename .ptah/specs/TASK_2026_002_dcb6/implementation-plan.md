# Implementation Plan - TASK_2026_002

Extract the Ptah video tooling into the public `nx-video` repository as one Nx plugin (`@hive-academy/nx-video`), one preset (`create-nx-video`) and one Claude plugin marketplace. This plan is the user approval gate. No plugin code is written before the user approves it.

Source: Ptah `e0ca51e6e` (read-only clone `/home/amun/projects/ptah-extension`). Source citations use `S:` = `apps/ptah-video-studio/`, `H:` = `apps/ptah-electron-e2e/src/showcase/_harness/`, `HF:` = `tools/hyperframes/`, and all refer to `e0ca51e6e` unless they name another commit.

## Inputs and constraints

- Requirements used: `CLAUDE.md`, `README.md`, `docs/decisions.md`, `docs/roadmap.md`, the task's `context.md` and `decisions.md`, TASK_2026_001 `research-report.md` (with "User answers"), `research-part-c-nx.md` ("Recommended layout" to the end), TASK_2026_001 `decisions.md` rows 11–17, and `parity-inventory.md` (totals, the 132 moving rows, script decisions, Ptah-side touch points, drift, decisions).
- Corrections applied:
  1. Publish auth: granular npm token secret with provenance, **not** OIDC (TASK_2026_001 decision 16 overrides part C decision 6).
  2. Nx 24.0.1, peers `>=23 <25` (TASK_2026_001 decision 17).
  3. Remotion Free License applies (single developer, decision 14). The README keeps the license notice.
  4. Studio delivery changes from "generated copy" (the inventory's `generators/studio/files/src/**` labels) to "package runtime library + thin generated shell". See Decision D1. The inventory calls its targets "design labels, not created directories" (`parity-inventory.md:3`). `docs/decisions.md` ("Ptah consumes the Director and the studio from this package, not from a copy") and AC7 ("The moved paths no longer exist in Ptah") outrank those labels.
  5. `H:prewarm.ts` and `H:config-menu.ts` keep their inventory fate `move-generic` (user decision, task `decisions.md` row 17, which overturns the first draft's "stay in Ptah"). They hold Ptah UI selectors today (`config-menu.ts:4` `'thoth' | 'setup-hub' | 'marketplace' | 'settings'`, `:6-7` `config-menu-trigger`/`config-menu-item-*`, `prewarm.ts:30` `.electron-tabs`, `prewarm.ts:100` `ptah-electron-welcome`, `#thoth-tab-*`). They move as generic hooks that take selectors and options. The package holds no Ptah selector. Ptah passes its selectors in. See Component 4 and D6.
  6. User decisions of 2026-10-26 (task `decisions.md` rows 14–17) are applied:
     - row 14: the first release (roadmap 013) is everything except the editor. Real render smoke (AC2/AC4/AC8) is a required pre-publish gate. The editor (008) ships in a later minor release.
     - row 15: the marketplace ships skills and agents only. The `davinci-resolve` MCP server is configured per machine by the `editor` generator. This is a user-approved change to the `docs/decisions.md` "Marketplace" row, recorded under "Doc updates on approval".
     - row 16: D1 approved.
     - row 17: D6 overturned (correction 5).
- Design handoff used: none (no UI design task).
- Missing decision-critical input:
  - The ignored `tools/video-editor/` tree is only on the Windows machine. So the `davinci-resolve-mcp` remote and the editor's HyperFrames 0.8.30 package name cannot be confirmed. Resolution: proceed with `samuelgursky/davinci-resolve-mcp@6eca4bfc371a1c2f7cb2961efee651ab07436378` and `hyperframes@0.8.30`, marked *unconfirmed*, and confirm both in task 008 (Open items O1, O2).
  - Ptah has no tracked `.mcp.json` at baseline. The entry shape comes only from `c032b0f1e:tools/video-editor/CLAUDE.md:24-29` (O3).

## Codebase evidence

| Evidence | Location | Architectural implication |
|---|---|---|
| The manifest contract is **types only**: `Beat`, `SceneManifest`, `Shot`, `ShotFocusRect`, `ShotsFile` | `libs/showcase-manifest/src/index.ts:1-7`; `manifest.types.ts:20-89` | It can ship as a zero-runtime subpath export. No separate package is needed for the contract. |
| Manifest package is private CJS, built with `@nx/esbuild` | `libs/showcase-manifest/package.json:1-8`, `project.json:8-17` | Its build config is not reused. The plugin's `tsc` build emits `.d.ts`. |
| Four TS import sites of `@ptah-extension/showcase-manifest` | `S:src/ShowcaseVideo.tsx:26`, `S:src/components/BodyScene.tsx:17`, `S:src/lib/load-manifest.ts:12`, `H:director.ts:4-10` | All four are rewritten to `@hive-academy/nx-video/manifest`. |
| Director is generic Playwright code. It uses `window.__ptahDirector` and `ptah-director-*` DOM ids | `H:director.ts:1-3,59-115,149` | Moves into the `capture` subpath. Rename the globals and ids to `__nxVideoDirector` / `nx-video-director-*`. |
| Fixtures hard-code the Ptah e2e output dir and launch Ptah Electron | `H:showcase-fixtures.ts:43,101`; `H:browser-fixtures.ts:60,151`; `H:showcase-launcher.ts:69-79` | Parameterise them through a fixture factory (`recordingsDir`, `launcher`, `electronEntry`, `baseURL`). |
| `prewarm.ts` / `config-menu.ts` hold Ptah UI selectors, but their logic is generic: a menu trigger plus items, an `aria-current` active item, a tablist whose active tab is restored by `title`, best-effort waits that never throw | `H:config-menu.ts:4-8,11-23,49-69,76-98`; `H:prewarm.ts:30-49,65-87,96-129` | Correction 5. They move as selector-driven hooks (Component 4). |
| `EndCard.tsx` imports `./waitlist-qr` (`WAITLIST_DISPLAY_URL`, `WAITLIST_QR_SVG`) and `../brand.config`, and has the literals "Join the Ptah Builders waitlist" / "Join the Builders waitlist". `gen-qr.mjs` writes `src/selfshot/waitlist-qr.ts` with hard-coded `ptah.live` URLs. The encoder `scripts/lib/qrcode.mjs` is pure JS with no imports (`qrSvg(text, {ecc,border,dark,light})`, `:516`) | `S:src/selfshot/EndCard.tsx:7-10,18-19,26-40,129`; `S:scripts/gen-qr.mjs:21-26,44-66`; `S:scripts/lib/qrcode.mjs:26,497,516` | EndCard computes its QR at render time from `BRAND.cta` with the moved encoder. No generated module (Component 5). |
| Four library files import `brand.config` directly, not through `theme.ts` | `S:src/ShowcaseVideo.tsx:36`, `S:src/components/OutroCard.tsx:11`, `S:src/components/Watermark.tsx:7`, `S:src/selfshot/EndCard.tsx:18` | All five importers (with `theme.ts:6`) are rewritten to `nx-video:brand`. |
| `TerminalPlayer.tsx` (moved) imports `MONO_FAMILY` from `../concept/story-kit` (stays in Ptah). `MONO_FAMILY` is `loadFont()` from `@remotion/google-fonts/JetBrainsMono` | `S:src/components/TerminalPlayer.tsx:18`; `S:src/concept/story-kit.tsx:14,19` | The library gets its own `fonts.ts`. A mechanical import check over the 64 library rows found only this file and `EndCard.tsx` resolving outside the moved set. |
| `tui-frames.mjs` reads `<rec>/<scene>/tui.cast` (asciicast v2), emulates it with `@xterm/headless` (CJS, loaded through `createRequire`), writes `<rec>/<scene>/tui-frames.json` `{scene, cols, rows, fps, frameCount, durationMs, frames:[{g}|{r}]}`. Flags `--scene` (default `tui-orchestration`), `--fps 30`, `--speed 1`, `--max-idle-ms 1200`. Ptah locks `@xterm/headless` 6.0.0 | `S:scripts/tui-frames.mjs:13-25,32,143-160,194-197`; Ptah `package.json:256`, `package-lock.json:19457-19458` | `tui-frames` schema and the `@xterm/headless` pin. |
| `render-outro.mjs` flags `--fps 30`, `--seconds 8`, `--format 16x9\|9x16\|both`, `--headline`, `--slug outro`; writes `selfshot/<slug>/out/<slug>-<format>.mp4`; spawns `npx remotion render` with `shell: win32` | `S:scripts/render-outro.mjs:11-13,42-51,77-91` | `outro` schema. The spawn is replaced (port rule 2). |
| Ptah locks `react`/`react-dom` 19.2.8 (range `~19.2.0`), `@playwright/test` 1.63.0, `sharp` 0.34.5. `render-all.mjs` `require('sharp')` inside a try that falls back to no crop | Ptah `package.json:190-191`, `package-lock.json:13336,34655-34665,35875`; `S:scripts/render-all.mjs:403-418` | Resolves the React and sharp pins (Component 2). `sharp` is an optional peer. |
| `CreateNodes` in Nx 24.0.1 is `[projectFilePattern, (files, options, context) => CreateNodesResultArray]` | TASK_2026_001 `research-part-c-nx.md:21` (read from the installed `public-api.d.ts:45,96-99`) | A13 resolved (Component 17). |
| Ptah's marketplace schema: `MarketplaceManifestSchema = { name (1–256), owner? (string or {name}), plugins: [{ name: SafePathToken, source: RepoRelativePath, description?, version?, mcpServers? }] (1–512) }`; `PluginMetadataSchema` passthrough `{name?, description?, version?}` | Ptah `libs/backend/plugin-marketplace/src/lib/registry/marketplace-manifest.schema.ts:27-30,37-50,66-110` | A7 resolved (Component 12). |
| Claude Code 2.1.310 has `claude plugin marketplace add <source>`, `claude plugin install <plugin>` (`plugin@marketplace`) and `claude plugin validate <path>` | `claude plugin --help`, `claude plugin install --help` on this host, 2026-10-26 | A8 resolved (Component 12). |
| Studio scripts derive roots from their own file location | `S:scripts/paths.mjs:21-36` (`WORKSPACE_ROOT`, `APP_ROOT`, `RECORDINGS_ROOT = dist/apps/ptah-electron-e2e/recordings`, `WHISPER_DIR`) | The scripts will live in `node_modules`, so roots must come from executor-provided env vars, not from `import.meta.url`. |
| `selfshot-render.mjs` spawns `npx` with `shell: win32` | `S:scripts/selfshot-render.mjs:235-240` | Violates hard rule 5. Replace with direct `@remotion/cli` resolution run by `process.execPath`, `shell:false`. |
| HyperFrames render calls `hyperframes` unpinned through npx-cli.js | `HF:render.mjs:44-53` (npx-cli.js resolver, Windows and Unix layouts), `:67` (`["hyperframes","render",…]`), `:72` (`spawnSync(process.execPath,[npxCli(),…])`) | Reuse the resolver as the engine-neutral spawn util. Pin the spec to `hyperframes@<const>`. |
| HyperFrames render output goes to `<main checkout>/video-output/<project>/<name>[-4k].mp4` (main checkout found through the git common dir) | `HF:render.mjs:1,29,63-65` | `hyperframes-render` keeps the AC8 output root. Output can sit outside a worktree, so it is not cacheable (D8). |
| Project scripts already pin `npx --yes hyperframes@0.8.98` | `HF:projects/agent-lanes-v3/package.json:5-10` | Confirms the pinned spec form. The generated `package.json` scripts use the same form. |
| `hyperframes.json` shape (registry, `paths.blocks/components/assets`, `media.autoProxy`, `authoringSkill`) | `HF:projects/agent-lanes-v3/hyperframes.json:1-12` | Template for `hyperframes-project`. It is also the `createNodes` trigger. |
| The two `assemble.mjs` copies are byte-identical (empty `git diff`) | `HF:projects/agent-lanes-{v3,chat}/assemble.mjs` (101 lines) | One `assemble` executor. The kit path is hard-coded at `:22-26` (`kits/ptah-ui/components`, `ptah-ui-` prefix) and becomes an option. |
| Assemble contract: `src/index.tpl` + `compositions/frames/NN-*.html` → `index.html`. Each fragment has a `<template>`; its root is `<div id="fNN" class="scene" data-composition-id="fNN" data-width data-height data-frame-start data-frame-duration>`; frames must be contiguous; every frame after the first needs `data-seam-in="<shader> <s>"` or `"cut"`; every `data-start` is followed by `data-duration`. The template markers are `/*@frames-css*/`, `<!--@frames-->`, `/*@scenes*/`, `/*@transitions*/`, `/*@frames-js*/`, `@MUSIC_POINTS`, `@DURATION` | `HF:…/assemble.mjs:9-12,29-56,58-61,77-78,91-101` | The executor ports these rules unchanged. The `frame` generator emits this shape (Component 13). |
| Kit build: `/*@include name*/` expansion, fails on a leftover include, optional gallery copy with a `ptah-ui-` prefix | `HF:kits/ptah-ui/build.mjs:1-28` | `kit-build` executor. The prefix becomes `<kitName>-`. |
| Kit runtime branding: factory `ptahKit(root,cfg)`; `focus()` selects `[data-ptah-part]`; `ptahToolIcon()` maps Claude tool names to icons and has a `/^mcp__ptah__/` branch; `pu-` CSS classes (`pu-ring`, `pu-vignette`, `pu-ico`) and the `PU_ICONS` table; the header comment cites Ptah's SPEC and `tool-icon.component.ts` | `HF:kits/ptah-ui/src/partials/runtime.js:1-4,197-226,251-263,291-304` | Explicit replacements in Component 13, tested on the generated kit and the tarball. |
| PLAYBOOK allows `data-layout-allow-overlap` | `HF:PLAYBOOK.md:53` | Conflicts with `docs/decisions.md` (CI fails on `data-layout-allow-*`). Resolved in D9. |
| Leak guard: `SELFSHOT_KIT_SLUGS = new Set(['_smoke'])`, `MEDIA_EXT`, `shouldCopy` filter, `findLeakedIngest` walker, and delete-and-throw | `S:scripts/export-kit.mjs:63,66,97-108,117-137,254-262` | Port it unchanged as one module, used by `export-kit`, the CI leak guard and the pre-publish tarball check. |
| export-kit excludes `node_modules`, `dist`, `out`, `.whisper`, `.env`, `render-props.json` | `S:scripts/export-kit.mjs:36-45` | Same exclusion list in the ported module. |
| Remotion deps pinned at 4.0.484 (some with `^`); `ffmpeg-static 5.3.0`, `kokoro-js 1.2.1`, `zod 4.6.5`, `nodejs-whisper 0.3.1`, `@playwright/test ^1.50.0`, `@remotion/three` and `three` (3D) | Ptah `package.json:136-140,167,181,187,193,205,230,232-233,285` | One Remotion constants module with exact pins (no `^`). `three`/`@remotion/three` are not pinned. They serve only `src/concept3d` and promos, which stay in Ptah. |
| Studio `package.json` has scripts only, no deps. The deps live at the Ptah root | `S:package.json:7-17` | `init` writes the pinned deps to the **workspace root** `package.json`. |
| Studio targets are all `nx:run-commands` over the scripts. `video` chains narrate → caption → render after `showcase` | `S:project.json:8-69` | Replaced by inferred executor targets. `promo`/`polish` stay in Ptah. |
| Narrate engines and flags; env `PTAH_TTS_ENGINE`, `PTAH_ELEVENLABS_VOICE_ID` | `S:scripts/narrate.mjs:13-26` | Narrate schema mirrors the flags. Rename the env vars to `NX_VIDEO_*` (Ptah-side touch point). |
| TTS uses `kokoro-js`. ffmpeg comes from `ffmpeg-static` and throws a fix message when missing | `S:scripts/lib/tts.mjs:24,50-54` | `doctor` checks `ffmpeg-static`. `init` installs `kokoro-js`. |
| Caption and transcribe use `@remotion/install-whisper-cpp`, cached in `<app>/.whisper` | `S:scripts/caption.mjs:2-19,32`; `selfshot-transcribe.mjs:2-26` | `.whisper/` goes in the generated `.gitignore`. `doctor` warns (does not fail) when the cache is cold. |
| Render flags `--scene`, `--concurrency`, `--out-res native|1080p|1440p|4k`, music and whoosh are optional (none committed) | `S:scripts/render-all.mjs:14-17,43-44,713-757,807-812,374-383` | Music and SFX are optional inputs. No neutral audio file has to ship (see "Neutral replacements"). |
| Selfshot flags `--slug`, `--format 16x9|9x16|both`, `--range`, `--concurrency`; transcribe `--model`, `--input`, `--force` | `S:scripts/selfshot-render.mjs:16-17,167`; `selfshot-transcribe.mjs:14-15,56` | Selfshot schema. |
| Master flags `--check`, `--all`, `--scene`, `--file`, `--force`, `--target -14`, `--peak -1.5` | `S:scripts/master.mjs:10-19` | `master` executor schema. |
| `_smoke` holds only `beats.json` + `words.json`. Its media was cut from a Ptah tour MP4 with ffmpeg | `git ls-tree S:selfshot/_smoke`; `S:selfshot/README.md:18-31` | The media has to be synthesised (Neutral replacements R1). `beats.json` has one Ptah/Dyad/Hive mention and must be neutralised. |
| `Root.tsx` imports `../preview.props.json` and four `../promos/*.json` and registers `PromoReel`/`AssetSheet`/`AgentShowcase`/`StateOfArtProof` | `S:src/Root.tsx:71,78-81,184-222` | The package's composition registry includes only Showcase + selfshot compositions. Promo registration stays in Ptah's own Root. |
| 22 studio files read branding through `theme.ts`, which does `import { BRAND } from './brand.config'` | `S:src/theme.ts:6-8`; file list from `git grep` over `S:src` | Library components need one brand injection point. Chosen: webpack alias (D2). |
| `brand.config.ts` holds Ptah identity (`productName: 'Ptah'`, `tagline: 'ptah.live'`, `ctaLabel`) and Dyad legacy colours | `S:src/brand.config.ts:19,31,57-59,74` | The generated `brand.config.ts` is neutral (`Acme`-style placeholder) without legacy Dyad keys. |
| GLB models are referenced only by `src/concept3d/three-assets.tsx:54,198` and `render-promo.mjs:97-98`. `ptah-icon.png` is referenced nowhere in generic `src` | `git grep` over `S:src`, `S:scripts` | No model and no icon replacement is needed for generic paths. |
| Editor facts: Resolve MCP at `vendor/davinci-resolve-mcp` @ `6eca4bf` with venv; `.mcp.json` entry `davinci-resolve` with env `RESOLVE_SCRIPT_API`, `RESOLVE_SCRIPT_LIB`, `PYTHONPATH`, `PYTHONHOME`, `DAVINCI_RESOLVE_BRIDGE=1`, `PYTHONUTF8=1`; bridge on loopback port 49632; Python, uv, ffmpeg and Resolve 21 are prerequisites; HyperFrames cannot find `npx.cmd` from Git Bash | `c032b0f1e:tools/video-editor/CLAUDE.md:11-39` | `editor` generator contract and `doctor` editor checks. Design source only. Nothing is copied. |
| Node `>=22.9` (uses `fs.cpSync` filter) | `S:scripts/export-kit.mjs:24` | Node floor for executors. `doctor` checks it. |

## Architecture decision

- **Chosen approach:** one publishable Nx plugin package that holds four things:
  - generators,
  - executors,
  - a `createNodes` inference plugin,
  - three runtime subpath exports that user code imports: `./manifest` (types), `./capture` (Playwright Director and fixtures) and `./remotion` (studio compositions and components).

  The moved `.mjs` pipeline scripts are kept as ESM modules inside the package. The executors are thin TypeScript wrappers. They validate options, compute paths, set env vars and spawn the script with `process.execPath` and `shell:false`. HyperFrames code and Remotion code sit in separate source zones. An ESLint import-boundary rule enforces the split in `lint`, and an isolation test is the backstop (D13). Engine-neutral spawn and path utilities are the only shared code. A second package `create-nx-video` and an e2e project complete the workspace. The Claude plugin lives in `plugins/nx-video/`, with the marketplace manifest at `.claude-plugin/marketplace.json`.
- **Rationale:** This shape meets five constraints:
  - It satisfies "Ptah consumes the Director and the studio from this package, not from a copy" and AC7.
  - It keeps the proven script behaviour, with only path and spawn edits, which keeps Ptah drift-sync cheap.
  - It meets hard rules 3–5: pins live in constants and spawn is Windows-safe.
  - It follows the research layout (part C "Recommended layout").
  - It publishes one npm package whose name is verified free (research Q5).
- **Rejected alternatives:**
  - (a) Generated studio copy, as in the inventory labels. Ptah would hold the moved paths again, which breaks AC7 and the decisions.md rule, and upgrades would need re-generation and diff-merge.
  - (b) A separate `@hive-academy/showcase-manifest` package, as roadmap 004 suggests with "scoped package". The contract is types only, so a second package adds a publish, a version lockstep and an unverified npm name for no runtime benefit.
  - (c) Porting every `.mjs` to TypeScript running in-process. That is a large rewrite of proven code (render-all.mjs alone is over 800 lines), it brings ESM-only deps into the CJS executor runtime, and it loses process isolation for heavy renders.
  - (d) Splitting engines into separate internal Nx libraries for `@nx/enforce-module-boundaries`. A single published package would then need bundling. ESLint's core `no-restricted-imports`/`no-restricted-syntax` rules, scoped per zone with flat-config `files` globs, give lint-time enforcement inside one project with no extra dependency.
- **Assumptions:** listed per component with the check that resolves each one. The main ones are A1 (Remotion webpack consumes the package's compiled JSX and the alias) and A2 (render-all and draft-beats behaviour for the smoke flow).
- **Effect on existing code:** This repository currently holds documents only. Every file is created. Ptah is not edited here. Ptah-side deletion and rewiring are planned below for Ptah `TASK_2026_582_a7db`.

## Repository layout

```
nx-video/
  package.json                 private root; devDeps nx/@nx/plugin/@nx/js/@nx/devkit/@nx/eslint/@nx/vite|jest = 24.0.1, verdaccio
  nx.json                      release (fixed, conventional commits), targetDefaults, namedInputs
  tsconfig.base.json  eslint.config.mjs  .gitignore  .gitattributes (eol=lf for *.mjs,*.ts,*.html)
  tools/eslint/engine-zones.mjs  the one zone table read by the lint blocks and the isolation test
  .verdaccio/config.yml        from @nx/js:setup-verdaccio
  tools/scripts/               start-local-registry.ts, stop-local-registry.ts (generated)
  tools/guards/                no-media.mjs, leak-guard.mjs, layout-attrs.mjs, pack-check.mjs (thin CLIs over package modules)
  tools/marketplace/           ptah-marketplace.schema.json (transcribed, see Component 12) + validate.mjs
  packages/nx-video/           @hive-academy/nx-video  (publishable)
    package.json  generators.json  executors.json  project.json  README.md  LICENSE  NOTICE
    src/index.ts               exports createNodes (and nothing engine-specific)
    src/plugin/create-nodes.ts
    src/shared/                spawn-node.ts, npx-cli.ts, paths.ts, output.ts   ← engine-neutral only
    src/manifest/              index.ts, manifest.types.ts                       ← ./manifest export (types)
    src/capture/               director.ts, fixtures.ts, launcher.ts, menu-surface.ts, prewarm.ts, index.ts   ← ./capture export
    src/remotion/
      versions.ts              ← the ONE Remotion pin module
      studio/                  ← ./remotion export (TSX library: components, effects, remocn, selfshot, ShowcaseVideo, NxVideoCompositions, theme, brand types)
      scripts/                 ← moved .mjs (narrate, caption, render-all, selfshot-*, master, render-outro, gen-qr, tui-frames, paths, lib/*)
      kit-guard/               ← ported SELFSHOT_KIT_SLUGS guard (shouldCopy, findLeakedIngest, MEDIA_EXT)
      smoke/                   ← synthetic media builder (ffmpeg-static lavfi)
    src/hyperframes/
      versions.ts              ← the ONE HyperFrames pin module (projects, editor, shader-transitions, davinci-resolve-mcp)
      assemble/ kit-build/ render/ layout-attrs/ check/ editor/ (download + mcp-json merge)
    src/executors/remotion/<studio|narrate|caption|render|selfshot|master|outro|qr|tui-frames|export-kit|capture>/
    src/executors/hyperframes/<assemble|kit-build|check|snapshot|preview|hyperframes-render>/
    src/executors/doctor/
    src/generators/<init|studio|scene|editor|hyperframes-project|frame|kit|kit-component|promo|preset>/
    src/engine-isolation.spec.ts
  packages/create-nx-video/    create-nx-video (publishable; bin/index.ts → createWorkspace with preset)
  e2e/nx-video-e2e/            jest/vitest e2e against Verdaccio; no video render
  plugins/nx-video/            Claude plugin: .claude-plugin/plugin.json, skills/video-showcase/**, agents/video-director.md
  .claude-plugin/marketplace.json
  test-fixtures/guards/        leak-slug/, clean-studio/, layout-ignore/, layout-allow/ (text fixtures only, no media)
  test-fixtures/lint/          static-, dynamic-, require-cross-engine.ts (expected lint errors)
  .github/workflows/ci.yml  release.yml  render-smoke.yml
```

### Nx projects, targets, tags

| Project | Tags | Targets |
|---|---|---|
| `nx-video` | `type:plugin`, `scope:public` | `build` (`@nx/js:tsc`, assets: `generators.json`, `executors.json`, `**/schema.json`, `src/generators/**/files/**`, `src/remotion/scripts/**/*.mjs`, `src/remotion/scripts/**/*.json`, `src/remotion/studio/lib/**/*.mjs` (the QR encoder EndCard imports), `README.md`, `LICENSE`, `NOTICE`), `lint`, `test`, `typecheck` |
| `create-nx-video` | `type:preset`, `scope:public` | `build`, `lint`, `test`. `implicitDependencies: ["nx-video"]` (build order only) |
| `nx-video-e2e` | `type:e2e` | `e2e` (`dependsOn: ["^build"]`, runs in band, uses `local-registry`) |
| root | — | `local-registry` (continuous Verdaccio) |

Module-boundary rules (`@nx/enforce-module-boundaries` in `eslint.config.mjs`):

- `type:preset` may not import `type:plugin` source. It reaches the plugin only through npm (the `--preset` package name).
- `type:e2e` may depend on `type:plugin` and `type:preset`.
- `type:plugin` depends on nothing in the workspace.

Engine isolation inside `nx-video`. Two layers enforce the zone table below:

1. **Lint (primary).** `packages/nx-video/eslint.config.mjs` adds one flat-config block per zone. Each block's `files` glob covers `**/*.{ts,tsx,mjs,js}` in the zone, and the `nx-video:lint` target's `lintFilePatterns` include `.mjs`. Each block sets:
   - core `no-restricted-imports` with `patterns` for the forbidden zones as relative-path globs (for example `**/hyperframes/**`, `**/executors/hyperframes/**` in the Remotion zone). The rule covers `import`, `import type` and `export … from`.
   - core `no-restricted-syntax` with selectors for what `no-restricted-imports` does not see: `ImportExpression` with a literal source that matches a forbidden zone, `ImportExpression` with a non-literal source (any computed dynamic import inside an engine zone is an error), and `CallExpression[callee.name='require']` with a matching or non-literal first argument (this includes `createRequire(...)` results named `require`, as in `tui-frames.mjs:32`).
   - the zone's message names the rule: "engines share no code (CLAUDE.md hard rule 4); move engine-neutral code to src/shared".

   Generator `files/**` templates are excluded from these blocks (they are user-workspace content, not package code).
2. **Test (backstop).** `src/engine-isolation.spec.ts` parses every `.ts`/`.tsx`/`.mjs` import, including dynamic `import()` and `require()`, with the TypeScript compiler API, resolves relative specifiers to files, and checks the resolved path against the same table. It runs in `test` on all three OSes. It catches what glob patterns can miss (for example a path that reaches a zone through `..` segments the glob does not match).

Both layers read the zone table from one module, `tools/eslint/engine-zones.mjs`, so the rule and the test cannot drift. A fixture test lints `test-fixtures/lint/{static,dynamic,require}-cross-engine.ts` and expects three errors.

| Zone | May import | Must not import |
|---|---|---|
| `src/remotion/**`, `src/executors/remotion/**` | `src/shared/**`, `src/manifest/**`, `src/remotion/**` | `src/hyperframes/**`, `src/executors/hyperframes/**` |
| `src/hyperframes/**`, `src/executors/hyperframes/**` | `src/shared/**`, `src/hyperframes/**` | `src/remotion/**`, `src/manifest/**`, `src/capture/**` |
| `src/shared/**` | node builtins only | any engine zone, `@nx/devkit` types allowed |
| `src/remotion/studio/**` (browser bundle) | `remotion`, `@remotion/*`, `react`, `zod`, `src/manifest/**`, siblings | node builtins, `@nx/devkit`, `src/shared/**`, `src/remotion/scripts/**` |
| `src/remotion/scripts/**` (node) | node builtins, `src/remotion/scripts/**`, and exactly one studio file, `src/remotion/studio/lib/qrcode.mjs` (pure, no imports) | the rest of `src/remotion/studio/**` |
| `src/capture/**` | `@playwright/test` (type and runtime), node builtins, `src/manifest/**` | `@nx/devkit`, engine zones |
| aggregators: `src/executors/doctor/**`, `src/plugin/**`, `src/generators/{init,preset}/**` | both engines' `versions.ts` and generators | — (they consume both engines; neither engine imports them) |

The isolation test also asserts two things (a lint `no-restricted-syntax` literal selector duplicates the second):

- No string `hyperframes@` or `remotion@`/`@remotion/` version literal appears outside the two `versions.ts` files and generated `files/**`.
- No source contains `npx.cmd`, `shell: true` or `execFileSync('npx'`.

### package.json of `@hive-academy/nx-video`

- `exports`:
  - `"."` → `src/index.js` (createNodes)
  - `"./manifest"` → types-only (`.d.ts` + empty `.js`)
  - `"./capture"`
  - `"./remotion"`
  - `"./generators.json"`, `"./executors.json"`, `"./package.json"`
- `generators` and `executors` fields point at the JSON files.
- `peerDependencies`:
  - `nx`, `@nx/devkit`: `>=23 <25`
  - optional: `remotion`, `@remotion/cli`, `@remotion/captions`, `@remotion/install-whisper-cpp`, `@remotion/media-utils`, `@remotion/transitions`, `@remotion/google-fonts` (`4.0.484`); `react`, `react-dom`; `zod`; `ffmpeg-static`; `kokoro-js`; `@playwright/test` (`>=1.50`); `@xterm/headless` (`6.0.0`, `tui-frames` only); `sharp` (`0.34.5`, optional crop probe in `render-all`); `hyperframes` (`0.8.98`).

  Optional peers keep a single `remotion` instance in the user's bundle and let a HyperFrames-only workspace skip Remotion.
- `dependencies`: `@nx/devkit` is not a dependency (peer); `tslib`. `tar` (node-tar, pinned) is added with the editor generator in its later minor release (task 008), not in the first release.
- `files`: build output only. `pack-check.mjs` (Component 11) gates the tarball.

## Component specifications

### 1. Engine-neutral shared utilities (`src/shared`)

- Purpose: spawn Node-based CLIs safely on Windows, macOS and Linux, and resolve output roots.
- Responsibilities:
  - `npxCli()`: port `HF:render.mjs:44-53` unchanged (Windows installer layout `node_modules/npm/bin/npx-cli.js` next to `node.exe`; Unix prefix layout `../lib/node_modules/npm/bin/npx-cli.js`). Add `npm_execpath` as a third candidate when it ends in `npx-cli.js` or `npm-cli.js` (sibling). That covers nvm, fnm, volta and Homebrew (Assumption A3).
  - `runNode(scriptOrCli, args, { cwd, env, stdio })`: `spawn(process.execPath, [script, ...args], { shell: false, windowsHide: true })`. Returns `{ success, code }`. Never throws for a non-zero exit. Executors map that to `{ success: false }`.
  - `runPinnedNpx(spec, args, opts)`: `runNode(npxCli(), ['--yes', spec, ...args], opts)`, where `spec` must match `/^[@a-z0-9/._-]+@\d+\.\d+\.\d+$/`. A bare name throws `NxVideoPinError`.
  - `mainCheckoutRoot(workspaceRoot)`: port the git-common-dir read from `HF:render.mjs:29-43`. It reads from disk and does not spawn git.
  - `resolveFromProject(request, projectRoot)`: `require.resolve(request, { paths: [projectRoot, workspaceRoot] })`.
- Verified contracts: `HF:render.mjs:29,44-53,72`.
- Dependencies: node builtins only.
- Integration points: every executor that spawns.
- Failure behaviour:
  - npx-cli.js not found → `Error("npx-cli.js not found next to <execPath>; tried: <list>. Install npm with Node, or set NX_VIDEO_NPX_CLI to npx-cli.js.")`. `NX_VIDEO_NPX_CLI` is the one escape hatch, and it is validated to end in `npx-cli.js` and exist.
  - Unpinned spec → `NxVideoPinError`.
- Quality: no shell, no string-built commands (argument arrays only). Paths with spaces are passed unquoted.
- Verification seam: unit tests for each resolver layout with a temp dir that fakes `process.execPath`, run on the three CI OSes. A test asserts `spawn` is called with `shell:false`.
- Files: CREATE `packages/nx-video/src/shared/{spawn-node.ts,npx-cli.ts,paths.ts,output.ts,*.spec.ts}`.

### 2. Pinned version modules

- Purpose: one source of truth per engine (hard rule 3).
- `src/remotion/versions.ts`:
  - `REMOTION_VERSION = '4.0.484'`, applied to `remotion`, `@remotion/cli`, `@remotion/captions`, `@remotion/install-whisper-cpp`, `@remotion/media-utils`, `@remotion/transitions`, `@remotion/google-fonts` (Verified versions: Ptah `package.json:136-140,193,232`; the `^` ranges become exact).
  - `FFMPEG_STATIC_VERSION = '5.3.0'` (`:167`), `KOKORO_JS_VERSION = '1.2.1'` (`:181`), `ZOD_VERSION = '4.6.5'` (`:205`), `PLAYWRIGHT_RANGE = '^1.50.0'` (`:230`).
  - `SHARP_VERSION = '0.34.5'` (Ptah lock `package-lock.json:35875`). `render-all.mjs:403-418` requires it inside a try and falls back to no crop, so it is an optional peer. `init` does not install it. `doctor` WARNs when it is absent.
  - `REACT_VERSION = '19.2.8'` for `react` and `react-dom` (Ptah range `~19.2.0` at `package.json:190-191`, lock `:34655-34665`).
  - `XTERM_HEADLESS_VERSION = '6.0.0'` (Ptah `package.json:256` `^6.0.0`, lock `:19457-19458`). Installed by `init` for `remotion` because `tui-frames` requires it.
  - Supporting-dependency policy (defect 5): Remotion packages are exact pins that `init` always enforces. `ffmpeg-static`, `kokoro-js`, `zod`, `react`, `react-dom`, `@xterm/headless` are written exact. `@playwright/test` keeps the range `^1.50.0` because users run their own Playwright version for tests.
- `src/hyperframes/versions.ts`:
  - `HYPERFRAMES_PROJECT = 'hyperframes@0.8.98'`
  - `SHADER_TRANSITIONS = '@hyperframes/shader-transitions@0.8.97'`
  - added with the editor in task 008 (later minor, not in the first release):
    - `HYPERFRAMES_EDITOR = 'hyperframes@0.8.30'` (package name *unconfirmed*, O2)
    - `DAVINCI_RESOLVE_MCP = { repo: 'samuelgursky/davinci-resolve-mcp', sha: '6eca4bfc371a1c2f7cb2961efee651ab07436378', license: 'MIT', confirmed: false, tarballSha256: null }` (O1)
- Failure behaviour: not applicable (constants). The lint rule and the isolation test assert no version literal elsewhere.
- Verification seam: unit snapshot of the generated `package.json` from `init` and `hyperframes-project` in e2e, which asserts the exact versions.
- Files: CREATE `packages/nx-video/src/remotion/versions.ts`, `packages/nx-video/src/hyperframes/versions.ts`.

### 3. Manifest contract (`./manifest`)

- Purpose: the shared types between capture (beats) and render (shots).
- Responsibilities: export the five types unchanged from `libs/showcase-manifest/src/lib/manifest.types.ts:20-89`.
- Verified contracts: `libs/showcase-manifest/src/index.ts:1-7`.
- Integration points: `./capture` (Director writes `beats.json`), `./remotion` (`load-manifest.ts`, `ShowcaseVideo`, `BodyScene`), scene templates.
- Failure behaviour: compile-time only. The runtime validation stays in `load-manifest.ts` (zod `sceneManifestSchema`, used at `S:src/Root.tsx:10`).
- Verification seam: a `tsc --noEmit` type test that imports each type from `@hive-academy/nx-video/manifest` in the e2e workspace.
- Files: CREATE `packages/nx-video/src/manifest/{index.ts,manifest.types.ts}`. The inventory's 6 `libs/showcase-manifest/*` rows land here. `package.json`, `project.json` and the tsconfigs are not copied as such: their roles are absorbed by the plugin's build, and that is recorded in the mapping.

### 4. Capture harness (`./capture`) and `capture` executor

- Purpose: record a product walkthrough with Playwright and a virtual-camera Director, and write `beats.json` plus a raw recording per scene.
- Responsibilities:
  - `Director` (port `H:director.ts` and rename the globals/ids).
  - `createShowcaseTest(options)`: one factory that replaces `showcase-fixtures.ts` and `browser-fixtures.ts`. Options: `launcher: 'browser' | 'electron'`, `baseURL?` (browser), `electronEntry?` (electron, required when `launcher==='electron'`), `recordingsDir` (default from env `NX_VIDEO_RECORDINGS_DIR`, else `dist/video/recordings`), `res: '1080p'|'1440p'|'4k'` (from `H:showcase-launcher.ts:29`). It returns `{ test, expect }` like `H:showcase-fixtures.ts:101,188`.
  - `launchShowcase` keeps the Electron launch logic from `H:showcase-launcher.ts`, with `resolveElectronEntry()` (`:69-79`) replaced by the `electronEntry` option.
  - `createMenuSurfaces` (from `H:config-menu.ts`, user decision row 17). Generic over the surface id type. Contract:
    ```ts
    interface MenuSurfaceOptions<Id extends string> {
      trigger: string;                       // selector of the menu button (Ptah: '[data-test="config-menu-trigger"]')
      items: string;                         // selector matching every menu item (Ptah: '[data-test^="config-menu-item-"]')
      item: (id: Id) => string;              // selector of one item (Ptah: id => `[data-test="config-menu-item-${id}"]`)
      activeItem?: string;                   // default `${items}[aria-current="true"]`  (config-menu.ts:80)
      idAttribute?: string;                  // default 'data-test'                     (config-menu.ts:82)
      idFromAttribute: (value: string) => Id | null; // replaces the switch at config-menu.ts:83-96
      silentTimeoutMs?: number;              // default 2000                            (config-menu.ts:8)
    }
    interface MenuSurfaces<Id extends string> {
      open(page: Page, director: Director, id: Id): Promise<void>;   // recorded clicks (config-menu.ts:11-23)
      openSilently(page: Page, id: Id): Promise<boolean>;            // never throws    (:49-69)
      active(page: Page): Promise<Id | null>;                        // never throws    (:76-98)
    }
    export function createMenuSurfaces<Id extends string>(o: MenuSurfaceOptions<Id>): MenuSurfaces<Id>;
    ```
  - `createPrewarm` (from `H:prewarm.ts`). Contract:
    ```ts
    interface PrewarmOptions<Id extends string> {
      tablist: string;                       // Ptah: '.electron-tabs'                 (prewarm.ts:30)
      tabTitleAttribute?: string;            // default 'title'                        (:35-49)
      menu?: MenuSurfaces<Id>;               // restores a menu surface after pre-warm (:80-86)
      home?: { visible: string; back: string }; // restores a "home" screen when nothing else was active
                                             // (Ptah: visible 'ptah-electron-welcome', back '[data-test="config-back-to-welcome"]', :96-129)
      settleMs?: number;                     // default 400 (:78)
    }
    interface Prewarm<Id extends string> {
      navSurface(page: Page, navName: string, readySelector: string, timeoutMs?: number): Promise<void>; // :65-87, default 20000
      tabs(page: Page, spec: {
        open: Id;                            // menu surface to enter (Ptah: 'thoth')
        firstReady: string;                  // Ptah: '#thoth-tab-memory'
        tab: (tabId: string) => string;      // Ptah: t => `#thoth-tab-${t}`
        panel: (tabId: string) => string;    // Ptah: t => `#thoth-panel-${t}`
        tabIds: readonly string[];
        timeoutMs?: number; panelTimeoutMs?: number; tabSettleMs?: number;  // defaults 20000, 15000, 500
      }): Promise<void>;
    }
    export function createPrewarm<Id extends string>(o: PrewarmOptions<Id>): Prewarm<Id>;
    ```
    `tabs` requires `menu` (a TypeScript overload makes `tabs` absent when `menu` is not given).
  - No Ptah selector, id union or element name appears in package source. Ptah keeps a small `showcase/_harness/ptah-surfaces.ts` that calls `createMenuSurfaces<'thoth'|'setup-hub'|'marketplace'|'settings'>(…)` and `createPrewarm(…)` with the selectors above, and re-exports `prewarmThoth(page, ids)` as `prewarm.tabs(page, {open:'thoth', …})` so its scenes keep their call sites.
  - Failure behaviour for both hooks is the source behaviour: every navigation step is best-effort, a missing element returns early, `openSilently`/`active` return `false`/`null` on any error, and the menu is closed with Escape in `finally` (`config-menu.ts:42-47,66-68,96-97`). Only `open` (recorded) lets a Playwright error propagate, as today.
- `capture` executor (`@hive-academy/nx-video:capture`) schema:
  - `config` (string, default `{projectRoot}/showcase.config.ts`)
  - `scene` (string, optional grep; all scenes when omitted)
  - `res` (enum, default `1080p`)
  - `recordingsDir` (string, default `dist/video/recordings`)
  - `transcode` (boolean, default true)
  - `headed` (boolean, default false)
- Executor behaviour: resolve `@playwright/test/cli.js` with `resolveFromProject`, then `runNode(cli, ['test','-c',config, ...(scene?['-g',scene]:[])], { env: { NX_VIDEO_RECORDINGS_DIR, NX_VIDEO_SCENE, NX_VIDEO_RES } })`. When `transcode` is on, run the webm→mp4 step in `src/remotion/scripts/lib/media.mjs` with ffmpeg-static.
  - Assumption A4: render-all needs an mp4 (Ptah's `transcode.mjs` stays in Ptah). Check in 006 which file names `render-all.mjs` stages from `sceneDir()`. If it accepts `raw.webm`, set `transcode` to default false and drop the step.
- Not cached (side-effectful, long-running).
- Files read: `showcase.config.ts`, `*.scene.ts`, `scripts/<scene>.json`. Files written: `<recordingsDir>/<scene>/{raw.webm|raw.mp4, beats.json}`.
- Dependencies: `@playwright/test` (optional peer), manifest, shared spawn. The executor sits in the Remotion zone because its output feeds the Remotion pipeline only.
- Failure behaviour:
  - Playwright missing → "`@playwright/test` is not installed in <projectRoot>. Run `nx g @hive-academy/nx-video:init` or `npm i -D @playwright/test`."
  - Browsers missing → print Playwright's own message and point to `npx playwright install chromium` (the text only; the executor never runs it).
  - `launcher: electron` without `electronEntry` → schema error.
  - A non-zero Playwright exit → `success:false`. Partial recordings are left in place for debugging, and the next run overwrites them.
- Verification seam:
  - unit: the fixture factory's path resolution
  - hooks: a Playwright component-free test (`@playwright/test` against a static HTML fixture `test-fixtures/capture/menu.html` with a neutral menu, tablist and home screen) asserts `open`, `openSilently`, `active`, `navSurface` restore by title, `tabs` restore to the menu surface and to `home`, and that a missing trigger returns `false`/`null` without throwing. It runs in the e2e job (Chromium on the three OSes, no video).
  - a lint/grep test fails if `src/capture/**` contains `thoth`, `setup-hub`, `electron-tabs`, `ptah-electron` or `config-menu-item`.
  - e2e: generate a scene and assert `nx show project <studio>` lists `capture`. A real capture runs in the release smoke (Component 19) against a static HTML page.
- Files: CREATE `packages/nx-video/src/capture/{director.ts,fixtures.ts,launcher.ts,menu-surface.ts,prewarm.ts,index.ts,*.spec.ts}`, `test-fixtures/capture/menu.html`, `packages/nx-video/src/executors/remotion/capture/{executor.ts,schema.json,schema.d.ts}`.

### 5. Remotion studio library (`./remotion`)

- Purpose: Showcase and self-shot compositions and components, consumed by every studio, Ptah's included, without a copy.
- Responsibilities:
  - Ship the moved `src/**` component tree: `components/**`, `components/effects/**`, `remocn/**`, `selfshot/**`, `lib/load-manifest.ts`, `lib/shots.ts`, `ShowcaseVideo.tsx`, `theme.ts`.
  - Export `NxVideoCompositions`: a React fragment that registers `ShowcaseVideo` and the selfshot `TalkingHead`/`ScreenDemo`/`Hybrid`/`Outro` compositions with their `calculateMetadata` (from `S:src/Root.tsx:10-60` minus the promo blocks `:71-81,184-222`).
  - Export `BrandConfig` type, `defineBrand()` identity helper, and every component for user compositions.
- Brand injection (D2): the five direct importers of `brand.config` (`theme.ts:6`, `ShowcaseVideo.tsx:36`, `components/OutroCard.tsx:11`, `components/Watermark.tsx:7`, `selfshot/EndCard.tsx:18`) import `BRAND` from the module id `nx-video:brand` instead. The generated `remotion.config.ts` maps that id to the studio's `src/brand.config.ts` with `Config.overrideWebpackConfig` (Assumption A1). The package ships an ambient `declare module 'nx-video:brand' { export const BRAND: BrandConfig }`, and the generated `tsconfig.json` maps `nx-video:brand` to `./src/brand.config.ts` in `paths` so `tsc` resolves the same module the bundler does.
- `BrandConfig` contract (extends the source keys `S:src/brand.config.ts:15-52` minus `bgGlowLegacy` and other Dyad legacy keys):
  ```ts
  interface BrandCta {
    qrUrl: string;        // encoded in the QR; may carry tracking params (source: gen-qr.mjs:24 QR_URL)
    displayUrl: string;   // printed under the QR, no query params (gen-qr.mjs:26 DISPLAY_URL)
    headline?: string;    // replaces the literal "Join the Builders waitlist" (EndCard.tsx:129); default BRAND.ctaLabel
    qrAlt?: string;       // replaces "Join the Ptah Builders waitlist" (EndCard.tsx:40); default `QR code: ${displayUrl}`
  }
  interface BrandConfig { wordmark; productName; tagline; ctaLabel; theme: BrandTheme; cta?: BrandCta }
  ```
- EndCard QR (defect 2). `waitlist-qr.ts` and its Ptah output stay in Ptah (inventory). The library does not import any generated module:
  - The pure encoder `S:scripts/lib/qrcode.mjs` moves to `src/remotion/studio/lib/qrcode.mjs` (no imports, browser-safe; `qrSvg` at `:516`). `gen-qr.mjs` imports it from there (the single allowed scripts→studio edge in the zone table).
  - `EndCard` computes `const svg = useMemo(() => qrSvg(BRAND.cta.qrUrl, { ecc: Ecc.HIGH, border: 2, dark: '#0b0d12', light: '#ffffff' }), [])` (the options from `gen-qr.mjs:44-49`) and shows `BRAND.cta.displayUrl`. The encoding is deterministic, so Remotion's out-of-order frame rendering sees the same SVG on every frame.
  - When `BRAND.cta` is absent, EndCard renders the wordmark and `ctaLabel` without the QR block and without the URL line. The layout keeps the text column centred.
  - The generated `brand.config.ts` sets `cta: { qrUrl: 'https://example.com', displayUrl: 'example.com' }` so the smoke studio exercises the QR path.
  - Ptah moves its two URLs into its own `brand.config.ts` `cta` block and can then delete `waitlist-qr.ts` (Ptah-side step 4). `gen-qr.mjs` in Ptah is replaced by the package `qr` executor only if Ptah still wants a file output.
- Fonts: `TerminalPlayer.tsx:18` imports `MONO_FAMILY` from Ptah's `concept/story-kit`. The library adds `src/remotion/studio/fonts.ts` with `export const { fontFamily: MONO_FAMILY } = loadFont()` from `@remotion/google-fonts/JetBrainsMono` (the source definition, `story-kit.tsx:14,19`) and exports it, so Ptah's `story-kit` can import it back from the package.
- Neutralisation: remove Ptah/Dyad strings and the legacy Dyad colour keys (`S:src/brand.config.ts:19,31,74`). Every user-facing literal reads from `BRAND` (including the EndCard literals above). CI greps the built `studio/**` for `/ptah|dyad|hive|xirp|spotify|waitlist-qr/i` and fails on a hit (Component 11).
- Dependencies: `remotion`, `@remotion/*`, `react`, `zod`, manifest. Browser zone, so no node imports (isolation test).
- Integration points: generated `Root.tsx` (Component 7) and Ptah's Root (Ptah-side plan).
- Failure behaviour: the existing zod `sceneManifestSchema` rejects bad props with Remotion's error overlay. If the alias is missing, webpack fails with "Module not found: nx-video:brand". `doctor` checks `remotion.config.ts` contains the alias call and prints the fix line.
- Quality: no timers or observers outside Remotion's frame model (as today).
- Verification seam:
  - unit: render each exported component's metadata function with a fixture brand
  - unit: `EndCard` rendered with `react-dom/server` `renderToStaticMarkup` under a fixture brand, once with `cta` (asserts an `<img` with an `svg+xml` data URI and the `displayUrl` text) and once without (asserts no `<img`)
  - unit: `qrSvg('https://example.com', …)` snapshot equals the output of the source encoder for the same input (guards the move)
  - mechanical import check (`tools/guards/library-imports.mjs`, run in CI): every relative import in `src/remotion/studio/**` resolves to a file inside `src/remotion/studio/**` or `src/manifest/**`; `nx-video:brand` is the only non-package bare specifier allowed
  - type: `tsc --noEmit` over the generated e2e studio, which imports `NxVideoCompositions` and therefore every library file, including `EndCard` and `TerminalPlayer`
  - real render: the release smoke (AC2; Component 19) renders the selfshot `Outro` composition, which mounts `EndCard`
- Files: CREATE `packages/nx-video/src/remotion/studio/**` (the 64 moved library files listed in the mapping, plus `fonts.ts`, `lib/qrcode.mjs`, `NxVideoCompositions.tsx`, `brand.ts` (types + `defineBrand`), `index.ts`), `tools/guards/library-imports.mjs`.
- Assumption A1: Remotion 4.0.484's bundler resolves the package's compiled output (tsc `jsx: react-jsx`, CJS or ESM) and honours a webpack `resolve.alias` for `nx-video:brand`. Check it first in 005 with a spike: `npm pack`, install into a scratch Nx workspace, run `remotion compositions`. If CJS fails, build `./remotion` as ESM with a second tsconfig. If the alias fails, fall back to a React `BrandProvider` plus a `useBrand()` hook (22 files change from `THEME` to a hook). Either fallback is internal and keeps the public contract.

### 6. Remotion pipeline scripts and executors

- Purpose: narrate, caption, render, selfshot, master, outro, QR, TUI frames and kit export, using the moved scripts.
- Script port rules (apply to every file under `src/remotion/scripts/**`):
  1. `paths.mjs` derives roots from env, not from its own location: `NX_VIDEO_WORKSPACE_ROOT`, `NX_VIDEO_APP_ROOT`, `NX_VIDEO_RECORDINGS_ROOT` (replacing `S:scripts/paths.mjs:21-32`). `WHISPER_DIR` stays `<app>/.whisper` and `loadStudioEnv()` stays `<app>/.env` (`:36,47-48`). A missing env var throws "run this through `nx run <studio>:<target>`".
  2. Every `remotion render`/`studio` call resolves `@remotion/cli`'s JS entry from the app root and runs it with `process.execPath`, `shell:false`. This replaces `S:scripts/selfshot-render.mjs:240`, `S:scripts/render-outro.mjs:80-91` and any other `npx remotion`. The helper is `scripts/lib/remotion-cli.mjs` (Remotion zone, not shared). It resolves `@remotion/cli/package.json` from the app root at run time and reads its `bin` field (string, or the `remotion` key of an object). No entry path is hard-coded, so A5 is resolved by design. If `bin` is missing or the file does not exist, it fails with "`@remotion/cli` <version> has no runnable bin entry; run `nx g @hive-academy/nx-video:init`". A unit test feeds both `bin` shapes and the missing case.
  3. Ptah identifiers go: `PTAH_TTS_ENGINE` → `NX_VIDEO_TTS_ENGINE`, `PTAH_ELEVENLABS_VOICE_ID` → `NX_VIDEO_ELEVENLABS_VOICE_ID` (`narrate.mjs:13-18`), and `'ptah-electron-e2e'` paths (`narrate.mjs:67`) become `NX_VIDEO_RECORDINGS_ROOT`. `text-normalization.json` ships generic entries only. A user file `<app>/text-normalization.json` is merged over it when present (`tts.mjs:119` describes the pronunciation map).
  4. The CLI `parseArgs` stays. Executors pass flags; scripts do not read `nx` options directly.
- Executors. All run `runNode(<pkg>/src/remotion/scripts/<x>.mjs, flags, { cwd: projectRoot, env: NX_VIDEO_* })` and map a non-zero exit to `{success:false}`:

| Executor | Script | Options (type, default) | Reads | Writes | Cache |
|---|---|---|---|---|---|
| `studio` | `@remotion/cli` `studio src/Root.tsx` | `port` (number, optional), `entry` (`src/Root.tsx`) | app `src/**` | — | no (continuous) |
| `narrate` | `narrate.mjs` | `scene` (string, required), `engine` (`kokoro`\|`elevenlabs`, `kokoro`), `voice` (string), `speed` (number, 1), `model` (string), `source` (`script`\|`beats`, `script`), `force` (bool, false), `stability` (0.4), `similarity` (0.75), `style` (0.2) | `<rec>/<scene>/beats.json`, scene script json, `.env` | `<rec>/<scene>/wav/*.wav`, `durations.json` | yes |
| `caption` | `caption.mjs` | `scene` (required), `model` (`base.en`), `force` (false) | `<rec>/<scene>/wav/*.wav` | `<rec>/<scene>/` word timings; `<app>/.whisper` cache | yes |
| `render` | `render-all.mjs` | `scene` (string, optional = all with beats), `concurrency` (number), `outRes` (`native`\|`1080p`\|`1440p`\|`4k`, `native`), `music` (path, optional), `recordingsDir` (`dist/video/recordings`) | recordings, narration, captions, `src/**`, `brand.config.ts` | `<rec>/<scene>/out/*.mp4` | yes (D8) |
| `selfshot` | `selfshot-transcribe.mjs`, `selfshot-draft-beats.mjs`, `selfshot-narrate.mjs`, `selfshot-render.mjs` | `slug` (required), `step` (`transcribe`\|`draft`\|`narrate`\|`render`\|`all`, `all`), `format` (`16x9`\|`9x16`\|`both`, `16x9`), `range` (string), `concurrency` (number), `model` (`base.en`), `input` (path), `force` (false), `smokeMedia` (bool, false) | `selfshot/<slug>/**` | `selfshot/<slug>/{words.json,beats.json}`, `out/<slug>-<fmt>.mp4` | no |
| `master` | `master.mjs` | `check` (false), `all` (false), `scene`, `file`, `force` (false), `target` (-14), `peak` (-1.5) | rendered mp4 | remastered mp4 next to source | no (in-place) |
| `outro` | `render-outro.mjs` | `fps` (number > 0, **required**: the inventory notes it must match the edit it is spliced into; source default 30, `:44-45`), `seconds` (number > 0, 8), `format` (`16x9`\|`9x16`\|`both`, `16x9`), `headline` (string, optional), `slug` (slug, `outro`) | studio bundle (`Outro` → `EndCard` → `BRAND`), optional `assets/sfx/*` | `selfshot/<slug>/out/<slug>-<format>.mp4`, `selfshot/<slug>/render-props.<format>.json`, `selfshot/<slug>/_public/` | no |
| `qr` | `gen-qr.mjs` (imports `studio/lib/qrcode.mjs`) | `url` (string, required, `^https?://`), `out` (path, default `{projectRoot}/qr.svg`), `format` (`svg`\|`ts`, `svg`; `ts` writes `export const QR_URL`, `QR_SVG` like `gen-qr.mjs:60-63` without the Ptah names) | — | the SVG or TS file; prints the ASCII preview (`:28-41`) | yes |
| `tui-frames` | `tui-frames.mjs` (`@xterm/headless` 6.0.0 through `createRequire`, `:32,158`) | `scene` (slug, **required**; the source default `tui-orchestration` is a Ptah scene and is dropped), `fps` (number, 30; must match the composition fps), `speed` (number > 0, 1), `maxIdleMs` (number ≥ 0, 1200) | `<rec>/<scene>/tui.cast` (asciicast v2) | `<rec>/<scene>/tui-frames.json` = `{ scene, cols, rows, fps, frameCount, durationMs, frames: ({ g: Row[] } \| { r: number })[] }`, the `TuiFramesData` type that `components/TerminalPlayer.tsx` consumes | yes |
| `export-kit` | `kit-guard` module | `out` (path, `dist/video-showcase-kit`) | the studio, the capture project, `plugins/nx-video` content | kit dir | no |

- The `selfshot` `smokeMedia: true` is only valid with `slug: '_smoke'`. Any other slug fails with "smokeMedia is only for the synthetic _smoke fixture". It runs Component 9 first, then `draft` and `render` from the committed `words.json`. `transcribe` is skipped: synthetic audio has no speech (Assumption A2: `selfshot-draft-beats.mjs` consumes an existing `words.json`; check in 005).
- Failure behaviour (actionable messages):
  - Missing scene → "no beats.json for scene '<s>' under <rec>. Run `nx run <capture-project>:capture --scene=<s>` first."
  - ElevenLabs without `ELEVENLABS_API_KEY` → name the env var and the `.env.example` line. The key is never echoed.
  - `ffmpeg-static` missing → reuse `tts.mjs:52-54`.
  - `tui-frames` without `<rec>/<scene>/tui.cast` → "No cast at <path>. Record an asciicast v2 file there first" (the source message at `:152` names Ptah's `record-tui.mjs`, which stays in Ptah, so the hint is generic). `@xterm/headless` missing → "`@xterm/headless` 6.0.0 is not installed; run `nx g @hive-academy/nx-video:init`".
  - Executor options that the scripts consume as numbers are validated by the JSON schema (`exclusiveMinimum: 0` where the script throws on ≤ 0, `render-outro.mjs:45,47`).
  - Remotion version mismatch → "`@remotion/cli` <found> ≠ pinned 4.0.484. Run `nx g @hive-academy/nx-video:init`." This is checked before the spawn by reading the resolved `package.json`.
- Verification seam:
  - unit: schema→flag mapping per executor (each `outro` and `tui-frames` option maps to the exact source flag: `--fps`, `--seconds`, `--format`, `--headline`, `--slug`; `--scene`, `--fps`, `--speed`, `--max-idle-ms`), `paths.mjs` env resolution, version-mismatch message
  - unit: `tui-frames` over a committed 3-event text fixture `test-fixtures/tui/mini.cast` asserts the JSON shape (`cols`, `rows`, `frameCount`, at least one `g` frame and one `r` back-reference). This runs `@xterm/headless` for real, on the three OSes.
  - e2e: inferred targets present, and `nx run <studio>:render --help`-level dry check (no render)
  - real (required pre-publish gate, Component 19): `selfshot --slug=_smoke --smokeMedia` (AC4), the showcase smoke (AC2) and `outro --fps=30` (EndCard with QR)
- Files: CREATE `packages/nx-video/src/remotion/scripts/**`, `packages/nx-video/src/executors/remotion/<10 above>/{executor.ts,schema.json,schema.d.ts,executor.spec.ts}`, `test-fixtures/tui/mini.cast`.

### 7. `init` and `studio` generators

- `init` (`@hive-academy/nx-video:init`). It runs automatically from every other generator, idempotent.
  - Options:
    - `engines` (array of `remotion`|`hyperframes`, default `['remotion']`)
    - `skipPackageJson` (bool, false)
    - `skipFormat` (bool, false)
    - There is no option that keeps a mismatched engine version (defect 5; hard rule 3).
  - Writes:
    - the root `package.json` devDeps from the versions modules: Remotion family + ffmpeg-static + kokoro-js + zod + react/react-dom + `@xterm/headless` + `@playwright/test` for `remotion`; `hyperframes@0.8.98` + `@hyperframes/shader-transitions@0.8.97` for `hyperframes`
    - version policy per dependency, applied whether the entry sits in `dependencies` or `devDependencies`:
      - engine packages (every `remotion`/`@remotion/*` at exactly `4.0.484`, `hyperframes` at `0.8.98`, `@hyperframes/shader-transitions` at `0.8.97`): always written as the exact pin. A different value, including a range such as `^4.0.484`, is replaced and reported as `updated <pkg> <old> → <pinned>`. Any other `@remotion/*` package already present in the workspace (for example Ptah's `@remotion/three`) is also set to `4.0.484`, because Remotion requires one version across the family.
      - supporting packages written exact (`ffmpeg-static`, `kokoro-js`, `zod`, `react`, `react-dom`, `@xterm/headless`): replaced only when absent or when the existing range does not include the pinned version; otherwise kept and reported as `kept <pkg> <range> (includes <pin>)`.
      - `@playwright/test`: added as `^1.50.0` when absent; an existing version ≥ 1.50 is kept.
    - the migration step for a workspace that wants another engine version is explicit: run `nx g @hive-academy/nx-video:init --dry-run`, read the `updated` lines, then run it for real (or stay on an older plugin release). `doctor` FAILs on any engine mismatch, so a hand edit after `init` is caught.
    - registers `{ "plugin": "@hive-academy/nx-video" }` in `nx.json` `plugins` (no options)
    - appends the media block to root `.gitignore` (Guards G2)
    - adds `namedInputs.nxVideoRemotion` / `nxVideoHyperframes`
  - Returns the `installPackagesTask` callback.
  - Failure: a non-Nx workspace → Nx's own error. An engine dep at another version → overwrite and print `updated <pkg> <old> → <pinned>` (never kept). An existing `package.json` that Nx cannot parse → Nx's JSON error, nothing written.
  - Verification: unit tests for each policy branch, including `^4.0.484` → `4.0.484`, `@remotion/three` aligned, `react ~19.2.0` kept, `react ^18` replaced.
- `studio` (`@hive-academy/nx-video:studio`):
  - Options:
    - `name` (string, required, `^[a-z][a-z0-9-]*$`)
    - `directory` (string, default `apps/<name>`)
    - `productName` (string, default `Acme`)
    - `tagline` (string, default `example.com`)
    - `ctaLabel` (string, default `Get started`)
    - `tags` (string)
    - `capture` (bool, default true: also writes `showcase.config.ts` + `showcase/` for scenes)
    - `launcher` (`browser`|`electron`, `browser`)
    - `baseURL` (string, `http://localhost:4200`)
  - Writes from `files/` (the moved shell rows):
    - `package.json` (`"type":"module"`, no deps)
    - `project.json` (name, tags `nx-video:studio`, **no targets**; inferred)
    - `remotion.config.ts` (alias for `nx-video:brand`)
    - `tsconfig.json`
    - `.env.example` (placeholders only: `ELEVENLABS_API_KEY=` empty, `NX_VIDEO_TTS_ENGINE=kokoro`)
    - `.gitignore`
    - `assets/README.md`, `assets/music/.gitkeep`, `assets/sfx/.gitkeep`
    - `selfshot/README.md` (rewritten smoke steps)
    - `selfshot/_smoke/{beats.json,words.json}` (neutralised)
    - `src/Root.tsx` (thin: `registerRoot(() => <><NxVideoCompositions /></>)` with a marked area for user compositions)
    - `src/brand.config.ts` (`defineBrand({...})` from options, with the neutral `cta` block of Component 5)
    - `preview.props.json` (neutral synthetic manifest so the Studio opens without recordings)
    - `fixtures/showcase/_smoke/{beats.json,shots.json}` (the showcase smoke fixture for AC2)
    - when `capture`: `showcase.config.ts` + `showcase/example.scene.ts` + `showcase/scripts/example.json`
  - Before writing, the generator runs the kit guard's `scanSourceTree` (Component 10) over its own template tree. A non-allowlisted `selfshot/<slug>` or a media file in the shipped templates fails generation (defence in depth; CI catches it first).
- Failure behaviour: the target directory exists and is non-empty → error naming the path (no `--force`; Nx's dry-run shows the diff).
- Verification seam:
  - unit (`createTreeWithEmptyWorkspace`): file list, exact pins, `.gitignore` block, no "Ptah" in output
  - e2e: AC2 file tree + `nx show project` lists `studio narrate caption render selfshot master capture doctor`, then `tsc --noEmit -p <studio>/tsconfig.json` succeeds (no reference to `waitlist-qr`, `concept/` or any excluded module)
  - real render: the release smoke (Component 19)
- Files: CREATE `packages/nx-video/src/generators/{init,studio}/{generator.ts,schema.json,schema.d.ts,generator.spec.ts,files/**}`.

### 8. `scene` generator

- Options:
  - `name` (string, required, slug)
  - `project` (string, required, a studio with `capture`)
  - `title` (string, default title-cased name)
  - `launcher` (inherits the project's setting)
- Writes `<projectRoot>/showcase/<name>.scene.ts`. The scene uses `createShowcaseTest` and `Director` from `@hive-academy/nx-video/capture`, with one example beat. It also writes `<projectRoot>/showcase/scripts/<name>.json` (narration script skeleton matching what `narrate --source script` reads; `narrate.mjs:82` names the sources).
- Failure: missing `showcase.config.ts` → "project <p> has no capture setup. Run `nx g @hive-academy/nx-video:studio --capture` or add showcase.config.ts". An existing scene → error.
- Verification seam: unit file test. In e2e, `tsc --noEmit` over the generated scene.
- Files: CREATE `packages/nx-video/src/generators/scene/**`.

### 9. Synthetic smoke media (`src/remotion/smoke`)

- Purpose: replace the not-safe `_smoke` media (R1) without committing media.
- Responsibilities: with `ffmpeg-static`, write three files, all gitignored by G2:
  - `selfshot/_smoke/camera.mp4`: `testsrc2=size=1280x720:rate=30`, 4 s, libx264 yuv420p
  - `selfshot/_smoke/screen.mp4`: `smptehdbars=size=1920x1080:rate=30`, 4 s
  - `selfshot/_smoke/audio.wav`: `sine=frequency=440:duration=8` at -20 dB
  - and `<rec>/_smoke/raw.mp4` (`testsrc2`, 6 s) for the showcase smoke

  Lavfi only. No `drawtext`, so no fontconfig dependency.
- Failure: ffmpeg exits non-zero → stderr tail + "ffmpeg-static could not synthesise smoke media".
- Verification seam: a unit test that runs it in a temp dir on all three OSes (small: well under 1 s each) and asserts files exist and are > 0 bytes. The test then deletes them.
- Files: CREATE `packages/nx-video/src/remotion/smoke/{synthesize.ts,synthesize.spec.ts}`.

### 10. Kit guard (ported `export-kit` guard)

- Purpose: a private recording can never leave a studio (hard rule 1).
- Responsibilities: port these unchanged into `src/remotion/kit-guard/guard.mjs`:
  - `SELFSHOT_KIT_SLUGS = new Set(['_smoke'])`
  - `MEDIA_EXT`
  - `EXCLUDE`
  - `selfshotSlug`, `matchesExcludedFragment`, `shouldCopy`, `findLeakedIngest`
  - the delete-and-throw behaviour

  Source: `S:scripts/export-kit.mjs:36-45,63,66,78-137,254-262`. The only change: `APP_ROOT`/`STUDIO_APP` become parameters.

  Exports: `shouldCopy(src, appRoot)`, `findLeakedIngest(outDir, studioRel)`, `assertNoLeak(outDir, studioRel)` (the production filter and the post-copy alarm, unchanged), plus one new function:

  - `scanSourceTree(root, { exclude })`: walks a source tree without copying it. It returns every directory `…/selfshot/<slug>/` whose slug is not in `SELFSHOT_KIT_SLUGS`, and every file with a `MEDIA_EXT` extension anywhere under a `selfshot/` directory (the same two conditions `findLeakedIngest` applies to a copied tree, `export-kit.mjs:117-137`, applied to the source). It skips `node_modules`, `dist` and the paths in `exclude`. With `{ tracked: true }` it walks only `git ls-files` output (spawned with an argument array), so ignored local recordings in a user's checkout do not trip it.

  The two checks answer different questions. `scanSourceTree` asks "does a private slug exist where it must never be (this repository, the shipped templates)?". The filter plus `assertNoLeak` asks "did a private slug get through an export?". `shouldCopy` removes a private slug, so running the alarm after the filter on a tree with a private slug can never fail. That is why the first draft's AC6 fixture could not fail (defect 1).
- Consumers:
  - `export-kit` executor
  - `studio` generator self-check
  - `tools/guards/leak-guard.mjs` (CI, AC6)
  - `tools/guards/pack-check.mjs` (pre-publish)
- Failure behaviour: the same message as `export-kit.mjs:257-261`, with the fix path rewritten to "add the slug to SELFSHOT_KIT_SLUGS in @hive-academy/nx-video (requires a reviewed PR)".
- Verification seam: unit tests copied from the behaviour:
  - (a) a non-allowlisted slug is skipped
  - (b) a loose `.mp4` in `selfshot/` is flagged
  - (c) a planted leak after the copy deletes the output and throws
  - (d) `_smoke` passes
  - (e) `scanSourceTree` flags `selfshot/private-demo/` (a directory with a text file), flags a loose `selfshot/x.mp4` created at test time in a temp dir (never committed), passes `selfshot/_smoke/` and passes `selfshot/README.md`

  Plus the two AC6 CI fixtures (G3).
- Files: CREATE `packages/nx-video/src/remotion/kit-guard/{guard.mjs,guard.d.ts,guard.spec.ts}`.

### 11. Guards and CI scripts

- G1 no-media (`tools/guards/no-media.mjs`): `git ls-files` (spawned with an argument array) must contain no file with an extension in `MEDIA_EXT ∪ {.glb, .gltf}` (hard rule 1 names `.mp4`, `.webm`, `.wav`, `.mp3`; the rest come from `export-kit.mjs:66`). Images (`.png`, `.jpg`, `.svg`) are allowed only under `docs/images/`. A tracked file over 1 MB fails unless its path is listed in `tools/guards/large-files.allow` (one path per line, each with a reason comment, changed only by a reviewed PR). The size rule is a lane-introduced default (see "Lane-introduced constraints"); the allowlist keeps legitimate non-media assets (for example a font or a lockfile) possible. Runs in CI and as a `lint` dependency.
- G2 `.gitignore` media rules, in the repo root and in every generated `.gitignore` (studio, hyperframes-project, editor), plus `init`'s root block:
  ```
  *.mp4
  *.webm
  *.mov
  *.mkv
  *.m4v
  *.wav
  *.mp3
  *.m4a
  video-output/
  dist/video/
  **/.whisper/
  **/selfshot/*/
  !**/selfshot/_smoke/
  **/selfshot/_smoke/*.mp4
  **/selfshot/_smoke/*.wav
  .env
  **/vendor/davinci-resolve-mcp/
  ```
- G3 leak guard (AC6). `tools/guards/leak-guard.mjs` has two modes, and task 010 must ship **both failure modes as required CI checks**:
  - **G3a source-tree rule** — `leak-guard.mjs source <root> [--tracked]` runs `scanSourceTree`. CI runs:
    - `source . --tracked` on this repository (it covers `packages/**/files/**`, `plugins/**` and everything else tracked), excluding only `test-fixtures/guards/**` → must pass
    - `source test-fixtures/guards/leak-slug` (a studio tree with `selfshot/private-demo/notes.md`, text only) → **must exit non-zero**. The CI step inverts the exit code and fails if the fixture passes.
  - **G3b post-copy alarm** — `leak-guard.mjs alarm-self-test` proves the smoke detector still fires. It copies `test-fixtures/guards/clean-studio/` (allowlisted `_smoke` only) with `shouldCopy` into a temp dir, then **plants** `selfshot/private-demo/notes.md` and a zero-byte `selfshot/loose.mp4` in the output (created at run time in the temp dir, never committed), runs `assertNoLeak`, and exits 0 only if `assertNoLeak` threw the ported message **and** the output dir no longer exists. Any other outcome exits non-zero. A second run without planting must pass and leave the output in place.
  - The export path keeps the production filter and alarm unchanged (`export-kit` executor → `shouldCopy` then `assertNoLeak`).
- G4 layout-attribute rule (AC9): `src/hyperframes/layout-attrs/scan.ts` finds `data-layout-ignore` and `data-layout-allow-[a-z-]+` in `*.html`, `*.tpl`, `*.js` under a root, skipping `node_modules`, `dist` and `video-output`. It is used by:
  - (a) `tools/guards/layout-attrs.mjs`, which scans every generator `files/**` and `plugins/**` and must pass
  - (b) a CI test asserting that `test-fixtures/guards/layout-ignore/` and `layout-allow/` **fail**
  - (c) the `check` executor (Component 14)
- G5 pack check (`tools/guards/pack-check.mjs`): `npm pack --dry-run --json` for both packages. It fails when any of these appears:
  - a media extension
  - a `selfshot/<slug>/` other than `_smoke`
  - `.env`
  - a `vendor/` dir
  - `/ptah|dyad|xirp|spotify/i` in a text file, plus the kit-runtime identifiers `/data-ptah-part|ptahKit|ptahToolIcon|PU_ICONS|mcp__ptah__|\bpu-[a-z-]+\b/` and `waitlist-qr` (allowlist: `NOTICE`, `README.md` "Origin" line, and the `Source: Hive-Academy/ptah-extension@…` header comments)

  It runs in CI and again in `release.yml` before `nx release publish`.
- Verification seam: each guard has a fixture-driven test (pass and fail). AC6 has two fail paths (G3a source fixture, G3b planted leak) and AC9 has the layout fixtures. The guard scripts' own tests assert that the expected-fail fixtures really fail, so a guard that silently passes everything is caught.
- Files: CREATE `tools/guards/*.mjs`, `tools/guards/large-files.allow`, `test-fixtures/guards/**`, `packages/nx-video/src/hyperframes/layout-attrs/**`, root `.gitignore` (MODIFY: extend the existing file).

### 12. Claude plugin marketplace

- Purpose: install the video skill and the `video-director` agent in Claude Code (AC5). MCP configuration is not part of the marketplace (user decision row 15; see below).
- Responsibilities:
  - `plugins/nx-video/.claude-plugin/plugin.json` (from the bundled `ptah-video` `plugin.json`, renamed `nx-video`)
  - `plugins/nx-video/skills/video-showcase/{SKILL.md,reference/*.md}`: canonical source `.claude/skills/video-showcase/**`. The bundled duplicate under `apps/ptah-extension-vscode/assets/plugins/ptah-video/skills/**` is the packaging reference only (inventory decision "Marketplace deduplication").
  - `plugins/nx-video/agents/video-director.md`
  - `.claude-plugin/marketplace.json` listing the plugin at `./plugins/nx-video`

  Neutralisation:
  - Ptah paths become `nx g`/`nx run` commands
  - `@ptah-extension/showcase-manifest` becomes `@hive-academy/nx-video/manifest`
  - `ELEVENLABS_API_KEY=sk_…` stays a placeholder (research Q1)
  - the skill documents both engines and which workflow uses which (decisions.md constraint)
- MCP servers — **user-approved scope** (task `decisions.md` row 15, 2026-10-26): the marketplace ships skills and agents only, with **no** `mcpServers` key on the plugin entry. The `davinci-resolve` server is configured per machine by the `editor` generator in the workspace `.mcp.json` (Component 16, later minor release), because its command and env paths are machine-specific (`c032b0f1e:tools/video-editor/CLAUDE.md:24-29`, O3). This changes the `docs/decisions.md` "Marketplace" row ("with the skills, the agents and the MCP servers"); the wording change is listed under "Doc updates on approval". It is not a removal: the source plugin has no MCP server today (the bundled `apps/ptah-extension-vscode/assets/plugins/ptah-video/.claude-plugin/plugin.json` at `e0ca51e6e` has no `mcpServers`, and Ptah tracks no root `.mcp.json`).
- Manifest contents (verified against the transcribed schema):
  - `.claude-plugin/marketplace.json`: `{ "name": "nx-video", "owner": { "name": "Hive Academy" }, "plugins": [ { "name": "nx-video", "source": "./plugins/nx-video", "description": "…", "version": "<package version>" } ] }`. `name` matches `SafePathToken` (`[a-zA-Z0-9_.-]`, not `.`/`..`); `source` is repo-relative with no `..` (`RepoRelativePath`, schema `:37-50`).
  - `plugins/nx-video/.claude-plugin/plugin.json`: `{ name, description, version }` (`PluginMetadataSchema` is passthrough, `:105-110`).
  - `version` in both files is kept equal to the npm package version by `nx release` (a `version` hook updates both JSON files; Assumption A16: confirm the `nx release` `version.generatorOptions`/`preVersionCommand` hook name in 013, fallback is a CI check that fails when the three versions differ).
- Verification seam:
  - `tools/marketplace/validate.mjs` validates `marketplace.json` and each `plugin.json` against `tools/marketplace/ptah-marketplace.schema.json`. That schema is transcribed (not copied) from Ptah `libs/backend/plugin-marketplace/src/lib/registry/marketplace-manifest.schema.ts:27-110` at `e0ca51e6e` (zod → JSON Schema: `SafePathToken` and `RepoRelativePath` become `pattern` plus a `not` for `.`/`..`, `..` segments, leading `/`, drive letters and schemes), with that reference in its `$comment`. Its own tests include fail fixtures for each refinement. Required in CI on all three OSes.
  - Claude Code proof (A8 resolved: subcommands verified on Claude Code 2.1.310, see Codebase evidence): in a scratch dir, `claude plugin validate ./`, `claude plugin marketplace add ./`, `claude plugin install nx-video@nx-video`, then confirm the skill and agent are listed (`claude plugin details nx-video`). This is a recorded manual step in 011 and a required item in the 013 release checklist, because CI runners do not carry an authenticated Claude Code. Fallback when the CLI changes: `validate.mjs` remains the CI gate, and the manual step records the CLI version it ran on.
- Failure: a validation error lists the JSON pointer and the schema rule.
- Files: CREATE `plugins/nx-video/**`, `.claude-plugin/marketplace.json`, `tools/marketplace/**`.

### 13. HyperFrames generators: `hyperframes-project`, `frame`, `kit`, `kit-component`, `promo`

- `hyperframes-project`:
  - Options:
    - `name` (required, slug)
    - `directory` (default `video/<name>`)
    - `aspect` (`16x9`|`9x16`|`1x1`, `16x9`)
    - `kits` (string array, default `[]`)
    - `tags`
  - Writes:
    - `hyperframes.json` (shape of `HF:projects/agent-lanes-v3/hyperframes.json:1-12`, `authoringSkill: "general-video"`)
    - `package.json` (`private`, `type: module`, scripts `dev`/`check`/`render` = `npx --yes hyperframes@0.8.98 …` exactly as `HF:projects/agent-lanes-v3/package.json:5-10`, versions from constants)
    - `meta.json` (`id`, `name`, `createdAt`)
    - `src/index.tpl` (neutral, from the identical `index.tpl` rows). It keeps all seven markers the assembler replaces (`/*@frames-css*/`, `<!--@frames-->`, `/*@scenes*/`, `/*@transitions*/`, `/*@frames-js*/`, `@MUSIC_POINTS`, `@DURATION`; `assemble.mjs:91-99`), the pinned GSAP and `@hyperframes/shader-transitions@0.8.97` CDN scripts with their SRI hashes (`index.tpl:8-9`; a literal in generated `files/**`, which the version-literal rule exempts), and `data-width`/`data-height` on `#root` from the `aspect` option (`index.tpl:40` hard-codes 1920×1080). The source music line `<audio id="music" src="assets/music/mixkit-uplifting-bass.mp3" …>` (`index.tpl:46-47`) is third-party audio and is replaced by a commented example that points at `assets/music/README.md`; the assembler's `@MUSIC_POINTS` replacement is then a no-op, which `assemble.mjs:97` tolerates.
    - `compositions/frames/.gitkeep`
    - `BRIEF.md` and `STORYBOARD.md` templates
    - `README.md` (from `HF:README.md`, neutralised)
    - `.gitignore` (from `HF:.gitignore` + G2)
    - `project.json` (tags `nx-video:hyperframes`, no targets)
  - Runs `init --engines=hyperframes`.
- `frame`:
  - Options: `project` (required), `name` (required, slug), `index` (number 1–99, optional = next free `NN`), `duration` (number seconds > 0, default 4), `seam` (string, default `cut`; otherwise `"<shader> <seconds>"`, used only when the frame is not the first).
  - Writes `compositions/frames/NN-<name>.html` with exactly the shape `assemble.mjs:9-12,29-56` requires:
    ```html
    <template>
      <style>
        #fNN .title { /* frame CSS; every selector is prefixed with #fNN */ }
      </style>
      <div id="fNN" class="scene" data-composition-id="fNN"
           data-width="<W>" data-height="<H>"
           data-frame-start="<S>" data-frame-duration="<D>"
           [data-seam-in="<seam>"]>
        <h1 class="title clip" data-start="0" data-duration="<D>">Frame NN</h1>
      </div>
      <script>
        /* runs as (function (tl, T0) { … }) on the main timeline; positions are T0 + local */
      </script>
    </template>
    ```
    - `NN` is the two-digit index; `id` and `data-composition-id` are both `fNN` (`:47`).
    - `<W>×<H>` come from the project's `aspect` (16x9 → 1920×1080, 9x16 → 1080×1920, 1x1 → 1080×1080), read from `hyperframes.json` or `meta.json`.
    - `<S>` is the previous frame's `data-frame-start + data-frame-duration` (read from the existing frames in `NN` order), or `0` for the first frame. This satisfies the contiguity rule (`:58-60`).
    - `data-seam-in` is written for every frame except the first (`:61`). The default `cut` needs no shader name, so the generated frame does not depend on an unverified shader id.
    - Every `data-start` is immediately followed by `data-duration` (`:77-78`).
    - Inserting a frame in the middle (`index` lower than the last) is refused with "frame NN would break contiguity; append, or renumber the following frames". The generator never rewrites existing frames.
  - Also writes `NN-<name>.motion.json` (`appearsBy`, `before`, `keepsMoving`, per `HF:PLAYBOOK.md:55`).
  - Failure: `NN` taken → error; no project `hyperframes.json` → error naming the path.
- `kit`:
  - Options: `name` (required), `directory` (default `video/kits/<name>`).
  - Writes `src/partials/runtime.js` (the moved `runtime.js`, neutralised as below), `src/partials/.gitkeep`, `src/.gitkeep`, `README.md`, `project.json` (tag `nx-video:kit`) and a `kit.json` marker, which is the createNodes trigger for `kit-build`.
  - Runtime neutralisation (defect 9), each item a behaviour decision, not a rename only:

    | Source (`runtime.js`) | Generated runtime |
    |---|---|
    | header comment "ptah-ui kit runtime … (SPEC section 2/3)" (`:1-3`) | "nx-video kit runtime" plus the same rules written out in full (one paused timeline, `fromTo` with explicit endpoints, no CSS transitions, no `Date.now`/`Math.random`, finite repeats, px from `--u`). No reference to Ptah's SPEC. |
    | factory `ptahKit(root, cfg)` (`:4`) | `kitRuntime(root, cfg)`. Same `cfg` (`dw`, `dh`, `id`, `duration`) and same return object. The `kit-component` template calls `kitRuntime`. |
    | `focus()` selects `[data-ptah-part]` (`:197-226`) | selects `[data-kit-part]` by default; `cfg.partAttr` overrides the attribute name. Behaviour (ring, dim others, `focusFromVars`) unchanged. |
    | `ptahToolIcon(tool)` (`:291-304`) with Claude tool-name branches and a `/^mcp__ptah__/` branch, and a comment citing Ptah's `tool-icon.component.ts` | removed from the runtime. Replaced by `K.toolIcon(tool, rules)`, where `rules` is an array of `{ match: RegExp \| string, icon, color }` evaluated in order, with the fallback `{ icon: 'terminal', color: '#8e8887' }` (`:303`). The runtime ships **no** default rules. The `kit-component` README shows how to declare rules in a component. |
    | `pu-badge`, `pu-code`, `pu-ring`, `pu-vignette`, `pu-ico` classes and `PU_ICONS` (`:117,148,212,233,254,263`) | `kit-badge`, `kit-code`, `kit-ring`, `kit-vignette`, `kit-ico`, `KIT_ICONS` (every `pu-` class the runtime emits; the `\bpu-` assertion below enforces it). The icon paths (lucide-style, `:263-289`) stay; they are generic shapes. |
    | `window.__timelines[cfg.id]` registration, `preroll`, `exit` (`:235-250`) | unchanged (HyperFrames runtime contract) |

    Ptah keeps its own `kits/ptah-ui/src/partials/runtime.js` (Ptah-side step 6), so no Ptah component changes.
- `kit-component`: Options `kit` (required), `name` (required). Writes `src/<name>.html` with `/*@include runtime*/` and a mount that calls `kitRuntime(root, { dw, dh, id: '<kit>-<name>' })`.
- `promo` (series preset, from decisions.md 2026-10-01): Options `name` (required), `episodes` (number, 1). It composes `hyperframes-project` once per episode and writes a series-level `PLAYBOOK.md` (from `HF:PLAYBOOK.md`, neutralised and rewritten for G4, see D9).
- Failure behaviour: Nx schema validation, plus "directory exists".
- Verification seam:
  - unit tree tests
  - unit (AC8 contract, defect 4): generate a project and three frames in a `Tree`, write them to a temp dir, run the in-process `assemble` port over it, and assert: no throw; `index.html` contains no leftover marker (`/*@`, `<!--@`, `@DURATION`); `@DURATION` equals the sum of frame durations; the three scene ids appear in `scenes: [...]`; frame-local `data-start` values are offset by each frame's start. Negative cases: a frame without `data-seam-in` after the first, a gap between frames and a missing `<template>` each fail with the ported message.
  - unit (kit, defect 9): generate a kit and one `kit-component`, run the in-process `kit-build` port, and assert the built `components/<name>.html` contains `kitRuntime(`, no leftover `/*@include`, and no match for `/ptah|data-ptah-part|PU_ICONS|\bpu-|mcp__ptah__/i`. A jsdom test evaluates the generated runtime with a GSAP stub and asserts `K.focus` uses `[data-kit-part]` and `K.toolIcon('mcp__x__y', [])` returns the fallback.
  - the pack check (G5) applies the same branded-string patterns to the published tarball.
  - e2e (AC8 minus render): `hyperframes-project` + `frame` ×2 + `assemble` + `check` gives 0 errors. This needs network access to npm for `hyperframes@0.8.98` and runs in CI (Assumption A9: `hyperframes check` runs headless without Chromium download on CI runners; verify in 009. If it needs a browser, run `check` in the e2e job only on ubuntu and keep the file-tree assertions on all OSes).
- Files: CREATE `packages/nx-video/src/generators/{hyperframes-project,frame,kit,kit-component,promo}/**`.

### 14. HyperFrames executors

All of them run in the HyperFrames zone and use `runPinnedNpx` with constants from `src/hyperframes/versions.ts`. There is no free-form version option. The first release uses `HYPERFRAMES_PROJECT` only. Task 008 (editor, later minor) adds the optional option `channel` (`project`|`editor`, default `project`) that selects `HYPERFRAMES_EDITOR`; adding an optional option with the old behaviour as default is a non-breaking minor change.

| Executor | Behaviour (source) | Options | Reads | Writes | Cache |
|---|---|---|---|---|---|
| `assemble` | In-process port of `assemble.mjs` (`:1-101`): frames `^\d\d-.+\.html$` sorted, the `data-start`→`data-duration` rule, the SFX `data-audio-group` rewrite (`:73`), `<!--@frames-->` replacement (`:94`), kit components copied as `<kit>-<file>.html` into `compositions/components/` (replaces `:22-26`) | `kits` (string[] of kit project roots, default `[]`), `template` (`src/index.tpl`) | `src/index.tpl`, `compositions/frames/*.html`, kit `components/*.html` | `index.html`, `compositions/components/<kit>-*.html` | yes |
| `kit-build` | In-process port of `build.mjs:1-28`: expand `/*@include name*/` from `src/partials/`, fail on a leftover include, optional gallery copy | `gallery` (path, optional), `prefix` (default kit name) | `src/*.html`, `src/partials/*` | `components/*.html` | yes |
| `check` | (1) layout-attribute scan (G4) over the project root, fail fast on a hit unless `allowLayoutOverrides`; (2) `hyperframes@<pin> check` in the project dir | `allowLayoutOverrides` (bool, false) | project html/css/js/json | — (terminal output) | yes |
| `snapshot` | `hyperframes@<pin> snapshot …` (Assumption A10: subcommand exists in 0.8.98; `HF:PLAYBOOK.md:62` lists snapshot as a CLI capability) | `at` (string[] of times), `out` (default `{projectRoot}/snapshots`) | project | png stills (gitignored) | no |
| `preview` | `hyperframes@<pin> preview` (`HF:README.md:36`) | `background` (bool, false) | project | — | no (continuous) |
| `hyperframes-render` | Port of `render.mjs`: name is one plain segment (`:23`); output `mainCheckoutRoot()/video-output/<project>/<name>[-4k].mp4` (`:29,63-65`); `--quality draft\|delivery`, `--resolution 4k` (`:67-68`); extra args after the options | `name` (required, `^[A-Za-z0-9._-]+$`), `fourK` (false), `draft` (false), `extraArgs` (string[]); `channel` from 008 | project | `video-output/<project>/<name>.mp4` | no (D8) |

- `assemble` and `check` are wired by createNodes with `dependsOn`: `check` depends on `assemble`, `hyperframes-render` depends on `assemble`, and `assemble` depends on each listed kit's `kit-build`.
- Failure behaviour:
  - Kit not built → "kit <k> has no components/. Run `nx run <k>:kit-build`" (replaces `assemble.mjs:23`).
  - Frame rule violation → the file name plus the rule (`:34,47-48,58-61,78`).
  - No frame under `compositions/frames/` → "no frames in <dir>; run `nx g @hive-academy/nx-video:frame`" (the source would crash on `frames[frames.length - 1]` at `:85`).
  - Layout attribute → `file:line` list plus "remove the attribute; fix the overlap instead (see PLAYBOOK §Quality)".
  - `check` exits non-zero → `success:false`.
  - Bad render name → schema error.
- Verification seam: the unit tests port fixtures for the assemble rules and the include expansion. The e2e test (AC8 path) covers the rest. A real render runs only in `render-smoke.yml`.
- Files: CREATE `packages/nx-video/src/hyperframes/{assemble,kit-build,render,check,layout-attrs}/**`, `packages/nx-video/src/executors/hyperframes/<6>/**`.

### 15. `doctor` executor

- Purpose: turn the machine facts into checks with fix messages (AC3).
- Options:
  - `scope` (array of `remotion`|`hyperframes`, default inferred from the project tags `nx-video:studio`/`nx-video:hyperframes`). Task 008 adds the `editor` scope value and the `editor` rows below in the later minor release; the first release ships the `all`, `remotion` and `hyperframes` rows only.
  - `json` (bool, false)
- Checks. FAIL makes the exit non-zero; WARN does not:

| Scope | Check | Level | Fix message |
|---|---|---|---|
| all | Node ≥ 22.9 (`export-kit.mjs:24`) | FAIL | install Node 22.9+ (24 LTS recommended) |
| all | npx-cli.js resolvable (Component 1) | FAIL | reinstall npm or set `NX_VIDEO_NPX_CLI` |
| all | Windows + `MSYSTEM` set (Git Bash) | WARN | "executors are safe; do not run raw `npx hyperframes` from Git Bash" (`c032b0f1e:tools/video-editor/CLAUDE.md:21-22`) |
| remotion | each Remotion package resolves at exactly 4.0.484 | FAIL | `nx g @hive-academy/nx-video:init` |
| remotion | `ffmpeg-static` binary exists (`tts.mjs:50-54`) | FAIL | `npm rebuild ffmpeg-static` |
| remotion | `kokoro-js` resolves | FAIL | `init` |
| remotion | `@xterm/headless` resolves at 6.0.0 (when the project has a `tui.cast` under its recordings or runs `tui-frames`) | FAIL | `init` |
| remotion | `sharp` resolves | WARN | "`render` skips the device-frame crop probe without sharp (`render-all.mjs:403-418`)" |
| remotion | `remotion.config.ts` has the `nx-video:brand` alias | FAIL | the exact line to add |
| remotion | `@playwright/test` resolves and a Chromium is installed (when `showcase.config.ts` exists) | FAIL | `npx playwright install chromium` |
| remotion | `<app>/.whisper` model present | WARN | "first `caption` downloads it" |
| remotion | `ELEVENLABS_API_KEY` when `NX_VIDEO_TTS_ENGINE=elevenlabs` | FAIL | set it in `<app>/.env` (never printed) |
| hyperframes | `hyperframes` resolves at 0.8.98 locally | FAIL | `init --engines=hyperframes` |
| hyperframes | `@hyperframes/shader-transitions` at 0.8.97 | FAIL | same |
| editor | Python ≥ 3.11 on PATH (Assumption A11: minimum from upstream `pyproject`; confirm in 008) | FAIL | install link |
| editor | `uv` on PATH | FAIL | install uv; "on Windows open a new shell after winget" |
| editor | system `ffmpeg` on PATH | FAIL | install ffmpeg |
| editor | DaVinci Resolve installed (default install paths per OS) | FAIL | install Resolve (free edition works through the bridge) |
| editor | `vendor/davinci-resolve-mcp` at the pinned SHA, and its `venv` | FAIL | `nx g @hive-academy/nx-video:editor --repair` / `uv venv && uv pip install -e .` |
| editor | `.mcp.json` has a `davinci-resolve` entry with the six env keys | FAIL | the editor generator |
| editor | bridge config `~/.config/davinci-resolve-mcp/bridge.json` | WARN | "start Workspace > Scripts > resolve_bridge in Resolve each session" |

- Output: one line per check, `PASS|WARN|FAIL  <check>  <fix>`, then a summary. `json: true` prints an array instead. Not cached.
- Failure behaviour: a check that throws is reported as FAIL with its message. Doctor never crashes on one check.
- Verification seam: unit tests with injectable probes (`fs`, `env`, `resolve`, `platform`). In e2e, `nx run <studio>:doctor` in a workspace without kokoro-js exits non-zero and prints the fix (AC3).
- Files: CREATE `packages/nx-video/src/executors/doctor/{executor.ts,checks/*.ts,schema.json,*.spec.ts}`.

### 16. `editor` generator

- Purpose: set up the raw-clip → Resolve timeline → HyperFrames overlay workflow (design source: `c032b0f1e:tools/video-editor/CLAUDE.md`, nothing copied).
- Release: **not in the first release** (user decision row 14). It ships in a later minor release after 013, together with the `channel` option (Component 14), the editor `doctor` rows (Component 15), the editor constants (Component 2) and the `tar` dependency. It is also the only place the `davinci-resolve` MCP server is configured (user decision row 15).
- Options:
  - `directory` (default `tools/video-editor`)
  - `resolveMcp` (bool, true)
  - `mcpJson` (bool, true)
  - `skipDownload` (bool, false; used by tests)
  - `repair` (bool, false; re-download if the SHA does not match)
- Writes:
  - `<dir>/CLAUDE.md`: freshly written, neutral. Workflow steps, the "never call `timeline apply_cuts`" rule, and target timelines by name (`CLAUDE.md:51-55`). No machine facts.
  - `<dir>/projects/.gitkeep`
  - `<dir>/.gitignore` (G2 + `vendor/`, `venv/`, `projects/*/media/`)
  - `<dir>/project.json`: tag `nx-video:editor`, explicit targets `overlay-render` (`hyperframes-render` with `channel: 'editor'`), `overlay-check` (`check`, `channel: 'editor'`) and `doctor`
  - when `resolveMcp`: downloads `https://codeload.github.com/<repo>/tar.gz/<sha>` (timeout 60 s, 2 retries with exponential backoff; idempotent GET) and extracts with `tar` into `<dir>/vendor/davinci-resolve-mcp/`, writing `<dir>/vendor/.nx-video-pin.json` `{repo, sha, sha256}`
  - when `mcpJson`: merges into the workspace root `.mcp.json`: `mcpServers["davinci-resolve"] = { command: "<dir>/vendor/davinci-resolve-mcp/venv/<bin>/python", args: [<server entry>], env: { RESOLVE_SCRIPT_API, RESOLVE_SCRIPT_LIB, PYTHONPATH, PYTHONHOME: "", DAVINCI_RESOLVE_BRIDGE: "1", PYTHONUTF8: "1" } }`, with per-OS default Resolve paths (Assumption A12: default install paths and the upstream server entry module; confirm in 008)

  It does not create the venv (machine side effect) and prints the `uv` commands instead.
- Failure behaviour:
  - Download failure after retries → error naming the URL, and the generator writes nothing under `vendor/`.
  - When `tarballSha256` is set and does not match → abort.
  - An existing `davinci-resolve` entry → keep it and print a diff hint (no overwrite).
  - `confirmed:false` → print a one-line notice that the upstream remote is unconfirmed.
- Security: no secrets are written. Bridge HMAC config stays user-local. MIT `LICENSE` from upstream stays in the vendor dir, which is gitignored and not redistributed.
- Verification seam:
  - unit: `.mcp.json` merge (new, existing, conflicting); download code with a mocked `fetch` (timeout, retry, extract)
  - e2e: run with `skipDownload` and assert the tree and `.mcp.json`
- Files: CREATE `packages/nx-video/src/generators/editor/**`, `packages/nx-video/src/hyperframes/editor/{download.ts,mcp-json.ts}`.

### 17. `createNodes` inference plugin

- Purpose: wire targets to executors. No logic of its own (hybrid model, research part C decision 2).
- Contract: `export const createNodes: CreateNodes = ['**/{remotion.config.ts,hyperframes.json,kit.json}', (files, options, context) => …]`. Export name `createNodes` only (research decision 3: `createNodesV2` is deprecated in 24.0.1). No plugin options.
  - Verified (A13 resolved): in Nx 24.0.1 `CreateNodes` is `[projectFilePattern, (files, options, context) => CreateNodesResultArray]` (TASK_2026_001 `research-part-c-nx.md:21`, read from the installed `public-api.d.ts:45,96-99`). The callback is batch-style: it receives every matching file at once and returns one `[file, { projects: { [root]: { targets } } }]` entry per file.
  - The callback is synchronous over file reads (`readFileSync` of `hyperframes.json` and a `existsSync` for a sibling `showcase.config.ts`), sorts its outputs, and uses only workspace-relative forward-slash paths (`joinPathFragments`), so the result is deterministic and hashable (`research-part-c-nx.md:25,102`).
  - Peer range check: the same shape must hold for Nx 23 (peer `>=23 <25`). The rename landed in 23 (`research-part-c-nx.md:22`, secondary source). Fallback test: the e2e job runs once on the minimum supported Nx (`23.3.1`, the registry `previous` tag, `research-part-c-nx.md:140`) as well as 24.0.1, and asserts `nx show project <name> --json` lists the inferred targets. If 23 fails, the peer floor is raised to `>=24` before the first publish (a pre-publish change, not a breaking change).
- Inferred targets:
  - `remotion.config.ts` → `studio`, `narrate`, `caption`, `render`, `selfshot`, `master`, `outro`, `qr`, `tui-frames`, `export-kit`, `doctor`, plus `capture` when a sibling `showcase.config.ts` exists. Also an aggregate `video` target (`nx:noop` with `dependsOn: capture → narrate → caption → render`), replacing `S:project.json:47-58`.
  - `hyperframes.json` → `assemble`, `check`, `snapshot`, `preview`, `render` (executor `hyperframes-render`), `doctor`. A sibling `project.json` with explicit targets (the editor) overrides them through Nx's normal merge.
  - `kit.json` → `kit-build`.
- Cache settings per target:
  - `cache: true` for `narrate`, `caption`, `render`, `assemble`, `kit-build`, `check`, `qr`, `tui-frames`
  - `inputs`: project files + `{workspaceRoot}/<recordingsDir>/<scene>/**` where relevant + `{ externalDependencies: [pinned packages] }`
  - `outputs` as listed in the executor tables
- Failure behaviour: a malformed `hyperframes.json` → createNodes skips the file and logs a warning naming it. It never throws, because a throw would break the whole project graph.
- Verification seam: unit test with `createNodes[1](files, undefined, context)` over fixture files (also asserts sorted output and no absolute paths). `typecheck` against the installed `@nx/devkit` fails at compile time if the tuple shape differs. e2e: `nx show project <name> --json` lists the targets on Nx 24.0.1 and 23.3.1.
- Files: CREATE `packages/nx-video/src/plugin/{create-nodes.ts,create-nodes.spec.ts}`, `packages/nx-video/src/index.ts`.

### 18. Preset and `create-nx-video`

- `preset` generator (`--preset=@hive-academy/nx-video`):
  - Options: `name` (workspace name), `studioName` (default `studio`), `hyperframes` (bool, false: also creates `video/promo` with `hyperframes-project`), `productName` (default `Acme`).
  - Runs `init` → `studio` → optionally `hyperframes-project`.
  - Writes the Remotion license notice into the generated root `README.md`.
- `create-nx-video` (`bin/index.ts`): wraps `createWorkspace(\`@hive-academy/nx-video@${version}\`, { ...answers, nxCloud: 'skip', packageManager })`. The plugin version is read from its own `package.json`, because both packages are released with `projectsRelationship: fixed` (research part C). Generated with `@nx/plugin:create-package`.
- Failure: Nx's errors pass through. Unknown flags → yargs error.
- Verification seam: e2e `npx create-nx-video@local <tmp>` against Verdaccio, which asserts the studio tree and pinned deps (no render).
- Files: CREATE `packages/nx-video/src/generators/preset/**`, `packages/create-nx-video/**`.

### 19. CI and release workflows

- `ci.yml` (push and pull_request):
  - matrix `os: [ubuntu-latest, windows-latest, macos-latest]`, `fail-fast: false`, Node 24
  - steps: `npm ci`, `npx nx run-many -t lint test typecheck build`, `node tools/guards/no-media.mjs`, `node tools/guards/leak-guard.mjs source . --tracked` (must pass), `leak-guard.mjs source test-fixtures/guards/leak-slug` (must fail; exit inverted), `leak-guard.mjs alarm-self-test` (must report the planted leak caught), `node tools/guards/library-imports.mjs`, `node tools/guards/layout-attrs.mjs` (pass + expected-fail fixtures), `node tools/guards/pack-check.mjs`, `node tools/marketplace/validate.mjs`, `npx nx run nx-video-e2e:e2e` (starts `local-registry`)
  - Windows: `defaults.run.shell: bash` is allowed for workflow steps (GitHub's Git Bash), because every spawn in our code is shell-free. One e2e test explicitly runs an executor from a Git Bash step to prove rule 5.
- `render-smoke.yml` — the real-render proof. **It is a required pre-publish gate** (user decision row 14), not an optional job:
  - triggers: `workflow_call` (called by `release.yml`), `workflow_dispatch`, and a weekly cron as an early warning. It is not required on every PR because a real render takes minutes and downloads models.
  - runs on ubuntu. It builds the packages, publishes them to Verdaccio and creates a scratch workspace with `create-nx-video` (the published path users take).
  - steps, every one required:
    - pre-check: the packed `@hive-academy/nx-video` tarball contains `src/remotion/studio/lib/qrcode.mjs` (fails before any render if the encoder asset is missing)
    - AC2: `studio` showcase smoke (`render --scene=_smoke` with synthetic `raw.mp4`, Component 9) and `outro --fps=30` (EndCard with QR)
    - AC4: `selfshot --slug=_smoke --smokeMedia`
    - AC8: `hyperframes-project` + `frame` ×2 + `assemble` + `check` + `render` → `video-output/<project>/<name>.mp4`
    - a real `capture` of `test-fixtures/capture/menu.html` (Chromium, no product)
  - each step asserts its MP4 exists and `ffprobe` (from `ffmpeg-static`) reports a duration > 0 and the expected width × height.
  - uploads MP4 artifacts with 3-day retention (never committed).
  - Windows and macOS real renders are not in the gate (lane choice, see "Lane-introduced constraints"): rule 5 is proven by the e2e job's Git Bash executor run on Windows, which spawns the same code paths without rendering. Cost: a render-only Windows regression would surface in the next weekly run or in Ptah, not before publish. The matrix can be widened later without re-approval.
- `release.yml` (workflow_dispatch with an optional `version` input; ubuntu):
  - job `smoke`: `uses: ./.github/workflows/render-smoke.yml` on the release commit.
  - job `publish`: `needs: [smoke]`, plus a check that the `ci.yml` run for the same commit SHA succeeded on all three OSes (queried with `gh api` using the workflow `GITHUB_TOKEN`; the job fails if the run is missing or not green).
  - `permissions: contents: write, id-token: write` (id-token is required for provenance)
  - `actions/setup-node` Node 24 with `registry-url: https://registry.npmjs.org`
  - `npm ci`, `nx run-many -t build`, `node tools/guards/pack-check.mjs`
  - `npx nx release --yes` with `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` and `NPM_CONFIG_PROVENANCE: true` (TASK_2026_001 decision 16; the nx.dev token pattern quoted in part C)
  - prints `npm -v` first
  - release checklist (013 test report): the Claude Code marketplace install proof (Component 12) recorded for the release commit.
- `nx.json` release config:
  - `projects: ["nx-video","create-nx-video"]`, `projectsRelationship: "fixed"`
  - `version.conventionalCommits: true`
  - `changelog.workspaceChangelog: { createRelease: "github" }`
  - `git.commitMessage: "chore(release): {version}"`
- Failure behaviour: any guard exit fails the job. The release aborts before publish when the render smoke fails, when the commit's `ci.yml` run is not green on all three OSes, or when the pack check fails. A partial publish (the first package succeeds, the second fails) is recovered by re-running `nx release publish` (an idempotent skip of already-published versions; Assumption A14, check with `--dry-run` in 013).
- Verification seam: the workflows themselves, a dry run (`nx release --dry-run`) in 013, one full `render-smoke.yml` run on the 013 branch before the first publish, and a branch-protection rule requiring the three matrix jobs.
- Files: CREATE `.github/workflows/{ci.yml,release.yml,render-smoke.yml}`, `nx.json`, root `package.json`, `.verdaccio/config.yml`, `tools/scripts/*`.

## Mapping: inventory groups → layout

Totals (`parity-inventory.md:9-17`): 36 move-generic, 96 move-template, 157 stay-in-ptah, 85 not-safe = 374. stay-in-ptah and not-safe rows are not copied. Every inventory fate is kept as written (the first draft's change of two rows to stay-in-ptah is withdrawn by user decision row 17), so 132 rows move: 36 move-generic and 96 move-template.

| Inventory rows (source glob at `e0ca51e6e`) | Count | Fate | Lands in | Transformation |
|---|---:|---|---|---|
| `apps/ptah-video-studio/scripts/{caption,narrate,render-all,selfshot-*,master,render-outro,gen-qr,tui-frames,paths}.mjs`, `scripts/lib/*.mjs`, `scripts/text-normalization.json`, `scripts/export-kit.mjs` | 20 | move-generic | `packages/nx-video/src/remotion/scripts/**`; export-kit → `src/remotion/kit-guard/` + `export-kit` executor | Script port rules 1–4 (Component 6). One executor each, as tabled. `scripts/lib/qrcode.mjs` lands in `src/remotion/studio/lib/qrcode.mjs` (Component 5). |
| `libs/showcase-manifest/src/**` | 2 | move-generic | `packages/nx-video/src/manifest/` | Types unchanged. Package alias becomes `@hive-academy/nx-video/manifest`. |
| `libs/showcase-manifest/{package.json,project.json,tsconfig.json,tsconfig.lib.json}` | 4 | move-generic | absorbed by `packages/nx-video` build config | Not copied as files (their role is the build). Recorded as accounted. |
| `apps/ptah-electron-e2e/src/showcase/_harness/{director,showcase-fixtures,browser-fixtures,showcase-launcher}.ts` | 4 | move-generic | `packages/nx-video/src/capture/` | Renamed globals. Fixtures merged into `createShowcaseTest`. Electron entry and recordings dir become options. |
| `…/_harness/{prewarm,config-menu}.ts` | 2 | move-generic (user decision row 17) | `packages/nx-video/src/capture/{prewarm,menu-surface}.ts` | Neutralised into `createPrewarm` and `createMenuSurfaces`, which take selectors and options (Component 4). Ptah supplies its selectors in a Ptah-local file. |
| `tools/hyperframes/render.mjs` | 1 | move-generic | `src/hyperframes/render/` + `src/shared/npx-cli.ts` | Pinned spec (`channel` added by 008). |
| `tools/hyperframes/projects/agent-lanes-{v3,chat}/assemble.mjs` | 2 | move-generic | `src/hyperframes/assemble/` (one module; the copies are identical) | Kit path becomes an option. |
| `tools/hyperframes/kits/ptah-ui/build.mjs` | 1 | move-generic | `src/hyperframes/kit-build/` | `ptah-ui-` prefix becomes the kit name. |
| `apps/ptah-video-studio/{.env.example,.gitignore,package.json,project.json,remotion.config.ts,tsconfig.json}`, `assets/{README.md,music/.gitkeep,sfx/.gitkeep}`, `selfshot/{README.md,_smoke/beats.json,_smoke/words.json}`, `src/Root.tsx`, `src/brand.config.ts` | 14 | move-template (shell) | `packages/nx-video/src/generators/studio/files/**` | Neutral branding (`brand.config.ts` gains the neutral `cta` block). Root becomes thin. `project.json` has no targets. `remotion.config.ts` gets the alias; `tsconfig.json` gets the `nx-video:brand` path. `_smoke/beats.json` loses its single Ptah mention. README smoke steps use `smokeMedia`. |
| Studio library, exact list (64 rows): `src/ShowcaseVideo.tsx`, `src/theme.ts`; `src/components/{AmbientOrbs,Backdrop,BodyScene,Callout,DeviceFrame,IntroCard,LowerThird,OutroCard,ProgressBar,PromoSoundDesign,SectionTransition,SoundDesign,TerminalPlayer,Watermark}.tsx` (14); `src/components/effects/{AnimatedGridPattern,BorderBeam,Marquee,Meteors,Particles,ShimmerSweep}.tsx`, `effects/index.ts`, `effects/seeded-random.ts` (8); `src/lib/{load-manifest,shots}.ts` (2); `src/remocn/components/remocn/{blur-out-up,caret,claude-code,focus-pull,glass-code-block,number-wheel,progress-steps,push-through,rolling-number,shader-mesh-gradient,shader-neuro-noise,soft-blur-in,stepper,terminal-simulator,tracking-in,whip-pan}/index.tsx` (16), `remocn/components/remocn/stepper/use-stepper-transition.ts` (1), `src/remocn/lib/remocn-ui/{color,index,motion,theme,timeline,types}.ts` (6); `src/selfshot/{CameraBubble,EndCard,Hybrid,Outro,ScreenDemo,ScreenStage,Shell,TalkingHead,graphics,icons,overlays}.tsx`, `src/selfshot/{constants,manifest,metadata,resolved}.ts` (15) | 64 | move-template (library) | `packages/nx-video/src/remotion/studio/**` (`./remotion` export), same relative paths | Brand via `nx-video:brand` (five importers). Manifest import from `./manifest`. `EndCard` QR from `BRAND.cta` (Component 5). `TerminalPlayer` font from the library `fonts.ts`. No Ptah strings. |
| `tools/hyperframes/{.gitignore,README.md}`, `projects/*/src/index.tpl` (identical pair) | 4 | move-template | `generators/hyperframes-project/files/` | Neutral. One `index.tpl`. |
| `tools/hyperframes/PLAYBOOK.md` | 1 | move-template | `generators/promo/files/PLAYBOOK.md` | Neutral. The §Quality overlap rule is rewritten (D9). |
| `tools/hyperframes/kits/ptah-ui/src/partials/runtime.js` | 1 | move-template | `generators/kit/files/src/partials/runtime.js` | Strip `ptah-ui` identifiers. The plan review re-checks this file (task decision 7). |
| `.claude/skills/video-showcase/**` | 5 | move-template | `plugins/nx-video/skills/video-showcase/**` | Canonical copy, neutralised. |
| `.claude/agents/video-director.md` | 1 | move-template | `plugins/nx-video/agents/video-director.md` | Neutralised. Nx targets instead of Ptah paths. |
| `apps/ptah-extension-vscode/assets/plugins/ptah-video/**` | 6 | move-template | `plugins/nx-video/.claude-plugin/plugin.json`; the 5 skill files deduplicate into the canonical copy above | Only `plugin.json` contributes bytes. |

Note on the studio count: the inventory has 78 studio move-template rows: 14 shell + 64 library, listed exactly above (extracted with `grep -E '\| move-template \|' parity-inventory.md | grep apps/ptah-video-studio`; the first draft's "15 + ≈63" was off by one). Mechanical coverage check, required in task 005 and run in CI as `tools/guards/inventory-coverage.mjs`: it reads the 132 move-generic and move-template rows of `.ptah/specs/TASK_2026_002_dcb6/parity-inventory.md` and `tools/guards/inventory-map.json` (source path at `e0ca51e6e` → nx-video path, or `{ "accounted": "<reason>" }` for the four absorbed `libs/showcase-manifest` config rows and the five deduplicated bundled skill files). It fails when a moving row is missing from the map, or when a mapped nx-video path does not exist. The map, not the inventory's design labels, carries the destination (D1). A one-time import check over the 64 library rows at `e0ca51e6e` found exactly two imports that resolve outside the moved set: `TerminalPlayer.tsx → ../concept/story-kit` and `EndCard.tsx → ./waitlist-qr`. Both are resolved in Component 5.

## Neutral replacements for excluded assets

| Excluded (research "Not safe" 2) | Needed by generic code? | Replacement | How it is produced |
|---|---|---|---|
| R1 `_smoke` media (`camera.mp4`, `screen.mp4`, `audio.wav`; were cut from a Ptah tour, `S:selfshot/README.md:26-27`) | Yes (AC4) | Synthetic test patterns and a tone | Component 9 at run time (`selfshot --smokeMedia`). Gitignored, never committed. |
| Showcase smoke recording | Yes (AC2) | `fixtures/showcase/_smoke/{beats.json,shots.json}` (text, neutral) + synthetic `raw.mp4` | Studio generator writes the JSON. Component 9 writes the mp4 when `render --scene=_smoke` runs. Assumption A2b: render-all renders without narration wavs (captions from beat text). Check in 005. If narration is required, smoke runs `narrate --engine=kokoro` first (a model download, only in `render-smoke.yml`). |
| `assets/music/*.mp3` | No. Music is optional (`render-all.mjs:807-812`; "nothing is committed there") | None shipped. `assets/README.md` explains how to drop a CC0 track or pass `--music` | — |
| `assets/sfx/*.mp3` (whoosh, ring, pop) | Optional. Staging returns null when absent (`render-all.mjs:741-757`) | None shipped. Assumption A15: `selfshot/Outro.tsx:79` renders only when `whoosh` is set; verify in 005 and guard it if not | — |
| `public/brand/ptah-icon.png` | No reference in generic `src` (git grep) | None. `brand.config.ts` carries text identity only | — |
| `public/models/*.glb` (7) | No. Only `src/concept3d` and `render-promo.mjs` use them, and both stay in Ptah | None. `three` and `@remotion/three` are not pinned | — |
| Kit reference screenshots (`kits/ptah-ui/`) | No | None | — |

## Integration architecture

- Data flow (Remotion showcase):
  1. A scene (`*.scene.ts`) runs under `capture` (Playwright) and the Director writes `<rec>/<scene>/{raw, beats.json}`.
  2. `narrate` writes `wav/` and `durations.json`.
  3. `caption` writes word timings.
  4. `render` stages props and assets into the scene dir and spawns `@remotion/cli render` over the user's `src/Root.tsx`, which registers `NxVideoCompositions` from `./remotion`, with brand coming through the alias.
  5. The output is `<rec>/<scene>/out/*.mp4`, and `master` optionally normalises loudness.
- Data flow (self-shot): `selfshot/<slug>/{camera,screen,audio}` → transcribe (`words.json`) → draft (`beats.json`) → narrate (optional) → render → `out/<slug>-<fmt>.mp4`.
- Data flow (HyperFrames):
  1. The `frame` generator writes `compositions/frames/NN-*.html`.
  2. `kit-build` produces the kit `components/`.
  3. `assemble` turns `src/index.tpl` plus frames plus kit components into `index.html`.
  4. `check` runs the layout scan and `hyperframes@0.8.98 check`.
  5. `hyperframes-render` writes `<main checkout>/video-output/<project>/<name>.mp4`.
- Data flow (editor, later minor release after 013): the editor generator provides the vendor download, the `.mcp.json` entry and `overlay-*` targets on `channel: editor` (0.8.30). The user's Claude session drives Resolve through the MCP bridge.
- State or persistence:
  - Recordings: `dist/video/recordings` (option; Ptah overrides it to `dist/apps/ptah-electron-e2e/recordings`).
  - Whisper cache: `<app>/.whisper`.
  - HyperFrames outputs: `video-output/`.
  - Editor vendor: `<dir>/vendor/`.

  All of these are gitignored (G2) and owned by the user's workspace. The package holds no state.
- External boundaries:
  - npm registry (pinned specs only)
  - codeload.github.com (pinned SHA, timeout, retry, optional sha256)
  - ElevenLabs API (key from env, never logged)
  - local DaVinci Resolve bridge (loopback, user-configured)

  Executor options are validated by Nx JSON schema, with regex patterns for slugs and names, before any path join. Slugs are restricted to `^[a-z0-9_][a-z0-9-_]*$`, which blocks path traversal into `selfshot/../`.
- Failure and rollback:
  - Executors leave partial outputs for debugging and overwrite them on the next run.
  - Generators are transactional through the Nx `Tree`: nothing is written on an error. The exception is the editor download, which writes to a temp dir and renames into `vendor/` only after a successful extract.
  - `export-kit` deletes its output on a leak (ported behaviour).
  - The release aborts before publish on a guard failure.
- Observability: the executors' stdout and stderr pass through (`stdio: inherit`). `doctor --json` is the machine-readable environment report. CI uploads `render-smoke.yml` artifacts and logs.

## Architecture-level quality requirements

- Functional:
  - AC1: the matrix CI is green.
  - AC2: init + studio, then the smoke composition renders (`render-smoke.yml`, required before publish).
  - AC3: `doctor` exits non-zero with fix lines.
  - AC4: `_smoke` renders from the package (same required gate).
  - AC5: the manifest validates and installs.
  - AC6: the source-tree fixture fails G3a and the planted post-copy leak is caught by G3b; both are required CI checks.
  - AC8: project + frame + assemble + check reports 0 errors (e2e on every PR), and render writes `video-output/` (required gate before publish).
  - AC9: the layout fixture fails CI.
- Performance: plugin import cost. `createNodes` reads only the trigger files and no node_modules. Doctor finishes in under 5 s without the network.
- Security: no secrets in templates (`.env.example` placeholders only). No shell spawns. Pinned external fetch by SHA. Provenance on publish. Pack check before publish.
- Maintainability:
  - two engine zones that do not import each other
  - one pin module per engine
  - scripts stay close to their Ptah originals, each with a header comment `Source: Hive-Academy/ptah-extension@e0ca51e6e:<path>` (the clean-copy reference, research Q1)
  - `NOTICE` carries the Apache-2.0 HyperFrames attribution (research Q3) and the Remotion license notice
- Testability:
  - every executor: schema→flags unit test, plus a failure-message test
  - every generator: tree test
  - every guard: pass and fail fixtures
  - e2e on all three OSes for generator output and inferred targets
  - real renders in `render-smoke.yml`, required before every publish
  - lint fixtures prove the engine-boundary rule fires for static, dynamic and `require` imports

## Order of work (roadmap 003–013, then the editor)

First-release scope (user decision row 14): everything except the editor. 013 publishes only when every first-release task is done and the real render smoke passes.

| Task | Components | Change vs current roadmap |
|---|---|---|
| 003 DEVOPS: scaffold + CI | workspace, `packages/nx-video` (empty plugin, createNodes stub, engine-zone lint blocks + isolation test + lint fixtures), `create-nx-video` skeleton, e2e project (Nx 24.0.1 and 23.3.1), Verdaccio, `ci.yml`, G1, root `.gitignore`, `NOTICE`, README license text | Adds G1, the engine-boundary lint and the isolation test early so every later task is checked. |
| 004 REFACTORING: contract | Component 3 (`./manifest`), Component 4 library part (`./capture`, including `createMenuSurfaces` and `createPrewarm`), Component 1 shared utils, Component 2 version modules (first-release constants only) | **Retitle**: "Manifest and capture subpath exports in `@hive-academy/nx-video`" (no separate package, D1b). |
| 005 FEATURE | Components 5, 6 (narrate, caption, render, selfshot, master, outro, qr, tui-frames, export-kit, studio), 7, 9, 10, the library-import and inventory-coverage checks; spikes A1, A2, A15 first | Adds `caption`, `master`, `outro`, `qr`, `tui-frames`, `export-kit` (implied by the inventory script decisions). |
| 006 FEATURE | `capture` executor, `scene` generator, A4 | unchanged |
| 007 FEATURE | `doctor` (`all`, `remotion` and `hyperframes` rows, injectable probes) | Editor rows move to 008. |
| 009 FEATURE | `hyperframes-project`, `frame`, `assemble`, `check`, `hyperframes-render`, G4 module, createNodes for `hyperframes.json`; A9 | **Split**: the kit and promo parts move to a new task (below). |
| new kit/promo task (id allocated by the orchestrator with an exclusive `mkdir`) | `kit`, `kit-component`, `kit-build`, `snapshot`, `preview`, `promo`; A10 | Depends on 009. **Required by 013**: `kit-build` is needed for Ptah's AC10 migration, and the generators are part of the public package. |
| 010 DEVOPS | G2–G5 in CI, G3a + G3b, fixtures (AC6, AC9) | Both AC6 failure modes are required checks. |
| 011 FEATURE | Component 12 (skills + agents, no MCP entry) | A7/A8 already resolved; the Claude Code install proof is recorded. |
| 012 FEATURE | Component 18 | **Depends on 005 and 009** (`--hyperframes` option). |
| 013 DEVOPS | `release.yml`, `render-smoke.yml` as the required pre-publish gate, first publish (token secret `NPM_TOKEN` set by the user), A14, A16 | **Depends on 007, 009, the new kit/promo task, 010, 011 and 012** (and through them on 003–006). Current roadmap lists only 010, 011. |
| 008 FEATURE (later minor release, after 013) | `editor` generator, `channel` option, editor `doctor` rows, editor constants, `tar` dependency, `.mcp.json` merge; confirm O1, O2, O3, A11, A12 on the Windows machine | **Depends on 007, 009 and 013**. Released as a minor version through the same `release.yml` gate, with an editor-specific manual proof on the Windows machine. |

## Ptah-side plan (for Ptah `TASK_2026_582_a7db`, not done here)

After the first publish (`x.y.z`):

1. Install: root devDep `@hive-academy/nx-video@x.y.z`. Run `nx g @hive-academy/nx-video:init --dry-run`, review the `updated` lines (Ptah's `^4.0.484` ranges become exact `4.0.484`, including `@remotion/three`; React `~19.2.0` is kept), then run it for real. There is no keep-existing bypass. Add the plugin to `nx.json` `plugins`.
2. Manifest:
   - delete `libs/showcase-manifest/`
   - rewrite the four import sites (`S:src/ShowcaseVideo.tsx:26`, `S:src/components/BodyScene.tsx:17`, `S:src/lib/load-manifest.ts:12`, `H:director.ts:10`) to `@hive-academy/nx-video/manifest`. Three of these files are deleted in step 4 anyway.
   - remove the alias from `tsconfig.base.json` and the boundary rule at `eslint.config.mjs:335`
3. Capture:
   - delete `_harness/{director,showcase-fixtures,browser-fixtures,showcase-launcher}.ts`
   - delete `prewarm.ts` and `config-menu.ts` too (user decision row 17). Add `_harness/ptah-surfaces.ts`, which calls `createMenuSurfaces` and `createPrewarm` from `@hive-academy/nx-video/capture` with Ptah's selectors (Component 4) and re-exports `openConfigSurface`, `prewarmNavSurface` and `prewarmThoth` with their current signatures, so scene files change only their import path
   - scenes import `createShowcaseTest({ launcher: 'electron', electronEntry: <ptah-electron main>, recordingsDir: 'dist/apps/ptah-electron-e2e/recordings' })` from one Ptah-local fixtures file
   - `apps/ptah-electron-e2e/project.json:24-65`: `showcase` becomes the package `capture` executor. `clean-recordings`, `copy-wasm` and `transcode.mjs` stay as Ptah `dependsOn` steps, or are dropped if `capture --transcode` covers them (A4).
   - `showcase.config.ts` stays in Ptah
4. Studio:
   - delete every studio move-generic/move-template path that the package now provides (`scripts/*` per the inventory, `src/components/**`, `src/remocn/**`, `src/selfshot/**`, `src/lib/**`, `ShowcaseVideo.tsx`, `theme.ts`)
   - keep `src/concept/**`, `src/concept3d/**`, `PromoReel.tsx`, `promos/`, `render-promo.mjs`, `polish.mjs`, `record-tui.mjs`, `probe-tui.mjs`, private `selfshot/<slug>/`, music, sfx, models, `public/brand/ptah-icon.png`
   - Ptah's `Root.tsx` renders `<NxVideoCompositions />` plus the four promo compositions
   - `brand.config.ts` keeps the Ptah values in `defineBrand` and adds `cta: { qrUrl: 'https://ptah.live/?utm_source=youtube#waitlist', displayUrl: 'ptah.live/#waitlist', headline: 'Join the Builders waitlist', qrAlt: 'Join the Ptah Builders waitlist' }` (the values from `gen-qr.mjs:24,26` and `EndCard.tsx:40,129`); `src/selfshot/waitlist-qr.ts` and `scripts/gen-qr.mjs` are then deleted
   - `src/concept/story-kit.tsx` imports `MONO_FAMILY` from `@hive-academy/nx-video/remotion` (or keeps its own `loadFont`); `PromoReel.tsx` imports `TerminalPlayer`/`TuiFramesData` from the package
   - `remotion.config.ts` adds the `nx-video:brand` alias
   - Ptah-only files that imported generic components (`PromoReel.tsx`, concept) switch to `@hive-academy/nx-video/remotion`
   - `S:project.json:8-69`: remove `studio`/`narrate`/`caption`/`render`/`master`/`video` (now inferred), keep `promo`/`polish` as `nx:run-commands`, and set `recordingsDir` through `targetDefaults` for the inferred targets
   - `S:package.json:7-17` and root `package.json:9` `studio` script → `nx run ptah-video-studio:studio`
5. Env and CI:
   - rename `PTAH_TTS_ENGINE`/`PTAH_ELEVENLABS_VOICE_ID` to `NX_VIDEO_*` in `.env` and secrets
   - `.github/workflows/render-showcase.yml:189,203,216` call `nx run ptah-video-studio:{narrate,caption,render}`
   - `upload-recordings.yml:120-166` keeps the private artifact handoff and only changes paths
6. HyperFrames:
   - `agent-lanes-v3` and `agent-lanes-chat` delete `assemble.mjs`
   - their `src/index.tpl` stays (project-owned)
   - each gets a `project.json` with `assemble.options.kits: ["tools/hyperframes/kits/ptah-ui"]`
   - `kits/ptah-ui` gets `kit.json` and deletes `build.mjs`. Its gallery copy uses the `kit-build` `gallery` option with prefix `ptah-ui`
   - delete `tools/hyperframes/render.mjs`. Renders go through the inferred `render` target (AC10)
   - `src/partials/runtime.js` is a Ptah-owned copy and stays (the kit generator emits a neutral one for new kits)
7. Marketplace and agents:
   - after `claude plugin marketplace add Hive-Academy/nx-video` works, remove the bundled `apps/ptah-extension-vscode/assets/plugins/ptah-video/**` and its `content-manifest.json:212-217` entries (regenerate with `scripts/generate-content-manifest.js`)
   - `content-manifest.json:242` (video-director template), `libs/backend/agent-generation/templates/agents/video-director.template.md` and `.codex/agents/video-director.toml` stay and point to the plugin targets
8. Drift: the 25 commits since baseline change content, not fates (`parity-inventory.md` "Drift since baseline"). Before the deletions, diff each moved file at `0e17912e3` (or later) against `e0ca51e6e`. Upstream any generic change into nx-video first: `config-menu.ts` (`4162f1413`) is merged into `createMenuSurfaces` (generic logic only; selectors stay in Ptah's `ptah-surfaces.ts`), and the two `.claude/skills/video-showcase/SKILL.md` edits (`5b4b1ead3`, `79d9b05fd`, `8f56815e4`, `5dfc7cdd6`) and `video-director.md` edits (`b5bda5541`, `ac1898c22`, `3404ddca4`) need a neutralised merge into `plugins/nx-video`. `project.json` edits (`c20dccc03`, `cedd86bfb`) are superseded by inference.
9. Proof: AC7 (record and render one existing scene; the moved paths are gone) and AC10 (agent-lanes projects assemble, check and render).

## Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| Remotion bundler does not resolve the package's compiled JSX or the brand alias (A1) | M / H | Spike first in 005. ESM build or a `BrandProvider` fallback, both internal. |
| A private recording or third-party audio is committed or published | L / H | G1 no-media, G2 ignore rules, G3 leak guard, G5 pack check in CI and release, kit-guard self-check in `studio`. |
| npx-cli.js not found under version managers (A3) | M / M | Three candidates + `NX_VIDEO_NPX_CLI` override, resolver tested on 3 OSes; doctor check. |
| `hyperframes check` needs a browser or network in CI (A9) | M / M | Fall back to running ubuntu-only for the real `check` and file-tree assertions elsewhere. |
| davinci-resolve-mcp upstream is not the vendored source (O1) | M / M | `confirmed:false` notice, confirmed on the Windows machine in 008, sha256 pinned after confirmation, download optional (`resolveMcp:false`). |
| `hyperframes@0.8.30` editor name wrong (O2) | L / M | Confirm in 008 before writing the constant as confirmed. Editor targets fail with a pin error otherwise. |
| Ptah drift diverges from the package during adoption | M / M | Ptah-side step 8 (diff and upstream before deleting). |
| Remotion license misunderstood by users | M / M (legal) | README + preset README + `NOTICE` carry the notice. The license obligation sits with the renderer (research Q2). |
| Caching large MP4s bloats the local Nx cache | M / L | Only Remotion `render` is cached, in-workspace. A single flag to set `cache:false` in `targetDefaults` is documented. HF render is not cached. |
| First npm publish needs the scope permissions and 2FA policy for a token | L / M | The user creates a granular automation token with publish rights on `@hive-academy` and adds it as `NPM_TOKEN` before 013. |
| The required render smoke is slow or flaky (model download, Chromium) and blocks a release | M / M | Synthetic media, kokoro only when narration is needed (A2b), artifact upload for diagnosis; the gate can be re-run on the same commit. It is never skipped. |
| A Nx 23 workspace fails on the `createNodes` shape | L / M | The e2e job runs on 23.3.1; if it fails, the peer floor is raised to `>=24` before the first publish. |

## Open items

- O1: Confirm the `davinci-resolve-mcp` remote and the full SHA from the Windows machine's ignored `tools/video-editor/vendor/davinci-resolve-mcp/.git`. Then set `confirmed:true` and `tarballSha256`. (Task 008, user.)
- O2: Confirm the editor's HyperFrames package name and version (`0.8.30`) from the ignored editor tree's `package.json` or scripts. (Task 008, user.)
- O3: Confirm the machine-local `.mcp.json` `davinci-resolve` entry shape (command, args) on the Windows machine. The env key names are known from `CLAUDE.md:24-29`. (Task 008.)
- O4: Open assumptions A1, A2, A2b, A3, A4, A9, A10, A11, A12, A14, A15, A16 above. Each one names the task that resolves it. A5, A6, A7, A8 and A13 are resolved in this revision (see Codebase evidence).
- O5: resolved. The 78 studio move-template rows split 14 shell + 64 library, listed exactly in the mapping; `inventory-coverage.mjs` keeps it mechanical.
- O6: npm `NPM_TOKEN` secret and GitHub repo push access (no GitHub credentials on this host, per task context). (User, before 013.)

## Doc updates on approval (proposed, not applied)

- `docs/decisions.md`: append "2026-10-26 — Extract plan approved" with these points:
  - Nx 24.0.1, peers `>=23 <25`
  - npm granular token + provenance
  - Remotion Free License (single developer), with the notice kept
  - davinci-resolve-mcp downloaded at the pinned SHA (unconfirmed), by the `editor` generator in a later minor release
  - first release = everything except the editor; the AC2/AC4/AC8 real render smoke is a required pre-publish gate (user decision row 14)
  - HyperFrames as pinned npm deps (editor through pinned npx)
  - studio delivered as a package runtime library + thin generated shell (D1)
  - manifest and capture as subpath exports (D1b)
  - `prewarm.ts`/`config-menu.ts` move as generic selector-driven hooks (`createMenuSurfaces`, `createPrewarm`); Ptah supplies its selectors (D6, user decision row 17)
  - engine isolation enforced by ESLint import-boundary blocks plus an isolation test (D13)
  - `init` always enforces engine pins; no keep-existing bypass (D15)
  - the layout-override rule (D9)
  - the cache policy (D8)
- `docs/decisions.md` "Target shape" row: list the full generator and executor set from this plan.
- `docs/decisions.md` "Marketplace" row (user decision row 15): change "`.claude-plugin/marketplace.json` with the skills, the agents and the MCP servers" to "`.claude-plugin/marketplace.json` with the skills and the agents. The `davinci-resolve` MCP server is machine-specific and is configured per machine by the `editor` generator in the workspace `.mcp.json`, not shipped in the marketplace." The schema-validation sentence stays.
- `docs/roadmap.md`:
  - retitle 004
  - 008 depends on 007, 009 and 013, and ships in a later minor release
  - split 009 (new task: kit/kit-component/kit-build/snapshot/preview/promo, depends on 009, required by 013)
  - 012 depends on 005, 009
  - 013 depends on 007, 009, the new kit/promo task, 010, 011 and 012, and adds `render-smoke.yml` as the required pre-publish gate
  - the "After 013" line notes that the editor minor release follows 013 and is not needed by Ptah's AC7/AC10
- `README.md` "Planned commands": add `selfshot`, `capture`, `assemble`, `check`, `render`.

## Decisions

| # | Decision | Options | Evidence | Reversible |
|---|---|---|---|---|
| D1 | Studio compositions and components ship as the `./remotion` runtime export. The `studio` generator writes a thin shell. **User-approved** 2026-10-26 (task `decisions.md` row 16) | (a) generated copy per the inventory labels; (b) runtime library + shell | `docs/decisions.md` "Ptah consumes … the studio from this package, not from a copy"; AC7; `parity-inventory.md:3` says the targets are labels | Yes, before the first publish. After that, only with a major version. |
| D1b | Manifest and capture are subpath exports of `@hive-academy/nx-video`, not a separate package | separate scoped package; subpath | The manifest is types only (`libs/showcase-manifest/src/index.ts:1-7`). One verified-free npm name (research Q5) | Yes |
| D2 | Brand injection through a webpack alias `nx-video:brand` set in the generated `remotion.config.ts` | alias; React context/provider; props drilling | `S:src/theme.ts:6-8` plus the 22 importers. The alias keeps the component diff minimal. Fallback: provider (A1) | Yes (internal) |
| D3 | Keep the pipeline `.mjs` scripts and spawn them from thin TS executors | port to TS in-process; keep `.mjs` | ESM-only deps (`tts.mjs:24`), script size, drift-sync with Ptah | Yes |
| D4 | Remotion CLI runs from the resolved local `@remotion/cli` entry with `process.execPath`. HyperFrames runs through `npx-cli.js --yes <pinned spec>` | npx for both; local for both | `selfshot-render.mjs:240` (shell npx, rule 5 violation); `HF:render.mjs:44-72`; `HF:projects/*/package.json:5-10` | Yes |
| D5 | HyperFrames project pins are installed as root devDeps (0.8.98, 0.8.97). The editor's 0.8.30 runs only through pinned npx (it cannot share root `node_modules` with 0.8.98) | both installed (conflict); both npx | User settled fact "HyperFrames as pinned npm deps"; the single-version-per-root constraint of npm | Yes |
| D6 | `prewarm.ts` and `config-menu.ts` move (inventory fate `move-generic` kept) and are neutralised as `createPrewarm` / `createMenuSurfaces`, which take selectors and options; the package holds no Ptah selector. **User decision** row 17 overturns the first draft's "stay in Ptah" | stay in Ptah (first draft); move as-is with Ptah selectors (breaks hard rule 6); move as selector-driven hooks | `H:config-menu.ts:4-98`, `H:prewarm.ts:30-129`: the logic is generic, only the selector strings and the surface id union are Ptah's | Yes, before the first publish (public API of `./capture`) |
| D7 | `createNodes` triggers are `remotion.config.ts`, `hyperframes.json`, `kit.json`. `brand.config.ts` is not a trigger | include `brand.config.ts` (research part C) | It always sits beside `remotion.config.ts`, so it is redundant. A second trigger would double-process the same project | Yes |
| D8 | Cache `narrate`, `caption`, `render` (Remotion), `assemble`, `kit-build`, `check`, `qr`, `tui-frames`. Do not cache `capture`, `selfshot`, `studio`, `preview`, `snapshot`, `master`, `doctor`, `export-kit`, `hyperframes-render` | part C list (render cached for both) | `HF:render.mjs:29,63` writes outside the worktree to the main checkout, and Nx outputs must be inside the workspace | Yes (`targetDefaults`) |
| D9 | The layout-attribute rule forbids `data-layout-ignore` **and** `data-layout-allow-*` in templates, fixtures and the `check` executor by default. `check` has `allowLayoutOverrides` (default false) as the escape hatch for user projects. The PLAYBOOK §Quality text is rewritten to match | follow PLAYBOOK (allow `allow-overlap`); follow decisions.md | `docs/decisions.md` 2026-10-01 "CI fails on `data-layout-ignore` and `data-layout-allow-*`" vs `HF:PLAYBOOK.md:53`. The later project decision wins | Yes |
| D10 | `createShowcaseTest` merges the browser and Electron fixtures into one factory | keep two fixture files | `H:showcase-fixtures.ts:101` and `H:browser-fixtures.ts:151` share the Director path ("everything downstream is IDENTICAL", `browser-fixtures.ts:20`) | Yes |
| D11 | Smoke media is synthesised with ffmpeg-static lavfi at run time | commit tiny CC0 media; synthesise | Hard rule 1 (never commit media); `ffmpeg-static` is already a pinned dep | Yes |
| D12 | The marketplace ships skills and agents only, with no `mcpServers` entry. The `editor` generator writes the `davinci-resolve` server into the workspace `.mcp.json`. **User decision** row 15; changes the `docs/decisions.md` "Marketplace" row (listed under "Doc updates on approval") | portable marketplace entry with placeholders; generator-only setup | Machine-specific command and env paths (`c032b0f1e:tools/video-editor/CLAUDE.md:24-29`); the source plugin has no `mcpServers` | Yes (a marketplace entry can be added in a minor release) |
| D13 | Engine isolation is enforced in `lint` by per-zone ESLint flat-config blocks using core `no-restricted-imports` and `no-restricted-syntax` (static, type, re-export, dynamic `import()` and `require()`, including `.mjs`), driven by one zone table; the import-resolving isolation test is the backstop | internal libs + `@nx/enforce-module-boundaries`; `eslint-plugin-import` `no-restricted-paths`; test only (first draft) | Review defect 8; a single published package; core rules need no extra dependency | Yes |
| D14 | Executor names: `render` (Remotion) and `hyperframes-render` (HyperFrames). The **target** name stays `render` in both project types (AC8) | prefix every engine | `executors.json` keys must be unique; prefix only on collision | Yes, before the first publish |
| D15 | `init` always enforces engine pins (Remotion family, `hyperframes`, `@hyperframes/shader-transitions`) and has no keep-existing option; supporting packages are kept when their range includes the pin | keep-existing flag (first draft); fail on conflict; overwrite and report | Hard rule 3; review defect 5; Nx `--dry-run` shows the change before it is applied | Yes |
| D16 | First release = everything except the editor; 013 depends on 007, 009, the kit/promo task, 010, 011, 012; the real render smoke gates publish. The editor ships in a later minor | ship all at once; ship without the gate | **User decision** row 14; review defect 3 | Scope: user-reserved |
| D17 | EndCard's QR is computed at render time from `BRAND.cta` with the moved pure encoder; no generated module | generated `brand.qr.ts` + second alias; keep `waitlist-qr.ts` import | `EndCard.tsx:18-19,26-40`; `qrcode.mjs` has no imports; review defect 2 | Yes |
| D18 | The kit runtime ships with no default tool-icon rules; `toolIcon(tool, rules)` takes them from the component | keep Claude tool-name defaults minus the `mcp__ptah__` branch | `runtime.js:291-304` mirrors Ptah's tool-icon component (product UI semantics); review defect 9 | Yes |

## Lane-introduced constraints

Rules that are neither user-requested nor in CLAUDE.md. They are defaults chosen by this plan, not approval conditions: each can be changed by a reviewed PR without re-opening this approval. The cost of each is stated so the user can weigh it.

| Constraint | Why (security / portability) | Cost |
|---|---|---|
| PR CI (`ci.yml`) never renders video; real renders run in `render-smoke.yml`, which is required before every publish (user decision row 14) | Render time and model downloads on three OSes per PR | A render regression is found at release time or in the weekly run, not on the PR that caused it |
| The release smoke renders on ubuntu only | Cost and runner time | A Windows/macOS-only render regression is not caught before publish (the Git Bash executor e2e still covers spawn paths) |
| Editor download (later minor): 60 s timeout, 2 retries with exponential backoff, temp-dir-then-rename write, optional sha256 pin | No half-written vendor dir; bounded wait on a flaky network | A very slow connection fails instead of waiting |
| Executors require Node ≥ 22.9 (from `export-kit.mjs:24`, `fs.cpSync` filter) | The moved scripts already need it | Users on Node 20 must upgrade |
| Slug and name option regexes (`^[a-z0-9_][a-z0-9-_]*$`, render name `^[A-Za-z0-9._-]+$`) | Block path traversal before any path join | Upper-case or dotted scene names are refused |
| G1 fails on a tracked file over 1 MB unless it is listed in `tools/guards/large-files.allow` | Keeps media out of a public repo even under a non-media extension | One reviewed allowlist line per legitimate large asset |
| The pack check fails on `ptah\|dyad\|xirp\|spotify` and the kit-runtime identifiers in published text files (allowlist: `NOTICE`, the README "Origin" line, `Source:` headers) | Hard rule 6 (no client or product names in templates), applied to the whole tarball | A legitimate word match needs an allowlist entry |
| `NX_VIDEO_NPX_CLI` is the only override env var for spawn resolution | One audited escape hatch, validated to end in `npx-cli.js` | Unusual npm layouts need that variable |
| The e2e job also runs on Nx 23.3.1 | Proves the `>=23` peer floor | About one extra e2e run per CI build |

## Proposed Removals

None.
- `prewarm.ts` and `config-menu.ts` (D6) are not removed. They move into the package as generic hooks, and Ptah keeps every behaviour through `ptah-surfaces.ts`.
- The marketplace MCP server entry is not a removal: it is a user-approved scope decision (row 15, D12), and the source plugin has no MCP server today. The capability lives in the `editor` generator.
- The editor is deferred to a later minor release by user decision (row 14, D16), not removed.
- The Ptah-only `promo` Remotion target, `polish`, `record-tui` and `probe-tui` stay in Ptah, per the inventory "Script decisions".
- Every capability of `export-kit.mjs` is kept, as the `export-kit` executor plus the guard.
- `gen-qr.mjs`'s capability (encode a URL as a QR) is kept as the `qr` executor; its Ptah output (`waitlist-qr.ts`) stays in Ptah per the inventory.

## Team-leader handoff

- Recommended executors:
  - devops-engineer: 003, 010, 013 (workflows, Nx config, guards wiring)
  - backend-developer: 004–007, 009, the new kit/promo task, 011, 012 for the first release; 008 after 013 (TypeScript plugin code, generators, executors, the capture hooks)
  - senior-tester: after each feature task (fixtures, e2e on three OSes, the hook test against `menu.html`)
  - the user: `NPM_TOKEN` before 013; the Claude Code install proof in the 013 checklist; O1–O3 on the Windows machine during 008
- Complexity: **HIGH**. 19 components, two engines, three OSes, a runtime library consumed by Ptah, and publishing.
- Dependencies and ordering:
  - Components 1–2 (shared, versions) before any executor.
  - Component 3 before 4 and 5.
  - Component 10 (guard) before 7 (studio self-check) and 11.
  - Component 17 needs the executor ids to exist.
  - Component 18 needs 7 (and 13 for `--hyperframes`).
  - Component 19 release needs every first-release component (1–15, 17, 18) and a green `render-smoke.yml` run; Component 16 (editor) comes after the first release.
  - The engine-zone lint table (`tools/eslint/engine-zones.mjs`) lands in 003, before any engine code.
- Parallel-safe work: the Remotion zone (Components 3–10) and the HyperFrames zone (13–14, 16) are file-disjoint. 12 (marketplace) is disjoint from both. 15 (doctor) touches only `executors/doctor`.
- Files affected (all CREATE unless noted):
  - Root: `package.json`, `nx.json`, `tsconfig.base.json`, `eslint.config.mjs`, `tools/eslint/engine-zones.mjs`, `.gitattributes`, `.verdaccio/config.yml`, `.claude-plugin/marketplace.json`, `NOTICE`. MODIFY `.gitignore`, `README.md` (and `docs/decisions.md`, `docs/roadmap.md` on approval).
  - `tools/scripts/*`, `tools/guards/{no-media,leak-guard,layout-attrs,pack-check,library-imports,inventory-coverage}.mjs`, `tools/guards/{large-files.allow,inventory-map.json}`, `tools/marketplace/{ptah-marketplace.schema.json,validate.mjs}`, `test-fixtures/{guards,lint,capture,tui}/**`.
  - `packages/nx-video/{package.json,project.json,generators.json,executors.json,README.md,LICENSE,NOTICE,tsconfig*.json}`.
  - `packages/nx-video/src/{index.ts,engine-isolation.spec.ts}`, `src/plugin/**`, `src/shared/**`, `src/manifest/**`, `src/capture/**`.
  - `packages/nx-video/src/remotion/{versions.ts,studio/**,scripts/**,kit-guard/**,smoke/**}`.
  - `packages/nx-video/src/hyperframes/{versions.ts,assemble/**,kit-build/**,render/**,check/**,layout-attrs/**,editor/**}`.
  - `packages/nx-video/src/executors/remotion/{studio,narrate,caption,render,selfshot,master,outro,qr,tui-frames,export-kit,capture}/**`, `src/executors/hyperframes/{assemble,kit-build,check,snapshot,preview,hyperframes-render}/**`, `src/executors/doctor/**`.
  - `packages/nx-video/src/generators/{init,studio,scene,editor,hyperframes-project,frame,kit,kit-component,promo,preset}/**`.
  - `packages/create-nx-video/**`, `e2e/nx-video-e2e/**`, `plugins/nx-video/**`, `.github/workflows/{ci,release,render-smoke}.yml`.
- Verification points:
  - every copied file carries `Source: Hive-Academy/ptah-extension@e0ca51e6e:<path>`
  - `npx nx run-many -t lint test typecheck build` green on the three OSes
  - `nx run nx-video-e2e:e2e` green
  - G1–G5 pass on the repo and fail on their fixtures; G3a fails on `leak-slug` and G3b reports the planted leak caught
  - the engine-boundary lint fails on the three lint fixtures
  - `library-imports.mjs` and `inventory-coverage.mjs` pass
  - the generated studio passes `tsc --noEmit` with no `waitlist-qr` or `concept/` reference
  - a generated HyperFrames project with three frames assembles in a unit test and passes `check` in e2e
  - `render-smoke.yml` green on the release commit before publish
  - `tools/marketplace/validate.mjs` passes
  - `nx release --dry-run` succeeds
  - no `Ptah`/`Dyad` strings in published files
  - pins appear only in the two `versions.ts` files and generated output
  - A1 resolved before the bulk of 005

## Revision log

Revision round 1 (2026-10-26), answering `implementation-plan-review.md` (verdict REVISE) and applying user decisions rows 14–17 of the task `decisions.md`.

| Defect | Severity | Resolution | Sections changed |
|---|---|---|---|
| 1 — AC6 fixture cannot fail | Blocking | Added `scanSourceTree` (G3a source-tree rule with an expected-fail fixture) and G3b `alarm-self-test`, which plants a leak after filtering and requires the alarm to throw and delete. Production filter and alarm unchanged. Both failure modes are required in 010. | Component 7 (self-check), Component 10, Component 11 (G3), Component 19 (`ci.yml`), Order of work (010), Quality requirements (AC6), Verification points |
| 2 — EndCard's branded QR import; `tui-frames` contract | Blocking | `BrandConfig.cta` contract; EndCard encodes the QR at render time with the moved pure encoder (`studio/lib/qrcode.mjs`); all five `brand.config` importers use `nx-video:brand`; `TerminalPlayer`'s Ptah font import replaced by library `fonts.ts`; generated studio typechecks in e2e and `outro` renders in the gate. `tui-frames` schema now mirrors the source (`scene`, `fps`, `speed`, `maxIdleMs`, `tui.cast` → `tui-frames.json` shape), `@xterm/headless` 6.0.0 pinned, installed and checked by doctor. | Codebase evidence, Layout (peers), Component 2, Component 5, Component 6, Component 7, Component 15, Mapping, Ptah-side step 4, D17 |
| 3 — first publish may omit deliverables | Blocking | 013 depends on 007, 009, the kit/promo task, 010, 011, 012; `render-smoke.yml` is a required `workflow_call` job before `publish`, and `publish` also requires the commit's green `ci.yml`. Editor (008) moved to a later minor (user row 14). | Inputs (correction 6), Component 2, Components 14–16, Component 19, Order of work, Quality requirements, Doc updates, D16, Team-leader handoff |
| 4 — frame contract vs `assemble.mjs` | Serious | Full fragment shape specified (template, `fNN` root, composition id, dimensions from aspect, contiguous frame start, seam on later frames, paired `data-start`/`data-duration`); `index.tpl` markers and third-party music line handled; unit test runs generated frames through `assemble`; e2e runs `check`; empty-frames failure added. | Codebase evidence (assemble row), Component 13 (`hyperframes-project`, `frame`, verification), Component 14 (failures) |
| 5 — `keepExistingVersions` unpins | Serious | Option removed. Engine packages are always written as exact pins (including other `@remotion/*` present); supporting packages kept only when their range includes the pin; explicit `--dry-run` migration step; doctor FAILs on mismatch. Ptah step 1 updated. | Component 2, Component 7 (`init`), Ptah-side step 1, D15 |
| 6 — marketplace MCP omission | Serious | Recorded as a user-approved decision (row 15), not an omission or removal; `docs/decisions.md` "Marketplace" wording change listed. Marketplace manifest content specified against the transcribed schema. | Inputs (correction 6), Component 12, Component 16, Doc updates, D12, Proposed Removals |
| 7 — deferred contracts | Moderate | `outro`, `qr` and `tui-frames` options from source; A5 resolved by runtime `bin` lookup; A7 (schema) and A8 (CLI) resolved with citations; A13 resolved from the research's installed-types read, with an Nx 23.3.1 e2e fallback; exact 14 + 64 studio list (first draft said 15 + ≈63) and a mechanical `inventory-coverage.mjs` check; O5 closed. React, sharp and `@xterm/headless` pins resolved from Ptah's lockfile. | Codebase evidence, Component 2, Component 6, Component 12, Component 17, Mapping, Open items |
| 8 — engine isolation only by test | Moderate | Per-zone ESLint flat-config blocks (core `no-restricted-imports` + `no-restricted-syntax` for dynamic `import()` and `require()`, `.mjs` included) driven by one zone table shared with the isolation test; lint fixtures prove each case. | Architecture decision, Layout, Engine isolation section, Order of work (003), D13, Team-leader handoff |
| 9 — kit runtime neutralisation | Moderate | Replacement table for every branded behaviour (`ptahKit`, `data-ptah-part`, `ptahToolIcon` incl. `mcp__ptah__`, `pu-*`/`PU_ICONS`, header); kit + kit-component built and scanned in unit tests, jsdom behaviour test, tarball patterns in G5. | Codebase evidence, Component 11 (G5), Component 13 (`kit`, verification), D18 |

User decisions applied: row 14 (D16, Order of work, Component 19), row 15 (D12, Component 12, Doc updates), row 16 (D1 marked approved), row 17 (D6 overturned: Component 4 hooks, Mapping, Ptah-side step 3, Doc updates). The "Lane-introduced constraints" note is applied: those rules are now stated as adjustable defaults with their costs, the render choice sits behind the required pre-publish smoke, and the 1 MB rule has a reviewed allowlist.


Revision round 2 (2026-10-26, orchestrator bounded correction), answering `implementation-plan-review-r2.md` (verdict REVISE, 7/9 resolved):

| Item | Resolution | Lines changed |
|---|---|---|
| R2-1 / defect 2: QR encoder missing from package assets | Added `src/remotion/studio/lib/**/*.mjs` to the `nx-video` build assets; the render-smoke gate now pre-checks the packed tarball for `qrcode.mjs` | Nx projects table; `render-smoke.yml` steps |
| Defect 9: `pu-badge`, `pu-code` not renamed | Replacement row covers all five `pu-` classes the runtime emits (`runtime.js:117,148,212,233,254`, verified with `git show e0ca51e6e:…`); G5 tarball pattern widened to `\bpu-[a-z-]+\b` | Component 13 replacement table; Component 11 G5 |
