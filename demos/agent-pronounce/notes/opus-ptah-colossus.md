# Episode 6: Ptah colossus (hero asset)

## Skills loaded

- **video-quality-bar**: "A lane that has not met this bar has not finished, whatever its exit code." From its scorecard reference: "A frame passes only if every row is 4 or higher."
- **threejs-scene-craft**: "Everything is a pure function of the seek time `t`."
- **free-media-sourcing**: "The manifest is the only way in."

## Approach

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

## Module API

`src/ptah-colossus.js`

```js
const c = await createPtahColossus(assets, { height = 24.05, quality = 'high' | 'draft', eyeColor = '#5FF2E0', drift = true });
// c.group    THREE.Group; origin is the plinth base centre; y up; the statue faces +Z; frame right is +X (the statue's left)
// c.height   world units (metres), soles to the top of the cap, after `height` scaling
// c.handles  { head (pivot Group, neck), eyes [Mesh, Mesh], eyeMaterial, eyeFlares [Sprite, Sprite],
//              sceptre (Group), sceptreArm (pivot Group at the grip), chestGlow (shared uniform {value}),
//              plinth (Mesh), bounds (Box3, world), anchors { eyes, mouth, grip, plinthTop: Vector3 } }
// c.setState({ eyeGlow, headYaw, headPitch, sceptreTilt, voice })   pure setters with no time dependence
// c.getState(), c.materials { stone, fine, granite, eye }, c.triangles
createRubble(colossus, seed, size)   // seeded fallen fragment that uses the colossus stone material
```

| state key | unit | range | effect |
|---|---|---|---|
| `eyeGlow` | 0..1 | 0..1 | eye emissive `eg·(2.4+2.2v)`, flare opacity, faint inlay glow |
| `headYaw` | radians | about ±0.35 | head pivot rotation.y (positive turns toward +X) |
| `headPitch` | radians | about ±0.2 | head pivot rotation.x |
| `sceptreTilt` | radians | about ±0.3 | sceptre arm rotation.z = −tilt, plus a 0.12·\|tilt\| lean |
| `voice` | 0..1 | 0..1 | inlay pulse `0.4v(0.4+0.6eg)`, mouth-seam glow `1.6·v·eg`, dust from fixed seeded sources (more grains appear as voice rises) |

The module creates no lights and reads no time. Every random value comes from `hash` with a fixed seed.

## Dimensions, triangle count, textures

**Dimensions**
- Height: 24.05 m from the plinth base to the top of the cap.
  - The figure stands 21.05 m on the plinth top (y 3.0).
  - That is about 30 robot heights (the robot is 0.79 m).
- Plinth: about 8.6 × 7.6 × 2.7 m, with a pedestal on top.
- Head pivot: y 21.0. Eyes: y 22.74. Grip: y 17.2.

**Triangle count**
- High quality: 415,770.
- Draft: about 196k.
- Geometry is built once and cached per quality.
- Meshing the high-quality build takes about 6–8 s in headless Chrome (swiftshader).

**Textures**

| texture | size | use |
|---|---|---|
| `worn_rock_natural_01` diff, nor_gl, rough, ao, disp | 2048² each | triplanar stone |
| `aerial_sand` nor_gl, rough | 1024² | sand drift |
| canvas radial textures | 64² / 128² | eye emissive map, eye flare, dust sprite |

## Assets

| id | URL | author | licence |
|---|---|---|---|
| worn_rock_natural_01 (diff/nor_gl/rough/ao/disp, 2k) | https://polyhaven.com/a/worn_rock_natural_01 (files under `dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/worn_rock_natural_01/`) | Rob Tuytel, Dimitrios Savva | CC0-1.0 |
| aerial_sand (reused) | already in the manifest | Poly Haven | CC0-1.0 |
| qwantani_late_afternoon_puresky_2k.hdr (reused, look file only) | already in the manifest | Poly Haven | CC0-1.0 |
| desert/pyramid.glb, cute_robot (reused, look file only) | already in the manifest | see CREDITS.media.md | see manifest |

