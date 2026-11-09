#!/usr/bin/env node
// Download the free third-party media an episode uses, from its manifest, and write
// its credits. Media stays untracked (tools/guards/no-media.mjs); the manifest is
// tracked, so any checkout can rebuild the same files.
//
//   node tools/media/fetch-media.mjs demos/<episode>            fetch missing files, verify hashes
//   node tools/media/fetch-media.mjs demos/<episode> --pin      also write missing sha256 values back
//   node tools/media/fetch-media.mjs demos/<episode> --check    verify only, download nothing
//
// Manifest: demos/<episode>/assets/media.manifest.json
//   { "items": [ { "path": "assets/models/statue.glb", "url": "https://…", "sha256": "…",
//       "title": "…", "author": "…", "source": "https://asset page", "licence": "CC0-1.0",
//       "changes": "recoloured", "extract": "inner/path/in.zip" } ] }
// `extract` (optional): the url is a zip; keep only that member, saved as `path`.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative } from 'node:path';

const LICENCES = {
  'CC0-1.0': { name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', credit: false },
  'CC-BY-4.0': { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', credit: true },
  'CC-BY-3.0': { name: 'CC BY 3.0', url: 'https://creativecommons.org/licenses/by/3.0/', credit: true },
  'OFL-1.1': { name: 'SIL OFL 1.1', url: 'https://openfontlicense.org/', credit: true },
  'Pixabay': { name: 'Pixabay Content License', url: 'https://pixabay.com/service/license-summary/', credit: false },
  'MIT': { name: 'MIT', url: 'https://opensource.org/license/mit', credit: true },
};

const [dirArg, ...flags] = process.argv.slice(2);
if (!dirArg) {
  console.error('usage: node tools/media/fetch-media.mjs demos/<episode> [--pin|--check]');
  process.exit(2);
}
const EP = resolve(dirArg);
const MANIFEST = join(EP, 'assets', 'media.manifest.json');
const pin = flags.includes('--pin');
const checkOnly = flags.includes('--check');
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
let failures = 0;
let changed = false;

function fail(item, msg) {
  failures++;
  console.error(`FAIL ${item.path}: ${msg}`);
}

function validate(item) {
  for (const k of ['path', 'url', 'title', 'author', 'source', 'licence']) if (!item[k]) return `missing "${k}"`;
  if (!LICENCES[item.licence]) return `licence "${item.licence}" is not allowed (allowed: ${Object.keys(LICENCES).join(', ')})`;
  if (item.path.includes('..') || /^[a-z]:|^\//i.test(item.path)) return 'path must be relative to the episode folder';
  const ignored = spawnSync('git', ['check-ignore', '-q', join(EP, item.path)], { cwd: EP, shell: false });
  if (ignored.status !== 0) return 'path is not gitignored; media must stay untracked';
  return null;
}

async function download(url) {
  const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'nx-video-fetch-media' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function unzipMember(zipBuf, member) {
  const dir = mkdtempSync(join(tmpdir(), 'fetch-media-'));
  try {
    const zip = join(dir, 'a.zip');
    writeFileSync(zip, zipBuf);
    // bsdtar reads zip files and ships with Windows 10+ and macOS. On Windows, call it by its
    // System32 path: Git Bash puts GNU tar first on PATH, which cannot read zips and treats
    // "C:" as a remote host. Relative names in cwd avoid drive letters altogether.
    const sys = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
    const tar = process.platform === 'win32' && existsSync(sys) ? sys : 'tar';
    const r = spawnSync(tar, ['-xf', 'a.zip', member], { cwd: dir, shell: false });
    if (r.status !== 0) throw new Error(`tar could not extract ${member}: ${String(r.stderr).trim()}`);
    return readFileSync(join(dir, member));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const item of manifest.items) {
  const bad = validate(item);
  if (bad) { fail(item, bad); continue; }
  const dest = join(EP, item.path);
  if (existsSync(dest)) {
    const have = sha(readFileSync(dest));
    if (item.sha256 && have !== item.sha256) fail(item, `sha256 mismatch (have ${have})`);
    else console.log(`ok   ${item.path}`);
    if (!item.sha256 && pin) { item.sha256 = have; changed = true; }
    continue;
  }
  if (checkOnly) { fail(item, 'missing (run without --check to fetch)'); continue; }
  try {
    let buf = await download(item.url);
    if (item.extract) buf = unzipMember(buf, item.extract);
    const got = sha(buf);
    if (item.sha256 && got !== item.sha256) { fail(item, `sha256 mismatch (got ${got})`); continue; }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    console.log(`got  ${item.path} (${(buf.length / 1024).toFixed(0)} KB)`);
    if (!item.sha256 && pin) { item.sha256 = got; changed = true; }
    if (!item.sha256 && !pin) console.log(`     sha256 ${got} (run with --pin to record it)`);
  } catch (e) {
    fail(item, e.message);
  }
}

if (changed) writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

// Credits are generated from the manifest so they never drift from what is fetched.
const rows = manifest.items.map((i) => {
  const l = LICENCES[i.licence] || { name: i.licence, url: '' };
  return `| \`${i.path}\` | ${i.title} | ${i.author} | ${i.source} | [${l.name}](${l.url}) | ${i.changes || 'None'} |`;
});
const credits = [
  '# Third-party media credits',
  '',
  `Generated by \`tools/media/fetch-media.mjs\` from \`assets/media.manifest.json\`. Do not edit by hand.`,
  '',
  '| File | Title | Author | Source | Licence | Changes |',
  '| --- | --- | --- | --- | --- | --- |',
  ...rows,
  '',
  '## End-card credit lines (licences that require attribution)',
  '',
  ...manifest.items.filter((i) => LICENCES[i.licence]?.credit).map((i) => `- "${i.title}" by ${i.author}, ${LICENCES[i.licence].name}`),
  '',
].join('\n');
if (!checkOnly) writeFileSync(join(EP, 'assets', 'CREDITS.media.md'), credits);
console.log(`${manifest.items.length - failures}/${manifest.items.length} ok${checkOnly ? '' : `; credits -> ${relative(process.cwd(), join(EP, 'assets', 'CREDITS.media.md'))}`}`);
process.exit(failures ? 1 : 0);
