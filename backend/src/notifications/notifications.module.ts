import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { PushSubscriptionsModule } from '../push-subscriptions/push-subscriptions.module';
import { LineNotifyModule } from '../line-notify/line-notify.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User]), PushSubscriptionsModule, LineNotifyModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
