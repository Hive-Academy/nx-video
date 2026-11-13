# Independent desert review

## Verdict
APPROVED — 8/10, scoped to the reviewed source and rendered scene runtime. No remaining blocking defect in this scope. The integrated composition still requires its overlays, audio, endcard and desert-to-intro seam check after merge; this is not a final episode approval.

Reviewer: independent native Codex agent. Current implementer: a separate native Codex agent. This is weaker cross-family evidence: the user disabled CLI lanes after permission/report failures, and child sessions failed parent attribution. The original c6008f3 look checkpoint was prior Claude work. The author did not self-review.

## Skills loaded
- C:/Users/abdal/.agents/skills/hyperframes/SKILL.md: "Everything visible is a function of timeline time."
- D:/projects/nx-video/.agents/skills/video-quality-bar/SKILL.md: "A lane that has not met this bar has not finished, whatever its exit code."
- D:/projects/nx-video/.agents/skills/threejs-scene-craft/SKILL.md: "Everything is a pure function of the seek time `t`."

## Reviewed scope
Current desert worktree versus 3798d12, including checkpoint c6008f3 and these eight source/output files:
- src/set-desert4.js (new)
- src/look-desert4.js
- src/robot-body.js
- src/tour.js
- src/build-timing.mjs
- index.html
- compositions/endcard.html
- scripts/live-demo/tour-stills.mjs (new)

Current SPEC Direction v4 / Script v4.1 overrides conflicting older direction. Primary acceptance is 1920x1080, 16:9. Approved A-E compositions, rear visitor views and stronger E eyes were preserved; no new design approval was imposed.

## Resolved findings and contract evidence
- src/set-desert4.js:102 now refreshes the moved haulGroup world matrices before world-space hand IK. Poses reset from current time before optional haulCycle gait; no accumulated frame delta drives movement.
- Camera B-to-C movement now interpolates visitor seats and DOF, with matching rim position/target and intensity. D focus is measured from its subject. The E head uses the approved S.ptah yaw/pitch rather than resetting both to zero.
- src/tour.js:75-76 flags the adopted look exclusions on individual objects. This survives scene.js rebuilding its noDepth list during mount. Merge must preserve the equivalent vortex fix once, together with both adapters.
- src/set-desert4.js:55 selects the E face view one second before rise; line 72 ramps eye glow from rise minus 0.6 seconds. Visitors stay seated until rise. The required pre-reveal is now present.
- src/set-desert4.js:71 adds row localStart to normalized word times. Repeated eyeGain application is safe because look-desert4.js:406 invokes the original state reset first.
- src/set-desert4.js:60-63 and 116 implement the required final titleTilt cue. The final two seconds push/tilt to existing bare sandstone, ending at position [6.65,9.35,-28.5], target [6.65,9.35,-30.38], fov 28 and focus 1.88. No new geometry or asset was introduced.
- build-timing.mjs and generated index.html remove the retired full-bleed app-window host while retaining the landing insert and audio. N5 remains unchanged. The endcard adds the W2059 Egypt Centre / Swansea University CC BY 4.0 credit; integrated legibility is still to be checked.
- A suspected focal mismatch was withdrawn: look-desert4.js explicitly sets filmGauge 36. The adapter fov is consistent with that contract.

## Deterministic tour playback and resource audit
The generator freezes approved footage at 10 fps. Runtime derives clips from configured tour cues, selects the absolute current frame, clamps to its last image, and restores the idle texture outside clips. Backward jumps and reentry select by current time; browser video playback is not used for the screen.

The initial per-frame texture allocation was corrected to one CanvasTexture (src/set-desert4.js:16-33). Images preload in bounded request batches; canvas drawing/upload happens only when the selected image changes. There is no per-seek GPU texture creation. All 261 files (74 + 63 + 65 + 59) existed; sampled headers for every clip were 1280x720. Compressed images total 22,810,751 bytes. One RGBA screen texture is approximately 3.52 MiB without mipmaps. Retaining all decoded source images has a worst-case RGBA-equivalent CPU footprint of 917.58 MiB; actual browser residency was not measured. This is a known bounded resource cost, not evidence that it caused the earlier capture stall.

## Rendered evidence inspected
- snapshots/lookdev/desert-anim-sheet.jpg: 20 named scene-runtime frames spanning landing, pre-reveal, rise, E hero, D working crew, B/C tours and exit.
- snapshots/native-desert/desert-local-6.4.png: full-size E evidence, stronger eyes and whole colossus with visitors/chairs.
- snapshots/native-desert/desert-local-16.874.png compared with approved snapshots/lookdev/desert4-d.png: working-crew staging remains consistent with the approved look.
- Final snapshots/native-desert/desert-local-55.081.png: bounded facade move midpoint.
- Final snapshots/native-desert/desert-local-55.981.png: bare textured sandstone fills the frame, with no screen or gold disk. Suitable outgoing scene image for the required intro seam; the actual adjacent composition has not yet been inspected.

The approved rear views are intentional. The scoped frames preserve screen-in-world context and colossus scale. Captions, endcard and cross-composition overlays are outside these runtime captures.

## Seek verification
Read the actual scene.js runtime harness and final reports: snapshots/native-desert/seek-verification.json and seek-pixel-delta.json. Forward 0 -> t versus backward 55.9 -> 0.1 -> t was exercised at 0.3, 4.4, 6.4, 21.4, 38.5 and 51 seconds.

All six state hashes matched (mesh transform values rounded to 1e-9; camera values unrounded). Five of six PNGs matched exactly. At 4.4 seconds only 17 of 2,073,600 pixels differed: 0.00081983%, maximum channel delta 1/255, mean channel delta 0.00000273277 on the 0-255 scale, and no pixel exceeded one channel step. This meets the parent's accepted bounded raster tolerance of at most 1/255 and fewer than 0.001% of pixels. The raw exact-PNG harness exited 1 because it treats any image mismatch as failure; this review does not claim byte-identical rendering at every sample. The formerly different E 6.4 sample is now exact. Runtime errors were empty; 39 objects were excluded from depth as intended.

Final title-seek-verification.json adds 55.981 seconds after the final target correction: both state and PNG hashes match exactly, errors empty.

## Static checks and limits
Reviewer ran node --check for set-desert4.js, look-desert4.js, robot-body.js, tour.js, build-timing.mjs and tour-stills.mjs: all exit 0. Rechecked final title source syntax and combined tracked diff versus 3798d12 with git diff --check: exit 0 (line-ending notices only). No source edits, GPU capture, commits or process stops were performed by the reviewer.

No full integrated HyperFrames check is claimed here. Parent explicitly deferred it to merged main after an earlier full-composition capture warmup stalled. Required integration follow-through: verify merged tour/build-timing union, complete composition check, overlays/captions, audio continuity, credit legibility, and actual desert-to-intro handoff. Those are integration gates, not unresolved defects in the reviewed scene source.
