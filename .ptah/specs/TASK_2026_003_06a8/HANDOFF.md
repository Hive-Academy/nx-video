# HANDOFF: nx-video orchestration (after TASK_2026_003 implementation)

Written 2026-10-26 at the end of the orchestrating session. It replaces `../TASK_2026_002_dcb6/HANDOFF.md` as the current handoff.

## Goal

The user asked the agent to act as PM/CTO for nx-video and run `docs/roadmap.md` with the orchestration skill, using CLI lanes (codex, Ollama Code) and subagents. nx-video extracts Ptah's video tooling into:

- a public Nx 24 plugin, `@hive-academy/nx-video`
- a `create-nx-video` preset
- a Claude plugin marketplace

### User decisions already made (do not re-ask)

- Every decision listed in `../TASK_2026_002_dcb6/HANDOFF.md` § "User decisions already made" still holds:
  - Nx 24.0.1, with peers `>=23 <25`
  - an `NPM_TOKEN` granular token with provenance
  - the Remotion Free License
  - a clean copy from `e0ca51e6e`
  - the davinci SHA download, done by `editor`
  - the first release ships everything except the editor
  - the marketplace ships skills and agents only
  - D1 studio lib plus a shell
  - prewarm/config-menu as generic hooks
- The TASK_2026_002 plan is APPROVED. It is the plan for all of 003–014.
- CLI lanes are `enabled`, and the approval mode is `lane-review`.
- Git author: `git -c user.name=Abdallah -c user.email=abdallah.khalil.nada@gmail.com commit ...`. Never change git config.
- Every codex lane spawn passes `model: "gpt-6-sol"`. The user's Ptah setting `gpt-6.1-sol` is rejected by their ChatGPT account.

## Done (verified)

Branches are stacked: `main` (`996b356`) → `task/2026-001-research` (`975dfed`) → `task/2026-002-extract-plan` (`a721752`) → `task/2026-003-scaffold` (HEAD `14791cd`). **Nothing is pushed. No PRs exist.**

- **TASK_2026_002 is done.** Commit `a721752` is `docs(specs): approve the extract plan and split the kit/promo task`. It contains:
  - the approval entry and target-shape/marketplace wording in `docs/decisions.md`
  - the roadmap update: 004 retitled, 008 after 013, a 009 split, 012 depending on 005 and 009, and 013 gated on `render-smoke.yml`
  - the new README commands
  - the new task `TASK_2026_014_deaa` (kit/promo, depends on 009)
  - a scope note in 009's `context.md`

  The `depends_on` lines in the old `task.md` files are stale, because only `status:` may be edited. The roadmap says its table is binding.
- **TASK_2026_003 is implemented and reviewed. Its status is `in_review`, because AC1 needs CI.**

| Commit | Content |
|---|---|
| `16030ef` | Batch 1: Nx 24.0.1 root, G1 no-media guard |
| `6ebd42d` | Batch 2: `packages/nx-video` empty plugin, createNodes stub |
| `f232f6a` | Batch 3: engine-zone ESLint + isolation spec + lint fixtures |
| `7a7f4a1` | Batch 4: `packages/create-nx-video` skeleton, README license text |
| `4852f3a` | Batch 5: `e2e/nx-video-e2e` on Verdaccio (Nx 24.0.1 and 23.3.1) |
| `32a0e88` | Batch 6: `.github/workflows/ci.yml`, `tools/scripts/check-commits.mjs`, PR template |
| `4994e7f` | Review records, `"location": "none"` on the root `local-registry` target |
| `14791cd` | `task.md` set to `in_review` |

  Local verification on Linux:
  - `nx run-many -t lint,test,typecheck,build` passes for `nx-video`, `create-nx-video`, `nx-video-e2e` and `nx-video-source`.
  - `node --test "tools/**/*.spec.mjs"` passes 8/8.
  - Both e2e legs passed in Batch 5. They were not re-run after the fix round. The fix lane reported a pass.
  - The no-media guard is clean.
  - Port 4873 is free. No `~/.npmrc` or `~/.yarnrc*` exists.

  Phase review (`code-logic-review.md`):
  - Ollama Code `glm-5.3:cloud` reviewed codex's implementation: 7/10, APPROVED WITH NOTES, with 0 Blocking and 0 Serious findings.
  - The re-review (`code-logic-review-fixes.md`) is APPROVED, and finding 5 was withdrawn.
  - The Moderate and Minor findings were carried forward (decisions row 11): findings 3, 4, 6 and 12 go to `TASK_2026_004_8680/context.md`, and findings 1, 2 and 7–11 go to `TASK_2026_010_6e8e/context.md`.

  Gate 3: senior-tester was skipped by rule. The only remaining gap is CI evidence from Windows and macOS.

## In progress

Nothing is half-edited. HANDOFF.md (this file) is uncommitted.

## Open problems and decisions

- **AC1 is not met.** CI has never run. Deferred verification items 1–6 in `batches.md` are open:
  1. the Windows and macOS legs
  2. a real GitHub run
  3. the PR-event commit job
  4. branch protection
  5. a Git Bash executor proof, which needs 005
  6. Nx 23 on operating systems other than Ubuntu
