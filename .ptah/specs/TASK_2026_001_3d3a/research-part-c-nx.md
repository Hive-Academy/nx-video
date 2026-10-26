# Research Part C - Q4: Nx plugin packaging (TASK_2026_001_3d3a)

## Question

- Decision this supports: the project layout, target design, e2e and release pipeline that `TASK_2026_002` confirms for `@hive-academy/nx-video` and `create-nx-video`.
- Question: How should we author, test and publish an Nx plugin with generators, executors and a `create-*` preset, on Windows, macOS and Ubuntu?
- Bounds: Not investigated: Nx Cloud, Angular/React plugin patterns, the Ptah-side consumption. npm scope ownership (Q5) is out of scope. I checked the published tarballs of `nx`, `@nx/plugin`, `@nx/js`, `@nx/devkit` and `create-nx-workspace` at 24.0.1, unpacked under `/tmp/nxpk` (nothing installed in the repo). Several nx.dev pages returned 404 or intermittent errors through the fetch tool (`/docs/extending-nx/*`, `tooling-plugin.md`), so doc quotes below come only from pages that loaded. Where I could not load a page I used the shipped source as evidence and say so.

## Answer

Correct the task premise: the current Nx major is **24** (`nx@24.0.1`, latest, 2026-10-23), not 23. Build on `@nx/plugin@24.0.1` and declare Nx `>=23 <25` as the supported range. Use a **hybrid**: write every task as an **executor** (the logic, the pinned-version calls and the Windows-safe spawning live there), and add a small `createNodes` plugin that only **infers targets that point at those executors**, triggered by `remotion.config.ts`, `hyperframes.json` and `brand.config.ts`. This gives projects zero hand-written target config without moving logic into the inference layer. Publish with `nx release` from GitHub Actions on npm **trusted publishing (OIDC)**. It needs no token and emits provenance automatically.

## Evidence

