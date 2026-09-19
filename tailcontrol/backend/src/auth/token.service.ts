import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PermissionProfile } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { generateRefreshToken, hashToken } from './token.util.js';
import type { PermissionFlags } from './permissions.util.js';

export interface TvAccessPayload {
  sub: string;
  type: 'tv_access';
  tvDeviceId: string;
  tailnetId: string;
  profile: PermissionProfile;
  permissions: PermissionFlags;
}

export interface PortalAccessPayload {
  sub: string;
  type: 'portal_access';
  email: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issueTvTokens(input: {
    tvDeviceId: string;
    tailnetId: string;
    profile: PermissionProfile;
    permissions: PermissionFlags;
  }) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: input.tvDeviceId,
        type: 'tv_access',
        tvDeviceId: input.tvDeviceId,
        tailnetId: input.tailnetId,
        profile: input.profile,
        permissions: input.permissions,
      },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await this.prisma.tvDevice.update({
      where: { id: input.tvDeviceId },
      data: {
        refreshTokenHash,
        pairedAt: new Date(),
        lastSeenAt: new Date(),
        revokedAt: null,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer' as const,
    };
  }

  async refreshTvTokens(refreshToken: string) {
    const device = await this.prisma.tvDevice.findFirst({
      where: {
        refreshTokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      include: {
        permissions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!device || device.permissions.length === 0) {
      throw new UnauthorizedException('Session expirée');
    }

    const permission = device.permissions[0];
    return this.issueTvTokens({
      tvDeviceId: device.id,
      tailnetId: permission.tailnetId,
      profile: permission.profile,
      permissions: {
        canReadDevices: permission.canReadDevices,
        canModifyDevices: permission.canModifyDevices,
        canDeleteDevices: permission.canDeleteDevices,
        canManageRoutes: permission.canManageRoutes,
        canManageDns: permission.canManageDns,
        canManageUsers: permission.canManageUsers,
        canManageKeys: permission.canManageKeys,
        canManagePolicy: permission.canManagePolicy,
      },
    });
  }

  async revokeTvDevice(tvDeviceId: string): Promise<void> {
    await this.prisma.tvDevice.update({
      where: { id: tvDeviceId },
      data: {
        refreshTokenHash: null,
        revokedAt: new Date(),
      },
    });
  }

  async issuePortalToken(user: { id: string; email: string }) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        type: 'portal_access',
        email: user.email,
      },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '8h',
      },
    );

    return { accessToken, tokenType: 'Bearer' as const };
  }
}
