import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, TaskStatus } from '../entities/issue.entity';
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';

@Injectable()
export class IssuesService {
  constructor(@InjectRepository(Issue) private repo: Repository<Issue>) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const issue = await this.repo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException(`Issue #${id} not found`);
    return issue;
  }

  create(dto: CreateIssueDto) {
    const issue = this.repo.create({ ...dto, taskStatus: dto.taskStatus || TaskStatus.NEW });
    return this.repo.save(issue);
  }

  async update(id: number, dto: UpdateIssueDto) {
    const issue = await this.findOne(id);
    Object.assign(issue, dto);
    return this.repo.save(issue);
  }

  async cancel(id: number) {
    const issue = await this.findOne(id);
    issue.isCancelled = true;
    return this.repo.save(issue);
  }

  async getStats() {
    const all = await this.repo.find();
    const statuses = Object.values(TaskStatus);
    const byStatus = statuses.map(s => ({
      status: s,
      count: all.filter(i => i.taskStatus === s && !i.isCancelled).length,
    }));
    const byPriority = ['Critical', 'High', 'Medium', 'Low'].map(p => ({
      priority: p,
      count: all.filter(i => i.priority === p && !i.isCancelled).length,
    }));
    return {
      total: all.length,
      active: all.filter(i => !i.isCancelled).length,
      cancelled: all.filter(i => i.isCancelled).length,
      byStatus,
      byPriority,
    };
  }
}
