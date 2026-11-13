# Review — glm-5.3:cloud (cross-vendor, READ-ONLY)

Reviewed: 2026-11-09. Target: `demos/agent-pronounce` (The Tribunal, Episode 6 promo).
Reviewer model: glm-5.3:cloud (Ollama). READ-ONLY honored: no source file edited, nothing staged or committed, renderer not run, builder notes deliberately not read.

> ⚠️ **IMAGE VIEWING NOT AVAILABLE — the per-frame visual review was NOT performed. No frame was seen, no scorecard row was judged, no look-dev comparison was made. Any visual ACCEPT from this review would be fabricated, so none is issued.**
>
> - Tool test: reading `snapshots/lookdev/office.png` returned: `[Image omitted by Ollama because the selected model does not support image recognition.]`
> - The limitation is model-level (it applies to every PNG/JPG), not file-level.
> - Per the brief's fallback, this file covers ONLY the code-level items: (1) determinism of `src/set-office.js` and `src/set-desert.js`; (2) SPEC.md conformance of shot/cue timing in `src/timing.json`.
> - NOT covered (needs a reviewer with image input): scorecard rows (Subject / Dressing / Light / Effect / Text & safe area / Continuity), look-dev match, contact sheet, visual banned shortcuts (primitives-built hero, flat untextured surfaces, action < 15% of frame, missing/too-small effects, edge crop, unlit face, text over face, caption safe band), camera shot count/length, the white-out and thunder reads, caption 64 px / ≤ 6 words per rendered line, audio mix.

## Skills loaded

- `D:\projects\nx-video\tools\skills\video-quality-bar\SKILL.md` — opened and read in full. Rule quoted word for word: "Any `Math.random`, wall-clock time or timer in scene code. Renders must be seek-deterministic."
- `threejs-scene-craft` / `free-media-sourcing`: not loaded — this review performed no 3D authoring and sourced no assets, and no visual judging was possible (no image input).

## Verdict per scene

No scene can be visually ACCEPTED or REJECTED by this reviewer. The table gives the visual verdict (always NOT ASSESSED) and the code-level verdict, which is the only thing this review can honestly state.

| Scene | Visual verdict | Code-level verdict (determinism + timing only) |
| --- | --- | --- |
| `office` | NOT ASSESSED — no image input | **PASS** — all 8 named cues exact vs SPEC; reaction beats (1.2 s / 1.5 s) exact; determinism clean |
| `vortex` | NOT ASSESSED — no image input | **ACCEPT WITH FIXES** — duration 3.5 s conforms to the binding pacing rule, but `land` cue is 3.0 s vs SPEC 2.6 s (defect 1, blocking for contract conformance) |
| `desert` | NOT ASSESSED — no image input | **ACCEPT WITH FIXES** — all 7 named cues exact; D3→D4 gap below every SPEC band (defect 2, minor); determinism clean |
| `intro` | NOT ASSESSED — no image input | **PASS** — 8 fixed cues and the 10.0 s fixed duration exact |
| `endcard` | NOT ASSESSED — no image input | **PASS** — 3.0 s fixed duration exact |

**Overall: this review issues NO visual accept/reject. On the code-level items only: 3 scenes PASS, 2 ACCEPT WITH FIXES (defects 1–2 below).** The visual gates of the quality bar (every frame ≥ 4 on every scorecard row, look-dev match, contact sheet, visual banned shortcuts) remain UNVERIFIED and must be judged by a reviewer with image input.

## Determinism (code-level) — PASS for both scoped files

Two greps over `D:\projects\nx-video\demos\agent-pronounce\src` (all 38 `*.js` / `*.mjs` files), which includes the two scoped files:

- Case-sensitive `Math\.random|Date|setTimeout|setInterval|performance|requestAnimationFrame`: only hits are `src/scene.js:39` `powerPreference: 'high-performance'` (a WebGL renderer option string, not a clock) and `src/util.js:2` — a comment asserting "no clocks, no Math.random()".
- Case-insensitive alias sweep `random|uuid|getRandomValues|hrtime|uptime|now\s*\(`: only the same `util.js:2` comment. No `crypto`, no `now()`, no aliased entropy anywhere in `src/`.

