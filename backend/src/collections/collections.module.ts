import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsController } from './collections.controller';
import { PublicApiController } from './public-api.controller';
import { CollectionsService } from './collections.service';
import { Collection } from './entities/collection.entity';
import { RecordEntity } from './entities/record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, RecordEntity])],
  controllers: [CollectionsController, PublicApiController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
