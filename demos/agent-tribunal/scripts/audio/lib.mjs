// Shared helpers for the audio pipeline. Node 24 ESM, built-ins + global fetch only.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const AUDIO = path.join(ROOT, 'assets', 'audio');
export const API = 'https://api.elevenlabs.io';

let cachedKey;
/** Reads ELEVENLABS_API_KEY from the repo .env at runtime. Never log the value. */
export function apiKey() {
  if (cachedKey) return cachedKey;
  const envFile = path.resolve(ROOT, '..', '..', '.env');
  const text = fs.readFileSync(envFile, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?ELEVENLABS_API_KEY\s*=\s*(.*)\s*$/);
    if (m) cachedKey = m[1].trim().replace(/^['"]|['"]$/g, '');
  }
  if (!cachedKey) throw new Error('ELEVENLABS_API_KEY missing from .env');
  return cachedKey;
}

/** `json` sends a JSON body; `form` (a FormData) sends multipart, letting fetch set the boundary. */
export async function api(method, route, { json, form, query, accept = 'application/json', retries = 3 } = {}) {
  const url = new URL(route, API);
  for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, String(v));
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { 'xi-api-key': apiKey(), accept, ...(json ? { 'content-type': 'application/json' } : {}) },
      body: json ? JSON.stringify(json) : form,
    });
    if (res.ok) return accept === 'application/json' ? res.json() : Buffer.from(await res.arrayBuffer());
    const body = (await res.text()).slice(0, 600);
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await new Promise(r => setTimeout(r, 2000 * attempt));
      continue;
    }
    const err = new Error(`${method} ${url.pathname} -> ${res.status}: ${body}`);
    err.status = res.status;
    throw err;
  }
}

export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: opts.binary ? 'buffer' : 'utf8', maxBuffer: 1 << 28, shell: false });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed: ${String(r.stderr).slice(-800)}`);
  return r;
}

export const hasFfmpeg = () => spawnSync('ffmpeg', ['-version'], { shell: false }).status === 0;

export function duration(file) {
  const r = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  return +Number(r.stdout.trim()).toFixed(3);
}

/** Decodes to mono float32 PCM at the given rate. */
export function pcm(file, rate = 48000) {
  const r = run('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(rate), '-f', 'f32le', '-'], { binary: true });
  const b = r.stdout;
  return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4));
}

export const ensureDir = d => fs.mkdirSync(d, { recursive: true });
export const exists = f => fs.existsSync(f) && fs.statSync(f).size > 0;
export const rel = f => path.relative(ROOT, f).replaceAll('\\', '/');
