import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { IssueComment } from '../entities/comment.entity';
import { CommentAttachment } from '../entities/comment-attachment.entity';
import { CommentReaction } from '../entities/comment-reaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([IssueComment, CommentAttachment, CommentReaction]), NotificationsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
