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
