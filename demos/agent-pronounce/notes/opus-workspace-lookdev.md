# Episode 6 v4: workspace look-dev and look kit (opus lane)

These are look-dev stills only, with no animation. The branch is `demo/ep06-v4-workspace-look`. Phase 1 is commit `b353830`.

## Skills loaded

- `D:/projects/nx-video/tools/skills/video-quality-bar/SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `D:/projects/nx-video/tools/skills/threejs-scene-craft/SKILL.md`: "Robots come only from `createRobot(assets, name)` (`robot.js`). Never rebuild a character."
- `D:/projects/nx-video/tools/skills/free-media-sourcing/SKILL.md`: "Do not hand-download a file and do not copy one from another folder."

## Look recipe

The scene is an evening workspace in a "2026 stylised short" style: a warm interior, a cool screen and a city at night outside.

- **Light**
  - Image-based light: PMREM from `unfinished_office_night_1k.hdr` at intensity 0.45, rotated 0.6 rad.
  - Window backplate: `scene.background` uses `shanghai_bund_2k.hdr` at intensity 0.3, with `backgroundRotation` y = 4.05 so the night skyline sits in the window. Depth of field blurs it into bokeh.
  - Cool: the hero screen is a RectAreaLight (#C8DAFF, 12). A "moon" DirectionalLight (#8EA6E8, 0.55, 2048 shadow) comes from the window, plus a rim spot (#A9C2FF) behind the robots.
  - Warm practicals: a spot (#FFB46B) in each desk lamp, an emissive pendant globe with a point light, a cove strip over the slat wall, a wash on the shelves and a wash on the blueprint frame.
- **Robots:** `reshadeRobot` gives them a clearcoat physical shell (clearcoat 1, clearcoat roughness 0.08) with env reflections. The emissive face and eyes are boosted. A face light in the agent colour throws the face colour onto the desk and chair. The engine blob shadow is replaced by real shadow maps plus GTAO.
- **Film chain** (`film` on the look):
  - Half-float MSAA target (4 samples), then GTAO (radius 0.16, intensity 0.85).
  - Bokeh depth of field per shot, then UnrealBloom (0.22 / 0.55 / threshold 1.0, which is restrained).
  - ACES tone mapping at exposure 0.95.
  - Grade: vignette 0.32, seeded grain 0.022, edge chromatic aberration 0.0012.
- **Surfaces:** herringbone parquet floor, plastered walls, walnut veneer desk tops (tinted #C27A46, because the Poly Haven diffuse is near-grey), instanced walnut slats behind the screen, and a herringbone wool rug. No surface the camera holds on is flat or untextured.
- **Egyptian motif, kept quiet:** a sandstone-tinted cat (Bastet) on Claude's desk, a framed stepped-pyramid blueprint (a procedural canvas with no text) on Claude's side wall, and a brass lip under the hero screen.

## Kit API

`src/look-kit.js` documents the API in its header comment. In short:

1. A look returns `film: { size:[w,h], tone:'aces'|'agx'|'neutral', exposure, msaa, ao:{radius,intensity}|false, dof:{focus,aperture,maxblur}|false, bloom:{strength,radius,threshold}|false, grade:{vignette,grain,ca,lift,seed} }`. That opts the look in. A look without `film` renders exactly as before.
2. `renderFilm(renderer, scene, camera, film, w, h, frame)` runs the chain, cached per `film` object: RenderPass (freezes the shadow maps after the colour pass), GTAO, Bokeh, bloom, OutputPass tone mapping, then the grade. Objects in `scene.userData.noDepth` are hidden from the depth passes.
3. `environment(renderer, scene, hdriTex, {intensity, rotation, background, backgroundTex, backgroundIntensity, backgroundBlurriness})`.
4. `reshadeRobot(robot, {env, faceLight, eyeBoost, shell, envMap, faceBoost})`. It acts only on a robot from `createRobot` and never rebuilds the rig. Round 2 added `envMap` (a texture set on the shell, feet and visor materials; default none) and `faceBoost` (multiplies the visor emissive colour; default 1). Both are additive: with the defaults, behaviour matches b353830.
4a. `roomProbe(renderer, scene, {position, size=256, near=0.05, far=30, sigma=0, hide=[]})` is new in round 2. It returns a PMREM texture of the set rendered from `position`, with the `hide` objects and the `noDepth` objects hidden. Call it after `await whenTexturesReady()`.
5. `screenLight(w, h, color, intensity)`, `practical('spot'|'point', {color, intensity, distance, angle, penumbra, shadow, radius, bias})` and `contactShadow(scene, w, d, opacity)`.

Wiring:

- `lookdev/lookdev.js`: if `look.film` is set, it sizes the canvas to `film.size` and draws with `renderFilm`. Otherwise it uses the old composer path.
- `src/scene.js`: `renderFrame` gains `if (post && post.film) { renderFilm(...); return; }`. It is additive: every other set passes no `film` and takes the old path. The grain seed comes from `post.filmFrame`, so the grain is deterministic per frame.
- **r181 depth fix:** BasicDepthPacking is read with `DEPTH_PACKING = 0`. The read is inverted (`1.0 - depth`), because `MeshDepthMaterial` with BasicDepthPacking writes `1 - z` in r181. Without the inversion, the focus plane lands behind the camera and everything blurs.

## Layout with cameras

World scale: K = 0.63. Robots are at scale 0.38: height 0.79, head radius 0.325.

| Item | Position |
| --- | --- |
| Room | x ±2.15, z −1.02 (screen wall) to +2.35 (window wall), ceiling 1.78 |
| Hero screen | 2.04 × 0.96 (aspect 2.124, the landing still) at (0, 0.99, −0.9); about 3.1 head widths wide |
| Desks | walnut, 1.06 × 0.56, top 0.47, at x ±0.62, z 0.06, yaw ±0.14 toward each other |
| Codex | x +0.62 (#10A37F), mid-century swivel chair, seat height found by raycast |
| Claude | x −0.62 (#D97757), same chair |
| Back of room | window (x −1.45..0.75) with mullions, steel shelves with books, pachira, floor plant |
| Screen wall | walnut slats and cove strip, console cabinet with vase and books |

| Shot | Camera pos | Target | Focal | Focus / aperture |
| --- | --- | --- | --- | --- |
| a, over the shoulder | (0.06, 1.45, 2.15) | (0, 0.98, −0.9) | 30 mm | 3.1 / 0.006 |
| b, front two-shot | (1.55, 1.15, −0.8) | (−0.05, 0.74, 0.62) | 24 mm | 2.25 / 0.004 |
| c, Codex MCU | (−0.42, 0.98, 1.77) | (0.37, 0.7, 0.47) | 35 mm | 1.2 / 0.012 |

In shot c, Codex swivels toward Claude (looking at (−0.9, 0, 0.95)). In shots a and b, both robots face the screen.

## Assets

All assets are from Poly Haven under CC0. They are fetched through `assets/media.manifest.json` with `node tools/media/fetch-media.mjs demos/agent-pronounce --pin`, then `--check` (125/125 ok). Credits are in `assets/CREDITS.media.md`. Nothing is committed: everything sits under the git-ignored `assets/third-party/`.

- **Models** (1k glTF, one manifest entry per file), under `models/workspace/<id>/`: mid_century_lounge_chair, desk_lamp_arm_01, potted_plant_02, potted_plant_04, steel_frame_shelves_03, book_encyclopedia_set_01, concrete_cat_statue, hanging_picture_frame_01, stationery_supplies, modern_wooden_cabinet, pachira_aquatica_01, modern_ceiling_lamp_01, ceramic_vase_01, office_notepads. I skipped decorative_book_set_01 because it has no glTF.
- **Textures:** herringbone_parquet (2k), plastered_wall_04, american_walnut_veneer, poly_wool_herringbone (1k): diffuse, nor_gl and rough maps for each.
- **HDRIs:** shanghai_bund_2k (window backplate), unfinished_office_night_1k (lighting).
- **Procedural:** desks, keyboards, mugs, the screen bezel, slats, the window frame and the blueprint canvas.
- Source pages: `https://polyhaven.com/a/<id>`.

