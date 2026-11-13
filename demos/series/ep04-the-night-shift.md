# Episode 4 — The Night Shift

**The one message (end card):** Overnight PR reviews. Your machine. Your call.

**Logline:** A developer opens a pull request at 11:58 PM and goes to bed. The
agents work the night shift — and Cursor really, really wants to post
everything.

**Audience:** developers who maintain repositories and use AI review bots.

**Want and obstacle:** Cursor wants to post every finding to GitHub right now.
The rules (dry run by default, one finding per bug, live posting only with the
maintainer's sign-off) hold it back until morning.

**Length and format:** 50–60 s; 4:5 primary, 16:9 second.

## Facts behind the film

All from ptah-review: PR #924 (pipeline), #935 (publication, finding identity,
incremental review), #946 (end-to-end fixes), merged 2026-11-04/05.

| Claim on screen | Evidence |
| --- | --- |
| Reviews run on a schedule against connected GitHub repositories | #924 (cron scheduler, `pollAndRecord`), #946 (per-repo polling) |
| It runs on your machine with your own CLI agents | #924 ("cron scheduler and CLI agent lanes", Electron host) |
| Triage, four review lenses, then a verifier | #924 (stage coordinator), #946 ("All 4 lenses and verification completed") |
| A reworded bug keeps its identity, so it is not posted twice | #935 (finding ULIDs; same / distinct / uncertain) |
| Dry run is the default; findings are kept in dry run | #935, #946 (fail-safe dry-run) |
| Live posting needs a bot token, a verified identity and the maintainer's attestation | #935, #946 |
| At most 10 new inline comments per head; the rest go in the review body | #935 |

"6 findings" in the morning shot is **illustrative** (it matches the #946 canary
but should be labelled as an example if shown as a number).

## Script

| # | Set | Who | Line | Picture and sound |
| --- | --- | --- | --- | --- |
| 1 | desk at night | — | 11:58 PM · PR #42 opened | Frame 0: a laptop on a desk, a pull request page, a sticky note "fix tomorrow". The lid closes. Lights out. Clock tick. |
| 2 | temple, night | Conductor | "Night shift. New pull request." | Moonlight through the skylight; a long scroll (the diff) unrolls across the table. |
| 3 | temple, night | Cursor | "Let's post forty comments!" | Cursor already holding a stack of sticky comments. Setup: eager. |
| 4 | temple, night | Conductor | "Dry run." | A DRY RUN sign drops onto Cursor's head (callback to Episode 2). |
| 5 | temple, night | Codex | "Found a bug." | Four robots lean over the scroll with coloured lenses. Codex circles a line. |
| 6 | temple, night | Antigravity | "Found it in 3D." | Antigravity floats above the scroll, the bug glowing as a tiny 3D model. |
| 7 | temple, night | Claude | "Found it too. With caveats." | Claude's note is three pages long. |
| 8 | temple, night | OpenCode | "Same bug. Reworded. One finding." | OpenCode (verifier) stacks the three notes and stamps ONE ID on them. |
| 9 | temple, night | Cursor | "…Can we post now?" | Cursor peeks out from under the sign. |
| 10 | temple, night | Conductor | "Not without the maintainer's signature." | A scroll with an empty signature line; the maintainer's chair is empty. |
| 11 | desk, morning | — | 7:00 AM | The lid opens. The Reviews tab: findings waiting, 0 posted (dry run). |
| 12 | desk, morning | Cursor (whisper) | "…We have manners." | Callback line. Hold. |
| 13 | end card | — | Overnight PR reviews. Your machine. Your call. · ptah.live | Ptah emblem, robot credit. |

The want (post everything) is blocked three times: dry run (4), one finding per
bug (8), the maintainer's signature (10). The payoff (11–12) is the developer
waking up to a tidy review that waited for them.

## Reuse and new work

- **Reuse:** the Night Shift set, lenses, scroll and DRY RUN sign
  (`../agent-comparison/src/set-tour.js`), stamp physics.
- **New:** a developer desk at night and in the morning (laptop, lamp, sticky
  note, window light change); a stylised pull request page and Reviews tab on
  the laptop screen (drawn, labelled as illustrative, no real GitHub UI copy);
  the glowing 3D bug; the signature scroll.
- **Audio:** about 9 new TTS lines, clock tick, laptop close and open, night
  ambience (reuse), stamp, a soft morning sting.

## QA frames

- Frame 0: reads as "late night, PR opened" without sound.
- 4: the sign lands on Cursor's head and reads DRY RUN.
- 8: three notes visibly become one stamped finding.
- 11: "0 posted (dry run)" legible on a phone.

## Draft X post

> 11:58 PM: open a PR, go to bed.
> 7:00 AM: a review is waiting. Posted nowhere until you say so. 🌙
>
> Ptah's night shift: scheduled PR reviews on your own machine, with your own
> agents. Four lenses, one verifier, dry run by default.
>
> ptah.live
