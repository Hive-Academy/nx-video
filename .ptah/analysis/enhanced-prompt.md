## Project-Specific Guidance

### Project Context
nx-video extracts the video tooling from the Ptah VS Code extension (source: `Hive-Academy/ptah-extension`, local `D:/projects/ptah-extension`, baseline commit `e0ca51e6e`) into three public deliverables: an Nx plugin (executors and generators), a Claude plugin marketplace, and a workspace preset. The repository is public.

Current status is **planning only**. The repo holds documents (`README.md`, `docs/decisions.md`, `docs/roadmap.md`) and task specs under `.ptah/specs/`. No package dependencies or frameworks are installed yet. Work starts with `TASK_2026_001` (research and history scan). Do not write plugin code until the user approves the extract plan in `TASK_2026_002`.

Target technologies:
- **Remotion `4.0.484`**: showcase and self-shot videos.
- **HyperFrames**: promos (`hyperframes@0.8.98`, `@hyperframes/shader-transitions@0.8.97`) and the editor (`0.8.30`).
- **davinci-resolve-mcp**: vendored at a pinned commit.
- **Nx**: the plugin host.

Target platforms are Windows, macOS and Ubuntu, and all three are first-class in CI. The Ptah-side work (consuming the published package and deleting the moved paths) belongs to Ptah task `TASK_2026_582_a7db`, not to this repository.

### Framework Guidelines
- Before you change the plan, read `docs/decisions.md` and `docs/roadmap.md`. Treat the gate at `TASK_2026_002` as blocking: do not write plugin code until the plan is approved.
- When plugin work starts, use the **nx-workspace-architect** skill for plugin and library layout, generators, executors and TypeScript paths. Use **video-showcase** for the Remotion and Playwright pipeline, and **orchestration** for multi-step tasks.
- Pin every engine version in executors and generators. Never call a bare `npx hyperframes` or an unpinned `@remotion/*`. Keep all `@remotion/*` packages at exactly `4.0.484`.
- Keep the two engines separate. Remotion executors and generators (showcase, self-shot) share no code with HyperFrames ones (promos, editor).
- Process spawning: never spawn `npx.cmd`, because it fails from Git Bash on Windows. Resolve npm's `npx-cli.js` and run it through `process.execPath` with `shell: false`. Pass arguments as arrays, never as interpolated command strings.
- Generated templates take branding from `brand.config.ts` with neutral placeholders. Never put client or product names (including Ptah) in templates.
- Keep the `SELFSHOT_KIT_SLUGS` allowlist and the post-copy guard from `export-kit.mjs` when you port the kit export.
- Test executors on all three operating systems. Path handling must use `path` APIs, never hardcoded separators.

### Coding Standards
- Use TypeScript with strict typing for executors and generators. Define a typed `schema.json` plus a matching TS interface for every executor and generator option.
- Give each executor or generator one responsibility. Isolate process-spawn, version-pinning and file-copy logic in small, testable helpers per engine, and never share them across engines.
- Pinned versions should live in one constants module per engine, not be scattered through call sites.
- Error handling: fail loudly with an actionable message when a pinned binary is missing, a spawn exits non-zero, or a copy guard trips. Never fall back silently to an unpinned version.
- Naming: use kebab-case for files and Nx targets and camelCase for TS symbols. Name engine-specific code by its engine (`remotion-*`, `hyperframes-*`).
- Commits: use Conventional Commits (`feat(plugin): ...`, `docs(specs): ...`, `fix(executor): ...`). Branch from `main` for each task and open a PR. Never push to `main` directly.
- Task specs: in `task.md`, edit only the `status:` line. Put prose in `context.md` and plans, batches and reviews in the recognized file names from `.ptah/specs/README.md`. Allocate new task ids with an exclusive `mkdir`, never from `registry.md`.

### Architecture Notes
Current layout (planning phase):
- `README.md`: the product description.
- `docs/decisions.md`: binding decisions. Read it before you change the plan.
- `docs/roadmap.md`: task dependency order.
- `.ptah/specs/TASK_YYYY_NNN_xxxx/`: one folder per task with `task.md` (machine-owned frontmatter), `context.md` (prose), and plan, batch and review files.
- `.ptah/analysis/` and `.ptah/harness/`: tooling output that is currently untracked.

Planned deliverables. Confirm the final layout in `TASK_2026_002` before you create it:
1. **Nx plugin**: executors and generators for the Remotion engine (showcase, self-shot) and the HyperFrames engine (promos, editor), plus the vendored `davinci-resolve-mcp` at its pinned commit.
2. **Claude plugin marketplace**: skills and agents that drive the plugin.
3. **Workspace preset**: bootstraps a new video workspace with `brand.config.ts` placeholder branding.

Boundaries:
- **Engine isolation**: the Remotion and HyperFrames modules must not import each other. Shared code, if any, is limited to engine-neutral utilities such as the Windows-safe spawn helper and path utilities.
- **Source boundary**: read from `D:/projects/ptah-extension` (or GitHub). Never edit it from this workspace. Ptah-side consumption and deletion belong to `TASK_2026_582_a7db`.
- **Extraction method**: by default, do a clean copy that records the source commit (`e0ca51e6e`). Use a history-preserving extract only if the `TASK_2026_001` history scan is clean.
- **Public-repo hygiene**: copy only paths the history scan cleared. Never commit `.mp4`, `.webm`, `.wav`, `.mp3` or recordings, and keep `.gitignore` rules that enforce this. The `SELFSHOT_KIT_SLUGS` allowlist and the post-copy guard are mandatory.
- **Templates**: generator templates depend only on `brand.config.ts` for identity and must not contain hardcoded brand strings.

Dependency direction: the preset depends on the Nx plugin, and the marketplace skills call the plugin's executors. The plugin never depends on the preset or on the marketplace.
