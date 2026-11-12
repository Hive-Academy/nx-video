# Context — video production kit for CLI agent lanes

## Why

Episode 6 ("The P Is Not Silent", `demos/agent-pronounce`, branch
`demo/ep06-p-is-not-silent`) went to three CLI lanes (Codex, Glm and Grok).
Their 3D and visual output fell well below Episodes 1 and 2. The user diagnosed
three causes on 2026-11-09:

1. Three.js was hand-built quickly from primitives, without the practices used
   in Episodes 1 and 2. The orchestrator's brief made this worse by banning
   external models.
2. No free resources were used: CC0 models, HDRIs, PBR textures, animation
   libraries, Lottie or the HyperFrames registry.
3. The lanes are not taught. The HyperFrames skills exist in `~/.codex/skills`,
   `~/.agents/skills` and `~/.claude/skills`, but the briefs only said "load if
   supported". Codex reported the skill as unavailable, and Grok has no skills
   folder. Nothing records the quality bar, and nobody approves a still frame
   before animation starts.

## Plan (approved by the user, 2026-11-09)

1. A research lane builds a vetted free-asset catalogue and maps where each
   CLI reads skills from.
2. The orchestrator (Claude) writes three skills with `skill-creator`:
   `video-quality-bar`, `threejs-scene-craft` and `free-media-sourcing`. They go
   into the repository's `.claude/skills` and `.agents/skills`, and into every
   CLI's skills folder. A canary check confirms each lane can load them.
3. Brief template: each lane reads the named `SKILL.md` paths first and lists
   the skills it loaded in its notes.
4. Episode 6 look-dev: Claude makes one still per scene from sourced assets,
   and the user approves the stills.
5. Lanes rebuild Episode 6 against the approved stills. A reviewer from another
   vendor family checks the result.

## Kept from the first Episode 6 run

Codex's audio, timeline, captions and 2D overlays (`notes/LANE-A.md`,
`notes/LANE-A-FIX1.md`). The cut is 62.8 s; the user accepted it, and trimming
waits for the preview. Glm's 3D and Grok's intro were stopped part-way. Their
files stay on disk unreviewed.

## Lane limits

- 2026-11-09: Glm (ptah-cli, provider ollama-cloud) hit its session limit at
  100%. It resets at 21:00 UTC. The engine and skills research moved to Codex.
- 2026-11-09: the Grok Episode 6 lane (`1c42adf2`) ran without Ptah MCP: the
  handshake timed out. It had no `ptah_agent_report` and no browser screenshot
  tools. The skills setup must check MCP connectivity for Grok, and the Grok
  briefs need a fallback that uses the HyperFrames CLI to take snapshots.
- 2026-11-09: Kimi Code is at its monthly limit until 2026-11-25 00:00 UTC. Glm is at
  its limit (reset unknown). Skip both for this run.
- 2026-11-09: the Grok desert lane (`ff81f2d3`, lane `grok`, family grok, model grok-4.7) failed
  with HTTP 402 "Grok Build usage balance exhausted". `ptah_agent_list` shows Grok weekly at 100%,
  resetting 2026-11-12 20:04 UTC. Skip Grok until then. It left `src/set-desert.js` part-rewritten
  and `notes/lane-desert.md` as a skeleton.

## Lane events

- `75dda2d1` (Grok, free-asset research): delivered `research-assets.md` (48 KB), which became the catalogue. Ptah MCP did not connect for this lane either (handshake timeout).
- `73e325fd`: stopped as a duplicate of an already running lane.
- Codex canary `3c1afc20`: passed (`canary-codex.md` names both SKILL.md paths and
  quotes a rule from each). The Antigravity canary
  `bcf3b5be` failed in 7 s on a quota limit (HTTP 429, "Individual quota reached", resets in 144h59m, so about 2026-11-15 19:00 UTC). Skip Antigravity for this run. Codex and Grok cross-review each other's builds.
- `a18f5730` (Codex): phase 1 foundation. It splits `lookdev/lookdev.js` into
  `src/craft.js` and `src/look-*.js`, checks pixel parity, and adds the per-set bloom
  and ACES hook to `src/scene.js`. It delivered `notes/lane-foundation.md`. I checked it
  again: `compare.mjs` gives 0/0 for all four stills, and `check --json` passes.
  Finding: `hyperframes-core` is only in `.claude/skills/` and the user skill folder,
  not in `.agents/skills/`.
