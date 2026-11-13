// Freeze accepted tour footage into deterministic 10fps frames for the 3D panel.
// Run from the demo folder after media fetch; output stays git-ignored.
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
const scene = JSON.parse(readFileSync('src/timing.json')).scenes.find(s => s.id === 'desert');
const fps = 10;
const manifest = { fps, clips: [] };
for (const c of scene.cues.tours) {
  const count = Math.ceil((c.end - c.start) * fps);
  const dir = `assets/live-demo/stills/${c.clip}-seq`;
  mkdirSync(dir, { recursive: true });
  const r = spawnSync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-i',`assets/live-demo/${c.clip}.mp4`,'-vf',`fps=${fps},scale=1280:-2,tpad=stop_mode=clone:stop_duration=1`,'-frames:v',String(count),'-q:v','3',`${dir}/%03d.jpg`], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${c.clip}: ${r.status}`);
  manifest.clips.push({ ...c, count, dir });
}
console.log('Tour frames:', manifest.clips.map(c => `${c.clip}:${c.count}`).join(', '));
