# Free resources for programmatic marketing videos

Checked on the live web on **2026-11-09**. Scope is Episode 6 ("The P Is Not Silent"): a glass office with a sofa, a laptop and a lightning gag, a sand vortex, and a golden-hour pyramid site with crews, a sledge, stone blocks, and a giant Ptah. Films are HyperFrames HTML/GSAP rendered to MP4, plus Three.js **0.181.2** (the pin in `demos/agent-pronounce/package.json`). Media stays untracked and is fetched by restore scripts. Credits go in `CREDITS.md`. The repository is public, so a licence that forbids redistributing the raw file still matters even when the file is gitignored: a restore script must not re-host it.

Style fit comes before polygon count. The cast is cute low-poly robots. Kenney, KayKit and Quaternius match that. Poly Haven photogrammetry (the Victorian sofa, a museum-grade statue) is the wrong mesh to sit the robots on. Use Poly Haven and ambientCG for light and materials, and museum scans as pictures or as one small real object, not as the god.

CC0 attribution is not required. This repo still records provenance in `CREDITS.md`. That is a project rule.

## Summary

| Category | Top pick | Licence | Download method |
| --- | --- | --- | --- |
| 3D models | Kenney Furniture Kit for the office; Poly Haven only for light and stone | CC0 1.0 | Manual zip on kenney.nl. Poly Haven: public API, no key |
| Character animation | Quaternius Universal Animation Library for humanoid crews. Mixamo only inside the rendered film | UAL: CC0 on the pack page. Mixamo: Adobe preview terms, no raw-file redistribution | UAL: button on the pack page and itch.io. Mixamo: logged-in export only |
| HDRI and PBR | Poly Haven `quarry_01` plus ambientCG `Rock030` | CC0 1.0 | Direct file URLs from each public API, no key |
| Sound and music | Kenney audio packs, then Freesound **CC0 filter** (manual). Not the Freesound API for a commercial restore | Kenney CC0. Freesound per sound | Kenney zip. Freesound: logged-in download. API is non-commercial |
| 2D motion and graphics | HyperFrames registry, then Met Open Access images, then game-icons.net | Registry: Apache-2.0. Met OA images: CC0. game-icons: CC BY 3.0 | `npx hyperframes add`. Met image URL or Collection API. SVG from the icon page |
| Fonts | Cinzel (carved title) and DM Sans (UI). Noto Sans Egyptian Hieroglyphs for real signs | SIL OFL 1.1 | fonts.google.com download or the CSS API |
| Three.js helpers | `three/addons` that ships with 0.181.2. `postprocessing@6.39.6` if bloom must be better | three: MIT. postprocessing: Zlib | npm. Already on `three@0.181.2` |

## 1. 3D models

Kept: Kenney, Quaternius packs that still say CC0, KayKit's free tier, Poly Haven models, Poly Pizza **CC0 only**, Sketchfab **CC0 and CC BY only**, The Met's Open Access images (and a 3D file only when that object page offers one), Minneapolis Institute of Art's CC0 Sketchfab scan. Smithsonian only when the model page shows the CC0 badge.

Excluded from use: Sketchfab Standard, anything NC, ND or SA, British Museum downloads that are not a clear CC0 or CC BY, and Quaternius packs the day their page stops saying CC0.

### Kenney

- **URL:** https://kenney.nl/assets and the pack https://kenney.nl/assets/furniture-kit
- **Licence:** Creative Commons CC0 1.0. The support page says every game asset on the asset pages is public domain (CC0), including commercial projects, and that attribution is not required. If you credit, the word is "Kenney". Do not use the Kenney logo. https://kenney.nl/support and https://creativecommons.org/publicdomain/zero/1.0/
- **Commercial:** yes. **Attribution:** not required. **Raw redistribution:** allowed by CC0. Still do not commit the files. The paid All-in-1 bundle is a convenience download of the same assets, not a different licence.
- **Download:** manual zip. Donation prompt, then "Continue without donating". No account. No public API. Formats include glTF/GLB, FBX and OBJ.
- **Quality:** flat-coloured low poly. Right next to the cute robots. Wrong if a shot needs a photographed room.
- **Assets for these scenes:** Furniture Kit, 140 files, licence line on the pack page reads Creative Commons CC0. Names confirmed on the Poly Pizza mirror of that kit (CC0, Kenney) and on a file tree of the same kit: `loungeSofa.glb`, `loungeSofaLong.glb`, `desk.glb`, `laptop.glb`, `chairDesk.glb`, `computerScreen.glb`. Pack: https://kenney.nl/assets/furniture-kit. Mirror listing: https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z. Prefer the zip from kenney.nl so the enclosed licence file is Kenney's.

### Quaternius (read the badge on the pack you download)

- **URL:** https://quaternius.com/packs/furniture.html and https://quaternius.com/license.html
- **Licence, two layers.** The site-wide licence link is the **Quaternius Asset License (QAL) v1.0**, last updated **2026-08-28**. QAL allows personal, educational and commercial use in a film with no credit, and **forbids reselling or redistributing the asset files** as assets, modified or not. https://quaternius.com/license.html
- The Furniture Pack page, opened 2026-11-09, still badges **CC0** and links https://creativecommons.org/publicdomain/zero/1.0/. QAL section 7 says a later licence does not rewrite assets you already took under an earlier one. The badge on the page at download time is the licence of that download. If the badge changes to QAL, stop treating the zip as CC0.
- **Commercial:** yes under both. **Attribution:** not required. **Raw redistribution:** yes if the pack still says CC0; no if it says QAL. Do not commit the zip either way.
- **Download:** the "Download" button on the pack page. Not a stable CDN URL. Some packs also have an itch.io button. Paid "Source" kits add Blender files; the free zip is the one to use.
- **Quality:** textured low poly, same comedy register as Kenney. Furniture Pack (October 2017) is 23 models, FBX, OBJ and Blend. The Poly Pizza bundle of that pack lists Sofa, Desk and Office Chair, each marked CC0: https://poly.pizza/bundle/Furniture-Pack-pgvx8Zkq8v. A single sofa: Couch Large by Quaternius, CC0, https://poly.pizza/m/6MoOyPtetL.
- **Not a pyramid kit.** No Egyptian set was verified.

