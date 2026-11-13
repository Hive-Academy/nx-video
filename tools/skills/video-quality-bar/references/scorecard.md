# Frame scorecard

Score each snapshot frame 1–5 on every row. A frame passes only if every row is 4 or higher.

## Reference frames that set a 5

Paths are relative to `D:/projects/nx-video/demos/`. Open them before you score your own frames.

- `agent-comparison/snapshots/review/contact-sheet-1.jpg` … `contact-sheet-3.jpg`: furnished rooms,
  real window light, textured oak floors, plants, readable gag props, robots at 25–40% of the frame
  facing the lens, captions in the lower band.
- `agent-tribunal/snapshots/3d/contact-sheet-1.jpg` … `contact-sheet-4.jpg` and
  `agent-tribunal/snapshots/3d/frame-00-at-4.45s.png`: lighting on the pleats, throne depth, contact
  shadows, haze, depth of field over the shoulder.

## Rows

| Row | 5 looks like | 3 or below looks like |
| --- | --- | --- |
| **Subject** | The speaker or action is obvious within 0.5 s, fills 20–45% of the frame, faces the lens, and nothing crops it. | The subject is small, cropped, turned away or hard to find. |
| **Set dressing** | Every surface is textured. There are three or more layers of depth (foreground prop, mid-ground action, background). The props tell the scene's joke. | The surfaces are flat, primitives are visible, and there is empty floor or sky where the brief names content. |
| **Light** | A warm key, a cool rim and a fill. Faces and eye glow read. Contact shadows sit under every grounded object. There is atmosphere (haze, dust, bloom) where the scene calls for it. | The light is flat or murky, faces are dark, objects float without shadows, or the frame is blown out. |
| **Effect** | Every promised effect at this cue (spark, bolt, glow, stamp, portal) is visible at phone size and has a clear start and end. | The effect is missing, too small, or reads as a glitch. |
| **Text and safe area** | Captions are ≥ 64 px, ≤ 6 words, inside the lower 22%, with contrast ≥ 4.5:1. No text crosses a face. Cards are inside title-safe. | Text collides, is clipped, sits over a face or has low contrast. |
| **Continuity** | The cast, rig, colours, props and screen direction match the previous shot and the approved still. | Something jumps, a prop vanishes, or the palette drifts from the look-dev. |

## Scoring rules

- Score at the final 4:5 crop (1080 × 1350), not at the 1920 × 1080 render size.
- Score transition frames too. A wipe mid-way through still has to read.
- If you cannot tell whether an effect is visible, score it 3.
