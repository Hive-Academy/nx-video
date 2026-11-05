# Overlays report — Revision 2 (intro, punch promo, icons, booth bubbles)

Status: done. `check --json` passes: 0 errors and 0 warnings in lint, runtime, layout, motion and contrast. The only findings are `canvas_content_at_edge` infos from the 3D canvas. Generated with `node scripts/audio/generate.mjs` (audio + `cues.json`) then `node src/build-timing.mjs` (`index.html`, `compositions/*.html`, `src/timing.json`).

## Revision 2b (user change requests)

- **Intro drift:** fixed; see Decisions › Intro kinetic type.
- **Ptah emblem:** replaces the ring mark everywhere. Files are in `assets/brand/`; sources are in `assets/brand/CREDITS.md` and `assets/icons/CREDITS.md`.
- **Temple background:** on the intro, title and end card.
- **OpenCode:** now black and white.
- **Bubble pages:** each page is sized to its own text.
- **Checks:** `check --json` is ok, with 0 errors and 0 warnings in every section. Snapshots reviewed: `snapshots/overlays/round5-intro` (0, 0.6, 1.2, 1.7, 2.0, 2.8, 3.8 s), `round5-booths`, `round6` and `round7` (0, 1.2, 2.8, 6.8, 8.4, 10.2, 36.25, 55, 64.29, 103 s), plus a 1x zoom on the Claude page-3 bubble. All OK.
- **3D side:** the 3D canvas was mid-rework in some snapshots. In `round5-booths` the booth canvas did not render, and the OpenCode booth walls were still cream in `round6`. That is the 3D agent's work.

## Running order

**Total runtime: 104.29 s** (was 95.49 s): + 4.0 s intro, + 4.8 s punch promo; scene hosts are now contiguous, so the 0.25 s gaps between lines hold the outgoing shot instead of flashing the empty teal root (the old cut had a 0.25 s empty gap at every scene change).

| Scene | Rows | Start (s) | End (s) | Length (s) |
| --- | --- | --- | --- | --- |
| intro | card A 0–1.8, card B 1.8–4.0 | 0.00 | 4.00 | 4.00 |
| punch-claude | P1 "PLAN." | 4.00 | 4.70 | 0.70 |
| punch-cursor | P2 "AUTOCOMPLETE!" | 4.70 | 5.57 | 0.87 |
| punch-antigravity | P3 "BROWSER!" | 5.57 | 6.37 | 0.80 |
| punch-opencode | P4 "OBJECTION!" | 6.37 | 7.20 | 0.83 |
| punch-codex | P5 "MERGED." | 7.20 | 8.10 | 0.90 |
| punch-conductor | P6 "ORDER." + gavel | 8.10 | 8.80 | 0.70 |
| title | 2 | 8.80 | 11.30 | 2.50 |
| table-1 | 3, 4, 5, 6 | 11.30 | 29.40 | 18.10 |
| booth-claude | 7 | 29.40 | 37.03 | 7.63 |
| table-2 | 8, 9, 10 | 37.03 | 48.23 | 11.20 |
| booth-opencode | 11 | 48.23 | 58.88 | 10.65 |
| booth-codex | 1 (moved) | 58.88 | 64.89 | 6.01 |
| table-3 | 12, 13, 14 | 64.89 | 74.88 | 9.99 |
| booth-cursor | 15 | 74.88 | 78.98 | 4.11 |
| booth-antigravity | 16 | 78.98 | 84.30 | 5.31 |
| table-chaos | 17 | 84.30 | 87.55 | 3.25 |
| table-verdict | 18, 19, 20 | 87.55 | 99.88 | 12.33 |
| booth-codex-tag | 21 | 99.88 | 101.29 | 1.41 |
| endcard | 22 | 101.29 | 104.29 | 3.00 |

