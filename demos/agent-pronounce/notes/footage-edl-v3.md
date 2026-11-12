# Footage EDL v3

## Sources

| Recording | Role | Coarse timeline (source seconds) |
|---|---|---|
| `rec-2026-11-06.mp4` (1910×916, 30 fps) | Ptah landing page | 0–12: hero and PtahCode wordmark; 12–30: desktop product and feature overview; 30–42: routing diagram; 42–75: providers, diff, chat and account sections; 78–98: closing call to action/download. |
| `rec-2026-11-09.mp4` (1918×988, 30 fps) | Ptah desktop tour | 0–22: chat, agent lanes and Command Center; 22–110: setup, apps, memory, skills and tasks; 110–150: concurrent lanes and chat; 150–168: skills and agent library; 168–178: analytics dashboard; 178–328: chat, sessions, changed files and green diff views. |

All four current tour clips come directly from `rec-2026-11-09.mp4`; the earlier fallback demo clips are unused.

## EDL

All paths below are relative to `assets/live-demo/`. Source in/out values are seconds; disjoint ranges denote hard cuts. Each tour has a 4× fast section and a final 1.2 seconds at 1×. Crops are `w:h:x:y` in source pixels. All outputs are H.264/libx264 CRF 18, yuv420p, 30 fps constant, silent, faststart, GOP 15.

| Clip | Source | Source in–out | Speed plan | Crop | Output / measured duration | What it shows | Suggested label | Focus rectangle (output px) |
|---|---|---:|---|---|---|---|---|---|
| `landing-scroll.mp4` | `source/rec-2026-11-06.mp4` | 0.0–31.5 | 0–1.2 at 1× hero hold; 1.2–31.2 at 10×; 31.2–31.5 at 1× settled | `1910:900:0:8` | 1920×904 / 4.500 s | Hero, page feature sections and routing diagram | `Meet Ptah` | `520,155,880,610` |
| `tour-1.mp4` | `source/rec-2026-11-09.mp4` | 2.0–9.6; 12.4–21.2 | 2–9.6 and 12.4–20 at 4×; 20–21.2 at 1× | `1756:988:0:0` | 1920×1080 / 5.000 s | Chat and agent lanes transition to the Command Center landing view | `One Command Center` | `550,160,1200,550` |
| `tour-2.mp4` | `source/rec-2026-11-09.mp4` | 118.0–134.4 | 118–133.2 at 4×; 133.2–134.4 at 1×; two account-identifier lines masked | `1756:988:0:0` | 1920×1080 / 5.000 s | Concurrent background sessions, agent icons and green progress bars beside chat | `Agents In Parallel` | `290,170,1160,640` |
| `tour-3.mp4` | `source/rec-2026-11-09.mp4` | 242.0–249.6; 258.6–267.4 | 242–249.6 and 258.6–266.2 at 4×; 266.2–267.4 at 1× | `1756:988:162:0` | 1920×1080 / 5.000 s | Changed-file tree and green additions in the diff/review pane | `Review Every Change` | `825,170,1030,805` |
| `tour-4.mp4` | `source/rec-2026-11-09.mp4` | 171.9–175.0 (repeated); 172.0–174.8; 174.0–175.2 | 171.9–175.0 repeated four times and 172–174.8 at 4×; 174–175.2 at 1× | `1756:988:162:0` | 1920×1080 / 5.000 s | Analytics daily-use bars, provider cost shares and usage figures | `Track Every Run` | `180,250,1620,610` |

## Privacy check

Reviewed `snapshots/footage-v3/r2-holds.jpg`: 0.3, 2.5 and 4.7 seconds for each tour, 3 columns × 4 rows, 960-pixel-wide cells. Inspected the final 4.7-second hold of each tour at full 1920×1080 size. No visible email, API key, token, password, account or licence identifier, or personal-user-name file path remains in those sampled frames. Tour 2 has two dark masks over the provider account identifier lines in its lower-right status panel for the entire clip. Tour 4 uses only the scrolled analytics region where the provider-account cards and API-key suffix are off screen; an additional half-second source contact sheet covers that chart interval. Ptah project names, chats and repository-relative paths were allowed under the corrected privacy rule.

## For the user to confirm

- `tour-4.mp4` at 0–5 s displays estimated dollar costs and usage figures on the analytics dashboard; please confirm those figures may appear publicly.
- `tour-2.mp4` at 0–5 s has two visible dark privacy masks over account-ID lines. Confirm whether the look is acceptable for the film.

## Decisions

- Story order: Command Center → concurrent agents → changed-file review → analytics.
- Rebuilt all four tours from the actual long desktop recording. Tour 1 and tour 3 skip source gaps; tour 4 repeats a short scrolled chart pass to avoid provider-account cards while meeting the 4× ramp and 5-second duration.
- Cropped every tour to 1756×988 at x=0 or x=162, then scaled to 1920×1080. Focus rectangles mark the area for a slow punch-in.
- `ffprobe` confirms each tour has one H.264 video stream, 1920×1080, 30/1 fps, 150 frames, 5.000 seconds and no audio stream. The accepted landing clip remains 4.500 seconds and untouched.

## Open defects

- Tour 4's repeated chart scroll is noticeable. The source offers only a few seconds of scrolled chart view before returning to account cards, so this is a compromise to keep identifiers out.
- Tour 2's dark masks are visible and obscure some plan-limit copy. Tour 3's closing cursor sits over the lower diff, outside the primary focus area.
- The privacy check used contact sheets plus sampled output frames as requested; it is not a frame-by-frame audit of all 600 tour frames.
