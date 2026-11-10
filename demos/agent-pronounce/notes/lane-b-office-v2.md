# Lane B office and vortex, landscape pass

## Round 1 findings

Reviewed 22 labelled frames at the requested timestamps in `snapshots/lane-b-office-v2/round1-contact.jpg`. At 0 and 1.2 s the skyline is broad but a plaster wall edge interrupts it and the camera scarcely moves. By 2.4 s the view drops rapidly to a high, distant sofa view; the movement feels like a tilt followed by a cut in speed. The hero two-shot reads, though the bookcase is cut by the left edge and the foreground lacks depth. The laptop, robots, plant and lamp are visible. At 12.5–14.6 s the bolt shot keeps the robots and spark but crops the upper bolt path. The whiteout is full by 16.3 s and remains white through 18.4 s. The vortex has full corner coverage, a central sofa and both robots, and a warm sand palette at 21.9 s. Its entrance from office white needs a clearer visual fall-away.

## Changes

- Rebuilt the 0–4 s entrance as one eased outside-to-inside dolly, with the aim turning toward the sofa early enough to keep both heads visible at 2.4 s.
- Moved the bookcase inward, raised the hero aim slightly, and kept the plant, lamp, robots and laptop inside the wide frame.
- Raised and widened the bolt camera so the fork and ceiling endpoint remain visible. The room dip, flicker and robot breathing, glances and blinks remain cue-driven or continuously animated.
- Added a white reveal at the vortex entrance and a piece of office floor that drops from beneath the sofa. The sand tunnel still fills the corners; the sofa stays central.

## Shot table

| Shot | Local time | Duration | Camera/action |
|---|---:|---:|---|
| Office entrance | 0–4.000 | 4.000 s | Eased skyline-to-sofa move through glass |
| Office hero | 4.000–12.400 | 8.400 s | Wide two-shot, laptop spark and dip |
| Office bolt | 12.400–18.534 | 6.134 s | Low wide, full bolt, flash and held white |
| Vortex | 0–3.500 | 3.500 s | Central sofa tumble, falling floor, sand glow |

## Final frame scorecard

Scores are 1–5: S = staging, D = depth, L = lighting, E = effects, T = transition/motion, C = composition. Effects scores include intentional calm frames. Frames are from the final labelled contact sheet.

| Global time | S | D | L | E | T | C |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 4 | 4 | 4 | 4 | 4 | 5 |
| 1.2 | 4 | 4 | 4 | 4 | 4 | 5 |
| 2.4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 3.6 | 4 | 4 | 4 | 4 | 4 | 4 |
| 4.5 | 4 | 4 | 4 | 4 | 4 | 4 |
| 6 | 4 | 4 | 4 | 4 | 4 | 4 |
| 8.5 | 4 | 4 | 4 | 4 | 4 | 4 |
| 10.4 | 4 | 4 | 5 | 5 | 4 | 4 |
| 10.8 | 4 | 4 | 4 | 4 | 4 | 4 |
| 12.5 | 4 | 4 | 4 | 4 | 4 | 4 |
| 13.4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 14.0 | 4 | 4 | 5 | 5 | 4 | 4 |
| 14.6 | 4 | 4 | 5 | 5 | 4 | 4 |
| 15.9 | 4 | 4 | 4 | 4 | 4 | 4 |
| 16.3 | 4 | 4 | 5 | 5 | 5 | 5 |
| 17.5 | 4 | 4 | 5 | 5 | 5 | 5 |
| 18.4 | 4 | 4 | 5 | 5 | 5 | 5 |
| 18.7 | 4 | 4 | 4 | 4 | 5 | 4 |
| 19.6 | 4 | 5 | 5 | 5 | 4 | 5 |
| 20.6 | 4 | 5 | 5 | 5 | 4 | 5 |
| 21.2 | 4 | 5 | 5 | 5 | 4 | 5 |
| 21.9 | 4 | 5 | 5 | 5 | 4 | 5 |

No score falls below 4. Remaining visual limitation: the office foreground rug supplies depth but is sharp rather than optically soft; the wide camera uses no depth-of-field pass. The shelf is fully visible but close to the left safe area. The 2.4 s passing view favors the robots and temporarily hides the laptop; it is legible again by the hero shot.

## Checks

`node node_modules/hyperframes/dist/cli.js check --json`: `ok: true`, zero runtime errors. It emitted the documented readiness warning before the JSON. Existing warnings concern unrelated sub-composition media timing, app sweep animation, full-bleed canvas edges and intro text contrast. `node tools/guards/no-media.mjs` from the repository root: passed, 424 files checked and no violations. No Ptah MCP tool or matching skill was available in this lane; the native CLI and labelled contact sheet were used for verification.
