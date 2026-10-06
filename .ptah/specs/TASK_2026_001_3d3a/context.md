# Context

## Intent

This repository is public. Before any file from Ptah is copied here, we must know that the files and their history contain no secrets and no private media. We must also know the Remotion license terms and the correct way to package an Nx plugin.

## Questions

1. **History scan.** For each source path below in `D:/projects/ptah-extension` (baseline `e0ca51e6e`), scan the full git history for secrets (API keys, tokens, `.env` content) and for private media (recordings, client footage, client names in scripts or JSON). Report each finding with the commit and the path. Decide: clean copy with a source-commit reference (default), or history-preserving extract (only if the scan is clean).
   - `apps/ptah-video-studio/` (with `selfshot/`, `promos/`, `assets/`, `public/`)
   - `libs/showcase-manifest/`
   - `apps/ptah-electron-e2e/src/showcase/`
   - `tools/video-editor/` (with `vendor/` and `projects/`)
   - `tools/hyperframes/` (with `kits/` and `projects/`)
   - `.claude/skills/video-showcase/`, `.claude/agents/video-director.md`
   - `apps/ptah-extension-vscode/assets/plugins/ptah-video/`
2. **Remotion license.** State the current terms: who needs a company license, and the exact wording and link for the README notice. Confirm that an MIT package can depend on Remotion.
3. **HyperFrames license** and the license of the vendored `davinci-resolve-mcp`. Can we redistribute the vendored copy, or must the `editor` generator download it at the pinned commit?
4. **Nx plugin packaging (Nx 23).** Generators, executors (or inferred tasks through `createNodesV2`), a `create-*` preset package, local e2e with a Verdaccio registry, and npm publish with provenance. Recommend executors or inferred tasks for `render`, `capture` and `check`.
5. **Package names.** Confirm that `@hive-academy/nx-video` and `create-nx-video` are free on npm, and that the `@hive-academy` npm scope is available to us.

## Output

`research-report.md` in this folder: one section for each question, with evidence and a recommendation. List each path that is NOT safe to copy.

## Acceptance

- Every source path has a verdict: safe, safe after removal of named files, or not safe.
- The user reads the report before `TASK_2026_002` starts.
