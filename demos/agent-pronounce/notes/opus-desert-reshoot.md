# Desert re-shoot: bodied robots and the scan colossus (look-dev stills a–e)

Lane: `demo/ep06-v4-desert-reshoot` (Opus child session). Contract: `SPEC.md`, "Direction v4" and
"Script v4.1" (Seats, Landing continuity, "Ptah presents the product"). These are look-dev stills
only. Nothing is animated. The user approves the stills before any animation.

Contact sheet (git-ignored, not committed): `demos/agent-pronounce/snapshots/lookdev/desert-reshoot-sheet.jpg`.
Stills: `demos/agent-pronounce/snapshots/lookdev/desert4-{a,b,c,d,e}.png` (`--post=preview`).
Command, from `demos/agent-pronounce`: `node lookdev/shoot4.mjs desert4-a desert4-b desert4-c desert4-d desert4-e --post=preview`.

## Skills loaded

| Skill | SKILL.md | Rule quoted word for word |
| --- | --- | --- |
| video-quality-bar | `C:\Users\abdal\.claude\skills\video-quality-bar\SKILL.md` | "A lane that has not met this bar has not finished, whatever its exit code." |
| threejs-scene-craft | `C:\Users\abdal\.claude\skills\threejs-scene-craft\SKILL.md` | "Robots come only from `createRobot(assets, name)` (`robot.js`). Never rebuild a character." |
| hyperframes-cli | `C:\Users\abdal\.claude\skills\hyperframes-cli\SKILL.md` | "Every command has `--help`; most take `--json`, and a failure prints `✗ …`, a `Fix:` line and exits non-zero." |

On the threejs-scene-craft rule: every robot is the user-approved `createBodiedRobot`
(`src/robot-body.js`), which builds on the series `cute_robot.glb` head through the same asset
path. No character was rebuilt in this lane.

## Changes

`src/look-desert4.js`

- **Bodied robots everywhere.** The old `robot()` ball robots, `lookRobot`, `tintRobot` and the
  crew reshade loop are gone. A `bodied()` helper wraps `createBodiedRobot` with the workspace
  `ROBOT_LOOK` shade and the outdoor env levels. It adds `root`, `name` and `face()` so that the
  crop, face and DOF checks treat every robot the same way.
  - **Visitors, a–d: seated.** They sit in the kit `loungeChair` and use the workspace seating
    recipe from `look-bodies.js`, scaled by `CHAIR_K`. The head size is `VIS_U = 0.15 × CHAIR_K`,
    the same robot-to-chair ratio as the workspace.
  - **Visitors, e: standing.** They stand after the rise in `standing-idle`, with a contact shadow
    and their empty chairs behind them.
  - **Gaze.** Gaze targets replace the old head yaw numbers: `look: 'screen' | 'camera' | 'ptah' | <name>`.
    When the target is the other visitor, the pose is `seated-turn`.
  - **Crews.** The crews are bodied robots at the approved body-d size (`CREW_U = 0.27`, about
    1.5 m standing), in a new `haul` pose. Each wears a chest strap in the crew hue and has a
    short tether from the strap to a knot on the main rope. The main rope runs from the sledge
    through the knots to the bridle, and the leader's strap ties to the bridle. The visor emissive
    is tinted with the crew hue.
- **Scan colossus at native height.** The `height: PTAH.height` override is gone, so the scan
  builds at the approved native size: a 24 m figure on its plinth, about 29.4 m overall. The anchor
  and the framing info now use `colossus.height`.
- **Eye emissive ×4.** This is `eyeGain: 4` on e, the only shot where the eyes glow. It is kept
  across `setState` calls. In a–d the eyes are off (`eyeGlow: 0`) before the rise, so the gain has
  no effect there.
- **Rim SpotLight with a distance cutoff (e).** The spot is `#FFB476`, intensity 9 and distance
  62. It stands 40 m behind the giant, so it reaches the colossus but not the visitors. three.js
  light layers cannot exclude meshes, which is why it uses a distance cutoff.
- **Bounce card on the facade (e).** This is a one-sided `RectAreaLight`: warm `#F0C08C`,
  intensity 5, 9 × 8 m. It stands on the sand 6 m off the facade's +x side face and faces it.
  That face was the dark slab in the integration pass.
- **Codex 0.15 m nearer the lens (e).** Codex's position moved from `[40.61, -29.17]` to
  `[40.70, -29.05]`.
