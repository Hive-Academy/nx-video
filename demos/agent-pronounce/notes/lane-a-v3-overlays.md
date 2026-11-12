# Lane A v3 overlays

## Changes

- Added a full-width landing video overlay from 10.827 to 15.327 s, with a 0.3 s fade at each end and a 1.00–1.12 push. N3 captions remain on the higher caption track.
- Replaced the framed three-clip window with four full-bleed, seek-timed 5 s tour clips. Labels use 76 px Georgia, the film's gold accent, a dark lower-left gradient, and a 5% left safe margin. Transitions dissolve in 0.25 s; the doorway glow clears in 0.6 s.
- Added a master audio gain and limiter, reused cached desert wind across the showcase, and reused cached office ambience under the end-card tail. No cue or line timing changed.

## Showcase timeline

| Clip | Absolute start–end (s) | Label | Punch-in | Origin (from EDL centre) |
|---|---:|---|---:|---|
| tour-1.mp4 | 70.375–75.375 | One Command Center | 1.00–1.20 | 59.896%, 40.278% |
| tour-2.mp4 | 75.375–80.375 | Agents In Parallel | 1.00–1.23 | 45.313%, 45.370% |
| tour-3.mp4 | 80.375–85.375 | Review Every Change | 1.00–1.19 | 69.792%, 53.009% |
| tour-4.mp4 | 85.375–90.375 | Track Every Run | 1.00–1.18 | 51.563%, 51.389% |

## Scorecard

[Contact sheet](../snapshots/lane-a-v3-overlays/contact-sheet.jpg): 22 requested frames, 600 px cells, time printed on each. Scores cover subject, set, light, effect, text/safe area and continuity together; all sampled frames are at least 4/5.

| Time (s) | Subject / set | Light / effect | Text / safe area | Continuity | Score |
|---:|---|---|---|---|---:|
| 10.6 | Robots / office | Laptop glow | Caption clear | Before insert | 5 |
| 10.9 | Landing hero / office | Fade entering | No label; caption clear | Insert starts | 4 |
| 12 | Landing hero | Black surround, push | Caption clear | Page advancing | 5 |
| 13.5 | Landing desktop | Push | Caption clear | Later page section | 5 |
| 15.2 | Robots / office | Fade complete | Caption clear | Insert ending | 4 |
| 15.5 | Robots / office | Normal light | Caption clear | Office restored | 5 |
| 70.2 | Desert doorway | Warm light | Caption clear | Before showcase | 5 |
| 70.6 | Tour 1 | Doorway wash clears | Caption clear | Clip 1 entered | 4 |
| 71.2 | Tour 1 | Full bleed | Label inside margin | Video advancing | 5 |
| 73 | Tour 1 | Eased push | Label inside margin | Later chat frame | 5 |
| 75.2 | Tour 1 | Push hold | Label exited on schedule | Before cut | 4 |
| 75.5 | Tour 2 | Quick dissolve | Label entering | New clip | 4 |
| 78 | Tour 2 | Full bleed | Label inside margin | Later agent frame | 5 |
| 80.3 | Tour 2 | Push hold | Label exited | Before cut | 4 |
| 80.6 | Tour 3 | Quick dissolve | Label entering | New diff frame | 4 |
| 83 | Tour 3 | Full bleed | Label inside margin | Later diff frame | 5 |
| 85.3 | Tour 3 | Push hold | Label exited | Before cut | 4 |
| 85.6 | Tour 4 | Quick dissolve | Label entering | New chart frame | 4 |
| 88 | Tour 4 | Full bleed | Label inside margin | Later chart frame | 5 |
| 90.2 | Desert doorway | Fade back | No showcase label | Showcase exit | 4 |
| 90.5 | Desert doorway | Warm light | No overlay | Desert restored | 5 |
| 91.3 | Ptah / desert | Daylight | No overlay | D6 follows | 5 |

## Mix

- `node scripts/audio/measure-mix.mjs`: 32 clips; **−16.89 LUFS**, **−1.41 dBTP**, LRA 18.5 LU. Target −16.5 ± 0.7 LUFS and peak ≤ −1.0 dBTP met.
- Under the landing insert: N3 speech and the existing quiet office-night bed. Under the 20 s showcase: looped cached desert wind throughout, plus the existing choir swell at entry and window-return swell at exit. The tour files have no audio.
- A −70 dBFS / 1 s silence scan of the measured mix found no interval. A first scan found a 1.95 s end-card tail; the cached office-night ambience now covers it.

## Verification

- `node src/build-timing.mjs`: exit 0; total 106.831 s. `src/timing.json` retains landingIn 10.827, landingOut 15.327, pushIn 70.375 and showcaseEnd 90.375 s absolute.
- `node node_modules/hyperframes/dist/cli.js check --json`: initial check exit 0; final post-audio check reports `"ok": true`, 13/13 checks passed (PowerShell pipeline exit 1 because the readiness warning was redirected).
- Three sequential snapshot batches captured all 22 requested times (8, 8, 6) and generated the linked contact sheet. No video render.
- `node tools/guards/no-media.mjs` from repository root: exit 0, 432 files checked, no violations.
- Ptah tools and skill discovery were unavailable in this lane; local CLI and file tools used.

## Decisions

- Clips are controlled by HyperFrames video elements with their own slot-relative `data-start` and `data-duration`. The parent composition is clocked at the desert pushIn cue.
- Kept tour labels off during the final 0.4 s of each clip. The showcase fades back before its end cue so the desert is fully visible for D6.
- Did not modify 3D scene files, source clips, intro/endcard compositions, or the timing values.

## Open defects

- None identified in the captured frames or checks.

