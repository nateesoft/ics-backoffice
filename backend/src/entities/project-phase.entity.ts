import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectPlan } from './project-plan.entity';

@Entity('project_phases')
export class ProjectPhase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => ProjectPlan, plan => plan.phases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: ProjectPlan;

  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', default: '#3b82f6' })
  color: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
