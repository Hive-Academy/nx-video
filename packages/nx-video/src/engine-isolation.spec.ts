import { builtinModules } from 'node:module';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  ENGINE_ZONES,
  ENGINE_ZONE_MESSAGE,
  FORBIDDEN_SPAWN_STRINGS,
  PIN_LITERAL_ALLOWED_FILES,
  PIN_LITERAL_PATTERNS,
  type EngineZone,
} from '../../../tools/eslint/engine-zones.mjs';

const PACKAGE_ROOT = process.cwd().endsWith(join('packages', 'nx-video'))
  ? process.cwd()
  : resolve(process.cwd(), 'packages', 'nx-video');
const EXCLUSION_GLOBS = [
  '**/*.spec.ts',
  'src/generators/**/files/**',
  'tools/eslint/**',
  'test-fixtures/**',
] as const;
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mjs']);
const BUILTINS = new Set(builtinModules.map((name) => name.replace(/^node:/, '')));

interface IsolationViolation {
  file: string;
  kind: 'static' | 'dynamic' | 'require' | 'pin' | 'spawn' | 'computed';
  target: string;
  message: string;
}

function slash(value: string): string {
  return value.split(sep).join('/');
}

function matchesGlob(file: string, glob: string): boolean {
  return glob.endsWith('/**') ? file.startsWith(glob.slice(0, -2)) : file === glob;
}

function isExcluded(file: string): boolean {
  return file.endsWith('.spec.ts') || (file.startsWith('src/generators/') && file.includes('/files/')) ||
    file.startsWith('tools/eslint/') || file.startsWith('test-fixtures/');
}

function sourceFiles(root: string): string[] {
  const src = join(root, 'src');
  if (!existsSync(src)) return [];
  const found: string[] = [];
  function visit(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolute = join(dir, entry.name);
      const pathInPackage = slash(relative(root, absolute));
      if (isExcluded(pathInPackage)) continue;
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) found.push(absolute);
    }
  }
  visit(src);
  return found.sort();
}

function resolveRelative(root: string, importer: string, specifier: string): string {
  const target = resolve(dirname(importer), specifier);
  const candidates = extname(target)
    ? [target]
    : [target, ...['.ts', '.tsx', '.mjs', '.js'].map((extension) => target + extension), join(target, 'index.ts')];
  return slash(relative(root, candidates.find((candidate) => existsSync(candidate)) ?? target));
}

function prohibitedPackage(zone: EngineZone, specifier: string, typeOnly: boolean): boolean {
  if (zone.id === 'studio') return specifier.startsWith('node:') || BUILTINS.has(specifier) ||
    specifier === '@nx/devkit' || specifier.startsWith('@nx/devkit/');
  if (zone.id === 'capture') return specifier === '@nx/devkit' || specifier.startsWith('@nx/devkit/');
  if (zone.id === 'shared') {
    if (typeOnly && specifier === '@nx/devkit') return false;
    return !specifier.startsWith('node:') && !BUILTINS.has(specifier);
  }
  return false;
}

function scan(root: string): IsolationViolation[] {
  const violations: IsolationViolation[] = [];
  for (const absolute of sourceFiles(root)) {
    const file = slash(relative(root, absolute));
    const text = readFileSync(absolute, 'utf8');
    const zones = ENGINE_ZONES.filter((zone) => zone.globs.some((glob) => matchesGlob(file, glob)));
    const add = (kind: IsolationViolation['kind'], target: string): void => {
      violations.push({ file, kind, target, message: ENGINE_ZONE_MESSAGE });
    };

    if (!PIN_LITERAL_ALLOWED_FILES.some((glob) => matchesGlob(file, glob)) &&
      PIN_LITERAL_PATTERNS.some((pattern) => text.includes(pattern))) {
      for (const hit of text.matchAll(/(?:hyperframes|remotion)@|@remotion\/[\w.-]+@/g)) add('pin', hit[0]);
    }
    for (const forbidden of FORBIDDEN_SPAWN_STRINGS) {
      if (text.includes(forbidden)) add('spawn', forbidden);
    }

    const source = ts.createSourceFile(
      absolute,
      text,
      ts.ScriptTarget.Latest,
      true,
      absolute.endsWith('.tsx') ? ts.ScriptKind.TSX : absolute.endsWith('.mjs') ? ts.ScriptKind.JS : ts.ScriptKind.TS,
    );
    const inspect = (kind: IsolationViolation['kind'], argument: ts.Expression | undefined, typeOnly = false): void => {
      if (zones.length === 0) return;
      if (!argument || !ts.isStringLiteralLike(argument)) {
        if (kind === 'dynamic' || kind === 'require') add('computed', kind);
        return;
      }
      const specifier = argument.text;
      const target = specifier.startsWith('.') ? resolveRelative(root, absolute, specifier) : specifier;
      if (zones.some((zone) => {
        if (!specifier.startsWith('.')) return prohibitedPackage(zone, specifier, typeOnly);
        return zone.forbidden.some((glob) => matchesGlob(target, glob)) &&
          !zone.exceptions.includes(target);
      })) add(kind, target);
    };
    function visit(node: ts.Node): void {
      if (ts.isImportDeclaration(node)) {
        inspect('static', node.moduleSpecifier, node.importClause?.isTypeOnly ?? false);
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        inspect('static', node.moduleSpecifier, node.isTypeOnly);
      } else if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) inspect('dynamic', node.arguments[0]);
        else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
          inspect('require', node.arguments[0]);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return violations;
}

describe('engine isolation', () => {
  it('uses the exact exclusion list', () => {
    expect(EXCLUSION_GLOBS).toEqual([
      '**/*.spec.ts',
      'src/generators/**/files/**',
      'tools/eslint/**',
      'test-fixtures/**',
    ]);
  });

  it('finds four violations in a synthetic tree, including a normalized parent path', () => {
    const root = mkdtempSync(join(tmpdir(), 'nx-video-isolation-'));
    try {
      mkdirSync(join(root, 'src', 'remotion'), { recursive: true });
      mkdirSync(join(root, 'src', 'hyperframes'), { recursive: true });
      writeFileSync(join(root, 'src', 'hyperframes', 'target.ts'), 'export const target = 1;\n');
      writeFileSync(join(root, 'src', 'remotion', 'entry.ts'), [
        "import '../hyperframes/target';",
        "void import('../hyperframes/target');",
        "void require('../hyperframes/target');",
        "import '../../src/hyperframes/target';",
      ].join('\n'));
      const violations = scan(root);
      console.log('four self-test violations:', violations.map((item) => `${item.kind}:${item.target}`).join(', '));
      expect(violations).toHaveLength(4);
      expect(violations.map((item) => item.kind)).toEqual(['static', 'dynamic', 'require', 'static']);
      expect(violations.every((item) => item.target === 'src/hyperframes/target.ts')).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps the package source inside its zones', () => {
    expect(scan(PACKAGE_ROOT)).toEqual([]);
  });
});
