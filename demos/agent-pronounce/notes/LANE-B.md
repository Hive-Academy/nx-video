# Lane B — 3D (office, vortex, desert)

Status: complete pending vision review. All three kinds mount, render at the
required checkpoints, pass `check --json` (0 errors in my files) and the
no-media guard. Every frame is a pure function of time (seeded hash noise,
physics simulated once at mount; no wall clock, no unseeded random, no network
at seek).

## Files created / changed (all mine only)

Created:
- `src/set-office.js` — the `office` kind (glass office at dusk, sofa pair, laptop, spark/dip/bolt/flash).
- `src/set-vortex.js` — the `vortex` kind (tumbling sofa in a sand/hieroglyph tunnel; `land` cue).
- `src/set-desert.js` — the `desert` kind (golden-hour desert, step pyramid, ramps + crews + banners + inspector + stamp, Cursor crossing, pylon portal).
- `src/ptah-god.js` — Ptah's giant figure, pure Three.js primitives + canvas wrap-lines texture (no external models/images).
- `notes/scratch-3d.html` — scratch rig: mounts one kind with the REAL composition config and seeks `?scene=&t=`.
- `notes/scratch-server.mjs` — tiny static server for the scratch page (the Studio preview serves its SPA on every route).

Changed (shared engine files, 4:5 frame-shape plumbing — kept minimal, in place):
- `src/camera.js` — mutable `frame` export (`setFrame`); `setRenderSize`.
- `src/cribs-camera.js` — handheld/focal scale from `frame.h`.
- `src/scene.js` — `setFrame`/`setRenderSize` in `mount()` from the host canvas size.
- `src/cribs.js` — added `sceneCue(ctx, key, fallback)` (reads `cues` then `actions`).
- `src/tour.js` — registered the three kinds: `TOUR_KINDS = { ...LOFT_KINDS, ...STREET_KINDS, ...TEMPLE_KINDS, ...OFFICE_KINDS, ...VORTEX_KINDS, ...DESERT_KINDS }`.

Episode 2 kinds untouched and still registered. `index.html`, `compositions/`, `scripts/`, `src/build-timing.mjs` never edited.

## Cue animation

All cues resolve via `cribs.sceneCue` (SPEC `cues` first, Episode 2 `actions` second, word-time fallback). Values verified against Lane A's generated compositions.

**office** (duration 14.338; spark 4.58, dip 4.78, bolt 8.179, flash 12.565):
- `spark` — 52 seeded ballistic spark particles from the laptop screen (additive points), laptop emissive + screen light pulse.
- `dip` — room lights ease down to 42% with a 0.55 s seeded strobe (pendant, key, bulbs all scale by one `roomLight(t)`).
- `bolt` — a 12-anchor seeded jagged quad-strip from the laptop up the wall and across the ceiling; 3 re-strikes over 0.55 s (opacity pulses at 0/+0.17/+0.33); bolt light pulses; robots get a `bumps` jolt, wide eyes and face the bolt.
- `flash` — room lights spike ~1.1× at the cue then a pose-glued oversized whiteout plane (`depthTest:false`, `renderOrder 999`) eases `power2In` to **full white by scene end**; camera `hits` shake at spark/bolt/flash.
- Acting: O1 Codex, O2 Claude talk (speak/anticipate/listen, seeded onsets); shots: handheld two-shot (framed, push-in 0.4) then a keyed push to a tighter two-shot through O3; whip-in at scene start.

**vortex** (duration 3; `land` 2.6):
- 900 sand particles on seeded orbits drifting toward camera; 26 glyph sprites (ankh, eye of Horus, falcon, water, djed, sun — canvas line art) each with its own material (per-sprite rotation); the tunnel cylinder swirls, its streak texture flows.
- The sofa group tumbles (position + rotation, pure trig of t); the two robots are parented to it and hand-posed (`apply`) each frame — breathing squash, sway, seeded blinks, glow pulse. No physics robots (`specs: {}`), `noSettle`.
- `land` — the far light disc grows + far point light ramps to 7; a warm-white pose-glued plane eases `power2In` to a **warm whiteout by scene end**.

