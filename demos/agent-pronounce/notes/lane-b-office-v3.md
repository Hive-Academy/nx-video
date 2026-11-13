## Skills loaded

- `D:/projects/nx-video/tools/skills/video-quality-bar/SKILL.md`: “A lane that has not met this bar has not finished, whatever its exit code.”
- `D:/projects/nx-video/tools/skills/threejs-scene-craft/SKILL.md`: “Everything is a pure function of the seek time `t`. Seed variation with `hash`, `hashRange` and `noise1` (`util.js`).”

## Changes

- `src/set-office.js`: Replaced removed cue reads and whiteout with eight speaking rows, five eased shots, a cue driven storm, sand particles, room dip, plant motion, and final laptop push.
- `src/look-office.js`: Removed wall bolt and flash geometry; added a detailed storm canvas on the laptop and exposed the plant handle.
- `src/set-vortex.js`: Replaced white entry and exit with a brief brown veil and forward camera travel; removed falling floor behavior.
- `src/look-vortex.js`: Recoloured tunnel to dark storm, sand, and gold; removed the falling floor mesh.

## Shot list

| Shot | Start–end | Framing | Move |
| --- | --- | --- | --- |
| 1 | 0–4.000 | Skyline to two-shot | Existing eased entrance |
| 2 | 4.000–10.827 | Two-shot to laptop | Push begins at `landingIn` − 0.8 |
| 3 | 10.827–15.327 | Laptop to two-shot | Hold and eased return before `landingOut` |
| 4 | 15.327–33.898 | Two-shot | Held conversation with robot motion |
| 5 | 33.898–36.898 | Two-shot to storm screen | Eased push from `pull` to `through` |
| Vortex | 36.898–40.398 | Sofa ahead in tunnel | Forward travel and glow after `land` |

## Look-dev match

The v2 office skyline, sofa, laptop, plant, lamp, and dusk palette remain in the captured shots. The vortex retains the sand tunnel and tumbling GLB sofa and robots with revised storm colours. No separately approved v3 look-dev still was supplied.

## Scorecard

All paths below are relative to `snapshots/lane-b-office-v3/`. Scores are subject, set, light, effect, text/safe area, continuity; every score must be at least 4 to pass. The labelled 600 px/cell sheet is `snapshots/lane-b-office-v3/contact-sheet.jpg`.

| Time | Frame | Subject | Set | Light | Effect | Text/safe | Continuity | Result |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 0 | batch1/frame-00-at-0s.png | 4 | 4 | 4 | 4 | 5 | 4 | Pass |
| 3.5 | batch1/frame-01-at-3.5s.png | 4 | 4 | 4 | 4 | 5 | 4 | Pass |
| 5 | batch1/frame-02-at-5s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 8.5 | batch1/frame-03-at-8.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 10.4 | batch1/frame-04-at-10.4s.png | 4 | 4 | 4 | 4 | 5 | 4 | Pass |
| 10.8 | batch1/frame-05-at-10.8s.png | 4 | 4 | 3 | 4 | 3 | 4 | Fail |
| 13 | batch1/frame-06-at-13s.png | 4 | 4 | 3 | 4 | 3 | 4 | Fail |
| 15.4 | batch1/frame-07-at-15.4s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 16.2 | batch2/frame-00-at-16.2s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 18.5 | batch2/frame-01-at-18.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 21 | batch2/frame-02-at-21s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 24.2 | batch2/frame-03-at-24.2s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 28 | batch2/frame-04-at-28s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 29.9 | batch2/frame-05-at-29.9s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 32 | batch2/frame-06-at-32s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 34.2 | batch2/frame-07-at-34.2s.png | 4 | 4 | 3 | 3 | 5 | 4 | Fail |
| 35.3 | batch3/frame-00-at-35.3s.png | 4 | 4 | 4 | 4 | 5 | 4 | Pass |
| 35.8 | batch3/frame-01-at-35.8s.png | 4 | 4 | 4 | 4 | 5 | 4 | Pass |
| 36.3 | batch3/frame-02-at-36.3s.png | 4 | 4 | 4 | 4 | 5 | 4 | Pass |
| 36.8 | batch3/frame-03-at-36.8s.png | 4 | 4 | 4 | 3 | 5 | 3 | Fail |
| 36.95 | batch3/frame-04-at-36.95s.png | 4 | 4 | 4 | 4 | 5 | 3 | Fail |
| 37.5 | batch3/frame-05-at-37.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 38.5 | batch3/frame-06-at-38.5s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 39.6 | batch3/frame-07-at-39.6s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| 40.2 | batch4/frame-00-at-40.2s.png | 4 | 4 | 4 | 4 | 4 | 4 | Pass |

## Verification

- `node --check` on all four changed JS files: exit 0.
- Four sequential HyperFrames snapshot batches: exit 0; all 25 requested times captured. Batches 1 and 3 were recaptured after fixes. The CLI's added end-of-timeline frame is excluded from the sheet.
- ffmpeg contact sheet: 5 × 5 grid, 600 px/cell, labelled by time, reviewed visually.
- `node node_modules/hyperframes/dist/cli.js check --json`: exit 0, `ok: true`; expected render-ready warning, three lint warnings, no errors.
- From `D:/projects/nx-video`, `node tools/guards/no-media.mjs`: exit 0; 432 files checked, no violations.
- No Ptah tools or skill discovery tools were available; local reads and CLI checks were used.

## Decisions

- The pending landing-page overlay belongs to another lane. The 3D laptop is framed beneath it from `landingIn` to `landingOut`.
- Existing GLB assets remain. The new storm texture and particles are procedural and deterministic.

## Credits

No new external assets. Existing GLBs and images retain project credits.

## Open defects

- At 10.8 and 13 s, the 3D laptop's right half is glaring white and its wordmark is hard to read. The pending landing video should cover this interval; if it does not, the laptop material needs a glare fix.
- At 34.2 s, the rumble light dip and storm are too subtle. Increase screen storm and flicker while keeping faces readable.
- At 36.8 → 36.95 s, the office storm fills the frame but its flat streak texture visibly changes to the detailed vortex tunnel. Match the textures across the boundary or overlap tunnel imagery across both scenes.
- The robots flinch and turn toward the laptop, but their hands do not visibly grip the sofa during `pull`; add hand placement/arm acting on the existing GLB rig.
- No separate approved v3 look-development still was supplied.