### KayKit, free tier only

- **URL:** https://kaylousberg.itch.io/furniture-bits
- **Licence:** the itch page says the pack is CC0, free for personal and commercial use, no attribution required. The itch asset-licence field is Creative Commons Zero v1.0 Universal. A KayKit `LICENSE.txt` in the Prototype Bits repo says the same and points at http://creativecommons.org/publicdomain/zero/1.0/. **Extra** and **Source** files on the same itch page are paid. Use the free zip only.
- **Commercial:** yes. **Attribution:** not required (a credit to Kay Lousberg is asked for, not required). **Raw redistribution:** allowed by CC0.
- **Download:** itch.io, name your own price, including zero. Manual. No API.
- **Quality:** gradient-atlas low poly, about 50 furniture bits. A good second office kit if Kenney's colours are too flat. Same style warning as Kenney: not a photographed loft.

### Poly Haven models

- **URL:** https://polyhaven.com/models and https://polyhaven.com/license
- **Licence:** CC0 for HDRIs, textures and models. Commercial use, no credit required, redistribution allowed. Logos, page text and **example renders are not CC0**. Download the asset files, not the preview pictures. https://polyhaven.com/license and https://creativecommons.org/publicdomain/zero/1.0/
- **API:** public, no key, commercial use allowed. Announcement on https://polyhaven.com/our-api (Greg, 18 July 2026). API terms: https://github.com/Poly-Haven/Public-API/blob/master/ToS.md. Send a User-Agent. `GET https://api.polyhaven.com/assets?type=hdris&category=desert-arid` and `GET https://api.polyhaven.com/files/{id}` and `GET https://api.polyhaven.com/info/{id}`.
- **Quality:** photogrammetry. Excellent materials and furniture scans. A 4k-triangle Victorian sofa will fight the robots.
- **Verified model:** **Sofa 01**, Kirill Sannikov, 4101 triangles, 1.6 m wide, CC0. Page https://polyhaven.com/a/Sofa_01. Info JSON from `https://api.polyhaven.com/info/Sofa_01` on 2026-11-09: name "Sofa 01", author Kirill Sannikov, category Furniture/Seating/Sofas & Couches. Use it only if a shot is meant to look photographed. For the comedy office, use Kenney `loungeSofa.glb`.

### Poly Pizza

- **URL:** https://poly.pizza. Model pages opened today print the licence on the page.
- **Licence:** per model. CC0 pages say "Public Domain (CC0)". The catalogue also includes CC-BY, CC-BY-SA, CC-BY-ND, CC-BY-NC, CC-BY-NC-SA and CC-BY-NC-ND. **Use CC0, or CC BY if you can put the creator in `CREDITS.md`.** Drop NC, ND and SA. About 69% of the catalogue is CC-BY according to a 2026 Blender integration note; do not assume CC0.
- **Download:** manual on the model page, or the API. Third-party API docs (Poly Pizza API v1.1) describe `GET https://api.poly.pizza/v1/search/{query}` with header `X-Auth-Token` from https://poly.pizza/settings/api (free account). The `Download` field is a CDN `.glb` that does not need the header. This lane did not call the API. Confirm the licence field on the JSON before saving the file.
- **Quality:** the useful office meshes here are Kenney and Quaternius re-uploads, which is fine because those are CC0. Treat Poly Pizza as the index, and the author's page as the licence source when they disagree.
- **Verified pages:** Couch Large, Quaternius, CC0, https://poly.pizza/m/6MoOyPtetL. Kenney Furniture Kit bundle, CC0, including Laptop, Desk, Lounge Sofa, https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z.

### Sketchfab Download API

- **URL:** https://sketchfab.com/developers/download-api and the guidelines https://sketchfab.com/developers/download-api/guidelines and developer terms https://sketchfab.com/developers/terms
- **Licence:** whatever Creative Commons licence is on **that** model. The guidelines say most allow commercial use and that CC requires credit to the author and to Sketchfab, unless the model is CC0. Help text (7 October 2026): https://help.sketchfab.com/en/articles/16152215-crediting-users-for-3d-model-downloads. Suggested line: "This work is based on {title} by {user} licensed under CC BY 4.0."
- **Exclude:** Sketchfab **Standard** (their own licence, not Creative Commons; the task bar), every **NC**, every **ND**, every **SA**. A later change of licence does not revoke the licence you downloaded under.
- **Commercial:** yes for CC0 and CC BY. **Attribution:** required for CC BY, not for CC0. **Raw redistribution:** CC BY allows it with attribution and the same licence; this repo still does not commit media. CC BY-SA would force the derivative to stay SA, which this marketing film will not do.
- **Download:** OAuth. The person running the tool must log in with a Sketchfab account. Formats through the API are glTF, GLB and USDZ, not the artist's FBX. `GET https://api.sketchfab.com/v3/models/{uid}/download` after auth. There is no anonymous restore URL. Terms section 4.6 and 4.7: show the CC licence and the creator.
- **Already in the films:** `cute_robot.glb`, victory_mirosya, https://sketchfab.com/3d-models/cute-robot-6aadb75f596742ada2814ad4593f0032, CC BY 4.0. Keep that credit. Recorded in `demos/agent-pronounce/assets/models/CREDITS.md`.
- **Verified CC0 scan:** Horus, c. 2000–1570 BCE, Minneapolis Institute of Art, CC0, about 65k triangles. It is a small stone falcon amulet, not a standing god. https://sketchfab.com/3d-models/horus-c-2000-1570-bce-839a29d2f176467991d6f5f2ccb6a410. Museum record: https://collections.artsmia.org/art/73/horus-ancient-egyptian

### The Met, Open Access

