import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('note_reactions')
export class NoteReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  noteId: number;

  @Column()
  emoji: string;

  @Column()
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
