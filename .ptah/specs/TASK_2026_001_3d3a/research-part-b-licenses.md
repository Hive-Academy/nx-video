# Research part B — licenses and npm names (Q2, Q3, Q5)

Part of `TASK_2026_001_3d3a` (Q2 Remotion, Q3 HyperFrames + davinci-resolve-mcp, Q5 npm names). Evidence gathered 2026-10-26 from the npm registry, published tarballs, upstream repos and docs, and the read-only source clone `/home/amun/projects/ptah-extension` at baseline `e0ca51e6e`. "Verified" = command output or fetched text shown below; "Inferred" = reasoned, not proven.

---

## Q2 — Remotion license

### Findings (all verified unless labeled)

**npm metadata.** `npm view remotion@4.0.484 license` → `license = 'SEE LICENSE IN LICENSE.md'`; `npm view @remotion/cli@4.0.484 license` → same. Every `@remotion/*` package carries this pointer, so the license must be read from the repo, not the registry field.

**The LICENSE.md is not shipped in the tarball.** `npm pack remotion@4.0.484` in /tmp produced a 383-file tarball; `tar tzf … | grep -i LICENSE` matched nothing. The file lives in the GitHub repo root: `https://www.remotion.dev/license` returns **307 Temporary Redirect** to `https://github.com/remotion-dev/remotion/blob/main/LICENSE.md` (WebFetch, 2026-10-26). The raw text at tag `v4.0.484` (`https://raw.githubusercontent.com/remotion-dev/remotion/v4.0.484/LICENSE.md`) is byte-identical in substance to `main`'s.

**Terms (quoted from LICENSE.md at v4.0.484, fetched 2026-10-26).** "Individuals and small companies are allowed to use Remotion to create videos for free (even commercial), while a company license is required for for-profit organizations of a certain size."

Free License eligibility (exact list):

> You are eligible to use Remotion for free if you are:
> - an individual
> - a for-profit organization with up to 3 employees
> - a non-profit or not-for-profit organization
> - evaluating whether Remotion is a good fit, and are not yet using it in a commercial way

Company License: "You are required to obtain a Company License to use Remotion if you are not within the group of entities eligible for a Free License." Pricing/purchase: `https://www.remotion.pro/license`.

**The threshold is headcount only — no revenue/funding threshold exists.** FAQ (`https://www.remotion.dev/docs/license/faq`, via remotion.pro/faq 308-redirect, fetched 2026-10-26):

> "Can single-person companies use the Free License?" — Yes, even incorporated, "as long as your total headcount is 3 or less."
> 20-person company with one user — a Company License is required: "Eligibility depends on your company's total headcount."
> "Can I make money under the Free License?" — Yes; commercial use itself does not trigger the license.

Agency edge cases (same FAQ): delivering only a finished file needs a license only if the agency itself exceeds 3 people; if the client owns/operates the project, "both companies' headcount is aggregated for the 4-person threshold." Non-profits: "A company does not qualify merely because it is unprofitable"; government bodies, educational institutions and trade associations "do not qualify for this exemption unless we grant written permission."

**Wrappers and templates are allowed.** Same FAQ:

> "What kind of commercial use is allowed?" — "Any commercial use case is allowed as long as you are not selling Remotion as a product itself"
> Accepted example: "Allowing users to create and render their own personalized video based on your Remotion template."
> "Can I use an LLM to generate Remotion code on behalf of a user?" — Yes, and "Your customers can be other companies and they don't need to have a Company License."

The only hard restriction, from LICENSE.md:

> "It is not allowed to copy or modify Remotion code for the purpose of selling, renting, licensing, relicensing, or sublicensing your own derivate of Remotion."

And the framing: the FAQ's "Is Remotion open source?" entry says "Remotion is source-available software, but it is not open source software" — its use is governed by the proprietary Remotion License. So **our package cannot be "MIT for everything": the MIT license covers our code only; Remotion keeps its own license, and each consumer's eligibility is their own affair.**

**Can an MIT package depend on (not bundle) Remotion? Yes.** Nothing in LICENSE.md or the FAQ restricts depending on, wrapping, generating projects with, or invoking Remotion at a pinned version; the restriction targets copying/relicensing Remotion code. Depending on it is the compliant shape: the dependency tree pulls Remotion from npm under its own license, and every consumer's eligibility is evaluated against their own entity. What we must NOT do: vendor/copy Remotion source into this public repo, re-license it, or present Remotion as our product.

**README notice wording.** LICENSE.md and the FAQ impose no required notice text. The wording Remotion itself ships in the `remotion@4.0.484` package README (§License, line 56-58 of `package/README.md` in the tarball) is the natural precedent:

