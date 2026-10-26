# Part A — source history security and privacy scan

## Summary verdict table

| Path | Verdict | Key evidence |
|---|---|---|
| `apps/ptah-video-studio/` | **safe after removal of named files** | `f6ee7d4ff:selfshot/ptah-opensource/*` contains founder ingest text; `3413d42e4:selfshot/tribunal-intro/beats.json`; 13 tracked media files at baseline, including Mixkit MP3s (`731b8084c`). Remove these and the branded promo/concept content listed below; neutralize remaining owner identity before templating. |
| `libs/showcase-manifest/` | **safe** | Six baseline source/config files; no media, >1 MB blobs, credential-like values, or personal email in the scanned history. Owner package alias in `e0ca51e6e:libs/showcase-manifest/package.json` is a template-neutrality edit, not a privacy finding. |
| `apps/ptah-electron-e2e/src/showcase/` | **safe after removal of named files** | No tracked media or large blobs; `01a786625:scripts/*.json` and `b69ec6a7e:*.scene.ts` are Ptah-specific narration/scenes. Keep only generic `_harness/` after reviewing and neutralizing its alias/runtime assumptions. |
| `tools/video-editor/` | **not safe** | `c032b0f1e` tracked 186 `graphics/*/snapshots/*` stills plus a first-party transcript and edit data; `eb0c43fdd` removed the tree and `.gitignore:245` ignores it now. The vendor is absent from Git. |
| `tools/hyperframes/` | **safe after removal of named files** | Six UI screenshot PNGs in `kits/ptah-ui/reference/` (`30eb7c390`, `2f53430e1`), plus branded `kits/ptah-ui/` and `projects/*`; generic scripts/docs can be copied selectively. |
| `.claude/skills/video-showcase/` | **safe** | No media, large blobs or live credentials; `1ef3094a2:reference/install.md` contains placeholder `ELEVENLABS_API_KEY=sk_…`, which must stay a placeholder. Neutralize Ptah paths and package alias. |
| `.claude/agents/video-director.md` | **safe** | No media, large blobs, credential-like additions, or personal email in path history. |
| `apps/ptah-extension-vscode/assets/plugins/ptah-video/` | **safe** | Duplicates the skill/reference material; `aae6d7ae7:skills/video-showcase/reference/install.md` has the same placeholder, not a live key. Neutralize Ptah paths and alias. |

“Safe” here is the narrow security/privacy history verdict. It does not resolve third-party redistribution or template branding; the other research parts and `TASK_2026_002` must do that. A history-preserving extract of the combined paths fails the gate.

## Per-path findings

### `apps/ptah-video-studio/`

- **Secrets, verified:** The only credential-shaped literal in added lines was `731b8084c:apps/ptah-video-studio/scripts/record-tui.mjs:70`, named `FAKE_API_KEY` and explicitly marked fake (`sk-a…`). `e0ca51e6e:apps/ptah-video-studio/.env.example` has instructional placeholders (`sk_X…`, `your…`), not filled values. Matches for `ELEVENLABS`, `OPENAI`, `token`, `apiKey`, `secret`, `.env`, and `Bearer` were variable names, docs, auth handling, or placeholders. No tracked populated `.env`, private key, webhook credential, or live key was found in the scanned additions. This is a pattern-based finding, not proof that no secret exists in arbitrary text.
- **Private ingest, verified:** `f6ee7d4ff:apps/ptah-video-studio/selfshot/ptah-opensource/{beats.json,words.json,words.raw.json}` and `3413d42e4:apps/ptah-video-studio/selfshot/tribunal-intro/beats.json` remain at baseline. `50a599270:apps/ptah-video-studio/selfshot/_smoke/{beats.json,words.json}` is the documented synthetic fixture. The first two slugs are explicitly outside the export allowlist; do not copy them. `e0ca51e6e:apps/ptah-video-studio/scripts/export-kit.mjs:50-63` describes founder recordings and transcripts as private.
- **Media, verified:** 12 MP3s and one PNG were added and remain at baseline. `731b8084c:assets/music/mixkit-*.mp3` are third-party music, `11ec42db5:assets/music/rising-dawn.mp3` plus SFX, `db87b555d:assets/sfx/{pop,ring}.mp3`, and `731b8084c:public/brand/ptah-icon.png`; exact files are in the inventory below. No tracked MP4, WEBM, MOV or WAV addition was found here. Ten blobs exceed 1 MB: seven music MP3s and `1f9c51fc0:public/models/{BoomBox,Lantern,ToyCar}.glb` (about 10.6, 9.6 and 5.4 MB). These models are outside the extension list but must be reviewed or excluded for a public package.
- **Names, verified:** `731b8084c:promos/ptah-xirp-answer.json:2` says “Spotify's Xirp”; `11ec42db5:promos/dyad-vs-ptah-{landscape,vertical}.json` names Dyad; `731b8084c:assets/music/MUSIC-CREDITS.md` credits Mixkit. `e0ca51e6e:src/concept/answer-scenes.tsx` and `src/concept/xirp-kit.tsx` repeat Xirp. These are third-party reference/product names, not evidence of a customer relationship. Ptah/Hive Academy is the owner identity; its occurrences in promos, docs, `public/brand/`, package names and templates need neutralization. No person name or personal email was found by the history scan.

