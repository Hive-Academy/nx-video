# Lane C v3 audio

## What plays where

Clip gain is the `data-volume` on the element. The office bed and the showcase bed also have loudness envelopes baked into the file. Line times are unchanged. Total 106.831 s. 33 clips.

### Office 0.000–36.898

The office-night bed is the only thing in the first 4 s. Its file is full level outside the dialogue and at 0.4 inside it (`between(t,4,end-0.6)`), with a 1 s fade-in and a 0.6 s fade-out, then the clip fader at 0.03. Measured entrance (0–4 s) is −67.19 LUFS, the same as before this pass.

| Clip | Start | End | Gain |
| --- | ---: | ---: | ---: |
| music-0 office-night-bed | 0.000 | 36.898 | 0.03 |
| vo-n1 | 4.000 | 6.694 | 1 |
| vo-n2 | 7.794 | 9.977 | 1 |
| vo-n3 | 11.227 | 16.753 | 1 |
| vo-n4 | 17.853 | 19.478 | 1 |
| vo-n5 | 20.578 | 22.157 | 1 |
| vo-s2 | 23.257 | 26.358 | 1 |
| vo-o1 | 27.458 | 30.012 | 1 |
| electric-spark | 29.658 | 30.658 | 0.7 |
| lights-dip | 29.858 | 31.858 | 0.7 |
| vo-o3 | 30.512 | 33.298 | 1 |
| rumble | 33.898 | 35.898 | 0.45 |
| sandstorm | 35.298 | 40.398 | 0.5 |

### Vortex 36.898–40.398

| Clip | Start | End | Gain |
| --- | ---: | ---: | ---: |
| sandstorm (continues) | 35.298 | 40.398 | 0.5 |
| desert-wind (starts) | 39.998 | 54.998 | 0.25 |

### Desert 40.398–96.801

Wind and the work crew carry the open. Dialogue has no separate music bed. From 54.998 the looped desert wind continues, including under the showcase and out past D6. The new bed sits on top of that wind from 70.375 to 90.675.

| Clip | Start | End | Gain |
| --- | ---: | ---: | ---: |
| desert-wind | 39.998 | 54.998 | 0.25 |
| work-crew | 40.398 | 55.398 | 0.25 |
| vo-o4 | 45.398 | 46.591 | 1 |
| vo-d1 | 48.041 | 52.612 | 1 |
| vo-d2 | 53.712 | 58.310 | 1 |
| showcase-wind-0 | 54.998 | 69.998 | 0.25 |
| vo-d3 | 59.410 | 67.675 | 1 |
| stone-stamp | 65.410 | 66.410 | 0.7 |
| vo-d5 | 68.175 | 71.796 | 1 |
| showcase-wind-1 | 69.998 | 84.998 | 0.25 |
| choir-swell | 70.075 | 74.075 | 0.7 |
| music-3 showcase-bed | 70.375 | 90.675 | 0.28 |
| showcase-wind-2 | 84.998 | 99.998 | 0.25 |
| window-return (choir-swell) | 89.675 | 91.875 | 0.26 |
| vo-d6 | 91.175 | 94.101 | 1 |
| title-scrape (chisel) | 96.581 | 97.581 | 0.3 |

### Title wall 96.831–102.831

| Clip | Start | End | Gain |
| --- | ---: | ---: | ---: |
| music-1 intro-theme | 96.831 | 102.831 | 0.45 |
| title-scrape (continues) | 96.581 | 97.581 | 0.3 |
| chisel | 97.431 | 98.431 | 0.7 |
| showcase-wind-2 (continues) | 84.998 | 99.998 | 0.25 |

### End card 102.831–106.831

| Clip | Start | End | Gain |
| --- | ---: | ---: | ---: |
| music-2 end-sting | 102.831 | 105.831 | 0.45 |
| endcard-ambience (office-night-bed) | 102.831 | 106.831 | 0.08 |

Master bus, unchanged: gain +3.2 dB, then a limiter at −1.5 dB.

## Changes

- `scripts/audio/generate.mjs`: renders `assets/audio/music/showcase-bed.mp3` from cached `bed.mp3` and appends it to `musicClips`. No line, cue, or scene duration changed. `cues.json` total stays 106.831.
- `scripts/audio/measure-mix.mjs`: also reports the longest run at or below −70 dBFS, the showcase duck in dB, and voice-minus-bed for the D5 overlap and for N1.
- `scripts/audio/running-order.mjs`: not edited.
- `src/build-timing.mjs`: not edited. Running it rewrote `index.html` (new `music-3` element) and `src/timing.json` from the same timeline. Checked totals and line starts: N1 4.000, D5 68.175, D6 91.175, desert `pushIn` 29.977, `showcaseEnd` 49.977, total 106.831.
- Generated audio files stay under `assets/audio/` and are git-ignored. `office-night-bed.mp3` was re-encoded by the existing office-bed step with the same filter.

## Showcase bed

- File: `assets/audio/music/showcase-bed.mp3`, cut from cached `bed.mp3` at source 20.000–40.300 s. That slice measures about −11.6 dBFS mean, before the quieter break near 50 s. Whole-file readings: `bed.mp3` 116.036 s, −11.83 LUFS, −0.86 dBTP, LRA 10.9. `bed-92bpm.mp3` is already near −16.5 LUFS but less even. `bed-edit.mp3` is −23.72 LUFS with LRA 17.2, too thin and too wide. `intro-theme.mp3` is 10 s and already used on the title wall. `office-night-bed.mp3` is −43.22 LUFS room tone.
- Placement: 70.375–90.675 s, clip gain 0.28, duration 20.300 s.
- Fade in: 0.600 s from 70.375. Fade out: 0.800 s from 89.875, finished at 90.675. D6 starts at 91.175, so the bed is gone 0.500 s before the line.
- Duck: hold at −14 dB until local 1.421 s (absolute 71.796, the end of D5), then rise to full over 0.430 s. Measured on the rendered file at clip gain 0.28: full groove (local 3.2–4.4) −25.0 dBFS, ducked hold (local 0.7–1.4) −40.4 dBFS, duck 15.4 dB. `measure-mix` reports `showcaseDuckDb` 15.4.
- Accents: a +3 dB lift of the same bed, 80 ms up and back down by 450 ms, at local 5, 10 and 15 s (absolute 75.375, 80.375, 85.375). No extra sound-effect file.
- Wind and both choir swells are unchanged underneath.

