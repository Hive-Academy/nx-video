import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const registry = 'http://localhost:4873';

export function nxVersion(): '24.0.1' | '23.3.1' {
  const version = process.env.NX_VIDEO_E2E_NX_VERSION ?? '24.0.1';
  if (version !== '24.0.1' && version !== '23.3.1') {
    throw new Error(`NX_VIDEO_E2E_NX_VERSION must be 24.0.1 or 23.3.1; received ${version}`);
  }
  return version;
}

export function npxCli(): string {
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

export function runNpx(args: string[], cwd: string, userconfig: string): string {
  const result = spawnSync(process.execPath, [npxCli(), ...args], {
    cwd,
    env: {
      ...process.env,
      NPM_CONFIG_USERCONFIG: userconfig,
      NX_DAEMON: 'false',
      NX_NO_CLOUD: 'true',
      NX_ISOLATE_PLUGINS: 'false',
    },
    shell: false,
    encoding: 'utf8',
    timeout: 540_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${args.join(' ')} failed in ${cwd}: ${result.error?.message ?? result.stderr ?? result.stdout}`);
  }
  return result.stdout;
}
