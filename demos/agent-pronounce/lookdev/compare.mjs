import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=default'],
});
try {
  const page = await browser.newPage();
  const before = process.argv[2] || 'snapshots/lookdev-before';
  const after = process.argv[3] || 'snapshots/lookdev';
  for (const name of ['office', 'office-bolt', 'desert', 'vortex']) {
    const a = (await readFile(resolve(before, `${name}.png`))).toString('base64');
    const b = (await readFile(resolve(after, `${name}.png`))).toString('base64');
    const result = await page.evaluate(async (a, b) => {
      const load = (s) => new Promise((resolve, reject) => {
        const image = new Image(); image.onload = () => resolve(image);
        image.onerror = reject; image.src = `data:image/png;base64,${s}`;
      });
      const [x, y] = await Promise.all([load(a), load(b)]);
      if (x.width !== y.width || x.height !== y.height) throw Error('Dimensions differ');
      const pixels = (img) => {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      const p = pixels(x), q = pixels(y); let sum = 0, max = 0;
      for (let i = 0; i < p.length; i++) { const d = Math.abs(p[i] - q[i]); sum += d; max = Math.max(max, d); }
      return { mean: sum / p.length, max };
    }, a, b);
    console.log(`${name}: mean=${result.mean.toFixed(6)}/255 max=${result.max}/255`);
  }
} finally { await browser.close(); }
