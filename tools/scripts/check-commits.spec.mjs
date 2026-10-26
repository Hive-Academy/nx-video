import assert from 'node:assert/strict';
import test from 'node:test';
import { checkSubject, findOffenders } from './check-commits.mjs';

test('accepts conventional, scoped, and breaking subjects', () => {
  for (const subject of [
    'feat: add generator',
    'fix(plugin): correct paths',
    'docs!: revise public API',
    'refactor(engine)!: rename options',
    'style: format code',
    'perf: speed up scan',
    'test: cover merges',
    'build: update target',
    'ci: add matrix',
    'chore: update notices',
    'revert: remove change',
  ]) {
    assert.equal(checkSubject(subject), true, subject);
  }
});

test('rejects invalid types, missing colon, autosquash prefixes, and empty descriptions', () => {
  for (const subject of [
    'feature: add generator',
    'feat add generator',
    'fixup! feat: add generator',
    'squash! feat: add generator',
    'feat: ',
    'feat:   ',
    'feat(): add generator',
  ]) {
    assert.equal(checkSubject(subject), false, subject);
  }
});

test('enforces the 100-character subject limit', () => {
  assert.equal(checkSubject(`feat: ${'a'.repeat(94)}`), true);
  assert.equal(checkSubject(`feat: ${'a'.repeat(95)}`), false);
});

test('skips merge commits but reports other invalid subjects from injected git log output', () => {
  const log = [
    'mergehash', 'parent1 parent2', 'Merge branch feature',
    'badhash', 'parent1', 'fixup! feat: add generator',
    'goodhash', 'parent1', 'feat: add generator',
  ].join('\0') + '\0';
  assert.deepEqual(findOffenders(log), [
    { hash: 'badhash', subject: 'fixup! feat: add generator' },
  ]);
});
