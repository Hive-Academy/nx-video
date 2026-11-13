# Scene 3D report: Agent Cribs (Episode 2)

The 3D layer for Episode 2 is built on Episode 1's engine (shared WebGL renderer, deterministic physics sampled by seek time, world-space cameras). Every frame is a pure function of the HyperFrames seek time. Compositions still call `window.TribunalReady.then(api => api.mount(config, canvas))`. `scene.js` sends the 17 Episode 2 kinds to one generic tour mount (`tour.js`). Episode 1's `table`, `chaos`, `verdict`, `booth` and `punch` kinds are unchanged.

## New modules

| File | Role |
| --- | --- |
| `src/tour.js` | Generic Cribs mount and the kind registry. It runs `build(scene, assets, ctx)` → world and `plan(world, ctx)` → specs, props, channels and shots. It simulates once (physics plus 1D channels), then each frame poses robots, props and camera from the sampled tracks. It also handles `prerender` (render to texture), impact shake and the whip smear. |
| `src/cribs.js` | Tour direction helpers. Row and word timing: words are normalised to row-relative seconds, whether the generator wrote them absolute, row-relative or scene-local. `actionTime()` reads the composition's SFX-synced `actions`. The voice envelope comes from `cues.json`, else a word-shaped envelope, else a synthetic one. Also: tour robot specs, a planned-position timeline, `walkTo` (hop-walk), `glideTo`, `hover`, `face`/`faceToward` in world yaw, `speak`, `listen`, `idle` and `addRobot`. |
| `src/cribs-camera.js` | The Cribs operator: fov 62 shots (`framed` from bounding spheres, `keyed`, walk-and-talk `follow` on the smoothed simulated robot) plus handheld (0.8°, 10 px, 1.6 Hz, seeded per shot), 6-frame whips (`whipIn`/`whipOut`, ±38° pan) and the smear amount. |
| `src/textures-loft.js` | Canvas textures, seeded: oak planks, limewashed brick, sandstone with relief glyphs, grass, pavers, concrete, the daylight skyline (clouds, city, water towers), leaves, rugs, posters, clock faces, text plates, cardboard, document pages, the ink stamp, light boxes and the phone status bar. |
| `src/props-loft.js` | Loft materials and props: plants (monstera, fig, snake), pendants, rugs, framed prints, desk, stool, side table, bookshelf, sofa, the big SHIP button, the COMMIT/PUSH/PR lamp board, the install box with its ribbon and bow, wall clocks, the giant phone and the fridge with labelled jars. |
| `src/set-loft.js` | The T3 Code loft. Palette from `src/t3-brand.json` (blue accent `#1B4ED8`, else terracotta). Walls built with real openings (steel windows, so the sun only lands where the windows let it), daylight rig, sky cards, doors with nameplates, the hallway and five rooms. |
| `src/set-street.js` | The street with both façades side by side: the loft (brick, steel windows, porch, oak pivot door, T3 Code logo plate, doorbell, house number) and the Ptah pylon (bronze gates, winged sun, emblem, obelisks, braziers). Lit interiors sit behind both doors; Episode 1's painted hall shows through the temple gates. |
| `src/set-tour.js` | Ptah stations in Episode 1's temple: lanes (podium, gold lane strips, work desks, trays, lamps), review desk and riser, limit gates (AT LIMIT and OPEN light boxes, barriers), stone fridge with glowing scrolls. Also job tablets, document sheet, rubber stamp, gavel and folder. |
| `src/set-scoreboard.js` | The carved scoreboard (S1–S2). |
| `src/set-nightshift.js` | The night shift table (N1–N2): diff scroll, coloured lenses, notes card, DRY RUN sign. |
| `src/tour-street.js` | Kinds `door-cold`, `t3-door`, `ptah-door`, `both`. |
| `src/tour-loft.js` | Kind `t3-hall` (rows H2 and H5) and the shared loft world. |
| `src/tour-rooms.js` | Kinds `t3-codex-room`, `t3-antigravity-room`, `t3-clock`, `t3-phone`, `t3-fridge`. |
| `src/tour-temple.js` | Kinds `ptah-lanes`, `ptah-review`, `ptah-gate`, `ptah-scoreboard`, `ptah-fridge`, `ptah-nightshift`, `ptah-tribunal`. |

Changes to Episode 1 modules:

- `physics.js`: hop-walk translation, glides, hover lift, slide events and `simulateChannel`.
- `robot.js`: the hover-aware contact shadow and `addSunglasses()`.
- `scene.js`: the tour dispatch, `cfg.duration`, prerender and the smear blit.
- `camera.js` and `acting.js`: helpers exported.
- `temple.js`: `brazier` intensity and flame height, a `night` option, and shared cached textures.
- `lighting.js`: `buildNightLights`.
- `assets.js`: loads `t3-brand.json`, `t3code.png`, `grok.png` and `pi.png`.

