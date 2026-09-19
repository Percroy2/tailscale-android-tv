import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TailscaleApiService } from '../tailscale/tailscale-api.service.js';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tailscaleApi: TailscaleApiService,
  ) {}

  async listFavorites(tailnetId: string) {
    const favorites = await this.prisma.deviceFavorite.findMany({
      where: { tailnetId },
      orderBy: { createdAt: 'asc' },
    });

    let onlineMap = new Map<string, boolean>();
    try {
      const devices = await this.tailscaleApi.listDevices(tailnetId);
      onlineMap = new Map(devices.map((device) => [device.id, device.online]));
    } catch {
      onlineMap = new Map();
    }

    return favorites.map((favorite) => ({
      deviceId: favorite.deviceId,
      deviceName: favorite.deviceName,
      online: onlineMap.get(favorite.deviceId) ?? false,
    }));
  }

  addFavorite(tailnetId: string, deviceId: string, deviceName: string) {
    return this.prisma.deviceFavorite.upsert({
      where: {
        tailnetId_deviceId: { tailnetId, deviceId },
      },
      create: { tailnetId, deviceId, deviceName },
      update: { deviceName },
    });
  }

  removeFavorite(tailnetId: string, deviceId: string) {
    return this.prisma.deviceFavorite.delete({
      where: {
        tailnetId_deviceId: { tailnetId, deviceId },
      },
    });
  }
}
