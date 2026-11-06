# Ptah (PtahCode) - how it talks to and orchestrates coding-agent providers

- **Source:** `D:/projects/ptah-extension` (GitHub `Hive-Academy/PtahCode`), read-only.
- **SHA:** `589cd0d938bf92379e4e5287ceb04a4003d4b932`, committer date 2026-11-05T17:58:35+02:00 ("Merge pull request #945 ... fix/codex-lane-write-dac").
- **Caveat:** the local clone is shallow (`git rev-parse --is-shallow-repository` = `true`), so local commit counts and first-commit dates are lower bounds.

**Path prefixes used below** (all relative to the repo root):

`CAR` = `libs/backend/cli-agent-runtime/src/lib`; `ADP` = `CAR/cli-agents/cli-adapters`; `SH` = `libs/shared/src/lib`; `SDK` = `libs/backend/agent-sdk/src/lib`; `CDX` = `libs/backend/codex-runtime/src/lib`; `AUTH` = `libs/backend/auth-providers/src/lib`; `MCP` = `libs/backend/vscode-lm-tools/src/lib/code-execution`.

---

## 1. Identity

| Item | Fact | Evidence |
| --- | --- | --- |
| Own words | "An Electron desktop for Claude, Codex, and the coding CLIs already on your machine." / "One session rail per workspace. Local project memory. Plan windows when the vendor reports them." | `README.md:7`, `README.md:9` |
| Older self-descriptions (stale) | `PRODUCT.md:13`: "delivered as a VS Code extension, an Electron desktop app, and a headless CLI". GitHub repo description still says "Provider-agnostic AI orchestration for Electron Desktop, Cli and VS Code". | `PRODUCT.md:13`, `gh api repos/Hive-Academy/PtahCode` |
| Form factor | Electron desktop only. The TUI, CLI and VS Code hosts were removed on 2026-11-02: "The desktop app is the only supported host." `cli-engine` and `platform-cli` remain only as a headless engine for benchmarks. `apps/ptah-extension-webview` is the Electron renderer. | `git show 1cee6fafe` (message), `CLAUDE.md` "Product focus: Electron first" |
| Stack | Nx 24.0.0 monorepo, Electron ^44.4.3, Angular ~22.2.0, TypeScript 6.0.3, Node 24.x, tsyringe DI, zod 4.6.5, better-sqlite3 ^13 + sqlite-vec 0.1.9; 39 backend libs | `package.json:6,73,101,133,135,142,185,201,210`; `ls libs/backend` |
| Licence | MIT, "Copyright (c) 2025-2026 Ptah Orchestra"; free, no trial | `LICENSE.md:1-3`, `README.md:221` |
| Age | GitHub repo `created_at` 2025-08-31; GitHub API reports 9,218 commits (last page of `commits?per_page=1`); local shallow history shows 7,238 commits from 2026-05-15; 837 commits in the 7 days before HEAD (local) | `gh api repos/Hive-Academy/PtahCode` (2026-11-05); `git rev-list --count HEAD` |
| Releases | 64 GitHub releases; newest published `electron-v0.1.70` (2026-09-04). `apps/ptah-electron/package.json` says version 2.0.0, but no v2 tag or release was found. | `gh api .../releases`; `apps/ptah-electron/package.json:3` |

## 2. Providers and how each is connected

Ptah has two provider planes: **main chat** (the session the user types in) and **lanes** (background agents spawned with `ptah_agent_spawn`).

### 2a. Main chat

