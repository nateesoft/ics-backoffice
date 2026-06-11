import { Controller, Post, Param, Body, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { CommentReactionsService } from './comment-reactions.service';
import { ToggleReactionDto } from './comment-reactions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('comments/:commentId/reactions')
export class CommentReactionsController {
  constructor(private svc: CommentReactionsService) {}

  @Post()
  toggle(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: ToggleReactionDto,
    @Request() req: any,
  ) {
    return this.svc.toggle(commentId, dto, req.user.username);
  }
}
