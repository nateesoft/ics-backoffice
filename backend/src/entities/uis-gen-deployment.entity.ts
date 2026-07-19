import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UisGenProject } from './uis-gen-project.entity';

export type UisGenDeploymentStatus =
  'pending' | 'generating' | 'building' | 'starting' | 'running' | 'failed' | 'stopped';

// One row per deploy attempt (not 1:1 with UisGenProject) — a project can be redeployed, and each
// attempt keeps its own manifest snapshot/ports/status for history and troubleshooting.
@Entity('uis_gen_deployments')
export class UisGenDeployment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => UisGenProject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: UisGenProject;

  @Column({ default: 'pending' })
  status: UisGenDeploymentStatus;

  // Full DeployManifest produced by ManifestService — persisted so the generators, and any later
  // audit/redeploy, never need to re-derive it from a possibly-since-changed project/sitemap.
  @Column({ type: 'jsonb', nullable: true })
  manifestSnapshot: Record<string, unknown> | null;

  // Used as the generated project's directory name and `docker compose -p` project name.
  @Column({ unique: true })
  slug: string;

  @Column({ type: 'int', nullable: true })
  frontendPort: number | null;

  @Column({ type: 'int', nullable: true })
  backendPort: number | null;

  // Database name inside the deployment's own dedicated Postgres container.
  @Column({ type: 'varchar', nullable: true })
  dbName: string | null;

  @Column({ type: 'varchar', nullable: true })
  composeProjectName: string | null;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deployedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