- **Two runtimes:** the Claude agent runtime, or Codex through the app-server protocol (`README.md:57`). `RoutingAgentAdapter` selects per session between the legacy (Claude SDK) adapter and the native Codex adapter (`SDK/codex-app-server/routing-agent-adapter.ts:38`).
- **Claude Agent SDK, in-process:** `@anthropic-ai/claude-agent-sdk` 0.3.278 (`package.json:79`), dynamically imported (`SDK/helpers/sdk-module-loader.ts:65`). The SDK spawns the Claude CLI; Ptah routes that spawn through an off-thread worker because Windows `CreateProcess` blocked the main process ~1.6 s (`SDK/helpers/off-thread-process-spawner-source.ts:1-30`).
- **Other model vendors reuse the same Claude SDK loop** by pointing it at an Anthropic-compatible base URL or a local HTTP translation proxy (Anthropic Messages <-> OpenAI Chat/Responses, OS-assigned port) (`AUTH/translation/translation-proxy-base.ts:1-25`).
- **Registry** `ANTHROPIC_PROVIDERS` (`SH/providers/provider-registry.ts:209`): `openrouter`, `z-ai`, `kimi-code`, `github-copilot`, `openai-codex`, `ollama`, `ollama-cloud`, `lm-studio`, `claude-cli`, `sakana`, `requesty`, `opencode-zen`, `opencode-go` (`:418-431`), plus user-defined entries on an `anthropic` or `openai` lane (`:451`).
- **Auth strategies** (`AUTH/auth/strategies/`): `cli` = Claude CLI's own `~/.claude/` credentials, no key injected (`cli.strategy.ts:3-8`); `api-key` (`api-key.strategy.ts:3-6`); `oauth-proxy` for Copilot OAuth, Kimi CLI login, Codex "native runtime only" (`oauth-proxy.strategy.ts:3-9`); `local-native` Ollama; `local-proxy` LM Studio. Keys are stored in the OS secure store (per `README.md:201`; not traced in code).
- **Codex main chat:** spawns `codex app-server` and speaks zod-validated JSON-RPC frames (`CDX/codex-app-server-process.ts:193,396`).

### 2b. Lanes (`SYSTEM_CLI_TYPES`, `SH/types/agent-process.types.ts:81-90`, plus `ptah-cli`)

| Lane | Transport | Output protocol | Auth | Code |
| --- | --- | --- | --- | --- |
| `claude` | In-process Claude Agent SDK `query()` | SDK messages | Machine's Claude login, no key collected (`SH/providers/entries/claude-cli-provider-entry.ts:13-15`); optional certified named accounts (`README.md:98`) | `CAR/claude/claude-sdk-lane-runner.ts:126`, `ADP/claude-cli.adapter.ts:76` |
| `codex` | Spawned `codex app-server` (installed or bundled binary) | JSON-RPC to typed events | Codex's own `auth.json` in `CODEX_HOME` or `~/.codex`; Ptah probes read-only, no login or refresh | `ADP/codex/codex-app-server-lane.adapter.ts`, `codex-app-server-lane-auth.ts:21-30`, `SH/types/agent-process.types.ts:425` |
| `copilot` | Spawned `copilot -p ... --output-format json --allow-all-tools` (SDK skipped: ESM import fails under Node) | JSONL | The CLI's own login; adapter handles no credential (inferred) | `ADP/copilot-sdk.adapter.ts:1-30,331-333` |
| `cursor` | In-process `@cursor/sdk` (`Agent.create` -> `run.stream()`) | Typed `SDKMessage` | Cursor API key: `CURSOR_API_KEY` or stored secret | `ADP/cursor-cli.adapter.ts:3-10,217` |
| `antigravity` | Spawned `agy --output-format stream-json` (+ stream-json stdin) | NDJSON | CLI's own login (UNVERIFIED) | `ADP/antigravity-cli.adapter.ts:1-40,299` |
| `opencode` | Spawned `opencode run --format json --auto` | JSONL; Ptah MCP via `OPENCODE_CONFIG_CONTENT` env | opencode's own credential store (`auth list` probe) | `ADP/opencode-cli.adapter.ts:42,498-524` |
| `pi` | Spawned `pi --mode rpc -a` | JSONL RPC (`prompt`/`steer`/`abort`) | Pi's `~/.pi/agent/auth.json` | `ADP/pi-cli.adapter.ts:400,274-280` |
| `grok` | Spawned `grok agent --no-leader stdio`, Agent Client Protocol via `@agentclientprotocol/sdk` 1.7.0 | ACP | Grok's own `grok login`; Ptah stores none | `ADP/grok-cli.adapter.ts:3-16,246`, `package.json:70` |
| `ptah-cli` | Claude Agent SDK `query()` against a user-configured Anthropic-compatible provider | SDK messages | Provider API key or OAuth per the registry | `SH/types/ptah-cli.types.ts:1-7`, `CAR/ptah-cli/ptah-cli-registry.ts:116` |

