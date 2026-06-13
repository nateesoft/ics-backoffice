import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DocumentComment } from '../entities/document-comment.entity';
import { DocumentCommentReaction } from '../entities/document-comment-reaction.entity';
import { CreateDocumentCommentDto, UpdateDocumentCommentDto, ToggleDocReactionDto } from './document-comments.dto';

@Injectable()
export class DocumentCommentsService {
  constructor(
    @InjectRepository(DocumentComment) private repo: Repository<DocumentComment>,
    @InjectRepository(DocumentCommentReaction) private rxnRepo: Repository<DocumentCommentReaction>,
  ) {}

  async findByDocument(documentId: number) {
    const comments = await this.repo.find({ where: { documentId }, order: { createdAt: 'ASC' } });
    if (comments.length === 0) return [];
    const ids = comments.map(c => c.id);
    const reactions = await this.rxnRepo.find({ where: { commentId: In(ids) } });
    const rxnMap: Record<number, DocumentCommentReaction[]> = {};
    for (const r of reactions) {
      if (!rxnMap[r.commentId]) rxnMap[r.commentId] = [];
      rxnMap[r.commentId].push(r);
    }
    return comments.map(c => ({ ...c, reactions: rxnMap[c.id] || [] }));
  }

  async create(documentId: number, dto: CreateDocumentCommentDto, createdBy: string) {
    return this.repo.save({
      documentId,
      content: dto.content,
      createdBy,
      parentId: dto.parentId ?? null,
    });
  }

  async update(id: number, dto: UpdateDocumentCommentDto, username: string) {
    const comment = await this.repo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (comment.createdBy !== username) throw new ForbiddenException();
    comment.content = dto.content;
    return this.repo.save(comment);
  }

  async remove(id: number, username: string) {
    const comment = await this.repo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (comment.createdBy !== username) throw new ForbiddenException();
    const replies = await this.repo.find({ where: { parentId: id } });
    if (replies.length > 0) {
      const replyIds = replies.map(r => r.id);
      await this.rxnRepo.delete({ commentId: In(replyIds) });
      await this.repo.delete(replyIds);
    }
    await this.rxnRepo.delete({ commentId: id });
    await this.repo.delete(id);
  }

  async toggleReaction(commentId: number, dto: ToggleDocReactionDto, username: string) {
    const existing = await this.rxnRepo.findOne({
      where: { commentId, emoji: dto.emoji, createdBy: username },
    });
    if (existing) {
      await this.rxnRepo.delete(existing.id);
    } else {
      await this.rxnRepo.save({ commentId, emoji: dto.emoji, createdBy: username });
    }
    return this.rxnRepo.find({ where: { commentId } });
  }
}
