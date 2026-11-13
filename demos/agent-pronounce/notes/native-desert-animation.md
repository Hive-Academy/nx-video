# Native desert animation

## Skills loaded
- C:/Users/abdal/.agents/skills/hyperframes/SKILL.md: "Never `play()`, `pause()` or seek media."
- D:/projects/nx-video/.agents/skills/video-quality-bar/SKILL.md: "A lane that has not met this bar has not finished, whatever its exit code."
- D:/projects/nx-video/.agents/skills/threejs-scene-craft/SKILL.md: "Everything is a pure function of the seek time `t`."

## Status
Implementation, runtime frame review and backward-seek verification complete; parent integrated composition review remains. Native permission and parent messaging passed. Actual runtime uses the approved v4 look and the old full-bleed app-window host is removed.

## Look-dev match
Twenty-one actual scene.js runtime frames at 1920x1080 inspected individually and in snapshots/lookdev/desert-anim-sheet.jpg. Parent also inspected sheet and full E6.4: approved look preserved, eye glow visible, world edges maintained around tour screen. B/C rear views are accepted direction. Whole colossus face appears at rise-1.0; eyes ramp from rise-0.6; visitors stay seated until rise. No overlays/captions are included in these scoped runtime frames.

## Scorecard
Reference opened: D:/projects/nx-video/demos/agent-comparison/snapshots/review/contact-sheet-1.jpg. Primary framing follows SPEC.md 16:9 override; 4:5 is dropped. Scores below cover the actual scene runtime, including screen text safe area. They do not score absent caption/endcard overlays. All21 captured frames were opened at full size; B/C rear visitor views are expressly approved.

|Local frames (seconds)|Subject|Set dressing|Light|Effect|Text/safe area*|Continuity|
|---|---:|---:|---:|---:|---:|---:|
|0.1,0.3,1.8 (A landing)|4|5|4|4|4|4|
|4.0,4.4,5.0 (pre-rise E)|4|5|4|4|4|4|
|6.4 (standing E)|4|5|4|4|4|4|
|16.874,17.474,17.674 (D crews)|4|5|4|4|4|4|
|17.974 (B opening)|4|5|4|4|4|4|
|21.4,25.344,28.04,31.606,38.027 (C tours)|4|5|4|4|4|4|
|43.909 (E return)|4|5|4|4|4|4|
|50.455,54.081 (A reaction)|4|5|4|4|4|4|
|55.081,55.981 (title move)|4|4|4|4|4|4|

*Runtime UI only. Caption size/contrast/safe area require parent integrated check; no overall episode pass is claimed.

## Credits
No new third-party assets; existing credited scan, bodied robots, textures and accepted tour footage.

## Open defects
Shared-texture seek test passes bounded raster tolerance: six exact scene-state hashes; five exact PNG hashes; at4.4 only17/2,073,600pixels differ by at most1/255 channel (0.0008198%, mean channel difference0.000002733/255). No pixel differs by more than1. Parent accepted this tolerance. Closing tilt verified at55.081/55.981; final frame is bare sandstone and repeated title seek is byte-identical. Full composition captions/audio/endcard readability and desert-to-title light/texture seam require integrated review; scoped evidence does not claim these checks. Initial HyperFrames full snapshot warm-up timed out; own session stopped.