- **URL:** https://www.metmuseum.org/openaccess and the Collection API docs https://metmuseum.github.io/
- **Licence:** images of public-domain works, and the basic catalogue data, are CC0. Commercial use, no credit required, redistribution allowed. https://creativecommons.org/publicdomain/zero/1.0/. The museum's own wording: unrestricted use, no permission, no fee.
- **The flag is per object.** `isPublicDomain: true` on `GET https://collectionapi.metmuseum.org/public/collection/v1/objects/{id}`. The old `/v1/search` was retired on 2026-10-01. Search is `/public/collection/v1.1/search`. No API key. Under 80 requests a second is the published comfort limit in secondary write-ups; the docs page above is the contract.
- **3D:** in March 2026 the museum published 100-plus scans and said a majority are Open Access. The Collection API record does **not** include a GLB link. Do not invent one. If the object page has a download, take it only when that same object is `isPublicDomain: true`.
- **Verified, use the photographs:**
  - Statue of Horus as a falcon protecting King Nectanebo II, 360–343 BCE, object 544887, accession 34.2.1. `isPublicDomain: true`. Image: https://images.metmuseum.org/CRDImages/eg/original/DP-38684-002.jpg. Record: https://www.metmuseum.org/art/collection/search/544887. This is the reference for a crowned falcon and a small king. It is not a mesh.
  - Fragments from a Book of the Dead, ca. 1300–1080 BCE, object 553719, accession 28.3.297, tagged Hieroglyphs. `isPublicDomain: true`. Image: https://images.metmuseum.org/CRDImages/eg/original/28.3.297_EGDP014610.jpg. Record: https://www.metmuseum.org/art/collection/search/553719. This is the papyrus texture.
- **Verified, do not use:** Book of the Dead of Tiye (551142) and the papyrus of Gautsoshen (550899) both return `isPublicDomain: false` and an empty `primaryImage`. Ancient does not mean the photograph is released.

### Smithsonian Open Access 3D

- **URL:** https://3d.si.edu and https://www.si.edu/openaccess. API base https://api.si.edu/openaccess/api/v1.0 with a free key from api.data.gov. Docs linked from https://edan.si.edu/openaccess/apidocs/
- **Licence:** CC0 **when the model page shows the CC0 mark**. The explore UI has a second bucket, "usage restrictions apply". Those are out. https://learninglab.si.edu/openaccess. Downloads include Draco GLB, uncompressed GLB, glTF and OBJ. Manual from the Voyager page. No Egyptian statue was confirmed CC0 today, so nothing from this library is on the shopping list yet.

### British Museum

