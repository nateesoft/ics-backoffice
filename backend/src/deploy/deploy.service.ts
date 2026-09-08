import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { UisGenDeployment, UisGenDeploymentStatus } from '../entities/uis-gen-deployment.entity';
import { UisGenProject } from '../entities/uis-gen-project.entity';
import { ManifestService } from './manifest/manifest.service';
import { PortAllocatorService } from './ports/port-allocator.service';
import { DockerRunnerService } from './docker/docker-runner.service';
import { generateBackend, generateJwtSecret } from './generators/backend-template';
import { generateFrontend } from './generators/frontend-template';
import { renderDockerCompose } from './docker/compose-template';
import { slugify, generateUniqueSlug } from '../common/slug.util';

export interface DeployLogEmitter {
  (deploymentId: string, line: string): void;
}

@Injectable()
export class DeployService {
  // Set by DeployModule after both this service and the gateway exist, avoiding a circular DI
  // dependency between them (gateway needs the service to trigger deploys; service needs the
  // gateway to stream logs back).
  onLog: DeployLogEmitter = () => {};
  onStatusChange: (deploymentId: string, status: UisGenDeploymentStatus) => void = () => {};

  constructor(
    @InjectRepository(UisGenDeployment) private deploymentsRepo: Repository<UisGenDeployment>,
    @InjectRepository(UisGenProject) private projectsRepo: Repository<UisGenProject>,
    private manifestService: ManifestService,
    private portAllocator: PortAllocatorService,
    private dockerRunner: DockerRunnerService,
    private config: ConfigService,
  ) {}

  private deploymentsRoot(): string {
    return this.config.get('DEPLOYMENTS_ROOT_DIR') || path.join(process.cwd(), '..', 'uisgen-deployments');
  }

  private deployHost(): string {
    return this.config.get('DEPLOY_HOST') || 'localhost';
  }

  async listForProject(projectId: string): Promise<UisGenDeployment[]> {
    return this.deploymentsRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async getById(id: string): Promise<UisGenDeployment> {
    const row = await this.deploymentsRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Deployment not found');
    return row;
  }

  getLogPath(deployment: UisGenDeployment): string {
    return path.join(this.deploymentsRoot(), deployment.slug, 'deploy.log');
  }

  readLogs(deployment: UisGenDeployment, tail = 200): string[] {
    const logPath = this.getLogPath(deployment);
    if (!fs.existsSync(logPath)) return [];
    const lines = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);
    return lines.slice(-tail);
  }

  // Creates the deployment row (fast) and kicks off the actual work in the background — the
  // caller gets the row back immediately and follows progress via the socket gateway or by
  // polling status/logs. A rejected `runDeploy` still leaves the row in a terminal `failed` state
  // with `lastError` set, since that method's own try/catch handles it.
  async start(projectId: string): Promise<UisGenDeployment> {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('UIs Gen project not found');

    const slug = await generateUniqueSlug(this.deploymentsRepo, project.name);
    const { frontendPort, backendPort } = await this.portAllocator.allocate();

    const deployment = await this.deploymentsRepo.save(this.deploymentsRepo.create({
      projectId,
      status: 'pending',
      slug,
      frontendPort,
      backendPort,
      dbName: `uisgen_${slugify(slug).replace(/-/g, '_')}`,
      composeProjectName: slug,
    }));

    this.runDeploy(deployment.id).catch(() => {});
    return deployment;
  }

  async runDeploy(deploymentId: string): Promise<void> {
    const deployment = await this.getById(deploymentId);
    const dir = path.join(this.deploymentsRoot(), deployment.slug);

    try {
      await this.setStatus(deployment, 'generating');
      this.log(deployment, 'Resolving deploy manifest…');
      const manifest = await this.manifestService.build(deployment.projectId);
      deployment.manifestSnapshot = manifest as unknown as Record<string, unknown>;
      await this.deploymentsRepo.save(deployment);
      if (manifest.unresolvedApiUrls.length > 0) {
        this.log(deployment, `Warning: ${manifest.unresolvedApiUrls.length} callApi step(s) reference an API URL that couldn't be resolved: ${manifest.unresolvedApiUrls.join(', ')}`);
      }

      fs.mkdirSync(dir, { recursive: true });
      const dbUser = 'uisgen';
      const dbPassword = crypto.randomBytes(16).toString('hex');

      this.log(deployment, 'Generating backend…');
      generateBackend(path.join(dir, 'backend'), manifest, {
        jwtSecret: generateJwtSecret(),
        dbHost: 'db',
        dbUser,
        dbPassword,
        dbName: deployment.dbName!,
        port: 3001,
      }, `${deployment.slug}-backend`);

      this.log(deployment, 'Generating frontend…');
      generateFrontend(path.join(dir, 'frontend'), manifest, {
        apiBaseUrl: `http://${this.deployHost()}:${deployment.backendPort}`,
      }, `${deployment.slug}-frontend`);

      fs.writeFileSync(path.join(dir, 'docker-compose.yml'), renderDockerCompose({
        dbName: deployment.dbName!,
        dbUser,
        dbPassword,
        frontendPort: deployment.frontendPort!,
        backendPort: deployment.backendPort!,
        deployHost: this.deployHost(),
      }));

      await this.setStatus(deployment, 'building');
      this.log(deployment, 'Building and starting containers (docker compose up -d --build)…');
      await this.dockerRunner.composeUp(dir, deployment.composeProjectName!, line => this.log(deployment, line));

      await this.setStatus(deployment, 'starting');
      deployment.deployedAt = new Date();
      await this.setStatus(deployment, 'running');
      this.log(deployment, `Running — frontend http://${this.deployHost()}:${deployment.frontendPort}, backend http://${this.deployHost()}:${deployment.backendPort}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      deployment.status = 'failed';
      deployment.lastError = message;
      await this.deploymentsRepo.save(deployment);
      this.onStatusChange(deployment.id, 'failed');
      this.log(deployment, `ERROR: ${message}`);
    }
  }

  async stop(id: string): Promise<UisGenDeployment> {
    const deployment = await this.getById(id);
    const dir = path.join(this.deploymentsRoot(), deployment.slug);
    await this.dockerRunner.composeDown(dir, deployment.composeProjectName!, line => this.log(deployment, line), false);
    return this.setStatus(deployment, 'stopped');
  }

  async remove(id: string): Promise<void> {
    const deployment = await this.getById(id);
    const dir = path.join(this.deploymentsRoot(), deployment.slug);
    await this.dockerRunner.composeDown(dir, deployment.composeProjectName!, () => {}, true, true);
    await this.dockerRunner.removeResidualImages(deployment.composeProjectName!, () => {});
    fs.rmSync(dir, { recursive: true, force: true });
    await this.deploymentsRepo.delete(id);
  }

  private async setStatus(deployment: UisGenDeployment, status: UisGenDeploymentStatus): Promise<UisGenDeployment> {
    deployment.status = status;
    const saved = await this.deploymentsRepo.save(deployment);
    this.onStatusChange(deployment.id, status);
    return saved;
  }

  // Appends to the deployment's own log file (so REST polling/reconnect always has full history)
  // and relays live via the socket gateway (wired up by DeployModule after construction, see
  // `onLog` above) — the file is authoritative, the socket is just a live tail of it.
  private log(deployment: UisGenDeployment, line: string): void {
    const timestamped = `[${new Date().toISOString()}] ${line}`;
    const dir = path.join(this.deploymentsRoot(), deployment.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'deploy.log'), timestamped + '\n');
    this.onLog(deployment.id, timestamped);
  }
}
