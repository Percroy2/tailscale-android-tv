import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TvAccessPayload } from '../auth/token.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';
import type { DeviceSummary } from '../tailscale/tailscale.types.js';

@Injectable()
export class DevicesService {
  constructor(
    private readonly tailscaleApi: TailscaleApiService,
    private readonly redis: RedisService,
  ) {}

  async listDevices(
    tailnetId: string,
    filter?: string,
    search?: string,
  ): Promise<DeviceSummary[]> {
    const devices = await this.loadDevices(tailnetId);
    return this.applyFilters(devices, filter, search);
  }

  async getDevice(tailnetId: string, deviceId: string): Promise<DeviceSummary> {
    const devices = await this.loadDevices(tailnetId);
    const device = devices.find((item) => item.id === deviceId);
    if (!device) {
      throw new NotFoundException('Machine introuvable');
    }
    return device;
  }

  async authorizeDevice(
    tailnetId: string,
    deviceId: string,
    tvAuth: TvAccessPayload,
  ) {
    this.assertCanModify(tvAuth);
    await this.tailscaleApi.setDeviceAuthorized(tailnetId, deviceId, true);
    await this.invalidateCache(tailnetId);
    return { success: true };
  }

  async revokeDevice(
    tailnetId: string,
    deviceId: string,
    tvAuth: TvAccessPayload,
  ) {
    this.assertCanModify(tvAuth);
    await this.tailscaleApi.setDeviceAuthorized(tailnetId, deviceId, false);
    await this.invalidateCache(tailnetId);
    return { success: true };
  }

  async approveRoute(
    tailnetId: string,
    deviceId: string,
    route: string,
    tvAuth: TvAccessPayload,
  ) {
    if (!tvAuth.permissions.canManageRoutes) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    const device = await this.getDevice(tailnetId, deviceId);
    const enabledRoutes = [...new Set([...device.enabledRoutes, route])];
    await this.tailscaleApi.setDeviceRoutes(tailnetId, deviceId, enabledRoutes);
    await this.invalidateCache(tailnetId);
    return { success: true, route, enabledRoutes };
  }

  private async loadDevices(tailnetId: string): Promise<DeviceSummary[]> {
    const cacheKey = `devices:${tailnetId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as DeviceSummary[];
    }

    const devices = await this.tailscaleApi.listDevices(tailnetId);
    await this.redis.client.setex(cacheKey, 30, JSON.stringify(devices));
    return devices;
  }

  private async invalidateCache(tailnetId: string): Promise<void> {
    await this.redis.client.del(`devices:${tailnetId}`);
    await this.redis.client.del(`dashboard:${tailnetId}`);
  }

  private assertCanModify(tvAuth: TvAccessPayload): void {
    if (!tvAuth.permissions.canModifyDevices) {
      throw new ForbiddenException('Permissions insuffisantes');
    }
  }

  private applyFilters(
    devices: DeviceSummary[],
    filter?: string,
    search?: string,
  ) {
    let result = devices;

    switch (filter) {
      case 'online':
        result = result.filter((device) => device.online);
        break;
      case 'offline':
        result = result.filter((device) => !device.online);
        break;
      case 'pending':
        result = result.filter((device) => !device.authorized);
        break;
      case 'exit-nodes':
        result = result.filter((device) => device.isExitNode);
        break;
      case 'subnet-routers':
        result = result.filter((device) => device.isSubnetRouter);
        break;
      case 'linux':
        result = result.filter((device) =>
          device.os.toLowerCase().includes('linux'),
        );
        break;
      case 'windows':
        result = result.filter((device) =>
          device.os.toLowerCase().includes('windows'),
        );
        break;
      case 'macos':
        result = result.filter((device) =>
          device.os.toLowerCase().includes('mac'),
        );
        break;
      case 'android':
        result = result.filter((device) =>
          device.os.toLowerCase().includes('android'),
        );
        break;
      case 'ios':
        result = result.filter((device) =>
          device.os.toLowerCase().includes('ios'),
        );
        break;
      default:
        break;
    }

    if (search?.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (device) =>
          device.name.toLowerCase().includes(query) ||
          device.user.toLowerCase().includes(query) ||
          (device.ipv4 ?? '').includes(query) ||
          device.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    return result;
  }
}
