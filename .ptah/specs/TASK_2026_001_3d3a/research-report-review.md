Verdict: APPROVED

Independent review of `research-report.md` (merge of parts A, B, C) for TASK_2026_001_3d3a, 2026-10-26. Re-verification was done with git plumbing against the read-only clone `/home/amun/projects/ptah-extension` (baseline `e0ca51e6e`). Part B claims were not re-reviewed (authored in this lane's chain); only the report's summary of part B was checked for faithfulness.

## Verified claims

| # | Claim (report/part A) | Command | Result |
|---|---|---|---|
| 1 | `c032b0f1e` added the `tools/video-editor/` tracked tree with 186 snapshot stills | `git show c032b0f1e --name-only --diff-filter=A -- tools/video-editor \| grep -Ec 'snapshots/.*\.(png\|jpg)$'` | 186 — matches exactly |
| 2 | `eb0c43fdd` untracked it; 0 files at baseline; these are the only two commits touching the path | `git log --all --full-history --oneline -- tools/video-editor/`; `git ls-tree -r e0ca51e6e -- tools/video-editor \| wc -l`; `git show eb0c43fdd --diff-filter=D` | 2 commits (both 2026-09-07); 0 files at baseline; 348 deletions |
| 3 | Simplified `git log --all` misses the editor tree (full-history essential) | `git log --all --oneline -- tools/video-editor/ \| wc -l` | 0 — part A's method note confirmed |
| 4 | `f6ee7d4ff` added `selfshot/ptah-opensource/{beats,words,words.raw}.json`; `3413d42e4` added `selfshot/tribunal-intro/beats.json`; `50a599270` added the `_smoke` fixture | `git show <rev> --diff-filter=A --name-only -- <slug path>` | All match; both private slugs absent from `SELFSHOT_KIT_SLUGS` |
| 5 | `SELFSHOT_KIT_SLUGS = new Set(['_smoke'])` at `export-kit.mjs:63`; `shouldCopy` at `:97-108`; guard `findLeakedIngest` at `:117-137`; delete-and-throw at `:254-262` | `git show e0ca51e6e:…/export-kit.mjs \| grep -n …` | Line 63 exact; `shouldCopy` line 97; `findLeakedIngest` line 117; `throw` at 258 inside the 254-262 block |
| 6 | `731b8084c:scripts/record-tui.mjs:70` is the only credential-shaped literal, explicitly fake | `git show 731b8084c:…/record-tui.mjs \| grep -n FAKE_API_KEY` | Line 70: `sk-ant-e2e-fake-key-not-real-do-not-call-upstream` — self-describing fake, confirmed |
| 7 | MP3/PNG attributions: `731b8084c` (6 mixkit MP3s + `ptah-icon.png`), `11ec42db5` (4), `db87b555d` (2) | `git show <rev> --diff-filter=A --name-only -- apps/ptah-video-studio/` | All 12 MP3s + icon match the inventory exactly |
| 8 | HyperFrames PNGs: 5 added in `30eb7c390`, 1 in `2f53430e1`, all 6 at baseline | `git show … --diff-filter=A`; `git ls-tree -r e0ca51e6e -- tools/hyperframes/ \| grep png` | 5 + 1; 6 present at baseline |
| 9 | `.gitignore:231-245` ignores `tools/video-editor/` whole, citing 2,216 MB untracked / 2,103 MB MP4s | `git show e0ca51e6e:.gitignore \| sed -n '231,245p'` | Text matches, including the MB figures |
| 10 | Ten blobs >1 MB: 7 music MP3s + 3 GLBs; `libs/showcase-manifest` has 6 baseline files and no media | `git rev-list --objects --all -- <7 paths> \| cat-file --batch-check` filtered >1,000,000; `git ls-tree` | Exactly 10: BoomBox 10,614,184 B, Lantern 9,564,264 B, ToyCar 5,422,412 B + 7 MP3s; manifest = 6 files |
| 11 | Vendored `davinci-resolve-mcp` at commit `6eca4bf` (2026-09-06) per `c032b0f1e:tools/video-editor/CLAUDE.md:24-29` | `git show c032b0f1e:tools/video-editor/CLAUDE.md \| sed -n '22,31p'` | "Vendored at `vendor/davinci-resolve-mcp` (commit 6eca4bf, 2026-09-06)" — confirmed |
| 12 | `01a786625` added the showcase `scripts/*.json` | `git show 01a786625 --diff-filter=A --name-only` | The 4 named JSONs plus 4 more tour scripts — all covered by the `scripts/*.json` exclusion |

**Q4 spot-check (npm, 2026-10-26):** `npm view nx dist-tags` → `latest: 24.0.1`, `previous: 23.3.1`; `npm view @nx/plugin version` → `24.0.1`. Matches part C and the report's Q4 ("current major is Nx 24… build on `@nx/plugin@24.0.1`, peers `>=23 <25`").

**Extraction method:** `docs/decisions.md` gates a history-preserving extract on a clean scan; the scan found private ingest (`f6ee7d4ff`, `3413d42e4`), 186 editor stills + first-party transcript (`c032b0f1e`), and third-party media. The clean-copy conclusion follows from the evidence and the binding decision. Confirmed.

**Part B summary faithfulness:** the report's Q2/Q3/Q5 sections restate part B accurately, keeping part B's hedges (`shader-transitions` tarball-verified, editor pin "inferred", upstream match attributed to the orchestrator with user confirmation reserved, scope ownership from the `@hive-academy/ptah-cli` maintainer entry). No part B claim is strengthened beyond its evidence in the merge.

**Consistency:** the consolidated "Not safe to copy" list covers every per-path removal (and is broader on GLBs — see defect 1). All five "For the user" items are genuinely user-reserved facts (org headcount, a check on the D: working tree that this Linux clone cannot reach, npm login/2FA, plan approval, the user's Ptah account setting) — none could have been settled from evidence here.

**Five logic questions (reviewer's method, applied to the report as gate):**
1. Silent failure: a reader executing the per-path table's named removals (instead of the consolidated list) would keep 4 third-party GLB models and still read the row as "safe" — see defect 1; the consolidated list prevents the unsafe copy.
2. Unexpected user action: copying from the Q1 table rather than the consolidated "Not safe to copy" section diverges on `public/models/`.
3. Wrong answer rather than error: "3 GLB models" (report line 34) and part A's "complete" inventory silently absorb the wrong count into a correct exclusion — defects 1-2.
4. Dependency/verification failure: part A's citation `b69ec6a7e` for the scene-file additions does not survive re-verification — defect 3.
5. Missing: no part researched the licenses of the `public/models/*.glb` sample models (out of A's scoped verdict, not covered by B); the report already flags the missing neutral smoke assets for TASK_2026_002 (line 97).

## Defects

None of these change a path verdict, the extraction-method conclusion, or the operative consolidated exclusion list; each has a one-line fix.

1. **The Q1 table and the Media paragraph name only 3 of 7 tracked GLB models.** Report line 23 (Q1 table: `public/models/{BoomBox,Lantern,ToyCar}.glb`) and line 34 ("3 GLB models"). The baseline has 7 GLBs, all added in `1f9c51fc0`: the three named (10.6/9.6/5.4 MB) plus `RobotExpressive.glb` (464 KB), `drone.glb` (298 KB), `rocket.glb` (63 KB), `computer.glb` (27 KB). The consolidated list (line 90) correctly excludes `public/models/*.glb`, so the operative gate holds; but a reader working from the per-path table would keep the four smaller third-party models. **Fix:** in both places, use `public/models/*.glb` (7 files, `1f9c51fc0`) to match the consolidated list.
2. **Part A's "Complete tracked-media addition inventory" omits all 7 GLBs.** The inventory (part A lines 82-290) claims to list every distinct media path ever added and its "no … appeared" sentence does not mention GLB. The exclusion is unaffected (covered by `public/models/*.glb` in the report), but the completeness claim is false as written. **Fix:** add the 7 `public/models/*.glb` lines (commit `1f9c51fc0`, baseline) to the inventory.
3. **Part A cites the wrong commit for the showcase scene additions.** Part A lines 9, 35 and 77 attribute `{canvas-orchestra,chat-code-edit,dashboard-tour,gateway-tour}.scene.ts` to `b69ec6a7e`; `git show b69ec6a7e` shows only modifications (M) of those files. They were added in `e4653cfb8` (chat-code-edit, dashboard-tour, gateway-tour) and `bb09ba339` (canvas-orchestra). The "safe after removal of `*.scene.ts`" verdict is unaffected — the glob excludes them regardless of origin. The merged report does not repeat the wrong citation. **Fix:** in part A, replace `b69ec6a7e` with `e4653cfb8` / `bb09ba339` for the scene-file additions.

## Uncovered files from the sweep

**None.** Independent sweep: every blob ever added (`--all --full-history --diff-filter=A`) under the 7 paths with a media/binary extension totals 212 files — 12 MP3, 7 GLB, 23 JPG, 170 PNG — plus 10 blobs >1 MB (7 MP3, 3 GLB). Every one is covered: 12 MP3s and `ptah-icon.png` by consolidated item 2; all 7 GLBs by `public/models/*.glb` (item 2, despite defect 1's narrower prose elsewhere); 186 editor stills by "all of `tools/video-editor/`" (item 5); 6 HyperFrames PNGs by `kits/ptah-ui/` (item 6). No `.mp4`, `.webm`, `.mov`, `.wav` or other audio/video extension was ever tracked under these paths, confirming the report's Media claim. The only other binary-ish additions (1 `.srt`, 7 `.py`, 34 `.svg`) sit inside excluded or text-scanned paths.

## Decisions

- **Decision: APPROVED despite three defects.** Options: APPROVED; REVISE. Evidence: the acceptance criterion (a verdict for every source path) is met; the operative consolidated not-safe list is complete and conservative — the sweep found no file it fails to exclude; the extraction-method conclusion follows from `docs/decisions.md` and the verified evidence; the Q4 facts check out against the npm registry. The defects are evidence-detail errors (GLB count/naming, inventory completeness, one wrong commit citation) that leave every verdict and every exclusion intact. Reversible: the verdict can be upgraded to REVISE if the user prefers the report corrected before reading it.
- **Decision: treat the consolidated "Not safe to copy" list as the operative gate, not the per-path table.** Evidence: it is the broader of the two wherever they differ (GLBs). Reversible: no.
- **Decision: carry the GLB-licensing gap to TASK_2026_002 rather than block this report.** Options: block; defer. Evidence: part A explicitly scopes its verdict to security/privacy, the models are public sample assets (no privacy leak), and the consolidated list already excludes them, so no copying decision is wrong. Reversible: yes — TASK_2026_002 can still research the model licenses or replace them with placeholder assets.
- **Decision: flag the GLB fix as a required edit in TASK_2026_002** (defects 1-2) **and the part A commit correction as a nice-to-have** (defect 3, part A is a lane deliverable cited as evidence, not the gate).