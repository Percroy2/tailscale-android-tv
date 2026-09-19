import { ForbiddenException, Injectable } from '@nestjs/common';
import type { TvAccessPayload } from '../auth/token.service.js';
import { AuditLogService } from '../common/audit/audit-log.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';

@Injectable()
export class DnsService {
  constructor(
    private readonly tailscaleApi: TailscaleApiService,
    private readonly redis: RedisService,
    private readonly audit: AuditLogService,
  ) {}

  async getDns(tailnetId: string) {
    const cacheKey = `dns:${tailnetId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const config = await this.tailscaleApi.getDnsConfig(tailnetId);
    await this.redis.client.setex(cacheKey, 60, JSON.stringify(config));
    return config;
  }

  async updateNameservers(
    tailnetId: string,
    nameservers: string[],
    tvAuth: TvAccessPayload,
  ) {
    if (!tvAuth.permissions.canManageDns) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    await this.tailscaleApi.updateDnsNameservers(tailnetId, nameservers);
    await this.redis.client.del(`dns:${tailnetId}`);
    await this.audit.log({
      action: 'UPDATE_DNS',
      tvDeviceId: tvAuth.tvDeviceId,
      tailnetId,
      targetType: 'dns',
      payload: { nameservers },
    });
    return { success: true, nameservers };
  }
}
