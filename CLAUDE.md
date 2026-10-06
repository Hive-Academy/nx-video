# nx-video — agent guide

This repository turns the video tooling from Ptah into a public Nx plugin, a Claude plugin marketplace and a workspace preset. Read `README.md` for the product. Read `docs/decisions.md` before you change the plan.

## Status

Planning. The repository has documents and tasks only. The work starts with `TASK_2026_001` (research). Do not write plugin code before the user approves the extract plan in `TASK_2026_002`.

## Source repository

The code to extract is in the Ptah repository:

- Local: `D:/projects/ptah-extension`
- GitHub: `Hive-Academy/ptah-extension`
- Baseline commit for the inventory: `e0ca51e6e` on `main` (2026-10-06)

The parent task in Ptah is `TASK_2026_582_a7db` (`.ptah/specs/TASK_2026_582_a7db/context.md`). It keeps the Ptah-side work: Ptah consumes the published package and deletes the moved paths. That work is not done in this repository.

Read from the source repository. Do not edit it from this workspace.

## Hard rules

1. **No private media or recordings.** This repository is public. Copy only files that the history scan in `TASK_2026_001` cleared. Keep the `SELFSHOT_KIT_SLUGS` allowlist and the post-copy guard from `export-kit.mjs`. Never commit `.mp4`, `.webm`, `.wav`, `.mp3` or recordings.
2. **No history-preserving extract** unless the scan is clean. A clean copy with a source-commit reference is the default.
3. **Pinned versions.** Executors and generators call pinned versions, never a bare `npx hyperframes`:
   - HyperFrames `0.8.30` for the editor.
   - `hyperframes@0.8.98` and `@hyperframes/shader-transitions@0.8.97` for HyperFrames projects.
   - Remotion `4.0.484` for all `@remotion/*` packages.
   - The vendored `davinci-resolve-mcp` commit.
4. **Two engines, no shared code.** Remotion for showcase and self-shot. HyperFrames for promos and the editor.
5. **Windows is a first-class platform.** `npx.cmd` cannot be spawned from Git Bash. Run npm's `npx-cli.js` through `node` with no shell. CI runs on Windows, macOS and Ubuntu.
6. **No client or product names in templates.** Generated templates use neutral placeholder branding through `brand.config.ts`.

## Tasks

Tasks live in `.ptah/specs/TASK_YYYY_NNN_xxxx/`. Follow `.ptah/specs/README.md`:

- `task.md` is machine-owned frontmatter. Change only the `status:` line.
- Prose goes in `context.md`. Plans, batches and reviews go in the recognized file names.
- Allocate a new id with an exclusive `mkdir`, never from `registry.md`.

`docs/roadmap.md` shows the dependency order.

## Git

- Conventional commits (`feat(plugin): ...`, `docs(specs): ...`).
- Branch from `main` for each task. Open a pull request. Do not push to `main` directly after the initial commit.
