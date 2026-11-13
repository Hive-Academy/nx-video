// Scratch static server: serves the agent-pronounce project root so
// notes/scratch-3d.html can load ../src/scene.js + node_modules/three
// without the Studio SPA intercepting the route. Scratch tooling only.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3097);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.css': 'text/css' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    let p = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
    if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
    try { (await readFile(p + '' + (p.endsWith('/') ? 'index.html' : ''))).toString(); } catch { /* not a dir read */ }
    let data;
    try { data = await readFile(p); } catch {
      try { data = await readFile(path.join(p, 'index.html')); } catch { res.writeHead(404); return res.end('404 ' + url.pathname); }
    }
    res.writeHead(200, { 'content-type': types[path.extname(p).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(port, () => console.log(`scratch server http://localhost:${port} root=${root}`));
