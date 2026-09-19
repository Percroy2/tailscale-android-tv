import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EncryptionService } from '../common/crypto/encryption.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import type { TailscaleOAuthTokenResponse } from './tailscale.types.js';

const TOKEN_CACHE_PREFIX = 'tailscale:oauth:';
const TAILSCALE_TOKEN_URL = 'https://api.tailscale.com/api/v2/oauth/token';

@Injectable()
export class TailscaleOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly encryption: EncryptionService,
  ) {}

  async upsertCredentials(
    tailnetId: string,
    input: { clientId: string; clientSecret: string; scopes?: string[] },
  ) {
    const tailnet = await this.prisma.tailnet.findUnique({
      where: { id: tailnetId },
    });
    if (!tailnet) {
      throw new NotFoundException('Tailnet introuvable');
    }

    const encryptedClientSecret = this.encryption.encrypt(input.clientSecret);
    const scopes = input.scopes?.length
      ? input.scopes
      : ['devices:core', 'dns:read', 'dns:write', 'policy:read', 'users:read', 'users'];

    const existing = await this.prisma.tailscaleCredential.findFirst({
      where: { tailnetId, revokedAt: null },
    });

    if (existing) {
      return this.prisma.tailscaleCredential.update({
        where: { id: existing.id },
        data: {
          clientId: input.clientId,
          encryptedClientSecret,
          scopes,
        },
        select: {
          id: true,
          clientId: true,
          scopes: true,
          updatedAt: true,
        },
      });
    }

    return this.prisma.tailscaleCredential.create({
      data: {
        tailnetId,
        clientId: input.clientId,
        encryptedClientSecret,
        scopes,
      },
      select: {
        id: true,
        clientId: true,
        scopes: true,
        createdAt: true,
      },
    });
  }

  async getAccessToken(tailnetId: string): Promise<string> {
    const cached = await this.redis.client.get(`${TOKEN_CACHE_PREFIX}${tailnetId}`);
    if (cached) {
      return cached;
    }

    const credential = await this.prisma.tailscaleCredential.findFirst({
      where: { tailnetId, revokedAt: null },
      orderBy: { updatedAt: 'desc' },
    });

    if (!credential) {
      throw new BadRequestException({
        code: 'TAILSCALE_NOT_CONFIGURED',
        message: 'Credential Tailscale invalide',
      });
    }

    const clientSecret = this.encryption.decrypt(
      credential.encryptedClientSecret,
    );

    const body = new URLSearchParams({
      client_id: credential.clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: credential.scopes.join(' '),
    });

    const response = await fetch(TAILSCALE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new BadRequestException({
        code: 'TAILSCALE_OAUTH_FAILED',
        message: 'Credential Tailscale invalide',
      });
    }

    const payload = (await response.json()) as TailscaleOAuthTokenResponse;
    const ttl = Math.max(payload.expires_in - 60, 60);

    await this.redis.client.setex(
      `${TOKEN_CACHE_PREFIX}${tailnetId}`,
      ttl,
      payload.access_token,
    );

    await this.prisma.tailscaleCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });

    return payload.access_token;
  }
}
