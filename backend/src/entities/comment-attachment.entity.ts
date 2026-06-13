import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('comment_attachments')
export class CommentAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  commentId: number;

  @Column()
  storedName: string;

  @Column()
  originalName: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
