// QA "listen" pass: transcribes every delivered voice file with ElevenLabs speech-to-text (Scribe) and
// compares it with the line it should say, so mispronounced acronyms (T3, PR, SQLite, BM25, MIT), dropped
// or extra words show up without a human listening. Cached in assets/audio/qa/<row>.json.
// Usage: node scripts/audio/qa-transcribe.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import { AUDIO, ROOT, api, ensureDir, exists } from './lib.mjs';

const FORCE = process.argv.includes('--force');
const cues = JSON.parse(fs.readFileSync(path.join(AUDIO, 'cues.json'), 'utf8'));
const dir = path.join(AUDIO, 'qa'); ensureDir(dir);
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
// Expected spoken forms of the respelled tokens.
const spoken = s => norm(s.replace(/<break[^>]*\/>/g, ' ').replace(/\.\.\./g, ' ').replace(/P\.R\./g, 'PR').replace(/Sequel-lite/g, 'SQLite').replace(/B-M-25/g, 'BM25').replace(/M-I-T/g, 'MIT'));
const rows = [];
for (const v of Object.values(cues.voices)) {
  const cache = path.join(dir, `${v.row.toLowerCase()}.json`);
  if (!exists(cache) || FORCE || JSON.parse(fs.readFileSync(cache,'utf8')).file !== v.file || fs.statSync(cache).mtimeMs < fs.statSync(path.join(ROOT,v.file)).mtimeMs) {
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(path.join(ROOT, v.file))], { type: 'audio/mpeg' }), path.basename(v.file));
    form.append('model_id', 'scribe_v1');
    form.append('language_code', 'en');
    form.append('tag_audio_events', 'false');
    const res = await api('POST', '/v1/speech-to-text', { form });
    fs.writeFileSync(cache, JSON.stringify({ file: v.file, text: res.text, words: res.words?.filter(w => w.type === 'word').map(w => ({ text: w.text, start: w.start, end: w.end })) }, null, 2));
  }
  const heard = JSON.parse(fs.readFileSync(cache, 'utf8')).text;
  const want = spoken(v.tts || v.text), got = norm(heard);
  // Word-level edit distance.
  const a = want.split(' '), b = got.split(' ');
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  rows.push({ row: v.row, edits: d[a.length][b.length], want, heard });
}
fs.writeFileSync(path.join(AUDIO, 'qa-report.json'), JSON.stringify(rows, null, 2));
for (const r of rows) console.log(`${r.edits ? 'CHECK' : 'ok   '} ${r.row.padEnd(4)} heard: "${r.heard}"${r.edits ? `  (want: "${r.want}", ${r.edits} word edits)` : ''}`);
