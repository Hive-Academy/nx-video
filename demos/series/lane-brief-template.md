# Lane brief template (series video work)

Copy this into the `task` of every `ptah_agent_spawn` for episode work, then fill in the `<…>`
fields. Keep the skill block word for word. It is what makes a lane load the quality bar instead of
improvising.

Install or refresh the skills first: `node tools/skills/sync-video-skills.mjs`, then
`node tools/skills/sync-video-skills.mjs --check`.

---

## Skills (load before any other step)

Load these skills with your own skill mechanism. If your catalogue does not list them, read the files
directly: `D:/projects/nx-video/.agents/skills/<name>/SKILL.md`, or
`D:/projects/nx-video/.claude/skills/<name>/SKILL.md`.

- `video-quality-bar`: always.
- `threejs-scene-craft`: for any 3D set, character, prop, camera or effect work.
- `free-media-sourcing`: for any model, texture, HDRI, sound, music or font.
- `hyperframes-core`, `hyperframes-cli`: for composition HTML and snapshots.
- <add others, e.g. `hyperframes-animation` for GSAP, `hyperframes-audio` for the mix>

The first section of your notes file is `## Skills loaded`. For each skill, give the absolute path
you opened and one rule quoted word for word. If this section is missing, the lane has failed.

## Objective

<one paragraph: what this lane makes, in the episode's terms>

## Approved look

<a path to the approved look-dev still for each scene. If there is none yet, write "Look-dev round:
produce one still per scene at its hero cue and stop. Do not animate.">

## Inputs

- Build contract: `D:/projects/nx-video/demos/<episode>/SPEC.md` (it wins over the brief)
- Timing: `D:/projects/nx-video/demos/<episode>/src/timing.json` (cues per scene)
- Engine reference: `D:/projects/nx-video/demos/agent-comparison/src/`
- Asset shopping list: `D:/projects/nx-video/.ptah/specs/TASK_2026_015_1698/research-assets.md`

## Scope

You may create or edit: <write set>
Do not modify anything else. Never run `git add`, commit, push, or any git command that discards
changes.

## Acceptance

- Every gate in `video-quality-bar` §2 passes, and every frame at the cue times scores ≥ 4 on
  every row.
- <scene-specific must-haves: the named effects, crews, props and cards from SPEC.md>
- `node node_modules/hyperframes/dist/cli.js check --json` is clean (run it from the episode
  folder). `node tools/guards/no-media.mjs` passes (run it from the repo root).
- Every new asset is in the right `CREDITS.md`, and downloaded media stays untracked.

## Deliverable

**Deliverable**: `D:/projects/nx-video/demos/<episode>/notes/<LANE>.md`. Write a skeleton first and
fill it in as you go. The required sections are listed in `video-quality-bar` §4.
Reply only with `WROTE: <path>` and a headline. Call `ptah_agent_report` before you exit, if you have
it. If you have no MCP or browser tools, say so, and use the CLI snapshot path.
