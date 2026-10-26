# Batch 4 report — TASK_2026_003_06a8

## Status and evidence

- **Task 4.1 — complete.** Created the ten-file `create-nx-video` scaffold. `bin/index.ts` reads its package version, calls `createWorkspace` with the versioned preset and `nxCloud: 'skip'`, and sets exit code 1 on CLI errors. Its Vitest spec mocks `create-nx-workspace` and checks the preset, version source, package manager, cloud option, and error propagation. The Nx lint, test, typecheck, and build targets passed. The built package contains the CLI and license notices.
- **Task 4.2 — complete.** Changed only the root README `## License` paragraph to identify the HyperFrames Apache-2.0 attribution and Remotion license notice in `NOTICE`, and state that published packages include `LICENSE` and `NOTICE`. `git diff README.md` contains one hunk in that section.

## Files created or modified

- `/home/amun/projects/nx-video/packages/create-nx-video/package.json` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/project.json` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/tsconfig.json` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/tsconfig.lib.json` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/tsconfig.spec.json` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/vitest.config.mts` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/README.md` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/LICENSE` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/bin/index.ts` — created
- `/home/amun/projects/nx-video/packages/create-nx-video/bin/index.spec.ts` — created
- `/home/amun/projects/nx-video/README.md` — modified
- `/home/amun/projects/nx-video/.ptah/specs/TASK_2026_003_06a8/batch-4-report.md` — created (this report)

## Verification

From `/home/amun/projects/nx-video`:

`npx nx run-many -t lint,test,typecheck,build -p nx-video,create-nx-video --output-style=static --skip-nx-cache 2>&1 | tail -25` — **exit 0** (with `pipefail`):

```text
Compiling TypeScript files for project "create-nx-video"...
Done compiling TypeScript files for project "create-nx-video".
> nx run create-nx-video:lint
> eslint packages/create-nx-video
> nx run create-nx-video:typecheck
> tsc --noEmit -p packages/create-nx-video/tsconfig.lib.json
> tsc --noEmit -p packages/create-nx-video/tsconfig.spec.json
NX   Successfully ran targets lint, test, typecheck, build for 2 projects and 1 task they depend on
Run duration: 16.9s
Cache: Skipped (--skip-nx-cache)
```

`node tools/guards/no-media.mjs | tail -3` — **exit 0** (with `pipefail`):

```text
no-media: checked 89 files; no violations
```

`git status --short packages/nx-video` — **exit 0**, no output.

`git diff README.md` — **exit 0**, one hunk:

```diff
@@ -55,4 +55,4 @@ These commands do not exist yet. See [docs/roadmap.md](docs/roadmap.md).
 ## License
-[MIT](LICENSE)
+[MIT](LICENSE). [NOTICE](NOTICE) carries the Apache-2.0 HyperFrames attribution and the Remotion license notice. Published packages include `LICENSE` and `NOTICE`.
```

Additional checks: scoped `ptah_get_diagnostics` reported 0 errors; the built CLI with no name reported `Please provide a name for the workspace` and exited 1; `npm pack --dry-run --json dist/packages/create-nx-video` exited 0 and listed `bin/index.js`, `LICENSE`, `NOTICE`, `README.md`, and `package.json`.

## Decisions

- **A-4:** Transcribed the installed `@nx/plugin:create-package` bin pattern instead of running the generator. Evidence: the installed template at `node_modules/@nx/plugin/dist/src/generators/create-package/files/create-framework-package/bin/index.ts__tmpl__` and Batch 4's A-4 warning. Reversible; `packages/nx-video/**` is unchanged.
- **R9:** The package README explicitly says the preset arrives in a later release. Its unit test mocks `createWorkspace`, and no real preset creation was attempted. Evidence: `batches.md` R9 and `docs/roadmap.md` task 012. Reversible when task 012 lands.
- **R10:** Added no devDependency. The root `package.json` already pins `create-nx-workspace` at `24.0.1`; root `package.json` and `package-lock.json` were not edited. Evidence: root `package.json` and `git status`. Reversible.
- Used root ESLint configuration for `eslint packages/create-nx-video`; no package ESLint config or inference plugin was added. Evidence: decision 6 in this task's `decisions.md` and `packages/nx-video/project.json`. Reversible.
- Copied the root `NOTICE` into the built package through the build assets entry so the README's published-package statement is true. Evidence: root `NOTICE` and the package dry run. Reversible.

## Not done

- The preset generator is scheduled for task 012, as required by R9.
- No Windows or macOS CI run was performed in this Linux lane. The task's CI matrix work belongs to a separate batch.
- No skill loader or skill catalogue was exposed in this lane, so no skill was loaded. Repository instructions, the approved plan, and the installed Nx template supplied the scaffold pattern.

## Deviations

None from the requested file scope or Batch 4 behavior. The build asset entry copies the already-tracked root `NOTICE` into the package output; it adds no source file beyond the assigned ten.
