import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('document_comments')
export class DocumentComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  documentId: number;

  @Column({ type: 'int', nullable: true, default: null })
  parentId: number | null;

  @Column({ type: 'text' })
  content: string;

  @Column()
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
