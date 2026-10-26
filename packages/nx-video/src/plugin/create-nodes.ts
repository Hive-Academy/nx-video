import type { CreateNodes } from '@nx/devkit';

export const createNodes: CreateNodes = [
  '**/{remotion.config.ts,hyperframes.json,kit.json}',
  () => [],
];
