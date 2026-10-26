Verdict: REVISE

| Defect | Status | Evidence (revised plan lines) |
|---|---|---|
| 1 — AC6 fixture | Resolved | 498–500, 540–545, 928: separate source-tree expected failure and planted post-copy alarm are required CI checks. |
| 2 — EndCard QR and TUI contract | Partially resolved | 333–360 specify brand-driven QR, and 385, 393, 398 specify `@xterm/headless` and `tui-frames.json`. But 344 moves `qrcode.mjs` to `studio/lib`, while the build asset list at 144 copies only `scripts/**/*.mjs`; see regression 1. |
| 3 — first-publish completeness | Resolved | 786–812, 917–932: real renders gate publish, 013 depends on all first-release deliverables, and editor follows in a later minor. |
| 4 — frame/assembler contract | Resolved | 608–630, 653, 676: fragment shape, contiguity, seams, paired timing attributes, assembler test and `check` are specified; matches baseline `assemble.mjs:29–78`. |
| 5 — `keepExistingVersions` | Resolved | 410–423, 938: bypass removed; all engine versions are exact, with dry-run migration and doctor failure on mismatch. |
| 6 — marketplace MCP scope | Resolved | 575, 1019, 1045: skills and agents only, per user decision row 15; editor generator owns per-machine MCP setup. |
| 7 — deferred contracts | Resolved | 383–385, 577–582, 753–766, 830, 838: concrete executor and marketplace contracts, Nx callback proof/fallback, exact studio list and coverage check. |
| 8 — engine isolation | Resolved | 155–175, 913, 921: zone-scoped lint covers static, dynamic and `require` imports including `.mjs`, with fixtures and a test backstop. |
| 9 — kit runtime neutralisation | Partially resolved | 636–655 cover the named behaviours, but 644 renames only `pu-ring`, `pu-vignette`, `pu-ico`. Baseline `runtime.js:117,148` also emits `pu-badge` and `pu-code`; the proposed `\bpu-` unit assertion at 654 would fail. |

## Regressions

1. **Blocking — QR encoder absent from the declared package assets.** Plan 144 copies `src/remotion/scripts/**/*.mjs`, while 344 places the browser QR encoder at `src/remotion/studio/lib/qrcode.mjs` and 345 makes EndCard import it. The published package has no declared copy or compile step for that `.mjs` file, so the required packed-workspace render at 788–794 can fail to resolve it. **Fix:** include the studio encoder in the package build assets (or compile it), and assert its presence in the packed tarball before the render smoke.

No other new CLAUDE.md hard-rule regression was found. The new React, sharp and `@xterm/headless` pins are in the Remotion constants module (223–229); engine pins and Windows-safe spawning remain specified at 230–238 and 203–217.

## Decisions

| Decision | Options | Evidence | Reversible |
|---|---|---|---|
| Return REVISE for the two incomplete fixes. | Approve; revise the QR package asset and remaining kit class names. | Defects 2 and 9 above; plan 144, 344, 644, 654. | Yes, before plan approval. |
| Accept the applied user scope decisions. | Reopen rows 14–17; retain them. | First-release order and 013 dependencies: 917–932; marketplace and doc update: 575, 1019; studio library: 325–332, 1033; selector-driven harness hooks: 257–300, 825, 945, 1013, 1039. | Scope changes remain user-reserved. |
