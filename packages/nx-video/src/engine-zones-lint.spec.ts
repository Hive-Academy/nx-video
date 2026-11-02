import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { ENGINE_ZONE_MESSAGE } from '../../../tools/eslint/engine-zones.mjs';

const packageRoot = process.cwd().endsWith(join('packages', 'nx-video'))
  ? process.cwd()
  : resolve(process.cwd(), 'packages', 'nx-video');
const workspaceRoot = join(packageRoot, '..', '..');
const fixturePath = join(packageRoot, 'src', 'remotion', '__fixture__.ts');
const eslint = new ESLint({
  cwd: packageRoot,
  overrideConfigFile: join(packageRoot, 'eslint.config.mjs'),
});

describe('engine-zone ESLint rules', () => {
  it('reports the three cross-engine fixture errors', async () => {
    const names = ['static', 'dynamic', 'require'] as const;
    const errors: string[] = [];
    for (const name of names) {
      const fixture = readFileSync(join(workspaceRoot, 'test-fixtures', 'lint', `${name}-cross-engine.ts`), 'utf8');
      const [result] = await eslint.lintText(fixture, { filePath: fixturePath });
      const messages = result.messages.filter((message) => message.severity === 2);
      expect(messages, `${name} fixture`).toHaveLength(1);
      expect(messages[0].message).toContain(ENGINE_ZONE_MESSAGE);
      errors.push(`${name}:${messages[0].ruleId}`);
    }
    console.log('three fixture errors:', errors.join(', '));
    expect(errors).toHaveLength(3);
  });

  it('permits an import from src/shared', async () => {
    const [result] = await eslint.lintText("import '../shared/helper';\n", { filePath: fixturePath });
    expect(result.messages.filter((message) => message.severity === 2)).toEqual([]);
  });

  it('allows only the designated studio file from scripts', async () => {
    const scriptPath = join(packageRoot, 'src', 'remotion', 'scripts', '__fixture__.ts');
    for (const source of [
      "import '../studio/lib/qrcode.mjs';",
      "void import('../studio/lib/qrcode.mjs');",
    ]) {
      const [result] = await eslint.lintText(source, { filePath: scriptPath });
      expect(result.messages.filter((message) => message.severity === 2)).toEqual([]);
    }
    for (const source of [
      "import '../studio/lib/other.mjs';",
      "void import('../studio/lib/other.mjs');",
    ]) {
      const [result] = await eslint.lintText(source, { filePath: scriptPath });
      expect(result.messages.filter((message) => message.severity === 2)).toHaveLength(1);
    }
  });
});
