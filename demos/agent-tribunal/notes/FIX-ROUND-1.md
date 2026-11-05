# Fix round 1

I reviewed `snapshots/contact-sheet.jpg` and its eight supplied frames before editing. The frames show the original defects. Fresh HyperFrames snapshots are still needed to verify the changed geometry and framing.

| Defect | Change | Inspect in next snapshot |
| --- | --- | --- |
| 1. Table robots | `src/scene.js:17,31-34`: use the upright Idle pose, place five robots on the far half of the table, set their height from the scaled model bounds so the tabletop crosses the lower torso, face them toward the camera, raise the Conductor behind the lectern, and move brass nameplates to the front edge. | 12 s, 22 s, 60 s, 77 s: faces and nameplates visible; lower bodies behind table; Conductor above lectern. |
| 2. Table cameras | `src/scene.js:61-62,79-80`: use each cue row's speaker for a 12-frame eased push to head-and-chest framing; whip among all five every six frames in row 17; use Conductor close-ups in rows 18–19 and a wide view in row 20. | 12 s versus 22 s and 60 s versus 77 s should show different speakers; inspect row 17 at 0.2 s intervals, 80–84 s for Conductor, and row 20 for the wide view. |
| 3. Booth framing | `src/scene.js:47-48,61-62`: position the scaled robot from its bounds, lift the camera to eye height, aim so the robot sits left of centre with room to its right, and lower the desk. | 1.5 s and 30 s: full head and eye screen, chest-up crop, desk clear of lower-third. |
| 4. Agent colours | `src/scene.js:14`: replace original body map colour mixing with exact palette material colours, keep roughness at 0.5, and colour/emissively light eye and face meshes. | 12 s, 22 s, 60 s: Claude terracotta, Codex green, Cursor lilac, Antigravity blue, OpenCode yellow, Conductor amber should read separately. |
| 5. Lower-third | `src/build-timing.mjs:51` and regenerated `compositions/booth-*.html:7-9`: lock bar at 650 × 64 px, name at 44 px, tagline at 26 px, and keep the strap inside title-safe. | 1.5 s and 30 s: readable name and tagline, clear of desk. The previous contact sheet was scaled down; these are native 1920 × 1080 sizes. |
| 6. Verdict card | `src/build-timing.mjs:51` and regenerated `compositions/table-verdict.html:15-17`: retain centred 900 × 520 px flex card, use a dim backdrop, and move the smaller stamp to its bottom-right margin below the verdict text. | 86 s: card centred, dim table behind, all three verdict lines unobscured. |
| 7. Lighting | `src/scene.js:58-59`: increase the warm key from 2.2 to 3.4, add 1.25-strength hemisphere fill, retain the cool rim and teal set. | 1.5 s, 12 s, 30 s: faces and colour separate from the backdrop without flattening the rim. |

## Files and verification

Changed `src/scene.js` and `src/build-timing.mjs`; regenerated `index.html` and all 13 `compositions/*.html` with `node src/build-timing.mjs` using the existing `cues.json` (95.49 s). Wrote this report. No audio files or scripts were changed.

`node --check` passed for both edited JavaScript files. Pinned HyperFrames 0.8.98 `check --json` reports **lint: 0 errors, 3 audio-overlap warnings**. Its browser runtime check cannot launch Chromium in this sandbox (`spawn EPERM`); this is the only reported runtime error. A Ptah `file://` browser screenshot showed only the plain root background because the HyperFrames composition runtime was not running there, so it does not verify the changed frames. The orchestrator needs to regenerate snapshots at the listed times. Ptah diagnostics found no errors in the edited files; unrelated workspace TypeScript diagnostics remain outside this project's scope.
