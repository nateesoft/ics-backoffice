import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UisGenProject } from '../entities/uis-gen-project.entity';
import { CreateUisGenProjectDto, UpdateUisGenProjectDto } from './uis-gen-projects.dto';

@Injectable()
export class UisGenProjectsService {
  constructor(
    @InjectRepository(UisGenProject) private repo: Repository<UisGenProject>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException();
    return project;
  }

  create(dto: CreateUisGenProjectDto) {
    return this.repo.save({ ...dto, sitemapGenerated: false });
  }

  async update(id: string, dto: UpdateUisGenProjectDto) {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.repo.save(project);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
