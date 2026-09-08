import * as crypto from 'crypto';
import { copyWithTransform, writeGeneratedFile } from '../copy-with-transform.util';
import { backendCopiedFiles } from './copied-files';
import {
  renderMainTs, renderCollectionsModuleTs, renderCustomEndpointsModuleTs, renderAppModuleTs,
  renderPackageJson, renderTsconfigJson, renderTsconfigBuildJson, renderNestCliJson, renderEnv,
} from './core-files.template';
import { renderSeedTs } from './seed-ts.template';
import { renderSeedModuleTs, renderSeedServiceTs } from './seed-module.template';
import {
  renderActorEntityTs, renderActorAuthModuleTs, renderActorJwtStrategyTs, renderActorJwtAuthGuardTs,
  renderActorAuthServiceTs, renderActorAuthControllerTs,
} from './actor-auth.template';
import { renderBackendDockerfile } from './dockerfile.template';
import type { DeployManifest } from '../../manifest/manifest.types';

export interface GeneratedBackendConfig {
  jwtSecret: string;
  dbHost: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  port: number;
}

export function generateJwtSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateBackend(targetDir: string, manifest: DeployManifest, config: GeneratedBackendConfig, packageName: string): void {
  for (const spec of backendCopiedFiles()) {
    copyWithTransform(spec, targetDir);
  }

  writeGeneratedFile(targetDir, 'src/main.ts', renderMainTs());
  writeGeneratedFile(targetDir, 'src/app.module.ts', renderAppModuleTs());
  writeGeneratedFile(targetDir, 'src/collections/collections.module.ts', renderCollectionsModuleTs());
  writeGeneratedFile(targetDir, 'src/custom-endpoints/custom-endpoints.module.ts', renderCustomEndpointsModuleTs());
  writeGeneratedFile(targetDir, 'src/seed.ts', renderSeedTs(manifest));
  writeGeneratedFile(targetDir, 'src/seed/seed.module.ts', renderSeedModuleTs());
  writeGeneratedFile(targetDir, 'src/seed/seed.service.ts', renderSeedServiceTs());
  writeGeneratedFile(targetDir, 'src/actor-auth/actor.entity.ts', renderActorEntityTs());
  writeGeneratedFile(targetDir, 'src/actor-auth/actor-auth.module.ts', renderActorAuthModuleTs());
  writeGeneratedFile(targetDir, 'src/actor-auth/actor-jwt.strategy.ts', renderActorJwtStrategyTs());
  writeGeneratedFile(targetDir, 'src/actor-auth/actor-jwt-auth.guard.ts', renderActorJwtAuthGuardTs());
  writeGeneratedFile(targetDir, 'src/actor-auth/actor-auth.service.ts', renderActorAuthServiceTs());
  writeGeneratedFile(targetDir, 'src/actor-auth/actor-auth.controller.ts', renderActorAuthControllerTs());

  writeGeneratedFile(targetDir, 'package.json', renderPackageJson(packageName));
  writeGeneratedFile(targetDir, 'tsconfig.json', renderTsconfigJson());
  writeGeneratedFile(targetDir, 'tsconfig.build.json', renderTsconfigBuildJson());
  writeGeneratedFile(targetDir, 'nest-cli.json', renderNestCliJson());
  writeGeneratedFile(targetDir, '.env', renderEnv(config));
  writeGeneratedFile(targetDir, 'Dockerfile', renderBackendDockerfile());
}