### `libs/showcase-manifest/`

- **Secrets/media/names, verified:** `e0ca51e6e:libs/showcase-manifest/` contains six tracked text files. The full-history added-line scan had no secret-pattern hit, media addition, >1 MB blob, personal email, or client name. `e0ca51e6e:libs/showcase-manifest/package.json` carries the owner package name; update its alias for the new package.

### `apps/ptah-electron-e2e/src/showcase/`

- **Secrets, verified:** `e4653cfb8:chat-code-edit.scene.ts` and `c8dd136fe:_harness/showcase-launcher.ts` include `token`/`.env` terms, but inspection found scene narration, environment handling and code tokens, not credential values. No populated `.env`, private key, credential-shaped literal, webhook secret, or personal email was found.
- **Media, verified:** No media extensions in added paths and no blob >1 MB. The scene files are capture instructions, not captured footage in Git.
- **Names, verified:** `01a786625:apps/ptah-electron-e2e/src/showcase/scripts/{canvas-orchestra,chat-code-edit,dashboard-tour,gateway-tour}.json` and `b69ec6a7e:apps/ptah-electron-e2e/src/showcase/{canvas-orchestra,chat-code-edit,dashboard-tour,gateway-tour}.scene.ts` are owner-product scripts. Their narration names Ptah and platform/provider features; no distinct client, person or personal email surfaced. Remove `*.scene.ts` and `scripts/*.json` from reusable templates; inspect `_harness/director.ts:10` for the `@ptah-extension/showcase-manifest` alias.

### `tools/video-editor/`

- **Secrets, verified:** The only added matches at `c032b0f1e` were ordinary `token` text in `HANDOFF.md`, `transcript/REVIEW.md`, and Python scripts, plus `.env` references in `scripts/transcribe.py`. No credential-shaped value, private key, populated `.env` or personal email was found. The local vendor and ignored working tree were not scanned because they are outside Git history and this clone has no checkout.
- **Media and privacy, verified:** `c032b0f1e:tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/contact-sheet.jpg` exemplifies **186** tracked JPG/PNG stills across `g01`–`g19` and `g15a/b`, all history only after `eb0c43fdd`. `c032b0f1e:projects/builder-invitation/transcript/{words.json,words-clean.json,captions-ar.srt}` is a first-party spoken transcript; `edit/{clip_infos-60.json,timeline1-items.json}` is job-specific edit data. `c032b0f1e:tools/video-editor/HANDOFF.md:31-32` describes a thumbnail cut from a real camera frame and private exports, while `.gitignore:231-245` documents untracked MP4 exports. No tracked video/audio extension or >1 MB blob was found in this path. **Inference:** snapshot stills and transcript may reveal private footage or speech; their visual/audio content was not independently reviewed, so exclude them categorically.
- **Names, verified:** The transcript mentions Claude Code, Codex and Antigravity (`c032b0f1e:.../transcript/words-clean.json:5930`); `c032b0f1e:tools/video-editor/HANDOFF.md:31` names Gemini. These are tool names, not clients. The project slug `builder-invitation` is first-party campaign content, not a reusable template. No identifiable person or customer email surfaced.

### `tools/hyperframes/`

