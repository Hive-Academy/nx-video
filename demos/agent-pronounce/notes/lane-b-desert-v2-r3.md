# Lane B desert round 3

## Root cause and title fix
The title cue and shot selection are active: the final contact sheet shows the camera leaving the D6 wide at 71.2 s. The old title endpoint was placed at pylon-local z=-3, behind the tower, looking toward z=-0.85, so it could not produce a clean camera-facing sandstone fill. The return sampler also contained a duplicate title-start key. I moved the endpoint to the front, removed that duplicate, and added a hidden plain sandstone slab that appears only during the title move. A vertex-color gradient gives it warm top-left light. At 71.8, 72.2 and 72.4 s the frame is bare sandstone edge to edge.

## Four requested defects
- Title tilt: **fixed**. 71.2 s shows the move; 71.8, 72.2 and 72.4 s show sandstone only. The 2 s cue exception remains.
- D2 two-shot: **fixed with a small safe-area limitation**. 34.5 and 36 s show both robots fully and at similar scale from the front, clear of the outer 5%. Their feet approach the lower 22% zone, although the caption bar does not cover them.
- Crews pan: **improved, not fully fixed**. 37.5, 39.5 and 41.5 s show a closer lateral view, all three banners and the ramps, with no cropped worker. The workers remain smaller than the intended middle-third height.
- Reveal: **fixed with a framing limitation**. 22.3 through 25.6 s visibly crane and pull back from the sofa to the prior hero wide, followed by a slow push through 29 s. Part of the giant remains visible at the top right during the low opening; the base-only goal is not fully met.

The hero wide, cursor/stamp, doorway, and D6 compositions were left as they were. Source edits are confined to `src/set-desert.js`; `src/look-desert.js` was not changed in this round. The labelled contact sheet has all 18 requested times, at 600 px per cell. It was inspected against the four defect descriptions and the round 2 contact sheet. The first snapshot attempt timed out during navigation; the successful final captures are in `final-a` and `final-b`.

## Verification
`node node_modules/hyperframes/dist/cli.js check --json`: `ok: true`, after the expected render-ready warning. Existing warnings concern app-window timing/GSAP, edge detection, and intro contrast. `node tools/guards/no-media.mjs` from `D:/projects/nx-video`: passed, 424 files checked, no violations. Ptah tools and skill discovery were unavailable; native targeted reads and the HyperFrames CLI were used.
