# Change

Added a Sketchfab `gltf` manifest item for **Ptah-Sokar-Osiris Figure (W2059)** and support for Sketchfab Download API items in `tools/media/fetch-media.mjs`. The fetcher reads `SKETCHFAB_API_TOKEN` from the environment or repository root `.env`, requests a temporary download URL, verifies the archive hash when pinned, and extracts glTF ZIP contents into the ignored model folder. Token and temporary URL are never written or printed. `--check` accepts an extracted folder containing files. Existing credits generation includes the manifest item and its end-card line: `"Ptah-Sokar-Osiris Figure (W2059)" by The Egypt Centre, Swansea University, CC BY 4.0`.

# Usage

Create a token at https://sketchfab.com/settings/password (API token section).
Add `SKETCHFAB_API_TOKEN=...` to the repository root `.env`.

# Verification

`node --check tools/media/fetch-media.mjs`: exit 0.

`node tools/media/fetch-media.mjs demos/agent-pronounce --check`: exit 1, expected for the absent Sketchfab download. Tail:

```text
ok   assets/third-party/textures/worn_rock_natural_01/worn_rock_natural_01_disp_2k.jpg
209/210 ok
```

The earlier output contained `FAIL assets/third-party/models/sketchfab/ptah-sokar-osiris-w2059/: missing (run without --check to fetch)`; all other items passed.

`node tools/guards/no-media.mjs`: exit 0. Tail included `no-media: checked 461 files; no violations`. It also reported two already missing tracked handoff files outside this change.

# Decisions

`sha256` is empty because no API token is available to download and hash the archive. On a token-authenticated fetch, `--pin` can record the archive hash. Sketchfab's [Download API](https://sketchfab.com/developers/download-api) returns short-lived URLs; its [download guide](https://sketchfab.com/developers/download-api/downloading-models) specifies the ZIP archive workflow. The episode `.gitignore` already has `assets/third-party/`, confirmed with `git check-ignore` for the new path. No media or credits file was generated during the read-only check.

The Ptah tool server and CLI skill discovery were unavailable in this lane, so `ptah_agent_report` could not be called. No files outside the three requested deliverables were changed by this lane.
