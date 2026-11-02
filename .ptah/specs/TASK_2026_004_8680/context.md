# Context

## Intent

The capture side and the render side share one contract: `beats.json`, `shots.json` and the scene manifest. Today it is `libs/showcase-manifest` in Ptah, with the alias `@ptah-extension/showcase-manifest`. It needs a new scope before anything else can move.

## Source

`D:/projects/ptah-extension/libs/showcase-manifest/` at `e0ca51e6e`.

## Scope

- Copy the library to the target from `implementation-plan.md`, with the new package name.
- Keep the zod schemas that validate `Beat` and `SceneManifest` at the boundary.
- Keep or add unit tests for each schema.
- Remove Ptah names from types and comments.

## Acceptance

- The package builds and its tests pass in CI.
- No `@ptah-extension/*` import remains.

## Carried over from the TASK_2026_003 phase review (2026-10-26)

These must be closed before any engine code lands. Source: `../TASK_2026_003_06a8/code-logic-review.md`, findings 3, 4, 6 and 12.

- **Finding 3:** add an ESLint `no-restricted-syntax` layer for the hard-rule-5 spawn strings, as the plan requires (`TASK_2026_002_dcb6/implementation-plan.md:178`). Broaden the spec's substrings to cover `"npx"` in double quotes and `shell:true` with no space.
- **Finding 4:** `matchesGlob` in `engine-isolation.spec.ts` cannot match the mid-path `**` in `src/generators/**/files/**`. Fix the matcher, or remove the dead allowlist entry.
- **Finding 6:** the zone table's `allowed` column is not enforced, so bare cross-engine package imports pass both layers. Add `forbiddenPackages` (`hyperframes` for the Remotion zone; `remotion` and `@remotion/*` for the HyperFrames zone) and enforce it in both the lint and the spec.
- **Finding 12:** `src/index.ts` is in no zone. Either zone it (re-exports only) or document the gap.