**desert** (duration 25.765; sofaLand 0.3, rise 0.3→clamped 0.6, pan 10.289, cursorPass 15.901, stamp 16.01, portal 20.118):
- `sofaLand`/contact — the sofa rides Claude's lift spring (two `hover` springs: init y 2.1 at t −0.6, y 0 at 0.3, hz 2.0 ζ 0.62 for a soft settle), damped pitch oscillation after contact, contact-shadow decal fades in, 64-particle dust puff at contact 0.58, `hits` camera shake 0.02.
- `rise` — Ptah's eyes/djed/ankh emissive ramp up (`power2Out` 0.6 s), head group pitches down 0.14 rad toward the sofa; while Ptah's rows (speaker `Conductor`) speak, eyes/sceptre pulse with `sampleEnvelope` of the row envelope.
- Crews — 3 ramps (oriented frames: local +Z up-ramp, hand-built basis so +Y is the surface normal; shortest-arc would flip it); A/C: 4 haulers walk-in-place at fixed stations + 2 looping sledges; B: featured sledge + 3 haulers that arrive by `stamp − 1.0`; banners ("FRIENDS OF KHUFU", "DRUNKARDS OF MENKAURE", "CREW 3") are canvas text-plates on swaying cloth pivots; seeded blinks on every crew robot.
- `stamp` — the inspector (recoloured rig) squash-bounces; the stamp tool raises → slams (head touches the block top) → rebounds; a gold seal pops in with a hand-rolled back-out overshoot; the sledge block swaps to a world twin that lerps + quaternion-slerps into the row on the pyramid top over stamp+0.2..+0.9; the seal rides the block.
- `cursorPass` — Cursor (`#8C8CFF`, sandstone block parented to his head) hop-walks (walkTo, `turn:false`, never stops) from (−5.2, 2.6) to (5.8, 1.4), crossing the sofa zone ~16.9–18.8 s; he speaks D4; the sofa pair track him with two `faceToward` looks.
- `pan` — keyed 3-key pan from Ptah across to the crews.
- `portal` — the pylon doorway plane + point light ramp warm (`power2In` 1.1 s); the shot cuts near the pylon and pushes in, **target held on the doorway centre the whole shot**, so the doorway sits at the exact frame centre from t≈18.4 to end (Lane A's app-window grows over it from portal).
- Shots: establish (whip-in, sofa falls through top of frame) → sofa two-shot (D2) → pan crews → stamp top → cursor crossing → portal push + hold. Acting for Claude (D2), Cursor (D4), Codex (D6 whisper, squint + gain 0.7), Ptah's rows pulse the god.

## Frame verification

I rendered each kind at the required checkpoints via the scratch page
(`http://localhost:3097/notes/scratch-3d.html?scene=&t=`, seek through
`hf-seek`) and captured 1080×1350 screenshots to `.ptah/screenshots/`:

| Screenshot | Verdict (pixel-grid probe, 6×8 lum/max) |
| --- | --- |
| `office-spark-458.jpeg` | two-shot reads: glowing screens mid-frame, dusk windows top, warm floor bottom |
| `office-bolt-830.jpeg` | bolt strike 2 visible as bright cluster right-of-centre; room dimmed |
| `office-flash-1390.jpeg` | 56% white blend on the power2In curve → full white by end |
| `vortex-mid-140.jpeg` | warm dark tunnel, sofa+robots mid-frame, glyph/sand brights scattered |
| `vortex-land-275.jpeg` | frame brightening, disc opened + 14% warm whiteout on curve |
| `desert-establish-020.jpeg` | sky top, Ptah bright right, pyramid left, sofa mid-air mid-frame, sand below |
| `desert-rise-120.jpeg` | sofa landed, robot eyes + sceptre gold brights on the god |
| `desert-pan-1100.jpeg` | busy bright crew zone fills mid-frame |
| `desert-stamp-1615.jpeg` | platform in upper half, blocks/seal brights, pyramid face below |
| `desert-cursorpass-1730.jpeg` | sofa pair + crossing Courier brights across mid-frame |
| `desert-portal-2150.jpeg` | **doorway max-255 centre cells, pylon dark at the sides** |

**Honest limitation:** this lane's runtime model has no image recognition, so I
could not personally *see* the frames. I verified them two ways instead:
(a) the pixel-grid probe above (objective region luminance/peak data per
frame), and (b) a vision review delegated to a grok CLI lane over the saved
screenshots — see `notes/vision-review-grok.md` (section below updates with its
findings and any fixes applied).

## Vision review (grok lane)

(pending — will be filled when the lane reports)

## Checks

- `node node_modules/hyperframes/dist/cli.js check --json` (from `demos/agent-pronounce`): **ok: true — 0 lint errors, runtime ok, 0 findings**. The only 2 warnings are `nested_media_start_basis_ambiguous` in `compositions/app-window.html` (Lane A's generated file, not mine to edit).
- `node tools/guards/no-media.mjs` (from `D:\projects\nx-video`): **checked 304 files; no violations**.
- `node --check` on `src/set-office.js`, `src/set-vortex.js`, `src/set-desert.js`, `src/ptah-god.js`, `src/tour.js`: all OK.
- Scratch mount of all three kinds: no console errors, `__tribunal3d` exposes resolved cues (`rise` 0.6, `contact` 0.58, etc.).
- Determinism: no `Date.now`/`Math.random`/`performance.now` in my files; all randomness is `hash(seed, ...)`.

## Decisions

- **4:5 aspect via a mutable `frame` export** rather than baking 1080×1350 into the camera: Episode 2's 16:9 compositions keep working unchanged; the frame shape is a property of the host canvas at mount time. (Options: per-scene camera forks vs one shared frame module — chose the shared module, changed in place, no old-path shims.)
- **Ptah's speaker id is `Conductor`** (the generated rows use `Conductor` for Ptah's voice, same as the office's O4 room-voice); `ptahRows` filters on that, not the literal name "Ptah".
- **Whiteout via an oversized pose-glued plane** (`depthTest:false`, renderOrder 999, repositioned each frame in `plan.update` from `activeShotAt(...).sample(t)`), because the camera object is created in `mountTour` and not reachable from `plan.update`.
- **Ramp frames built from a hand basis** (`makeBasis(−X, zA×(−X), up-ramp)`): a shortest-arc `setFromUnitVectors(+Z, dir)` flips local +Y downward for ramps running toward −z, which would sink haulers/sledges under the slope.
- **`stamp` ≈ `cursorPass`** (SPEC puts both at the start of D4): shot order re-timed against the real cues — stampTop runs until `stamp+0.99` so the slide-into-row lands on camera; the cursor-crossing shot covers his in-frame window (~16.9–18.8); the portal shot **cuts** (no 26 m swoop) and pushes in with the target pinned to the doorway, so Lane A's app-window grows over a steady centre-frame doorway from `portal` 20.118 to end.
- **`rise` clamped to `sofaLand+0.3` (0.6)** even though the cue says 0.3, so the sofa visibly lands before the god reacts.
- **`ease.backOut` does not exist** in `src/util.js` — hand-rolled the back-out for the seal pop instead of adding an ease (no shared-file edit needed).
- **Crew robots are recoloured `createRobot` rigs with `badge:false`, scale 0.34**, posed by hand each frame (`walk-in-place` from phase math) rather than through the physics spec — they are set dressing, and physics specs are for the talking cast.
- **Vortex robots parented to the sofa, blob decals hidden, manual `apply`** — no physics specs at all in that kind (`specs: {}`, `noSettle`).
- **Cursor's block parented to `ballHead`** so it rides hops, nods and squash.

## Limitations

- This lane could not visually inspect its own frames (no image recognition in this runtime). Objective pixel-grid verification + a delegated grok vision review stand in for eyeballing; if the grok review reports issues I will fix and re-verify, otherwise the composition risks it flags are the first thing to re-check in Studio.
- `notes/scratch-server.mjs` is scratch tooling; delete it (and `notes/scratch-3d.html` if unwanted) before shipping — nothing in `src/` depends on either.
- The office/vortex/desert 3D scenes expose no public API of their own beyond the `mount()` contract; all new behavior lives behind `TOUR_KINDS` entries.
