import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UisGenProject } from '../entities/uis-gen-project.entity';
import { UisGenProjectsController } from './uis-gen-projects.controller';
import { UisGenProjectsService } from './uis-gen-projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([UisGenProject])],
  controllers: [UisGenProjectsController],
  providers: [UisGenProjectsService],
})
export class UisGenProjectsModule {}
