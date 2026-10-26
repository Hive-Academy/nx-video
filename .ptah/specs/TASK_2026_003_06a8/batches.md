# Batches - TASK_2026_003_06a8

Total tasks: 17 | Batches: 6 | Complete: 3/6

Plan source: `../TASK_2026_002_dcb6/implementation-plan.md`, approved by the user on 2026-10-26 (this task's Gate 2). Binding sections: 98–198 (layout, projects, package.json), 517–560 (G1 only, plus the G2 media block for the root `.gitignore`), 750–768 (createNodes, stub only), 769–779 (preset skeleton, `create-nx-video` only), 780–815 (`ci.yml` only), 890–934 (quality, order of work row 003), 1054–1069 (lane constraints).

Scope is plan row 003 and nothing else. No engine code, no executors or generators beyond the empty manifests, no copied Ptah files, no `src/shared`, `src/manifest`, `src/capture`, `versions.ts`, preset generator, G2 CI checks, G3–G5, `release.yml` or `render-smoke.yml`.

## Plan validation

Status: PASSED WITH RISKS

### Decisions

| # | Decision | Options | Evidence | Reversible |
|---|---|---|---|---|
| D1 | Test runner is Vitest for every project, run through an explicit `nx:run-commands` target that calls the installed `vitest` binary (`vitest run --config <projectRoot>/vitest.config.mts`); `lint` is likewise `nx:run-commands` calling the installed `eslint` (decisions.md row 6: Nx 24's `@nx/vitest` and `@nx/eslint` ship empty executor maps). Guard scripts under `tools/` use `node --test` (no extra deps) | Jest (`@nx/jest`); Vitest | The plan leaves `@nx/vite\|jest` open (line 102). `@nx/plugin@24.0.1` has `peerDependencies: {"@nx/vitest": "24.0.1"}` (`npm view`, 2026-10-26). The zone table is ESM (`tools/eslint/engine-zones.mjs`, line 165) and must be imported by both the flat ESLint config and the isolation test; Jest's CJS transform needs `--experimental-vm-modules` for that, Vitest does not. The e2e generator's Vitest variant is verified (`research-part-c-nx.md:30`: `maxWorkers: 1, isolate: false`). | Yes, before 004 adds specs |
| D2 | No npm workspaces. Root `package.json` holds every devDependency; package-level `package.json` files are publish manifests only. Explicit `project.json` targets, no inference plugins in `nx.json` | npm workspaces + TS project references; integrated layout | Keeps `package-lock.json` owned by Batch 1 so batches stay file-disjoint; the plan names `project.json` per project (line 111) and explicit targets (lines 142–147). | Yes |
| D3 | `@hive-academy/nx-video/package.json` in 003 exports only `"."`, `./generators.json`, `./executors.json`, `./package.json`; peers only `nx` and `@nx/devkit` (`>=23 <25`); dependency `tslib`. The `./manifest`, `./capture`, `./remotion` exports and the optional engine peers land with the tasks that create them (004/005/009) | Declare all exports and peers now; add them with their code | An export pointing at a missing file breaks `npm pack` consumers and the 003 e2e install; scope rule "nothing from 004+". | Yes |
| D4 | The createNodes stub uses the plan's final glob `**/{remotion.config.ts,hyperframes.json,kit.json}` and returns `[]` (no targets) | Return no targets; infer placeholder targets | Plan line 1092: Component 17 needs the executor ids to exist; none exist in 003. | Yes (005/009 fill it) |
| D5 | Nx version matrix: e2e on Nx 24.0.1 on all three OSes, plus one extra e2e run on Nx 23.3.1 on ubuntu only | 23.3.1 on all three OSes; ubuntu only | Plan line 1068 costs the 23.3.1 leg as "about one extra e2e run per CI build"; line 756 asks for "once on the minimum supported Nx". | Yes, widen the matrix by PR |
| D6 | The conventional-commit check is a dependency-free script `tools/scripts/check-commits.mjs` run as a PR-only CI job, not commitlint | `@commitlint/cli`; own script | Avoids a root devDependency change outside Batch 1 and a shell spawn; CLAUDE.md "Git" names Conventional Commits only. | Yes |
| D7 | The root `.gitignore` change is committed as a hunk only: the team-leader stages the G2 lines with `git apply --cached` of a patch that excludes the user's uncommitted `# ptah:harness:begin … end` block | Commit the whole file; stage only our hunk | The user modified `.gitignore` and has not committed it (orchestrator instruction). | Yes |
| D8 | G1 lives in `tools/guards/no-media.mjs` as an exported pure function plus a thin CLI; its fixtures are JSON path/size lists, never real media | Fixture repo with media; path/size lists | Hard rule 1 forbids committing media even as a fixture; plan line 519 defines G1 over `git ls-files`. | Yes |

### Assumptions

- A-1: `create-nx-workspace@24.0.1` and `@23.3.1` can create an empty npm workspace non-interactively (`--preset=apps --nxCloud=skip --packageManager=npm --no-interactive`) from behind Verdaccio's npmjs uplink — unverified; Task 5.2 runs both locally on Linux.
- A-2: `nx release version` + `nx release publish --tag e2e` from the generated `start-local-registry.ts` works with the `nx.json` release block (fixed, both projects) before either package has a real version — unverified; Task 5.1 checks it.
- A-3: `package-lock.json` exceeds 1 MB — FALSE (Batch 1: 483,287 bytes); `large-files.allow` stays empty.
- A-4: `@nx/js:setup-verdaccio` and `@nx/plugin:create-package` can be run or hand-transcribed without side effects on files owned by other batches — `create-package` adds a `preset` generator to the plugin when missing (`research-part-c-nx.md:27`); Task 4.1 must not let it write `generators.json` or `src/generators/**`.
- A-5: Nx 24.0.1 `CreateNodes` is the tuple `[pattern, (files, options, context) => CreateNodesResultArray]` — verified in `research-part-c-nx.md:21`; Task 2.3's `typecheck` re-proves it against the installed `@nx/devkit`.

| Risk | Severity | Mitigation |
|---|---|---|
| R1 Overwriting the user's uncommitted `.gitignore` harness block | HIGH | Task 1.1 edits in place (append the G2 block, keep every existing line); D7 hunk-only staging at commit |
| R2 The isolation test passes vacuously because 003 has no engine code | HIGH | Task 3.3 includes a self-test on a synthetic temp tree that must report a cross-engine static, dynamic and `require` import |
| R3 Lint fixtures are outside the zone globs, so linting them directly yields 0 errors | HIGH | Task 3.4 lints fixture text with `ESLint#lintText` and a `filePath` inside `packages/nx-video/src/remotion/` |
| R4 Fixtures with deliberately broken imports fail the root lint or typecheck | MEDIUM | Task 1.2 root ESLint ignores `test-fixtures/**`; Task 2.2 `tsconfig.*.json` exclude it |
| R5 Version-literal and `npx.cmd`/`shell: true` assertions flag the zone module, the spec itself, or the CLAUDE.md-derived guard text | MEDIUM | Task 3.3 excludes `*.spec.ts`, `tools/eslint/**`, `test-fixtures/**` and generator `files/**`, and asserts the exclusion list is exact |
| R6 Spawning `npx` from the e2e on Windows / Git Bash (hard rule 5) | HIGH | Task 5.2 spawns `process.execPath` with npm's `npx-cli.js` resolved from `process.execPath`'s npm, argument array, no shell |
| R7 Generated `start-local-registry.ts` splits argv with `.split(' ')` and writes the user `.npmrc` | MEDIUM | Task 5.1 keeps the default space-free storage path; the stop script removes the token; the e2e workspace is created under `os.tmpdir()`, outside the repo |
| R8 The temp e2e workspace is nested in this repo and Nx resolves the parent workspace | MEDIUM | Task 5.2 creates it under `os.tmpdir()` |
| R9 `create-nx-video` bin points at a preset that does not exist until 012 | LOW | Task 4.2 README says skeleton; the 003 e2e does not run `create-nx-video`; the bin unit test mocks `createWorkspace` |
| R10 A later batch needs a devDependency not added in Batch 1 | MEDIUM | Exception: a later batch may append devDependencies to root `package.json`/`package-lock.json` only through `npm install -D <pkg>@<exact>`, and must list them in its report; the team-leader stages those two files with that batch |
| R11 G1 run on the real repo misses new files that are not yet in the index | MEDIUM | The team-leader runs `node tools/guards/no-media.mjs` after `git add` and before `git commit` of each batch |
| R12 Windows and macOS CI legs cannot run before `gh` auth and a push | HIGH | Listed under Deferred verification; not reported as a pass |

### Edge cases

- `.gitignore` already ignores `*.mp4`, `*.mov`, `*.webm`, `*.wav`, `*.mp3`, `.env`, `video-output/` — handled in Task 1.1 (add only missing G2 lines, no duplicates).
- `.gitignore` ignores `out/` and `.github/agents/`, `.github/skills/` — handled in Task 6.1 (`.github/workflows/` and `.github/pull_request_template.md` are not matched; the team-leader confirms with `git check-ignore`).
- Tracked paths with non-ASCII or spaces — handled in Task 1.3 (`git ls-files -z`).
- A tracked file deleted from the working tree — handled in Task 1.3 (skipped with a stderr note, not a crash).
- Upper-case media extensions (`.MP4`) — handled in Task 1.3 (case-insensitive match).
- Images under `docs/images/` allowed, elsewhere refused — handled in Task 1.3.
- Computed `import(x)` and `require(x)` inside an engine zone — handled in Task 3.2 (error) and Task 3.3.
- A relative import that reaches a zone through `..` — handled in Task 3.3 (resolve, then match).
- Malformed or unreadable trigger file passed to the createNodes stub — handled in Task 2.3 (stub never reads or throws).
- PR with a merge commit or a `fixup!` commit — handled in Task 6.2 (merge commits skipped; `fixup!`/`squash!` refused).

## Deferred verification (cannot be verified locally on Linux)

These are not passes. Each stays open until a pushed CI run proves it:

1. `ci.yml` on `windows-latest` and `macos-latest` (AC1), including `npm ci`, lint/test/typecheck/build and the e2e install of the empty plugin.
2. The whole `ci.yml` run on GitHub, including ubuntu: `gh` is not authenticated on this host and nothing is pushed (decisions.md row 3).
3. The PR-only conventional-commit job against a real `pull_request` event.
4. Branch protection requiring the three matrix jobs (plan line 813) — a repository setting, 013 or the user.
5. The Git Bash executor e2e proof of hard rule 5 (plan line 785): no executor exists until 005. In 003 the Git Bash leg only proves `npm ci` + Nx + e2e spawn paths under `defaults.run.shell: bash` on Windows.
6. Nx 23.3.1 on Windows and macOS: not in the matrix by D5.

Local evidence on Linux for each batch is the scoped command below plus, for Batch 5, the e2e on both Nx versions.

## Commit rules (team-leader)

- Branch `task/2026-003-scaffold` only. Never touch `main`, never change git config.
- `git -c user.name=Abdallah -c user.email=abdallah.khalil.nada@gmail.com commit`, Conventional Commits (`build(workspace): ...`, `feat(nx-video): ...`, `ci: ...`), body ends with the attribution trailer.
- Stage explicit paths only. Never stage `.claude/`, `.codex/`, `.mcp.json`, `.ptah/analysis/`, `.ptah/harness/`, `.ptah/subagent-handoffs/`, `*.harvested.json`, `subagent-handoff-*.md`, or other task folders. The orchestrator's `context.md`/`task.md`/`decisions.md` in this folder are staged only when the orchestrator says so (it did for Batch 2).
- `.gitignore`: hunk-only staging (D7). Check with `git diff --cached .gitignore` that the harness block is not staged.
- After staging and before committing: `node tools/guards/no-media.mjs` (from Batch 1 on) must pass.
- `batches.md` is staged with each batch commit.

## Batch 1: Workspace root and guard G1 — COMPLETE (commit 16030ef)

- Recommended executor: CLI lane, Gate 0.1 roster codex (spawn with model `gpt-6-sol`, decisions.md row 5); capability: Node/Nx workspace config
- Execution mode: sequential
- Fallback order: other family same capability -> same family other provider/model -> devops-engineer subagent
- Subagent reason: N/A
- Review family: phase review by Ollama Code `glm-5.3:cloud` (ollama-cloud family, different from the codex implementer)
- Rationale: every later batch depends on the root config and lockfile; coupled files, one owner
- Tasks: 3 | Depends on: none
- Phase: scaffold | Phase review: code-logic, plus style for the new public package surface (after Batch 6)

Files (14): `/home/amun/projects/nx-video/package.json`, `/home/amun/projects/nx-video/package-lock.json`, `/home/amun/projects/nx-video/nx.json`, `/home/amun/projects/nx-video/project.json`, `/home/amun/projects/nx-video/tsconfig.base.json`, `/home/amun/projects/nx-video/eslint.config.mjs`, `/home/amun/projects/nx-video/.gitattributes`, `/home/amun/projects/nx-video/.gitignore` (MODIFY, merge), `/home/amun/projects/nx-video/.verdaccio/config.yml`, `/home/amun/projects/nx-video/tools/guards/no-media.mjs`, `/home/amun/projects/nx-video/tools/guards/no-media.spec.mjs`, `/home/amun/projects/nx-video/tools/guards/large-files.allow`, `/home/amun/projects/nx-video/test-fixtures/guards/no-media/clean.json`, `/home/amun/projects/nx-video/test-fixtures/guards/no-media/dirty.json`

### Task 1.1: Root workspace config — COMPLETE

- Files: `package.json`, `package-lock.json`, `nx.json`, `tsconfig.base.json`, `.gitattributes`, `.gitignore` (all under `/home/amun/projects/nx-video/`)
- Plan reference: implementation-plan.md:100–104, 140–153, 520–539, 807–811
- Pattern to follow: `@nx/plugin@24.0.1` / `@nx/js@24.0.1` generator output (do not run `create-nx-workspace` in this non-empty repo; transcribe or use `nx init`)
- Quality requirements:
  - root `package.json`: `"private": true`, name `@hive-academy/nx-video-source`, `"engines": {"node": ">=22.9"}` (plan line 1063), no `workspaces` (D2). Exact devDependencies: `nx`, `@nx/plugin`, `@nx/js`, `@nx/devkit`, `@nx/eslint`, `@nx/eslint-plugin`, `@nx/vitest` all `24.0.1`; `vitest`, `typescript`, `eslint`, `typescript-eslint`, `verdaccio`, `tslib`, `@types/node`, `create-nx-workspace@24.0.1` (for `create-nx-video` typecheck and tests) at the versions Nx 24.0.1 resolves, saved exact (no `^`).
  - `nx.json`: `namedInputs` (`default`, `production` excluding `**/*.spec.ts`, `**/*.spec.mjs`, `test-fixtures/**`); `targetDefaults` for `build` (`dependsOn: ["^build"]`, cache), `lint`, `test`, `typecheck` (cache); no inference `plugins` (D2); `release` block exactly as plan lines 807–811 (`projects: ["nx-video","create-nx-video"]`, `projectsRelationship: "fixed"`, `version.conventionalCommits: true`, `changelog.workspaceChangelog: {createRelease: "github"}`, `git.commitMessage: "chore(release): {version}"`). `nxCloud` off.
  - `.gitattributes`: `* text=auto`, `*.mjs`, `*.ts`, `*.tsx`, `*.html`, `*.json`, `*.yml` `eol=lf`.
  - `.gitignore`: MERGE into the current working-tree file. Keep every existing line, including the uncommitted `# ptah:harness:begin … # ptah:harness:end` block, in place and byte-identical. Add only the G2 lines (plan 522–538) that are missing, as one new block above the harness block, plus `tmp/local-registry/` coverage if `tmp/` is ever removed (it is present now). No duplicates.
- Validation notes: R1, R10, D2, A-3
- Implementation details: `npm install` once to produce the lockfile; `npx nx --version` must print 24.0.1.

### Task 1.2: Root lint config, root project and Verdaccio config — COMPLETE

- Depends on: Task 1.1
- Files: `eslint.config.mjs`, `project.json`, `.verdaccio/config.yml`
- Plan reference: implementation-plan.md:105–107, 146–153
- Pattern to follow: `@nx/eslint` flat config (`@nx/eslint-plugin` `flat/base`, `flat/typescript`, `flat/javascript`); `@nx/js:setup-verdaccio` output (`research-part-c-nx.md:34`)
- Quality requirements:
  - `eslint.config.mjs`: ignores `**/dist`, `**/node_modules`, `tmp/**`, `test-fixtures/**`, `**/files/**` under `src/generators` (R4). `@nx/enforce-module-boundaries` with `depConstraints`: `type:plugin` → `[]` (no workspace deps); `type:preset` → `[]` (reaches the plugin only through npm); `type:e2e` → `["type:plugin","type:preset"]`.
  - root `project.json` (name `nx-video-source`): `local-registry` (`@nx/js:verdaccio`, port 4873, `config: .verdaccio/config.yml`, `storage: tmp/local-registry/storage`, continuous); `no-media` (`nx:run-commands`, `node tools/guards/no-media.mjs`); `test` (`nx:run-commands`, `node --test "tools/**/*.spec.mjs"`) so `run-many -t test` covers the guard and later tools specs.
  - `.verdaccio/config.yml`: storage `../tmp/local-registry/storage`, uplink npmjs, publish allowed for `@hive-academy/*` and `create-nx-video`, no auth beyond the generated defaults.
- Validation notes: R4, R7
- Implementation details: none of these targets run engine code.

### Task 1.3: Guard G1 no-media with fixtures — COMPLETE

- Depends on: Task 1.2
- Files: `tools/guards/no-media.mjs`, `tools/guards/no-media.spec.mjs`, `tools/guards/large-files.allow`, `test-fixtures/guards/no-media/clean.json`, `test-fixtures/guards/no-media/dirty.json`
- Plan reference: implementation-plan.md:519, 558, 1065
- Pattern to follow: plan line 519 (rule), CLAUDE.md hard rules 1 and 5
- Quality requirements:
  - `no-media.mjs` exports `findViolations(entries, allowList)` where `entries` is `{path, size}[]` (forward-slash paths) and returns `{path, reason}[]`; exports `parseAllowList(text)`. Rules: extension (case-insensitive) in `.mp4 .webm .mov .mkv .m4v .wav .mp3 .m4a .glb .gltf` (MEDIA_EXT from `export-kit.mjs:66` ∪ `{.glb,.gltf}`; list it once as a constant with a `Source: Hive-Academy/ptah-extension@e0ca51e6e:<path>` comment naming the origin line); `.png .jpg .jpeg .svg .gif .webp` outside `docs/images/`; size > 1 048 576 bytes unless the exact path is in `large-files.allow` (lines `path  # reason`; blank and `#` lines ignored; a line without a reason is a parse error).
  - CLI: `git ls-files -z` spawned with `spawnSync('git', ['ls-files','-z'], {shell:false})`; sizes from `fs.statSync`; ENOENT → skip with a stderr note; exit 1 with one line per violation; exit 0 with a one-line summary. `--entries <json-file>` reads a fixture list instead of git (for the spec).
  - Fixtures are text JSON only: `clean.json` (normal sources, `docs/images/x.png`, a 2 MB allowlisted path) passes; `dirty.json` holds one entry per rule (`a.mp4`, `B.WAV`, `m.glb`, `src/logo.png`, a 2 MB unlisted `big.bin`) and must yield exactly those violations.
  - `no-media.spec.mjs` (`node:test`): clean passes, dirty fails with the exact reasons, the CLI exit codes for both fixtures (spawned as `process.execPath` + arg array), allowlist parse error.
  - `large-files.allow`: header comment saying it changes only by a reviewed PR; add `package-lock.json  # npm lockfile, generated` only if A-3 holds.
- Validation notes: D8, R11, A-3; no media file may be created, even in a temp dir
- Implementation details: pure ESM, Node builtins only.

### Batch 1 verification

- Every listed file exists; `git diff .gitignore` shows the harness block unchanged and only G2 lines added.
- `cd /home/amun/projects/nx-video && npm ci 2>&1 | tail -5 && npx nx --version && npx nx run-many -t test -p nx-video-source 2>&1 | tail -20 && npx eslint eslint.config.mjs tools 2>&1 | tail -10`
- Team-leader, after staging: `node tools/guards/no-media.mjs` exits 0.
- Edge cases: case-insensitive extensions, ENOENT skip, `docs/images/` exception, `.gitignore` no-duplicate merge.
- Result (team-leader, 2026-10-26): files verified on disk; `npm ci` 871 packages, Nx v24.0.1, `test` 4/4 pass (`--skip-nx-cache`), ESLint exit 0, G1 exit 0 after staging. `.gitignore` staged hunk-only by `git apply --cached` (D7); the harness block stays unstaged. Executor: codex `gpt-6-sol`. Pinned devDependencies: Nx family 24.0.1, `vitest@4.1.12`, `typescript@6.0.3`, `eslint@9.39.5`, `typescript-eslint@8.72.0`, `verdaccio@6.11.1`, `tslib@2.8.1`, `@types/node@24.19.2`.

## Batch 2: `@hive-academy/nx-video` empty plugin and createNodes stub — COMPLETE (commit 6ebd42d)

- Recommended executor: CLI lane, Gate 0.1 roster codex (model `gpt-6-sol`); capability: Nx plugin TypeScript scaffold
- Execution mode: sequential
- Fallback order: other family same capability -> same family other provider/model -> devops-engineer subagent
- Subagent reason: N/A
- Review family: phase review by Ollama Code `glm-5.3:cloud`
- Rationale: one project, its config and its single stub; the lint config for zones is held back to Batch 3 so this batch lints with the root config
- Tasks: 3 | Depends on: Batch 1
- Phase: scaffold | Phase review: as Batch 1

Files (15 + 3 root, R10/row 7): `/home/amun/projects/nx-video/NOTICE`, root `package.json`/`package-lock.json` (`jsonc-eslint-parser@2.4.2` exact; the lock also drops one `extraneous` `vitest/node_modules/yaml` entry, an npm prune), root `eslint.config.mjs` (`**/*.json` parser block), and under `/home/amun/projects/nx-video/packages/nx-video/`: `package.json`, `project.json`, `generators.json`, `executors.json`, `README.md`, `LICENSE`, `NOTICE`, `tsconfig.json`, `tsconfig.lib.json`, `tsconfig.spec.json`, `vitest.config.mts`, `src/index.ts`, `src/plugin/create-nodes.ts`, `src/plugin/create-nodes.spec.ts`

### Task 2.1: Package manifest, empty generator/executor manifests, license files — COMPLETE

- Files: `packages/nx-video/{package.json,generators.json,executors.json,README.md,LICENSE}`, root `NOTICE`, `packages/nx-video/NOTICE`
- Plan reference: implementation-plan.md:111, 182–197, 907
- Pattern to follow: `@nx/plugin:plugin` output for Nx 24.0.1
- Quality requirements:
  - `package.json`: name `@hive-academy/nx-video`, version `0.0.0`, `license: MIT`, `type: commonjs`, `main`/`types` → `./src/index.js`/`.d.ts`, `exports` per D3, `generators: ./generators.json`, `executors: ./executors.json`, `peerDependencies` `nx` and `@nx/devkit` `>=23 <25`, `dependencies` `tslib`, `files` build output only, `repository`/`homepage` Hive-Academy, `publishConfig.access: public`. No engine peers (D3).
  - `generators.json` `{"generators": {}}`, `executors.json` `{"executors": {}}`.
  - `LICENSE`: copy of the root MIT `LICENSE`.
  - root `NOTICE` and the package `NOTICE` (identical): project copyright, the Apache-2.0 attribution for HyperFrames (research Q3, `TASK_2026_001_3d3a/research-part-b-licenses.md`; read its NOTICE wording there), and the Remotion license notice (Remotion is not free for all users; company license link). No client or product names (hard rule 6).
  - `README.md`: package purpose, "no generators or executors yet", the Remotion license notice, a link to `NOTICE`.
- Validation notes: D3, hard rule 6
- Implementation details: none.

### Task 2.2: Project and TypeScript/Vitest config — COMPLETE

- Depends on: Task 2.1
- Files: `packages/nx-video/{project.json,tsconfig.json,tsconfig.lib.json,tsconfig.spec.json,vitest.config.mts}`
- Plan reference: implementation-plan.md:142–147, 155–165
- Quality requirements:
  - `project.json`: name `nx-video`, tags `type:plugin`, `scope:public`; `build` `@nx/js:tsc` → `dist/packages/nx-video`, assets exactly as plan line 144 (globs that match nothing today are kept so later tasks do not edit this target); `lint` `nx:run-commands` running `eslint packages/nx-video` (row 6; JSON files linted through the root `jsonc-eslint-parser` block, row 7) with `dependsOn: [{"projects": ["nx-video-source"], "target": "no-media"}]` (G1 as a lint dependency, plan line 519); `test` `nx:run-commands` running `vitest run --config packages/nx-video/vitest.config.mts` (row 6); `typecheck` `nx:run-commands` running `tsc --noEmit` for lib and spec configs.
  - `tsconfig.*.json` extend `../../tsconfig.base.json`, `strict`, exclude `**/files/**` and never include `../../test-fixtures/**` (R4); spec config may include `../../tools/eslint/*.mjs` for Batch 3 (`allowJs` + `checkJs: false`).
  - `vitest.config.mts`: node environment, `include: ['src/**/*.spec.ts']`.
- Validation notes: R4

### Task 2.3: createNodes stub and entry point — COMPLETE

- Depends on: Task 2.2
- Files: `packages/nx-video/src/index.ts`, `src/plugin/create-nodes.ts`, `src/plugin/create-nodes.spec.ts`
- Plan reference: implementation-plan.md:750–767
- Quality requirements:
  - `export const createNodes: CreateNodes = ['**/{remotion.config.ts,hyperframes.json,kit.json}', (files, options, context) => []]` typed against the installed `@nx/devkit`; export name `createNodes` only (no `createNodesV2`); no plugin options; no file reads; never throws (D4).
  - `src/index.ts` re-exports `createNodes` and nothing engine-specific.
  - Spec: `createNodes[1](files, undefined, context)` returns `[]` for an empty list and for one file of each trigger kind; the glob string equals the plan's; no absolute paths in output.
- Validation notes: A-5, D4

### Batch 2 verification

- Every listed file exists; `generators.json`/`executors.json` are empty maps.
- `cd /home/amun/projects/nx-video && npx nx run-many -t lint,test,typecheck,build -p nx-video 2>&1 | tail -25`
- `ls dist/packages/nx-video` shows `package.json`, `generators.json`, `executors.json`, `README.md`, `LICENSE`, `NOTICE`, `src/index.js`.
- Result (team-leader, 2026-10-26): 14 package files + root `NOTICE` verified on disk; D3 exports/peers/deps exact, `tslib` `2.8.1` exact; generator/executor maps empty; `LICENSE`/`NOTICE` byte-identical to root; NOTICE carries only the project copyright, the HyperFrames Apache-2.0 attribution (HeyGen, Inc., per research-part-b) and the Remotion license notice. D4 glob exact, stub returns `[]`, no reads. R4: all three tsconfigs exclude `**/files/**` and `../../test-fixtures/**`. No `npx.cmd`, `shell: true` or range pins in `packages/`. Gate `run-many -t lint,test,typecheck,build -p nx-video --skip-nx-cache` exit 0 (5/5 tests); dist layout as listed; G1 exit 0 after staging. Executor: codex `gpt-6-sol` (first run + one resume). Lint/test use `nx:run-commands` (row 6). Known gap passed to Batch 3: the lint command resolves only the root ESLint config (Task 3.2 wiring note).

## Batch 3: Engine-zone lint and isolation test — COMPLETE

- Recommended executor: CLI lane, Gate 0.1 roster codex (model `gpt-6-sol`); capability: ESLint flat config and TypeScript compiler API
- Execution mode: sequential
- Fallback order: other family same capability -> same family other provider/model -> devops-engineer subagent
- Subagent reason: N/A
- Review family: phase review by Ollama Code `glm-5.3:cloud`
- Rationale: the zone table, the lint blocks and the test must read one module and agree; one owner
- Tasks: 4 | Depends on: Batch 2
- Phase: scaffold | Phase review: as Batch 1

Files (9): `/home/amun/projects/nx-video/tools/eslint/engine-zones.mjs`, `/home/amun/projects/nx-video/tools/eslint/engine-zones.d.mts`, `/home/amun/projects/nx-video/packages/nx-video/eslint.config.mjs`, `/home/amun/projects/nx-video/packages/nx-video/project.json` (MODIFY, `lint` target options only), `/home/amun/projects/nx-video/packages/nx-video/src/engine-isolation.spec.ts`, `/home/amun/projects/nx-video/packages/nx-video/src/engine-zones-lint.spec.ts`, `/home/amun/projects/nx-video/test-fixtures/lint/static-cross-engine.ts`, `/home/amun/projects/nx-video/test-fixtures/lint/dynamic-cross-engine.ts`, `/home/amun/projects/nx-video/test-fixtures/lint/require-cross-engine.ts`

### Task 3.1: Zone table module — COMPLETE

- Files: `tools/eslint/engine-zones.mjs`, `tools/eslint/engine-zones.d.mts`
- Plan reference: implementation-plan.md:155–180
- Quality requirements: export the seven zone rows of the table at lines 167–175 as data (zone globs relative to `packages/nx-video/`, allowed, forbidden, forbidden packages such as node builtins / `@nx/devkit` / `src/shared/**` for the studio zone, and the one allowed studio file `src/remotion/studio/lib/qrcode.mjs` for scripts); the message string from line 160; the pin-literal patterns (`hyperframes@`, `remotion@`, `@remotion/`) and the allowed files (`src/remotion/versions.ts`, `src/hyperframes/versions.ts`, generator `files/**`); the forbidden spawn strings (`npx.cmd`, `shell: true`, `execFileSync('npx'`). Pure data, no imports. `.d.mts` types it.
- Validation notes: one source of truth (plan line 165)

### Task 3.2: Lint blocks per zone — COMPLETE

- Depends on: Task 3.1
- Files: `packages/nx-video/eslint.config.mjs`
- Plan reference: implementation-plan.md:157–162
- Quality requirements: extends the root config; builds one flat-config block per zone from the table (`files` `**/*.{ts,tsx,mjs,js}` in the zone; `ignores` generator `files/**`); core `no-restricted-imports` `patterns` for forbidden zones (covers `import`, `import type`, `export … from`); core `no-restricted-syntax` selectors for `ImportExpression` with a matching literal source, `ImportExpression` with a non-literal source, `CallExpression[callee.name='require']` with a matching or non-literal first argument; a literal selector for the pin strings outside `versions.ts`; every message names hard rule 4. Add `@nx/dependency-checks` for `package.json` only if it passes on the empty package.
- Lint target wiring (added at Batch 2 acceptance): `packages/nx-video/project.json` `lint` is `nx:run-commands` (decisions.md row 6) running `eslint packages/nx-video` from the workspace root. ESLint 9.39.5 resolves `eslint.config.mjs` from the cwd, so as committed it would load only the root config and silently skip the zone blocks. Change only that target's `options` so the package config is the one loaded (`"cwd": "packages/nx-video"`, `"command": "eslint ."`, or an explicit `--config packages/nx-video/eslint.config.mjs`); keep `dependsOn` G1. Prove it with `npx eslint --print-config packages/nx-video/src/index.ts` (or the cwd equivalent) showing a zone rule, and by the Task 3.4 spec. No other edit to `project.json`.
- Validation notes: R3

### Task 3.3: Isolation test backstop — COMPLETE

- Depends on: Task 3.1
- Files: `packages/nx-video/src/engine-isolation.spec.ts`
- Plan reference: implementation-plan.md:163, 177–180, 914
- Quality requirements: walks `packages/nx-video/src/**/*.{ts,tsx,mjs}` (excluding `*.spec.ts` and generator `files/**`), parses imports with the TypeScript compiler API (static, `import type`, `export … from`, dynamic `import()`, `require()`), resolves relative specifiers to files, normalises separators (Windows), and checks each resolved path against the zone table; asserts no pin literal outside the allowed files and no forbidden spawn string. A self-test writes a synthetic tree into a temp dir (Remotion file statically, dynamically and via `require` importing a HyperFrames file, plus one `..`-path escape) and asserts four violations — the scanner takes a root argument so both runs share the code (R2). The exclusion list is asserted exact (R5).
- Validation notes: R2, R5

### Task 3.4: Lint fixtures and fixture test — COMPLETE

- Depends on: Task 3.2
- Files: `test-fixtures/lint/{static,dynamic,require}-cross-engine.ts`, `packages/nx-video/src/engine-zones-lint.spec.ts`
- Plan reference: implementation-plan.md:136, 165, 914
- Quality requirements: each fixture is a few lines of text with one cross-engine import (static `import`, `import()` literal, `require()`); the spec reads each fixture and calls `new ESLint({cwd: packages/nx-video, overrideConfigFile: eslint.config.mjs}).lintText(text, {filePath: 'src/remotion/__fixture__.ts'})` and expects exactly one error per fixture (three total) with the hard-rule-4 message; a fourth case lints an allowed `src/shared` import and expects zero.
- Validation notes: R3, R4

### Batch 3 verification

- Every listed file exists; `engine-zones.mjs` has no imports.
- `cd /home/amun/projects/nx-video && npx nx run-many -t lint,test,typecheck,build -p nx-video --output-style=static --skip-nx-cache 2>&1 | tail -25` (the spec output names the four self-test violations and the three fixture errors)
- The `lint` target loads `packages/nx-video/eslint.config.mjs` (print-config shows a zone rule).
- R4: root `eslint.config.mjs` keeps `test-fixtures/**` in its global `ignores` (Task 1.2 mitigation). ESLint 9 proof: `npx eslint test-fixtures` exits 2 with "All files matched by 'test-fixtures' are ignored", and `npx eslint --no-error-on-unmatched-pattern test-fixtures` exits 0 with no output. (Corrected at Batch 3 verification: the earlier wording "reports nothing" assumed ESLint 8 behaviour.)
- Result (team-leader, 2026-10-26, run 1): NOT ACCEPTED. Tasks 3.1–3.3 verified on disk and IMPLEMENTED: zone module has no imports; package lint target `cwd: packages/nx-video`, print-config from the package dir shows 1 `no-restricted` match; `@nx/enforce-module-boundaries` off only for `eslint.config.mjs` and the two zone specs (the three consumers of `tools/eslint/engine-zones.mjs`; none is in a zone glob, and the zone rules are `no-restricted-imports`/`no-restricted-syntax`, untouched); gate `run-many -t lint,test,typecheck,build -p nx-video --skip-nx-cache` exit 0, 11/11 tests; G1 80 files clean; mutation `src/remotion/` → `../hyperframes/x` fails `nx-video:lint` with the hard-rule-4 message (scratch file removed). Task 3.4 stays IN_PROGRESS: the second lane deleted `'test-fixtures/**'` from the root `eslint.config.mjs` ignores, removing the R4 mitigation (fixtures are now linted by the root config). Fix: restore that one line; no other root-config change. Simulated with `--ignore-pattern 'test-fixtures/**'`: exit 2 / exit 0 as above; the fixture spec is unaffected because it lints text through the package config with an in-zone `filePath`.
- Result (team-leader, 2026-10-26, run 2, fix re-check): ACCEPTED. `git diff --stat eslint.config.mjs` empty (root line 13 `'test-fixtures/**'` restored, decisions.md row 8); `npx eslint test-fixtures` exit 2; `npx eslint --no-error-on-unmatched-pattern test-fixtures` exit 0; `run-many -t lint,test,typecheck,build -p nx-video --skip-nx-cache` passes; G1 80 files clean. R4 resolved. Task 3.4 IMPLEMENTED, then COMPLETE with the batch commit. Phase `scaffold` continues; its code-logic review is due after its last batch.

## Batch 4: `create-nx-video` skeleton and README license text — PENDING

- Recommended executor: CLI lane, Gate 0.1 roster codex (model `gpt-6-sol`); capability: Nx package scaffold
- Execution mode: sequential
- Fallback order: other family same capability -> same family other provider/model -> devops-engineer subagent
- Subagent reason: N/A
- Review family: phase review by Ollama Code `glm-5.3:cloud`
- Rationale: one small project plus one doc edit; disjoint from Batch 3 files but kept sequential because both write `dist/` and the lockfile exception (R10) needs one writer at a time
- Tasks: 2 | Depends on: Batch 2
- Phase: scaffold | Phase review: as Batch 1

Files (11): under `/home/amun/projects/nx-video/packages/create-nx-video/`: `package.json`, `project.json`, `tsconfig.json`, `tsconfig.lib.json`, `tsconfig.spec.json`, `vitest.config.mts`, `README.md`, `LICENSE`, `bin/index.ts`, `bin/index.spec.ts`; and `/home/amun/projects/nx-video/README.md` (MODIFY)

### Task 4.1: `create-nx-video` package — PENDING

- Files: the ten `packages/create-nx-video/` files
- Plan reference: implementation-plan.md:145, 151, 775–778; `research-part-c-nx.md:27`
- Pattern to follow: `@nx/plugin:create-package` template `files/create-framework-package/bin/index.ts__tmpl__` (transcribe; do not let the generator write `packages/nx-video/generators.json` or `src/generators/preset/**` — A-4)
- Quality requirements: name `create-nx-video`, version `0.0.0`, MIT, `bin: {"create-nx-video": "./bin/index.js"}`, `dependencies` `create-nx-workspace` `24.0.1` exact; `bin/index.ts` with `#!/usr/bin/env node`, reads its own `package.json` version, calls `createWorkspace(\`@hive-academy/nx-video@${version}\`, {name, nxCloud: 'skip', packageManager})`, passes Nx errors through and exits non-zero; `project.json` tags `type:preset`, `scope:public`, `implicitDependencies: ["nx-video"]`, targets `build` (`@nx/js:tsc` → `dist/packages/create-nx-video`), `lint` (`nx:run-commands`: `eslint packages/create-nx-video`, `dependsOn` G1 as in Task 2.2), `test` (`nx:run-commands`: `vitest run --config packages/create-nx-video/vitest.config.mts`, Vitest `root` set to the package dir), `typecheck` (`nx:run-commands`, `tsc --noEmit` lib + spec) — the decisions.md row-6 pattern, mirroring `packages/nx-video/project.json`; no import of `packages/nx-video` source (module boundary). Spec mocks `create-nx-workspace` and asserts the preset string, `nxCloud: 'skip'` and the version source; `README.md` says the preset arrives in a later release (R9).
- Validation notes: A-4, R9, R10

### Task 4.2: README license text — PENDING

- Depends on: Task 4.1
- Files: `/home/amun/projects/nx-video/README.md`
- Plan reference: implementation-plan.md:907, 922, 1098
- Quality requirements: keep the existing content and the Remotion notice; in `## License` add that `NOTICE` carries the Apache-2.0 HyperFrames attribution and the Remotion license notice, and that the published packages include `LICENSE` and `NOTICE`. Do not change the planning status banner or the planned-commands list.

### Batch 4 verification

- Every listed file exists; `git diff README.md` touches only the license section.
- `cd /home/amun/projects/nx-video && npx nx run-many -t lint,test,typecheck,build -p nx-video,create-nx-video 2>&1 | tail -25`
- `git status --short packages/nx-video` shows no change (A-4).

## Batch 5: e2e project on Verdaccio, Nx 24.0.1 and 23.3.1 — PENDING

- Recommended executor: CLI lane, Gate 0.1 roster codex (model `gpt-6-sol`); capability: Nx e2e and local registry
- Execution mode: sequential
- Fallback order: other family same capability -> same family other provider/model -> devops-engineer subagent
- Subagent reason: N/A
- Review family: phase review by Ollama Code `glm-5.3:cloud`
- Rationale: needs both packages buildable and the release block; network-bound, longest-running batch
- Tasks: 2 | Depends on: Batches 1, 2, 4
- Phase: scaffold | Phase review: as Batch 1

Files (8): `/home/amun/projects/nx-video/tools/scripts/start-local-registry.ts`, `/home/amun/projects/nx-video/tools/scripts/stop-local-registry.ts`, and under `/home/amun/projects/nx-video/e2e/nx-video-e2e/`: `project.json`, `tsconfig.json`, `tsconfig.spec.json`, `vitest.config.mts`, `src/nx-video.spec.ts`, `src/test-utils.ts`

### Task 5.1: Local registry scripts and e2e project — PENDING

- Files: `tools/scripts/{start,stop}-local-registry.ts`, `e2e/nx-video-e2e/{project.json,tsconfig.json,tsconfig.spec.json,vitest.config.mts}`
- Plan reference: implementation-plan.md:106–107, 132, 146; `research-part-c-nx.md:30-34,105`
- Pattern to follow: `@nx/plugin:e2e-project` Vitest variant output
- Quality requirements: `project.json` name `nx-video-e2e`, tag `type:e2e`, `implicitDependencies: ["nx-video","create-nx-video"]`, `e2e` target (`nx:run-commands` running `vitest run --config e2e/nx-video-e2e/vitest.config.mts`, decisions.md row 6, `dependsOn: ["^build"]`), `lint` and `typecheck` targets in the same row-6 pattern as `packages/nx-video/project.json`, no `build`; Vitest `globalSetup` starts `nx-video-source:local-registry`, publishes both packages with `nx release version 0.0.0-e2e` + `nx release publish --tag e2e` (A-2) and stops the registry in teardown; `maxWorkers: 1`, `isolate: false`, long `testTimeout`; storage path stays space-free (R7). The scripts must not mutate tracked files (`nx release version` with `--git-commit=false --git-tag=false --stage-changes=false`; restore any `package.json` version bump in teardown).
- Validation notes: A-2, R7

### Task 5.2: e2e spec — PENDING

- Depends on: Task 5.1
- Files: `e2e/nx-video-e2e/src/nx-video.spec.ts`, `src/test-utils.ts`
- Plan reference: implementation-plan.md:756, 766, 785, 1068; context.md AC "installs the empty plugin into a new workspace"
- Quality requirements: Nx version from `NX_VIDEO_E2E_NX_VERSION` (default `24.0.1`; only `24.0.1` and `23.3.1` accepted). Workspace under `fs.mkdtempSync(os.tmpdir())` (R8). Every spawn is `spawnSync(process.execPath, [npxCli, ...args], {shell: false})` where `npxCli` is npm's `bin/npx-cli.js` resolved next to `process.execPath` (or from `NX_VIDEO_NPX_CLI`, validated to end in `npx-cli.js`, plan line 1067) — never `npx.cmd`, never a shell (R6, hard rule 5). Steps: `create-nx-workspace@<ver>` empty npm workspace; `npm install -D @hive-academy/nx-video@e2e`; add the plugin to `nx.json` `plugins`; assert `nx show projects` exits 0, `nx list @hive-academy/nx-video` exits 0 and reports no generators/executors, `nx show project` on a fixture project containing a `kit.json` lists no inferred targets (stub). Remove the temp dir in `afterAll`. Does not run `create-nx-video` (R9) and renders nothing.
- Validation notes: A-1, R6, R8

### Batch 5 verification

- Every listed file exists; no `npx.cmd`, `shell: true` or `execSync(` in `e2e/` or `tools/scripts/` except where the generated stop script is replaced by an argv form.
- `cd /home/amun/projects/nx-video && npx nx run-many -t lint,typecheck -p nx-video-e2e 2>&1 | tail -15 && npx nx run nx-video-e2e:e2e 2>&1 | tail -25 && NX_VIDEO_E2E_NX_VERSION=23.3.1 npx nx run nx-video-e2e:e2e --skip-nx-cache 2>&1 | tail -25`
- After the run: `git status --short` shows no tracked-file change from the release scripts; `~/.npmrc` has no leftover `localhost:4873` token.

## Batch 6: CI workflow, conventional-commit check, PR template — PENDING

- Recommended executor: CLI lane, Gate 0.1 roster codex (model `gpt-6-sol`); capability: GitHub Actions
- Execution mode: sequential
- Fallback order: other family same capability -> same family other provider/model -> devops-engineer subagent
- Subagent reason: N/A
- Review family: phase review by Ollama Code `glm-5.3:cloud`
- Rationale: wires the targets the earlier batches made; last because it references all of them
- Tasks: 2 | Depends on: Batches 1–5
- Phase: scaffold | Phase review: as Batch 1 — due after this batch commits

Files (4): `/home/amun/projects/nx-video/.github/workflows/ci.yml`, `/home/amun/projects/nx-video/.github/pull_request_template.md`, `/home/amun/projects/nx-video/tools/scripts/check-commits.mjs`, `/home/amun/projects/nx-video/tools/scripts/check-commits.spec.mjs`

### Task 6.1: `ci.yml` — PENDING

- Files: `.github/workflows/ci.yml`
- Plan reference: implementation-plan.md:782–785, 1068; D5
- Quality requirements: triggers `push` and `pull_request`; `concurrency` per ref; `permissions: contents: read`. Job `build`: matrix `os: [ubuntu-latest, windows-latest, macos-latest]`, `fail-fast: false`, `defaults.run.shell: bash`, `actions/checkout` + `actions/setup-node` Node 24 with npm cache; steps `npm ci`, `npx nx run-many -t lint test typecheck build`, `node tools/guards/no-media.mjs`, `npx nx run nx-video-e2e:e2e` with `NX_VIDEO_E2E_NX_VERSION: 24.0.1`. Job `e2e-nx23`: ubuntu, same setup, e2e with `23.3.1`. Job `commits`: `if: github.event_name == 'pull_request'`, ubuntu, `fetch-depth: 0`, `node tools/scripts/check-commits.mjs ${{ github.event.pull_request.base.sha }} ${{ github.event.pull_request.head.sha }}` passed through `env:` (not interpolated into the script body). Third-party actions pinned to a major or SHA. Steps for G2–G5, `library-imports`, marketplace validation are NOT added (010+), with one comment line saying where they go.
- Validation notes: R6, R12; `.gitignore` must not match the file (`git check-ignore -v .github/workflows/ci.yml` exits 1)

### Task 6.2: Conventional-commit check and PR template — PENDING

- Files: `tools/scripts/check-commits.mjs`, `tools/scripts/check-commits.spec.mjs`, `.github/pull_request_template.md`
- Plan reference: CLAUDE.md "Git"; context.md Scope "A conventional-commits check and a pull request template"; D6
- Quality requirements: `check-commits.mjs` exports `checkSubject(subject)` (Conventional Commits 1.0: `type(scope)?!?: description`, types `feat fix docs style refactor perf test build ci chore revert`; refuses `fixup!`/`squash!`, empty description, subject > 100 chars) and a CLI that lists `git log --format=%H%x00%P%x00%s -z base..head` via `spawnSync('git', [...], {shell:false})`, skips merge commits, prints each offender and exits 1. Spec (`node:test`) covers valid, scoped, breaking `!`, invalid type, missing colon, `fixup!`, merge skip (via an injected log string). PR template: summary, task id (`TASK_YYYY_NNN_xxxx`), checklist — Conventional Commit title, no media/recordings (hard rule 1), pinned versions only (rule 3), no cross-engine imports (rule 4), Windows spawn rule (rule 5), neutral branding (rule 6), tests added, deferred OS verification noted.
- Validation notes: D6

### Batch 6 verification

- Every listed file exists.
- `cd /home/amun/projects/nx-video && npx nx run-many -t test -p nx-video-source 2>&1 | tail -15` (G1 and check-commits specs)
- Workflow syntax: `actionlint .github/workflows/ci.yml` if installed, else `python3 -c "import yaml,sys; yaml.safe_load(open(sys.argv[1]))" .github/workflows/ci.yml`; record which ran.
- `node tools/scripts/check-commits.mjs a721752 HEAD` passes on this branch's commits.
- Full local gate: `npx nx run-many -t lint,test,typecheck,build 2>&1 | tail -25` across all projects.
- Deferred verification items 1–6 stay open; the phase summary must not call them passed.
