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
- The primary cut is **16:9, 1920 × 1080**. Changed by the user on 2026-11-10
  (was 4:5, 1080 × 1350). The 4:5 cut is dropped for now.
- Captions are at least 64 px and at most 6 words per line, burned in and synced
  word by word (series rules 8–14 in `../series/README.md`).

## Direction v2 (set by the user on 2026-11-10 — overrides any conflicting text below)

The user's review of the 4:5 cut: the scene switches and the cast catalogue are
"not well thought and written", the Ptah footage is "so small", "we need to own
the stage and create an intuitive eye catching experience", "reduce the pace for
the conversation and act as its a true short cinematic video scene". Lanes have
full authority to fetch free GLB models, HDRIs, textures and sounds through the
`free-media-sourcing` skill (manifest only; media is never committed).

1. **Format.** 1920 × 1080, 16:9. Every set, camera, overlay, caption and 2D
   composition is re-staged for landscape: wide establishing shots, subjects
   composed on thirds, depth in foreground / midground / background. Nothing
   important sits in the outer 5 % of the frame and nothing is cropped.
2. **Film pacing.** Target length **80–95 s**. Dialogue lines and ids do not
   change.
   - Turn gaps (different speakers): **0.9–1.4 s**. Phrase gaps inside a line:
     0.4–0.6 s.
   - Reaction beats after an event: at least **1.5 s**, acted, never frozen.
   - Every new location opens with at least **2.5 s** without dialogue.
   - No shot is shorter than **3.0 s**. Camera moves are slow and eased; no
     whip moves outside the vortex.
3. **Motivated scene switches.** Every switch has a cause on screen and a sound
   that carries across it. No hard cut, no generic cross-fade.
   - office → vortex: the white-out on "Old." holds 0.8 s, then the floor falls
     away under the sofa.
   - vortex → desert: the sofa lands in a dust burst; the dust clears over
     1.5 s into a slow crane-up that reveals the giant Ptah (the reveal is the
     2.5 s silent opening).
   - desert → showcase: on `portal` the pylon doorway lights and the camera
     pushes through it until the doorway light fills the frame; the app window
     resolves out of that light.
   - showcase → desert: the window recedes back into the doorway; the camera
     settles on the sofa two-shot with the giant behind for D6, then holds 2 s.
   - desert → title: the camera tilts to a bare sandstone face that becomes the
     title wall (match on texture and light direction).
4. **Ptah owns the stage** (`app-window`). The app window is at least **88 % of
   the frame width** (≥ 1690 px), centred, with thin window chrome. It plays
   `multi-agent`, `orchestration` and `tribunal-council`, each held at least
   **4.5 s**, with one label per clip (at most 4 words, at least 72 px) outside
   the window content. D5 lands as the window resolves. No caption or label
   covers the footage. The desert is not visible behind it except as a soft
   glow at the frame edge.
5. **The cast catalogue is cut.** `intro` becomes the **title wall**, fixed at
   **6.0 s**: a chisel carves `PTAH` into sandstone across the full frame width,
   then `/pəˈtɑː/`, then "The P is not silent." No name cards, no STARRING
   card. The agents are already introduced in-world by the crew banners.
   Cues: `chisel` 0.6, `tag` 3.2, `line` 4.2. `endcard` is fixed at **4.0 s**.
6. **Order of work.** Lane A lands the format, timing and `app-window` first.
   Lanes B and C start after that and snapshot at 1920 × 1080.

## Direction v4 (set by the user on 2026-11-13 — overrides any conflicting text above and below)

The user watched the v3 cut in the studio. Verbatim:

1. "for the studio can u do a new scene where they both in an office with a bigger screen
   and more wider/realistic view of ptah so the angle appears as 2 developers settings near
   each other in a workspace or a 2 close desks"
2. "also rather ptah saying `i made the world by speaking it name ` and the rest of the
   sentences we can focus on more of having same idea of wide screen and it explain the
   features we have on ptah while showing the demo and also the agents working in the
   background , also the caouch drop but the 2 agent is already standing , i reckon you can
   do that with opus rather using the cli tools, as the output so far is so basic and not
   what i'm imagining with cutting edge 3d modeling capabilities and also the ability to get
   free assets online we should deliver more of unqiue experience not that old looking 90s
   game ?"

Rules. Items marked (orchestrator) are the orchestrator's reading, not the user's words.

1. **Workspace opening.** The sofa office is replaced by a workspace: the two robots sit in
   office chairs at two close desks, with one big hero screen that shows a real, wide view
   of Ptah. Lines N1–N5, S2, O1 and O3 play here. The landing insert becomes a push into
   the hero screen; the storm starts on the hero screen.
2. **Seats (orchestrator).** The two office chairs replace the sofa in the vortex and in the
   desert landing.
3. **Landing continuity.** Nobody stands in the desert before the seats land. The robots
   arrive in their chairs, land seated, and stand up only when the giant rises.
