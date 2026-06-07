import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Issue } from './issue.entity';

@Entity('issue_attachments')
export class IssueAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  issueId: number;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @Column()
  storedName: string;

  @Column()
  originalName: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @CreateDateColumn()
  createdAt: Date;
}