## Set dimensions

All sets are in metres with Y up, and the cameras work from the +Z side.

Robots on tour use scale 0.42: the ball is 0.72 m across and the robot stands 0.88 m tall. The Conductor uses 0.46. At the Tribunal table the cast keeps Episode 1's 0.38 and 0.42. The homes are human scale, so the robots read as small hosts in a big house: doors are 2.05 m, ceilings 3.2 m, desks 0.74 m. Temple furniture is robot scale: desks 0.46 m, the review desk 0.5 m, the night table 0.44 m.

| Set | Placement |
| --- | --- |
| Street | Façade line z −6. Loft x −13…−0.8, 9.6 m tall, limewashed brick, black steel windows. Porch: landing 0.3 m and a 0.15 m step; oak pivot door 1.1 × 2.4 at x −2.6, hinged on its right edge, opening inward. T3 Code logo plate 0.42 m square right of the door at 1.85 m; brass doorbell under it; house number "3" on the left. Temple pylon: towers x 1.6…5.6 and 8.0…12.0, 7.5 m tall, battered 0.4 m; two studded bronze gates 1.0 × 4.15 at x 5.8…7.8 on three 0.12 m steps; winged sun disc and Ptah emblem on the lintel; obelisks at x 4.3 and 9.3; braziers at x 5.0 and 8.6. Sidewalk z −1.6…0.6. Sun from (−14, 13, 15), 4096 shadow map. |
| Loft hallway | x −1.5…1.5, z −17…4, 3.2 m high. West wall: five 1.7 × 2.3 steel windows (sill 0.45). East wall: seven identical oak doors 0.92 × 2.05, with nameplates (0.52 × 0.146 at 1.3 m) at z −0.6 Cursor, −3.0 Claude, −5.4 Codex, −7.8 OpenCode, −10.2 Antigravity, −12.6 Grok, −15.0 Pi. Far end: a 2.3 m window. Black steel beams every 2.4 m, dome pendants, prints between the doors, plants by the windows. Sun from (−9, 7, −9.5) throws the window grid across the floor and up the doors. |
| Rooms | Each room has its own frame: interior x 0…w, z −d/2…d/2, about 4.4 × 4.6 m. Ship room: sage far wall, north window, desk at x 2.35 (top 0.74), SHIP button on the desk, Codex on a 0.62 m stool behind it, COMMIT/PUSH/PR board at 2.02 m on the far wall. Antigravity: far-wall window (backlit), install box 0.72 × 0.46 × 0.6 with a blue ribbon and bow. Clock room: dark teal far wall with 14 clocks (r 0.13–0.42), side table r 0.26 (top 0.56) with three books. Phone room: sand far wall, 1.9 m phone centred at 1.32 m. Kitchen: subway-tile wall, fridge 0.75 × 1.85 × 0.7 in a tint of the accent, three glass shelves, eight labelled jars (labels front and back). |
| Temple stations | All stand in Episode 1's temple (painting r 20 m, pillars, braziers, TRIBUNAL architrave) on a 3.6 m stone dais. Lanes: podium 0.4 m at z −2.2; five desks at z 0.62 and x −2.4, −1.2, 0, 1.2, 2.4 (Cursor, Codex, Claude, OpenCode, Antigravity); gold lane strips. Review: desk at z 0 (top 0.5); Conductor riser 0.5 at z −1.05. Gates: two carved arches at x ±0.95, z −0.6, 1.25 × 2.0, light boxes at 2.6 m, a floor channel at z 0.55. Stone fridge: basalt, 0.9 × 1.95 × 0.75 at (0.9, −0.9). Three shelves each carry two piles of three rolled parchment scrolls lying across the shelf. Each scroll is 0.22 long, r 0.036, with a parchment texture, the spiral paper edge on its ends, and wooden end caps and knobs. Each pile has a two-sided tag (0.2 × 0.083) hung from the gold shelf lip: SESSION 3/4, SESSION 1/2, BM25/VECTORS. Scoreboard: basalt slab 4.1 × 2.77 at z −1.45, five columns at x −1.2…1.52 in cast order. Night table: 2.9 × 0.95 at z −0.62, top 0.44; scroll 2.3 × 0.46; lens holders at x ±0.38 and ±1.13; Cursor (the verifier) at x 1.95. Tribunal: Episode 1's table set, unchanged. |

## Shot list per row

Camera numbers are `<row>-<letter>`. Every shot is fov 62 (two close inserts use 50–54) with seeded handheld. "Whip" means a 6-frame right pan across the seam (3 frames out, 3 frames in) with a horizontal smear. Times are the composition's scene-local actions.