- **Secrets, verified:** Added-line `token` hits in `30eb7c390:kits/ptah-ui/src/session-shell.html`, `projects/agent-lanes-v2/compositions/components/code-terminal-run.html` and related UI files are UI copy or code tokens; `OPENAI` in `30eb7c390:projects/agent-lanes-explainer/index.html` is a provider name. No credential-shaped value, private key, populated `.env` or personal email was found.
- **Media, verified:** `30eb7c390:kits/ptah-ui/reference/{agents-panel-report-delivered,lane-transcript-overlay,subagent-cards-message-agent,subagents-ask-user-question,three-sessions-composer}.png` and `2f53430e1:kits/ptah-ui/reference/app-window-multi-session.png` remain at baseline. No other tracked media extension or >1 MB blob was found. `e0ca51e6e:tools/hyperframes/.gitignore:1-35` explicitly ignores generated footage/renders, while making a small screenshot exception. **Inference:** screenshots may display session details; exclude until inspected and approved.
- **Names, verified:** `e593e03fe:projects/agent-lanes-v3/BRIEF.md` and `30eb7c390:kits/ptah-ui/SPEC.md` carry the Ptah/Anubis UI identity. `30eb7c390:projects/agent-lanes-explainer/index.html` names OpenAI; `30eb7c390:projects/agentic-factory-promo/BRIEF.md` names DaVinci. These are owner identity and third-party tools, not identified clients. `docs/decisions.md` already says `kits/ptah-ui/` and Ptah projects stay in Ptah.

### `.claude/skills/video-showcase/` and `.claude/agents/video-director.md`

- **Secrets, verified:** `1ef3094a2:.claude/skills/video-showcase/reference/install.md:96-106` documents environment variable names and an `sk_…` placeholder, not a credential. The agent path had no matching additions. No populated `.env`, private key, webhook secret or personal email was found.
- **Media, verified:** No tracked media or >1 MB blob in either path.
- **Names, verified:** `1ef3094a2:.../SKILL.md:63` and `reference/install.md:39` name the owner package alias and paths; `reference/camera-and-render.md:205` names ElevenLabs. No client or person name found. Replace owner-specific paths and alias before publishing a generic skill.

### `apps/ptah-extension-vscode/assets/plugins/ptah-video/`

- **Secrets/media, verified:** `aae6d7ae7:skills/video-showcase/reference/install.md:96-106` repeats the documented placeholder and variable names. No live credential, populated `.env`, tracked media, >1 MB blob or personal email was found.
- **Names, verified:** `aae6d7ae7:skills/video-showcase/SKILL.md:63` repeats the owner alias and studio paths; `reference/camera-and-render.md:205` names ElevenLabs. No identified client/person. This is a duplicate source, so copy one canonical version and neutralize it.

## SELFSHOT_KIT_SLUGS & guard

At `e0ca51e6e:apps/ptah-video-studio/scripts/export-kit.mjs:63`, the full allowlist is `new Set(['_smoke'])`. `shouldCopy` rejects any non-allowlisted self-shot slug before recursion (`:97-108`) and reports skipped slugs (`:244-252`). The independent post-copy walker flags loose media directly under `selfshot/` and **any file** inside a non-allowlisted slug (`:117-137`); on a hit it deletes the output directory and throws (`:254-262`). Preserve both the allowlist and the post-copy guard in the port. `ptah-opensource` and `tribunal-intro` are not on the list.

## tools/video-editor resolution

`e0ca51e6e:.gitignore:231-245` says the entire local editorial workspace is ignored; the documented cause is 2,216 MB of untracked material, including three MP4 cuts totaling 2,103 MB. `git log --all --full-history -- tools/video-editor/` shows `c032b0f1e` added a tracked source/snapshot tree and `eb0c43fdd` removed it on 2026-09-07. Thus “0 files / 0 commits” holds for the baseline/current simplified path walk, **not** all history. `e0ca51e6e:.ptah/specs/TASK_2026_582_a7db/context.md:19,35,45` and `c032b0f1e:tools/video-editor/CLAUDE.md:24-29` say the ignored working tree contains a vendored `davinci-resolve-mcp` at upstream commit `6eca4bf` (2026-09-06), plus Python/Resolve machine setup and projects. `git log --all --name-only --format=` contains historical `tools/video-editor/` paths but no `vendor/davinci-resolve-mcp/` path; `git grep -n -i 'video-editor\|davinci-resolve-mcp' e0ca51e6e` finds documentation/reference hits, not the vendor source. This Git clone cannot supply the vendor for extraction. The tracked alternate location `tools/hyperframes/` contains a separate HyperFrames pipeline and explicitly refers back to the ignored editor (`e0ca51e6e:tools/hyperframes/HANDOFF.md:15,35`).

## Extraction-method recommendation