## 3. The unifying layer

- **Two internal models, one per plane.**
  - Main chat: `FlatStreamEventUnion`, 20 variants (message start/delta, thinking, tool start/delta/result, agent start/progress/completed, compaction, background-agent events, turn state) (`SH/types/execution/stream-background.ts:334-355`). Every chat adapter implements `IAgentAdapter.startChatSession(): Promise<AsyncIterable<FlatStreamEventUnion>>` (`SH/types/agent-adapter.types.ts:318,338-340`). Claude messages are converted by `SdkMessageTransformer` (`SDK/message-transform/`); Codex frames by `CDX/codex-event-translator.ts` then `SDK/codex-app-server/codex-chat-events.ts`.
  - Lanes: `CliAdapter.runSdk(options): Promise<SdkHandle>` (`ADP/cli-adapter.interface.ts:264,311`). A handle exposes `abort`, `done` (exit code), `onOutput` (raw text), `onSegment` (`CliOutputSegment`), and optional `getSessionId`, `steer`, `continue`, `interrupt`, `getPid` (`:156-229`). `CliOutputSegment` has 9 kinds: text, thinking, tool-call, tool-result, tool-result-error, error, info, command, file-change (`SH/types/agent-process.types.ts:467-476`). Claude-SDK-backed lanes also emit `FlatStreamEventUnion` (`CAR/claude/claude-sdk-lane-runner.ts:69-70`); the interface comment names only `ptah-cli` (`ADP/cli-adapter.interface.ts:185`).
- **Stays provider-specific:**
  - Wire protocol and parser, per adapter (JSONL, ACP, JSON-RPC, SDK).
  - Where the role/policy prompt goes (`roleChannel`): `system-prompt` for claude and pi; `developer-instructions` for codex; `task-prompt` for copilot, cursor, antigravity, grok, opencode (`ADP/*.adapter.ts` `roleChannel` lines, e.g. `claude-cli.adapter.ts:76`, `codex-app-server-lane.adapter.ts:139`).
  - Mid-run messaging, declared per adapter: steer = pi only; interrupt = cursor only; continuation = all eight (antigravity only when its stream-json stdin probe passes) (`ADP/pi-cli.adapter.ts:238`, `cursor-cli.adapter.ts:274`, `grok-cli.adapter.ts:181`, `antigravity-cli.adapter.ts:434`). `README.md:78` says ACP lanes "can be steered mid-turn"; the Grok adapter declares `steer: false`.
  - Credentials, model listing, resume strategy (ACP `resume`/`load`, `ADP/acp/acp-vendor-profile.ts:15-30`), and plan-limit readers.
- **Extension seam:** a new lane adapter implements `CliAdapter` and adds one literal to `SYSTEM_CLI_TYPES` (`ADP/cli-adapter.interface.ts:1-7`, `SH/types/agent-process.types.ts:70-80`).

## 4. Sessions and workspaces

- **Rail:** up to 20 tiles (`libs/frontend/canvas/src/lib/canvas-layout-intent.ts:11`), 9 running at once (`canvas-running-cap.ts:6`). Both are renderer constants.
- **Persistence:**
  - Claude transcripts stay in `~/.claude/projects/*.jsonl`, owned by the SDK. Ptah's `SessionMetadataStore` keeps only names, timestamps, workspace and cost (`SDK/session-metadata-store.ts:1-14`). `SessionImporter` scans `~/.claude/projects/` (`SDK/session-importer.service.ts:1-8`), and `SessionHistoryReader` replays JSONL into `FlatStreamEventUnion` (`SDK/session-history-reader.service.ts:1-12`).
  - Local SQLite (68 migration files) holds memory, skills, cron, gateway, symbol index and session organization (`libs/backend/persistence-sqlite/src/lib/migrations/`).
  - Task source of truth is `.ptah/specs/TASK_*/task.md`, with a derived SQLite index (`libs/backend/task-specs/src/index.ts:1-8`).
