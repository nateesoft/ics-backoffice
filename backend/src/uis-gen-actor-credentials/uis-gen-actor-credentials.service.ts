import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UisGenActorCredential } from '../entities/uis-gen-actor-credential.entity';

export interface ActorCredentialSummary {
  actorNodeId: string;
  username: string;
  hasPassword: boolean;
}

@Injectable()
export class UisGenActorCredentialsService {
  constructor(
    @InjectRepository(UisGenActorCredential) private repo: Repository<UisGenActorCredential>,
  ) {}

  async listForProject(projectId: string): Promise<ActorCredentialSummary[]> {
    const rows = await this.repo.find({ where: { projectId } });
    return rows.map(r => ({ actorNodeId: r.actorNodeId, username: r.username, hasPassword: true }));
  }

  async upsert(projectId: string, actorNodeId: string, username: string, password?: string): Promise<ActorCredentialSummary> {
    const existing = await this.repo.findOne({ where: { projectId, actorNodeId } });
    const row = existing ?? this.repo.create({ projectId, actorNodeId });
    row.username = username;
    if (password) {
      row.passwordHash = await bcrypt.hash(password, 10);
    } else if (!existing) {
      // Creating a fresh credential without a password isn't meaningful — require one the first time.
      throw new Error('Password is required when setting credentials for an actor for the first time');
    }
    const saved = await this.repo.save(row);
    return { actorNodeId: saved.actorNodeId, username: saved.username, hasPassword: true };
  }

  async remove(projectId: string, actorNodeId: string): Promise<void> {
    await this.repo.delete({ projectId, actorNodeId });
  }

  // Called after a sitemap save (which blindly replaces the whole graph) to drop credential rows
  // for actor nodes that no longer exist in the canvas — prevents orphaned rows accumulating.
  async pruneMissing(projectId: string, currentActorNodeIds: string[]): Promise<void> {
    if (currentActorNodeIds.length === 0) {
      await this.repo.delete({ projectId });
      return;
    }
    await this.repo.delete({ projectId, actorNodeId: Not(In(currentActorNodeIds)) });
  }
}
