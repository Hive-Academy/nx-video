# Episode 6: Ptah colossus (hero asset)

## Skills loaded

- **video-quality-bar** (`C:/Users/abdal/.claude/skills/video-quality-bar/SKILL.md`): "A lane that has not met this bar has not finished, whatever its exit code."
- **threejs-scene-craft** (`C:/Users/abdal/.claude/skills/threejs-scene-craft/SKILL.md`): "Everything is a pure function of the seek time `t`."
- **free-media-sourcing** (`C:/Users/abdal/.claude/skills/free-media-sourcing/SKILL.md`): "The manifest is the only way in."

## Approach (round 1 base)

The statue is not built from primitives. It is sculpted as signed distance fields and meshed in code.

- **Sculpting.** SDF parts use smooth min and max, ellipsoids, tapered capsules, a lofted superellipse body and seeded chips.
- **Meshing.** My own coarse-to-fine surface-nets mesher (`polygonize`) builds the geometry when the module loads. It projects vertices onto the surface twice with Newton steps and takes normals from the gradient.
- **Part resolutions.** Each part is meshed at its own cell size:
  - head 2.4 cm
  - sceptre 3 cm
  - upper body 5.5 cm
  - lower body 10 cm
  - plinth 9.5 cm
- **Painted fields.** Each vertex carries three painted fields (sand, gold-inlay SDF, mouth-seam SDF) and a pigment tint.
- **Stone shader.** One shader (`MeshStandardMaterial` with `onBeforeCompile`) samples the Poly Haven `worn_rock_natural_01` PBR set triplanar in object space. It adds:
  - sand settling on up-facing surfaces;
  - gold inlay with crisp anti-aliased edges, worn by the height map;
  - two emissive terms (inlay glow and mouth seam) driven by `setState`.
- **Head sculpt.** The head is sculpted for a close-up:
  - a cap that leaves the ears free;
  - brow band, sockets, upper and lower lids;
  - nose bridge, tip, nostril wings and nostrils;
  - full lips with a carved mouth line and corners;
  - chin, cheekbones, ears with a concha;
  - a plaited straight beard;
  - gold cosmetic lines and brows.
- **Collar.** A broad collar with eight rows: gold, lapis, carnelian and turquoise.
- **Sceptre.** One composite sceptre held in both fists:
  - a was head and neck;
  - a stone djed with four discs;
  - a gold ankh with its loop;
  - a lathe-turned staff with gold rings.
- **Plinth.** Base, torus roll, cavetto, a sloped maat pedestal and a recessed glyph panel.
- **Iteration.** I worked over five look-dev rounds, judging each by eye. These fixes came from them:
  - the whole head was tinted teal;
  - dust drew as bubbles;
  - the djed read as a coil;
  - a step pyramid looked Mesoamerican;
  - the cap covered the ears;
  - the mouth had a jagged carve and a rectangular glow seam;
  - the eyes looked silver;
  - gold spilled onto the neck.

## Round 2 (close-up rework)

The orchestrator accepted colossus-a and rejected b and c (Subject 2). This pass changed the following:

1. **Face.**
   - Each eye is now its own mesh: a carved stone eyeball with a recessed iris bowl and pupil (`eyeGeometry`).
   - The glow is the iris only, through a ring emissive map: `eyeMaterial.emissiveIntensity = eyeGlow·(0.55 + 0.45·voice)`. There are no flare sprites, so `handles.eyeFlares` is now `[]`.
   - The lids are opened to an 8 cm aperture and blended more softly into the brow and the socket.
   - There is no mouth glow; the lips are plain stone.
   - The brow and cosmetic lines are thinner (2.2–2.6 cm) and sit on the brow crest.
   - The dark albedo blotches (the "dirt" cheek patch) are normalised out in the shader.
2. **Neck and shoulders.** The neck taper is stockier (0.86 → 0.76 m). The shoulders are squarer (superellipse exponent 3.6 at 16.8 m). The body top now ends inside the neck, so there is no shelf behind the ears.
3. **Stone.**
   - Larger triplanar texel scale (0.2 / 0.42 / 0.17) and weaker micro normals (0.3–0.5).
   - SDF ambient occlusion baked into the vertices (`polygonize(..., aoR)`), which darkens recesses and drops sand only on up-facing creases.
   - Lower-amplitude fbm.
   - The body has carved wrap bands, an incised inscription column down the front (hashed glyphs, 0.48 m cells) and seven weathering cracks.
4. **Sceptre.** Rebuilt and lowered, so its top is at y 20.1, below the beard (20.35):
   - an extruded flat was head in profile, with an angled snout and two forked ears;
   - a djed with four crisp flat tiers on a column;
   - a gilded ankh loop and crossbar.
5. **Collar.** A separate 2.4 cm mesh with eight rows of tube beads:
   - V grooves between beads and offset bead joints;
   - solid pigment rows (lapis, carnelian, turquoise) and gilded rows;
   - a row of gold drop beads;
   - three thin (1.5 cm) inlay lines. These lines are the only emissive part of the collar, and they carry the voice.
