# The Tribunal, Episode 1

A 104-second comedy pilot built with HyperFrames before the nx-video tools exist,
to learn the pipeline on a real piece: five AI coding agents argue about whether
the nx-video plugin should use Remotion or HyperFrames, and the Ptah Conductor
rules "both, no shared code".

- Creative brief: `SPEC.md` (Revision 2 at the bottom overrides the top).
- Storyline options that were considered: `STORYLINES.md`.
- Final review: `REVIEW.md`. Build and fix notes from each agent: `notes/`.

## Stack

| Part | Tool |
| --- | --- |
| Composition and render | HyperFrames `0.8.98` (pinned in `package.json`) |
| 3D | Three.js `0.181.2`, one shared WebGL renderer, deterministic physics in `src/physics.js` |
| Overlays | GSAP `3.13.0` from jsDelivr (renders need network access) |
| Voices, SFX, music, word timings | ElevenLabs (`scripts/audio/generate.mjs`) |

`src/build-timing.mjs` is the source of truth for the running order. It reads
`assets/audio/cues.json` and writes `index.html`, `compositions/*.html` and
`src/timing.json`. Never edit the generated files by hand.

## Restore the untracked media

This repository is public, and `tools/guards/no-media.mjs` rejects models,
images, audio and video. Only source, scripts and credits are committed.

```sh
npm install
# images: temple background and Ptah emblem from a ptah-extension checkout,
# provider icons from thesvg.org, Noto emoji
PTAH_REPO=/path/to/ptah-extension node scripts/restore-assets.mjs
# audio: needs ELEVENLABS_API_KEY in the repository root .env (paid API calls)
node scripts/audio/generate.mjs
node src/build-timing.mjs
```

The robot model needs one manual download: "cute robot" by victory_mirosya
(CC BY 4.0) from
https://sketchfab.com/3d-models/cute-robot-6aadb75f596742ada2814ad4593f0032,
saved as `assets/models/cute_robot.glb`. The restore script reminds you.

## Preview and render

```sh
node node_modules/hyperframes/dist/cli.js check --json
node node_modules/hyperframes/dist/cli.js preview
node node_modules/hyperframes/dist/cli.js render -q delivery -o renders/the-tribunal-ep1.mp4
```

Run the pinned CLI through `node`, never a bare `npx hyperframes`.

## Credits

- Robot: "cute robot" by victory_mirosya, CC BY 4.0, recoloured and animated
  (`assets/models/CREDITS.md`). The end card carries the attribution.
- Provider logos: thesvg.org; they belong to their owners and only identify the
  products (`assets/icons/CREDITS.md`).
- Emoji: Noto Emoji, Apache-2.0 (`assets/emoji/CREDITS.md`).
- Temple background and Ptah emblem: Ptah's own landing-page assets
  (`assets/brand/CREDITS.md`).
