import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import * as cookie from 'cookie';
import { DeployService } from './deploy.service';

// Same cookie-JWT auth pattern as chat.gateway.ts — this is the ICS Backoffice operator's own
// session (JwtAuthGuard's `token` cookie), unrelated to the sitemap Actor auth the Deploy feature
// generates for deployed apps.
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class DeployGateway implements OnGatewayConnection, OnModuleInit {
  @WebSocketServer() server!: Server;

  constructor(
    private deployService: DeployService,
    private jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.deployService.onLog = (deploymentId, line) => {
      this.server.to(`deployment_${deploymentId}`).emit('deploy_log', line);
    };
    this.deployService.onStatusChange = (deploymentId, status) => {
      this.server.to(`deployment_${deploymentId}`).emit('deploy_status', status);
    };
  }

  private isAuthenticated(socket: Socket): boolean {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies['token'];
      if (!token) return false;
      this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }

  handleConnection(socket: Socket) {
    if (!this.isAuthenticated(socket)) socket.disconnect();
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() socket: Socket, @MessageBody() body: { deploymentId: string }) {
    if (body?.deploymentId) socket.join(`deployment_${body.deploymentId}`);
  }
}
