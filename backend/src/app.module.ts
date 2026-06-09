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
import { User } from './entities/user.entity';
import { Issue } from './entities/issue.entity';
import { IssueAttachment } from './entities/attachment.entity';
import { Document } from './entities/document.entity';
import { DocumentAttachment } from './entities/document-attachment.entity';
import { Note } from './entities/note.entity';
import { IssueComment } from './entities/comment.entity';
import { CommentAttachment } from './entities/comment-attachment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [User, Issue, IssueAttachment, Document, DocumentAttachment, Note, IssueComment, CommentAttachment],
        synchronize: true,
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
  ],
})
export class AppModule {}
