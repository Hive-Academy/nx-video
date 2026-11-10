## Skills loaded

- `D:/projects/nx-video/tools/skills/video-quality-bar/SKILL.md`: “A lane that has not met this bar has not finished, whatever its exit code.”
- HyperFrames skills: unavailable in the supplied skill directory; the installed CLI and existing compositions were the fallback. Ptah MCP tools were unavailable in this lane; native read, edit and image inspection tools were used.

## Build

- Replaced the portrait cast catalogue with a 1920×1080 full-bleed sandstone wall. The shared procedural SVG has grain, varied strata and a top-left golden-hour falloff. There is no blank frame at title start.
- Local title cues: chisel 0.600; four letters finish by about 2.7; tag `/pəˈtɑː/` 3.200 (92 px); line “The P is not silent.” 4.200 (74 px), with one gold P pulse. The wall scales 1.00→1.03 through the 6.000 s composition. Dust chips, glint and chisel are timeline driven; chip vectors are fixed.
- Endcard is 4.000 s and reuses the wall at dusk. The Ptah emblem is visible from frame one, followed by the two required lines, large `ptah.live`, and the robot credit. Both compositions register paused GSAP timelines in `window.__timelines` and preserve the root/clip timing attributes. No cast cards or competing product names remain.

## Look-dev match

No approved v2 landscape still was supplied, so the quality-bar look-dev approval gate could not be proven. Compared the rendered 72.45 s wall to Direction v2’s bare sandstone / top-left light description, and 78.3→78.5 s for the same wall changing to dusk. Both are visually continuous in surface and screen direction. The final render sheets were inspected at full size: `snapshots/lane-c-v2/contact-sheet-1.jpg` and `contact-sheet-2.jpg`; the combined labelled sheet is `contact-sheet.jpg`.

## Scorecard

Scores: Subject (S), Set dressing (Set), Light (L), Effect (E), Text/safe area (T), Continuity (C). Frame paths are under `snapshots/lane-c-v2/`. The first frame’s bare wall is the specified subject; later cues add carving and copy. All scores are for the final re-shoot.

| Frame path | S | Set | L | E | T | C | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `frame-00-at-72.45s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-01-at-73.3s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-02-at-74.2s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-03-at-75.2s.png` | 5 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-04-at-75.8s.png` | 5 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-05-at-76.8s.png` | 5 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-06-at-78.3s.png` | 5 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-07-at-78.5s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-08-at-79.6s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-09-at-81s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Pass |
| `frame-10-at-82.3s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Pass visual; timing caveat below |
| `frame-11-at-79.96s.png` | 4 | 4 | 4 | 4 | 4 | 4 | Pass visual; CLI-added frame |

## Checks

- Requested `snapshot --at ... --timeout 120000`: exit 0; 12 PNGs (including CLI-added 79.96 s frame) and two source contact sheets. Final combined labelled sheet written with Sharp.
- `node node_modules/hyperframes/dist/cli.js check --json`: did not return after about 100 s. It logged “Runtime did not become render-ready within 3000ms — checking the current page state”; interrupted with Ctrl+C, exit 1. No JSON result was emitted.
- `node tools/guards/no-media.mjs` from `D:/projects/nx-video`: exit 0, 424 files checked, no violations.
- Composition root and clip dimensions/durations inspected; no `STARRING` or `OPENCODE` in either changed composition. Snapshot render reported no 404 or console error.

## Credits

- `assets/intro/wall.svg`: original procedural texture made in this lane; no external source or licence needed.
- Existing `assets/brand/ptah-emblem-gold.png` reused. Existing robot attribution retained: “cute robot” by victory_mirosya, CC BY 4.0.

## Open defects

- No approved v2 landscape look-dev still was provided, so the skill’s still approval gate remains unmet. The parent should compare the supplied frames with its intended visual reference.
- HyperFrames reports an unexpected end-of-timeline frame at 79.96 s despite the specified total 82.433 s. The requested 81 and 82.3 s frames are visually identical, suggesting an integration timing clamp. This is outside Lane C’s file scope; the parent/timing lane should verify generated timing and rerun snapshots after integration.
- `check --json` remains unresolved because render readiness hung; the parent should rerun after the shared runtime/timing investigation.
