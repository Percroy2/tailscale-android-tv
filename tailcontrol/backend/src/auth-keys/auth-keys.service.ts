import { ForbiddenException, Injectable } from '@nestjs/common';
import type { TvAccessPayload } from '../auth/token.service.js';
import { AuditLogService } from '../common/audit/audit-log.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';

@Injectable()
export class AuthKeysService {
  constructor(
    private readonly tailscaleApi: TailscaleApiService,
    private readonly redis: RedisService,
    private readonly audit: AuditLogService,
  ) {}

  async listKeys(tailnetId: string) {
    const cacheKey = `auth-keys:${tailnetId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const keys = await this.tailscaleApi.listAuthKeys(tailnetId);
    await this.redis.client.setex(cacheKey, 30, JSON.stringify(keys));
    return keys;
  }

  async createKey(
    tailnetId: string,
    input: {
      description?: string;
      reusable?: boolean;
      ephemeral?: boolean;
      preauthorized?: boolean;
      tags?: string[];
      expirySeconds?: number;
    },
    tvAuth: TvAccessPayload,
  ) {
    if (!tvAuth.permissions.canManageKeys) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    const key = await this.tailscaleApi.createAuthKey(tailnetId, input);
    await this.redis.client.del(`auth-keys:${tailnetId}`);
    await this.audit.log({
      action: 'CREATE_AUTH_KEY',
      tvDeviceId: tvAuth.tvDeviceId,
      tailnetId,
      targetType: 'auth_key',
      targetId: key.id,
      payload: { description: input.description },
    });
    return key;
  }
}