| Claim | Source | Date | Verified how |
|---|---|---|---|
| `nx`, `@nx/plugin`, `@nx/js`, `create-nx-workspace` all have `latest` = 24.0.1; `previous` tag = 23.3.1; 24.0.0 published 2026-10-21, 23.0.0 on 2026-06-16, 23.3.0 on 2026-10-07 | `npm view <pkg> dist-tags` / `time` | 2026-10-26 | ran it |
| `@nx/plugin@24.0.1` ships generators `plugin`, `generator`, `executor`, `create-package`, `e2e-project`, `migration`, `plugin-lint-checks`, `preset` (hidden) | `/tmp/nxpk/x/nx-plugin-24.0.1/package/generators.json` | 2026-10-21 | read the source |
| Plugin `package.json` carries `"generators": "./generators.json"`; adding an executor writes `executors.json` and sets `"executors": "./executors.json"` | `.../nx-plugin-24.0.1/package/dist/src/generators/{generator/generator.js:73-76, executor/executor.js:23-26}` | 2026-10-21 | read the source |
| Build assets must include `generators.json`, `executors.json`, and non-ts files in `src` | `.../generators/plugin/plugin.js:30-38` | 2026-10-21 | read the source |
| In 24.0.1 the type `CreateNodes` is `[projectFilePattern, (files, options, context) => CreateNodesResultArray]`. `CreateNodesV2` is an alias marked `@deprecated - use CreateNodes`; the plugin field `createNodesV2` is marked "Prefer `createNodes` for new plugins" | `.../nx-24.0.1/package/dist/src/project-graph/plugins/public-api.d.ts:45, 96-99` | 2026-10-21 | read the source |
| Nx 23.0.0-beta.24 added migrations for the rename `createNodesV2` -> `createNodes`; the old name is kept as a deprecated alias (secondary mirror; search result summary) | https://newreleases.io/project/npm/nx/release/23.0.0-beta.24, https://nx.dev/docs/technologies/build-tools/vite/migrations | undated / 2026 | read the search summary only; corroborated by the 24.0.1 types above |
| Nx 22 removed the CreateNodes v1 types | https://22.nx.dev/changelog | 2025 | search summary only |
| Tooling-plugin guide: inferred tasks "work well for getting users started using your tool quickly, but you can also provide users with executors" | https://nx.dev/docs/extending-nx/tooling-plugin.md | undated | search snippet (page fetch gave 404) |
| Inferred-task results are hashed, so `createNodes` must be deterministic (sort arrays, no absolute paths or env values); when two plugins define the same target name the later in `nx.json` wins | https://nx.dev/docs/concepts/inferred-tasks.md | undated | search snippet |
| Executor schema may set `"continuous": true` (the `@nx/js:verdaccio` schema does). Target config has `continuous`, `readyWhen`, and `dependsOn[].waitFor: 'started' \| 'ready'` | `.../nx-js-24.0.1/package/dist/src/executors/verdaccio/schema.json:6`; `.../nx-24.0.1/package/dist/src/config/workspace-json-project-json.d.ts:179-258, 358-367` | 2026-10-21 | read the source |
| `create-package` generator: name must match `create-.+` or `@scope/create(-.+)?`; adds a `preset` generator to the plugin if missing; writes `bin` entry; the CLI template calls `createWorkspace('<plugin>@<same version>', {name, nxCloud:'skip', packageManager})` | `.../create-package/schema.json`, `create-package.js:42-91`, `files/create-framework-package/bin/index.ts__tmpl__` | 2026-10-21 | read the source |
| Docs: the preset generator "runs when someone uses either `create-nx-workspace --preset my-plugin` or `npx create-my-plugin`"; the generator must be named `preset`; "both packages must be published to run them" | https://nx.dev/docs/extending-nx/create-install-package (search summary; 21.nx.dev and 22.nx.dev copies); https://nx.dev/docs/kb/create-preset ("the word `preset` is required for the name of this generator", fetched) | undated | fetched kb page, search summary for the rest |
| `create-package` has existed since Nx 16.5 | https://21.nx.dev/docs/extending-nx/create-install-package | undated | search summary |
| Local e2e: `e2e-project` generator wires jest `globalSetup`/`globalTeardown` to `tools/scripts/start-local-registry.ts` / `stop-local-registry.ts`, sets `e2e` `dependsOn: ['^build']`, `runInBand: true`, and `implicitDependencies: [plugin]` (vitest variant: `maxWorkers: 1, isolate: false`) | `.../e2e-project/e2e.js:88-120, 175-215` | 2026-10-21 | read the source |
| The generated start script calls `startLocalRegistry` (forks `nx run <proj>:local-registry --location none --clear true`), then `releaseVersion({specifier:'0.0.0-e2e', firstRelease:true, gitCommit:false, gitTag:false, stageChanges:false, versionActionsOptionsOverrides:{skipLockFileUpdate:true}})` and `releasePublish({tag:'e2e', firstRelease:true})` | `.../nx-js-24.0.1/.../utils/add-local-registry-scripts.js`; docs https://nx.dev/docs/guides/nx-release/update-local-registry-setup.md (fetched) | 2026-10-21 | read the source and the doc |
| `startLocalRegistry` sets `npm_config_registry`, pnpm, bun and yarn env vars, and runs `npm config set //localhost:<port>/:_authToken ... --ws=false` (user-level `.npmrc` write), removed again in the stop function | `.../nx-js-24.0.1/.../plugins/jest/start-local-registry.js` | 2026-10-21 | read the source |
| The same file builds the `nx run ...` argv with `.split(' ')` and forks `nx/bin/nx` (no shell) | `start-local-registry.js` | 2026-10-21 | read the source |
| `setup-verdaccio` generator creates `.verdaccio/config.yml` (storage `../tmp/local-registry/storage`, uplink to npmjs, publish allowed offline) and a `local-registry` target on the root project, port 4873 | `.../generators/setup-verdaccio/{generator.js,files/config.yml}` | 2026-10-21 | read the source |
| Nx docs publish workflow: `id-token: write # needed for provenance data generation`; `NPM_CONFIG_PROVENANCE: true` and `NODE_AUTH_TOKEN: ${{ secrets.NPM_ACCESS_TOKEN }}` on the `nx release publish` step. The page does not cover OIDC/trusted publishing | https://nx.dev/docs/guides/nx-release/publish-in-ci-cd.md | undated | fetched |
| npm trusted publishing needs npm CLI >= 11.5.1 and Node >= 22.14.0; GitHub Actions needs `id-token: write`; provenance is generated automatically (public repo + public package only); no npm token needed to publish; self-hosted runners unsupported; a new trusted-publisher config must complete its first successful publish within 2 days; dist-tag management over OIDC needs CLI 11.21.0+ or 12.2.0+ | https://docs.npmjs.com/trusted-publishers | undated (current page) | fetched |
| Trusted publishing with OIDC became generally available 2025-07-31 | https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/ | 2025-07-31 | search summary |
| `@nx/js:release-publish` runs `npm`/`pnpm` publish and, for bun, falls back to npm because "bun does not support npm OIDC trusted publishing" | `.../nx-js-24.0.1/.../executors/release-publish/release-publish.impl.js:433-439` | 2026-10-21 | read the source |
| `nx.json` `release` supports `projectsRelationship`, `version.conventionalCommits`, `version.preVersionCommand`, `changelog.workspaceChangelog`, `versionActions` | `.../nx-24.0.1/package/dist/src/config/nx-json.d.ts:146-261, 578-700` | 2026-10-21 | read the source |
| Node 18/20/21 (April 2024 fix) throw `EINVAL` when `spawn`/`spawnSync` runs `.bat`/`.cmd` without `shell` (CVE-2024-27980) | https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2 | 2024-04-10 | search summary |
| `@hive-academy/nx-video` and `create-nx-video` returned 404 on `npm view` (no published package of that name today) | `npm view` | 2026-10-26 | ran it |
| Local toolchain: node v24.15.0, npm 12.2.1, `verdaccio` latest 7.0.1 | `node -v`, `npm view` | 2026-10-26 | ran it |