## Screen stills

- Tour frames 1–3 all show personal text:
  - workspace names "seshat", "ptah-extension" and "nx-video";
  - session titles "video about ptah features promo", "before we build the nx video tools itself i w…" and "Session 10/9/2026".
  - The best app frame (tour-1 at 4.8 s) still shows them. I did not use tour-4.
- **Fallback used:** the landing hero at `assets/live-demo/landing-scroll.mp4` at 2.4 s, the "ON YOUR DESKTOP / ONE RAIL. NINE RUNNING. ONE BELL." section with its app mockup. It is saved as `assets/live-demo/stills/landing-app.png` (1920 × 904, git-ignored). It contains only marketing demo data. Candidate frames are in `snapshots/screen/`.
- The screen is a MeshBasic panel with its colour ×1.55, so it stays bright after tone mapping. Its largest text reads in shot a.

## Render cost

Times are at 1920 × 1080 on headless Chrome WebGL, the mean of 3 timed frames after 2 warm-up frames.

| Shot | Time |
| --- | --- |
| workspace-a | 38 ms/frame (run alone) |
| workspace-b | 39–41 ms/frame |
| workspace-c | 33–38 ms/frame |

- The first scene in a multi-scene run can spike (213 and 1060 ms seen) from shader compilation or GPU contention from other sessions. Repeat runs settle at about 40 ms.
- For comparison, office runs at 16 ms and desert at 22–28 ms.
- About 20 ms of the 40 is GTAO plus bokeh. To cut cost: `ao:false` saves about 12 ms, and shadows are frozen after the first pass.

