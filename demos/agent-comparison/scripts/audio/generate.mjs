// Generates the voice, SFX and music for "Agent Cribs" (Episode 2) with the ElevenLabs API, trims and
// normalizes it with ffmpeg, aligns every spoken row (forced alignment), lays out the running order and
// writes assets/audio/cues.json for src/build-timing.mjs.
//
// Usage: node scripts/audio/generate.mjs [--force] [--force-post] [--no-music] [--redo <row,row>]
//   --force       re-request everything from ElevenLabs (costs credits)
//   --force-post  redo trimming / normalization / mixes / alignment-independent measurement only
//   --redo C1,H3  re-request the TTS (and alignment) of these rows only
// Idempotent: existing non-empty files are reused (raw TTS, raw SFX, music, normalized files, alignments).
// The API key is read from ../../.env at runtime and never printed or written.
import fs from 'node:fs';
import path from 'node:path';
import { AUDIO, ROOT, api, run, hasFfmpeg, duration, pcm, ensureDir, exists, rel } from './lib.mjs';
import { CAST, LINES, SFX, SFX_REUSED, MODEL, OUTPUT_FORMAT, MUSIC_PROMPT, BEAT } from './script-data.mjs';
import { layout, FPS } from './running-order.mjs';

const argv = process.argv.slice(2);
const args = new Set(argv);
const FORCE = args.has('--force');
const FORCE_POST = FORCE || args.has('--force-post');
const redoAt = argv.indexOf('--redo');
const REDO = new Set(redoAt >= 0 ? String(argv[redoAt + 1] || '').split(',').filter(Boolean) : []);
const FRAME = 1 / FPS;
const EP1 = path.resolve(ROOT, '..', 'agent-tribunal', 'assets', 'audio', 'sfx');

