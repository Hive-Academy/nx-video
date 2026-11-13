# Review procedure

Run every command from the episode folder (`demos/<episode>/`) unless a step says otherwise. On
Windows, run the CLI with `node` directly. Never spawn `npx.cmd` and never use a shell wrapper.

## 1. Pick the times

Read `src/timing.json`. For each scene you own, list:

- scene `start + 0.1`
- every `start + cue`
- the scene midpoint
- `start + duration - 0.1`

Add the transition midpoint for each cut into or out of the scene.

## 2. Snapshot

```bash
node node_modules/hyperframes/dist/cli.js snapshot --at 4.6,8.2,12.6 --output snapshots/<lane>-<round> --timeout 120000
```

Always pass `--output`. The managed folder under `.hyperframes/artifacts/` is pruned automatically.
Open every PNG with your image-reading tool. A file you did not look at
has not been reviewed.

If you have no browser or MCP tools, the CLI snapshot is still required. It does not depend on MCP.

## 3. Contact sheets

The CLI makes the sheets, so do not hand-tile them:

```bash
node node_modules/hyperframes/dist/cli.js snapshot --review --composition <scene-id> --output snapshots/<lane>-<round>/review --json
```

This writes three kinds of sheet:

- `review-beats.jpg`: each scene at start + 0.3 s and at its middle.
- `review-seam-NN.jpg`: frames from −0.2 to +0.2 s around every cut.
- `review-phone.jpg`: the frames at 360 px wide, for judging legibility at phone size.

`--at` also writes a contact sheet for your cue times. Look at every sheet. Then open full-size PNGs
to check faces, effects and thin geometry, because a sheet shows you where to look, not whether the
detail holds up.

## 4. Score

Score every frame against `scorecard.md` and write the table into your notes. Fix every row that
scores below 4, snapshot the same times again, and score again. Repeat until every row passes or you
run out of budget. If you run out of budget, list what is still failing under `## Open defects`.

## 5. Pacing and audio (Lane A, or whoever owns the mix)

| Check | Bar |
| --- | --- |
| Hook | A clear subject and the premise by 2.0 s |
| Speech rate | ≤ 3 words/s per line. Retake faster lines. |
| Gaps | ≥ 0.35 s between lines, ≥ 0.6 s before a punchline, 0.7 s hold at the end |
| Length | 45–60 s, unless the brief says otherwise |
| Loudness | Dialogue near −16 LUFS integrated. SFX peaks audible (louder than −20 dBFS) but not clipping. |
| Listen | Play the mix once end to end. A measurement does not replace listening. |

Use `node node_modules/hyperframes/dist/cli.js audio` for the measurements.
