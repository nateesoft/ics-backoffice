import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { IsArray, IsNumber } from 'class-validator';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto, ToggleReactionDto, CreateReplyDto } from './notes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class ReorderDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private svc: NotesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: CreateNoteDto, @Req() req: any) {
    return this.svc.create(dto, req.user.username);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNoteDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.svc.reorder(dto.ids);
  }

  // ─── Reactions ───────────────────────────────────────────────────────────
  @Post(':id/reactions/toggle')
  toggleReaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleReactionDto,
    @Req() req: any,
  ) {
    return this.svc.toggleReaction(id, dto.emoji, req.user.username);
  }

  // ─── Replies ─────────────────────────────────────────────────────────────
  @Get(':id/replies')
  getReplies(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getReplies(id);
  }

  @Post(':id/replies')
  addReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReplyDto,
    @Req() req: any,
  ) {
    return this.svc.addReply(id, dto, req.user.username);
  }

  @Delete(':id/replies/:replyId')
  deleteReply(
    @Param('id', ParseIntPipe) id: number,
    @Param('replyId', ParseIntPipe) replyId: number,
    @Req() req: any,
  ) {
    return this.svc.deleteReply(id, replyId, req.user.username);
  }
}
