import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const SIZE_LIMIT = 1_048_576;

// Source: Hive-Academy/ptah-extension@e0ca51e6e:export-kit.mjs:66; .glb/.gltf added for this public repository.
const MEDIA_EXT = new Set(['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.wav', '.mp3', '.m4a', '.glb', '.gltf']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp']);

export function parseAllowList(text) {
  const allowed = new Set();
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(.*?)\s+#\s+(.+)$/.exec(line);
    if (!match || !match[1].trim() || !match[2].trim()) {
      throw new Error(`Invalid large-files.allow line ${index + 1}: expected path  # reason`);
    }
    allowed.add(match[1].trim());
  }
  return allowed;
}

export function findViolations(entries, allowList) {
  const violations = [];
  for (const { path, size } of entries) {
    const extension = extname(path).toLowerCase();
    if (MEDIA_EXT.has(extension)) {
      violations.push({ path, reason: `forbidden media extension ${extension}` });
    }
    if (IMAGE_EXT.has(extension) && !path.startsWith('docs/images/')) {
      violations.push({ path, reason: 'image outside docs/images/' });
    }
    if (size > SIZE_LIMIT && !allowList.has(path)) {
      violations.push({ path, reason: `file exceeds ${SIZE_LIMIT} bytes without an allowlist reason` });
    }
  }
  return violations;
}

function readTrackedEntries() {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    shell: false,
    encoding: 'buffer',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`git ls-files failed: ${result.stderr.toString('utf8').trim()}`);
  const entries = [];
  for (const pathBytes of result.stdout.subarray(0, -1).toString('utf8').split('\0')) {
    if (!pathBytes) continue;
    try {
      entries.push({ path: pathBytes, size: statSync(join(repoRoot, pathBytes)).size });
    } catch (error) {
      if (error.code === 'ENOENT') {
        process.stderr.write(`skipping missing tracked file: ${pathBytes}\n`);
        continue;
      }
      throw error;
    }
  }
  return entries;
}

function main(args) {
  const entriesIndex = args.indexOf('--entries');
  const allowIndex = args.indexOf('--allow-list');
  if ((entriesIndex !== -1 && !args[entriesIndex + 1]) || (allowIndex !== -1 && !args[allowIndex + 1])) {
    throw new Error('--entries and --allow-list require a file path');
  }
  const allowPath = allowIndex === -1 ? join(repoRoot, 'tools/guards/large-files.allow') : resolve(args[allowIndex + 1]);
  const allowList = parseAllowList(readFileSync(allowPath, 'utf8'));
  const entries = entriesIndex === -1
    ? readTrackedEntries()
    : JSON.parse(readFileSync(resolve(args[entriesIndex + 1]), 'utf8'));
  const violations = findViolations(entries, allowList);
  for (const { path, reason } of violations) process.stderr.write(`${path}: ${reason}\n`);
  if (violations.length) return 1;
  process.stdout.write(`no-media: checked ${entries.length} files; no violations\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`no-media: ${error.message}\n`);
    process.exitCode = 1;
  }
}
