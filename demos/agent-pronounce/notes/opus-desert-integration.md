# Episode 6 desert v4: integration pass (seats, robot reshade, colossus)

Stills only, no animation. Branch `demo/ep06-v4-desert-integration`.

## Skills loaded

- `C:\Users\abdal\.claude\skills\video-quality-bar\SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `C:\Users\abdal\.claude\skills\threejs-scene-craft\SKILL.md`: "Robots come only from `createRobot(assets, name)` (`robot.js`). Never rebuild a character."
- `C:\Users\abdal\.claude\skills\free-media-sourcing\SKILL.md`: "The manifest is the only way in."

## What changed (pass 1, commit 5c44cf5)

Pass 2 below supersedes the e camera, the e state (now `eyeGlow: 1`) and the crew placement. All pass 1 edits are in `src/look-desert4.js`, `lookdev/desert4.js` and `lookdev/shoot4.mjs`.

- **Seats (still a).** The hand-built seat was removed. Visitors now sit in the kit `loungeChair({height, cushion})`, on `userData.seatY` minus a small sink. The chair is scaled to the workspace robot-to-chair ratio: workspace `ROBOT_SCALE` 0.25 sits in a 0.737 m chair, the desert robot is `RS` 0.38, so `CHAIR_K = RS / ROBOT_SCALE = 1.52`, giving a 1.12 m chair and a 0.091 m cushion. The chair front is turned to face the robot's look direction.
- **Focus and haze (still a).** `dof.focus: 'seats'` now resolves to the mean camera distance to the visitors' visor centres, so the focus follows the robots and is not a hand-typed number. The aperture is down to 0.0016 and maxblur to 0.005. The dust puffs at the chairs are down to opacity 0.12 in a and 0.08 elsewhere.
- **Robot reshade (all stills).** Every robot, visitors and crews, goes through the kit `reshadeRobot` with the workspace treatment: `{ shell: '#CCC3B5', env: 0.9, eyeBoost: 2.6, glass: 0.55, smooth: π/4 }`, plus a face light per shot. Claude gets faceBoost 1.25. One `roomProbe` cube map, taken at the plaza with every robot hidden, is the envMap for all robot shells, feet and visors (`handles.robotProbe`). Outdoors the shell env is 0.6 and the visor env is 0.45, so the visors do not mirror the bright sky as grey. `tintRobot` is now glass-aware: the crew hue goes into the glow, the soles and the visor emissive, and it no longer flattens the glass screen colour.
- **Colossus.** The grey proxy is replaced by `createPtahColossus(assets, { height: 24.05, quality: 'high' })` at `handles.ptahAnchor` (29, -66), yaw -0.51, facing the plaza. State per shot:
  - a: voice 0, eyeGlow 0
  - b: voice 0.5, eyeGlow 0.5
  - c and d: voice 0.3, eyeGlow 0.4
  - e: voice 0.2, eyeGlow 0.7

  `handles.colossus` exposes `setState`, and `handles.ptah` is the group. The sun shadow frustum now reaches the colossus: it is centred at (8, 0, -38), spans ±60 × ±52 with far 300, and uses a 4096 map.
- **New still e ("giant rises").** A low camera (y 0.4) at 40 mm, about 96 m from the colossus. It shows the whole colossus, plinth to crown, beside the lit monument screen, with the two visitors standing small on the sand in front of their empty chairs, turned 3/4 to the lens. Standing visitors take an `at` position apart from their chair.
- **Harness.** `lookdev/desert4.js` counts draw calls and triangles of one plain beauty render (shadow passes included) into `__lookdevInfo`. `lookdev/shoot4.mjs` shoots e by default.
- **Kept.** The screen, `handles.setScreenSource`, the crews in depth, the stone and the `mpumalanga_veld_puresky` sky are unchanged. No new dependency, no new asset, and no timing, audio, `SPEC.md` or `compositions/` change.

## Look-dev match

These are stills only. There is no animation yet, so there is no animated frame to match. Each still is the look-dev frame for its beat.

The approved desert set (pass 3) is unchanged: the same stone, sky, screen and crews. This pass changes only the seats, the robot shading and the colossus placement, and it adds still e.

The contact sheet is `demos/agent-pronounce/snapshots/lookdev/desert4-sheet.jpg`. Its top row is a, b, c and its bottom row is d, e.

Per the orchestrator update, the colossus design is being redone on `demo/ep06-v4-ptah-colossus` behind the same API. This pass judges only the colossus's **placement, scale and lighting**, not its sculpt. The integration uses only `createPtahColossus(...).group` and `.setState`, placed at `handles.ptahAnchor`. It does not edit `src/ptah-colossus.js` or `src/look-colossus.js`.

## Pass 2 (orchestrator review of 5c44cf5)

All the changes are in `src/look-desert4.js`, `lookdev/desert4.js` and `lookdev/shoot4.mjs`. `src/ptah-colossus.js` and `src/look-colossus.js` are untouched.

- **Crew fit (b, c).** Each crew def takes a `fit`: `shift` [world dx, dz] of its ramp, `ds` haul progress, `k` file width and `ro` across-ramp offset. `buildCrew` applies it.
  - near: shift [1.0, 0], ds -2.5
  - mid: shift [-1.38, 0.24], ds -2.5, k 0.9, ro -0.15
  - far: shift [-0.4, -0.6], ds -1.5

  The mid crew robots move about 1.55 m inward, more than the 0.6–1 m in the brief. No value in 0.6–1 m clears the right edge of c. The orchestrator approved the set change.
- **c chairs.** The chairs move forward to Claude [0.6, -20.0] and Codex [2.2, -20.3], because the near ramp hid Claude's chair. The c visitors are now 20.5% and 19.4% of frame height.
- **e restage.**
  - The camera is at [42.5, 0.3, 7] with target [4.2, 5.7, -63.3] and a 35 mm lens. The colossus is 74 m away, down from 96 m.
  - The visitors stand at [35.75, -2.4] and [36.6, -3.7]: yaw -1.6 and -1.45, pitch 0.32 and 0.3, so they look up at the giant.
  - The chairs are at [34.1, -2.7] and [37.3, -5.5].
  - There are 4 haze cards at about 0.2 opacity, and a warm rim `DirectionalLight` (#FFB476, 5.5) from behind the giant at y 16.
  - The state is `eyeGlow: 1`.
- **`ptahQuality`.** This option, set from `?ptahq=draft`, builds a faster colossus for framing passes.
- **Shoot timeout.** `shoot4.mjs` sets `protocolTimeout: 900000`, which fixes the e timeout.

## Scorecard (pass 2 finals)

I viewed each still downscaled to 1280 px. The rows follow `video-quality-bar/references/scorecard.md`. None of these stills has captions or cards. Their only effect is the eye and visor glow. `cropped` is the harness check for robots cut by a frame edge.

| Still | Subject | Set dressing | Light | Effect | Text and safe area | Continuity | `cropped` | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a | 4 | 4 | 4 | 4 | 5 | 4 | [] | **pass** (unchanged from pass 1) |
| b | 4 | 4 | 4 | 4 | 5 | 4 | [] | **pass**: no crew robot is cut, and the colossus stands at the right, knees up |
| c | 4 | 4 | 4 | 4 | 5 | 4 | [] | **pass**: crews in full at both edges, both chairs read, visitors about 20% of frame |
| d | 4 | 4 | 4 | 4 | 5 | 4 | [] | **pass** |
| e | 3 | 3 | 4 | 2 | 5 | 4 | [] | **fail**: see below |

What I saw in e:
- The whole colossus stands at the right, plinth to crown, from 5% to 58% of frame height. That is about 55%, not the 60–70% target.
- The lit screen sits small at the left, about 19% of the frame width, and its text does not read at 1280 px.
- The bottom 40% of the frame is plain sand. The sky band above the facade, in the middle of the frame, is empty.
- The two standing visitors are about 12% of frame height. They read as robots between their chairs, side-on and looking up.
- `eyeGlow: 1` still does not read at 74 m.
- Claude's visor shows a warm orange reflection from the rim light.

## Open defects

1. **e does not meet the "giant rises" brief.** The colossus is about 55% of frame height, the bottom 40% is sand and the screen is small.
   - The cause is geometric. The anchor at (29, -66) sits behind the 12.5 m facade. A camera close enough to give 60–70% puts the facade as tall as the giant, or pushes it out of frame. About 55–57% is the most this anchor gives with both in frame.
   - Option 1: move `ptahAnchor` nearer the forecourt, about 20 m toward the plaza. This changes the approved set and the b framing.
   - Option 2: accept a facade as large as the giant, with the camera about 50 m away.
   - Option 3: raise the camera to about 3 m with a slight down tilt and fill the foreground with the chairs and props. This removes the sand band but not the size limit.
2. **e: the eye glow does not read.** It belongs to the colossus redesign (museum scan) behind the same API. Re-judge it when that drops in.
3. **e: Claude's visor shows a warm reflection** of the rim light. Fix: exclude the visitors from the rim light with a layer, or lower the visor env in e.
4. **b and c: the visitors are seen from behind.** This is the approved composition.

## How to re-shoot

From `demos/agent-pronounce/`, after `node ../../tools/media/fetch-media.mjs .` and with `node_modules` present:

```sh
node lookdev/shoot4.mjs desert4-a desert4-b desert4-c desert4-d desert4-e --post=preview
# fast framing pass without AO and DOF, written beside the finals:
node lookdev/shoot4.mjs desert4-e --post=base --suffix=-test
# frame cost:
node lookdev/shoot4.mjs desert4-e --post=preview --suffix=-time --time=10
```

Each still takes about 2.5 minutes to load, mostly building the colossus at high quality. The stills go to `snapshots/lookdev/` (git-ignored). Rebuild the sheet with the ffmpeg command in "Contact sheet" below.

## Render cost

`lookdev/desert4.js` counts one plain beauty render, shadow passes included. The colossus is the current design at `quality: 'high'`.

| Still | Draw calls | Triangles | Load |
| --- | --- | --- | --- |
| a | 791 | 5.11 M | 141 s |
| b | 866 | 5.23 M | 162 s |
| c | 818 | 5.05 M | 146 s |
| d | 716 | 4.28 M | 166 s |
| e | 810 | 5.37 M | 164 s |

- The time per frame for e at preview post (`--time=10`) is **218 ms**, on an RTX 3070 Laptop GPU.
- The colossus is drawn in the beauty pass and in the 4096 sun shadow pass, so it accounts for about 1.7 M of each total.
- Most of the load time goes to building the colossus at high quality. Use `?ptahq=draft` for framing passes.

## Contact sheet

From `snapshots/lookdev/`, scale each of `desert4-a..e.png` to 640x360 and `xstack` them 3x2 onto a dark filler tile, with layout `0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0`. The current sheet labels each tile with `drawtext`, using Arial at 24 px in the top left. Save the result as `desert4-sheet.jpg` with `-q:v 3`, and copy it to `desert-sheet.jpg` (the name the orchestrator asked for).

## Credits

No new assets. The chairs, robots, colossus, sky and textures already exist in the repository or the manifest.
