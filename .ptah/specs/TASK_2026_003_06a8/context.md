# Context

## Intent

Create the workspace that holds the plugin, before any code moves in.

## Scope

- Nx 23 workspace, Node 24, TypeScript, and the test runner chosen in `TASK_2026_001`.
- `packages/nx-video` — the plugin project (`@hive-academy/nx-video`), with empty `generators.json` and `executors.json`.
- `packages/create-nx-video` — the preset package (empty shell).
- `e2e/nx-video-e2e` — an e2e project that creates an empty Nx workspace in a temp folder and installs the plugin from a local registry.
- GitHub Actions CI: build, lint, test and e2e on `windows-latest`, `macos-latest` and `ubuntu-latest`.
- A conventional-commits check and a pull request template.

## Acceptance

- AC1: CI passes on all three operating systems.
- The e2e project installs the empty plugin into a new workspace on all three operating systems.

## Update on plan approval (2026-10-26)

The scope above predates the approved plan. The binding scope is TASK_2026_002 `implementation-plan.md`. Where the two differ, the plan wins:

- Nx **24.0.1**, not Nx 23. The e2e matrix runs on Nx 24.0.1 and 23.3.1.
- 003 also lands the engine-zone ESLint blocks (`tools/eslint/engine-zones.mjs`), the isolation test and its lint fixtures, the guard G1, the root `.gitignore`, `NOTICE`, the README license text, the Verdaccio config and a `createNodes` stub.

Plan sections for 003, by line in `../TASK_2026_002_dcb6/implementation-plan.md`:

- Repository layout, Nx projects, `package.json`: 98–198
- Guards and CI scripts (G1 only): 517–560
- `createNodes` stub: 750–768
- Preset skeleton: 769–779
- CI and release workflows (`ci.yml` only): 780–815
- Quality requirements: 890–915
- Order of work, row 003: 916–934
- Lane-introduced constraints: 1054–1069

## Orchestration

- Type DEVOPS, depth Partial. `ptah_route_decide` pre-flight returned null for both (low confidence), so the skill table decided.
- Flow: team-leader Mode 1 → devops-engineer batches → code-logic review → QA. The PM and architect phases are skipped because the approved 002 plan covers this task (decisions.md row 1).
- Gate 0.1: CLI lanes `enabled`, approval mode `lane-review`. Source: the user's standing decision in `TASK_2026_002_dcb6/HANDOFF.md`. Agents at Gate 0.1: codex (installed, confirmed room, weekly 37%; spawn with `model: "gpt-6-sol"`) and Ollama Code (`pc-f3384f72-a556-4ab4-b2b1-7e1e028f22cb`, confirmed room). copilot and claude are disabled. cursor, antigravity, opencode, pi and grok are not installed.
