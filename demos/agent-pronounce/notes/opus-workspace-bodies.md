# Episode 6 v4 workspace: bodied robots seated (Opus lane)

Branch `demo/ep06-v4-workspace-bodies`. Stills for approval only: nothing new is animated. The
bodies are swapped into the existing workspace animation.

Sheet (git-ignored, not committed): `demos/agent-pronounce/snapshots/lookdev/workspace-bodies-sheet.jpg`

## Skills loaded

- `C:\Users\abdal\.claude\skills\threejs-scene-craft\SKILL.md`: "Never call `Math.random`, `Date`, `performance.now`, timers, `requestAnimationFrame` loops or `mixer.update(dt)`."
- `C:\Users\abdal\.claude\skills\video-quality-bar\SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `C:\Users\abdal\.claude\skills\hyperframes-cli\SKILL.md`: "Every command has `--help`; most take `--json`, and a failure prints `✗ …`, a `Fix:` line and exits non-zero."

## What changed (`src/set-workspace.js`)

- The two ball robots (`h.robots.Codex/Claude`) are hidden and replaced with
  `createBodiedRobot(assets, { agent, size: 0.15 })`, the size the bodies look-dev used. Claude has
  `faceBoost` 1.25. The bodies reuse the ball rig's shell env map.
- **Staging = the approved body-a staging** (`look-bodies.js` `stageWorkspace`). Each keyboard
  moves 0.07 m toward the desk front edge. At work the chair sits at `keyboard + 0.4·n` (n = the
  desk normal) and faces the desk. The seat is `{ y: seatY, front: 0.152, z: front − thigh·u + 0.07·u }`.
- **Chairs roll.** The existing swivel `w` (0 work, 1 talk) now also lerps the chair from the desk
  seat to the original talk seat spot (`seatAt`). The floor decal under each chair moves with it.
  `yawWork` now faces the desk instead of the screen. `yawTalk` and `yawPeer` are unchanged.
- **Pose blend.** `poseBody()` poses `seated-turn` (look target = the existing head-gaze target)
  and `seated-typing` (IK to the keyboard's keys), then slerps every node of the body by
  `sineInOut(1 − w)`. When the robot is fully at work or fully turned, only one pose runs.
- **Talk life** (squash, nod, roll, eye scale, blinks, glow) now goes on the body's ball head and
  eye groups. The tah pulse, the spark flare, flinch and danger still feed the head tilt and the glow.
- Removed body-level motion that the seated rig doesn't support: hop/lift, the breathing pitch,
  the grip shift and the danger lean-back. Danger and grip now act only through head tilt and gaze.
- The camera, shots, lights, screen and cues are untouched.

## Snapshot times

`node node_modules/hyperframes/dist/cli.js snapshot --at … --timeout 240000`, output in
`snapshots/lookdev/ws-bodies/` (0.3, 9.7, 10.4, 18, 22.5 s) and `ws-bodies2/` (9.95, 10.1,
15.7, 16.3 s). All are git-ignored.

| Cell | Time | What it shows |
| --- | --- | --- |
| A wide hero | 18.0 s | the approved b two-shot; both are seated and turned to talk, gesturing |
| B two-shot at desks | 0.3 s | over the shoulders; both type, hands on the keyboards |
| C closer robot at keyboard | 0.3 s | native-resolution crop of B (Claude). The camera plan has no closer keyboard shot. |
| D push into the hero screen | 9.95 s | push start; both swivel back to work as the chairs roll in |

Also reviewed: 10.4 s (the push; no robots in frame), 15.7 s (screen hold) and 22.5 s (Codex MCU,
seated, good). 9.7 s is the same blend as D.

## Look-dev match

| Scene | Approved still | Frame at the same cue |
| --- | --- | --- |
| Workspace, hero b | `snapshots/lookdev/workspace-b` (approved workspace look) plus the body-a sheet (approved robot-bodies look) | `snapshots/lookdev/ws-bodies/frame-03-at-18s.png`: the same camera, set, palette and screen; the ball robots are replaced with the approved body-a bodies |
| Workspace, desks | body-a `stageWorkspace` staging | `snapshots/lookdev/ws-bodies/frame-00-at-0.3s.png`: the same chair and keyboard placement and the same typing pose |

## Contact checks

- At work (w = 0) the chair sits exactly at the body-a staging, so the approved measurements apply:
  fingertips 1.6–1.7 mm above the key tops (the IK snap holds 2 mm), and knees 0.149 m clear of the
  desk. Checked by eye in the native crop: the fingers sit on the keys with no clipping into the
  keyboard or the desk edge.
- The pelvis sits on the seat (`seat.y = seatY`), and the body moves with the chair, so it never
  floats or intersects during the roll. In A and in the 22.5 s MCU, the bodies sit in the chairs.

## Scorecard

Rows from `references/scorecard.md`. Scores are 1–5.

| Frame | Subject | Set | Light | Effect | Text/safe | Continuity | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `snapshots/lookdev/ws-bodies/frame-03-at-18s.png` | 5 | 5 | 5 | n/a | 5 | 5 | pass |
| `snapshots/lookdev/ws-bodies/frame-00-at-0.3s.png` | 4 | 5 | 4 | n/a | 5 | 5 | pass |
| crop of frame-00 (cell C) | 4 | 4 | 4 | n/a | n/a | 5 | pass |
| `snapshots/lookdev/ws-bodies2/frame-00-at-9.95s.png` | 4 | 5 | 5 | n/a | 5 | 4 | pass |
| `snapshots/lookdev/ws-bodies/frame-04-at-22.5s.png` | 5 | 5 | 5 | n/a | 5 | 5 | pass |

B and C are scored 4 on Subject because the robots face away by design (over the shoulders at
work, not speaking). D is scored 4 on Continuity because the hands are in mid-blend.

Checks: `hyperframes check --json` gave `ok: true`, with 0 errors. The warnings were already
there before this change: 3× `nested_media_start_basis_ambiguous`, `clip_media_fit` (the music is
0.08 s short), `canvas_content_at_edge` and an info-level `container_overflow`.

## Credits

There are no new assets. The bodies are procedural (`robot-body.js`) on the existing robot head
assets, as already credited for the robot-bodies look.

## Open defects / known issues

1. **Typing is visible only at 0–0.35 s.** The swivel turns the robots to talk at 0.35 s, and they
   go back to work only during the screen push and hold, where they are off camera. Fix plan, if
   wanted: hold the work pose longer in the open crane. That is a new animation choice and needs
   approval.
2. **Hands in mid-blend hover** above the desk fronts during the 9.7–10.1 s swivel (D). Nothing
   clips. This is the slerp between the two poses.
3. In the Codex MCU (22.5 s), the lifted `seated-turn` hand reads near the mug in perspective. It
   doesn't touch it.
4. The body-level hop, grip shift and danger lean-back are gone. Only the head carries them now.
5. The legs are mostly below the caption band and the desk line in the wide shots.
6. Cell C is a crop because the camera plan has no closer keyboard shot.
7. The procedural-body asset gate is carried over from `notes/opus-robot-bodies.md`. It is not new
   here.
