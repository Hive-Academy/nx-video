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
const result = { file: path.relative(ROOT, out).replaceAll('\\', '/'), clips: clips.length, integratedLufs: +m.input_i, truePeakDbtp: +m.input_tp, lra: +m.input_lra, sections };
fs.writeFileSync(path.join(ROOT, 'assets', 'audio', 'mix-report.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ clips: result.clips, integratedLufs: result.integratedLufs, truePeakDbtp: result.truePeakDbtp, lra: result.lra }));
for (const x of sections) console.log(`  ${x.scene.padEnd(20)} ${String(x.rmsDbfs).padStart(6)} dBFS RMS`);