6. **Dust.** The head sources are removed and the front-chest sources dropped. Dust now comes only from the shoulders, the sides and the plinth.

**CC0 base mesh: none found, so the build stays procedural.** The search found:
- no CC0 Ptah;
- MyMiniFactory "Scan the World" Egyptian statues, whose licence is not CC0 or not stated;
- CGTrader models, which are paid;
- a CC0 Ramesses II on Sketchfab, which is not Ptah and has the wrong iconography (nemes, no skull cap or mummiform).

## Module API

`src/ptah-colossus.js`

```js
const c = await createPtahColossus(assets, { height = 24.05, quality = 'high' | 'draft', eyeColor = '#5FF2E0', drift = true });
// c.group    THREE.Group; origin is the plinth base centre; y up; the statue faces +Z; frame right is +X (the statue's left)
// c.height   world units (metres), soles to the top of the cap, after `height` scaling
// c.handles  { head (pivot Group, neck), eyes [Mesh, Mesh], eyeMaterial, eyeFlares [] (kept for compatibility, now empty),
//              sceptre (Group), sceptreArm (pivot Group at the grip), chestGlow (shared uniform {value}),
//              plinth (Mesh), bounds (Box3, world), anchors { eyes, chest, sceptreTop, plinthTop, plinthFront: Vector3 } }
// c.setState({ eyeGlow, headYaw, headPitch, sceptreTilt, voice })   pure setters with no time dependence
// c.getState(), c.materials { stone, fine, granite, eye }, c.triangles
createRubble(colossus, seed, size)   // seeded fallen fragment that uses the colossus stone material
```

| state key | unit | range | effect |
|---|---|---|---|
| `eyeGlow` | 0..1 | 0..1 | iris emissive `eg·(0.55+0.45v)`, faint inlay glow `0.08·eg` |
| `headYaw` | radians | about ±0.35 | head pivot rotation.y (positive turns toward +X) |
| `headPitch` | radians | about ±0.2 | head pivot rotation.x |
| `sceptreTilt` | radians | about ±0.3 | sceptre arm rotation.z = −tilt, plus a 0.12·\|tilt\| lean |
| `voice` | 0..1 | 0..1 | collar inlay-line glow `1.1·v·(0.35+0.65·eg)`, iris lift, dust from fixed seeded sources on the shoulders, sides and plinth (more grains appear as voice rises) |

Changes since round 1:
- There is no mouth glow. `uVoiceGlow` is kept, but it is always 0.
- `eyeFlares` is empty.
- `anchors.sceptreTop` moved down to `GRIP.y + 2.91`.

The module creates no lights and reads no time. Every random value comes from `hash` with a fixed seed.

## Dimensions, triangle count, textures

**Dimensions**
- Height: 24.05 m from the plinth base to the top of the cap.
  - The figure stands 21.05 m on the plinth top (y 3.0).
  - That is about 30 robot heights.
- Head pivot: y 21.0. Eyes: y 22.74. Grip: y 17.2. Sceptre top: y 20.1.

**Triangle count**

High quality: 827,696 in total.

| part | triangles | cell size |
|---|---|---|
| collar | about 190k | 2.4 cm |
| head | 217k | 1.9 cm |
| upper body | about 121k | 4.5 cm |
| lower body | about 108k | 6 cm |
| plinth | 77k | 8 cm |
| sceptre and fists | 75k | 2.2 cm |
| staff, sand drift, eyes | the rest | |

- Draft is coarser: q = 1.7, so about 0.35× the triangles.
- Meshing in headless Chrome (swiftshader) takes about 15–20 s per quality, and the result is cached.

**Textures:** unchanged from round 1. These are `worn_rock_natural_01` at 2k (diff, nor_gl, rough, ao, disp), `aerial_sand` at 1k, and one 128² canvas ring texture for the iris.

## Assets

| id | URL | author | licence |
|---|---|---|---|
| worn_rock_natural_01 (diff/nor_gl/rough/ao/disp, 2k) | https://polyhaven.com/a/worn_rock_natural_01 | Rob Tuytel, Dimitrios Savva | CC0-1.0 |
| aerial_sand (reused) | already in the manifest | Poly Haven | CC0-1.0 |
| qwantani_late_afternoon_puresky_2k.hdr (reused, look file only) | already in the manifest | Poly Haven | CC0-1.0 |
| desert/pyramid.glb, cute_robot (reused, look file only) | already in the manifest | see CREDITS.media.md | see manifest |

All files are fetched through `assets/media.manifest.json` into git-ignored folders. None is committed.

## Credits

No new assets this round. The credits are the same as the Assets table above; the CC0 entries are in `assets/media.manifest.json` and `assets/CREDITS.media.md`. The statue, the collar, the sceptre, the eyes and the inscriptions are all procedural code.

## Look-dev match

This is a look-dev asset, not an animated scene yet, so there is no animated frame to compare against. All four stills come from `lookdev/colossus.html` with the presets in `src/look-colossus.js`. The cameras for a, b and c are unchanged from round 1; d is new.

