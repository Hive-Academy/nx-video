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

## Orchestration (2026-10-26)

- **Type / depth**: RESEARCH, Partial. Flow: parallel research lanes → merged `research-report.md` → cross-side review → user reads report → `TASK_2026_002`.
- **Gate 0.1 — CLI lanes**: `enabled`. Source: explicit user instruction ("work with our cli tools and our subagents (codex, ollama)"); memory had no stored preference. Approval mode: `lane-review` (but this task's acceptance requires the user to read the report anyway).
- **Spawnable lanes** (`ptah_agent_list`): `codex` (cli, weekly 33%, room), `Ollama Code` (ptah-cli `pc-f3384f72-a556-4ab4-b2b1-7e1e028f22cb`, ollama-cloud, session 17%, room). `copilot` and `claude` are installed but disabled.
- **Source access**: read-only clone at `/home/amun/projects/ptah-extension` (cloned from public `Hive-Academy/ptah-extension`; the D: path is not on this Linux machine). Baseline `e0ca51e6e` present; 5715 commits.

### Lane split

| Part | Questions | Executor | Deliverable |
|---|---|---|---|
| A | Q1 history scan | codex lane | `research-part-a-history.md` |
| B | Q2 Remotion, Q3 HyperFrames + davinci-resolve-mcp licenses, Q5 npm names | Ollama Code lane | `research-part-b-licenses.md` |
| C | Q4 Nx 23 plugin packaging | researcher-expert subagent | `research-part-c-nx.md` |
| Merge | all | orchestrator | `research-report.md` |