- Phase 2 started on 2026-11-09 at 18:20 UTC with two parallel, file-disjoint lanes:
  - `333c2cf8` (Codex): office and vortex. Writes `src/set-office.js`,
    `src/set-vortex.js` and `src/look-office.js`/`src/look-vortex.js`; owes `notes/lane-office.md`.
  - `ff81f2d3` (Grok): desert and Ptah. Writes `src/set-desert.js` and
    `src/look-desert.js`, and retires `src/ptah-god.js`; owes `notes/lane-desert.md`.
- `333c2cf8` (Codex) delivered round 1 in 13 minutes. The scorecard was honest: every frame
  scored Light 3 because of a grey wash. I traced it: in `compositions/intro.html`,
  `#intro-grain` had no base opacity and painted over the whole timeline, and the
  `paper-noise` SVG leaked a strip at the top. Fixed by giving the grain `opacity:0` and
  deleting the paper-noise layer. `check` passes.
- I applied the lane's `src/scene.js` diff: the bloom pass now reads `post.bloom` on every frame.
- `7e243180` (Codex) round 2: makes the spark, flash white-out and vortex land read
  clearly, then reshoots and rescores. Ptah could not resume session `01a1c18a`, because it
  had reached its token-budget warning, so it started a fresh lane from a handoff brief.
  Round 2 passed every 3D row (all ≥ 4). Text scored 3 at three frames, because of caption
  contrast and the O2 line length. Both belong to the timeline lane.
- `f8e48732` (Codex, started 19:08 UTC): the timeline lane. It cuts the `screen` scene, S1, O2
  and all T3 references; records the new S2 and O1 takes; applies the SPEC pacing rules and the
  new office cues (`entrance`, `tah`, `crackle`); fixes caption contrast; and owes
  `notes/lane-timeline.md`. The office-entrance lane and the desert lane wait for its
  `timing.json`.
  - Delivered in 6.6 min. The cut is 63.2 s, and every pacing gap passes. Captions are 68 px
    with about 10:1 contrast. No T3 text is left in the cut files.
  - Two problems remained. S2 failed TTS QA three times on its opening "Ptah…" ("Pitar",
    "Potat"). `src/assets.js` still fetched `t3-brand.json` and `t3code.png`.
  - My fixes: I removed that fetch from `src/assets.js` (t3brand and t3logo are now null, and
    the Episode 2 sets fall back), and I changed S2 to "Hmm… Tah? The P's silent, right?",
    because the laptop wordmark already shows the spelling. SPEC.md is updated.
  - Round 2 (`a3460d29`, resumed the same Codex session) regenerates S2, rebuilds the timing
    and adds an ambient bed under the entrance.
    - Delivered: S2 passed QA first time. The cut is 62.8 s. The office bed is night ambience at
      −30 dB, ducked under the dialogue.
    - Ptah then stopped the session at its 3M-token budget, so it cannot be resumed.
    - The forced aligner had glued the SSML break onto "Tah?", which put the `tah` cue at 4.28 s.
      `silencedetect` shows "Tah" is said at 0.98–1.23 s into the take. I corrected
      `assets/audio/align/s2.json` by hand and re-ran `generate.mjs`, which was fully cached
      (no TTS calls), then `build-timing`. `tah` is now at 4.98 s. `check` and the no-media
      guard pass.
- 2026-11-09 19:23 UTC: two file-disjoint Codex lanes started in parallel:
  - `c7795184`: the office entrance, acting and thunder re-timed to the new cues, at most
    three shots, the ceiling band, and the vortex at 3.5 s. Owes `notes/lane-office.md`
    (round 3).
  - `aeb052cb`: finishes the desert from Grok's partial `set-desert.js`. Owes
    `notes/lane-desert.md`.
  - Both run on Codex, the only lane with confirmed room. The cross-vendor review will use
    Copilot, OpenCode or Pi (limits unknown).
