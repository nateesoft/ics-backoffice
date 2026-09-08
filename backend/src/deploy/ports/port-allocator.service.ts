import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as net from 'net';
import { ConfigService } from '@nestjs/config';
import { UisGenDeployment } from '../../entities/uis-gen-deployment.entity';

function parseRange(raw: string | undefined, fallback: [number, number]): [number, number] {
  if (!raw) return fallback;
  const [from, to] = raw.split('-').map(Number);
  return Number.isFinite(from) && Number.isFinite(to) ? [from, to] : fallback;
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '0.0.0.0');
  });
}

@Injectable()
export class PortAllocatorService {
  constructor(
    @InjectRepository(UisGenDeployment) private deploymentsRepo: Repository<UisGenDeployment>,
    private config: ConfigService,
  ) {}

  // Deliberately outside the main app's known 9191/3001 — defaults chosen not to collide with
  // anything already documented in this repo. Configurable via env since the actual free range on
  // the production host isn't verifiable from the repo (flagged in the deploy design proposal).
  private get frontendRange(): [number, number] {
    return parseRange(this.config.get('DEPLOY_FRONTEND_PORT_RANGE'), [4100, 4199]);
  }
  private get backendRange(): [number, number] {
    return parseRange(this.config.get('DEPLOY_BACKEND_PORT_RANGE'), [4200, 4299]);
  }

  async allocate(): Promise<{ frontendPort: number; backendPort: number }> {
    const used = await this.deploymentsRepo.find({
      select: { frontendPort: true, backendPort: true },
      where: [{ status: 'running' }, { status: 'starting' }, { status: 'building' }, { status: 'generating' }, { status: 'pending' }],
    });
    const usedPorts = new Set<number>();
    for (const d of used) {
      if (d.frontendPort) usedPorts.add(d.frontendPort);
      if (d.backendPort) usedPorts.add(d.backendPort);
    }

    const frontendPort = await this.findFreePort(this.frontendRange, usedPorts);
    usedPorts.add(frontendPort);
    const backendPort = await this.findFreePort(this.backendRange, usedPorts);
    return { frontendPort, backendPort };
  }

  private async findFreePort([from, to]: [number, number], excluded: Set<number>): Promise<number> {
    for (let port = from; port <= to; port++) {
      if (excluded.has(port)) continue;
      if (await isPortFree(port)) return port;
    }
    throw new Error(`No free port available in range ${from}-${to}`);
  }
}
