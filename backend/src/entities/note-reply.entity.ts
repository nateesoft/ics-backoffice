import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('note_replies')
export class NoteReply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  noteId: number;

  @Column({ type: 'text' })
  content: string;

  @Column()
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