## Implementation checkpoint
- Runtime now mounts src/set-desert4.js and buildDesert4Look; the v3 adapter remains as legacy source only.
- Approved A/E/D/B-to-C setups follow scene cues. The giant is revealed at rise-1.0, eyes begin at rise-0.6, and bodies remain seated until rise. E eye gain is 12 (approved correction from4).
- B-to-C camera, visitor seats and DOF interpolate together. E rim follows the current visitors. Haul IK refreshes moved ancestor matrices; gait is opt-in so earlier approved stills remain unchanged.
- Accepted tours are frozen by scripts/live-demo/tour-stills.mjs at10fps under assets/live-demo/stills/tour-{1,2,3,4}-seq; counts74,63,65,59 derive from timing cues. No generated metadata is required. Copy these ignored directories or regenerate after media fetch.
- Direction v4 SPEC.md requires the 3D world visible around the monumental screen and retires v3 full-bleed showcase. build-timing.mjs removes only the app-window host; regenerated index preserves audio/N5/timing. Legacy app-window source remains unmounted.
- Endcard retains robot credit and adds Ptah-Sokar-Osiris W2059: The Egypt Centre, Swansea University · CC BY4.0.
- Static JS syntax checks and scoped diff whitespace passed; no-media passed478 files.

## Capture status
- Full-composition HyperFrames snapshot invoked with10 desert timestamps, but stopped through its own execution session after ~5min warm-up with no frame output. This is not a visual pass.
- Scoped actual scene.js runtime captured20 initial frames without console/network errors. Latest shared-texture capture updated21.4/38.027 and closing cues. Six of six transform+camera hashes matched after0->target vs55.9->.1->target; five of six exact pixel hashes matched. Saved PNG comparison at4.4 found only17pixels with1/255 channel difference, zero above1. E6.4 is now exact. Evidence: snapshots/native-desert/seek-verification.json, seek-pixel-delta.json and seek-*-forward/backward.png.
- Parent directs the integrated HyperFrames check after merging all three scenes, so no second independent CLI warmup is required. Full-composition snapshot attempt remains a recorded failure, not a passing CLI check.
- GPU screen allocation now uses one1280x720 CanvasTexture (about3.5MiBRGBA) updated from261 preloaded images, plus the existing idle texture. CPU decoded image cache remains up to917.6MiBRGBA equivalent for synchronous deterministic seeks; compressed JPEGs total21.8MiB. No per-seek texture allocation.
- Final2s titleTilt pushes/tilts to the existing facade bare upper band, preserving A reaction before the cue. No new set/assets. Final frame inspected: existing bare sandstone fills the frame. Final title seek state and PNG are exact. Integrated intro seam still requires parent check.

## Exact integration files
- src/set-desert4.js (new runtime adapter)
- src/look-desert4.js (export approved shot data, strengthen E eyes, expose crew/visitor animation handles)
- src/robot-body.js (opt-in haul gait)
- src/tour.js (desert4 dispatch and noDepth flags; union with vortex/workspace dispatch on integration)
- src/build-timing.mjs (remove superseded app-window host only)
- index.html (generated root without app-window host; audio/N5 preserved)
- compositions/endcard.html (W2059 attribution alongside existing robot credit)
- scripts/live-demo/tour-stills.mjs (new deterministic accepted-footage frame generator)
- notes/native-desert-animation.md (this report)

## Reproduction / ignored evidence
Run `node scripts/live-demo/tour-stills.mjs` from the demo after the four accepted tour MP4s are present. It creates74/63/65/59 JPEGs in assets/live-demo/stills/tour-{1,2,3,4}-seq; copy these ignored directories during integration or regenerate. No manifest, new downloads or media commits. Harness and captures are ignored in snapshots/native-desert; contact sheet is snapshots/lookdev/desert-anim-sheet.jpg. All source comes from actual scene.js, with overlays deliberately absent.

## Final static checks
Six touched JS files passed node --check. git diff --check passed (line-ending notices only). Root node tools/guards/no-media.mjs passed478 files. Existing MCP/harness and permission-probe changes preserved. No commits/pushes/resets/stashes or process-name stops.

## Final evidence result
Final contact sheet contains21 scene-runtime frames including corrected title midpoint/end. Full55.981 frame and title-seek-verification.json confirm bare facade stone with no screen/disk and exact backward pixels/state. No more source edits after this checkpoint; independent reviewer owns notes/native-desert-review.md. Parent will run the integrated HyperFrames check and caption/endcard/intro seam inspection.