const dirs = {
  rawVo: path.join(AUDIO, 'raw', 'vo'), rawMix: path.join(AUDIO, 'raw', 'mix'), rawSfx: path.join(AUDIO, 'raw', 'sfx'),
  vo: path.join(AUDIO, 'vo'), sfx: path.join(AUDIO, 'sfx'), music: path.join(AUDIO, 'music'), align: path.join(AUDIO, 'align'),
};
Object.values(dirs).forEach(ensureDir);
const log = (...a) => console.log('[audio]', ...a);
const report = { skipped: [], failures: [], warnings: [], loudness: {}, takes: {} };

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const voName = (row, speaker) => `${row.toLowerCase()}-${slug(speaker)}.mp3`;
const takes = line => line.layers ? line.layers.map(sp => ({ speaker: sp, file: voName(line.row, sp) })) : [{ speaker: line.speaker, file: voName(line.row, line.speaker) }];
const mainFile = line => line.layers ? `${line.row.toLowerCase()}-all-five.mp3` : voName(line.row, line.speaker);
const alignText = line => (line.tts || line.text).replace(/<break[^>]*\/>/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = s => s.split(/\s+/).filter(Boolean);
for (const line of LINES) {
  if (tokens(alignText(line)).length !== tokens(line.text).length) throw new Error(`row ${line.row}: tts tokens (${alignText(line)}) do not match the caption tokens (${line.text})`);
}

// ---------- 1. TTS ----------
fs.writeFileSync(path.join(AUDIO, 'voices.json'), JSON.stringify({
  model_id: MODEL, output_format: OUTPUT_FORMAT, note: 'Same voice ids and settings as Episode 1 (../agent-tribunal/assets/audio/voices.json).',
  voices: Object.fromEntries(Object.entries(CAST).map(([k, v]) => [k, { voice_id: v.voice_id, name: v.name, why: v.why, settings: v.settings }])),
  lines: LINES.map(l => ({ row: l.row, speaker: l.speaker, text: l.text, tts: l.tts || l.text, ...(l.settings ? { settingsOverride: l.settings } : {}), voices: takes(l).map(t => ({ speaker: t.speaker, voice_id: CAST[t.speaker].voice_id })) })),
}, null, 2));

for (const line of LINES) {
  for (const t of takes(line)) {
    const out = path.join(dirs.rawVo, t.file);
    if (exists(out) && !FORCE && !REDO.has(line.row)) continue;
    const cast = CAST[t.speaker];
    log('tts', t.file);
    const audio = await api('POST', `/v1/text-to-speech/${cast.voice_id}`, {
      query: { output_format: OUTPUT_FORMAT }, accept: 'audio/mpeg',
      json: { text: line.tts || line.text, model_id: MODEL, voice_settings: { ...cast.settings, ...(line.settings || {}) } },
    });
    fs.writeFileSync(out, audio);
    for (const stale of [path.join(dirs.vo, t.file), path.join(dirs.vo, mainFile(line)), path.join(dirs.align, `${line.row.toLowerCase()}.json`)]) fs.rmSync(stale, { force: true });
  }
}

// ---------- 2. SFX ----------
for (const [id, s] of Object.entries(SFX)) {
  const out = path.join(dirs.rawSfx, `${id}.mp3`);
  if (exists(out) && !FORCE) continue;
  log('sfx', id);
  try {
    const audio = await api('POST', '/v1/sound-generation', {
      query: { output_format: OUTPUT_FORMAT }, accept: 'audio/mpeg',
      json: { text: s.prompt, duration_seconds: s.seconds, prompt_influence: 0.6 },
    });
    fs.writeFileSync(out, audio);
    fs.rmSync(path.join(dirs.sfx, `${id}.mp3`), { force: true });
  } catch (e) { report.failures.push(`sfx ${id}: ${e.message}`); }
}
// Episode 1's gavel takes are raw ElevenLabs output peaking near -27 dBFS: copy them in as raw SFX and
// normalize them with the rest.
for (const id of SFX_REUSED) {
  const raw = path.join(dirs.rawSfx, `${id}.mp3`);
  if (!exists(raw)) fs.copyFileSync(path.join(EP1, `${id}.mp3`), raw);
}
const fresh = (out, src) => exists(out) && !FORCE_POST && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;

if (!hasFfmpeg()) throw new Error('ffmpeg not on PATH; cannot normalize or measure');

// ---------- 3. Trim + loudness normalization (two-pass loudnorm, linear) ----------
const LN = 'I=-16:TP=-1.5:LRA=11';
function measure(file, pre = '') {
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `${pre}loudnorm=${LN}:print_format=json`, '-f', 'null', '-']);
  const txt = r.stderr; const j = txt.slice(txt.lastIndexOf('{'), txt.lastIndexOf('}') + 1);
  return JSON.parse(j);
}
function normalize(src, out) {
  if (exists(out) && !FORCE_POST) return false;
  const m = measure(src);
  let af;
  if (Number(m.input_i) > -60) {
    af = `loudnorm=${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=44100`;
  } else {
    af = `volume=${(-1.5 - Number(m.input_tp)).toFixed(2)}dB,aresample=44100`;
  }
  run('ffmpeg', ['-y', '-v', 'error', '-i', src, '-af', af, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '192k', out]);
  return true;
}
// MP3 encoding of short transients can overshoot the ceiling after a linear loudnorm: pull any file whose
// measured true peak is above -1.2 dBTP down to -1.8 dBTP.
function tpGuard(file) {
  const tp = Number(measure(file).input_tp);
  if (tp <= -1.2) return tp;
  const tmp = path.join(dirs.rawMix, `${path.basename(file, '.mp3')}-tp.wav`);
  run('ffmpeg', ['-y', '-v', 'error', '-i', file, '-af', `volume=${(-1.8 - tp).toFixed(2)}dB`, tmp]);
  run('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '192k', file]);
  return Number(measure(file).input_tp);
}
// Speech bounds: first/last sample above `thr` of the file's peak.
function speechBounds(file, thr = 0.02) {
  const s = pcm(file, 48000); let max = 0;
  for (let i = 0; i < s.length; i++) max = Math.max(max, Math.abs(s[i]));
  let a = 0, b = s.length - 1;
  while (a < s.length && Math.abs(s[a]) < thr * max) a++;
  while (b > a && Math.abs(s[b]) < thr * max) b--;
  return { start: a / 48000, end: b / 48000, total: s.length / 48000 };
}
// TTS takes carry 0.1-0.4 s of silence at each end; trim to a 30 ms lead and an 80 ms tail (with a 60 ms fade)
// so the 0.2 s gaps in the SPEC are real gaps.
function trimmed(raw, name) {
  const out = path.join(dirs.rawMix, name.replace('.mp3', '-trim.wav'));
  const b = speechBounds(raw);
  const from = Math.max(0, b.start - 0.03), to = Math.min(b.total, b.end + 0.08);
  run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', `atrim=${from.toFixed(3)}:${to.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, to - from - 0.06).toFixed(3)}:d=0.06`, '-ac', '1', '-ar', '48000', out]);
  return out;
}
// Pauses (SPEC "Pacing pass"): nothing inside a take is compressed any more. A scripted (beat) (the longest silent
// runs, one per <break>; 10 ms RMS frames under 3 % of the take's loudest frame) is padded to at least BEAT seconds
// if the TTS rendered it shorter.
function shapePauses(wav, beats) {
  const s = pcm(wav, 48000); const hop = 480;
  const rms = [];
  for (let i = 0; i < s.length; i += hop) { let q = 0; const e = Math.min(s.length, i + hop); for (let j = i; j < e; j++) q += s[j] * s[j]; rms.push(Math.sqrt(q / Math.max(1, e - i))); }
  const peak = Math.max(...rms) || 1;
  const quiet = rms.map(v => v < 0.03 * peak);
  const first = quiet.indexOf(false), last = quiet.lastIndexOf(false);
  const runs = []; let a = -1;
  for (let i = first; i <= last; i++) { if (quiet[i]) { if (a < 0) a = i; } else if (a >= 0) { runs.push([a, i]); a = -1; } }
  runs.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]));
  const pads = []; // [sample index, samples of silence to insert]
  runs.slice(0, beats.length).forEach(([ra, rb]) => {
    const len = (rb - ra) * hop / 48000;
    if (len < BEAT) pads.push([Math.round((ra + rb) / 2 * hop), Math.round((BEAT - len) * 48000)]);
  });
  if (!pads.length) return { file: wav, added: 0 };
  pads.sort((x, y) => x[0] - y[0]);
  const parts = []; let at = 0;
  for (const [i, n] of pads) { parts.push(s.subarray(at, i), new Float32Array(n)); at = i; }
  parts.push(s.subarray(at));
  const outPcm = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { outPcm.set(p, o); o += p.length; }
  const rawF = wav.replace('.wav', '.f32'), out = wav.replace('.wav', '-p.wav');
  fs.writeFileSync(rawF, Buffer.from(outPcm.buffer));
  run('ffmpeg', ['-y', '-v', 'error', '-f', 'f32le', '-ar', '48000', '-ac', '1', '-i', rawF, out]);
  fs.rmSync(rawF, { force: true });
  return { file: out, added: +((outPcm.length - s.length) / 48000).toFixed(3) };
}
// Short lines come out of a TP-limited linear loudnorm 3-6 dB under target. Those get ffmpeg's speechnorm and
// a limiter before a second loudnorm pass, so every line sits within about 1.5 LU of -16.
function leveled(src, name) {
  const out = path.join(dirs.rawMix, name.replace('.mp3', '-lev.wav'));
  run('ffmpeg', ['-y', '-v', 'error', '-i', src, '-af', 'speechnorm=e=6:r=0.0002:l=1:p=0.85,alimiter=limit=0.5:attack=2:release=30:level=disabled', '-ac', '1', out]);
  return out;
}
// Scripted (beat)s are the breaks of 0.5 s or more; shorter breaks (H7's 0.25 s breath) are phrasing, not beats.
const breaksOf = line => [...(line.tts || '').matchAll(/<break time="([\d.]+)s"/g)].map(m => Number(m[1])).filter(b => b >= 0.5);
for (const line of LINES) {
  for (const t of takes(line)) {
    const raw = path.join(dirs.rawVo, t.file), out = path.join(dirs.vo, t.file);
    if (fresh(out, raw)) continue;
    const p = shapePauses(trimmed(raw, t.file), breaksOf(line));
    if (p.added) report.takes[`${line.row}:${t.speaker}:beatPadded`] = p.added;
    normalize(p.file, out);
    if (Number(measure(out).input_i) < -17.5) { fs.rmSync(out); normalize(leveled(p.file, t.file), out); }
    tpGuard(out);
  }
}
// E2: five takes layered with tiny human offsets (0-45 ms), like Episode 1's unison row.
function mixLayer(name, files, offsets) {
  const out = path.join(dirs.vo, name);
  if (files.every(f => fresh(out, f))) return out;
  fs.rmSync(out, { force: true });
  const tmp = path.join(dirs.rawMix, name.replace('.mp3', '.wav'));
  const inputs = files.flatMap(f => ['-i', f]);
  const chains = files.map((_, i) => `[${i}:a]adelay=${Math.round(offsets[i] * 1000)}:all=1[d${i}]`).join(';');
  const fc = `${chains};${files.map((_, i) => `[d${i}]`).join('')}amix=inputs=${files.length}:normalize=0:dropout_transition=0[m]`;
  run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', fc, '-map', '[m]', '-ac', '1', tmp]);
  normalize(tmp, out);
  tpGuard(out);
  return out;
}
for (const line of LINES.filter(l => l.layers)) mixLayer(mainFile(line), takes(line).map(t => path.join(dirs.vo, t.file)), line.offsets);

