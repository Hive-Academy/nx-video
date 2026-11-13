# Episode 6 v4: vortex look-dev (stills for approval)

Lane: Opus, branch `demo/ep06-v4-vortex-look`. Stills only. The scene is not animated, but `update(t)` is a
pure function of t, ready for the animation lane.

## Skills loaded

- `C:\Users\abdal\.claude\skills\threejs-scene-craft\SKILL.md`: "Never call `Math.random`, `Date`,
  `performance.now`, timers, `requestAnimationFrame` loops or `mixer.update(dt)`."
- `C:\Users\abdal\.claude\skills\video-quality-bar\SKILL.md`: "A lane that has not met this bar has not
  finished, whatever its exit code."
- `C:\Users\abdal\.claude\skills\hyperframes-cli\SKILL.md`: "Every command has `--help`; most take `--json`,
  and a failure prints `✗ …`, a `Fix:` line and exits non-zero."

## Files

- `src/look-vortex4.js`: `buildVortex4Look(assets, renderer, { shot, t })` returns
  `{ scene, camera, film, handles, update(t), info }`. Exports `LAND = 2.6`, `FALL`, `SHOTS`, `PAL`.
- `lookdev/vortex4.html` and `lookdev/vortex4.js`: the still page (`?shot=a|b|c|d&t=&post=base|preview`).
- `lookdev/shoot-vortex4.mjs` (`npm run lookdev:vortex -- a b c d --post=preview --sheet`): headless Chrome,
  1920x1080 PNGs, 1280 px previews and the labelled 2x2 sheet. It logs page errors, console errors
  and 4xx responses.
- The sheet is `snapshots/lookdev/vortex-sheet.jpg` (git-ignored, not committed).
- The old sofa `src/look-vortex.js` is untouched.

## Design

- **Frame:** the chairs stay near the origin and the world rises past them at `FALL` = 8 m/s. The funnel
  is 20.8 m long, so its sand floor reaches the seats at exactly `LAND` = 2.6 s.
  - Seek-safe: every position comes from t, and all variation is seeded with `hash`/`hashRange`.
  - Shaders take `uT`.
- **Funnel:** three nested open shells, each with a fbm sand shader that streams along helical flow
  coordinates.
  - Outer (r 4.6, opaque): carved dark hieroglyph bands from the shared desert `reliefTexture`, plus
    bright gaps where the desert sun leaks through.
  - Mid (r 3.6, 0.72): gold glyph bands.
  - Inner (r 2.75, 0.38): fast veil.
  - The palette is the desert set's (sand `#D8C2A0`, sun `#FFC48A`, umber shadows), so the storm
    matches the landing.
- **Office → vortex:** a white rim on the shells and a hot white disc at the top hole fade as
  `exp(-t/0.22)`. A top light fades with them, and parquet planks from the workspace floor fly out
  and dissolve by 1.3 s.
  - The ≥0.6 s white-out hold on "Old." happens in the office scene before t = 0 of this scene.
  - This scene starts the moment the floor falls.
- **Particles:** four instanced streak layers, all stretched along their screen-space velocity over a
  1/30 s shutter:
  - 9000 far bright grains
  - 3200 mid grains
  - 1400 dark clumps (normal blend, for silhouette depth)
  - 260 soft foreground motes
- **Glyph tablets:** 24 rounded sandstone slabs with a carved glyph AO and bump map. They orbit, rise
  slower than the walls and grow in out of the storm near the top.
- **Chairs and robots:**
  - The shared kit `loungeChair` and the approved bodied robots, seated with the look-bodies seat
    state.
  - Each chair tumbles about its seat. The roll and pitch ease in over 0.5 s, and the tumble and yaw
    swing settle upright before `LAND`, so they land seated and facing out.
  - Codex is scripted arms-up; Claude braces.
- **Desert end:** a `sand_01` PBR floor and a gold haze that fades as the floor nears.
  - A dust skirt (an open cone of wind-blown sand) covers the floor.
  - The sun key moves from below (leaking up through the storm) to over the rim as the desert opens,
    so the chairs cast shadows on the approaching sand.
- **Film:** the look-kit chain (GTAO, bokeh DOF, bloom, ACES, grade with vignette, grain and CA).

## Stills

| Shot | t (s) | What | Path |
| --- | --- | --- | --- |
| A | 0.32 | Entry, just after the floor falls: white hole above, parquet planks, glyph wall | `snapshots/lookdev/vortex4-a.png` |
| B | 1.25 | Mid-tumble wide: both chairs in the funnel, tablets, desert glow below | `snapshots/lookdev/vortex4-b.png` |
| C | 1.85 | Mid-tumble closer on the chairs and faces | `snapshots/lookdev/vortex4-c.png` |
| D | 2.45 | Just before landing: sand floor rushing up, dust skirt, chair shadows | `snapshots/lookdev/vortex4-d.png` |

Sheet: `snapshots/lookdev/vortex-sheet.jpg` (2x2, labelled).

## Look-dev match

This is the first look-dev for the v4 vortex, so no approved still exists yet to match against. These
four stills are the candidates. Once they are approved, the animation lane must match them at the
same t values (`SHOTS` in `src/look-vortex4.js`).

## Scorecard

I scored every still by eye at 1280 px and on the full-size sheet.

| Frame | Subject / framing | Hero assets | Surfaces | Light / faces | Effect reads | Path | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A t 0.32 | 4 | 4 | 4 | 4 | 5 | `snapshots/lookdev/vortex4-a.png` | pass |
| B t 1.25 | 4 | 4 | 5 | 4 | 5 | `snapshots/lookdev/vortex4-b.png` | pass |
| C t 1.85 | 5 | 5 | 4 | 5 | 4 | `snapshots/lookdev/vortex4-c.png` | pass |
| D t 2.45 | 4 | 4 | 4 | 4 | 4 | `snapshots/lookdev/vortex4-d.png` | pass |

Checks:

- **Snapshot run:** clean. There are no console errors and no 4xx responses. The favicon request was
  the only 404, and the server now answers it with 204.
- **No-media guard:** `node tools/guards/no-media.mjs` passes: 477 files, no violations.
- **`hyperframes check --json`:** fails, but not because of this lane. The only two errors are
  `missing_local_asset` for the git-ignored recordings (`assets/live-demo/tour-*.mp4`,
  `landing-scroll.mp4`) referenced by `compositions/app-window.html` and
  `compositions/landing-insert.html`. These are absent from this worktree.
  - This lane does not touch those compositions.
  - Recordings must not be copied in.

## Credits

No new assets. Reused, all already credited in the episode:

- Poly Haven lounge chair (CC0), through the look-kit `loungeChair`.
- `sand_01` and `old_sandstone_02` PBR sets (Poly Haven, CC0).
- Herringbone parquet (Poly Haven, CC0).
- `mpumalanga_veld_puresky_2k.hdr` (Poly Haven, CC0).
- The project's `cute_robot.glb` bodied robots.

## Known issues

- Codex's arms-up reaction is scripted but hard to read in these angles: the arms sit low inside the
  chair shell. The animation lane should push the raise (upper-arm Z about 2.6) or pick a camera that
  sees it.
- In D, Codex is in profile and Claude faces the camera. Nobody speaks in the vortex, so I left it.
- The dust burst on contact (t ≥ 2.6) belongs to the landing beat and is not in these stills. The
  dust skirt and sun swing set it up.
- The sand floor in D reads a little more orange than the desert set under the warm key. Match the
  grade when the two cuts sit side by side.

## Open defects

None scored below 4. Follow-ups for the animation lane are listed under Known issues.
