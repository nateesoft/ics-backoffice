import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentReaction } from '../entities/comment-reaction.entity';
import { ToggleReactionDto } from './comment-reactions.dto';

@Injectable()
export class CommentReactionsService {
  constructor(
    @InjectRepository(CommentReaction) private repo: Repository<CommentReaction>,
  ) {}

  async toggle(commentId: number, dto: ToggleReactionDto, username: string) {
    const existing = await this.repo.findOne({
      where: { commentId, emoji: dto.emoji, createdBy: username },
    });
    if (existing) {
      await this.repo.delete(existing.id);
    } else {
      await this.repo.save({ commentId, emoji: dto.emoji, createdBy: username });
    }
    return this.repo.find({ where: { commentId } });
  }
}
