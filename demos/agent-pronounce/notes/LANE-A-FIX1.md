# Lane A — fix round 1

## Fixes

1. **Address bar — done.** The Ptah tab swaps the visible address to `ptah.live` at its `nextTab` cue. The 5.5 s snapshot shows it.
2. **Ptah hero — done.** Removed the pronunciation line and duplicate emblem image from the screen insert template. The 5.5 s snapshot shows one large `PTAH` wordmark.
3. **App window — done.** Its 960 × 650 px bounds are left 60, top 350 in a 1080 × 1350 frame, so its centre is exactly (540, 675). It scales from that centre, with a blurred gold glow behind it. The three video clips have overlapping local media intervals and 0.3 s opacity cross-fades. Snapshots at 44.9, 46.9, and 48.8 s show three distinct video images. Still snapshots cannot prove continuous motion between frames; the timed video elements and distinct captured images support playback.
4. **Length — partly done; 60 s target unmet under the authorized constraint.** Reduced office lead-in from 0.4 to 0 s and desert lead-in from 0.8 to 0.3 s in `scripts/audio/running-order.mjs`. Existing inter-line gaps were already 0.35 s, punchline replies 0.6 s, and scene-end holds 0.7 s. D3→D4 remains a scripted zero-gap handoff. Regenerated cues and rebuilt `index.html`, `src/timing.json`, and compositions using `node src/build-timing.mjs`. New total is **62.767 s**. Reaching 60 s requires changing something beyond gap settings, such as VO pace, line content, or fixed scene durations. Intro remains 10.0 s; endcard remains 3.0 s; cue names remain intact.
5. **S2 and O1 audio — done.** Regenerated only these two voice files with phonetic TTS (`Puh… Taa?` and final `Taa.`), using `node scripts/audio/generate.mjs --redo S2,O1`. Caption text remains the SPEC wording. ElevenLabs QA transcribed S2 as “Next ta, pa, ta” (separate `pa, ta`) and O1 ending as “Ta” (no P). The transcription does not establish the exact vowel, but supports the required syllable split and silent P in O1.

## Timing

| Scene | Start (s) | Duration (s) |
| --- | ---: | ---: |
| screen | 0.000 | 6.622 |
| office | 6.633 | 14.338 |
| vortex | 21.000 | 3.000 |
| desert | 24.000 | 25.765 |
| app-window overlay | 44.118 | 5.647 |
| intro | 49.767 | 10.000 |
| endcard | 59.767 | 3.000 |

Total: **62.767 s**. The overlay start is desert start plus `portal` cue (20.118 s).

## Snapshots

- `snapshots/lane-a-fix1/frame-00-at-5.5s.png` — **pass**: Ptah tab, `ptah.live`, one large wordmark, no pronunciation line.
- `snapshots/lane-a-fix1/frame-01-at-20.9s.png` — **fail outside Lane A scope**: last office frame is blank/dark; Lane B owns the 3D office source.
- `snapshots/lane-a-fix1/frame-02-at-44.9s.png` — **pass**: centred app window, first clip image.
- `snapshots/lane-a-fix1/frame-03-at-46.9s.png` — **pass**: centred app window, second clip image.
- `snapshots/lane-a-fix1/frame-04-at-48.8s.png` — **pass**: centred app window, third clip image.
- `snapshots/lane-a-fix1/contact-sheet.jpg` — reviewed all five frames together.

## Checks

- `node node_modules/hyperframes/dist/cli.js check --json`: `ok: true`; zero lint, runtime, or layout errors. Two nested-media timing warnings, one address contrast warning, and one transient overlap info finding.
- `node tools/guards/no-media.mjs` from repository root: passed, 304 tracked files checked, no violations.
- Ptah scoped diagnostics: unavailable; no `tsconfig.json` owns the three edited JavaScript files.

## Decisions

- **Remove the emblem in this screen insert.** Options were retaining/cropping the asset or removing it. The current image viewed as a solid gold square and the prompt allows dropping the small duplicate branding; removing it leaves a clear single wordmark. Reversible in the screen template.
- **Keep pacing minimums and report the length miss.** The running order already used the specified minimum line gaps and end holds. Reducing those further would break the explicit pacing rule. Reversible if the parent authorizes a change to VO speed or scene duration.
- **Use phonetic TTS spellings only for S2 and O1.** Prior QA flagged both, and the new transcription reflects separate syllables and no P in O1. Reversible by replacing only these two VO files.
