# Independent workspace bodies review

## Skills loaded
- C:/Users/abdal/.agents/skills/hyperframes/SKILL.md: "Everything visible is a function of timeline time."
- D:/projects/nx-video/.agents/skills/video-quality-bar/SKILL.md: "A lane that has not met this bar has not finished, whatever its exit code."
- D:/projects/nx-video/.agents/skills/threejs-scene-craft/SKILL.md: "Everything is a pure function of the seek time `t`."
- Read video-quality-bar references/scorecard.md and references/review-procedure.md from the main workspace. These references are absent in this older worktree; main copies were used.

## Verdict
APPROVED for the scoped code change at 7d791c1, 8/10, medium confidence. No blocking correctness defect found. This is independent source review plus inspection of the existing approved sheet, not a new full visual acceptance or runtime backward-seek test.

Review family: native Codex reviewer. Implementer family: Claude, established by commit 7d791c1's `Co-Authored-By: Claude Opus 5.5` trailer and notes/opus-workspace-bodies.md. Different-family review; no CLI lane used.

Scope: commit 7d791c1 versus its parent, demos/agent-pronounce/src/set-workspace.js, with robot-body.js, look-workspace.js and tour.js contract tracing. No production source edited.

## Evidence
- set-workspace.js:50-71: poseBody evaluates seated-turn and seated-typing from supplied time/state before blending positions/quaternions; the cached snap array is overwritten each evaluation. Intermediate poses do not increment a previous frame's transform.
- robot-body.js:382-443: setPose resets pelvis/spine/chest/neck/headPivot, solves limbs, assigns head angles/blink/material glow from the pose and time. robot-body.js:447-472 rebuilds typing wrist and finger state from the keyboard transform and seeded time slots. No wall clock or random state is introduced by the workspace diff.
- set-workspace.js:321-360: each seek assigns chair translation/yaw, optional decal x/z, body translation/yaw, pose, ball-head scale/rotation, eye scale and blink. Body/head reactions are derived from current simulation sample. This supports deterministic forward/backward sampling by inspection; runtime equality has not been measured.
- set-workspace.js:326-331: chairAt is recomputed from deskSeat and seatAt using current swivel. The chair and body receive identical positions; the floor contact decal receives the same x/z. robot-body.js:280 and 293-295 keep seated pelvis height anchored to configured seatY rather than accumulating movement.
- set-workspace.js:161-175: keyboard lookup matches the fixed look-workspace.js:77-87 construction (61 instanced keys), with one desk keyboard per side at look-workspace.js:274. The key-top height contract is 0.017 in robot-body.js:48 and look-workspace.js key geometry. Lookup is coupled to this scene structure but is valid in the reviewed version.
- set-workspace.js:178 decal lookup matches look-workspace.js:304, which places one chair contact shadow at seatAt and y=0.014.
- set-workspace.js:193 returns robots:{} so generic robot application does not overwrite bodied poses. tour.js:96-98 applies generic robots then plan.update, and set-workspace.js remains registered in tour.js:24-26.
- Existing camera/shot plan was not changed by the commit. Short initial typing, accepted rear views, hovering hands during pose blend, and head-only reactions are explicit user approvals and are not defects in this review.

## Checks actually run
| Command | Result |
| --- | --- |
| node --check demos/agent-pronounce/src/set-workspace.js | exit 0 |
| node --check demos/agent-pronounce/src/robot-body.js | exit 0 |
| git diff 7d791c1^ 7d791c1 --check -- demos/agent-pronounce/src/set-workspace.js | exit 0 |
| git diff --check -- demos/agent-pronounce/src/set-workspace.js | exit 0 |

The scoped source file had no worktree modification at review time. No GPU capture, HyperFrames check, render or process stop was performed, as instructed while other scene work owns the GPU.

## Existing visual evidence / look-dev match
Opened snapshots/lookdev/workspace-bodies-sheet.jpg with view_image. It contains A 18.0s, B 0.3s, C a native crop of B, D 9.95s. Observed the bodied cast in their chairs, readable eyes in A, keyboard-reaching hands in B/C, and the accepted raised mid-blend hands in D. Set, chairs, desks, screen placement and palette remain consistent across the shown views. This is the already approved sheet, not a newly captured comparison.

## Scorecard limitations
No new scorecard claimed. The supplied sheet is a landscape montage with three distinct seek times; it is not the required full named-cue/start/mid/end coverage ; current SPEC targets 16:9, so a 4:5 crop is supplemental and is not an acceptance blocker. Existing author scores were read but are not independently re-certified. Spark/rumble/through effects, full-frame millimetre contact, motion pacing, 404/console state and exact backward-seek equality remain for integration visual/runtime verification. The prior user approval is preserved.

## Credits
No new assets introduced or sourced by this review. Existing body/robot assets and their prior approvals remain unchanged.

## Open defects
No blocking source defect identified within the reviewed commit. Non-blocking maintenance note: set-workspace.js:161-170 identifies keyboards through instance count and side rather than an explicit handle; if the keyboard model changes, this lookup must change with it. No redesign requested.

## Required remaining integration checks
Run the integrated HyperFrames/media checks and inspect actual composition frames after scene integration. A source review and the approved saved sheet do not replace those checks.
