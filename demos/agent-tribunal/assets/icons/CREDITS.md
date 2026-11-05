# Provider icons

Product logos are trademarks of their owners. They are used only to identify the products (no rebranding, no claim of ownership or endorsement).

Rebuild with `node assets/icons/fetch-icons.mjs` (add `--force` to re-download). Every PNG is 512 x 512 with a transparent background, rendered from the SVG with sharp. `<id>.png` / `<id>.svg` read on light grounds (cream, brass); `<id>-ondark.*` read on dark grounds.

| id | Files | Source page | Variant (light / dark ground) | Licence listed by thesvg.org |
| --- | --- | --- | --- | --- |
| claude | `claude.svg`, `claude.png`, `claude-ondark.*` | https://thesvg.org/icon/claude | `default` / `default` (brand colour #D97757) | CC0-1.0 |
| codex | `codex.svg`, `codex.png`, `codex-ondark.*` | https://thesvg.org/icon/codex | `default` / `dark` | brand-use (https://thesvg.org/legal#trademark) |
| openai (alternate mark for Codex) | `openai.svg`, `openai.png`, `openai-ondark.*` | https://thesvg.org/icon/openai | `light` / `dark` | MIT; brand guidelines https://openai.com/brand/ |
| cursor | `cursor.svg`, `cursor.png`, `cursor-ondark.*` | https://thesvg.org/icon/cursor | `light` / `default` | CC0-1.0; brand guidelines https://cursor.com/brand |
| antigravity | `antigravity.svg`, `antigravity.png`, `antigravity-ondark.*` | https://thesvg.org/icon/google-antigravity | `default` / `default` (colour gradient) | MIT |
| opencode | `opencode.svg`, `opencode.png`, `opencode-ondark.*` | https://thesvg.org/icon/opencode | `default` / `default` recoloured to #FFF6E5 (the source uses `currentColor`) | MIT |
| ptah | `ptah.png` (the emblem as published), `ptah-ondark.png` (gold line version), `ptah-icon.webp` | Ptah repository, `apps/ptah-landing-page/public/assets/icons/ptah-icon.webp` (the landing page site logo; read-only source, copied). Also at `assets/brand/ptah-emblem.webp`. | — | Ptah's own emblem |

Direct SVG URLs follow `https://thesvg.org/icons/<slug>/<variant>.svg`; `manifest.json` lists each file's exact URL.

Notes:

- Codex uses the Codex product mark from thesvg.org (a cloud with a `>_` prompt), which identifies the agent more precisely than the OpenAI knot. The OpenAI knot is kept as `openai.*` in case the plain OpenAI mark is wanted instead.
- Ptah is the engraved emblem only. The old `ptah-logo.svg` ring mark was wrong and is no longer used or shipped. Overlays and the Conductor badge use `assets/brand/ptah-emblem-gold.png` (see `assets/brand/CREDITS.md`).

OpenCode is black and white (its brand): the overlays use #111111 with white type for it.
