import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { PushSubscriptionsService } from '../push-subscriptions/push-subscriptions.service';
import { LineNotifyService } from '../line-notify/line-notify.service';

const MENTION_RE = /data-mention="([^"]+)"/g;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private pushSvc: PushSubscriptionsService,
    private lineSvc: LineNotifyService,
  ) {}

  async createFromComment(
    content: string,
    issueId: number,
    commentId: number,
    senderUsername: string,
  ) {
    const mentioned = new Set<string>();
    let m: RegExpExecArray | null;
    MENTION_RE.lastIndex = 0;
    while ((m = MENTION_RE.exec(content)) !== null) mentioned.add(m[1]);
    if (mentioned.size === 0) return;

    let recipients: string[];
    if (mentioned.has('all')) {
      const users = await this.userRepo.find();
      recipients = users.map(u => u.username).filter(u => u !== senderUsername);
    } else {
      recipients = [...mentioned].filter(u => u !== senderUsername);
    }

    // Replace existing unread notifications for this comment (e.g. on edit)
    await this.repo.delete({ commentId, isRead: false });

    await this.repo.save(
      recipients.map(r => ({ recipientUsername: r, senderUsername, issueId, commentId, isRead: false })),
    );

    const lineMsg = `💬 @${senderUsername} mention คุณใน Issue #${issueId}\nดูที่: /ics-backoffice/issues?issue=${issueId}`;

    await Promise.allSettled(
      recipients.map(r =>
        Promise.all([
          this.pushSvc.sendToUser(r, {
            title: `@${senderUsername} mentioned you`,
            body: `Issue #${issueId} — tap to view`,
            url: `/ics-backoffice/issues?issue=${issueId}`,
          }),
          this.lineSvc.sendToUsername(r, lineMsg),
        ]),
      ),
    );
  }

  async notifyIssueAssign(
    issueId: number,
    projectName: string,
    recipient: string,
    assignedBy: string,
    role: 'developer' | 'tester',
  ) {
    if (recipient === assignedBy) return;

    await this.repo.save({ recipientUsername: recipient, senderUsername: assignedBy, issueId, isRead: false });

    const emoji = role === 'developer' ? '🔧' : '🧪';
    const roleLabel = role === 'developer' ? 'Developer' : 'Tester';

    await Promise.allSettled([
      this.pushSvc.sendToUser(recipient, {
        title: `${emoji} ได้รับมอบหมายเป็น ${roleLabel}`,
        body: `Issue #${issueId}: ${projectName}`,
        url: `/ics-backoffice/issues?issue=${issueId}`,
      }),
      this.lineSvc.sendToUsername(
        recipient,
        `${emoji} คุณได้รับมอบหมายเป็น ${roleLabel}\n📋 Issue #${issueId}: ${projectName}\n👤 มอบหมายโดย: ${assignedBy}`,
      ),
    ]);
  }

  async notifyIssueStatusChange(
    issueId: number,
    projectName: string,
    type: 'taskStatus' | 'deploymentStatus',
    oldStatus: string,
    newStatus: string,
    changedBy: string,
    recipients: string[],
  ) {
    const filtered = recipients.filter(r => r && r !== changedBy);
    if (filtered.length === 0) return;

    const emoji = type === 'deploymentStatus' ? '🚀' : '📋';
    const label = type === 'deploymentStatus' ? 'Deployment Status' : 'Task Status';
    const lineMsg = `${emoji} ${label} เปลี่ยนแปลง\n📋 Issue #${issueId}: ${projectName}\n${oldStatus} → ${newStatus}\n👤 โดย: ${changedBy}`;

    await Promise.allSettled(
      filtered.map(r =>
        Promise.all([
          this.pushSvc.sendToUser(r, {
            title: `${emoji} Issue #${issueId} ${label}`,
            body: `${oldStatus} → ${newStatus}`,
            url: `/ics-backoffice/issues?issue=${issueId}`,
          }),
          this.lineSvc.sendToUsername(r, lineMsg),
        ]),
      ),
    );
  }

  getUnread(username: string) {
    return this.repo.find({
      where: { recipientUsername: username, isRead: false },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAllRead(username: string) {
    await this.repo.update({ recipientUsername: username, isRead: false }, { isRead: true });
  }

  async markRead(id: number, username: string) {
    await this.repo.update({ id, recipientUsername: username }, { isRead: true });
  }
}
