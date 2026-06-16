import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { User } from '../entities/user.entity';

@Injectable()
export class LineNotifyService {
  private readonly logger = new Logger(LineNotifyService.name);
  private readonly channelAccessToken: string;
  private readonly channelSecret: string;

  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    this.channelAccessToken = this.config.get<string>('LINE_CHANNEL_ACCESS_TOKEN') ?? '';
    this.channelSecret = this.config.get<string>('LINE_CHANNEL_SECRET') ?? '';
  }

  verifySignature(rawBody: Buffer, signature: string): boolean {
    if (!this.channelSecret) return true;
    const expected = createHmac('sha256', this.channelSecret)
      .update(rawBody)
      .digest('base64');
    return expected === signature;
  }

  async sendPushMessage(lineUserId: string, text: string): Promise<void> {
    if (!this.channelAccessToken) {
      this.logger.warn('LINE_CHANNEL_ACCESS_TOKEN not set — skipping push');
      return;
    }
    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [{ type: 'text', text }],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`LINE push failed ${res.status}: ${body}`);
      }
    } catch (err) {
      this.logger.error('LINE push error', err);
    }
  }

  async replyMessage(replyToken: string, text: string): Promise<void> {
    if (!this.channelAccessToken) return;
    try {
      await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({
          replyToken,
          messages: [{ type: 'text', text }],
        }),
      });
    } catch (err) {
      this.logger.error('LINE reply error', err);
    }
  }

  async sendToUsername(username: string, message: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user?.lineUserId) return;
    await this.sendPushMessage(user.lineUserId, message);
  }

  async sendToUsernames(usernames: string[], message: string): Promise<void> {
    await Promise.allSettled(usernames.map(u => this.sendToUsername(u, message)));
  }

  async generateRegToken(userId: number): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 6; i++) token += chars[Math.floor(Math.random() * chars.length)];

    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepo.update(userId, { lineRegToken: token, lineRegTokenExpiry: expiry });
    return token;
  }

  async linkByToken(lineUserId: string, token: string, replyToken: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { lineRegToken: token } });
    if (!user) {
      await this.replyMessage(replyToken, '❌ รหัสไม่ถูกต้อง กรุณาสร้างรหัสใหม่ที่หน้า Profile ในระบบ');
      return;
    }
    if (!user.lineRegTokenExpiry || user.lineRegTokenExpiry < new Date()) {
      await this.replyMessage(replyToken, '⏰ รหัสหมดอายุแล้ว กรุณาสร้างรหัสใหม่ที่หน้า Profile ในระบบ');
      return;
    }
    await this.userRepo.update(user.id, {
      lineUserId,
      lineRegToken: null,
      lineRegTokenExpiry: null,
    });
    await this.replyMessage(replyToken, `✅ เชื่อมต่อบัญชี "${user.username}" สำเร็จ!\nคุณจะได้รับการแจ้งเตือน Issue จากนี้ไป`);
  }

  async unlinkUser(userId: number): Promise<void> {
    await this.userRepo.update(userId, { lineUserId: null, lineRegToken: null, lineRegTokenExpiry: null });
  }

  async getLineStatus(userId: number): Promise<{ linked: boolean; expiresAt: Date | null }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return {
      linked: !!user?.lineUserId,
      expiresAt: user?.lineRegTokenExpiry ?? null,
    };
  }

  async handleWebhookEvents(events: any[]): Promise<void> {
    for (const event of events) {
      if (event.type === 'follow') {
        await this.replyMessage(
          event.replyToken,
          'สวัสดีครับ! 🙏 ยินดีต้อนรับสู่ ICS Backoffice\n\nเพื่อเชื่อมต่อบัญชี:\n1. เข้าสู่ระบบที่เว็บ ICS Backoffice\n2. ไปที่หน้า Profile (ซ้ายล่างของ sidebar)\n3. กด "สร้างรหัส Register"\n4. ส่งรหัส 6 ตัวอักษรนั้นมาที่นี่\n\nเมื่อเชื่อมต่อแล้วคุณจะได้รับแจ้งเตือน Issue ผ่าน LINE ครับ',
        );
      } else if (event.type === 'message' && event.message?.type === 'text') {
        const text: string = event.message.text.trim().toUpperCase();
        if (/^[A-Z0-9]{6}$/.test(text)) {
          await this.linkByToken(event.source.userId, text, event.replyToken);
        }
      }
    }
  }
}
