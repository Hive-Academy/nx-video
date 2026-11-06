# Emoji

The captions use Noto Color Emoji artwork as images (never the system emoji font).

- Source: Google Noto Emoji, <https://github.com/googlefonts/noto-emoji>, folder `2D/svg/`
  (`emoji_u<codepoint>.svg`), commit `99701e07d3d1fe1bdbcdb14964547f0fd592966f` (main on 2026-11-05).
- Licence: Apache License 2.0 (<https://github.com/googlefonts/noto-emoji/blob/main/LICENSE>). Copyright Google LLC.
- Files are unmodified copies, renamed to `<codepoint>.svg` (ZWJ sequences keep Noto's `_` separators).
  `manifest.json` lists each file's exact URL.
- Rebuild: `node assets/emoji/fetch-emoji.mjs` (reads the code points from `src/captions.json`; files
  already in this folder are kept).

Episode 2 captions (row, punchline word):

| File | Emoji | Used on |
| --- | --- | --- |
| `1f3e1.svg`, `1f3db.svg` | 🏡 house with garden, 🏛️ classical building | C1 "them.", E2 "…Both." |
| `1f6aa.svg` | 🚪 door | H1 "room!" |
| `1f928.svg` | 🤨 raised eyebrow | H2 "…Weird." |
| `1f970.svg` | 🥰 smiling face with hearts | H3 "here." |
| `1f979.svg`, `1f381.svg` | 🥹 face holding back tears, 🎁 wrapped gift | H4 "seen." |
| `1f92b.svg` | 🤫 shushing face | H5 "gossip." |
| `23ea.svg` | ⏪ fast reverse | H6 "Rewind!" |
| `1f4f1.svg` | 📱 mobile phone | H7 "phone." |
| `2728.svg` | ✨ sparkles | H8 "fresh." |
| `2696.svg` | ⚖️ balance scale | P1 "gavel." |
| `1f4cb.svg` | 📋 clipboard | P2 "jobs." |
| `1f937.svg` | 🤷 person shrugging | P3 "happen." |
| `1f440.svg` | 👀 eyes | P4 "code." |
| `1f645.svg` | 🙅 person gesturing no | P5 "Next." |
| `1faab.svg` | 🪫 low battery | P6 "once." |
| `1f500.svg` | 🔀 shuffle | P7 "else." |
| `1f62c.svg` | 😬 grimacing face | S1 "didn't." |
| `1f605.svg` | 😅 grinning face with sweat | S2 "numbers." |
| `1f371.svg` | 🍱 bento box | P8 "session!" |
| `1f50d.svg` | 🔍 magnifying glass | N1 "verifier." |
| `1f3a9.svg` | 🎩 top hat | N2 "manners." |
| `1f624.svg` | 😤 face with steam from nose | P9 "disagree…" |
| `1f9d1_200d_2696.svg` | 🧑‍⚖️ judge | P10 "Tribunal." |
| `1f60e.svg` | 😎 smiling face with sunglasses | E3 "MIT." |

The other files (📄 📃 📑 🫠 📌 💭 🔮 ☀️ 📸 🫡 ✅ 🚀 ☕ 🙏) are Episode 1's and are not used by Episode 2.
