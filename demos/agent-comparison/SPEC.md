# SPEC — Agent Cribs (The Tribunal, Episode 2)

Storyline C ("Cribs") from `STORYLINES.md`, picked by the user on 2026-11-05.

```text
GOAL:    the viewer laughs, then understands in one sitting how T3 Code and Ptah
         differ in the way they host the same agents — and meets Ptah. Neither wins.
OUTPUT:  HyperFrames (hyperframes@0.8.98, pinned), 1920 x 1080, 30 fps
TIME:    the voice is the clock; target 60–75 s. End card 3.5 s.
TONE:    affectionate house tour. T3 Code is shown with respect: its own name and
         logo to identify it, never mocked, no scoreboard, no "better".
```

Every claim on screen or in the script traces to `COMPARISON.md` /
`research/*.md`. Do not add claims.

## Engine reuse

This project reuses Episode 1's engine from `../agent-tribunal/` (copy, do not
import across projects): the cute_robot rig and physics, the temple set, the
shared WebGL renderer, the audio pipeline (`scripts/audio`), the generator
pattern (`src/build-timing.mjs` → `index.html`, `compositions/*`,
`src/timing.json`), icons, emoji, the Ptah emblem and the same ElevenLabs voices
(`../agent-tribunal/assets/audio/voices.json`). Same cast colours (OpenCode is
black and white).

## The format

An MTV-Cribs-style reality house tour (generic "Cribs" format — no MTV name or
logo anywhere). The robots are the hosts. Two homes, toured in turn: **T3 Code**
(a bright modern loft) and **Ptah** (the Episode 1 temple). Handheld walk-and-talk
camera, door reveals, a fridge reveal in each house, room-label lower-thirds, an
address card at each front door.

## Script

`[scene]` is the world. Times come from the real voice durations; 0.2 s gaps.