## Scorecard

Scores follow `tools/skills/video-quality-bar/references/scorecard.md`. They are taken at the 16:9 render size, because episode 6 is a 16:9 cut (commit d20cd83), not the 4:5 crop. Effect: no effect is cued in a static still, so the row is scored on the promised screen glow.

| Frame | Subject | Set dressing | Light | Effect | Text / safe | Continuity | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `snapshots/lookdev/workspace-a.png` | 4 | 4 | 4 | 4 | 5 | 4 | pass |
| `snapshots/lookdev/workspace-b.png` | 4 | 4 | 4 | 4 | 5 | 4 | pass |
| `snapshots/lookdev/workspace-c.png` | 5 | 4 | 4 | 4 | 5 | 4 | pass |

Sheet: `snapshots/lookdev/workspace-sheet.jpg` (2880 × 590, three labelled 960 px cells).

- **a:** the screen is about 58% of the frame width, and "ONE RAIL. NINE RUNNING. ONE BELL." is readable. The heads are soft in the lower corners, and nothing important is in the lower 16%.
- **b:** Codex's face is about 46% of frame height and Claude's about 30% (both at least 22%). The night city shows as bokeh in the window. Warm lamps, shelves and the blueprint give three depth layers.
- **c:** Codex's face sits wholly above the 84% line. A slice of the screen is upper left, and Claude's ear is a soft sliver at the left edge.

## Verification

- `node lookdev/shoot.mjs office desert` before and after the kit, compared with `ffmpeg psnr`: **PSNR inf (bit-identical)** for both.
- `node tools/guards/no-media.mjs` passes (443 files, no violations).
- In the snapshot runs, the only errors are the pre-existing 404 for `assets/audio/cues.json` and its console echo (the cue file is not in this worktree). There are no page errors.
- Determinism: no `Math.random`, `Date`, `performance.now` or timers in the scene modules. The grain is a seeded hash. Timing lives only in the harness.
- Not run: `hyperframes check` and render/preview (the brief forbids them). No HyperFrames composition was changed.

