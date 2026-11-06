# Ptah and T3 Code: how each works with many coding agents

Neutral comparison, not a ranking. Sources, with `path:line` evidence:
`research/ptah.md` (PtahCode `589cd0d`, 2026-11-05) and `research/t3code.md`
(t3code `132be33`, 2026-11-05). Nothing from either repository was run.

## The one-line version

**T3 Code gives every agent its own seat at the table. Ptah gives one agent the
gavel.**

T3 Code describes itself as "not a harness": each thread is one vendor's own
agent (Codex, Claude, Cursor, OpenCode, …), all equal peers, and you pick who
talks. Ptah puts a main agent in the chair (Claude Agent SDK or Codex) and that
agent runs the others as background lanes, panels and reviews.

## Shared plumbing (they converged)

| Vendor | Both connect the same way |
| --- | --- |
| Codex | spawned `codex app-server`, JSON-RPC |
| Claude | Claude Agent SDK `query()` |
| Cursor | `@cursor/sdk` |
| Grok | ACP (`grok agent … stdio`) |
| Pi | `pi --mode rpc` |

Both also run a local HTTP MCP server, inject it into every agent session, and
let the model delegate across vendors through it. Both read vendor plan windows
(5-hour, weekly). Both are TypeScript, MIT and ship on Electron 44.

## Clean differences

| | T3 Code | Ptah |
| --- | --- | --- |
| Who's in the chair | You. One agent per thread, every provider a first-class peer | A main agent (the "Conductor"), with other vendors as lanes it spawns |
| Cross-vendor delegation | `delegate_task` creates a full child thread on another provider; the child gets only the task prompt | `ptah_agent_spawn` starts a background lane with declared deliverables; completion is pushed back with a verdict checked on disk |
| Multi-agent patterns | Ad-hoc delegation; no user-defined panel or workflow format found | Named workflows as skills: Tribunal (Council, Forge, Race, Crucible, Relay) and phased orchestration with gates |
| Review rule | None found | A reviewer may not share the implementer's model family (hard routing rule) |
| Choosing who gets the job | The parent model picks from a capability list (installed, enabled, signed in, models); an explicit target is honoured or fails — "never switch unasked" | `ptah_route_decide`: hard rules (limit, family, never-on-a-lane) → score from a 90-day local outcome matrix → rotate within a 5-point band → optional small decision model picks among the top 4 |
| Learning from results | Not found at runtime; offline, human-run evals of instruction text | Every lane run is recorded automatically (deliverables checked on disk, review verdicts) and feeds future routing; skills improve by a manual Enhance (proposal → judge → apply → revert); memory is curated automatically |
| Data model | One event-sourced SQLite graph (thread → run → execution node); threads outlive processes; switch provider mid-thread via a budgeted handoff | Two stream models (chat events, lane segments); Claude transcripts stay in Claude's own files, Ptah keeps metadata |
| Other models | Only via each vendor's own agent runtime | Also by pointing the Claude SDK at Anthropic-compatible endpoints or a local translation proxy (OpenRouter, Z.ai, Kimi, Copilot, Ollama, LM Studio…) |
| Permissions | Modes mapped to each provider's native approval and sandbox; a mode the provider lacks isn't offered; default Full access | ask / auto-edit / yolo / plan for chat; lanes run under a fixed lane policy. Since PR #949 (merged after the research SHA), a visible Codex sandbox setting (read-only → full access, default full access) covers chat, gateway and lanes |
| Follow-ups while busy | Messages queue behind active work, or steer if the adapter supports it | Since PR #950 (open): a backend-owned follow-up queue per session; Codex can "Send now" via `turn/steer`. PR #949 added `delivery: 'steer'` for Codex lanes |
| Limits | Usage and cost pages, windows pooled across accounts | Limits drive decisions: an at-limit lane can't be spawned, routing goes around it |
| Memory and context | Left to each provider (CLAUDE.md, rules, skills) | Owns local memory (BM25 + vectors), a tree-sitter code index, a setup wizard that generates agents, and syncs skills/MCP into 7 CLIs' configs |
| Where it runs | A server with thin clients: web, desktop, iOS, Android; remote via Tailscale, SSH or relay | One desktop app; chat gateways for Telegram, Discord, Slack. In progress: remote workers (PR #928, draft — headless worker host with pairing, tokens and an authorizer) |
| Git | Hidden-ref checkpoints, per-turn diffs, commit → push → PR across 6 forges | Git dock; child sessions in their own worktrees; the user owns merge |
| Pull-request review | A PR workspace for people: browse PRs and comments, request reviewers, merge, AI-written titles and descriptions; `t3 triage` opens Claude Code or Codex with a triage prompt | ptah-review (PRs #924, #935, #946, merged 2026-11-04/05): an automated, CodeRabbit-like reviewer that runs on your machine with your own CLI agents — polls GitHub repos on a schedule, checks out the exact head SHA, runs triage → 4 lens lanes → a verifier, keeps finding identities across pushes, reviews only what changed, dry-run by default; live posting needs a bot token, a verified identity and a maintainer attestation |
| Project | Created 2026-02; ~48k stars; ~477 contributors; nightlies daily; mostly not taking contributions | Created on GitHub 2025-08; ~9.2k commits; 64 releases; Microsoft Store for Windows |

## Worth fixing before outreach (Ptah side)

- The GitHub description and `PRODUCT.md` still say VS Code + CLI + desktop;
  those hosts were removed on 2026-11-02.
- `README.md:78` says ACP lanes can be steered mid-turn; the Grok adapter
  declares `steer: false`.
- The newest public release is `electron-v0.1.70` (2026-09-04) while the app is
  2.0.0 and the README has "What's new in v2".
- Plan-limit readers exist for Claude, Codex, Antigravity, Grok, Kimi, Ollama
  Cloud and OpenCode Go, but not Copilot, Cursor or Pi.
