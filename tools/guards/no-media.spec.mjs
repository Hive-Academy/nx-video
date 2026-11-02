import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { findViolations, parseAllowList } from './no-media.mjs';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const fixture = (name) => join(root, 'test-fixtures/guards/no-media', name);
const readEntries = (name) => JSON.parse(readFileSync(fixture(name), 'utf8'));
const allowed = parseAllowList('# reviewed fixture\nallowed.bin  # fixture large file\n');

test('clean entries, including a documented image and allowlisted large file, pass', () => {
  assert.deepEqual(findViolations(readEntries('clean.json'), allowed), []);
});

test('dirty entries fail each rule with exact reasons', () => {
  assert.deepEqual(findViolations(readEntries('dirty.json'), allowed), [
    { path: 'a.mp4', reason: 'forbidden media extension .mp4' },
    { path: 'B.WAV', reason: 'forbidden media extension .wav' },
    { path: 'm.glb', reason: 'forbidden media extension .glb' },
    { path: 'src/logo.png', reason: 'image outside docs/images/' },
    { path: 'big.bin', reason: 'file exceeds 1048576 bytes without an allowlist reason' },
  ]);
});

test('CLI exits zero for clean fixture and one for dirty fixture', () => {
  const temp = mkdtempSync(join(tmpdir(), 'nx-video-guard-'));
  try {
    const allowPath = join(temp, 'large-files.allow');
    writeFileSync(allowPath, 'allowed.bin  # fixture large file\n');
    const run = (name) => spawnSync(process.execPath, [
      join(root, 'tools/guards/no-media.mjs'),
      '--entries', fixture(name), '--allow-list', allowPath,
    ], { encoding: 'utf8', shell: false });
    const clean = run('clean.json');
    assert.equal(clean.status, 0, clean.stderr);
    assert.match(clean.stdout, /no-media: checked 3 files; no violations/);
    const dirty = run('dirty.json');
    assert.equal(dirty.status, 1);
    assert.equal(dirty.stderr.trim().split('\n').length, 5);
    assert.match(dirty.stderr, /B\.WAV: forbidden media extension \.wav/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('allowlist requires a reason on every entry', () => {
  assert.throws(() => parseAllowList('big.bin\n'), /line 1: expected path {2}# reason/);
});