| still | camera | state |
|---|---|---|
| `snapshots/lookdev/colossus-a.png` | (−10.5, 1.3, 35) → (0.5, 11.6, 0), fov 44 | eyes dark, voice 0, robot for scale |
| `snapshots/lookdev/colossus-b.png` | (4.2, 21.3, 12) → (0, 22, 0), fov 30 | eyeGlow 1, voice 1, headPitch 0.04 |
| `snapshots/lookdev/colossus-c.png` | (−12, 16.8, 14) → (0.6, 18.9, 0), fov 34 | eyeGlow 1, voice 0.25, sceptreTilt 0.22, headYaw −0.14 |
| `snapshots/lookdev/colossus-d.png` | (1.3, 22.55, 6.0) → (0, 22.55, 0.9), fov 24 | eyeGlow 1, voice 0.5 |

The contact sheet is `snapshots/lookdev/colossus-sheet.jpg`: a 2×2 grid of labelled 960×540 cells. I reviewed it downscaled, and every still at full size.

## Round 3 (body and face fixes)

Changes in `src/ptah-colossus.js`:
- **Shoulders and wrap (round-2 defect 2).** The shoulder keys have a higher superellipse exponent and a flatter top, so the shoulders read square. The horizontal bands are replaced by a tight shroud with diagonal carved strap lines, and the forearms show under the wrap toward the fists.
- **Lids and brow (round-2 defect 1, in part).** The brow band, upper lid and lower lid are thicker and blend into the face with wider smooth-min radii (0.2, 0.08, 0.08 m). The lids sit slightly further from the eye centre, so the eye stays open. The stepped shelf edges are gone at the colossus-d distance.
- **Sand on the face.** The round-2 face had pale sand patches on every up-facing lid and cheek crease. Up close they read as stickers. The face box (z > 0.25, 0.7 < y < 2.15, |x| < 0.85) now starts at a sand value of −0.45, which cancels the ambient-occlusion sand fill there. Sand stays on the cap, ears, beard, shoulders and plinth, because wind scours a face clean.
- **In-set harness.** `lookdev/colossus4.html`, `lookdev/colossus4.js` and `lookdev/shoot-colossus4.mjs` are new. They place the colossus at `handles.ptahAnchor` of the approved desert v4 set (`src/look-desert4.js`) and hide the set's proxy, the same way the integration will. They are a check only; the deliverable stills still come from `lookdev/shoot-colossus.mjs`.

Triangles: 881,164 at high quality (about 53k more than round 2, all on the body).

## Scorecard

These are the round-3 stills from `node lookdev/shoot-colossus.mjs colossus-a colossus-b colossus-c colossus-d`.

| row | colossus-a (wide) | colossus-b (head and collar, voice 1) | colossus-c (¾ waist-up) | colossus-d (face, voice 0.5) |
|---|---|---|---|---|
| Subject | 4: the silhouette, square shoulders, sceptre and inscribed plinth all read | 4: the eyes are open and glowing, the collar is crisp, and the face is clean stone; the mouth is still a plain bar | 4: the shoulders now read square, the diagonal wrap reads as cloth, and the forearms read under the wrap; the was head of the sceptre still crosses the beard | 4: the lids and brow blend with no shelves, the iris reads and no sand patches remain; the carved brow and liner grooves render dark rather than gold |
| Set dressing | 4 | 4 | 4 | 4 |
| Light | 4 | 4 | 4 | 4 |
| Effect | 4: eyes dark | 4 | 4 | 4 |
| Text and safe area | 5 | 5 | 5 | 5 |
| Continuity | 4 | 4 | 4 | 4 |
| **result** | pass | pass | pass | pass |

Every row reaches 4. Subject in d is a narrow 4: at museum close-up range the face is still stylised, not carved. See Open defects.

The contact sheet is `snapshots/lookdev/colossus-sheet.jpg`: a 2×2 grid of labelled 960×540 cells.

## Round 4 (in-set deliverables, cap, neck, face)

The round-3 stills were rejected: they came from the flat pyramid stage, d was a face close-up (banned), the cap read as a grey-purple beanie, the face was cartoon-like, and the neck rose like a tube. **Every round-4 deliverable now comes from the in-set harness** (`lookdev/colossus4.*`, approved desert v4 set). `lookdev/shoot-colossus.mjs` and `src/look-colossus.js` are no longer used for deliverables.

Changes in `src/ptah-colossus.js`:
- **Cap.** The cap is a smooth shell that only exists above the cap line. The cap line runs from 1.05 m at the back to 2.10 m at the brow, with a fine incised line and no brim band. Its paint is a deep, saturated lapis (0.024, 0.075, 0.36). The wear shader keeps saturated paint (`keep` factor), so the cap no longer greys toward lavender. An earlier cap blend (`smin` with the uncarved head) had filled every face carving, including the eye sockets. It is now a `min` with `max(base, capEdge − y)`, so the eyes are open again.
- **Neck and head.** The head pivot is 0.4 m lower (figY 17.6), the neck is shorter and thicker, and a trapezius flare runs into the shoulders. The tube neck is gone.
- **Face.** The painted felt-tip brows are gone. The upper lip has two lobes, the lower lip curves, and the mouth line is carved with a slight curve. There are new lids, and the almond is open to the eyeball. The eye glow is lower (0.22 · voice).
- **Beard.** Finer vertical plaits and a central groove.
- **Hands.** The fists blend a rounded box with an ellipsoid and show finger grooves.
- **Cracks.** Removed, because they read as black scratches.
- **Cell sizes.** The plinth is 0.09, the lower body 0.08 and the upper body 0.055.

