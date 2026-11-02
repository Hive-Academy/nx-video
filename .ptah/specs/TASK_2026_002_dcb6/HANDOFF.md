# HANDOFF — nx-video orchestration (after TASK_2026_002 Gate 2)

Written 2026-10-26 at the end of the orchestrating session.

## Goal

The user asked the agent to act as PM/CTO for nx-video. That means running the roadmap in `docs/roadmap.md` with the orchestration skill, using CLI lanes (codex, Ollama Code) and subagents. nx-video extracts Ptah's video tooling into a public Nx plugin (`@hive-academy/nx-video`), a `create-nx-video` preset and a Claude plugin marketplace.

### User decisions already made (do not re-ask)

- CLI lanes enabled; approval mode `lane-review`. TASK_2026_002 needed the user's own approval anyway, and the user gave it.
- Remotion: the user is the only developer, so the Free License applies. The README keeps the Remotion notice.
- npm publishing: granular `NPM_TOKEN` GitHub secret with provenance. **Not** OIDC trusted publishing.
- Target **Nx 24**: develop on 24.0.1, peers `>=23 <25`.
- Extraction is a clean copy from Ptah `e0ca51e6e` with a source-commit reference. No history-preserving extract.
- davinci-resolve-mcp: the `editor` generator downloads it at `samuelgursky/davinci-resolve-mcp` @ `6eca4bfc371a1c2f7cb2961efee651ab07436378` (MIT). Upstream is **unconfirmed**; only the Windows D: machine has the vendored copy.
- First release (013) = everything **except the editor**. The real render smoke (AC2/AC4/AC8) is a required pre-publish gate. The editor (008) ships in a later minor.
- The marketplace ships skills and agents only. davinci-resolve MCP is set up per machine by the `editor` generator.
- The studio is a package runtime library plus a thin generated shell (plan D1).
- `prewarm.ts` and `config-menu.ts` MOVE as selector-driven generic hooks. The user overturned plan D6.
- Git author for commits: `Abdallah <abdallah.khalil.nada@gmail.com>`, passed with `git -c user.name=Abdallah -c user.email=abdallah.khalil.nada@gmail.com commit ...`. The host has no git identity, and you must never change git config.
- **TASK_2026_002 `implementation-plan.md` is APPROVED by the user (2026-10-26).** See `decisions.md` row 22.

## Done

- **TASK_2026_001 (research): done.** Commit `975dfed docs(specs): research history scan, licenses and Nx packaging` on branch `task/2026-001-research`. **Not pushed:** there are no GitHub credentials on this host (`gh auth` is missing and git asks for a username).
- **TASK_2026_002 (extract plan): approved, NOT committed, NOT closed.**
  - Branch `task/2026-002-extract-plan` is stacked on `task/2026-001-research`.
  - `task.md` status is `in_progress`.
  - The deliverables exist (uncommitted): `parity-inventory.md` (374 baseline files + 348 historical, verified totals), `implementation-plan.md` (about 1145 lines), `implementation-plan-review.md` (round 1 REVISE, 9 defects) and `implementation-plan-review-r2.md` (round 2 REVISE, 2 gaps). The orchestrator fixed both gaps (revision log at the end of the plan). That fix was not independently re-reviewed, and the user approved with that disclosure.

## In progress

None of the TASK_2026_002 approval follow-ups have been done yet:

1. Doc updates, listed in the plan section `## Doc updates on approval`:
   - `docs/roadmap.md`:
     - retitle 004
     - 008 moves to a later minor and depends on 007 and 009
     - split 009 into a new kit/promo task (allocate its id with an exclusive `mkdir`)
     - 012 depends on 005 and 009
     - 013 depends on 007, 009, the kit task, 010, 011 and 012, and adds `render-smoke.yml`
   - `docs/decisions.md`: append "2026-10-26 — Extract plan approved" with its points, and change the marketplace wording to skills and agents only. The task acceptance requires the approval date in `docs/decisions.md`.
   - `README.md` "Planned commands": add the new commands.
2. Set TASK_2026_002 `task.md` `status:` to `done`; edit only that line.
3. Commit the TASK_2026_002 folder and the doc updates.

## Open problems and decisions

