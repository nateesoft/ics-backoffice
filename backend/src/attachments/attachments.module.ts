import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { IssueAttachment } from '../entities/attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([IssueAttachment]),
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const unique = randomUUID();
          const ext = extname(file.originalname);
          cb(null, `${unique}${ext}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}
