## Skills loaded
- `video-quality-bar`: “A lane that has not met this bar has not finished, whatever its exit code.” This is the required canary.
- `threejs-scene-craft`: loaded for seek-driven camera, actor and effect work.
- Ptah tools were not connected; native CLI was used.

## Black-render investigation
- The prior lane's all-black desert could not be reproduced. A fresh 24.2 s capture before my edits showed the full desert set, and subsequent captures did too. There was no missing cue or NaN in `set-desert.js`; `sceneCue` reads from the current config. Root cause remains unconfirmed. The CLI's render-ready warning and slow navigation suggest a readiness/capture race, but that is an inference, not a proven cause.
- The real v2 duration defect was definite: the old portal shot ran from local 27.139 to 50.365, and no camera shot returned for D6 or tilted to the title wall. The old return began at local 20.01, before portal, from an earlier timeline.

## Changed files
- `src/set-desert.js`: reads reveal, pushIn, showcaseEnd, d6 and titleTilt from config cues; extends the hero wide through D1; uses four D1-D5 shots, with a gradual reveal and a pan across crews; makes landing dust last 1.5 s; pushes into doorway in 1.2 s; keys return to sofa and robot glides at showcaseEnd; fades portal light and aims the last shot at the pylon sandstone tower.
- `src/set-vortex.js`: starts the exit glow at the configured land cue rather than the old 3.2 s assumption.

## Shot list (desert local seconds)
| Shot | Time | Action |
| --- | --- | --- |
| Establish | 0–11.821 | Landing at .300, crane reveal from 1.800; D1 at 3.200 |
| Two | 11.821–14.821 | Sofa visitors and Ptah |
| Crews | 14.821–19.901 | Lateral crew view and banners |
| Cursor | 19.901–27.139 | Cursor at 20.401, stamp 20.510, D5 |
| Portal | 27.139–43.939 | Doorway push and warm glow under showcase |
| Return | 43.939–48.365 | Visitors return for D6 at 44.739 |
| Title | 48.365–50.365 | Move to bare pylon sandstone |

## Look-dev match
No approved v2 landscape still supplied. The existing 4:5 look was reused. Fresh 16:9 frames show the HDRI sun flaring over the left of the wide desert shot, and further work is needed to control it.

## Scorecard
S=subject, D=set dressing, L=light, E=effect, T=text/safe area, C=continuity. Each path points to an inspected capture from this run; some were replaced by later same-directory captures. Scores below 4 are open defects.
| Global time | Frame or sheet | S | D | L | E | T | C | Pass |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 18.7, 20.5, 21.3 | `contact-sheet-1.jpg` (vortex capture) | 4 | 4 | 4 | 4 | 4 | 4 | Yes |
| 22.4, 23.2, 24.2 | `contact-sheet-1.jpg` / `contact-sheet.jpg` | 4 | 4 | 2 | 4 | 4 | 4 | No |
| 25.3, 30 | `contact-sheet.jpg` (earlier capture) | 3 | 4 | 4 | 4 | 4 | 3 | No; recaptured camera schedule needed |
| 36.8 | `frame-01-at-36.8s.png` | 4 | 3 | 4 | 4 | 4 | 3 | No |
| 42.6, 42.9 | `frame-02-at-42.6s.png` / earlier sheet | 4 | 4 | 4 | 4 | 4 | 4 | Yes |
| 46 | `frame-03-at-46s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Yes |
| 49.3, 50.4 | earlier sheet / `frame-04-at-50.4s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Yes for app resolve; doorway framing needs review |
| 66.2, 67.5, 69.5 | `contact-sheet-1.jpg` / `frame-05-at-67.5s.png` | 3 | 3 | 4 | 4 | 4 | 3 | No; final sofa return is too tight |
| 71, 72.3 | `contact-sheet-1.jpg` / `frame-06-at-72.3s.png` | 3 | 3 | 4 | 3 | 4 | 3 | No; final wall move unverified |

## Credits
No new assets fetched. Existing licensed HDRI and set assets reused.

## Verification
- `node node_modules/hyperframes/dist/cli.js check --json`: did not finish. It warned “Runtime did not become render-ready within 3000ms”, then remained silent for more than a minute; interrupted with exit 1. No JSON result was produced.
- 19-frame snapshot call failed with “Navigation timeout of 10000 ms exceeded”; smaller batches captured. The CLI reuses frame indices in a destination directory, so later calls replaced earlier numbered PNGs.
- `node tools/guards/no-media.mjs` from repository root: passed, 424 files checked, no violations.
- `git diff --check`: no content errors; it emitted repository-wide line-ending warnings.

## Open defects
- Wide desert frame is blown out on the left by the HDRI sun; rotate or reduce its background contribution and re-shoot.
- At 36.8 s the crew shot foreground robot blocks the speaker and the crew lanes need stronger hierarchy.
- D6 return is too tight, with foreground head cropping. Reframe to retain Ptah and both visitors.
- Title shot did not yet prove a clean sandstone fill; inspect final 72.3 s re-shoot.
- Full requested 19-frame scorecard and passing `check --json` remain outstanding because of capture/readiness issues.

- Final post-reframe 72.3 s single-frame re-shoot exited 1 before producing a frame. The delivered contact sheet precedes the last D6 widening and pylon-wall distance adjustment; those edits pass JavaScript syntax checking but are visually unverified.
- Final single-frame snapshot failure gave no diagnostic beyond exit 1. This is an additional open verification defect.
