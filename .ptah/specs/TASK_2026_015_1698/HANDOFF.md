# HANDOFF — TASK_2026_015_1698 (Episode 6 "The P Is Not Silent")

Updated 2026-11-12 23:10 UTC (end of session 4). `context.md` in this folder is the full
decision log; this file records the current state only.

## Goal

Episode 6, a HyperFrames 0.8.98 + Three.js promo for Ptah, in
`D:/projects/nx-video/demos/agent-pronounce`, branch `demo/ep06-p-is-not-silent`, PR #6
(https://github.com/Hive-Academy/nx-video/pull/6, stacked on PR #5). `SPEC.md` in the demo
folder is binding; its sections "Direction v4" and "Script v4.1" override older text.

Decisions the user already made:

- Direction v4 (2026-11-13): open on two robot developers at two close desks with one big,
  realistic Ptah screen; Ptah narrates product features while the app demo plays on a
  monumental wide screen with crews working in the background; the robots land seated
  (chairs, not the sofa) and are not already standing; a real quality leap with free CC0
  assets ("not that old looking 90s game").
- Visual scene work is done by Opus child sessions (model `opus`, effort medium), not CLI
  lanes. CLI lanes (non-Claude) stay for audio, timing, footage and review.
- Script v4 and v4.1 are approved, wording included: the mispronunciation joke is cut; Codex
  says the name correctly and explains it. The title "The P Is Not Silent" stays.
- Standing gate: each scene needs a user-approved look-dev still before animation.

## Done (all pushed to `demo/ep06-p-is-not-silent`)

- `66defad` v3 cut (restore point). `7e1bf42` direction v4 in SPEC. `cbd7b71`, `f04a581`,
  `8aa3713` script v4 / v4.1 and approvals.
- `6d2ece6 feat(demo): move episode 6 voice and timing to script v4.1`: eight new takes
  (N5, O1, D1, F1–F4, D5), forced alignment, tour windows per F line, showcase labels
  removed. Verified: `check --json` exit 0 `ok: true`; mix −17.1 LUFS, −1.36 dBTP, LRA 10.9;
  film 106.670 s; media guard clean (441 files). Details: `notes/lane-c-v4-audio.md`.
- `713b11a` log of look kit phase 1.
- The film is an interim cut: v4.1 voice over the v3 office and desert animation.

## In progress (local branches, NOT pushed, no PR; each in its own worktree)

| Branch | Head | Worktree under `D:/projects/nx-video/.claude-worktrees/` |
| --- | --- | --- |
| `demo/ep06-v4-workspace-look` | `b353830` look kit + `workspace-b` | `demo-ep06-v4-workspace-look-35499056160d` |
| `demo/ep06-v4-desert-look` | `f56547b` desert look v4 (pre-kit) | `demo-ep06-v4-desert-look-3775168180f0` |
| `demo/ep06-v4-ptah-colossus` | `ad8909b` Ptah colossus | `demo-ep06-v4-ptah-colossus-ca746bb4213a` |

Stills are git-ignored and live in each worktree at
`demos/agent-pronounce/snapshots/lookdev/`.

- Workspace: I viewed `workspace-b.png`. Real models, city bokeh and depth of field are a
  clear step up. Sent back (queued): clipped white robot shells, no screen glow, robots read
  as balls on chairs, foreground lamp across the left robot, black right wall, flat brown
  Claude face. Phase 2 (workspace-a, -c, sheet, `notes/opus-workspace-lookdev.md`) is owed.
- Desert: steered to `git merge b353830` and adopt the kit; stills `desert4-a..d` and
  `notes/opus-desert-lookdev.md` are owed.
- Colossus: reported done at `ad8909b` (`src/ptah-colossus.js`, 415,770 triangles, 24.05 m,
  stills `colossus-a..c`, `notes/opus-ptah-colossus.md`). I have NOT viewed its stills. Its
  own verdict: A and B pass, C fails (eye flare past the cheek; the sceptre head reads as a
  raised finger); collar edges torn; eyes are flat inlays.
- Main checkout: `notes/lane-d-v4-footage.md` is untracked (footage lane, see below).

## Background work

- Child session `0e86981c-347c-4cdc-a7f5-98459385fed8` "Ep6 v4 workspace + look kit":
  running phase 2; my feedback is queued for its next turn.
- Child session `5ee5ecde-4adc-4a5d-b50e-a3fe918d48e1` "Ep6 v4 desert look-dev": running,
  adopting the kit.
- Child session `3b2b1544-d1e7-441c-b8b5-5a6054532faf` "Ep6 v4 Ptah colossus": reported
  done; state not re-checked.
- CLI lane `30968205-f3bd-4f00-bf1f-f697ee72d584` (Codex, CLI session
  `01a1d1f1-00db-7143-9832-df3e09e8928e`): re-cuts `assets/live-demo/tour-1..4.mp4` to
  7.370 / 6.262 / 6.421 / 5.882 s, blurs money figures, covers account and identity lines;
  backup of the old clips in `assets/live-demo/v3/`; deliverable
  `notes/lane-d-v4-footage.md`, sheet `snapshots/footage-v4/sheet.jpg`. State at handoff:
  not confirmed finished.
- HyperFrames studio is still running on http://localhost:3002/ (stop with
  `node node_modules/hyperframes/dist/cli.js preview --stop` when the user is done).

