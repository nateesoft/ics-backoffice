import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DocumentAttachment } from './document-attachment.entity';

export type DocumentCategory = 'Database' | 'API Endpoint' | 'Service' | 'Infrastructure' | 'Security' | 'Other';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'varchar', default: 'Other' })
  category: DocumentCategory;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ default: 'general' })
  docType: string;

  @Column({ type: 'int', nullable: true })
  folderId: number | null;

  @Column()
  createdBy: string;

  @OneToMany(() => DocumentAttachment, att => att.document, { cascade: true, eager: true })
  attachments: DocumentAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
