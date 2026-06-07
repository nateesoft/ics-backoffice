import {
  Controller, Get, Post, Delete, Param, ParseIntPipe,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('issues/:issueId/attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private svc: AttachmentsService) {}

  @Get()
  findAll(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.svc.findByIssue(issueId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('issueId', ParseIntPipe) issueId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.save(issueId, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
