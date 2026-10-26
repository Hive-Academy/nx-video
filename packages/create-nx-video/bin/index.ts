#!/usr/bin/env node

import { createWorkspace } from 'create-nx-workspace';

const packageManagers = ['pnpm', 'yarn', 'npm', 'bun'] as const;
type PackageManager = (typeof packageManagers)[number];

function packageManagerFrom(explicit: string | undefined): PackageManager {
  if (explicit !== undefined) {
    if (!packageManagers.includes(explicit as PackageManager)) {
      throw new Error(`Package manager must be one of ${packageManagers.join(', ')}`);
    }
    return explicit as PackageManager;
  }

  const userAgent = process.env.npm_config_user_agent;
  return packageManagers.find((manager) => userAgent?.startsWith(`${manager}/`)) ?? 'npm';
}

function parseArgs(args: string[]): { name: string; packageManager: PackageManager } {
  let name: string | undefined;
  let requestedManager: string | undefined;

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    const match = /^--(?:packageManager|pm)(?:=(.*))?$/.exec(argument);
    if (match) {
      requestedManager = match[1] ?? args[++index];
      if (!requestedManager || requestedManager.startsWith('-')) {
        throw new Error(`${argument} requires a package manager`);
      }
    } else if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (name === undefined) {
      name = argument;
    } else {
      throw new Error(`Unexpected argument: ${argument}`);
    }
  }

  if (!name) {
    throw new Error('Please provide a name for the workspace');
  }

  return { name, packageManager: packageManagerFrom(requestedManager) };
}

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  const { name, packageManager } = parseArgs(args);
  const version: string = (require('../package.json') as { version: string }).version;
  const { directory } = await createWorkspace(`@hive-academy/nx-video@${version}`, {
    name,
    nxCloud: 'skip',
    packageManager,
  });
  console.log(`Successfully created the workspace: ${directory}.`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