for (const id of [...Object.keys(SFX), ...SFX_REUSED]) {
  const raw = path.join(dirs.rawSfx, `${id}.mp3`);
  if (!exists(raw)) continue;
  const out = path.join(dirs.sfx, `${id}.mp3`);
  if (fresh(out, raw)) continue;
  fs.rmSync(out, { force: true });
  normalize(raw, out);
  tpGuard(out);
}

// ---------- 4. Measurement ----------
function envelope(file) {
  const s = pcm(file, 48000); const hop = 48000 / FPS; const out = [];
  for (let i = 0; i < s.length; i += hop) {
    let sum = 0; const end = Math.min(s.length, i + hop);
    for (let j = i; j < end; j++) sum += s[j] * s[j];
    out.push(Math.sqrt(sum / Math.max(1, end - i)));
  }
  const max = Math.max(...out) || 1;
  return out.map(v => +(v / max).toFixed(3));
}
function peakTime(file) {
  const s = pcm(file, 48000); let best = 0, at = 0;
  for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > best) { best = a; at = i; } }
  return +(at / 48000).toFixed(3);
}

// ---------- 5. Forced alignment (every spoken row) ----------
const voices = {};
for (const line of LINES) {
  const file = path.join(dirs.vo, mainFile(line));
  const id = `vo-${line.row.toLowerCase()}-${line.layers ? 'all-five' : slug(line.speaker)}`;
  const cache = path.join(dirs.align, `${line.row.toLowerCase()}.json`);
  if (!exists(cache) || FORCE || REDO.has(line.row) || fs.statSync(file).mtimeMs > fs.statSync(cache).mtimeMs) {
    log('forced alignment', line.row);
    try {
      const form = new FormData();
      form.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/mpeg' }), path.basename(file));
      form.append('text', alignText(line));
      const res = await api('POST', '/v1/forced-alignment', { form });
      fs.writeFileSync(cache, JSON.stringify({ text: alignText(line), file: rel(file), ...res }, null, 2));
    } catch (e) { report.failures.push(`forced alignment ${line.row}: ${e.message}`); }
  }
  let words = null, loss = null;
  if (exists(cache)) {
    const res = JSON.parse(fs.readFileSync(cache, 'utf8'));
    loss = res.loss ?? null;
    const aligned = (res.words || []).filter(w => String(w.text).trim());
    const caption = tokens(line.text);
    if (aligned.length === caption.length) {
      // Caption spelling (verbatim SPEC) with the aligned times, matched by position.
      words = aligned.map((w, i) => ({ word: caption[i], spoken: String(w.text).trim(), start: +Number(w.start).toFixed(3), end: +Number(w.end).toFixed(3) }));
    } else report.warnings.push(`${line.row}: ${aligned.length} aligned words vs ${caption.length} caption words`);
  }
  const dur = duration(file);
  if (!words) { // fall back to an even spread so the film still builds
    const caption = tokens(line.text); const step = (dur - 0.2) / caption.length;
    words = caption.map((w, i) => ({ word: w, start: +(0.05 + i * step).toFixed(3), end: +(0.05 + (i + 0.85) * step).toFixed(3) }));
  }
  const wps = words.length / Math.max(0.3, words.at(-1).end - words[0].start);
  const wpsFile = words.length / dur; // the SPEC pacing metric: words per second of the delivered file
  if (wps > 4.6 || wps < 1.2) report.warnings.push(`${line.row}: ${wps.toFixed(2)} words/s looks off`);
  voices[id] = {
    file: rel(file), row: line.row, speaker: line.speaker, text: line.text, tts: line.tts || line.text, duration: dur,
    envelope: envelope(file), words, alignmentLoss: loss,
    ...(line.layers ? { layers: takes(line).map((t, i) => ({ speaker: t.speaker, voice_id: CAST[t.speaker].voice_id, file: rel(path.join(dirs.vo, t.file)), offset: line.offsets[i] })) } : { voice_id: CAST[line.speaker].voice_id, voice_name: CAST[line.speaker].name }),
  };
  report.takes[line.row] = { duration: dur, wordsPerSecond: +wpsFile.toFixed(2), speechRate: +wps.toFixed(2), alignmentLoss: loss };
  if (wpsFile > 3.2) report.warnings.push(`${line.row}: ${wpsFile.toFixed(2)} words/s is above the 3.2 pacing limit`);
}