Punch sync (every shot): cut on a frame boundary → robot alone for 4 frames → word slams in over 3 frames and lands on frame 4 (`impact`, given to the 3D mount as `rows[0].impact` / `localImpact`) → impact SFX peak and voice onset one frame later → 2-frame shake → icon tag springs in. The title starts 0.53 s after the P6 gavel peak, on its ring-out.

## New audio

All under `assets/audio/` (gitignored). Same pipeline as before: two-pass `loudnorm` (I −16, TP −1.5, linear), mono 192k MP3. Existing voice files were reused, not regenerated.

| File | Source | Loudness / true peak |
| --- | --- | --- |
| `vo/p1-claude.mp3` "Plan." | ElevenLabs TTS, voice Alice `Xb7hH8MSUJpSbSDYk0k2` | −16.2 LUFS / −1.82 dBTP, 0.54 s |
| `vo/p2-cursor.mp3` "Autocomplete!" | TTS, Laura `FGY2WhTYpPnrIDTdsKH5` | −19.4 / −1.78, 0.70 s |
| `vo/p3-antigravity.mp3` "Browser!" | TTS, River `SAz9YHcvj6GT2YYXdXww` | −17.5 / −1.78, 0.66 s |
| `vo/p4-opencode.mp3` "Objection!" | TTS, Daniel `onwK4e9ZLuTAKqWW03F9` | −16.3 / −2.28, 0.65 s |
| `vo/p5-codex.mp3` "Merged." | TTS, Callum `N2lVS1w4EtoT3dr4eOWO` | −18.4 / −1.76, 0.74 s |
| `vo/p6-conductor.mp3` "Order." | TTS, Brian `nPczCjzI2devNBz1zQrb` | −16.3 / −2.71, 0.53 s |
| `sfx/punch-hit-1..3.mp3` | ElevenLabs sound-generation (prompts in `scripts/audio/script-data.mjs` `SFX_R2`) | TP −2.05 / −2.33 / −1.47 |
| `sfx/whoosh-3.mp3`, `sfx/whoosh-4.mp3` | sound-generation | TP −2.04 / −1.30 |
| `align/vo-{01,07,11,15,16,21}-*.json` | ElevenLabs `POST /v1/forced-alignment` on the existing MP3 + its text | words copied into `cues.json` `voices[id].words` |
| `music/bed-edit.mp3` | re-cut from `bed-norm.mp3` (looped to 104.29 s) | gain envelope baked in, see below |

punch-hit-1 and whoosh-3 came out of loudnorm at +0.9 and −0.08 dBTP. The script now pulls any new SFX that is above −1.2 dBTP down to −1.8 dBTP. After that pass the new SFX measure:

- punch-hit-1: −2.05 dBTP
- punch-hit-2: −2.33 dBTP
- punch-hit-3: −1.47 dBTP
- whoosh-3: −2.04 dBTP
- whoosh-4: −1.30 dBTP

Punch TTS: `eleven_multilingual_v2`, each agent's cast settings with `stability 0.25, style 0.9` merged over them (recorded in `voices.json` → `punch`). Leading/trailing silence trimmed to 15 ms before normalizing, so the word starts on its impact.

Music (`<audio id="music-bed">`, data-volume 0.55, gain baked into the file): full under the intro (0.55 effective), 0.36 under the punch promo and title, ducks to 0.14 by row 3 (as before), silent from the row-18 gavel (87.58 s; the 90 s loop seam falls inside that silence), back at 0.41 under the end card, 0.8 s fade out.

