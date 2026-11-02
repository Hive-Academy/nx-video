# Batch 6 report — TASK_2026_003_06a8

## Files written

- `/home/amun/projects/nx-video/.github/workflows/ci.yml` — push/PR CI, three-OS build matrix, ubuntu Nx 23 e2e, and PR commit job.
- `/home/amun/projects/nx-video/.github/pull_request_template.md` — summary, task id, hard-rule checklist, and deferred verification field.
- `/home/amun/projects/nx-video/tools/scripts/check-commits.mjs` — dependency-free Conventional Commit check.
- `/home/amun/projects/nx-video/tools/scripts/check-commits.spec.mjs` — node:test coverage, including injected merge log.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_003_06a8/batch-6-report.md` — this report.

## Surface observed

- Nx uses explicit `nx:run-commands` targets in `project.json`, `packages/nx-video/project.json`, `packages/create-nx-video/project.json`, and `e2e/nx-video-e2e/project.json`. The source test target already runs `node --test "tools/**/*.spec.mjs"`; e2e is `nx-video-e2e:e2e`.
- `CLAUDE.md` requires Conventional Commits, no media, pinned versions, engine separation, Windows-safe spawning, and neutral templates. `batches.md` Batch 6 and approved `implementation-plan.md` lines 780–815 define the CI triggers and targets.
- The workflow triggers on push and pull requests; the commit job runs only for pull requests. No secrets are required. The e2e's temporary `NPM_CONFIG_USERCONFIG` and `--location=none` remain in its existing implementation; CI adds no home-level npm or yarn configuration.

## Task 6.1 evidence

- YAML validator: `actionlint` was absent from PATH; the installed `yaml` package parsed `.github/workflows/ci.yml` successfully (`YAML parsed`). A parsed structure check found events `push`, `pull_request`; jobs `build`, `e2e-nx23`, `commits`; global run shell `bash`; and exactly the two action pins below.
- `git check-ignore -v .github/workflows/ci.yml .github/pull_request_template.md` exited **1** with no output, as required: neither path is ignored.
- Exact action pins: `actions/checkout@v4.2.2` ([release](https://github.com/actions/checkout/releases/tag/v4.2.2)) and `actions/setup-node@v4.4.0` ([release](https://github.com/actions/setup-node/releases/tag/v4.4.0)). Both release tags were confirmed on GitHub.
- `ptah_get_diagnostics` on all four created files reported **0 errors, 0 warnings**.

## Task 6.2 evidence

- `node --test "tools/**/*.spec.mjs"` exited **0**: `tests 8`, `pass 8`, `fail 0`. It includes the new subject cases, length boundary, autosquash rejection, and injected-log merge skip.
- `npx nx run-many -t test -p nx-video-source --output-style=static` exited **0**. Tail:

  ```text
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  NX   Successfully ran target test for project nx-video-source
  Cache:             0/1 hit (0%)
  ```

- `node tools/scripts/check-commits.mjs a721752 HEAD` exited **0** with no offenders printed.

## Local gate evidence

- `npx nx run-many -t lint,test,typecheck,build -p nx-video,create-nx-video,nx-video-e2e,nx-video-source --exclude-task-dependencies --output-style=static` exited **0**. Tail:

  ```text
  > nx run nx-video-e2e:lint
  > eslint e2e/nx-video-e2e
  > nx run nx-video-e2e:typecheck
  > tsc --noEmit -p e2e/nx-video-e2e/tsconfig.spec.json
  NX   Successfully ran targets lint, test, typecheck, build for 4 projects
  Nx read the output from the cache instead of running the command for 1 out of 11 tasks.
  Cache:             1/11 hit (9%)
  ```

- `node tools/guards/no-media.mjs | tail -3` printed `no-media: checked 110 files; no violations`.
- `git diff --check` exited **0**. The existing `.gitignore` and `batches.md` working-tree changes were left untouched; no git write was made.

## Decisions

| Decision | Options | Evidence | Reversible |
|---|---|---|---|
| Put `defaults.run.shell: bash` at workflow level | Repeat it in each job; set once for all jobs | Batch 6 requires Bash on all OSes; parsed YAML confirms the global default | Yes |
| Use `yaml` for local workflow syntax validation | `actionlint`; installed YAML parser | `actionlint` is absent from PATH; `node_modules/yaml` is installed; parsing succeeded | Yes |
| Export `findOffenders(log)` beside required `checkSubject(subject)` | Exercise only the CLI; inject a log string into a pure parser | Task 6.2 requires merge-skip coverage through injected log text; the pure parser makes it testable without a fake git binary | Yes |
| Use exact release tags `checkout@v4.2.2` and `setup-node@v4.4.0` | Full commit SHAs | Both exact tags were confirmed on their GitHub release pages; Batch 6 allows exact version tags | Yes |

## Only CI can prove

1. `ci.yml` on `windows-latest` and `macos-latest`, including `npm ci`, lint/test/typecheck/build, and the empty-plugin e2e install.
2. The complete real GitHub workflow run, including ubuntu; this host has no authenticated `gh` push.
3. The PR-only conventional-commit job against a real `pull_request` event.
4. Branch protection requiring the three matrix jobs; this is a repository setting for 013 or the user.
5. The Git Bash executor e2e proof of hard rule 5; no executor exists until 005. In 003, the Windows Git Bash leg can prove only npm, Nx, and e2e spawn paths.
6. Nx 23.3.1 on Windows and macOS, which D5 leaves outside this matrix.

## Rollback and limitations

Revert the four created implementation files to remove Batch 6. No CI run was possible locally. No skill loader was exposed in this CLI session, so no optional skill was loaded.
