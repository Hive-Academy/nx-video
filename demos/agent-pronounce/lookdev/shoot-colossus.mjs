#!/usr/bin/env node
// Render the Ptah colossus look-dev stills at 1920x1080 with headless Chrome.
//   node lookdev/shoot-colossus.mjs [colossus-a colossus-b colossus-c] [--draft]   (run from the episode folder)
// Writes snapshots/lookdev/<shot>.png and prints page errors, console errors and 4xx responses.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = resolve('.');
const OUT = join(ROOT, 'snapshots', 'lookdev');
const args = process.argv.slice(2);
const draft = args.includes('--draft');
const shots = args.filter((a) => !a.startsWith('--'));
if (!shots.length) shots.push('colossus-a', 'colossus-b', 'colossus-c');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2' };
const IGNORE = [/\/assets\/audio\/cues\.json$/, /\/favicon\.ico$/]; // audio is not part of the look gate

const server = createServer(async (req, res) => {
  const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const port = server.address().port;

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);
const executablePath = CANDIDATES.find((c) => existsSync(c));
const browser = await puppeteer.launch({ executablePath, headless: true, protocolTimeout: 900000, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=default'] });
await mkdir(OUT, { recursive: true });
let failed = 0;
try {
  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    const errors = [], ignored = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('response', (r) => { if (r.status() >= 400) (IGNORE.some((re) => re.test(r.url())) ? ignored : errors).push(`${r.status()} ${r.url()}`); });
    const t0 = process.hrtime.bigint();
    await page.goto(`http://localhost:${port}/lookdev/colossus.html?shot=${shot}${draft ? '&quality=draft' : ''}`);
    await page.waitForFunction('window.__lookdev === "done" || window.__lookdev?.error', { timeout: 900000 });
    const state = await page.evaluate(() => window.__lookdev);
    if (state !== 'done') errors.push(state.error);
    const file = join(OUT, `${shot}.png`);
    await (await page.$('#c')).screenshot({ path: file });
    const info = await page.evaluate(() => window.__lookdevInfo || null);
    const secs = Number(process.hrtime.bigint() - t0) / 1e9;
    console.log(`${shot}: ${file} ${secs.toFixed(0)}s${info ? ' ' + JSON.stringify(info) : ''}`);
    for (const e of errors) console.log(`  ! ${e}`);
    for (const e of ignored) console.log(`  (ignored) ${e}`);
    // the "404 Not Found" console line duplicates an ignored response; count only real errors
    const real = errors.filter((e) => !/Failed to load resource: the server responded with a status of 404/.test(e) || !ignored.length);
    if (real.length) failed++;
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
