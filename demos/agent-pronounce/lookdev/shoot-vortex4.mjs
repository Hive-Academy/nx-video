#!/usr/bin/env node
// Render the vortex v4 look-dev stills at 1920x1080 with headless Chrome, then a 2x2 labelled sheet.
//   node lookdev/shoot-vortex4.mjs [a b c d] [--post=base|preview] [--suffix=x] [--sheet]
// Writes snapshots/lookdev/vortex4-<shot><suffix>.png, a 1280 px preview vortex4-<shot><suffix>-sm.jpg,
// and with --sheet snapshots/lookdev/vortex-sheet.jpg. Prints page errors, console errors and 4xx/5xx.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = resolve('.');
const OUT = join(ROOT, 'snapshots', 'lookdev');
const args = process.argv.slice(2);
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) || `=${d}`).replace(/^[^=]*=/, '');
const shots = args.filter((a) => !a.startsWith('--'));
const list = shots.length ? shots : ['a', 'b', 'c', 'd'];
const post = opt('post', 'preview');
const suffix = opt('suffix', '');
const sheet = args.includes('--sheet');
const LABELS = {
  a: 'A  t 0.32 s  entry: the floor has fallen',
  b: 'B  t 1.25 s  mid-tumble, wide',
  c: 'C  t 1.85 s  mid-tumble, on the chairs',
  d: 'D  t 2.45 s  just before landing (land 2.6 s)',
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.hdr': 'application/octet-stream' };

const server = createServer(async (req, res) => {
  if (req.url.endsWith('/favicon.ico')) { res.writeHead(204).end(); return; }
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
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].filter(Boolean).find((c) => existsSync(c));
const browser = await puppeteer.launch({ executablePath, headless: true, protocolTimeout: 900000, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=default'] });
await mkdir(OUT, { recursive: true });

// Downscale / compose PNGs in the page: returns a JPEG data URL.
async function compose(page, files, { cols, w, labels = null }) {
  const imgs = await Promise.all(files.map(async (f) => `data:image/png;base64,${(await readFile(f)).toString('base64')}`));
  return page.evaluate(async (imgs, cols, w, labels) => {
    const els = await Promise.all(imgs.map((s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; })));
    const h = Math.round(w * els[0].height / els[0].width), bar = labels ? 44 : 0, gap = labels ? 8 : 0;
    const rows = Math.ceil(els.length / cols);
    const c = document.createElement('canvas');
    c.width = cols * w + (cols + 1) * gap; c.height = rows * (h + bar) + (rows + 1) * gap;
    const g = c.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height);
    els.forEach((im, i) => {
      const x = gap + (i % cols) * (w + gap), y = gap + Math.floor(i / cols) * (h + bar + gap);
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, x, y + bar, w, h);
      if (labels) { g.fillStyle = '#EDE3D2'; g.font = '600 24px Segoe UI, Arial, sans-serif'; g.fillText(labels[i], x + 10, y + 31); }
    });
    return c.toDataURL('image/jpeg', 0.9);
  }, imgs, cols, w, labels);
}
const saveJpg = (file, dataUrl) => writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

let failed = 0;
try {
  for (const shot of list) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror ${e}`));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()} ${m.text()}`); });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
    const t0 = Date.now();
    await page.goto(`http://localhost:${port}/lookdev/vortex4.html?shot=${shot}&post=${post}${opt('t', '') ? `&t=${opt('t', '')}` : ''}`);
    await page.waitForFunction('window.__lookdev === "done" || window.__lookdev?.error', { timeout: 300000 });
    const state = await page.evaluate(() => window.__lookdev);
    if (state !== 'done') { errors.push(state.error); failed++; }
    const file = join(OUT, `vortex4-${shot}${suffix}.png`);
    await (await page.$('#c')).screenshot({ path: file });
    await saveJpg(join(OUT, `vortex4-${shot}${suffix}-sm.jpg`), await compose(page, [file], { cols: 1, w: 1280 }));
    const info = await page.evaluate(() => window.__lookdevInfo || null);
    console.log(`${shot}: ${file} load ${Date.now() - t0} ms ${info ? JSON.stringify(info) : ''}`);
    for (const e of errors) console.log(`  ! ${e}`);
    await page.close();
  }
  if (sheet) {
    const page = await browser.newPage();
    const order = ['a', 'b', 'c', 'd'];
    const files = order.map((s) => join(OUT, `vortex4-${s}${suffix}.png`));
    const out = join(OUT, 'vortex-sheet.jpg');
    await saveJpg(out, await compose(page, files, { cols: 2, w: 960, labels: order.map((s) => LABELS[s]) }));
    console.log(`sheet: ${out}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
