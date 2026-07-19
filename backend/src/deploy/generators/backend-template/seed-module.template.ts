export function renderSeedModuleTs(): string {
  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../collections/entities/collection.entity';
import { RecordEntity } from '../collections/entities/record.entity';
import { CustomEndpoint } from '../custom-endpoints/entities/custom-endpoint.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, RecordEntity, CustomEndpoint])],
  providers: [SeedService],
})
export class SeedModule {}
`;
}

export function renderSeedServiceTs(): string {
  return `import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from '../collections/entities/collection.entity';
import { RecordEntity } from '../collections/entities/record.entity';
import { CustomEndpoint } from '../custom-endpoints/entities/custom-endpoint.entity';
import { SEED } from '../seed';

// Idempotent one-time seed, same OnModuleInit precedent as the main app's own
// AuthService (which auto-seeds a default admin/admin user) — since each deployment gets a fresh,
// dedicated Postgres container, "collections table empty" always holds on first boot; a later
// restart against the same volume is a no-op.
@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Collection) private collectionsRepo: Repository<Collection>,
    @InjectRepository(RecordEntity) private recordsRepo: Repository<RecordEntity>,
    @InjectRepository(CustomEndpoint) private endpointsRepo: Repository<CustomEndpoint>,
  ) {}

  async onModuleInit() {
    const existing = await this.collectionsRepo.count();
    if (existing > 0) return;

    for (const c of SEED.collections) {
      await this.collectionsRepo.save({ id: c.id, name: c.name, slug: c.slug, fields: [...c.fields], published: true });
    }
    for (const r of SEED.records) {
      await this.recordsRepo.save({ id: r.id, collectionId: r.collectionId, data: { ...r.data } });
    }
    for (const e of SEED.customEndpoints) {
      await this.endpointsRepo.save({
        id: e.id, name: e.name, method: e.method, path: e.path, action: e.action, collectionId: e.collectionId,
        inputMapping: [...e.inputMapping], transformSteps: [...e.transformSteps], responseMapping: [...e.responseMapping],
        validatePasswordMode: e.validatePasswordMode, authType: e.authType, authUsername: e.authUsername,
        authSecretHash: e.authSecretHash,
      });
    }
  }
}
`;
}
