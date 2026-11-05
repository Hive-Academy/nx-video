// Generates all voice, SFX and music audio for The Tribunal with the ElevenLabs API,
// normalizes it with ffmpeg, measures it and writes assets/audio/cues.json.
//
// Usage: node scripts/audio/generate.mjs [--force] [--force-post] [--no-music]
//   --force       re-download everything from ElevenLabs (costs credits)
//   --force-post  redo normalization / mixes / measurement only
// Idempotent: existing non-empty files are reused (raw TTS, SFX, normalized voices, alignments).
//
// Revision 2 (SPEC.md): adds the one-word punch promo (P1-P6), punch hits and intro whooshes,
// forced-alignment word timings for the booth lines, and the new running order (intro, punches,
// title, rows with row 1 moved after row 11). Existing voice files are reused, never regenerated.
import fs from 'node:fs';
import path from 'node:path';
import { AUDIO, api, run, hasFfmpeg, duration, pcm, ensureDir, exists, rel } from './lib.mjs';
import { CAST, LINES, SFX, MODEL, OUTPUT_FORMAT, MUSIC_PROMPT, PUNCH, PUNCH_SETTINGS, ALIGN_ROWS, ORDER, INTRO, SFX_R2 } from './script-data.mjs';

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const FORCE_POST = FORCE || args.has('--force-post');
const FPS = 30;
const GAP = 0.25;
const ROW18_LEAD = 0.65; // gavel peak at +0.05 s, then 0.6 s of silence before "Enough."
const FRAG_STAGGER = 0.5;
const FRAME = 1 / FPS;
const PUNCH_LEAD = 4 * FRAME; // the robot is seen for 4 frames, then the word lands (impact)
const ALL_SFX = { ...SFX, ...SFX_R2 };

const dirs = {
  rawVo: path.join(AUDIO, 'raw', 'vo'), rawMix: path.join(AUDIO, 'raw', 'mix'),
  vo: path.join(AUDIO, 'vo'), sfx: path.join(AUDIO, 'sfx'), music: path.join(AUDIO, 'music'),
  align: path.join(AUDIO, 'align'),
};
Object.values(dirs).forEach(ensureDir);
const log = (...a) => console.log('[audio]', ...a);
const report = { skipped: [], failures: [], loudness: {} };

const pad = n => String(n).padStart(2, '0');
const voName = l => `${pad(l.row)}${l.part || ''}-${l.speaker.toLowerCase()}.mp3`;
const punchName = p => `${p.row.toLowerCase()}-${p.speaker.toLowerCase()}.mp3`;
const punchSettings = speaker => ({ ...CAST[speaker].settings, ...PUNCH_SETTINGS });

// ---------- 1. TTS ----------
fs.writeFileSync(path.join(AUDIO, 'voices.json'), JSON.stringify({
  model_id: MODEL, output_format: OUTPUT_FORMAT,
  voices: Object.fromEntries(Object.entries(CAST).map(([k, v]) => [k, { voice_id: v.voice_id, name: v.name, why: v.why, settings: v.settings }])),
  punch: { note: 'One-word punch promo (SPEC Revision 2): same voice ids, these settings merged over the cast settings.', settings: PUNCH_SETTINGS, lines: PUNCH.map(p => ({ row: p.row, speaker: p.speaker, text: p.text, voice_id: CAST[p.speaker].voice_id })) },
}, null, 2));

for (const line of LINES) {
  const out = path.join(dirs.rawVo, voName(line));
  if (exists(out) && !FORCE) continue;
  const cast = CAST[line.speaker];
  log('tts', voName(line));
  const audio = await api('POST', `/v1/text-to-speech/${cast.voice_id}`, {
    query: { output_format: OUTPUT_FORMAT }, accept: 'audio/mpeg',
    json: { text: line.tts || line.text, model_id: MODEL, voice_settings: cast.settings },
  });
  fs.writeFileSync(out, audio);
}
for (const p of PUNCH) {
  const out = path.join(dirs.rawVo, punchName(p));
  if (exists(out) && !FORCE) continue;
  log('tts punch', punchName(p));
  const audio = await api('POST', `/v1/text-to-speech/${CAST[p.speaker].voice_id}`, {
    query: { output_format: OUTPUT_FORMAT }, accept: 'audio/mpeg',
    json: { text: p.text, model_id: MODEL, voice_settings: punchSettings(p.speaker) },
  });
  fs.writeFileSync(out, audio);
}

