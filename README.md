# nx-video

Programmatic video production for Nx workspaces: capture product walkthroughs with Playwright, narrate them, and render them with Remotion or HyperFrames.

> [!WARNING]
> **Status: planning.** This repository contains the plan and the task backlog only. No package is published yet. Do not install anything from here.

## What this repository will ship

1. **An Nx plugin** — `@hive-academy/nx-video`. Generators install the code into your workspace. Executors capture, narrate, render and check your machine.
2. **A Claude plugin marketplace** — `.claude-plugin/marketplace.json`. It installs the video skills and the `video-director` agent. The `editor` generator sets up the DaVinci Resolve MCP server per machine.
3. **A preset** — `create-nx-video`. It creates a new workspace with the plugin already set up.

The code comes from the video tooling in [Ptah](https://github.com/Hive-Academy/ptah-extension). Ptah will consume this package to record its own videos.

## Two render engines

| Workflow | Engine | Use it for |
|---|---|---|
| Showcase and self-shot | [Remotion](https://www.remotion.dev) | Screen captures of your app, with a virtual camera, captions and narration |
| Promos and editor | [HyperFrames](https://github.com/heygen-com/hyperframes) | HTML/GSAP motion graphics, UI motion kits, graphics over filmed footage |

The two pipelines do not share code.

## License notice for Remotion

> [!IMPORTANT]
> Remotion is not free for all users. Many for-profit companies must buy a [Remotion company license](https://www.remotion.dev/license). Read the license before you use the Remotion workflows.

This repository is MIT licensed. The MIT license does not change the license of Remotion, HyperFrames or any other dependency.

## Planned commands

```bash
nx g @hive-academy/nx-video:init
nx g @hive-academy/nx-video:studio
nx g @hive-academy/nx-video:scene
nx g @hive-academy/nx-video:hyperframes-project
nx run <studio>:doctor
nx run <studio>:capture
nx run <studio>:selfshot
nx run <studio>:render
nx run <hyperframes-project>:assemble
nx run <hyperframes-project>:check
nx run <hyperframes-project>:render
```

These commands do not exist yet. See [docs/roadmap.md](docs/roadmap.md).

## Documents

- [docs/roadmap.md](docs/roadmap.md) — the task map and the order of work.
- [docs/decisions.md](docs/decisions.md) — the decisions already made, and why.
- [.ptah/specs/](.ptah/specs/) — one folder per task.

## License

[MIT](LICENSE). [NOTICE](NOTICE) carries the Apache-2.0 HyperFrames attribution and the Remotion license notice. Published packages include `LICENSE` and `NOTICE`.