- `c7795184` delivered office round 3 in 7 minutes. From 3.95 s on, everything passes: hero,
  `tah`, spark, low wide, bolt, stunned hold, white-out, and the 3.5 s vortex.
  - I ruled that the full-white frames are exempt from the Subject and Set rows.
  - I rejected the entrance: at 0.3 and 1.5 s the skyline was flat untextured blocks with a pale
    band, and 2.7 s was a cramped overhead swoop that cropped a head.
  - Round 4 (`21b069b3`, resumed the same session) redoes it as a crane-down reveal from inside:
    a detailed dusk city through the mullions, then a tilt down onto the exact hero at 4.0 s.
- I restyled the vortex location card in `src/build-timing.mjs` (Lane A file; the timeline
  session is closed by its budget). It is now a dark plate with a gold border, "MEMPHIS,
  EGYPT" at 76 px and "around 2600 BC" in italic at 46 px. It was 58 px serif with no plate,
  wrapped awkwardly and was lost over the gold. Checked in
  `snapshots/orchestrator/vortex-card/frame-00-at-19.5s.png`.
- `aeb052cb` delivered desert round 1 in 8 minutes. It continued Grok's file rather than
  rebuilding it. It passed 6 of 13 frames and listed the failures itself. The opening
  (21.7–23.2 s) matches the approved still, and so does the D5 Ptah shot.
  - I added to its failure list:
    - 44.1 portal: a flat orange door and huge cropped heads in the foreground.
    - 39.4–39.5: Cursor is unreadable, a cropped green robot sits in the caption zone, and the
      stamp is invisible.
    - 33.8: blown-out white.
    - 36.5: messy, with tiny crews and no separate ramps.
    - 25.5: crop. 30.0: a pole grows out of Claude's head.
  - Round 2 (`d684b1a1`, resumed the same session) fixes them in priority order.

## Decisions (2026-11-09)

- The skill sources live in `tools/skills/` and are synced to every lane target with
  `node tools/skills/sync-video-skills.mjs` (`--check` reports 18/18 ok).
- Third-party media: a tracked `assets/media.manifest.json`, the
  `tools/media/fetch-media.mjs` fetcher (with sha256 pins, the licence allowlist and a
  gitignore check), and generated `CREDITS.media.md`. Zip members are extracted with
  System32 `tar.exe` (bsdtar), because the GNU tar in Git Bash cannot read zips.
- Look-dev harness: `lookdev/` together with `shoot.mjs` (puppeteer-core and system
  Chrome).
- The user approved the four look-dev stills (`snapshots/lookdev/office.png`,
  `office-bolt.png`, `desert.png`, `vortex.png`) as the reference.
- The user kept Ptah's design: a giant sandstone Conductor robot with a lapis cap, a
  gold-banded beard and a was-sceptre.
- On 2026-11-09 the user ruled that the promo names no other products. Cut the T3 Code
  `screen` scene and S1. The film opens with an office camera entrance of about 4 s
  (skyline, crane down, dolly through the glass, landing on the hero two-shot). S2 is
  said in the office (its text was later replaced; see the next entry). SPEC.md is updated. Codex, Claude and
  Cursor stay as the agents Ptah runs. This is my reading, and I told the user so.
  The timeline change waits until the running 3D lanes finish, because those lanes
  snapshot at absolute times.
- The user found the old take rushed: scene switches and the thunder came too fast,
  and the conversation did not sound natural. They also said the pronunciation should not
  repeat. They chose the "one wrong say" script:
  - S2 Claude: "Ptah… Tah? The P's silent, right?" (new take)
  - O1 Codex: "Has to be. Like pterodactyl." (new take)
  - O3 and O4 keep their takes. O2 (Pita, bread) is cut.

  SPEC.md now has binding pacing rules: turn gaps, reaction beats, the thunder build-up
  (crackle, strike, hold), white-out and vortex holds, and minimum shot lengths.
- Rebuild order:
  1. Foundation (Codex).
  2. In parallel: office and vortex (Codex), and desert with Ptah (Grok).
  3. A cross-vendor review of each build.

## 2026-11-09 — session 3 (orchestrator)

- Office round 4 (Codex `21b069b3`) delivered a crane-down entrance through the mullions with a
  detailed dusk skyline. Not accepted: the skyline detail "fades out" between 3.85 s and 4.0 s,
  which reads as a hard pop (windows, moon and stars vanish in about four frames). Evidence:
  `snapshots/orchestrator/office-r4-fade/`. The lane hit its budget, and resume is refused.
