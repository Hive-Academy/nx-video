**Task Folder**: /home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6
**Deliverable**: /home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6/implementation-plan.md

Write the implementation plan for TASK_2026_002 (extract the Ptah video tooling into the public `nx-video` repo). This plan is the user's approval gate — no plugin code is written before it is approved. Do not write code; do not modify any file other than the deliverable (you may propose `docs/roadmap.md` and `docs/decisions.md` changes inside the plan as an explicit "Doc updates on approval" section rather than editing them).

Read, in order:
1. /home/amun/projects/nx-video/CLAUDE.md, /home/amun/projects/nx-video/README.md, /home/amun/projects/nx-video/docs/decisions.md, /home/amun/projects/nx-video/docs/roadmap.md
2. /home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6/context.md and decisions.md
3. /home/amun/projects/nx-video/.ptah/specs/TASK_2026_001_3d3a/research-report.md (incl. "User answers") and research-part-c-nx.md (recommended layout, caching, preset, e2e) — and decisions.md rows 11–17 there
4. /home/amun/projects/nx-video/.ptah/specs/TASK_2026_002_dcb6/parity-inventory.md — the authoritative per-file fate list (374 baseline files). Use it; do not re-inventory.
5. Source, read-only full-history clone without working tree: /home/amun/projects/ptah-extension (baseline e0ca51e6e). Use git plumbing only (`git -C … show e0ca51e6e:<path>`, `grep`, `ls-tree`) to verify contracts you design (e.g. export-kit.mjs, showcase-manifest exports, studio package.json scripts, hyperframes scripts).

Settled facts you must honour (user-approved): Nx 24 (develop on 24.0.1, peers >=23 <25); clean copy from e0ca51e6e with source-commit reference; npm publish via granular token GitHub secret + provenance (NOT OIDC); Remotion Free License (single developer) with README notice; davinci-resolve-mcp downloaded by the `editor` generator at samuelgursky/davinci-resolve-mcp @ 6eca4bfc371a1c2f7cb2961efee651ab07436378 (MIT, marked unconfirmed); HyperFrames as pinned npm deps; hybrid executors + `createNodes` (not createNodesV2); all CLAUDE.md hard rules (pinned versions in one constants module per engine, two engines with no shared code except engine-neutral spawn/path utils, Windows-safe spawn via npx-cli.js + process.execPath + shell:false, no brand names in templates, SELFSHOT_KIT_SLUGS allowlist + post-copy guard preserved, no media committed).

The plan must contain:
- **Repository layout** (projects, folders, Nx targets, tags and module-boundary rules enforcing engine isolation).
- **Contracts**: for each generator (init, studio, scene, editor, hyperframes-project, frame, preset, and any the inventory implies e.g. kit) and executor (render, narrate, selfshot, capture, doctor, assemble, check, and others implied): options schema (fields, types, defaults), files written/read, pinned versions used, cache inputs/outputs, failure behaviour with actionable messages.
- **Mapping**: how each inventory decision group (move-generic, move-template) lands in that layout — reference inventory rows by path/glob, don't repeat all 374.
- **Neutral replacements** for excluded assets the generic studio/_smoke still needs (music, brand icon, models): what they are and how they are produced without committing media.
- **Guards**: recording leak guard, `.gitignore` media rules, layout-ignore CI rule (AC6, AC9), the ported export-kit guard.
- **CI**: Windows/macOS/Ubuntu matrix, local Verdaccio e2e, release with token + provenance.
- **Order of work**: map to roadmap tasks 003–013; say if the task split should change.
- **Ptah-side plan** (for Ptah TASK_2026_582_a7db, not done here): how Ptah consumes the package after first publish, using the inventory's "Ptah-side touch points" and "Drift since baseline".
- **Risks** and **Open items** (e.g. unconfirmed davinci upstream, editor 0.8.30 package name, missing `.mcp.json` entry).
- `## Decisions` (decision, options, evidence, reversible) and `## Lane-introduced constraints` (only rules that are neither user-requested nor project rules), `## Proposed Removals` (should be empty unless you find a capability to drop; removals need user approval).

Keep it decision-dense and verifiable; cite source file:line where a contract depends on existing code. Reply with `WROTE: <path>` + a one-line verdict.