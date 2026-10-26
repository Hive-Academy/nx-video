// Globs are relative to packages/nx-video. Keep this module data-only so both
// ESLint and the TypeScript isolation test consume the same policy.
export const ENGINE_ZONE_MESSAGE =
  'engines share no code (CLAUDE.md hard rule 4); move engine-neutral code to src/shared';

export const ENGINE_ZONES = [
  {
    id: 'remotion',
    globs: ['src/remotion/**', 'src/executors/remotion/**'],
    allowed: ['src/shared/**', 'src/manifest/**', 'src/remotion/**'],
    forbidden: ['src/hyperframes/**', 'src/executors/hyperframes/**'],
    forbiddenPackages: [],
    exceptions: [],
  },
  {
    id: 'hyperframes',
    globs: ['src/hyperframes/**', 'src/executors/hyperframes/**'],
    allowed: ['src/shared/**', 'src/hyperframes/**'],
    forbidden: ['src/remotion/**', 'src/manifest/**', 'src/capture/**'],
    forbiddenPackages: [],
    exceptions: [],
  },
  {
    id: 'shared',
    globs: ['src/shared/**'],
    allowed: ['node builtins', '@nx/devkit types'],
    forbidden: [
      'src/remotion/**',
      'src/hyperframes/**',
      'src/executors/remotion/**',
      'src/executors/hyperframes/**',
      'src/capture/**',
    ],
    forbiddenPackages: ['@nx/devkit runtime', 'non-node packages'],
    exceptions: [],
  },
  {
    id: 'studio',
    globs: ['src/remotion/studio/**'],
    allowed: ['remotion', '@remotion/*', 'react', 'zod', 'src/manifest/**', 'src/remotion/studio/**'],
    forbidden: ['src/shared/**', 'src/remotion/scripts/**'],
    forbiddenPackages: ['node builtins', '@nx/devkit'],
    exceptions: [],
  },
  {
    id: 'scripts',
    globs: ['src/remotion/scripts/**'],
    allowed: ['node builtins', 'src/remotion/scripts/**', 'src/remotion/studio/lib/qrcode.mjs'],
    forbidden: ['src/remotion/studio/**'],
    forbiddenPackages: [],
    exceptions: ['src/remotion/studio/lib/qrcode.mjs'],
  },
  {
    id: 'capture',
    globs: ['src/capture/**'],
    allowed: ['@playwright/test', 'node builtins', 'src/manifest/**'],
    forbidden: [
      'src/remotion/**',
      'src/hyperframes/**',
      'src/executors/remotion/**',
      'src/executors/hyperframes/**',
    ],
    forbiddenPackages: ['@nx/devkit'],
    exceptions: [],
  },
  {
    id: 'aggregators',
    globs: [
      'src/executors/doctor/**',
      'src/plugin/**',
      'src/generators/init/**',
      'src/generators/preset/**',
    ],
    allowed: ['both engines versions.ts', 'src/generators/**'],
    forbidden: [],
    forbiddenPackages: [],
    exceptions: [],
  },
];

export const PIN_LITERAL_PATTERNS = ['hyperframes@', 'remotion@', '@remotion/'];
export const PIN_LITERAL_ALLOWED_FILES = [
  'src/remotion/versions.ts',
  'src/hyperframes/versions.ts',
  'src/generators/**/files/**',
];
export const FORBIDDEN_SPAWN_STRINGS = ['npx.cmd', 'shell: true', "execFileSync('npx'"];
