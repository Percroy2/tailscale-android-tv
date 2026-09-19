import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditResult, PermissionProfile } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { permissionsForProfile } from '../auth/permissions.util.js';
import { TokenService } from '../auth/token.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import {
  generatePairingCode,
  hashPairingCode,
  normalizePairingCode,
} from './pairing.utils.js';

const PAIRING_TTL_SECONDS = 600;

@Injectable()
export class PairingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  async createPairing(input: {
    installationId?: string;
    deviceName?: string;
  }) {
    const installationId =
      input.installationId ?? `tv_${cryptoRandomId()}`;
    const code = generatePairingCode();
    const expiresAt = new Date(Date.now() + PAIRING_TTL_SECONDS * 1000);
    const webBaseUrl =
      this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:5173';

    const tvDevice = await this.prisma.tvDevice.upsert({
      where: { installationId },
      create: {
        installationId,
        name: input.deviceName ?? 'TailControl TV',
      },
      update: {
        name: input.deviceName ?? undefined,
      },
    });

    const session = await this.prisma.pairingSession.create({
      data: {
        pairingCodeHash: hashPairingCode(code),
        tvDeviceId: tvDevice.id,
        expiresAt,
      },
    });

    await this.redis.client.setex(
      `pairing:${session.id}`,
      PAIRING_TTL_SECONDS,
      JSON.stringify({ code, status: 'pending' }),
    );

    await this.redis.client.setex(
      `pairing:code:${normalizePairingCode(code)}`,
      PAIRING_TTL_SECONDS,
      session.id,
    );

    return {
      pairingId: session.id,
      code,
      expiresIn: PAIRING_TTL_SECONDS,
      pairingUrl: `${webBaseUrl}/pair/${code}`,
    };
  }

  async getPairingByCode(code: string) {
    const normalized = normalizePairingCode(code);
    const sessionId = await this.redis.client.get(`pairing:code:${normalized}`);
    if (!sessionId) {
      throw new NotFoundException('Code de jumelage introuvable ou expiré');
    }
    return this.getPairingStatus(sessionId, false);
  }

  async getPairingStatus(pairingId: string, includeTokens = true) {
    const session = await this.prisma.pairingSession.findUnique({
      where: { id: pairingId },
      include: { tvDevice: true },
    });

    if (!session) {
      throw new NotFoundException('Pairing session not found');
    }

    const status = session.usedAt
      ? 'completed'
      : session.expiresAt.getTime() < Date.now()
        ? 'expired'
        : 'pending';

    const response: Record<string, unknown> = {
      pairingId: session.id,
      status,
      expiresAt: session.expiresAt.toISOString(),
      usedAt: session.usedAt?.toISOString() ?? null,
      device: session.tvDevice
        ? {
            id: session.tvDevice.id,
            name: session.tvDevice.name,
            installationId: session.tvDevice.installationId,
          }
        : null,
    };

    if (status === 'completed' && includeTokens) {
      const tokensRaw = await this.redis.client.get(
        `pairing:tokens:${pairingId}`,
      );
      if (tokensRaw) {
        response.tokens = JSON.parse(tokensRaw);
        await this.redis.client.del(`pairing:tokens:${pairingId}`);
      }
    }

    return response;
  }

  async authorizePairing(input: {
    code: string;
    tailnetId: string;
    profile: PermissionProfile;
    deviceName?: string;
    userId?: string;
  }) {
    const normalized = normalizePairingCode(input.code);
    const session = await this.prisma.pairingSession.findFirst({
      where: {
        pairingCodeHash: hashPairingCode(normalized),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { tvDevice: true },
    });

    if (!session || !session.tvDevice) {
      throw new NotFoundException('Code de jumelage invalide ou expiré');
    }

    const tailnet = await this.prisma.tailnet.findUnique({
      where: { id: input.tailnetId },
    });
    if (!tailnet || !tailnet.enabled) {
      throw new BadRequestException('Tailnet indisponible');
    }

    const flags = permissionsForProfile(input.profile);

    await this.prisma.$transaction(async (tx) => {
      await tx.pairingSession.update({
        where: { id: session.id },
        data: { usedAt: new Date() },
      });

      await tx.tvDevice.update({
        where: { id: session.tvDevice!.id },
        data: {
          name: input.deviceName ?? session.tvDevice!.name,
        },
      });

      await tx.tvPermission.upsert({
        where: {
          tvDeviceId_tailnetId: {
            tvDeviceId: session.tvDevice!.id,
            tailnetId: input.tailnetId,
          },
        },
        create: {
          tvDeviceId: session.tvDevice!.id,
          tailnetId: input.tailnetId,
          profile: input.profile,
          ...flags,
        },
        update: {
          profile: input.profile,
          ...flags,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: input.userId,
          tvDeviceId: session.tvDevice!.id,
          tailnetId: input.tailnetId,
          action: 'PAIR_TV',
          targetType: 'tv_device',
          targetId: session.tvDevice!.id,
          result: AuditResult.SUCCESS,
        },
      });
    });

    const tokens = await this.tokenService.issueTvTokens({
      tvDeviceId: session.tvDevice.id,
      tailnetId: input.tailnetId,
      profile: input.profile,
      permissions: flags,
    });

    await this.redis.client.setex(
      `pairing:tokens:${session.id}`,
      120,
      JSON.stringify(tokens),
    );
    await this.redis.client.del(`pairing:code:${normalized}`);
    await this.redis.client.setex(
      `pairing:${session.id}`,
      120,
      JSON.stringify({ status: 'completed' }),
    );

    return {
      success: true,
      pairingId: session.id,
      device: {
        id: session.tvDevice.id,
        name: input.deviceName ?? session.tvDevice.name,
      },
      tailnet: {
        id: tailnet.id,
        displayName: tailnet.displayName,
      },
      profile: input.profile,
    };
  }
}

function cryptoRandomId(): string {
  return randomBytes(8).toString('hex');
}
