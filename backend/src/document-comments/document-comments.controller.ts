import {
  Controller, Get, Post, Put, Delete, Param, Body,
  ParseIntPipe, UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentCommentsService } from './document-comments.service';
import {
  CreateDocumentCommentDto, UpdateDocumentCommentDto, ToggleDocReactionDto,
} from './document-comments.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentCommentsController {
  constructor(private svc: DocumentCommentsService) {}

  @Get('documents/:documentId/comments')
  findAll(@Param('documentId', ParseIntPipe) documentId: number) {
    return this.svc.findByDocument(documentId);
  }

  @Post('documents/:documentId/comments')
  create(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() dto: CreateDocumentCommentDto,
    @Request() req: any,
  ) {
    return this.svc.create(documentId, dto, req.user.username);
  }

  @Put('document-comments/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentCommentDto,
    @Request() req: any,
  ) {
    return this.svc.update(id, dto, req.user.username);
  }

  @Delete('document-comments/:id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.svc.remove(id, req.user.username);
  }

  @Post('document-comments/:commentId/reactions')
  toggleReaction(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: ToggleDocReactionDto,
    @Request() req: any,
  ) {
    return this.svc.toggleReaction(commentId, dto, req.user.username);
  }
}
