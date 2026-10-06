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
