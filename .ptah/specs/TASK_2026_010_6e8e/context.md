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