Changes in `lookdev/colossus4.js`:
- **Shot a.** A world camera at 84 mm frames the whole god on the plinth beside the lit screen. The robots are about 4% of the frame height.
- **Shot d.** Golden-hour backlight. The key light swings behind the statue, low and amber (`#FF9440`, intensity 9, elevation 0.16). The environment light drops to 0.14 and the hemisphere fill to 0.2 of its value. The camera is low and frontal three-quarter at 40 mm.
- **Debug.** There is a `hide=<mesh>` debug query.

**Triangles:** 867,458 at high quality, down from 925,556 at the start of this round. That is still about 40k above the 827k target.

**Textures.** A sourcing lane fetched two Poly Haven CC0 sets: `sandstone_cracks` (Rob Tuytel) and `dark_rock` (Amal Kumar). They are in the manifest and in `CREDITS.media.md`, and the research is in `notes/stone-textures-sourcing.md`. They are **not wired in yet**: the statue still uses `worn_rock_natural_01`.

### Round-4 scorecard

The commands were `node lookdev/shoot-colossus4.mjs colossus-a colossus-b colossus-c colossus-d`, and the sheet is `snapshots/lookdev/colossus-sheet.jpg`. The bar is "a frame the user would put in a trailer", and I score honestly against it.

| still | Subject | Set | Light | Effect | Text | Continuity | verdict |
|---|---|---|---|---|---|---|---|
| `snapshots/lookdev/colossus-a.png`: low wide in set | 4: the god, plinth, screen and robots all read; the cap reads pale through the haze at this distance | 4 | 4 | 4: eyes dark | 5 | 4 | **pass**: the strongest frame |
| `snapshots/lookdev/colossus-b.png`: waist-up three-quarter, voice 0.5 | 3: the fists read as stacked rings and the face is generic; the cap, collar and beard are good | 4 | 4 | 4 | 5 | 4 | **fail** (hands and face) |
| `snapshots/lookdev/colossus-c.png`: head and shoulders, voice 1 | 3: the cap is now clean lapis and the eyes are open, but the face is still cartoon-like (wide teal "googly" eyes and a smirking mouth) | 4 | 4 | 4 | 5 | 4 | **fail** (face) |
| `snapshots/lookdev/colossus-d.png`: golden-hour backlit | 4: a dark monumental shape against a deep sky with the plinth carvings visible; the rim light is weak (only a faint warm edge) | 4 | 3: the backlight doesn't sculpt the edges enough | 4 | 5 | 4 | **marginal** |

## Scan route (lane-e research)

The research is in `notes/lane-e-statue-scans.md` (main checkout). It recommends the **Ptah-Sokar-Osiris figure W2059**, from the Egypt Centre, Swansea University (Sketchfab glTF, 611k triangles, CC BY 4.0, login needed), as "usable with work". I think the procedural face has reached its ceiling, so I recommend this route. I have **not** switched; this is a proposal. How I would fit it:
1. Fetch it through the manifest as a git-ignored GLB, with a CC-BY credit line in `CREDITS.media.md` and on the end card.
2. Offline, decimate and retopologise the head and torso to about 150–250k triangles. Trim the back pillar and the scan's own base, and bake AO into a vertex channel.
3. Load it in `createPtahColossus` in place of the SDF head and torso. Scale it to `NATIVE_HEIGHT` and seat it on the existing SDF plinth.
4. Replace the wig with the SDF lapis skullcap, intersected against the scan's skull, and keep the SDF beard, collar, eyes, fists and sceptre at the current GRIP.
5. Apply the existing stone shader, with the sand, inlay and paint masks recomputed from height and normal. Keep the API (`group`, `height`, `handles`, `setState`) unchanged.

## Round 5 (museum scan fitting path)

User decision: the figure moves to the museum scan **"Ptah-Sokar-Osiris Figure (W2059)"** by The Egypt Centre, Swansea University (CC BY 4.0, commercial use allowed, credit on the end card). The fitting path is built. **The scan file is not on disk yet**, because the Sketchfab token does not exist yet, so every still below is still the procedural figure. No more procedural sculpting was done.

