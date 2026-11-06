# Routing and learning: Ptah vs T3 Code

**Read at:** Ptah `589cd0d938bf92379e4e5287ceb04a4003d4b932` (`main`, merge of PR #945, committed 2026-11-05T17:58:35+02:00, read 2026-11-05). T3 Code `132be33afffac9b98891b56845bf6aa3e8d55172` (2026-11-05). Nothing was run, built or installed. Describes code as it is today.
**Path keys:** `LR` = `libs/backend/lane-routing/src/lib`, `LO` = `libs/backend/lane-outcomes/src/lib`, `SS` = `libs/backend/skill-synthesis/src/lib`, `MC` = `libs/backend/memory-curator/src/lib`, `SK` = `.claude/skills`. T3 paths are relative to its clone root.
**PRs (gh, read-only):** merged: #731 decision-model routing (10-16), #740 Ollama Cloud/custom endpoint (10-18), #746 skills wiring, #788 skill-synthesis pipeline purged (10-20), #865 lanes become a delegation option (10-31), #870 + #872 learning integrity and host-side routing (10-31), #876 decision timeout setting (11-01). Open PRs: #950, #940, #928, none touch routing or learning. The picture changed on 10-20 (auto skill learning gone) and 10-31 (host pre-flight, failed runs now recorded).

## 1. Routing pipeline end to end

Default state: decision model is `unset` (`LR/decision-model/decision-model.config.ts:193-195`), so no model is called. Routing is then a deterministic filter, score and rotation, and host routing is off (`LR/scope/host-routing-setting.ts:24-36`).

**Inputs.** The calling LLM supplies `request` (≤8000 chars), `taskType`, `depth`, `phases[{id, kind (10 kinds), role?, reviews?}]`, `pins[{phaseId, executor, model?}]`, `preferences.prefer[]` + `preferenceSource` (`LR/contracts/route-decide-args.schema.ts:4-57`). The host gathers lane rows (installed, disabled, family, `preferredRank`), limit states (missing = `unknown`, `LR/ranking/candidate.types.ts:65-73`), subagent roles, per-lane model lists (2 s race each), the capability matrix, rotation state (`LR/pipeline/gather.ts:67-104`).

```
request+phases+pins -> gather -> constrain -> score -> spread(rotate) -> [decision model] -> roster
                       rows,      hard rules   matrix   band 5, limit    <=2 requests,      chosen|unavailable,
                       limits,    (pin kept    cell     class, tie-break, pick among top 4   reason, source,
                       matrix     or refused)  0-100    last-pick+1       or fall back       confidence
```

**Hard constraints** (`LR/ranking/hard-constraints.ts`): `at-limit` (:148), `disabled` (:151), `not-installed` (:154), `never-on-a-lane` for phase kinds `visual-review` and `design` (:47-50, 157), `reviewer-family` (:161; a `review`/`document-review` phase excludes the families of the implement phases it covers, computed in a second pass once implementers are chosen, :123-140; `route-decide.service.ts:218-246`), `not-listed` (pin names no single candidate, :263-273). Subagents face only `reviewer-family` (:8-9). All subagents share family `claude` (`libs/shared/src/lib/utils/lane-family.ts:23`), the same as a `claude` CLI lane. A pin that breaks a rule gives `pin-unavailable`; "another candidate is never substituted" (:18-20, 274-282). `pruned` is a later cut to the top options (`LR/pipeline/assemble-gate.ts:217-227`).

**Scoring.** No weights. Score = integer matrix cell for (family, model, taskKind), 50 when unknown (`LR/ranking/score.ts:92-117`; `LR/routing-constants.ts:17-21`). Layer order user > local > seed (`LR/matrix/capability-matrix.store.ts:31-34, 400-461`). A listed model is used only if its own cell beats the family cell by more than 5; else the configured model; else `lane-default` (`score.ts:119-162`). Phase to kind: architecture to `plan`, `design` to `docs`, `visual-review` to `review` (`LR/pipeline/phase-plan.ts:351-374`). Local cell: `round(100*(s + 10*prior/100)/(n+10))` per rate, prior = same-cell seed else 50 (`routing-constants.ts:160-166`; `LR/matrix/local-derivation.ts:361-377`). Hand-computed, not run: one success gives 55, two give 58; one failure gives 45, two give 42.

**Spread** (`LR/ranking/spread.ts:68-120`): band = every eligible candidate within 5 of the top (`routing-constants.ts:36`); keep the best limit class (confirmed-room, unknown, near-limit; subagents join the best class, :166-192); order by `prefer[]`, `preferredRank`, lane before subagent, id (:206-218); **pick = the entry after the last pick for this `phaseId|taskKind`, cyclically** (:97-105, :122-149). Rotation state is global storage, 200 keys (`routing-constants.ts:84-88`), written on every call (`route-decide.service.ts:310-333`).

**Decision model.** It sees the request text and, per phase, "Choose the executor for this phase." (`phase-plan.ts:34`) with up to 4 options `o1..o4` labelled `lane, family, model, limit state, score`, rotation pick first (`LR/decision-model/decision-payload.ts:57-65`; `routing-constants.ts:95-96`). `pastOutcomes` is always `{}` because `outcomeFigures: []` is hard-coded (`LR/pipeline/model-refine.ts:158, 231`). It decides only which offered label; an invented label gives `bad-output`, reported confidence <0.5 gives the ranking pick with the model's choice kept as `modelProposal` (`LR/pipeline/answer-validation.ts:33-65`; `routing-constants.ts:151`). Pinned phases and phases with fewer than 2 options are never sent (`phase-resolve.ts:16-22`). At most 2 requests per call, no retry, 64 KiB cap, options shrink 4 to 2 (`model-refine.ts:210-245`), 3 s timeout by default, 1-60 s via setting (PR #876). Its choice is not limited to the band: any offered top-4 label is accepted (`phase-resolve.ts:64-81`). The same model also does pre-flight type/depth (`preflight-answer.ts:25-38`), a per-turn scope check (`LR/scope/scope-check.service.ts:41-67`), outcome task-kind classification from the lane brief, up to 4000 chars (`LO/lane-outcome-recorder.service.ts:60`; `LR/task-kind/decision-model-task-kind-classifier.ts:35-60`) and failure classification.

**Outputs.** Per phase: chosen {executor, model, provenance, score, source `model|ranking|pin`, taskKind, confidence, fallbackCause, modelProposal, reason} or unavailable {exclusionReason, excludedBy, pinRule}; plus `excluded[]`, `overallSource`, `reasons` including missing inputs (`assemble-gate.ts:52-106, 310-338`; `LR/reasons/compile-reasons.ts:71-95`).

**How the main agent uses it.** Host: per admitted turn a background scope check, then one pre-flight per scope revision, queued as a `Routing:` reminder (≤600 chars) for the next turn; it lists task type, depth, up to 4 lane labels and says "Executor choice stays with gate-0.1" (`libs/backend/rpc-handlers/src/lib/chat/host-routing/host-routing.coordinator.ts:1-30`; `routing-reminder.format.ts:15-18, 33-50`). Gate 0.1 proper is skill text: call `ptah_route_decide` stage `gate-0.1` "if listed", pass user pins, show phase/executor/model/reason/source/confidence, record in `decisions.md` (`SK/orchestration/references/lane-assignment.md:18-30`; `SK/orchestration/SKILL.md:30-34`), then pass `taskKind` and `routingSource` to `ptah_agent_spawn` (`SK/agent-lanes/SKILL.md:49-58`). It starts with `ptah_memory_search` for a stored lane preference (`SKILL.md:92, 101`). No code forces the call or obeys the roster. PR #865 says `ptah_route_decide` stays a deferred tool; the core prompt only says follow a `Routing:` reminder (`libs/backend/agent-sdk/src/lib/prompt-harness/ptah-core-prompt.ts:201`). UNVERIFIED how often Gate 0.1 runs in practice.

## 2. Outcome learning

**Record** (`libs/shared/src/lib/types/lane-outcome.types.ts`): run id, executor kind, lane id, family, provider, model, role, `taskKind` + `taskKindSource`, verdict (`delivered|no-deliverable|unverified|failed`), `failureClass`, times, tokens, cost, `routingSource`, `reviseRounds`, `finalReview`, telemetry join, `skillsLoaded`. Ids, enums, numbers only; text is never stored.

**Writers.** Lanes: automatic at each terminal transition (`libs/backend/cli-agent-runtime/src/lib/cli-agents/lane-completion-outcome.ts:47-82`), failed and limit-hit runs included (PR #870). The verdict comes from declared `deliverables` checked on disk, not the exit code (`lane-completion-notifier.service.ts:19-23`); a file older than the run start is not "delivered" (`LO/write/report-effect.ts:75-87`). Subagents: the stop hook writes an `unverified` row (`LO/lane-outcome-recorder.service.ts:82-116`); it counts only after the orchestrator calls `ptah_outcome_report` (`SK/orchestration/SKILL.md:141-148`). Reviews: orchestrator report, or host capture of the reviewer's `Reviewed-Run:` and `Verdict:` lines (`LO/review-verdict.parser.ts`; recorder `:314-347`). `approved|rejected` overwrite `finalReview`; `revise` only increments `reviseRounds` (`LO/store/lane-outcome.store.ts:84-86`). Task kind: spawn arg, else mapped from role (`LO/task-kind-mapping.ts`), else classified, else null; null kinds never enter the matrix (`LR/matrix/local-derivation.ts:136`).

**Matrix.** Rebuilt on each routing call from the last 90 days per lane id (`LR/matrix/capability-matrix.store.ts:281-285`) out of SQLite, newest 2000 rows (`LO/store/sqlite-lane-outcome.store.ts:357-368`). Hard cut, no recency weight; `stale` is display only at 180 days (`routing-constants.ts:157`; `capability-matrix.store.ts:459`). `unverified` is ignored; every `failed` counts the same whatever its class (`local-derivation.ts:173-209`). README:76 says "in this workspace", but the query has no workspace predicate and lane rows store `workspaceRoot: null` (`recorder:158`): outcomes are machine-wide.

**Cold start.** Seed has one row (z-ai/glm-5, implement = 80; `LR/matrix/seed-matrix.ts:58-66`). Everything else scores 50, the whole roster sits in one band and rotation round-robins. By the arithmetic above a lane needs about 2 verified runs of the same family/model/kind to leave the band. A non-persistent store gives "no outcome history" (`capability-matrix.store.ts:274-276`).

**Self-grading guards.** Deliverables are `stat`ed by the host (`libs/backend/vscode-lm-tools/src/lib/code-execution/mcp-core/tools/outcome-report.tool.ts:161-205`). A reviewer cannot grade its own agent: identity is caller agent id, else `reviewerRunId`, else session (`outcome-report.tool.ts:150-157`; `report-effect.ts:43-60`). The verdict grammar is strict. At routing time reviewer family must differ. Not guarded (inferred): recording never checks reviewer family or independence, and the main agent can report any verdict. PR #870 lists open defects: a replayed early review counts twice; a reviewer's second turn is dropped as duplicate.

## 3. Skill learning

| Mechanism | Trigger | Proposer / judge | Approval and storage | Reaches later sessions |
|---|---|---|---|---|
| **Skills Library enhance** (skill, agent, command clones) | User clicks Enhance (`skillSynthesis:previewEnhancement`, `libs/backend/rpc-handlers/src/lib/handlers/skills-synthesis-rpc.handlers.ts:343-390`). Automatic enhancement is retired (`SS/skill-enhancer.service.ts:273-278`; docs `background-learning.mdx`). | One LLM turn rewrites the file from spec findings (≤1600 chars) and, for agents only, a scorecard (≤1200) (`:332, 738`); model from `skills.enhancement.*`, default tier haiku (`:757-769`). Judge: 5 criteria, 1-10, pass at 6.0 (`SS/skill-judge.service.ts:57`). Manual path blocks only on an explicit low score; `unscored` and `disabled` pass (`skill-enhancer.service.ts:415-417`). | Diff preview, cached 15 min, applied once, exact previewed body written; `.history/<ts>` snapshot; `revert()` restores (`:88, 489-540, 644`). | Re-propagation to harness copies (`:683`; README:177) |
| **Grade loop** | Skill-use hooks (`skills.telemetry.enabled`, default on, `SS/triggers/skill-trigger.service.ts:281`); 90 s debounced harvest of finished `.ptah/specs` folders (`:23, 151`) | None: `task.md` status, `batches.md` statuses, review verdict files and lane `finalReview` become pass/fail grades (`SS/spec-harvester.service.ts:60-175`) | `skill_task_grades` in SQLite; shown as a rate in the Library | Only through the enhance prompt and the Library display. Not routing. |
| **`ptah_harness_create_skill`** | An agent calls the tool | The calling agent | Writes `SKILL.md` to workspace (default) or user scope; "active on discovery" with no judge or review (`vscode-lm-tools/.../tool-description.builder.ts:1512-1540`) | Next turn; synced at next reconcile |
| **Memory curator** | Automatic: PreCompact, 10 min idle, 20 turns, cue regexes, commits, session end, boot scan (`MC/triggers/memory-trigger-config.ts:19-57, 75-100`) | Extraction LLM keeps "durable facts, decisions, preferences and lessons" and excludes run outcomes, rosters and lane assignments (`libs/backend/agent-sdk/src/lib/curator-llm-adapter/extract-prompt.ts`) | Stored with tier, salience, 7-day half-life ranking (`MC/salience-ranking.ts:1-26`); no per-memory approval found | Session-start roster of 10 recent subjects, default on (`agent-sdk/src/lib/helpers/memory-prompt-injector.ts:66-70, 181-187`), pull via `ptah_memory_search` (`ptah-core-prompt.ts:43, 63`) |

The generation pipeline for new skills was deleted in PR #788. Agent generation (setup wizard) reads workspace analysis, not outcomes (`libs/backend/agent-generation/src/lib/services/orchestrator.service.ts:1-12`). Lane outcomes feed skill grades (`lane-final-review`) but skills never feed routing; `skillsLoaded` is stored on outcome rows and never read by routing. The UI threshold (5 uses) and 24 h cooldown are not enforced server-side (handler comment, `skills-synthesis-rpc.handlers.ts:363`; `skill-enhancer.service.ts:79-81`). UNVERIFIED whether proposer and judge default to the same model.

## 4. User control and predictability

**Can see or set:** decision model and its timeout (`LR/decision-model/decision-model.types.ts:137-138`; PR #876); `agentOrchestration.hostRouting` toggle (`host-routing-setting.ts:13`); `preferredAgentOrder` becomes `preferredRank` (`vscode-lm-tools/.../agent-namespace.builder.ts:576-597`); `disabledClis` (`file-settings-keys.ts:151`); per-phase pins; `~/.ptah/routing/capability-matrix.json` with `source: "user"` cells that win, plus a read-only merged `capability-matrix.view.json` (`capability-matrix.store.ts:31-34, 64-66`); the Gate 0.1 table and `decisions.md`; per-role delivered/review rates on Library cards (`libs/backend/rpc-handlers/src/lib/handlers/agent-outcome-rpc.handlers.ts`). I found no UI for the matrix or rotation state.

**Hard to predict:**
1. Rotation: the same request can pick a different executor each call, and the call itself changes state (`spread.ts:97-105`; tool description in `route-tools.ts`). First pick depends on earlier calls.
2. Decision model: can leave the rotation pick, varies by model, falls back silently after 3 s (reason text carries `fallbackCause`).
3. Flat start: near-ties for about 2 runs, then one failure moves a lane out of the band.
4. Subagent and `claude` lane share family `claude`, so a Claude subagent implementer blocks a Claude lane reviewer.
5. Outcomes are machine-wide although README says per workspace.
6. Gate 0.1 and `taskKind`/`routingSource` are optional prompt-level steps; rows without them fall to role mapping, classification, or are ignored.
7. `usage-limit` and `auth` failures lower a lane's capability score as well as its limit state.

## 5. T3 Code in the same areas

- **Target choice.** The parent model picks. Injected instructions: native subagents for the same provider, `delegate_task` for another; call `orchestrator_capabilities` once per thread; "Provider or model unavailable: say so. Never switch unasked, or fall back" (`packages/provider-core/src/server/orchestrationInstructions.ts:4-14`). `orchestrator_capabilities` returns providers, models (listing capped at 8, `apps/server/src/mcp/OrchestratorMcpService.ts:290`), options, `runtimeModes`, `canRunChildTask`, `canRunCrossProviderChildTask`, string `constraints` (installed, enabled, authenticated, status; `:350-376`; `packages/contracts/src/orchestratorMcp.ts:637-656`). `delegate_task` takes `target{providerInstanceId|driverKind|model|options}`, `role`, `mode` (`orchestratorMcp.ts:168-197`).
- **Resolution** is deterministic: explicit instance honoured exactly or fails; driver-only picks the inherited instance if healthy, else the first healthy enabled one; omitted target inherits the parent; model defaults to inherited or the provider's first (`OrchestratorMcpService.ts:1332-1470`). `role` only prefixes the prompt: "Act as the X sub-agent" (`apps/server/src/mcp/delegatedTaskModes.ts:90-94`). Children cannot widen runtime mode (`docs/orchestration-v2/orchestrator-mcp-server.md:535-548`).
- **Outcome tracking, ranking, learning: NOT FOUND.** `task_status` reports state and summary for one task only. Searched `docs/` and `apps/server/src/mcp` for outcome, success, rank, reputation, learn, lesson, reflect; searched `apps/server/src` for skill and memory (hits are discovery of each provider's own skills, titles, PR triage). `usage_limit` is a per-thread failure class for the "Limited" state (`orchestration-v2/Orchestrator.ts:3590`), not a routing input; no usage field in capabilities. The nearest thing to learning is offline: human-run paid evals of instruction text (`evals/mcp-tool-use/README.md`, not CI). `textGenerationModelSelection` fixes the model for titles and commit text (`packages/contracts/src/settings.ts:1076`).

## 6. Clean differences

- Selection: Ptah: filter, score, rotate in code, optional small model picks among 4 / T3 Code: the parent LLM picks from a capability list.
- Evidence on candidates: Ptah: limit state, 90-day pass rates blended with a seed / T3 Code: install, enabled, auth and model options only.
- Reviewer independence: Ptah: hard family exclusion when routing / T3 Code: no such rule found.
- Pins: Ptah: a pin that breaks a rule is refused, never substituted / T3 Code: an explicit instance is honoured or fails, "never switch unasked".
- Outcomes: Ptah: automatic record per lane run, disk-checked deliverables, review verdicts / T3 Code: per-task status only.
- Learning: Ptah: manual skill enhance with judge, apply and revert; automatic memory curation / T3 Code: none at runtime; offline evals.
- Repeatability: Ptah: rotation makes equal requests differ / T3 Code: same input resolves to the same target.
- Unavailable lane: Ptah: excluded or ranked down, with a skill-text fallback order (other family, same family, subagent) / T3 Code: report it and stop.

## 7. Gaps and enhancement ideas (Ptah, ranked)

1. **Deterministic mode and visible rotation.** Add a setting that disables rotation (first of `prefer` order wins), and show last pick per key. `LR/ranking/spread.ts:97-105`, `rotation.store.ts`, a settings row.
2. **Constrain the decision model to the band** (offer only band members) so it cannot pick below the ranking. `LR/pipeline/phase-plan.ts:209-215`, `phase-resolve.ts:64-81`.
3. **Stop scoring capacity failures as capability.** Exclude `usage-limit`, `auth`, `timeout` from the delivery denominator. `LR/matrix/local-derivation.ts:173-209`.
4. **Scope outcomes to the workspace or fix README:76.** `LO/store/sqlite-lane-outcome.store.ts:357-368`; record `workspaceRoot` for lanes (`recorder:158`).
5. **Use `reviseRounds`** (now ignored) in the review rate. `LO/store/lane-outcome.store.ts:84-86`, `local-derivation.ts:194-208`.
6. **Feed or remove `pastOutcomes`.** `LR/pipeline/model-refine.ts:158, 231`, `decision-payload.ts:111`.
7. **Surface the merged matrix, sample counts and "unrated" in the roster/UI;** seed more than one row. `capability-matrix.store.ts:316-328`, `seed-matrix.ts:58`.
8. **Server-side guards for Enhance:** enforce threshold/cooldown and require a `scored` verdict, ideally from another family. `SS/skill-enhancer.service.ts:415-417`, `skills-synthesis-rpc.handlers.ts:363`.

## 8. Unknowns

- How often Gate 0.1, `taskKind` and `routingSource` actually occur. Smallest check: read-only count of `routing_source` in `lane_outcome_records` (`~/.ptah/state/ptah.sqlite`).
- Whether skill proposer and judge resolve to the same model by default.
- Whether the Memory tab lets a user review or delete individual memories (UI not read).
- Decision-model accuracy: live evals are gated (`PTAH_LIVE_PROBES=1`, PR #740) and were not read.
- T3: closed or hosted features beyond this clone; its `Workflow` mode is UNVERIFIED.
