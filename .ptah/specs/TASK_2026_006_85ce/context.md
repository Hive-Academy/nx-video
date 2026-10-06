# Context

## Intent

The capture side. The Director drives a Playwright session, records raw footage and writes `beats.json` and `shots.json`. All camera work happens later, at render time, so a visual change never needs a new capture.

## Source

`apps/ptah-electron-e2e/src/showcase/` in Ptah: the Director, `showcase-fixtures.ts` (Electron app) and `browser-fixtures.ts` (web app). The Ptah `*.scene.ts` files stay in Ptah.

## Scope

- Package the Director with an API that is independent of the runtime (it touches only page and app properties).
- Fixtures for an Electron app and for a browser app.
- `capture` executor: runs a scene and writes `raw.webm`, `beats.json` and `shots.json`. Capture size option (`1080p`, `1440p`, `4k`).
- `scene` generator: a `*.scene.ts` file and its narration script JSON.
- An example scene against a small fixture web page in the e2e project.

## Acceptance

- In the e2e workspace, `scene` + `capture` + `render` produce an MP4 from the fixture page.
- The output of `capture` validates against the contract package.
