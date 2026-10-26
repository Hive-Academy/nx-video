# Code logic re-review — post-fix, TASK_2026_003_06a8

Reviewer family: `ollama-cloud` (glm-5.3:cloud). Fix author: the orchestrator, `claude` family.

Scope: the phase-review triage in `decisions.md` row 11, and the one-line `project.json` change adding `"location": "none"` to the `local-registry` target options. No other code was in scope.

**Verdict: APPROVED**

## Item 1 — rejection of finding 5 (`--location=none` vestigial): AGREE, withdrawn

My finding 5 claimed `--location=none` was "neither an nx CLI flag nor an option of `@nx/js:verdaccio`". That claim is factually wrong, and the orchestrator's rejection is correct on both counts:

1. **`location` is a declared option of the executor.** `node_modules/@nx/js/dist/src/executors/verdaccio/schema.json:10-15` declares `location` with `"cli": "nx"` (schema.json:7) and the enum `["global", "user", "project", "none"]`, default `"user"`. A flag declared in the executor's schema is exactly the kind of CLI argument Nx merges as an option override for `nx run <project>:<target> --flag`.
2. **The impl acts on it.** `node_modules/@nx/js/dist/src/executors/verdaccio/verdaccio.impl.js:41` — `const cleanupFunctions = options.location === 'none' ? [] : [setupNpm(options), setupYarn(options)]`. With `location: none`, neither `setupNpm` nor `setupYarn` runs, so the executor writes nothing to the user's npm/yarn config. The flag therefore does enforce decision row 10's intent at the executor level; it is not documentation-only.
3. **My proof was invalid.** `nx-video-source:no-media` is an `nx:run-commands` target; extra CLI args there are tolerated as unparsed/env-forwarded args, so its success says nothing about the verdaccio executor's schema. The orchestrator's criticism is correct.

I attempted the suggested runtime proof (`npx nx run nx-video-source:local-registry --location=none --dry-run`). It hung — `--dry-run` is evidently not honored for `continuous: true` executors — and I stopped it immediately; port 4873 was verified free and no verdaccio process remained afterwards. The static evidence above is sufficient without it, and the orchestrator's own hardening (item 2) makes the CLI flag redundant as protection anyway.

## Item 2 — `"location": "none"` in `project.json`: AGREE, correct and breaking nothing

Verified:

- `git diff project.json` — the only change is adding `"location": "none"` to the `nx-video-source` `local-registry` options, alongside the untouched `port`/`config`/`storage`; `continuous: true` is preserved.
- `npx nx show project nx-video-source --json` — the target resolves as executor `@nx/js:verdaccio` with `"location":"none"` in its options, matching the schema enum at schema.json:14. Valid against the enum, so Nx's option validation accepts it.
- `node tools/guards/no-media.mjs | tail -2` — `no-media: checked 115 files; no violations`, exit 0.
- `tools/scripts/start-local-registry.ts:66` still passes `--location=none` on the CLI; CLI flag and project option now agree, so no conflict. The e2e's own auth continues to flow through the temp `NPM_CONFIG_USERCONFIG` (start-local-registry.ts:61-64), which is untouched.

Behaviour change is intentional and matches decision row 10: the executor's `setupNpm`/`setupYarn` (the only code path in this workspace that could write a user-level npm/yarn config) is now suppressed in project config as well as on the CLI — belt and suspenders. The empty `cleanupFunctions` array means there is nothing to restore at exit, which is correct because nothing was written. No consumer of the target relies on the default `user` location. No breakage found.

## Triage objection (decisions.md row 11): no objection

The Moderates deferred to TASK_2026_004_8680 (findings 3, 4, 6, 12 — engine-isolation enforcement holes) all concern future engine code, and 004 precedes it. The Moderates deferred to TASK_2026_010_6e8e (findings 1, 2, 7, 8, 9, 10, 11) are CI efficiency, dev-machine race robustness and consistency items. None can corrupt a user config or lose data in this phase:

- The only user-config-writing path in scope was the verdaccio executor's `setupNpm`/`setupYarn`, now suppressed twice (project.json option and CLI flag), on top of the already-verified temp `NPM_CONFIG_USERCONFIG`.
- Finding 2 (registry TOCTOU) is the only deferred Moderate with a wrong-registry outcome, but with `location: none` plus the temp userconfig it cannot write any config; a foreign registry would also reject the temp auth token, failing loudly. Likelihood on isolated CI runners is negligible and the preflight (start-local-registry.ts:57-60) already refuses an occupied port.
- Findings 3/4/6/12 are invisible until engine code lands in 005+, and are routed to 004, which is before that.

## Decisions

- **Finding 5 withdrawn as a false positive** (my schema claim was wrong; my runtime proof used a run-commands target, which tolerates extra args). Options: stand by it or withdraw; evidence: schema.json:10-15 and verdaccio.impl.js:41; reversible.
- **`project.json` hardening accepted as correct** — agree with the orchestrator adding `"location": "none"` in project config; it makes the guarantee independent of the CLI flag.
- **No runtime proof of CLI-override forwarding recorded** — the `--dry-run` attempt hung on the continuous executor and was stopped; static schema + impl evidence is the basis of the verdict, consistent with the task's allowance.