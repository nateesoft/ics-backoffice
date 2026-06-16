import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { LineNotifyService } from './line-notify.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('line-notify')
export class LineNotifyController {
  constructor(private svc: LineNotifyService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: any,
    @Headers('x-line-signature') signature: string,
    @Body() body: any,
  ) {
    const rawBody: Buffer | undefined = req.rawBody;
    if (rawBody && !this.svc.verifySignature(rawBody, signature)) {
      return { ok: false };
    }
    await this.svc.handleWebhookEvents(body?.events ?? []);
    return { ok: true };
  }

  @Post('generate-token')
  @UseGuards(JwtAuthGuard)
  async generateToken(@Req() req: any) {
    const token = await this.svc.generateRegToken(req.user.id);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    return { token, expiresAt };
  }

  @Delete('unlink')
  @UseGuards(JwtAuthGuard)
  async unlink(@Req() req: any) {
    await this.svc.unlinkUser(req.user.id);
    return { ok: true };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async status(@Req() req: any) {
    return this.svc.getLineStatus(req.user.id);
  }
}
