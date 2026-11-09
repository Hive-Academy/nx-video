# Episode 3 — Grading Your Own Homework

**The one message (end card):** In Ptah, no agent grades its own homework.

**Logline:** Codex finishes a job and wants it approved — by Codex. Three
schemes, three temple rules, one reluctant review by Claude.

**Audience:** developers who use more than one coding agent. No Ptah knowledge
needed: the rules explain themselves on screen.

**Want and obstacle:** Codex wants a quick approval. The temple's rules (show
the file, a reviewer from another family) block every shortcut.

**Length and format:** 45–55 s; 4:5 primary, 16:9 second.

## Facts behind the film

| Claim on screen | Evidence |
| --- | --- |
| A job counts as done only if its declared file exists on disk | `research/ptah.md` §5 (`lane-completion-notifier.service.ts:1-40`); `routing-and-learning.md` §2 (`report-effect.ts:75-87`) |
| A reviewer cannot share the implementer's model family | `research/ptah.md` §5 (`hard-constraints.ts:53,128`) |
| A run cannot review itself | `research/ptah.md` §5 (`lane-outcome-recorder.service.ts:325`); `routing-and-learning.md` §2 (`outcome-report.tool.ts:150-157`) |
| Verified results feed the temple's score for future jobs | `routing-and-learning.md` §1–2 (90-day matrix) |

Avoid: "the scoreboard can't be edited" (users can add their own matrix cells,
`capability-matrix.store.ts:31-34`), and anything about how often routing runs.

## Script

| # | Set | Who | Line | Picture and sound |
| --- | --- | --- | --- | --- |
| 1 | review desk | — | — | Frame 0: Codex at the review desk, about to slam a green APPROVED stamp on its own paper. The stamp lands. |
| 2 | review desk | Conductor (off) | "Denied." | Gavel BANG off-screen. Codex freezes mid-stamp. |
| 3 | title | — | GRADING YOUR OWN HOMEWORK · The Tribunal, Ep. 3 | Title slam. |
| 4 | lanes | Codex | "Job's done. Trust me." | Codex slides an envelope across to the Conductor. Setup: confident. |
| 5 | lanes | Conductor | "Where's the file?" | The Conductor taps the empty DELIVERED tray. |
| 6 | lanes | Codex | *(beat)* "…It's in my heart." | Codex pats its chest badge. Hold. |
| 7 | lanes | Conductor | "No file on disk, it didn't happen." | The tray buzzes red: NOT DELIVERED. Codex deflates. |
| 8 | review desk | Codex | "Hello. I'm a… totally different reviewer." | Codex returns in a fake moustache and glasses, sits in the reviewer's chair, holding its own code. Setup: the disguise. |
| 9 | review desk | Conductor | *(long beat)* "Same family." | The moustache falls off on "family". |
| 10 | review desk | Codex | *(beat)* "…Fine. Claude. Review me." | Codex slumps. |
| 11 | review desk | Claude | "Wonderful! Step one of forty-three—" | Claude unrolls a scroll that keeps rolling off the desk and across the floor. |
| 12 | review desk | Codex | "…Can I have the moustache back?" | Reaction hold. |
| 13 | scoreboard | Conductor | "Now it counts." | Claude stamps REVIEWED; one gold tally lights up in Codex's column on the scoreboard. Codex does a small proud hop. |
| 14 | end card | — | In Ptah, no agent grades its own homework. · ptah.live | Ptah emblem, robot credit. |

About 10 spoken lines, all short. The three attempts are: no file, the
disguise, giving in. The payoff (13) shows the rule paying off rather than
punishing.

## Reuse and new work

- **Reuse:** temple, review desk, lanes with the DELIVERED tray and stamp, the
  scoreboard (`../agent-comparison/src/set-tour.js`, `set-scoreboard.js`),
  Claude's paper scroll from Episode 1.
- **New:** fake moustache and glasses props with a physics drop; an endless
  scroll unroll; an APPROVED stamp for Codex; a red NOT DELIVERED buzzer state;
  one tally lighting on cue.
- **Audio:** about 10 new TTS lines with the cast voices, gavel (use the boosted
  Episode 1 files), stamp, buzzer, scroll unroll, a short comedic bed.

## QA frames

- Frame 0: the self-stamp already reads as cheating.
- 6–7: empty tray clear before "It's in my heart".
- 8–9: the disguise reads instantly; the moustache drop lands on "family".
- 13: the tally lighting is visible on a phone.
- End card legible in 4:5 on a phone.

## Draft X post

> Codex tried to approve its own PR. The temple had notes. 🧑‍⚖️
>
> In Ptah, no agent grades its own homework: show the file, then a reviewer
> from a different model family signs off.
>
> ptah.live
