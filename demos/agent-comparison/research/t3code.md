# T3 Code - how it talks to and orchestrates coding-agent providers

**Read at:** `pingdotgg/t3code` `main`, commit `132be33afffac9b98891b56845bf6aa3e8d55172` (committed 2026-11-05T14:19:51-06:00), shallow clone, read-only, nothing executed. Metadata via `gh api` on 2026-11-05. All `path:line` cites are at that SHA. Anything marked UNVERIFIED was not confirmed in code or docs.

## 1. Identity

- **Own words:** "an 'agent harness control surface'" (`README.md:3`). The FAQ says it is not a harness: "T3 Code uses those harnesses. It is not a harness, and it does not work without one." (`docs/user/faq.md:3`)
- **Form factor:** a Node server (`t3` CLI) that owns providers, terminals, git and files. Web, Electron desktop and Expo/React Native mobile clients control it over authenticated RPC. The desktop app bundles a server. (`docs/internals/overview.md:1-14`, `README.md:3`)
- **Stack:** TypeScript on the Effect library (`apps/server/package.json:64`). React with TanStack Router (`apps/web/package.json:41,78`). Electron 44.10.1 (`apps/desktop/package.json:25`). Expo 58 / React Native 0.88 (`apps/mobile/package.json:82`). SQLite (`apps/server/src/persistence/Sqlite.ts:1-20`). pnpm monorepo (`package.json:70`). Server needs Node `^22.16 || ^23.11 || >=24.10` (`apps/server/package.json:100`). Also a Rust resource monitor (`native/`) and a Cloudflare relay (`infra/relay`, `docs/internals/t3-connect.md:1-10`).
- **Licence:** MIT (`LICENSE:1`; API `license.spdx_id`).
- **Repo (GitHub API, 2026-11-05):** created 2026-02-08; 48,083 stars; 9,591 forks; about 477 contributors (from the contributors `Link` page count); about 9,466 commits on `main`; 784 release tags including nightlies.
- **Cadence:** stable v0.1.7 on 2026-11-04, v0.1.6 on 10-31, v0.1.5 and v0.1.4 on 10-29, v0.1.3 on 10-27, v0.1.0 on 10-15. Nightlies ship several times a day (for example `v0.1.8-nightly.20261105.4234`).
- **Contribution stance:** "(mostly) not accepting contributions yet" (`README.md`, "Some notes").

## 2. Providers and how each is connected

Built-in drivers: `apps/server/src/provider/builtInDrivers.ts:33-45`. Every driver wraps the user's own agent install or SDK. T3 does not call any model API directly (`docs/user/faq.md:3`).

| Provider | Transport | Auth | Code |
|---|---|---|---|
| Codex | Spawns `codex app-server`; JSON-RPC over stdio via an in-repo client | User's `codex login`, or a T3-run ChatGPT OAuth sign-in | `apps/server/src/provider/codexLaunchArgs.ts:12`; `packages/effect-codex-app-server/src/client.ts:305-336`; `apps/server/src/provider/CodexChatGptAuth.ts:41`; `docs/user/providers-codex.md:5-22` |
| Claude | `@anthropic-ai/claude-agent-sdk` `query()`, which spawns the Claude Code executable | Claude Code's own login and `CLAUDE_CONFIG_DIR`; API keys or endpoints via instance env vars | `apps/server/package.json:37`; `ClaudeAdapterV2.ts:1199-1216,1277,4897`; `docs/user/providers-claude.md:3,19-36` |
| Cursor | `@cursor/sdk` 1.2.0, local-agent runtime (not ACP) | Browser sign-in through T3, or `CURSOR_API_KEY`; paid plan | `packages/provider-cursor/package.json:52`; `docs/user/cursor.md:3-14,32-36` |
| Grok Build | ACP: `grok agent stdio` plus an xAI extension | `grok login` | `packages/provider-grok/src/server/acpSupport.ts:50-68`; `README.md:21` |
| fx | ACP: `fx acp` | `fx login` on the server host | `packages/provider-fx/src/server/acpSupport.ts:230`; `docs/user/providers-fx.md:1-12` |
| Kiro | ACP: `kiro-cli acp --agent-engine=v3 --auth-method=cli` | `kiro-cli login` or `KIRO_API_KEY` | `packages/provider-kiro/src/server/acpSupport.ts:23`; `docs/user/providers-kiro.md:6-12` |
| OpenCode | Spawns `opencode serve`; HTTP via `@opencode-ai/sdk`; 1.x and 2.x runtimes | `opencode auth login` | `packages/provider-opencode/src/server/OpenCodeRuntime.ts:481,513`; `docs/internals/providers.md:12-30` |
| Pi | `pi --mode rpc` with a T3 MCP extension; line-delimited JSON frames | Pi's own `/login` or API key | `packages/provider-pi/src/server/mcpInjection.ts:266-267`; `rpc.ts:1`; `docs/user/providers-pi.md:1-12` |
| Muse Code | `@muse-code/sdk` spawns the `muse` binary (`spawnMspConnection`) | `muse login` or `META_API_KEY` | `packages/provider-muse/src/server/sdk.ts:7-11,172`; `docs/user/providers-muse.md:1-20` |
| Antigravity | Google's ACP agent, installed and versioned by T3 | Google sign-in run by T3; also Gemini Enterprise, Gemini API key, Vertex | `apps/server/src/provider/AntigravityInstallation.ts`; `docs/user/providers-antigravity.md:3-45` |
| ACP Registry / local ACP command | Generic ACP (v2 preview, v1 fallback) | The agent's own | `docs/user/providers-acp.md:1-20,33` |

