import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { IssueComment } from '../entities/comment.entity';
import { CommentAttachment } from '../entities/comment-attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IssueComment, CommentAttachment])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
