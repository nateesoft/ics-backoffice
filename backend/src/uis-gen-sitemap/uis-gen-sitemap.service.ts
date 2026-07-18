import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UisGenSitemap } from '../entities/uis-gen-sitemap.entity';

export interface SitemapPayload {
  nodes: unknown[];
  edges: unknown[];
}

@Injectable()
export class UisGenSitemapService {
  constructor(
    @InjectRepository(UisGenSitemap) private repo: Repository<UisGenSitemap>,
  ) {}

  async findByProjectId(projectId: string): Promise<SitemapPayload> {
    const row = await this.repo.findOne({ where: { projectId } });
    return { nodes: row?.nodes ?? [], edges: row?.edges ?? [] };
  }

  async save(projectId: string, body: SitemapPayload) {
    const existing = await this.repo.findOne({ where: { projectId } });
    const row = existing ?? this.repo.create({ projectId });
    row.nodes = body.nodes ?? [];
    row.edges = body.edges ?? [];
    const saved = await this.repo.save(row);
    return { nodes: saved.nodes, edges: saved.edges };
  }
}
