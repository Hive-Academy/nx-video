# Batch 1 report — TASK_2026_003_06a8

## Completion and evidence

### Task 1.1 — complete

- Created the private Nx 24.0.1 root with exact dependency pins, named inputs, cached target defaults, fixed conventional release settings, strict TypeScript base config, and LF attributes. No npm workspaces or Nx inference plugins were added.
- Merged only missing G2 ignore rules above the existing harness block. Every pre-existing line was preserved. `git diff -- .gitignore` shows both the pre-existing uncommitted harness block and this batch's new G2 block; the team leader must stage only the G2 hunk as D7 requires.
- `npm install --no-audit --no-fund` → `added 872 packages in 2m`; generated `package-lock.json`.
- `npm ci --no-audit --no-fund 2>&1 | tail -5` → `added 871 packages in 12s` (exit 0).
- `npx nx --version` → `Local: v24.0.1`.
- `wc -c package-lock.json` → `483287 package-lock.json`; below the 1,048,576-byte limit, so no lockfile allowlist entry.

### Task 1.2 — complete

- Added Nx flat ESLint base, TypeScript, and JavaScript presets; module boundaries for plugin, preset, and e2e tags; required ignores; the root `local-registry`, `no-media`, and `test` targets; and space-free Verdaccio storage with the npmjs uplink and requested publish scopes.
- `npx nx show project nx-video-source --json` → `targets: [test, local-registry, no-media]`, registry port `4873`, config `.verdaccio/config.yml`, storage `tmp/local-registry/storage`.
- `npx eslint eslint.config.mjs tools 2>&1 | tail -10` → no output, exit 0.

### Task 1.3 — complete

- Added a pure `findViolations`/`parseAllowList` guard, a shell-free `git ls-files -z` CLI with ENOENT skip, text-only clean and dirty fixtures, and `node:test` coverage of both fixture outcomes, exact reasons, CLI exit codes, and malformed allowlist entries.
- `npx nx run-many -t test -p nx-video-source --output-style=static 2>&1 | tail -20` → `tests 4`, `pass 4`, `fail 0`, `Successfully ran target test`; final invocation reported one Nx cache hit after an earlier uncached pass.
- `node --check tools/guards/no-media.mjs` and `node --check tools/guards/no-media.spec.mjs` → exit 0.
- `node tools/guards/no-media.mjs` → `no-media: checked 48 files; no violations` (exit 0 on the current index).
- The listed 14 Batch 1 files all exist (`test -f` check returned `all 14 Batch 1 files exist`).
- `ptah_get_diagnostics` was called on the changed JavaScript files. It reported unavailable TypeScript coverage because this scaffold has no compilable TypeScript project; Node syntax checks, ESLint, and the guard tests passed.

## Files created or modified

- `/home/amun/projects/nx-video/package.json`
- `/home/amun/projects/nx-video/package-lock.json`
- `/home/amun/projects/nx-video/nx.json`
- `/home/amun/projects/nx-video/project.json`
- `/home/amun/projects/nx-video/tsconfig.base.json`
- `/home/amun/projects/nx-video/eslint.config.mjs`
- `/home/amun/projects/nx-video/.gitattributes`
- `/home/amun/projects/nx-video/.gitignore`
- `/home/amun/projects/nx-video/.verdaccio/config.yml`
- `/home/amun/projects/nx-video/tools/guards/no-media.mjs`
- `/home/amun/projects/nx-video/tools/guards/no-media.spec.mjs`
- `/home/amun/projects/nx-video/tools/guards/large-files.allow`
- `/home/amun/projects/nx-video/test-fixtures/guards/no-media/clean.json`
- `/home/amun/projects/nx-video/test-fixtures/guards/no-media/dirty.json`
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_003_06a8/batch-1-report.md`

## DevDependencies added

`nx`, `@nx/plugin`, `@nx/js`, `@nx/devkit`, `@nx/eslint`, `@nx/eslint-plugin`, `@nx/vitest`, and `create-nx-workspace` are exactly `24.0.1`. The other exact pins are `vitest@4.1.12`, `typescript@6.0.3`, `eslint@9.39.5`, `typescript-eslint@8.72.0`, `verdaccio@6.11.1`, `tslib@2.8.1`, and `@types/node@24.19.2`.

## Risks handled

- **R1:** Preserved the original `.gitignore` content and inserted the G2 block immediately above `# ptah:harness:begin`. The harness block appears in `git diff` because it was already an uncommitted user change; D7 hunk-only staging remains the team leader's task.
- **R4:** Root ESLint ignores `test-fixtures/**`; the base TypeScript config excludes it too.
- **R7:** Verdaccio uses the space-free `tmp/local-registry/storage` path. The later generated start/stop scripts are outside this batch.
- **R10:** All Batch 1 dependencies are pinned in the root lockfile. Later batches must report any additional exact devDependency pins.
- **R11:** G1 scans `git ls-files`, so it cannot see new unstaged files. The team leader must rerun `node tools/guards/no-media.mjs` after staging and before committing.

## Decisions

| Decision | Options | Evidence | Reversible |
|---|---|---|---|
| Use exact pins for the non-Nx devDependencies listed above. | Versions compatible with Nx 24.0.1, or floating ranges. | `npm view` peer/dependency metadata, successful `npm ci`, Nx test and ESLint checks. | Yes, through an exact-pin lockfile update. |
| Keep the guard's allowlist empty and use a temporary `--allow-list` file for the clean CLI fixture. | Add an unrelated fixture path to the tracked allowlist, or pass a fixture allowlist to the CLI. | A-3 is false: the generated lockfile is 483,287 bytes; `large-files.allow` should contain real tracked exceptions only. | Yes. |
| Keep root dependencies centralized and no inference plugins. | npm workspaces and inferred targets, or D2's explicit integrated layout. | D2 and Task 1.1; `nx show project` resolves the explicit root targets. | Yes, before more projects are added. |

## Not done

- No git stage, commit, or push; the team leader owns those steps and the post-stage G1 rerun.
- The continuous `local-registry` service was not started. Nx resolves its target and options; a later e2e batch exercises the registry.
- Windows and macOS CI cannot be proven locally in this batch. No CI workflow belongs to Batch 1.
- No skill-loading tool was available in this lane; no skill was assigned to the Batch 1 root scaffold.

## Clarifications Needed

None.
