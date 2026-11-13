# Episode 6 v4: robot bodies (opus look-dev lane)

Branch `demo/ep06-v4-robot-bodies`. Look-dev stills only, no film animation. The film's
compositions, timing and `src/ptah-colossus.js` are untouched.

## Skills loaded

- `C:\Users\abdal\.claude\skills\video-quality-bar\SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `C:\Users\abdal\.claude\skills\threejs-scene-craft\SKILL.md`: "Never call `Math.random`, `Date`, `performance.now`, timers, `requestAnimationFrame` loops or `mixer.update(dt)`."
- `C:\Users\abdal\.claude\skills\free-media-sourcing\SKILL.md`: "Open the asset's own page and read the licence there."

## Base asset and licence

**Decision: procedural body, series head kept.** No new media and no manifest entry.

- The head is the series `cute_robot.glb` from `createRobot(assets, name)`. It keeps the ball
  shell, dark visor, two eyes and agent colour. Its licence is the one already in the episode
  credits.
- I searched for a CC0 rigged base. The only usable candidate was the Quaternius "Animated
  Robot" (RobotExpressive family). It is low-poly and toy-like, so Direction v4 rule 5 would
  keep it as background filler. The other rigged robots I found were paid, NC or had no
  licence on their own page. Fitting a different body's rig to the ball head would also need a
  retarget I could not verify without a DCC tool.
- The procedural body is built from lathe and bellows geometry (smooth profiles, not boxes or
  cylinders) and merged per part and material. Off-white clearcoat shell shares the head's
  shell material, graphite joints, rubber bellows, an emissive accent line and accent soles.
  Chibi proportions: the head is about 36% of the standing height (0.82 m at `size` 0.15).
- Assumption (no one to ask): the "hero characters must be GLB" gate is met because the hero
  head stays the sourced GLB. The body is a detailed, sculpted procedural shape, not a stand-in.
  If the reviewer reads that as a gate failure, the fix is a sourced rigged body. See open defects.

## API

`src/robot-body.js`

```js
import { createBodiedRobot } from './robot-body.js';
const r = createBodiedRobot(assets, { agent: 'Claude', color, quality, size: 0.15, shade, badge });
// r.group     root, origin on the floor, faces +z
// r.handles   { head, ballHead, pelvis, spine, chest, neck, headPivot,
//               arms: { L, R: { sh, upper, fore, hand, fingers } },
//               legs: { L, R: { hp, thigh, shin, foot } } }
r.setState({ eyeGlow, typing, lookAt, keys, seat: { y, front, z }, standZ, pointAt, seed });
r.setPose(name, t, time);
// r.info      { meshes, tris, standingHeight, headRadius }
```

| Pose | `t` | Notes |
| --- | --- | --- |
| `seated-idle` | time (s) | sits back, hands on thighs, breath, idle feet |
| `seated-typing` | time (s) | two-bone IK onto `state.keys`; the fingertips are solved to rest on the key tops (0.002 m clearance) |
| `seated-turn` | 0..1 | spine and head turn toward `lookAt`, the near hand lifts |
| `stand-up` | 0..1 | 0–0.3 scoot and lean, hands on cushion; 0.28–0.6 slide into a crouch, feet plant by 0.42; 0.55–1 straighten |
| `standing-idle` | time (s) | at `standZ`, breathing, relaxed arms |
| `point` | 0..1 | right arm aims at `pointAt`, head at `lookAt` |

Every pose is a pure function of `(name, t, time, state)`. Variation is seeded with `hash`
and `noise1`. There is no mixer, clock or random call, so the poses are seek-safe.

Builders for the stills are in `src/look-bodies.js` (`buildBodyA..D`) and registered in
`lookdev/lookdev.js` as `body-a`, `body-a-b`, `body-b`, `body-c` and `body-d`. Render with
`node lookdev/shoot.mjs body-a body-b body-c body-d`.

## Stills

All are 1920×1080 in `snapshots/lookdev/` (gitignored, not committed).

| Still | Content |
| --- | --- |
| `snapshots/lookdev/body-a.png` | workspace set, both robots seated and typing. **Frame for approval.** |
| `snapshots/lookdev/body-a-b.png` | the same staging through the literal workspace-b camera (reference only) |
| `snapshots/lookdev/body-b.png` | Claude standing turnaround: front, three-quarter, side and back, neutral studio |
| `snapshots/lookdev/body-c.png` | Codex mid stand-up (`t` 0.7) beside its swivelled chair, three-quarter |
| `snapshots/lookdev/body-d.png` | Antigravity (pointing), Cursor and OpenCode standing in the desert4 set, mid-shot |
| `snapshots/lookdev/body-sheet.jpg` | 2×2 sheet of a, b, c and d |

**Deviation on body-a.** Through the literal workspace-b camera the chair backs hide the
bodies, and only the heads show (`body-a-b.png`). So `body-a` uses the same set, layout and
lighting with the camera on the screen side, looking back at the seated pair. A cool
screen-spill spot lights the faces.

## Scorecard

Scale 1–5. Rows: Comp(osition), Light, Char(acter fit and contact), Mat(erials), Read(ability
of the action), Defects.

| Still | Comp | Light | Char | Mat | Read | Defects | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `body-a.png` | 4 | 4 | 4 | 4 | 5 | 4 | **pass**: fingertips 1.6–1.7 mm above the key tops, knees clear the desk by 0.149 m, no crossings. The lamp sits in the foreground, and the robots are at the frame edges with an empty centre. |
| `body-b.png` | 5 | 4 | 5 | 4 | 5 | 4 | **pass**: head is about 36% of the height, joints and accent read in every view, no clipped white on the shell. The eye highlights sit near white. |
| `body-c.png` | 4 | 4 | 4 | 4 | 4 | 4 | **pass**: the rise from the chair reads (crouch, hands on knees, feet planted at y 0.036). A cool hero key from the screen side makes the shell read white: 10 of 60,000 sampled robot pixels hit 255, all in specular glints, so the shell does not clip. The high camera angle flattens the legs. |
| `body-d.png` | 4 | 4 | 4 | 4 | 4 | 4 | **pass**: faces at three-quarter, feet grounded by a raycast onto the paving, and the point reads. Old ball crew robots remain in the background, and the legs read thin at this size. |

## Open defects

1. **body-c light: fixed.** The shell had gone grey in the low-key room. A shot-only spot from
   the screen side (#E6EEFF, intensity 11, high and camera-left, aimed at the head) fixed it.
   body-c was reshot at the same `t` (0.7).
2. **body-a composition.** The foreground lamp and the empty centre. Fix: hide or move the
   lamp for the shot, or move the camera 0.1 m toward the lamp side and tighten to 28 mm.
3. **Hero-asset gate.** The body is procedural (see "Base asset and licence"). If the reviewer
   wants a sourced rigged body, it needs a CC0 or CC-BY rigged humanoid robot with a fitting
   neck socket. None was found that met the look.
4. **Hands at distance.** In body-d the pointing hand reads as a block at mid-shot. The
   fingers are modelled but too small to separate. Fix: thicker finger segments at `quality`
   high, or a slight fan in `point`.
5. **Mixed crews in body-d.** The desert set's ball robots stay in the background beside the
   bodied crew. Decide per shot whether the background crews also get bodies.
6. **Snapshot console error.** The first page of each shoot run logs one
   `Failed to load resource 404`, with no failed response in the scene's requests. It is the
   harness favicon (`shoot.mjs` filters only the response, not the console line). Scene runs
   after the first log 0 errors.
7. **`hyperframes check` is not clean in this worktree.** `audio_src_not_found` and
   `missing_local_asset` list the VO, SFX, music and live-demo `.mp4` files, which are
   gitignored media not present here. The three `nested_media_start_basis_ambiguous`
   warnings are already in the film. None come from this lane's files. `no-media` passes
   (466 files).

## Render cost

Per bodied robot (from `robot.info` at `size` 0.15, default quality):

| | Value |
| --- | --- |
| Meshes (≈ draw calls, shadow pass doubles) | 72 |
| Triangles | 123,834 |
| Standing height | 0.82 m (`size` 0.15) |

The count includes the series head GLB (not split out). Frame times on the lookdev harness
(software WebGL in headless WebKit, film chain on): body-b 43 ms, body-a 392 ms, body-c
200–900 ms, body-d 250–570 ms. The set dominates these times, not the robots. The harness's
own `calls`/`tris` read 1 because the film chain ends in a full-screen pass.
