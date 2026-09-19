import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionProfile } from '@prisma/client';
import { AuditLogService } from '../common/audit/audit-log.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TokenService } from '../auth/token.service.js';
import { permissionsForProfile } from '../auth/permissions.util.js';
import { EventsGateway } from '../websocket/events.gateway.js';

@Injectable()
export class TvsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly audit: AuditLogService,
    private readonly events: EventsGateway,
  ) {}

  listTvs(tailnetId: string) {
    return this.prisma.tvDevice.findMany({
      where: {
        permissions: { some: { tailnetId } },
        revokedAt: null,
      },
      include: {
        permissions: {
          where: { tailnetId },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async revokeTv(tailnetId: string, tvDeviceId: string, userId: string) {
    const permission = await this.prisma.tvPermission.findUnique({
      where: {
        tvDeviceId_tailnetId: { tvDeviceId, tailnetId },
      },
    });
    if (!permission) {
      throw new NotFoundException('Télévision introuvable');
    }

    await this.tokenService.revokeTvDevice(tvDeviceId);
    this.events.emitSessionRevoked(tvDeviceId);
    await this.audit.log({
      action: 'REVOKE_TV',
      userId,
      tvDeviceId,
      tailnetId,
      targetType: 'tv_device',
      targetId: tvDeviceId,
    });

    return { success: true };
  }

  async updatePermissions(
    tailnetId: string,
    tvDeviceId: string,
    input: {
      profile: PermissionProfile;
      permissions?: Record<string, boolean>;
    },
  ) {
    const flags = permissionsForProfile(
      input.profile,
      input.permissions as never,
    );

    const permission = await this.prisma.tvPermission.update({
      where: {
        tvDeviceId_tailnetId: { tvDeviceId, tailnetId },
      },
      data: {
        profile: input.profile,
        ...flags,
      },
    });

    this.events.emitTailnetRefresh(tailnetId, 'permissions_updated', {
      tvDeviceId,
    });

    return permission;
  }
}
