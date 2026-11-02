# Research report — TASK_2026_001_3d3a

Source: `Hive-Academy/ptah-extension` at baseline `e0ca51e6e` (2026-10-06), read from a read-only clone at `~/projects/ptah-extension`. Date: 2026-10-26.

Detail and full evidence live in the part files. This report is the merged answer.

| Part | Questions | Author | File |
|---|---|---|---|
| A | Q1 history scan | codex lane (`gpt-6-sol`) | [research-part-a-history.md](research-part-a-history.md) |
| B | Q2, Q3, Q5 licenses and npm names | Ollama Code lane | [research-part-b-licenses.md](research-part-b-licenses.md) |
| C | Q4 Nx plugin packaging | researcher-expert subagent | [research-part-c-nx.md](research-part-c-nx.md) |

The orchestrator spot-checked the key claims of each part (see `decisions.md` rows 7–10).

---

## Q1 — History scan

### Verdict per source path

| Path | Verdict | Remove or exclude |
|---|---|---|
| `apps/ptah-video-studio/` | **Safe after removal** | `selfshot/ptah-opensource/`, `selfshot/tribunal-intro/` (private founder ingest: `f6ee7d4ff`, `3413d42e4`); `assets/music/*.mp3`, `assets/sfx/*.mp3` (third-party Mixkit and other audio); `public/brand/ptah-icon.png`; all 7 `public/models/*.glb` (BoomBox, Lantern, ToyCar, computer, drone, RobotExpressive, rocket; third-party models, 3 of them >5 MB, `1f9c51fc0`); `promos/` and `src/concept/` (branded Ptah content that names Spotify Xirp and Dyad). Keep `selfshot/_smoke/` (synthetic fixture). |
| `libs/showcase-manifest/` | **Safe** | Rename the package alias only. |
| `apps/ptah-electron-e2e/src/showcase/` | **Safe after removal** | `*.scene.ts` and `scripts/*.json` (Ptah product tours). Keep the generic `_harness/` and neutralise its `@ptah-extension/showcase-manifest` alias. |
| `tools/video-editor/` | **Not safe** | No files at baseline. History has the full tree: `c032b0f1e` added it, with 186 snapshot stills and a first-party spoken transcript under `projects/builder-invitation/`; `eb0c43fdd` untracked it, and `.gitignore:231-245` now ignores it. Copy nothing from Git. |
| `tools/hyperframes/` | **Safe after removal** | `kits/ptah-ui/` (owner UI screenshots, `30eb7c390`, `2f53430e1`) and `projects/*` (owner promo projects). Generic scripts and docs can be copied selectively. |
| `.claude/skills/video-showcase/` | **Safe** | Neutralise Ptah paths and the alias. `ELEVENLABS_API_KEY=sk_…` in `reference/install.md` is a placeholder and must stay one. |
| `.claude/agents/video-director.md` | **Safe** | Neutralise Ptah references. |
| `apps/ptah-extension-vscode/assets/plugins/ptah-video/` | **Safe** | This duplicates the skill. Same placeholder; neutralise. |

**Secrets:** none found. The only credential-shaped literal is `FAKE_API_KEY` in `scripts/record-tui.mjs:70` (`731b8084c`), and it is explicitly fake. `.env.example` holds placeholders only. This scan is pattern-based, so it is strong evidence of no secrets, not proof.

**Media:** no `.mp4`, `.webm`, `.mov` or `.wav` was ever tracked under these paths. The tracked media are 12 MP3s, 193 PNG/JPG stills and 7 GLB models (212 files, confirmed by the review sweep). All are on the exclude list above. The inventory is in part A, but it omits the 7 GLBs. Part A also cites `b69ec6a7e` as adding the showcase `*.scene.ts` files; they were added in `e4653cfb8` and `bb09ba339`, and `b69ec6a7e` only modified them. Neither slip changes a verdict.

**Names:** no client, person or personal email. Third-party product names (Spotify Xirp, Dyad, Mixkit) appear only in excluded content. Owner identity (Ptah / Hive Academy) must be removed from every template; this is rule 6, not a privacy finding.

