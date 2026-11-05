# Review — The Tribunal, Episode 1

Final review before the delivery render, 2026-11-05. Approved by the user in the
Studio preview.

## Check

`node node_modules/hyperframes/dist/cli.js check --json`: ok, 0 errors, 0 warnings.

## Frames reviewed

22 snapshots across the full 104.29 s cut (`snapshots/review3/`, not tracked):
0, 2.8, 6.8, 8.4, 10.2, 12.5, 17, 21, 27, 33, 43, 55, 62, 70, 77, 82.5, 85.5,
90, 95, 99, 100.6 and 103.5 s.

| Beat | Verdict |
| --- | --- |
| Intro cards over the temple (0–4 s) | Pass. Text holds still; frame 0 reads as a thumbnail. |
| Punch promo (4–8.8 s) | Pass. One word per agent, icon tag, OpenCode in black and white. |
| Title (8.8–11.3 s) | Pass. Six-icon cast row with the Ptah emblem. |
| Table scenes | Pass. Temple backdrop with the throne behind the lectern, robots seated, shadows grounded, speaker singles and soft-edge over-the-shoulder shots, full CONDUCTOR plate. |
| Booths | Pass. Robot on the left third, word-by-word bubble on the right, lower-third clear. |
| Chaos, verdict, unison wide (84–99 s) | Pass. Verdict card centred and readable; the row-20 wide is the strongest frame. |
| End card | Pass. Gold Ptah emblem, title, CC BY credit line. |

## Known and accepted

- Bubbles show the next word as faint ghost text before it is spoken.
- The 1024 px temple painting reads as painted in the tightest close-ups; haze covers most of it.
- Row 9 (43 s) leaves a large dark floor area on the right of frame.
- Runtime is 104 s, over the original 70–90 s target, because of the requested intro and promo.
- The mix was measured, not heard, by the agents; the user approved it in the preview.

## Banned defaults found and fixed during the build

Robots intersecting the table, a static table camera, cropped booth heads,
washed-out tints, a sharp centred foreground in over-the-shoulder shots, a
cropped nameplate, intro text drift, empty bubble pages, and OpenCode and the
Conductor reading as the same colour.