- **Resume:** `resumeSession(sessionId)` (`SH/types/agent-adapter.types.ts:343`). Lanes accept `resume_session_id`; a completed lane is not resumed above 150,000 context tokens or after 10 min idle (`CAR/cli-agents/lane-resume-gate.ts:46,49`).
- **Worktrees:** lanes run in `workingDirectory` and are not auto-isolated. `ptah_git_worktree_add` creates a worktree (default `<ws>/.claude-worktrees/...`) (`MCP/mcp-core/tool-description.builder.ts:1052`). Child sessions (`ptah_session_start`) each get their own worktree, branch and tab (`CAR/session-children/session-spawner.service.ts:1-5`, `child-worktree.provisioner.ts:1-12`).
- **Child sessions:** default cap 3 (range 1-5), default 120 min runtime (`session-child-settings.ts:33-45`). A child cannot start sessions (`session-child-contract.ts:47`) and keeps running if its parent ends (`session-spawner.service.ts:13`). `ptah_session_handoff` opens a new top-level session that adopts the caller's lanes and children (`session-handoff.service.ts:1-25`). Session budget stages: `normal -> tighten -> handoff -> limit` (`SH/types/session-budget.types.ts:5-8`).
- **Lane parallelism:** `agentOrchestration.maxConcurrentAgents` default 5, clamped 1-100 (`CAR/cli-agents/agent-spawn-environment.service.ts:51-53,293-309`). The docs page says the setting maximum is 20 and the `agent-lanes` skill uses three lanes by default (`apps/ptah-docs/src/content/docs/agents/cli-agents.md:81,89`); a code comment calls "max 3 concurrent" stale (`agent-spawn-environment.service.ts:288-291`).
- **Process model:** the Electron main process hosts the backend (tsyringe container, `apps/ptah-electron/src/di/container.ts`) and talks to the Angular renderer over an IPC bridge (`src/ipc/ipc-bridge.ts`). Worker threads handle process spawning, embedding and integrity (`src/services/platform/electron-embedder-worker-factory.ts`, `electron-integrity-worker-factory.ts`). One HTTP MCP server runs per Ptah process, default port 51820 (`MCP/mcp-http/http-server.handler.ts:38-43`). Each lane gets `http://localhost:PORT/agent/{id}/workspace/{root}` (`ADP/ptah-mcp-url.ts:37`).

## 5. Orchestration

- **Who drives:** the main-chat agent, via `ptah_*` MCP tools, steered by an injected core prompt ("orchestration is the DEFAULT entry point for all engineering work") (`SDK/prompt-harness/ptah-core-prompt.ts:155-201`), the `orchestration` and `tribunal` skills in `.claude/skills/`, and user gates. The user can override.
- **Ptah as MCP server:** `execute_code`, `approval_prompt` and `ptah_*` tools (`MCP/mcp-core/tool-description.builder.ts:335,373,...`); sessions (`mcp-core/session-tools.ts:26-31`); wait, run_check, route, outcome. Ptah also writes its entry into `.mcp.json`, `.cursor/mcp.json`, `.codex/config.toml` and `.agents/mcp_config.json` so CLIs the user launches see it (`MCP/mcp-http/ptah-mcp-slots.ts:1-30`).
- **Ptah as MCP client-side manager:** an MCP directory with OAuth and a Smithery registry records install intent, then the harness reconciler writes server entries into each target's config (`CAR/mcp-directory/mcp-install.service.ts:1-25`). The SDK or CLI process is the actual MCP client (inferred).
- **Lane lifecycle:**
  - `ptah_agent_spawn` / `list` / `status` / `read` / `message` / `report` / `stop` / `wait` (`tool-description.builder.ts:608-966`, `agent-wait.tool.ts:36`).
  - On a terminal status Ptah pushes one `<agent-lane-completed>` turn into the spawning session. Its `verdict` is `delivered | no-deliverable | unverified | failed`, computed from declared `deliverables` checked on disk, not from the exit code (`CAR/cli-agents/lane-completion-notifier.service.ts:1-40`, `SH/types/agent-process.types.ts:621`).
  - A lane reports back with `ptah_agent_report`; it is identified by the URL segment, not a caller-supplied id (`tool-description.builder.ts:906-915`).
  - `ptah_agent_message` reports the mode used: `steer`, `interrupt-resume` (partial work discarded), `queue-next-turn` or `unsupported` (`:870-880`). Queue cap is 8 (`agent-message-router.service.ts:42`).
