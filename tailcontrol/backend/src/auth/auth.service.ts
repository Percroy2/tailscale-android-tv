import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TokenService } from './token.service.js';
import { hashToken } from './token.util.js';
import type { TvAccessPayload } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    displayName: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet e-mail');
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        passwordHash: await bcrypt.hash(input.password, 12),
      },
    });

    return this.tokenService.issuePortalToken(user);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.tokenService.issuePortalToken(user);
  }

  async refreshTvSession(refreshToken: string) {
    return this.tokenService.refreshTvTokens(refreshToken);
  }

  async logoutByRefreshToken(refreshToken: string) {
    const device = await this.prisma.tvDevice.findFirst({
      where: { refreshTokenHash: hashToken(refreshToken) },
    });
    if (device) {
      await this.tokenService.revokeTvDevice(device.id);
    }
    return { success: true };
  }

  async logoutByAccessToken(accessToken: string) {
    const payload = await this.jwt.verifyAsync<TvAccessPayload>(accessToken, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
    });
    if (payload.type === 'tv_access') {
      await this.tokenService.revokeTvDevice(payload.tvDeviceId);
    }
    return { success: true };
  }
}
