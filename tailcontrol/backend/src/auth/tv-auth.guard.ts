import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../common/prisma/prisma.service.js';
import type { TvAccessPayload } from './token.service.js';

@Injectable()
export class TvAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Session expirée');
    }

    try {
      const payload = await this.jwt.verifyAsync<TvAccessPayload>(
        authHeader.slice(7),
        { secret: this.config.get<string>('JWT_ACCESS_SECRET') },
      );
      if (payload.type !== 'tv_access') {
        throw new UnauthorizedException('Permissions insuffisantes');
      }

      const device = await this.prisma.tvDevice.findUnique({
        where: { id: payload.tvDeviceId },
        select: { revokedAt: true },
      });

      if (!device || device.revokedAt) {
        throw new UnauthorizedException('Session révoquée');
      }

      request.tvAuth = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Session expirée');
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    tvAuth?: TvAccessPayload;
  }
}
