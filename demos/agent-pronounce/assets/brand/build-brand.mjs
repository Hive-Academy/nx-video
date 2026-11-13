// Derived brand and background files for the overlays and the 3D badges.
// Usage (from demos/agent-tribunal): node assets/brand/build-brand.mjs
//
//  assets/brand/ptah-emblem-gold.png   1024 x 1024, transparent: the engraving lines of the Ptah
//  assets/brand/ptah-emblem-cream.png  emblem (alpha = source alpha x inverted luminance, so the white
//                                      fill disappears), filled gold (#F6CF7A -> #E8A33D) or cream.
//  assets/backgrounds/temple-16x9.jpg  1920 x 1080 cover crop of temple-bg.webp centred on the throne.
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
const SRC = path.join(ROOT, 'assets/brand/ptah-emblem.webp');
const SIZE = 1024;

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
async function emblem(out, top, bottom) {
  // Upscale the RGBA source first (lanczos3) so the extracted lines are smooth at 1024 px.
  const { data, info } = await sharp(SRC).resize(SIZE, SIZE, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [t, b] = [hex(top), hex(bottom)];
  const outBuf = Buffer.alloc(info.width * info.height * 4);
  for (let y = 0; y < info.height; y++) {
    const k = y / (info.height - 1);
    const col = t.map((v, i) => Math.round(v + (b[i] - v) * k));
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      const L = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      const line = Math.min(1, Math.max(0, (0.9 - L) / 0.7)) ** 0.85; // dark engraving -> opaque, white fill -> clear
      outBuf[i] = col[0]; outBuf[i + 1] = col[1]; outBuf[i + 2] = col[2];
      outBuf[i + 3] = Math.round(data[i + 3] * line);
    }
  }
  await sharp(outBuf, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(out);
}
await emblem(path.join(ROOT, 'assets/brand/ptah-emblem-gold.png'), '#F6CF7A', '#E8A33D');
await emblem(path.join(ROOT, 'assets/brand/ptah-emblem-cream.png'), '#FFF6E5', '#F1E3C8');

// Temple: 1024 x 576 band (y 202..778) holds the light shaft, the throne gate and the floor; the throne is
// centred horizontally. Upscaled to 1920 x 1080 (it sits under a dark shade, so softness is fine).
await sharp(path.join(ROOT, 'assets/backgrounds/temple-bg.webp'))
  .extract({ left: 0, top: 202, width: 1024, height: 576 })
  .resize(1920, 1080, { kernel: 'lanczos3' })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(path.join(ROOT, 'assets/backgrounds/temple-16x9.jpg'));
console.log('brand: ptah-emblem-gold.png, ptah-emblem-cream.png, temple-16x9.jpg');