## 3. The unifying layer

- **Adapter contract:** `ProviderAdapterV2` has `openSession` and `getCapabilities`. Its session runtime exposes `ensureThread`, `resumeThread`, `startTurn`, `steerTurn`, `interruptTurn`, `respondToRuntimeRequest`, `readThreadSnapshot`, `rollbackThread` and `forkThread` (`packages/provider-core/src/server/ProviderAdapter.ts:607-713`).
- **Normalised events:** one `ProviderAdapterV2Event` union (`ProviderAdapter.ts:83-183`). Members include `provider_session.updated`, `provider_thread.updated`, `provider_turn.updated`, `node.updated`, `subagent.updated`, `message.updated`, `turn_item.updated`, `command_output.delta`, `runtime_request.updated`, `plan.updated` and `turn.terminal`.
- **Schemas:** `packages/contracts/src/orchestrationV2.ts` (4,341 lines). `OrchestrationV2TurnItem` (`:1597-1822`) kinds include `assistant_message`, `reasoning`, `command_execution`, `file_change`, `approval_request`, `user_input_request`, `proposed_plan`, `todo_list`, `checkpoint`, `compaction`, `handoff`, `fork`, `subagent` and `dynamic_tool`.
- **Graph:** AppThread, then Run, then an ExecutionNode tree, with ProviderThread and ProviderSession as native handles (`docs/orchestration-v2/core-graph-and-data-model.md:5-18`). "App ids are primary. Provider ids are refs." Provider events are never rewritten to look like another provider's (`docs/orchestration-v2/README.md:33-34`).
- **Raw frames:** diagnostic logs only, with a 64 KiB payload budget (`docs/internals/providers.md:151-157`). Only the normalised events are durable (`docs/orchestration-v2/core-graph-and-data-model.md`).
- **Capabilities:** `OrchestrationV2ProviderCapabilities` (`orchestrationV2.ts:381-398`) covers sessions, threads, turns, streaming, tools, approvals, planning, subagents, context, checkpointing, identity and `runtimePolicy.enforcement: native | client-boundary` (`:367`). Orchestration reads capabilities, never the driver kind (`docs/internals/adding-a-provider.md:10-20`).
- **Lost or provider-specific:**
  - Antigravity can checkpoint files but cannot roll back its conversation (`docs/internals/providers.md:131`).
  - Codex diffs are derived from T3 checkpoints, not Codex's own diff events (`providers.md:161`).
  - ACP has no native subagents or steering, so T3 emulates them with child threads and cancel-and-restart (`docs/orchestration-v2/orchestrator-mcp-server.md:116-121`).
  - Cursor's projected child tasks are read-only (`docs/user/cursor.md:66-70`).
  - Provider switches do not carry reasoning, tool-call state or attachments (`docs/user/portable-handoffs.md:12`).

