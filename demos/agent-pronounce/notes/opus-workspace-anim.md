# Episode 6 v4: the workspace opening, animated

The approved workspace look (`e8f814a`, hero frame `workspace-b`) replaces the v3 office in the film
from 0 s to `through` (37.07 s). The animation is `src/set-workspace.js` (kind `workspace`).
`src/build-timing.mjs` mounts it in the `office` slot (`kind: 'workspace'`) and places the 2D landing
insert exactly over the 3D panel during the straight-on hold (`HOLD.px = 1650`). The robots stay the
ball rig. The film is 16:9 only.

Skills loaded: video-quality-bar, threejs-scene-craft, hyperframes-core, hyperframes-animation.
An earlier session wrote most of the set and its wiring. This session continued from its
uncommitted work, fixed the defects listed below and verified the result.

## Shot list (scene-local seconds; line times from timing.json v4.1)

| # | shot | from | to | lines | framing |
| --- | --- | --- | --- | --- | --- |
| 1 | a crane | 0.00 | N1−0.4 (3.6) | — | a short crane down onto approved still a: over the shoulders, screen centred |
| 2 | reverse two-shot | 3.6 | N2 end−0.4 (9.7) | N1, N2 | from the screen side, both faces lit by the screen; focus racks Codex→Claude on N2; Claude half-swivels to ask |
| 3 | insert | 9.7 | N5−0.4 (20.2) | N3, N4 | 1 s push into a straight-on hold (`landingIn`); the landing clip plays (2D insert on top, the 3D sequence under it); pull back over 1.9 s to the approved b two-shot from `landingOut`+0.32; both swivel to talk |
| 4 | c Codex | 20.2 | O1−0.4 (26.9) | N5 | approved MCU c (target dropped 4 cm so the visor clears the caption band) |
| 5 | b' Claude | 26.9 | O3−0.5 (30.2) | O1 | two-shot leaning to Claude; the spark leaps off the screen at `spark`, the lights dip at `dip` |
| 6 | c Codex | 30.2 | rumble−0.2 (33.9) | O3 | MCU c |
| 7 | storm push | 33.9 | through (37.07) | — | b; the storm boils on the screen, lights dim and flicker, sand pours out at `pull`; a 1.6 s push into the screen, then the veil hands over to the vortex |

No framing is tighter than c. Life comes from head yaw toward the speaker, nods, a talk bob and
squash, visor glow on onsets, seeded blinks (2.2–4.2 s apart), the chair swivel, a Ptah-name
pulse at `tah`, and eyes that widen at `rumble`. Everything is a pure function of t (`hash`,
`noise1`), so seeking is safe.

## Screen: the `setScreenSource` video test

- A `THREE.VideoTexture` is **not** seek-safe here. `scene.js` renders synchronously on
  `hf-seek` and nothing awaits a video seek, so the texture would show whatever frame the
  browser last decoded.
- Seek-safe path, now used: `scripts/live-demo/landing-stills.mjs` extracts the landing clip as
  a 10 fps, 1280 px JPEG sequence (45 frames, git-ignored, in `assets/live-demo/stills/landing-seq/`).
  The set loads one texture per frame and calls `handles.setScreenSource(tex)` only when the
  frame changes. The screen shows the mockup, then the clip's first frame for the push, then
  the sequence on the insert's clock (`landingIn`), then the last frame.
- Result: the insert's fade-out at 15.15 s now lands on the matching frame. Before, the 2D clip
  faded over the clip's *first* still, a double image. During the hold the 30 fps 2D insert
  stays on top, so the 10 fps steps never show at full size.
- Cost: 45 × 1280×603 RGBA ≈ 140 MB of GPU memory, loaded once in build. Fallback: 5 fps
  (half the memory). The steps would then show during the push and the pull-back.

## Changes this session

1. Screen clip through `setScreenSource` (above); the extract script gained the sequence step.
2. b' (O1): the camera moved from x −0.12 to −0.5 (target −0.2). A foreground plant leaf had
   covered half the frame and Codex.
3. c: target −4 cm, so Codex's visor sits above the caption band.

## Verification

- `node --check src/set-workspace.js`: ok.
- `node src/build-timing.mjs`: `Timeline 106.67 office → vortex → desert → intro → endcard`.
- `node node_modules/hyperframes/dist/cli.js check --json --timeout 120000`: exit 0, `ok: true`
  (3 lint warnings, all `nested_media_start_basis_ambiguous` in other compositions, none new).
- `snapshot --at 2,6,9,10.5,13,15.15,18.5,21.6,28,29.12,32,35,36.6 --output snapshots/workspace-anim`:
  the first attempt failed with `Navigation timeout of 10000 ms exceeded` (page load, before any
  scene code ran); the immediate retry wrote all 13 frames. Watch for this in render; the 45 extra
  textures add to load time.
- Sheet: `snapshots/workspace-anim/sheet.jpg` (13 labelled frames, 640 px cells).
- Render cost: not re-measured per frame this round. The look costs 33–41 ms/frame (lookdev
  harness); the set adds a texture swap and some point updates per frame, both negligible.

## Scorecard (1–5, the six rows of the video-quality-bar)

| row | score | note |
| --- | --- | --- |
| Look and materials | 4 | same kit and shading as the approved stills; every shot is lit by the screen |
| Lighting and mood | 4 | warm practicals against the cool screen; the dip and storm flicker read |
| Composition and framing | 4 | a, b and c match the approved stills; b' is now clean; nothing tighter than c |
| Camera motion | 4 | motivated moves (crane, push, pull-back, storm push), slow drift on holds |
| Character life | 4 | the ball rig acts through head, visor, blink and swivel; limited by the no-arms rig |
| Screen and product read | 4 | the landing clip and the "How Ptah decides the work" frame are readable on the 3D screen |

Verdict: passes the bar. No sampled frame looks worse than `workspace-b`. The reverse (6 s, 9 s)
comes closest; see below.

## Open defects

1. **Reverse two-shot (3.6–9.7 s):** the city window behind the robots has blown, busy bokeh
   in the top third and competes with the faces. Fix: raise the camera about 0.1 and tilt down,
   or dim the backplate in this shot only.
2. **Reverse direction:** the reverse puts Codex left and Claude right, the opposite of every
   other shot (it crosses the line). It reads as a true reverse from the screen, but it is a
   continuity choice the user may reject.
3. **b' (O1):** Codex is cut by the right frame edge; Claude carries the shot.
4. **Crane a (0–3.6 s):** only the tops of the shells show at the bottom edge. This matches the
   approved still, but it is a thin opening for the characters.
5. The 10 fps screen sequence steps during the 0.3 s insert fades (barely visible at this size).
6. One snapshot navigation timeout (retry passed).
