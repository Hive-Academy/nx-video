# Implementation Plan - TASK_2026_007

The `doctor` executor (roadmap AC3): `nx run <studio>:doctor` reports each missing prerequisite with a fix message and exits non-zero when one is missing.

## Inputs and constraints

- Requirements used:
  - `CLAUDE.md` (hard rules 3, 4, 5, 6)
  - `docs/roadmap.md` (007 depends only on 003; AC3)
  - `docs/decisions.md` ("Engine-neutral executor `doctor`"; pinned versions)
  - `.ptah/specs/TASK_2026_007_3276/task.md`, `context.md`
  - `.ptah/specs/TASK_2026_002_dcb6/implementation-plan.md` (APPROVED). Sections read: Codebase evidence rows 62, 63, 72, 73; layout 98-139; zone table 175; Components 1 (201-218) and 2 (220-238); Component 15 (683-718); order of work 916-933; risks 977-992; open items 994-1001; D8 (1042); handoff 1096, 1104.
  - `.ptah/specs/TASK_2026_002_dcb6/parity-inventory.md`: not read. The approved plan already carries the inventory rows that concern doctor (rows 62, 63, 72, 73).
  - `.ptah/specs/TASK_2026_003_06a8/decisions.md` rows 6 and 10; `batches.md` D1-D9, R1-R12.
  - Scaffold: `packages/nx-video/**`, `tools/eslint/engine-zones.mjs`, `e2e/nx-video-e2e/**`, `nx.json`.
  - Ptah source at `e0ca51e6e` (git plumbing only). The editor machine facts are at `c032b0f1e:tools/video-editor/CLAUDE.md`, because that path does not exist at `e0ca51e6e`.
- Corrections applied:
  - `context.md` (2026-10-06) lists editor checks (CUDA, torch, torchvision, `HF_HUB_DISABLE_SYMLINKS`, the Resolve bridge). The approved plan (2026-10-26, user decision row 14) moves the editor rows to 008. See Decision D1.
  - `context.md` says pin drift is checked with `hyperframes upgrade --check`. Hard rule 3 forbids an unpinned call. See Decision D3.
- Design handoff used: none (no UI).
- Missing decision-critical input:
  - `task-description.md` and `research-report.md` are absent. `context.md` and approved Component 15 serve as the requirements.
  - Approved Components 1 (`src/shared/npx-cli.ts`) and 2 (both `versions.ts`) belong to task 004, which is `status: backlog` (`.ptah/specs/TASK_2026_004_8680/task.md`). They do not exist in the tree. Doctor needs both, and the binding roadmap lets 007 start after 003 alone. This is resolved by Component 0 (create if absent). It is an open question for the user (Q1).

## Codebase evidence

