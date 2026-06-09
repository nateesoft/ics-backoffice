import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { CommentAttachment } from '../entities/comment-attachment.entity';

@Injectable()
export class CommentAttachmentsService {
  constructor(@InjectRepository(CommentAttachment) private repo: Repository<CommentAttachment>) {}

  save(commentId: number, file: Express.Multer.File) {
    return this.repo.save({
      commentId,
      storedName: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  async remove(id: number) {
    const att = await this.repo.findOne({ where: { id } });
    if (!att) throw new NotFoundException();
    const filePath = join(process.cwd(), 'uploads', att.storedName);
    await unlink(filePath).catch(() => null);
    await this.repo.delete(id);
  }
}