- `src/set-office.js` (129 lines; `build` 9–42, `plan` 44–129, `update(t)` 71–127): **zero banned constructs. PASS.** Motion is driven from the seek time `t` via deterministic helpers (`hash`, `noise1`, `clamp`, `ease` from `./util.js`).
- `src/set-desert.js` (978 lines; `build` 88–460, `plan` 464–978, `update(t, sim)` 662–967): **zero banned constructs. PASS.** Acting is driven by `wordTime` word timings and `sampleKeys`/`sampleEnvelope` key sampling — the seek-deterministic pattern the quality bar requires.

## SPEC conformance of `src/timing.json` (code-level)

Measurement basis (stated because the SPEC's gap bands are ambiguous): "silence between lines" is measured **clip-boundary to clip-boundary** — from `row.start + row.duration` (end of the clip's audio) to the next row's `start`. This is provably the authored basis: the SPEC's two fixed reaction beats land **exactly** on it (O1→O3 = 1.200 s vs SPEC "1.2 s before O3"; O3→O4 = 1.500 s vs SPEC "stunned hold of 1.5 s"), and every ordinary turn gap is a uniform 0.750 s (mid-band of 0.6–0.9 s). Perceived spoken gaps (last word end → next first word start) are longer because clips carry TTS tail room; noted where it matters.

### Named cues — 14 of 15 exact

`office` (scene start 0, duration 17.834):

| Cue | SPEC definition | Computed from word/row timings | `timing.json` | Verdict |
| --- | --- | --- | --- | --- |
| `entrance` | 0 → start of S2, ≈ 4 s | S2 office-local start = 4.000 | 4 | ✓ exact |
| `tah` | on "Tah?" in S2 | 4 + 0.98 = 4.980 | 4.98 | ✓ exact |
| `spark` | end of "pterodactyl" in O1 | 8.001 + 2.2 = 10.201 | 10.201 | ✓ exact |
| `dip` | +0.2 s after spark | 10.401 | 10.401 | ✓ exact |
| `crackle` | bolt − 0.8 s | 13.815 − 0.8 = 13.015 | 13.015 | ✓ exact |
| `bolt` | on "old" in O3 | 11.755 + 2.06 = 13.815 | 13.815 | ✓ exact |
| `flash` | start of "Old." in O4 | 16.041 + 0.12 = 16.161 | 16.161 | ✓ exact |
| `end` | scene end | 17.834 | 17.834 | ✓ exact |

`vortex`: `land` — SPEC **2.6 s**, `timing.json` **3.0** → ✗ **defect 1**. Duration 3.5 s ✓ (binding pacing rule "The vortex runs 3.5 s").

`desert` (scene start 21.367, duration 28.415):

| Cue | SPEC definition | Computed | `timing.json` | Verdict |
| --- | --- | --- | --- | --- |
| `sofaLand` | 0.3 s | 0.3 | 0.3 | ✓ exact |
| `rise` | start of D1; = sofaLand + 1.2 s | 22.867 − 21.367 = 1.500; 0.3 + 1.2 = 1.5 | 1.5 | ✓ exact both ways |
| `pan` | start of "Look around" in D3 | 33.536 + 0.12 − 21.367 = 12.289 | 12.289 | ✓ exact |
| `cursorPass` | start of D4 | 39.368 − 21.367 = 18.001 | 18.001 | ✓ exact |
| `stamp` | on "checked" in D4 | 39.368 + 0.109 − 21.367 = 18.110 | 18.11 | ✓ exact |
| `portal` | on "desktop" in D5 | 41.785 + 2.2 − 21.367 = 22.618 | 22.618 | ✓ exact |
| `end` | scene end | 28.415 | 28.415 | ✓ exact |

`intro`: `card1` 0.6, `card2` 1.8, `card3` 3, `card4` 4.2, `card5` 5.4, `card6` 6.6, `chisel` 7.8, `tag` 8.8 — all eight ✓ exact; duration 10.0 s fixed ✓. `endcard`: duration 3.0 s fixed ✓.

### Pacing rules (binding)