| Evidence | Location | Architectural implication |
| --- | --- | --- |
| `executors.json` is `{"executors": {}}`; `generators.json` is empty | `packages/nx-video/executors.json:1` | Doctor is the first executor. It sets the registration shape for the executors that follow. |
| Build is `@nx/js:tsc` with `rootDir: "."`. Assets include `packages/nx-video/**/schema.json` and `executors.json` | `packages/nx-video/project.json:9-25`, `tsconfig.lib.json:3-10` | `implementation: "./src/executors/doctor/executor"` resolves in `dist/packages/nx-video`. `schema.json` is copied without any build change. |
| `test` = `vitest run`, includes `src/**/*.spec.ts`, node env | `packages/nx-video/project.json:33-36`, `vitest.config.mts:4-9` | Specs sit next to the source. No new runner. |
| `PromiseExecutor<T>` = `(options: T, context: ExecutorContext) => Promise<{ success: boolean }>`; `ExecutorContext` has `root`, `projectName?`, `projectsConfigurations`, `cwd`, `isVerbose` | `node_modules/nx/dist/src/config/misc-interfaces.d.ts:166-170,237-273`; exported at `nx/dist/src/devkit-exports.d.ts:16` | The exit code comes from `success: false`. Nx turns that into a non-zero `nx run` exit. |
| Peers `nx`, `@nx/devkit` `>=23 <25`; dependency `tslib` only | `packages/nx-video/package.json:14-20` | Doctor imports only types from `@nx/devkit` and has no runtime dependency. |
| Zone `aggregators` contains `src/executors/doctor/**`, with `allowed: ['both engines versions.ts', ...]` and `forbidden: []` | `tools/eslint/engine-zones.mjs:68-80` | Doctor may import both `versions.ts` and `src/shared`. Lint does not enforce that allow-list, so review enforces it: doctor imports no other engine module. |
| Pin literals are banned outside `versions.ts`. The isolation test regex is `(?:hyperframes\|remotion)@\|@remotion\/[\w.-]+@`. The lint selectors are `Literal[value=/hyperframes@\|remotion@/]` and `/@remotion\/[^@]+@/` | `engine-zones.mjs:83-88`; `engine-isolation.spec.ts:94-96`; `packages/nx-video/eslint.config.mjs:12-14` | Doctor source, including fix-message text, must never contain `hyperframes@…`, `remotion@…` or `@remotion/x@…`. Version strings come from `versions.ts`. |
| `FORBIDDEN_SPAWN_STRINGS = ['npx.cmd', 'shell: true', "execFileSync('npx'"]`, matched as raw text in every non-spec source | `engine-zones.mjs:89`; `engine-isolation.spec.ts:98-99` | The Git Bash fix message cannot contain the literal `npx.cmd`. It must say "npm's Windows npx shim". |
| `npxCli()` candidates: `<dir(execPath)>/node_modules/npm/bin/npx-cli.js` and `../lib/node_modules/npm/bin/npx-cli.js`, with a `NX_VIDEO_NPX_CLI` override | Ptah `e0ca51e6e:tools/hyperframes/render.mjs:44-53`; this repo's copy `e2e/nx-video-e2e/src/test-utils.ts:15-27` | The `npx-cli` check calls the shared resolver. It does not copy it. |
| Approved Component 1 (`npxCli`, `runNode`, shared, builtins only) and Component 2 (`REMOTION_VERSION = '4.0.484'`, `KOKORO_JS_VERSION`, `XTERM_HEADLESS_VERSION`, `SHARP_VERSION`, `HYPERFRAMES_PROJECT`, `SHADER_TRANSITIONS`) | `TASK_2026_002_dcb6/implementation-plan.md:201-238` | Doctor reads every expected version from these modules (hard rule 3). |
| Approved Component 15 checks table, output format, injectable probes, e2e "without kokoro-js exits non-zero" | `TASK_2026_002_dcb6/implementation-plan.md:683-718` | This is the baseline contract. This plan refines it and does not replace it. |
| 007 = "`doctor` (`all`, `remotion` and `hyperframes` rows, injectable probes)"; editor rows move to 008 | `TASK_2026_002_dcb6/implementation-plan.md:926,933` | Editor checks are out of scope (D1). |
| D8: doctor is not cached | `TASK_2026_002_dcb6/implementation-plan.md:1042` | Whoever writes a `doctor` target sets `cache: false`. The e2e fixture does so. |
| Performance: "Doctor finishes in under 5 s without the network" | `TASK_2026_002_dcb6/implementation-plan.md:901` | The default run makes no network calls. Network is opt-in (D3). |
| ffmpeg-static path check: `require('ffmpeg-static')`; throws "ffmpeg-static binary not found (npm install to fetch it)" | Ptah `e0ca51e6e:apps/ptah-video-studio/scripts/lib/tts.mjs:50-54`; `scripts/lib/media.mjs:17-18`; `scripts/caption.mjs:41-43` | Same probe: resolve the module, then `existsSync` the returned path. |
| Node floor `>=22.9` (`fs.cpSync` filter) | Ptah `e0ca51e6e:apps/ptah-video-studio/scripts/export-kit.mjs:24` | `node-version` check. |
| `sharp` is used inside a try, with a fallback to no crop | Ptah `e0ca51e6e:apps/ptah-video-studio/scripts/render-all.mjs:403-418` | `sharp` is WARN, not FAIL. |
| `@xterm/headless` is required by `tui-frames` | Ptah `e0ca51e6e:apps/ptah-video-studio/scripts/tui-frames.mjs:155-158` | Conditional FAIL (approved row). |
| `ELEVENLABS_API_KEY` is read at `tts.mjs:277`; the engine comes from `PTAH_TTS_ENGINE` (`narrate.mjs:297`) | Ptah `e0ca51e6e:apps/ptah-video-studio/scripts/lib/tts.mjs:277,342`; `narrate.mjs:13-19,297` | Neutral rename to `NX_VIDEO_TTS_ENGINE` (approved row). The key value is never printed. |
| Whisper cache is `<app>/.whisper` | Ptah `e0ca51e6e:apps/ptah-video-studio/scripts/caption.mjs:16,32` | `whisper-cache` WARN. |
| No browser configuration in `remotion.config.ts`, so Remotion uses its downloaded Chrome Headless Shell | Ptah `e0ca51e6e:apps/ptah-video-studio/remotion.config.ts:9-23` | `remotion-browser` check (Assumption A2 on the download location). |
| Git Bash cannot spawn the npx shim; run `npx-cli.js` through node | Ptah `e0ca51e6e:tools/hyperframes/HANDOFF.md:77`; `c032b0f1e:tools/video-editor/CLAUDE.md:21-22` | `git-bash` WARN. |
| "A background `hyperframes preview` locks its project folder on Windows: `npx hyperframes preview --stop`" | Ptah `e0ca51e6e:tools/hyperframes/HANDOFF.md:83` | `hyperframes-preview-lock` check on win32. |
| HyperFrames CLI has `preview --status` / `--stop`; `upgrade --project . --check` "shows the delta" | Ptah `e0ca51e6e:tools/hyperframes/projects/agent-lanes-chat/CLAUDE.md:41-43,58` | Preview probe and the online drift probe (A4, A5). |
| HyperFrames skills live in `~/.claude/skills/hyperframes*` | Ptah `c032b0f1e:tools/video-editor/CLAUDE.md:132-133` | `hyperframes-skills` WARN. Read-only home access (003 decision row 10 forbids writes only). |
| Editor facts: CUDA float16, torch 2.11.0+cu128, torchvision must match, `HF_HUB_DISABLE_SYMLINKS=1`, the bridge in `Fusion\Scripts\Utility` | Ptah `c032b0f1e:tools/video-editor/CLAUDE.md:16,30-35,100-124` | Owned by 008 (D1). Listed so 008 does not re-derive them. |
| The e2e asserts `executors.executors` is `{}` and that `nx list` shows no executor; `runNpx` throws on a non-zero exit | `e2e/nx-video-e2e/src/nx-video.spec.ts:47-52`; `test-utils.ts:29-50` | The e2e must be updated, and it needs a non-throwing runner for the AC3 non-zero case. |
| e2e workspace under `os.tmpdir()`, `NPM_CONFIG_USERCONFIG` temp file, no shell | `nx-video.spec.ts:18-37`; `test-utils.ts:30-43`; 003 decision row 10, R6, R8 | The doctor e2e reuses these as they are. |

## Architecture decision

- Chosen approach: one engine-neutral executor in `src/executors/doctor/`, built from three parts:
  1. A **check registry**. Each check is a pure async function over an injected `DoctorProbes` interface. Each check is tagged with a scope (`all`, `remotion` or `hyperframes`).
  2. A **real probe implementation**. It is the only file that touches `fs`, `process`, `os`, `module` or `child_process`.
  3. A **thin executor**. It resolves scopes, runs the selected checks with per-check isolation and a timeout, prints text or JSON, and returns `{ success: no FAIL }`.
- Rationale:
  - The requirement is checks plus fix messages plus an exit code (AC3) and "unit tests for each check with a mocked environment" (`context.md`).
  - Injecting the probes makes every check testable on Linux CI while asserting Windows and macOS behaviour (`platform` and `env` are injected). This is the seam approved Component 15 names (`implementation-plan.md:717`).
  - The registry keeps 008's editor rows a pure data addition, through a new scope value and new check files, with no executor change.
- Rejected alternatives:
  - **One `executor.ts` with inline `if` checks**: cannot be unit-tested per check without real machines. It fails the context's acceptance line.
  - **Spawning each tool's own `--version` / `doctor`** (for example a HyperFrames CLI doctor): needs network or npx downloads, breaks the 5 s offline budget (`implementation-plan.md:901`) and invites unpinned calls (hard rule 3).
  - **Using `require.resolve('<pkg>/package.json')` for installed versions**: packages with an `exports` map that omits `./package.json` throw `ERR_PACKAGE_PATH_NOT_EXPORTED`. Walking `node_modules/<pkg>/package.json` upward from the project root does not depend on the exports field (D9).