- Decision: keep the detailed skyline live for the whole office segment, until the white-out.
  The office may differ from `snapshots/lookdev/office.png` in the skyline only. The robots and
  laptop must stay the brightest subjects. Also fix the clipped blown lamp at 0.3–1.5 s.
- Office round 5 spawned on a fresh Codex lane, `3955e7ad-e9c5-4530-96c2-3b90fa972eca`.
- Cross-vendor reviewer: Copilot and OpenCode are disabled, Pi and Cursor are not installed,
  Grok, Kimi and Glm are at their limits. Antigravity is the only non-Codex lane available, so
  it will review (fallback: Glm after its session window resets).
- Office round 5 (Codex `3955e7ad`) is accepted after I checked `snapshots/lane-office/round5/`
  myself. The skyline is continuous across 4.0 s, the robots and laptop stay focal, and the
  spark, bolt and white-out are unchanged. Known minor issues: a faint ceiling boundary during
  the bolt, and a lamp edge cropped in the first entrance frames. These go to the cross-vendor
  review.
- Desert round 2 (Codex `d684b1a1`, stopped at its budget) is not accepted, after I checked
  `snapshots/lane-desert/round2/` myself. Accepted shots: establish, Ptah low, Claude D2, Ptah
  answer. Failing:
  - crew 33.8/36.5 s: tiny robots on empty sand, a dark slab ramp, one ramp visible;
  - stamp 39.4/39.5 s: the plate floats, the inspector sits on the stamp, and Cursor's streaks
    are flat white bars;
  - portal 44.1–48.5 s: the hosts are dark brown blobs cropped at the bottom edge.
- Desert round 3 spawned on a fresh Codex lane, `fcfe115b-d4c5-42ac-809e-6ef551f26fea`.
- Cross-vendor office review spawned on Antigravity, `26cc9fc2-8a3c-45af-8b3f-16e091599762`
  (writes `notes/review-office-antigravity.md`).
- The Antigravity review failed at once: its quota is exhausted (HTTP 429), with a reset in
  about 142 h (around 2026-11-15). Plan: run the cross-vendor review of both office and desert
  on Glm after its session window resets at 21:00 UTC. The risk is that Glm may not read images
  well. The alternative is the user re-enabling Copilot or OpenCode.
- Desert round 3 (Codex `fcfe115b`): the portal 44.1–48.5 s is accepted (hosts fully in frame
  with gold rims). The crew shot and stamp are not accepted: the ramps became floating orange
  planks, and the stamp is a mallet lying on the sled.
- Design decision (orchestrator). The root cause is that the robots have no arms, and ramp
  geometry failed for two rounds.
  - Crew shot: no ramps. Three crews in parallel lanes haul sleds with body-harness ropes, in a
    low 3/4 tracking move.
  - Stamp: the robots move tools with light. The gold stamp floats, tethered by a glowing line
    in the inspector's colour, then rises, cocks back and slams onto the block face.
  - SPEC.md's stamp and crew wording should be checked against this. The user may override it.
- Desert round 4 spawned on Codex, `a9f4f977-9485-4a1d-b90b-2e609784d5b5`.
- Desert round 4 (Codex `a9f4f977`) is not accepted yet.
  - The floating, tethered stamp works and is kept.
  - Crew 33.8–36.5 s: too much sky and empty sand, sleds and ropes hardly visible, and the
    near crew is small.
  - 39.5 s: the stamp hangs sideways in front of the sled instead of lying flush on the block
    face, the inspector's head looks squashed, and no seal is visible.
  - 40 s: Cursor passes in front of the camera and fills the frame.
  - The 38.5 s probe was my error, because it is still the crew shot (which ends at 38.868 s).
