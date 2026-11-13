# Lane A — The P Is Not Silent

## Built

- Replaced Episode 2 script, cast, audio cue layout, timeline generator, captions, screen, vortex card and desktop app overlay for the revised Episode 6 contract.
- Generated all 12 ElevenLabs VO lines. Ptah uses the Conductor voice with a low, roomy parallel send; D6 uses a quieter, slower delivery. Generated 12 SFX, a 10.0 s oud and synth intro theme, and a 3.0 s end sting. A separate oud pluck hits card1–card6 and tag; the chisel SFX hits at 7.8 s. Forced alignment writes word timings to `assets/audio/cues.json`.
- Copied the three landing clips into `assets/live-demo`. Restore source: `D:\projects\ptah-extension\apps\ptah-landing-page\public\assets\live-demo\*.mp4`, revision `a255d2327`.
- Rewrote README and updated the restore script. `compositions/intro.html` and `compositions/endcard.html` were not overwritten.

## Running order

| Scene | Start (s) | Duration (s) |
| --- | ---: | ---: |
| screen | 0.000 | 7.440 |
| office | 7.467 | 14.367 |
| vortex | 21.867 | 3.000 |
| desert | 24.867 | 26.265 |
| app-window overlay | 45.485 | 5.647 |
| intro | 51.133 | 10.000 |
| endcard | 61.133 | 3.000 |

Total: 64.133 s. D3 to D4 gap: 0 s.

## Cues

| Scene | Named cues, scene-local seconds |
| --- | --- |
| screen | nextTab 4.472, tah 5.432, end 7.440 |
| office | spark 4.580, dip 4.780, bolt 8.208, flash 12.594, end 14.367 |
| vortex | land 2.600 |
| desert | sofaLand 0.300, rise 0.800, pan 10.789, cursorPass 16.401, stamp 16.510, portal 20.618, end 26.265 |
| intro | card1 .600, card2 1.800, card3 3.000, card4 4.200, card5 5.400, card6 6.600, chisel 7.800, tag 8.800 |
| endcard | end 3.000 |

## Snapshots

- `snapshots/lane-a-final/frame-00-at-3.2s.png`: T3 Code card and its logo are legible; caption is in the lower safe zone.
- `snapshots/lane-a-final/frame-01-at-5.75s.png`: Ptah hero, emblem, wordmark and lightning are visible on the S2 pronunciation.
- `snapshots/lane-a-final/frame-02-at-22.7s.png`: location card is legible; the shared 3D vortex background is blank in the current render.
- `snapshots/lane-a-final/frame-03-at-47.4s.png`: desktop frame is legible and a landing clip plays; the shared 3D desert background is blank in the current render.

## Checks

- ElevenLabs QA transcription completed for all 12 lines. S1, O3, O4 and D1–D6 matched after normalization. S2 and O1 received phonetic “tah” flags; O2 has number-form and phonetic flags, but after regeneration transcribes “Pita”.
- HyperFrames check after the first pass found 3 missing nested video timing attributes; fixed. A later pass found a captions-layer occlusion error; fixed by making the caption composition transparent. The final pass also clamped each six-word caption group to the next group's start to remove text overlap. Final `check --json`: `ok: true`, 0 lint errors, 2 nested media timing warnings, 0 runtime errors, 0 layout errors, 0 layout warnings.
- `ffprobe` measured the intro theme at 10.000000 s and the end sting at 3.000000 s.
- `node tools/guards/no-media.mjs`: passed, 304 tracked files checked, no violations.
- Ptah diagnostics tool reported unavailable because no tsconfig owns the changed JavaScript files.

## Decisions

- Kept the approved revised cast and D3/D4 sentence handoff from SPEC.md. The line transition is zero gap, while other replies retain at least .35 s and punchline replies .6 s.
- Used a parallel low and echo send for Ptah so the dry voice retains consonant clarity; reversible in `scripts/audio/generate.mjs`.
- Kept Lane C's existing intro/endcard files and generated a placeholder only when one was absent; Lane C owns their final visuals.

## Limitations

- The shared 3D vortex and desert backgrounds render blank in Lane A's final snapshots; Lane B owns `src/scene.js`. Lane C owns the intro and endcard visuals.
- The intro music is fixed at exactly 10.0 s. The separately timed oud plucks and chisel establish the specified beats; the generated bed's own transients were not independently verified in the waveform.
- The HyperFrames CLI skill was not available through this lane's tool catalogue; snapshot syntax came from the installed CLI help.