| # | Scene | Speaker | Line | Picture / sound |
|---|-------|---------|------|-----------------|
| C1 | `door-cold` | Codex | "Welcome to my crib." *(beat)* "Both of them." | Cold open. Codex at a front door in sunglasses, leans on the frame. Doorbell chime under the first word. Frame 0 already reads. |
| T0 | `title` | — | **AGENT CRIBS** / "Episode 2: same agents, two homes" | Title slams on a record scratch; 2.5 s. |
| H1 | `t3-door` | Claude | "This is T3 Code. Every one of us gets our own room!" | Address card: T3 Code logo · "T3 Code" · "t3.codes". Door swings open onto the loft. |
| H2 | `t3-hall` | Cursor | "My own room. Nobody to interrupt." *(beat)* "…Weird." | Walk down a hallway of identical doors with nameplates: Codex, Claude, Cursor, OpenCode, Antigravity, Grok, Pi. Room label: ONE AGENT PER THREAD. |
| H3 | `t3-codex-room` | Codex | "Commit, push, PR. One button. I love it here." | Codex at a desk with one big button; presses it. Room label: THE SHIP ROOM. |
| H4 | `t3-antigravity-room` | Antigravity | "They installed me themselves. I feel so seen." | Antigravity in a room with a fresh install box, ribbon on. Room label: SETUP INCLUDED. |
| H5 | `t3-hall` | OpenCode | "Need another vendor? Slide a note under the door." *(beat)* "They get the note. Not the gossip." | A sticky note slides under a door into another robot's room. Room label: THE NOTE SLOT (delegate_task). |
| H6 | `t3-clock` | Claude | "Every turn gets a checkpoint. Mess up? Rewind!" | A wall of clocks spins backwards; tape-rewind sound. Room label: THE TIME MACHINE. |
| H7 | `t3-phone` | Cursor | "And you can boss us around from your phone." | A giant phone on the wall lights up with the loft inside it. Room label: THE REMOTE. |
| H8 | `t3-fridge` | Codex | "The fridge? Event-sourced SQLite. Always fresh." | Fridge door opens, light spill, neat labelled jars. Room label: THE FRIDGE. |
| P1 | `ptah-door` | Conductor | "Welcome to the temple. Here, one of us holds the gavel." | Address card: Ptah emblem · "Ptah" · "ptah.live". Temple doors open; gavel tap on "gavel". |
| P2 | `ptah-lanes` | Conductor | "I hand out the jobs." | Robots peel off to work stations (lanes). Room label: THE LANES. |
| P3 | `ptah-lanes` | Claude | "And if there's no file on disk… it didn't happen." | A deliverable file lands in a tray, stamped "DELIVERED". Room label: RECEIPTS. |
| P4 | `ptah-review` | Codex | "I tried to review my own code." | Codex reaching for its own file at a review desk. |
| P5 | `ptah-review` | Conductor | "Different family. Next." | Gavel. Another-colour robot takes the file. Room label: THE REVIEW DESK. |
| P6 | `ptah-gate` | OpenCode | "I ran out of free credits mid-job once." | OpenCode at a gate with a red "AT LIMIT" sign. |
| P7 | `ptah-gate` | Conductor | "So the temple sent the work to someone else." | The job slides past OpenCode to another robot. Room label: THE LIMIT GATE. |
| S1 | `ptah-scoreboard` | Conductor | "The temple keeps score. Who delivered, who didn't." | A carved stone scoreboard: one column per robot (icon on top), tally marks for delivered and failed lighting up in gold as he speaks. Room label: THE SCOREBOARD. |
| S2 | `ptah-scoreboard` | Codex | *(beat)* "…I'm working on my numbers." | Codex looks up at its own column, then away; tiny sheepish hop. |
| P8 | `ptah-fridge` | Claude | "The fridge? BM25 plus vectors. Leftovers from every session!" | A stone fridge opens onto glowing labelled scrolls. Room label: THE FRIDGE (project memory). |
| N1 | `ptah-nightshift` | Claude | "We even review your pull requests on a schedule. Four lenses, one verifier." | The temple at night (moonlight through the skylight, braziers low). A long scroll (the PR diff) unrolls across a table; four robots lean over it, each holding a magnifying lens in its own colour; a fifth robot with a stamp checks their notes. Room label: THE NIGHT SHIFT. |
| N2 | `ptah-nightshift` | Cursor | "Dry-run by default. We have manners." | Cursor lifts a small sign reading DRY RUN; nothing leaves the temple. |
| P9 | `ptah-tribunal` | Cursor | "And when we disagree…" | Cut to the Episode 1 table. |
| P10 | `ptah-tribunal` | Conductor | "The Tribunal." | Gavel. Room label: THE TRIBUNAL. |
| E1 | `both` | — | Card: "So… which one do you live in?" | Record scratch. Both homes side by side, robots between them. |
| E2 | `both` | All five | "…Both." | Unison (five takes layered), all turn to camera. |
| E3 | `both` | Codex | "Rent's free. They're both MIT." | Sunglasses back on. |
| E4 | `endcard` | — | "Same agents. Two homes." · Ptah emblem + "ptah.live" · "T3 Code — t3.codes" · credits line | 3.5 s hold. |

