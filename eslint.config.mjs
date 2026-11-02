import nxPlugin from '@nx/eslint-plugin';
import jsoncParser from 'jsonc-eslint-parser';

export default [
  ...nxPlugin.configs['flat/base'],
  ...nxPlugin.configs['flat/typescript'],
  ...nxPlugin.configs['flat/javascript'],
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'tmp/**',
      'test-fixtures/**',
      '**/src/generators/**/files/**',
    ],
  },
  {
    files: ['**/*.json'],
    languageOptions: { parser: jsoncParser },
  },
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            { sourceTag: 'type:plugin', onlyDependOnLibsWithTags: [] },
            { sourceTag: 'type:preset', onlyDependOnLibsWithTags: [] },
            { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:plugin', 'type:preset'] },
          ],
        },
      ],
    },
  },
];
