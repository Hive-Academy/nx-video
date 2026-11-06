// Fetches the provider icons from thesvg.org, copies Ptah's emblem from the Ptah repo,
// and renders 512x512 transparent PNGs with sharp (bundled with HyperFrames).
// Usage (from demos/agent-tribunal): node assets/icons/fetch-icons.mjs [--force]
// Idempotent: existing SVG downloads are reused unless --force.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const DIR = import.meta.dirname;
const ROOT = path.resolve(DIR, '..', '..');
const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
const FORCE = process.argv.includes('--force');
const PTAH = path.join(process.env.PTAH_REPO || 'D:/projects/ptah-extension', 'apps/ptah-landing-page/public/assets/icons');

// id -> thesvg.org slug + variant. `onDark` is the variant that reads on dark grounds.
export const ICONS = {
  claude: { slug: 'claude', variant: 'default', onDark: 'default' },
  codex: { slug: 'codex', variant: 'default', onDark: 'dark' },
  openai: { slug: 'openai', variant: 'light', onDark: 'dark' }, // alternate mark for Codex
  cursor: { slug: 'cursor', variant: 'light', onDark: 'default' },
  antigravity: { slug: 'google-antigravity', variant: 'default', onDark: 'default' },
  opencode: { slug: 'opencode', variant: 'default', onDark: 'default', recolorOnDark: '#FFF6E5' },
};

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

async function png(svgOrImage, out, { pad = 0.06 } = {}) {
  const box = Math.round(512 * (1 - pad * 2));
  const inner = await sharp(svgOrImage, { density: 1600 })
    .resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: inner, gravity: 'center' }]).png().toFile(out);
}

const manifest = {};
for (const [id, s] of Object.entries(ICONS)) {
  for (const [suffix, variant] of [['', s.variant], ['-ondark', s.onDark]]) {
    const svgFile = path.join(DIR, `${id}${suffix}.svg`);
    const url = `https://thesvg.org/icons/${s.slug}/${variant}.svg`;
    if (FORCE || !fs.existsSync(svgFile)) {
      let svg = (await get(url)).toString('utf8');
      if (suffix && s.recolorOnDark) svg = svg.replace('fill="currentColor"', `fill="${s.recolorOnDark}"`);
      fs.writeFileSync(svgFile, svg);
    }
    await png(fs.readFileSync(svgFile), path.join(DIR, `${id}${suffix}.png`));
    manifest[`${id}${suffix}`] = { source: url, page: `https://thesvg.org/icon/${s.slug}`, variant };
  }
}

// Ptah: the engraved emblem (the landing page's site logo, ptah-icon.webp), never the old ptah-logo.svg ring.
// ptah.png = the emblem as published (dark engraving); ptah-ondark.png = the gold line version built by
// assets/brand/build-brand.mjs (run that first). The old ring mark files are removed.
fs.copyFileSync(path.join(PTAH, 'ptah-icon.webp'), path.join(DIR, 'ptah-icon.webp'));
await png(fs.readFileSync(path.join(PTAH, 'ptah-icon.webp')), path.join(DIR, 'ptah.png'), { pad: 0.02 });
const gold = path.join(ROOT, 'assets', 'brand', 'ptah-emblem-gold.png');
if (fs.existsSync(gold)) await png(fs.readFileSync(gold), path.join(DIR, 'ptah-ondark.png'), { pad: 0.02 });
for (const old of ['ptah.svg', 'ptah-ondark.svg', 'ptah-mark.png']) fs.rmSync(path.join(DIR, old), { force: true });
manifest.ptah = { source: 'ptah-extension/apps/ptah-landing-page/public/assets/icons/ptah-icon.webp (emblem); ptah-ondark.png from assets/brand/ptah-emblem-gold.png' };
fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('icons:', Object.keys(manifest).join(', '));