- Desert round 5 (Codex `5b022a32`, a resume of round 4's session) is accepted.
  - The stamp slams flush at 39.5 s, and the glowing seal and dust ring read at 39.8 and 40 s.
  - Cursor no longer blocks the lens, and the crew reads as hauling crews in depth.
  - Minor issues, sent to review: the near lead robot is cropped at 36.5 s, and the stamp has a
    plain face.
- The cross-vendor review of office and desert was force-spawned on Glm,
  `40ccaf37-3141-401b-8aa0-78145a1c68af`. The limit gate was stale: the error-derived flag was
  from 17:29, and the session window reset at 21:00. It writes `notes/review-glm.md`. If it
  cannot view images, it says so and does a code-level review only.
- Intro check by the orchestrator (`snapshots/orchestrator/intro-check/`) does not pass.
  - 50.4 s is a pure white frame.
  - 50.4–57.6 s leaves about 75% of the papyrus empty. The cast shows only as small figures in
    the bottom strip, with no names, so there are no real cast cards.
  - The chisel, the PTAH tag with the IPA line, and the end card are fine.
- Intro round 1 spawned on Codex, `104ae7b3-5ea6-4cd2-85cf-9f89a6664fec`. Each member gets a
  large centred card with a name plate, then shrinks into the line-up. Cast assumption kept:
  Claude, Codex, Cursor, Antigravity, OpenCode, Ptah. The user may still override it.
- Glm review (`40ccaf37`, `notes/review-glm.md`): the model cannot view images, so no visual
  verdict. The code-level review is useful:
  - Determinism passes.
  - Blocking: the vortex `land` cue was 3.0 s against SPEC's 2.6 s. I fixed it in
    `scripts/audio/running-order.mjs`. `timing.json` must be regenerated after the intro lane
    finishes, to avoid a write race. Then re-snapshot the vortex.
  - Minor, to decide at the mix pass: the D3→D4 gap is 0.1 s, the S2/D2 phrase gaps are
    TTS-bound, and frames are missing at the tah, crackle, hold, rise and desert-end cues.
- There is still no visual cross-vendor review: Antigravity's quota is out, Glm cannot view
  images, and Copilot and OpenCode are disabled.

## 2026-11-10 — session 3, direction v2 (user review of the 4:5 cut)

User feedback: scene switches and the cast catalogue are not well thought out or written; why
vertical; the Ptah footage is too small ("own the stage"); slow the conversation down; make it a
true short cinematic scene; full authority to fetch GLB models and other free assets.

Decisions (written into `demos/agent-pronounce/SPEC.md`, section "Direction v2"):

- Format changes from 4:5 (1080 × 1350) to 16:9 (1920 × 1080). The 4:5 cut is dropped. It was
  chosen on 2026-11-09 for social feeds; it left too little width for the sets and the app footage.
- Film pacing: 80–95 s, turn gaps 0.9–1.4 s, reaction beats at least 1.5 s, 2.5 s silent
  opening per location, no shot under 3 s. Dialogue lines and ids unchanged.
- Every scene switch gets an on-screen cause (floor drop, dust clear and crane-up, push through
  the pylon doorway, tilt to the title wall).
- `app-window` becomes a full-stage showcase: window at least 88 % of frame width, each clip
  held at least 4.5 s.
- The cast catalogue (STARRING plus six cards) is cut; `intro` becomes a 6 s chiselled title
  wall. This closes the open question about the Cursor, Antigravity and OpenCode cards.
  Orchestrator's reading of "initial catalog": the cast line-up.
- Order: Lane A (format, timing, showcase) first, then Lanes B (3D) and C (title, end card).
  Codex is the only lane with room (weekly 82 %).

### 2026-11-10 — direction v2 lane results

- Lane A v2 (Codex 797038b6): format, retiming (82.433 s), showcase at 1740 px. Accepted.
- Desert: rounds 1–2 rejected (blown-out sun, cropped robots, no title tilt); round 3 fixed the
  two-shot, crews pan and tilt; round 4 fixed the opening, the D6 shot and the wall texture.
  Accepted with minor items (see HANDOFF).
- Office and vortex pass (Codex e0fbec37): accepted in landscape.
- Title wall: round 1 flat letters, round 2 (block wall, progressive carving, gold P) accepted.
- The black desert render after the format change was never reproduced; `check` hangs and
  snapshot timeouts came from two lanes capturing at once. Rule: one capturing lane at a time.
- Preview is a draft-quality render to the git-ignored `renders/` folder.

## 2026-11-12 — session 4, direction v3 (user review of the 16:9 draft)

User feedback on `renders/preview-v2-draft.mp4`: the dialogue starts abruptly and needs a real
conversation about a new coding agent first; the flash at 17 s is weird and Ptah speaks before
he is shown; the builder crews move on top of each other; the one-word "checked" interruption is
confusing; use two new screen recordings (landing page, quick tour) for bigger, sped-up Ptah
screens.

Decisions (SPEC.md "Direction v3" is the binding text):

- New opening lines N1–N5 (Codex and Claude), written by the orchestrator. None contains "Ptah".
- Landing-page recording plays full-bleed for 4.5 s under N3 (cues `landingIn`/`landingOut`).
- The white flash, wall bolt and off-screen "Old." are cut. The office ends with a camera push
  into the laptop storm (`rumble`, `pull`, `through`), which continues into the vortex.
- O4 "Old." moves to the desert and is spoken at `rise`, with the giant on screen.
- D4 and Cursor's cameo are cut; Ptah finishes D3 himself (new take). Orchestrator's choice.
- Crews: one ramp per crew, spacing rule, no intersections, proven with frames every 0.5 s.
- Showcase: four full-bleed 5.0 s clips (`tour-1..4.mp4`) cut from the user's recordings.
- Target length 100–120 s (was 80–95 s).
- The recordings were copied to `assets/live-demo/source/` (git-ignored, verified with
  `git check-ignore`). Which file is the landing page and which is the tour is for the footage
  scout to establish.
- Lanes: Codex only (weekly 26%; Glm, Kimi at limit; Grok and Antigravity unreadable). Order:
  footage scout ∥ Lane A timing, then Lane A overlays, Lane B office+vortex, Lane B desert.
- No document review lane was run for the SPEC amendment; the user reviews the new lines directly.

## 2026-11-12 — direction v3 lane results (running log)

- Lane A timing `8cd8885d`: accepted from its notes. Total 106.831 s (office 36.898, vortex 3.5,
  desert 56.403, title wall 6, end card 4). Six new takes generated; word timings match. Mix
  −19.56 LUFS, about 2 dB quieter than v2: level it in the overlay pass. `check` ok.
- Footage scout `f59137ed`: `rec-2026-11-06` is the landing page, `rec-2026-11-09` is the app
  tour. `landing-scroll.mp4` accepted from my own four-frame sheet (hero with the lightning, the
  command centre section, the routing diagram). Tour clips rejected: two were dull settings and
  skills pages (one ending on a ghost window outline), two were built from the old demo clips,
  and all were 1920 px wide but taller than 1080.
- Orchestrator decision: the scout's privacy rule was too strict for the user's own tour of an
  open-source app. Round 2 (`4a82f53a`, resumed session) may use chat, diff and dashboard views;
  it still forbids emails, keys, tokens, account identifiers and paths with a user name, and it
  lists anything borderline under "For the user to confirm". The user sees the draft before
  anything is published, so the final call on what is shown stays with the user.
- Lane B office and vortex `6485fa0d` is running (the only frame-capturing lane).
- Footage scout round 2 `4a82f53a`: accepted from `snapshots/footage-v3/r2-holds.jpg`. All four
  tour clips come from the user's tour at 1920 × 1080: Command Center, agents in parallel, diff
  review, analytics. For the user to confirm: dollar figures in tour-4, two dark masks in tour-2,
  small chat text in tour-1 that names other products.
- Lane B office and vortex `6485fa0d`: partly accepted from its contact sheet. Good: new lines
  play with captions, no flash, vortex continues in storm colours and looks strong. Not good
  enough: the whole talk (15.3–33.9 s) is one static wide two-shot with small robots; the
  `rumble` is too subtle; the storm on the laptop is a flat streak texture that does not match
  the vortex at the cut (36.8 → 36.95 s); no grip acting. A second office round is needed after
  the overlay and desert lanes.
- Lane A overlays `976c0237` started 20:41 UTC (fresh lane; the resume was refused for idle
  time). It is the only frame-capturing lane now.
- Lane A overlays `976c0237`: accepted from its contact sheet (22 frames). The landing insert
  fills the screen from 10.827 to 15.327 s with the N3 caption on top; the showcase plays the
  four tour clips edge to edge with slow punch-ins and gold labels ("One Command Center",
  "Agents In Parallel", "Review Every Change", "Track Every Run"); no old window frame is left.
  Mix −16.89 LUFS, −1.41 dBTP. Not good enough: loudness range 18.5 LU (was 9.3), because the
  20 s showcase has only wind and two swells under it; and the frame at 70.2 s is a wide desert
  shot with no doorway, so the entry into the showcase is a wash over an unrelated shot.
- Grok has room again (weekly 1%). Orchestrator decision: run two lanes in parallel, because
  only one of them captures frames.
  - Lane B desert `0987dd94` (Codex, started 20:55 UTC): remove Cursor and dead cues, crews per
    SPEC v3 item 6, Ptah on screen at `rise`, camera push to the doorway before `pushIn`, eased
    title slab. Write set: `src/set-desert.js`, `src/look-desert.js`.
  - Lane C audio `7a4e93ed` (Grok, started 20:56 UTC): music bed and cut accents under the
    showcase, range at or below 11 LU, same loudness targets. It may not run the HyperFrames CLI
    while the desert lane captures frames.
- Still to do after these: office round 2 (closer framing and angle changes in the talk,
  stronger `rumble`, storm texture that matches the vortex, grip acting), draft render, commit.
- Lane B desert `0987dd94`, first pass: rejected. All 32 desert frames are black with captions
  on top. The desert rendered in the overlay lane's frames 30 minutes earlier, so the cause is
  most likely a runtime error in the lane's new code; the lane blamed the shared renderer and
  did not read the browser error. Resumed the same Codex session as `d5fec5f2` (21:07 UTC) to
  find the error, fix it, recapture and rescore.
- Lane C audio `7a4e93ed` (Grok): accepted from its notes; nobody has listened yet. New
  `showcase-bed.mp3` cut with ffmpeg from the cached `bed.mp3` (no ElevenLabs call), 70.375 to
  90.675 s, ducked 15 dB under D5, +3 dB lifts on the three clip changes. Mix −16.97 LUFS,
  −1.41 dBTP, range 9 LU (was 18.5), longest silence 0.6 s. Total still 106.831 s. It re-ran
  `build-timing.mjs` (new `music-3` element in `index.html`). It did not run `check`.
- Lane B desert, second pass `d5fec5f2`: accepted as a working base, with a polish round owed.
  Root cause of the black frames: `ReferenceError: Cannot access 'portalNear' before
  initialization` in `plan()` of `src/set-desert.js`. From the new 32-frame sheet: Ptah is on
  screen with glowing eyes before "Old." and holds through D1; three crews stand on three
  separate ramps with three robots each and nothing overlaps; one approval check lands on a
  block; the camera pushes into the doorway light before the showcase; Cursor is gone; the
  title slab fades in. Not good enough yet: the crews stand on flat planks and do not look
  like builders at work; some robots look washed out at 63–64.6 s; yellow rings sit behind the
  two robots at 91–95 s; the robots are cropped at the bottom edge at 90.5 s; the D2 two-shot
  (55–58 s) puts small robots in the lower left. The lane also notes that Ptah's voice runs
  over the crew pan and the doorway push (D3, D5) with its face off screen; orchestrator
  reading: SPEC v3 item 4 is about Ptah's first words, and a speaker who has been established
  on screen may narrate over what it describes, so this stays.
- `check --json` after the audio and desert lanes: ok, warnings only. Guard: 432 files, clean.
- Lesson: `node --check` does not catch a runtime ReferenceError; briefs for 3D lanes now ask
  for one headless load with the page errors read.
- Grok usage: one audio lane moved its weekly meter from 1% to 32%. Use it sparingly.
- Running since 21:38 UTC: Lane B office round 2 `c9b4cf11` (Codex, captures frames) and an
  independent visual review `c875147d` (Grok, read-only, reads the desert and overlay sheets)
  → `notes/review-grok-v3.md`. The review feeds the desert polish round.
- Independent review `c875147d` (Grok, `notes/review-grok-v3.md`): harsh, partly overstated
  (it calls the 96.5 s stone frame a missing title, but the title wall follows it), but these
  findings stand and go into the desert polish brief: crews haul nothing and look idle; flag
  poles pass through robots; faces blow out to white near 64.6 s; the stamp beat is cluttered
  and crops the inspector; the doorway push at 69.5 s crops both robots; the return at 90.5 s
  leaves them tiny; yellow rings sit behind the robots at 91–95 s; the title slab is a
  see-through plane with a vertical seam. Showcase: the "One Command Center" label left
  before the Command Center view ended; orchestrator edit in `src/build-timing.mjs`: labels
  now hold until 4.75 s of each 5 s clip (was 4.4 s). `build-timing.mjs` is rerun after the
  office lane finishes capturing.
- Added to the items for the user to confirm (not secrets, but visible in the tour clips): the
  workspace name `nx-video`, session titles about this promo, plan lines such as
  two account lines, a session id fragment, and the cost
  figures in tour-4.

### 2026-11-12 late — studio preview and the two-desk workspace request

- The user asked to see the film in the HyperFrames studio. Started
  `node node_modules/hyperframes/dist/cli.js preview --background .` from the demo folder; the
  studio answers on http://localhost:3002/. Stop it when the user is done.
- User request (verbatim): "for the studio can u do a new scene where they both in an office
  with a bigger screen and more wider/realistic view of ptah so the angle appears as 2
  developers settings near each other in a workspace or a 2 close desks".
- Decision: treat this as a restage of the opening office scene, not an extra scene. Two robots
  seated at two close desks, one big hero screen showing a real still of Ptah. Reversible: the
  sofa office (`src/look-office.js`, `src/set-office.js`) stays in place until the new look is
  approved.
- Stopped office round 2 (Codex `c9b4cf11`) because its sofa staging is superseded. It had
  already written `notes/lane-b-office-v3-r2.md` and a 28-frame sheet; its four files pass
  `node --check`, so the studio shows a working round-2 office (singles, stronger rumble, storm
  matched to the vortex texture). That round was not reviewed or accepted.
- Look-dev gate first (standing rule): lane `253bd857` (Codex, started 22:00 UTC) builds
  `src/look-workspace.js` and three stills (over-the-shoulder, front two-shot, single) →
  `notes/lane-b-workspace-lookdev.md`, `snapshots/lookdev/workspace-sheet.jpg`. Screen pictures
  are frames from the user's recordings, kept in git-ignored `assets/live-demo/stills/`;
  `tour-4.mp4` is excluded because it shows billing figures. No animation until the user
  approves the stills.
- Assumption to confirm with the user: the sofa becomes two office chairs, so the chairs (not
  a sofa) ride the vortex and land in the desert. This is folded into the office animation lane
  and the desert polish round.
- Redacted before the commit: home-directory paths, account lines, a cost figure and a session
  id fragment in `notes/review-grok-v3.md` and in this log.
- Committed the accepted v3 work as a restore point (no media): timing, overlays, audio
  scripts, vortex, desert base, office round 2, notes.

### 2026-11-13 — direction v4 (user, after watching v3 in the studio)

- User (verbatim): "also rather ptah saying `i made the world by speaking it name ` and the
  rest of the sentences we can focus on more of having same idea of wide screen and it
  explain the features we have on ptah while showing the demo and also the agents working in
  the background , also the caouch drop but the 2 agent is already standing , i reckon you
  can do that with opus rather using the cli tools, as the output so far is so basic and not
  what i'm imagining with cutting edge 3d modeling capabilities and also the ability to get
  free assets online we should deliver more of unqiue experience not that old looking 90s
  game ?"
- Written into `SPEC.md` as "Direction v4" with a proposed script (D1 rewritten, D3 cut, new
  feature lines F1–F4 over the four tour clips, D5 reworded). The lines are my wording and
  wait for the user's approval; no voice is generated before that.
- Executor change, on the user's instruction: visual scene work moves from CLI lanes to Opus
  subagents. This overrides the global "prefer non-Claude lanes" preference for this task's
  3D work only (my reading). CLI lanes stay for audio, timing and independent review.
- Stopped the Codex workspace look-dev lane `253bd857`. Its sheet confirmed the complaint:
  flat low-poly room, black hero screen, camera inside the monitor in two of three stills.
  Kept as `snapshots/lookdev/workspace-sheet.jpg` for the before/after.
- Started an Opus look-dev subagent (workspace stills a/b/c, look kit: CC0 PBR models,
  HDRI lighting, AO, depth of field, filmic tone mapping, re-shaded series robots, opt-in
  post path in `scene.js`) → `notes/opus-workspace-lookdev.md`,
  `snapshots/lookdev/workspace-sheet.jpg`.
- Next after the user approves the workspace look: desert look-dev (monument screen, Ptah
  presenting, crews in the background, seated landing), then animation, voice, timing.
- Seat-drop bug the user reported (seat falls while both robots already stand) is rule 3 of
  direction v4.
