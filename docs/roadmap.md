# Roadmap

Each row is a task folder in `.ptah/specs/`. The folder name is the canonical id. A task starts only when the tasks in "Depends on" are done.

| # | Task | Type | Depends on | Acceptance criteria |
|---|---|---|---|---|
| 001 | Research: history scan, Remotion license, Nx plugin packaging | RESEARCH | — | Gate for all copies |
| 002 | Confirm the inventory and write the extract plan | REFACTORING | 001 | **User approval gate** |
| 003 | Scaffold the plugin workspace and the CI matrix | DEVOPS | 002 | AC1 |
| 004 | Manifest and capture subpath exports in `@hive-academy/nx-video` | REFACTORING | 003 | — |
| 005 | `init` and `studio` generators, `render`, `narrate`, `selfshot` executors | FEATURE | 004 | AC2, AC4 |
| 006 | Director harness, `capture` executor, `scene` generator | FEATURE | 004 | — |
| 007 | `doctor` executor | FEATURE | 003 | AC3 |
| 008 | `editor` generator (later minor release, after 013) | FEATURE | 007, 009, 013 | — |
| 009 | HyperFrames `hyperframes-project`, `frame`, `assemble`, `check`, `hyperframes-render` | FEATURE | 003 | AC8 |
| 010 | CI guards: recording leak guard and layout-ignore rule | DEVOPS | 005, 009 | AC6, AC9 |
| 011 | Claude plugin marketplace manifest | FEATURE | 005, 006, 009 | AC5 |
| 012 | `create-nx-video` preset | FEATURE | 005, 009 | — |
| 013 | Release pipeline, `render-smoke.yml` pre-publish gate and first publish | DEVOPS | 007, 009, 010, 011, 012, 014 | — |
| 014 | HyperFrames `kit`, `kit-component`, `promo` generators and `kit-build`, `snapshot`, `preview` executors | FEATURE | 009 | — |

After 013, the work continues in Ptah `TASK_2026_582_a7db`: Ptah consumes the package (AC7, AC10).

The first release (013) ships everything except the editor. The real render smoke for AC2, AC4 and AC8 (`render-smoke.yml`) is a required pre-publish gate. The editor (008) follows 013 as a minor release, and Ptah's AC7 and AC10 do not need it.

The `depends_on` lines in the older `task.md` files predate the 2026-10-26 plan approval. This table is the binding order.

## Acceptance criteria

1. The repository builds, lints and tests in CI on Windows, macOS and Ubuntu.
2. In an empty Nx workspace, `nx g @hive-academy/nx-video:init` and `nx g @hive-academy/nx-video:studio` give a studio that renders the smoke composition.
3. `nx run <studio>:doctor` reports each missing prerequisite with a fix message and exits non-zero when one is missing.
4. The self-shot `_smoke` render works from the package.
5. The marketplace manifest validates against the Ptah marketplace schema, and Claude Code can install it.
6. The CI leak guard fails on a test fixture with a non-allowlisted slug.
7. *(Ptah)* Ptah records and renders one existing scene with the package. The moved paths no longer exist in Ptah.
8. In an empty Nx workspace, `hyperframes-project` + `frame` + `assemble` + `check` give a project that passes `check` with 0 errors, and `render` writes the MP4 to `video-output/`.
9. The CI rule fails on a fixture that uses `data-layout-ignore`.
10. *(Ptah)* Ptah's `agent-lanes-v3` and `agent-lanes-chat` projects assemble, check and render with the package.

## Suggested agents

001 researcher-expert · 002 software-architect · 003, 010, 013 devops-engineer · 004–009, 011, 012, 014 backend-developer · then senior-tester and the reviewers for each feature task.
