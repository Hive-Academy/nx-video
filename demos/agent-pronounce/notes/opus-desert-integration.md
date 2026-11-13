# Episode 6 desert v4: integration pass (seats, robot reshade, colossus)

Stills only, no animation. Branch `demo/ep06-v4-desert-integration`.

## Skills loaded

- `C:\Users\abdal\.claude\skills\video-quality-bar\SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `C:\Users\abdal\.claude\skills\threejs-scene-craft\SKILL.md`: "Robots come only from `createRobot(assets, name)` (`robot.js`). Never rebuild a character."
- `C:\Users\abdal\.claude\skills\free-media-sourcing\SKILL.md`: "The manifest is the only way in."

## What changed

All edits are in `src/look-desert4.js`, `lookdev/desert4.js` and `lookdev/shoot4.mjs`.

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

## Scorecard

Each still was viewed downscaled to 1280 px. The rows follow `video-quality-bar/references/scorecard.md`.

- Text and safe area: none of these stills has captions or cards.
- Effect: the only effect in these stills is the eye and visor glow.

Paths are under `demos/agent-pronounce/snapshots/lookdev/`.

| Still | Path | Subject | Set dressing | Light | Effect | Text and safe area | Continuity | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a | `desert4-a.png` | 4 | 4 | 4 | 4 | 5 | 4 | **pass** |
| b | `desert4-b.png` | 3 | 4 | 4 | 4 | 5 | 4 | **fail**: a crew robot is cropped at the left frame edge |
| c | `desert4-c.png` | 3 | 4 | 4 | 4 | 5 | 4 | **fail**: crew robots are cropped at both frame edges |
| d | `desert4-d.png` | 4 | 4 | 4 | 4 | 5 | 4 | **pass** |
| e | `desert4-e.png` | 4 | 4 | 4 | 3 | 5 | 4 | **fail**: the colossus eye glow does not read, and the top of the sky is empty |

What each still shows:

- **a.** The two visitors sit in the kit lounge chairs at the workspace ratio. They are sharp, face the lens and fill about 25% of the frame. Their visors are now dark glass with crisp eyes; they no longer mirror the sky as grey. The chairs have contact shadows. The background crews and the pyramids are soft, as intended, with light haze. The colossus is out of frame, as voice 0 requires.
- **b.** The lit screen is in the centre and the colossus stands at the right.
  - Its placement, scale and lighting work. It shows from the knees up, clear above the ramp, against the sky, and lit by the warm sun. It is wider than head and shoulders.
  - The visitors are seen from behind, watching the screen, as in the approved composition.
  - Defect: an Antigravity crew robot is cut by the left frame edge.
- **c.** The screen fills the frame, with the crews in depth and the chairs seen from behind. It has not regressed from pass 3, and the colossus is out of frame. Defect, carried over from pass 3: crew robots are cropped at the left and right frame edges.
- **d.** The mid crew hauls in depth. The reshade reads well: violet glow rings, dark glass visors and shells lit by the environment probe. The rope and the sledge are in place.
- **e.** "Giant rises."
  - The whole colossus, plinth to crown, stands beside the lit monument screen at about 1.3 times the facade height.
  - The two visitors stand small on the sand, turned 3/4 to the lens, beside their empty chairs.
  - The sand is now about 18% of the frame, down from about 40%.
  - The colossus's placement, scale and lighting work: the low sun lights it warmly and it stands grounded on its plinth among the dunes.
  - Defects: its eyeGlow of 0.7 does not read at 97 m, and the top 35% of the frame is empty sky.

## Open defects

1. **b and c: crew robots cropped at a frame edge.** This is a banned shortcut. Fix plan: move the outermost Antigravity and Cursor crew members 0.6 to 1 m inward on their ramps, or widen b and c to 26 mm. This changes the approved set, so check it with the approver first.
2. **e: the colossus eye glow does not read** at this distance. Fix plan: this belongs to the colossus redesign on `demo/ep06-v4-ptah-colossus`, so judge its eye emissive in e once it drops in. Until then, set the e state to `eyeGlow: 1`.
3. **e: the top third of the frame is empty sky.** Fix plan: lower the target y from 13 to about 10 and accept a little more sand. Or go to 35 mm and move the camera 15 m closer, so the colossus reads taller against the facade.
4. **e: the visitors read small**, about 4% of the frame each. This is by design, to show scale, but it is below the 20% subject guide. In this shot the subject is the colossus and the screen.
5. **b and c: the visitors are seen from behind.** This is the approved composition (they watch the screen), so there is no visitor face in these frames. If b needs a face, turn Claude's head 0.5 rad toward the lens.

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

`lookdev/desert4.js` counts one plain beauty render, shadow passes included. The colossus is the current design at `quality: 'high'`, about 0.83 M triangles per pass.

| Still | Draw calls | Triangles |
| --- | --- | --- |
| a | 798 | 5.11 M |
| b | 850 | 5.22 M |
| c | 716 | 5.02 M |
| d | 718 | 4.30 M |
| e | 912 | 6.10 M |

- The colossus is drawn in the beauty pass and in the 4096 sun shadow pass, so it accounts for about 1.7 M of each total.
- The time per frame was not measured. Use `--time=10` (see "How to re-shoot").
- Each still takes about 2.5 minutes to load, mostly to build the colossus.
- If the redesign costs the same, pass `quality: 'draft'` in c and d, where the colossus is out of frame or small.

## Contact sheet

From `snapshots/lookdev/`, scale each of `desert4-a..e.png` to 640x360 and `xstack` them 3x2 onto a dark filler tile, with layout `0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0`. The current sheet labels each tile with `drawtext`, using Arial at 24 px in the top left. Save the result as `desert4-sheet.jpg` with `-q:v 3`.

## Credits

No new assets. The chairs, robots, colossus, sky and textures already exist in the repository or the manifest.