- **Tribunal panels** are markdown skills; no dedicated backend module was found. The main agent is "the Conductor" (`.claude/skills/tribunal/SKILL.md:9`). Council = deliberate, no code, anonymized cross-critique (`:35`); Forge = each panelist builds in its own worktree, cross-vendor review, judge (`:39`); Race = N attempts scored on a rubric fixed up front (`:43`); Crucible = cheap executor plus stronger different-family judge, frozen rubric, round cap (`:47`); Relay = phased lane workflow through orchestration (`:52`). The panel is built by family spread and the user confirms before any spawn (`:22-31`).
- **Orchestration phases:** pre-flight classifies 8 task types and 3 depths; e.g. FEATURE = PM -> research -> designer -> architect -> team-leader -> QA (`.claude/skills/orchestration/SKILL.md:12,43`). Gates 0.1/0/1/1.5/1.7/2/3 (`:92`). 14 role files live in `.claude/agents/`. Executors are in-process subagents or CLI lanes. `visual-review` and `design` phases never go to a lane (`libs/backend/lane-routing/src/lib/ranking/hard-constraints.ts:47`).
- **Cross-vendor / cross-agent review rules:**
  - A `review` or `document-review` phase cannot use a candidate from the same model family as the implement phase (`hard-constraints.ts:53,128`; `README.md:79`).
  - A review of a lane run by that same run is refused (`libs/backend/lane-outcomes/src/lib/lane-outcome-recorder.service.ts:325`).
  - Plan, design and architecture gates need an independent reviewer on the opposite execution side (`orchestration/SKILL.md:108`).
  - GitHub PR review marks each finding `cross-family`, `same-family-weaker` or `unavailable` (`libs/backend/review-core/src/lib/review-orchestrator.service.ts:26`).
- **Routing:** `ptah_route_decide` gathers, constrains, scores, spreads, then makes at most two decision-model requests (`libs/backend/lane-routing/src/lib/route-decide.service.ts:1-8`). Outcomes from `ptah_outcome_report` feed a 90-day matrix (`README.md:74-81`).

## 6. Control and safety

- **Permission levels:** `ask | auto-edit | yolo | plan` (`SH/types/model-autopilot.types.ts:20`). For Claude: yolo -> `bypassPermissions`, auto-edit -> `acceptEdits`, ask -> `default`, plan -> `plan` (`CAR/claude/claude-sdk-lane-options.ts:262-270`). Prompts go through `canUseTool` to the webview, and the attention bell can answer them (`README.md:55`). The docs page "Autopilot" is a separate toggle that lets the main agent spawn sub-agents (`apps/ptah-docs/src/content/docs/chat/autopilot.md:10`).
- **Codex:**
  - Lane policy is `approvalPolicy: never`, `workspace-write`, no network, writable root = cwd (`CDX/codex-execution-profile.ts:182-195`).
  - Chat approvals: plan declines, yolo accepts, auto-edit accepts file changes, otherwise the user is asked (`CDX/codex-permission-policy.ts`).
