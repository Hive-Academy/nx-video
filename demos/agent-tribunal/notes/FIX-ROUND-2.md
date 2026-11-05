# Fix round 2

## Changes

| Requirement | File:line | Result |
| --- | --- | --- |
| Cute robot for all six | `src/scene.js:6,10-20` | Loads `cute_robot.glb`, clones its scene and each mesh material, and removes RobotExpressive clip/action and mood morph code. The existing RobotExpressive asset remains on disk. |
| Neutral shell and agent light | `src/scene.js:12-18` | BODY is `#E9E4DA` at roughness 0.45. GLOW and dark SCREEN use the six specified agent colours; EYES use a 72% white mix and modest emissive strength, without bloom. Nameplates remain. |
| Deterministic rigid acting | `src/scene.js:60-92` | Envelope driven squash/stretch and nod; staggered hop with anticipation, lift, landing, settle; OpenCode objection shake and paddle; Cursor lean at row 5; Claude back tilt and 0.4 eye height at row 6, 1.3 eyes at row 13; row 20 camera turn. Each robot has a separate 2.5–4 s blink phase using the GLB eye morph influence. No `mixer.update()` or emote clips. |
| Props and framing | `src/scene.js:35-55,69-96` | Robots placed behind the far table edge with feet at tabletop Y=1.52; Conductor foot at lectern top Y=1.97; booth robot enlarged at left third; speaker pushes use 12 frames, chaos cuts every six frames. Paper, mug, laptop, gavel and objection paddle are on or near the table. |
| Standalone timeline safety | `src/build-timing.mjs:55-56,74`, `index.html:48`, `compositions/*.html:27-28` | Initialize `window.__timelines` before each generated timeline assignment, including the main page, so an otherwise valid standalone page does not throw on an undefined registry. |
| Required credit | `src/build-timing.mjs:45,51`, `compositions/endcard.html:15,20`, `assets/models/CREDITS.md:3-11` | End card displays exact attribution in 22 px Inter at bottom 86 px, inside title-safe. Credits records title, author, Sketchfab source, CC BY 4.0 licence URL, and recolouring/animation modification. RobotExpressive is under Proposed Removals. |

## Model bounds and framing

Measured GLB node transforms plus each POSITION accessor's min/max using Three.js `Box3.applyMatrix4`: local bounds min **(-0.8563, -0.0021, -0.8563)**, max **(0.6386, 2.0865, 0.8929)**; size **1.4949 × 2.0886 × 1.7492** units. The screen and eyes face model +X, so base yaw is -π/2 toward camera +Z.

Table agents scale **0.85** (height ~1.775), feet **Y=1.52**; Conductor scale **0.95** (height ~1.984), feet **Y=1.97**. Booth scale **1.48** (height ~3.091), X **-1.4**, camera **(0, 1.9, 6.2)** aimed at **(0.35, 1.85, 0)**. Table wide camera **(0, 3.4, 10.8)** aimed at **(0, 2.05, -0.45)**. Speaker close camera is **3.65** units forward of each robot, with 38° FOV and aim at Y **2.35**. Its vertical field at that distance is ~2.51 units; a 1.775-unit agent should fill ~71% frame height at rest, exceeding the 40% target. This is geometric projection, pending rendered verification.

## Snapshot timestamps for orchestrator

| Time | Verify |
| --- | --- |
| 1.5 s, 30 s, 68 s | Booth face visible, left-third chest-up crop, lower third clear of desk. |
| 16 s, 21.2 s | Claude framing/colour, Cursor row-5 lean and two robots in frame. |
| 24.8 s | Claude row-6 back tilt and squashed eyes. |
| 40.2 s | OpenCode objection shake and raised paddle. |
| 57 s, 63 s | Codex row-12 hop; Claude row-13 widened eyes. |
| 75.6, 75.8, 76.0, 76.2, 76.4 s | Row-17 six-frame speaker changes across five agents. |
| 79.5 s, 83.5 s | Conductor raised behind lectern and verdict card unobscured. |
| 89.8 s | All five turn toward camera on row 20. |
| 93.5 s | End-card robot attribution legible inside title-safe. |

## Verification and limitations

Ran `node src/build-timing.mjs`: 95.49 s, 13 compositions regenerated, including `index.html`. `node --check` passed for both edited JavaScript files. Pinned HyperFrames 0.8.98 `check --json` returned **lint: 0 errors**, three pre-existing audio-overlap warnings, and browser `spawn EPERM` runtime failure. Ptah browser navigated to the workspace `file://` URL and screenshot showed only the root teal background because the composition runtime did not render there; this cannot establish visual framing against the brief. Ptah diagnostics returned unrelated workspace TypeScript errors instead of scoped JavaScript results. No snapshots were made. The orchestrator should check the listed frames against SPEC.md and FIX-ROUND-1.md, especially screen visibility and the 40% speaker close-up.

## Follow-up verification

Regenerated all 13 compositions and `index.html` after adding the timeline guards. `node --check src/build-timing.mjs` passed. Confirmed every generated timeline assignment in the main index and all 13 compositions has the initialization immediately before it. HyperFrames 0.8.98 `check --json` still reports lint 0 errors and the same three audio-overlap warnings; browser runtime still fails with `spawn EPERM`.
