# Context

## Intent

`npx create-nx-video my-videos` gives a new workspace that is ready to capture, narrate and render.

## Scope

- The `create-nx-video` package calls `create-nx-workspace` with the plugin as the preset.
- The preset runs `init` and `studio`, and as an option `hyperframes-project` and `editor`.
- Options for the brand fields of `brand.config.ts`.
- The generated README shows the Remotion license notice and the engine table.

## Acceptance

- An e2e test runs `create-nx-video` from the local registry and renders the smoke composition.
