import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { IssuesModule } from './issues/issues.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { DocumentsModule } from './documents/documents.module';
import { NotesModule } from './notes/notes.module';
import { CommentsModule } from './comments/comments.module';
import { CommentAttachmentsModule } from './comment-attachments/comment-attachments.module';
import { CommentReactionsModule } from './comment-reactions/comment-reactions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { DocumentFoldersModule } from './document-folders/document-folders.module';
import { PushSubscriptionsModule } from './push-subscriptions/push-subscriptions.module';
import { DocImagesModule } from './doc-images/doc-images.module';
import { DocumentCommentsModule } from './document-comments/document-comments.module';
import { ProjectPlansModule } from './project-plans/project-plans.module';
import { ProjectPlan } from './entities/project-plan.entity';
import { ProjectPhase } from './entities/project-phase.entity';
import { DocumentComment } from './entities/document-comment.entity';
import { DocumentCommentReaction } from './entities/document-comment-reaction.entity';
import { DocumentFolder } from './entities/document-folder.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { User } from './entities/user.entity';
import { Issue } from './entities/issue.entity';
import { IssueAttachment } from './entities/attachment.entity';
import { Document } from './entities/document.entity';
import { DocumentAttachment } from './entities/document-attachment.entity';
import { Note } from './entities/note.entity';
import { IssueComment } from './entities/comment.entity';
import { CommentAttachment } from './entities/comment-attachment.entity';
import { IssueHistory } from './entities/issue-history.entity';
import { Notification } from './entities/notification.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CommentReaction } from './entities/comment-reaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [User, Issue, IssueAttachment, Document, DocumentAttachment, DocumentFolder, Note, IssueComment, CommentAttachment, CommentReaction, IssueHistory, Notification, ChatMessage, PushSubscription, DocumentComment, DocumentCommentReaction, ProjectPlan, ProjectPhase],
        synchronize: true,
        timezone: '+07:00',
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    IssuesModule,
    AttachmentsModule,
    DocumentsModule,
    NotesModule,
    CommentsModule,
    CommentAttachmentsModule,
    CommentReactionsModule,
    NotificationsModule,
    ChatModule,
    DocumentFoldersModule,
    PushSubscriptionsModule,
    DocImagesModule,
    DocumentCommentsModule,
    ProjectPlansModule,
  ],
})
export class AppModule {}
