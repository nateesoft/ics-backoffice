import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IssueComment } from '../entities/comment.entity';
import { CommentAttachment } from '../entities/comment-attachment.entity';
import { CreateCommentDto, UpdateCommentDto } from './comments.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(IssueComment) private repo: Repository<IssueComment>,
    @InjectRepository(CommentAttachment) private attRepo: Repository<CommentAttachment>,
    private notifSvc: NotificationsService,
  ) {}

  async findByIssue(issueId: number) {
    const comments = await this.repo.find({ where: { issueId }, order: { createdAt: 'ASC' } });
    if (comments.length === 0) return [];
    const attachments = await this.attRepo.find({
      where: { commentId: In(comments.map(c => c.id)) },
      order: { createdAt: 'ASC' },
    });
    const attMap: Record<number, CommentAttachment[]> = {};
    for (const a of attachments) {
      if (!attMap[a.commentId]) attMap[a.commentId] = [];
      attMap[a.commentId].push(a);
    }
    return comments.map(c => ({ ...c, attachments: attMap[c.id] || [] }));
  }

  async create(issueId: number, dto: CreateCommentDto, createdBy: string) {
    const comment = await this.repo.save({ issueId, content: dto.content, createdBy });
    await this.notifSvc.createFromComment(dto.content, issueId, comment.id, createdBy);
    return comment;
  }

  async update(id: number, dto: UpdateCommentDto, username: string) {
    const comment = await this.repo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (comment.createdBy !== username) throw new ForbiddenException();
    comment.content = dto.content!;
    const saved = await this.repo.save(comment);
    await this.notifSvc.createFromComment(dto.content!, comment.issueId, id, username);
    return saved;
  }

  async remove(id: number, username: string) {
    const comment = await this.repo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (comment.createdBy !== username) throw new ForbiddenException();
    await this.attRepo.delete({ commentId: id });
    await this.repo.delete(id);
  }
}
