import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, 'assets/live-demo/source/rec-2026-11-09.mp4');
const out = n => resolve(root, `assets/live-demo/tour-${n}.mp4`);
const run = args => {
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit', shell: false });
  if (r.status !== 0) throw new Error(`ffmpeg exited ${r.status}`);
};
const common = ['-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r','30','-g','15','-movflags','+faststart'];
const crop = (w,h,x,y) => {
  if (Math.abs(w/h - 16/9) >= 0.01) throw new Error(`Non-16:9 crop ${w}x${h}`);
  return `crop=${w}:${h}:${x}:${y}`;
};
const crop1 = crop(1344,756,0,0);
const crop2 = crop(1088,612,0,80);
const crop3 = crop(1024,576,894,0);
const crop4 = crop(1504,846,290,0);
const cuts = [
  { n:2, start:118.0, end:129.0, speed:2.05, frames:188, crop:crop2 },
  { n:3, start:259.0, end:267.4, speed:1.6, frames:193, crop:crop3 },
];
if (!process.argv.includes('--only4') && !process.argv.includes('--only3') && !process.argv.includes('--only2')) {
  const filter = `[0:v]trim=start=15:end=19.3,setpts=(PTS-STARTPTS)/0.8,${crop1},scale=1920:1080:flags=lanczos,fps=30[a];[0:v]trim=start=20.5:end=21.4,setpts=PTS-STARTPTS,${crop1},scale=1920:1080:flags=lanczos,fps=30[b];[a][b]concat=n=2:v=1:a=0,tpad=stop_mode=clone:stop_duration=2,trim=end_frame=222,setpts=PTS-STARTPTS[v]`;
  run(['-y','-loglevel','error','-i',source,'-filter_complex',filter,'-map','[v]',...common,'-frames:v','222',out(1)]);
}
for (const c of cuts.filter(c => !process.argv.includes('--only4') && (!process.argv.includes('--only3') || c.n === 3) && (!process.argv.includes('--only2') || c.n === 2))) {
  const head = `[0:v]trim=start=${c.start}:end=${c.end},setpts=(PTS-STARTPTS)/${c.speed},${c.crop}`;
  const focus = c.n === 2
    ? 'split[sharp][private];[private]crop=538:612:550:0,boxblur=luma_radius=9:luma_power=3:chroma_radius=5:chroma_power=3,drawbox=c=black@0.55:t=fill[dim];[sharp][dim]overlay=550:0,split[whole][edge];[edge]crop=40:612:530:0,gblur=sigma=12[soft];[whole][soft]overlay=530:0'
    : '';
  const filter = `${head}${focus ? ',' + focus : ''},scale=1920:1080:flags=lanczos,fps=30,tpad=stop_mode=clone:stop_duration=2,trim=end_frame=${c.frames},setpts=PTS-STARTPTS[v]`;
  run(['-y','-loglevel','error','-i',source,'-filter_complex',filter,'-map','[v]',...common,'-frames:v',String(c.frames),out(c.n)]);
}

// A stable chart view avoids the account cards and per-session cost table below it.
// The source's currency glyphs and digits are obscured together by box blurs.
const still = resolve(root, 'snapshots/footage-v4/analytics-source.png');
run(['-y','-loglevel','error','-ss','173.2','-i',source,'-frames:v','1',still]);
const regions = [
  [305,176,128,35], // raw token cost
  [377,346,54,246], // currency axis labels
  [301,615,180,42], // chart hover readout
  [325,763,75,37], // donut total
  [925,758,106,54], // cost share values
  [1747,712,97,28],[1754,774,91,28], // provider amounts
];
const parts = [];
let current = '[cursorless]';
parts.push('[0:v]delogo=x=730:y=483:w=42:h=45:show=0[cursorless]');
regions.forEach(([x,y,w,h],i) => {
  parts.push(`${current}split[base${i}][patch${i}]`);
  parts.push(`[patch${i}]crop=${w}:${h}:${x}:${y},boxblur=luma_radius=6:luma_power=5:chroma_radius=3:chroma_power=5[blur${i}]`);
  const next = i === regions.length-1 ? '[masked]' : `[m${i}]`;
  parts.push(`[base${i}][blur${i}]overlay=${x}:${y}${next}`);
  current = next;
});
parts.push(`[masked]${crop4},scale=1920:1080:flags=lanczos,zoompan=z='min(zoom+0.00018,1.035)':d=1:s=1920x1080:fps=30,trim=end_frame=177,setpts=PTS-STARTPTS[v]`);
run(['-y','-loglevel','error','-loop','1','-framerate','30','-i',still,'-filter_complex',parts.join(';'),'-map','[v]',...common,'-frames:v','177',out(4)]);