**`src/ptah-colossus.js`.** The API is unchanged. It adds an `opts.scan` option, which takes the asset path (default `SCAN_URL`) or `false`, and an extra `source: 'scan' | 'procedural'` field on the result.
- **Fallback.** When `scene.gltf` is missing (404), the procedural statue is built exactly as before.
- **Loading.** `fitScan()` loads the glTF as data only. It samples each material's base-colour map into a per-vertex colour (sRGB to linear).
- **Orientation and scale.** It orients the figure (`SCAN_FIT.up`: `'auto'` uses the longest axis; then `yaw`), trims to `soles`..`crown`, scales to **24 m soles to crown**, and centres it on the trunk.
- **Decimation.** Deterministic vertex clustering, with the grid cell sized from the surface area for `targetTris` (260k at high quality, a third at draft).
- **Cutting.** It cuts the scan's own base, the back pillar (`SCAN_FIT.pillar`) and configured boxes (`SCAN_FIT.cuts`, for the wig lappets).
- **Skullcap.** Above the cap line (lower at the brow), the wig is squeezed in toward the head axis on the sides and back, and painted lapis.
- **Ambient occlusion.** Cavity AO comes from the one-ring curvature (smoothed twice), plus ground occlusion at the soles. Up-facing creases get sand.
- **Stone material.** The figure uses the same `stone` material as the procedural body. That means the triplanar CC0 rock detail at colossal scale (5 m tiles), weathering streaks, a sand mask and AO. The scan's own paint is mixed in at `SCAN_FIT.paint` and wears like mineral paint, so 24 m reads as stone rather than an enlarged figurine.
- **Fitted procedural parts.** The figure stands on the procedural plinth (soles at 5.4 m, total native height 29.4 m). The procedural collar is scaled to the scan's measured shoulder width and seated at the measured shoulder height. The procedural fists and sceptre sit at the measured chest front. Eye glow is a soft additive disc on each painted eye, visible only while `voice > 0`. The head pivot is an empty marker, because the scan is one rigid mesh.
- **Tuning.** All fit values are in `SCAN_FIT`: `up`, `yaw`, `soles`, `crown`, `cap`, `pillar`, `cuts`, `eyes`, and the `collar` and `sceptre` nudges. They are measured once the archive is on disk.

**`lookdev/colossus4.js`.**
- **Framing scale.** All shot distances, heights and targets scale with the built height (`k = god.height / 24.08`), so the four framings carry over to the 29.4 m scan statue. The wide holds its camera position and widens its lens by k instead, which keeps the robots at about 3–4% of frame height.
- **Queries.** `scan=0` forces the procedural figure; `scan=<path>` points at another file.
- **Shot d.** The golden key light swings further to the side (side 1.9, elevation 0.2, intensity 12), so the right flank and plinth carry a warm golden-hour edge. This is the R4-3 fix.

**`lookdev/shoot-colossus4.mjs`.** A 404 on `models/sketchfab/` is expected until the fetch, so it is not counted as an error.

**Checks done:**
- `colossus-a` with no scan rendered procedural, 867,458 triangles, no errors.
- `colossus-b` with `scan=assets/third-party/models/ph/dead_quiver_trunk/dead_quiver_trunk_1k.gltf` ran the whole scan path with no errors: load, colour bake, orient, 24 m scale, decimate, cap, AO, and the fitted collar, sceptre and eye glow. That file is a Poly Haven CC0 tree trunk used only as test data, and the render was deleted afterwards. The statue totalled 473,682 triangles, with `source: 'scan'` and height 29.4.

**When the archive lands** (the folder `assets/third-party/models/sketchfab/ptah-sokar-osiris-w2059/`):
1. Render the four shots once with the defaults. Read `up`, `yaw` and `soles` from the result, then set `pillar` and the wig-lappet `cuts`.
2. Fix `cap.line` and `cap.front` on the brow, and set the `eyes` fractions on the painted eyes.
3. Nudge the collar and sceptre.
4. Re-shoot a, b, c and d and score them.

The credit line is `SCAN_CREDIT` in the module. It goes in `CREDITS.media.md` and on the end card when the fetcher's manifest entry lands.

## Round 6 (scan on disk: fitted and shot)

The W2059 scan is now on disk (`assets/third-party/models/sketchfab/ptah-sokar-osiris-w2059/`, git-ignored, fetched through the manifest). Every still below is the **scan** figure (`source: 'scan'`).

Changes in `src/ptah-colossus.js`:
- **Spec-gloss albedo.** Sketchfab exports the scan with `KHR_materials_pbrSpecularGlossiness`, which three no longer parses. The diffuse image is read from the glTF JSON (image data only, resolved next to the `.gltf`) and sampled into vertex colour.
- **Inlaid collar.** The procedural collar mesh could not follow the scan's chest: scaled to fit, it either sank into the body or stood off it. With the scan it is no longer added. The wesekh is instead inlaid into the scan's own surface (fitScan step 8). It is a crescent that hangs from the widest slice (just below the wig lappets) and runs on over the shoulders, fading out there. It has five rows of worn lapis, turquoise and carnelian pigment, separated by thin gold-leaf lines with a gold outer rim. The gold uses the stone shader's existing inlay channel (`aPaint.y < 0`), so it is metallic and catches the sun, and noise wears it through in flecks. The pigment flakes off in seeded patches. Fit knobs: `SCAN_FIT.collar = { top, inner, outer, drop, rows, paint, over }`.
- **Cap.** The lapis is darker (`[0.02, 0.045, 0.17]`), and seeded wear lets the stone show through, so it no longer reads as plastic.
- **Eyes.** `SCAN_FIT.eyes.y` was lowered from 0.932 to 0.875, so the glow discs sit on the carved eyes. The earlier value put them on the brow.
- **Sceptre.** `SCAN_FIT.sceptre = { dy: 0, dz: -0.2 }`. The fists sit just under the collar, and the staff hangs free in front of the tapering legs to the pedestal. A dz of −0.8 buried the fists in the chest bulge.

