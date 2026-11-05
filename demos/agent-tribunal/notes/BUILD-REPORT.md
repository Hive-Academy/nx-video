# Build report

## Current state (2026-11-05 follow-up)

Dependencies and audio cues are now installed. `node src/build-timing.mjs` generated a **95.49 s** cut with 13 scenes and 33 audio tags. The older placeholder and installation notes below describe the previous lane's state; [REVIEW.md](REVIEW.md) records the current verification outcome.

The pinned CLI lint pass has 0 errors and 3 intentional audio-overlap warnings. Runtime check and snapshot both fail to launch Chromium with `spawn EPERM`, so no visual QA pass is claimed.

## Decisions

| Decision | Options | Evidence |
| --- | --- | --- |
| Placeholder cut is 70.4 s at 30 fps. | Fixed row lengths or cue-driven row lengths | SPEC sets the voice as clock; `src/build-timing.mjs` reads `assets/audio/cues.json` when it arrives and regenerates all scene windows. |
| Retain 13 composition files for the 13 named shots. | One long scene or per-shot scenes | The requested list contains 13 shots; each host and inner composition share an ID. |
| Use the bundled Archivo Black and Inter families. | Copy font files or rely on the HyperFrames font bundle | `format.md` explicitly lists these two bundled families. |
| Use a small deterministic placeholder envelope until audio cues arrive. | Silent robot or generated placeholder motion | The spec requires speech motion; no audio artifacts existed in this lane. |
| Load exact GSAP 3.13.0 from jsDelivr. | Pinned CDN or a local vendor copy | No local GSAP package was installed; the source fix removes `missing_gsap_script`. Network access is required during rendering. |
| Use one `fromTo` entrance and a `to` exit for booth straps. | Two independent `fromTo` tweens or a continuous exit | The pinned lint check no longer reports the six repeated-baseline warnings. |
| Preserve three audio-track overlaps. | Split tracks or keep the directed layers | The spec requests row 5 overlap, a reality sting into the title hit, and adjacent gavel/paper effects. |

## Files created

- `index.html`; `compositions/*.html` (13 files)
- `src/scene.js`, `src/build-timing.mjs`, `src/timing.json`
- `assets/models/RobotExpressive.glb`, `assets/models/CREDITS.md`
- `package.json`, `package-lock.json`, `BUILD-REPORT.md`

## Timing and audio

Run `node src/build-timing.mjs` after `assets/audio/cues.json` is written. It reads `timeline` row starts/durations, voice entries and their `envelope[]`, SFX entries, and music, then rewrites the scene hosts and audio tags in `index.html`, composition durations, and `src/timing.json`. It also reads `assets/audio/envelopes.json` if supplied. Without cues, it uses roughly 3 seconds per line, a 0.3-second row 5 overlap, 2.5 seconds for the title, 3 seconds for chaos, and 3 seconds for the end card. The audio tags are generated from the cue IDs when those files exist; no audio directory was touched.

## Verification

- `node --check src/scene.js` passed; timing generator ran and reported `placeholder; 70.4s; 13 scenes`.
- Scoped Ptah diagnostics reported no diagnostics in the two changed source files. Its sibling-project error count is unrelated to this demo.
- Pinned `node node_modules/hyperframes/dist/cli.js check --json` could not start: `node_modules/hyperframes` is absent. `npm install` failed because registry access was redirected to `127.0.0.1:9` and refused. The lockfile records the exact direct versions but could not resolve transitive packages or integrity hashes.
- `ptah_browser_navigate` opened the in-workspace `file://` index and `ptah_browser_screenshot` captured it. It was blank because the standalone file does not assemble sub-compositions and the local dependencies are absent. This is not a visual QA pass. No HyperFrames snapshot PNG paths exist to review.

## Known gaps

- CLI `check --json` errors and snapshot QA frames remain unverified until pinned dependencies can be installed. Re-run `npm install`, `node src/build-timing.mjs`, then the installed CLI's pinned bin with `check --json` and `snapshot --at` for frame 0, row 5, each booth midpoint, row 17, row 19, and end-card hold.
- Cue audio and actual RMS envelopes are pending the parallel audio agent. There are no media files in this lane.
- The preview could not be judged against the brief's legibility, framing, BANNED list, or lighting requirements. The scene code targets those values, but the render has not been visually validated.
