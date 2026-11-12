#!/usr/bin/env node
// Render the Episode 6 look-dev stills (one per scene) with headless Chrome.
//   node lookdev/shoot.mjs [office desert vortex ...]     (run from the episode folder)
// Writes snapshots/lookdev/<scene>.png and prints render ms/frame (mean of 3, GPU-synced), page errors,
// console errors and failed requests per scene. Static frames only: this is the look gate, not the cut.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = resolve('.');
const OUT = join(ROOT, 'snapshots', 'lookdev');
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : ['office', 'desert', 'vortex'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2' };

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
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=default'] });
await mkdir(OUT, { recursive: true });
try {
  for (const scene of scenes) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1350, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`http ${r.status()} ${r.url()}`); });
    await page.goto(`http://localhost:${port}/lookdev/index.html?scene=${scene}`);
    await page.waitForFunction('window.__lookdev === "done" || window.__lookdev?.error', { timeout: 240000 });
    const state = await page.evaluate(() => window.__lookdev);
    if (state !== 'done') errors.push(state.error);
    const file = join(OUT, `${scene}.png`);
    await (await page.$('#c')).screenshot({ path: file });
    const info = await page.evaluate(() => window.__lookdevInfo || null);
    const { ms, ...rest } = info || {};
    console.log(`${scene}: ${file}${ms != null ? ` render ${ms} ms/frame` : ''}${info ? ' ' + JSON.stringify(rest) : ''}`);
    console.log(`  ${errors.length} page/console/http errors`);
    for (const e of errors) console.log(`  ! ${e}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
