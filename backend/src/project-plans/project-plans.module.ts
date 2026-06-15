import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectPlan } from '../entities/project-plan.entity';
import { ProjectPhase } from '../entities/project-phase.entity';
import { ProjectPlansService } from './project-plans.service';
import { ProjectPlansController } from './project-plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectPlan, ProjectPhase])],
  providers: [ProjectPlansService],
  controllers: [ProjectPlansController],
})
export class ProjectPlansModule {}
