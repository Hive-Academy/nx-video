# Episode 6 desert look v4: look-dev notes

These are stills only, with no animation. The look is in `src/look-desert4.js` (`buildDesert4Look(assets, renderer, { shot, aspect })` returns `{ scene, camera, film, handles, info }`).
- The triplanar stone shader is in `src/desert4-stone.js`.
- The props, height fog and PBR helpers are in `src/desert4-props.js`.
- The look renders on the shared look kit (`src/look-kit.js`, unchanged).
- The harness is `lookdev/shoot4.mjs`.

This pass answers the orchestrator's second review of `206bc8b`: the review scored a 2, b 3, c 4 and d 3–4, and the review notes listed below.

## Skills loaded

- `C:\Users\abdal\.claude\skills\video-quality-bar\SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `C:\Users\abdal\.claude\skills\threejs-scene-craft\SKILL.md`: "Primitives are for blocking and far-background filler only."
- `C:\Users\abdal\.claude\skills\free-media-sourcing\SKILL.md`: "Do not hand-download a file and do not copy one from another folder."

## Look recipe

- **Open desert set.** The old enclosing cliffs are gone, and the site now sits in open dunes:
  - **Near terrain:** `groundAt(x, z)` gives 340 x 290 m of terrain at about 0.6 m mesh spacing.
  - **Flat site:** the site is flat and paved.
  - **Drifts:** sand builds up against the podium, the facade and the tower stub (`0.6·exp(−d/1.15)`).
  - **Dunes:** ridge-noise dunes rise from about 40 m out to 7–9 m high by 170 m.
  - **Far sheet:** a 3.2 km sheet carries the dunes to the horizon.
  - **Pyramids:** four (including one step pyramid) at 110–240 m, placed on the dunes, so at least one is visible on one side of every wide shot.
- **Sky and IBL.**
  - Poly Haven `mpumalanga_veld_puresky` (CC0) through the kit's `environment()`, at intensity 0.6, background 1.0, and rotated so that its sun lines up with `SUN_DIR`.
  - The overhead sky reads deep blue and the horizon pale and warm.
  - `qwantani_dusk_2` stays in the manifest as the earlier sky.
- **Sun.**
  - A DirectionalLight #FFC48A at 3.7, at an elevation of about 16° (`SUN_DIR = (−0.95, 0.27, 0.14)`): golden hour, with shadows about 3.5 times object height.
  - I raised it from 9° because, at 9°, flat paving was lit almost only by the blue sky and read grey.
- **Height haze.**
  - The kit fog patched with height falloff and a warm sun lobe (`heightFog`): colour #D7BFA6, density 0.0042, falloff 0.075.
  - Plus two thin haze cards, six shafts and motes.
  - All transparent objects are in `scene.userData.noDepth`, so they stay out of AO and DOF.
- **Stone.** Three Poly Haven sets go through one world-triplanar shader (`stone()`):

  | Set | Used on |
  |---|---|
  | `sandstone_blocks_08` | facade and paving |
  | `worn_rock_natural_01` | carving and rubble |
  | `old_sandstone_02` | blocks, podium and sledge loads |

  - **Breaking the tiling:** a second rotated sample at 0.43 scale is blended by fbm.
  - **Colour:** a macro tint between two desaturated sandstone tones, and a darker band at the base of every wall (AO-like).
  - **Sand:** wind drift up the wall bases, sand in the joints (from the ARM AO channel, on upward faces only) and 18% dust on top faces.
  - **Paving:** soft fbm sand cover over the paving (`cover`).
- **Paving.**
  - A physical material with `specularIntensity 0.15` and env 0.22. With standard F0 the wide flat stone sheened grey or white at grazing angles, which was the "water" look.
  - The kit's screen RectAreaLight dropped from 5.5 to 1.6 for the same reason.
- **The monument screen.** A 14.4 x 6.0 m panel (2.4:1), 18.2 robot-heights wide, in a battered 20 x 11 m facade. It has:
  - a carved frame with gold and lapis inlay;
  - a winged disk;
  - a cavetto cornice;
  - relief pilasters.
- **On and off states.**
  - On (b–d): `app.png` cropped to 2.4:1 at emissive 1.55.
  - Off (a): metallic dark glass that mirrors the sky.
- **Screen masks.** The private workspace list, the session list and the session-name field are covered by solid #0F1013 rectangles. They are drawn into a canvas copy of the texture, in `SCREEN_MASKS` (app.png pixels).
- **Screen handles.**
  - `handles.setScreenSource(videoOrCanvas)` swaps in any video or canvas: it builds a `VideoTexture` or `CanvasTexture` with the same 2.4:1 crop.
  - `handles.screenMasks` lists the rectangles.
- **Crews.** Three single-colour crews of five:

  | Crew | Colour |
  |---|---|
  | Antigravity | cyan #1FB2F2 |
  | Cursor | violet #B67BFF |
  | the third crew | green #10A37F |

  - `tintRobot` sets the glow ring, the sole and the screen tint.
  - Every robot and sledge is placed by a raycast onto the ramp surface, so no feet float.
  - Each robot keeps its kit blob contact shadow.
  - Followers are staggered: a 0.5 m z-offset and alternating lateral spacing of 0.72 and 0.84 m.
  - The sleepers sit on the ramp at +0.07 m (the review saw them floating at +0.29).
- **Visitors.**
  - Each sits in the workspace `mid_century_lounge_chair` at the workspace scale (`h 0.737`).
  - The chair's yaw is `atan2(dx, dz)` toward its target. The robot sits at the seat height and faces along the chair's forward.
  - Both are seated in a, b and c.
  - **Turned heads:** in b and c each head turns ±0.35–0.5 rad toward the other.
  - **Rim light:** a cool spot (#B4CCFF, 28) rims their backs.
  - **Contact:** the kit's square contact decals under the chairs read as holes and were removed. The chairs now ground through the sun shadow and the dust puffs.

## Layout

World units are metres. The robot is 0.79 m tall. The site faces +Z, and the screen glass is at z −29.86.

| Still | Camera | Target | Lens | Measured (from `info`) |
|---|---|---|---|---|
| a arrival | (3.4, 0.82, −10.2) | (−4.6, 1.75, −17.6) | 28 mm | screen area 0.133 (off, sky-mirroring); Claude face at y 0.63, Codex at 0.62 |
| b wide | (1.0, 1.1, −9.8) | (1.4, 4.75, −30) | 28 mm | screen fill 0.565; visitor backs at y 0.81; Ptah head and shoulders in frame, top at y 0.22, against sky |
| c push-in | (0.45, 0.8, −12.9) | (0.1, 4.0, −30) | 35 mm | screen fill 0.83, y 0.13–0.72; visitor backs at y 0.82 |
| d crew close | leader + dir·3.0 + side·2.7, y leader + 1.75 | lerp(leader, sledge, 0.55) | 35 mm | Cursor crew faces at y 0.40–0.57; block and sledge in frame |

**Visitor chairs:**

| Still | Claude | Codex |
|---|---|---|
| a | (0.15, −13.9) | (−1.55, −13.15) |
| b | (−0.2, −16.8) | (2.1, −17.2) |
| c | (−0.75, −21.3) | (1.65, −21.6) |

**Ptah proxy.** A neutral grey (#8C8C8C) stand-in at the true size, used by request because the colossus branch is not merged:
- **Size:** 24.05 m tall and about 5 m wide, on an 8 x 2.6 m plinth.
- **Position:** (29.0, ground − 0.35, −66.0), to the right of the facade and 36 m behind it.
- **Facing:** it faces the forecourt (0, −14), at yaw about −0.51 rad, so it looks over the site toward the visitors.
- **Handle:** `handles.ptahAnchor` gives `{ position, yaw, facing, height, scale, note }` for the real model to drop into.
- **Why 36 m back:** I moved it from (24.5, −53.1) so that in b the whole head clears the top edge with sky behind.

## Assets

Every asset is CC0 from Poly Haven, listed in `assets/media.manifest.json` (204 items), and fetched into git-ignored folders by `tools/media/fetch-media.mjs`.

This pass adds:
- `sandstone_blocks_08`, `worn_rock_natural_01` and `old_sandstone_02` (diff, nor_gl and ARM, at 1k);
- the `mpumalanga_veld_puresky` 2k HDRI.

These come from earlier work: `sand_01`, the chair, the pyramids, the palms, the boulders and the robot rig.

## Render cost

From `node lookdev/shoot4.mjs desert4-b --post=preview --time=10` on this laptop, at 1920x1080 in headless Chrome:
- **47.2 ms per frame**, the mean of 10 frames, with a sync after each.
- The first load is 35–40 s per shot (texture and PMREM upload). A cached shot loads in about 8 s.

## Scorecard

Rows: Composition, Light, Materials, Characters, Atmosphere, Safe band. Each row is scored at 16:9, then checked at a centred 4:5 crop (864x1080). A known defect is a fail.

| Frame | Comp | Light | Mat | Char | Atmo | Safe | 16:9 | 4:5 | Path |
|---|---|---|---|---|---|---|---|---|---|
| a arrival | 4 | 4 | 4 | 4 | 4 | 4 | pass | pass: both visitors and the off screen stay in | `snapshots/lookdev/desert4-a.png` |
| b wide | 4 | 4 | 4 | 4 | 4 | 4 | pass | **fail**: the crop drops the Ptah proxy and Claude | `snapshots/lookdev/desert4-b.png` |
| c push-in | 4 | 4 | 4 | 4 | 4 | 4 | pass | pass: screen centred, both backs in | `snapshots/lookdev/desert4-c.png` |
| d crew close | 4 | 4 | 4 | 4 | 4 | 4 | pass | **fail**: the crop cuts the leader at the left edge | `snapshots/lookdev/desert4-d.png` |

The sheet is `snapshots/lookdev/desert4-sheet.jpg`: 1920x1080, 2x2, 960x540 cells, labelled.

## Look-dev match

These are the look-dev stills themselves. No animated frames exist yet, so the stills are the reference for animation.

| Scene | Approved still | Frame at same time |
|---|---|---|
| desert a–d | `snapshots/lookdev/desert4-{a,b,c,d}.png` | none yet (look-dev only) |

## Verification

- I viewed all four stills downscaled, as a 2x2 grid at 800 px and as 4:5 crops at 400 px.
- From the repo root:
  - `node tools/guards/no-media.mjs` passes.
  - `node tools/media/fetch-media.mjs demos/agent-pronounce --check` passes.
- The render had no shader or console errors. The only 404s are favicon and cues.json, which the harness requests and the look does not use.
- The scene is deterministic: no `Math.random`, `Date`, `performance.now` or timers in scene code. All variation is from `hash` or noise.

## Decisions

- **Sky:** I used mpumalanga over qwantani_dusk_2: it gives a deeper blue overhead at a comparable warm horizon.
- **Paving:** a damped-F0 physical material instead of retexturing. The albedo was fine; the grazing specular was the problem.
- **Ptah:** I moved the proxy back instead of shrinking it, to keep it true size.
- **Visitor depth:** I placed the visitors 7–8.5 m from the camera in b and c so the full chair and robot sit in frame. The backs, ear rings and turned heads read, and the frames are no longer cropped at the bottom edge.
- **Seating:** both visitors face the screen in b and c and the camera in a, all seated.

## Open defects

- **b at 4:5:** the Ptah proxy and Claude fall outside a centred crop. Fix plan: a 4:5 variant camera, shifted right by about 1.2 m and with a 24 mm-equivalent framing, or reframing at the edit with an offset crop that keeps Ptah and the screen.
- **d at 4:5:** the leader is cut at the left. Fix plan: a 4:5 variant with the d camera side offset reduced from 2.7 to 1.8.
- **The Ptah proxy is a primitive stand-in** (by request). The real colossus replaces it at `handles.ptahAnchor`. In sun it reads near-white, so the colossus needs its own albedo.
- **d's screen band:** the top of d shows the dark lower part of the screen UI. It is acceptable as a backdrop, but a brighter source through `setScreenSource` would help.

## What the kit should add

- A `specular` or F0 option in `environment()`, or a helper for wide flat ground. Grazing sheen on large planes is a recurring trap.
- A soft, round contact-shadow variant. The square decal reads as a hole under chairs on bright ground.
- Background rotation alongside environment rotation.

## Credits

All are CC0, from Poly Haven:

| Asset | Author | Source |
|---|---|---|
| sandstone_blocks_08 | Rob Tuytel | https://polyhaven.com/a/sandstone_blocks_08 |
| worn_rock_natural_01 | Rob Tuytel, Dimitrios Savva | https://polyhaven.com/a/worn_rock_natural_01 |
| old_sandstone_02 | Dimitrios Savva | https://polyhaven.com/a/old_sandstone_02 |
| mpumalanga_veld_puresky | Greg Zaal, Jarod Guest | https://polyhaven.com/a/mpumalanga_veld_puresky |
| qwantani_dusk_2_puresky (earlier sky, still listed) | Poly Haven | https://polyhaven.com/a/qwantani_dusk_2_puresky |

Earlier assets are credited in `assets/CREDITS.media.md`.
