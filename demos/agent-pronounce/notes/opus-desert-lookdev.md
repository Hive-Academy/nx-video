# Episode 6 desert look v4: look-dev notes (Opus lane)

These are stills only, with no animation. The look lives in `src/look-desert4.js` and builds on `buildDesert4Look(assets, renderer, { shot, aspect })`, which returns `{ scene, camera, bloom, exposure, film, handles, info }`. Its helpers are in `src/desert4-props.js`. The harness is `lookdev/desert4.html`, `lookdev/desert4.js` and `lookdev/shoot4.mjs`.

**The stills now render on the shared look kit.** I merged `b353830` (demo/ep06-v4-workspace-look) and ported the look to it. My first commit, `f56547b`, holds the pre-kit version for reference.

## Skills loaded

- video-quality-bar: "A lane that has not met this bar has not finished, whatever its exit code."
- threejs-scene-craft: "Primitives are for blocking and far-background filler only."
- free-media-sourcing: "Do not hand-download a file and do not copy one from another folder."

## Look recipe

- **Kit adoption.**
  - `film` is set to `{ tone 'aces', exposure 0.92, msaa 4, ao { radius 0.45, thickness 1.2, distanceExponent 1.6, samples 16, intensity 0.8 }, dof per shot, bloom { 0.3, 0.55, 1.05 }, grade { vignette 0.3, grain 0.022, ca 0.0012, lift [0.006, 0.006, 0.012], seed 4 } }`.
  - Light and shading come from the kit: `environment()` (PMREM, intensity 0.55, plus the HDRI backplate), `screenLight()` and `reshadeRobot()` on every robot.
  - My own post chain and robot shading are deleted.
