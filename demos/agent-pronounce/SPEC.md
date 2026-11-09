# SPEC — The P Is Not Silent (The Tribunal, Episode 6)

The user approved this on 2026-11-09. Story, beats and evidence are in
`../series/ep06-the-p-is-not-silent.md`. This file is the **build contract**
for the three parallel lanes. Where this file and the brief disagree, this file
wins.

The project is a copy of `../agent-comparison` (the Episode 2 engine: robot rig,
physics, the shared WebGL renderer, the audio pipeline, the
`src/build-timing.mjs` generator, captions, icons, emoji, the brand assets and
the Episode 1 voices). Episode 2's sets and scenes stay in `src/` as reference.
Delete them only when nothing imports them.

## Decisions taken

- Brand pronunciation: **p-TAH**. The P is spoken. Use the tag `/pəˈtɑː/`.
- Hosts: **Codex** (deadpan, loves cool names) and **Claude** (over-prepared).
  **Cursor** has a one-line cameo (eager, finishes your sentences). Changed by the
  user on 2026-11-09 from Cursor + Claude.
- **Ptah** is spoken by the **Conductor** voice in `assets/audio/voices.json`
  (deadpan, slow). For "Old." and the desert lines, add a deep, roomy treatment:
  a pitch-down or reverb send in the mix. The words must stay clear.
- **No other products.** This is Ptah's own promo. Competing apps (T3 Code
  and others) never appear: not by name, logo, line, caption or SFX cue.
  Changed by the user on 2026-11-09. The agents Ptah runs (Codex, Claude, Cursor) stay
  as characters.
- **Cinematic open.** The film opens inside the office with a camera
  entrance, with no browser insert. The `screen` scene and line S1 are cut.
- The primary cut is **4:5, 1080 × 1350**. The 16:9 cut comes later and is out
  of scope for this round.
- Captions are at least 64 px and at most 6 words per line, burned in and synced
  word by word (series rules 8–14 in `../series/README.md`).

## Script (line ids are binding)

| id | speaker | line | scene |
| --- | --- | --- | --- |
| S2 | Claude | (leaning in to the laptop, reading the PTAH wordmark) "Hmm… Tah? The P's silent, right?" (**new take**). The opening "Ptah…" was dropped on 2026-11-09: TTS failed it three times ("Pitar", "Potat"), and the wordmark on the laptop already shows the spelling. | office |
| O1 | Codex | (deadpan) "Has to be. Like pterodactyl." (**new take**) | office |
| O3 | Codex | "Honestly? It sounds… old." (existing take) | office |
| O4 | Ptah | "Old." (existing take) | office |

The script was changed by the user on 2026-11-09. It has **one wrong pronunciation** ("Tah"),
paid off by D1 ("Say mine properly") and the intro tag. Line O2 (forty-three
options, Pita, bread) is cut. Line ids S2, O1, O3 and O4 are kept, so the existing audio
files and file names still line up.
| D1 | Ptah | "I made the world by speaking its name. Say mine properly." | desert |
| D2 | Claude | "Respectfully… why does the god of builders care about coding agents?" | desert |
| D3 | Ptah | "Look around. Many crews. One plan. Nothing goes up until it's—" | desert |
| D4 | Cursor | (zipping past with a block, finishing his sentence) "—checked! Got it! Next block!" | desert |
| D5 | Ptah | "Same idea. Now it runs on your desktop." | desert |
| D6 | Codex | (whisper, deadpan cracking) "…okay. That's actually cool." | desert |

## Running order (scene ids are binding)

| scene id | kind | owner | content | lines | approx length |
| --- | --- | --- | --- | --- | --- |
| `office` | 3D | Lane B | Opens with the **entrance**: about 4 s with no dialogue, starting on the dusk skyline outside the glass. The camera cranes down and dollies through the window wall into the office, past the plant, and settles on the approved hero two-shot as the Ptah landing page on the laptop (lightning over the temple) lights up both robots. It sets the pace: one continuous move with ease-in-out, no cuts. Then Claude leans in to the laptop for S2. The laptop lightning flickers on "tah". A spark comes off the laptop, the lights dip, a bolt runs up the wall, then a white flash on "Old." | S2 O1–O4 | ~16 s |
| `vortex` | 3D | Lane B | The sofa with both robots tumbles through a sand and hieroglyph vortex. Lane A overlays the location card "Memphis, Egypt · around 2600 BC". | — | 3.0 s |
| `desert` | 3D | Lane B | Desert at golden hour. A half-built pyramid with ramps, a temple pylon, and Ptah as a giant sandstone god (skullcap, straight beard, was-sceptre). The sofa is in the sand. Robot crews haul blocks up separate ramps under crew banners. An inspector stamps blocks. Cursor zips through with a block. The pylon doorway lights up. | D1–D6 | ~22 s |
| `app-window` | 2D overlay | Lane A | Over `desert` from the `portal` cue to the scene end. A Ptah desktop app window frame (Electron-style title bar, "Ptah") grows out of the screen centre and plays `multi-agent`, `orchestration` and `tribunal-council` in turn. | (D5–D6) | ~6 s |
| `intro` | 2D | Lane C | Sitcom-style opening on papyrus. Hieroglyph robots each get a name card. A chisel carves PTAH with `/pəˈtɑː/ — the P is not silent.` | — | **10.0 s fixed** |
| `endcard` | 2D | Lane C | "Named after the god of builders. Now it builds with your agents." Ptah emblem, `ptah.live`, robot credit. | — | **3.0 s fixed** |

