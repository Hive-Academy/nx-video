# Emoji

The booth speech bubbles use Noto Color Emoji artwork as images (never the system emoji font).

- Source: Google Noto Emoji, https://github.com/googlefonts/noto-emoji, folder `2D/svg/`
  (`emoji_u<codepoint>.svg`), commit `99701e07d3d1fe1bdbcdb14964547f0fd592966f` (main on 2026-11-05).
- Licence: Apache License 2.0 (https://github.com/googlefonts/noto-emoji/blob/main/LICENSE). Copyright Google LLC.
- Files are unmodified copies, renamed to `<codepoint>.svg`. `manifest.json` lists each file's exact URL.
- Rebuild: `node assets/emoji/fetch-emoji.mjs` (reads the code points from `src/bubbles.json`).

| File | Emoji | Used on |
| --- | --- | --- |
| `2705.svg` | ✅ check mark button | Codex row 1, "merged" |
| `1f680.svg`, `2615.svg` | 🚀 rocket, ☕ hot beverage | Codex row 1, "main." |
| `1f64f.svg` | 🙏 folded hands | Claude row 7, "table." |
| `1f4c4.svg`, `1f4c3.svg`, `1f4d1.svg` | 📄 page facing up, 📃 page with curl, 📑 bookmark tabs | Claude row 7, "pages." |
| `1fae0.svg` | 🫠 melting face | Claude row 7, "caveats." |
| `1f4cc.svg` | 📌 pushpin | OpenCode row 11, "pinned" |
| `1f645.svg` | 🙅 person gesturing no | OpenCode row 11, "Twice." |
| `2696.svg` | ⚖️ balance scale | OpenCode row 11, "matters." |
| `1f4ad.svg` | 💭 thought balloon | Cursor row 15, "thoughts." |
| `1f52e.svg` | 🔮 crystal ball | Cursor row 15, "them." |
| `2600.svg` | ☀️ sun | Antigravity row 16, "sun." |
| `1f60e.svg` | 😎 smiling face with sunglasses | Antigravity row 16, "have." |
| `1f4f8.svg` | 📸 camera with flash | Antigravity row 16, "screenshot." |
| `1fae1.svg`, `23ea.svg` | 🫡 saluting face, ⏪ fast reverse | Codex row 21, "Reverting." |
