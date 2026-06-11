import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('comment_reactions')
@Unique(['commentId', 'createdBy', 'emoji'])
export class CommentReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  commentId: number;

  @Column()
  emoji: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
