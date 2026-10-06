# Context

## Intent

Turn the inventory in `docs/decisions.md` into a confirmed list and a plan. This is the approval gate: no plugin code is written before the user approves `implementation-plan.md`.

## Inputs

- `TASK_2026_001` `research-report.md` (which paths are safe).
- Ptah `TASK_2026_582_a7db/context.md` (the original inventory and constraints).
- Source baseline: `D:/projects/ptah-extension` at `e0ca51e6e`.

## Work

1. **Full scan of the source repository.** Confirm every unit that moves. Search for:
   - All imports of `@ptah-extension/showcase-manifest`.
   - CI jobs, `package.json` scripts and Nx targets that call the video scripts.
   - The `davinci-resolve` entry in the root `.mcp.json`.
   - The `ptah-video` plugin in `apps/ptah-extension-vscode/assets/plugins/ptah-video/` and the `video-director` template in the agent-generation templates. Both ship through the Ptah content manifest.
   - Scripts not in the original list: `render-promo.mjs` (PromoReel), `record-tui.mjs`, `probe-tui.mjs`, `tui-frames.mjs`, `master.mjs`, `polish.mjs`, `gen-qr.mjs`, `render-outro.mjs`. Decide for each: move, stay in Ptah, or drop.
2. **Split each unit into generic and Ptah-specific parts.** Ptah scenes, the `ptah-ui` kit components and the Ptah promo projects stay in Ptah.
3. **Map each generic part to its target** in this repository: plugin source, generator template files, executor, or marketplace entry.
4. **Design the generator and executor contracts**: options schema, files written, and the pinned versions that each one uses.
5. **Plan the Ptah-side change** for Ptah `TASK_2026_582_a7db`: how Ptah consumes the package after the first publish.

## Output

- `parity-inventory.md` — every source file with its target or the reason it stays.
- `implementation-plan.md` — the repository layout, the contracts and the order of work. Update `docs/roadmap.md` if the task split changes.

## Acceptance

- No source file is unaccounted for.
- The user approves the plan. Record the approval with a date in `docs/decisions.md`.
