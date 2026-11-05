# Agent Tribunal — storylines

A pilot video made before the nx-video tools exist, so we learn the pipeline
(HyperFrames 3D + ElevenLabs voices) on a real piece.

**The one thing:** five AI agents argue about your task, nitpick each other to
pieces, and the Tribunal still hands you one verdict.

**The task they debate (real, from this repo):** *"Which engine should the
nx-video plugin use: Remotion or HyperFrames?"* (`docs/decisions.md` answer:
both, no shared code). The joke is that they all fight, and the verdict is the
compromise none of them wanted.

**Cast** (CC0 `RobotExpressive.glb`, one per agent, tinted by colour; names on
nameplates, no vendor logos):

| Agent       | Running gag                                                            |
| ----------- | ---------------------------------------------------------------------- |
| Claude      | Answers a yes/no question with a 40-step plan and a caveat per step    |
| Codex       | Already shipped it. Tests? "The tests are vibes."                      |
| Cursor      | Autocompletes everyone else's sentences, wrongly                       |
| Antigravity | Wants to rebuild the whole thing in a browser it opened itself         |
| OpenCode    | Objects on licence grounds to every proposal, including its own        |
| Conductor   | The Ptah judge: gavel, deadpan, the only one who reads the diff        |

---

## A. Order in the Court (recommended)

*Recommended: a stranger gets it in two seconds (courtroom = judgement), and
every joke has a place to land.*

- **Device / form:** character does the work · flight through one world (one
  3D courtroom, the camera travels bench to bench, never a plain cut).
- **What you see and feel:** a wood-and-brass courtroom built for robots. Each
  agent takes the stand, makes its case, and gets shot down by the next; the
  camera whips between them faster as the fight escalates, then the gavel.
- **First 2 s:** extreme close-up of the gavel coming down, *BANG*; camera
  rips back to reveal five robots all talking at once.
- **Beats:** gavel hook → the docket ("Remotion or HyperFrames?") → five
  opening statements, each cut short by the next agent's objection → chaos
  (all five at once, Codex has already merged) → Conductor reads the diff →
  verdict lands as a stamped card: "Both. No shared code." → end card.
- **Look:** warm walnut and brass under one hard key light, cool rim on the
  robots, each agent's colour only on its nameplate and eye glow; big serif
  verdict type.
- **Sound:** ElevenLabs voice per agent + Conductor, gavel/objection SFX,
  light orchestral-comedy bed that drops out on the verdict.

## B. Five Panes

- **Device / form:** life before and after · split screen to one.
- **What you see and feel:** five terminal-like panes, one per agent, each
  robot living inside its pane. They start leaning into each other's panes,
  shoving, typing over each other's output, until the screen is a mess; then
  the panes collapse into one clean verdict pane.
- **First 2 s:** five panes snap on at once, five robots say "Actually…" in
  perfect unison.
- **Beats:** unison "Actually" → each pane makes its case → panes invade each
  other (Cursor autocompletes into Claude's pane, Codex drags a merged PR
  across all five) → Conductor pulls the plug → collapse to one pane →
  verdict → end card.
- **Look:** near-black desktop, Ptah amber accent, mono type inside the panes,
  robots lit only by their own pane glow.
- **Sound:** voices + keyboard clatter that builds into a wall, silence on the
  collapse, one synth hit on the verdict.

## C. The Confessional (bold)

- **Device / form:** reality-TV show · cut between two worlds (the debate
  table and a confessional booth).
- **What you see and feel:** a 3D roundtable shot like a reality show; every
  few lines we cut to one robot alone in a booth, talking to camera, trashing
  the others ("I'm not here to make friends. I'm here to make PRs.").
- **First 2 s:** Codex in the booth, close-up, deadpan: "Let me be clear. I
  already merged it." Smash cut to the table.
- **Beats:** booth cold open → table: the question → argument / booth /
  argument / booth (each agent gets one confession) → elimination-style
  verdict at the table, the Conductor "reads the votes" → end card.
- **Look:** table in cool studio blue, booth in saturated single-colour per
  agent with a lower-third name strap; handheld wobble only in the booth.
- **Sound:** voices, reality-show sting on every booth cut, tension drone
  under the verdict.

---

**Assumptions:** 1920×1080, 30 fps, 60–90 s. Voiced (paid ElevenLabs TTS +
SFX; free fallback: local TTS via the media-use skill). Models are CC0
(`RobotExpressive`, Poly Pizza props) copied from Ptah's video studio. Rendered
media and audio are never committed (public repo); only the composition
source and this document.
