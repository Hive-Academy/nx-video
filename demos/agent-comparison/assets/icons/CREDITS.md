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

## T3 Code (Episode 2, "Agent Cribs")

| id | Files | Source | Licence / trademark |
| --- | --- | --- | --- |
| t3code | `t3code.svg`, `t3code.png` (512 x 512, transparent corners) | T3 Code repository `pingdotgg/t3code` at commit `132be33` (2026-11-05), file `assets/prod/logo.svg` (the production app logo: white "T3" on a black rounded square). Copied byte for byte; PNG rendered with sharp. | The repository is MIT (Copyright (c) 2026 T3 Tools Inc.). The T3 Code name and logo are trademarks of their owner; used only to identify the product, with no endorsement implied. |
| t3code-mark | `t3code-mark.svg`, `t3code-mark.png` | Same commit, `assets/prod/app-icon.icon/Assets/text.svg` (the white "T3" glyphs alone, for dark grounds). | As above. |

thesvg.org was checked first (2026-11-05): it has no T3 Code icon. Its only T3 entry, `t3-stack`, is the logo of a different project (create-t3-app), so it is not used. The repository files were copied as images only; nothing from that repository was run.

Brand colours for the loft are in `src/t3-brand.json` (taken from the same commit's `apps/web/src/index.css` and marketing site).

## Hallway nameplates (Episode 2): Grok and Pi

| id | Files | Source | Licence / trademark |
| --- | --- | --- | --- |
| grok | `grok.svg`, `grok.png` (light grounds, #0A0A0A), `grok-ondark.svg`, `grok-ondark.png` (white) | https://thesvg.org/icon/grok, variants `light` and `default` (https://thesvg.org/icons/grok/light.svg, .../default.svg), fetched 2026-11-05 | thesvg.org lists MIT for the file; "Grok logo © 2026 Grok". Trademark of its owner, used only to identify the product. |
| pi | `pi.svg`, `pi.png` | Made here: the word "Pi" in Arial Bold, #18181B, transparent. | Not a logo. The pi coding agent (`badlogic/pi-mono`, MIT) ships no product mark and thesvg.org has none, so the nameplate uses the plain name instead of inventing one. |
