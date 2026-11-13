# Ptah agent permissions, attribution, MCP and UI integration

Investigate and fix all agent integration issues below in the Ptah workspace: permission persistence and propagation, approval routing, Codex app-server caller attribution, lane MCP/reporting, and native subagent UI visibility. Do not modify nx-video scene code for this investigation. Diagnose independently before combining root causes.

## Comparison

- D:/projects/nx-video uses Codex app-server as the main orchestrator.
- User reports D:/projects/ptah-extension also has CLI permission settings reverting to Plan, but CLI lanes and MCP connections work there.
- Treat permission persistence, caller attribution, and MCP handshake as potentially separate bugs. App-server causality is a hypothesis until traced.

## Reproduced evidence

1. Parent Ptah MCP discovery, spawn, read, wait, and session-status tools work.
2. Fresh Codex lane requested permission:auto-edit but reported sandbox=read-only, approval=never, mode=Default, no supplied writable roots. Write failed: `patch rejected: writing is blocked by read-only sandbox; rejected by user approval settings`. Node command succeeded. Ptah MCP handshake timed out; report tool unavailable. Agent 3e4ede99-01ec-41c5-b551-a7d7cda3b3ef; CLI session 01a1d4bc-6bb5-7612-acf9-7b4243e17078.
3. Fresh Claude API lane requested permission:auto-edit but entered Plan mode. Node command succeeded; file creation/editing was prohibited. MCP connected, but report failed: `Cannot call mcp__ptah__ptah_agent_report while in plan mode.` Agent 21d61bd9-c97c-4d29-89e6-1f6f4d5c5486; CLI session 83767720-80e6-44b5-8a7f-7cb2483ed201.
4. Parent child-session launch failed: `ptah_session_start refused (unattributed-caller): ptah_session_start must be called from a live chat session; this caller has no live session id`.
5. Both CLI probe files independently confirmed missing, both report counts zero. Exit code 0 was not successful completion.
6. Native collaboration subagent subsequently passed create/read/edit/reread and command execution in the desert worktree. Its collaboration.send_message reached the parent, which independently read the probe file. This does not prove ptah_agent_report works for native agents.
7. Native vortex subagent also passed its file and command probes and sent a native parent message. User reports these Codex native subagents do NOT appear in the Ptah UI as Claude subagents do, despite executing successfully. Native tasks include /root/native_permission_probe, /root/native_vortex and /root/workspace_review. This is a UI integration/observability failure, not evidence that the agents failed to execute.
8. Parent read/wait tools worked and completion notices eventually arrived with verdict=no-deliverable and report count zero. Some notices arrived after the parent had already read and recorded completion. Treat delayed/replayed notices as lifecycle reconciliation cases; their timing alone does not prove an additional defect. Direct reports did not arrive; completion notices are not a substitute for them.

## Investigation

- Trace settings UI persistence and workspace/session/provider override precedence; identify why modes revert to Plan.
- Trace spawn schema through resolved permissions to actual adapter invocation/SDK options, sandbox, approval policy, plan-mode instructions and writable roots. Identify ignored/overwritten explicit arguments and expose legitimate parent-policy conflicts clearly.
- Trace app-server tool dispatch through authenticated caller/session identity, MCP context, child-session creation and lane parent association.
- Diagnose Codex lane MCP startup/handshake and parent report delivery separately from Claude plan-mode restrictions.
- Trace approval requests to the correct session UI. Required approvals must surface; Plan-mode prohibitions must be explicit rather than silently misrouted.
- Distinguish intentional Plan restrictions from approval-needed actions. Users report they cannot see or route permission requests while agents are stuck in Plan. Verify whether a request is generated at all before diagnosing delivery; provide an explicit blocked state and supported mode-change path rather than pretending a request is pending.
- Trace native Codex subagent spawn, parent/child identifiers, running/tool/message/completion events through the app-server event adapter, backend state, session store and UI subscriptions. Compare with the working Claude subagent path. Use stable IDs and preserve parent association across reconnects, follow-up turns and reloads; do not infer lifecycle only from prose.
- Bring native Codex agents into the same existing UI surfaces used for Claude subagents: live status, parent linkage, available transcript/tool activity, messages, completion/failure and available controls. Populate usage only when supported by real runtime data; show unknown rather than invented values. Do not add fake lane records to disguise missing native integration.
- Verify completion semantics and deduplication. Clean process exit must remain distinct from missing deliverables, failed permissions or failed reporting. A delayed completion should reconcile with the existing agent, not create duplicate agents or trigger duplicate work. Preserve the existing no-deliverable verdict behavior, which correctly exposed these failures.
- Compare equivalent small probes under both runtimes/workspaces. Collect sanitized diagnostics without credentials or tokens.

## Acceptance

- Selected permissions persist after reload and fresh spawn and match effective runtime behavior.
- Authorized create/read/edit/reread and command probes pass in the intended worktree.
- Restricted modes remain restricted and refusals are explicit; denial is honored.
- Approval requests reach the correct UI.
- An app-server parent can start a child session with properly authenticated identity.
- Reports from supported child/lane paths demonstrably arrive at the real parent.
- MCP handshake has separate regression coverage.
- Native Codex subagents are visible while running in the same UI workflow as Claude subagents; their parent, activity, messages and terminal state remain correct across follow-up turns and reconnect/reload. Unsupported controls or metrics are explicit, not fabricated.
- Completion notices are deduplicated and reconcile correctly when the parent has already read the result; exit zero cannot mask missing deliverables or delivery failure.
- Add meaningful tests for settings precedence, adapter mapping, caller attribution, report/approval routing and native subagent lifecycle/UI integration. Include actual UI verification for the visibility and approval-routing fixes, not only backend unit tests.

## Verification matrix and deliverables

Exercise the available orchestrator runtimes against Codex CLI, Claude API CLI, child chat sessions and native subagents. Test Plan, Ask and Auto-edit where supported; test explicit spawn overrides and inherited defaults, workspace changes, reloads and fresh launches. Record unsupported combinations honestly. Compare nx-video and ptah-extension without printing secrets or making intrusive changes in the video workspace.

Produce a root-cause-to-fix map for each issue, regression tests, sanitized requested-versus-effective permission evidence, actual parent report receipt evidence and UI evidence for native agents/approval requests. Record remaining limitations explicitly. Do not label the entire system fixed because a Node command or one provider succeeds.

Do not weaken security, spoof session identity, globally force YOLO or bypass permission denials. Preserve all existing work. Never stop processes by name; only your own PID. Evidence is in adjacent HANDOFF.md and context.md. Diagnose and implement in D:/projects/ptah-extension, not this video repository.
