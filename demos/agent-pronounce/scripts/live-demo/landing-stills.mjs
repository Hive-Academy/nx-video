// Extract the first and last frames of the landing scroll clip as stills for the 3D hero screen
// (episode 6 workspace). The stills are local media (gitignored); rerun after fetching the clip.
// Usage, from the demo folder: node scripts/live-demo/landing-stills.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';

const SEQ_FPS = 10;

const SRC = 'assets/live-demo/landing-scroll.mp4';
const OUT = 'assets/live-demo/stills';
if (!existsSync(SRC)) { console.error(`missing ${SRC}`); process.exit(1); }
const run = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run(['-ss', '0.05', '-i', SRC, '-frames:v', '1', `${OUT}/landing-first.png`]);
run(['-sseof', '-0.1', '-i', SRC, '-frames:v', '1', '-update', '1', `${OUT}/landing-last.png`]);
// a 10 fps, 1280 px frame sequence of the whole clip: the 3D hero screen plays it through
// handles.setScreenSource, one texture per frame, so the screen is seek-safe (a VideoTexture is not:
// the render is synchronous on hf-seek and would show whatever frame the browser last decoded)
const SEQ = `${OUT}/landing-seq`;
rmSync(SEQ, { recursive: true, force: true });
mkdirSync(SEQ, { recursive: true });
run(['-i', SRC, '-vf', `fps=${SEQ_FPS},scale=1280:-2`, '-q:v', '3', `${SEQ}/%03d.jpg`]);
// src/set-workspace.js loads 001.jpg .. NNN.jpg with NNN = clip seconds x SEQ_FPS (45 for 4.5 s)
const count = readdirSync(SEQ).filter((f) => f.endsWith('.jpg')).length;
console.log(`wrote ${OUT}/landing-first.png, ${OUT}/landing-last.png and ${count} frames in ${SEQ}`);