// ---------- 6. Running order ----------
const byRow = Object.fromEntries(Object.values(voices).map(v => [v.row, v]));
const L = layout(Object.fromEntries(Object.entries(byRow).map(([k, v]) => [k, { duration: v.duration, words: v.words }])));
const { total, timeline, scenes } = L;
for (const r of timeline) { const v = Object.entries(voices).find(([, x]) => x.row === r.row); if (v) r.voice = v[0]; }

// SFX placement: 'peak' lands the file's loudest sample one frame after the picture; 'start' starts on it.
const sfxInfo = {};
for (const id of [...Object.keys(SFX), ...SFX_REUSED]) {
  const f = path.join(dirs.sfx, `${id}.mp3`);
  if (exists(f)) sfxInfo[id] = { file: rel(f), duration: duration(f), peak: peakTime(f) };
}
const sfx = {};
for (const h of L.sfxHits) {
  const s = sfxInfo[h.take];
  if (!s) { report.skipped.push(`sfx cue ${h.id}: no file for ${h.take}`); continue; }
  const start = h.align === 'peak' ? h.at + FRAME - s.peak : h.at;
  sfx[h.id] = { ...s, take: h.take, hit: h.at, align: h.align, start: +Math.max(0, start).toFixed(3), volume: h.volume, row: h.row, note: h.note };
  if (h.until != null) { // clipped to end at `until`: a bed under a whole scene (0.4 s fade in), or a hit cut short
    const len = Math.min(s.duration, h.until - start);
    const fadeOut = Math.min(0.3, len / 3);
    const out = path.join(dirs.sfx, `${h.id}.mp3`);
    run('ffmpeg', ['-y', '-v', 'error', '-i', path.join(ROOT, s.file), '-af', `atrim=end=${len.toFixed(3)},${h.fadeIn ? `afade=t=in:d=${h.fadeIn},` : ''}afade=t=out:st=${Math.max(0, len - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)}`, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '192k', out]);
    Object.assign(sfx[h.id], { file: rel(out), duration: duration(out), until: h.until });
  }
}

