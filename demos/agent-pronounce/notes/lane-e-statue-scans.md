# Egyptian statue scans for the Ptah film

## Candidates

Each page says **Download 3D Model**. Sketchfab [documents glTF as the standard export for downloadable models](https://sketchfab.com/features/gltf); its [download guide](https://sketchfab.com/developers/download-api/downloading-models) says the glTF archive contains `scene.gltf`, `scene.bin`, and a textures directory. A Sketchfab login is needed to request the download. The source upload format, texture type, and texture resolution were not exposed by the public model metadata, so no OBJ, FBX, STL, or image resolution is asserted here. Counts and the presence of one texture were checked against the public Sketchfab model API; no model files were downloaded.

| Title | Author or museum | Page and direct download format | Geometry and texture | Licence exactly as stated on its page; attribution text for film credits | Verdict |
| --- | --- | --- | --- | --- | --- |
| Ptah-Sokar-Osiris Figure (W2059) | The Egypt Centre, Swansea University | [Model page](https://sketchfab.com/3d-models/ptah-sokar-osiris-figure-w2059-1fe96a1e10514357bcf2e05225f44ea4); downloadable glTF 2.0 (`scene.gltf` plus binary and texture) | 611,526 triangles; 305,765 vertices; texture: **yes**, one; resolution unverified | Page [licence line](https://sketchfab.com/3d-models/ptah-sokar-osiris-figure-w2059-1fe96a1e10514357bcf2e05225f44ea4): “CC Attribution Creative Commons Attribution”; linked [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit: “Ptah-Sokar-Osiris Figure (W2059) by The Egypt Centre, CC BY 4.0, adapted for the Ptah film,” with links to model and licence. | **Usable with work.** Best full mummiform body. Replace its tripartite wig with a lapis skullcap; sculpt hands and was-djed-ankh sceptre; remove or conceal back pillar and plinth; retopologise and bake texture for Three.js. |
| Statue Of Osiris (HARGM10469) | The Egypt Centre; object from Harrogate Museum collection | [Model page](https://sketchfab.com/3d-models/statue-of-osiris-hargm10469-bd4e46dfa73547549838cbfa69aecadb); downloadable glTF 2.0 | 607,164 triangles; 303,584 vertices; texture: **yes**, one; resolution unverified | Page [licence line](https://sketchfab.com/3d-models/statue-of-osiris-hargm10469-bd4e46dfa73547549838cbfa69aecadb): “CC Attribution Creative Commons Attribution”; [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit: “Statue Of Osiris (HARGM10469) by The Egypt Centre, CC BY 4.0, adapted for the Ptah film,” with links. | **Usable with work.** Mummiform, standing and detailed, but Atef crown, crossed arms, crook and flail differ from Ptah. Remodel headwear, arms, hands and sceptre; repair damaged scan areas; retopologise and bake. |
| Osiris | Daniel Pett | [Model page](https://sketchfab.com/3d-models/osiris-7766da51162247688bcc21b196866ee3); downloadable glTF 2.0 | 499,996 triangles; 250,003 vertices; texture: **yes**, one; resolution unverified | Page [licence line](https://sketchfab.com/3d-models/osiris-7766da51162247688bcc21b196866ee3): “CC Attribution Creative Commons Attribution”; [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit: “Osiris by Daniel Pett, CC BY 4.0, adapted for the Ptah film,” with links. | **Usable with work.** A full Osiris statue, but the creator says the mesh is rough and the texture conceals defects. Clean scan, retopologise, bake and remodel Ptah headwear and attributes. |
| Ptah-Sokar-Osiris Figure (W2060a) | The Egypt Centre, Swansea University | [Model page](https://sketchfab.com/3d-models/ptah-sokar-osiris-figure-w2060a-3cdfe9c03015406aabfeb6334833f6a9); downloadable glTF 2.0 | 619,986 triangles; 309,993 vertices; texture: **yes**, one; resolution unverified | Page [licence line](https://sketchfab.com/3d-models/ptah-sokar-osiris-figure-w2060a-3cdfe9c03015406aabfeb6334833f6a9): “CC Attribution Creative Commons Attribution”; linked [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit: “Ptah-Sokar-Osiris Figure (W2060a) by The Egypt Centre, CC BY 4.0, adapted for the Ptah film,” with links. | **Usable with work.** Head only, with Atef crown and modern stand; cut away stand, replace crown with skullcap, and fit head to a newly modelled or procedural body. |

## Rejected

| Title | Page | Licence evidence | Reason |
| --- | --- | --- | --- |
| Statue of Osiris (MFA Boston 29.1131) | [Sketchfab model](https://sketchfab.com/3d-models/statue-of-osiris-780727563132498fbd3da97ec9057478) | The page shows “CC Attribution” but its own description says “This model should be used for non-commercial, study purposes only.” | **Reject:** creator's explicit use restriction conflicts with commercial promotional use, despite the licence badge. |
| Colossal Head of Hatshepsut-Revised Nov 2018 | [Sketchfab model](https://sketchfab.com/3d-models/colossal-head-of-hatshepsut-revised-nov-2018-93ecef7a7bd6461abd6a7f3e21a7f099) | Page licence: “CC Attribution-NonCommercial Creative Commons Attribution-NonCommercial.” | **Reject:** NC excludes the film. |
| Ptah-Sokar-Osiris Statue of Djedhor | [Sketchfab model](https://sketchfab.com/3d-models/ptah-sokar-osiris-statue-of-djedhor-eb7e0eaacb284075b1045fad2a3c980e) | Its page shows no licence line or Download 3D Model button. | **Reject:** rights and downloadable file are unconfirmed. |
| Statue of the God Ptah | [The Met object page](https://www.metmuseum.org/art/collection/search/587598) | The object page describes the bronze statue, but no downloadable 3D mesh or mesh licence was found there. | **Reject as a mesh source:** excellent visual reference, but no verified 3D asset. |

## Ranking

| Rank | Candidate | Reason |
| --- | --- | --- |
| 1 | Ptah-Sokar-Osiris Figure (W2059) | A licensed museum scan of a complete mummiform Ptah-related figure; the silhouette and straight beard need less rebuilding than the alternatives. |
| 2 | Statue Of Osiris (HARGM10469) | Complete standing mummiform scan of similar density; arms and headwear need more substantial changes. |
| 3 | Osiris by Daniel Pett | Complete CC BY scan with texture, but the creator flags poor mesh quality; budget time for cleanup. |

## Recommendation

| Choice | Fit for the 24 m Ptah statue |
| --- | --- |
| Use W2059 as the base mesh | Import its glTF, measure the full figure in Blender, set the mesh scale so the statue from feet to skullcap reaches 24 m, and preserve its scanned mummiform body and face. Remove the plinth and back pillar where visible. Rebuild the wig as a lapis skullcap, add a gold collar, pose or model hands clasping a procedural was-djed-ankh sceptre, then retopologise and bake the scan's colour and normal detail to a production mesh for Three.js. Keep the model and CC BY 4.0 links in film credits and record the adaptations. |

## Decisions

| Question | Decision |
| --- | --- |
| Commercial clearance | All four candidates have an individual model page showing “CC Attribution”; the public Sketchfab API resolves their licence to CC BY 4.0 and says commercial use is allowed. The [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/) require creator credit, licence link and notice of changes. |
| What remains unverified | The archives were not downloaded, so texture resolution, exact image type, UV quality, watertightness, back-side capture, physical scale in the glTF, and original uploaded format remain unchecked. A 3D artist should inspect these before final selection. |
| Tool availability | No Ptah MCP tools or CLI skill discovery were exposed in this lane. Web search, Sketchfab's public metadata API and native file editing were used as fallbacks. |
