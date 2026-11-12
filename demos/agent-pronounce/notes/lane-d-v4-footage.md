# Lane D v4 footage

## Clips

All clips come from `assets/live-demo/source/rec-2026-11-09.mp4`. Outputs are silent H.264/yuv420p, 1920×1080 at 30 fps. The pre-v4 clips remain backed up in `assets/live-demo/v3/`. Reproduce with `node scripts/footage/cut-tours.mjs`; its `crop()` helper rejects any crop for which `Math.abs(w/h - 16/9) >= 0.01`. All selected dimensions are mathematically 16:9 and use square-pixel scaling.

| File | Source seconds | Speed | Source crop x/y/w/h | Crop ratio | Length | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| `tour-1.mp4` | 15–19.3; 20.5–21.4 | 0.8×; 1×; final clone hold | 0/0/1344/756 | 1.777778 | 7.400 s | Agent chat and Command Center landing card |
| `tour-2.mp4` | 118–129 | 2.05×; final clone hold | 0/80/1088/612 | 1.777778 | 6.266016 s | Sessions rail, background/finished cards and running summary; private pane is a soft dark focus area |
| `tour-3.mp4` | 259–267.4 | 1.6×; final clone hold | 894/0/1024/576 | 1.777778 | 6.433333 s | Changes view and green report diffs |
| `tour-4.mp4` | Still at 173.2 | zoompan, 1.00018× per frame | 290/0/1504/846 | 1.777778 | 5.900 s | Usage totals, daily cost bars and provider share |

Clip 1 cuts on the change to Command Center. Clips 2 and 3 use continuous source passes. Clip 4 slowly pushes in on one steady dashboard frame because the source chart pass is brief and nearby views expose account cards. The final holds last at least 0.8 s. Lanczos is used for all scaling, including clip 3's 1024-pixel-wide crop.

## Masks

Coordinates below are **source pixels**. The clip 2 focus effect is applied after its source crop and before scaling; the clip 4 figure masks are applied before crop and zoom. Every listed active mask covers the entire visible clip, including its start, middle and end.

| Clip | Hidden | Source region x/y/w/h | Time in output | Method |
| --- | --- | --- | --- | --- |
| 1 | Right status pane with costs/account details; lower private panes | x≥1344 or y≥756 | 0–7.400 s | 16:9 crop |
| 2 | Machine paths, account/plan lines, provider suffixes, costs and cursor in pane to right of Sessions | 550/80/538/612 | 0–6.266016 s | Strong box blur, 55% dark overlay and a 40-pixel Gaussian-softened seam at source x530–570; remaining pane x≥1088 cropped |
| 2 | Source top/bottom outside selected rail and right pane | y<80 or y≥692 | 0–6.266016 s | 16:9 crop |
| 3 | Left status/chat pane and its costs | x<894 | 0–6.433333 s | 16:9 crop |
| 3 | Final cursor below review pane | y≥576 | final hold | 16:9 crop |
| 4 | Raw token cost | 305/176/128/35 | 0–5.900 s | Strong box blur |
| 4 | Currency chart axis ticks | 377/346/54/246 | 0–5.900 s | Strong box blur |
| 4 | Hover cost readout | 301/615/180/42 | 0–5.900 s | Strong box blur |
| 4 | Donut cost total | 325/763/75/37 | 0–5.900 s | Strong box blur |
| 4 | Provider cost figures | 925/758/106/54; 1747/712/97/28; 1754/774/91/28 | 0–5.900 s | Strong box blur; rightmost source portions also cropped |
| 4 | Per-session cost table | y≥846 | 0–5.900 s | 16:9 crop |
| 4 | Cursor over chart | 730/483/42/45 | 0–5.900 s | FFmpeg delogo interpolation |

The new clip 2 crop keeps the sharp Sessions rail in roughly the left half of the frame. The right pane retains indistinct shapes so the treatment reads as depth/focus rather than a flat black box.

## Still readable

Truncated titles are recorded as displayed. Text changes as the source scrolls.

| Clip | Workspace names and session titles | Other proper nouns |
| --- | --- | --- |
| 1 | `seshat`, `ptah-extension`, `nx-video`; `video about ptah features promo`, `before...`, `Session 10/9/2026` | PtahCode, Command Center, Ptah, Codex CLI, Claude CLI |
| 2 | `seshat`, `ptah-extension`, `nx-video`; `Session master: detacha...`, `dashboard designs and ...`, `continue our context manage...`, `setting up other machines`, `detachable-windows` | PtahCode; project task ID `TASK_2026_895_d988` |
| 3 | `Session master: detachable windows P1`; `.ptah/specs/TASK_2026_DETACHABLE_WINDOWS` and report filenames | Electron, Angular, Codex, Git, Ptah extension, CodeRabbit |
| 4 | No session title or workspace name in crop | Codex, Grok |

The visible task ID, worktree branch and repository-relative report paths are project identifiers. No machine or home-folder path is visible in the checked frames.

## Verification

- `node scripts/footage/cut-tours.mjs`: exit 0 after the exact-ratio crop change. The script uses `spawnSync` with an FFmpeg argument array and `shell: false`.
- Re-extracted 0.3 s, one third, two thirds and final-minus-0.2 s from every output with FFmpeg; rebuilt `snapshots/footage-v4/sheet.jpg` as a labeled 4×4 sheet of 960×540 cells and `hold-1.png` through `hold-4.png` at 1920×1080. FFmpeg exits were 0. Fontconfig emitted harmless missing-default-config warnings for drawtext; labels rendered.
- Viewed the final sheet and opened all four holds at full resolution. Text width and circular icons/donut are normal. Clip 1 ends on Command Center, clip 2 shows sharp lanes beside a blurred/dark private pane, clip 3 ends on a readable green diff, and clip 4's blurred currency fields stay attached to their figures. No private text, currency amount or cursor over content was readable in these checked holds. Clip 2's pane was also checked in the middle of the pass.
- `ffprobe` after the final render: each clip is H.264/yuv420p, 1920×1080, 30/1 fps, one video stream and no audio. Clip 1: 7.400000 s, 222 frames. Clip 2: 6.266016 s, 188 frames. Clip 3: 6.433333 s, 193 frames. Clip 4: 5.900000 s, 177 frames. All meet the narration windows within the specified tolerance.
- From `D:/projects/nx-video`, `node tools/guards/no-media.mjs`: exit 0, `no-media: checked 442 files; no violations`. The guard also noted two already-missing tracked `.ptah/subagent-handoffs` files outside this lane; they were not changed here.
- Scoped `git status --short` showed the note and cut script as untracked; media folders are ignored. No history-changing git command was run. Ptah tools and skill discovery were unavailable, so local CLI and direct frame inspection were used.

## Decisions

- Replaced all four distorted source crops with exact 16:9 dimensions while retaining their timing and privacy treatment.
- Enlarged clip 2 to include the Sessions rail at normal proportion, then blurred and darkened the private right pane by 55% with a softened seam.
- Kept clip 4's source-coordinate currency masks ahead of its wider, exact-ratio crop and slow zoom. The lower per-session cost table remains outside the frame.
- Left `assets/live-demo/v3/` untouched.

## Open defects

- Clip 4 shows aggregate usage and cost, but omits the per-run table; the line's “every run” wording is only implied by the dashboard.
- Clip 2's source pass shows little change in status badges, and its privacy focus effect takes roughly half the frame. Its Sessions rail is readable and normally proportioned.
- The visual audit covers the requested time samples, the middle of clip 2 and the full-size holds, not every encoded frame. No remaining private text or unblurred currency amount was observed in those checks.
