**Task Folder**: /home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6
**Deliverable**: /home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6/implementation-plan.md

Your full task brief is saved at /home/amun/projects/nx-video/.ptah/subagent-handoffs/toolu_01JXoghibsEojsuG6PUSDXon.task.md — Read it first and follow it exactly (inputs, settled facts, required plan sections, reply format).

A previous architect on this same task was stopped by the context budget monitor at 150k tokens before writing anything, because it read the 113 KB `parity-inventory.md` in full. Handoff record: `/home/amun/projects/nx-video/.ptah/subagent-handoffs/20261026T155052260Z-6332e9bfbf85067b-toolu_01JXoghibsEojsuG6PUSDXon-01c5ddea.handoff.md`. No files were changed by it; start from scratch, but obey this context budget:

- **Never Read `parity-inventory.md` whole.** Use only: `sed -n '1,20p' <file>` (Totals), `sed -n '399,516p' <file>` (historical editor, Ptah-side touch points, drift, script decisions, decisions), and the moving rows only: `grep -E '\| move-(generic|template) \|' <file> | cut -d'|' -f3,6 | sed 's/  */ /g'` (132 rows: source path and target). That is all the inventory you need; reference rows by path/glob in the plan.
- Read research-part-c-nx.md only from "## Recommended layout" to the end (`sed -n '108,200p'`); the research-report.md is short enough to read whole.
- Source-repo verification via git plumbing must be targeted (`git show e0ca51e6e:<file> | sed -n 'a,bp'`, `git grep -n <pattern> e0ca51e6e -- <path> | head`). At most ~15 such checks; prioritise export-kit.mjs, showcase-manifest exports, the studio `package.json`/`project.json`, and the hyperframes scripts.
- Write the plan in one or two Write calls. Aim for a dense plan (roughly 400–700 lines), not an essay.

Reply with `WROTE: <path>` + a one-line verdict.