import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';

describe('TailControl API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.service).toBe('tailcontrol-api');
      });
  });

  it('GET /api/v1/app/version', () => {
    return request(app.getHttpServer())
      .get('/api/v1/app/version')
      .expect(200)
      .expect(({ body }) => {
        expect(body.latestVersion).toBe('1.0.0');
      });
  });

  it('POST /api/v1/pairing crée une session', () => {
    return request(app.getHttpServer())
      .post('/api/v1/pairing')
      .send({ installationId: 'e2e-installation', deviceName: 'E2E TV' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
        expect(response.body.pairingId).toBeDefined();
        expect(response.body.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
        expect(response.body.pairingUrl).toContain('/pair/');
      });
  });

  it('POST /api/v1/auth/register + login portail', async () => {
    const email = `e2e-${Date.now()}@tailcontrol.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'TestPass123!', displayName: 'E2E User' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123!' })
      .expect(201);

    expect(login.body.accessToken).toBeDefined();
  });

  it('GET /api/v1/alerts exige auth TV', () => {
    return request(app.getHttpServer()).get('/api/v1/alerts').expect(401);
  });

  it('GET /api/v1/tv/tailnets exige auth TV', () => {
    return request(app.getHttpServer()).get('/api/v1/tv/tailnets').expect(401);
  });

  it('flux jumelage complet : pair → authorize → tokens TV → refresh', async () => {
    const email = `pair-e2e-${Date.now()}@tailcontrol.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'TestPass123!', displayName: 'Pair E2E' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123!' })
      .expect(201);

    const portalToken = login.body.accessToken as string;

    const tailnet = await request(app.getHttpServer())
      .post('/api/v1/tailnets')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        name: `e2e-${Date.now()}`,
        displayName: 'E2E Tailnet',
      })
      .expect(201);

    const pairing = await request(app.getHttpServer())
      .post('/api/v1/pairing')
      .send({ installationId: `e2e-${Date.now()}`, deviceName: 'Salon TV' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    const { pairingId, code } = pairing.body as {
      pairingId: string;
      code: string;
    };

    await request(app.getHttpServer())
      .post(`/api/v1/pairing/${encodeURIComponent(code)}/authorize`)
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        tailnetId: tailnet.body.id,
        profile: 'ADMIN',
        deviceName: 'Salon TV',
      })
      .expect(201);

    const status = await request(app.getHttpServer())
      .get(`/api/v1/pairing/${pairingId}`)
      .expect(200);

    expect(status.body.status).toBe('completed');
    expect(status.body.tokens?.accessToken).toBeDefined();
    expect(status.body.tokens?.refreshToken).toBeDefined();

    const tvAccess = status.body.tokens.accessToken as string;
    const tvRefresh = status.body.tokens.refreshToken as string;

    await request(app.getHttpServer())
      .get('/api/v1/tv/tailnets')
      .set('Authorization', `Bearer ${tvAccess}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.tailnets).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: tailnet.body.id }),
          ]),
        );
      });

    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tvRefresh })
      .expect(201);

    expect(refreshed.body.accessToken).toBeDefined();
    expect(refreshed.body.refreshToken).toBeDefined();
    expect(refreshed.body.refreshToken).not.toBe(tvRefresh);

    await request(app.getHttpServer())
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.alerts).toBeDefined();
      });

    await request(app.getHttpServer())
      .get('/api/v1/monitoring')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.monitors).toBeDefined();
      });

    await request(app.getHttpServer())
      .get('/api/v1/agents/for-tv')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.agents).toBeDefined();
      });

    await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.entries).toBeDefined();
      });

    await request(app.getHttpServer())
      .get('/api/v1/activity')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toBeDefined();
      });
  });

  it('OAuth Tailscale : credentials chiffrés AES-256-GCM en base', async () => {
    const email = `oauth-e2e-${Date.now()}@tailcontrol.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'TestPass123!', displayName: 'OAuth E2E' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123!' })
      .expect(201);

    const portalToken = login.body.accessToken as string;

    const tailnet = await request(app.getHttpServer())
      .post('/api/v1/tailnets')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        name: `oauth-${Date.now()}`,
        displayName: 'OAuth Tailnet',
      })
      .expect(201);

    const clientSecret = `tskey-client-secret-${Date.now()}`;

    await request(app.getHttpServer())
      .post(`/api/v1/tailnets/${tailnet.body.id}/credentials`)
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        clientId: 'kTestClientId',
        clientSecret,
        scopes: ['devices:core'],
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.clientId).toBe('kTestClientId');
        expect(body.clientSecret).toBeUndefined();
      });

    const prisma = app.get(PrismaService);
    const stored = await prisma.tailscaleCredential.findFirst({
      where: { tailnetId: tailnet.body.id, revokedAt: null },
    });

    expect(stored).toBeDefined();
    expect(stored!.encryptedClientSecret).not.toContain(clientSecret);
    expect(stored!.encryptedClientSecret).not.toBe(clientSecret);

    await request(app.getHttpServer())
      .get(`/api/v1/dashboard/portal?tailnetId=${tailnet.body.id}`)
      .set('Authorization', `Bearer ${portalToken}`)
      .expect(400)
      .expect(({ body }) => {
        expect(body.message?.code ?? body.code).toBe('TAILSCALE_OAUTH_FAILED');
      });
  });

  it('révocation TV : accès API et refresh bloqués immédiatement', async () => {
    const email = `revoke-e2e-${Date.now()}@tailcontrol.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'TestPass123!', displayName: 'Revoke E2E' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123!' })
      .expect(201);

    const portalToken = login.body.accessToken as string;

    const tailnet = await request(app.getHttpServer())
      .post('/api/v1/tailnets')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        name: `revoke-${Date.now()}`,
        displayName: 'Revoke Tailnet',
      })
      .expect(201);

    const pairing = await request(app.getHttpServer())
      .post('/api/v1/pairing')
      .send({ installationId: `revoke-${Date.now()}`, deviceName: 'Revoke TV' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    const { code } = pairing.body as { code: string };

    await request(app.getHttpServer())
      .post(`/api/v1/pairing/${encodeURIComponent(code)}/authorize`)
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        tailnetId: tailnet.body.id,
        profile: 'ADMIN',
        deviceName: 'Revoke TV',
      })
      .expect(201);

    const status = await request(app.getHttpServer())
      .get(`/api/v1/pairing/${pairing.body.pairingId}`)
      .expect(200);

    const tvAccess = status.body.tokens.accessToken as string;
    const tvRefresh = status.body.tokens.refreshToken as string;
    const tvDeviceId = status.body.device.id as string;

    await request(app.getHttpServer())
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${tvAccess}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/tvs/${tvDeviceId}/revoke`)
      .query({ tailnetId: tailnet.body.id })
      .set('Authorization', `Bearer ${portalToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${tvAccess}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tvRefresh })
      .expect(401);
  });

  it('RBAC : profil READ_ONLY sans permissions admin dans /tv/profile', async () => {
    const email = `rbac-e2e-${Date.now()}@tailcontrol.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'TestPass123!', displayName: 'RBAC E2E' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123!' })
      .expect(201);

    const portalToken = login.body.accessToken as string;

    const tailnet = await request(app.getHttpServer())
      .post('/api/v1/tailnets')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        name: `rbac-${Date.now()}`,
        displayName: 'RBAC Tailnet',
      })
      .expect(201);

    const pairing = await request(app.getHttpServer())
      .post('/api/v1/pairing')
      .send({ installationId: `rbac-${Date.now()}`, deviceName: 'RBAC TV' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    await request(app.getHttpServer())
      .post(
        `/api/v1/pairing/${encodeURIComponent(pairing.body.code)}/authorize`,
      )
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        tailnetId: tailnet.body.id,
        profile: 'READ_ONLY',
        deviceName: 'RBAC TV',
      })
      .expect(201);

    const status = await request(app.getHttpServer())
      .get(`/api/v1/pairing/${pairing.body.pairingId}`)
      .expect(200);

    const tvAccess = status.body.tokens.accessToken as string;

    await request(app.getHttpServer())
      .get('/api/v1/tv/profile')
      .set('Authorization', `Bearer ${tvAccess}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.profile).toBe('READ_ONLY');
        expect(body.permissions.canReadDevices).toBe(true);
        expect(body.permissions.canManageDns).toBe(false);
        expect(body.permissions.canManageKeys).toBe(false);
        expect(body.permissions.canManagePolicy).toBe(false);
      });
  });

  it('OAuth mock : dashboard Tailscale via token client_credentials', async () => {
    const originalFetch = globalThis.fetch;
    const email = `dash-e2e-${Date.now()}@tailcontrol.test`;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const href =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (href.includes('/oauth/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'mock-tailscale-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (href.includes('/devices')) {
        return new Response(
          JSON.stringify({
            devices: [
              {
                id: 'device-mock-1',
                name: 'server.tailnet.ts.net',
                hostname: 'server',
                os: 'linux',
                user: 'admin@example.com',
                addresses: ['100.64.0.2'],
                authorized: true,
                lastSeen: new Date().toISOString(),
                advertisedRoutes: [],
                enabledRoutes: [],
                tags: [],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return originalFetch(input, init);
    }) as typeof fetch;

    try {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'TestPass123!', displayName: 'Dash E2E' })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPass123!' })
        .expect(201);

      const portalToken = login.body.accessToken as string;

      const tailnet = await request(app.getHttpServer())
        .post('/api/v1/tailnets')
        .set('Authorization', `Bearer ${portalToken}`)
        .send({
          name: `dash-${Date.now()}`,
          displayName: 'Dash Tailnet',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/tailnets/${tailnet.body.id}/credentials`)
        .set('Authorization', `Bearer ${portalToken}`)
        .send({
          clientId: 'kMockClient',
          clientSecret: 'tskey-client-mock-secret',
        })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/api/v1/dashboard/portal?tailnetId=${tailnet.body.id}`)
        .set('Authorization', `Bearer ${portalToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.connected).toBe(true);
          expect(body.stats.devicesTotal).toBe(1);
          expect(body.tailnet.id).toBe(tailnet.body.id);
        });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('supervision : création monitor port et exécution depuis TV', async () => {
    const email = `mon-e2e-${Date.now()}@tailcontrol.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'TestPass123!', displayName: 'Mon E2E' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123!' })
      .expect(201);

    const portalToken = login.body.accessToken as string;

    const tailnet = await request(app.getHttpServer())
      .post('/api/v1/tailnets')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        name: `mon-${Date.now()}`,
        displayName: 'Mon Tailnet',
      })
      .expect(201);

    const pairing = await request(app.getHttpServer())
      .post('/api/v1/pairing')
      .send({ installationId: `mon-${Date.now()}`, deviceName: 'Mon TV' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    await request(app.getHttpServer())
      .post(
        `/api/v1/pairing/${encodeURIComponent(pairing.body.code)}/authorize`,
      )
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        tailnetId: tailnet.body.id,
        profile: 'ADMIN',
        deviceName: 'Mon TV',
      })
      .expect(201);

    const status = await request(app.getHttpServer())
      .get(`/api/v1/pairing/${pairing.body.pairingId}`)
      .expect(200);

    const tvAccess = status.body.tokens.accessToken as string;

    const monitor = await request(app.getHttpServer())
      .post(`/api/v1/monitoring/portal?tailnetId=${tailnet.body.id}`)
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        name: 'Port Postgres',
        type: 'port',
        target: '127.0.0.1',
        config: { port: 5433 },
      })
      .expect(201);

    const run = await request(app.getHttpServer())
      .post(`/api/v1/monitoring/${monitor.body.id}/run`)
      .set('Authorization', `Bearer ${tvAccess}`)
      .expect(201);

    expect(run.body.result.status).toBe('up');
    expect(run.body.monitor.type).toBe('port');
  });

  it('agents : enregistrement portail et liste depuis TV', async () => {
    const email = `agent-e2e-${Date.now()}@tailcontrol.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'TestPass123!', displayName: 'Agent E2E' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123!' })
      .expect(201);

    const portalToken = login.body.accessToken as string;

    const tailnet = await request(app.getHttpServer())
      .post('/api/v1/tailnets')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        name: `agent-${Date.now()}`,
        displayName: 'Agent Tailnet',
      })
      .expect(201);

    const pairing = await request(app.getHttpServer())
      .post('/api/v1/pairing')
      .send({ installationId: `agent-${Date.now()}`, deviceName: 'Agent TV' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    await request(app.getHttpServer())
      .post(
        `/api/v1/pairing/${encodeURIComponent(pairing.body.code)}/authorize`,
      )
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        tailnetId: tailnet.body.id,
        profile: 'ADMIN',
        deviceName: 'Agent TV',
      })
      .expect(201);

    const status = await request(app.getHttpServer())
      .get(`/api/v1/pairing/${pairing.body.pairingId}`)
      .expect(200);

    const tvAccess = status.body.tokens.accessToken as string;

    const agent = await request(app.getHttpServer())
      .post(`/api/v1/agents/register?tailnetId=${tailnet.body.id}`)
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        name: 'Agent LAN',
        hostname: 'supervision.local',
        capabilities: ['ping', 'wol'],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(
        `/api/v1/agents/${agent.body.id}/heartbeat?tailnetId=${tailnet.body.id}`,
      )
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/agents/for-tv')
      .set('Authorization', `Bearer ${tvAccess}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.agents).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: agent.body.id,
              name: 'Agent LAN',
              status: 'online',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .post(`/api/v1/agents/${agent.body.id}/check`)
      .set('Authorization', `Bearer ${tvAccess}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.accepted).toBe(true);
      });
  });
});
