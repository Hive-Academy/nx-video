# Agent Cribs (The Tribunal, Episode 2)

A 106-second house tour: the same five AI coding agents show off the two homes
they work in, T3 Code and Ptah, and the differences between them. Neither home
wins. Built on the Episode 1 engine (`../agent-tribunal`), copied, not shared.

- Comparison the film is based on: `COMPARISON.md`, with evidence in
  `research/` (T3 Code at `132be33`, Ptah at `589cd0d`, both 2026-11-05).
- Creative brief and script: `SPEC.md` (the "Pacing pass" section at the end
  overrides the earlier gap rules). Storyline options: `STORYLINES.md`.
- Final review: `REVIEW.md`. Build notes from each agent: `notes/`.

## Stack

| Part | Tool |
| --- | --- |
| Composition and render | HyperFrames `0.8.98` (pinned in `package.json`) |
| 3D | Three.js `0.181.2`, one shared WebGL renderer, deterministic physics |
| Overlays and captions | GSAP `3.13.0` from jsDelivr (renders need network access) |
| Voices, SFX, music, word timings | ElevenLabs (`scripts/audio/generate.mjs`), Episode 1's voices |

`src/build-timing.mjs` owns the running order. It reads
`assets/audio/cues.json` and writes `index.html`, `compositions/*.html` and
`src/timing.json`. Every 3D scene gets its rows, word timings and named action
cues (`press`, `noteSlide`, `stamp`, `gavel`, …) so props land with their sounds.

## Restore the untracked media

```sh
npm install
PTAH_REPO=/path/to/ptah-extension node scripts/restore-assets.mjs
node scripts/audio/generate.mjs        # ElevenLabs, needs ELEVENLABS_API_KEY in the root .env
node src/build-timing.mjs
```

The robot model is the one manual step (see `../agent-tribunal/README.md`).

## Preview and render

```sh
node node_modules/hyperframes/dist/cli.js check --json
node node_modules/hyperframes/dist/cli.js preview
node node_modules/hyperframes/dist/cli.js render -q delivery -o renders/agent-cribs-ep2.mp4
```

## Credits

- Robot: "cute robot" by victory_mirosya, CC BY 4.0, recoloured and animated.
- T3 Code logo: from T3 Code's own MIT repository at `132be33`; other provider
  logos from thesvg.org. Logos belong to their owners and only identify the
  products (`assets/icons/CREDITS.md`).
- Emoji: Noto Emoji, Apache-2.0. Temple background and Ptah emblem: Ptah's own
  landing-page assets.
