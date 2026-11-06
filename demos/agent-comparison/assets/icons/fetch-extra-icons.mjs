// Episode 2 icons that fetch-icons.mjs does not cover: T3 Code's marks (from its own
// repository, pinned to the commit the comparison read), Grok (thesvg.org) and a plain
// "Pi" name badge (the pi coding agent ships no mark). Renders 512x512 transparent PNGs
// with sharp (bundled with HyperFrames). Sources and licences: CREDITS.md.
// Usage (from demos/agent-comparison): node assets/icons/fetch-extra-icons.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const DIR = import.meta.dirname;
const ROOT = path.resolve(DIR, '..', '..');
const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
const FORCE = process.argv.includes('--force');

const T3_RAW = 'https://raw.githubusercontent.com/pingdotgg/t3code/132be33afffac9b98891b56845bf6aa3e8d55172';
const PI_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Neutral name badge for Pi (pi coding agent). Not a logo: the pi-mono repository has no product mark. -->
  <text x="256" y="338" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="300" fill="#18181B">Pi</text>
</svg>
`;

const ICONS = [
  { id: 't3code', url: `${T3_RAW}/assets/prod/logo.svg`, pad: 0 },
  { id: 't3code-mark', url: `${T3_RAW}/assets/prod/app-icon.icon/Assets/text.svg` },
  { id: 'grok', url: 'https://thesvg.org/icons/grok/light.svg' },
  { id: 'grok-ondark', url: 'https://thesvg.org/icons/grok/default.svg' },
  { id: 'pi', svg: PI_SVG },
];

async function get(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`${url} -> ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise(r => setTimeout(r, 1500 * i));
    }
  }
}

async function png(svg, out, pad = 0.06) {
  const box = Math.round(512 * (1 - pad * 2));
  // Rasterise at about twice the target size: a fixed density overflows sharp's pixel
  // limit on SVGs with very large view boxes (Grok's).
  const { width = box, height = box } = await sharp(svg).metadata();
  const density = Math.min(1600, Math.max(72, (72 * 2 * box) / Math.max(width, height)));
  const inner = await sharp(svg, { density })
    .resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: inner, gravity: 'center' }]).png().toFile(out);
}

for (const icon of ICONS) {
  const svgFile = path.join(DIR, `${icon.id}.svg`);
  if (FORCE || !fs.existsSync(svgFile)) {
    fs.writeFileSync(svgFile, icon.svg ?? await get(icon.url));
  }
  await png(fs.readFileSync(svgFile), path.join(DIR, `${icon.id}.png`), icon.pad);
  console.log(`wrote ${icon.id}.svg / .png`);
}
