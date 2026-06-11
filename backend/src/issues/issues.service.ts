import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, TaskStatus } from '../entities/issue.entity';
import { IssueHistory } from '../entities/issue-history.entity';
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';

const TRACKED_FIELDS: Record<string, string> = {
  projectName: 'Project Name',
  codeType: 'Code Type',
  priority: 'Priority',
  taskStatus: 'Task Status',
  deploymentStatus: 'Deployment Status',
  developer: 'Developer',
  tester: 'Tester',
  issuer: 'Issuer',
  targetDate: 'Target Date',
  taskWorkPeriod: 'Work Period',
  taskWorkPeriodUnit: 'Work Period Unit',
  githubLink: 'Github Link',
  anydesk: 'Anydesk',
  teamViewer: 'TeamViewer',
  contractDetail: 'Contract Detail',
  tags: 'Tags',
  visibility: 'Visibility',
};

function toStr(val: any): string {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue) private repo: Repository<Issue>,
    @InjectRepository(IssueHistory) private historyRepo: Repository<IssueHistory>,
  ) {}

  findAll(username: string) {
    return this.repo.createQueryBuilder('issue')
      .where('(issue.visibility = :all OR issue.visibility IS NULL OR issue.createdBy = :username)', { all: 'all', username })
      .orderBy('issue.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number) {
    const issue = await this.repo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException(`Issue #${id} not found`);
    return issue;
  }

  create(dto: CreateIssueDto, createdBy: string) {
    const issue = this.repo.create({ ...dto, taskStatus: dto.taskStatus || TaskStatus.NEW, createdBy });
    return this.repo.save(issue);
  }

  async update(id: number, dto: UpdateIssueDto, changedBy: string) {
    const issue = await this.findOne(id);

    const historyRecords: Partial<IssueHistory>[] = [];
    for (const field of Object.keys(TRACKED_FIELDS)) {
      const oldVal = toStr((issue as any)[field]);
      const newVal = toStr((dto as any)[field]);
      if (oldVal !== newVal) {
        historyRecords.push({
          issueId: id,
          changedBy,
          fieldName: TRACKED_FIELDS[field],
          oldValue: oldVal || null,
          newValue: newVal || null,
        });
      }
    }

    Object.assign(issue, dto);
    await this.repo.save(issue);

    if (historyRecords.length > 0) {
      await this.historyRepo.save(historyRecords);
    }

    return issue;
  }

  async cancel(id: number, changedBy: string) {
    const issue = await this.findOne(id);
    issue.isCancelled = true;
    await this.repo.save(issue);
    await this.historyRepo.save({
      issueId: id,
      changedBy,
      fieldName: 'Status',
      oldValue: 'Active',
      newValue: 'Cancelled',
    });
    return issue;
  }

  async restore(id: number, changedBy: string) {
    const issue = await this.findOne(id);
    issue.isCancelled = false;
    await this.repo.save(issue);
    await this.historyRepo.save({
      issueId: id,
      changedBy,
      fieldName: 'Status',
      oldValue: 'Cancelled',
      newValue: 'Active',
    });
    return issue;
  }

  findHistory(issueId: number) {
    return this.historyRepo.find({
      where: { issueId },
      order: { createdAt: 'DESC' },
    });
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
