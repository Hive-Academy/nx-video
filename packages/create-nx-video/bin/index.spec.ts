import { createWorkspace } from 'create-nx-workspace';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from './index';

vi.mock('create-nx-workspace', () => ({ createWorkspace: vi.fn() }));

const version: string = (require('../package.json') as { version: string }).version;

describe('create-nx-video', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createWorkspace).mockResolvedValue({ directory: 'demo' } as Awaited<ReturnType<typeof createWorkspace>>);
  });

  it('uses its package version and skips Nx Cloud', async () => {
    await main(['demo', '--packageManager', 'pnpm']);

    expect(createWorkspace).toHaveBeenCalledExactlyOnceWith(
      `@hive-academy/nx-video@${version}`,
      { name: 'demo', nxCloud: 'skip', packageManager: 'pnpm' },
    );
  });

  it('passes workspace creation errors through', async () => {
    const error = new Error('Nx failed');
    vi.mocked(createWorkspace).mockRejectedValue(error);

    await expect(main(['demo'])).rejects.toBe(error);
  });
});
