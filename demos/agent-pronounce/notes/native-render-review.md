# Encoded draft frame review

**APPROVED for the inspected draft frames — no blocking visual defect found in these samples.** This is an independent native Codex review of the actual encoded MP4, not reused browser screenshots. Same-family evidence is weaker because the user disabled CLI lanes after permission/report failures and child sessions failed attribution; the reviewer did not implement these changes.

Source: renders/preview-v4-native-draft.mp4. Extracted ten frames in one software ffmpeg decode (exit0), using exact zero-based frame indices. Opened every PNG with view_image. Artifacts: renders/native-review/frame-01.png through frame-10.png.

| PNG | Frame / time at30fps | Observation |
| --- | --- | --- |
| 01 |147 /4.900s|Workspace bodies/faces visible; caption readable without covering faces. Approved hand/head treatment retained.|
| 02 |651 /21.700s|Codex close talk frame; eyes and chest visible; caption legible.|
| 03 |1150 /38.333s|Vortex faces readable, Codex arms raised; lower location card does not cover heads. Funnel/stone context present.|
| 04 |1193 /39.767s|Landing dust/bright storm bridge present; both figures and eyes remain discernible through intentional transition haze. Location card readable. No new framing defect asserted against accepted dust direction.|
| 05 |1409 /46.967s|Visitors standing beside chairs; full colossus visible and cyan eye light visible at the distant face. Approved rear visitor view retained.|
| 06 |1860 /62.000s|Actual application footage on the in-world stone screen, crews and visitors retained; caption readable. Small application text remains intentionally secondary and soft at draft quality.|
| 07 |2899 /96.633333s|Bare sandstone fills the outgoing frame.|
| 08 |2900 /96.666667s|Bare sandstone remains; the formerly blank exact boundary frame is fixed in the encoded output.|
| 09 |2901 /96.700s|Intro stone wall appears directly after the sandstone; no intervening blank frame in these consecutive samples.|
| 10 |3135 /104.500s|Endcard tagline, ptah.live URL, robot attribution and W2059/Egypt Centre/Swansea/CC BY4.0 credit lines readable.|

The three seam samples are consecutive actual encoded frames, so they directly cover the previously failing frame rather than relying on a nearby timestamp approximation. The MP4's compressed appearance is visible in fine details, but captions/credits and required subjects remain readable at these samples. The intentional 3D sandstone-to-graphic wall cut is not claimed to be a pixel-matched texture transition.

Parent's ffprobe independently reports1920x1080 H.264,30fps,3201frames, video106.700s and AAC48kHz stereo audio106.670s. These metadata/audio measurements were supplied by parent; this reviewer only performed image decoding and visual inspection. No audio listening, lip-sync pass, complete motion playback, exhaustive frame inspection or final-quality render approval is claimed. This scoped result complements native-integration-review.md and native-final-pr-review.md.

No source edits, GPU/browser work, CLI lanes, process stops or commits were performed. Only this report and ignored decoded frames were written.
