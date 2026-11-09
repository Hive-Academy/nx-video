# GLB models

## Load

Add the file to `assets/models/` and its credit line to `assets/models/CREDITS.md` (author, source
URL, licence, modifications). Load it in `assets.js` with the existing `GLTFLoader` path, next to
`cute_robot.glb`. Load once and `clone(true)` for each instance. Prefer models under 5 MB with
≤ 100k triangles. If you need Draco or Meshopt, wire up the decoder from `three/addons` locally and
never from a CDN.

## Measure before you place

```js
const box = new THREE.Box3().setFromObject(model);
const size = box.getSize(new THREE.Vector3());
const min = box.min; // feet: lift by -min.y so the model stands on y = 0
```

Write the measured numbers into a header comment, the way `robot.js` documents `ROBOT`. Then:

- **Scale** to a target height from the brief (for example, a god as tall as the pyramid):
  `s = targetH / size.y`.
- **Ground** it so it stands on its support with no float or sink: `position.y = support - min.y * s`.
- **Face** the lens. Find the model's forward axis by snapshotting a turntable at 0/90/180/270°.
  Do not guess. The robots face +X, so `yawToward` and `facing` in `util.js` assume +X.
- **Shadows**: set `castShadow` and `receiveShadow` on every mesh. Put a `contactShadowTexture()`
  decal under any grounded hero.

## Recolour to the palette

Traverse the meshes and replace each material by name with a `MeshStandardMaterial`
(`roughness`, `metalness`, `envMapIntensity` 0.3–0.9). This follows `makeMaterials` in `robot.js`.
Keep normal and roughness maps where the model has them. Glowing parts (eyes, runes, a sceptre) get
`emissive` driven by `t`, not by bloom alone.

## Animate

| Need | Do |
| --- | --- |
| Rigid acting (nod, turn, lean, hop) | Group pivots, as in `robot.js` (`ballHead`, `ballSquash`), with poses sampled from cue-keyed curves |
| A baked clip (walk, gesture) | `mixer.clipAction(clip).play(); action.time = localT % clip.duration; mixer.update(0)` on each seek |
| Blink | The GLB's morph target, timed with `hash` |
| Talk | The speaking row's word timings in `config.rows[].words` drive mouth, eye glow or screen pulse |

## Scale next to the robots

A robot at `scale 0.38` is about 0.8 units tall. Express the set in those units: a sofa seat at about
0.45 and a door at about 2.1. Check one frame with the robot and the new model side by side before
you dress the rest of the set.