4. **Ptah presents the product.** The mythic lines are cut (D1 "I made the world by speaking
   its name…", D3 "Look around. Many crews…"). Ptah lights a monumental wide screen in the
   desert (the same wide-screen idea as the workspace), the tour footage plays on it, and
   he explains one feature per clip (lines F1–F4). Agent crews keep working in the
   background of these shots, in depth, never crossing each other. The camera may push in
   until the screen nearly fills the frame, but the 3D world stays visible at the edges;
   the full-bleed 2D showcase of v3 is retired.
5. **Look.** The user rejected the look as "that old looking 90s game". Every scene moves
   to the look kit: detailed CC0 models with PBR textures, image-based lighting, soft and
   contact shadows, ambient occlusion, depth of field, filmic tone mapping. The series
   robots stay, re-shaded. Low-poly packs are background filler only.
6. **Who builds it.** The user asked for Opus instead of CLI lanes for the visual work.
   Scene work runs in Opus subagents; CLI lanes are kept for audio, timing and independent
   review.
7. **Gates.** Look-dev stills for each scene are approved by the user before animation. The
   new lines below are approved by the user before any voice is generated.

### Script v4 (approved by the user on 2026-11-13)

Running order: N1 N2 N3 N4 N5 S2 O1 O3 (workspace), then O4 D1 D2 F1 F2 F3 F4 D5 D6
(desert). Office lines keep their v3 wording and takes; "laptop" in their directions now
means the hero screen. No new line contains the word "Ptah" (TTS mispronounces it).

| id | speaker | line | take |
| --- | --- | --- | --- |
| O4 | Ptah | "Old." | existing |
| D1 | Ptah | "Say my name properly. Then look at what I build." | new |
| D2 | Claude | "Respectfully… why does the god of builders care about coding agents?" | existing |
| F1 | Ptah | "One command center. Every coding agent you already pay for, in one window." | new, over `tour-1` |
| F2 | Ptah | "Give them one plan. They build in parallel, each in its own lane." | new, over `tour-2` |
| F3 | Ptah | "Nothing ships unchecked. You review every change before it lands." | new, over `tour-3` |
| F4 | Ptah | "And every run is tracked. Time, tokens and cost." | new, over `tour-4` |
| D5 | Ptah | "Same craft as my builders. Now it runs on your desktop." | new |
| D6 | Codex | "…okay. That's actually cool." | existing |

D3 is cut. Each tour clip is retimed to the length of its line plus 0.8 s.

### Script v4.1 (the user's change of 2026-11-13, wording approved the same day; overrides the v4 table where they differ)

The user, verbatim: "also i think for the initial lines about the name i think we need to
just pronounce it correctly and let codex describe it normally like its called patah and
named after ancient egyptian god or something like that".

The mispronunciation joke is removed. The name is said correctly the first time and
explained. Running order: N1 N2 N3 N4 N5 O1 O3 (workspace), then O4 D1 D2 F1 F2 F3 F4 D5 D6
(desert). S2 and the "pterodactyl" line are cut.

| id | speaker | line | take |
| --- | --- | --- | --- |
| N1–N4 | Codex, Claude | unchanged | existing |
| N5 | Codex | "It's called Ptah. Named after the ancient Egyptian god of builders." | new; TTS spells the name phonetically ("Puh-TAH"), caption shows "Ptah" |
| O1 | Claude | "That's a big name for an app." | new |
| O3 | Codex | "Honestly? It sounds… old." | existing |
| O4 | Ptah | "Old." | existing |
| D1 | Ptah | "You said my name. Now look at what I build." | new, replaces the v4 wording |

The user approved the wording of N5, O1 and D1 on 2026-11-13. Still open: the name's
pronunciation, which can only be judged from the take. Two alternate takes
of N5 with other phonetic spellings are generated for the user to compare. The rule "no new
line contains the word Ptah" now has this one exception. The episode title and the title
wall are unchanged.

## Direction v3 (set by the user on 2026-11-12 — overrides any conflicting text above and below)

The user's review of the 16:9 draft (`renders/preview-v2-draft.mp4`), verbatim:

1. "the dialog starts in a very weird way, we need to set the environment and have a
   real conversation first about coding agent for example one tell the other they
   found a new coding agent"
2. "the flash switch at second 17 is weird as well and ptah speaks before it shows"
3. "when it describe the builders they are moving on top of each others weirdly"
4. "when claude cut the ptah speaking with one word ( check ) is confusing and not good"
5. Two new screen recordings (the landing page and a quick tour of Ptah): "utilize
   them to show bigger screens of ptah and speed them up to be intelligently embedded
   in the video to make a more of a real stunning and state of the art promo".

Rules. Items marked (orchestrator) are the orchestrator's reading of that feedback,
not the user's words.

1. **Opening conversation.** After the 4.0 s silent entrance, Codex and Claude talk
   about a new coding-agent app before anyone reads its name: lines N1–N5 in the
   script below (orchestrator wrote the lines). No new line contains the word "Ptah";
   TTS mispronounces it.
2. **Landing insert (orchestrator).** While Codex says N3, the camera pushes to the
   laptop and the landing-page recording plays full-bleed for 4.5 s
   (`assets/live-demo/landing-scroll.mp4`, office cues `landingIn` → `landingOut`).
   It opens on the hero with the PTAH wordmark, so S2 reads a name the viewer has seen.
   The camera starts its push 0.8 s before `landingIn`; the overlay cross-fades in and
   out over 0.3 s; after `landingOut` the camera is back on the two-shot.
3. **Office → desert transition.** No white flash, no wall bolt, no off-screen voice.
   After O3 the laptop storm answers the insult: `rumble` (O3 end + 0.6 s: screen
   lightning grows, room lights dip, low rumble), `pull` (`rumble` + 1.4 s: wind and
   sand pour out of the screen, the robots grip the sofa, the camera starts a 1.6 s
   push into the screen), `through` (`pull` + 1.6 s: the storm on the screen fills the
   frame; the office scene ends here). The vortex continues the same push in the same
   storm colours, with the sofa tumbling ahead of the camera. Cues `crackle`, `bolt`
   and `flash` are removed.
4. **Ptah speaks only on screen.** O4 ("Old.") moves to the desert. The crane-up shows
   the giant's whole face for at least 1.0 s, his eyes start to glow 0.6 s before
   `rise`, and `rise` is the start of O4. D1 starts 1.3–1.6 s after O4 ends.
5. **No interruption.** D4 and Cursor's cameo are cut (orchestrator); `cursorPass` is
   removed and Cursor does not appear. Ptah finishes his own sentence in D3. The
   inspector's `stamp` lands on "checked".
6. **Crews.** Each crew owns one ramp. On a ramp, robots keep at least 1.5 body
   widths apart along the path. Ramps do not cross. No robot, block or banner passes
   through another at any frame. At most three robots per crew are visible in the
   pan, and they fill the middle third of the frame height. Feet stay on the ramp
   surface. The lane proves it with frames every 0.5 s across the pan.
7. **Showcase.** From `pushIn` the film plays four clips of 5.0 s each, full-bleed
   (footage at least 96% of the frame width): `assets/live-demo/tour-1.mp4` …
   `tour-4.mp4`, cut from the user's recordings. `showcaseEnd` = `pushIn` + 20.0 s,
   `d6` = `showcaseEnd` + 0.8 s. Each clip is speed-ramped (fast, then near 1× for its
   last 1.2 s), has one slow punch-in (scale at most 1.6) toward the focus rectangle in
   `notes/footage-edl-v3.md`, and one label of at most 4 words at 72 px or more.
   Transitions between clips last at most 0.4 s.
8. **Footage sources.** Copies of the user's recordings are in
   `assets/live-demo/source/` (git-ignored). Clips must not show an email address,
   API key, token, private repository name or anything else personal. Media is never
   committed.
9. **Length.** 100–120 s total. The v2 pacing rules (turn gaps 0.9–1.4 s, no shot
   under 3.0 s) still apply. The title wall (6.0 s) and end card (4.0 s) are unchanged.
10. **Lane order.** Footage scout and Lane A timing in parallel (neither captures
    HyperFrames frames); then Lane A overlays; then Lane B office and vortex; then
    Lane B desert. One capturing lane at a time.

## Script (line ids are binding)

The v3 running order is N1 N2 N3 N4 N5 S2 O1 O3 (office), then O4 D1 D2 D3 D5 D6
(desert).

| id | speaker | line | scene |
| --- | --- | --- | --- |
| N1 | Codex | (not looking up from the laptop) "I found a new coding-agent app." (**new take**) | office |
| N2 | Claude | "Another one? What does this one do?" (**new take**) | office |
| N3 | Codex | (turning the laptop) "It runs all of us. Side by side. On one plan." (**new take**, spoken over the landing insert) | office |
| N4 | Claude | "Huh. What's it called?" (**new take**) | office |
| N5 | Codex | (a beat, deadpan) "…That's the problem." (**new take**) | office |
| S2 | Claude | (leaning in to the laptop, reading the PTAH wordmark) "Hmm… Tah? The P's silent, right?" (**new take**). The opening "Ptah…" was dropped on 2026-11-09: TTS failed it three times ("Pitar", "Potat"), and the wordmark on the laptop already shows the spelling. | office |
| O1 | Codex | (deadpan) "Has to be. Like pterodactyl." (**new take**) | office |
| O3 | Codex | "Honestly? It sounds… old." (existing take) | office |
| O4 | Ptah | "Old." (existing take). Moved to the desert on 2026-11-12: spoken at `rise`, with the giant on screen. | desert |

The script was changed by the user on 2026-11-09. It has **one wrong pronunciation** ("Tah"),
paid off by D1 ("Say mine properly") and the intro tag. Line O2 (forty-three
options, Pita, bread) is cut. Line ids S2, O1, O3 and O4 are kept, so the existing audio
files and file names still line up.
| D1 | Ptah | "I made the world by speaking its name. Say mine properly." | desert |
| D2 | Claude | "Respectfully… why does the god of builders care about coding agents?" | desert |
| D3 | Ptah | "Look around. Many crews. One plan. Nothing goes up until it's checked." (**new take**; the interruption was cut on 2026-11-12) | desert |
| D4 | — | Cut on 2026-11-12. | — |
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
