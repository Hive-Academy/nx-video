import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const subjectPattern = /^(?:feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\([^()\s]+\))?!?: \S[^\r\n]*$/u;

export function checkSubject(subject) {
  return typeof subject === 'string'
    && [...subject].length <= 100
    && subjectPattern.test(subject);
}

export function findOffenders(log) {
  const fields = log.split('\0');
  if (fields.at(-1) === '') fields.pop();
  if (fields.length % 3 !== 0) {
    throw new Error('Unexpected git log format; expected hash, parents, and subject for each commit.');
  }

  const offenders = [];
  for (let index = 0; index < fields.length; index += 3) {
    const [hash, parents, subject] = fields.slice(index, index + 3);
    if (parents.trim().split(/\s+/u).length > 1) continue;
    if (!checkSubject(subject)) offenders.push({ hash, subject });
  }
  return offenders;
}

function main(base, head) {
  if (!base || !head) {
    console.error('Usage: node tools/scripts/check-commits.mjs <base-sha> <head-sha>');
    process.exitCode = 1;
    return;
  }

  const result = spawnSync('git', ['log', '--format=%H%x00%P%x00%s', '-z', `${base}..${head}`], {
    shell: false,
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message ?? result.stderr?.trim() ?? 'git log failed');
    process.exitCode = 1;
    return;
  }

  try {
    const offenders = findOffenders(result.stdout);
    for (const { hash, subject } of offenders) {
      console.error(`${hash}: ${subject}`);
    }
    if (offenders.length > 0) {
      console.error(`${offenders.length} commit subject(s) do not follow Conventional Commits.`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2], process.argv[3]);
}
