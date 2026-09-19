import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TvAccessPayload } from '../auth/token.service.js';
import { TokenService } from '../auth/token.service.js';
import { permissionsForProfile } from '../auth/permissions.util.js';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class TvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  getProfile(tvAuth: TvAccessPayload) {
    return {
      tvDeviceId: tvAuth.tvDeviceId,
      tailnetId: tvAuth.tailnetId,
      profile: tvAuth.profile,
      permissions: tvAuth.permissions,
    };
  }

  async listTailnets(tvDeviceId: string) {
    const permissions = await this.prisma.tvPermission.findMany({
      where: { tvDeviceId },
      include: {
        tailnet: {
          select: {
            id: true,
            name: true,
            displayName: true,
            enabled: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return permissions
      .filter((entry) => entry.tailnet.enabled)
      .map((entry) => ({
        id: entry.tailnet.id,
        name: entry.tailnet.name,
        displayName: entry.tailnet.displayName,
        profile: entry.profile,
        active: false,
      }));
  }

  async switchTailnet(tvDeviceId: string, tailnetId: string) {
    const permission = await this.prisma.tvPermission.findUnique({
      where: {
        tvDeviceId_tailnetId: { tvDeviceId, tailnetId },
      },
      include: { tailnet: true },
    });

    if (!permission || !permission.tailnet.enabled) {
      throw new NotFoundException('Tailnet introuvable');
    }

    const device = await this.prisma.tvDevice.findUnique({
      where: { id: tvDeviceId },
    });
    if (!device || device.revokedAt) {
      throw new ForbiddenException('Télévision révoquée');
    }

    const flags = permissionsForProfile(permission.profile, {
      canReadDevices: permission.canReadDevices,
      canModifyDevices: permission.canModifyDevices,
      canDeleteDevices: permission.canDeleteDevices,
      canManageRoutes: permission.canManageRoutes,
      canManageDns: permission.canManageDns,
      canManageUsers: permission.canManageUsers,
      canManageKeys: permission.canManageKeys,
      canManagePolicy: permission.canManagePolicy,
    });

    return this.tokenService.issueTvTokens({
      tvDeviceId,
      tailnetId,
      profile: permission.profile,
      permissions: flags,
    });
  }
}