| Row | Cam | Shot |
| --- | --- | --- |
| C1 | C1-A | Frame 0: Codex in sunglasses leaning on the loft's door frame (roll 0.24 toward the jamb), house number "3", T3 Code logo plate and doorbell (it glows at `doorbell`). Framed from the sphere, fill 0.27, slow drift. |
| C1 | C1-B | On `bothOfThem`, a 0.9 s `power3InOut` pull back and pan right to a low wide: the loft door on the left with Codex in it, the temple gate on the right. Codex glances at the temple. |
| H1 | H1-A | Front of the loft porch: Claude left of the door, facing the lens through "This is T3 Code." (it leans toward the door, never turns away), logo plate right. The door swings open on `doorOpen` (1.7 Hz, ζ 0.5) onto a lit interior. |
| H1 | H1-B | After "Code." Claude hop-walks to the door and in (0.45 m strides). The operator follows 1.65 m behind at shoulder height, through the doorway: Claude is in frame, back 3/4, inside the bright loft on "own room!". No whip; the cut matches H2's bright hall. |
| H2 | H2-A | Walk-and-talk: the operator walks backwards 2.05 m ahead of Cursor, at robot height. Cursor hop-walks toward the lens past the doors, with the hall receding behind it. At `beat` it looks round the empty hall. |
| H2 | H2-B | At `weird`: an off-axis single (41° from A), fill 0.42. Cursor turns to this lens, eyes narrowed, and gives a slow head shake. Whip out. |
| H3 | H3-A | Whip in. Front single across the desk; COMMIT/PUSH/PR board above Codex; a small rising bounce on each list item. |
| H3 | H3-B | Low over the SHIP button. At `press` Codex bonks it (lunge plus face-down nod): the cap springs, the glow flashes and the three lamps light 0.17 s apart, with a camera shake. Two happy hops on "love". Whip out. |
| H4 | H4-A | Whip in. Wide on the install box: Antigravity pops out of it (lift −0.34 → 0.5, ζ 0.3) after the box jiggles, then spins once. |
| H4 | H4-B | Low single, fill 0.36: eyes wide and glowing on `seen`. Whip out. |
| H5 | H5-A | Whip in. OpenCode beside Antigravity's door, the note on the floor. At `noteSlide` OpenCode shoves it (lunge) and it slides under the door. |
| H5 | H5-B | From `noteUnder`: inside Antigravity's room, a low wide (camera 1.72 m back, at 0.42 m) holding the door's bottom edge, the note on the floor and all of the hovering Antigravity. The note comes out from under the door and slides to rest; Antigravity glides over and, at `noteArrives`, lifts it to read; on "gossip" it eyes the door. Whip out. |
| H6 | H6-A | Whip in. Single in front of the teal clock wall. |
| H6 | H6-B | Low 3/4 with the side table. Claude hops into the table on "Mess" and the books fly off. At `rewind` the books fly back (prop time reversed at 2.4×) while every clock spins backwards. Claude hops back to its mark. Whip out. |
| H7 | H7-A | Whip in. Cursor beside the giant wall phone, which lights up at `phoneLight` with a live view of the room from the phone's own camera. |
| H7 | H7-B | On "boss": a push onto the phone screen (fov 52 → 48). Cursor is seen inside it. The phone buzzes at `phoneBuzz`. Whip out. |
| H8 | H8-A | Whip in. Codex beside the pale-blue fridge. The door swings open at `fridgeOpen` with interior light and spill; Codex hops round in front. |
| H8 | H8-B | The fridge-light reveal: from inside the fridge between the FRESH and EVENTS jars, onto Codex's lit face. Whip out. |
| P1 | P1-A | Whip in. Low on the temple gate (address card time). The bronze gates open at `doorOpen` onto the painted hall. |
| P1 | P1-B | Conductor 3/4 with the plinth. The gavel lifts and taps at `gavel`, with a shake. Whip out. |
| P2 | P2-A | Whip in. High-front wide of the lanes. Job tablets fly from above the Conductor to each desk, and the robots hop (Antigravity glides) down their lanes at `lanes`. |
| P3 | P3-A | Claude behind its desk, fill 0.36. It looks down into the empty tray on "no file". |
| P3 | P3-B | Top-down over the tray (63° down, fov 58), the page centred and inside title-safe, Claude's face at the top of frame. The deliverable drops in at `fileLands`. The stamp is parked on the desk right of the tray; it makes a quick 0.25 s rise from the side at desk height, never in front of Claude's face. It slams one frame before `stamp` (43.85 s, on "disk…") and lifts out of shot within 6 frames. Red angled DELIVERED stays unobstructed for about 2 s to the cut (no whip). |
| P4 | P4-A | Whip in. Codex 3/4 at the review desk, reaching (lean plus lunge); its own folder floats to it at `reach`. |
| P5 | P5-A | Front wide of the desk and the Conductor on the riser. At `gavel` the folder snaps back down; at `handoff` it flies to Claude (a different family), who has hopped in. Codex deflates and shuffles aside. Whip out. |
| P6 | P6-A | Whip in. Low on OpenCode under the red AT LIMIT box. At `buzzer` the box flashes, the barrier rattles and OpenCode jolts and deflates. |
| P7 | P7-A | Two gates wide. At `reroute` the job drops into the floor channel and slides past OpenCode to Cursor at the OPEN gate. The camera pans with it. Whip out. |
| S1 | S1-A | Whip in. The scoreboard wide with the Conductor on its block. Delivered tallies fill across all columns in step from `score` to `tallyDelivered`; failed tallies at `tallyFailed`. A gold glow rises with the tally. |
| S2 | S2-A | Codex single from its left: at `lookUp` it looks up toward its column, then away, with a tiny sheepish hop at `sheepish`. Whip out. |
| P8 | P8-A | Whip in. Claude beside the basalt fridge. Its door opens at `fridgeOpen`: gold glow, spill and cone. |
| P8 | P8-B | The fridge-light reveal, shot from just behind the stone fridge with its back panel removed for the shot. The shelves frame Claude's lit face. The scrolls lie across the shelves, so none points at the lens. The SESSION 1 and SESSION 2 tags hang fully in frame from the middle shelf's lip, with VECTORS and BM25 above. Whip out. |
| N1 | N1-A | Whip in. The temple at night: the scroll unrolls at `unroll`; four robots lean over it with lenses in their own colours. The lenses lift at `lenses`. |
| N1 | N1-B | Cursor, the verifier, at the table end: the stamp slams CHECKED on the notes card at `verifier`. |
| N2 | N2-A | Cursor single: the DRY RUN sign rises at `drySign`, a polite bow at `manners`. Whip out. |
| P9 | P9-A | Whip in. Crane-down wide on Episode 1's Tribunal table. On `disagree` everyone turns on a neighbour with a hop; OpenCode shakes its head. |
| P10 | P10-A | High 3/4 on the Conductor under the TRIBUNAL architrave. Episode 1's gavel strike at `gavel` jolts the table, the nameplates and the panel. |
| E1 | E1-A | Whip in. Low wide of both homes, the five robots on the walk between them. On `scratch` they snap from "debating" (looking at the homes) to looking at each other. |
| E2 | E2-A | A closer wide (a new angle). At `turn` all five turn to the lens together (the only unison move) and say "…Both.". |
| E3 | E3-A | Codex single after a hop forward. At `sunglasses` the glasses drop from above and land on its face with overshoot; the others look at Codex. |

