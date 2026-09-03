import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WhatsAppStatus } from './whatsapp-provider.interface';

/**
 * Push-based status updates avoid the frontend having to poll aggressively
 * while waiting for a QR scan. Each socket authenticates with the same
 * access token used for REST calls and joins a room scoped to their own
 * userId, so status pushes can never leak to another user.
 */
@Injectable()
@WebSocketGateway({ namespace: '/whatsapp', cors: { origin: process.env.APP_URL, credentials: true } })
export class WhatsAppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(WhatsAppGateway.name);

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('access_token='))
          ?.split('=')[1];
      if (!token) throw new Error('No token');
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET });
      client.join(`user:${payload.sub}`);
    } catch {
      this.logger.warn(`Unauthenticated WhatsApp socket connection rejected`);
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    // No per-user cleanup needed — room membership is dropped automatically.
  }

  emitStatus(userId: string, status: WhatsAppStatus) {
    this.server?.to(`user:${userId}`).emit('status', status);
  }
}
