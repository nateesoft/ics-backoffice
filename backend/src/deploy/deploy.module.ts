import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UisGenDeployment } from '../entities/uis-gen-deployment.entity';
import { UisGenProject } from '../entities/uis-gen-project.entity';
import { UisGenSitemap } from '../entities/uis-gen-sitemap.entity';
import { UisGenActorCredential } from '../entities/uis-gen-actor-credential.entity';
import { Collection } from '../collections/entities/collection.entity';
import { RecordEntity } from '../collections/entities/record.entity';
import { CustomEndpoint } from '../custom-endpoints/entities/custom-endpoint.entity';
import { ManifestService } from './manifest/manifest.service';
import { PortAllocatorService } from './ports/port-allocator.service';
import { DockerRunnerService } from './docker/docker-runner.service';
import { DeployService } from './deploy.service';
import { DeployController } from './deploy.controller';
import { DeployGateway } from './deploy.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UisGenDeployment, UisGenProject, UisGenSitemap, UisGenActorCredential,
      Collection, RecordEntity, CustomEndpoint,
    ]),
    // Own JwtModule registration (not relying on a global one) — same pattern as ChatModule,
    // needed for DeployGateway to verify the ICS Backoffice operator's own session cookie.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({ secret: config.get('JWT_SECRET') }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DeployController],
  providers: [ManifestService, PortAllocatorService, DockerRunnerService, DeployService, DeployGateway],
  exports: [ManifestService, PortAllocatorService, DockerRunnerService, DeployService],
})
export class DeployModule {}
