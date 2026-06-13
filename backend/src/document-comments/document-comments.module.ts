import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentCommentsController } from './document-comments.controller';
import { DocumentCommentsService } from './document-comments.service';
import { DocumentComment } from '../entities/document-comment.entity';
import { DocumentCommentReaction } from '../entities/document-comment-reaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentComment, DocumentCommentReaction])],
  controllers: [DocumentCommentsController],
  providers: [DocumentCommentsService],
})
export class DocumentCommentsModule {}
