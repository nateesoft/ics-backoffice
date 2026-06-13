import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscription } from '../entities/push-subscription.entity';
import { SubscribeDto } from './push-subscriptions.dto';

@Injectable()
export class PushSubscriptionsService implements OnModuleInit {
  constructor(
    @InjectRepository(PushSubscription) private repo: Repository<PushSubscription>,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    webpush.setVapidDetails(
      'mailto:admin@ics-backoffice.local',
      this.config.get<string>('VAPID_PUBLIC_KEY')!,
      this.config.get<string>('VAPID_PRIVATE_KEY')!,
    );
  }

  async subscribe(username: string, dto: SubscribeDto) {
    await this.repo.upsert(
      { username, endpoint: dto.endpoint, p256dh: dto.p256dh, auth: dto.auth },
      { conflictPaths: ['endpoint'] },
    );
    return { ok: true };
  }

  async unsubscribe(endpoint: string) {
    await this.repo.delete({ endpoint });
    return { ok: true };
  }

  async sendToUser(username: string, payload: object) {
    const subs = await this.repo.find({ where: { username } });
    if (subs.length === 0) return;
    await Promise.allSettled(
      subs.map(sub =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          )
          .catch(async (err: any) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await this.repo.delete({ endpoint: sub.endpoint });
            }
          }),
      ),
    );
  }
}
