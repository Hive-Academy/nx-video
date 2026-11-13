---
name: free-media-sourcing
description: Finds, licence-checks, fetches and credits free third-party media (GLB models, HDRIs, PBR textures, sound effects, music, fonts, Lottie or SVG graphics) for nx-video series episodes. Media is never committed, because the repository is public: it is described in a tracked manifest and fetched by tools/media/fetch-media.mjs. Use it whenever a lane needs a model, texture, environment, sound, music bed, font or graphic it does not already have, or when it adds, replaces or credits any third-party asset.
---

# Free media sourcing

## Rules that break silently

1. **Licence first.** Use only `CC0-1.0`, `CC-BY-4.0`, `CC-BY-3.0`, `OFL-1.1`, `Pixabay` or
   `MIT`. These are the keys the fetcher accepts. Open the asset's own page and read the licence
   there. A site-wide claim is not enough, because many sites mix licences. Reject NC, ND,
   "editorial", "personal use" and anything you could not open.
2. **Never commit media.** Every fetched file lives under `demos/<episode>/assets/third-party/<kind>/`,
   which is gitignored. The tracked record is `demos/<episode>/assets/media.manifest.json`.
   `tools/guards/no-media.mjs` must still pass.
3. **The manifest is the only way in.** Add an entry, then run the fetcher. Do not hand-download
   a file and do not copy one from another folder. The fetcher checks the licence key and the
   ignore rule, pins the sha256 and writes `assets/CREDITS.media.md`.
4. **Credit on screen.** Every `CC-BY` or `OFL` item's credit line (listed by the fetcher under
   "End-card credit lines") goes on the end card or in the credits, in title-safe.
5. **Fit, then use.** A model must be measured, grounded, faced and recoloured to the palette
   before it appears in a frame (`threejs-scene-craft` → `references/models.md`). Mixed-source
   props must read as one set.

## Workflow

1. Pick the source from `references/catalogue.md`. Use the episode shopping list if one exists.
2. Add the manifest entry:

   ```json
   { "path": "assets/third-party/models/statue.glb", "url": "<direct file URL>",
     "title": "…", "author": "…", "source": "<asset page URL>", "licence": "CC0-1.0",
     "changes": "recoloured, rescaled" }
   ```

   If the download is a zip, add `"extract": "<member path inside the zip>"`.
3. From the repository root, run `node tools/media/fetch-media.mjs demos/<episode> --pin`.
   Then run it again with `--check`, and run `node tools/guards/no-media.mjs`.
4. If a file needs a login to download (Sketchfab, for example), do not try to get round the
   login. Pick another asset, or list it under `## Clarifications Needed` for a person to fetch.
   Give its manifest entry, so the person only has to drop the file in.

## References

| Read | When you need to … |
| --- | --- |
| `references/catalogue.md` | choose a source by category (models, characters, HDRI and PBR, SFX, music, 2D, fonts, Three.js helpers), with each source's licence traps and how to download from it |
