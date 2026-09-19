import { ForbiddenException, Injectable } from '@nestjs/common';
import type { TvAccessPayload } from '../auth/token.service.js';
import { AuditLogService } from '../common/audit/audit-log.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';

@Injectable()
export class PolicyService {
  constructor(
    private readonly tailscaleApi: TailscaleApiService,
    private readonly redis: RedisService,
    private readonly audit: AuditLogService,
  ) {}

  async getPolicy(tailnetId: string) {
    const cacheKey = `policy:${tailnetId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const policy = await this.tailscaleApi.getPolicy(tailnetId);
    await this.redis.client.setex(cacheKey, 120, JSON.stringify(policy));
    return policy;
  }

  validatePolicy(tailnetId: string, acl: unknown) {
    return this.tailscaleApi.validatePolicy(tailnetId, acl);
  }

  async updatePolicy(
    tailnetId: string,
    acl: unknown,
    tvAuth: TvAccessPayload,
  ) {
    if (!tvAuth.permissions.canManagePolicy) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    await this.tailscaleApi.updatePolicy(tailnetId, acl);
    await this.redis.client.del(`policy:${tailnetId}`);
    await this.audit.log({
      action: 'UPDATE_POLICY',
      tvDeviceId: tvAuth.tvDeviceId,
      tailnetId,
      targetType: 'policy',
    });
    return { success: true };
  }
}
