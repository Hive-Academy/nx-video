import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    globalSetup: '../../tools/scripts/start-local-registry.ts',
    maxWorkers: 1,
    isolate: false,
    testTimeout: 600_000,
    hookTimeout: 600_000,
  },
});
