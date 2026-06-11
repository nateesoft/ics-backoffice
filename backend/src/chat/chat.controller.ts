import { Controller, Get, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversation/:otherUserId')
  getConversation(
    @Req() req: Request & { user: any },
    @Param('otherUserId', ParseIntPipe) otherUserId: number,
  ) {
    return this.chatService.getConversation(req.user.id, otherUserId);
  }

  @Get('unread')
  getUnread(@Req() req: Request & { user: any }) {
    return this.chatService.getUnreadCounts(req.user.id);
  }
}
