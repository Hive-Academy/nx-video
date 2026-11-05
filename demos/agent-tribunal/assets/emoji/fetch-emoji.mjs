// Vendors the Noto Color Emoji SVGs used by the booth speech bubbles (never the system emoji font).
// Source: https://github.com/googlefonts/noto-emoji (Apache-2.0), 2D/svg/emoji_u<codepoint>.svg.
// Usage (from demos/agent-tribunal): node assets/emoji/fetch-emoji.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';

const DIR = import.meta.dirname;
const REF = process.env.NOTO_REF || '99701e07d3d1fe1bdbcdb14964547f0fd592966f'; // main on 2026-11-05
const FORCE = process.argv.includes('--force');
// Every code point referenced by src/bubbles.json, plus a few spares.
const bubbles = JSON.parse(fs.readFileSync(path.resolve(DIR, '..', '..', 'src', 'bubbles.json'), 'utf8'));
const wanted = new Set();
for (const line of Object.values(bubbles.lines || {})) for (const list of Object.values(line.emoji || {})) list.forEach(c => wanted.add(c));

async function get(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`${url} -> ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) { if (i >= tries) throw e; await new Promise(r => setTimeout(r, 1500 * i)); }
  }
}
const got = [];
for (const cp of wanted) {
  const out = path.join(DIR, `${cp}.svg`);
  if (fs.existsSync(out) && !FORCE) { got.push(cp); continue; }
  const url = `https://raw.githubusercontent.com/googlefonts/noto-emoji/${REF}/2D/svg/emoji_u${cp}.svg`;
  fs.writeFileSync(out, await get(url));
  got.push(cp);
}
fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify({ source: `https://github.com/googlefonts/noto-emoji/tree/${REF}/2D/svg`, licence: 'Apache-2.0', files: got.sort().map(cp => ({ codepoint: cp, file: `${cp}.svg`, url: `https://raw.githubusercontent.com/googlefonts/noto-emoji/${REF}/2D/svg/emoji_u${cp}.svg` })) }, null, 2));
console.log('emoji:', got.join(', '));
