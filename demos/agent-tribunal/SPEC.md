# SPEC — The Tribunal, Episode 1 ("The Confessional")

Storyline C from `STORYLINES.md`, picked by the user on 2026-11-05.

```text
GOAL:    the viewer laughs at five picky AI agents, then sees the judge cut through
         them with one verdict: "Remotion for showcase. HyperFrames for promos. No shared code."
OUTPUT:  HyperFrames (hyperframes@0.8.98, pinned), 1920 x 1080, 30 fps
TIME:    the voice is the clock; target 70-90 s. Final length = last line + 3 s end card.
```

## World

Two worlds, cut between like a reality show. Both are Three.js scenes, one
shared rig/helper module.

1. **The Table** (home stage). A round dark-walnut table (#3B2416, roughness
   0.55) on a deep teal studio floor (#0F2A33) with a cyclorama wall
   (#163B47). Five robots sit around the near half of the table, the
   Conductor stands behind a lectern at the far side. Key light warm
   (#FFD9A8, intensity 2.2) from upper left; cool rim (#7FD3FF, 1.4) from
   behind; contact shadows on the table. Camera: 35 mm equivalent
   (fov 38), slow dolly 0.4 m per shot max; on each speaker a 12-frame push
   onto a medium close-up of that robot.
2. **The Booth**. One robot alone, seated, framed chest-up and slightly off
   centre (robot on the left third, look room right). Backdrop is one flat
   saturated colour = that agent's colour at 85% saturation, with a soft
   cushioned-wall texture (procedural vertical pleats, 6% contrast). Handheld
   wobble: seeded noise, 0.6 deg rotation, 8 px translation, 2 Hz. Lower-third
   name strap (see Type).

## Cast

All five agents and the Conductor are `RobotExpressive.glb` (CC0; copy from
`D:/projects/ptah-extension/.claude-worktrees/codex-d9-live/apps/ptah-video-studio/public/models/`
with `CREDITS.md`). Body material re-tinted per agent; eyes/face screen glow in
the agent colour. Names on a brass nameplate on the table (Table) and on the
lower-third (Booth). No vendor logos anywhere.

| Agent       | Colour   | Prop (primitive-built, no extra models) | Default emote while others talk |
| ----------- | -------- | --------------------------------------- | ------------------------------- |
| Claude      | #D97757  | a tall stack of paper                   | Idle, nods ("Yes") on its own lines |
| Codex       | #10A37F  | a coffee mug                            | Idle, arms crossed feel (Sitting) |
| Cursor      | #8C8CFF  | none, leans in                          | leans toward whoever speaks     |
| Antigravity | #4F8BF5  | a floating laptop                       | looks up / away                 |
| OpenCode    | #F2C14E  | a raised hand ready to object           | "No" head shake when others speak |
| Conductor   | #E8A33D (Ptah amber) | gavel + lectern             | still, deadpan                  |

RobotExpressive clips available: Idle, Walking, Running, Dance, Death, Sitting,
Standing, Jump, Yes, No, Wave, Punch, ThumbsUp; face morphs Angry, Surprised,
Sad. Drive `AnimationMixer` with `mixer.setTime(t)` from the `hf-seek` time —
never `mixer.update(delta)` accumulation.

**Talking:** the robot has no mouth. A speaking robot gets (a) head bob from
the line's precomputed audio RMS envelope (pitch 4-7 deg, offset 2 frames
behind the audio), (b) eye glow intensity from the same envelope, (c) one
gesture clip per line timed to its stressed word. Envelopes are computed once
from the WAVs into `assets/audio/envelopes.json` at build time.

## Script

`[T]` = Table, `[B:Name]` = Booth. Times are filled in from real voice
durations; lines play back-to-back with 0.25 s gaps unless marked overlap.

| # | World | Speaker | Line | Action / sound |
|---|-------|---------|------|----------------|
| 1 | B:Codex | Codex | "Let me be clear." *(beat)* "I already merged it." *(beat)* "Into main." | Cold open. Deadpan; sips mug on the beat. Reality sting on cut out. |
| 2 | Title | — | THE TRIBUNAL / "Episode 1: Remotion or HyperFrames?" | Title slams in on a hit; 2.5 s. |
| 3 | T | Conductor | "Tonight's question. The nx-video plugin. Remotion, or HyperFrames. One engine. Go." | Wide → push to lectern. Gavel tap on "Go". |
| 4 | T | Claude | "Great question! Before we decide, I've drafted a short plan. Step one of forty-three—" | Paper stack thuds onto table. |
| 5 | T | Cursor | "—forty-three reasons to do whatever Cursor says. You're welcome." | Overlaps #4 by 0.3 s. Leans into Claude's space. |
| 6 | T | Claude | "That is not what I was going to say." | Angry morph, slow. |
| 7 | B:Claude | Claude | "I respect everyone at that table. I've also written a document on why they're wrong. It's forty pages. With caveats." | Sting in. |
| 8 | T | Antigravity | "Why pick one? I've opened a browser. I'm rebuilding both engines. In 3D." | Laptop floats up. |
| 9 | T | OpenCode | "Objection. Is that browser open source?" | Hand up (Punch clip, half speed, into a raise). |
| 10 | T | Antigravity | "…It's open." | Two-beat pause before. |
| 11 | B:OpenCode | OpenCode | "I objected to Remotion's licence. I objected to HyperFrames' pinned versions. I objected to my own idea. Twice. Consistency matters." | |
| 12 | T | Codex | "Guys. It's merged. Remotion, HyperFrames, and a third one I found." | ThumbsUp. |
| 13 | T | Claude | "Did you run the tests?" | Surprised morph. |
| 14 | T | Codex | "The tests are vibes." | Sip. Hard cut. |
| 15 | B:Cursor | Cursor | "I don't interrupt people. I just finish their thoughts. Before they have them." | |
| 16 | B:Antigravity | Antigravity | "Nobody at that table has ever seen the sun. I have. I took a screenshot." | Looks up. |
| 17 | T | All five | Overlapping chaos, 3 s: fragments of each robot's catchphrase at once | Camera whips between them, 6-frame cuts. |
| 18 | T | Conductor | GAVEL. "Enough." *(beat)* "I read the diff." | Silence after the gavel, 0.6 s. Close-up. |
| 19 | T | Conductor | "Remotion for the showcase. HyperFrames for the promos. No shared code." | Verdict card stamps in (see Verdict). |
| 20 | T | All five | *(pause)* "…That's what I said." | In unison, wide shot, every robot turns to camera. |
| 21 | B:Codex | Codex | "Reverting." | Tag. Sting out. |
| 22 | End | — | "The Tribunal" mark + "Five agents. One verdict." + "ptah" | 3 s hold. |

Line 17 fragments (short separate TTS clips): Claude "Step two—", Cursor
"—says Cursor", Antigravity "In 3D!", OpenCode "Objection!", Codex "Merged!".

## Voices (ElevenLabs)

Key in `d:/projects/nx-video/.env` as `ELEVENLABS_API_KEY` (gitignored; never
print it, never write it into any other file). Pick premade voices from
`GET /v1/voices`; each must be clearly distinct:

- Claude: warm, articulate, slightly over-eager (male or female, mid pitch).
- Codex: flat, laconic, deadpan, low.
- Cursor: fast, smug, bright.
- Antigravity: dreamy, airy, a little spaced-out.
- OpenCode: nasal, precise, pedantic.
- Conductor: deep, slow, judge-like gravitas.

Model `eleven_multilingual_v2` (or the newest TTS model the account lists).
Write each line to `assets/audio/vo/NN-speaker.mp3`, record the chosen
voice ids and settings in `assets/audio/voices.json`. SFX via
`POST /v1/sound-generation`: gavel hit (x2 takes), reality-show sting (x2),
title slam, whoosh (x2), paper-stack thud, mug sip. Music bed: try the
ElevenLabs music endpoint for a 90 s "playful reality-TV pizzicato comedy
bed, 100 bpm"; if unavailable on the plan, deliver without music and say so.
Mix: music 0.14 under voice, drops out on the gavel (#18) and returns under
the end card. Normalize to −16 LUFS, peaks ≤ −1 dBTP.

## Type

- Title + end card: "Archivo Black" (bundled if available, else `@font-face`
  from `assets/fonts/`), 168 px, tracking −2%, ink #FFF6E5 with a hard 6 px
  offset shadow in the accent amber #E8A33D (no blur).
- Booth lower-third: a slanted (−6°) solid bar in the agent colour, 64 px
  tall, name in Archivo Black 44 px #FFF6E5, under it a 26 px tagline in
  Inter 600: Claude "Has a plan", Codex "Already merged it", Cursor "Finishes
  your sentences", Antigravity "Opened a browser", OpenCode "Objects". Wipes
  in left→right in 8 frames, out in 6.
- Verdict card: a cream (#F4E9D3) legal-paper card, 900 x 520, filling the
  centre over a dimmed (not blurred) table shot; three lines in Archivo Black
  64 px ink #1A1410; a red (#C8342B) rubber stamp "VERDICT" rotates −12° and
  slams down (scale 1.6→1.0 in 5 frames, 2-frame shake).

## Motion

- Camera moves: `power2.inOut`, pushes 12 frames, whips 6 frames.
- Lower-thirds and the title: `expo.out` in, `power2.in` out.
- Character emotes: clip crossfades 6 frames; morph targets ease in 8 frames,
  hold, ease out 10 frames.
- Cuts: Table ↔ Booth are hard cuts with the sting; no dissolves anywhere.

## BANNED

Dark void with floating things, glow/bloom/particles, purple-blue gradients,
glass cards, corner HUD labels, docked logos, captions that repeat the voice,
everything fading in together, dissolves between worlds, vendor logos,
`Math.random()`, `mixer.update()`.

## QA frames

- Frame 0: Codex in the booth, already readable as a reality-show confessional.
- Line 5 overlap: both robots in frame, Cursor visibly leaning in.
- Every booth shot: lower-third legible, robot on the left third.
- Line 17: five different speakers within 3 s.
- Line 19: verdict card fully readable at least 2.5 s.
- End card: the mark holds ≥ 2.5 s.

---

# Revision 2 — 2026-11-05 (overrides everything above where they conflict)

User feedback on the first cut: the table scenes read as a flat 2D layout, not a
3D set. Add provider icons, comic speech bubbles with emojis in the booths, more
physics on the robots, and an intro + one-word punch promo instead of opening on
Codex.

## Robot model

`assets/models/cute_robot.glb` for all six characters ("cute robot" by
victory_mirosya, CC BY 4.0 — credit on the end card and in
`assets/models/CREDITS.md`). Rigid parts, no skeleton: body `Cylinder_0`
(BODY, GLOW, SCREEN), `Cube.002_1` (BODY, Material.001), two EYES planes with a
blink morph. Model faces +X.

## New running order

| # | Scene | Content |
|---|-------|---------|
| 1 | `intro` | Kinetic text on a flat studio-teal ground, no 3D: "A day in the life of a developer…" (≈1.8 s) → hard cut → "…who asked five AI agents one question." (≈2.2 s, "five AI agents" in amber #E8A33D). Music in, one whoosh per cut. |
| 2 | `punch-*` (6 shots) | Reality-show teaser. 0.7–0.9 s each, hard cuts, each agent in its booth colour lunging at camera and shouting ONE word that slams into frame next to it with an impact hit: Claude **"PLAN."** → Cursor **"AUTOCOMPLETE!"** → Antigravity **"BROWSER!"** → OpenCode **"OBJECTION!"** → Codex **"MERGED."** → Conductor **"ORDER."** (gavel). |
| 3 | `title` | THE TRIBUNAL / "Episode 1: Remotion or HyperFrames?" slams in on the gavel's tail. |
| 4 | `table-1` | rows 3–6 |
| 5 | `booth-claude` | row 7 |
| 6 | `table-2` | rows 8–10 |
| 7 | `booth-opencode` | row 11 |
| 8 | `booth-codex` | row 1 moved here ("Let me be clear. I already merged it. Into main.") — sets up row 12 |
| 9 | `table-3` | rows 12–14 |
| 10 | `booth-cursor`, `booth-antigravity` | rows 15, 16 |
| 11 | `table-chaos`, `table-verdict`, `booth-codex-tag`, `endcard` | rows 17, 18–20, 21, 22 |

Punch-word voice lines (new TTS, same voice ids as `assets/audio/voices.json`):
P1 Claude "Plan." · P2 Cursor "Autocomplete!" · P3 Antigravity "Browser!" ·
P4 OpenCode "Objection!" · P5 Codex "Merged." · P6 Conductor "Order." Shouted,
punchy delivery (low stability, high style).

## 3D: a real set, not a flat layout

The table world is a physical studio set the camera moves *through*:

- Depth layers: foreground (an out-of-focus robot shoulder or table edge in
  over-the-shoulder shots), midground (the table, robots on stools around its
  far 200°, lectern raised behind), background (cyclorama, two practical stage
  lamps on stands, a hanging lighting truss, a "TRIBUNAL" set sign in the back).
- Every robot, prop and stool sits on real geometry with real shadow-mapped
  shadows (PCFSoft, key light casts). Feet/bases touch their seat or the floor;
  nothing intersects anything. Fit placements from world-space bounding boxes.
- Camera is a world-space rig (position + look-at target + fov), framing
  computed by projecting the subject's bounding box, not by screen offsets:
  establishing crane-down from above the truss, slow dolly pushes onto the
  speaker, over-the-shoulder reverse shots (listener's shoulder soft in the
  foreground), a low hero angle on the Conductor, and whips in the chaos row.
  Never the same angle twice in a row.
- Atmosphere: `FogExp2` haze for depth falloff (density tuned so the cyc
  recedes), two faint visible light cones from the stage lamps (≤ 8% opacity
  additive meshes), warm key #FFD9A8 upper-left, cool rim #7FD3FF from behind,
  contact shadows. Still banned: bloom, lens flares, floating particles.

## Physics (deterministic)

Simulate once at load with a fixed 1/120 s step over each scene's duration into
arrays; render samples by time. No `Math.random()` (seeded hash only).

- Hops under gravity with anticipation squash, airtime, landing squash and a
  damped spring settle (damping ratio 0.35–0.5).
- Secondary motion: the head part (`Cube.002_1`) rides the body on a spring, so
  it lags and wobbles after every hop, nod, lean or impact.
- Gavel strikes put an impulse into the table: props (paper stack, mug, laptop,
  nameplates) and seated robots jump and settle.
- Row 4: Claude's paper stack thuds down and the top sheets slide. Row 17 chaos:
  robots jostle and bump with collision impulses; Claude's sheets fly off the
  table and land.
- Punch shots: lunge toward camera with overshoot and spring recoil.

## Provider icons

Real provider icons (user-requested; overrides "no vendor logos"): Claude,
Codex (OpenAI), Cursor, Antigravity, OpenCode; the Conductor uses Ptah's own icon
(`D:/projects/ptah-extension/apps/ptah-landing-page/public/assets/icons/ptah-icon.webp`
or `ptah-logo.svg`). Files: `assets/icons/<id>.svg` and `assets/icons/<id>.png`
(512 × 512, transparent), ids `claude, codex, cursor, antigravity, opencode, ptah`,
with source and licence of each in `assets/icons/CREDITS.md`. Shown on: the
brass nameplates and a round chest badge on each robot (3D), the booth
lower-third strap, the speech bubble header, and the punch cards.

## Booth speech bubbles

The empty right side of every booth shot holds a comic speech bubble: cream
#FFF6E5 fill, 5 px ink #1A1410 outline, hard 8 px offset shadow, a tail pointing
at the robot's screen. The agent's line builds word by word in sync with the
voice (word timings from ElevenLabs forced alignment on the existing VO files —
do not regenerate the voices). Key words in Archivo Black, the rest Inter 700,
44–56 px; 2–3 emojis per line pop in on their punchline words with a squash
(Noto Emoji images, Apache-2.0, vendored in `assets/emoji/`, never the system
emoji font). The bubble pops in with a spring and out with a quick shrink. Max
~14 words visible; long lines page.

## BANNED changes

Removed: "vendor logos", "captions that repeat the voice" (the booth bubble is
user-requested). Added: robots or props intersecting geometry, a camera that
holds the same angle across consecutive shots, screen-space framing in 3D.
