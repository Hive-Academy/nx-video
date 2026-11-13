---
name: video-quality-bar
description: The visual and pacing acceptance bar for every nx-video series episode (HyperFrames compositions with Three.js scenes, 2D overlays, captions and voice). It defines the loaded-skill canary, the look-dev still gate before animation, banned low-quality shortcuts, the per-frame scorecard and the contact-sheet review a lane must pass before it reports done. Use it whenever a lane builds, fixes or reviews any scene, set, character, overlay, caption or audio mix under demos/, even when the brief only says "build the desert" or "fix the office".
---

# Video quality bar

A lane that has not met this bar has not finished, whatever its exit code.

## 1. Prove the skill loaded

The first section of your notes file is `## Skills loaded`. For each skill, give the absolute
SKILL.md path you opened and quote one rule from it word for word. If you only name a skill, or
you found it through a tool search, it does not count. Load these as well:
`threejs-scene-craft` for any 3D work and `free-media-sourcing` for any asset.

## 2. Gates, in order

| Gate | Pass condition | Fail action |
| --- | --- | --- |
| Look-dev | Before any animation, each scene has one still at its hero cue, and the brief marks it as approved. The animated frame at that cue matches the still's composition, palette and assets. | Stop. Report that the still is missing. Do not animate an unapproved look. |
| Assets | Hero characters and hero props come from a GLB, a sourced model or texture, or a detailed canvas texture, each listed in `CREDITS.md` with its licence. | Replace it. A primitive stand-in is a gate failure (§3). |
| Scorecard | Every snapshot frame scores **≥ 4 on every row** of `references/scorecard.md`. | Fix it and snapshot the same times again. Never deliver a frame that scores 3 or less. |
| Contact sheet | One sheet per scene, with frames at scene start, every named cue, the midpoint and the last frame. Review it at full size. | Missing frames mean the work is not done. |
| Checks | `hyperframes check --json` is clean, `node tools/guards/no-media.mjs` passes, and there are no 404s or console errors in the snapshot run. | Fix it before you report. |

## 3. Banned shortcuts

Each of these failed review before. Each one is a gate failure:

- A hero character or god built from boxes, spheres and cylinders. Build the figure from a GLB
  or a sourced model instead. Primitives are fine only for background filler at less than 10%
  of the frame.
- A flat, untextured ground or wall. Every surface the camera holds on needs texture or
  geometric detail.
- A wide shot with the action under 15% of the frame, or empty space where the brief names
  crews, props or banners.
- A promised effect (spark, bolt, glow, stamp) that is missing or too small to see at 4:5 on a
  phone.
- A character cropped at a frame edge, facing away while it speaks, floating above its support,
  or with an unlit face.
- Text or a stamp crossing a face. Captions outside the lower 22% safe band.
- Any `Math.random`, wall-clock time or timer in scene code. Renders must be seek-deterministic.

## 4. Report

Your notes file must contain all of these:

- `## Skills loaded`, as in §1.
- `## Look-dev match`: for each scene, the approved still beside the frame at the same time.
- `## Scorecard`: a table with one row per frame, a column per scorecard row, the path, and
  pass or fail.
- `## Credits`: every new asset, with its source URL and licence.

If a row is below 4, it must appear under `## Open defects` with a fix plan. Claiming a pass
without a frame path is a defect.

## References

| Read | When you need to … |
| --- | --- |
| `references/scorecard.md` | score a frame (the rows, what each score looks like, the reference frames that set a 5) |
| `references/review-procedure.md` | take the snapshots, build the contact sheet, check pacing and audio, and run the CLI commands |
