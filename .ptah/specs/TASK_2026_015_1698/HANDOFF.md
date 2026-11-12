# HANDOFF — TASK_2026_015_1698 (Episode 6 "The P Is Not Silent")

Updated 2026-11-12 22:20 UTC (session 4, direction v4). Read `context.md` for the full
decision log; this file only records the current state.

## Goal

Episode 6, `D:/projects/nx-video/demos/agent-pronounce`, branch `demo/ep06-p-is-not-silent`,
PR #6 (stacked on PR #5). `SPEC.md` in the demo folder is the binding contract; its section
"Direction v3" (user review of 2026-11-12) overrides older text. Pronunciation: p-TAH.

## State

- Direction v3 is committed and pushed as `66defad` (106.831 s): new opening lines N1–N5,
  full-screen landing insert under N3, push into the laptop storm, "Old." in the desert,
  Cursor cut, three separated crews, four full-bleed tour clips, showcase music bed.
- The user is watching the film in the HyperFrames studio (http://localhost:3002/, started
  with `preview --background .`). Stop it when they are done.
- Direction v4 is in SPEC.md (committed as 7e1bf42). Three Opus child sessions build the
  looks; see the next section.

## Direction v4 (2026-11-13) and executors

The user rejected the look ("old looking 90s game") and asked for Opus instead of CLI lanes
for the visual work. `SPEC.md` section "Direction v4" is binding: workspace opening with two
desks and a hero screen, chairs instead of the sofa, seated landing, Ptah presenting the
product on a monumental wide screen with crews working behind, and a look kit for every scene.

1. Running, three Opus child sessions (model opus, effort medium), each on its own branch
   and worktree under .claude-worktrees/, committing locally and not pushing:
   - 0e86981c, branch demo/ep06-v4-workspace-look: src/look-kit.js (opt-in film post
     path), src/look-workspace.js, stills workspace-a/b/c, notes/opus-workspace-lookdev.md.
     It reports after phase 1 (kit + workspace-b); then message 5ee5ecde to merge the kit.
   - 5ee5ecde, branch demo/ep06-v4-desert-look: src/look-desert4.js, stills desert4-a..d,
     notes/opus-desert-lookdev.md.
   - 3b2b1544, branch demo/ep06-v4-ptah-colossus: src/ptah-colossus.js, stills
     colossus-a..c, notes/opus-ptah-colossus.md.
   Verify each still set by eye, merge the branches into demo/ep06-p-is-not-silent, unify
   the office chair model, push. The Codex lane 253bd857 was stopped; its sheet is the
   rejected baseline (snapshots/lookdev/workspace-sheet-rejected.jpg).
2. Waiting on the user: approval of the workspace stills, and of the proposed script v4
   (D1, F1–F4, D5 are new wording; no voice is generated before approval).
3. Next, after approval: animation per scene, then voice (`generate.mjs`), `build-timing.mjs`, `check --json`,
   a draft render to `renders/preview-v4-draft.mp4`, commit and push.
4. The desert list below is superseded where direction v4 changes the scene; keep it as
   a checklist of defects not to repeat.

## Desert polish owed

- Crews haul nothing and look idle: one lashed block per ramp, leader pulling; flag poles
  pass through robots; faces wash out to white near 63–64.6 s.
- Stamp beat is cluttered; inspector cropped at the right edge at 65.1 s.
- Doorway push at 69.5 s crops both robots; the return at 90.5 s leaves them tiny.
- Yellow rings behind the two robots at 91–95 s.
- Title slab is a see-through plane with a vertical seam at 95–96.5 s.
- D2 two-shot (55–58 s): robots small in the lower left.
- Showcase labels: Grok's review asks for a dark plate and labels only on the screen they
  name (`notes/review-grok-v3.md`).

## For the user to confirm

- The tour clips show real usage costs (tour-4), two dark masks (tour-2), chat text naming
  other products (tour-1), the workspace name, session titles and account lines.
- Cursor's cameo is cut entirely; lines N1–N5 are the orchestrator's wording.
- The sofa becomes two office chairs if the workspace restage goes ahead.

## Still open from v2

- Title letters read partly as dark fills, not deep cuts.
- Nobody has listened to the mix (the user can in the studio).

## Lane lessons

- Run one snapshotting lane at a time; parallel captures cause navigation timeouts and a
  hanging `check`.
- Codex lanes stop at a 3 M token budget in 10–17 minutes. Keep briefs narrow and tell lanes
  to view contact sheets only. A resume works when the session has been idle under 600 s.
- Ptah MCP tools do not connect inside lanes; lanes use native tools.
- `node --check` does not catch a runtime ReferenceError (black scene). 3D briefs must ask
  for one headless load with page errors read.
- Grok is expensive (one audio lane: 1% → 32% weekly). Codex weekly 30%, Grok 47%; Glm and
  Kimi are at their limits until 2026-11-16 and 2026-11-25.

## Verify

From the demo folder: `node node_modules/hyperframes/dist/cli.js check --json` and
`snapshot --at <t,...> --output <dir> --timeout 120000`. Look-dev stills:
`node lookdev/shoot.mjs <scene ...>`. From the repo root: `node tools/guards/no-media.mjs`.
