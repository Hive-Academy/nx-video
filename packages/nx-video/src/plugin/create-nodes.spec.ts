import type { CreateNodesContext } from '@nx/devkit';
import { describe, expect, it } from 'vitest';
import { createNodes } from './create-nodes';

describe('createNodes', () => {
  const context = {} as CreateNodesContext;

  it('uses the planned trigger glob', () => {
    expect(createNodes[0]).toBe('**/{remotion.config.ts,hyperframes.json,kit.json}');
  });

  it.each([
    { files: [] },
    { files: ['video/remotion.config.ts'] },
    { files: ['video/hyperframes.json'] },
    { files: ['video/kit.json'] },
  ])('returns no projects for $files', ({ files }) => {
    expect(createNodes[1](files, undefined, context)).toEqual([]);
  });
});
