import { Controller, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { PushSubscriptionsService } from './push-subscriptions.service';
import { SubscribeDto } from './push-subscriptions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('push-subscriptions')
@UseGuards(JwtAuthGuard)
export class PushSubscriptionsController {
  constructor(private svc: PushSubscriptionsService) {}

  @Post('subscribe')
  subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    return this.svc.subscribe(req.user.username, dto);
  }

  @Delete('unsubscribe')
  unsubscribe(@Body() dto: { endpoint: string }) {
    return this.svc.unsubscribe(dto.endpoint);
  }
}