## Open problems and decisions

- Waiting on the user: which N5 pronunciation to use. Files in
  `demos/agent-pronounce/assets/audio/vo/`: `n5-codex.mp3` ("Puh-TAH", in the film),
  `candidates/n5-patah.mp3`, `candidates/n5-p-tah.mp3`. Nobody has listened to any new take.
- The user's "approve" did not choose between masking cost figures and another clip; I
  chose masking (reversible, old clips kept). Session titles and the workspace name stay
  visible; the footage lane lists them for the user.
- No scene has a user-approved still yet, so no v4 animation may start.
- The chair model must be the same in workspace, vortex and desert
  (`mid_century_lounge_chair`).
- Not run: paid transcription QA of the new takes; a draft render of the interim cut.

## Key files

- `D:/projects/nx-video/demos/agent-pronounce/SPEC.md`: binding contract (v4, v4.1).
- `D:/projects/nx-video/.ptah/specs/TASK_2026_015_1698/context.md`: decision log; append.
- `D:/projects/nx-video/demos/agent-pronounce/notes/lane-c-v4-audio.md`: line times, tour
  windows, cues, mix.
- `D:/projects/nx-video/demos/agent-pronounce/scripts/audio/running-order.mjs`: script and
  cue layout. `src/build-timing.mjs` generates `index.html` and `compositions/`.
- `src/look-kit.js` (on `demo/ep06-v4-workspace-look`): `film` opt-in post chain,
  `environment`, `reshadeRobot`, `screenLight`, `practical`, `contactShadow`.
- `D:/tmp/ep06-codex-workspace-leftovers`: copy of the rejected Codex look-dev files.

## Next steps

1. Read the footage lane result (`ptah_agent_read` on `30968205…`, then
   `notes/lane-d-v4-footage.md`); view `snapshots/footage-v4/sheet.jpg` and the final hold
   of each clip for leftover private text; run `node src/build-timing.mjs` and
   `node node_modules/hyperframes/dist/cli.js check --json` from the demo folder; commit the
   notes and `scripts/footage/cut-tours.mjs` (never media).
2. View the colossus stills (`colossus-sheet.jpg` in its worktree) and decide which open
   defects go back to the child (`ptah_session_send`).
3. When the workspace and desert children report, view their stills (downscale with ffmpeg
   first), send fixes back until each scorecard row is at least 4, then show the user the
   stills for approval.
4. Merge the three branches into `demo/ep06-p-is-not-silent` (conflicts expected in
   `lookdev/*`, `assets/media.manifest.json`, `assets/CREDITS.media.md`: keep both sides),
   run `node tools/media/fetch-media.mjs demos/agent-pronounce --check` and
   `node tools/guards/no-media.mjs` from the repo root, push. Until then, report the three
   branches as local-only.
5. After the user approves the looks: animate workspace, vortex (chairs), desert (seated
   landing, monument screen with the tour clips, crews in depth, colossus), then
   `check --json`, snapshots, a draft render to `renders/preview-v4-draft.mp4`, commit, push
   to PR #6 and update the PR body.
6. Apply the user's pronunciation choice (change the TTS token in `running-order.mjs`, run
   `node scripts/audio/generate.mjs`, `node src/build-timing.mjs`,
   `node scripts/audio/measure-mix.mjs`).

## Lessons

- Agent-tool subagents stop at 150,000 context tokens; use child sessions for look-dev.
- Codex lanes: narrow briefs, 20-minute timeout, they skip Ptah MCP tools. Check their
  shortcuts (the audio lane replaced forced alignment with estimates).
- One headless-browser job at a time where possible; `check` ran fine alongside the
  children this session.
- In Bash, write multi-line Node patches to a file under `D:/tmp` and run that; inline
  heredoc scripts mangled backslashes.