// ---------- 2. SFX ----------
// Revision 2 SFX download to raw/sfx and are loudness-normalized into sfx/ in step 3.
dirs.rawSfx = path.join(AUDIO, 'raw', 'sfx'); ensureDir(dirs.rawSfx);
for (const [id, s] of Object.entries(ALL_SFX)) {
  const out = path.join(SFX_R2[id] ? dirs.rawSfx : dirs.sfx, `${id}.mp3`);
  if (exists(out) && !FORCE) continue;
  log('sfx', id);
  try {
    const audio = await api('POST', '/v1/sound-generation', {
      query: { output_format: OUTPUT_FORMAT }, accept: 'audio/mpeg',
      json: { text: s.prompt, duration_seconds: s.seconds, prompt_influence: 0.6 },
    });
    fs.writeFileSync(out, audio);
  } catch (e) { report.failures.push(`sfx ${id}: ${e.message}`); }
}

// ---------- 2b. Music ----------
const bedRaw = path.join(dirs.music, 'bed.mp3');
const musicStatus = path.join(dirs.music, 'status.json');
if (!args.has('--no-music') && (!exists(bedRaw) || FORCE)) {
  log('music bed (90 s)');
  try {
    const audio = await api('POST', '/v1/music', {
      query: { output_format: OUTPUT_FORMAT }, accept: 'audio/mpeg', retries: 1,
      json: { prompt: MUSIC_PROMPT, music_length_ms: 90000, model_id: 'music_v1' },
    });
    fs.writeFileSync(bedRaw, audio);
    fs.writeFileSync(musicStatus, JSON.stringify({ ok: true, prompt: MUSIC_PROMPT }, null, 2));
  } catch (e) {
    fs.writeFileSync(musicStatus, JSON.stringify({ ok: false, error: e.message }, null, 2));
    report.skipped.push(`music: ${e.message}`);
  }
}

if (!hasFfmpeg()) throw new Error('ffmpeg not on PATH; cannot normalize or measure');

// ---------- 3. Loudness normalization (two-pass loudnorm, linear) ----------
const LN = 'I=-16:TP=-1.5:LRA=11';
function measure(file, pre = '') {
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `${pre}loudnorm=${LN}:print_format=json`, '-f', 'null', '-']);
  const txt = r.stderr; const j = txt.slice(txt.lastIndexOf('{'), txt.lastIndexOf('}') + 1);
  return JSON.parse(j);
}
function normalize(src, out, { leadMs = 0 } = {}) {
  if (exists(out) && !FORCE_POST) return;
  const m = measure(src);
  const tail = `aresample=44100${leadMs ? `,adelay=${leadMs}:all=1` : ''}`;
  let af;
  if (Number(m.input_i) > -60) {
    af = `loudnorm=${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,${tail}`;
  } else { // too short / quiet for an integrated reading: peak-normalize to -1.5 dBTP
    af = `volume=${(-1.5 - Number(m.input_tp)).toFixed(2)}dB,${tail}`;
  }
  run('ffmpeg', ['-y', '-v', 'error', '-i', src, '-af', af, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '192k', out]);
}

for (const line of LINES) {
  normalize(path.join(dirs.rawVo, voName(line)), path.join(dirs.vo, voName(line)), { leadMs: line.row === 18 ? ROW18_LEAD * 1000 : 0 });
}

// Punch words: trim the TTS lead/tail silence (so the word starts ~15 ms in and lands on the
// impact), then normalize like every other line.
function speechBounds(file, thr = 0.04) {
  const s = pcm(file, 48000); let max = 0;
  for (let i = 0; i < s.length; i++) max = Math.max(max, Math.abs(s[i]));
  let a = 0, b = s.length - 1;
  while (a < s.length && Math.abs(s[a]) < thr * max) a++;
  while (b > a && Math.abs(s[b]) < thr * max) b--;
  return { start: a / 48000, end: b / 48000, total: s.length / 48000 };
}
for (const p of PUNCH) {
  const out = path.join(dirs.vo, punchName(p));
  if (exists(out) && !FORCE_POST) continue;
  const raw = path.join(dirs.rawVo, punchName(p));
  const b = speechBounds(raw);
  const from = Math.max(0, b.start - 0.015), to = Math.min(b.total, b.end + 0.08);
  const trimmed = path.join(dirs.rawMix, punchName(p).replace('.mp3', '-trim.wav'));
  run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', `atrim=${from.toFixed(3)}:${to.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=out:st=${Math.max(0, to - from - 0.04).toFixed(3)}:d=0.04`, '-ac', '1', trimmed]);
  normalize(trimmed, out);
}