## Options

### Executors vs inferred tasks (per target)

| Option | Fit here | Cost to adopt | Known failure mode |
|---|---|---|---|
| Executors only (hand-configured `project.json` targets) | Matches the Ptah `export-kit.mjs` style; full control of spawn, pinned versions, env | Every generated project needs targets written by the `scene`/`studio`/... generators | Config drift between generated projects; generators must keep rewriting `project.json` |
| Inference only (`createNodes`, targets run `command:` strings) | Fine for tools with a CLI; fast to start | Plugin code plus tests | Command strings would call bare `npx` and go through a shell, which breaks rules 3 and 5 in `CLAUDE.md`; logic hides in a hashed graph function |
| **Hybrid: executors hold logic, `createNodes` emits targets that name them** | Rule 3 (pinned) and rule 5 (Windows) are enforced in one executor module. Presence of `remotion.config.ts` / `hyperframes.json` decides which engine's targets exist, so the two engines stay separate (rule 4) | One extra `plugin.ts` (~100 lines) and `nx.json` `plugins` entry written by `init` | `createNodes` must be deterministic and cheap, with no spawning in it; same-name conflicts resolve by `nx.json` plugin order |

Recommendation per target (all are inferred shapes that point at an executor; the executor is the only implementation):

| Target | Executor or inferred | Trigger file | Cache | Reason |
|---|---|---|---|---|
| `render` (Remotion) | Executor, inferred | `remotion.config.ts` | yes; inputs `default`, `brand.config.ts`, scene files, `{externalDependencies:[remotion packages]}`; outputs `{projectRoot}/video-output` | Frame output is a function of sources; large mp4 outputs make remote caching heavy, so make that configurable (see Unknowns) |
| `render` (HyperFrames) | same executor with engine detected, or a separate target name | `hyperframes.json` | yes; same shape | Engine chosen by which config file exists, no shared code |
| `capture` | Executor, inferred | `*.scene.ts` / `remotion.config.ts` | **no** | Drives Playwright against a live app and records, so it is non-deterministic and depends on external state. Use `dependsOn` on the app's continuous serve target with `readyWhen` |
| `selfshot` | Executor, inferred | same | **no** | Same reason as `capture`; also keeps private recordings out of cache (rule 1) |
| `narrate` | Executor, inferred | `remotion.config.ts` | yes (inputs: script text, voice config); outputs gitignored | Cache avoids repeat TTS cost; audio must never be committed |
| `check` | Inferred, executor-backed | `hyperframes.json` | yes | Pure and deterministic lint of the project; best candidate for fully inferred |
| `assemble` | Inferred, executor-backed | `hyperframes.json` | yes | Deterministic fragment assembly |
| `studio` | Executor with `continuous: true` | `remotion.config.ts` | no | Long-running dev server (same pattern as `@nx/js:verdaccio`) |
| `doctor` | Executor only, not inferred | none (workspace-level) | no | Environment facts, not project facts; run on demand |