## Physics additions

Everything is still simulated once at mount, at 1/120 s, into Float32Arrays, and sampled by seek time.

| Addition | Model |
| --- | --- |
| Hop-walk | `walkTo` turns the robot first (a delay of 0.06–0.3 s that scales with the turn). It then queues one physics hop per stride (0.3–0.42 m, 5–7 cm high, seeded height jitter). Each step: anticipation squash (0.085 s, depth 0.11); a ballistic hop whose airtime, 2·√(2h/g), carries the base one stride; a landing squash; the ball's gap spring settles. Alternating roll kicks (±0.55 rad/s) make the waddle, and a pitch lean (−0.1) runs for the walk. Base position is a new output channel (`px`, `pz`). |
| Glide | For hovering robots (Antigravity): the base slides on a smoothstep path with no hops, with a forward lean. |
| Hover | A `lift` channel: a spring toward keyed heights (2–3 Hz, ζ 0.3–0.6), plus a seeded bob that is a pure function of t. Antigravity's jack-in-the-box pop uses ζ 0.3 for the overshoot. The contact shadow stays on the floor and shrinks with height. |
| 1D channels | `simulateChannel`: a spring toward keyed targets, with velocity kicks and hard stops that bounce (restitution 0.2–0.35). Used for the door hinges (the loft pivot door, temple gates, fridges, stone fridge), the SHIP button travel (26 Hz press, then a 6 Hz ζ 0.3 spring-back) and the sunglasses drop (3.4 Hz, ζ 0.42, overshoot onto the face). |
| Slide events | A rigid-prop impulse that keeps the prop on its support. H5's note uses constant friction solved from the SFX beats: it passes under the door at `noteUnder` and comes to rest as Antigravity picks it up at `noteArrives`. |
| Rewind | H6 samples the books' rigid tracks at a mapped time: forward until "Rewind", then backwards at 2.4× to before the bump. The clock hands run on a closed-form back-spin, S(u) = u − sin(2πu)/2π over 1.25 s (2–3 turns of the minute hands, 6–8 of the second hands). |
| Impacts | Camera impact shake on the button press, gavels, the file landing, both stamps and the gate buzzer. The press bonk is a forward lunge plus a face-down nod. Gavel strikes reuse Episode 1's spring keys (raise, then 13 Hz down onto the block). At the Tribunal, Episode 1's `gavelStrike` jolts the table, the nameplates and the robots. |

