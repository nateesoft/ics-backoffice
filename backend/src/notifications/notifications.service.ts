import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';

const MENTION_RE = /data-mention="([^"]+)"/g;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
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
