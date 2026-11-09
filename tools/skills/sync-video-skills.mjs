#!/usr/bin/env node
// Copy the series video skills from tools/skills (tracked; the source of truth) to every
// skill folder a CLI lane reads. Re-run after editing a skill.
//   node tools/skills/sync-video-skills.mjs [--check]
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKILLS = ['video-quality-bar', 'threejs-scene-craft', 'free-media-sourcing'];
const SOURCE = join(ROOT, 'tools', 'skills'); // tracked source of truth
const HOME = homedir();
const TARGETS = [
  join(ROOT, '.claude', 'skills'), // Claude, Grok, Ptah SDK lanes (project)
  join(ROOT, '.agents', 'skills'), // Antigravity, Codex (project)
  join(HOME, '.codex', 'skills'), // Codex (global)
  join(HOME, '.grok', 'skills'), // Grok
  join(HOME, '.agents', 'skills'), // Antigravity (global)
  join(HOME, '.claude', 'skills'), // Ptah SDK lanes (Glm, Kimi), Claude
];
const check = process.argv.includes('--check');
let bad = 0;

for (const name of SKILLS) {
  const src = join(SOURCE, name);
  if (!existsSync(join(src, 'SKILL.md'))) {
    console.log(`skip ${name}: no ${join(src, 'SKILL.md')}`);
    continue;
  }
  const want = readFileSync(join(src, 'SKILL.md'), 'utf8');
  for (const root of TARGETS) {
    const dest = join(root, name);
    if (check) {
      const ok = existsSync(join(dest, 'SKILL.md')) && readFileSync(join(dest, 'SKILL.md'), 'utf8') === want;
      if (!ok) bad++;
      console.log(`${ok ? 'ok  ' : 'STALE'} ${dest}`);
      continue;
    }
    mkdirSync(root, { recursive: true });
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    console.log(`copied ${name} -> ${dest}`);
  }
}
process.exit(bad ? 1 : 0);