## Snapshot verdicts

**Method.** Iteration used a scratchpad puppeteer harness that mounts one composition config (placeholder configs first, then the real `compositions/*.html` configs) and saves frames. Verification then used the pinned CLI:

- Round 1: `snapshot --at … --no-end --timeout 30000 --describe false -o snapshots/3d`, 41 frames on the first composition timeline. Contact sheets were reviewed and fixed.
- Round 2: the same command after the overlay agent regenerated the timeline with S1–S2 and N1–N2, 50 frames in `snapshots/3d/` (`contact-sheet-1..6.jpg`).
- Round 3: a re-shoot of the frames changed after round 2, in `snapshots/3d-final/`, plus `--zoom 760,300,520,420` on Codex's face at 0 s in `snapshots/3d-zoom/`.

Verdicts on the final timeline (absolute seconds):

| t (s) | Kind / row | Verdict |
| --- | --- | --- |
| 0, 1.0 | door-cold C1 | Pass. Frame 0 reads as a house tour: Codex in sunglasses leaning on the oak door frame, house number "3", the T3 logo plate, the doorbell glowing on the first word. The caption band is clear of his face. |
| 3.1 | C1-B | Pass. The pull-back shows the loft door with Codex in it and the temple next door. Codex is small but above the caption band, and the shrubs are off his sightline. |
| 7.13, 8.53, 9.83 | t3-door H1 | Pass. The address card sits top left over clean wall. The door opens on `doorOpen` onto a lit interior (blue art, a plant). Claude 3/4. The push through the doorway lands in the bright interior. |
| 10.97, 12.87 | t3-hall H2 | Pass. A deep loft hallway with sun patches; Cursor hop-walks toward the lens with the doors and nameplates receding; the off-axis "...Weird." single. |
| 14.1, 15.75, 16.6 | t3-codex-room H3 | Pass. Sage ship room; the blue SHIP button glows on `press`; COMMIT/PUSH/PR lit. |
| 18.07, 20.07 | t3-antigravity-room H4 | Pass. Antigravity hovers out of the ribboned ANTIGRAVITY / SETUP INCLUDED box; the low single on "seen". |
| 21.4, 22.25, 23.0, 24.8 | t3-hall H5 | Pass. Mid-slide at 22.25 the note is at the door's bottom edge; at 23.0 it comes out under the same door inside the room; at 24.8 Antigravity has lifted it to read. |
| 27.53, 28.78, 29.23 | t3-clock H6 | Pass. The teal clock wall; the books fly off on "Mess up?" (28.78) and are flying back with the clock hands spun on "Rewind!" (29.23). |
| 30.97, 31.87 | t3-phone H7 | Pass after round 3. The live phone view is from the phone's own camera; Cursor's face is in the upper half of the screen; LIVE badge and "T3 Code" bar. |
| 32.93, 33.93, 35.93 | t3-fridge H8 | Pass. Pale-blue fridge (T3 blue mixed with cream) against subway tile; the reverse from inside between FRESH and EVENTS jars onto Codex's lit face. |
| 37.87, 40.52 | ptah-door P1 | Pass after round 3. Address card over the pylon; gates open onto Episode 1's painted hall; the gavel (1.8×) is visible lifting and tapping the plinth. |
| 41.87, 43.17, 45.67 | ptah-lanes P2–P3 | Pass. Job tablets and robots peel off down the gold lanes; at 45.67 **DELIVERED** reads in red on the stamped page in the tray. |
| 47.03, 49.9 | ptah-review P4–P5 | Pass. Codex 3/4 reaching for its own folder; after the gavel the "my code" folder (Codex icon) floats to Claude and Codex deflates. |
| 51.63, 52.73, 55.03 | ptah-gate P6–P7 | Pass. A red AT LIMIT box over OpenCode, flashing on the buzzer; the job slides past to Cursor at the OPEN gate. |
| 57.27, 59.37, 60.87 | ptah-scoreboard S1–S2 | Pass after round 3. All five columns readable with icons, the gold tallies lit; S2 is a low wide from the left, with Codex looking up at the board, then turning to the lens (sheepish). The whole board stays in shot, so no column is singled out. |
| 61.8, 64.8 | ptah-fridge P8 | Pass. Basalt fridge with a carved door; the reveal from inside the glowing scrolls onto Claude. |
| 68.1, 69.6, 70.7, 72.6 | ptah-nightshift N1–N2 | Pass. Cool night, banked braziers; the diff scroll; four coloured lenses; CHECKED stamp on "verifier"; DRY RUN sign. |
| 73.67, 75.72 | ptah-tribunal P9–P10 | Pass. Episode 1's table wide, then the Conductor under TRIBUNAL at the gavel. The top of a ball can enter the bottom-left corner when the gavel bumps the panel; no face. |
| 76.93, 77.93, 80.83 | both E1–E3 | Pass. Both homes with the five robots between them; at 77.93 **all five face the lens**, with both homes visible; at 80.83 Codex wears the sunglasses again. |

