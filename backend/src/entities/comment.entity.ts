import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('issue_comments')
export class IssueComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  issueId: number;

  @Column({ type: 'int', nullable: true, default: null })
  parentId: number | null;

  @Column({ type: 'text' })
  content: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
