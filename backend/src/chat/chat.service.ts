import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or, Equal } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
  ) {}

  async saveMessage(senderId: number, senderUsername: string, receiverId: number, content: string) {
    const msg = this.chatRepo.create({ senderId, senderUsername, receiverId, content });
    return this.chatRepo.save(msg);
  }

  async getConversation(userId: number, otherUserId: number) {
    return this.chatRepo.find({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  async markAsRead(receiverId: number, senderId: number) {
    await this.chatRepo.update(
      { receiverId, senderId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCounts(userId: number): Promise<Record<number, number>> {
    const rows = await this.chatRepo
      .createQueryBuilder('m')
      .select('m.senderId', 'senderId')
      .addSelect('COUNT(*)', 'count')
      .where('m.receiverId = :userId AND m.isRead = false', { userId })
      .groupBy('m.senderId')
      .getRawMany();

    return Object.fromEntries(rows.map(r => [Number(r.senderId), Number(r.count)]));
  }
}