### Named action cues

These are seconds from scene start. They are written into `src/timing.json`
for each scene as `cues: { name: t }`. Lane A computes them from word timings.
Lane B animates props to them.

- `office`: `entrance` (0 → start of S2, about 4 s; the camera move lands exactly there), `tah` (on "Tah?" in S2: the laptop lightning flickers), `spark` (end of "pterodactyl" in O1), `dip` (+0.2 s after spark),
  `crackle` (`bolt` − 0.8 s: the laptop crackles and the lights flicker, building up), `bolt` (on "old" in O3),
  `flash` (start of "Old." in O4), `end`.

### Pacing (binding, set by the user on 2026-11-09: "it should be paced to look like a natural conversation")

The old take felt rushed. Every lane follows these rules:

- **Turn gaps:** 0.6–0.9 s of silence between lines from different speakers, and
  0.3–0.5 s between phrases in the same line. Nobody talks over a beat.
- **Reaction beats:** at least 1.0 s of no dialogue after each event before
  the next line starts: after the spark and dip, 1.2 s before O3; after the bolt,
  a stunned hold of 1.5 s before O4. The robots act through the beat (a look at each other,
  a look at the laptop, a slow blink). They never freeze.
- **Thunder:** build-up, strike, hold. The crackle and flicker start 0.8 s
  before `bolt`. The strike peaks for about 0.25 s, the afterglow decays over about 1 s, and
  the room stays dim and flickering through the hold.
- **Scene switches:**
  - The white-out on "Old." holds full white for at least 0.6 s before the vortex.
  - The vortex runs 3.5 s.
  - The desert opens with `sofaLand`, then 1.2 s of the robots looking around before
    `rise` and D1.
  - Never cut on the same frame as a line start. Leave at least 0.4 s.
- **Camera:** the office has at most three shots (the entrance landing on the hero,
  the hero, the low wide for the bolt). No shot is shorter than 2.5 s. Moves ease in and
  out.
- `vortex`: `land` (2.6 s).
- `desert`: `sofaLand` (0.3 s), `rise` (start of D1: Ptah's eyes glow and his head
  turns), `pan` (start of "Look around" in D3), `stamp` (on "checked" in D4),
  `cursorPass` (start of D4), `portal` (on "desktop" in D5), `end`.
- `intro` (fixed, owned by Lane C, mirrored by Lane A's audio): `card1` 0.6
  (Claude), `card2` 1.8 (Codex), `card3` 3.0 (Cursor), `card4` 4.2 (Antigravity),
  `card5` 5.4 (OpenCode), `card6` 6.6 (Ptah), `chisel` 7.8, `tag` 8.8.

### Speaking-robot mapping for 3D

`timing.json` keeps Episode 2's shape: `{ fps, total, rows, scenes, captions }`.
Each scene has `{ id, kind, rows, start, duration, cues }`. Each row has a
speaker and word timings. Lane B reads those to drive mouth and "talk" acting on
the speaking robot. When Ptah speaks, the giant figure's eyes and the sceptre
glow.

## File ownership (lanes are file-disjoint)

| Lane | Owns (may create or edit) | Must not touch |
| --- | --- | --- |
| **A: audio, timeline, overlays** | `scripts/audio/**`, `assets/audio/**`, `src/build-timing.mjs`, `src/captions.json`, `src/bubbles.json`, `src/timing.json`, `index.html`, `compositions/*.html` **except** `intro.html` and `endcard.html`, `scripts/restore-assets.mjs`, `assets/live-demo/**` (untracked media), `README.md`, `notes/LANE-A.md` | `src/*.js` 3D files |
| **B: 3D** | `src/scene.js`, `src/tour*.js`, `src/set-*.js`, `src/props-*.js`, `src/textures*.js`, `src/acting.js`, `src/camera.js`, `src/cribs*.js`, `src/lighting.js`, `src/temple.js`, new `src/set-office.js`, `src/set-desert.js`, `src/set-vortex.js`, `src/ptah-god.js`, `notes/LANE-B.md` | `index.html`, `compositions/`, `scripts/` |
| **C: intro and end card** | `compositions/intro.html`, `compositions/endcard.html`, `assets/intro/**` (SVG only), `notes/LANE-C.md` | everything else |

`src/build-timing.mjs` (Lane A) **must not overwrite** `compositions/intro.html`
or `compositions/endcard.html`. It only places them in `index.html` with their
fixed durations.

The 3D mount contract is unchanged from Episode 2. Each 3D composition calls
`window.TribunalReady.then(api => api.mount(config, canvasEl))` with
`config = { id, kind, ...timing scene }`. The new kinds are `office`, `vortex`
and `desert`.

## Verify (every lane)

- `node node_modules/hyperframes/dist/cli.js check --json` passes. Run it from
  `demos/agent-pronounce`.
- Snapshot the frames you own with the HyperFrames CLI (see the
  `hyperframes-cli` skill), or open `preview`, and look at them. Write the
  snapshot paths in your notes file.
- `node tools/guards/no-media.mjs` passes from the repository root. No media
  file gets staged. Never run `git add`.
