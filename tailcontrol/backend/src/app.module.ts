import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppInfoModule } from './app/app-info.module.js';
import { ActivityModule } from './activity/activity.module.js';
import { AgentsModule } from './agents/agents.module.js';
import { AlertsModule } from './alerts/alerts.module.js';
import { AuditLogModule } from './common/audit/audit-log.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthKeysModule } from './auth-keys/auth-keys.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { DnsModule } from './dns/dns.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { MonitoringModule } from './monitoring/monitoring.module.js';
import { PairingModule } from './pairing/pairing.module.js';
import { PolicyModule } from './policy/policy.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { RoutesModule } from './routes/routes.module.js';
import { TailnetsModule } from './tailnets/tailnets.module.js';
import { TailscaleModule } from './tailscale/tailscale.module.js';
import { TvsModule } from './tvs/tvs.module.js';
import { TvModule } from './tv/tv.module.js';
import { UsersModule } from './users/users.module.js';
import { WebsocketModule } from './websocket/websocket.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    CryptoModule,
    AuditLogModule,
    AppInfoModule,
    AuthModule,
    PairingModule,
    TailnetsModule,
    TailscaleModule,
    DashboardModule,
    DevicesModule,
    RoutesModule,
    UsersModule,
    AlertsModule,
    WebsocketModule,
    DnsModule,
    AuthKeysModule,
    PolicyModule,
    MonitoringModule,
    AuditModule,
    ActivityModule,
    TvsModule,
    TvModule,
    AgentsModule,
    FavoritesModule,
  ],
})
export class AppModule {}