> "Be aware of that Remotion has a special license and requires obtaining a company license in some cases. Read the [LICENSE](LICENSE.md) page for more information."

### Recommendation

1. Keep Remotion **as a pinned npm dependency/peer of the generated projects, never vendored and never bundled**; pin all `@remotion/*` at `4.0.484` as already decided.
2. Put this notice in the plugin README and in every generated project template README (neutral wording, `brand.config.ts`-safe):

   > "Be aware that Remotion has a special license and requires obtaining a company license in some cases. Read the license at <https://www.remotion.dev/license> for more information."

   plus one sentence that consumers are responsible for their own Remotion license eligibility.
3. Our own use of the showcase/self-shot pipeline to produce videos is a separate question — it depends on Hive Academy's headcount (see Clarifications).
4. Watch the Remotion 5.0 license change announced at the top of LICENSE.md ([PR #3750](https://github.com/remotion-dev/remotion/pull/3750)) before any major-version bump; staying on 4.0.484 keeps the terms quoted here.

### Open items

- None blocking the extract plan. Whether Hive Academy itself needs a Remotion Company License is a user decision (below).

---

## Q3 — HyperFrames + davinci-resolve-mcp

### Findings

**hyperframes@0.8.98 (CLI, the promo pin).** `npm view hyperframes@0.8.98 license repository homepage` → `license = 'Apache-2.0'`, repository `git+https://github.com/heygen-com/hyperframes.git` (directory `packages/cli`). Verified: the published tarball contains **no LICENSE file** (only `bin/`, `dist/`, `package.json`, `README.md` — `npm pack hyperframes@0.8.98` in /tmp), but the `package.json` declares `license: 'Apache-2.0'`, and the repo root LICENSE confirms it.

**HyperFrames repo license.** GitHub API `repos/heygen-com/hyperframes/license` → `license.key: "apache-2.0"`, file `https://github.com/heygen-com/hyperframes/blob/main/LICENSE`, whose tail reads (decoded from the API blob):

> "Copyright 2026 HeyGen, Inc. … Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0"

Repo description: "Write HTML. Render video. Built for agents." Default branch `main`.

**@hyperframes/shader-transitions@0.8.97.** `npm view @hyperframes/shader-transitions@0.8.97 --json` → **no `license` field at all** (metadata defect). However the tarball (`npm pack` in /tmp) **ships `package/LICENSE`** with the full Apache-2.0 text, and the repo LICENSE above covers it (repository directory `packages/shader-transitions`). Effective license: Apache-2.0, verified from the tarball file and the repo.

**The editor pin "0.8.30".** The source repo records the pin list at `.ptah/specs/TASK_2026_582_a7db/context.md:45` (verified via `git show e0ca51e6e:…`): "the HyperFrames pin of each project (`0.8.30` in `tools/video-editor`, `hyperframes@0.8.98` and `@hyperframes/shader-transitions@0.8.97` in `tools/hyperframes/projects/*`)". Since `tools/video-editor` is **untracked at baseline** (below), its package.json cannot be read from the clone. `npm view hyperframes@0.8.30 license` → **`Apache-2.0`, version 0.8.30 exists on npm** (release list includes 0.8.30, between 0.8.29 and 0.8.31). **Inferred (high confidence):** the editor pin is the same `hyperframes` CLI package at 0.8.30 — the context names only `hyperframes` and `@hyperframes/shader-transitions` as HyperFrames packages anywhere in the repo (`git grep '@hyperframes'` finds no other scoped package).

**Apache-2.0 implications for us.** Apache-2.0 §4 permits redistribution provided we retain the LICENSE and all attribution notices and mark changes. An MIT-licensed public package may depend on or even vendor Apache-2.0 code (permissive in both directions); the vendored subtree keeps its own Apache-2.0 LICENSE file. The friction is purely hygiene: provenance notes, retained LICENSE, and no license-field guessing in our package.json (npm auto-detects per-file licenses poorly — use `// SPDX`-style clarity or a LICENSES section).

**davinci-resolve-mcp — provenance could NOT be established from the clone.** This is the central Q3 finding:

- `git ls-tree -r e0ca51e6e --name-only | grep -i davinci` → **zero paths**; `git log --all -- tools/video-editor` → zero commits. `tools/video-editor/**` is not tracked at baseline `e0ca51e6e` (the local lane decision log records the same: "tools/video-editor has 0 tracked files and 0 commits at baseline"). The only in-repo evidence is documentation: `.ptah/specs/TASK_2026_498_5513/audit-nested-manifests.md` (at e0ca51e6e) names the vendored layout: `tools/video-editor/vendor/davinci-resolve-mcp/package.json` "…(+ `resolve-advanced/package.json`, `resolve-advanced/vendor/{conform-qc,drt-format,drp-format}/package.json`)" and calls it "vendored third-party MCP server code (`davinci-resolve-mcp`) and its own vendored sub-vendors … deliberately outside the Nx dependency graph and outside npm workspaces".
- The upstream repo and the pinned commit therefore **cannot be recovered by git plumbing from this clone** — the working tree is not checked out and the vendored tree is not in history.
- Public search for the upstream: GitHub has 101 repos matching "davinci-resolve-mcp"; the leading candidate is `samuelgursky/davinci-resolve-mcp` (MIT, 3780 stars, "MCP server integration for DaVinci Resolve Studio"), but this is **unverified as our vendor source** — multiple same-named repos exist (hiteshK03, apvlv, lordhoell, … all MIT except a GPL one).
- The sub-vendors are **not public**: `npm view resolve-advanced / conform-qc / drt-format / drp-format` → all E404; GitHub repo search for them → 0 hits. **Inferred:** `resolve-advanced` and its three sub-vendors are private/unpublished code. Private code has no redistribution license at all by default.

**DaVinci Resolve itself is proprietary** (Blackmagic Design). Verified implication chain: the MCP server only drives Resolve's scripting API; nothing of Resolve is distributed by an MCP server. But (a) our public repo must not require or bundle Resolve — the `doctor` executor should *detect* an existing installation and its Studio version (the scripting/integration API is a Studio feature on several of these MCP projects), never install it; (b) users bring their own Resolve license under Blackmagic's EULA — our README should say so; (c) no copyleft or licensing contamination flows from scripting a proprietary app.

### Recommendation

- **HyperFrames: depend, don't vendor.** Pin `hyperframes@0.8.98` (+ `@hyperframes/shader-transitions@0.8.97`) and `hyperframes@0.8.30` in the respective project templates/executors exactly as decided. Apache-2.0 makes even vendoring legal, but npm dependencies are cleaner for a public plugin and keep upgrades to a version bump. No attribution notice is legally required beyond the LICENSE retention npm performs automatically; a one-line "HyperFrames is Apache-2.0, Copyright HeyGen, Inc." credit in the README is courteous, not mandatory. Flag the shader-transitions metadata gap (no npm license field) in our dependency audit tooling so it doesn't look like an unlicensed dependency.
- **davinci-resolve-mcp: do NOT redistribute the vendored copy yet.** Default to the `editor` generator downloading the pinned upstream commit (recorded URL + commit + checksum) at setup time, not a vendored copy in this public repo. Rationale: (1) the upstream identity and pinned commit are not yet established — provenance must be recorded from a machine with the actual `tools/video-editor` checkout (its `.git`/package metadata on the D: working tree); (2) the `resolve-advanced` sub-vendors appear private and must not ship in a public repo at all; (3) a download-at-pin keeps the public repo clean regardless of which upstream license turns out to apply. If the upstream is later confirmed permissive (e.g. the MIT samuelgursky repo) vendoring becomes legal with the LICENSE retained — but it is not needed, and the download route satisfies hard rule 1 (public-repo hygiene) either way.
- **Resolve:** ship detection, never distribution. `doctor` checks for Resolve Studio and the bridge; README states users must install and license Resolve themselves.

### Open items

- **Provenance capture (blocking for the editor generator):** read `tools/video-editor/vendor/davinci-resolve-mcp/package.json` (and any VENDOR/commit note, `.git` dir or lockfile) on a machine with the real checkout to record upstream URL + pinned commit + license text. Must be done before `TASK_2026_002` freezes the plan.
- Whether any `resolve-advanced` code must move too — that is Ptah-side usage; if it is private, it stays in Ptah and our generator only fetches the public MCP upstream.
- Confirm the editor pin is `hyperframes@0.8.30` (one file read on that same machine settles it).

---

## Q5 — npm names

### Findings (verified)

- `npm view @hive-academy/nx-video` → **E404 Not Found** (free).
- `npm view nx-video` → **E404 Not Found** (free).
- `npm view create-nx-video` → **E404 Not Found** (free).
- **The `@hive-academy` scope is TAKEN and already ours**: `npm view @hive-academy/ptah-cli` → `version = '0.2.6'`, `maintainers = 'hive-academy <abdallah.khalil.nada@gmail.com>'` (this is Ptah's own published CLI — see the audit doc's PUBLISHED-ARTIFACT entry). Also under the same maintainer: `@hive-academy/angular-gsap@1.2.0` (published 2026-07-21, MIT). Registry search (`https://registry.npmjs.org/-/v1/search?text=scope:hive-academy&size=20`) returns these exact-scope packages amid fuzzy "academy" matches (oso-cloud, @khanacademy, @mate-academy, @particle-academy — unrelated).
- `npm whoami` → **ENEEDAUTH** ("You need to authorize this machine using `npm adduser`") — this lane is not authenticated, so org membership and publish rights cannot be proven from here. `curl https://www.npmjs.com/org/hive-academy` → 403 (npmjs.com blocks unauthenticated curl), so org-vs-user-account type is also unconfirmed.

### Recommendation

Publish as **`@hive-academy/nx-video`** (plugin) and **`create-nx-video`** (preset) — both names are free, and the scope is the one Ptah already publishes under, so the audience is the same. `nx-video` is also free if an unscoped fallback is wanted, but the scoped name is the better default for an org suite; keep `nx-video` unclaimed (or reserve it defensively — publishing a placeholder is a user decision).

### Open items (manual verification required)

The user must confirm, from a logged-in machine:

1. `npm whoami` shows the `hive-academy` account (or an account that is a member of the `hive-academy` org — `npm org ls hive-academy` if it is an org; `npm access ls-packages @hive-academy` if the token has rights).
2. The publish token/CI (npm provenance via GitHub Actions, per the roadmap) is attached to that org.
3. Whether to defensively register the bare `nx-video` name.

---

## Decisions

| # | Decision | Options considered | Evidence | Reversible? |
|---|---|---|---|---|
| 1 | Remotion stays an npm **dependency pinned at `4.0.484`**, never vendored or bundled; MIT applies to our code only | vendor a copy; bundle a tarball; dependency | LICENSE.md restriction targets "copy or modify Remotion code"; FAQ allows any commercial use that isn't selling Remotion itself; tarball shows npm is the distribution channel | Yes — a version bump away |
| 2 | Adopt the package README's own notice wording + link `https://www.remotion.dev/license` in our README and generated templates | write our own legal text; omit a notice | `remotion@4.0.484` README §License wording (quoted above); LICENSE.md and FAQ impose no required notice, so precedent wording is safest | Yes |
| 3 | HyperFrames shipped as **pinned npm dependencies** (`hyperframes@0.8.98`, `hyperframes@0.8.30`, `@hyperframes/shader-transitions@0.8.97`), not vendored | vendor Apache-2.0 copies; npm deps | npm metadata + repo LICENSE: Apache-2.0, Copyright 2026 HeyGen, Inc.; shader-transitions has no npm license field (flagged) | Yes |
| 4 | The `editor` generator **downloads davinci-resolve-mcp at the recorded pinned commit**; we do not redistribute the vendored copy; `resolve-advanced` sub-vendors (apparently private) never ship | vendor the copy in this repo; download at pin; exclude entirely | vendored tree untracked at baseline (no license/provenance reachable); sub-vendors absent from npm and GitHub; public-repo hygiene rule 1 | Yes — vendoring can replace downloads once provenance and a permissive license are confirmed |
| 5 | Package names: `@hive-academy/nx-video` + `create-nx-video` | `nx-video` unscoped; another scope | both 404 on npm (free); scope already publishes `@hive-academy/ptah-cli` under the user's maintainer account | No once published — verify before first publish |

## Clarifications Needed

1. **Remotion Company License for Hive Academy's own use** (legal/licensing commitment — ours to flag, the user's to make). If Hive Academy is a for-profit with more than 3 employees, producing videos with the showcase/self-shot pipeline requires a Company License (remotion.pro/license); publishing the MIT package does not. Options: (a) accept and buy a Company License if headcount > 3, (b) proceed on the Free License if the org qualifies (≤3 employees / non-profit / evaluation only), (c) publish the plugin but produce no videos in-repo until licensed. **(Recommended: b if the headcount fact is known to qualify, else a.**)
2. **npm org membership** — this lane is unauthenticated (ENEEDAUTH). Verify `npm whoami` / `npm org ls hive-academy` on a logged-in machine and confirm the publish token and provenance setup belong to the `hive-academy` account that owns `@hive-academy/ptah-cli` and `@hive-academy/angular-gsap` (maintainer `hive-academy <abdallah.khalil.nada@gmail.com>`). **(Recommended: the maintainer of those existing packages is the same account — just confirm login and 2FA/provenance settings.)**
3. **davinci-resolve-mcp provenance** — record the upstream URL, pinned commit and LICENSE from the real `tools/video-editor/vendor/davinci-resolve-mcp` checkout (D: machine), and decide vendor-vs-download there. Options: (a) download at pinned commit in the `editor` generator **(Recommended — works regardless of which upstream and license it turns out to be)**, (b) vendor it with retained LICENSE once confirmed MIT/Apache, (c) leave it to the user to install manually and have `doctor` only detect it.