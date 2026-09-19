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
});
