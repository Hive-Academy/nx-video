# HANDOFF — TASK_2026_015_1698 (Episode 6 "The P Is Not Silent")

Updated 2026-11-09 (session 3). Read `context.md` for the full decision log; this file only
records the current state.

## Goal

Episode 6, `D:/projects/nx-video/demos/agent-pronounce`, branch `demo/ep06-p-is-not-silent`.
`SPEC.md` in the demo folder is the binding contract. Pronunciation: p-TAH, P spoken.

## Done and verified (committed on the branch)

- Timeline: 62.8 s cut. Office 0–17.834 s, vortex 3.5 s (`land` cue 2.6 s per SPEC), desert
  28.415 s, intro from 49.8 s, end card from 59.8 s.
- Office round 5 accepted (crane-down entrance, skyline live for the whole scene).
- Desert round 5 accepted (three sled crews, light-tethered stamp, portal from round 3).
- Intro round 1 accepted (STARRING card plus six cast cards, no white frame).
- End card accepted. `check --json` ok, no-media guard passes.

## Open minor items (not blocking)

- Near lead robot cropped at 36.5 s; stamp has a plain face; faint ceiling boundary during the
  bolt; lamp edge cropped in the earliest office frames; Ptah card slightly cropped on the
  intro line-up.
- Timing (from the Glm code review): D3→D4 gap 0.1 s; phrase gaps inside the S2/D2 takes.
- Missing snapshot probes at tah, crackle, hold, rise and desert end.

## Blocked

- Cross-vendor visual review: no vision-capable non-Codex lane has room. Grok is at its limit
  until 2026-11-12 20:04 UTC, Antigravity until about 2026-11-15, Kimi until 2026-11-25;
  Copilot and OpenCode are disabled; Glm cannot view images. Re-enabling Copilot or OpenCode
  unblocks it.
- The user has not answered whether the intro keeps the Cursor, Antigravity and OpenCode cast
  cards. Current assumption: they stay.

## Next steps

1. Audio and SFX mix pass (`scripts/audio/measure-mix.mjs`), deciding the timing items above.
2. Build a preview for the user; render only after the user approves.
3. Cross-vendor visual review when a lane is available.
4. Verify from the demo folder with `node node_modules/hyperframes/dist/cli.js check --json` and
   `snapshot --at <t,...> --output <dir> --timeout 120000`; from the repo root run
   `node tools/guards/no-media.mjs`.
