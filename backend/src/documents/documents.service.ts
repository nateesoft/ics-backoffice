import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Document, DocumentCategory } from '../entities/document.entity';
import { DocumentAttachment } from '../entities/document-attachment.entity';
import { CreateDocumentDto, UpdateDocumentDto } from './documents.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private docRepo: Repository<Document>,
    @InjectRepository(DocumentAttachment) private attRepo: Repository<DocumentAttachment>,
  ) {}

  findAll() {
    return this.docRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException();
    return doc;
  }

  create(dto: CreateDocumentDto, createdBy: string) {
    return this.docRepo.save({
      title: dto.title,
      category: dto.category as DocumentCategory,
      content: dto.content,
      docType: dto.docType ?? 'general',
      folderId: dto.folderId ?? null,
      createdBy,
    });
  }

  async update(id: number, dto: UpdateDocumentDto) {
    const doc = await this.findOne(id);
    Object.assign(doc, dto);
    return this.docRepo.save(doc);
  }

  async remove(id: number) {
    const doc = await this.findOne(id);
    // Delete all attached files from disk
    for (const att of doc.attachments ?? []) {
      await unlink(join(process.cwd(), 'uploads', att.storedName)).catch(() => null);
    }
    await this.docRepo.delete(id);
  }

  saveAttachment(documentId: number, file: Express.Multer.File) {
    return this.attRepo.save({
      documentId,
      storedName: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  async removeAttachment(id: number) {
    const att = await this.attRepo.findOne({ where: { id } });
    if (!att) throw new NotFoundException();
    await unlink(join(process.cwd(), 'uploads', att.storedName)).catch(() => null);
    await this.attRepo.delete(id);
  }

  async findAttachment(id: number) {
    const att = await this.attRepo.findOne({ where: { id } });
    if (!att) throw new NotFoundException();
    return att;
  }
}
