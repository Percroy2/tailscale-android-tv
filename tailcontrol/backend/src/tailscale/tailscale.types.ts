export interface TailscaleDevice {
  id: string;
  name: string;
  hostname: string;
  os: string;
  user: string;
  addresses: string[];
  authorized: boolean;
  lastSeen?: string;
  expires?: string;
  keyExpiryDisabled?: boolean;
  tags?: string[];
  advertisedRoutes?: string[];
  enabledRoutes?: string[];
  clientVersion?: string;
  created?: string;
  clientConnectivity?: {
    endpoints?: string[];
  };
}

export interface TailscaleDevicesResponse {
  devices: TailscaleDevice[];
}

export interface TailscaleOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface DashboardStats {
  devicesTotal: number;
  devicesOnline: number;
  devicesOffline: number;
  exitNodes: number;
  subnetRouters: number;
  pendingApproval: number;
  pendingRoutes: number;
  expiringKeys: number;
  users: number;
}

export interface DashboardResponse {
  tailnet: {
    id: string;
    name: string;
    displayName: string;
  };
  connected: boolean;
  stats: DashboardStats;
  favorites: Array<{ deviceId: string; deviceName: string; online: boolean }>;
  updatedAt: string;
}

export interface DeviceSummary {
  id: string;
  name: string;
  hostname: string;
  os: string;
  user: string;
  ipv4: string | null;
  ipv6: string | null;
  online: boolean;
  lastSeen: string | null;
  tags: string[];
  authorized: boolean;
  expires: string | null;
  keyExpiryDisabled: boolean;
  isExitNode: boolean;
  isSubnetRouter: boolean;
  pendingRoutes: string[];
  advertisedRoutes: string[];
  enabledRoutes: string[];
  dnsName: string | null;
  clientVersion: string | null;
  createdAt: string | null;
}

export interface RouteEntry {
  deviceId: string;
  deviceName: string;
  route: string;
  approved: boolean;
  online: boolean;
}

export interface ExitNodeSummary {
  id: string;
  name: string;
  ipv4: string | null;
  online: boolean;
  user: string;
  os: string;
  lastSeen: string | null;
  authorized: boolean;
}

export interface UserSummary {
  id: string;
  displayName: string;
  loginName: string;
  role: string;
  status: string;
  type: string;
  deviceCount: number;
  lastSeen: string | null;
  currentlyConnected: boolean;
}

export interface TailscaleUsersResponse {
  users: Array<{
    id: string;
    displayName: string;
    loginName: string;
    role: string;
    status: string;
    type: string;
    deviceCount?: number;
    lastSeen?: string;
    currentlyConnected?: boolean;
  }>;
}

export interface DnsConfig {
  nameservers: string[];
  magicDns: boolean;
  searchPaths: string[];
}

export interface AuthKeySummary {
  id: string;
  key: string;
  description: string;
  created: string;
  expires: string | null;
  revoked: boolean;
  reusable: boolean;
  ephemeral: boolean;
  preauthorized: boolean;
  tags: string[];
}

export interface PolicyDocument {
  acl: unknown;
  updatedAt: string | null;
}
