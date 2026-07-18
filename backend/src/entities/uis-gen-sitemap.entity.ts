import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { UisGenProject } from './uis-gen-project.entity';

// Keyed directly by projectId (1:1, not a separate id) — matches the get-by-project/save-whole-
// state access pattern the frontend already uses (see lib/uisGenSitemapStore.ts, being replaced
// by this table). `nodes`/`edges` are stored as opaque jsonb: each node's `data` shape varies by
// node type (actor/page/content/modal/alert) and nests arbitrary JsonSchema7/uiSchema trees, so
// normalizing them into columns isn't worth it — same trade-off the frontend types already made.
@Entity('uis_gen_sitemaps')
export class UisGenSitemap {
  @PrimaryColumn('uuid')
  projectId: string;

  @OneToOne(() => UisGenProject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: UisGenProject;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  nodes: unknown[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  edges: unknown[];

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