Facts behind the lines (from `COMPARISON.md`): one agent per thread (H1–H2);
commit → push → PR stacked action (H3); T3 installs and versions Antigravity
(H4); `delegate_task` child gets only the task prompt (H5); per-turn checkpoints
with restore (H6); iOS/Android clients (H7); event-sourced SQLite (H8); main
agent as Conductor (P1–P2); deliverables checked on disk (P3); reviewer may not
share the implementer's model family (P4–P5); at-limit lanes refused and routed
around — and OpenCode really hit its free limit while making Episode 1 (P6–P7);
BM25 + vector memory (P8); Tribunal panels (P9–P10); both MIT (E3); every lane
run recorded with disk-checked deliverables and fed into a 90-day routing score
(S1–S2, `research/routing-and-learning.md` §1–2); ptah-review — scheduled PR
review with triage, four lens lanes and a verifier, dry-run by default
(N1–N2, PRs #924, #935, #946). Running order in the temple: P1–P7, S1–S2, P8,
N1–N2, P9–P10. Target length is now 75–85 s.

## Captions

This film is for X and LinkedIn, which autoplay muted: every spoken line gets a
word-synced caption (forced alignment), bottom-centre inside title-safe, cream
#FFF6E5 Inter 700 46 px on a soft dark band, key words in Archivo Black with the
speaker's colour as a highlighter swipe, 1–2 emoji per line popping on the
punchline word (vendored Noto Emoji). Speaker name + icon chip at the caption's
left edge.

## Worlds

1. **Front doors** (`door-cold`, `t3-door`, `ptah-door`): exterior porch shots,
   house number plate, doorbell, the host robot at the door; Cribs handheld.
2. **T3 Code loft** (`t3-*`): bright, modern, daylight, clean surfaces; a long
   hallway of identical doors (nameplates with each agent's name; our five plus
   Grok and Pi), personal rooms behind them. Palette and logo taken from T3
   Code's own repository/site (identify only; credit in `assets/icons/CREDITS.md`).
   It must look like a place you'd want to live — no cheap shots.
3. **Ptah temple** (`ptah-*`): Episode 1's temple set and table, plus tour
   stations: lane work stations, a review desk, a limit gate, a stone fridge.
4. **Both** (`both`): the two homes side by side (loft façade left, temple gate
   right), the five robots between them on a path.

## Camera and motion

- Cribs handheld: seeded wobble (0.8°, 10 px, 1.6 Hz), walk-and-talk follow at
  robot height, 28 mm feel (fov 62), door-reveal push-throughs, whip-pans
  (6 frames) between rooms, one fridge-light reveal per house.
- Robots: Episode 1 physics (hops, spring wobble, voice-driven squash and nod,
  impulses), plus a hop-walk locomotion cycle for tours.
- Cuts: hard cuts or whips; no dissolves.

## Type and overlays

- Title: "AGENT CRIBS" in Archivo Black 180 px with a hard offset shadow, cream on
  a saturated magenta-to-amber split (Cribs energy), episode line in Inter 600.
- Address card (house entry): a slanted card with the house's logo, name and URL,
  wipes in left→right, holds 2 s.
- Room labels: small caps tag top-left in title-safe ("THE SHIP ROOM"), wipe in
  6 frames, hold while in the room.
- End card: temple background, Ptah emblem, "Same agents. Two homes.", "ptah.live",
  "T3 Code — t3.codes" (smaller, respectful), robot credit + "Product logos belong
  to their owners".

## Sound

- Music: a light hip-hop / boom-bap Cribs-style bed, ~92 bpm (ElevenLabs music),
  ducked to 0.14 under voice, up between houses, a record scratch stop on E1, back
  under the end card.
- SFX: doorbell chime ×2, door open ×2, record scratch, sticky-note slide, big
  button press, tape rewind, phone buzz, fridge open (seal pop + hum) ×2, gavel
  (Episode 1), stamp, gate buzzer.
- Mix: −16 LUFS, peaks ≤ −1 dBTP.

## BANNED

Episode 1's BANNED list, plus: any "better/worse" framing, a scoreboard that
compares T3 Code with Ptah (the S1 temple scoreboard of lane results is fine), MTV
branding, mocking T3 Code or its author, claims not in `COMPARISON.md`, captions
that cover a robot's face.

## QA frames

- Frame 0: Codex at a front door, readable as a house tour.
- Each house entry: address card legible, logo correct.
- Every room: label legible, the host's face visible, caption readable.
- H5: the note visibly passes under the door.
- P3: the stamped file readable.
- E2: all five robots facing camera, both homes visible.
- End card: both URLs legible, holds ≥ 3 s.

## Pacing pass (after the user's first watch, 2026-11-06)

The first cut felt rushed in the middle. Measured cause: 0.20–0.25 s between
every line including across room changes, *(beat)* pauses compressed out, and
some lines delivered at 3.5–4.2 words/s. New rules, overriding "0.2 s gaps":

| Moment | Rule |
| --- | --- |
| Speaking rate | ≤ 3.0 words/s per line. Re-take any line above 3.2 w/s slower (Cursor speed 1.0, Conductor 0.9); keep the STT check |
| *(beat)* inside a line | 0.6 s of silence, never compressed |
| New room | 0.6 s lead-in before the first word (label wipes in at +0.1 s, the gag reads first) |
| New house (`t3-door`, `ptah-door`) | 1.0 s lead-in |
| Next line, same room | 0.35 s gap |
| Punchline reply (H2 "…Weird", P5, S2, N2, P10) | 0.6 s gap before it |
| End of a room | 0.7 s reaction hold before the cut |
| Between houses (after H8) | 1.2 s, music up |
| Finale | E1 card 2.0 s → 0.6 s silence → "…Both." → 0.8 s hold → E3 → end card 3.5 s |

Expected length 95–105 s. Holds must have life: listeners react, the host
settles, props finish moving — never a frozen frame.
