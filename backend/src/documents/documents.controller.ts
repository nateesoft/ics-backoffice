import {
  Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe,
  UseGuards, UseInterceptors, UploadedFile, Req, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './documents.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDocumentDto, @Req() req: any) {
    return this.svc.create(dto, req.user.username);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDocumentDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.saveAttachment(id, file);
  }

  @Delete(':documentId/attachments/:id')
  removeAttachment(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeAttachment(id);
  }

  @Get(':documentId/attachments/:id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const att = await this.svc.findAttachment(id);
    const filePath = join(process.cwd(), 'uploads', att.storedName);
    res.download(filePath, att.originalName);
  }
}
