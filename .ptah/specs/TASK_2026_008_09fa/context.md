# Context

## Intent

The optional editor: transcription with WhisperX, DaVinci Resolve through its MCP server, and HyperFrames graphics over filmed footage.

## Source

`tools/video-editor/` in Ptah (`CLAUDE.md`, `scripts/`, `vendor/`). The `projects/` folder holds real jobs. Do not copy it.

## Scope

- `editor` generator: the job folder layout, a Python venv setup with `uv`, and the `davinci-resolve` MCP entry in `.mcp.json`.
- HyperFrames pinned at `0.8.30`.
- The Resolve MCP at the vendored commit. Follow the `TASK_2026_001` decision: vendor the copy, or download it at the pinned commit.
- The doctor checks for CUDA, torch and the Resolve bridge turn on when the editor exists.
- Machine-specific values (GPU model, local paths) do not go into templates.

## Acceptance

- In the e2e workspace, `editor` writes the layout and the MCP entry.
- The venv setup runs on all three operating systems. GPU checks can be skipped in CI.
