import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TailscaleOAuthService } from './tailscale-oauth.service.js';
import type {
  DashboardResponse,
  DashboardStats,
  DeviceSummary,
  DnsConfig,
  AuthKeySummary,
  PolicyDocument,
  ExitNodeSummary,
  RouteEntry,
  TailscaleDevice,
  TailscaleDevicesResponse,
  TailscaleUsersResponse,
  UserSummary,
} from './tailscale.types.js';

const TAILSCALE_API_BASE = 'https://api.tailscale.com/api/v2';
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const EXPIRING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class TailscaleApiService {
  constructor(
    private readonly oauth: TailscaleOAuthService,
    private readonly prisma: PrismaService,
  ) {}

  async listDevices(tailnetId: string): Promise<DeviceSummary[]> {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/devices?fields=all`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      throw new Error('API Tailscale indisponible');
    }

    const payload = (await response.json()) as TailscaleDevicesResponse;
    return payload.devices.map((device) => this.toDeviceSummary(device));
  }

  async getDashboard(tailnetId: string): Promise<DashboardResponse> {
    const tailnet = await this.requireTailnet(tailnetId);
    const devices = await this.listDevices(tailnetId);
    const stats = this.computeStats(devices);
    const favorites = await this.prisma.deviceFavorite.findMany({
      where: { tailnetId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      tailnet: {
        id: tailnet.id,
        name: tailnet.name,
        displayName: tailnet.displayName,
      },
      connected: true,
      stats,
      favorites: favorites.map((favorite) => {
        const device = devices.find((item) => item.id === favorite.deviceId);
        return {
          deviceId: favorite.deviceId,
          deviceName: favorite.deviceName,
          online: device?.online ?? false,
        };
      }),
      updatedAt: new Date().toISOString(),
    };
  }

  private computeStats(devices: DeviceSummary[]): DashboardStats {
    const users = new Set(devices.map((device) => device.user).filter(Boolean));
    let pendingRoutes = 0;

    for (const device of devices) {
      pendingRoutes += device.pendingRoutes.length;
    }

    return {
      devicesTotal: devices.length,
      devicesOnline: devices.filter((device) => device.online).length,
      devicesOffline: devices.filter((device) => !device.online).length,
      exitNodes: devices.filter((device) => device.isExitNode).length,
      subnetRouters: devices.filter((device) => device.isSubnetRouter).length,
      pendingApproval: devices.filter((device) => !device.authorized).length,
      pendingRoutes,
      expiringKeys: devices.filter((device) => this.isKeyExpiringSoon(device))
        .length,
      users: users.size,
    };
  }

  private toDeviceSummary(device: TailscaleDevice): DeviceSummary {
    const ipv4 =
      device.addresses.find((address) => address.includes('.')) ?? null;
    const ipv6 =
      device.addresses.find((address) => address.includes(':')) ?? null;
    const advertised = device.advertisedRoutes ?? [];
    const enabled = new Set(device.enabledRoutes ?? []);
    const pendingRoutes = advertised.filter((route) => !enabled.has(route));
    const tags = device.tags ?? [];

    return {
      id: device.id,
      name: device.hostname || device.name,
      hostname: device.hostname,
      os: device.os,
      user: device.user,
      ipv4,
      ipv6,
      online: this.isOnline(device.lastSeen),
      lastSeen: device.lastSeen ?? null,
      tags,
      authorized: device.authorized,
      expires: device.expires ?? null,
      keyExpiryDisabled: device.keyExpiryDisabled ?? false,
      isExitNode: tags.some((tag) => tag.includes('exit')),
      isSubnetRouter:
        advertised.length > 0 || (device.enabledRoutes?.length ?? 0) > 0,
      pendingRoutes,
      advertisedRoutes: advertised,
      enabledRoutes: device.enabledRoutes ?? [],
      dnsName: device.name ?? null,
      clientVersion: device.clientVersion ?? null,
      createdAt: device.created ?? null,
    };
  }

  async setDeviceAuthorized(
    tailnetId: string,
    deviceId: string,
    authorized: boolean,
  ): Promise<void> {
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/device/${encodeURIComponent(deviceId)}/authorized`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authorized }),
      },
    );

    if (!response.ok) {
      throw new Error('Action refusée');
    }
  }

  async setDeviceRoutes(
    tailnetId: string,
    deviceId: string,
    routes: string[],
  ): Promise<void> {
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/device/${encodeURIComponent(deviceId)}/routes`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routes }),
      },
    );

    if (!response.ok) {
      throw new Error('Action refusée');
    }
  }

  async listRoutes(tailnetId: string) {
    const devices = await this.listDevices(tailnetId);
    const routes: RouteEntry[] = [];

    for (const device of devices) {
      const enabled = new Set(device.enabledRoutes);
      for (const route of device.advertisedRoutes) {
        routes.push({
          deviceId: device.id,
          deviceName: device.name,
          route,
          approved: enabled.has(route),
          online: device.online,
        });
      }
    }

    return routes.sort((a, b) => a.route.localeCompare(b.route));
  }

  async listExitNodes(tailnetId: string) {
    const devices = await this.listDevices(tailnetId);
    return devices
      .filter((device) => device.isExitNode)
      .map((device) => ({
        id: device.id,
        name: device.name,
        ipv4: device.ipv4,
        online: device.online,
        user: device.user,
        os: device.os,
        lastSeen: device.lastSeen,
        authorized: device.authorized,
      }));
  }

  async listUsers(tailnetId: string) {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/users`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      return this.listUsersFromDevices(tailnetId);
    }

    const payload = (await response.json()) as TailscaleUsersResponse;
    return payload.users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      loginName: user.loginName,
      role: user.role,
      status: user.status,
      type: user.type,
      deviceCount: user.deviceCount ?? 0,
      lastSeen: user.lastSeen ?? null,
      currentlyConnected: user.currentlyConnected ?? false,
    }));
  }

  async approveUser(tailnetId: string, userId: string) {
    await this.userAction(tailnetId, userId, 'approve');
  }

  async suspendUser(tailnetId: string, userId: string) {
    await this.userAction(tailnetId, userId, 'suspend');
  }

  async restoreUser(tailnetId: string, userId: string) {
    await this.userAction(tailnetId, userId, 'restore');
  }

  private async userAction(
    tailnetId: string,
    userId: string,
    action: 'approve' | 'suspend' | 'restore',
  ) {
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/user/${encodeURIComponent(userId)}/${action}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      throw new Error('Action refusée');
    }
  }

  private async listUsersFromDevices(tailnetId: string) {
    const devices = await this.listDevices(tailnetId);
    const users = new Map<string, UserSummary>();

    for (const device of devices) {
      if (!device.user || users.has(device.user)) {
        continue;
      }
      users.set(device.user, {
        id: device.user,
        displayName: device.user.split('@')[0] ?? device.user,
        loginName: device.user,
        role: 'member',
        status: 'active',
        type: 'member',
        deviceCount: devices.filter((item) => item.user === device.user).length,
        lastSeen: device.lastSeen,
        currentlyConnected: device.online,
      });
    }

    return [...users.values()];
  }

  private isOnline(lastSeen?: string): boolean {
    if (!lastSeen) {
      return false;
    }
    const timestamp = Date.parse(lastSeen);
    if (Number.isNaN(timestamp)) {
      return false;
    }
    return Date.now() - timestamp <= ONLINE_WINDOW_MS;
  }

  private isKeyExpiringSoon(device: DeviceSummary): boolean {
    if (device.keyExpiryDisabled || !device.expires) {
      return false;
    }
    const expiry = Date.parse(device.expires);
    if (Number.isNaN(expiry)) {
      return false;
    }
    return expiry - Date.now() <= EXPIRING_WINDOW_MS;
  }

  private async requireTailnet(tailnetId: string) {
    const tailnet = await this.prisma.tailnet.findUnique({
      where: { id: tailnetId },
    });
    if (!tailnet || !tailnet.enabled) {
      throw new Error('Tailnet indisponible');
    }
    return tailnet;
  }

  async getDnsConfig(tailnetId: string): Promise<DnsConfig> {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const [nameserversRes, prefsRes] = await Promise.all([
      fetch(
        `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/dns/nameservers`,
        { headers: { Authorization: `Bearer ${token}` } },
      ),
      fetch(
        `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/dns/preferences`,
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    ]);

    if (!nameserversRes.ok) {
      throw new Error('DNS indisponible');
    }

    const nameserversPayload = (await nameserversRes.json()) as {
      dns?: string[];
      nameservers?: string[];
    };
    const prefsPayload = prefsRes.ok
      ? ((await prefsRes.json()) as {
          magicDNS?: boolean;
          magicDNSPrefix?: string;
          searchPaths?: string[];
        })
      : {};

    return {
      nameservers:
        nameserversPayload.dns ??
        nameserversPayload.nameservers ??
        [],
      magicDns: prefsPayload.magicDNS ?? false,
      searchPaths: prefsPayload.searchPaths ?? [],
    };
  }

  async updateDnsNameservers(
    tailnetId: string,
    nameservers: string[],
  ): Promise<void> {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/dns/nameservers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dns: nameservers }),
      },
    );

    if (!response.ok) {
      throw new Error('Mise à jour DNS refusée');
    }
  }

  async listAuthKeys(tailnetId: string): Promise<AuthKeySummary[]> {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/keys`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      throw new Error('Clés indisponibles');
    }

    const payload = (await response.json()) as {
      keys: Array<{
        id: string;
        key: string;
        description?: string;
        created: string;
        expires?: string;
        revoked?: boolean;
        reusable?: boolean;
        ephemeral?: boolean;
        preauthorized?: boolean;
        tags?: string[];
      }>;
    };

    return payload.keys.map((item) => ({
      id: item.id,
      key: item.key,
      description: item.description ?? '',
      created: item.created,
      expires: item.expires ?? null,
      revoked: item.revoked ?? false,
      reusable: item.reusable ?? false,
      ephemeral: item.ephemeral ?? true,
      preauthorized: item.preauthorized ?? false,
      tags: item.tags ?? [],
    }));
  }

  async createAuthKey(
    tailnetId: string,
    input: {
      description?: string;
      reusable?: boolean;
      ephemeral?: boolean;
      preauthorized?: boolean;
      tags?: string[];
      expirySeconds?: number;
    },
  ): Promise<AuthKeySummary> {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/keys`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capabilities: {
            devices: {
              create: {
                reusable: input.reusable ?? false,
                ephemeral: input.ephemeral ?? true,
                preauthorized: input.preauthorized ?? false,
                tags: input.tags ?? [],
              },
            },
          },
          expirySeconds: input.expirySeconds ?? 86400,
          description: input.description ?? 'TailControl',
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Création de clé refusée');
    }

    const item = (await response.json()) as {
      id: string;
      key: string;
      description?: string;
      created: string;
      expires?: string;
      revoked?: boolean;
      reusable?: boolean;
      ephemeral?: boolean;
      preauthorized?: boolean;
      tags?: string[];
    };

    return {
      id: item.id,
      key: item.key,
      description: item.description ?? '',
      created: item.created,
      expires: item.expires ?? null,
      revoked: item.revoked ?? false,
      reusable: item.reusable ?? false,
      ephemeral: item.ephemeral ?? true,
      preauthorized: item.preauthorized ?? false,
      tags: item.tags ?? [],
    };
  }

  async getPolicy(tailnetId: string): Promise<PolicyDocument> {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/acl`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      throw new Error('Politique indisponible');
    }

    const payload = (await response.json()) as {
      acl?: unknown;
      updated?: string;
    };

    return {
      acl: payload.acl ?? payload,
      updatedAt: payload.updated ?? null,
    };
  }

  async validatePolicy(tailnetId: string, acl: unknown): Promise<{ valid: boolean }> {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/acl/validate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acl }),
      },
    );

    if (!response.ok) {
      return { valid: false };
    }

    return { valid: true };
  }

  async updatePolicy(tailnetId: string, acl: unknown): Promise<void> {
    const tailnet = await this.requireTailnet(tailnetId);
    const token = await this.oauth.getAccessToken(tailnetId);
    const response = await fetch(
      `${TAILSCALE_API_BASE}/tailnet/${encodeURIComponent(tailnet.name)}/acl`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acl }),
      },
    );

    if (!response.ok) {
      throw new Error('Mise à jour politique refusée');
    }
  }
}
