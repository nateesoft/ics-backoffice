import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UisGenSitemap } from '../entities/uis-gen-sitemap.entity';
import { UisGenSitemapController } from './uis-gen-sitemap.controller';
import { UisGenSitemapService } from './uis-gen-sitemap.service';

@Module({
  imports: [TypeOrmModule.forFeature([UisGenSitemap])],
  controllers: [UisGenSitemapController],
  providers: [UisGenSitemapService],
})
export class UisGenSitemapModule {}