// Short transients overshoot the true-peak ceiling after linear loudnorm + MP3 encoding, so each new
// SFX gets a second pass that pulls its measured true peak down to -1.5 dBTP when it is above -1.2.
for (const id of Object.keys(SFX_R2)) {
  const raw = path.join(dirs.rawSfx, `${id}.mp3`);
  if (!exists(raw)) continue;
  const out = path.join(dirs.sfx, `${id}.mp3`);
  const fresh = !exists(out) || FORCE_POST;
  normalize(raw, out);
  const tp = Number(measure(out).input_tp);
  if (fresh || tp > -1.2) {
    if (tp > -1.2) {
      const tmp = path.join(dirs.rawMix, `${id}-tp.wav`);
      run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-af', `volume=${(-1.5 - tp - 0.3).toFixed(2)}dB`, tmp]);
      run('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '192k', out]);
    }
  }
}

// Pre-mixed layers: row 17 (staggered chaos) and row 20 (unison).
function mixLayer(name, files, offsets) {
  const out = path.join(dirs.vo, name);
  if (exists(out) && !FORCE_POST) return out;
  const tmp = path.join(dirs.rawMix, name.replace('.mp3', '.wav'));
  const inputs = files.flatMap(f => ['-i', f]);
  const chains = files.map((_, i) => `[${i}:a]adelay=${Math.round(offsets[i] * 1000)}:all=1[d${i}]`).join(';');
  const fc = `${chains};${files.map((_, i) => `[d${i}]`).join('')}amix=inputs=${files.length}:normalize=0:dropout_transition=0[m]`;
  run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', fc, '-map', '[m]', '-ac', '1', tmp]);
  normalize(tmp, out);
  return out;
}
const frag17 = LINES.filter(l => l.row === 17);
const uni20 = LINES.filter(l => l.row === 20);
mixLayer('17-all-five.mp3', frag17.map(l => path.join(dirs.vo, voName(l))), frag17.map((_, i) => i * FRAG_STAGGER));
// Unison: tiny human offsets (0-45 ms) so the layer reads as five voices, not a phasey copy.
mixLayer('20-all-five.mp3', uni20.map(l => path.join(dirs.vo, voName(l))), [0, 0.02, 0.045, 0.01, 0.03]);

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
function gaps(env, thr = 0.08, minFrames = 6) {
  const res = []; let start = -1;
  env.forEach((v, i) => {
    if (v < thr) { if (start < 0) start = i; } else { if (start >= 0 && i - start >= minFrames) res.push([start, i]); start = -1; }
  });
  return res;
}

const voices = {}; const byRow = {};
const addVoice = (id, file, speaker, row, text, extra = {}) => {
  const env = envelope(file);
  voices[id] = { file: rel(file), speaker, row, text, duration: duration(file), envelope: env, ...extra };
  byRow[row] = voices[id];
};
for (const line of LINES) {
  if (line.row === 17 || line.row === 20) continue;
  const f = path.join(dirs.vo, voName(line));
  addVoice(`vo-${pad(line.row)}-${line.speaker.toLowerCase()}`, f, line.speaker, line.row, line.text,
    { voice_id: CAST[line.speaker].voice_id, voice_name: CAST[line.speaker].name, ...(line.row === 18 ? { leadSilence: ROW18_LEAD } : {}) });
}
addVoice('vo-17-all-five', path.join(dirs.vo, '17-all-five.mp3'), 'All five', 17, frag17.map(l => `${l.speaker}: "${l.text}"`).join(' / '),
  { layers: frag17.map((l, i) => ({ speaker: l.speaker, text: l.text, file: rel(path.join(dirs.vo, voName(l))), offset: i * FRAG_STAGGER, duration: duration(path.join(dirs.vo, voName(l))) })) });
addVoice('vo-20-all-five', path.join(dirs.vo, '20-all-five.mp3'), 'All five', 20, "…That's what I said.",
  { layers: uni20.map(l => ({ speaker: l.speaker, file: rel(path.join(dirs.vo, voName(l))), duration: duration(path.join(dirs.vo, voName(l))) })) });
for (const p of PUNCH) {
  const f = path.join(dirs.vo, punchName(p));
  addVoice(`vo-${p.row.toLowerCase()}-${p.speaker.toLowerCase()}`, f, p.speaker, p.row, p.text, {
    voice_id: CAST[p.speaker].voice_id, voice_name: CAST[p.speaker].name, settings: punchSettings(p.speaker),
    word: p.word, onset: +speechBounds(f, 0.08).start.toFixed(3), peak: peakTime(f),
  });
}

// ---------- 4b. Forced alignment (word timings for the booth speech bubbles) ----------
const alignText = line => (line.tts || line.text).replace(/<break[^>]*\/>/g, ' ').replace(/\(beat\)/g, ' ').replace(/\s+/g, ' ').trim();
for (const row of ALIGN_ROWS) {
  const line = LINES.find(l => l.row === row);
  const v = byRow[row];
  const id = Object.keys(voices).find(k => voices[k] === v);
  const cache = path.join(dirs.align, `${id}.json`);
  if (!exists(cache) || FORCE) {
    log('forced alignment', id);
    try {
      const file = path.join(AUDIO, '..', '..', v.file);
      const form = new FormData();
      form.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/mpeg' }), path.basename(file));
      form.append('text', alignText(line));
      const res = await api('POST', '/v1/forced-alignment', { form });
      fs.writeFileSync(cache, JSON.stringify({ text: alignText(line), file: v.file, ...res }, null, 2));
    } catch (e) { report.failures.push(`forced alignment ${id}: ${e.message}`); continue; }
  }
  const res = JSON.parse(fs.readFileSync(cache, 'utf8'));
  v.alignedText = res.text;
  v.words = (res.words || []).filter(w => String(w.text).trim()).map(w => ({ word: String(w.text).trim(), start: +Number(w.start).toFixed(3), end: +Number(w.end).toFixed(3) }));
  v.alignmentLoss = res.loss ?? null;
}

const sfxInfo = {};
for (const id of Object.keys(ALL_SFX)) {
  const f = path.join(dirs.sfx, `${id}.mp3`);
  if (!exists(f)) continue;
  sfxInfo[id] = { file: rel(f), duration: duration(f), peak: peakTime(f) };
}

// ---------- 5. Timeline (Revision 2 running order) ----------
const timeline = []; const T = {};
let clock = 0;
const place = (row, start, dur, extra = {}) => {
  const v = byRow[row];
  T[row] = { row, start: +start.toFixed(3), duration: +dur.toFixed(3), speaker: v?.speaker ?? null, text: v?.text ?? extra.text ?? null, voice: v ? Object.keys(voices).find(k => voices[k] === v) : null, ...extra };
  timeline.push(T[row]);
  return start + dur;
};
const snap = t => Math.round(t * FPS) / FPS; // punch cuts and impacts sit on frame boundaries
const isPunch = k => typeof k === 'string' && /^P\d$/.test(k);
for (const key of ORDER) {
  if (key === 'intro') {
    let at = 0;
    const cards = INTRO.cards.map(c => { const card = { ...c, start: +at.toFixed(3) }; at += c.duration; return card; });
    clock = place('intro', 0, at, { kind: 'intro', text: 'A day in the life of a developer… / …who asked five AI agents one question.', cards });
    continue;
  }
  if (isPunch(key)) {
    const v = byRow[key]; const p = PUNCH.find(x => x.row === key);
    const start = snap(clock), impact = snap(start + PUNCH_LEAD);
    // The word is seen for >= 0.5 s after it lands; shots stay inside 0.7-0.9 s (the last one
    // holds a little longer for the gavel tail the title lands on).
    const speech = v.duration - v.onset;
    const dur = snap(Math.min(key === 'P6' ? 0.93 : 0.9, Math.max(0.7, PUNCH_LEAD + Math.min(speech, 0.72) + 0.06)));
    clock = place(key, start, dur, {
      kind: 'punch', scene: p.scene, word: p.word, impact: +impact.toFixed(3), localImpact: +(impact - start).toFixed(3),
      voiceStart: +(impact + FRAME - v.onset).toFixed(3),
    });
    continue;
  }
  if (key === 2) { clock = place(2, clock, 2.5, { kind: 'title', text: 'THE TRIBUNAL / Episode 1: Remotion or HyperFrames?' }); continue; }
  if (key === 22) { clock = place(22, clock, 3.0, { kind: 'endcard', text: 'The Tribunal / Five agents. One verdict. / ptah' }); continue; }
  if (key === 5) { const s = T[4].start + T[4].duration - 0.3; clock = Math.max(clock - GAP, place(5, s, byRow[5].duration, { overlapsRow: 4, overlap: 0.3 })) + GAP; continue; }
  if (key === 10) clock += 0.6;  // "two-beat pause before"
  if (key === 20) clock += 0.5;  // "(pause)" before the unison
  const dur = key === 17 ? Math.max(3.0, byRow[17].duration) : byRow[key].duration;
  clock = place(key, clock, dur, key === 18 ? { gavelAt: +(clock + 0.05).toFixed(3), silenceAfterGavel: 0.6 } : {}) + GAP;
}
const total = +(T[22].start + T[22].duration).toFixed(3);

// SFX placements: hit time aligned to each file's peak.
const sfx = {};
const hit = (id, file, at, volume, row, note) => {
  const s = sfxInfo[file]; if (!s) return;
  sfx[id] = { ...s, take: file, hit: +at.toFixed(3), start: +Math.max(0, at - s.peak).toFixed(3), volume, row, note };
};
const r = n => T[n]; const end = n => T[n].start + T[n].duration;
// Intro: one whoosh per cut (card A -> card B, intro -> first punch), two different takes.
hit('whoosh-intro-1', 'whoosh-3', T.intro.cards[1].start, 0.7, 'intro', 'cut to "...who asked five AI agents one question."');
hit('whoosh-intro-2', 'whoosh-4', end('intro'), 0.7, 'intro', 'cut into the punch promo');
// Punch promo: the impact peak lands one frame after the word lands; P6 is the gavel.
const punchTakes = ['punch-hit-1', 'punch-hit-2', 'punch-hit-3', 'punch-hit-1', 'punch-hit-2'];
PUNCH.forEach((p, i) => {
  if (p.row === 'P6') hit('gavel-p6', 'gavel-1', T.P6.impact + FRAME, 0.8, 'P6', 'ORDER. gavel; the title lands on its tail');
  else hit(`hit-${p.row.toLowerCase()}`, punchTakes[i], T[p.row].impact + FRAME, 0.6, p.row, `${p.word} impact`);
});
const env1 = byRow[1].envelope; const g1 = gaps(env1).find(([s]) => s / FPS > 0.4);
hit('mug-sip', 'mug-sip', r(1).start + (g1 ? g1[0] / FPS + 0.35 : 1.2), 0.8, 1, 'Codex sips on the first beat');
hit('sting-1', 'sting-1', end(1) + 0.1, 0.75, 1, 'reality sting on the cut out of the Codex booth');
hit('title-slam', 'title-slam', r(2).start + 0.05, 0.8, 2, 'title slams in');
const env3 = byRow[3].envelope; const g3 = gaps(env3, 0.08, 4).at(-1);
hit('gavel-1', 'gavel-1', r(3).start + (g3 ? g3[1] / FPS + 0.12 : r(3).duration - 0.25), 0.8, 3, 'gavel tap on "Go"');
hit('paper-thud', 'paper-thud', r(4).start + 0.25, 0.9, 4, 'paper stack thuds onto table');
hit('whoosh-1', 'whoosh-1', r(5).start + 0.05, 0.6, 5, 'Cursor leans in');
hit('sting-2', 'sting-2', r(7).start - 0.05, 0.75, 7, 'sting in to Claude booth');
hit('mug-sip-14', 'mug-sip', end(14) + 0.1, 0.8, 14, 'Codex sips before the hard cut');
hit('whoosh-2', 'whoosh-2', r(17).start + 0.05, 0.6, 17, 'camera whip into the chaos');
hit('gavel-2', 'gavel-2', T[18].gavelAt, 1, 18, 'GAVEL, then 0.6 s of silence');
hit('stamp-slam', 'stamp-slam', r(19).start + 0.15, 0.75, 19, 'verdict card stamps in');
hit('sting-21', 'sting-1', end(21) + 0.05, 0.75, 21, 'sting out after "Reverting."');

// Music: normalized bed, looped/trimmed to the cut. A gain envelope is baked in and the clip plays
// at MUSIC_VOLUME: full under the intro text, lifted under the punch promo and title, 0.14 under
// dialogue, silent from the row-18 gavel until the end card, lifted again under the end card.
const MUSIC_VOLUME = 0.55;
const DIALOGUE = 0.14 / MUSIC_VOLUME; // 0.35 -> 0.14 effective
let music = null;
if (exists(bedRaw)) {
  const bedNorm = path.join(dirs.music, 'bed-norm.mp3');
  normalize(bedRaw, bedNorm);
  const edit = path.join(dirs.music, 'bed-edit.mp3');
  const P1 = T.P1.start, D = r(3).start, G = T[18].gavelAt - 0.02, E = T[22].start;
  // Piecewise gain in ffmpeg's expression language (t in seconds).
  const seg = (a, b, va, vb) => `if(between(t,${a.toFixed(3)},${b.toFixed(3)}),${va}+(${vb}-${va})*(t-${a.toFixed(3)})/${(b - a).toFixed(3)},0)`;
  const gain = [
    `if(lt(t,${(P1 - 0.1).toFixed(3)}),1,0)`,
    seg(P1 - 0.1, P1, 1, 0.65),
    `if(between(t,${P1.toFixed(3)},${(D - 0.4).toFixed(3)}),0.65,0)`,
    seg(D - 0.4, D, 0.65, DIALOGUE),
    `if(between(t,${D.toFixed(3)},${G.toFixed(3)}),${DIALOGUE},0)`,
    seg(G, G + 0.08, DIALOGUE, 0),
    seg(E, E + 0.3, 0, 0.75),
    `if(gt(t,${(E + 0.3).toFixed(3)}),0.75,0)`,
  ].join('+');
  run('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', bedNorm, '-t', String(total),
    '-af', `volume='${gain}':eval=frame,afade=t=out:st=${(total - 0.8).toFixed(3)}:d=0.8`, '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', edit]);
  music = {
    file: rel(edit), duration: duration(edit), source: rel(bedRaw), sourceDuration: duration(bedRaw), volume: MUSIC_VOLUME,
    gain: { intro: 1, punchAndTitle: 0.65, dialogue: +DIALOGUE.toFixed(3), endcard: 0.75 },
    effective: { intro: MUSIC_VOLUME, punchAndTitle: +(0.65 * MUSIC_VOLUME).toFixed(3), dialogue: 0.14, endcard: +(0.75 * MUSIC_VOLUME).toFixed(3) },
    duckAt: +D.toFixed(3), dropsAt: +G.toFixed(3), returnsAt: E,
  };
}