Use a **clean copy of individually cleared source files from `e0ca51e6e`**, recording that source commit in the new repository's extraction notes. Do **not** transplant source history: `c032b0f1e` contains 186 editor stills and first-party transcript data, and baseline studio/history contain excluded ingest and third-party media. Even if an entire path is currently clean, importing history for all paths would cross the explicit history gate. The ignored editor/vendor must be acquired separately from a vetted upstream pinned commit after the licensing decision; no files exist at the baseline tree to copy. This recommendation implements `docs/decisions.md` and leaves the exact layout to `TASK_2026_002`.

## Not-safe list

- `apps/ptah-video-studio/selfshot/ptah-opensource/` and `selfshot/tribunal-intro/` — private non-allowlisted ingest text; `f6ee7d4ff`, `3413d42e4`.
- `apps/ptah-video-studio/assets/music/*.mp3`, `assets/sfx/*.mp3`, `public/brand/ptah-icon.png` — 13 tracked media blobs; see full inventory. `public/models/{BoomBox,Lantern,ToyCar}.glb` — three >1 MB third-party model assets; `1f9c51fc0`.
- `apps/ptah-video-studio/promos/` and `src/concept/` — branded Ptah and named third-party comparison/reel content; `731b8084c:promos/ptah-xirp-answer.json`, `11ec42db5:promos/dyad-vs-ptah-landscape.json`.
- `apps/ptah-electron-e2e/src/showcase/*.scene.ts` and `scripts/*.json` — Ptah-specific scripts, not generic harness; `b69ec6a7e`, `01a786625`.
- **All** `tools/video-editor/` tracked history (`c032b0f1e`), particularly `projects/builder-invitation/graphics/*/snapshots/`, `transcript/`, and `edit/`; the current ignored local vendor is unavailable from this clone.
- `tools/hyperframes/kits/ptah-ui/` and `tools/hyperframes/projects/*` — owner UI screenshots and promo projects; `30eb7c390`, `2f53430e1`.
- Owner-specific paths/package aliases in otherwise safe skill, agent, manifest, and harness files must be neutralized before they become public generic templates; they are not secret/privacy findings.

## Complete tracked-media addition inventory

Each line is a distinct media path added in `--all --full-history`; “history only” means absent at `e0ca51e6e`. This inventory includes still images, including all editor snapshots. No tracked MP4, WEBM, MOV, WAV, M4A, OGG, GIF, WEBP or PSD addition appeared in these paths.

