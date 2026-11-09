## Skills loaded

- `D:/projects/nx-video/.agents/skills/video-quality-bar/SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `D:/projects/nx-video/.agents/skills/threejs-scene-craft/SKILL.md`: "Everything is a pure function of the seek time `t`."
- `C:/Users/abdal/.claude/skills/hyperframes-core/SKILL.md`: "No render-time clocks / unseeded `Math.random` / network / input-state; `repeat: -1` only under a finite root `data-duration`"
- `C:/Users/abdal/.claude/skills/hyperframes-cli/SKILL.md`: "Passing checks alone is not a reason to render."
- Free media sourcing was not loaded because no new CC0 asset was needed.
- `D:/projects/nx-video/tools/skills/video-quality-bar/SKILL.md`: "A lane that has not met this bar has not finished, whatever its exit code."
- `D:/projects/nx-video/tools/skills/threejs-scene-craft/SKILL.md`: "Everything is a pure function of the seek time `t`."

## What changed

Continued the inherited `ctx.useLook('desert')` animation. Re-aimed the crew pan at the work lanes, moved the Cursor/stamp camera off the block axis, framed Claude from the front during D2, added a Ptah answer shot for D5, and moved cuts away from line starts. No media, engine, timing, or other-lane files changed. `src/ptah-god.js` remains unimported.

## Shots and cues

| Shot | Local range, s | Action |
| --- | --- | --- |
| establish | 0–2.55 | Approved hero view; `sofaLand` 0.300, silent look-around 0.3–1.5, `rise` 1.500 |
| ptahLow | 2.55–7.321 | Ptah D1, low push; glowing eyes and sceptre |
| claudeTwo | 7.321–11.669 | Claude D2, front face |
| panCrews | 11.669–17.501 | D3, `pan` 12.289; crews, banners, sleds and ramp |
| cursorStamp | 17.501–20.010 | `cursorPass` 18.001, `stamp` 18.110, D4 |
| ptahAnswer | 20.010–22.618 | D5 Ptah answer; cut is 0.408 s before D5 start |
| portal | 22.618–28.415 | Lit centred pylon, D6 and app-window overlay |

All shots last at least 2.509 s. Keyed moves ease. Word envelopes drive Ptah's eye and sceptre intensity; row timing drives the other speakers. Scene movement uses seeded `hash`/`noise1` and seek time.

## Snapshots

Final multi-frame run: `snapshots/lane-desert/frame-00-at-21.7s.png` through `frame-12-at-48.5s.png`. Contact sheets: `snapshots/lane-desert/contact-sheet-1.jpg` and `contact-sheet-2.jpg`. Both sheets and the 30 s frame were opened. The CLI also emitted an out-of-scene endcard at 60.916 s; excluded below.

## Scorecard

Scores are 1–5 at 4:5. S = subject, D = set dressing, L = light, E = effect, T = text/safe area, C = continuity. Paths below are under `snapshots/lane-desert/`.

| Absolute s | Frame | S | D | L | E | T | C | Result |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 21.70 | frame-00-at-21.7s.png | 4 | 4 | 4 | 3 | 4 | 5 | FAIL |
| 22.30 | frame-01-at-22.3s.png | 4 | 4 | 4 | 4 | 4 | 5 | pass |
| 23.20 | frame-02-at-23.2s.png | 4 | 4 | 4 | 4 | 4 | 5 | pass |
| 25.50 | frame-03-at-25.5s.png | 3 | 3 | 4 | 4 | 4 | 4 | FAIL |
| 30.00 | frame-04-at-30s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 33.80 | frame-05-at-33.8s.png | 3 | 3 | 3 | 4 | 4 | 4 | FAIL |
| 36.50 | frame-06-at-36.5s.png | 3 | 4 | 3 | 4 | 4 | 4 | FAIL |
| 39.40 | frame-07-at-39.4s.png | 3 | 4 | 4 | 3 | 4 | 4 | FAIL |
| 39.50 | frame-08-at-39.5s.png | 3 | 4 | 4 | 3 | 3 | 4 | FAIL |
| 42.50 | frame-09-at-42.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 44.10 | frame-10-at-44.1s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 46.00 | frame-11-at-46s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 48.50 | frame-12-at-48.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |

## Look-dev match

The opening frames at 21.70 and 22.30 were visually compared with `snapshots/lookdev/desert.png`: Ptah's scale and position, cap, sceptre, two hosts, sand texture, pyramid, pylon, banners, and warm palette match. Animated dust and expressions differ as intended. The still is more legible than the D1 low close-up. The approved look has one main pyramid ramp; crew banners and sled lanes are distinct, but separate built ramps are absent.

## Determinism

Standalone `snapshots/lane-desert/single/frame-00-at-30s.png` and multi-frame `frame-04-at-30s.png` have identical SHA-256: `9C6A7B2E6B36AFA78429DAAA58D4EECB3F4B2CA765A1632D9985704C829D7435`. No random, clock, or timer calls appear in `src/set-desert.js`.

## Checks

- `node --check src/set-desert.js`: pass.
- `node node_modules/hyperframes/dist/cli.js check --json`: `ok: true`; no lint or runtime errors. Existing 2 lint warnings and 1 canvas-edge layout warning remain.
- `node tools/guards/no-media.mjs` from repository root: pass, 304 files, no violations.
- Final 13 requested absolute-time snapshots: all saved; no visible 404 or console errors in CLI output.
- Ptah MCP tools were absent from the connected tool list. Native reads, CLI snapshots, and image viewing were used.

## Open defects

- Landing dust is too subtle at 21.70 to read at phone size (effect 3). Enlarge particles or add a radial puff.
- D1 low shot crops Ptah's head and loses depth at 25.50 (subject and dressing 3). Pull the camera back and lower its aim.
- At 33.80 and 36.50, the crew reveal is blown out near the sky and the workers are small (subject/light 3). Reframe closer to the front sleds and reduce glare.
- Cursor's speed trail and stamp are too small at 39.40–39.50 (effect 3); Cursor is partly cut by the lower edge, and the D4 caption overlaps his face at 39.50 (subject/text 3). Raise Cursor in frame, enlarge the seal and dust, and keep the caption clear.
- Separate physical ramps for each crew are absent. Add them to meet the binding set wording literally.

## Decisions

The inherited file passed `node --check` and rendered the approved opening look, so I continued it instead of rebuilding. Initial snapshots exposed camera occlusion; the changes targeted those shots. The final frame review still fails the full quality gate as recorded above. No engine change was needed.

## Clarifications Needed

None. The remaining defects are implementation work within this lane's scope.

## Credits

No new media. Existing approved look assets and licences remain in the project credits and manifest.

## Round 2

The revised scorecard and open defects below supersede the round 1 entries above.

### What changed

- Preserved the approved establish camera and the 42.5 s Ptah shot. Added a short radial landing puff, softened the dust sprite, and kept a seeded 0.15 s impact shake and sofa bounce.
- Pulled back and lowered the D1 camera so Ptah's complete head, lapis cap and beard fit against the sky, with the ramp and crew yard behind him. Reduced sky background intensity in that shot to retain its blue gradient. Hid Ptah and his sceptre only in the D2 reverse, removing the pole and beard from Claude's frame.
- Added two cloned physical ramps during the crew shot, glyphs on the banners, and a closer westward pan with lower exposure. The near crew has four readable robots and a loaded sled.
- Enlarged Cursor and his carried block, added a six-streak speed trail and dust, placed the inspector over the intended block, and put a glowing seal on its camera-facing side with a ground dust ring. The stamp head now raises and slams on the cue.
- Rebuilt the portal lighting with a warm white-gold gradient, emissive spill, relief bands and rays. Framed both hosts as small back-facing silhouettes below the centred doorway, behind the growing app overlay.

### Shots and cues

The shot boundaries are unchanged from round 1: establish 0–2.55, Ptah low 2.55–7.321, Claude 7.321–11.669, crew pan 11.669–17.501, Cursor/stamp 17.501–20.010, Ptah answer 20.010–22.618, portal 22.618–28.415. The shortest shot remains 2.509 s. The D5 cut remains 0.408 s before its line start; all camera moves ease. `sofaLand`, `rise`, `pan`, `cursorPass`, `stamp`, and `portal` retain their named cue times.

### Snapshots

The final 13 absolute-time frames are `snapshots/lane-desert/round2/frame-00-at-21.7s.png` through `frame-12-at-48.5s.png`, with `contact-sheet-1.jpg` and `contact-sheet-2.jpg` in the same folder. I opened each frame individually as well as both sheets. The CLI's extra 60.916 s endcard frame is outside the desert and is not scored.

### Revised scorecard

Scores are 1–5 at 4:5. S = subject, D = set dressing, L = light, E = effect/action, T = text/safe area, C = continuity. A row passes only when every category is at least 4. Frame names below are under `snapshots/lane-desert/round2/`.

| Absolute s | Frame | S | D | L | E | T | C | Result |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 21.70 | frame-00-at-21.7s.png | 4 | 4 | 4 | 4 | 4 | 5 | pass |
| 22.30 | frame-01-at-22.3s.png | 4 | 4 | 4 | 4 | 4 | 5 | pass |
| 23.20 | frame-02-at-23.2s.png | 4 | 4 | 4 | 4 | 4 | 5 | pass |
| 25.50 | frame-03-at-25.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 30.00 | frame-04-at-30s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 33.80 | frame-05-at-33.8s.png | 4 | 3 | 4 | 4 | 4 | 4 | FAIL |
| 36.50 | frame-06-at-36.5s.png | 4 | 3 | 4 | 4 | 4 | 4 | FAIL |
| 39.40 | frame-07-at-39.4s.png | 4 | 4 | 4 | 3 | 4 | 4 | FAIL |
| 39.50 | frame-08-at-39.5s.png | 4 | 4 | 4 | 3 | 4 | 4 | FAIL |
| 42.50 | frame-09-at-42.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 44.10 | frame-10-at-44.1s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 46.00 | frame-11-at-46s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 48.50 | frame-12-at-48.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |

### Look-dev match

The 21.7–23.2 s composition retains the approved `snapshots/lookdev/desert.png` view: Ptah's size, cap, beard, sceptre, sofa, hosts, pylon, pyramid and warm sand. The landing puff lasts 0.55 s and clears before 22.3 s; the silent look-around remains. The D1 shot now keeps Ptah's head whole against a blue sky, with the pyramid ramp and work yard visible behind.

### Determinism

The final standalone 39.5 s frame and the final multi-frame 39.5 s frame matched SHA-256: `686A558288DC6655F663243138ADA301AC4252CC1E05FEA0EE270F8C3D65FDC4`. All motion remains a pure function of `t`, seeded `hash` and `noise1`; there is no `Math.random` or clock.

### Checks

Final `node --check src/set-desert.js` passed. Two `check --json` attempts hit the CLI's default 10 s browser navigation timeout; `node node_modules/hyperframes/dist/cli.js check --json` returned `ok: true`, with 0 errors, 2 nested media warnings, and office/desert canvas-edge warnings. Final `node tools/guards/no-media.mjs` from `D:/projects/nx-video` passed: 304 files, no violations. No new media or manifest edit. Ptah MCP tools were absent; native file tools and Hyperframes CLI supplied the evidence.

### Open defects

- The three ramps are built and visible in a wide test, but the 33.8 and 36.5 s final compositions show only one ramp clearly and two banners. A wide test showed all three ramps but made the workers tiny and brought back strong sky glare. The final near crew is readable; the simultaneous three-ramp composition remains unmet.
- Cursor and his carried block are clear in the middle third, and the stamp leaves a large glowing glyph and dust ring. The speed streak reads faintly at phone size, and the inspector does not visibly hold the raised stamp; the stamp head appears detached at 39.4 s. The full stamp gesture remains unmet (E=3 at 39.4 and 39.5 s).

### Decisions

Kept the inherited look-based scene and its approved opening. Retained the close crew pan after testing a wider three-ramp view; the close shot preserves worker readability and avoids the clipped sky, while the unmet ramp composition is recorded above. Kept the D5 camera unchanged. No engine change was required.

### Clarifications Needed

None. The remaining work is in this lane's scene and camera composition.

## Round 3

### Changes

Edited only `src/set-desert.js` and this note. Kept all shot boundaries and cue times. Warmed and shortened the ramp meshes, enlarged the near crew, placed their sled and line, replaced Cursor's opaque bars with tapered additive trails, enlarged the inspector and connected a visible pole to the stamp's front-facing plate, and moved the portal hosts inward with a stronger gold outline and three-quarter facing. No new assets; no credits change. All motion remains computed from seek time and seeded `hash`/`noise1`.

### Scorecard

S = subject, D = dressing, L = light, E = effect/action, T = text/safe area, C = continuity. Scores are 1–5. Every row needs at least 4 to pass. Paths are under `snapshots/lane-desert/round3/`. I opened all 13 requested frames individually and both contact sheets.

| s | Frame | S | D | L | E | T | C | Result |
|---:|---|---:|---:|---:|---:|---:|---:|---|
| 21.7 | frame-00-at-21.7s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 25.5 | frame-01-at-25.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 30 | frame-02-at-30s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 33.8 | frame-03-at-33.8s.png | 3 | 3 | 4 | 3 | 4 | 4 | FAIL |
| 36.5 | frame-04-at-36.5s.png | 3 | 3 | 4 | 3 | 4 | 4 | FAIL |
| 38.9 | frame-05-at-38.9s.png | 4 | 4 | 4 | 3 | 4 | 4 | FAIL |
| 39.2 | frame-06-at-39.2s.png | 4 | 4 | 4 | 3 | 4 | 4 | FAIL |
| 39.4 | frame-07-at-39.4s.png | 4 | 4 | 4 | 3 | 4 | 4 | FAIL |
| 39.5 | frame-08-at-39.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 42.5 | frame-09-at-42.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 44.1 | frame-10-at-44.1s.png | 4 | 4 | 4 | 4 | 4 | 4 | pass |
| 46 | frame-11-at-46s.png | 3 | 4 | 4 | 4 | 4 | 4 | FAIL |
| 48.5 | frame-12-at-48.5s.png | 3 | 4 | 4 | 4 | 4 | 4 | FAIL |

### Look-dev match

Compared `snapshots/lookdev/desert.png` to `round3/frame-00-at-21.7s.png`: approved Ptah, sofa, two hosts, pylon, pyramid, warm sand, and banner positions persist. The crew still does not match the requested working-site composition. The stamp and portal framing improved, though the stamp lift and grip remain less clear than the target.

### Checks

`node --check src/set-desert.js` passed. `node node_modules/hyperframes/dist/cli.js check --json` returned `ok: true`, zero errors, two existing nested-media warnings, and office/desert canvas-edge warnings. The specified 13-frame snapshot command completed and produced `contact-sheet-1.jpg` and `contact-sheet-2.jpg`; copied the first to required `contact-sheet.jpg`. `node tools/guards/no-media.mjs` passed: 304 files, no violations. The CLI also wrote an out-of-scene 60.916 s endcard, excluded from this scorecard.

### Open defects

- **Crew 33.8/36.5:** Four near workers and their rope lines are readable, two warm ramps are visible, and the blue sky is controlled. The loaded sled mostly exits left, so the ropes point out of frame and no sled clearly climbs a ramp. The ramps still read as separate flat planks rather than a coherent mudbrick work site; a third ramp is not legible. Rebuild the hauling action as one cluster aligned to the main ramp, and show the other-face ramps in the same 3/4 view.
- **Cursor/stamp 38.9-39.5:** The front-facing plate, pole and glowing seal now read in the same frame, but the robot has no visible hand gripping the pole and the short lift between 39.4 and 39.5 is subtle. Cursor's tapered additive trail is not apparent at the sampled frames. Give the stamp a clear grasp and make the raised-to-impact motion more legible.
- **Portal 44.1-48.5:** Both hosts have feet, visible face colors and strong gold edges at 44.1. The specified app overlay obscures them by 46 and 48.5 while its approved timing remains unchanged.

## Round 4

### Changes

- Replaced the crew shot ramp/plank presentation with three sand lanes, each with four staggered walking robots, a loaded wooden sled, a taut main rope and body harness lines. The low camera tracks alongside the near lane.
- Replaced the mallet and plate with a floating gold cylinder and thin cyan light tether. The stamp rises, cocks back, strikes the camera-facing block face, and leaves the existing glyph and dust ring. Enlarged Cursor's tapered additive streaks and increased contact shake.

### Per-frame scorecard

| Absolute time | Beat | Score / 5 | Observation |
| --- | --- | --- | --- |
| 33.8 | Crew | 3 | Four near workers and loaded sled visible; sled sits left of workers and rope direction is hard to read. |
| 35 | Crew | 3 | Tracking movement reads; all three lanes in frame but overlapping near the sleds. |
| 36.5 | Crew | 3 | Sand, pyramid, two banners and several workers visible; loose foreground blocks remain visible. |
| 38.5 | Cursor trail | 2 | Cursor is small in the wide transition and streak is not legible. |
| 38.9 | Stamp anticipation | 4 | Inspector is beside block; floating cylinder, face glyph and tether visible. |
| 39.2 | Stamp anticipation | 4 | Stamp rises clearly with tether still attached. |
| 39.4 | Stamp cock back | 4 | Raised stamp and cocked pose are clear. |
| 39.5 | Stamp contact | 3 | Stamp reaches block face; glyph and dust effect are partly obscured. |
| 40 | Seal hold | 2 | Cursor foreground body occludes block seal and stamp. |
| 44.1 | Portal continuity | 5 | Approved gold rimmed hosts and portal composition preserved. |

### Checks

- `node --check src/set-desert.js`: pass. HyperFrames `check --json`: `ok: true`, two existing lint warnings and two canvas-edge warnings; no runtime errors. Requested 10 snapshots saved in `snapshots/lane-desert/round4/` and both CLI contact sheets inspected. `node tools/guards/no-media.mjs`: pass (304 files, no violations).

### Open defects

- Crew layout remains only partially legible: near sled appears left of the walkers, rear lanes overlap, and loose foreground blocks distract. Cursor streak at 38.5 is not legible. At 39.5-40 the stamp and seal are partly occluded, so the full impact payoff is unmet.



## Round 5

### Changes

- Reframed the three-crew haul with a closer, lower tracking camera. Enlarged the near robots, thickened the tan main ropes and body harnesses, and hid loose stone blocks during this shot. Kept three loaded sleds and seeded staggered steps.
- Made Cursor's sampled path drive its root position, reduced its scale, and routed it behind the inspector toward frame right. Retimed its additive streaks to the 38.868 s onward pass.
- Reoriented the floating stamp to strike the camera-facing stone side, then lift clear of the glowing seal. Kept the light tether, contact dust and seeded shake. Removed nonuniform inspector squash.

### Per-frame scorecard

| Time | Beat | Score / 5 | Observation |
| --- | --- | --- | --- |
| 33.8 | Crew | 3 | Three loaded sleds and two banners read; near four-robot line is large, but its sled is partly hidden behind the workers. |
| 35 | Crew | 3 | Thick tan rope and harnesses are visible; near robot heads are large, but the line and sled still overlap. |
| 36.5 | Crew | 2 | Near lead robot is cut at the left edge, with a large empty lower sand band. |
| 39.0 | Cursor trail | 3 | Cursor enters at frame right behind the inspector; translucent streaks show but are partly clipped. |
| 39.2 | Cursor / stamp | 3 | Cursor exits right; stamp rises on cyan tether; streaks are visible near frame right. |
| 39.4 | Stamp anticipation | 3 | Stamp is cocked high but clips the top of the frame; inspector remains beside the block. |
| 39.5 | Stamp contact | 3 | Stamp back meets the block face and dust ring appears; the stamp reads as a flat gold disc. Inspector shell stays round. |
| 39.8 | Seal reveal | 4 | Stamp lifts clear and glowing glyph is fully visible on the block face. |
| 40.0 | Seal / Cursor | 4 | Seal remains clear; Cursor has left frame and does not cross the lens. |
| 40.4 | Exit | 4 | Seal persists, stamp floats above, inspector remains beside the block. |

### Checks

- `node --check src/set-desert.js`: pass. HyperFrames `check --json`: `ok: true`, zero runtime errors, two existing app media timing warnings and two canvas-edge warnings. Requested Round 5 snapshots saved at all ten times, plus CLI end frame; all eleven frames opened and inspected. `node tools/guards/no-media.mjs`: pass (304 files, no violations).

### Open defects

- Crew framing still misses the requested composition: near loaded sled is partly occluded, lead robot clips the left edge at 36.5, and empty foreground sand exceeds the 20% target. Stamp contact is aligned with the block side and clears the glyph, but its visible back remains too flat and anticipation clips the upper frame. Cursor streaks are legible only in part at the right edge.
