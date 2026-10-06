# Context

## Intent

The second product: one `/plugin marketplace add Hive-Academy/nx-video` gives Claude Code the video skills, the agent and the MCP configuration.

## Source

In Ptah:

- `.claude/skills/video-showcase/` and `.claude/agents/video-director.md`.
- The `ptah-video` plugin in `apps/ptah-extension-vscode/assets/plugins/ptah-video/` (the shape Ptah already ships).
- The schema: `libs/backend/plugin-marketplace/src/lib/registry/marketplace-manifest.schema.ts:66-98`.

## Scope

- `.claude-plugin/marketplace.json` and one or more plugin folders.
- Skills: `video-showcase`, and skills for the HyperFrames pipeline from the playbook. Remove Ptah-specific text.
- Agent: `video-director`.
- MCP servers: the Resolve MCP entry (optional).
- The HyperFrames skills from `heygen-com/hyperframes`: list them, or document the `npx skills add heygen-com/hyperframes` step.
- A CI test that validates the manifest against a copy of the Ptah schema.

## Acceptance

- AC5: the manifest validates against the Ptah marketplace schema, and Claude Code can install it.