## Mix before and after

Before is the mix on disk at the start of this pass (32 clips). After is `node scripts/audio/measure-mix.mjs` on the final 33-clip mix.

| | Before | After |
| --- | ---: | ---: |
| Integrated | −16.89 LUFS | −16.97 LUFS |
| True peak | −1.41 dBTP | −1.41 dBTP |
| LRA | 18.5 LU | 9.0 LU |
| Longest silence (≤ −70 dBFS) | 0.601 s | 0.604 s |
| Office RMS | −20.7 dBFS | −20.7 dBFS |
| Vortex RMS | −17.7 dBFS | −17.7 dBFS |
| Desert RMS | −19.0 dBFS | −16.6 dBFS |
| Intro RMS | −18.4 dBFS | −18.4 dBFS |
| End card RMS | −25.3 dBFS | −25.3 dBFS |

Showcase integrated loudness, same wav the final measure wrote:

| Window | Before | After |
| --- | ---: | ---: |
| 70.375–90.375 | −9.85 LUFS, LRA 28.3 | −14.84 LUFS, LRA 8.1 |
| 75.375–80.375 | −35.77 LUFS | −17.72 LUFS |
| 80.375–85.375 | −39.63 LUFS | −17.47 LUFS |
| 85.375–90.375 | −31.29 LUFS | −17.84 LUFS |

The wide range was those three quiet wind sections against the entry swell. They now sit with the dialogue. Entrance 0–4 s is still −67.19 LUFS. Targets: −16.5 ± 0.7 LUFS, true peak ≤ −1.0 dBTP, LRA ≤ 11, no silence longer than 1.0 s. All four hold.

## Voice-to-bed differences

Stems after clip gain. Master +3.2 dB is applied to both, so the difference does not change.

- Showcase overlap, full window 70.375–71.796, from `measure-mix` (`vo-d5` over `music-3`): voice −26.3 dBFS, bed −36.8 dBFS, voice 10.5 dB above the bed. The last 0.88 s of D5 is room tail near −58 dBFS, which pulls this mean down.
- The word "desktop." (70.375–70.915), file means at the clip gains: voice −25.3 dBFS, bed −42.0 dBFS, voice 16.7 dB above the bed. The bed is still inside its 0.6 s fade-in there, so it is quieter than the −14 dB hold.
- Office line N1 (4.000–6.694), from `measure-mix`: voice −20.4 dBFS, office-night bed −73.3 dBFS, voice 52.9 dB above the bed.

No extra dialogue bed was added. The office already has one, far more than 14 dB under the voices. Desert dialogue already integrated near −19 LUFS; the range problem was the showcase hole, not a missing bed under the lines.

## Generated audio

Yes. One new file, `assets/audio/music/showcase-bed.mp3`, made with ffmpeg from cached `bed.mp3`. No ElevenLabs call. `generate.mjs` did not synthesize a voice, a sound effect, or a music prompt.

## Verification

- `node scripts/audio/generate.mjs`: exit 0. Printed `Wrote cues.json 106.831`. No TTS and no MUSIC log line.
- `node src/build-timing.mjs`: exit 0. Printed `Timeline 106.831 office → vortex → desert → intro → endcard audio`.
- `node scripts/audio/measure-mix.mjs`: exit 0. `{"clips":33,"integratedLufs":-16.97,"truePeakDbtp":-1.41,"lra":9,"longestSilenceSec":0.604,"showcaseDuckDb":15.4}`.
- `node tools/guards/no-media.mjs` from `D:/projects/nx-video`: exit 0. `no-media: checked 432 files; no violations`.
- HyperFrames `check`, snapshot, and render were not run.

Skill: `hyperframes-audio` was read from disk. This session has no skill-load command, so that file read is the load. The project's mix is constant `data-volume` plus a baked envelope, which is what both playback and `measure-mix` hear. A spectral carve was not written: the bed is held down for the whole D5 overlap and is not at full level under any word.

Ptah tools: no connected server named `ptah` (the tool search returned the `tasks` server only). File reads, search, and ffmpeg were the fallback.

## Decisions

- Used the even 20 s of `bed.mp3` rather than generating a new cue. Clip gain 0.28 puts the bare groove near the dialogue without lifting the film peak.
- Baked fades, the −14 dB duck, and the three +3 dB lifts into the file so the measurement script and the render agree.
- Left the 4 s entrance, the choir swells, the wind loops, and the master gain and limiter as they were.
- Did not put a second bed under desert dialogue. Office is already 53 dB under N1, and fixing the showcase brought LRA from 18.5 to 9.

## Open defects

- The full D5-overlap mean (10.5 dB) counts the near-silent tail after "desktop." The word itself is 16.7 dB above the bed.
- The end card is still the quiet scene (−25.3 dBFS RMS). Its short-term loudness stays inside the film LRA of 9.
- The first showcase wind loop still runs to 99.998 s, under D6 and into the title. Left as scheduled.
- No frames and no HyperFrames check from this lane.
