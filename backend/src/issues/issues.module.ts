import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Issue } from '../entities/issue.entity';
import { IssueHistory } from '../entities/issue-history.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Issue, IssueHistory]), NotificationsModule],
  controllers: [IssuesController],
  providers: [IssuesService],
})
export class IssuesModule {}
