#!/usr/bin/env node
// Append Poly Haven assets (CC0) to assets/media.manifest.json, one entry per file, so the
// shared fetcher (tools/media/fetch-media.mjs) downloads and pins them. Run from the episode folder:
//   node lookdev/ph-manifest.mjs model:<id> texture:<id> hdri:<id>[@2k] ...
// Models are the 1k glTF bundle (gltf + bin + textures) under assets/third-party/models/ph/<id>/.
// Textures are 1k diffuse, GL normal and ARM (AO/rough/metal) under assets/third-party/textures/ph/<id>/.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'assets/media.manifest.json';
const UA = { headers: { 'user-agent': 'nx-video-lookdev' } };
const get = async (u) => { const r = await fetch(u, UA); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const manifest = JSON.parse(readFileSync(FILE, 'utf8'));
const have = new Set(manifest.items.map((i) => i.path));
const added = [];

function push(path, url, info, id, changes) {
  if (have.has(path)) return;
  have.add(path);
  added.push({ path, url, title: `${info.name} (${path.split('/').pop()})`, author: Object.keys(info.authors || {}).join(', ') || 'Poly Haven', source: `https://polyhaven.com/a/${id}`, licence: 'CC0-1.0', changes });
}

for (const arg of process.argv.slice(2)) {
  const [kind, spec] = arg.split(':');
  const [id, res = kind === 'hdri' ? '2k' : '1k'] = spec.split('@');
  const info = await get(`https://api.polyhaven.com/info/${id}`);
  const files = await get(`https://api.polyhaven.com/files/${id}`);
  if (kind === 'model') {
    const g = files.gltf[res].gltf;
    const base = `assets/third-party/models/ph/${id}`;
    push(`${base}/${g.url.split('/').pop()}`, g.url, info, id, 'Loaded as is; scaled and placed in scene');
    for (const [rel, f] of Object.entries(g.include)) push(`${base}/${rel}`, f.url, info, id, 'None');
  } else if (kind === 'texture') {
    const base = `assets/third-party/textures/ph/${id}`;
    for (const map of ['Diffuse', 'nor_gl', 'arm']) {
      const f = files[map]?.[res]?.jpg;
      if (f) push(`${base}/${f.url.split('/').pop()}`, f.url, info, id, 'Tiled; tinted in scene');
    }
  } else if (kind === 'hdri') {
    const f = files.hdri[res].hdr;
    push(`assets/third-party/hdri/${f.url.split('/').pop()}`, f.url, info, id, 'Rotated in scene');
  } else throw new Error(`unknown kind ${kind}`);
}
manifest.items.push(...added);
writeFileSync(FILE, JSON.stringify(manifest, null, 2) + '\n');
console.log(`added ${added.length} entries`);