- **Push status:**
  - `gh auth status` now shows the account `Abdallah-khalil` logged in through the keyring.
  - `git ls-remote origin` (`https://github.com/Hive-Academy/nx-video`) hung for more than 120 s, probably at a git credential prompt. Run `gh auth setup-git` first, then retry.
  - Nothing has been pushed yet. Whether `main` exists on the remote is unverified.
- **User question, not answered:** start TASK_2026_007 (doctor) and TASK_2026_009 (HyperFrames) now, as a fleet stacked on the 003 branch, or wait for green CI? Ask once, or follow the user's answer if they gave one.
- The user owns these uncommitted paths. Never stage them:
  - `.gitignore` (the `ptah:harness` block)
  - `.claude/`, `.codex/`, `.mcp.json`
  - `.ptah/analysis/`, `.ptah/harness/`, `.ptah/subagent-handoffs/`
  - `*.harvested.json`
  - the two `subagent-handoff-software-architect-*.md` in TASK_2026_002
- **Ptah issues seen this session (already reported):**
  - Codex lane resume is refused when the last request exceeds 60k tokens. A fresh lane starts "with a handoff brief" instead, so always give it complete instructions.
  - Late `<agent-lane-completed>` signals arrive after the report has already been handled. Ignore them.
  - A pending offer to add a progress-notes instruction to `.claude/agents/*.md` is still unanswered.
- **Open items before 008:** the davinci upstream, the editor `0.8.30` package name, and the `.mcp.json` entry on the Windows machine. **Before 013:** the `NPM_TOKEN` secret.

## Key files

- `/home/amun/projects/nx-video/CLAUDE.md`: the hard rules (pins, two engines, Windows spawn, no brands, no media, task-spec rules).
- `/home/amun/projects/nx-video/docs/roadmap.md`: the binding dependency order. 014 is new.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6/implementation-plan.md`: the approved plan. Read its sections by line. Do not read `parity-inventory.md` (113 KB) whole; grep it.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_003_06a8/batches.md`: D1–D9, R1–R12, the batch results and the deferred verification list.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_003_06a8/decisions.md`: rows 1–11. These record the Nx 24 facts that every later task needs:
  - row 6: there are no `@nx/eslint` or `@nx/vitest` executors, so `lint` and `test` use `nx:run-commands`.
  - row 10: never touch the home npm or yarn config.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_003_06a8/code-logic-review.md`: the 12 findings and the CI-only list.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_004_8680/context.md` and `.../TASK_2026_010_6e8e/context.md`: the carried-over review findings.
- `/home/amun/projects/ptah-extension`: read-only source clone. Use git plumbing at `e0ca51e6e`.

## Lessons for lane prompts (apply to 004+)

- ESLint 9 resolves its config from the cwd. A package-level `eslint.config.mjs` needs `"cwd": "<pkg>"` on the lint target. `eslint <all-ignored dir>` exits 2. Never remove an `ignores` entry to make a check pass.
- Give each lane its exact file list, the batches.md line range and a tool-call cap of 25–40, and forbid git writes and edits to batches.md and decisions.md. The team-leader (a fresh subagent per Mode 2 call) verifies and commits. The orchestrator may make a bounded one-line correction, logs it in decisions.md, and gets a cross-family review of it.
- The reviewer is Ollama Code (`ptahCliId pc-f3384f72-a556-4ab4-b2b1-7e1e028f22cb`, `glm-5.3:cloud`), a different family from codex.

## Background work

None. Every lane and subagent has finished and its results have been collected. A stray `git ls-remote` was stopped.

## Next steps

1. Push and open PRs. This is an outward action, and the user has asked for it ("push both branches and open PRs").
   ```bash
   cd /home/amun/projects/nx-video
   gh auth setup-git
   timeout 60 git ls-remote origin | head      # confirm access; check whether main exists remotely
   git push -u origin task/2026-001-research task/2026-002-extract-plan task/2026-003-scaffold
   ```
   Open stacked PRs with `gh pr create`. Keep each title under 70 characters, include `## Summary` and `## Test plan`, and end the body with the attribution line.
   - 001 against `main`
   - 002 against `task/2026-001-research`
   - 003 against `task/2026-002-extract-plan`

   Never push to `main`. If `main` is missing on the remote, stop and ask the user.
2. Watch CI on the 003 PR. Run `gh pr checks <n>` once, or `gh run watch` in the background, and do not poll in a loop. When ubuntu, windows and macos are green:
   - mark deferred items 1–3 and 6 as passed in `TASK_2026_003_06a8/batches.md`
   - set `task.md` `status: done`
   - commit
   
   If a leg fails, run `/orchestrate TASK_2026_003_06a8` (continuation) with the failing log tail.
3. Ask the user, if they have not answered: run 007 and 009 now as a fleet, or after 003 is green? Then run `/orchestrate TASK_2026_007_3276 TASK_2026_009_4b9a`, with one branch per task.
4. Then continue with 004, which must first close the carried-over findings 3, 4, 6 and 12, and then follow the roadmap.