Not a source for this film until a specific model page shows a download and a CC0 or CC BY licence. The Sketchfab collections exist (https://sketchfab.com/britishmuseum/collections/egyptian-sculpture-fe1114a036824f86adbe596215675d56) and many entries are view-only. A popular boat derived from their photos is **CC BY-NC** (https://sketchfab.com/3d-models/egyptian-boat-from-ancient-lives-cd65f231f70c4f258fe2f8a07979f9c7). NC is out.

### Pyramid, block, sledge

No CC0 pyramid mesh and no CC0 stone sledge were verified today. Build the pyramid from instanced blocks shaded with ambientCG Rock 030 (section 3). A sledge can be a few scaled planks from the Kenney kit. Do not grab the first Sketchfab "pyramid" without reading the licence.

## 2. Character animation and rigs

The cute robot is not a humanoid. Mixamo's auto-rigger and Quaternius's universal humanoid will not drop onto it cleanly. Use those clips for background crews if those crews are actually humanoid. Keep the hero robots on the animation the film already authored.

### Quaternius Universal Animation Library

- **URL:** https://quaternius.com/packs/universalanimationlibrary.html
- **Licence:** the pack page, opened 2026-11-09, badges **CC0** and says "Free to use in personal, educational and commercial projects. (CC0 License)." Same QAL warning as section 1: re-read the badge on the day you download. https://creativecommons.org/publicdomain/zero/1.0/
- **Commercial:** yes. **Attribution:** not required. **Raw redistribution:** allowed while the badge stays CC0.
- **Download:** button on that page, plus "Download on Itch.io". Formats FBX, GLB, Blend. Manual.
- **What it is:** one humanoid rig and 120-plus clips (March 2025): locomotion in eight directions, jog, sprint, push, crawl, swim, sit, death, emotes. The push and carry set is the one that matches crews hauling blocks. Retarget in Blender onto a humanoid crew mesh. It will not fit the cute robot's skeleton without a hand-written bone map.
- **Quality:** game clips, readable at crew size, not hero acting.

### Mixamo

- **URL:** https://www.mixamo.com. The FAQ Adobe's own community experts still point at (5 November 2026 and 8 November 2026, "no rules are changed"): https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400. They also point at https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html, which returned Access Denied to this lane, so the community FAQ is the text actually read. Adobe Terms: https://www.adobe.com/legal/terms.html
- **What the FAQ says.** During the technology preview, characters and animations are free, with no royalty, for commercial and non-commercial projects, including **movies and videos**. Credit is not required. Adobe keeps the rights in the content. You may not distribute the raw character or animation files, for free or for sale, including as an engine template or a stock pack. Team members on the same project may share the files. Customers and the public may not. The only research use that is banned is training a machine-learning model.
- **Retargeting.** The FAQ does not use the word "retarget". It does allow the auto-rigger on a character you upload, and it allows the animations inside a movie. Baking a clip onto a rig and rendering it into the MP4 is inside that grant. Publishing the FBX, or a retargeted JSON clip, in this public repository is the forbidden "free distribution of animation raw files". A restore script cannot fetch Mixamo: there is no anonymous URL, and an Adobe login is required.
- **Quality:** the best free humanoid acting library. The stock bodies look nothing like these robots. Use it for a humanoid crew, or not at all.
- **Risky:** treating "Without Skin" FBX as CC0. It is not.

### What not to use for rigs

Microsoft Rocketbox and similar research avatars were not opened because their known terms are research-only. ActorCore and Mixamo alternatives behind a subscription are out of scope. Anything marked NC is out.

## 3. HDRIs and PBR textures

### Poly Haven

Same CC0 grant and same API as the models section. https://polyhaven.com/license. https://polyhaven.com/our-api.

Desert category, live response from `https://api.polyhaven.com/assets?type=hdris&category=desert-arid` on 2026-11-09. All of these are CC0 because every Poly Haven asset is. Prefer 2K or 4K for a 1080p film. 16K HDR is hundreds of megabytes; do not download it for this show.

| Asset | Why it fits | Page | Direct 2K HDR |
| --- | --- | --- | --- |
| **quarry_01** | Sandy quarry, clear golden-hour sun, tire tracks. Closest stand-in for a construction desert. Sergej Majboroda | https://polyhaven.com/a/quarry_01 | https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/quarry_01_2k.hdr |
| **rogland_sunset** | Rocky arid ground, clear sunset, Namaqualand. The wide establishing shot | https://polyhaven.com/a/rogland_sunset | `GET https://api.polyhaven.com/files/rogland_sunset` then take the 2k hdr URL |
| **the_lost_city** | Rock formations and a path at low sun. The pylon and the ramps | https://polyhaven.com/a/the_lost_city | same `/files/the_lost_city` pattern |
| **goegap** | True desert, but **midday** and harsh. Only if a shot is not golden hour | https://polyhaven.com/a/goegap | same pattern |

The `/files/quarry_01` response also has 1K, 4K, 8K and 16K HDR and EXR. 2K HDR is about 6 MB. Confirmed URL above.

**aerial_sand**, Rob Tuytel, CC0, a ground texture about 15 m wide, with diffuse, roughness, normal, displacement and AO. https://polyhaven.com/a/aerial_sand. This is the sand the sofa lands on. Download the texture zip from the asset page or `/files/aerial_sand`. Do not screenshot the preview.

Office light: skip a desert HDRI indoors. Use Three.js `RoomEnvironment` (section 7) unless a shot needs a real dusk city, in which case pick a Poly Haven interior or sunset HDRI the same way and check the asset page.

### ambientCG

- **URL:** https://ambientcg.com and the licence https://docs.ambientcg.com/license/ (the site also serves https://ambientcg.com/license)
- **Licence:** CC0 1.0 for the downloadable files **and** the material preview renders. Commercial use, no credit, redistribution allowed, including the raw files inside a project. Suggested credit, not required: "Created using {name} from ambientCG.com, licensed under the Creative Commons CC0 1.0 Universal License."
- **API:** no key. v2 is still up. v3 is the one the docs recommend for new work (announced 28 February 2026). The author warns it is one person and not an enterprise SLA. https://docs.ambientcg.com/api/
- **Verified asset:** **Rock 030**, grey stone wall, maps for colour, normal, roughness, displacement, AO. Page https://ambientcg.com/a/Rock030. Download from the live v2 record: https://ambientcg.com/get?file=Rock030_1K-JPG.zip (about 9 MB). 2K JPG is about 33 MB. Pattern: `https://ambientcg.com/get?file={id}_{1K|2K|4K|8K}-{JPG|PNG}.zip`.
- **Quality:** tiling PBR. Right for pyramid blocks and the pylon. Not a carved relief. For carved hieroglyphs, use the Met papyrus photograph on a plane, not a procedural noise.

Sand-coloured ground can stay on Poly Haven `aerial_sand`. If that file is too photographic next to flat robots, tint Rock 030 or `aerial_sand` in the material instead of hunting a stylized sand.

### 3DTexel

Mentioned only as a neighbour. Secondary comparisons (1 October 2026) say the handmade library is CC0 and that a free account is required, while AI-generated assets sit under a different licence. This lane did not open 3DTexel's terms. Do not use it until someone reads the per-asset licence. Poly Haven and ambientCG are enough.

## 4. Sound effects and music

The sitcom sting "oud and synth" was not found as a cleared CC0 track. Plan to compose it, or to clear a specific Pixabay track after reading that track's page. Do not drop in the first "Egyptian" loop on a stock site.

### Kenney audio

- **URL:** https://kenney.nl/assets. Support text: https://kenney.nl/support
- **Licence:** same CC0 as the models. Commercial, no credit, redistribution allowed.
- **Download:** one zip per pack. No API.
- **Use:** Impact Sounds and Interface Sounds for the stamp, the chisel hit and UI ticks. Music Jingles are short game stingers, useful as a temp bed, thin as a finished oud theme. This lane confirmed the support-page grant and the Furniture Kit page, not a second click on the audio pack page. Open the pack page and read the CC0 line before relying on a file name.

### Freesound

- **URL:** https://freesound.org. FAQ: https://freesound.org/help/faq/. Licence deeds linked from that FAQ: CC0 https://creativecommons.org/publicdomain/zero/1.0/, CC BY 4.0 https://creativecommons.org/licenses/by/4.0/, CC BY-NC 4.0 https://creativecommons.org/licenses/by-nc/4.0/
- **Per sound, not per site.** CC0: commercial, no credit, you still may not claim authorship. CC BY: commercial, credit required. CC BY-NC and the retired Sampling+: **out**.
- **API:** https://freesound.org/docs/api/terms_of_use.html which points at https://freesound.org/help/tos_api/. The terms say the API is free **only for non-commercial purposes**. A commercial restore script needs a written API licence from Freesound. Downloading a CC0 file by hand, while logged in, and then mixing it into the film is the sound's licence, not an API call. Do not put a Freesound token in the public restore script.
- **Search:** filter `license:"Creative Commons 0"`. The tag browse loads (https://freesound.org/browse/tags/cc0) and each row has its own licence line. Read it.
- **Not cleared today:** sound 717890, "230823 Thunder, dry distant rolling" by TRP, https://freesound.org/people/TRP/sounds/717890/. The page loads and the description is distant rolling thunder. The licence line was not in the text extracted from that page, so it is **not** on the shopping list. A third-party rain site calls it CC0. Check the badge yourself before use.

### Pixabay audio

- **URL:** https://pixabay.com/music/ and the summary https://pixabay.com/service/license-summary/
- **Licence:** Pixabay Content License. The summary allows free use, modification, and **no attribution**. It forbids selling or distributing the file on a standalone basis (the file still in substantially the same form). Commercial films and client work are allowed. Trademarks and recognisable people have extra limits that rarely hit a thunder clap. The summary says only the full Content License is binding. Read it on that page before a track is locked.
- **Download:** manual, account usually required. This lane did not re-read the Pixabay **API** terms. Do not call `api.pixabay.com` from the commercial restore script until those terms are read. The content licence and the API terms are different documents.
- **Quality:** uneven. Fine for a whoosh or a sting after you listen. Weak as a sourced lightning crack until a named file is auditioned.

### BBC Sound Effects

**Out for this film.** The RemArc terms, as restated on the BBC licensing pages, allow personal, educational and research use. Business, paid work, non-profit organisations and advertising need permission, and commercial clips are sold through Pro Sound Effects. https://sound-effects.bbcrewind.co.uk/licensing (the text read via the BBC "Using the BBC" rules quoted on that licensing surface). A marketing video for a product is commercial. Do not download "just for the edit" and leave it in the master.

### Sonniss GDC bundles

- **URL:** https://gdc.sonniss.com/ and the archive https://sonniss.com/gameaudiogdc/. Licence: https://sonniss.com/gdc-bundle-license/ (version 2.0, effective 27 August 2026).
- **Licence:** royalty-free for the life of the downloader, unlimited projects, personal and commercial, **no attribution**. Media production only (games, film, TV, interactive). **No AI training.** You may not redistribute the sounds as sounds, modified or not, including inside a sample pack or SDK. Seeding an official Sonniss torrent is allowed. The finished MP4 may contain the sounds.
- **Download:** manual, from the GDC page or the official torrent. No per-file API. The 2026 bundle is about 7.5 GB and 347 files, a sample of vendors' libraries, not a full catalogue. There was no 2025 bundle.
- **Quality:** the highest in this list. Use it for lightning, sand wind and a chisel once someone opens the file list and names the clips. This lane did not download the bundle, so no clip name is claimed.

### Others considered

Mixkit's free sound-effects licence is widely used for video and was not re-read line by line today, so it is not a pick. YouTube's old audio library is not a dependable anonymous URL. Kevin MacLeod / Incompetech is CC BY and fine if you want that credit, and was not needed once Pixabay and Kenney cover beds. Anything marked Editorial or "YouTube only" is out.

## 5. 2D motion and graphics

### HyperFrames registry

- **URL:** https://github.com/heygen-com/hyperframes. Catalogue: https://hyperframes.heygen.com/catalog. The repo badge on 2026-11-09 is **Apache License 2.0**. Licence file: https://github.com/heygen-com/hyperframes/blob/main/LICENSE. Apache 2.0 text: https://www.apache.org/licenses/LICENSE-2.0
- **What that means:** commercial use is allowed. You may modify the installed source. If you redistribute the source (these films commit the composition HTML), keep the Apache notice and state what you changed. Attribution in the end card is not what Apache asks for; the notice in the file is.
- **Download:** `npx hyperframes catalog --query "lightning flash" --json` then `npx hyperframes add <name>`. Search is local. `add` needs the network. The registry skill describes about 450 blocks and components.
- **Names already listed by the registry skill**, relevant here: `editorial-flash-overlay` (the white cut), `grain-overlay` (sand and film), `browser-device-stage` (the laptop page), `camera-shake` (the bolt), `caption-editorial-emphasis` or `caption-clip-wipe`, `blur-in` and `bottom-up-letters` for the chisel title. Confirm with `catalog` before adding, and edit the installed source. These are seek-friendly HTML/GSAP scenes, which is the point. A Lottie that runs on `requestAnimationFrame` is not.
- **Quality:** the right tool for the papyrus title card, the flash and the captions. Not a substitute for the desert mesh.

### LottieFiles

- **URL:** https://lottiefiles.com. Licensing help, updated 29 October 2026: https://help.lottiefiles.com/animation-licensing-basics-. Commercial-use note: https://help.lottiefiles.com/hc/en-us/articles/45243303062681-Commercial-Use-Attribution
- **Licence:** free animations use the **Lottie Simple License**. Commercial use, modification, and no required attribution. If you distribute the JSON or a modified JSON, it stays under that licence. You cannot add DRM or relicense it, and you cannot compile their animations into a competing library. Premium files are a paid licence. Do not mix them.
- **Download:** manual from the animation page. No anonymous stable URL worth putting in a restore script.
- **Quality and seek:** pretty, and often the wrong runtime. HyperFrames needs a clock you set. Prefer a registry block or a GSAP timeline. If a Lottie is unavoidable, pick a player that seeks to a frame, and keep the JSON untracked with the Lottie Simple License noted in `CREDITS.md`.

### game-icons.net

- **URL:** https://game-icons.net. About page: https://game-icons.net/about.html
- **Licence:** CC BY 3.0 Unported. https://creativecommons.org/licenses/by/3.0/. Commercial use and edits are allowed. **Credit is required.** Their suggested line: "Icons made by {author}. Available on https://game-icons.net". Delapouite is the largest author. Credit the author named on the icon, not only the site.
- **Download:** SVG from the icon page. No key.
- **Use:** flat ankh, pyramid, scroll and hammer shapes for the hieroglyph name cards. They are game pictograms, not historical signs. Real hieroglyphs come from the Noto font and the Met papyrus.

### Iconify

- **URL:** https://iconify.design
- **Licence:** there is not one. Each icon set keeps its own licence (MIT, Apache, CC BY, OFL, and sometimes NC). The Game Icons set is still CC BY 3.0. Read the set page. Do not treat "found on Iconify" as cleared.

### SVG Repo

Mixed licences, including a house licence this lane did not re-read. Use it only when the file page says CC0 or CC BY, and skip NC, "editorial", and any custom licence you have not opened. Not a top pick.

### Wikimedia Commons

Useful, and easy to get wrong. A photograph of a public-domain papyrus can still be CC BY or CC BY-SA. **CC BY-SA is out** for this film, because the video would have to be shared alike. Prefer files marked CC0 or public domain, and prefer the Met image URL in section 1, which the Collection API marked `isPublicDomain: true`. One Commons file that is itself CC0, and is a papyrus photograph rather than a museum OA export: https://commons.wikimedia.org/wiki/File:Hieroglyphic_Papyrus_Book_of_the_Dead;_Late_Period,_2nd_Cent._BC;_from_Thebes_(28133434963).jpg (Gary Todd, CC0). The Met fragment is the better scan.

British Museum object photographs on their own site were not verified as commercial-free. Do not lift them from the collection page.

## 6. Fonts

Google Fonts FAQ, read 2026-11-09: every family is open source and free, commercial use is allowed, including in a product you sell, and the usual licence is the SIL Open Font License. Some families are Apache 2.0 or the Ubuntu Font License. https://fonts.google.com/faq. OFL 1.1: https://openfontlicense.org and https://scripts.sil.org/OFL. The google/fonts README says most families are OFL 1.1 and that each family directory contains its licence: https://github.com/google/fonts/blob/main/README.md

OFL in practice: use the font in a film, a logo or a UI, including commercially. No credit required on the video. You may ship the font file inside the project. You may not sell the font file by itself. If the font has a Reserved Font Name, a modified version needs a different name. Keep `OFL.txt` next to the file if you redistribute the font.

**Do not use Papyrus.** It is a commercial Monotype/ITC face and it is not on Google Fonts.

### Cinzel, the carved title

- **URL:** https://fonts.google.com/specimen/Cinzel
- **Licence:** SIL OFL 1.1. Copyright 2020 The Cinzel Project Authors. Designer Natanael Gama. https://fontsource.org/fonts/cinzel/about quotes the OFL block and the copyright line.
- **Why:** monumental capitals. It reads as an inscription under the chisel, not as a fake Egyptian alphabet. Pair it with the pronunciation line in DM Sans.
- **Commercial:** yes. **Attribution:** not required. **Redistribution of the file:** yes, with the OFL, and not as a standalone product. Reserved name: Cinzel.

### DM Sans, the modern UI

- **URL:** https://fonts.google.com/specimen/DM+Sans
- **Licence:** SIL OFL. The upstream README says all DM fonts are under the SIL Open Font License. Designer credit there: Colophon Foundry, creative direction MultiAdaptor and DeepMind. https://github.com/googlefonts/dm-fonts. That repo was archived on 19 April 2026. The fonts remain on Google Fonts under the same OFL.
- **Why:** a plain grotesque for captions, the laptop UI and the end card. It will not fight Cinzel.
- **Commercial:** yes. **Attribution:** not required. **Raw font file:** same OFL rules as Cinzel.

### Noto Sans Egyptian Hieroglyphs, the real signs

- **URL:** https://fonts.google.com/specimen/Noto+Sans+Egyptian+Hieroglyphs
- The specimen page loads. It is a Noto family on Google Fonts, so the FAQ grant applies: open source, commercial use, OFL unless the family directory says Apache. Confirm `OFL.txt` in the download before shipping. The font encodes Unicode Egyptian Hieroglyphs. It is the vortex glyphs and the flat name-card signs. It is not a Latin display face. Someone who can read the signs should pick the code points. Random hieroglyphs are how these gags go wrong.

## 7. Three.js helpers

The demos already depend on `three@0.181.2`. Import from that package. Do not add a second copy of the examples.

### `three/addons` (the paths that matter)

These have been stable on the `three/addons` export through the r163–r181 line. They ship inside the installed `three` package. MIT, same as three.js: https://github.com/mrdoob/three.js/blob/master/LICENSE

| Piece | Import | Why, for a seekable render |
| --- | --- | --- |
| GLTFLoader | `three/addons/loaders/GLTFLoader.js` | GLB office props and the robot |
| DRACOLoader | `three/addons/loaders/DRACOLoader.js` | Smithsonian and some Sketchfab GLBs are Draco. Call `setDecoderPath` at a local copy of the decoder. Await the parse before the first frame |
| KTX2Loader | `three/addons/loaders/KTX2Loader.js` | Same rule. Detect support once, then load. Do not transcode mid-seek |
| Meshopt | `three/addons/libs/meshopt_decoder.module.js` | `GLTFLoader.setMeshoptDecoder`. Decoder is MIT. Same await-before-seek rule |
| RGBELoader | `three/addons/loaders/RGBELoader.js` | `quarry_01_2k.hdr` |
| RoomEnvironment | `three/addons/environments/RoomEnvironment.js` | Office only. A generated studio PMREM. No file, same pixels every run. It will not light the desert |
| EffectComposer, RenderPass, OutputPass | `three/addons/postprocessing/` | One render per HyperFrames frame |
| UnrealBloomPass | `three/addons/postprocessing/UnrealBloomPass.js` | Laptop spark and the god's rim. Single frame, no history |
| BokehPass | `three/addons/postprocessing/BokehPass.js` | A close-up on the sofa. Single frame |
| SMAAPass | `three/addons/postprocessing/SMAAPass.js` | Spatial anti-alias. Do not also enable the renderer's own MSAA and a temporal pass |

`PMREMGenerator.fromEquirectangular` is deterministic if the HDR bytes are. Compile it once after load, not on every frame.

**RoomEnvironment versus an HDRI.** RoomEnvironment is a white studio. It is the right fill for a product shot of the laptop and a poor sun for Giza. Desert shots use `quarry_01` or `rogland_sunset` as the scene environment and as the light direction. You can use a dim RoomEnvironment fill under the HDRI if the robots go black in shadow. Do not light the office with the desert HDRI unless the gag is the moment the walls blow away.

### `pmndrs/postprocessing`

- **URL:** https://github.com/pmndrs/postprocessing. Release **v6.39.6** (1 November 2026) says it requires **three ≥ 0.168.0 and < 0.188.0**. That includes 0.181.2. https://github.com/pmndrs/postprocessing/releases
- **Licence:** Zlib. https://github.com/pmndrs/postprocessing/blob/main/LICENSE (the package metadata reports Zlib). Commercial use is allowed. Keep the copyright notice if you redistribute the library. No credit in the film.
- **Use:** `BloomEffect` when `UnrealBloomPass` fringes too hard. `EffectComposer` plus `RenderPass` plus `EffectPass`.
- **Seek:** the stock example calls `composer.render()` from `requestAnimationFrame`, and some effects take a delta. For HyperFrames, pose the scene at time `t`, then render **once**. Do not use effects that blend the previous frame (temporal trails, accumulated motion blur). Bloom, depth of field and SMAA in this library are safe if they are not fed a running history.

### `three-stdlib`

- **URL:** https://github.com/pmndrs/three-stdlib
- The releases page shows **v2.36.1** as latest, dated **10 November 2025**. That is a year behind three r181. It is a republish of `examples/jsm`. Importing both doubles the library and drifts. **Do not add it.** Use `three/addons`.

### Particles and sand

No particle library is on the shopping list. `three-nebula`, `three.quarks` and similar systems store state and step forward in time. A seek back to frame 0 does not replay them. HyperFrames will show a different puff on every render.

Sand, dust and the vortex grit should be a `THREE.Points` cloud whose position is a pure function of a fixed seed, the point index and the frame time. A small integer hash is enough. Call `Math.random` once while building the buffers, from a seeded generator, never inside the frame callback. Lightning is a jagged polyline or the existing hero-lightning rebuild, with `UnrealBloomPass` on a bloom layer, not a particle plug-in.

Draco, KTX2 and Meshopt do not change the model's licence. They change the bytes. Await them before seeking.

## Episode 6 shopping list

Provenance lines below are what `CREDITS.md` should say. CC0 lines are optional under the law and required by this repo's own credit habit.

| Scene | Asset | Source URL | Licence | Credit line |
| --- | --- | --- | --- | --- |
| Office | Sofa the robots sit on (`loungeSofa`) | https://kenney.nl/assets/furniture-kit | CC0 1.0 | Kenney Furniture Kit (kenney.nl), CC0 |
| Office | Desk | same pack, `desk.glb` | CC0 1.0 | Kenney Furniture Kit (kenney.nl), CC0 |
| Office | Laptop | same pack, `laptop.glb`. Listing: https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z | CC0 1.0 | Kenney Furniture Kit (kenney.nl), CC0 |
| Office | Desk chair | same pack, `chairDesk.glb` | CC0 1.0 | Kenney Furniture Kit (kenney.nl), CC0 |
| Office | Fill light | `RoomEnvironment` in `three/addons` | MIT (three.js) | three.js RoomEnvironment |
| Office, only if a shot is photographic | Sofa 01, Victorian, 4101 tris | https://polyhaven.com/a/Sofa_01 | CC0 1.0 | Sofa 01 by Kirill Sannikov, Poly Haven, CC0 |
| Office | White flash on the cut | HyperFrames `editorial-flash-overlay` | Apache 2.0 | HyperFrames registry, Apache-2.0 |
| Office | Lightning drawing | Existing hero rebuild plus `UnrealBloomPass`. Not a downloaded mesh | MIT (three.js) | three.js |
| Desert establish | Golden-hour sandy HDRI `quarry_01` 2K | https://polyhaven.com/a/quarry_01 and https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/quarry_01_2k.hdr | CC0 1.0 | quarry_01 by Sergej Majboroda, Poly Haven, CC0 |
| Desert wide | Rocky sunset HDRI `rogland_sunset` | https://polyhaven.com/a/rogland_sunset | CC0 1.0 | rogland_sunset by Greg Zaal, Poly Haven, CC0 |
| Desert ground | `aerial_sand` PBR | https://polyhaven.com/a/aerial_sand | CC0 1.0 | aerial_sand by Rob Tuytel, Poly Haven, CC0 |
| Pyramid blocks and pylon | Rock 030, 1K JPG zip | https://ambientcg.com/a/Rock030 and https://ambientcg.com/get?file=Rock030_1K-JPG.zip | CC0 1.0 | Rock 030, ambientCG.com, CC0 |
| Pyramid massing | Instanced boxes using Rock 030. No downloaded pyramid | — | — | Modelled for this film |
| Crews, if they are humanoid | Push and walk clips | https://quaternius.com/packs/universalanimationlibrary.html | CC0 on the pack page as of 2026-11-09 | Quaternius Universal Animation Library, CC0 |
| God reference, not a mesh | Horus protecting Nectanebo II | https://www.metmuseum.org/art/collection/search/544887 and https://images.metmuseum.org/CRDImages/eg/original/DP-38684-002.jpg | CC0 (`isPublicDomain: true`) | Statue of Horus as a falcon protecting King Nectanebo II, The Metropolitan Museum of Art, CC0 |
| Small real falcon in the set | Horus amulet scan | https://sketchfab.com/3d-models/horus-c-2000-1570-bce-839a29d2f176467991d6f5f2ccb6a410 | CC0 | Horus, Minneapolis Institute of Art, CC0, via Sketchfab |
| Papyrus intro | Book of the Dead fragment | https://www.metmuseum.org/art/collection/search/553719 and https://images.metmuseum.org/CRDImages/eg/original/28.3.297_EGDP014610.jpg | CC0 (`isPublicDomain: true`) | Fragments from a Book of the Dead, The Metropolitan Museum of Art, acc. 28.3.297, CC0 |
| Papyrus and vortex signs | Hieroglyph font | https://fonts.google.com/specimen/Noto+Sans+Egyptian+Hieroglyphs | SIL OFL 1.1 | Noto Sans Egyptian Hieroglyphs, SIL Open Font License |
| Chisel title | Cinzel | https://fonts.google.com/specimen/Cinzel | SIL OFL 1.1 | Cinzel by Natanael Gama, SIL Open Font License |
| Captions and laptop UI | DM Sans | https://fonts.google.com/specimen/DM+Sans | SIL OFL 1.1 | DM Sans, SIL Open Font License |
| Name-card pictograms | Ankh, scroll, pyramid icons, author named on each | https://game-icons.net | CC BY 3.0 | Icons by {author}. Available on https://game-icons.net |
| Hero robots | Existing `cute_robot.glb` | https://sketchfab.com/3d-models/cute-robot-6aadb75f596742ada2814ad4593f0032 | CC BY 4.0 | Cute robot by victory_mirosya, Sketchfab, CC BY 4.0. Modified: recolour and animation |
| Stamp and chisel hit | Kenney Impact Sounds, after the pack page is opened | https://kenney.nl/assets | CC0, per https://kenney.nl/support | Kenney (kenney.nl), CC0 |
| Grain on the desert | `grain-overlay` | HyperFrames registry | Apache 2.0 | HyperFrames registry, Apache-2.0 |

Lightning crack, sand whoosh, and the oud/synth theme are not in this table. See Unknowns.

## Decisions

1. **Low-poly kits for anything the robots touch. Scans and PBR for light, sand and stone.** Kenney Furniture Kit is the office. Poly Haven Sofa 01 is optional and stylistically wrong for the comedy master.
2. **Trust the badge on the day of download for Quaternius.** Furniture Pack and the Universal Animation Library still say CC0. The site licence link is now QAL, which forbids redistributing the raw files. QAL section 7 does not reach back to a CC0 download. Re-check the badge.
3. **Mixamo stays out of git.** Rendered into the MP4 is allowed by the FAQ Adobe experts still cite. A public FBX or retarget JSON is not. There is no anonymous URL, so the restore script cannot fetch it. Hero robots are not Mixamo rigs.
4. **Freesound's sounds and Freesound's API are different grants.** CC0 files may be used commercially. The API is free only for non-commercial use unless Freesound agrees otherwise. Humans download. The script does not call the API.
5. **BBC Sound Effects are out.** RemArc is personal, educational and research. This is a product film.
6. **Sketchfab Standard, NC, ND and SA are out.** CC0 and CC BY stay, with the CC BY credit in `CREDITS.md` and, for a published film, where the audience can see it.
7. **Met photographs are CC0 only when `isPublicDomain` is true.** Tiye and Gautsoshen are not. The Horus/Nectanebo statue and the Book of the Dead fragment 28.3.297 are.
8. **No particle library.** Sand and dust are a seeded `Points` field driven by frame time. Bloom is `UnrealBloomPass` or `postprocessing@6.39.6`, one render per frame, no temporal history.
9. **`three-stdlib` is not added.** `three/addons` in 0.181.2 is the copy that matches the renderer.
10. **The pyramid and the sledge are modelled**, from Rock 030 and Kenney planks, until a CC0 mesh is actually found and opened.
11. **HyperFrames blocks before Lottie.** The registry is Apache 2.0 and already seekable. Lottie Simple License files need a seekable player and must stay under that licence if the JSON is shipped.
12. **Cinzel plus DM Sans plus Noto Hieroglyphs.** No "Egyptian" Latin display face. Papyrus the font is not free.

## Unknowns

1. **No verified CC0 pyramid, sledge, or stone-block hero mesh.** Kenney's nature and dungeon kits likely contain rocks and crates. This lane did not open those pack pages, so no filename is claimed.
2. **No verified lightning, sand-wind, or chisel file.** Freesound 717890 looks right and its licence badge was not in the page extract. Sonniss GDC 2026 almost certainly contains all three, and the bundle was not downloaded. Kenney Impact Sounds was not opened as its own page; only the site-wide CC0 statement and the Furniture Kit page were.
3. **No cleared oud-and-synth theme.** Compose it, or lock one Pixabay track after reading that track's page and the full Content License.
4. **Met 3D GLB for object 544887.** The March 2026 release included this statue among the scans. The Collection API does not expose a mesh URL. Someone has to look at the object page and confirm a download plus the OA mark before a GLB enters the restore script.
5. **Smithsonian Egyptian 3D.** The library is CC0 only per model. No Egyptian object was opened.
6. **British Museum.** No downloadable CC BY or CC0 Egyptian mesh was verified. Several famous uploads are view-only or NC.
7. **Poly Pizza API.** Described by third-party clients as v1.1 with `X-Auth-Token` and a public GLB CDN URL. This lane did not call it. The model pages that were opened do show CC0 in the page text.
8. **Adobe's helpx Mixamo FAQ** returned Access Denied. The community FAQ is the text that was read, and community experts on 5 and 8 November 2026 said it is still current. A one-line confirmation from Adobe would still be better before Mixamo clips are used on a humanoid crew.
9. **Pixabay API terms** were not read. The content-licence summary was. Use manual downloads until the API terms are checked.
10. **SVG Repo's house licence** was not read. Skip it.
11. **Quaternius Sci-Fi robot pack** was not opened. Do not assume it is still CC0 from older catalogues. The two pack pages that were opened (Furniture, Universal Animation Library) still say CC0.
12. **HyperFrames catalog was not executed.** Block names are the ones the registry skill and the upstream README list. Run `npx hyperframes catalog` before adding.

## Method

- Skill: `deep-research` was read. Its coordinator workflow (spawn researchers, write a separate `reports/` file, do not research in the parent) conflicts with this lane's fixed deliverable and with "write the skeleton, then fill it". Research was done in this lane. The hyperframes-registry skill was read for the block names and the `catalog` / `add` contract.
- Ptah tools: `search_tool` for `ptah` and for `report` returned no tools. The connected MCP server in this session is `tasks`, and its tools were not exposed to search. Fallback: `web_search`, `web_fetch`, and the native file write. No browser screenshot was taken. This deliverable is a markdown research note, not a rendered UI.
- What was opened or fetched, not merely searched: Quaternius QAL page, Quaternius Furniture Pack, Quaternius Universal Animation Library, Poly Haven licence page, Poly Haven desert-arid asset index, Poly Haven `/files/quarry_01`, Poly Haven `/info/Sofa_01`, Poly Haven aerial_sand page, ambientCG licence search hits and the Rock 030 v2 JSON (download URLs), Met Collection API objects 544887, 553719, 551142 and 550899, Mixamo community FAQ, Freesound sound 717890 (licence line not in the extract), Google Fonts Noto specimen (title only) and the Google Fonts FAQ, the HyperFrames GitHub repository page (Apache-2.0 badge, `registry/` directory present).
- Not done: no large downloads, no git commands, no repository edits except this file.