### Preset

| Option | Fit here | Cost to adopt | Known failure mode |
|---|---|---|---|
| `preset` generator in the plugin plus `create-nx-video` from `nx g @nx/plugin:create-package` | Exactly the documented route; `create-nx-video` is a thin `createWorkspace('@hive-academy/nx-video@<same version>')` caller | Two packages to publish and version in lockstep | `create-nx-video` embeds the plugin version it was built with (`require('../package.json').version` in the template); a mismatch gives a preset that does not exist |
| `create-nx-workspace --preset=@hive-academy/nx-video` only | Works with the same preset generator | None extra | Needs the plugin published first; no friendly `npx create-nx-video` |

### E2E registry

| Option | Fit here | Cost to adopt | Known failure mode |
|---|---|---|---|
| **`@nx/plugin:e2e-project` plus `@nx/js:setup-verdaccio` (generated scripts)** | Official shape, same on all three OSes | Run two generators, keep `tools/scripts/*-local-registry.ts` | `.split(' ')` argv and `npm config set` writes to user `.npmrc` (see Windows) |
| Custom Verdaccio startup script | Full control | We own the Windows quirks | Reimplements what Nx ships |

## Disagreements

- **"Nx 23" (task context) vs registry**: context.md says Nx 23; the registry says 24.0.1 is `latest` and 23.3.1 is `previous`. The registry wins. The createNodes rename that matters to us landed in 23, so a `>=23` floor is safe.
- **`createNodesV2` vs `createNodes`**: the nx.dev search snippet for the tooling-plugin page still says the inferred-task export is `createNodesV2`; the installed 24.0.1 types mark it deprecated in favour of `createNodes`. The installed types decide: export `createNodes`. Do not export both (the alias is deprecated, and a second field invites divergence).
- **Provenance**: nx.dev tells you to set `NPM_CONFIG_PROVENANCE=true` plus a `NODE_AUTH_TOKEN` secret; npm says trusted publishing needs no token and provenance is automatic. Both work. Trusted publishing is the newer path, but the nx.dev page does not mention it, so Nx-side behaviour with OIDC is only partly evidenced (`release-publish` has bun->npm fallback code mentioning OIDC, which shows it is anticipated, but I did not run it).

## Local consequences

- `package.json` of `packages/nx-video`: `"generators": "./generators.json"`, `"executors": "./executors.json"`, `"main"` exporting `createNodes`, `publishConfig.access: public`, `repository` field set (provenance needs it to match the GitHub repo; **inferred**, standard npm requirement), peer deps `nx` and `@nx/devkit` `>=23 <25`.
- `generators.json`: `init`, `studio`, `scene`, `editor`, `hyperframes-project`, `frame`, and a required `preset` (name must be exactly `preset`). `preset` should call `init` and then `studio` (or `hyperframes-project`, by option) so the three entry points share code.
- `executors.json`: `render`, `narrate`, `selfshot`, `capture`, `doctor`, `assemble`, `check`, `studio`, each with `schema.json`; `studio` carries `"continuous": true`.
- Build config: copy `generators.json`, `executors.json`, `**/*.json` schemas and template files (`files/**`, `src/index.tpl`, kit partials) into `dist`, using the asset rules the `plugin` generator writes (`plugin.js:30-38`). Template files with `.mp4`/`.wav` must never be in the asset globs (rule 1).
- `.gitattributes`: force `eol=lf` for templates and `*.mjs`, so generated files are identical on Windows (**inferred**).
- Root `nx.json`: `release` block, `plugins` entry written by `init`; `targetDefaults` for `render`/`check` caches.
- `.github/workflows`: `ci.yml` matrix (see layout) and `release.yml` with `permissions: { contents: write, id-token: write }`.

### Windows gotchas for executors (evidence + inference, labelled)

