# HANDOFF — TASK_2026_015_1698 (Episode 6 "The P Is Not Silent")

Updated 2026-11-10 (session 3, direction v2). Read `context.md` for the full decision log; this
file only records the current state.

## Goal

Episode 6, `D:/projects/nx-video/demos/agent-pronounce`, branch `demo/ep06-p-is-not-silent`,
PR #6 (stacked on PR #5). `SPEC.md` in the demo folder is the binding contract; its section
"Direction v2" (user review of 2026-11-10) overrides older text. Pronunciation: p-TAH.

## Done and verified from contact sheets (direction v2)

- Format 16:9, 1920 × 1080. Total 82.433 s. Office 0–18.534 s, vortex 3.5 s, desert 50.365 s
  (showcase overlay from local 27.139 to 43.939 s), title wall 6 s from 72.433 s, end card 4 s.
- Pacing: speaker gaps 1.05–1.2 s; D3→D4 is 0.2 s on purpose (interruption).
- Showcase: app window 1740 px wide, three clips of 5.6 s each.
- Office and vortex pass in landscape (`snapshots/lane-b-office-v2`).
- Desert round 4 passes (`snapshots/lane-b-desert-v2-r4`, crews pan in `-r3`).
- Title wall round 2 and end card pass (`snapshots/lane-c-v2-r2`). The cast catalogue is cut.
- `check --json` ok when run alone; no-media guard passes.

## Open minor items

- Vortex opens from white straight into the tumble; the floor falling away is not visible.
- At 70.8 s the title slab appears behind the robots abruptly.
- Crews in the pan (37–42 s) are smaller than asked.
- Title letters still read partly as dark fills, not deep cuts.
- The mix was measured (−17.45 LUFS, −1.32 dBTP) but nobody has listened to it.
- No look-dev stills were approved for the landscape version.

## Blocked

- Cross-vendor visual review: only Codex has room. Grok until 2026-11-12 20:04 UTC, Kimi until
  2026-11-25, Antigravity unreadable, Copilot and OpenCode disabled.

## Lane lessons

- Run one snapshotting lane at a time; parallel captures cause navigation timeouts and a
  hanging `check`.
- Codex lanes stop at a 3 M token budget in 10–17 minutes. Keep briefs narrow, tell lanes to
  view contact sheets only, and expect a fresh lane (not a resume) after a budget stop.

## Next steps

1. Show the user the draft preview (`renders/preview-v2-draft.mp4`, git-ignored) and collect
   feedback. Render the final only after the user approves.
2. Fix the open minor items the user cares about, one lane at a time.
3. Cross-vendor visual review when a lane is available.
4. Verify from the demo folder with `node node_modules/hyperframes/dist/cli.js check --json` and
   `snapshot --at <t,...> --output <dir> --timeout 120000`; from the repo root run
   `node tools/guards/no-media.mjs`.