All files are fetched through `assets/media.manifest.json` into git-ignored folders. None is committed.

## Scorecard

The stills are 1920×1080 in `snapshots/lookdev/`, and the contact sheet is `colossus-sheet.jpg` (3 cells, 960×540 each).

| row | colossus-a (full, eyes dark) | colossus-b (head, glow, voice 1) | colossus-c (¾ waist-up, tilt) |
|---|---|---|---|
| Subject | 4: clean silhouette, beard, collar, sceptre and plinth all read | 4: sculpted face, ears, beard and collar hold at this size | **3**: the far eye flare spills past the face profile, and the was head reads as a raised finger |
| Set dressing | 4: pyramids in haze, rubble, sand drift, robot for scale | 4 | 4 |
| Light | 4: low warm key, cool rim, AO | 4 | 4 |
| Effect | 4: eyes dark, faint inlay | 4: eye glow, mouth seam, fine dust (a few clumps) | 4 |
| Text and safe area | 5: no text; subject sits in the safe area | 5 | 5 |
| Continuity | 4: same statue and state API across the three | 4 | 4 |

Colossus-c fails one row (Subject 3). See Open defects.

## Verification

Run from `demos/agent-pronounce` unless noted.

| command | exit | notes |
|---|---|---|
| `node --check` on the 4 new JS files | 0 | |
| `node lookdev/shoot-colossus.mjs colossus-a colossus-b colossus-c head-34` | 0 | about 13–17 s per shot; 415,770 triangles |
| `ffmpeg ... hstack` → `snapshots/lookdev/colossus-sheet.jpg` | 0 | 2880×540 |
| `node tools/guards/no-media.mjs` (repo root) | 0 | "checked 443 files; no violations" |
| `node tools/media/fetch-media.mjs demos/agent-pronounce --check` (repo root) | 0 | 31/31 ok |

**Page and console errors.** There were no page errors and no console errors other than these. The only 4xx responses were `404 assets/audio/cues.json` (audio is out of scope for the look gate) and `404 favicon.ico`. The shooter ignores both explicitly, and their matching "Failed to load resource" console lines.

## Decisions

- **Meshing approach.** I mesh SDFs in code rather than ship a GLB. No suitable CC0 Ptah exists. This approach also keeps the statue procedural, rig-ready and media-free in the repository.
- **Per-part resolution.** Detail goes to the head and sceptre, which keeps the full figure near 416k triangles.
- **Layout.** Head and sceptre sit on separate pivot groups so `setState` is pure transforms and uniforms.
- **Voice effect.** Voice drives light (inlay and mouth seam) and seeded dust only. There is no moving mouth, and no squash or stretch.
- **Dust behaviour.** Dust uses fixed positions with a per-grain threshold on `voice`, so a value of voice always gives the same frame.
- **Set dressing.** I dropped the step pyramid because it read as Mesoamerican, and use the three-sided pyramid model only.
- **Colossus-c head turn.** Its head turns toward the camera (`headYaw −0.14`) so the face is not lost in profile.

## Open defects

1. **colossus-c, eye flare.** In the three-quarter view the far eye's flare sprite draws past the cheek profile. A fix is to scale the flare by how much the eye faces the camera, or to depth-test it against the head.
2. **Was-sceptre head.** At the top of the sceptre it reads as a raised finger or thumb in B and C. It needs a longer snout, ears that are clearly forked, and a forward tilt.
3. **Collar gold edges.** The gold rows have slightly torn, irregular edges at 5.5 cm mesh resolution. The pigment rows look patchy rather than clearly beaded.
4. **Djed.** The discs still read partly as stacked rings.
5. **Head in close-up.** It holds up to roughly a head-and-shoulders framing (B):
   - brow, lids, nose, lips, ears and beard are all sculpted;
   - in the head-34 check, the lids are soft and the eye inlay is a flat almond with no visible iris;
   - a framing tighter than the face would show the 2.4 cm meshing.
6. **Dust.** It still clumps a little around the face at voice 1.