// Loudness check of the delivered voice files (integrated + true peak).
for (const v of Object.values(voices)) {
  const m = measure(path.join(AUDIO, '..', '..', v.file));
  report.loudness[v.file] = { I: Number(m.input_i), TP: Number(m.input_tp) };
}
for (const [id, s] of Object.entries(sfxInfo)) {
  if (!SFX_R2[id]) continue;
  const m = measure(path.join(AUDIO, '..', '..', s.file));
  report.loudness[s.file] = { I: Number(m.input_i), TP: Number(m.input_tp) };
}

const cues = { fps: FPS, total, order: ORDER, voices, sfx, music, timeline };
fs.writeFileSync(path.join(AUDIO, 'cues.json'), JSON.stringify(cues));
fs.writeFileSync(path.join(AUDIO, 'envelopes.json'), JSON.stringify(Object.fromEntries(Object.values(voices).map(v => [v.row, v.envelope]))));
fs.writeFileSync(path.join(AUDIO, 'generate-report.json'), JSON.stringify({ total, ...report }, null, 2));
log(`done: ${Object.keys(voices).length} voice cues, ${Object.keys(sfx).length} sfx cues, music=${music ? 'yes' : 'no'}, total=${total}s`);
if (report.failures.length) log('failures:', report.failures.join('; '));
if (report.skipped.length) log('skipped:', report.skipped.join('; '));
