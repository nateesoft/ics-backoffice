import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';

export type LogLine = (line: string) => void;

// Thin wrapper over plain `child_process.spawn` — a single fire-and-monitor spawn per stage needs
// nothing more than the native 'data'/'close' events, so no extra dependency (e.g. execa) is
// warranted here; matches this repo's existing preference for Node built-ins over convenience
// wrappers (e.g. AuthService's own raw `fs` usage instead of fs-extra).
@Injectable()
export class DockerRunnerService {
  private run(args: string[], cwd: string, onLog: LogLine): Promise<number> {
    return new Promise((resolve, reject) => {
      const child = spawn('docker', args, { cwd });
      const pipe = (data: Buffer) => {
        for (const line of data.toString('utf-8').split('\n')) {
          if (line.trim()) onLog(line);
        }
      };
      child.stdout.on('data', pipe);
      child.stderr.on('data', pipe);
      child.on('error', reject);
      child.on('close', code => resolve(code ?? 1));
    });
  }

  async composeUp(deploymentDir: string, composeProjectName: string, onLog: LogLine): Promise<void> {
    const code = await this.run(['compose', '-p', composeProjectName, 'up', '-d', '--build'], deploymentDir, onLog);
    if (code !== 0) throw new Error(`docker compose up exited with code ${code}`);
  }

  // `removeVolumes`/`removeImages` are true for a permanent delete (also drops the DB volume and
  // the built images so repeated deploy/delete cycles don't accumulate stale images on disk) and
  // false for a plain stop (keeps both so a later restart is fast and data isn't lost).
  async composeDown(deploymentDir: string, composeProjectName: string, onLog: LogLine, removeVolumes: boolean, removeImages = false): Promise<void> {
    const args = ['compose', '-p', composeProjectName, 'down'];
    if (removeVolumes) args.push('-v');
    if (removeImages) args.push('--rmi', 'local');
    // Best-effort: a deployment that was never fully generated/started may have no directory or
    // compose file to tear down — not an error worth failing a delete over.
    if (!fs.existsSync(deploymentDir)) return;
    await this.run(args, deploymentDir, onLog);
  }

  // `docker compose down --rmi/-v` can only discover a project's volume/images via its own
  // still-tracked containers — once a prior stop() already tore those down, a later `down
  // --rmi local` finds "no resource for project X" and silently no-ops on the images (confirmed
  // empirically: volumes removed fine in that case, images didn't). Compose's own naming
  // convention for an unnamed `build:` service and volume is predictable
  // (`<project>-<service>[:latest]`, `<project>_<volume>`), so remove them directly by name as a
  // guaranteed-correct fallback regardless of what order stop/delete were called in.
  async removeResidualImages(composeProjectName: string, onLog: LogLine): Promise<void> {
    await this.run(['image', 'rm', '-f', `${composeProjectName}-backend:latest`, `${composeProjectName}-frontend:latest`], process.cwd(), onLog).catch(() => {});
  }
}
