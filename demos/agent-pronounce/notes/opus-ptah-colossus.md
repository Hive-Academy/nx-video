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

## Verification

Run from `demos/agent-pronounce` unless noted.

| command | exit | notes |
|---|---|---|
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

1. **Face is stylised, not carved.** The face holds at the colossus-d distance, but the mouth is still two lip ellipsoids with a straight groove and no philtrum. The round-2 fix plan for the mouth (one mouth mass with a carved vermilion border) is not done.
2. **Inlay lines render dark.** The brow and cosmetic-line inlay read as dark carved grooves, not gold, under the low key light. Fix: raise the gold roughness on the head inlay to about 0.45 and lift its albedo.
3. **Sceptre head over the beard.** In the three-quarter in-set view (colossus-c-set) the was head of the sceptre sits in front of the beard. Fix: move the grip 0.4 m forward, or tilt the sceptre in the presenting shots.
4. **Backlit in-set shot.** Shot d of `colossus4.js` (backlit against the sun) washes out to haze (`colossus-d-wip.png`). The camera needs to sit lower and further off-axis from the sun. It is not a deliverable.
5. **Collar inner row, and inside faces.** These are unchanged from round 2: the inner gold row stretches at the neck front, and the collar's cut faces sit hidden inside the torso.
6. **Scale robot.** In colossus-a the robot at the plinth is only a few pixels tall at 24 m statue height. The scale reads from the plinth and the dunes more than from the robot.
