# The P Is Not Silent

Episode 6 of The Tribunal. A 1080 × 1350 HyperFrames comedy short. The approved script and action cues are in [SPEC.md](SPEC.md).

## Restore assets

The public repository does not track generated or downloaded media. Set `PTAH_REPO` to a local ptah-extension checkout and run:

```powershell
node scripts/restore-assets.mjs
```

The restore script copies the temple background and three Ptah landing clips from `apps/ptah-landing-page/public/assets/live-demo` (source revision `a255d2327`). It also restores brand icons, emoji and the robot model as described by the script. Run `node scripts/audio/generate.mjs` to make the 12 voice lines, SFX and the 10.0 second intro plus 3.0 second end sting. It reads `ELEVENLABS_API_KEY` from the repository root `.env`. The generated audio and word timings are in `assets/audio/cues.json`.

## Build and preview

```powershell
node src/build-timing.mjs
node node_modules/hyperframes/dist/cli.js check --json
node node_modules/hyperframes/dist/cli.js preview
```

Use `node src/build-timing.mjs --placeholder` only for timing and layout work before generating audio. The composition order is screen, office, vortex, desert, intro, endcard. A Ptah desktop app window overlays the desert from its `portal` cue. Intro and endcard are fixed at 10.0 and 3.0 seconds.

## Render

```powershell
node node_modules/hyperframes/dist/cli.js render
```

From the repository root, run `node tools/guards/no-media.mjs` before sharing changes. Media files remain untracked.
