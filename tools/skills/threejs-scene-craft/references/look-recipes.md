# Look recipes

## Renderer (already set up in `scene.js`; do not change it per set)

The renderer uses sRGB output, `NeutralToneMapping` at exposure 1, `PCFSoftShadowMap`, and a PMREM
`RoomEnvironment` as the env map. The optional `SoftFocusPass` gives depth of field over the
shoulder. Hide additive cones and decals from its depth pass through `scene.userData.noDepth`.

## Lighting (three-point at minimum)

| Set mood | Recipe |
| --- | --- |
| Warm interior or temple | `buildTempleLights`: a warm gold shadow-casting key, a restrained cool rim, hemisphere fill, amber practicals, deep shadows |
| Studio or office | `buildStudioLights(scene, lamps)`: daylight key through real window openings, plus practical lamps |
| Night | `buildNightLights`: a blue key and hemisphere, plus a moon spot |
| Close-up booth | `buildBoothLights`: a warm key from the upper left and a cool rim, with the shadow cast away from the caption side |
| Golden-hour exterior | A low sun key (warm, elevation 8–15°, long shadows, shadow camera fitted tight to the action), a sky-blue hemisphere fill, a warm bounce from the ground, `scene.fog` matched to the horizon colour |

Faces must read: if a robot's screen is dark, add a small fill aimed at the face rather than raising
exposure. Volumetric shafts come from `lightCone(from, to)`.

## Set dressing

- **Three depth layers in every shot**: a foreground prop (soft, from depth of field), the action
  in the mid-ground, and a background with detail.
- **No bare surface the camera holds on.** Use a sourced PBR texture (wood, sand, sandstone,
  plaster) at the right repeat, or a seeded canvas texture from `textures.js`. Break up repetition
  with seeded scale, rotation and tint.
- **Props tell the joke.** Each scene's gag prop is named in the brief, is lit, and is framed
  frontally when it matters.
- **Crowds and crews**: clone robots with `createRobot` at varied seeded scale (0.30–0.38), act
  them with offset sampled cycles, and give each crew its own banner and colour.
- **Exterior scale**: put the sky on a gradient dome or HDRI, add a far ridge or skyline card,
  mid-ground structures, and near detail (rocks, tools, ropes, footprints). An empty ground plane
  reads as unfinished.

## Atmosphere

Use fog matched to the sky, seeded dust or sand particles (points with a soft sprite, positions as
a function of `t`), heat-haze or bloom only where the brief calls for it, and contact shadows on
everything grounded.

## Effects (spark, bolt, flash, glow, portal, stamp)

- Build them as meshes or sprites in the 3D scene, or as a 2D overlay when they are screen-space
  (a flash or a title).
- Key each one to a cue with an in, hold and out envelope (`keyedHold` in `util.js`). It must stay
  visible for at least 8 frames.
- A bolt is a jagged polyline: seeded midpoint displacement, regenerated every 2–3 frames from
  `hash(cue, frame)`, an additive bright core plus a wider glow, and a light that pulses at the
  same time.
- A light event (lights dip, a flash) changes the actual light intensities, not just an overlay.

## Camera grammar

- Frame a speaker with `framed(cam, centre, radius, dir, { fill, ndcY })`: a 12-frame push in,
  then a slow drift. Keep the face at `ndcY` about 0.18 so it stays clear of the caption band.
- Use a `keyed` camera for reveals and pans, and `follow` for walk-and-talk shots.
- Add seeded handheld on top (`handheld` in `camera.js`: 0.8°, 10 px, 1.6 Hz). Use 6-frame whip
  pans between rooms.
- Use a wide shot only to establish, and keep the action at 15% or more of the frame. Cut to a
  speaker within 1.5 s of the line starting.
- At 4:5, the lower 22% of the frame belongs to captions. Keep faces and effects out of it.
