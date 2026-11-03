# Private Ptah video import

On 2026-11-03 the video tooling left the PtahCode repository (`Hive-Academy/PtahCode`).
A local snapshot of it lives in the git-ignored `private/` folder of this workspace.
It is not part of the public repository and must never be committed.

## Layout of `private/` (local only)

| Path | Content |
| ---- | ------- |
| `private/ptah-source/` | Tracked PtahCode video sources at the commit in `SOURCE_COMMIT.txt`: `apps/ptah-video-studio` (Remotion), `tools/hyperframes`, `libs/showcase-manifest`, `plugins/ptah-video`, `.claude/skills/video-showcase`, `docs/video-scripts`, and the Electron capture harness. |
| `private/video-editor/` | The private `tools/video-editor` workspace (projects, media, vendored tools). |

## Rules

- The snapshot is the input for the extract tasks (`TASK_2026_001`, `TASK_2026_002`).
  Code moves from `private/` into `packages/` only after the history scan clears it
  and the extract plan is approved, per `CLAUDE.md`.
- Media, recordings and client or product names stay in `private/`.
