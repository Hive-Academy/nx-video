import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { nxVersion, runNpx } from './test-utils';

declare module 'vitest' {
  export interface ProvidedContext {
    registryUserconfig: string;
  }
}

describe('published Nx plugin', () => {
  let temporaryDirectory: string | undefined;
  let workspace: string;
  let userconfig: string;

  beforeAll(() => {
    userconfig = inject('registryUserconfig');
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'nx-video-e2e-'));
    const version = nxVersion();
    runNpx([
      '--yes', `create-nx-workspace@${version}`, 'workspace',
      '--preset=apps', '--nxCloud=skip', '--packageManager=npm', '--no-interactive',
    ], temporaryDirectory, userconfig);
    workspace = join(temporaryDirectory, 'workspace');
    runNpx(['--yes', 'npm@11.12.1', 'install', '-D', '@hive-academy/nx-video@e2e'], workspace, userconfig);

    const nxJsonPath = join(workspace, 'nx.json');
    const nxJson = JSON.parse(readFileSync(nxJsonPath, 'utf8')) as { plugins?: string[] };
    nxJson.plugins = [...(nxJson.plugins ?? []), '@hive-academy/nx-video'];
    writeFileSync(nxJsonPath, `${JSON.stringify(nxJson, null, 2)}\n`);

    const fixture = join(workspace, 'fixtures', 'kit-only');
    mkdirSync(fixture, { recursive: true });
    writeFileSync(join(fixture, 'project.json'), '{"name":"kit-only","targets":{}}\n');
    writeFileSync(join(fixture, 'kit.json'), '{}\n');
  }, 600_000);

  afterAll(() => {
    if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('loads the plugin and leaves the kit fixture without inferred targets', () => {
    const projects = runNpx(['--no-install', 'nx', 'show', 'projects', '--json'], workspace, userconfig);
    expect(JSON.parse(projects) as string[]).toContain('kit-only');

    const listing = runNpx(['--no-install', 'nx', 'list', '@hive-academy/nx-video'], workspace, userconfig);
    const pluginRoot = join(workspace, 'node_modules', '@hive-academy', 'nx-video');
    const generators = JSON.parse(readFileSync(join(pluginRoot, 'generators.json'), 'utf8')) as { generators: Record<string, unknown> };
    const executors = JSON.parse(readFileSync(join(pluginRoot, 'executors.json'), 'utf8')) as { executors: Record<string, unknown> };
    expect(generators.generators).toEqual({});
    expect(executors.executors).toEqual({});
    expect(listing).not.toMatch(/\b(generator|executor):\s+\w/i);

    const project = JSON.parse(runNpx(['--no-install', 'nx', 'show', 'project', 'kit-only', '--json'], workspace, userconfig)) as { targets?: Record<string, unknown> };
    expect(project.targets ?? {}).toEqual({});
  }, 600_000);
});
