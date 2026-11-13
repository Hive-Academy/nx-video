# Lane B desert camera/exposure, round 2

## Round 1 (partial contact sheet, 22.4–34.5 s)
First six captures show the white flare is gone, but the HDRI rotation made the sky deep blue and the giant's head is cropped in early frames. Sofa and robots are fully visible. Next adjustment: move the sun just outside the left view, raise the camera aim and widen the hero lens enough for headroom. Other shots still rendering.

Ptah tools and skill discovery were unavailable; native CLI and targeted source reads were used.

## Round 1 continued (37–50.4 s)
The elevated pan reveals the crews and pyramid, but Ptah's head intrudes from the right edge in all three crew frames. The cursor/stamp and portal compositions remain readable. Move the crew camera farther to camera-left and retain a wide lens. The next six frames are rendering.

## Round 1 completed (66.2–72.4 s)
The return is now wide with both robots, but too distant to read as a medium two-shot. The sandstone title transition appears stationary through 72.4 s even though the camera keys interpolate to the wall. This remains the highest risk and needs another capture after the revised framing.

## Round 2 (10-frame review)
Rotating the HDRI sun to -165° removes the white flare while retaining warm rim light and long shadows. Reaiming and widening the hero preserves Ptah's full head. Moving the crew camera to (-12, 5.4, -2) clears Ptah from the foreground and shows the ramps and crews. The D6 camera is closer; the giant's head still clipped, so the final pass widened that lens. The title still displayed the return view at 72.4 s.

## Round 3 (six return/title frames)
A matching title path was added to the return camera keys, and the D6 framing was widened. Both robots and Ptah are now fully visible. All six frames from 67.5 through 72.4 s still show the return view. The title wall is therefore unverified and visibly absent from the last frame.

## Final pass
The first 13 captures show clean hero exposure and an elevated crew wide. The 34.5 s two-shot includes both robots but Claude approaches the left safe-area edge. The cursor/stamp shot was retained. The title camera remains an open defect despite having wall coordinates in the shot keys. Source changes are limited to `src/set-desert.js` and `src/look-desert.js`.

### Final shot table
Global time = local time + 22.067 s. Position and target are world coordinates; arrow denotes the eased endpoint. Cues and boundaries are read from `ctx.cfg.cues` and line timing.

| Shot | Local s | Global s | Position | Target | FOV |
| --- | --- | --- | --- | --- | --- |
| Establish / crane | 0–11.821 | 22.067–33.888 | (-1.2,.62,8.2) → (-.9,1.35,8) | (-.7,1.65,-1) → (-.5,2.75,-2.6) | 58 |
| Sofa two-shot | 11.821–14.821 | 33.888–36.888 | (-.7,1.45,6.6) → (-.65,1.5,6.55) | (.1,.8,1.2) → (.15,.85,1.2) | 55 |
| Crew pan | 14.821–19.901 | 36.888–41.968 | (-12,5.4,-2) → (-10.4,5.4,-2) | (-7,.8,-24) → (-6,.8,-24) | 64 |
| Cursor / stamp | 19.901–27.139 | 41.968–49.206 | `passCam` → 12% toward `passLook` | `passLook` | 53 → 48 |
| Portal | 27.139–43.939 | 49.206–66.006 | `portalCam` → .55 m through doorway | `portalLook` | 46 → 42 |
| D6 return | 43.939–48.365 | 66.006–70.432 | (-.7,1.5,8.2) → (-.65,1.52,8.15) | (-.2,1.85,.2) → (-.15,1.9,.2) | 55 |
| Title wall path | 48.365–50.365 | 70.432–72.432 | D6 endpoint → pylon local (3.6,4.5,-3) | D6 target → pylon local (3.6,4.5,-.85) | 55 → 32 |

The title shot is 2 s because the binding title cue is only 2 s before the desert scene ends. This conflicts with Direction v2's 3 s minimum. The rendered title transition does not show the wall; this is unresolved.

### Per-frame scorecard
S=subject, D=set, L=light, E=effect, T=text/safe area, C=continuity. Scores below 4 are explicit failures.

| Global s | S | D | L | E | T | C | Finding |
| --- | -: | -: | -: | -: | -: | -: | --- |
| 22.4 | 4 | 4 | 4 | 4 | 4 | 4 | Landing reads |
| 23.4 | 4 | 4 | 4 | 4 | 4 | 4 | Dust clears |
| 24.6 | 4 | 4 | 4 | 4 | 4 | 4 | Crane rises |
| 25.4 | 4 | 4 | 4 | 4 | 4 | 4 | Giant fully framed |
| 30 | 4 | 4 | 4 | 4 | 4 | 4 | Hero holds |
| 34.5 | 3 | 4 | 4 | 4 | 3 | 3 | Claude near left safe-area edge |
| 37 | 4 | 3 | 4 | 4 | 3 | 4 | Left ramp touches frame edge |
| 39.5 | 4 | 3 | 4 | 4 | 3 | 4 | Left ramp touches frame edge |
| 41.5 | 4 | 3 | 4 | 4 | 3 | 4 | Left ramp touches frame edge |
| 43 | 4 | 4 | 4 | 4 | 4 | 4 | Cursor/stamp held |
| 46 | 4 | 4 | 4 | 4 | 4 | 4 | Cursor/stamp held |
| 49.3 | 4 | 4 | 4 | 4 | 4 | 4 | Portal glow |
| 50.4 | 4 | 4 | 4 | 4 | 4 | 4 | App resolves |
| 66.2 | 3 | 4 | 4 | 4 | 4 | 3 | Return begins before robots settle |
| 67.5 | 3 | 4 | 4 | 4 | 4 | 3 | Both robots visible, but visually apart from sofa |
| 69.8 | 3 | 4 | 4 | 4 | 4 | 3 | Both robots visible, but visually apart from sofa |
| 71 | 2 | 2 | 4 | 2 | 4 | 2 | Title tilt still on return view |
| 71.8 | 2 | 2 | 4 | 2 | 4 | 2 | Title tilt still on return view |
| 72.4 | 1 | 1 | 4 | 1 | 4 | 1 | No sandstone fill at scene end |

### Verification
`node node_modules/hyperframes/dist/cli.js check --json` returned `ok: true` (after the expected render-ready warning). `node tools/guards/no-media.mjs` passed: 424 files checked, no violations. The final check and 19 labelled snapshots were run after the source edits. Ptah tools and skill discovery were unavailable, so native CLI and targeted source reads were used. No approved still was supplied; comparisons use Direction v2 and the round 1 contact sheet.