Numbers: the total is **568,884 triangles** at `quality: 'high'` (scan decimated to the 260k target, plus plinth, sceptre and drift). The native height with the scan is 29.4 m. Load time in the harness is 21–60 s, most of it decimation and AO. For use in the film, cache or pre-bake the fitted geometry.

### Round-6 scorecard

The command was `node lookdev/shoot-colossus4.mjs colossus-a colossus-b colossus-c` (exit 0, no page errors), and the sheet is `snapshots/lookdev/colossus-sheet.jpg`.

| still | Subject | Set | Light | Effect | Text | Continuity | verdict |
|---|---|---|---|---|---|---|---|
| a: low wide in set, eyes dark | 4: a real museum figure at colossal scale, with the collar and sceptre legible from 60 m | 4 | 4 | 4 | 5 | 4 | **pass**. Weakest: the thin maat-pedestal slab reads as a pale gap under the feet from this low angle |
| b: waist-up ¾, voice 0.5 | 4: the scan face, lappets and beard hold; the collar reads as painted inlay; the was–djed–ankh and fists read | 4 | 4 | 4 | 5 | 4 | **pass**. Weakest: the fists are stylised SDF forms on a scan body (two levels of detail meet) |
| c: head and shoulders, voice 1 | 4: a genuinely carved, weathered face; the glow sits on the eyes | 4 | 4 | 4: the glow is small at this framing | 5 | 4 | **narrow pass**. Weakest: the collar bands turn vertical where the crescent rounds the right shoulder, and the cap is a flat colour field |

### Round 6b: emissive eye glow and the ×4 wide check

- **Eye material.** On the scan, `handles.eyeMaterial` is now an additive `MeshStandardMaterial`: black base, `emissive` teal, and a radial `emissiveMap` (a white core fading to teal, then to black). The disc radius is 0.011·H. Before, it was a `MeshBasicMaterial`, so the desert scene's `emissiveIntensity *= 4` did nothing, and it glowed only while `voice > 0`.
- **setState.** With the scan, `eyeMaterial.emissiveIntensity = eyeGlow · (0.6 + 0.4·voice)`. Below `eyeGlow` 0.01 the discs are hidden, so the eyes are fully dark in a. The procedural fallback keeps its iris material at 0.22× the same curve.
- **Wide ×4 check.** `node lookdev/shoot-colossus4.mjs colossus-a --suffix=-glow "--q=glow4=1&state={eyeGlow:1,voice:1}"` (URL-encoded) exited 0. In the 60 m wide, the eyes read as two distinct teal points in the sockets: bright, with no bloom smear onto the brow. **Pass.** The harness `glow4=1` flag multiplies `eyeMaterial.emissiveIntensity` by 4, exactly as the desert scene does.
- **Re-shoot.** `node lookdev/shoot-colossus4.mjs colossus-a colossus-b colossus-c colossus-d` exited 0 with no page errors and 568,884 triangles. The sheet has been rebuilt as a 2×2 of a, b, c and d.

| still | Subject | Set | Light | Effect | Text | Continuity | verdict |
|---|---|---|---|---|---|---|---|
| a: wide, eyes dark | 4 | 4 | 4 | 4 | 5 | 4 | **pass** (unchanged from round 6) |
| b: waist-up, voice 0.5 | 4 | 4 | 4 | 4: the glow now reads at waist-up | 5 | 4 | **pass** |
| c: head, voice 1 | 4: calm carved face; the cap is tight to the skull | 4 | 4 | 4: the eyes glow in the sockets | 5 | 4 | **pass**. Weakest: the vertical collar bands at the right shoulder (defect 2) |
| d: golden backlight | 4: silhouette and collar gold read against the sky | 4 | 4: warm key with rim on the wig edge | 4 | 5 | 4 | **pass**. Weakest: the front of the figure is in shadow, so the face detail is soft |


## Round 7 (orchestrator review of 26f2cb7: framing limit and polish)

**Framing rule.** The source is a small, eroded figurine, so at 24 m the face is soft. The colossus is used only in wide and mid shots, and the tightest is waist-up (b). Shot c (head and shoulders) is retired from the deliverables.

