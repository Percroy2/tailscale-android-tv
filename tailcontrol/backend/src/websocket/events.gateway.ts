import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import type { TvAccessPayload } from '../auth/token.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';

@WebSocketGateway({
  cors: { origin: true },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwt.verifyAsync<TvAccessPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'tv_access') {
        client.disconnect(true);
        return;
      }

      const device = await this.prisma.tvDevice.findUnique({
        where: { id: payload.tvDeviceId },
        select: { revokedAt: true },
      });

      if (!device || device.revokedAt) {
        client.emit('session_revoked', { at: new Date().toISOString() });
        client.disconnect(true);
        return;
      }

      client.data.tvAuth = payload;
      client.join(`tailnet:${payload.tailnetId}`);
      client.join(`tv:${payload.tvDeviceId}`);
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { ts: Date.now(), id: client.id } };
  }

  emitTailnetRefresh(tailnetId: string, type: string, payload: unknown) {
    this.server.to(`tailnet:${tailnetId}`).emit('refresh', { type, payload });
  }

  emitSessionRevoked(tvDeviceId: string) {
    this.server.to(`tv:${tvDeviceId}`).emit('session_revoked', {
      at: new Date().toISOString(),
    });
  }

  emitAlert(tailnetId: string, alert: unknown) {
    this.server.to(`tailnet:${tailnetId}`).emit('alert', alert);
  }
}