- **Other lanes:** Copilot `--allow-all-tools`, opencode `--auto`, Antigravity `--dangerously-skip-permissions` when auto-approve is on, and Pi "no permission popups" (per their adapter headers). ACP permission requests go through `acp-permission-policy.ts`. Copilot auto-approve is a setting (default true) (`agent-spawn-environment.service.ts:150-158`).
- **Lane policy:** a fixed `ptah-lane-policy-v1` text is injected (`ADP/cli-adapter.utils.ts:417`); completion contract (`CAR/cli-agents/lane-reporting-contract.ts`); blocked-model list (`lane-spawn-policy.ts:16`); repeat-call guard stops identical repeated tool calls (`lane-budget-guard.ts:1-20`); spawn refused when at limit (`MCP/mcp-core/agent-spawn-limit-gate.ts:1-10`).
- **Child sessions:** unattended, Bash allowlist (git read/commit, `npx nx`, `npm test`...), 60 s deny window (`session-child-settings.ts:50-58`); told never to merge, rebase or remove the worktree: "the user owns merge, PR and worktree cleanup" (`session-child-contract.ts:52-53`).
- **Capability policy:** per-workspace skill/agent/MCP toggles resolve to an `EffectiveCapabilitySet` (`CAR/capabilities/capability-policy-model.ts:1-10`).
- **Sandboxing:** `execute_code` runs in a Node `vm`; "That VM is not a security boundary" (`README.md:173`).
- **Review and git UI:** git dock with branch picker, commit, history, task, review shell/canvas, spot editor, stash, conflict (`libs/frontend/git-ui/src/lib/`). Turn trailers list changed files (`README.md:128`; not traced in code).

## 7. Context and memory

- **Memory:** hybrid BM25 (FTS5) + vector (sqlite-vec) with reciprocal rank fusion; BM25-only fallback (`libs/backend/memory-curator/src/lib/memory-search.service.ts:1-8`). Embedder is a transformers.js worker (`persistence-sqlite/src/lib/embedder/embedder.interface.ts:4`; the `Xenova/bge-small-en-v1.5` id at `:15` is an example, so the shipped model is UNVERIFIED). Memory is injected into prompts (`SDK/helpers/memory-prompt-injector.ts:86`) and exposed as `ptah_memory_search` (`tool-description.builder.ts:2002`).
- **Code index:** tree-sitter (`web-tree-sitter` ^0.27.0, `package.json:138`) with a SQLite symbol index (migrations `0008`, `0013`). MCP tools: `ptah_code_search_symbols`, `ptah_ast_analyze`, `ptah_get_dependents`/`dependencies`, `ptah_context_enrich_file`, `ptah_lsp_references`/`definitions` (`tool-description.builder.ts:498,533,1790-2078`).
- **Setup wizard / agent generation:** 4 phases: analysis, selection, LLM rendering via the Agent SDK, guarded writes of agent files (`libs/backend/agent-generation/src/lib/services/orchestrator.service.ts:1-10`). It maintains only a marked block between `<!-- ptah:analysis:begin -->` and `<!-- ptah:analysis:end -->` in the root `CLAUDE.md` (`analysis-claude-md-linker.ts:1-8`).
- **Skills and roles:**
  - Skills are `SKILL.md` folders in `.claude/skills/` and `plugins/`.
  - A skill-enhancement pass proposes a diff, a judge scores it, and the user applies it (`README.md:145`).
  - Lane roles are `.claude/agents/<name>.md`, 64 KiB max (`CAR/roles/agent-role-resolver.service.ts:15`).
  - Harness sync fans skills, commands, agents and MCP entries to 7 targets (`SH/types/harness-sync.types.ts:20-28`).

## 8. Usage and limits visibility

