import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './comments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('issues/:issueId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private svc: CommentsService) {}

  @Get()
  findAll(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.svc.findByIssue(issueId);
  }

  @Post()
  create(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.svc.create(issueId, dto, req.user.username);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @Req() req: any,
  ) {
    return this.svc.update(id, dto, req.user.username);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.remove(id, req.user.username);
  }
}