## 4. Sessions and workspaces

- **Thread:** the durable conversation. It survives provider process exit. A session is the provider runtime attached to it (`docs/internals/glossary.md`).
- **Persistence:** event-sourced SQLite. The orchestrator decides events with no I/O. `EventSink` commits events, projections, the command receipt and outbox effects in one transaction. Effect workers run side effects afterwards (`docs/internals/overview.md:46-60`). Roughly one day of event history is kept for replay (`overview.md:62-64`).
- **Resume:**
  - Provider sessions go idle after a default 30 minutes (`apps/server/src/orchestration-v2/ProviderSessionManager.ts:57`).
  - Native resume is used where possible.
  - Otherwise T3 rebuilds context from a portable handoff (`docs/orchestration-v2/README.md:81`).
  - A thread can switch provider between runs (`docs/orchestration-v2/provider-switching-and-context.md:1-35`).
- **Workspaces:** launch strategies are `root`, `existing_worktree` and `worktree` with a base ref (`ThreadLaunchService.ts:57-69`). Worktrees live under the T3 home `worktrees` folder, with configurable branch naming and auto-cleanup (`docs/user/project-settings.md:65-75,196-216`). Per-project setup scripts run via `t3.json` (`t3.json:4-10`).
- **Checkpoints:** hidden Git refs, not commits on the user's branch (`docs/internals/overview.md:88-90`).
- **Parallelism:** many threads and provider sessions run at once, and I found no hard cap in `ProviderSessionManager.ts`, only idle timeouts (UNVERIFIED that none exists). Within one thread, messages queue behind active work or steer if the adapter supports it (`docs/internals/providers.md:118-120`).
- **Server and client:** the server owns providers, terminals, git and files. Clients connect over HTTP and WebSocket by direct address, Tailscale, SSH or T3 Connect (`docs/internals/remote.md:1-8`).

## 5. Orchestration

- **Default:** one agent per thread, and the user drives. Subagents the provider spawns itself (for example Claude `Agent`, Codex `spawn_agent`) are projected as `subagent` entities (`orchestrationV2.ts:886`; `docs/internals/adding-a-provider.md`, "Subagents outlive the run").
- **Cross-vendor delegation, driven by a model:** T3 runs an authenticated HTTP MCP endpoint at `http://127.0.0.1:<port>/mcp`, server key `t3-code`. It is injected into each provider session with a per-session token (`docs/orchestration-v2/orchestrator-mcp-server.md:35-60`).
  - **Tools:** `orchestrator_capabilities`, `delegate_task`, `task_status`, `task_cancel`, `t3_thread_list/read/send/wait/interrupt`, `create_threads`, `schedule_task` and `t3_environment_link` (`apps/server/src/mcp/toolkits/orchestrator/tools.ts:72-338`).
  - **`delegate_task`:** takes `target{providerInstanceId|driverKind|model}`, `role` (implementation, research, review, design, test or general) and `mode` async or wait (`orchestrator-mcp-server.md`, "delegate_task"). It creates a child T3 thread on any supported provider. The child gets only the task prompt, not the parent history (`:18-21`). The decider is `Orchestrator.ts:7907-7990`.
  - **Coverage:** Codex, Claude, Cursor, Grok, ACP agents, OpenCode, Pi and Antigravity (`orchestrator-mcp-server.md:189-196`).
- **Who coordinates:** the parent agent calls these tools. T3 injects instructions saying to use native subagents for same-provider children and `delegate_task` for another provider (`packages/provider-core/src/server/orchestrationInstructions.ts:4-14`). Users can also schedule tasks. I found no user-defined panel, review-loop or workflow definition format (UNVERIFIED that none exists).
- **Cross-machine:** agents can link and act on other environments (`orchestrationInstructions.ts`, `tools.ts:310-338`).
- **MCP server:** yes, for providers and for outside agents. Outside agents default to read-only (`docs/user/outside-agents.md:3-50`).
- **MCP client:** T3 injects its own server into each provider. User-configured MCP servers stay with the provider (`docs/user/cursor.md:18-26`). T3 renders MCP Apps results for Codex and Claude (`docs/user/html-renders.md:13`).

