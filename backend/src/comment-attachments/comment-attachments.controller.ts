import { Controller, Post, Delete, Param, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommentAttachmentsService } from './comment-attachments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments/:commentId/attachments')
@UseGuards(JwtAuthGuard)
export class CommentAttachmentsController {
  constructor(private svc: CommentAttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('commentId', ParseIntPipe) commentId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.save(commentId, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