No black or NaN frames. No faces in the bottom 22 % caption band in the final frames.

`hyperframes check --json` (final run, regenerated compositions, 84.93 s cut): **ok: true.** Lint, runtime, layout, motion and contrast all have 0 errors and 0 warnings. Layout reports only six info-level `canvas_content_at_edge` notices, which are expected for full-frame canvases. An earlier run's 404 on `sfx/door-open-1.mp3` and its audio-slot warnings came from the overlay agent and are now resolved.

Round 3 also fixed the sunglasses fit, seen with `--zoom` on Codex's face at 0 s. The arms now wrap round the shell behind the silhouette instead of sticking out. The lenses sit over the tops of the eyes, which peek out under the frames.

**Round 4 (the orchestrator's full-cut review).** Re-shot in `snapshots/3d-fix/` at 7.6, 9.6, 23, 25.8, 44.35, 44.85, 45.6, 63.5 and 64.6 s:

| t (s) | Fix | Verdict |
| --- | --- | --- |
| 7.6 | H1 "T3 Code." | Claude faces the lens beside the opening door. |
| 9.6 | H1 "own room!" | Claude is in frame in the doorway, walking into the bright loft (back 3/4), with the camera following through. |
| 23, 25.8 | H5 inside | All of the hovering Antigravity and the note on the floor are in frame (the note comes out from under the door, then is lifted to read). |
| 44.35, 44.85, 45.6 | P3 stamp (+0.5 / +1.0 / +1.75 s) | DELIVERED in red, angled, the whole word on the page inside title-safe; the stamp has gone; Claude's face is at the top. |
| 63.5, 64.6 | P8 inside | Rolled scrolls with caps lie on the shelves (nothing points at the lens); SESSION 1 and SESSION 2 are fully legible, VECTORS and BM25 above; Claude's lit face is framed between the shelves. |

**Round 5 (the pacing pass: 105.77 s cut).** All actions were re-read from the regenerated compositions. Every new lead-in and hold now has life:

- **Lead-ins (0.5–1.0 s).** `tour.js` gives every room a camera settle: the operator creeps 0.16 m into the first framing and lands as the first word starts (`power2Out`). Push lengths are unchanged at 12 frames; extra time becomes settled handheld and slow drift. `cribs.leadInLook()` has each host eye the room's gag, then turn to the lens 0.32 s before its first word. The gags: Cursor eyes its door; the SHIP button glints twice; the install box jiggles before the pop; Claude looks up at the clocks; Cursor eyes the dark phone; Codex eyes the fridge; the Conductor eyes the opening gates, then its lanes and the scoreboard; OpenCode eyes the note, then the AT LIMIT box; Claude eyes the stone fridge. H1's doorbell glows on `doorbell`.
- **Between lines.** `cribs.anticipate()` gives each next speaker an inhale and lift 0.38 s before its line (P3, P5, S2, N2, P10). Listeners react: Claude watches Codex reach and squints at the verdict (P4–P5); Cursor winces at OpenCode's buzzer (P6); Codex looks at the board and squints at "didn't" (S1); the Conductor turns to Codex (S2); the four lens-holders turn to Cursor (N2).
- **Tail holds (0.7 s).** H1: Claude turns back to us inside the loft. H2: Cursor looks down the empty hall and back. H3: a happy sway. H4: Antigravity floats higher. H5: Antigravity leans in to the door to eavesdrop. H6: a ta-da lean. H7: Cursor startles on the buzz. H8: the fridge door drifts half shut on the inside shot. P3: a proud nod at the stamped page. P5: Codex deflates and shuffles off. P7: OpenCode sighs. S2: Codex shuffles sideways off its column. P8: a pleased roll. N2: the DRY RUN sign wobbles politely. P10: a gavel echo 0.38 s later rattles the nameplates and bumps the panel.
- **Between houses (H8 tail + the P1 lead-in, 2.2 s).** H8 ends with the fridge door closing on the inside shot, then a whip out. P1 opens on the loft porch and travels along the street to the temple gate in 0.83 s (`power2InOut`, smeared with up to 70 px of motion blur), as the gates open on `doorOpen`.
- **Finale.** E1's card holds the debating group. In the 0.56 s silence all five turn together and slowly (yaw spring 1.15 Hz, ζ 1.0) in the closer wide, which now starts at the end of the card; the turn lands on "…Both.". Each settles with a small bob in turn during the 0.8 s hold. E3: the sunglasses drop on at `sunglasses`.

Verified in the harness (start, middle and tail of 12 kinds) and with the pinned CLI: `snapshots/3d-pacing/` (54 frames: starts, middles and the last 0.3 s of 14 rooms, both house transitions and the finale), then `snapshots/3d-pacing-r2/` after round 2. Round 2 fixes:

- H7 tail: Cursor spins to the buzzing phone, so its face fills the live screen.
- P3: the deliverable drops from 0.45 m, so it crosses Claude's face for only a few frames.
- N1-B starts 0.22 s before the stamp, which keeps the speaker (Claude) in the wide longer.

Final `check --json`: ok, 0 errors and 0 warnings in all five sections.

## Slowest frame

Profiled once with the scratchpad harness: all 18 compositions, 10 evenly spaced frames each, hardware GPU (RTX 3070 Laptop, ANGLE/D3D11). The timing covers the seek, the render and the 2D blit, forced to sync with a 1 px `getImageData`.

| Composition | Mount (ms) | Steady frames (median / max ms) |
| --- | --- | --- |
| door-cold | 1018 | 37 / **124** (slowest: the pull-back wide at 3.09 s, the whole street with a 4096 sun shadow map and both lit interiors) |
| ptah-door | 1048 | 37 / 51 (its first frame is 118 ms) |
| ptah-fridge | 3835 | 38 / 49 (its first frame is 116 ms) |
| ptah-lanes | 7364 (the longest mount) | 45 / 62 |
| ptah-gate | 4748 | 49 / 80 |
| t3-phone (render-to-texture) | 1993 | 37 / 61 |
| all other kinds | 0.7–5.7 s | 35–48 / 42–65 |

Steady frames are 35–65 ms, and the worst single frame is 124 ms. Mounts take 0.7–7.4 s. Deterministic temple textures are shared across scenes, which cuts mount time when many temple scenes load on one page. There is no `Math.random`, `Date.now`, timer or mixer anywhere in `src/*.js`.

## Open issues

Ranked.

1. ~~P3's stamp landed 0.28 s before the cut.~~ Fixed: the overlay agent moved `stamp` to 43.85 s, and the page holds about 2 s, framed top-down and inside title-safe.
2. **P2: H8-B (the loft fridge) still has large jars in the bottom corners.** They are labelled FRESH and EVENTS and read as jars. ~~P8's scrolls read as thumbs~~ Fixed (round 4).
3. **P2: walls are clean flat plaster.** There is no texture, by choice (an earlier blotchy texture read as grey). The loft relies on sun patches, steel windows, plants and the accent walls for richness.
4. **P2: the street façades are simple box geometry** (no window reveals; low-poly trees). They read well in the wide shots, but the temple pylon is flat in close shots.
5. **P2: H7-B shows Cursor only inside the phone.** The real Cursor is out of frame during the push; the live view on the phone screen (from the phone's own camera) is the face.
6. **P2: P10 is a high 3/4.** Antigravity's ball can touch the bottom-left corner on the drift. There is no face in it.
7. **P2: the night shift reads as night through cool haze, low braziers and the moon key.** The painted backdrop's own flames stay visible because they are part of the image (dimmed and cooled to 32–48 %).

## SFX actions consumed

Every 3D composition's `config.actions` is read through `cribs.actionTime()`. The action wins over word timing; word timing is used only when the cue is missing. A visible contact lands one frame (0.033 s) before its sound. Strike keys are offset for each spring's closing time; the probed contacts land 0.035–0.048 s before the cue.

| Kind | Actions consumed (scene-local s) | What they drive |
| --- | --- | --- |
| door-cold | `doorbell`, `bothOfThem` | doorbell glow; pull back and Codex's glance at the temple |
| t3-door | `doorOpen` | the door swing (`doorbell` and `addressCard` are left to the overlay) |
| t3-hall (H2) | `beat`, `weird` | end of the walk and the look round; the B single and Cursor's turn |
| t3-hall (H5) | `noteSlide`, `noteUnder`, `noteArrives` | the shove one frame early; the friction is solved so the note passes under the door at `noteUnder` and rests as Antigravity lifts it at `noteArrives`; the inside shot starts at `noteUnder` |
| t3-codex-room | `press` | the bonk contact one frame early, cap travel, glow, lamp cascade, shake |
| t3-antigravity-room | `seen` | eyes wide and glowing |
| t3-clock | `rewind` | the books' reversed time, the clock back-spin, Claude's hop back |
| t3-phone | `phoneLight`, `phoneBuzz` | screen on (6 frames); phone shake and Cursor's jolt |
| t3-fridge | `fridgeOpen` | the door swing, interior light and spill |
| ptah-door | `doorOpen`, `gavel` | the gates; the gavel tap one frame early (`addressCard` is the overlay's) |
| ptah-lanes | `lanes`, `fileLands`, `stamp` | the peel-off and tablets; the file lands one frame early; the stamp contact and DELIVERED mark one frame early |
| ptah-review | `reach`, `gavel`, `handoff` | the folder floats to Codex; the strike one frame early; the folder flies to Claude |
| ptah-gate | `buzzer`, `reroute` | AT LIMIT flash, barrier rattle, OpenCode's jolt; the job slides to Cursor |
| ptah-scoreboard | `score`, `tallyDelivered`, `tallyFailed`, `lookUp`, `sheepish` | delivered tallies fill from `score` and finish on `tallyDelivered`; failed tallies on `tallyFailed`; Codex looks up, then the sheepish hop |
| ptah-fridge | `fridgeOpen` | the stone door, glow, scrolls, cone |
| ptah-nightshift | `unroll`, `lenses`, `verifier`, `drySign`, `manners` | scroll unroll; lenses lift; the CHECKED stamp one frame early; the DRY RUN sign; the bow |
| ptah-tribunal | `disagree`, `gavel` | everyone turns on a neighbour; Episode 1's strike, contact one frame early |
| both | `scratch`, `turn`, `sunglasses` | the snap glance; the unison turn; the glasses land |

## Decisions

- **One generic tour mount.** The kinds hold only their set, acting and shots (`build`/`plan`). Physics, channels, the camera rig, the whips and the blit are shared in `tour.js`, so no kind can drift from the deterministic contract.
- **Beats come from the composition's `actions`** (see the table above), re-read after every regeneration (the pacing pass moved them all). These are the overlay agent's SFX hit times, so every picture beat lands on its sound, with the visible contact one frame early. When an action is missing, word times are the fallback, and after that row fractions. That is why the H3 press, the H5 slide, the P5 gavel and the P10 gavel follow the SFX rather than the exact words in the brief. P5's gavel falls between "Different family." and "Next."; P10's comes after "The Tribunal.".
- **Human-scale homes, robot-scale temple furniture.** In the loft the robots are small hosts in a big house (doors 2.05 m). That is the Cribs feel, and it makes the loft read as a real place you would want to live. The temple stations are robot-scale, so the robots work at them.
- **T3 Code is shown with respect.** Its own palette from `t3-brand.json` (the blue `#1B4ED8` as the one accent per room: the SHIP button, rugs, prints, the fridge tint), its own logo on the porch plate (a neutral "T3 Code" plate until `t3code.png` exists), bright daylight, plants, oak and steel. Every room has its own accent wall (sage, blue rug, dark teal clock wall, warm sand, subway tile) so the tour never repeats a room.
- **Two engines? No: one engine, two looks.** The loft is a daylight rig (a sun through real window openings, sky hemisphere, NeutralToneMapping). The temple is Episode 1's gold key and haze. The night shift is the same temple with a moon key, a blue hemisphere and banked braziers.
- **Cribs camera.** fov 62 throughout, seeded handheld on every shot, framing solved from each robot's bounding sphere with the speaker's ball in the upper two thirds. The bottom 22 % is kept free of faces. Room-to-room seams are 6-frame whips to the right (3 frames out, 3 frames in), drawn as an 8-copy horizontal smear in the 2D blit. H1 ends with a push through the open door into the bright interior, which matches H2's bright hallway. P3 has no whip out, so the stamped page holds to the cut.
- **One fridge-light reveal per house.** H8 shoots from inside the fridge between the jars; P8 from inside the stone fridge between the scrolls. Labels are drawn on both faces, so they read from inside too.
- **The sticky note really passes under the door.** The door leaf stops 14 mm above the floor and the note is 4 mm thick. H5's inside shot is a real room built behind Antigravity's hallway door: the same door leaf, seen from the other side.
- **The phone shows the room it hangs in.** A portrait render target from a corner camera, rendered just before the main frame with the phone's own screen blanked (no feedback loop), with a status-bar overlay that says "T3 Code".
- **The scoreboard is gentle.** Columns stay in cast order (never ranked). Counts are close: 10–13 delivered, 2–3 failed for every robot. Codex sits mid-pack at 11/3. Delivered tallies fill in step across all columns at once, so no column visibly "wins".
- **No arms, so props are telekinetic** (gavel, stamp, lenses, job tablets, folder, DRY RUN sign, sunglasses), as in Episode 1. The note, the deliverable sheet, the books and the Tribunal props are real rigid bodies.
- **Scope kept.** Only `src/*.js` were changed. `build-timing.mjs`, compositions, `index.html`, audio, icons, SPEC and the agent-tribunal folder were not touched. Nothing was committed.
