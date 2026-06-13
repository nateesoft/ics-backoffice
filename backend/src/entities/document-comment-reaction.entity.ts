import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('document_comment_reactions')
@Unique(['commentId', 'createdBy', 'emoji'])
export class DocumentCommentReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  commentId: number;

  @Column()
  emoji: string;

  @Column()
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
