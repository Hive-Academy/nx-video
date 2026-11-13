# The Tribunal — series guide

Short comedy films starring the same five AI coding agents and the Ptah
Conductor. Episode 1 (`../agent-tribunal`) worked; Episode 2
(`../agent-comparison`) had a strong idea but a diluted message. This guide
turns what we learned into rules, and lists the next episodes.

## Episodes

| # | Title | The one message | Brief | Status |
| --- | --- | --- | --- | --- |
| 1 | The Tribunal | Five agents argue; one verdict | `../agent-tribunal/SPEC.md` | Done (PR #4) |
| 2 | Agent Cribs | Same agents, two homes (T3 Code, Ptah) | `../agent-comparison/SPEC.md` | Done (PR #5); reference cut, not the post |
| 3 | Grading Your Own Homework | In Ptah, no agent grades its own homework | `ep03-grading-your-own-homework.md` | Brief |
| 4 | The Night Shift | Your agents review your PRs overnight, on your machine | `ep04-the-night-shift.md` | Brief |
| 5 | Same Me | Same agents, different house rules (T3 Code and Ptah) | `ep05-same-me.md` | Brief |

**Suggested order: 3 → 4 → 5.** Episode 3 sets up Ptah's core rule (receipts and
independent review). Episode 4 shows the newest, most concrete feature. Episode 5
lands best once viewers already know the temple's rules, and it is the friendly
bridge to T3 Code's audience.

## Why Episode 2 blurred

- About 15 facts in 106 s: one per room, each with a one-line joke. A feature
  list, not a story.
- No conflict: nobody wanted anything, so the lines were observations.
- Inside jokes: "event-sourced SQLite", "BM25 plus vectors", "different family"
  only land if you already know them.
- No retellable takeaway.
- 46 px captions in a 16:9 frame shrink to about 9 px in a phone feed.

## Rules for every episode

**Story**

1. **One message**, written as the end-card line, that a viewer could repeat to a
   friend. Every scene serves it; anything that doesn't is cut.
2. **One want, blocked.** One character wants something and runs into the rule
   the episode is about. The rule is the antagonist; nobody is the villain.
3. **Three beats of escalation, one payoff.** Rule of three for the attempts;
   the payoff restates the message in a picture.
4. **Set up every punchline.** The picture or a line plants the expectation, the
   punchline turns it, a reaction hold lets it land.
5. **Jargon only when the picture explains it.** If a term needs a footnote,
   replace it with what it does ("no file on disk" instead of "deliverable
   verdict").
6. **Every claim traces to evidence**: `../agent-comparison/research/*.md`
   (path:line at a pinned SHA) or a Ptah PR number. Illustrative numbers are
   marked as such in the brief.
7. **Neutral about others.** T3 Code and any other tool appear with respect: own
   name and logo to identify it, never mocked, no scoreboard between products.

**Form**

8. **45–60 s**, 7–12 spoken lines.
9. **Hook in 2 s**: frame 0 already shows the conflict.
10. **Pacing** (Episode 2's pacing pass): ≤ 3.0 words/s, real 0.6 s beats, 0.6 s
    lead-in per new set, 0.35 s between lines, 0.6 s before a punchline reply,
    0.7 s reaction hold at each scene end.
11. **Two cuts per episode**: **4:5 (1080 × 1350) is primary** for the X and
    LinkedIn feeds; a 16:9 (1920 × 1080) cut second. World-space cameras make the
    reframe cheap; overlays get their own layout per aspect.
12. **Legible on a phone**: captions ≥ 64 px in 4:5 and ≥ 72 px in 16:9, at most
    6 words per caption line, room labels ≥ 40 px.
13. **Burned-in, word-synced captions** on every line (muted autoplay).
14. **End card**: the one message, the Ptah emblem, `ptah.live`, the robot
    credit. 3 s.

**Production**

15. Same cast, voices (`../agent-tribunal/assets/audio/voices.json`), robot rig,
    physics, temple and caption style. Copy the latest engine
    (`../agent-comparison`) into each new episode folder.
16. The build loop that worked: spec → two subagents in parallel (audio,
    timeline and overlays / 3D) with the `mount(config)` contract and named
    action cues → orchestrator snapshot review → user preview → render → PR.
17. Media stays untracked (`tools/guards/no-media.mjs`); each folder has a
    restore script.

## Cast

| Agent | Colour | Running trait |
| --- | --- | --- |
| Claude | #D97757 | Over-prepared: 43-step plans, caveats |
| Codex | #10A37F | Deadpan, already merged it |
| Cursor | #8C8CFF | Eager, finishes your sentences |
| Antigravity | #4F8BF5 | Floats, opens browsers, does it "in 3D" |
| OpenCode | black and white | Pedantic, objects on principle |
| Conductor | #E8A33D | The temple's judge; deadpan, slow |
