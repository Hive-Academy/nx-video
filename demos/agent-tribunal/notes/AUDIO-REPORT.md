# Audio report: The Tribunal, Episode 1

Generated on 2026-11-05 with `node scripts/audio/generate.mjs` (ElevenLabs API, ffmpeg 9.0).
`node src/build-timing.mjs` then printed `Timing: cues.json; 95.49s; 13 scenes`. The timing is
driven by the cues, not by placeholders. `index.html` now has 33 `<audio>` clips: 20 voice, 12 SFX
and 1 music.

**Total runtime: 95.49 s.** That is the last line, then the 3 s end card. It is about 5 s over
the 70–90 s target. The voice sets the clock, as the spec asks, so no line was sped up or cut.

## Voices

Model: `eleven_multilingual_v2`, output `mp3_44100_128`. Casting and settings are in `assets/audio/voices.json`.

| Agent | Voice | Voice id | Settings (stability / similarity / style / speed) |
| --- | --- | --- | --- |
| Claude | Alice | `Xb7hH8MSUJpSbSDYk0k2` | 0.40 / 0.80 / 0.45 / 1.05 |
| Codex | Callum | `N2lVS1w4EtoT3dr4eOWO` | 0.92 / 0.80 / 0.00 / 0.90 |
| Cursor | Laura | `FGY2WhTYpPnrIDTdsKH5` | 0.30 / 0.75 / 0.80 / 1.15 |
| Antigravity | River | `SAz9YHcvj6GT2YYXdXww` | 0.35 / 0.70 / 0.50 / 0.88 |
| OpenCode | Daniel | `onwK4e9ZLuTAKqWW03F9` | 0.70 / 0.85 / 0.30 / 1.00 |
| Conductor | Brian | `nPczCjzI2devNBz1zQrb` | 0.75 / 0.85 / 0.20 / 0.85 |

Every voice uses speaker boost.

## Files (all under `assets/audio/`, which is gitignored)

- `vo/NN-speaker.mp3`: the normalized lines for rows 1, 3–16, 18, 19 and 21.
- `vo/17a..17e-*.mp3`: the five chaos fragments. `vo/17-all-five.mp3` mixes them, each one 0.5 s after the last.
- `vo/20a..20e-*.mp3`: the five unison takes. `vo/20-all-five.mp3` layers them with offsets of 0–45 ms.
- `raw/vo/*`: the TTS output before normalization. `raw/mix/*`: the intermediate WAV mixes.
- `sfx/`: gavel-1, gavel-2, sting-1, sting-2, title-slam, whoosh-1, whoosh-2, paper-thud, mug-sip, stamp-slam.
- `music/bed.mp3`: the generated 90 s bed. `music/bed-norm.mp3` is the normalized copy, and `music/bed-edit.mp3` is the copy cut to the timeline. `music/status.json` holds the result of the music request.
- `cues.json`: fps, total, voices with their envelopes, SFX placements, music and timeline.
- `envelopes.json`: the envelopes keyed by row.
- `voices.json`: the casting.
- `generate-report.json`: the loudness readings and any failures.

Scripts are in `scripts/audio/`: `lib.mjs` (API, env and ffmpeg helpers), `script-data.mjs`
(casting, lines and prompts) and `generate.mjs` (the pipeline). The script reads the API key
from `../../.env` at runtime and never logs it.

## Loudness

Normalization is two-pass ffmpeg `loudnorm` in linear mode, targeting I=-16, TP=-1.5 and LRA=11, and the output is mono MP3 at 192k.

- Every voice file measures a true peak between -1.70 and -1.78 dBTP. The unison mix measures -4.1 dBTP. All are at or below -1 dBTP.
- Integrated loudness is -16.3 to -17.7 LUFS for most lines.
- The very short lines read -18.2 to -19.6 LUFS: rows 6, 10, 13, 18 and 21. Linear mode stops the gain at the true-peak ceiling, so these lines could not be raised further.

## Skipped or failed

Nothing. The music endpoint worked on this (pay-as-you-go) plan.

## Decisions

- **Model.** The account also lists `eleven_v3` and `eleven_v4`. `eleven_multilingual_v2` was used because it is reliable and honours `<break time>` tags. The tags render the "(beat)" pauses in rows 1 and 18.
- **Stage directions are not spoken.** "(beat)" became a break of 0.7–0.9 s. "(pause)" before row 20 and the "two-beat pause" before row 10 are timeline gaps of 0.5 s and 0.6 s.
- **Rows 17 and 20 are pre-mixed into one file per row.** `build-timing.mjs` places each voice at its row's start, so separately staggered fragments would all start at once. The cue for each row carries a `layers` array listing the individual takes.
- **Row 18 has 0.65 s of lead silence baked in.** The gavel (`gavel-2`) peaks at row start + 0.05 s, then there is 0.6 s of silence before "Enough." This keeps the voice aligned while the generator places voices at row start. The envelope is 0 during the silence, so the robot is still.
- **Timeline.** Lines play back to back with 0.25 s gaps. Row 5 overlaps the end of row 4 by 0.3 s. Row 2 lasts 2.5 s and row 22 lasts 3 s. There is no gap after the title, which matches the generator's own fallback.
- **SFX are placed by peak.** Each SFX cue has `hit`, which is when the transient should land, and `start = hit - peak`. Two cues are found from the line envelopes:
  - The mug sip lands on row 1's first silent beat.
  - Gavel-1 lands on the onset of "Go" in row 3.

  Two takes are reused under their own cue ids: `mug-sip-14` (the sip on row 14) and `sting-21` (the sting out). Each SFX has a volume of 0.6–1.0.
- **Music.** The bed is loudness-normalized, looped or trimmed to 95.49 s, and silenced 20 ms before the row-18 gavel (an 80 ms ramp). It comes back at the end card (a 0.3 s ramp) and fades out over the last 0.8 s. The spec mix of "drops out on the gavel, returns under the end card" is therefore baked into `bed-edit.mp3`. `build-timing.mjs` plays it at 0.14.
- **Envelopes.** Each envelope is the RMS of mono 48 kHz PCM over windows of 1/30 s (one value per frame), normalized per file to 0..1. The generator emits them unshifted, so the scene code has to add the 2-frame lag the spec asks for. This run did not check whether `src/scene.js` adds it.
- **Casting.** The premade library has no nasal voice. OpenCode uses Daniel, a formal and precise British broadcaster, for the pedantic read.