### `SELFSHOT_KIT_SLUGS` and the post-copy guard

`apps/ptah-video-studio/scripts/export-kit.mjs:63`: `const SELFSHOT_KIT_SLUGS = new Set(['_smoke']);` (verified).

- `shouldCopy` rejects non-allowlisted slugs before recursion (`:97-108`).
- The post-copy walker flags loose media under `selfshot/` and any file inside a non-allowlisted slug (`:117-137`). On a hit it deletes the output and throws (`:254-262`).

Port both unchanged.

### Extraction method

**Clean copy of individually cleared files from `e0ca51e6e`, with the source commit recorded.** A history-preserving extract is ruled out: `c032b0f1e` and the studio's private ingest fail the clean-history gate in `docs/decisions.md`.

---

## Q2 — Remotion license

- `remotion@4.0.484` and every `@remotion/*` package: `license = "SEE LICENSE IN LICENSE.md"` (verified). The terms are in [remotion-dev/remotion `LICENSE.md`](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md); `remotion.dev/license` redirects there.
- **Free License:** individuals, for-profit organisations with up to 3 employees, non-profits, and evaluation. Everyone else needs a **Company License** (remotion.pro). The threshold is headcount only, with no revenue test.
- **MIT package:** allowed to depend on Remotion without bundling it. Wrappers and templates are explicitly permitted as long as Remotion itself is not sold as the product. The license obligation falls on whoever renders videos, not on our package.
- **README notice:** reuse the `remotion` package README's license sentence and link to <https://www.remotion.dev/license>. Part B has the exact text.

## Q3 — HyperFrames and davinci-resolve-mcp

- `hyperframes@0.8.98`, `hyperframes@0.8.30` (editor) and `@hyperframes/shader-transitions@0.8.97` are **Apache-2.0**, © HeyGen, Inc. (verified for the first two). `shader-transitions` has no npm `license` field, but its tarball ships `LICENSE`. Use them as pinned npm dependencies; no vendoring is needed. Keep the Apache NOTICE and attribution in our docs.
- The `0.8.30` editor package name is inferred as `hyperframes`, since the editor tree is untracked. TASK_2026_002 should confirm it from the ignored tree's `package.json`.
- **davinci-resolve-mcp:** the vendored copy is at commit `6eca4bf` (2026-09-06), per `c032b0f1e:tools/video-editor/CLAUDE.md:24-29` and Ptah `TASK_2026_582_a7db/context.md`. The orchestrator matched this to `github.com/samuelgursky/davinci-resolve-mcp` commit `6eca4bfc371a1c2f7cb2961efee651ab07436378` (2026-09-06T05:56:58Z), and that repo is **MIT**. The SHA prefix and date match, but the user should confirm it from the ignored tree's `.git` remote.
- **Recommendation:** the `editor` generator **downloads** upstream at the pinned full SHA. Do not vendor it. Downloading keeps Python, venv and Resolve artifacts out of the repo and avoids redistributing anything machine-specific. MIT would also allow vendoring with the LICENSE kept, so this choice is reversible.
- Part B notes the sub-vendors `resolve-advanced/{conform-qc,drt-format,drp-format}` and found them on neither npm nor GitHub, so they are likely private. **Do not ship them.**
- DaVinci Resolve itself is proprietary. `doctor` only detects it; we never distribute it.

## Q4 — Nx plugin packaging