## 6. Control and safety

- **Modes:** `approval-required` (Supervised), `auto-accept-edits`, `auto` and `full-access`, plus interaction mode `default | plan` (`packages/contracts/src/providerPolicy.ts:25-47`). The default is Full access (`docs/user/permission-modes.md:10`).
- **Native mapping, not emulation:** Codex gets approval and sandbox policy per mode, for example `untrusted`+`readOnly` through `never`+`dangerFullAccess` (`CodexAdapterV2.ts:717-757`). Claude gets SDK `permissionMode` values (`ClaudeAdapterV2.ts:2799-2830`). A provider that lacks a mode simply does not offer it. Muse offers two modes and fx offers neither Auto-accept edits nor Full access (`permission-modes.md:30-40`; `docs/internals/adding-a-provider.md:20-26`).
- **Sandboxing:** the provider's own. Managed policy "is not a sandbox" (`docs/user/managed-policy.md:210`). Registry agents use their own sandbox (`docs/user/providers-acp.md:111`). The Cursor SDK has no filesystem sandbox on Windows (`docs/user/cursor.md:73-77`). An admin can cap modes and providers per machine (`managed-policy.md:1-12`).
- **Diff review:** per-turn diffs from checkpoints, branch comparison, per-commit view and restore (`docs/user/source-control.md:5-20`).
- **Git and PR flow:** stacked actions `commit`, `commit_push` and `commit_push_pr` (`packages/contracts/src/git.ts:18-25`). Forges are GitHub, GitLab, Forgejo/Gitea, Bitbucket, Azure DevOps and GitCafe (`source-control.md:3-4`). Threads link to PRs, and a server-side reactor settles threads on merge or inactivity (`overview.md:93-105`).

## 7. Context and memory

- No T3-owned project-memory or rules store found. Rules, skills and agents files are the provider's: Claude `settingSources` user/project/local (`ClaudeAdapterV2.ts:4897`), Pi context files (`docs/user/providers-pi.md:1-4`), Kiro steering and custom agents (`providers-kiro.md:3-4`).
- `$` and `/` list skills from the selected provider and environment (`docs/user/composer.md:248-252`).
- T3 adds first-turn orchestration instructions (`orchestrationInstructions.ts:4-14`; `orchestrator-mcp-server.md:176`) and `/goal` for Codex and Claude (`composer.md:281-297`).
- Context management: `/compact`, `/clear`, and a handoff budget of 16,000 tokens by default (`docs/user/portable-handoffs.md`). Agents can read saved threads via `t3_thread_read` (`portable-handoffs.md:15`).

## 8. Usage and limits visibility

- **Usage page:** tokens, cache savings and model breakdown, plus estimated API-equivalent cost from each provider's own session history, across environments. Prices are editable (`docs/user/usage.md:1-30,70-95`).
- **Limits:** subscription windows (5-hour, weekly, monthly) pooled per provider across accounts, with reset times and banked reset credits (`usage.md:115-140`). Sources include Claude SDK `rate_limits` (`apps/server/src/provider/claudeUsageLimits.ts:84-190`) and Codex `rateLimits` (`codexUsageLimits.ts:118-126`). Usage readers are registered at `builtInDrivers.ts:58-69`.
- **Hitting a limit:** quota errors are classed `usage_limit` with a reset time. The thread shows Limited and can resume (`docs/internals/adding-a-provider.md:98`).

## 9. Extensibility

- Multiple provider instances per driver, each with its own account and env (`docs/internals/providers.md:7-10`). Custom models (`composer.md:98`). Add ACP agents from the Registry or a local ACP command (`providers-acp.md:22-36`).
- New drivers are in-repo `packages/provider-<name>` packages registered in a static array (`adding-a-provider.md`, "Where a driver plugs in"; `builtInDrivers.ts:33-45`). I found no third-party plugin loader (UNVERIFIED).
- Other surfaces: `t3.json` scripts, `settings.json` in `~/.t3/userdata` (`usage.md:94`), managed policy, themes, keybindings. Separate secret-provider and source-control packages exist (`packages/`).

