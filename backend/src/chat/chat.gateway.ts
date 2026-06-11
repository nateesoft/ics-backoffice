import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import * as cookie from 'cookie';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  private getUserFromSocket(socket: Socket): { sub: number; username: string } | null {
    try {
      const raw = socket.handshake.headers.cookie || '';
      const cookies = cookie.parse(raw);
      const token = cookies['token'];
      if (!token) return null;
      return this.jwtService.verify(token) as { sub: number; username: string };
    } catch {
      return null;
    }
  }

  handleConnection(socket: Socket) {
    const payload = this.getUserFromSocket(socket);
    if (!payload) { socket.disconnect(); return; }
    socket.join(`user_${payload.sub}`);
    socket.data.userId = payload.sub;
    socket.data.username = payload.username;
  }

  handleDisconnect(_socket: Socket) {}

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { toUserId: number; content: string },
  ) {
    const { userId, username } = socket.data;
    if (!userId || !body.content?.trim()) return;

    const msg = await this.chatService.saveMessage(userId, username, body.toUserId, body.content.trim());

    const payload = {
      id: msg.id,
      senderId: userId,
      senderUsername: username,
      receiverId: body.toUserId,
      content: msg.content,
      createdAt: msg.createdAt,
      isRead: false,
    };

    this.server.to(`user_${userId}`).emit('new_message', payload);
    this.server.to(`user_${body.toUserId}`).emit('new_message', payload);
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { fromUserId: number },
  ) {
    const { userId } = socket.data;
    if (!userId) return;
    await this.chatService.markAsRead(userId, body.fromUserId);
    socket.emit('marked_read', { fromUserId: body.fromUserId });
  }
}