- **Contract:** windows `five_hour | weekly | weekly_model | monthly | overage | other` (`SH/types/plan-limit.types.ts:40`). Each value carries a source (`provider-api`, `provider-unofficial`, `stream-event`, `error-derived`, `estimated`) and "a missing `used` is never 0" (`:1-35`).
- **Readers present:** claude, codex, antigravity, grok, kimi-code, ollama-cloud, opencode-go (`AUTH/quota/readers/`). No reader file for copilot, cursor or pi (UNVERIFIED that no other source exists). Owner snapshots cache 30 s (`AUTH/quota/plan-usage.service.ts:1-40`).
- **Lane states:** `unknown | near-limit | at-limit | confirmed-room` (`SH/utils/plan-limits/lane-state.ts:323-361`). Near-limit is 90% (`evidence-precedence.ts:11`); freshness 15 min (`:14`); per-lane lookup deadline 3 s, 12 s for Codex and Antigravity (`:17,24`).
- **Routing on limits:**
  - `ptah_agent_list` shows AT LIMIT (`tool-description.builder.ts:945-950`).
  - Spawn is refused for an at-limit, cooldown or 100%-window lane, and alternatives are listed (`agent-spawn-limit-gate.ts:1-10`).
  - `ptah_route_decide` drops at-limit lanes first, then orders by limit state inside a closeness band (`hard-constraints.ts:7-8`, `routing-constants.ts`).
- **Cost:** per-session budget with token or USD units (`session-budget.types.ts`); spend from chat, Codex turns and lanes is stored, tagged provider-reported, model-priced or unpriced (`README.md:106`).

## 9. Extensibility

- **Plugins:** `plugins/ptah-{core,angular,react,dotnet,nx-saas}`, installed from a GitHub-hosted content manifest (`content-manifest.json:6`); marketplace service with consent for external installs (`libs/backend/plugin-marketplace/src/index.ts`); skills.sh directory client (`CAR/skills-directory/`).
- **Custom providers:** user-defined entries on `anthropic` or `openai` lanes (`SH/providers/provider-registry.ts:451`); `ptah-cli` agents bind a provider to a name, tier mapping and effort (`SH/types/ptah-cli.types.ts:12-30`).
- **Roles, workflows, commands:** `.claude/agents` (14), `.claude/commands` (7), `.claude/workflows/fleet-fix.js`, `.claude/output-styles`.
- **Harness config:** one reconciler writes to claude, codex, copilot, cursor, antigravity, opencode, vscode(MCP) and quarantines blocked paths (`SH/types/harness-sync.types.ts:20-28`, `README.md:177`).
- **Gateways and schedules:** Telegram, Discord, Slack adapters (`libs/backend/messaging-gateway/src/lib/adapters/`); SQLite-backed cron (`libs/backend/cron-scheduler`).
- **ACP:** a further ACP agent needs a new vendor profile only (`ADP/acp/acp-vendor-profile.ts:1-4`).

## 10. Distribution and platforms

- **Channels:** Windows ships only through the Microsoft Store (MSIX/appx), with no NSIS installer in the release workflow; macOS dmg + zip and Linux AppImage + deb go to GitHub Releases, unsigned (`.github/workflows/publish-electron.yml:5-9`, `apps/ptah-electron/electron-builder.yml:138-205`). Auto-update service (`apps/ptah-electron/src/services/update/update-manager.ts`). Download at ptah.live (`README.md:13`).
- **From source:** `npm run electron:serve` (`README.md:246`). No VS Code Marketplace extension or CLI after 2026-11-02 (`git show 1cee6fafe`).
- **Bundled CLIs:** `@openai/codex` and `@github/copilot` per-OS packages are packaged and filtered by platform (`electron-builder.yml:138-180`); Codex detection records `installed` vs `bundled` (`SH/types/agent-process.types.ts:425`).
- **OS support:** Windows, macOS, Linux (`README.md:64`). Windows-specific handling: off-thread spawner, `.cmd` shim handling (`SDK/helpers/off-thread-process-spawner-source.ts`, `apps/ptah-docs/src/content/docs/agents/cli-agents.md:28`).

## 11. Clean differences candidates

