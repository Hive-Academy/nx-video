// Measures the final mix: reads every <audio> in index.html (start, duration, volume), mixes them with ffmpeg
// the way the renderer does, applies the master bus ceiling (-1.5 dB limiter) and reports integrated loudness,
// true peak and RMS per scene. The pinned 0.8.98 CLI has no audio-measure command, hence this script.
// Usage: node scripts/audio/measure-mix.mjs [--wav out.wav]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, run, pcm } from './lib.mjs';

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const timing = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'timing.json'), 'utf8'));
const clips = [...html.matchAll(/<audio id="([^"]+)" class="clip" src="([^"]+)" data-start="([\d.]+)" data-duration="([\d.]+)"[^>]*data-volume="([\d.]+)"/g)]
  .map(m => ({ id: m[1], src: path.join(ROOT, m[2]), start: +m[3], dur: +m[4], vol: +m[5] }));
if (!clips.length) throw new Error('no <audio> clips in index.html');
const total = timing.total;
// The master bus chain (gain, then limiter) as written by src/build-timing.mjs.
const chainAttr = html.match(/<hf-audio-group id="master"[^>]*data-fx-chain="([^"]+)"/);
const chain = chainAttr ? JSON.parse(chainAttr[1].replaceAll('&quot;', '"')) : { nodes: [] };
const gainDb = chain.nodes.filter(n => n.type === 'gain').reduce((a, n) => a + (n.params.gain || 0), 0);
const limitDb = chain.nodes.find(n => n.type === 'limiter')?.params.limit ?? -1.5;
const outIdx = process.argv.indexOf('--wav');
const out = outIdx > 0 ? path.resolve(process.argv[outIdx + 1]) : path.join(ROOT, 'assets', 'audio', 'raw', 'mix', 'full-mix.wav');

const inputs = clips.flatMap(c => ['-i', c.src]);
const chains = clips.map((c, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=end=${c.dur.toFixed(3)},volume=${c.vol},adelay=${Math.round(c.start * 1000)}:all=1[a${i}]`).join(';');
const fc = `${chains};${clips.map((_, i) => `[a${i}]`).join('')}amix=inputs=${clips.length}:normalize=0:dropout_transition=0,atrim=end=${total},apad=whole_dur=${total}[mix];[mix]volume=${gainDb}dB,alimiter=limit=${Math.pow(10, limitDb / 20).toFixed(4)}:attack=2:release=80:level=disabled[out]`;
const script = path.join(path.dirname(out), 'full-mix.filter');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(script, fc);
run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-/filter_complex', script, '-map', '[out]', '-c:a', 'pcm_s16le', out]);

const ln = run('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']).stderr;
const m = JSON.parse(ln.slice(ln.lastIndexOf('{'), ln.lastIndexOf('}') + 1));
const s = pcm(out, 48000);
const rms = (a, b) => { let q = 0, n = 0; for (let i = Math.floor(a * 48000); i < Math.min(s.length, Math.floor(b * 48000)); i++) { q += s[i] * s[i]; n++; } return n ? +(20 * Math.log10(Math.sqrt(q / n) || 1e-9)).toFixed(1) : null; };
const sections = timing.scenes.map(sc => ({ scene: sc.id, start: sc.start, end: +(sc.start + sc.duration).toFixed(3), rmsDbfs: rms(sc.start, sc.start + sc.duration) }));
// Longest run at or below −70 dBFS. Mono downmix of the limited mix; a silent sample on
// both channels stays silent here.
const silenceLin = 10 ** (-70 / 20);
let silent = 0, longest = 0;
for (let i = 0; i < s.length; i++) {
  if (Math.abs(s[i]) <= silenceLin) { silent++; if (silent > longest) longest = silent; }
  else silent = 0;
}
const longestSilenceSec = +(longest / 48000).toFixed(3);
function regionMean(file, ss, len, vol) {
  const probed = run('ffmpeg', ['-hide_banner', '-nostats', '-ss', ss.toFixed(3), '-t', len.toFixed(3), '-i', file, '-af', `volume=${vol},volumedetect`, '-f', 'null', '-']);
  const mean = (probed.stderr || '').match(/mean_volume:\s*([-\d.]+) dB/);
  if (!mean) return null;
  return +(+mean[1] + gainDb).toFixed(2);
}
function pair(voiceId, bedTest) {
  const voice = clips.find(c => c.id === voiceId);
  const bed = clips.find(bedTest);
  if (!voice || !bed) return null;
  const a = Math.max(voice.start, bed.start);
  const b = Math.min(voice.start + voice.dur, bed.start + bed.dur);
  if (b - a < 0.05) return null;
  const voiceMean = regionMean(voice.src, a - voice.start, b - a, voice.vol);
  const bedMean = regionMean(bed.src, a - bed.start, b - a, bed.vol);
  return { voice: voiceId, bed: bed.id, window: [+a.toFixed(3), +b.toFixed(3)], voiceMeanDbfs: voiceMean, bedMeanDbfs: bedMean, voiceOverBedDb: voiceMean == null || bedMean == null ? null : +(voiceMean - bedMean).toFixed(2) };
}
const showcase = clips.find(c => c.src.replaceAll('\\', '/').endsWith('assets/audio/music/showcase-bed.mp3'));
const voiceBed = [
  pair('vo-d5', c => c === showcase),
  pair('vo-n1', c => c.src.replaceAll('\\', '/').endsWith('assets/audio/music/office-night-bed.mp3') && c.start < 1),
].filter(Boolean);
let duckDb = null;
if (showcase) {
  const held = regionMean(showcase.src, 0.7, 0.7, showcase.vol);
  const full = regionMean(showcase.src, 3.2, 1.2, showcase.vol);
  if (held != null && full != null) duckDb = +(full - held).toFixed(2);
}
const result = { file: path.relative(ROOT, out).replaceAll('\\', '/'), clips: clips.length, integratedLufs: +m.input_i, truePeakDbtp: +m.input_tp, lra: +m.input_lra, longestSilenceSec, showcaseDuckDb: duckDb, voiceBed, sections };
fs.writeFileSync(path.join(ROOT, 'assets', 'audio', 'mix-report.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ clips: result.clips, integratedLufs: result.integratedLufs, truePeakDbtp: result.truePeakDbtp, lra: result.lra, longestSilenceSec, showcaseDuckDb: duckDb }));
for (const x of sections) console.log(`  ${x.scene.padEnd(20)} ${String(x.rmsDbfs).padStart(6)} dBFS RMS`);
for (const row of voiceBed) console.log(`  voice-bed ${row.voice} over ${row.bed}: ${row.voiceOverBedDb} dB (${row.voiceMeanDbfs} vs ${row.bedMeanDbfs})`);
