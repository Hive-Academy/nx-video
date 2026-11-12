## Skills loaded

- D:/projects/nx-video/tools/skills/video-quality-bar/SKILL.md: "Every snapshot frame scores **≥ 4 on every row** of `references/scorecard.md`."
- D:/projects/nx-video/tools/skills/threejs-scene-craft/SKILL.md: "Everything is a pure function of the seek time `t`."

## Black frame root cause

Headless Chrome loaded notes/scratch-3d.html?scene=desert&t=5 and reported **ReferenceError: Cannot access 'portalNear' before initialization** at src/set-desert.js:543 in plan(). The return camera keys called portalNear.clone() before its declaration. I moved portalFar and portalNear above returnKeys. A second headless mount returned state ready with no page error. All 32 subsequent snapshots contain the desert.

git diff --stat -- compositions/desert.html index.html reports one changed generated line in each file. Inspection of the current compositions/desert.html confirms api.mount still uses id desert and kind desert. Those composition changes did not cause the black frame.

## Changes

- src/set-desert.js: removed the Cursor cameo and all reads of D4/cursorPass; fixed the portalNear declaration order; built three separate foreground crew ramps with fixed, seeded worker motion and no crossing; held Ptah's face at rise and D1 and lit eyes 0.6 s early; faced both visitors to the lens for D2; framed and animated a single approval check on the block; eased the doorway push and showcase return; enlarged the D6 visitors; eased a stone slab into the title handoff. Camera paths and visibility are seek-time functions.
- src/look-desert.js: replaced Cursor roster identities with the permitted Codex/Claude identities.

## Shot list

| Local seconds | Absolute seconds | Framing and move |
| --- | --- | --- |
| 0–5.000 | 40.398–45.398 | Sofa lands; slow reveal of statue; eyes begin glowing at local 4.400. |
| 5.000–13.314 | 45.398–53.712 | Ptah's entire face held through “Old.” and D1; gentle low-angle ease. |
| 13.314–19.152 | 53.712–59.550 | Two visitors, faces toward lens, held for D2. |
| 19.152–24.362 | 59.550–64.760 | One eased lateral pan across three separated work ramps. |
| 24.362–27.777 | 64.760–68.175 | Inspector/block close view; check lands at 25.012 (65.410 absolute) and holds beyond 26.012. |
| 27.777–29.977 | 68.175–70.375 | Continuous ease toward glowing doorway; light fills well over 60% height at 70.2 absolute. |
| 29.977–49.977 | 70.375–90.375 | Doorway hold under another lane's full-screen 2D showcase from local 30.277 to 49.677. |
| 49.977–54.153 | 90.375–94.551 | Ease back outside doorway; hold Ptah and two robots through D6. |
| 54.153–56.403 | 94.551–96.801 | Stone slab fades in and camera eases for at least 1.5 s into title-wall handoff. |

## Crew layout

| Crew | Foreground ramp center (world x, z) | Visible robots | Gap to next crew |
| --- | --- | ---: | --- |
| 0 | (-8.0, -13.5) | 3 | 5.2 world units, about 5.8 body widths |
| 1 | (-2.8, -15.3) | 3 | 5.2 world units, about 5.8 body widths |
| 2 | (2.4, -17.1) | 3 | No next crew in the pan |

Each ramp is 2 × 8 world units. Worker depth spacing is 2.0 world units (over two body widths at visible scale 0.62), with seeded phase offsets and 0.12 world units/s forward travel. Feet use the ramp top plane, and the original pyramid ramps are hidden during the crew pan. The sheet shows distinct lanes and no visible robot/robot, block, or ramp intersections. The grouped workers and ramps occupy roughly the frame's middle third in height.

## Scorecard

Reviewed only the 32-cell, 600 px/cell contact sheet at snapshots/lane-b-desert-v3/contact-sheet.jpg. Paths below are relative to snapshots/lane-b-desert-v3. Scale: 1–5. Columns are subject, set, light, effect, text/safe area, continuity. All captured frames score at least 4 in these visual categories; specific remaining direction concerns are in Open defects.