New SFX cues: `whoosh-intro-1` (card A→B cut, 1.80 s), `whoosh-intro-2` (into P1, 4.00 s), `hit-p1..p5` (punch-hit takes rotated 1-2-3-1-2), `gavel-p6` (gavel-1 take). Existing cues were re-placed for the new order (row 1's mug sip and sting-out now sit around 58.9–64.9 s).

## Provider icons

`assets/icons/<id>.svg` + `<id>.png` (512 × 512, transparent) for claude, codex, cursor, antigravity, opencode, ptah, plus `-ondark` variants and an `openai` alternate. Source thesvg.org (page URLs, variants and licences in `assets/icons/CREDITS.md`), Ptah from the Ptah repo. Rebuild: `node assets/icons/fetch-icons.mjs`.

Used on: booth lower-third (round badge left of the name), punch cards (badge + name tag), title card (cast row of six badges), end card (Ptah icon). The 3D agent reads the PNGs for chest badges and nameplates.

## Booth bubble copy

Data: `src/bubbles.json`. Emoji: Noto Color Emoji SVGs in `assets/emoji/` (Apache-2.0, `assets/emoji/CREDITS.md`). Key words (Archivo Black 56 px + agent-colour highlighter swipe) are in **bold**; the rest Inter 700 52 px; emoji 70 px with a squash pop. `/` marks a new bubble (page).

| Scene | Bubble copy |
| --- | --- |
| booth-claude (row 7) | I **respect** everyone at that table. 🙏 / I've also written a **document** on why they're **wrong.** / It's **forty pages.** 📄📃📑 With **caveats.** 🫠 |
| booth-opencode (row 11) | I **objected** to Remotion's **licence.** I **objected** to HyperFrames' **pinned** 📌 versions. / I **objected** to my **own** idea. **Twice.** 🙅 **Consistency** matters. ⚖️ |
| booth-codex (row 1) | Let me be **clear.** I already **merged** ✅ it. Into **main.** 🚀☕ |
| booth-cursor (row 15) | I don't **interrupt** people. I just **finish** their **thoughts.** 💭 **Before** they have them. 🔮 |
| booth-antigravity (row 16) | Nobody at that table has ever seen the **sun.** ☀️ / I **have.** 😎 I took a **screenshot.** 📸 |
| booth-codex-tag (row 21) | **Reverting.** 🫡⏪ |

Each word appears at its forced-alignment start; the bubble springs in 0.2 s before its first word (0.12 s for later pages) and shrinks out in 0.12 s just before the next page or the cut.

## Mix check

The pinned 0.8.98 CLI has no `audio` command, so I measured the mix with ffmpeg instead. A scratch script mixed every `<audio>` in `index.html` at its start, duration and volume, and `loudnorm` read the result.

- **Without the master limiter:** −16.9 LUFS integrated, true peak −0.62 dBTP, LRA 4.3.
- **With an equivalent −1.5 dB limiter** (what the new `<hf-audio-group id="master">` bus does): −16.9 LUFS, true peak −1.37 dBTP.
- **RMS by section:**
  - intro: −21.0 dBFS (music only)
  - punch promo: −14.8 dBFS
  - title: −15.0 dBFS
  - dialogue: −17.1 dBFS
  - end card: −24.3 dBFS
- **Not heard.** Nobody has listened to the mix. That covers the shouted punch reads and the balance between hits and voices.

## Snapshots reviewed

All snapshots were taken with `snapshot --no-end --timeout 30000 --describe false`.

| Path | Frames | Verdict |
| --- | --- | --- |
| `snapshots/overlays/frame-00-at-0s.png` | intro frame 0 | OK. "A DAY IN THE LIFE" reads on teal while the letters track in. After this frame I cut the letter spread to 7 px per letter so the first letter stays inside the safe area. |
| `snapshots/overlays/frame-01..05` (0.9, 1.5, 2.3, 2.75, 3.6 s) | intro cards A and B | OK. "of a developer" drops in, the amber ellipsis ticks in, and FIVE AI AGENTS stamps in one letter per frame. The 2.3 s frame catches a letter mid-stamp, which is expected. |
| `snapshots/overlays/frame-06,07,09..12` (4.2, 4.9, 5.77, 6.57, 7.4, 8.3 s) | each punch 2 frames after impact | OK. Each word has landed on its colour plate on the right 40% of the frame, with the 3D robot on the left. |
| `frame-08-at-5.45s`, `round2` 4.5 s, `round3` 8.6 s, `round4` 7.6 s | late punch frames | OK. The icon and name tag are in. The Ptah tag sits on an ink disc. |
| `frame-13-at-10s`, `round2` 10.5 s, `round3` 10.5 s | title | OK. Title, subtitle and the six-icon cast row. |
| `booths/` and `round2/` | every booth at three points: early, mid-sentence and emoji pop | OK. Words build on time and key words carry the highlighter. Emojis pop, the tail points at the robot's screen, and nothing collides with the lower third. |
| `zoom-bubble/frame-00-at-36.25s.png` | 3x zoom on the Claude bubble | OK. Type and emoji are crisp, the tail joins the outline with no seam, and lines do not touch. |
| `round4/` (34.0, 36.98, 52.2, 58.7, 75.6 s) | page swap, bubble exit before the cut, light-colour straps | OK. The bubble shrinks out before each page swap and before the cut. The OpenCode and Cursor names are ink, and the taglines sit on an ink chip. |
| `booths/frame-17-at-102.8s`, `round3` 102.8 s | end card | OK. The robot credit line and the logo note are legible, and the Ptah mark sits beside "ptah". |

Booth snapshot times:

| Scene | Early (s) | Mid-sentence (s) | Emoji pop (s) |
| --- | --- | --- | --- |
| booth-claude | 30.4 | 33.1 | 36.25 |
| booth-opencode | 49.09 (49.5 in `round2`) | 53.71 | 58.26 |
| booth-codex | 59.48 | 61.72 | 64.29 |
| booth-cursor | 75.52 | 76.86 | 78.83 |
| booth-antigravity | 79.67 | 81.06 | 83.53 |
| booth-codex-tag | 100.45 | 100.68 | 100.45 |

## Remaining issues (ranked)

1. **P1: the runtime is 104.3 s.** That is well over the original 70–90 s target. The voice still sets the clock, and the intro and punch promo add 8.8 s.
2. **P1: the audio is measured, not heard.** Nobody has listened to the punch reads, and the limiter bus is approximated with ffmpeg. Listen once in Studio, and confirm the `master` bus limiter in the first render.
3. **P2: bubble line breaks use estimated widths.** The generator breaks lines from character counts, so a line can break a little early. The bubble always fits its real text.
4. **P2: the frame-0 thumbnail is one line.** Only "A DAY IN THE LIFE" is on it, because "of a developer…" drops in from 0.28 s. It reads, but it is sparse.
5. **P2: the Ptah emblem is small in the badges.** On the title cast row and the punch tag, at about 85 px, the emblem reads as a gold crest and the "PTAH" lettering is tiny.
6. **P2: the punch-word outline depends on `paint-order: stroke fill`.** The bundled Chrome renders it correctly. Other browsers previewing the HTML may draw the stroke over the fill.

## Decisions

- **Codex icon.** I used the Codex product mark from thesvg.org (a cloud with `>_`), not the OpenAI knot, because it identifies the agent more precisely. `assets/icons/openai.*` is kept as a drop-in alternative.
- **Ptah emblem (Revision 2b).** The user said the ring mark (`ptah-logo.svg`) is the wrong logo, so it is gone from every overlay and from `assets/icons/`.
  - `assets/brand/build-brand.mjs` makes `ptah-emblem-gold.png` and `ptah-emblem-cream.png` (1024 px) from the engraved emblem. Alpha is the source alpha times inverted luminance, so the white fill clears and the lines stay; they are filled with a gold gradient.
  - The gold emblem is the end-card hero mark, 340 px. It is carried down in 8 frames, lands with a 2-frame shake and then holds for about 2.7 s.
  - It also fills the Conductor badge on an ink disc (title cast row and punch tag), and is the `icon` passed to the Conductor's 3D mount.
  - `assets/icons/ptah-ondark.png` is a copy of the gold emblem.
- **Contiguous scenes.** Each scene host now runs until the next one starts. The old build flashed empty teal for 0.25 s at every cut. The 3D mount still gets each row's `localStart`.
- **Punch sync.** Cuts and impacts sit on frame boundaries. The word lands on frame 4. The impact SFX peak and the voice onset land on frame 5. The mount config carries `impact`, `localImpact` and `word` for the lunge, and every 3D mount carries `icon` (the PNG path).
- **Intro kinetic type.** It uses transforms only, because `letterSpacing` tweens fail lint.
  - Card A (fixed in Revision 2b): the per-letter x spread made the headline drift about 40 px while it was being read, so it was removed. The headline is now landed on frame 0. An amber highlight sweeps through it one letter per frame, changing colour only, with no movement. "of a developer" drops in with a landing squash, then an amber ellipsis ticks in. Line 2's space is reserved from frame 0, so nothing reflows. Snapshots at 0, 0.6, 1.2 and 1.7 s show the line at the same x.
  - Card B: a hard cut with "…who asked" already up. FIVE AI AGENTS stamps in one letter per frame with a 2-frame shake, then "one question." blurs in word by word.
- **Bubble copy.** The bubbles show the spoken words verbatim, so the forced-alignment words map by position. The word count matches for all six lines. The emoji and highlighter carry the joke. Claude's pages use 📄📃📑 rather than three identical 📄, because three identical `<img>` trip the `duplicate_media_discovery_risk` lint.
- **Type sizes.** Bubbles use Inter 700 at 52 px and Archivo Black at 56 px for key words, the top of the 44–56 px range. Emoji are 70 px. Each word carries `data-layout-allow-overlap`: Archivo Black's tall font box overlaps the next line's box, but the glyphs do not touch, as checked at 3x zoom.
- **Lower third.** A 112 px icon badge sits left of the name.
  - On Cursor lavender the name is ink, because cream failed contrast there at 2.7:1. OpenCode yellow (1.6:1) used to get the same treatment; OpenCode is now black with a white name.
  - Elsewhere the name stays cream as SPEC says, with a soft ink drop.
  - Taglines sit on an ink chip so they read over any booth backdrop.
- **Audio levels.**
  - The music clip plays at 0.55, with a gain envelope baked into `bed-edit.mp3`. The bed is at full level under the intro, which has no voice.
  - SFX that land on words were turned down: punch hits 0.6, P6 gavel 0.8, title slam 0.8, stamp 0.75, stings 0.75.
  - A master `<hf-audio-group>` with a −1.5 dB limiter catches the remaining overs.
- **Studio lanes.** Audio moved off the scene tracks: music is on lane 30, voices on 31–32, SFX on 33 and up. Overlapping clips get separate lanes, so the `duplicate_audio_track` warnings are gone. The overlaps themselves are intentional: row 5 cuts into row 4, whooshes run into hits, and the P6 gavel rings under the title slam.
- **Forced alignment.** Results are cached in `assets/audio/align/<voice-id>.json`, so reruns are idempotent; `--force` requests them again.
- **Temple ground (Revision 2b).** The intro, title and end card sit on Ptah's temple: `assets/backgrounds/temple-16x9.jpg`, a 16:9 band of `temple-bg.webp` centred on the throne. A radial shade (64–90 %) keeps contrast high enough that `check` reports no contrast warnings. The image pushes in from 1.0 to 1.035 over each scene; the type is on separate layers and does not move. Booth walls are unchanged.
- **OpenCode is black and white (Revision 2b).** #F2C14E is gone from the generator. OpenCode uses #111111 throughout.
  - The strap is black with a white name; the badge is the black icon on a cream disc.
  - The punch plate is black with a white border and a white word.
  - Bubble key words are white on a black label. The label has no wipe, so white type never sits on cream.
- **Bubble sizing (Revision 2b).** The generator now breaks each page into explicit lines; the target is 760 px, estimated from character counts. Each bubble is `width: max-content`, so every page is sized to its own final text from its first frame. Words still never move as later words appear. Lines prefer to break after a sentence.
- **Retired file.** The generator deleted `compositions/booth-codex-open.html`. Row 1's scene is now `booth-codex`.
