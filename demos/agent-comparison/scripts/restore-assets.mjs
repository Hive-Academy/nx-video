// Restores the images and models that this public repository does not track
// (tools/guards/no-media.mjs rejects them). Audio is regenerated separately with
// scripts/audio/generate.mjs because it calls the paid ElevenLabs API.
//
//   PTAH_REPO=<path to a ptah-extension checkout> node scripts/restore-assets.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PTAH_REPO = process.env.PTAH_REPO || 'D:/projects/ptah-extension';
const LANDING = path.join(PTAH_REPO, 'apps/ptah-landing-page/public/assets');

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`copied ${path.relative(ROOT, to)}`);
}

function run(script) {
  console.log(`running ${script}`);
  const result = spawnSync(process.execPath, [path.join(ROOT, script)], { cwd: ROOT, stdio: 'inherit', shell: false });
  if (result.status !== 0) throw new Error(`${script} exited with ${result.status}`);
}

if (!fs.existsSync(LANDING)) {
  throw new Error(`Ptah landing assets not found at ${LANDING}. Set PTAH_REPO to a ptah-extension checkout.`);
}

copy(path.join(LANDING, 'backgrounds/temple-bg.webp'), path.join(ROOT, 'assets/backgrounds/temple-bg.webp'));
copy(path.join(LANDING, 'icons/ptah-icon.webp'), path.join(ROOT, 'assets/brand/ptah-emblem.webp'));
run('assets/brand/build-brand.mjs');
run('assets/icons/fetch-icons.mjs');
run('assets/icons/fetch-extra-icons.mjs');
run('assets/emoji/fetch-emoji.mjs');

const robot = path.join(ROOT, 'assets/models/cute_robot.glb');
if (!fs.existsSync(robot)) {
  console.log(
    '\nManual step: download "cute robot" by victory_mirosya (CC BY 4.0) as glTF binary from\n' +
      'https://sketchfab.com/3d-models/cute-robot-6aadb75f596742ada2814ad4593f0032\n' +
      'and save it as assets/models/cute_robot.glb (Sketchfab needs a signed-in account).',
  );
}