// ---------- 7. Music ----------
const MUSIC_VOLUME = 0.55;
const MUSIC_TEMPO = 0.915;
const LEVEL = { dialogue: 0.14 / MUSIC_VOLUME, night: 0.1 / MUSIC_VOLUME, title: 1, between: 0.8, endcard: 0.9 };
const bedRaw = path.join(dirs.music, 'bed.mp3');
const musicStatus = path.join(dirs.music, 'status.json');
const wantMs = Math.ceil(total + 12) * 1000;
let haveBed = exists(bedRaw) ? duration(bedRaw) : 0;
// The bed must run from its entry (about 5 s in) to past the end card without a loop seam: when the cut outgrows it,
// the old bed is kept as bed-<seconds>s.mp3 and a longer one is generated from the same prompt.
if (haveBed > 0 && haveBed < total + 8 && !args.has('--no-music')) {
  fs.renameSync(bedRaw, path.join(dirs.music, `bed-${Math.round(haveBed)}s.mp3`));
  fs.rmSync(path.join(dirs.music, 'bed-norm.mp3'), { force: true });
  haveBed = 0;
}
if (!args.has('--no-music') && (FORCE || haveBed === 0)) {
  log(`music bed (${wantMs / 1000} s)`);
  try {
    const audio = await api('POST', '/v1/music', {
      query: { output_format: OUTPUT_FORMAT }, accept: 'audio/mpeg', retries: 2,
      json: { prompt: MUSIC_PROMPT, music_length_ms: wantMs, model_id: 'music_v1' },
    });
    fs.writeFileSync(bedRaw, audio);
    fs.writeFileSync(musicStatus, JSON.stringify({ ok: true, prompt: MUSIC_PROMPT, music_length_ms: wantMs }, null, 2));
    fs.rmSync(path.join(dirs.music, 'bed-norm.mp3'), { force: true });
  } catch (e) {
    fs.writeFileSync(musicStatus, JSON.stringify({ ok: false, error: e.message }, null, 2));
    report.skipped.push(`music: ${e.message}`);
  }
}
let music = null;
if (exists(bedRaw)) {
  const bedLoud = path.join(dirs.music, 'bed-norm.mp3');
  normalize(bedRaw, bedLoud);
  // The 116 s bed came back at about 100.6 bpm (`hyperframes beats` reports 201.3, double time); SPEC asks for ~92.
  // A pitch-preserving atempo of 0.915 brings it to ~92 bpm (and stretches it to ~127 s).
  const bedNorm = path.join(dirs.music, 'bed-92bpm.mp3');
  if (!exists(bedNorm) || FORCE_POST || fs.statSync(bedNorm).mtimeMs < fs.statSync(bedLoud).mtimeMs) {
    run('ffmpeg', ['-y', '-v', 'error', '-i', bedLoud, '-af', `atempo=${MUSIC_TEMPO}`, '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', bedNorm]);
  }
  // Enter on the bed's first strong downbeat (not a quiet intro): the first 1/30 s frame, after 0.2 s, whose
  // RMS reaches 70 % of the bed's 90th-percentile level. That moment lands on the title slam.
  const env = (() => { const s = pcm(bedNorm, 48000); const hop = 1600; const o = []; for (let i = 0; i < s.length; i += hop) { let q = 0; const e = Math.min(s.length, i + hop); for (let j = i; j < e; j++) q += s[j] * s[j]; o.push(Math.sqrt(q / (e - i))); } return o; })();
  // Sustained, not a stray transient: the first 0.5 s window whose mean RMS reaches 75 % of the 90th percentile of
  // all 0.5 s windows, then the sharpest rise within 5 frames of it (the downbeat itself).
  const avg = env.map((_, i) => env.slice(i, i + 15).reduce((x, y) => x + y, 0) / Math.min(15, env.length - i));
  const p90 = [...avg].sort((x, y) => x - y)[Math.floor(avg.length * 0.9)];
  let at = Math.max(0, avg.findIndex((v, i) => i / 30 > 0.2 && v >= 0.75 * p90));
  let best = at, rise = -1;
  for (let i = Math.max(1, at - 5); i <= Math.min(env.length - 1, at + 5); i++) if (env[i] - env[i - 1] > rise) { rise = env[i] - env[i - 1]; best = i; }
  const entry = best / 30;
  const R = L.rows;
  const land = R.T0.actions.titleLand;              // title slam = music in
  const duck = R.H1.start;                          // first T3 line
  const t3End = R.H8.start + R.H8.duration;         // between houses: up ...
  const ptahIn = R.P1.start;                        // ... down again under the Conductor
  const stop = R.E1.actions.scratch;                // record-scratch stop
  const endIn = L.scenes.find(s => s.id === 'endcard').start;
  const night = L.scenes.find(s => s.id === 'ptah-nightshift');    // music dips a little under the night shift
  const offset = entry - land;                      // bed time = t + offset
  // Half-open windows [a, b) so two neighbouring pieces never both apply on a boundary frame.
  const win = (a, b) => `gte(t,${a.toFixed(3)})*lt(t,${b.toFixed(3)})`;
  const seg = (a, b, va, vb) => `${win(a, b)}*(${va}+(${vb}-${va})*(t-${a.toFixed(3)})/${(b - a).toFixed(3)})`;
  const hold = (a, b, v) => `${win(a, b)}*${v}`;
  const D = LEVEL.dialogue.toFixed(4);
  // Between the houses: rise after H8 ends, fall back by the Conductor's first word; ramps shrink to fit the gap.
  const upA = t3End + 0.05, upD = ptahIn - 0.02, ramp = Math.min(0.3, (upD - upA) / 2);
  const gain = [
    seg(land - 0.02, land, 0, LEVEL.title),
    hold(land, duck - 0.45, LEVEL.title),
    seg(duck - 0.45, duck - 0.05, LEVEL.title, D),
    hold(duck - 0.05, upA, D),
    seg(upA, upA + ramp, D, LEVEL.between),
    hold(upA + ramp, upD - ramp, LEVEL.between),
    seg(upD - ramp, upD, LEVEL.between, D),
    hold(upD, night.start, D),
    seg(night.start, night.start + 0.4, D, LEVEL.night.toFixed(4)),
    hold(night.start + 0.4, night.end - 0.3, LEVEL.night.toFixed(4)),
    seg(night.end - 0.3, night.end, LEVEL.night.toFixed(4), D),
    hold(night.end, stop - 0.02, D),
    seg(stop - 0.02, stop + 0.03, D, 0),
    seg(endIn, endIn + 0.25, 0, LEVEL.endcard),
    `gte(t,${(endIn + 0.25).toFixed(3)})*${LEVEL.endcard}`,
  ].join('+');
  const edit = path.join(dirs.music, 'bed-edit.mp3');
  // Shift the bed so its entry point plays at `land`; loop if the bed is shorter than the cut.
  const pre = offset >= 0 ? `atrim=start=${offset.toFixed(3)},asetpts=PTS-STARTPTS` : `adelay=${Math.round(-offset * 1000)}:all=1`;
  run('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', bedNorm, '-af',
    `${pre},atrim=end=${total.toFixed(3)},volume='${gain}':eval=frame,afade=t=out:st=${(total - 0.8).toFixed(3)}:d=0.8`, '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', edit]);
  music = {
    file: rel(edit), duration: duration(edit), source: rel(bedRaw), sourceDuration: duration(bedRaw), tempo: MUSIC_TEMPO, volume: MUSIC_VOLUME,
    entry: +entry.toFixed(3), offset: +offset.toFixed(3),
    gain: Object.fromEntries(Object.entries(LEVEL).map(([k, v]) => [k, +v.toFixed(3)])),
    effective: Object.fromEntries(Object.entries(LEVEL).map(([k, v]) => [k, +(v * MUSIC_VOLUME).toFixed(3)])),
    inAt: +land.toFixed(3), duckAt: +duck.toFixed(3), upAt: +t3End.toFixed(3), downAt: +ptahIn.toFixed(3), nightDip: [night.start, night.end], stopAt: +stop.toFixed(3), returnsAt: +endIn.toFixed(3),
  };
}

// ---------- 8. Loudness of the delivered files ----------
for (const v of Object.values(voices)) {
  const m = measure(path.join(ROOT, v.file));
  report.loudness[v.file] = { I: Number(m.input_i), TP: Number(m.input_tp) };
}
for (const s of Object.values(sfxInfo)) {
  const m = measure(path.join(ROOT, s.file));
  report.loudness[s.file] = { I: Number(m.input_i), TP: Number(m.input_tp) };
}

const cues = { fps: FPS, total, voices, sfx, music, timeline, scenes };
fs.writeFileSync(path.join(AUDIO, 'cues.json'), JSON.stringify(cues));
fs.writeFileSync(path.join(AUDIO, 'envelopes.json'), JSON.stringify(Object.fromEntries(Object.values(voices).map(v => [v.row, v.envelope]))));
fs.writeFileSync(path.join(AUDIO, 'generate-report.json'), JSON.stringify({ total, ...report }, null, 2));
log(`done: ${Object.keys(voices).length} voice cues, ${Object.keys(sfx).length} sfx cues, music=${music ? 'yes' : 'no'}, total=${total}s`);
for (const k of ['failures', 'skipped', 'warnings']) if (report[k].length) log(`${k}:`, report[k].join('; '));