Changes in `src/ptah-colossus.js`:
- **Collar off the lappets and the beard.** The relief mask uses the front-most surface on a 0.006·H grid. For each row, a flat opening (erode, then dilate) over a window of 0.5 shoulder half-widths recovers the chest under the lappets. Cells more than `relief.d` = 0.008·H proud of that chest count as lappet or beard, and so do their x neighbours, provided they also stand off the chest. The collar is never painted there.
- **Collar shape.** The bands no longer run up over the shoulders: `over` is gone, `outer` 1.0 became 0.74, and the paint fades out where `nz` drops below 0.45. The crescent ends tuck under the lappets, and the rows follow the chest curve.
- **Cap.**
  - The lapis is modulated by the scan's own albedo grain (normalised to the mean under the cap) and worn off the carving's crests (`cap.wear` 0.55, driven by cavity). The wig carving shows through the pigment.
  - A carved channel just under the cap edge on the face side (`cap.groove` 0.0035·H) and a tighter paint edge (±0.003·H) give a crisp brow line.
- **Stone detail.** The scan has its own material, `materials.scanStone`, using the CC0 Poly Haven `sandstone_cracks` 2k set (already in the manifest) at triplanar scale 0.11/m with normal 1.1 (`SCAN_FIT.stone`). The soft photogrammetry surface reads as cracked, weathered sandstone at mid distance.
- **Bug fixed.** `aPaint.z = 1` had been swallowed by a trailing comment, so every scan vertex had `aPaint.z = 0`. That put the voice and inlay glow at half strength across the whole figure.
- **Pre-bake.**
  - `loadScan` first fetches `fitted-<quality>-<key>.bin` next to the scan. The folder is `assets/third-party/…`, which is git-ignored. The key hashes the bake version, URL, quality, `SCAN_FIT` and the overrides, so any fit change misses the cache and fits live.
  - On a miss it fits live. `createPtahColossus` then returns `scanBake = { url, hit, serialize() }`, and the look-dev harness PUTs the bytes once. `shoot-colossus4.mjs` accepts PUT only for `/assets/third-party/models/**/fitted-*.bin`.
  - The format is `PTFB`, then version, JSON metadata, and the position, normal, color, aPaint and index arrays: 10.0 MB. Pass `opts.bake: false` to force a live fit.
- **Timing.** Measured page loads: 89 s on a miss and 61 s on a hit, a saving of about 28 s. What remains is the desert set and the software-GL film render, not the statue.

### Round-7 scorecard

The command was `node lookdev/shoot-colossus4.mjs colossus-m colossus-a colossus-b colossus-d`: exit 0, no page errors, 568,884 triangles. m baked; a, b and d hit the cache. The sheet is `snapshots/lookdev/colossus-sheet.jpg` (a, m, b, d).

| still | Subject | Set | Light | Effect | Text | Continuity | verdict |
|---|---|---|---|---|---|---|---|
| a: wide, eyes dark | 4 | 4 | 4 | 4 | 5 | 4 | **pass**. The collar is narrower now but still reads as gold and colour under the lappets |
| m: mid, 35 mm, low desert angle, voice 1 (new) | 4: whole statue, plinth to crown, a monument, not a figurine | 4 | 4 | 4: the eyes read as teal points | 5 | 4 | **pass**. Weakest: the eye glow is small at this distance (by design: the ×4 scene boost was checked in round 6b) |
| b: waist-up (the tightest allowed), voice 0.5 | 4: cracked sandstone, the lapis cap worn into the wig carving, the collar under the lappets | 4 | 4 | 4 | 5 | 4 | **pass**. Weakest: the face is still soft (the framing rule applies) |
| d: golden backlight | 4 | 4 | 4 | 4 | 5 | 4 | **pass** (unchanged) |

## Verification

Run from `demos/agent-pronounce` unless noted.

| command | exit | notes |
|---|---|---|
| `node lookdev/shoot-colossus4.mjs colossus-a --suffix=-fallback` (round 5) | 0 | scan absent, so procedural; 867,458 triangles; no errors |
| `node lookdev/shoot-colossus4.mjs colossus-b --suffix=-standin --q=scan=<CC0 trunk gltf>` (round 5) | 0 | scan path ran end to end; 473,682 triangles; the render was deleted afterwards |
| `node lookdev/shoot-colossus4.mjs colossus-d` (round 5) | 0 | R4-3 rim fix; becomes the new `colossus-d.png` and the sheet is rebuilt |
| `node tools/guards/no-media.mjs` (repo root, round 5) | 0 | "checked 467 files; no violations" |
| `hyperframes check --json` (round 5) | 1 | not caused by this branch: `audio_src_not_found` (VO not generated here), plus three `nested_media_start_basis_ambiguous` findings in `compositions/`, which this branch does not touch |

