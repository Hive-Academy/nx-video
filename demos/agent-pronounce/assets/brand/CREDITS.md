# Brand and background sources

Rebuild the derived files with `node assets/brand/build-brand.mjs`.

| File | Source | Notes |
| --- | --- | --- |
| `ptah-emblem.webp` | Ptah repository, `apps/ptah-landing-page/public/assets/icons/ptah-icon.webp` (the landing page site logo) | Copied unchanged. The emblem is a black engraving of an ankh with crook, flail and "PTAH" lettering. |
| `ptah-emblem-gold.png` | derived from `ptah-emblem.webp` | 1024 x 1024 (lanczos upscale of the 512 px source). Alpha is the source alpha times inverted luminance, so the white fill clears and the engraving lines stay. Filled with a gold gradient from #F6CF7A down to #E8A33D. Used on dark grounds: the end-card hero mark, the Conductor badges and the 3D chest badge. |
| `ptah-emblem-cream.png` | derived from `ptah-emblem.webp` | Same method, filled cream (#FFF6E5 down to #F1E3C8). |
| `../backgrounds/temple-bg.webp` | Ptah's temple (judgement hall), provided for this video | 1024 x 1024 source. |
| `../backgrounds/temple-16x9.jpg` | derived from `temple-bg.webp` | 1024 x 576 band (rows 202 to 778) centred on the throne, upscaled to 1920 x 1080. Used under a dark shade on the intro, title and end card. |
