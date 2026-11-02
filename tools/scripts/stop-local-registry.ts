import { spawnSync, type ChildProcess } from 'node:child_process';
import { rmSync } from 'node:fs';

export async function stopLocalRegistry(child: ChildProcess | undefined, configDirectory: string): Promise<void> {
  try {
    if (child && child.exitCode === null && child.signalCode === null) {
      const terminate = (signal: NodeJS.Signals): void => {
        if (process.platform === 'win32') {
          spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { shell: false, windowsHide: true });
        } else if (child.pid) {
          try { process.kill(-child.pid, signal); } catch { child.kill(signal); }
        } else {
          child.kill(signal);
        }
      };
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          terminate('SIGKILL');
          resolve();
        }, 10_000);
        child.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
        terminate('SIGTERM');
      });
    }
  } finally {
    rmSync(configDirectory, { recursive: true, force: true });
  }
}