- `731b8084c` `apps/ptah-video-studio/assets/music/mixkit-better-times-are-coming.mp3` — baseline.
- `731b8084c` `apps/ptah-video-studio/assets/music/mixkit-close-up.mp3` — baseline.
- `731b8084c` `apps/ptah-video-studio/assets/music/mixkit-deep-techno-ambience.mp3` — baseline.
- `731b8084c` `apps/ptah-video-studio/assets/music/mixkit-digital-clouds.mp3` — baseline.
- `731b8084c` `apps/ptah-video-studio/assets/music/mixkit-minimal-emotion.mp3` — baseline.
- `731b8084c` `apps/ptah-video-studio/assets/music/mixkit-uplifting-bass.mp3` — baseline.
- `11ec42db5` `apps/ptah-video-studio/assets/music/rising-dawn.mp3` — baseline.
- `11ec42db5` `apps/ptah-video-studio/assets/sfx/chime.mp3` — baseline.
- `db87b555d` `apps/ptah-video-studio/assets/sfx/pop.mp3` — baseline.
- `db87b555d` `apps/ptah-video-studio/assets/sfx/ring.mp3` — baseline.
- `11ec42db5` `apps/ptah-video-studio/assets/sfx/tick.mp3` — baseline.
- `11ec42db5` `apps/ptah-video-studio/assets/sfx/whoosh.mp3` — baseline.
- `731b8084c` `apps/ptah-video-studio/public/brand/ptah-icon.png` — baseline.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/frame-00-at-0.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/frame-01-at-0.85s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/frame-02-at-1.3s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/frame-03-at-1.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/frame-04-at-4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/frame-05-at-7.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g01-title/snapshots/frame-06-at-7.76s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/frame-01-at-3s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/frame-02-at-7.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/frame-03-at-10s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/frame-04-at-14s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/frame-05-at-17.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/frame-06-at-17.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g02-two-paths/snapshots/frame-07-at-17.169s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/frame-00-at-0.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/frame-01-at-7.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/frame-02-at-8.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/frame-03-at-10.1s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/frame-04-at-11s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/frame-05-at-13s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/frame-06-at-14.9s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g03-what-you-lose/snapshots/frame-07-at-14.841s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g04-lifecycle-chain/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g04-lifecycle-chain/snapshots/frame-00-at-21.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g04-lifecycle-chain/snapshots/frame-01-at-24.22s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g04-lifecycle-chain/snapshots/frame-02-at-24.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g04-lifecycle-chain/snapshots/frame-03-at-25.22s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g04-lifecycle-chain/snapshots/frame-04-at-25.7s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/frame-01-at-2.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/frame-02-at-5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/frame-03-at-8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/frame-04-at-10s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/frame-05-at-12.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/frame-06-at-15s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g05-two-weeks/snapshots/frame-07-at-14.841s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/frame-01-at-5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/frame-02-at-8.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/frame-03-at-11s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/frame-04-at-12.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/frame-05-at-14.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/frame-06-at-16.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g06-faster-not-aware/snapshots/frame-07-at-16.587s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/frame-00-at-2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/frame-01-at-5.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/frame-02-at-10s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/frame-03-at-13s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/frame-04-at-16.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/frame-05-at-19s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/frame-06-at-22s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g07-degradation-curve/snapshots/frame-07-at-27.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/frame-00-at-0.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/frame-01-at-2.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/frame-02-at-7.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/frame-03-at-11.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/frame-04-at-17s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/frame-05-at-23.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/frame-06-at-24.1s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g08-free-open-source/snapshots/frame-07-at-23.668s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-00-at-0.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-01-at-0.85s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-02-at-1.05s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-03-at-1.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-04-at-3s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-05-at-7.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-06-at-10s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-07-at-13.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g09-25-days-free/snapshots/frame-08-at-13.677s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/frame-00-at-0.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/frame-01-at-3.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/frame-02-at-5.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/frame-03-at-7.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/frame-04-at-9s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/frame-05-at-10.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/frame-06-at-11.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g10-saas-chips/snapshots/frame-07-at-11.543s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g11-stack-welcome/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g11-stack-welcome/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g11-stack-welcome/snapshots/frame-01-at-1.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g11-stack-welcome/snapshots/frame-02-at-3.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g11-stack-welcome/snapshots/frame-03-at-6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g11-stack-welcome/snapshots/frame-04-at-12s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g11-stack-welcome/snapshots/frame-05-at-17.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g11-stack-welcome/snapshots/frame-06-at-17.46s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/frame-01-at-5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/frame-02-at-7.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/frame-03-at-9.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/frame-04-at-12s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/frame-05-at-15.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/frame-06-at-17.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g12-signed-publisher/snapshots/frame-07-at-17.363s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/frame-01-at-3s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/frame-02-at-5.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/frame-03-at-8.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/frame-04-at-12.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/frame-05-at-15s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/frame-06-at-17.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g13-providers/snapshots/frame-07-at-17.266s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/frame-01-at-2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/frame-02-at-8.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/frame-03-at-10.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/frame-04-at-12s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/frame-05-at-14.9s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/frame-06-at-16.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g14-workspace-analysis/snapshots/frame-07-at-16.199s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/contact-sheet-1.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/contact-sheet-2.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-01-at-2.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-02-at-4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-03-at-6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-04-at-9.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-05-at-11.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-06-at-14.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-07-at-18s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-08-at-21.7s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15a-memory-system/snapshots/frame-09-at-21.34s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/contact-sheet-1.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/contact-sheet-2.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-01-at-1.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-02-at-4.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-03-at-7.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-04-at-9.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-05-at-11.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-06-at-13s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-07-at-16s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-08-at-17.7s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g15b-monorepo/snapshots/frame-09-at-17.46s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-01-at-2.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-02-at-4.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-03-at-6.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-04-at-13s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-05-at-18.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-06-at-21s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-07-at-23.3s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g16-canvas/snapshots/frame-08-at-22.892s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/contact-sheet-1.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/contact-sheet-2.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-01-at-1.2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-02-at-2.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-03-at-6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-04-at-8.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-05-at-12s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-06-at-15.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-07-at-17.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-08-at-19.7s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g17-failover/snapshots/frame-09-at-19.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g18-cut-the-hype/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g18-cut-the-hype/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g18-cut-the-hype/snapshots/frame-01-at-2s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g18-cut-the-hype/snapshots/frame-02-at-6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g18-cut-the-hype/snapshots/frame-03-at-13.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g18-cut-the-hype/snapshots/frame-04-at-16s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g18-cut-the-hype/snapshots/frame-05-at-18.7s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g18-cut-the-hype/snapshots/frame-06-at-18.43s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/contact-sheet.jpg` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-00-at-0.8s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-01-at-3.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-02-at-6.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-03-at-12s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-04-at-20.4s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-05-at-23.6s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-06-at-27.5s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-07-at-30.7s.png` — history only.
- `c032b0f1e` `tools/video-editor/projects/builder-invitation/graphics/g19-always-debt/snapshots/frame-08-at-29.876s.png` — history only.
- `30eb7c390` `tools/hyperframes/kits/ptah-ui/reference/agents-panel-report-delivered.png` — baseline.
- `2f53430e1` `tools/hyperframes/kits/ptah-ui/reference/app-window-multi-session.png` — baseline.
- `30eb7c390` `tools/hyperframes/kits/ptah-ui/reference/lane-transcript-overlay.png` — baseline.
- `30eb7c390` `tools/hyperframes/kits/ptah-ui/reference/subagent-cards-message-agent.png` — baseline.
- `30eb7c390` `tools/hyperframes/kits/ptah-ui/reference/subagents-ask-user-question.png` — baseline.
- `30eb7c390` `tools/hyperframes/kits/ptah-ui/reference/three-sessions-composer.png` — baseline.

