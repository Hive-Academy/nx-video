# Source catalogue

Pick sources in the order listed in each table. "Scriptable" means the fetcher can download the file
directly, with no login and no JavaScript dialog in the way.

## Contents
1. 3D models
2. Characters and animation
3. HDRIs and PBR textures
4. Sound effects and music
5. 2D graphics and motion
6. Fonts
7. Three.js helpers
8. Excluded sources

## 1. 3D models

| Source | Licence | Scriptable | How to download, and what to watch for |
| --- | --- | --- | --- |
| Poly Pizza (`poly.pizza/m/<id>`) | Per model: CC0, or CC-BY 3.0 (most uploads by "Poly by Google") | Yes | The model page holds the `https://static.poly.pizza/<uuid>.glb` URL and the licence. Read both on that page. Kenney and Quaternius kits are mirrored here as CC0, with per-piece GLBs. |
| Kenney (`kenney.nl`) | CC0 | No (kenney.nl blocks scripts) | Use the Poly Pizza mirror of the kit instead. The Furniture Kit covers sofas, a laptop, coffee tables, plants, lamps, rugs, bookcases and walls/windows. |
| Quaternius | CC0 on the pack badge. The site-wide licence is now "QAL", which forbids redistributing the raw files | Via Poly Pizza | Trust the badge on the pack page on the day you download. |
| KayKit (free tier) | CC0 | Via Poly Pizza | Some paid tiers are not CC0. |
| Poly Haven models | CC0 | Yes (`api.polyhaven.com/files/<id>`) | Photoreal. Use them only if the shot is photoreal, because they clash with the low-poly cast. |
| Sketchfab (filtered to CC0 or CC-BY, downloadable) | Per model | No (download needs login or an API token) | Put the entry under `## Clarifications Needed` for a person to fetch. Reject the Standard, NC, ND and SA licences. |
| The Met Open Access | CC0, only when the object's `isPublicDomain` is true | Images yes, 3D rarely | Most useful as reference images and 2D plates. |
| Smithsonian 3D | CC0, per model badge | Varies | Check the badge on every model page. |

Remap the materials of every model to the episode palette (`threejs-scene-craft` → `models.md`), so
that props from different kits read as one set.

## 2. Characters and animation

The series cast is the `cute_robot.glb` rig (`createRobot`), and crews are robot clones. Do not bring
in humanoid characters for the cast.

| Need | Source | Licence | Notes |
| --- | --- | --- | --- |
| Humanoid motion (background crowd only) | Quaternius Universal Animation Library | CC0 (pack badge) | Bake the clip and sample `action.time` by seek time |
| Mixamo | Adobe terms | Rendered video is fine. Never commit or fetch the raw FBX. | Logged-in export only, so it is not scriptable |

## 3. HDRIs and PBR textures

| Source | Licence | Scriptable | URL pattern |
| --- | --- | --- | --- |
| Poly Haven | CC0 | Yes | HDRI: `https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/<res>/<id>_<res>.hdr`. Textures: list the files with `https://api.polyhaven.com/files/<id>`. Author: `https://api.polyhaven.com/info/<id>` → `authors`. |
| ambientCG | CC0 | Yes (zip, so use `extract`) | `https://ambientcg.com/get?file=<Id>_1K-JPG.zip`. Members are named `<Id>_1K-JPG_Color.jpg`, `_NormalGL.jpg`, `_Roughness.jpg` and so on. |

Use 1K or 2K. 4K is wasted at 1080 × 1350 and slows down snapshots.

## 4. Sound effects and music

| Need | Source | Licence | Scriptable |
| --- | --- | --- | --- |
| SFX (zap, whoosh, sandstorm, stamp, boom, scrape) | ElevenLabs sound generation, through the episode's `scripts/audio/` pipeline and `ELEVENLABS_API_KEY` | Generated for us; commercial use on the paid plan | Yes, and regenerable. Write the prompt into the manifest of the audio script. |
| Music bed or theme sting | ElevenLabs music generation (same pipeline), or a composed GSAP-synced stinger | As above | Yes |
| Library SFX | Kenney audio packs | CC0 | No (JavaScript download): a person fetches them |
| Library SFX | Freesound, **CC0 filter only** | Per sound | No (needs login). The Freesound API is non-commercial, so never call it from a script. |
| Library music | Pixabay Music | Pixabay Content License | No (manual). Read that track's own page. |

Generated audio is still media: it lives under a gitignored path and is recreated by the script.

## 5. 2D graphics and motion

| Source | Licence | Notes |
| --- | --- | --- |
| HyperFrames registry (`hyperframes add <block>`) | Apache-2.0 | Seek-safe already. Use it before building flashes, grain, glitches or titles by hand (`hyperframes-registry` skill). |
| The Met Open Access images | CC0 when `isPublicDomain` is true | For example, papyrus fragments and statue plates, as textures or reference |
| game-icons.net | CC-BY 3.0 | SVG. A credit is needed. |
| Iconify (per icon set) | Varies by set | Read the set's licence |
| LottieFiles | Lottie Simple License | Needs a seekable player. Prefer registry blocks. |
| Wikimedia Commons | Per file | Accept only the PD, CC0 or CC-BY tags on the file page |

## 6. Fonts (Google Fonts, all OFL-1.1)

| Use | Font |
| --- | --- |
| Carved or monumental title | Cinzel |
| Modern UI, captions | DM Sans (or the series caption font) |
| Real hieroglyph signs | Noto Sans Egyptian Hieroglyphs |

Fetch fonts as `.woff2` files through the manifest, under `assets/third-party/fonts/`. The "Papyrus"
typeface is not free, so never use it.

## 7. Three.js helpers

Use the `three/addons` that ships with the pinned `three`: `RGBELoader` or `HDRLoader` for `.hdr`,
`UnrealBloomPass`, `RoomEnvironment`, `GLTFLoader`, and `DRACOLoader` with the local decoder. Add
no particle library: sand and dust are a seeded `Points` field driven by `t`. `postprocessing`
(Zlib) is allowed only if `UnrealBloomPass` cannot reach the look, and it needs one render per
frame with no temporal history.

## 8. Excluded sources

BBC Sound Effects (personal and educational use only), Sketchfab Standard, NC, ND or SA licences,
the Freesound API from scripts, the "Papyrus" font, SVG Repo (its house licence has not been read),
and any asset whose own page you could not open.
