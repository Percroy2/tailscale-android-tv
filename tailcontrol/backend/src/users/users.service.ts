import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { TvAccessPayload } from '../auth/token.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly tailscaleApi: TailscaleApiService,
    private readonly redis: RedisService,
  ) {}

  async listUsers(tailnetId: string) {
    const cacheKey = `users:${tailnetId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const users = await this.tailscaleApi.listUsers(tailnetId);
    await this.redis.client.setex(cacheKey, 30, JSON.stringify(users));
    return users;
  }

  async approveUser(tailnetId: string, userId: string, tvAuth: TvAccessPayload) {
    this.assertCanManageUsers(tvAuth);
    await this.tailscaleApi.approveUser(tailnetId, userId);
    await this.redis.client.del(`users:${tailnetId}`);
    return { success: true };
  }

  async suspendUser(tailnetId: string, userId: string, tvAuth: TvAccessPayload) {
    this.assertCanManageUsers(tvAuth);
    await this.tailscaleApi.suspendUser(tailnetId, userId);
    await this.redis.client.del(`users:${tailnetId}`);
    return { success: true };
  }

  async restoreUser(tailnetId: string, userId: string, tvAuth: TvAccessPayload) {
    this.assertCanManageUsers(tvAuth);
    await this.tailscaleApi.restoreUser(tailnetId, userId);
    await this.redis.client.del(`users:${tailnetId}`);
    return { success: true };
  }

  private assertCanManageUsers(tvAuth: TvAccessPayload): void {
    if (!tvAuth.permissions.canManageUsers) {
      throw new ForbiddenException('Permissions insuffisantes');
    }
  }
}