| command | exit | notes |
|---|---|---|
| `node lookdev/shoot-colossus4.mjs colossus-a colossus-b colossus-c colossus-d` (round 4) | 0 | 867,458 triangles; only the known 404s |
| `node node_modules/hyperframes/dist/cli.js check --json --timeout 120000` (round 4) | 1 | one lint error, which this change did not cause: `audio_src_not_found` for the VO and SFX mp3s, which are not generated in this worktree (the audio scripts are off-limits here) |
| `node tools/guards/no-media.mjs` (repo root, round 4) | 0 | "checked 466 files; no violations" |
| `node tools/media/fetch-media.mjs demos/agent-pronounce --check` (round 4) | 0 | 219/219 ok |
| `node --check src/ptah-colossus.js` | 0 | |
| `node lookdev/shoot-colossus.mjs colossus-a colossus-b colossus-c colossus-d` | 0 | 29–49 s per shot; 881,164 triangles |
| `node lookdev/shoot-colossus4.mjs colossus-c --suffix=-set` | 0 | in-set check, desert v4; loads in 53 s |
| `ffmpeg ... xstack` → `snapshots/lookdev/colossus-sheet.jpg` | 0 | 1920×1080, 2×2 |
| `node tools/guards/no-media.mjs` (repo root) | 0 | "checked 463 files; no violations" |
| `node tools/media/fetch-media.mjs demos/agent-pronounce --check` (repo root) | 0 | 209/209 ok |

**Page and console errors.** There were no page errors. The only 4xx responses were `404 assets/audio/cues.json` and `404 favicon.ico`; the shooter ignores both.

## Decisions

- **Procedural build.** I stayed procedural because no CC0 Ptah exists (see Round 2).
- **Separate meshes for detail.** The collar and the eyes are their own meshes, so detail goes where the close-ups look without re-meshing the whole body finer.
- **Voice effect.** Voice drives light (the iris and the collar inlay lines) and seeded dust only. The mouth never glows and never moves.
- **Sceptre height.** The sceptre is shorter, so its top (y 20.1) sits below the beard in every preset camera. Composite was–djed–ankh staffs vary in height in real statues, so this is acceptable.
- **Collar coverage.** The collar covers only the front and sides (z > −0.45), because the back pillar hides the rest. This halves its triangle count.

## Open defects

Round 7 (current, scan):
0. The face is soft at 24 m because the source is a small, eroded figurine. Never frame it tighter than waist-up.
1. Iconography: W2059 is a Ptah-Sokar-Osiris figure with a tripartite wig, so it is not a pure Ptah. The lapis cap is painted over the wig's crown, but the lappets remain. Hands are not part of the scan; the fists are procedural.
2. ~~The collar bands turn vertical at the right shoulder.~~ Fixed in round 7 (relief mask; outer 0.74).
3. `headYaw` / `headPitch` move only an empty marker on the scan (one rigid mesh); the head does not turn.
4. ~~20–60 s decimation on every page.~~ Fixed in round 7 by the pre-baked `fitted-*.bin` cache. The film render must run the look-dev shooter once, or otherwise put the bake in place, before HyperFrames loads the scene, or the first load fits live.
5. A pale band (the maat-pedestal slab) shows between the feet and the plinth in the low wide shot.
6. The eye glow is a flat additive disc, so at very grazing yaw (beyond about 60°) it shows as an ellipse floating slightly proud of the socket.


Round 4 (current):
- **R4-1. Face is cartoon-like** (colossus-c and colossus-b). The fix plan is the W2059 scan route above. Without it: switch the inlay eyes to calcite white with an obsidian pupil (no teal), narrow the almond, and neutralise the mouth curve.
- **R4-2. Fists read as stacked rings** (colossus-b). Fix: use separate finger lobes over a fist mass and wrap the thumb over the shaft.
- **R4-3. Weak rim light in d.** Fix: add a warm rim light behind the statue, about 2 m above the head, raise the sun elevation to 0.22, and add bloom on the edge.
- **R4-4. Cap reads pale through the haze in the wide shot (a).** Fix: lower the haze density on the statue, or darken the lapis albedo by about 15%.
- **R4-5. Triangles are 867k, above the 827k target.** Fix: set the upper-body cell to 0.06, which should save about 50k.
- **R4-6. New stone textures are not wired in yet.** Fix: use `sandstone_cracks` on the body and `dark_rock` on the plinth.

Round 3 (historical; items 1, 4 and 6 are superseded by round 4):

1. **Face is stylised, not carved.** The face holds at the colossus-d distance, but the mouth is still two lip ellipsoids with a straight groove and no philtrum. The round-2 fix plan for the mouth (one mouth mass with a carved vermilion border) is not done.
2. **Inlay lines render dark.** The brow and cosmetic-line inlay read as dark carved grooves, not gold, under the low key light. Fix: raise the gold roughness on the head inlay to about 0.45 and lift its albedo.
3. **Sceptre head over the beard.** In the three-quarter in-set view (colossus-c-set) the was head of the sceptre sits in front of the beard. Fix: move the grip 0.4 m forward, or tilt the sceptre in the presenting shots.
4. **Backlit in-set shot.** Shot d of `colossus4.js` (backlit against the sun) washes out to haze (`colossus-d-wip.png`). The camera needs to sit lower and further off-axis from the sun. It is not a deliverable.
5. **Collar inner row, and inside faces.** These are unchanged from round 2: the inner gold row stretches at the neck front, and the collar's cut faces sit hidden inside the torso.
6. **Scale robot.** In colossus-a the robot at the plinth is only a few pixels tall at 24 m statue height. The scale reads from the plinth and the dunes more than from the robot.