- **e lens 24 → 18 mm, target y 3.65 → 3.9.** At 24 mm the native-height scan lost its crown
  (crown at −0.13 of frame height). At 18 mm the whole figure and the plinth are in frame. This is
  a wide shot, so it is inside the framing rule.
- **a: Codex's chair moved from `[-1.55, -13.15]` to `[0.05, -12.48]`.** At the old position, the
  seated bodied Codex was hidden behind the forecourt ledge with only its head showing. It now
  sits beside Claude on the pavement, 4 m from the lens, facing camera. Claude turns to it in
  `seated-turn`.

`src/robot-body.js`

- **New `haul` pose.** The robot takes a long stride with its knees bent and its chest forward.
  Both fists grip the strap in front of the chest. The push-off foot is on `state.haulSide`, the
  side the rope ties on.
- **Chest-local arm specs.** `setPose` now accepts arm specs in chest space (`chest: true`) so the
  hands stay on the strap whatever the spine lean. The existing poses are unchanged.

## Still list

| Still | Shows |
| --- | --- |
| a | Establishing shot, 28 mm, before the rise. Claude and Codex sit in office chairs on the forecourt. Codex faces the lens and Claude turns to Codex with a gesture. The Antigravity and OpenCode crews haul blocks up the ramps on the right, below the dark screen in the facade. The scaffold, pyramid and palm are behind them. |
| b | The facade and screen (the Command Center is live), 28 mm. The visitors sit in their chairs facing the screen. The crews haul on both ramps. The colossus stands at the right edge, framed head to waist (the tightest the rule allows), eyes dark. |
| c | Closer on the screen, 35 mm. The visitors are seen from behind in their chairs, with the hauling crews on both sides. |
| d | Crew close-up, 35 mm: the Cursor crew in the haul pose. You can see the chest straps, the tethers and the main rope to the sledge. The faces are lit with faceLight 0.25. |
| e | The rise, 18 mm low hero angle. The colossus is full-figure on its plinth with glowing eyes (×4) and the warm rim. The two visitors are now standing and look up at it, their empty chairs left and right. The facade's side face on the left is lifted by the bounce card. |

## Look-dev match

This pass replaces the integration-pass stills (`notes/opus-desert-integration.md`, sheet
`desert4-sheet.jpg` in that lane). The new stills are not yet approved, so there is no animated
frame to match. Composition, palette and set are unchanged from the integration pass, except for
the deliberate changes listed above: bodied robots, the native-height colossus, the e lens and
bounce, and the a Codex chair.

## Scorecard

Scores out of 5, from looking at each still at full size and downscaled to 1280 px.

| Frame | Composition | Character | Lighting | Surfaces | Effects | Path | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a | 4 | 4 | 4 | 4 | n/a | `snapshots/lookdev/desert4-a.png` | pass |
| b | 4 | 4 | 4 | 4 | n/a | `snapshots/lookdev/desert4-b.png` | pass |
| c | 4 | 4 | 4 | 4 | n/a | `snapshots/lookdev/desert4-c.png` | pass |
| d | 4 | 4 | 4 | 4 | n/a | `snapshots/lookdev/desert4-d.png` | pass |
| e | 4 | 4 | 4 | 4 | 4 (eyes, rim) | `snapshots/lookdev/desert4-e.png` | pass |

## Credits

There are no new assets. All the assets in use are already credited:
- `cute_robot.glb` is in `assets/models/CREDITS.md`.
- The Sketchfab Ptah-Sokar-Osiris scan is in `assets/third-party` credits.
- The textures and HDRI are in `assets/CREDITS.media.md`.

The git-ignored assets and the scan pre-bake (`fitted-high-*.bin`) were copied into this worktree
from the main tree and from the colossus lane. They were not moved and are not committed.

## Open defects

- **b and c show the visitors from behind.** They are watching the screen, so this is by design,
  but their faces cannot be seen (carried over from the integration pass). If the user wants
  faces, use a reverse angle over the screen; that would be a new shot.
- **The `haul` pose is a single static pose.** It has no step cycle yet. It needs a gait keyed to
  `t` when the scene is animated.
- **The OpenCode crew is outside the e frame at 18 mm.** It sits just past the left edge. This is
  acceptable for the rise, but it can return if the camera pans left.
- **The colossus head is rigid on the scan.** The `headYaw: 0.4` in e has no effect. This is
  accepted with the scan.
- **The eye gain is still scene-side.** It wraps `setState`. It belongs in the colossus module as
  an option (carried over).
