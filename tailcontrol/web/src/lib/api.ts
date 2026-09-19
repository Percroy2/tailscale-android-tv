const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'Erreur API';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
}

export interface TailnetSummary {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
}

export interface PairingLookup {
  pairingId: string;
  status: string;
  device: {
    id: string;
    name: string;
    installationId: string;
  } | null;
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

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(email: string, password: string, displayName: string) {
    return request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  },

  listTailnets(token: string) {
    return request<TailnetSummary[]>('/api/v1/tailnets', {}, token);
  },

  createTailnet(token: string, input: { name: string; displayName: string }) {
    return request<TailnetSummary>('/api/v1/tailnets', {
      method: 'POST',
      body: JSON.stringify(input),
    }, token);
  },

  getPairingByCode(code: string) {
    return request<PairingLookup>(`/api/v1/pairing/code/${encodeURIComponent(code)}`);
  },

  authorizePairing(
    token: string,
    code: string,
    input: { tailnetId: string; profile: string; deviceName?: string },
  ) {
    return request<{ success: boolean }>(
      `/api/v1/pairing/${encodeURIComponent(code)}/authorize`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      token,
    );
  },

  getPortalDashboard(token: string, tailnetId: string) {
    return request<DashboardResponse>(
      `/api/v1/dashboard/portal?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  saveTailscaleCredentials(
    token: string,
    tailnetId: string,
    input: { clientId: string; clientSecret: string },
  ) {
    return request<{ id: string; clientId: string; scopes: string[] }>(
      `/api/v1/tailnets/${encodeURIComponent(tailnetId)}/credentials`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      token,
    );
  },

  listTvs(token: string, tailnetId: string) {
    return request<{ tvs: TvDeviceSummary[] }>(
      `/api/v1/tvs?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  revokeTv(token: string, tailnetId: string, tvDeviceId: string) {
    return request<{ success: boolean }>(
      `/api/v1/tvs/${encodeURIComponent(tvDeviceId)}/revoke?tailnetId=${encodeURIComponent(tailnetId)}`,
      { method: 'POST' },
      token,
    );
  },

  listAudit(token: string, tailnetId: string) {
    return request<{ entries: AuditEntry[] }>(
      `/api/v1/audit/portal?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  listActivity(token: string, tailnetId: string) {
    return request<{ items: ActivityItem[] }>(
      `/api/v1/activity/portal?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  listAlertsPortal(token: string, tailnetId: string) {
    return request<{ alerts: AlertSummary[] }>(
      `/api/v1/alerts/portal?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  getDns(token: string, tailnetId: string) {
    return request<DnsConfig>(
      `/api/v1/dns/portal?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  listAuthKeys(token: string, tailnetId: string) {
    return request<{ keys: AuthKeySummary[] }>(
      `/api/v1/auth-keys/portal?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  getPolicy(token: string, tailnetId: string) {
    return request<PolicyDocument>(
      `/api/v1/policy/portal?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  listMonitors(token: string, tailnetId: string) {
    return request<{ monitors: MonitorSummary[] }>(
      `/api/v1/monitoring/portal?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },

  runAllMonitors(token: string, tailnetId: string) {
    return request<{ results: unknown[] }>(
      `/api/v1/monitoring/portal/run-all?tailnetId=${encodeURIComponent(tailnetId)}`,
      { method: 'POST' },
      token,
    );
  },

  listAgents(token: string, tailnetId: string) {
    return request<{ agents: SupervisionAgent[] }>(
      `/api/v1/agents?tailnetId=${encodeURIComponent(tailnetId)}`,
      {},
      token,
    );
  },
};

export interface TvDeviceSummary {
  id: string;
  name: string;
  platform: string | null;
  lastSeenAt: string | null;
  permissions: Array<{
    profile: string;
    tailnetId: string;
  }>;
}

export interface AuditEntry {
  id: string;
  action: string;
  result: string;
  createdAt: string;
  user?: { displayName: string; email: string } | null;
  tvDevice?: { name: string } | null;
}

export interface ActivityItem {
  id: string;
  type: 'audit' | 'alert';
  action: string;
  title: string;
  message: string;
  result: string;
  createdAt: string;
}

export interface AlertSummary {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
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
}

export interface PolicyDocument {
  acl: unknown;
  updatedAt: string | null;
}

export interface MonitorSummary {
  id: string;
  name: string;
  type: string;
  target: string;
  enabled: boolean;
  results: Array<{
    status: string;
    latencyMs: number | null;
    checkedAt: string;
  }>;
}

export interface SupervisionAgent {
  id: string;
  name: string;
  hostname: string;
  capabilities: string[];
  lastSeenAt: string;
  status: 'online' | 'offline';
}
