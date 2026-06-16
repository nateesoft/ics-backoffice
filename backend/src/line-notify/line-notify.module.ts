import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineNotifyController } from './line-notify.controller';
import { LineNotifyService } from './line-notify.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [LineNotifyController],
  providers: [LineNotifyService],
  exports: [LineNotifyService],
})
export class LineNotifyModule {}