- Assumptions: A1-A7 below. Each one names its check.
- Effect on existing code:
  - Adds the first executor.
  - Edits `executors.json`, the package README and the e2e spec and utils.
  - Creates `src/shared/npx-cli.ts` and both `versions.ts` only if task 004 has not landed (Component 0).
  - `createNodes` is not touched. Inferring the `doctor` target belongs to 005 and 009 (approved Component 17, `implementation-plan.md:758-759`).

### Assumptions

| Id | Assumption | Check that resolves it | Affects |
| --- | --- | --- | --- |
| A1 | Studios and HyperFrames projects carry the tags `nx-video:studio` / `nx-video:hyperframes` (approved Component 15). The generators that write them are in 005 and 009 | Read 005/009 generator output when they land. Until then, the trigger-file fallback (D7) covers untagged projects | scope inference |
| A2 | Remotion 4.0.484 downloads Chrome Headless Shell under `node_modules/.remotion/chrome-headless-shell/<platform>/`. `remotion.config.ts` or `REMOTION_BROWSER_EXECUTABLE`-style overrides can point elsewhere | Open `@remotion/renderer@4.0.484` `dist/browser/` (the download-destination helper) and confirm the folder and executable names per platform (`linux64`, `mac-arm64`, `mac-x64`, `win64`) before coding the probe. If an exported non-downloading lookup exists, call it instead of the hard-coded path | `remotion-browser` |
| A3 | `require('playwright-core').chromium.executablePath()` returns the expected browser path without launching or downloading | Confirm in the installed `playwright-core` (`>=1.50`). If that is not true, fall back to the `PLAYWRIGHT_BROWSERS_PATH` / default cache directory per OS | `playwright-chromium` |
| A4 | `hyperframes@0.8.98` has `preview --status`. It runs from the locally installed package's `bin` JS entry through `node`, and its exit code or output tells "running" from "not running" | Read `node_modules/hyperframes/package.json#bin` and run `preview --status` once on Windows with and without a background preview | `hyperframes-preview-lock` |
| A5 | `hyperframes@0.8.98 upgrade --project <dir> --check` queries the registry for the latest release and does not rewrite files | Run it in a scratch project and diff the tree before and after | `hyperframes-drift` (online only) |
| A6 | 005's `narrate` reads `NX_VIDEO_TTS_ENGINE` (renamed from `PTAH_TTS_ENGINE`, `narrate.mjs:297`) and loads `<projectRoot>/.env` | Read 005's narrate port. If `.env` is not loaded there, doctor checks `process.env` only | `tts-key` |
| A7 | 005's brand alias in `remotion.config.ts` contains the literal text `nx-video:brand` (approved `implementation-plan.md:353`) | Read 005's generated `remotion.config.ts` template | `brand-alias` |

## Component specifications

### 0. Prerequisite shared modules (conditional; owned by approved Components 1 and 2)

- Purpose: make the two modules doctor imports exist when 007 runs before 004.
- Responsibilities:
  - If `packages/nx-video/src/shared/npx-cli.ts` already exists on the base branch, consume it unchanged. Otherwise create it exactly to approved Component 1's `npxCli()` contract (`implementation-plan.md:204`, failure text at `:212`), and nothing else from Component 1. `runNode`, `runPinnedNpx`, `paths.ts` and `output.ts` stay with 004.
  - If `packages/nx-video/src/remotion/versions.ts` and `src/hyperframes/versions.ts` exist, consume them. Otherwise create them with the approved first-release constants (`implementation-plan.md:223-233`) and no editor constants.
  - In either case, `src/remotion/versions.ts` must export `REMOTION_PACKAGES`, the readonly list of the seven `@remotion/*` and `remotion` names that Component 2 says the pin applies to (`implementation-plan.md:223`). If 004 landed without it, add it (MODIFY). Doctor iterates this list instead of restating the names.
- Verified contracts: approved Components 1 and 2 (cited above). Zone `shared` permits builtins only (`engine-zones.mjs:24-35`). Pin literals are allowed only in the two `versions.ts` files (`engine-zones.mjs:84-88`).
- Dependencies: node builtins only.
- Integration points: imported by doctor checks. Later imported by 004, 005 and 009 consumers.
- Failure behaviour: `npxCli()` throws the approved message. Doctor catches it (Component 2).
- Quality requirements: no other symbol from Components 1 and 2, so 004 keeps ownership of the rest.
- Verification seam:
  - `npx-cli.spec.ts`: both layouts and the override, with a temp dir that fakes `execPath`. It runs on the three CI OSes (approved `:214`).
  - The isolation test stays green.
- Files (only if absent):
  - CREATE `/home/amun/projects/nx-video/packages/nx-video/src/shared/npx-cli.ts` and `npx-cli.spec.ts`
  - CREATE `/home/amun/projects/nx-video/packages/nx-video/src/remotion/versions.ts`
  - CREATE `/home/amun/projects/nx-video/packages/nx-video/src/hyperframes/versions.ts`
  - Otherwise MODIFY `src/remotion/versions.ts` for `REMOTION_PACKAGES` only.

### 1. Doctor contract: types, schema and registration

