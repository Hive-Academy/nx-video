# Independent integration review

## Verdict
APPROVED — 8/10 for the merged source and scoped assembled visual evidence. No remaining blocker in this reviewed scope. Both identified integration defects were corrected in one bounded round. This is not final episode delivery approval: the parent's full integrated HyperFrames check and audio/draft review remain separate gates.

Independent reviewer: native Codex agent, separate from current native Codex implementers. Same-family review is weaker cross-family evidence; CLI lanes were disabled by the user after permission/report failures and child sessions failed parent attribution. Prior look checkpoints were Claude work. No author self-review.

Skills applied: C:/Users/abdal/.agents/skills/hyperframes/SKILL.md; D:/projects/nx-video/.agents/skills/video-quality-bar/SKILL.md; D:/projects/nx-video/.agents/skills/threejs-scene-craft/SKILL.md. Current SPEC Direction v4 and 1920x1080 primary format govern; existing user-approved scene choices were preserved.

## Merge source review
- src/tour.js:22-24 retains set-vortex4, set-desert4 and set-workspace together. Builder entries preserve buildDesert4Look/options and buildVortex4Look/options. Workspace builder and KINDS ordering remain intact.
- src/tour.js:76-79 contains one noDepth object-flag propagation loop, preserving both looks' exclusions through scene mount's rebuilt list. Vortex entry veil separately keeps its flag at set-vortex4.js:25.
- src/build-timing.mjs:27 and compositions/vortex.html retain the approved lower location label (bottom 65px; 64px/38px typography). Generator line 62 removes only the retired app-window host. Landing insert, captions, all voice/music/SFX generation, and N5 audio remain. The generated legacy app-window file is unmounted.
- Workspace source matched approved 7d791c1 exactly. Vortex source and generated label matched reviewed 9fb90ba exactly. Main desert sources/output matched the final reviewed desert tree, allowing only normalized line endings in endcard/tour-stills.
- robot-body.js:353 keeps haulCycle opt-in, preserving ordinary workspace/vortex poses. Endcard retains both robot and W2059 attribution.

## Bounded integration corrections independently verified
1. scripts/audio/running-order.mjs:39 formerly assigned duration/end before snapping the next start. Actual compiled hosts showed desert hidden after 96.651 and intro hidden until 96.670; exact 30fps frame 96.666667 was entirely #101721. Baseline 3798d12 also had this gap. The fix snaps before recording end/duration. Only desert duration/end changes from 56.081/96.651 to 56.1/96.67 in current timing; scene starts, voices, total106.67 and existing cues remain. titleTilt54.081 stays tied to D6 rather than moving with padding.
2. src/scene.js:191-196 formerly preferred the nearest ancestor data-duration over cfg.duration. HyperFrames runtime removes nested host duration attributes while main retains106.670. Actual office mounted duration was106.67, proving whole-episode duration leakage. Desert titleTilt consequently remained near A/chairs at96.633333. The fix prioritizes valid explicit cfg.duration. Corrected assembled desert reports56.1 and reaches the bare sandstone target before the seam.

Original failing evidence is retained as snapshots/native-integration/original-blank-96.666667.png, original-duration-96.633333.png, desert-original-capture-report.json and office-original-capture-report.json. These are superseded failure evidence, not final frames.

## Actual assembled capture method
Ignored snapshots/native-integration/capture.mjs bundles the actual main index with installed HyperFrames compiler. All original hosts, root background, timing, CSS, captions and overlays are retained. Only unrelated Three.js mounts are skipped per capture mode to bound warmup; target scene uses actual scene.js. The native HyperFrames seek helper drives the original runtime and hf-seek count advances at each sample. DOM visibility, mounted duration/camera and errors are saved alongside full1920x1080 PNGs. This tests actual composition scheduling, not manually toggled visibility or a substitute scene-only canvas.

## Visual evidence inspected
Paths below are under snapshots/native-integration:
- Final desert-global-96.633333.png and desert-global-96.666667.png: bare textured sandstone fills frame. At96.666667 desert is visible and intro hidden; the blank frame is fixed.
- desert-global-96.700000.png: intro stone wall visible; transition moves directly between stone surfaces. No claim of pixel-identical textures across the intentional 3D-to-graphic cut.
- desert-global-45.900000.png: Old caption readable below the approved colossus/visitor composition.
- desert-global-62.000000.png: actual tour remains on the in-world screen with readable highlighted caption; no retired full-bleed window covers the world.
- desert-global-104.500000.png: existing endcard tagline and URL plus robot and W2059 credit lines all readable at full size.
- office-global-4.900000.png and office-global-21.700000.png: workspace talk captions readable, with approved body/head/hand choices retained.

No contact sheet was generated; full-size individual evidence preserves credit readability.

## Seek and runtime evidence
Original assembled workspace transforms/camera hashes matched forward versus backward at0.2,1.2,21.7,35.8. Mesh world values rounded to1e-9; camera values unrounded. This is deterministic geometry evidence, not a claim of byte-identical image output. Final corrected office-capture-report.json reports mounted duration37.07 (previously106.67). At21.7 seconds, forward0->21.7 and backward36.9->0.1->21.7 state hashes match exactly; corrected full-size caption frame inspected. Only favicon404 remains.

Corrected desert-capture-report.json records mounted duration56.1 and fixed host visibility at the exact former gap. Corrected capture has no page or required-resource errors; favicon404 is the sole HTTP error. Initial missing fitted-high-ee233176.bin cache caused a live fit via ptah-colossus.js:1459-1474, not a missing source scan. Parent copied that exact ignored cache from the desert tree; it no longer404s.

## Checks and limits
Reviewer ran syntax checks for resolved tour.js/build-timing.mjs and final scene.js/running-order.mjs; all passed. Scoped git diff --check passed. Reviewed final diff preserves only intended integration changes in scene.js, running-order.mjs, timing.json, index.html and compositions/desert.html.

Parent's initial full check in owned session76252 exceeded120s render-ready and then produced no verdict for more than two further minutes. Parent interrupted only that owned session; exit1. This was incomplete, not pass. The scoped captures subsequently completed, but do not substitute for the queued corrected full check. Audio was not auditioned and no full rendered draft was reviewed. Existing scene-level review reports remain applicable within their stated scope.

Reviewer wrote only this report and ignored capture harness/frames, launched sequential owned browser sessions, and closed them through their handles. No production edits, commits, unrelated configuration changes or process-name stops.
