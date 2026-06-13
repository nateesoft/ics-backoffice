import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('issue_history')
export class IssueHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  issueId: number;

  @Column()
  changedBy: string;

  @Column()
  fieldName: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
