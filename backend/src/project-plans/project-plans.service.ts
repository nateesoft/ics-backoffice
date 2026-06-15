import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectPlan } from '../entities/project-plan.entity';
import { ProjectPhase } from '../entities/project-phase.entity';

@Injectable()
export class ProjectPlansService {
  constructor(
    @InjectRepository(ProjectPlan) private repo: Repository<ProjectPlan>,
    @InjectRepository(ProjectPhase) private phaseRepo: Repository<ProjectPhase>,
  ) {}

  getAll() {
    return this.repo.find({ order: { startDate: 'ASC' } });
  }

  create(data: { name: string; description?: string; startDate: string; endDate: string; color?: string }) {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<{ name: string; description: string; startDate: string; endDate: string; color: string }>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.repo.delete(id);
  }

  // Phases

  addPhase(projectId: number, data: { name: string; startDate: string; endDate: string; color?: string }) {
    return this.phaseRepo.save({ ...data, projectId });
  }

  async updatePhase(phaseId: number, data: Partial<{ name: string; startDate: string; endDate: string; color: string }>) {
    await this.phaseRepo.update(phaseId, data);
    return this.phaseRepo.findOne({ where: { id: phaseId } });
  }

  async removePhase(phaseId: number) {
    await this.phaseRepo.delete(phaseId);
  }
}