| Absolute s | Frame | Subject | Set | Light | Effect | Text/safe area | Continuity |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 40.6 | a/frame-00-at-40.6s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 42.2 | a/frame-01-at-42.2s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 44.9 | a/frame-02-at-44.9s.png | 5 | 4 | 5 | 4 | 5 | 4 |
| 45.5 | a/frame-03-at-45.5s.png | 5 | 4 | 5 | 5 | 5 | 4 |
| 46.2 | a/frame-04-at-46.2s.png | 5 | 4 | 5 | 4 | 5 | 5 |
| 49 | a/frame-05-at-49s.png | 5 | 4 | 5 | 4 | 5 | 5 |
| 51.5 | a/frame-06-at-51.5s.png | 5 | 4 | 5 | 4 | 5 | 5 |
| 55 | a/frame-07-at-55s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 58 | b/frame-00-at-58s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 59.6 | b/frame-01-at-59.6s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 60.1 | b/frame-02-at-60.1s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 60.6 | b/frame-03-at-60.6s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 61.1 | b/frame-04-at-61.1s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 61.6 | b/frame-05-at-61.6s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 62.1 | b/frame-06-at-62.1s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 62.6 | b/frame-07-at-62.6s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 63.1 | c/frame-00-at-63.1s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 63.6 | c/frame-01-at-63.6s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 64.1 | c/frame-02-at-64.1s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 64.6 | c/frame-03-at-64.6s.png | 4 | 4 | 4 | 4 | 5 | 5 |
| 65.1 | c/frame-04-at-65.1s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 65.5 | c/frame-05-at-65.5s.png | 4 | 4 | 5 | 5 | 5 | 4 |
| 66 | c/frame-06-at-66s.png | 4 | 4 | 5 | 5 | 5 | 5 |
| 67 | c/frame-07-at-67s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 68.5 | d/frame-00-at-68.5s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 69.5 | d/frame-01-at-69.5s.png | 4 | 5 | 5 | 5 | 5 | 4 |
| 70.2 | d/frame-02-at-70.2s.png | 5 | 5 | 5 | 5 | 5 | 4 |
| 90.5 | d/frame-03-at-90.5s.png | 4 | 5 | 5 | 5 | 5 | 4 |
| 91.3 | d/frame-04-at-91.3s.png | 5 | 4 | 5 | 4 | 5 | 5 |
| 93 | d/frame-05-at-93s.png | 5 | 4 | 5 | 4 | 5 | 5 |
| 95 | d/frame-06-at-95s.png | 4 | 4 | 4 | 4 | 5 | 4 |
| 96.5 | d/frame-07-at-96.5s.png | 4 | 4 | 4 | 4 | 5 | 4 |

## Verification

- node --check src/set-desert.js and node --check src/look-desert.js: exit 0.
- Four HyperFrames snapshot batches a–d, 8 requested absolute times each, one command at a time: exit 0 each; affected batches were recaptured after framing and stamp changes.
- ffmpeg 32-input scale/drawtext/xstack contact sheet, 600 px cells with printed absolute times: exit 0; inspected the final sheet.
- node node_modules/hyperframes/dist/cli.js check --json: exit 0, ok true; expected 3000 ms render-ready warning. Existing unrelated app-window media timing and layout warnings remain.
- From D:/projects/nx-video, node tools/guards/no-media.mjs: exit 0; 432 files checked, no violations.
- rg for Cursor, cursorPass, D4, Math.random, and Date( in the changed desert modules: no matches (rg exit 1).

## Decisions

- Ptah MCP tools were not exposed in the available tool list; native file search, headless Chrome, HyperFrames snapshots, and ffmpeg were used.
- All cue reads use defined v3 cues or explicit nonzero v3 timing defaults. The 2D showcase and generated compositions remain in their owning lane.
- No build-timing, generate, video render, commit, stash, restore, reset, checkout, clean, or media export command was run.

## Open defects

- Ptah's voice continues over the crew pan and doorway coverage (D3 and D5), so his face is off camera during parts of those lines. This is a literal exception to “Ptah speaks only on screen.” The coverage follows the brief's requested crew and doorway views; a simultaneous speaking-face treatment would need a separate approved framing design.
- The inspector is partly at the right edge during the 65.1 s stamp anticipation frame; the actual check mark at 65.5–67 s is fully on the block and clear.
- The composition diff changes generated lines but still mounts the desert set; there is no composition fix needed for the black-frame error.

