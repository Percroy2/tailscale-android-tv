import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { PortalAccessPayload } from './token.service.js';

@Injectable()
export class PortalAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentification requise');
    }

    try {
      const payload = await this.jwt.verifyAsync<PortalAccessPayload>(
        authHeader.slice(7),
        { secret: this.config.get<string>('JWT_ACCESS_SECRET') },
      );
      if (payload.type !== 'portal_access') {
        throw new UnauthorizedException('Token portail invalide');
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Session portail expirée');
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: PortalAccessPayload;
  }
}
