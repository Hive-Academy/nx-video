# Lane A v3 timing

## Changes

V3 running order, six new takes, removed D4, moved O4, new transition and landing cues, 20 s showcase. Reused cached voices and sounds.

## Timeline

| Scene | Start | Duration | Cue / line | Local start | Absolute start | Absolute end |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| office | 0.000 | 36.898 | scene | 0.000 | 0.000 | 36.898 |
| | | | entrance | 4.000 | 4.000 | |
| | | | landingIn | 10.827 | 10.827 | |
| | | | landingOut | 15.327 | 15.327 | |
| | | | tah | 24.087 | 24.087 | |
| | | | spark | 29.658 | 29.658 | |
| | | | dip | 29.858 | 29.858 | |
| | | | rumble | 33.898 | 33.898 | |
| | | | pull | 35.298 | 35.298 | |
| | | | through | 36.898 | 36.898 | |
| | | | end | 36.898 | 36.898 | |
| | | | N1 (Codex) | 4.000 | 4.000 | 6.694 |
| | | | N2 (Claude) | 7.794 | 7.794 | 10.127 |
| | | | N3 (Codex) | 11.227 | 11.227 | 16.753 |
| | | | N4 (Claude) | 17.853 | 17.853 | 19.478 |
| | | | N5 (Codex) | 20.578 | 20.578 | 22.157 |
| | | | S2 (Claude) | 23.257 | 23.257 | 26.358 |
| | | | O1 (Codex) | 27.458 | 27.458 | 30.012 |
| | | | O3 (Codex) | 30.512 | 30.512 | 33.298 |
| vortex | 36.898 | 3.500 | scene | 0.000 | 36.898 | 40.398 |
| | | | land | 2.600 | 39.498 | |
| desert | 40.398 | 56.403 | scene | 0.000 | 40.398 | 96.801 |
| | | | sofaLand | 0.300 | 40.698 | |
| | | | reveal | 1.800 | 42.198 | |
| | | | rise | 5.000 | 45.398 | |
| | | | pan | 19.152 | 59.550 | |
| | | | stamp | 25.012 | 65.410 | |
| | | | portal | 29.977 | 70.375 | |
| | | | pushIn | 29.977 | 70.375 | |
| | | | showcaseEnd | 49.977 | 90.375 | |
| | | | d6 | 50.777 | 91.175 | |
| | | | titleTilt | 54.403 | 94.801 | |
| | | | end | 56.403 | 96.801 | |
| | | | O4 (Conductor) | 5.000 | 45.398 | 46.591 |
| | | | D1 (Conductor) | 7.643 | 48.041 | 52.612 |
| | | | D2 (Claude) | 13.314 | 53.712 | 58.310 |
| | | | D3 (Conductor) | 19.012 | 59.410 | 67.675 |
| | | | D5 (Conductor) | 27.777 | 68.175 | 71.796 |
| | | | D6 (Codex) | 50.777 | 91.175 | 94.101 |
| intro | 96.831 | 6.000 | scene | 0.000 | 96.831 | 102.831 |
| | | | chisel | 0.600 | 97.431 | |
| | | | tag | 3.200 | 100.031 | |
| | | | line | 4.200 | 101.031 | |
| | | | end | 6.000 | 102.831 | |
| endcard | 102.831 | 4.000 | scene | 0.000 | 102.831 | 106.831 |
| | | | end | 4.000 | 106.831 | |

Total: 106.831 s.

## Line gaps

| From ? to | Gap (s) |
| --- | ---: |
| N1 ? N2 | 1.100 |
| N2 ? N3 | 1.100 |
| N3 ? N4 | 1.100 |
| N4 ? N5 | 1.100 |
| N5 ? S2 | 1.100 |
| S2 ? O1 | 1.100 |
| O1 ? O3 | 0.500 |
| O3 ? O4 | 12.100 |
| O4 ? D1 | 1.450 |
| D1 ? D2 | 1.100 |
| D2 ? D3 | 1.100 |
| D3 ? D5 | 0.500 |
| D5 ? D6 | 19.379 |

## New takes

| Row | File | Duration (s) | Word timing check |
| --- | --- | ---: | --- |
| N1 | assets/audio/vo/n1-codex.mp3 | 2.694 | Pass: 6/6 words in order; last app. |
| N2 | assets/audio/vo/n2-claude.mp3 | 2.183 | Pass: 7/7 words in order; last do? |
| N3 | assets/audio/vo/n3-codex.mp3 | 5.526 | Pass: 11/11 words in order; last plan. |
| N4 | assets/audio/vo/n4-claude.mp3 | 1.625 | Pass: 4/4 words in order; last called? |
| N5 | assets/audio/vo/n5-codex.mp3 | 1.579 | Pass: 3/3 words in order; last problem. |
| D3 | assets/audio/vo/d3-ptah-room.mp3 | 8.265 | Pass: 12/12 words in order; last checked. |

## Mix

- 28 clips; integrated loudness -19.56 LUFS; true peak -2.79 dBTP; LRA 9.3 LU.
- Scene RMS: office -23.9, vortex -20.9, desert -22.9, intro -22.1, endcard -28.5 dBFS.

## Verification

- `node scripts/audio/generate.mjs`: exit 0; new N1-N5 and D3 generated. A first rerun failed on a malformed ffmpeg fade duration; corrected and final rerun exited 0.
- `node src/build-timing.mjs`: exit 0; 106.831 s.
- `node tools/guards/no-media.mjs`: exit 0; 432 files, no violations.
- `node scripts/audio/measure-mix.mjs`: exit 0; numbers above.
- Cue assertions: O4-D1 gap 1.450 s; landing insert 4.500 s; N4 starts 2.526 s after landingOut; stamp matches checked at 65.410 s; showcase 20.000 s; D6 0.800 s after showcaseEnd; wind 5.100 s.
- `node node_modules/hyperframes/dist/cli.js check --json`: exit 0, `ok: true`, duration 106.831 s, zero errors. Lint: 3 warnings; runtime: 1 warning; review: 1 warning; motion and contrast: zero warnings. Expected 3000 ms render-ready warning appeared first.

## Decisions

- `Conductor` is the existing Ptah voice and uses the existing deep room treatment.
- Existing three showcase videos are looped across 20 s pending overlay redesign.
- Cached thunder and sandstorm are processed for a low rumble and rising wind; wind carries to desert start.
- Skill discovery and Ptah tools were unavailable; local file and CLI tools were used.

## Open defects

- V3 landing insert and four-clip showcase overlay are assigned to a later lane. This pass provides cues and a three-clip loop only.
- HyperFrames reports non-blocking warnings: two local nested-media start times, repeated sweep tween baseline, office ambience slot about 0.08 s longer than media, and edge/overflow review findings.
- No frames or video were captured, as instructed.