1. **Ptah:** exposes one local HTTP MCP server (default port 51820) carrying `ptah_*` tools for agent lanes, sessions, memory, code index and browser, and writes it into the user's own CLI config files. (`mcp-http/http-server.handler.ts:38`, `ptah-mcp-slots.ts:1-30`)
2. **Ptah:** main chat runs on the Claude Agent SDK in-process or on the Codex app-server protocol; other vendors are reached by pointing the Claude SDK at a base URL or a local translation proxy. (`routing-agent-adapter.ts:38`, `translation-proxy-base.ts:1-25`)
3. **Ptah:** background lanes for eight vendor CLIs plus user-configured providers all implement one `CliAdapter.runSdk() -> SdkHandle` contract over different wire protocols (SDK, JSON-RPC app-server, ACP, JSONL, RPC). (`cli-adapter.interface.ts:264,311`, `agent-process.types.ts:81`)
4. **Ptah:** a lane's completion is a pushed `<agent-lane-completed>` turn whose verdict comes from declared deliverables checked on disk, not from the exit code. (`lane-completion-notifier.service.ts:1-40`, `agent-process.types.ts:621`)
5. **Ptah:** child chat sessions each get their own git worktree, branch and tab; default cap 3 children, 9 running tiles on the rail. (`session-spawner.service.ts:1-5`, `session-child-settings.ts:33-39`, `canvas-running-cap.ts:6`)
6. **Ptah:** reads plan windows (5-hour, weekly, ...) per vendor with a provenance label, refuses to spawn a lane at its limit, and excludes at-limit lanes from routing. (`plan-limit.types.ts:40`, `agent-spawn-limit-gate.ts:1-10`, `hard-constraints.ts:7-8`)
7. **Ptah:** multi-vendor panels (Council, Forge, Race, Crucible, Relay) ship as markdown skills run by the main agent as "Conductor", with no dedicated backend module. (`.claude/skills/tribunal/SKILL.md:9-52`)
8. **Ptah:** a routing pre-flight (`ptah_route_decide`) combines a decision-model call, a 90-day local outcome matrix and a hard rule that a reviewer cannot share the implementer's model family. (`route-decide.service.ts:1-8`, `hard-constraints.ts:53,128`)
9. **Ptah:** desktop-only (Electron 44) since 2026-11-02; the VS Code, CLI and TUI hosts were deleted. (`git show 1cee6fafe`)
10. **Ptah:** project memory is local SQLite (FTS5 + sqlite-vec, rank fusion), with a tree-sitter symbol index served through MCP tools. (`memory-search.service.ts:1-8`, `tool-description.builder.ts:1938-2002`)

## 12. Unknowns

- **History depth:** the local clone is shallow. GitHub shows `created_at` 2025-08-31 and 9,218 commits. Any earlier private or pre-GitHub history (the user's ~2 years) is UNVERIFIED.
- **Release state:** the newest tag and release is `electron-v0.1.70` (2026-09-04), but the app `package.json` is 2.0.0 and `README.md` has a "What's new in v2" section. Whether a v2 build is published is UNVERIFIED.
- **Auth details:** how the Copilot and Antigravity lanes authenticate is UNVERIFIED (the adapters handle no credential; reliance on each CLI's own login is inferred).
- **Plan-limit coverage:** whether copilot, cursor and pi have any limit source is UNVERIFIED (no reader file found).
- **Stdio MCP server:** `MCP/mcp-stdio/` still exists (a `ptah mcp-serve` transport), but the CLI host that launched it was removed. Whether anything launches it today is UNVERIFIED.
- **Doc vs code drift:** `PRODUCT.md`, the GitHub description, `README.md:78` (ACP steer) and the docs concurrency page (max 20; skill default three) disagree with the code cited above. Code values are used here.
- **Not run:** nothing was built or executed, so which lanes are installed or at limit on a real machine is UNVERIFIED. The shipped embedding model, the curator LLM choice and any use of `@openai/codex-sdk` (declared at `package.json:92`, no `.ts` import found) were not traced.
