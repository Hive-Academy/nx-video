# Context

## Intent

The Remotion side of the plugin. A user in an empty Nx workspace runs two generators and gets a studio that renders.

## Source

- `apps/ptah-video-studio/` in Ptah (Remotion `4.0.484`): `src/`, `remotion.config.ts`, `selfshot/`, `scripts/render-all.mjs`, `narrate.mjs`, `caption.mjs`, `selfshot-*.mjs`, `paths.mjs`.
- `apps/ptah-video-studio/scripts/export-kit.mjs` and `PORT-TO-NEW-PROJECT.md`: the manual form of these generators. Match their behavior.

## Scope

- `init` generator: dependencies at the pinned versions, the path alias for the contract package, and the `.claude` skill and agent.
- `studio` generator: the Remotion app, and `brand.config.ts` from generator options (wordmark, product name, tagline, CTA label, theme). Neutral placeholder branding by default.
- `render` executor: a resolution option (1080p, 1440p, 4K), output under `video-output/`.
- `narrate` executor: kokoro (local, default) or ElevenLabs. Captions through whisper.cpp.
- `selfshot` executor: the self-shot pipeline, with the `SELFSHOT_KIT_SLUGS` allowlist and the post-copy guard.
- A smoke composition and a self-shot `_smoke` fixture that contain no real recordings.
- Resolve ffmpeg through `ffmpeg-static` with `createRequire`, not a system `ffmpeg`.

## Acceptance

- AC2: in an empty Nx workspace, `init` + `studio` give a studio that renders the smoke composition (e2e test on all three operating systems).
- AC4: the self-shot `_smoke` render works from the package.
- The README of the generated studio shows the Remotion license notice.