- **The current major is Nx 24** (`nx@24.0.1`; 24.0.0 was released 2026-10-21), not 23 (verified). Build on `@nx/plugin@24.0.1` and declare peers `>=23 <25`.
- **Hybrid:** executors hold all logic (pinned versions, Windows-safe spawn). A small `createNodes` plugin only infers targets that point at those executors, triggered by `remotion.config.ts`, `hyperframes.json` and `brand.config.ts`. Export `createNodes`, not the deprecated `createNodesV2`.
- **Caching:** cache `render`, `narrate`, `check` and `assemble`. Do not cache `capture`, `selfshot`, `studio` or `doctor`, which are long-running or have side effects.
- **Preset:** support both `create-nx-workspace --preset=@hive-academy/nx-video` and a `create-nx-video` binary made with `@nx/plugin:create-package`. Version both packages together (`projectsRelationship: fixed`).
- **Local e2e:** `@nx/plugin:e2e-project` plus `@nx/js:setup-verdaccio` (a `local-registry` target). e2e tests must not render video. Run them in the Windows, macOS and Ubuntu matrix.
- **Publish:** `nx release` from GitHub Actions with **npm trusted publishing (OIDC)**, which needs no token and emits provenance automatically. Keep a granular token as a documented fallback in case npm requires the package to exist before trusted publishing can be configured.
- The proposed layout (`packages/nx-video`, `packages/create-nx-video`, `e2e/nx-video-e2e`, `.verdaccio/`, `tools/scripts/`) is in part C under "Recommended layout", for TASK_2026_002 to confirm.

## Q5 — Package names

- `@hive-academy/nx-video`, `create-nx-video` and `nx-video` are all **free** on npm (verified with `E404`).
- The `@hive-academy` scope exists and is **yours**: `@hive-academy/ptah-cli` is maintained by `hive-academy <abdallah.khalil.nada@gmail.com>` (verified).
- npm is not logged in on this host, so you need to confirm publish rights and 2FA on a logged-in machine.

---

## Not safe to copy (consolidated)

1. `apps/ptah-video-studio/selfshot/ptah-opensource/`, `selfshot/tribunal-intro/`
2. `apps/ptah-video-studio/assets/music/`, `assets/sfx/`, `public/brand/ptah-icon.png`, `public/models/*.glb`
3. `apps/ptah-video-studio/promos/`, `src/concept/`
4. `apps/ptah-electron-e2e/src/showcase/*.scene.ts`, `showcase/scripts/*.json`
5. All of `tools/video-editor/`, including its history (`c032b0f1e`) and the ignored local tree
6. `tools/hyperframes/kits/ptah-ui/`, `tools/hyperframes/projects/*`
7. `resolve-advanced/*` sub-vendors (likely private)

The smoke composition and `_smoke` fixture still need neutral replacements for the excluded music and brand assets. TASK_2026_002 must name those replacements, for example generated silence or a CC0 track and a placeholder logo.

## Decisions taken in this research

See `decisions.md`. In short: clean copy (not history-preserving); target Nx 24 rather than 23; hybrid executors plus `createNodes`; download davinci-resolve-mcp rather than vendor it; HyperFrames as pinned npm dependencies; OIDC trusted publishing.

## For the user

These need your input before or during TASK_2026_002:

1. **Remotion Company License.** Does Hive Academy have more than 3 employees? If so, rendering videos with the pipeline needs a Company License. Publishing the MIT package does not.
2. **davinci-resolve-mcp upstream.** Confirm that `samuelgursky/davinci-resolve-mcp` is the origin of `tools/video-editor/vendor/davinci-resolve-mcp` on your Windows machine (`git -C <that dir> remote -v`).
3. **npm publish rights.** Confirm you can publish to `@hive-academy` with 2FA, and that trusted publishing can be configured for the repo.
4. **Nx 24.** Accept the baseline correction from 23 to 24.
5. **Ptah setting (unrelated to this research).** `agentOrchestration.codexModel` is `gpt-6.1-sol`, which your account rejects. Set it to `gpt-6-sol`.

## User answers (2026-10-26)

1. Remotion: one person, so the Free License applies.
2. davinci-resolve-mcp: the vendor exists only on the Windows machine. Proceed with `samuelgursky/davinci-resolve-mcp` @ `6eca4bfc…`, marked unconfirmed.
3. npm: the user can publish to `@hive-academy`. Use a granular token secret with provenance instead of OIDC trusted publishing.
4. Nx: target Nx 24.