- **Spawn without a shell (verified rule + Node advisory):** since April 2024 Node throws `EINVAL` for `.cmd`/`.bat` without `shell`. Do what `CLAUDE.md` says: `spawn(process.execPath, [npxCliJs, ...args], {shell:false, windowsHide:true, stdio:'inherit'})`. Locate `npx-cli.js` relative to `process.execPath`: on Windows `<dirname(execPath)>/node_modules/npm/bin/npx-cli.js`; on macOS/Linux `<dirname(execPath)>/../lib/node_modules/npm/bin/npx-cli.js` (**inferred layout**, must be tested on all three; fall back to `npm_execpath` when set). Never rely on `npx.cmd`, and never build one command string.
- **Pin versions:** the exec argument is `hyperframes@0.8.98`, `@remotion/cli@4.0.484`, and so on, from one constants module.
- **Paths:** `createNodes` receives forward-slash workspace-relative file paths; use `joinPathFragments`/`normalizePath` from `@nx/devkit` for anything that becomes a glob, an input or an output, and `node:path` for filesystem calls. Do not put `\` into `inputs`/`outputs` (**inferred**; cache keys must be OS independent so remote cache hits cross platforms).
- **cwd:** executors get `context.root`; resolve every project path against it and pass an explicit `cwd`.
- **Continuous process cleanup:** killing a child on Windows does not kill its tree; `studio`/`capture` need a tree kill (`taskkill /T /F /PID` or a library) on SIGINT (**inferred**).
- **E2E registry on Windows (verified in source):** `startLocalRegistry` builds argv with `.split(' ')`, so a `storage` path containing a space breaks; keep the default `./tmp/local-registry/storage` and a space-free checkout path. It also runs `npm config set` against the user `.npmrc`; runners are ephemeral so this is fine in CI, but note it for local runs (the stop function removes the token).
- **CRLF, long paths, antivirus:** enable `core.longpaths` and `core.autocrlf=false` in the Windows CI checkout step (**inferred**; the e2e test project installs a deep Remotion tree under `tmp/`).

## Recommended layout (for TASK_2026_002 to confirm)

```
nx-video/
  nx.json                       release config, plugins: [], targetDefaults
  package.json                  devDeps: nx, @nx/plugin, @nx/js, @nx/devkit, verdaccio (24.0.1)
  .verdaccio/config.yml         from @nx/js:setup-verdaccio
  tools/scripts/                start-local-registry.ts, stop-local-registry.ts, registry.d.ts
  packages/
    nx-video/                   @hive-academy/nx-video  (publishable, public)
      generators.json  executors.json  package.json
      src/index.ts              exports createNodes
      src/plugin/               createNodes (remotion.config.ts, hyperframes.json triggers)
      src/executors/<render|narrate|selfshot|capture|doctor|assemble|check|studio>/
      src/generators/<init|studio|scene|editor|hyperframes-project|frame|preset>/
      src/utils/spawn-node.ts   npx-cli.js resolver, pinned versions constants
    create-nx-video/            created with @nx/plugin:create-package, bin/index.ts
  e2e/nx-video-e2e/             from @nx/plugin:e2e-project; tests: preset, init, scene, hyperframes-project, doctor
  .github/workflows/ci.yml  release.yml
