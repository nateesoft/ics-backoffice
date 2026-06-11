import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recipientUsername: string;

  @Column()
  senderUsername: string;

  @Column({ type: 'int' })
  issueId: number;

  @Column({ type: 'int' })
  commentId: number;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