- **Sky and IBL.** The sky is Poly Haven `qwantani_dusk_2_puresky`, rotated so that its sun sits on `SUN_DIR`. The background intensity is 0.95, and `backgroundRotation` is set in the look because the kit only rotates the environment.
- **Sun.**
  - DirectionalLight #FFCC98 at 3.2, very low (elevation about 9°) and coming in hard from camera-left (`SUN_DIR = (-0.97, 0.16, 0.12)`).
  - It rakes across the facade, so the reliefs read and long shadows fall across the site.
  - Shadows use a 4096 map with a frustum of ±36/±30 m.
  - Fill is a HemisphereLight with a cool sky (#9DB4DC) and a sand bounce (#A08A70) at 0.42.
- **Height fog.**
  - FogExp2 is patched through `onBeforeCompile` so that density falls off with height and a warm sun lobe appears.
  - Settings: colour #C4B2A2, sun #FFD09A, density 0.0105, falloff 0.11.
  - The screen is `fog:false`, so it never washes out.
- **Atmosphere.**
  - 4 layered haze cards, 7 additive light shafts raking in from the left, 1,200 drifting motes, and dust puffs that settle around each chair.
  - Every transparent atmosphere object is registered in `scene.userData.noDepth`. Without that, the kit's GTAO and Bokeh depth renders drew the dust quads as dark rectangles (seen and fixed).
- **Materials.**
  - Poly Haven PBR sets (diffuse, nor_gl and ARM): large_sandstone_blocks (facade), sandstone_cracks (carving, blocks and the Ptah stone), sand_01 (ground and rubble) and wood_planks.
  - Planar UVs are computed per piece from the dominant normal.
  - The tints were pulled toward neutral sandstone (#CBC4BA to #DAD0C1), because the first frames were far too orange.
- **The monument screen.**
  - The panel is 14.4 x 6.0 m (2.4:1), at 18.2 robot-heights wide, set into a 21 m battered facade.
  - The frame carries four relief bars sitting 0.5 m proud with a bump-mapped glyph band, a gold lip, a lapis fillet and a gold outer line.
  - Above it sit a winged sun disk with a uraeus, a cavetto cornice and torus roll, and a relief band under the cornice. Relief pilasters stand either side.
  - The emissive map is `assets/live-demo/stills/app.png`, cropped to 2.4:1, at emissive 1.55 with roughness 1 and env 0. That gives no veil over the UI.
  - When the screen is off (shot a) it is polished obsidian.
  - A RectAreaLight from the kit's `screenLight` (#9CC0FF, 5.5) lights the forecourt.
- **Fire.** Three braziers come from `temple.js` (two on the podium and one at the fire pit), adding warm PointLights against the cool screen.

## Layout

World units are metres. The robot is 0.79 m tall (scale 0.38). The site faces +Z and the screen glass is at z −29.86.

| Element | Position / size |
|---|---|
| Facade | 21 x 14 x 5 m, front at z −30, battered sides; cornice at y 14 |
| Screen (`handles.screen`) | centre (0, 6.8, −29.86), 14.4 x 6.0 m; frame group `handles.screenFrame`, border 0.9 m |
| Podium | 3 steps, 21.5 m wide, in front of the facade |
| Ptah (`handles.ptahAnchor`) | (10.75, 0, −27.4), yaw −0.32 toward the forecourt, height 11.6 m (buildPtah() scaled; stone swapped to sandstone PBR) |
| Left tower | 11 x 6.4 m at x −19.6, unfinished: ragged top courses and a 9.5 x 9.4 m scaffold |
| Right tower | 11 x 8.6 m at x 19.6 with a cornice. It is kept low so Ptah's head stands against the sky |
| Near crew (Antigravity, blue) | ramp start (−1.55, 0, −24.25), dir (−0.17, 0, 0.985), 10 m long, rise 1.0 |
| Mid crew (Cursor, lavender) | ramp start (4.2, 0, −27.35), dir (0.17, 0, 0.985), 12.5 m long, rise 1.6 |
| Far crew (OpenCode, black) | ramp start (1.8, 0, −25.95), dir (−1, 0, 0), 15 m long, rise 2.2 |
| Crew rig | each crew: 4 followers in 2 pairs (lateral 0.77 m = 1.5 body-widths, pair gaps 2.45 / 3.55 m), leader 4.85 m ahead, leather harness bands, two side ropes to a bridle and a lead rope to the leader, the block lashed on a sledge pitched to the ramp slope |
| Visitors (a) | seated in the two `mid_century_lounge_chair` seats at (0.55, −14.55) and (2.1, −14.85), facing the camera |
| Visitors (b–d) | standing at (0.35, −13.3) and (1.7, −13.55), facing the screen, empty chairs beside them |

| Still | Camera position | Target | Lens | DOF (focus / aperture / maxblur) | Measured |
|---|---|---|---|---|---|
| a arrival | (1.0, 0.66, −10.9) | (4.6, 3.3, −27) | 28 mm | 3.7 / 0.004 / 0.006 | faces at 0.72 from top |
| b wide | (0.2, 0.92, −5.6) | (2.6, 5.3, −30) | 35 mm | 24 / 0.0002 / 0.0025 | screen fill 0.581 (x 0.10–0.68); crew faces 0.72–0.78; visitors' backs 0.91 |
| c push-in | (0, 3.9, −12.9) | (0, 6.95, −30) | 35 mm | 17 / 0.0006 / 0.005 | screen fill 0.839, y 0.22–0.82, frame and disk visible on all sides |
| d crew close | (9.51, 1.67, −16.55): leader + dir·3.6 + side·3.4, y = leader + 0.55 | (5.51, 1.67, −21.54) | 45 mm | leader distance + 0.4 / 0.003 / 0.008 | crew faces 0.50–0.64 |

## Assets

All assets are CC0 from Poly Haven. Each one is in `assets/media.manifest.json` and fetched by `tools/media/fetch-media.mjs` into git-ignored folders. The list was generated by `lookdev/ph-manifest.mjs`. Sizes are on disk.

| Asset | URL | Author | Licence | Size |
|---|---|---|---|---|
| Qwantani Dusk 2 (Pure Sky) HDRI | https://polyhaven.com/a/qwantani_dusk_2_puresky | Greg Zaal, Jarod Guest | CC0-1.0 | 1 file, 4.4 MB |
| Kiara 8 Sunset HDRI (fetched, not used in the final look) | https://polyhaven.com/a/kiara_8_sunset | Greg Zaal | CC0-1.0 | 1 file, 6.0 MB |
| Large Sandstone Blocks | https://polyhaven.com/a/large_sandstone_blocks | Rob Tuytel | CC0-1.0 | 3 files, 2.1 MB |
| Sandstone Cracks | https://polyhaven.com/a/sandstone_cracks | Rob Tuytel | CC0-1.0 | 3 files, 2.1 MB |
| Sand 01 | https://polyhaven.com/a/sand_01 | Rob Tuytel | CC0-1.0 | 3 files, 1.4 MB |
| Wood Planks | https://polyhaven.com/a/wood_planks | Amal Kumar | CC0-1.0 | 3 files, 1.6 MB |
| Namaqualand Cliff 01 | https://polyhaven.com/a/namaqualand_cliff_01 | Jenelle van Heerden, Rico Cilliers | CC0-1.0 | 5 files, 4.3 MB |
| Namaqualand Cliff 02 | https://polyhaven.com/a/namaqualand_cliff_02 | Dario Barresi, Rico Cilliers | CC0-1.0 | 5 files, 8.0 MB |
| Namaqualand Boulder 02 | https://polyhaven.com/a/namaqualand_boulder_02 | Greg Zaal, Rico Cilliers | CC0-1.0 | 5 files, 4.9 MB |
| Namaqualand Boulder 05 | https://polyhaven.com/a/namaqualand_boulder_05 | Jenelle van Heerden, Dario Barresi | CC0-1.0 | 5 files, 4.5 MB |
| Sand Rocks Small 01 | https://polyhaven.com/a/sand_rocks_small_01 | Rob Tuytel, Rico Cilliers | CC0-1.0 | 5 files, 22.7 MB |
| Wooden Ladder | https://polyhaven.com/a/wooden_ladder | Miroslav Turura | CC0-1.0 | 5 files, 2.5 MB |
| Wooden Crate 01 | https://polyhaven.com/a/wooden_crate_01 | James Ray Cock | CC0-1.0 | 5 files, 2.2 MB |
| Ceramic Vase 02 | https://polyhaven.com/a/ceramic_vase_02 | James Ray Cock | CC0-1.0 | 5 files, 0.7 MB |
| Stone Fire Pit | https://polyhaven.com/a/stone_fire_pit | Sebastian Platen | CC0-1.0 | 5 files, 2.4 MB |
| Wicker Basket 01 | https://polyhaven.com/a/wicker_basket_01 | Kuutti Siitonen | CC0-1.0 | 5 files, 2.6 MB |
| Dead Quiver Trunk | https://polyhaven.com/a/dead_quiver_trunk | James Ray Cock, Dario Barresi, Rico Cilliers | CC0-1.0 | 5 files, 2.2 MB |
| Mid Century Lounge Chair (from the kit merge) | https://polyhaven.com/a/mid_century_lounge_chair | Kuutti Siitonen | CC0-1.0 | in the kit's manifest |

The following come from earlier episodes and were already in the manifest: the robot rig, the palms and pyramids, `buildPtah()` and the braziers.

## Render cost

These timings come from headless Chrome on this laptop at 1920x1080, from `node lookdev/shoot4.mjs desert4-b --time=10`. Each value is the mean of 10 frames, with a `readPixels` sync after every frame.

| Shot b chain | ms/frame |
|---|---|
| Full kit chain (`--post=preview`: AO + DOF + bloom + grade) | **66.3** |
| Kit chain without AO and DOF (`--post=base`) | 112.7 (a noisy run; it should not be slower than the full chain) |

Both are far under the 1 s budget, so no fallback is needed. If a slower machine goes over, the fallbacks in order are:

1. AO samples 16 → 8.
2. The shadow map 4096 → 2048.
3. Motes 1,200 → 400.
4. `msaa: 0`.

Scene load takes about 10–20 s per still, mostly texture decode.

## Scorecard

| Row | a | b | c | d | Note |
|---|---|---|---|---|---|
| Subject | 4 | 4 | 5 | 4 | a: both visitors read at once. b: screen plus Ptah. c: the UI is legible. d: five hauling faces read. |
| Set dressing | 4 | 4 | 4 | 4 | PBR sandstone, carved frame, scaffold, ramps, sledges, props, cliffs. The left of b is busy with block piles. |
| Light | 4 | 4 | 4 | 4 | Raking low sun, cool screen spill, fire practicals, IBL and GTAO. The sky is pale rather than a deep dusk blue. |
| Effect | 4 | 4 | 4 | 4 | Height fog, haze cards, shafts, motes, dust and DOF. The shafts are subtle. |
| Text and safe area | 4 | 4 | 4 | 4 | Lower 16% holds no faces or key UI text. b's visitor heads (backs) reach 0.91. c's screen bottom is at 0.82. |
| Continuity | 4 | 4 | 4 | 4 | Same set, kit shading on every robot, consistent crews and ramps across b, c and d. |

This is my own score on the stills I looked at. It is not an independent review.

## Verification

All commands ran from `demos/agent-pronounce` unless marked.

| Command | Result |
|---|---|
| `node lookdev/shoot4.mjs --post=preview` (a, b, c, d) | exit 0, 0 page errors. The only console errors are the two expected 404s (favicon, `audio/cues.json`), which the harness filters. |
| `node lookdev/shoot4.mjs desert4-b --post=preview --time=10` | exit 0, 66.3 ms/frame |
| ffmpeg xstack 2x2, 960x540 cells, drawtext labels → `snapshots/lookdev/desert4-sheet.jpg` | exit 0 |
| `node tools/media/fetch-media.mjs demos/agent-pronounce --check` (repo root) | 194/194 ok after the merge |
| `node tools/guards/no-media.mjs` (repo root) | exit 0 |

Merge of `b353830`:

- `media.manifest.json` was unioned by path: 194 items, 26 shared, 0 conflicting.
- `CREDITS.media.md` rows were unioned by path.
- There were no harness conflicts, because my harness files are separate (`desert4.*`, `shoot4.mjs`).

## Decisions

- **Separate harness.** It is `lookdev/desert4.*` and `shoot4.mjs`, not `lookdev/lookdev.js`, so it never collides with the kit's harness.
  - `post=base` is the kit chain with AO and DOF off.
  - `post=preview` is the full kit chain, which made the final stills.
- **ACES, not AgX.** I tried AgX on b. It cut the orange but greyed the emissive screen into a washed-out panel, so I kept ACES and fixed the saturation in the materials and the sun instead.
- **Sun moved from behind-camera to a hard side light.** The first frames were flat, front-lit and orange. The raking light gives the reliefs, the shells and the ropes their modelling.
- **The facade narrowed from 28 m to 21 m and the right tower lowered from 15.2 m to 8.6 m.** Sky could not show in b otherwise: at 55–65% screen fill the frame spans about 13.5 m vertically at the facade.
- **Face lights stay low.**
  - `reshadeRobot` face lights are on only where faces are read close: 0.35 for the seated visitors in a, and 0.22 for the mid crew in d.
  - Every other crew robot has `faceLight: 0`.
  - The reason: about 27 robots each adding a PointLight would be about 27 extra lights in every forward-shaded material.
- **Blob shadows kept for standing robots.** The kit hides `robot.blob` on the assumption that robots are seated and GTAO provides contact. On sand I keep the blob, because AO alone left the standing robots floating.
- **Exposure 0.92 with a 3.2 key.** Per the kit warning, the white shells keep their shading in every still and nothing clips to flat white.
- **Visitors stand in b–d.** The brief says only that nobody stands in a. In the later stills the visitors have left their chairs to watch, and the empty chairs stay in frame for continuity.
- **The script changes noted.**
  - The four feature lines and app clips change what plays on the screen, not the set. `handles.screen` (the emissive material) is the swap point.
  - The full-screen labels no longer exist, so the stills reserve only the lower 16% for captions.
- **Assumption (AskUserQuestion was not available).** The crew identities are the series cast (Antigravity, Cursor, OpenCode) with their `AGENTS` colours. Antigravity (blue) and Cursor (lavender) are close in hue.

## Open defects

- **a:**
  - The off screen is still a large near-black area in the upper left. The obsidian sheen barely reads.
  - Ptah's head is above the frame, and the colossus is lit rather than "dark".
  - The lounge chairs have a swivel base, not wheels, so "wheels half sunk" is not shown. The chair base sinks 9 cm instead.
  - Codex sits tipped back in the shell seat.
- **b:**
  - The visitors are plain white spheres from behind, with their heads at 0.91 (in the lower band, though no faces show).
  - The top of Ptah's crown touches the frame edge.
  - The sky strip is narrow and pale.
- **c:** The screen picture has a bright vertical band at the bottom centre. It comes from app.png's own content (a lit pyramid), not from the render.
- **d:** Followers in a pair overlap in depth from this angle. The block and sledge are mostly hidden behind the crew. The ramp edge fills the lower 15%.
- **All stills:** The sky is a pale late-afternoon blue, not a deep blue dusk. The fire-against-sky contrast is mild.
- **Ramp physics are staged, not simulated.** That is fine for stills, but animation needs a real `heightAt` drive.

## What the kit should add

1. **`environment()` should also set `scene.backgroundRotation`**, or take a separate background rotation. Today the look must rotate the backplate itself to keep the sun aligned.
2. **An option for `reshadeRobot` to keep the blob shadow** (`blob: true`). Standing robots on open ground need it.
3. **A cheap face-light path for crowds.** For example, a shared emissive boost or one light per group instead of one PointLight per robot.
4. **Automatic `noDepth` registration for transparent and additive materials** (or a helper `noDepth(scene, obj)`). Without it, dust sprites and haze cards show as dark rectangles in AO and DOF.
5. **A height-fog helper.** The `onBeforeCompile` FogExp2 patch in `desert4-props.js` (`heightFog`) is reusable by any exterior set.
6. **Honest timing stats.** Expose draw calls and triangles from the scene pass, because `renderer.info` after OutputPass reports 1/1.