## Method

The scan used Git plumbing/read-only history in `/home/amun/projects/ptah-extension`; no working tree checkout, ref/index change, fetch, or copy. The baseline was `e0ca51e6e`, and all reachable refs were included. Commands run (paths abbreviated here only by `<path>`; the path list is the table above):

```sh
git -C /home/amun/projects/ptah-extension rev-parse --short e0ca51e6e
git -C /home/amun/projects/ptah-extension ls-tree -r --name-only e0ca51e6e -- <path>
git -C /home/amun/projects/ptah-extension log --all --full-history -p --format=COMMIT:%h -- <path>
git -C /home/amun/projects/ptah-extension log --all --full-history --diff-filter=A --name-only --format=COMMIT:%h -- <path>
git -C /home/amun/projects/ptah-extension rev-list --objects --all --full-history -- <path>
git -C /home/amun/projects/ptah-extension cat-file --batch-check='%(objectname) %(objecttype) %(objectsize)'
git -C /home/amun/projects/ptah-extension grep -n -i -E 'SELFSHOT_KIT_SLUGS|video-editor|davinci-resolve-mcp' e0ca51e6e -- ':!*.lock'
git -C /home/amun/projects/ptah-extension log --all --name-only --format= | rg -i 'video-editor|davinci'
git -C /home/amun/projects/ptah-extension show <commit>:<path>
```

A Python read-only parser grouped added `+` lines by commit/path and searched `sk-`, `AKIA`, `ghp_/gho_/ghu_/ghs_/ghr_`, `xox`, `AIza`, `-----BEGIN`, `api[_-]?key`, `token`, `secret`, `password`, `Bearer`, `ELEVENLABS`, `OPENAI`, `.env`, webhook URLs and email syntax. It parsed added names for the requested media extensions, checked baseline presence with `ls-tree`, and checked all reachable path blobs for >1,000,000 bytes with `cat-file`. It discarded semantic false positives such as code tokens, product/provider names, variable names, `.env` documentation, `git@github.com`, and the explicitly fake `sk-a…` literal. Credential values are not reproduced. Full-history mode was essential: ordinary simplified `git log --all -- tools/video-editor/` returned zero despite the add/remove pair on a merged branch. The scan cannot inspect ignored, untracked local media/vendor files or prove what visual stills show; the verdicts conservatively exclude them.

## Decisions

- **Decision:** Recommend a clean copy from `e0ca51e6e` with a source-commit reference. **Options:** clean copy; history-preserving extract. **Evidence:** `c032b0f1e` editor stills/transcript, `f6ee7d4ff` and `3413d42e4` private ingest, and the baseline media inventory violate the clean-history gate in `docs/decisions.md`. **Reversible:** yes, before publication; a later history import would require a new scan and explicit review.
- **Decision:** Classify editor snapshots/transcript and HyperFrames UI screenshots as unsafe to copy without review. **Options:** copy as reference assets; omit them. **Evidence:** `c032b0f1e:tools/video-editor/projects/builder-invitation/graphics/*/snapshots/`, `c032b0f1e:.../transcript/`, `30eb7c390:tools/hyperframes/kits/ptah-ui/reference/*.png`. Visual contents were not independently cleared. **Reversible:** yes; approved assets can be added later as new files.