- Purpose: the public contract of the executor.
- Responsibilities:
  - `schema.json` (Nx executor schema, `"version": 2`) with these options:
    - `scope`: array of `"remotion" | "hyperframes"`, optional. When it is omitted, D7 infers it. `all` rows always run, so `all` is not a value.
    - `json`: boolean, default `false`.
    - `online`: boolean, default `false`. Enables the network check `hyperframes-drift` (D3).
  - `schema.d.ts` exports `DoctorExecutorSchema`.
  - `types.ts`:
    - `CheckLevel = 'PASS' | 'WARN' | 'FAIL' | 'SKIP'`.
    - `CheckResult { id: string; scope: 'all' | 'remotion' | 'hyperframes'; level: CheckLevel; title: string; detail?: string; fix?: string }`. `fix` is required when the level is `WARN` or `FAIL`.
    - `DoctorCheck { id; scope; title; run(ctx: CheckContext): Promise<Omit<CheckResult, 'id' | 'scope' | 'title'>> }`.
    - `CheckContext { workspaceRoot; projectRoot (absolute); projectName; options; probes: DoctorProbes }`.
    - `DoctorProbes`, the only gateway to the machine:
      - `platform`, `arch`, `nodeVersion`, `env` (read-only record), `homedir`
      - `exists(path)`, `readText(path)`, `listDir(path)`
      - `findPackage(name, fromDir): { dir, version } | null` (D9)
      - `resolveModuleValue(name, fromDir): unknown` (for `ffmpeg-static`'s exported path)
      - `npxCli(): string` (throws)
      - `runNode(script, args, { cwd, timeoutMs }): Promise<{ code: number | null; stdout: string; timedOut: boolean }>`
      - `playwrightChromiumPath(fromDir): string | null`
  - `executors.json` entry: `"doctor": { "implementation": "./src/executors/doctor/executor", "schema": "./src/executors/doctor/schema.json", "description": "Check machine prerequisites for nx-video projects and print a fix for each one that is missing." }`.
- Exit codes:
  - The executor returns `{ success: false }` when at least one result is `FAIL`. Nx then exits `nx run` with code 1.
  - `WARN` and `SKIP` never fail the run.
  - The exit code is the same with and without `json`.
- Output contract (text, the default):
  - One line per check, in registry order: `<LEVEL padded to 4>  <title>` followed by `  -> <fix>` on the next line, indented, for `WARN` and `FAIL`. `detail` such as the found version is shown in parentheses after the title.
  - A summary line: `doctor: <n> passed, <n> warnings, <n> failed, <n> skipped (<project>, scopes: <list>)`.
- Output contract (JSON):
  - A single line containing a JSON array of `CheckResult`, written to stdout and nothing else from doctor. This keeps the approved shape, "prints an array" (`implementation-plan.md:715`). Nx's own task header lines surround it, so a consumer takes the line that starts with `[`.
- Verified contracts: `PromiseExecutor`/`ExecutorContext` (`misc-interfaces.d.ts:166-170,237-273`). Build assets copy `**/schema.json` (`project.json:21`).
- Dependencies: types only from `@nx/devkit`.
- Integration points: Nx resolves the executor from `executors.json`. The `doctor` targets that 005/009 `createNodes` infer use these options. 008 extends the `scope` enum with `editor`.
- Failure behaviour: Nx validates option types against the schema before the executor runs. An unknown `scope` value is rejected by Nx's schema validation.
- Quality requirements: no option without a requirement. `online` exists only because `context.md` asks for the latest-version comparison.
- Verification seam: the executor spec asserts the JSON shape and the exit mapping. The e2e asserts `executors.json` lists `doctor`.
- Files:
  - MODIFY `/home/amun/projects/nx-video/packages/nx-video/executors.json`
  - CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/schema.json`
  - CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/schema.d.ts`
  - CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/types.ts`

### 2. Executor orchestration (`executor.ts`, `report.ts`)

- Purpose: select, run and report checks. It holds no check logic.
- Responsibilities:
  - Resolve the project: `context.projectsConfigurations.projects[context.projectName]`, with `projectRoot = join(context.root, project.root)`. If `projectName` is missing, the run is a FAIL result `doctor-context` with the fix "run doctor through `nx run <project>:doctor`".
  - Resolve scopes (D7): `options.scope` if given, else the tags, else the trigger files `remotion.config.ts` / `hyperframes.json` in `projectRoot`. If nothing matches, run only the `all` rows plus one `WARN` result `scope`, with the fix "tag the project `nx-video:studio` or `nx-video:hyperframes`, or pass `--scope`".
  - Run the selected checks concurrently with `Promise.allSettled`. Each check gets a per-check timeout (3 s by default; 20 s for `hyperframes-drift`). A rejection or timeout becomes `FAIL` with `detail` = the error message and the fix "report this at the nx-video issue tracker with the output of `--json`". Results are emitted in registry order.
  - `report.ts`: pure `formatText(results, meta)` and `formatJson(results)`, plus `summarize(results)`. It writes through an injected `write(line)` that defaults to `process.stdout.write`.
  - `createProbes(context)` (Component 3) is the default. The executor's internal `runDoctor(options, context, probes, write)` is exported for tests.
- Verified contracts: as Component 1.
- Dependencies: `checks/index.ts` (registry), `probes.ts`, `report.ts`. No engine module except through checks.
- Integration points: Nx task runner. The stdout is captured by Nx and passed to the terminal.
- Failure behaviour: the executor never throws. Every error becomes a result. The only non-success path is at least one `FAIL`.
- Quality requirements:
  - The default run completes in under 5 s with no network (`implementation-plan.md:901`). Concurrency plus the per-check timeouts bound it.
  - Secrets: no check puts an environment *value* in `detail` or `fix`. Only names appear.
- Verification seam: `executor.spec.ts` with fake probes and a fake registry. It covers:
  - one FAIL → `success:false`
  - only WARN/SKIP → `success:true`
  - a check that throws, and a check that hangs past its timeout, are each reported as FAIL while the others still report
  - scope from option, then from tags, then from trigger files, then the none-matched WARN
  - the JSON output parses and contains every id
  - the text output has a fix line under each WARN and FAIL
- Files:
  - CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/executor.ts`, `executor.spec.ts`
  - CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/report.ts`, `report.spec.ts`

### 3. Real probes (`probes.ts`)

- Purpose: the single place with side-effecting machine reads.
- Responsibilities:
  - `findPackage(name, fromDir)`: walk from `fromDir` up to the filesystem root. At each level read `node_modules/<name>/package.json`, return `{ dir, version }` for the first hit and `null` otherwise. This handles hoisting and scoped names, and on Windows it uses `path.join` and never string concatenation.
  - `resolveModuleValue(name, fromDir)`: `createRequire(join(fromDir, 'package.json'))(name)`. Used for `ffmpeg-static`, whose default export is the binary path.
  - `npxCli`: import from `src/shared/npx-cli.ts`.
  - `runNode`: `execFile(process.execPath, [script, ...args], { cwd, shell: false, windowsHide: true, timeout })`. It captures stdout and never rejects on a non-zero exit. This is doctor-local because approved `runNode` returns no stdout and has no timeout (`implementation-plan.md:205`). It still follows hard rule 5: argument array, `process.execPath`, no shell.
  - `playwrightChromiumPath(fromDir)`: A3.
  - Everything else is a thin wrapper over `fs`, `os` and `process`.
- Verified contracts: `npxCli` (Component 0). Hard rule 5 (`CLAUDE.md`). `FORBIDDEN_SPAWN_STRINGS` (`engine-zones.mjs:89`).
- Dependencies: node builtins and `src/shared/npx-cli.ts`.
- Failure behaviour: read helpers return `null` or `false` on `ENOENT`/`EACCES` and never throw. `runNode` resolves `{ code: null, timedOut: true }` on timeout and kills the child.
- Quality requirements: read-only. No probe writes outside `os.tmpdir()`, and none writes at all in production (003 decision row 10 spirit).
- Verification seam: `probes.spec.ts` on a temp tree. It covers hoisted and nested `node_modules`, a scoped package, a missing package, `runNode` exit code and stdout capture with a tiny node script, the timeout path, and `spawn` called with `shell: false`. It runs on the three CI OSes.
- Files: CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/probes.ts`, `probes.spec.ts`

### 4. `all` checks

Each check is one file in `checks/`, exporting one `DoctorCheck`, with a sibling spec. Each spec covers at least the PASS case and every non-PASS case, plus the win32 and darwin variants where the check is platform-specific.

| id | Level when not met | Logic | Fix message |
| --- | --- | --- | --- |
| `node-version` | FAIL | `probes.nodeVersion` ≥ 22.9.0, compared numerically (no semver dependency) | "Install Node.js 22.9 or later (24 LTS recommended) from nodejs.org or your version manager." (`export-kit.mjs:24`) |
| `npx-cli` | FAIL | `probes.npxCli()` returns a path that `exists` | The resolver's own error text, which already says "Install npm with Node, or set NX_VIDEO_NPX_CLI to npx-cli.js" (`implementation-plan.md:212`) |
| `git-bash` | WARN (win32 with `env.MSYSTEM` set); PASS on win32 without it; SKIP on other OSes | env read | "nx-video executors run npm's npx-cli.js through node and are safe here. Git Bash cannot spawn npm's Windows npx shim, so run raw `npx hyperframes ...` commands from PowerShell." (`HANDOFF.md:77`). It must not contain the literal shim file name (D8). |

- Files: CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/checks/{node-version,npx-cli,git-bash}.ts` and a `.spec.ts` for each.

### 5. `remotion` checks

All expected versions come from `src/remotion/versions.ts`. These files import nothing from `src/hyperframes/**` (hard rule 4, enforced by review because the aggregator zone has no lint ban).

| id | Level | Logic | Fix message |
| --- | --- | --- | --- |
| `remotion-packages` | FAIL | For each name in `REMOTION_PACKAGES`, `findPackage(name, projectRoot)` exists with `version === REMOTION_VERSION`. One result lists every missing or mismatched name with the version found | "Run `nx g @hive-academy/nx-video:init` to install Remotion <REMOTION_VERSION> (exact pins). Preview the change with `--dry-run`." (approved `:417`) |
| `ffmpeg-static` | FAIL | `resolveModuleValue('ffmpeg-static')` is a string and `exists` | Missing module: "Run `nx g @hive-academy/nx-video:init`." Module present but binary missing: "Run `npm rebuild ffmpeg-static` (its install script downloads the binary; check proxy settings if it fails)." (`tts.mjs:50-54`) |
| `kokoro-js` | FAIL | `findPackage('kokoro-js')` | "Run `nx g @hive-academy/nx-video:init`." |
| `xterm-headless` | FAIL, only when `<projectRoot>` contains a `tui.cast` under its recordings folder or the project has a `tui-frames` target; SKIP otherwise | `findPackage('@xterm/headless')` at `XTERM_HEADLESS_VERSION` | same `init` fix |
| `sharp` | WARN | `findPackage('sharp')` | "`render` skips the device-frame crop probe without sharp. To enable it, run `npm install -D sharp@<SHARP_VERSION>`." (`render-all.mjs:403-418`) |
| `brand-alias` | FAIL when `remotion.config.ts` exists without `nx-video:brand`; SKIP when there is no `remotion.config.ts` | text search (A7) | The exact line to add, as 005 defines it. Until 005 lands, the text is "Add the nx-video brand alias to remotion.config.ts (see the studio generator template)." |
| `remotion-browser` | FAIL | A2: the platform-specific Chrome Headless Shell executable exists, or an override set in `remotion.config.ts` / the environment points to an existing file | "Run `npx remotion browser ensure` in the workspace root. It downloads Chrome Headless Shell for this OS. On Linux, also install the shared libraries listed at remotion.dev/docs/miscellaneous/linux-dependencies." |
| `playwright-chromium` | FAIL when `showcase.config.ts` exists in `projectRoot`; SKIP otherwise | `findPackage('@playwright/test')`, then `playwrightChromiumPath()` exists (A3) | "Run `npx playwright install chromium` (on Linux CI add `--with-deps`)." |
| `whisper-cache` | WARN | `<projectRoot>/.whisper` contains a `ggml-*.bin` file | "The first `caption` run downloads the whisper.cpp model into `.whisper/` (several hundred MB)." |
| `tts-key` | FAIL when `env.NX_VIDEO_TTS_ENGINE === 'elevenlabs'` and `ELEVENLABS_API_KEY` is absent from both `env` and `<projectRoot>/.env` (A6); SKIP when the engine is not elevenlabs | name lookup only | "Set ELEVENLABS_API_KEY in `<project>/.env` or your shell. Doctor never prints its value." |

- Files: CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/checks/remotion/{remotion-packages,ffmpeg-static,kokoro-js,xterm-headless,sharp,brand-alias,remotion-browser,playwright-chromium,whisper-cache,tts-key}.ts` and a `.spec.ts` for each.
- Notes:
  - `checks/remotion/` sits under `src/executors/doctor/**`, so it stays in the aggregator zone. It is not `src/executors/remotion/**` and does not trigger the Remotion zone.
  - `remotion-browser` and `playwright-chromium` specs assert the win32 (`.exe`), darwin arm64/x64 and linux paths through the injected `platform`/`arch`.

### 6. `hyperframes` checks

All expected versions come from `src/hyperframes/versions.ts`. These files import nothing from `src/remotion/**`. The version is the part after the last `@` of `HYPERFRAMES_PROJECT` / `SHADER_TRANSITIONS`, parsed at runtime so that no pin literal appears in doctor source.

| id | Level | Logic | Fix message |
| --- | --- | --- | --- |
| `hyperframes-packages` (offline pin drift) | FAIL | `findPackage('hyperframes')` and `findPackage('@hyperframes/shader-transitions')` from `projectRoot` match the plugin pins. One result lists each package as "project has X, nx-video pins Y" | "Run `nx g @hive-academy/nx-video:init --engines=hyperframes --dry-run` to see the pin change, then run it without `--dry-run`." (approved row) |
| `hyperframes-drift` (latest release) | WARN; SKIP unless `online: true`; SKIP if `hyperframes` is not installed | `runNode(<installed hyperframes bin JS>, ['upgrade', '--project', projectRoot, '--check'], { timeoutMs: 20000 })`. The pinned CLI is the locally installed package, never a registry `latest` spec (D3). A non-zero exit or timeout gives WARN "could not reach the registry" | "This project pins hyperframes <pin>. The check reports: <first lines of output>. nx-video moves its pin in a plugin release; update the plugin, then run `init --engines=hyperframes`." |
| `hyperframes-skills` | WARN | some entry matching `hyperframes*` exists in `<homedir>/.claude/skills` or `<workspaceRoot>/.claude/skills` (read-only) | "Run `npx skills add heygen-com/hyperframes`, then restart the agent session." (`context.md`) |
| `hyperframes-preview-lock` | WARN when a background preview is running; PASS when none is running; SKIP on non-win32, or when `hyperframes` is not installed or the probe times out (4 s) | `runNode(<hyperframes bin>, ['preview', '--status'], { cwd: projectRoot })` (A4) | "A background HyperFrames preview is running and locks this folder on Windows. Stop it before you move or delete the project: run `npx hyperframes preview --stop` from PowerShell in the project folder." (`HANDOFF.md:83`) |

- Files: CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/checks/hyperframes/{hyperframes-packages,hyperframes-drift,hyperframes-skills,hyperframes-preview-lock}.ts` and a `.spec.ts` for each.

### 7. Check registry (`checks/index.ts`)

- Purpose: the ordered list of checks. This is the one place 008 appends editor checks.
- Responsibilities: export `DOCTOR_CHECKS: readonly DoctorCheck[]` in this order: `all`, then `remotion`, then `hyperframes`. Add a unit assertion that the ids are unique and that every check has a scope in the schema enum.
- Dependencies: the check files only.
- Failure behaviour: not applicable (data).
- Verification seam: `checks/index.spec.ts`.
- Files: CREATE `/home/amun/projects/nx-video/packages/nx-video/src/executors/doctor/checks/index.ts`, `index.spec.ts`

### 8. e2e for AC3

- Purpose: prove AC3 against the published tarball on Verdaccio, on the three OSes.
- Responsibilities:
  - `test-utils.ts`: add `runNpxResult(args, cwd, userconfig)` returning `{ status, stdout, stderr }` without throwing. It uses the same spawn options as `runNpx` (`test-utils.ts:30-43`). `runNpx` stays as it is.
  - `nx-video.spec.ts`:
    - Update the existing assertions so that `executors.executors` has exactly the key `doctor` and `generators` is still `{}`.
    - Add a fixture `fixtures/studio-doctor/` with:
      - `project.json`: name `studio-doctor`, tags `["nx-video:studio"]`, target `doctor` with executor `@hive-academy/nx-video:doctor` and `cache: false` (D8)
      - a `remotion.config.ts` containing one comment line and no alias
      - none of the Remotion packages installed
    - Assert that `nx run studio-doctor:doctor` exits with a non-zero status, and that the output contains a `FAIL` line for `remotion-packages`, one for `kokoro-js` and one for `ffmpeg-static`, each followed by its fix line (`nx g @hive-academy/nx-video:init`).
    - Assert that `nx run studio-doctor:doctor --json` exits non-zero, that its `[`-line parses, and that it contains `level: "FAIL"` for `kokoro-js`.
  - The existing `kit-only` fixture stays.
- Verified contracts: `nx-video.spec.ts:13-55`, `test-utils.ts:29-50`, the Verdaccio flow (003 R6-R8, decision row 10).
- Dependencies: the built package via `^build` (`e2e` target, approved table at `implementation-plan.md:146`).
- Failure behaviour: not applicable (test).
- Quality requirements:
  - No writes outside the temp workspace. Registry auth goes through the temp `NPM_CONFIG_USERCONFIG` (003 row 10).
  - A full PASS run is not asserted in e2e, because that would install Remotion and download a browser. Unit tests cover PASS.
- Verification seam: `nx run nx-video-e2e:e2e` on Ubuntu locally, and on the CI matrix (Windows, macOS, Ubuntu; plus Nx 23.3.1 on Ubuntu, 003 D5).
- Files:
  - MODIFY `/home/amun/projects/nx-video/e2e/nx-video-e2e/src/nx-video.spec.ts`
  - MODIFY `/home/amun/projects/nx-video/e2e/nx-video-e2e/src/test-utils.ts`

### 9. Package README section

- Purpose: document the executor's options, the check list, the levels and the exit behaviour for users.
- Responsibilities:
  - Replace "This initial package has no generators or executors yet" (`packages/nx-video/README.md:3`) with a short package intro and a `doctor` section.
  - The section has the check table (id, scope, level, what it checks) and the `--json` / `--online` options.
  - Use neutral wording, with no client or product names (hard rule 6).
- Failure behaviour: not applicable.
- Verification seam: review. `pack-check` (010) later gates the tarball.
- Files: MODIFY `/home/amun/projects/nx-video/packages/nx-video/README.md`

## Integration architecture

- Data flow:
  1. `nx run <p>:doctor [--scope] [--json] [--online]`
  2. Nx validates the options against `schema.json` and calls `executor(options, context)`.
  3. Project and root resolution, then scope resolution (D7).
  4. The executor filters `DOCTOR_CHECKS` by `all` plus the scopes and runs them concurrently. Each check reads only through `DoctorProbes`.
  5. Results are put in registry order, then `report` writes text or JSON to stdout.
  6. The executor returns `{ success: !results.some(FAIL) }`, and Nx exits 0 or 1.
- State or persistence: none. Doctor writes nothing, and it is not cached (D8).
- External boundaries:
  - **Environment variables**: read by name. Values are never echoed.
  - **`.env`**: scanned line by line for a `KEY=` prefix only. It is never parsed into a process environment and never printed.
  - **The home directory**: read-only listing of `~/.claude/skills`.
  - **Child processes**: only `process.execPath` with an argument array, `shell: false`, `windowsHide: true` and an explicit timeout. The script path comes from a resolved `package.json#bin` under `node_modules`. `projectRoot` is passed as an argument, never interpolated into a command string.
  - **Network**: only with `online: true`, through the pinned local CLI.
- Failure and rollback:
  - A check error or timeout gives a FAIL result for that check only.
  - A missing project context gives a single FAIL.
  - There is nothing to roll back.
- Observability:
  - Every result carries `detail` with what was found: the version found, the path tried, or the error message.
  - `--json` is the machine-readable environment report (approved `implementation-plan.md:888`). Users attach it to bug reports.

## Architecture-level quality requirements

- Functional:
  - AC3: with any FAIL-level prerequisite missing, `nx run <p>:doctor` prints a FAIL line with a fix line and exits non-zero.
  - With only WARN or SKIP results, it exits 0.
  - Every WARN and FAIL result has a non-empty `fix`.
- Performance:
  - The default run takes under 5 s, with no network.
  - The per-check timeout is 3 s, and 4 s for the preview probe.
  - `online` may add up to 20 s.
- Security:
  - No secret value is ever logged. A spec asserts that the `tts-key` output does not contain a seeded key value.
  - No shell. No string-built command.
  - No write to any home config (003 decision row 10).
- Maintainability:
  - The `engine-isolation.spec.ts` pin and spawn checks stay green: no `hyperframes@`, `remotion@`, `@remotion/x@` or `npx.cmd` text in doctor source.
  - Remotion-scope check files do not import `src/hyperframes/**`, and the reverse also holds.
  - Doctor imports from engine trees only `versions.ts`. No version literal is duplicated.
- Testability:
  - Each check has a spec that covers PASS and each non-PASS outcome, on each relevant platform, through fake probes.
  - The executor spec covers aggregation, the exit mapping, crash and timeout isolation, scope inference and both output modes.
  - The probes spec runs against real temp trees on three OSes.
  - The e2e proves AC3 against the published tarball.

## Decisions

| # | Decision | Options | Evidence | Reversible |
| --- | --- | --- | --- | --- |
| D1 | Editor checks (CUDA, torch and torchvision match, `HF_HUB_DISABLE_SYMLINKS`, the Resolve bridge and scripts folder, Python, uv, system ffmpeg, the `.mcp.json` entry) are **not** built in 007. 008 adds them as an `editor` scope through new `checks/editor/*` files and a schema enum value | build them now behind an "editor exists" probe; defer to 008 | Approved plan `:926,933` and user decision row 14 (later than `context.md`, which dates from 2026-10-06). `TASK_2026_008_09fa/context.md:16` expects these checks to turn on with the editor. Facts are recorded at `c032b0f1e:tools/video-editor/CLAUDE.md:16,30-35,100-124` | Yes |
| D2 | The `ffmpeg` check for Remotion is the bundled `ffmpeg-static` only. System ffmpeg on PATH is an editor row (008) | accept bundled or system | The Remotion scripts require `ffmpeg-static` specifically (`tts.mjs:50-54`, `media.mjs:17-18`, `caption.mjs:41-43`), so a system ffmpeg does not help them | Yes |
| D3 | Pin drift: offline comparison of the project against the plugin pins is FAIL. The "latest release" comparison runs only with `--online`, by running the *locally installed pinned* CLI's `upgrade --check`, and is WARN | run an unpinned `latest` CLI; always online; drop the latest comparison | Hard rule 3; the pin-literal guard (`engine-zones.mjs:83`); the 5 s offline budget (`:901`); `context.md` asks for the latest version; the generated project docs say `upgrade --check` shows the delta (`agent-lanes-chat/CLAUDE.md:58`) | Yes |
| D4 | The preview lock is detected with `hyperframes preview --status` from the local bin, on win32 only | a PowerShell process query; always print a static note | `HANDOFF.md:83`; `agent-lanes-chat/CLAUDE.md:41-43`. A PowerShell query would be a command string and adds about 1 s | Yes |
| D5 | Component 0: 007 creates `src/shared/npx-cli.ts` (`npxCli` only) and both `versions.ts` (first-release constants plus `REMOTION_PACKAGES`) **only if** 004 has not landed, exactly to approved Components 1 and 2 | re-sequence 007 after 004; duplicate the constants inside doctor | The roadmap is binding: 007 depends only on 003 (`docs/roadmap.md`). Hard rule 3 needs one source of truth. 004 is in backlog | Yes. Needs user confirmation (Q1) |
| D6 | Levels are PASS, WARN, FAIL, SKIP. Only FAIL affects the exit code. SKIP marks checks that do not apply (platform or condition) | the approved three levels with silent omission | Without SKIP, a user cannot tell a passing conditional check from one that did not run | Yes |
| D7 | Scope resolution order: `--scope` option, then project tags `nx-video:studio`/`nx-video:hyperframes`, then the trigger files `remotion.config.ts`/`hyperframes.json` | tags only | Tags come from 005/009 generators, which do not exist yet (A1). The trigger files match the `createNodes` glob (`create-nodes.ts:3-6`) | Yes |
| D8 | User-facing text avoids the literal `npx.cmd` and any `<pkg>@<version>` text. Versions are interpolated from `versions.ts` at runtime | an exception entry in the zone policy | `FORBIDDEN_SPAWN_STRINGS` and the pin regex scan raw text (`engine-isolation.spec.ts:94-99`). Adding a policy exception would weaken a hard-rule guard | Yes |
| D9 | Installed versions are read by walking `node_modules/<name>/package.json` upward from the project root | `require.resolve('<name>/package.json')` | That `require.resolve` call fails on packages whose `exports` omits `./package.json`. A walk is exports-independent and works on all OSes | Yes |
| D10 | Doctor does not launch a browser. It checks the executable exists | launching headless Chrome | The 5 s budget. A launch on Linux CI without the shared libraries would be slow and flaky. The fix message names the Linux dependencies page | Yes |

## Open questions for the user

- Q1 (D5): 004 owns `src/shared/npx-cli.ts` and both `versions.ts`, yet the binding roadmap lets 007 run first. Options:
  - **(Recommended)** 007 creates them if absent, to the approved spec, and 004 consumes them.
  - Run 007 after 004 (this changes the roadmap order).
- Q2 (D1): Confirm that `context.md`'s editor checks (CUDA and torch, `HF_HUB_DISABLE_SYMLINKS`, the Resolve bridge) stay in 008, as the approved plan says. **(Recommended: yes.)**

## Risks

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| Windows: a fix message or comment contains the npx shim file name or `shell: true`, and the isolation test fails | M / L | D8. The executor spec asserts the git-bash fix text. CI runs the isolation test |
| Windows: the HyperFrames `bin` entry is not a plain JS file, so `node <bin>` fails | L / M | A4 check first. If it is not plain JS, the preview probe returns SKIP with the advice text. It never spawns the npx shim |
| Windows: paths with spaces (`C:\Program Files\nodejs`) in `npxCli` or `bin` | M / M | Argument arrays only. A probes spec runs with a temp dir containing a space |
| macOS: Chrome Headless Shell arch mismatch (Node under Rosetta reports `x64` on an arm64 machine) or Gatekeeper quarantine | M / M | The probe checks the folder for `process.arch` and also accepts the other mac arch folder with a WARN detail. The fix text mentions `npx remotion browser ensure`. Launch-time quarantine is out of scope (D10) |
| Linux: the browser exists but shared libraries are missing; doctor passes and then render fails | M / M | The fix and detail text point at the Linux dependencies page. Accepted gap, documented in the README |
| A2/A3 path facts are wrong for 4.0.484 or the installed Playwright | M / M | The implementer verifies against the installed packages before coding. The specs pin the expected paths per platform |
| 005/009 change tag names, the TTS env name or the alias text (A1, A6, A7) | M / L | D7 fallback. Each fact sits in one check file. The 005/009 reviewers check doctor's expectations |
| JSON output mixed with Nx task headers | M / L | Single-line array. Documented. The e2e parses the `[` line |
| The e2e assertion on the empty `executors.json` breaks | H / L | Component 8 updates it in the same change |

## Team-leader handoff

- Recommended executors:
  - Components 0-7 and 9: backend-developer, because they are Node executor code and docs.
  - Component 8: backend-developer, or devops-engineer if the e2e harness needs CI changes. None are expected; `ci.yml` already runs e2e on three OSes.
  - Then senior-tester (it runs the A2, A3 and A4 checks on real OSes where it can) and the reviewers.
- Complexity: MEDIUM. There are about 17 small checks and one orchestrator. The risk is in cross-platform paths and the assumptions, not in the logic.
- Dependencies and ordering (component level only):
  - Component 0 (if needed) comes before 3, 5 and 6.
  - Component 1 (`types.ts`, schema) comes before 2-7.
  - 3 (probes) comes before 2's real-probe wiring. Checks (4-6) only need `types.ts`.
  - 7 comes after 4-6.
  - 8 comes after 1, 2 and 7 build.
  - 9 can come at any point after 1.
- Parallel-safe work: the files in 4, 5 and 6 are disjoint from each other, and from 3, 8 and 9.
- Files affected:
  - CREATE (conditional, Component 0):
    - `packages/nx-video/src/shared/npx-cli.ts`
    - `packages/nx-video/src/shared/npx-cli.spec.ts`
    - `packages/nx-video/src/remotion/versions.ts`
    - `packages/nx-video/src/hyperframes/versions.ts`
  - CREATE, top level of `packages/nx-video/src/executors/doctor/`:
    - `schema.json`, `schema.d.ts`, `types.ts`
    - `executor.ts`, `executor.spec.ts`
    - `report.ts`, `report.spec.ts`
    - `probes.ts`, `probes.spec.ts`
  - CREATE, in `packages/nx-video/src/executors/doctor/checks/`:
    - `index.ts`, `index.spec.ts`
    - `node-version.ts`, `npx-cli.ts`, `git-bash.ts`, each with a `.spec.ts`
  - CREATE, in `checks/remotion/` (each with a `.spec.ts`):
    - `remotion-packages.ts`, `ffmpeg-static.ts`, `kokoro-js.ts`, `xterm-headless.ts`, `sharp.ts`
    - `brand-alias.ts`, `remotion-browser.ts`, `playwright-chromium.ts`, `whisper-cache.ts`, `tts-key.ts`
  - CREATE, in `checks/hyperframes/` (each with a `.spec.ts`):
    - `hyperframes-packages.ts`, `hyperframes-drift.ts`, `hyperframes-skills.ts`, `hyperframes-preview-lock.ts`
  - MODIFY:
    - `packages/nx-video/executors.json`
    - `packages/nx-video/README.md`
    - `e2e/nx-video-e2e/src/nx-video.spec.ts`
    - `e2e/nx-video-e2e/src/test-utils.ts`
    - (if 004 landed without it) `packages/nx-video/src/remotion/versions.ts` for `REMOTION_PACKAGES`
- Verification points:
  - Resolve A2, A3 and A4 against the installed packages before writing those three checks. Record the result in the batch report.
  - Confirm `ExecutorContext` fields at `nx/dist/src/config/misc-interfaces.d.ts:237-273` on Nx 24.0.1, and on 23.3.1 through the e2e leg.
  - Commands that must pass:
    - `npx nx run nx-video:lint`
    - `npx nx run nx-video:test` (includes `engine-isolation.spec.ts` and `engine-zones-lint.spec.ts`)
    - `npx nx run nx-video:typecheck`
    - `npx nx run nx-video:build`
    - `npx nx run nx-video-e2e:e2e`
    - `node tools/guards/no-media.mjs` before each commit (003 R11)
  - The Windows and macOS legs are proven only by CI after a push (003 R12). Do not report them as passing from a Linux run.
  - Git staging must not include `.gitignore`, `.claude/`, `.codex/`, `.mcp.json`, `.ptah/analysis/`, `.ptah/harness/`, `.ptah/subagent-handoffs/` or `*.harvested.json`.
