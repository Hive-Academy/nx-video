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
| 1 | open: crane to two-shot | 0.00 | N2 end−0.3 (≈9.8) | N1, N2 | one move from the approved over-the-shoulder a (raised 12 cm so the visors show) forward, then down to a low centred two-shot B0 from the window side; both swivel to talk in the first 1.5 s, so the visors read by 1.5 s; focus racks Codex→Claude on N2 |
| 2 | push into the screen | ≈9.8 | `landingIn` (10.8) | — | the same shot pushes 1 s into the straight-on screen hold |
| 3 | insert | 10.8 | N5−0.4 (20.2) | N3, N4 | static hold while the landing clip plays (2D insert on top, the 3D sequence under it); pull back over 1.9 s to the approved b from `landingOut`+0.32; both swivel to talk |
| 4 | c Codex | 20.2 | O1−0.4 (26.9) | N5 | approved MCU c (target dropped 4 cm so the visor clears the caption band) |
| 5 | b' wide | 26.9 | O3−0.5 (30.2) | O1 | wide two-shot leaning to Claude, both shells whole; at `spark` Claude's visor flares, a warm ring pulses out and about 36 warm embers fall, the lights dip at `dip` |
| 6 | c Codex | 30.2 | rumble−0.2 (33.9) | O3 | MCU c |
| 7 | storm push | 33.9 | through (37.07) | — | b; the storm boils on the screen, lights dim and flicker, sand pours out at `pull`; a 1.6 s push into the screen, then the veil hands over to the vortex |

**Screen direction:** every camera stays on the window side (+z) looking at the screen, so
Claude is frame-left and Codex frame-right in every shot. The v1 reverse two-shot (from the
screen side) is gone. Because of that the city window is never in frame, and the bokeh
clipping problem no longer applies.

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

Round 1 (a41aaff):

1. The screen clip goes through `setScreenSource` (see above); the extract script gained the sequence step.
2. c: target −4 cm, so Codex's visor sits above the caption band.

Round 2 (the orchestrator's review of a41aaff):

1. **Reverse two-shot removed.** The opening is one crane from a to the low two-shot B0, which
   keeps screen direction. B0 sits at z 1.84: at z 2.12 the camera passed through the window
   plant's foliage (leaves covered 2.5–9 s).
2. **Spark redesigned.** The white zigzag bolt (`makeBolt`) is gone. Now: Claude's visor glow
   flares (0.1 s attack, soft fall over 0.75 s), and a warm additive ring (#FFB878) expands from
   the visor along its facing. About 36 soft warm embers burst forward and fall under gravity.
   A warm point light (1.2) at the visor lights the shell and the chair. It is placed from the
   eye groups' world positions, so it follows the head. Clipping: peak luma in the visor crop
   is 235 at 29.12 s against 233 at 28 s (no flare). The first pass (light 2.2, glow 0.9) hit 255
   and was lowered.
3. **b' reframed** to a wider two-shot (camera (−0.36, 0.94, 2.2), 22°). Both shells are whole at
   28–29.7 s.
4. **Opening:** both robots swivel toward each other from 0.35 s, and the a start is raised
   12 cm. In the render the visors are partly in frame at 1.5 s and clear at 2.5 s.
5. **Render fix (`src/build-timing.mjs` line 72):** the master `hf-audio-group` fx chain gained
   `"version":1`. Without it the render failed with `Unsupported chain version: undefined`.
   `index.html` was regenerated; that one attribute is its only change.

## Verification

- `node --check src/set-workspace.js`: ok.
- `node src/build-timing.mjs`: `Timeline 106.67 office → vortex → desert → intro → endcard`
  (`timing.json` unchanged).
- `node node_modules/hyperframes/dist/cli.js check --json --timeout 120000`: exit 0, `ok: true`
  (re-run after the chain-version fix).
- `snapshot` of the changed times and `snapshots/workspace-anim/sheet.jpg` were rebuilt. The first
  snapshot attempt can hit `Navigation timeout of 10000 ms exceeded`, and a retry passes.
- **Draft render:**
  `node node_modules/hyperframes/dist/cli.js render -q draft -w 3 --player-ready-timeout 240000 -o renders/preview-v4-workspace.mp4 .`
  - Exit 0. 52.5 MB and 106.7 s of video, **rendered in 49 min 15 s**.
  - Capture took 42 min 36 s, about 2.4 s per frame per worker with 3 workers on a hardware GPU.
  - Not committed.
- **The earlier "buildReady never resolved for: office" was a slow load, not a hang.**
  - The evidence comes from temporary `console.error` traces (since removed) in mount,
    `useLook` and `build`.
  - Office, vortex and desert mount in one page. The workspace look loads about 15 glTF models one
    after another, plus two HDRIs.
  - In the first capture session the workspace look never finished before the default 45 s
    readiness timeout. The automatic retry finished office about 85 s after page load.
  - A bisect with the 45-frame screen sequence switched off failed the same way, so the
    sequence is not the cause.
  - **Render this film with `--player-ready-timeout 240000`.** The durable fix is to load the
    look's models in parallel (`Promise.all`) in `look-workspace.js`.
- **Frames from the render** were taken at 0.5, 1.5, 2.5, 6, 10.2, 13, 18.5, 21.6, 28, 29.12,
  29.35, 32, 35 and 36.6 s:
  - Claude is frame-left and Codex frame-right in every shot.
  - No window or city bokeh is in frame.
  - b′ (28 s) keeps both shells whole.
  - The flare (29.12 s) and the warm ring (29.35 s) light Claude's shell with no clipping.
  - The screen and the 2D insert (13 s) read sharply.
- `node tools/guards/no-media.mjs` (repo root): `no violations`.

## Scorecard (1–5, the six rows of the video-quality-bar)

| row | score | note |
| --- | --- | --- |
| Look and materials | 4 | same kit and shading as the approved stills; every shot is lit by the screen |
| Lighting and mood | 4 | warm practicals against the cool screen; the dip and storm flicker read |
| Composition and framing | 4 | screen direction holds in every shot; b′ keeps both shells whole; c matches the approved still |
| Camera motion | 4 | one crane into the low two-shot, then push, pull-back and storm push; slow drift on holds |
| Character life | 4 | the ball rig acts through head, visor, blink and swivel; limited by the no-arms rig |
| Screen and product read | 4 | the landing clip and the "How Ptah decides the work" frame are readable on the 3D screen |

Verdict: passes the bar in the rendered film. All four review fixes show in frames taken from
the render.

## Open defects

1. **Opening visors (fixed in the follow-up):** the crane now starts 8 cm lower. A snapshot at
   1.0, 1.5 and 2.0 s (`snapshots/workspace-anim/crane/`) shows both visors with their eyes at
   the lower edge at 1.5 s and clearly at 2.0 s. Not re-rendered, as instructed.
2. **Render readiness (load fix in the follow-up):** in the render the workspace look needed
   about 85 s to load. `look-workspace.js` now starts its 13 models, the screen still and the HDRIs
   at once, and still awaits each at its original line, so placement order is unchanged. The new
   readiness time is not measured (no render). Keep `--player-ready-timeout 240000` until a
   render confirms it.
3. **Render time:** 49 min for a draft of the whole film.
4. The 10 fps screen sequence steps during the 0.3 s insert fades (barely visible at this size).
5. The robots keep the ball rig. Bodies come from `demo/ep06-v4-robot-bodies`, and the scene will
   be re-posed after the user approves them.
