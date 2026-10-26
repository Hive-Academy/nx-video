# Context

## Intent

Two CI rules protect the public repository and the quality of generated projects.

## Scope

1. **Recording leak guard.** Fail CI when a self-shot ingest or a copied asset uses a slug that is not on the `SELFSHOT_KIT_SLUGS` allowlist. Also fail on committed media files (`.mp4`, `.webm`, `.wav`, `.mp3`, `.mov`) outside an explicit fixture allowlist.
2. **Layout-ignore rule.** Fail CI on `data-layout-ignore` and `data-layout-allow-*` attributes in HyperFrames project sources and generator templates. These attributes hid overlaps in an earlier film.

Both rules are also available as an executor or a lint rule that users can add to their own CI.

## Acceptance

- AC6: the leak guard fails on a test fixture with a non-allowlisted slug.
- AC9: the layout rule fails on a fixture that uses `data-layout-ignore`.

## Carried over from the TASK_2026_003 phase review (2026-10-26)

Source: `../TASK_2026_003_06a8/code-logic-review.md`.

- **Finding 1:** `ci.yml` runs PR branches twice (push and pull_request use different refs). Filter `push` to `main`, or key concurrency on `github.head_ref || github.ref`.
- **Finding 2:** the port-4873 preflight in `tools/scripts/start-local-registry.ts` has a TOCTOU race. After the first ping, confirm that our own child is still alive, or bind a script-chosen port.
- **Finding 7:** the `commits` job sets `cache: npm` but never runs `npm ci`.
- **Finding 8:** `check-commits.mjs` rejects native `Revert "…"` subjects. Decide whether that is intended.
- **Finding 9:** `waitForRegistry` misses a child killed by a signal (`signalCode`).
- **Finding 10:** the `npxCli()` helper is duplicated in `start-local-registry.ts` and the e2e `test-utils.ts`. Extract one engine-neutral helper.
- **Finding 11:** `stop-local-registry.ts` sends `taskkill /pid undefined` when the spawn failed. Guard on `child.pid`.