- **Turn gaps (clip end → next clip start):** S2→O1 **0.750** ✓ (band 0.6–0.9) · O1→O3 **1.200** ✓ (SPEC-fixed beat) · O3→O4 **1.500** ✓ (SPEC-fixed stunned hold) · D1→D2 **0.750** ✓ · D2→D3 **0.750** ✓ · D3→D4 **0.100** ✗ (defect 2) · D4→D5 **0.750** ✓ · D5→D6 **0.750** ✓.
- **Reaction beats:** spark (10.201) → O3 start 11.755 = 1.554 s and dip (10.401) → O3 = 1.354 s, both ≥ 1.2 ✓. Bolt (13.815) → O4 start 16.041 = 2.226 s ≥ 1.5 ✓. ("They never freeze" is acting — unverifiable here.)
- **White-out hold:** O4 clip ends 17.234; office ends 17.834 → **exactly 0.600 s** before the scene end, +0.033 s to vortex start (17.867) → the ≥ 0.6 s full-white hold is feasible by construction. Whether the render actually reaches and holds full white is animation — unverifiable without frames (and see defect 4: no accepted frame covers this window).
- **Thunder:** crackle = bolt − 0.8 ✓. Strike ~0.25 s peak / ~1 s afterglow / dim flicker through the hold — animation, unverifiable.
- **Cuts vs line starts (≥ 0.4 s):** office end 17.834 (O4 started 16.041; D1 starts 22.867) ✓ · vortex→desert 21.367 → D1 at 22.867 (1.5 s) ✓ · desert end 49.782 (D6 clip ended 49.082; no rows after) ✓.
- **app-window:** portal at global 43.985 → desert end 49.782 = **5.797 s** ≈ SPEC "~6 s" ✓.
- **Camera (≤ 3 shots, each ≥ 2.5 s, ease in/out):** not encoded in `timing.json` — unverifiable from code-level items.
- **Structural integrity:** fps 30, total 62.8 = endcard end exactly. Scene placements: office 0→17.834, vortex 17.867→21.367 (1-frame gap), desert 21.367→49.782, intro 49.8→59.8, endcard 59.8→62.8. The durations are **arithmetically exact** against the SPEC's beats: office = 4 (entrance) + 3.251 (S2) + 0.75 + 2.554 (O1) + 1.2 + 2.786 (O3) + 1.5 + 1.193 (O4) + 0.6 (white tail) = 17.834; desert = 0.3 + 1.2 + 4.571 + 0.75 + 4.598 + 0.75 + 5.732 + 0.1 + 1.667 + 0.75 + 3.621 + 0.75 + 2.926 + 0.7 (tail) = 28.415. The running-order approximations ("~16 s", "~22 s") are superseded by the binding beats, not violated.
- **Rows/speakers/scenes/captions:** rows map 1:1 to the SPEC script (S2 Claude; O1/O3/D6 Codex; O4/D1/D3/D5 Conductor = Ptah's voice; D2 Claude; D4 Cursor; scene fields correct). All 10 caption texts are verbatim from the script, each `start`/`end` equals its row's bounds, every word timing lies inside its row duration, and word counts match caption texts (supports word-by-word sync). Burn-in, 64 px height and ≤ 6 words per rendered line are composition-layer — unverifiable here.

## Scorecard per frame — NOT PRODUCED (no image input)

The brief asks for my own scorecard per frame. I cannot see a single frame, so every number below would be invented; scores are recorded as **N/A** rather than fabricated. Builder scores were not read and are not reproduced. Rows: S = Subject, D = Dressing, L = Light, E = Effect, T = Text/safe area, C = Continuity (pass bar: all ≥ 4).

Office — `snapshots/lane-office/round5/` (accepted set):

| Frame | S | D | L | E | T | C | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| frame-00-at-0.3s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-01-at-1.5s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-02-at-2.7s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-03-at-3.6s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-04-at-3.85s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-05-at-3.95s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-06-at-4.05s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-07-at-4.3s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-08-at-7s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-09-at-10.3s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-10-at-14s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-11-at-16.5s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-12-at-60.916s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |

Desert — `snapshots/lane-desert/round3/` (accepted shots):

| Frame | S | D | L | E | T | C | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| frame-00-at-21.7s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-01-at-25.5s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-02-at-30s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-09-at-42.5s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-10-at-44.1s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-11-at-46s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-12-at-48.5s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |

Desert — `snapshots/lane-desert/round5/` (crew and stamp, 33.8–40.4 s):

| Frame | S | D | L | E | T | C | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| frame-00-at-33.8s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-01-at-35s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-02-at-36.5s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-03-at-39s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-04-at-39.2s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-05-at-39.4s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-06-at-39.5s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-07-at-39.8s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-08-at-40s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |
| frame-09-at-40.4s.png | N/A | N/A | N/A | N/A | N/A | N/A | NOT ASSESSED |

Look-dev refs `snapshots/lookdev/office.png` / `desert.png`: not viewable — no look-dev match assessment.

## Defect list

1. **[BLOCKING — SPEC conformance] `src/timing.json` — vortex `land` cue is 3.0 s; SPEC.md says 2.6 s.**
   SPEC §Named action cues is binding ("They are written into `src/timing.json`"): "`vortex`: `land` (2.6 s)"; `timing.json` has `"land": 3`. Consequence: the sofa lands 0.4 s late, leaving 0.5 s of landed rest before the desert cut instead of the SPEC's 0.9 s — a rushed landing read.
   **Fix:** one number — set `land` to `2.6` and re-time the vortex tumble to it (Lane B animates props to cues). If the later landing was the approved creative change, amend the SPEC cue line instead; the contract and the file must agree either way.

2. **[MINOR — pacing] `src/timing.json` — D3→D4 clip gap is 0.100 s, below every SPEC gap band.**
   D3 clip ends 39.268; D4 starts 39.368. Binding bands: 0.6–0.9 s between different speakers (Conductor→Cursor); 0.3–0.5 s between phrases of one line (D3 + D4 are one split sentence). The perceived spoken gap is worse: D3's last word "it's—" ends at 38.096; D4's "—checked!" starts at 39.477 → **1.381 s** of dead air, and `cursorPass` (39.368) begins only 0.109 s before the bark, so the zip-through cannot fill the beat unless it starts well before its own cue. For an interruption that "finishes his sentence", 1.38 s after the trail-off reads late.
   **Fix:** either add an explicit D3→D4 interruption exception to SPEC §Pacing, or tighten D4 by ~0.4–0.6 s (shift D4 earlier / trim D3's 1.172 s tail) so the perceived gap sits in 0.6–0.9 s, recomputing `cursorPass` and `stamp` from the new D4 start.

3. **[MINOR — pacing, TTS-bound] Three within-line phrase gaps exceed the 0.3–0.5 s band.**
   S2 "Hmm…"→"Tah?" = 0.67 s; S2 "Tah?"→"The" = 0.51 s; D2 "Respectfully…"→"why" = 0.60 s. These are measured word timings of the recorded takes, and the script's own ellipses call for pauses, so they read as deliberate rather than rushed.
   **Fix:** accept and note in SPEC (preferred), or re-take S2/D2. No `timing.json` change — word timings are descriptive of the audio.

4. **[MINOR — review-set coverage] The accepted frame set cannot verify several binding rules — even with image input.**
   - Office: no frame at `tah` (4.98 s), none at `crackle` (13.015 s), and none in the white-out hold window (17.234–17.834 s; the last office frame is 16.5 s) — the binding "full white ≥ 0.6 s before the vortex" rule is unverifiable from this set.
   - Desert: no frame at `rise` (22.867 s — the D1/eye-glow/head-turn cue and the "1.2 s looking around" beat) and none at desert `end` (49.782 s).
   **Fix:** add snapshots at ≈ 4.98, ≈ 13.0, ≈ 17.6 (office) and ≈ 22.9, ≈ 49.7 (desert) so a reviewer with image input can check every named cue, per quality-bar §2 (contact sheet: "frames at scene start, every named cue, the midpoint and the last frame").

### Non-defect observations

- SPEC-internal inconsistency: the running-order table says vortex ≈ 3.0 s while the binding pacing section says 3.5 s. `timing.json` (3.5) follows the binding rule — recommend correcting the running-order cell to 3.5 s.
- Office 17.834 s vs "~16 s" and desert 28.415 s vs "~22 s" in the running order: the binding beats sum to exactly the built durations (arithmetic above), so these are stale estimates, not violations.
- Everything else in `timing.json` conforms exactly: 14 of 15 named cues, both fixed reaction beats, uniform 0.75 s turn gaps, sofaLand+1.2=rise, app-window 5.797 s ≈ ~6 s, intro/endcard fixed durations, cuts ≥ 0.4 s from line starts, captions verbatim with row-bounded timing, complete in-bounds word timings, total 62.8 s at 30 fps.

## What this reviewer could not do

- View any PNG/JPG (model-level limitation) → no look-dev comparison, no contact-sheet check, no per-frame scorecard, no visual banned-shortcut audit, and **no scene can be visually ACCEPTED or REJECTED by this review**.
- Verify animation-only rules from code (camera shot count/length, thunder strike/afterglow, "never freeze" acting, white-out actually reaching full white, caption burn-in geometry) — these need frames or a live run, and the brief forbade running the renderer.
