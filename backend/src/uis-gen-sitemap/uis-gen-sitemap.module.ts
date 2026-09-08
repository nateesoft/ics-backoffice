import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UisGenSitemap } from '../entities/uis-gen-sitemap.entity';
import { UisGenSitemapController } from './uis-gen-sitemap.controller';
import { UisGenSitemapService } from './uis-gen-sitemap.service';
import { UisGenActorCredentialsModule } from '../uis-gen-actor-credentials/uis-gen-actor-credentials.module';

@Module({
  imports: [TypeOrmModule.forFeature([UisGenSitemap]), UisGenActorCredentialsModule],
  controllers: [UisGenSitemapController],
  providers: [UisGenSitemapService],
})
export class UisGenSitemapModule {}
