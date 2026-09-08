import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UisGenSitemap } from '../entities/uis-gen-sitemap.entity';
import { UisGenActorCredentialsService } from '../uis-gen-actor-credentials/uis-gen-actor-credentials.service';

export interface SitemapPayload {
  nodes: unknown[];
  edges: unknown[];
}

@Injectable()
export class UisGenSitemapService {
  constructor(
    @InjectRepository(UisGenSitemap) private repo: Repository<UisGenSitemap>,
    private actorCredentials: UisGenActorCredentialsService,
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

    // The whole graph was just blindly replaced — drop any actor-credential rows for actor nodes
    // that no longer exist in it, so deleting an Actor from the canvas doesn't leave orphaned
    // username/password rows behind.
    const currentActorNodeIds = (saved.nodes as { id: string; type: string }[])
      .filter(n => n?.type === 'actor')
      .map(n => n.id);
    await this.actorCredentials.pruneMissing(projectId, currentActorNodeIds);

    return { nodes: saved.nodes, edges: saved.edges };
  }
}
