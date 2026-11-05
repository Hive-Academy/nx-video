# Scene 3D report: The Tribunal

The 3D layer is rebuilt as a physical set in Ptah's temple, with world-space cameras and deterministic physics. Every frame is a pure function of the HyperFrames seek time. The compositions still call `window.TribunalReady.then(api => api.mount(config, canvas))`. They need no changes.

## Module layout

| File | Role |
| --- | --- |
| `src/scene.js` | Entry point that `index.html` loads. It holds one shared WebGL renderer for every scene. It mounts `table` / `chaos` / `verdict` / `booth` / `punch`. It runs the `hf-seek` listener and draws only while the seek time falls inside the scene. It copies the frame into the composition's own `<canvas>` with a 2D blit. A depth-of-field chain (EffectComposer, a BokehPass subclass and OutputPass) renders the over-the-shoulder shots. Shader warm-up runs inside `buildReady`. |
| `src/assets.js` | Loads the GLB, `assets/audio/cues.json`, the sign font (three's bundled helvetiker), `assets/icons/<id>.png`, the temple painting `assets/backgrounds/temple-bg.webp` and the Ptah emblem (`assets/brand/ptah-emblem.webp`, `ptah-emblem-gold.png`) once per page. A missing image resolves to `null` and never rejects. Agent colours (with OpenCode's black-and-white overrides) and the seat order live here. |
| `src/robot.js` | Builds the robot rig from `cute_robot.glb`. Materials: neutral shell, agent colour on GLOW, SCREEN and EYES. Adds the chest badge and the contact-shadow decal. `apply(pose)` sets one sampled pose. |
| `src/set-table.js` | The table set, built in metres: stone dais, table, stools, stone-and-gold judge bench and riser, brass nameplates and props. Also `seatOf()` and `onTable()`. |
| `src/temple.js` | The temple of Ptah around the set: the painting on a far curved panel, dark hieroglyph walls, stone pillars, a polished stone-tile floor, two bronze braziers with flickering flames, the gold-on-stone TRIBUNAL architrave and a skylight shaft. |
| `src/set-booth.js` | The booth and punch set: pleated cushioned wall in the agent colour at 85 % saturation (OpenCode: charcoal #1C1C1C with a white raking light), padded stool, one robot, and Codex's mug in its booths. |
| `src/lighting.js` | Temple lighting: gold key #FFC98A (PCF-soft shadow map), a faint steep cool rim #7FD3FF, a warm hemisphere, a skylight spot on the dais, and the additive light-cone shader (opacity capped at 0.08, fades near the lens). Booth lighting. |
| `src/camera.js` | World-space framing solvers (`frameSphere`, `fovToFill`, `aimAt`, the occlusion-aware `ots`). Also the per-row shot list `TABLE_SHOTS`, booth and punch shots, shot sampling, seeded handheld noise and impact shake. |
| `src/physics.js` | Fixed-step (1/120 s) simulation into Float32Arrays, and sampling. Covers robots, rigid props, spring ("telekinetic") props and the table-top spring. |
| `src/acting.js` | Turns script rows into physics events: talking, listening habits, row-specific beats, chaos, the unison turn, booth habits and the punch lunge. It also runs a pre-roll so each scene starts where the previous one ended. |
| `src/textures.js` | Canvas textures: badge, nameplate, paper, laptop screen, objection paddle, contact shadow, walnut grain. |
| `src/util.js` | Clamp, GSAP-equivalent eases, seeded hash, value noise, spring coefficients, envelope sampling and keyed holds. |

The modules are plain ES modules. Relative imports resolve from `src/scene.js`, which `index.html` loads through the existing import map (`three`, `three/addons/`). Asset URLs resolve from `import.meta.url`, so the layer works whichever page loads it.

**Why one shared renderer:** the timeline now has 19 scene compositions, 17 of them 3D. Chrome drops WebGL contexts beyond 16. One context renders every scene offscreen, and each composition canvas receives a `drawImage` copy. Only the scene whose window contains the seek time draws (±2 frames).

## Measured bounding boxes and set dimensions

Robot model (`cute_robot.glb`, faces +X, Y up), measured with `Box3` in model units:

| Node | What it is | Bounds (model units) |
| --- | --- | --- |
| `Cylinder_0` (BODY / GLOW / SCREEN) | the ball: shell, one ear ring with an antenna on the robot's right, screen face | y 0.374–2.086, x −0.856–0.639, z −0.856–0.893; sphere centre (0, 1.23, 0), r 0.856; screen plane x = 0.47, y 0.70–1.76 |
| `Cube002_1` (BODY / Material.001) | two dome **feet** with glowing soles (not a head) | y 0.000–0.154, x −0.435–0.496, z −0.52–0.485 |
| `Plane_2`, `Plane001_3` (EYES) | eye planes, one blink morph each | y 0.942–1.527 at x 0.473 |
| whole model | | 1.495 × 2.089 × 1.749 |

The GLB's own `Animation` clip only drives the eye blink morph, so it is not used. Blinks are seeded.

Set, in metres (Y up; the cameras sit on the +Z side):

| Element | Placement |
| --- | --- |
| Robot scale | 0.38 (ball 0.65 m), Conductor 0.42 |
| Round stone dais | r 3.1 m, 0.04 m high, gold lip |
| Table | walnut, r 1.05, top 0.78, brass edge band, pedestal |
| Stools | 5 at r 1.45 on the far 200° (Claude −100°, Cursor −50°, Antigravity 0°, Codex +50°, OpenCode +100°), top 0.56 |
| Robots on stools (measured world `Box3`) | feet min y = 0.559 (stool top 0.56). The nearest point of any panel robot's box to the table axis is 1.098 m, outside the table radius of 1.05. The ball surface clears the table edge by 0.075 m. Example: Claude x −1.805…−1.098, z −0.111…0.642 |
| Judge bench | z −2.75, 1.6 × 1.15 × 0.6, dark stone with gold-framed panels, brass rail, 0.8 m nameplate (CONDUCTOR, type fitted to the plate) with the Ptah emblem. Conductor riser top 1.00; Conductor box y 0.999–1.876. The painted throne stands on the same centre line behind it |
| Temple painting | `temple-bg.webp` on a curved panel, r 20 m, 100° (35 m wide, 35 m tall). Painted floor line (row 735) sits at y 0, so the painted floor is hidden under the real floor and the throne rises straight behind the bench. Haze covers about 30 % of it |
| Walls | dark engraved hieroglyph walls close the other 260° (r 20.05) |
| Pillars | two at x ±3.3, z −5.6 carry the TRIBUNAL architrave (gold letters on stone, y 4.35); seven more around the hall at r 8.5 for side parallax |
| Braziers | bronze bowls on legs at (−3.4, −3.2) and (3.5, −2.9), flame cards flickered by seeded noise of time, warm point lights |
| Skylight | additive shaft from y 9.5 onto the dais (opacity 0.06) plus a warm spot |
| Floor | polished dark stone tiles (0.8 m), clearcoat, faint gold veins |
| Fog | FogExp2 #1C140C, density 0.03 |
| Booth | robot on a stool (top 0.5) 1.35 m in front of the pleated wall (period 0.16 m, depth 3.5 cm) |

## Shot list per row

Camera numbers are stations on the set. Every framing is solved in 3D. Each single places the camera along a direction from the subject and solves the distance so the ball projects to the given fraction of frame height. The view then rotates until the subject lands at the chosen NDC point, checked by projecting with a real `PerspectiveCamera`. Pushes take 12 frames with `power2.inOut`, then a slow sine drift of 0.1 m or less. Consecutive shots never share an angle.

| Row | Cam | Shot |
| --- | --- | --- |
| 3 | C1 crane | establishing crane-down: from (0.4, 5.2, 5.4) level with the TRIBUNAL architrave, descending past it to a wide at (0.15, 1.75, 4.9) over 2.6 s, `power2.inOut` |
| 3 | C2 bench front | at 3.0 s: push onto the Conductor (az 22°, el 6°, ball 44 % of frame height). The gavel strike adds an impact shake |
| 4 | C3 Claude 3/4 | single, az −30° to the open side, 48 %. The paper stack drops into frame |
| 5 | C4 OTS Claude>Cursor | camera beside Claude's head at eye level; Claude is a soft sliver on the left edge (11–17 % of frame); Cursor faces the lens, leans in, and fills about 50 % of frame height |
| 6 | C5 OTS Cursor>Claude | reverse: Cursor a soft sliver on the left edge (about 16 %); Claude faces the lens from the first frame, squinting, ball about 50 % of frame height |
| 8 | C6 Antigravity push | single az −18°; the laptop floats up and turns its "3D" browser to us |
| 9 | C7 OpenCode objection | single az +30°; paddle up with overshoot and shake |
| 10 | C8 Antigravity straight-on | clean single (50 %). Codex sits on every OpenCode→Antigravity eyeline, so no clean over-the-shoulder exists here |
| 12 | C9 Codex push | single az +14° (wider, 44 %) |
| 13 | C10 Claude reverse (Codex's POV) | single from Codex's side of the table; eyes widen |
| 14 | C11 Codex reverse (Claude's POV) | tighter single (56 %); the mug floats up for the sip |
| 17 | C12 centre whips | pivot at the table centre; 6-frame whips Claude → Cursor → Antigravity → OpenCode → Codex → wide (0, 0.5, 1.0, 1.5, 2.0, 2.5 s) |
| 18 | C13 high wide left | 0–0.6 s: the gavel slams and everything jumps |
| 18 | C14 low hero right | low angle (y 1.08) looking up past the bench rail |
| 19 | C15 low hero left | the opposite low angle; the verdict card sits on top |
| 20 | C16 front wide | cut when row 19 ends; all five turn to camera together |
| booths | B1 | camera on the +Z axis at eye height; robot on the left third (NDC x −0.34); eyes at NDC y +0.333 (1/3 from top); ball fills 58 % of frame height. Seeded handheld: 0.6° roll, about 8 px translation, 0.25° pan, about 2 Hz |
| punch | P1 | robot at NDC x −0.36; fov 34° snaps to 28° over 4 frames (`expo.out`) at the lunge; the aim tracks the head; impact shake. The right 40 % stays clear |

**Over-the-shoulder solver** (rewritten after the full-cut review). It searches camera positions beside the listener's head, at heights from 0 to 0.35 m above eye level, and keeps only those where all of the following hold:

- The speaker's screen faces the lens within 32°. The speaker also turns, up to 1.6 rad, toward the lens beside the listener, starting 0.25 s before the cut.
- The listener covers 3–22 % of the frame, measured by casting a 24 × 14 ray grid against its sphere.
- No third robot nearer than the speaker covers more than 5 %.
- No robot blocks the sightline.

The speaker's fov is solved per candidate, so its ball fills 48–50 % of frame height. The push is a 12-frame lens tighten (fov ×1.06 → ×1), because moving the camera would grow the shoulder. Cursor's lean into Claude now releases 0.4 s before row 6, so Cursor is back on its stool when the reverse starts.

The foreground is softened by the depth-of-field pass. Raw depth is read with basic packing, because the half-float RGBA packing decoded wrongly in r181 and focused in front of the speaker. A sharp band of ±0.35 m sits around the speaker. In front of it, blur is strong and the image is pulled up to 42 % toward the haze colour (lower contrast). Behind it, blur is at 10 % strength.

## Physics model and parameters

`simulate()` runs once per mount at a fixed step of 1/120 s, from a pre-roll start (up to −9 s) to the scene's end. It stores Float32Arrays. `render(t)` only samples them with linear interpolation, and every sample is finite or clamped to 0. There is no `Math.random`, `Date.now`, timer or `mixer.update`. Randomness is a seeded FNV/murmur-style hash.

**Robots** (all springs are semi-implicit damped springs):

| Channel | Model | Parameters |
| --- | --- | --- |
| hop | ballistic, g = 9.8 m/s² (in model units / scale); anticipation squash before take-off; stretch on take-off; landing squash; bounce if impact speed is above 0.9 m/s (restitution 0.18) | heights 5–24 cm |
| squash | spring toward 1 + 0.075 × voice envelope (+ anticipation) | 5 Hz, ζ 0.38, clamp 0.72–1.28 |
| ball over feet (head on a spring) | gap spring; lags down on take-off and landing, floats up in the air | 3.4 Hz, ζ 0.40, clamp −0.17…+0.14 |
| pitch / roll (lean) | springs toward lean targets; landings, collisions and voice onsets kick them | 2.2 Hz, ζ 0.45 |
| nod | spring; impulse of −1.3…−2.7 rad/s at each voice onset (envelope rising through 0.42), sampled 2 frames late | 3.2 Hz, ζ 0.42 |
| body yaw / head yaw | the head leads (±0.7 rad) and the body follows; per-robot seeded reaction delays of 0.1–0.48 s | body 1.5 Hz, ζ 0.5; head 2.6 Hz, ζ 0.45; row-20 unison turn 2.4 Hz, ζ 0.42 |
| lateral jostle (world m) | spring to the seat: loose while airborne, firm when seated; sphere–sphere collisions between neighbours (positional correction plus impulse, restitution 0.55); the hit rocks and pops both robots; a robot that lands off its seat hops back | air 0.3 Hz, ζ 0.2; seated 2.6 Hz, ζ 0.5 |
| lunge (punch) | forward spring: pull back 0.12 s, drive past the mark, recoil to a held 70 % | 4.2 Hz, ζ 0.4 |
| eyes | keyed holds, 8 frames in and 10 out: squint (row 6) 1.12 × 0.42; widen (row 13) 1.35 | |
| blinks | seeded schedule every 2.5–4 s (12 % double blinks), 0.16 s morph | |

**Props:** rigid bodies under gravity with restitution, Coulomb friction and a settle-flat spring (6 Hz, ζ 0.5). Their support function stacks paper on paper, rides the table-top spring, and falls to the riser or floor off the table. A falling support passes its velocity on to whatever rests on it. Flying sheets have air drag, flutter and free tumble, and land on the nearest face. The mug, laptop, paddle and gavel are "telekinetic" spring props (these robots have no arms) with keyed targets and overshoot. Table top: 9 Hz, ζ 0.25.

**Beats:** row 3 gavel (from `cues.json` `gavel-1`): the table jolts, nameplates and paper jump, and the seated robots are bumped with distance delays. Row 4: the stack drops 0.42 m and thuds at `paper-thud`; the top sheets slide; Claude and Cursor are jolted. Row 5: Cursor leans away, then into Claude (0.34 rad plus 0.16 m), and Claude recoils. Row 6: Claude squints. Row 8: the laptop floats up and spins its screen round. Row 9: OpenCode hops, shakes its head and raises the paddle with overshoot and shake. Row 12: Codex hops on "merged". Row 13: Claude's eyes widen. Row 14: the mug floats up and tilts at `mug-sip-14`. Row 17: Claude barges into Cursor, Cursor into Antigravity, Antigravity floats up, OpenCode hops behind its paddle, and Codex barges into OpenCode; the sheets fly off and land on the floor; the Conductor raises the gavel. Row 18: the gavel is already raised and slams at `gavel-2` × 1.35. Row 20: the only unison move. Booths: talking, glances to the lens on alternate phrases, small seated bounces, OpenCode head-shakes, Antigravity looks up at "the sun", Cursor's smug lean, Codex's sip at `mug-sip`. Punch: the lunge peaks at the composition's `localImpact`.

## Snapshots reviewed

**Fix round (full-cut review and the temple changes)**, in `snapshots/fix3d/` (frames at 6.8, 11.6, 12.5, 17, 21, 24, 26, 27, 28, 43, 47.3, 55, 70, 85.5, 90, 95 and 99 s), plus `snapshots/fix3d-r2`, `fix3d-r3` (row 6 start) and `fix3d-emblem` (8.3, 17, 90 s):

| Frame (s) | Verdict |
| --- | --- |
| 6.8 punch OpenCode | Pass. Black screen with white eyes and a black/white badge on the charcoal pleated wall; the pleats catch the white raking light |
| 8.3 punch Conductor | Pass. Gold Ptah emblem on a dark badge face |
| 11.6, 12.5 crane | Pass. Gold-on-stone TRIBUNAL architrave and pillars at top, braziers, polished tiles, and the painted throne hall behind in haze |
| 17 C2 | Pass. **CONDUCTOR** fully on the plate with the emblem; the painted throne is right behind the bench |
| 21 row 4 | Pass. Engraved temple wall behind Claude |
| 24, 26 row 5 | Pass. Cursor fills about half the frame height, facing the lens and leaning in; Claude a soft sliver at the left edge |
| 27, 28 row 6 | Pass. Claude's angry squint faces the lens; Cursor a soft sliver at the left edge (about 25 % at the first frame, while the lens is still tightening; about 16 % after) |
| 43 row 9 | Pass. OpenCode black and white with the paddle |
| 47.3 row 10 | Pass. Clean straight single on Antigravity; the Conductor stands right behind its head |
| 55 booth-opencode | Pass. Charcoal pleats; the robot's shadow on the wall reads dark |
| 70 row 12, 85.5 chaos | Pass |
| 90 hero, 95 verdict | Pass. Full CONDUCTOR plate; the painted throne beside the Conductor |
| 99 row 20 | Pass. All five turned; OpenCode's black screen is now clearly distinct from the Conductor's burnt amber |

`hyperframes check --json` after the fix round: ok true, 0 errors and 0 warnings in lint, runtime, layout, motion and contrast.

**Earlier round (before the temple):**

**Final round** (round 4 of 4): `snapshots/3d/frame-00…35-at-<t>s.png` and `snapshots/3d/contact-sheet-1..4.jpg`. They were made with the pinned CLI (`snapshot --at … --no-end --timeout 30000 --describe false -o snapshots/3d`, hardware GPU). The times come from the current `compositions/*.html` mount configs, after the other agent's intro and punch regeneration (total 104.29 s). Rounds 1–3 used a local puppeteer harness that mounts one scene and seeks it. It lives in the scratchpad, not the repo.

| Frame (s) | Scene / row | Verdict |
| --- | --- | --- |
| 4.45, 5.15, 6.02, 6.82, 7.65, 8.55 | punch P1–P6 | Pass. Each robot is in its booth colour on the left; the lunge has settled after the recoil; the word card sits on the clear right 40 %; badge icons are visible |
| 11.7 | row 3, C1 crane start | Pass. Truss crosses the top of frame; sign, lamps, cones, bench and table all read as one set with depth |
| 14.2 | row 3, crane end (wide) | Pass. Robots on their stools with contact shadows; haze softens the cyclorama |
| 15.9 | row 3, C2 push onto the Conductor | Pass, with a note: the upper-right of the frame is empty |
| 18.39 | row 4, paper stack dropping into Claude's single | Pass |
| 20.69 | row 4 single | Pass. The stack has landed and the top sheets have slid |
| 24.76 | row 5, OTS Claude>Cursor | Pass. Both in frame, Cursor visibly leaning in, Claude's shoulder soft (depth of field) |
| 27.92 | row 6, OTS Cursor>Claude | Pass. Claude squints, Cursor soft in the foreground |
| 33.09 | booth-claude middle | Pass. Left third, full head, eyes about 1/3 from top; the bubble has the right side; the strap sits over the stool only |
| 39.83 | row 8 Antigravity | Pass. The laptop floats with its "3D" browser turned to camera |
| 43.33 | row 9 OpenCode | Pass. Paddle raised clear of the ball; OpenCode faces camera |
| 47.38 | row 10, OTS OpenCode>Antigravity | Pass |
| 53.43, 61.76 | booth-opencode, booth-codex middles | Pass. Codex's mug floats at mid-left, above the strap |
| 67.39 | row 12 Codex push | Pass |
| 72.02 | row 13, Claude reverse | Acceptable. Eyes widened; the paper stack overlaps the lower-left of the screen and Claude is in 3/4 |
| 74.06 | row 14, Codex reverse | Pass. The mug is on the table before the sip; the laptop is cut at the top of frame |
| 76.81, 81.52 | booth-cursor, booth-antigravity | Pass |
| 84.55, 84.9, 85.55, 86.05, 86.55, 87.15 | row 17 chaos | Pass. Sheets fly off at 84.55; Claude barges into Cursor (84.9, two balls in contact); Antigravity floats up (85.55); OpenCode behind its paddle (86.05); Codex mid-barge (86.55); the wide shows sheets on the floor and robots back on their stools (87.15) |
| 87.67 | row 18 gavel wide | Pass. Robots and props popped by the strike |
| 89.15 | row 18 low hero | Pass. Low angle past the bench rail; the screen is fully visible |
| 93.28 | row 19 hero under the verdict card | Pass. The card is the other agent's overlay; the dim shot sits behind it |
| 97.57 | row 20 pause (wide) | Pass. Robots still face the judge |
| 98.87 | row 20 | Pass. All five turned to camera together; colours distinct |
| 100.46 | booth-codex-tag | Pass |

There were no black or NaN frames in any round. Every robot sits on geometry: measured feet min y is 0.559 on stools with tops at 0.56, and the Conductor's is 0.999 on a riser at 1.00. The world-space boxes clear the table radius.

`hyperframes check --json` (final run): **ok: true; lint, runtime, layout, motion and contrast all 0 errors and 0 warnings.** Earlier runs listed three ANGLE "Program Info Log" console warnings. They are gone since `renderer.debug.checkShaderErrors = false`. The check also notes "Runtime did not become render-ready within 3000ms": that is its quick probe while the 17 3D `buildReady` holds finish their build, simulation and shader warm-up, and the check still passes.

**Profile** (harness on an RTX 3070 Laptop GPU through ANGLE/D3D11, forced GPU sync with `getImageData`). Steady-state draw and blit per frame:

| Shot | Time per frame |
| --- | --- |
| Table wide or single | 33–45 ms |
| Chaos | 34–64 ms |
| Booth | 16–47 ms |
| OTS with depth of field (slowest steady frame) | 35–62 ms |

The first OTS frame of a page used to cost about 1.7 s for the depth-of-field shader compile. Mount now pays that inside `buildReady`, so no rendered frame pays it. Mount time per table scene is 0.6–3 s, plus a one-time ~4 s for the first warm-up.

## Remaining issues (ranked)

- **P2 (new): the temple painting is 1024 px.** In close-ups behind the bench it is magnified about 5×. Haze and the depth of field keep it soft rather than pixelated, but the Anubis statues read as painted.
- **P2 (new): row 10 is a straight single.** No clean over-the-shoulder exists (Codex is on the eyeline), and the Conductor's head sits right behind Antigravity's.
- **P2 (new): the first frame of the row 6 reverse has the foreground at about 25 %** while the lens is still tightening. It settles at about 16 %.
- **P2 (new): over-the-shoulder lenses for the adjacent pairs (rows 5 and 6) are wide (fov 55–56°)**, because the camera has to sit at the listener's head to catch the speaker's eyeline.

1. ~~P1: OpenCode and the Conductor read as close colours~~ Fixed. OpenCode is black and white; the Conductor's screen is a darker burnt amber.
2. **P1: the six punch shots share one composition.** Same camera, lunge and timing; only the colour and word change. They read as a series, but varying the angle per agent (low, dutch, top-down) would add punch.
3. **P2: row 13 reverse (72.02 s).** Claude is in 3/4 and the paper stack overlaps the lower-left of its screen.
4. **P2: the booth "chest-up" crop shows the whole ball plus feet on the stool.** The robot has no chest; the ball fills 58 % of the frame height.
5. **P2: faint banding on the white shell in Conductor close-ups,** from the GLB's low-poly normals under environment reflections. Shell `envMapIntensity` is already lowered to 0.3.
6. **P2: row 17 knock-offs.** A robot knocked off its seat lands at stool height in the air for about 0.1 s before it hops back. Cartoon physics, visible only mid-whip.
7. **P2: the floating laptop and the tripods sometimes cut the frame edges** in rows 14 and 17.
8. **P2: depth of field is applied only to OTS shots.** The soft-foreground Antigravity ball in the row 3 and 18 bench shots stays sharp.

## Decisions

- **Temple world.** The painting goes on a far curved panel (r 20 m), not a flat plane, so side-looking shots still have a temple behind them. Dark engraved walls close the circle. The painted floor line is pinned to y 0, so the real stone-tile floor continues into the painted throne steps. Haze over it (FogExp2 0.03) and the soft depth of field keep the 1024 px image from reading as a stretched photo.
- **Studio rig removed.** The truss and the studio stage lamps fought the temple and went. The lamps were re-dressed as two bronze braziers that echo the painted ones. The marquee sign became a gold-on-stone TRIBUNAL architrave on two pillars at y 4.35. That is high enough to sit above the throne in the wide, visible in the crane and at the top of the hero shots, and never covering the throne behind the Conductor.
- **Light.** The key is warm gold, the fill is minimal and the shadows are deep. The cool rim stays faint (0.45) and steep, so the white robots separate without a blue specular streak on the glossy floor. A skylight spot and shaft echo the painting's light shaft.
- **OpenCode is black and white.** SCREEN #111111, EYES and GLOW white, badge black ring on white face, wall #1C1C1C with a raking white light. #F2C14E is gone from 3D.
- **Ptah emblem.** The Conductor's badge uses `ptah-emblem-gold.png` on a dark face; the bench nameplate uses `ptah-emblem.webp` on a cream medallion. Nameplate type now shrinks to fit the plate, so CONDUCTOR and ANTIGRAVITY are never cut.

- **`Cube.002_1` is the feet, not a head.** The bounds (y 0–0.154) and a 6-view render show two dome feet under a floating ball whose front is the screen. "The head rides the body on a spring" is therefore built as the ball riding a gap spring above the feet: it lags on take-off and landing and wobbles after every nod, lean and impact.
- **The robots have no arms, so the props are telekinetic** spring props (mug, laptop, paddle, gavel) with keyed targets and overshoot. The paper, nameplates and sheets are real rigid bodies.
- **One shared WebGL renderer with a 2D blit into each composition canvas.** The page now has 17 3D scenes and Chrome keeps at most 16 contexts. Each scene draws only while the seek time is inside its window.
- **Seat order** Claude −100°, Cursor −50°, Antigravity 0°, Codex +50°, OpenCode +100°. Claude and Cursor sit next to each other for the lean and the OTS pair. Antigravity is centre-front of the bench for the laptop gag. OpenCode is at the right end so its paddle has room.
- **The row 9 shot is a single** (Codex blocks every Antigravity>OpenCode sightline). **Rows 13 and 14 are reverse POV singles** (Claude and Codex are 150° apart, so any OTS put a third robot in the foreground). Real OTS shots are rows 5, 6 and 10. The OTS solver rejects sightlines through a third robot.
- **Listeners turn at most ±0.75 rad** (±0.45 rad toward the Conductor in row 3), and the speaker of a single plays half to the lens, so faces stay readable on a round table. Row 20 is the only full turn to camera, and the only move done in unison.
- **A pre-roll simulation gives continuity.** Each scene re-simulates earlier beats from a negative start time: the stack dropped, the laptop floating, the sheets on the floor, the gavel raised for row 18. Each scene therefore starts where the last one ended without shared state.
- **Event times come from `cues.json`.** `gavel-1`, `paper-thud`, `mug-sip-14`, `gavel-2` and `mug-sip` are taken relative to their row, so the shifted intro timing needs no change in my code. The punch lunge peaks at the composition's `localImpact`. Voice envelopes come from `window.__tribunalEnvelopes`, then `cues.json`, then a seeded synthetic envelope, so the result is never NaN.
- **Look:** NeutralToneMapping keeps the agent colours true. RoomEnvironment at intensity 0.38 lights the shell and brass. No bloom. Light cones are capped at 0.08 opacity and fade near the lens. A camera inside a cone produced a hard-edged grey patch in an earlier round; the fade fixes it.
- **Icons** are drawn into canvas textures (a cream badge face with a brass rim; brass nameplates). A missing PNG falls back to a coloured disc with the initial letter. The other agent's icons were present for the final rounds.
- `src/build-timing.mjs`, `compositions/**`, `index.html`, `assets/audio/**`, `assets/icons/**` and `SPEC.md` were not touched. `assets/models/**` was not changed. Nothing was committed.
