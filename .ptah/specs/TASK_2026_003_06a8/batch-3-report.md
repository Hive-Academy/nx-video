# Batch 3 report — engine-zone lint and isolation test

## Tasks

| Task | Status | Evidence |
| --- | --- | --- |
| 3.1 Zone table | Done | `tools/eslint/engine-zones.mjs` exports seven data-only zones, the hard-rule-4 message, pin patterns and allowed paths, and forbidden spawn strings; `engine-zones.d.mts` declares their types. The data module has no imports. |
| 3.2 Zone lint blocks | Done | The package flat config extends the root config and derives zone blocks from the table. It restricts static, dynamic and `require` imports, package imports, computed imports, and version literals. `project.json` runs `eslint .` with `cwd: packages/nx-video` and retains the G1 dependency. |
| 3.3 Isolation backstop | Done | The TypeScript scanner resolves relative imports and checks static, dynamic, `require`, pin and spawn violations. Its synthetic-tree test asserts four cross-engine violations, including a parent-path escape; the exclusion-list test asserts the exact four exclusions. |
| 3.4 Lint fixtures | Done | The three fixture files exercise static, dynamic and `require` imports. The spec calls `ESLint#lintText` with an in-zone Remotion file path, expects one hard-rule-4 error for each fixture, and checks an allowed shared import and the studio QR exception. |

## Verification

- `npx nx run-many -t lint,test,typecheck,build -p nx-video --output-style=static --skip-nx-cache`: passed; 3 test files and 11 tests passed, with cache skipped. The `nx-video-source:no-media` dependency also ran.
- `npx eslint test-fixtures`: exit 2, "all files are ignored" (ESLint 9 behaviour for an all-ignored pattern). `npx eslint --no-error-on-unmatched-pattern test-fixtures`: exit 0, no output. Every repository `tsconfig` excludes `test-fixtures` explicitly or includes only package-local files. *(Corrected by the orchestrator after the team-leader rejection: the global ignore was restored.)*
- From the repository root, the requested `npx eslint --print-config packages/nx-video/src/index.ts | grep -c no-restricted` prints `0` (exit 1). ESLint 9 finds configuration from the working directory. The equivalent command from `packages/nx-video`, `npx eslint --print-config src/index.ts | grep -c no-restricted`, prints `1` (exit 0). This is the directory used by the Nx lint target, so it verifies the package config is loaded for that target.
- `ptah_get_diagnostics` on the edited config files found 0 errors and 0 warnings; `git diff --check` passed. A targeted source search found no `npx.cmd` or `shell: true` in shipped code. The policy table contains those strings only as forbidden values.

## Files created or modified

- `/home/amun/projects/nx-video/tools/eslint/engine-zones.mjs`
- `/home/amun/projects/nx-video/tools/eslint/engine-zones.d.mts`
- `/home/amun/projects/nx-video/packages/nx-video/eslint.config.mjs`
- `/home/amun/projects/nx-video/packages/nx-video/project.json` (lint target only)
- `/home/amun/projects/nx-video/packages/nx-video/src/engine-isolation.spec.ts`
- `/home/amun/projects/nx-video/packages/nx-video/src/engine-zones-lint.spec.ts`
- `/home/amun/projects/nx-video/test-fixtures/lint/static-cross-engine.ts`
- `/home/amun/projects/nx-video/test-fixtures/lint/dynamic-cross-engine.ts`
- `/home/amun/projects/nx-video/test-fixtures/lint/require-cross-engine.ts`
- `/home/amun/projects/nx-video/eslint.config.mjs`: the second lane removed the fixture ignore. The orchestrator restored it, so the net diff is empty.
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_003_06a8/batch-3-report.md`

## Risks and lint wiring

- **R2:** The scanner self-test creates temporary Remotion and HyperFrames paths and requires four violations, so the empty 003 engine tree cannot make the test pass vacuously.
- **R3:** Fixture text is linted with `filePath` inside `src/remotion/`; all three import forms must yield the hard-rule-4 error. A shared import must yield none.
- **R4:** The fixture files are not inputs to any TypeScript program. The root ESLint config ignores `test-fixtures/**` globally (restored). The package fixture test checks the deliberately invalid imports with `lintText`.
- **R5:** The scanner excludes `*.spec.ts`, `tools/eslint/**`, `test-fixtures/**`, and generator `files/**` and asserts that exact list; spawn strings in the data table and tests cannot create false positives.
- **Lint wiring:** `nx-video:lint` runs from the package directory and therefore loads its own flat config. The package-directory print-config returns one `no-restricted` match; the root-directory invocation does not test that target's config.

## Decisions

| Decision | Options | Evidence | Reversible |
| --- | --- | --- | --- |
| Limit the `@nx/enforce-module-boundaries` exception to `packages/nx-video/eslint.config.mjs`, `packages/nx-video/src/engine-isolation.spec.ts`, and `packages/nx-video/src/engine-zones-lint.spec.ts` only. | All specs; these three consumers. | Only these files import `tools/eslint/engine-zones.mjs` across the project boundary. The prior `src/**/*.spec.ts` exception was broader than necessary. | Yes. |
| Keep the root global ignore for `test-fixtures/**`. *(The lane's removal was reverted by the orchestrator.)* | Remove the ignore; keep it | ESLint 9 exits 2 on an all-ignored pattern, so the verification line in batches.md was corrected instead of the config | Yes |
| Use the package-directory print-config as the lint wiring proof. | Root-directory invocation; package-directory equivalent. | `project.json` sets `cwd: packages/nx-video`; ESLint 9 resolves the flat config from that directory. | Yes. |

## Not done

- The repository-root print-config invocation still prints `0`; it does not load the package flat config. The package-directory equivalent prints `1` and is the actual lint target context.
- No Windows or macOS CI run was performed in this lane. No git write command was used.