- **No GitHub credentials.** The user must run `gh auth login` (or set `GH_TOKEN`). Then push both branches and open PRs: 001 against `main`, and 002 stacked on 001 or after 001 merges. Never push to `main`.
- **Ptah setting:** `agentOrchestration.codexModel = gpt-6.1-sol` is rejected by the user's ChatGPT account. Until the user fixes it, every codex spawn must pass `model: "gpt-6-sol"`.
- **Ptah issues found (reported to the user, not fixed):**
  - the budget-stop notification says "stopped by user"
  - the interrupted-agents notice advises "resume" for budget-stopped agents
  - the log line `Budget stop succeeded without an agent id; signal not published`
  - the handoff does not check whether the deliverable was already written (the second architect wrote the plan 4 s before its stop)
  - codex lane resume is refused above 60k tokens
  - lanes are often reported `stopped` right after writing their deliverable
- The user raised `subagentHandoffTokens` from 150000 to **550000** in `~/.ptah/settings.json`. The round-1 revision subagent used 211k without a stop. A subagent's base load is about 100–140k, so keep briefs narrow and never Read the 113 KB `parity-inventory.md` whole (use `grep`/`sed`).
- An offer is pending to the user: add a "write progress notes to `.ptah/subagent-handoffs/<tool-id>.md`" instruction to `.claude/agents/*.md`. Not done; no answer yet.
- Open items before 008: confirm the davinci upstream, the editor `0.8.30` package name and the `.mcp.json` davinci entry on the Windows machine. Before 013: the `NPM_TOKEN` secret and push access.

## Key files

- `/home/amun/projects/nx-video/CLAUDE.md`: hard rules (pins, two engines, Windows spawn, no brands, no media, task-spec rules).
- `/home/amun/projects/nx-video/docs/roadmap.md`, `/home/amun/projects/nx-video/docs/decisions.md`: dependency order and binding decisions. Both need the approval updates above.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6/implementation-plan.md`: the approved plan. TASK_2026_003+ build from it, and its `## Team-leader handoff` is the input for the team-leader.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6/decisions.md`: the decision log, rows 1–22.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6/parity-inventory.md`: the per-file fate list (large; grep it).
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_001_3d3a/research-report.md`: safe/not-safe paths, licenses, Nx findings, user answers.
- `/home/amun/projects/ptah-extension`: a read-only full-history clone of the public `Hive-Academy/ptah-extension` with no working tree. Use git plumbing at `e0ca51e6e`. `~/ptah-extension` is the user's own checkout; do not edit it.

## Background work

None. Every lane and subagent finished and its results were collected. Both subagent handoff records in `.ptah/subagent-handoffs/` are `status: consumed`.

## Next steps

1. Do the doc updates in "In progress" item 1. Set TASK_2026_002 `status: done`, then stage specific paths only (never `.claude/`, `.codex/`, `.mcp.json`, `.ptah/analysis/`, `.ptah/harness/`, `.ptah/subagent-handoffs/` or the user's modified `.gitignore`):
   ```bash
   cd /home/amun/projects/nx-video
   git add .ptah/specs/TASK_2026_002_dcb6/{task.md,context.md,decisions.md,parity-inventory.md,implementation-plan.md,implementation-plan-review.md,implementation-plan-review-r2.md,HANDOFF.md} docs/roadmap.md docs/decisions.md README.md
   git -c user.name=Abdallah -c user.email=abdallah.khalil.nada@gmail.com commit   # docs(specs): approve the extract plan …, ending with the Co-Authored-By line
   git status --short
   ```
2. If the user has authenticated `gh`, push `task/2026-001-research` and `task/2026-002-extract-plan` and open PRs (title under 70 chars; `## Summary` and `## Test plan`). Check auth with `gh auth status`.
3. Start **TASK_2026_003** (DEVOPS: scaffold the plugin workspace and the CI matrix; AC1).
   - Run `/orchestrate TASK_2026_003_06a8` and branch `task/2026-003-scaffold` from the 002 branch, or from `main` once the PRs merge.
   - Inputs: the plan's Layout, CI and Order-of-work sections.
   - Use the nx-workspace-architect skill.
   - Verify scoped: `npx nx run-many -t lint,test,typecheck,build -p nx-video,create-nx-video` with output tailed.
4. In parallel, TASK_2026_007 (doctor) and TASK_2026_009 (HyperFrames) depend only on 003, so plan them as a fleet after 003.