## Decisions

- **Side convention:** Codex is at world +x, so it is frame-left in the main shot b. Shot a, from behind, crosses the line, so Codex appears frame-right. Treat a as an establishing shot, or mirror its framing in the edit if the line matters.
- **Shot c:** the screen sits in front of the robots, so a screen slice and Codex's face share the frame only if Codex swivels toward Claude. The neighbour is therefore a soft foreground sliver, not a background figure.
- **Shot b camera:** to frame both robots it sits beside the screen (x 1.55), not straight beyond the desks, because the screen blocks a straight-on camera.
- **Screen still:** the landing mockup replaces the app frames, because every clean app frame carried personal text.
- **Walnut:** the veneer diffuse averages RGB (115, 109, 107), so the material colour tints it to walnut brown.
- **Pendant:** shortened to h 0.26, so it hangs above the screen's top edge in shot a.
- Assumption (AskUserQuestion was unavailable): look-dev stills are 1920 × 1080.

## Round 2: parent feedback on workspace-b

| # | Feedback | What changed | Result |
|---|---|---|---|
| 1 | The shells clip to flat white | Shell albedo #CDC6BA (was #E9E4DA), env 0.7, a room probe as the shell envMap, face light 0.3 | Shell peaks at 235–244 RGB, not 255. There is side shading and a cool window rim. It is still bright ceramic. |
| 2 | No screen light | Screen RectAreaLight 12 → 28, a cool spill spot (#9FC2FF, 3.2) from the screen edge, lamp spots 1.6 → 1.15. The window glass is now a dark metal mirror (#2E3A4E, rough 0.05, probe env 0.6, additive). | The hero screen's reflection shows as a cool panel in the window, frame-left. That motivates the light, because the screen itself is behind the lens in b. The cool glow on the heads is subtle; the warm desk lamps still lead. |
| 3 | Balls resting on chairs | Robots raised by +0.05 and moved 0.06 toward the desk, pitch −0.14 (lean to the keyboard), heads turned in b (Codex yaw −0.3, Claude −0.38) | They lean in and turn toward each other. **Limitation:** the `cute_robot` rig has no arms, hands or torso, and the rules forbid rebuilding a character. "Body above the desk line" is the ball plus its collar ring. |
| 4 | The lamp cuts across Codex and the bottom edge | Lamps moved to the back corners of the desks (Codex inner-back, Claude outer-back), h 0.32/0.42 | Nothing crosses a robot. The lower 16 % of the frame holds no faces in a, b or c. |
| 5 | The right wall and the ceiling are black | Warm uplight scallop (#FFB878) on Claude's side wall, a dim ceiling fill point light, a blueprint wash | Wall ~78 RGB, the ceiling shows the fixture glow |
| 6 | The Claude face is a flat brown disc | `faceBoost` 3.6 for Claude, 2.6 for Codex (the visor emissive is tint × 0.6 × boost). The colour is #D97757 from the cast. | It reads as an emissive terracotta, matching the green one. ACES pushes it slightly toward salmon. |

Render cost after round 2 (SwiftShader-free GPU, 1920×1080): a ~38–64 ms, b ~35–61 ms, c ~34–61 ms per frame. The first scene in a run spikes to 100–450 ms (shader compilation). Office and desert are unchanged: PSNR inf against the pre-kit baselines.

## Round 3: orchestrator review of phase 2 (d0ee888)

Viewed at 1280 px. The 4:5 crops are centre crops (864×1080 out of 1920×1080; c is offset to the face) in `snapshots/lookdev/workspace-45.jpg`. The 16:9 sheet is `workspace-sheet.jpg`.

| # | Review point | What changed | Result |
|---|---|---|---|
| 1 | Balls on chairs | `ROBOT_SCALE` 0.38 → 0.25 (ball radius ≈ 0.21, so the head is about one chair-back wide). The chairs come from the new kit helper `loungeChair` with a 6 cm cushion. Each robot is placed at the raycast seat height (`userData.seatY`), sunk 3 cm toward the chair back, and yawed with its chair. Pose `work` (pitch −0.12) in a, `talk` (three-quarter toward camera) in b and c. | b: both robots visibly sit in the chairs, against the backs, above the desk line. **Arms and hands: FAIL.** The rig has no arms, hands or torso, and the rules forbid rebuilding a character. Nothing can reach the keyboard. |
| 2 | Shell shading | `reshadeRobot` `shell: '#CCC3B5'` (about 0.78 off-white), clearcoat with the room probe as envMap, `env 0.9`, `faceLight: 0` (the agent-colour face light tinted the small shells). `smooth: π/4` rebuilds the normals with crease angles. | Shell peak in c is 194,176,165 (under clip). There is a warm key-to-shadow gradient and a visible probe reflection. **Rim silhouette: FAIL at close-up in c.** Crease normals fix the shading but not the silhouette, and the rig has no subdivision. The inner visor rim still shows polygon steps. |
| 3 | Faces | `glass: 0.55`: dark glass visor (#07080B, roughness 0.06, clearcoat 1, env × 2.2) with the agent colour as an emissive tint. `eyeBoost 2.6` feeds bloom. Claude gets `faceBoost 1.25`. | Pass. Glossy dark green and terracotta glass with a probe reflection; the eyes bloom slightly. The wall-screen reflection is faint: the probe is baked without the screen content. |
| 4 | Shot a | Camera (0, 1.3, 2.2) → (0, 0.9, −0.9), 28 mm, focus on the screen, aperture 0.0025. Bezel 7 mm (RoundedBox). The screen rect light (18, cool) sits 8 cm in front of the screen and 16 cm up, plus a back-bias rect and a side spill. The pendant moved to x −1.25, z 0.95. Environment 0.45 → 0.62, warm key spot 9. Slats re-tinted (#7A5A40, env 0.25). | Pass: the screen is sharp and the headline reads at 1280 px. The shells take about 15 % of the frame. The slat wall measures about 34 sRGB (≈ 13 %). The pendant is clear of the screen. Weak: the shells are unfocused backs with no chair backs visible, the desks read red-brown, and the slats pick up a cool grey cast from the screen light. |
| 5 | Shot b | Three-quarter view from front-left, (−0.32, 0.98, 2.24) → (0.04, 0.72, 0), 24 mm, focus on the robots. | Pass: both robots in three-quarter view and the screen in one frame, Claude frame-left and Codex frame-right (the same in a). **City window: FAIL.** The line rule puts the cameras on the window side, so the window is behind the lens. Its screen reflection is not in b either. The screen headline is soft (depth of field) but readable at 1280 px. The cushion reads as a grey box on the lap. |
| 6 | Shot c | Kept. Reframed (0.02, 0.8, 1.56) → Codex, 42 mm. The neighbour sliver is gone. | Pass apart from the rim silhouette in point 2. |
| 7 | Screen slot | `handles.setScreenSource(textureOrVideoOrCanvas)` swaps the screen map (video → `VideoTexture`, canvas → `CanvasTexture`, sRGB). The landing mockup is still the default. | Pass. Not exercised with a video yet. |
| 8 | Shared chair | `loungeChair({ height, cushion, cushionColor })` in `look-kit.js` loads the same `mid_century_lounge_chair` glTF and returns a Group (origin on the floor under the seat, facing −z, `userData.seatY`). | Pass for the workspace. The vortex and desert scenes are not touched here; they belong to other lanes. |

### Honest scores

A known defect is scored as a fail, not a 4.

| Shot | 16:9 | 4:5 crop |
|---|---|---|
| a | Pass on the hero screen, light, focus and framing. Fail: no body or hands visible (the rig). | **Fail.** The centre crop cuts the headline ("E RAIL. NINE") and both robots. 4:5 needs its own camera, not a crop. |
| b | Fail: no arms (rig) and no window. Otherwise pass: staging, line, seated robots, screen in frame. | **Fail.** The crop keeps Codex's chair and the screen but cuts Claude's face at the edge. |
| c | Fail: rim silhouette steps at close-up. Otherwise pass: glass visor, shell gradient, depth of field. | Pass apart from the same rim defect. The face fills the crop. |

Not ready for the user. The remaining fails are either rig limits (arms, rim silhouette) or need a separate 4:5 camera per shot.

Render cost (1920×1080, film chain): a 162–286 ms, b 79–194 ms, c 104–165 ms per frame. That is up from about 60 ms in round 2: the extra rect light, the key spot with a 1024 shadow map, and the chair glTF. Office and desert are unchanged: PSNR inf against the pre-kit baselines.

### Kit API changes since ffe3092

- `reshadeRobot` gains `glass` (default 0 = off): a dark glass visor with an agent-colour emissive tint of this strength.
- `reshadeRobot` gains `smooth` (default 0 = off): a crease angle in radians. It rebuilds the robot meshes' normals once with `toCreasedNormals`.
- New export `loungeChair({ height = 0.737, cushion = 0, cushionColor = '#3B3733' })` → Promise of a Group with `userData.seatY`.
- `look-kit.js` now imports `craft.js` (`glb`, `fit`, `shadows`), `RoundedBoxGeometry` and `BufferGeometryUtils`. `craft.js` does not import the kit, so there is no cycle.
- Workspace only: the handles gain `setScreenSource`, and the module exports `ROBOT_SCALE`.

## Open defects

1. **No arms, hands or torso** (rig limitation). Seated reads as "head in a chair". It needs a rig with arms, which is a decision for the parent, not this lane.
2. **The visor rim silhouette shows polygon steps in c.** Normals cannot fix it. Options: a subdivided copy of the rig, or keep c wider than an MCU.
3. **4:5 crops fail for a and b.** Each needs its own 4:5 camera.
4. **No city window in b** (it is behind the camera because of the line rule). Depth comes from the room and the screen instead.
5. **The screen is not in the probe**, so its reflection in the visor is faint. Re-baking the probe with the screen lit would fix it.
6. **The slats take a cool grey cast** from the screen light; the desks read red-brown in a.
7. **The cushion reads as a grey box** in b. Match it to the leather or drop it and raise the seat instead.
8. **Render cost rose** to 80–290 ms per frame (see above). The first scene in a run still spikes with shader compilation.
9. **`__lookdevInfo.calls/tris` report 1/1** on the film path, because `renderer.info` resets per pass. This affects only the reported numbers.

## Adopting the kit in the desert and vortex scenes

These files were not touched here; they belong to other lanes.

1. In `look-desert.js` or `look-vortex.js`, return `film: { ...FILM_DEFAULTS, size, tone:'aces', exposure, ao:{radius:0.3,intensity:0.7}, dof:false|{...}, bloom:{strength:0.3,radius:0.6,threshold:0.95}, grade:{vignette:0.3, grain:0.02, ca:0.001, seed:N} }`. Drop the old `bloom` field, because the film chain owns bloom.
2. Call `environment(renderer, scene, hdri.tex, {intensity, rotation, background:true})` instead of hand-rolled PMREM code.
3. Call `reshadeRobot(robot, { faceLight: true })` on each robot after `craft.robot`.
4. Use `contactShadow` decals under props, and push additive effects (cones, sparks, portals) into `scene.userData.noDepth`, so depth of field and AO ignore them.
5. In compositions that use `src/scene.js`, the set passes `post.film` (plus `post.filmFrame = frame`, which keeps the grain deterministic per frame). Sets without it render unchanged.
