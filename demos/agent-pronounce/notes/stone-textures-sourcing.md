# Stone texture sourcing

Both sets are Poly Haven 2K JPG PBR textures, licensed CC0-1.0. Manifest IDs below are the filename stems, since this manifest identifies entries by `path` rather than an `id` field. Paths are relative to `demos/agent-pronounce/`.

## Statue body and face: Sandstone Cracks

- Source: https://polyhaven.com/a/sandstone_cracks
- Author: Rob Tuytel
- Licence: CC0-1.0
- Resolution: 2K JPG (2048 pixels on the long side)
- Fit: Warm beige sandstone has fine sandy grain, dusty erosion, and small fissures that read as weathered carved stone at face scale without large rubble or block joints.

| Map | Manifest ID | Exact local path |
| --- | --- | --- |
| Diffuse/albedo | `sandstone_cracks_diff_2k` | `assets/third-party/textures/sandstone_cracks/sandstone_cracks_diff_2k.jpg` |
| Normal (GL) | `sandstone_cracks_nor_gl_2k` | `assets/third-party/textures/sandstone_cracks/sandstone_cracks_nor_gl_2k.jpg` |
| Roughness | `sandstone_cracks_rough_2k` | `assets/third-party/textures/sandstone_cracks/sandstone_cracks_rough_2k.jpg` |
| AO | `sandstone_cracks_ao_2k` | `assets/third-party/textures/sandstone_cracks/sandstone_cracks_ao_2k.jpg` |
| Displacement | `sandstone_cracks_disp_2k` | `assets/third-party/textures/sandstone_cracks/sandstone_cracks_disp_2k.jpg` |

## Plinth: Dark Rock

- Source: https://polyhaven.com/a/dark_rock
- Author: Amal Kumar
- Licence: CC0-1.0
- Resolution: 2K JPG (2048 pixels on the long side)
- Fit: Its charcoal, matte, fractured stone surface gives the base a dark basalt-like weight and contrast against the warm sandstone statue.

| Map | Manifest ID | Exact local path |
| --- | --- | --- |
| Diffuse/albedo | `dark_rock_diff_2k` | `assets/third-party/textures/dark_rock/dark_rock_diff_2k.jpg` |
| Normal (GL) | `dark_rock_nor_gl_2k` | `assets/third-party/textures/dark_rock/dark_rock_nor_gl_2k.jpg` |
| Roughness | `dark_rock_rough_2k` | `assets/third-party/textures/dark_rock/dark_rock_rough_2k.jpg` |
| AO | `dark_rock_ao_2k` | `assets/third-party/textures/dark_rock/dark_rock_ao_2k.jpg` |
| Displacement | `dark_rock_disp_2k` | `assets/third-party/textures/dark_rock/dark_rock_disp_2k.jpg` |

## Verification

| Command | Exit code | Result |
| --- | ---: | --- |
| `node tools/media/fetch-media.mjs demos/agent-pronounce` | 0 | 219/219 items fetched or verified |
| `node tools/media/fetch-media.mjs demos/agent-pronounce --check` | 0 | 219/219 items verified, including pinned SHA-256 hashes for the ten new maps |
| `node tools/guards/no-media.mjs` | 0 | 466 files checked; no violations |

Downloaded texture files are git-ignored.
