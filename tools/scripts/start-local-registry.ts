import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { stopLocalRegistry } from './stop-local-registry';

const root = resolve(import.meta.dirname, '../..');
const registry = 'http://localhost:4873';
let child: ChildProcess | undefined;
let configDirectory: string | undefined;

function npxCli(): string {
  const override = process.env.NX_VIDEO_NPX_CLI;
  if (override && !/[\\/]npx-cli\.js$/.test(override)) {
    throw new Error('NX_VIDEO_NPX_CLI must end in npx-cli.js');
  }
  const candidates = override ? [override] : [
    join(dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js'),
    join(dirname(process.execPath), '../lib/node_modules/npm/bin/npx-cli.js'),
  ];
  const found = candidates.find(existsSync);
  if (!found) throw new Error('npm npx-cli.js was not found next to Node; set NX_VIDEO_NPX_CLI');
  return found;
}

function run(args: string[], env: NodeJS.ProcessEnv): void {
  const result = spawnSync(process.execPath, [npxCli(), '--no-install', 'nx', ...args], {
    cwd: root,
    env,
    shell: false,
    encoding: 'utf8',
    timeout: 300_000,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`nx ${args.join(' ')} failed: ${result.error?.message ?? `${result.stdout}\n${result.stderr}`}`);
  }
  if (result.stdout) process.stdout.write(result.stdout);
}

async function waitForRegistry(registryProcess: ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (registryProcess.exitCode !== null) throw new Error(`Local registry exited with ${registryProcess.exitCode}`);
    try {
      const response = await fetch(`${registry}/-/ping`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch { /* Registry is still starting. */ }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error('Local registry did not become ready on port 4873 within 60 seconds');
}

export async function setup({ provide }: { provide: (key: 'registryUserconfig', value: string) => void }): Promise<void> {
  const cli = npxCli();
  let portOccupied = false;
  try {
    const response = await fetch(`${registry}/-/ping`, { signal: AbortSignal.timeout(1_000) });
    portOccupied = response.ok;
  } catch { /* No registry responded on the configured port. */ }
  if (portOccupied) throw new Error('port 4873 already serves a registry; stop it first');
  configDirectory = mkdtempSync(join(tmpdir(), 'nx-video-registry-'));
  const userconfig = join(configDirectory, '.npmrc');
  writeFileSync(userconfig, `registry=${registry}/\n//localhost:4873/:_authToken=${randomBytes(24).toString('hex')}\n`, { mode: 0o600 });
  const env = { ...process.env, NPM_CONFIG_USERCONFIG: userconfig };
  try {
    child = spawn(process.execPath, [cli, '--no-install', 'nx', 'run', 'nx-video-source:local-registry', '--location=none'], {
      cwd: root,
      env,
      shell: false,
      stdio: 'ignore',
      detached: process.platform !== 'win32',
    });
    await waitForRegistry(child);
    run(['release', 'version', '0.0.0-e2e', '--git-commit=false', '--git-tag=false', '--stage-changes=false', '--first-release'], env);
    run(['release', 'publish', '--tag', 'e2e', '--registry', registry], env);
    provide('registryUserconfig', userconfig);
  } catch (error) {
    await teardown();
    throw error;
  }
}

export async function teardown(): Promise<void> {
  if (configDirectory) await stopLocalRegistry(child, configDirectory);
  child = undefined;
  configDirectory = undefined;
}
