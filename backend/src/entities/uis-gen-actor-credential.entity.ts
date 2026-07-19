import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UisGenProject } from './uis-gen-project.entity';

// Kept in its own table rather than inside UisGenSitemap.nodes (jsonb) — that blob is blindly
// whole-graph-replaced on every canvas autosave (see UisGenSitemapService.save), which is fine for
// design data but not somewhere a password hash should be able to get silently clobbered or casually
// exported alongside. `actorNodeId` is the xyflow node id from the sitemap graph, not a DB FK — actor
// nodes themselves live in the sitemap's jsonb, not a normalized table.
@Entity('uis_gen_actor_credentials')
@Index(['projectId', 'actorNodeId'], { unique: true })
export class UisGenActorCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => UisGenProject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: UisGenProject;

  @Column()
  actorNodeId: string;

  @Column()
  username: string;

  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
