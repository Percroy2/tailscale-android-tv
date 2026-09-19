import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module.js';

describe('WebSocket révocation (e2e)', () => {
  let app: INestApplication;
  let port: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address();
    port =
      typeof address === 'object' && address !== null ? address.port : 3000;
  });

  afterEach(async () => {
    await app.close();
  });

  it('émet session_revoked sur le canal tv après révocation portail', async () => {
    const email = `ws-e2e-${Date.now()}@tailcontrol.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'TestPass123!', displayName: 'WS E2E' })
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
        name: `ws-${Date.now()}`,
        displayName: 'WS Tailnet',
      })
      .expect(201);

    const pairing = await request(app.getHttpServer())
      .post('/api/v1/pairing')
      .send({ installationId: `ws-${Date.now()}`, deviceName: 'WS TV' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    const { code, pairingId } = pairing.body as {
      code: string;
      pairingId: string;
    };

    await request(app.getHttpServer())
      .post(`/api/v1/pairing/${encodeURIComponent(code)}/authorize`)
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        tailnetId: tailnet.body.id,
        profile: 'ADMIN',
        deviceName: 'WS TV',
      })
      .expect(201);

    const status = await request(app.getHttpServer())
      .get(`/api/v1/pairing/${pairingId}`)
      .expect(200);

    const tvAccess = status.body.tokens.accessToken as string;
    const tvDeviceId = status.body.device.id as string;

    const socket: Socket = io(`http://127.0.0.1:${port}/ws`, {
      auth: { token: tvAccess },
      transports: ['websocket'],
      forceNew: true,
    });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket timeout')), 8000);
      socket.on('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });

    const revoked = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('session_revoked timeout')),
        8000,
      );
      socket.on('session_revoked', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    await request(app.getHttpServer())
      .post(`/api/v1/tvs/${tvDeviceId}/revoke`)
      .query({ tailnetId: tailnet.body.id })
      .set('Authorization', `Bearer ${portalToken}`)
      .expect(201);

    await revoked;
    socket.disconnect();
  });
});
