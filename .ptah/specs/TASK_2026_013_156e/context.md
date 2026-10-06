# Context

## Intent

The first public version, so that Ptah can consume the package (Ptah `TASK_2026_582_a7db`).

## Scope

- A release workflow (Nx release or changesets, as `TASK_2026_001` decides) for `@hive-academy/nx-video`, the contract package and `create-nx-video`.
- npm publish from CI with provenance. The npm token is a repository secret, never a file.
- A GitHub release with a changelog.
- A `0.x` version while the generator contracts can still change.

## Acceptance

- The packages install from npm into an empty workspace, and AC2 passes against the published version.
- Ptah `TASK_2026_582_a7db` gets the version to consume.
