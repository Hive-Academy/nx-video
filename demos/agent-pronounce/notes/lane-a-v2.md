## Skills loaded

- `D:/projects/nx-video/tools/skills/video-quality-bar/SKILL.md`: “A lane that has not met this bar has not finished, whatever its exit code.” This is the loaded-skill canary.
- `hyperframes-core`, `hyperframes-cli`, and `hyperframes-audio`: unavailable in the supplied skill directory and repository search. The installed HyperFrames 0.8.98 CLI help was used as fallback.

## Changes

- Set the generated canvas, owned 3D hosts, vortex location card, captions, and app overlay to 1920 × 1080. `src/timing.json` exposes `width: 1920`, `height: 1080` for Lane B.
- Rebuilt the app overlay as a centered 1740 px Electron-style Ptah window with a warm light background, three 5.6 s clips, slow 1.00→1.04 footage push, light sweep clip transitions, and labels below the content.
- Kept every existing scene cue and added `reveal`, `pushIn`, `showcaseEnd`, `d6`, and `titleTilt`. Removed cast-card cues and plucks. Intro and endcard are fixed at 6 and 4 s.
- D3→D4 is 0.2 s, the single interruption exception. Other speaker gaps are 1.05–1.2 s. The cached S2 take was shortened by 0.15 s of silence between “Hmm” and “Tah”; its phrase gaps are now 0.52 and 0.51 s. D2's pause is 0.60 s.
- Transition sounds overlap scene boundaries: flash boom and sandstorm, desert wind before landing, choir swell into doorway, a soft choir return into D6, and a chisel scrape into the title wall. Existing cached takes were reused; no TTS was regenerated.

## Timeline

| Scene | Start | Duration | Cues (local seconds) |
| --- | ---: | ---: | --- |
| office | 0.000 | 18.534 | entrance 4, tah 4.830, spark 10.351, dip 10.551, crackle 13.165, bolt 13.965, flash 15.861, end 18.534 |
| vortex | 18.567 | 3.500 | land 2.600 |
| desert | 22.067 | 50.365 | sofaLand .300, reveal 1.800, rise 3.200, pan 14.589, cursorPass 20.401, stamp 20.510, portal/pushIn 27.139, showcaseEnd 43.939, d6 44.739, titleTilt 48.365, end 50.365 |
| intro | 72.433 | 6.000 | chisel .600, tag 3.200, line 4.200, end 6.000 |
| endcard | 78.433 | 4.000 | end 4.000 |

Total: **82.433 s**. Absolute cues Lane B/C need: sofaLand 22.367, reveal 23.867, D1 25.267, pushIn 49.206, showcaseEnd 66.006, D6 66.806, titleTilt 70.432, title wall 72.433, endcard 78.433. Canvas 1920 × 1080. Intro 6.0 s; endcard 4.0 s.

## Mix

`node scripts/audio/measure-mix.mjs`: 26 clips, −17.45 LUFS integrated, −1.32 dBTP true peak, 13.7 LU LRA. Scene RMS: office −20.5, vortex −17.6, desert −22.3, intro −22.1, endcard −28.5 dBFS.

## Look-dev match

No approved v2 landscape look-dev still was supplied for the owned overlay. The 3D sets and title/endcard are owned by Lanes B/C. The showcase render was reviewed at `snapshots/lane-a-v2/frame-10-at-50.5s.png`; a formal still match is unavailable.

## Scorecard

The 21 requested frames were captured and reviewed through `snapshots/lane-a-v2/contact-sheet-1.jpg` through `contact-sheet-3.jpg`, combined at `contact-sheet.jpg`. The capture preceded the 0.15 s S2 silence trim; downstream cue timestamps shifted 0.133 s. A separate 49.3 s doorway frame after the final generator change is appended to the combined sheet and confirms warm light fills the frame as the window resolves.

| Frames | Subject | Set | Light | Effect | Text / safe area | Continuity | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Office 0, 4.5, 12 s | 4 | 3 | 4 | 3 | 4 | 4 | Lane B set/effects need restage |
| Vortex 18.7 s | 4 | 4 | 4 | 4 | 4 | 4 | Pass for owned location transition |
| Desert 22.2–49.339, 66.2–70.6 s | 1 | 1 | 1 | 1 | 1 | 1 | Black 3D render; Lane B defect |
| Showcase 50.5–65 s | 5 | 4 | 4 | 4 | 5 | 4 | Owned overlay passes |
| Intro 72.567 s | 1 | 1 | 1 | 1 | 1 | 1 | Blank title wall; Lane C defect |
| Endcard 78.567 s | 3 | 3 | 3 | 3 | 3 | 3 | Old cast card; Lane C defect |

Frame-by-frame paths and scores (columns S, Set, L, E, T, C use the scorecard rows above):

| Frame path | S | Set | L | E | T | C | Pass? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `frame-00-at-0s.png` | 4 | 3 | 4 | 3 | 4 | 4 | No |
| `frame-01-at-4.5s.png` | 4 | 3 | 4 | 3 | 4 | 4 | No |
| `frame-02-at-12s.png` | 4 | 3 | 4 | 3 | 4 | 4 | No |
| `frame-03-at-18.7s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Yes |
| `frame-04-at-22.2s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-05-at-24s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-06-at-25.4s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-07-at-31s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-08-at-42s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-09-at-49.339s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-10-at-50.5s.png` | 5 | 4 | 4 | 4 | 5 | 4 | Yes |
| `frame-11-at-53.5s.png` | 5 | 4 | 4 | 4 | 5 | 4 | Yes |
| `frame-12-at-56s.png` | 5 | 4 | 4 | 4 | 5 | 4 | Yes |
| `frame-13-at-59.5s.png` | 5 | 4 | 4 | 4 | 5 | 4 | Yes |
| `frame-14-at-61.5s.png` | 5 | 4 | 4 | 4 | 5 | 4 | Yes |
| `frame-15-at-65s.png` | 5 | 4 | 4 | 4 | 5 | 4 | Yes |
| `frame-16-at-66.2s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-17-at-67s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-18-at-70.6s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-19-at-72.567s.png` | 1 | 1 | 1 | 1 | 1 | 1 | No |
| `frame-20-at-78.567s.png` | 3 | 3 | 3 | 3 | 3 | 3 | No |
| `../lane-a-v2-doorway/frame-00-at-49.3s.png` | 5 | 4 | 4 | 4 | 5 | 4 | Yes |

## Credits

No new external assets. The three existing untracked live-demo clips are reused.

## Open defects

- Desert renders black in the current shared 3D scene. Lane B must stage and verify its set at the new aspect ratio.
- Intro start is blank and the endcard still displays an old cast card. Lane C must replace those compositions; the old endcard includes “OPENCODE”, which violates the no competitor rule.
- The first `check --json` run reported a generated overlay syntax error, which was fixed. The final software-rendered `check --json --no-browser-gpu --timeout 120000` did not return after its startup timeout, so the required `ok` result is unverified. Rerun after the Lane B/C compositions land.
- The Ptah MCP tools were absent from this lane's tool catalogue; native file and CLI tools were used as fallback. No parent report could be sent through that server.
