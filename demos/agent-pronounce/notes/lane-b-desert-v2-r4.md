# Lane B desert round 4

Edited only `src/set-desert.js`. The final 16-frame labelled sheet is `snapshots/lane-b-desert-v2-r4/contact-sheet.jpg`.

## Defect status

- **D6 wander — fixed.** The return sampler previously interpolated from `d6` directly to the title wall endpoint, which sent the camera across the crews during the line. A `titleTilt` hold key now keeps one sofa shot from 66.8 through 70.2 s; the 69.2 s frame proves the crew detour is gone. The return begins at the doorway at 66.2 s. Both robots face camera by 67.6 s; Codex is unobstructed. The giant is fully visible behind them. The robots are smaller than a tight medium shot.
- **Title path — improved, partially fixed.** The slab lies along the D6 camera axis, with a repeated sandstone canvas texture and course lines. The 71.2 s frame shows a forward push toward it, without the previous pan across the crews. The 72.4 s frame is bare sandstone edge to edge. At 72.0 s the sofa and robots still touch the bottom edge, so the bare-wall endpoint is late relative to the desired 72.2 s margin; the repeated gradient also creates more visible blocks than the requested subtle texture.
- **Reveal opening — improved, partially fixed.** Frames 22.3–24.4 s show both robots from the front with the sofa and landing dust; the giant is hidden until the rise and is visible in the 25.6 s hero wide. The robots remain in front of the sofa rather than seated on it, and the shot is closer to a frontal view than a three-quarter view.

## Verification

- Requested snapshots captured in `final-a` and `final-b`; contact sheet contains all 16 requested times at 600 px per cell.
- `node node_modules/hyperframes/dist/cli.js check --json`: `ok: true` after the expected render-ready warning. Existing warnings concern nested app-window media timing and intro contrast.
- `node tools/guards/no-media.mjs` from `D:/projects/nx-video`: passed, 424 files checked, no violations.
- Ptah tools and skill discovery were unavailable; native targeted reads and HyperFrames CLI were used.
