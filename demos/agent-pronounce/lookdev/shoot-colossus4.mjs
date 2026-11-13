#!/usr/bin/env node
// Render the desert v4 look-dev stills at 1920x1080 with headless Chrome.
//   node lookdev/shoot-colossus4.mjs [colossus-a colossus-b ...] [--post=base|preview] [--time=N] [--suffix=x]
// Writes snapshots/lookdev/<scene><suffix>.png and prints page errors, console errors and 4xx/5xx.
// A 404 on the Sketchfab scan is expected until the archive is fetched: the statue falls back to procedural.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = resolve('.');
const OUT = join(ROOT, 'snapshots', 'lookdev');
const args = process.argv.slice(2);
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) || `=${d}`).replace(/^[^=]*=/, '');
const scenes = args.filter((a) => !a.startsWith('--'));
const list = scenes.length ? scenes : ['colossus-a', 'colossus-b', 'colossus-c', 'colossus-d'];
const post = opt('post', 'preview');
const time = opt('time', '0');
const suffix = opt('suffix', '');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.hdr': 'application/octet-stream' };

const server = createServer(async (req, res) => {
  const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  // the colossus fit cache: only fitted-*.bin under the git-ignored assets/third-party folder may be written
  if (req.method === 'PUT') {
    const rel = p.slice(ROOT.length).replace(/\\/g, '/');
    if (!/^\/assets\/third-party\/models\/[\w./-]+\/fitted-[\w-]+\.bin$/.test(rel) || rel.includes('..')) { res.writeHead(403).end(); return; }
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    await writeFile(p, body); console.log(`  baked ${rel} (${(body.length / 1e6).toFixed(1)} MB)`);
    res.writeHead(204).end(); return;
  }
  try {
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const port = server.address().port;
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].filter(Boolean).find((c) => existsSync(c));
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=default'] });
await mkdir(OUT, { recursive: true });
let failed = 0;
try {
  for (const scene of list) {
    const shot = scene.replace(/^colossus-/, '');
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror ${e}`));
    page.on('console', (m) => { if (/Failed to load resource: .* 404/.test(m.text())) return; // 404s are judged by the response handler
      if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()} ${m.text()}`); });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico') && !r.url().endsWith('audio/cues.json') && !(r.status() === 404 && r.url().includes('/models/sketchfab/'))) errors.push(`${r.status()} ${r.url()}`); });
    const t0 = Date.now();
    await page.goto(`http://localhost:${port}/lookdev/colossus4.html?shot=${shot}&post=${post}&time=${time}${opt("q","") ? "&" + opt("q","") : ""}`);
    await page.waitForFunction('window.__lookdev === "done" || window.__lookdev?.error', { timeout: 300000 });
    const state = await page.evaluate(() => window.__lookdev);
    if (state !== 'done') { errors.push(state.error); failed++; }
    const file = join(OUT, `${scene}${suffix}.png`);
    await (await page.$('#c')).screenshot({ path: file });
    const info = await page.evaluate(() => window.__lookdevInfo || null);
    console.log(`${scene}: ${file} load ${Date.now() - t0} ms ${info ? JSON.stringify(info) : ''}`);
    for (const e of errors) console.log(`  ! ${e}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
