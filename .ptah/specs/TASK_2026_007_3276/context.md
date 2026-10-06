# Context

## Intent

Most failures of the video tooling are machine setup failures. `doctor` finds them first and tells the user how to fix each one.

## Source

In Ptah: `tools/video-editor/CLAUDE.md` (the machine facts), and `tools/hyperframes/HANDOFF.md` and `PLAYBOOK.md` (the Windows traps).

## Checks

| Check | The fix message must say |
|---|---|
| ffmpeg is available (bundled or system) | how to install it |
| CUDA and torch versions, the torchvision match | the matching versions to install |
| `HF_HUB_DISABLE_SYMLINKS` on Windows | how to set it |
| `npx.cmd` cannot be spawned from Git Bash | executors run `npx-cli.js` through node |
| The Resolve bridge (script folders) | where to put the scripts |
| A background Studio preview locks its project folder on Windows | stop the preview before a move or delete |
| HyperFrames pin drift (`hyperframes upgrade --check`) | the project and the latest version |
| The HyperFrames skills are installed | `npx skills add heygen-com/hyperframes` |
| The Remotion browser (Chrome headless shell) | how to install it |

Checks that apply only to the editor (CUDA, Resolve) run only when the editor is set up.

## Acceptance

- AC3: `nx run <studio>:doctor` reports each missing prerequisite with a fix message and exits non-zero when one is missing.
- Unit tests for each check with a mocked environment.