## 10. Distribution and platforms

- **CLI:** `curl -fsSL https://t3.codes/install.sh | sh`, `irm https://t3.codes/install.ps1 | iex`, or `npx t3@latest` (`README.md`, "Command line"). `t3 service install` runs it as a background service.
- **Desktop:** GitHub Releases, winget, scoop, Homebrew cask, `.deb`, AUR and Nix (`README.md`; `docs/user/install.md:64-80`). Build targets are macOS dmg arm64/x64, Linux AppImage and Windows nsis x64/arm64 (`package.json:47-54`). No `t3` binary for Intel Macs (`install.md:49-52`).
- **Web and mobile:** web app at `app.t3.codes`, iOS and Android apps (`README.md:3`).
- **T3 Connect relay:** free for up to 3 machines per account (`faq.md:28`).
- **Telemetry:** on by default, off with `T3CODE_TELEMETRY_ENABLED=false` (`docs/user/telemetry.md:1-17`).

## 11. Clean differences candidates

1. **T3 Code:** drives only other vendors' agent runtimes (CLIs and SDKs), and has no agent loop or model client of its own. (`docs/user/faq.md:3`)
2. **T3 Code:** each provider is a driver with its own transport. Codex uses JSON-RPC app-server, Claude uses the Agent SDK, Cursor and Muse use SDKs, Grok, fx, Kiro and Antigravity use ACP, OpenCode uses an HTTP server and Pi uses RPC. (`builtInDrivers.ts:33-45`; section 2)
3. **T3 Code:** normalises all providers into one app-owned event-sourced graph (AppThread, Run, ExecutionNode) in SQLite, and keeps raw frames only as bounded logs. (`docs/orchestration-v2/core-graph-and-data-model.md`; `overview.md:46-60`)
4. **T3 Code:** features are gated by per-adapter capability flags, and a missing capability falls back to a policy such as portable handoff or cancel-and-restart. (`orchestrationV2.ts:381-398`; `orchestrator-mcp-server.md:116-121`)
5. **T3 Code:** an agent delegates to another vendor by calling the `delegate_task` MCP tool, which creates a child thread that receives only the task prompt. (`tools.ts:86`; `orchestrator-mcp-server.md:18-21`)
6. **T3 Code:** permission modes are mapped to each provider's native approval and sandbox settings, and a mode the provider lacks is not offered. (`CodexAdapterV2.ts:717-757`; `adding-a-provider.md:20-26`)
7. **T3 Code:** switching provider mid-thread uses a budgeted context handoff, with no reasoning or tool state carried over. (`portable-handoffs.md:1-20`; `provider-switching-and-context.md`)
8. **T3 Code:** the user's own subscription logins and configs are the credentials. T3 only runs the sign-in flow itself for Codex ChatGPT, Cursor and Antigravity. (`README.md:18-24`; section 2)
9. **T3 Code:** the server holds all execution and state, and web, desktop and mobile are thin clients over RPC, with remote access via Tailscale, SSH or a relay. (`overview.md:1-14`; `remote.md:1-8`)
10. **T3 Code:** usage and limit windows are read from each provider's own history or API and pooled across accounts. T3 holds no budget of its own. (`usage.md:115-140`)

## 12. Unknowns

- Whether any hard cap on concurrent provider sessions exists beyond idle timeouts. I read only `ProviderSessionManager.ts` partially.
- Whether a user-defined multi-agent workflow, panel or review-loop mechanism exists. None found, and `workflow` in the code refers to Claude's native Workflow tool progress.
- Whether a third-party plugin API exists beyond ACP and in-repo drivers.
- Muse's underlying protocol ("MSP") was not read beyond the SDK import.
- Contributor and commit counts come from API pagination headers, not an exact list.
- The docs describe the V2 orchestrator as current. `docs/orchestration-v2/README.md` still calls itself a "target architecture", though the code under `apps/server/src/orchestration-v2/` implements it (for example `Orchestrator.ts:7907`).
- Nothing was run, so runtime behaviour, UI and performance claims are untested.