```

Targets: `build` on both packages; `test` (unit); `lint`; `nx-video-e2e:e2e` (`dependsOn: ^build`, runs in band); root `local-registry` (continuous Verdaccio). Both packages versioned together (`projectsRelationship: fixed`) because `create-nx-video` pins the same version of the plugin; changelog via conventional commits (matches the repo's commit style).

CI matrix: `os: [ubuntu-latest, windows-latest, macos-latest]`, `fail-fast: false`, Node 24 (current LTS-line available; the local toolchain is 24.15). Run lint/unit/e2e on all three; e2e must **not** perform a real Remotion/HyperFrames render (no Chromium/ffmpeg dependency in CI, **inferred scope choice**); it asserts generated file trees, pinned versions in generated `package.json`, `doctor` output and `nx show projects`/`nx graph --print` includes the inferred targets. The guard that rejects non-allowlisted selfshot slugs runs in the unit job. Publish job: ubuntu only, after the matrix, on tag/dispatch.

Release workflow: `permissions: contents: write, id-token: write`; `actions/setup-node` with Node 24 (ships npm 11, which meets >= 11.5.1; confirm npm version in the job); `npx nx release --yes` (version + changelog + commit + tag + publish). With trusted publishing there is no `NODE_AUTH_TOKEN` and no `NPM_CONFIG_PROVENANCE` needed (provenance automatic from a public repo); if falling back to a token, use nx.dev's pattern (`NODE_AUTH_TOKEN` secret and `NPM_CONFIG_PROVENANCE: true`).

## Decisions

1. **Nx version baseline.**
   - Options: pin 23.x (as in context.md); use 24.0.1; support both.
   - Decision: develop and test on 24.0.1, declare peers `>=23 <25`.
   - Evidence: `npm view nx dist-tags` (latest 24.0.1, previous 23.3.1); 24.0.1 types treat `createNodes` as the primary name; the rename is in 23.
   - Reversible: yes (peer range and lockfile).
2. **Executors hold logic; `createNodes` only wires targets.**
   - Options: executors only; inference only; hybrid.
   - Decision: hybrid (table above).
   - Evidence: tooling-plugin guide offers both; `CLAUDE.md` rules 3, 4, 5; inferred-task hashing rule.
   - Reversible: yes; an inference-only plugin can later replace the `project.json` targets.
3. **Export name.**
   - Options: `createNodesV2`; `createNodes`; both.
   - Decision: `createNodes` only.
   - Evidence: 24.0.1 `public-api.d.ts:45, 96-99` marks the V2 names deprecated.
   - Reversible: yes.
4. **Preset delivery.**
   - Options: `--preset` only; plus `create-nx-video`.
   - Decision: both, `create-nx-video` generated via `@nx/plugin:create-package`, versions locked together.
   - Evidence: `create-package.js`, nx.dev create-install-package summary, `decisions.md` target-shape table.
   - Reversible: yes.
5. **Local e2e.**
   - Options: generated `e2e-project` + `setup-verdaccio`; custom script.
   - Decision: generated scripts, with e2e tests that do not render video.
   - Evidence: `e2e.js`, `add-local-registry-scripts.js`.
   - Reversible: yes.
6. **Release auth.**
   - Options: npm trusted publishing (OIDC); granular token plus `NPM_CONFIG_PROVENANCE`.
   - Decision: OIDC trusted publishing as the target, token as a documented fallback for the first publish if npm requires an existing package (see Unknowns).
   - Evidence: docs.npmjs.com/trusted-publishers; nx.dev publish-in-ci-cd.
   - Reversible: yes.
7. **Cache policy.** `render`, `narrate`, `check`, `assemble` cached; `capture`, `selfshot`, `studio`, `doctor` not. Reversible: yes.

## Unknowns

- **Can a trusted publisher be configured before the first publish of a new package?** The npm page says a new config must complete its first publish within 2 days, which suggests yes, but I did not confirm the exact sequence for a brand-new package or scope. Smallest experiment: on npmjs.com, try adding a trusted publisher for `@hive-academy/nx-video` before publishing (needs scope ownership, Q5). Fallback: publish `0.0.1` once with a granular token.
- **Does `nx release publish` run `npm publish` with a fresh enough npm under `setup-node`?** The trusted-publishing minimum is npm 11.5.1. Smallest experiment: print `npm -v` in the release job on a dry run (`nx release --dry-run`).
- **The nx.dev docs for `extending-nx/*` and `tooling-plugin` did not load through the fetch tool** (404), so exact current wording of the `createNodes` docs is from search snippets. The installed types are the authority; a reader with a browser should skim https://nx.dev/docs/extending-nx/tooling-plugin.
- **Remote caching of large mp4 outputs** (Nx Cloud or none): not investigated; decide whether `render` should be `cache: false` by default with opt-in. Smallest experiment: run one `render` with `outputs` set and measure the cache entry size.
- **`npx-cli.js` location on macOS/Linux and Windows under nvm/fnm/volta/Homebrew**: layout above is inferred from standard Node installs. Smallest experiment: a unit test for the resolver executed on all three CI OSes plus an nvm-style install.
- **Nx 24 release notes**: no 24.0.0 final release notes were retrievable (only 24.0.0-rc.0 summary via search: removes deprecated Angular SCAM generators and `setParserOptionsProject`). Nothing found affecting plugin authoring, but unverified. Smallest experiment: run `nx migrate` dry run on the scaffolded workspace.
- **Options not examined:** `@nx/devkit` `createNodesFromFiles` helper usage patterns, `nx sync` generators, Nx Cloud, bundler choice (tsc vs swc) for the plugin build.

## Clarifications Needed

None blocking. One item for the user, non-blocking: confirm the Nx baseline correction (24, not 23) when approving `TASK_2026_002`.
