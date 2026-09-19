/**
 * Validation §86 — 34 critères TailControl TV v1.0
 * Vérifie la présence des artefacts et modules requis par le cahier des charges.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TC = join(import.meta.dirname, '..', '..');

function pathExists(relative: string): boolean {
  return existsSync(join(TC, relative));
}

function fileContains(relative: string, needle: string): boolean {
  if (!pathExists(relative)) {
    return false;
  }
  return readFileSync(join(TC, relative), 'utf8').includes(needle);
}

const CRITERIA: Array<{
  id: number;
  name: string;
  check: () => boolean;
}> = [
  { id: 1, name: 'Monorepo tailcontrol/', check: () => existsSync(TC) },
  {
    id: 2,
    name: 'App Android TV (modules Gradle + wrapper)',
    check: () =>
      pathExists('android-tv/app/build.gradle.kts') &&
      pathExists('android-tv/presentation/build.gradle.kts') &&
      pathExists('android-tv/gradlew') &&
      pathExists('android-tv/gradle/wrapper/gradle-wrapper.jar'),
  },
  {
    id: 3,
    name: 'Architecture MVVM Android',
    check: () =>
      pathExists('android-tv/presentation/src/main/java/fr/percroy/tailcontrol/presentation/dashboard/DashboardViewModel.kt') &&
      pathExists('android-tv/domain/src/main/java/fr/percroy/tailcontrol/domain/repository/DashboardRepository.kt'),
  },
  {
    id: 4,
    name: 'Room cache offline',
    check: () =>
      pathExists('android-tv/data/src/main/java/fr/percroy/tailcontrol/data/local/room/TailControlDatabase.kt') &&
      fileContains('android-tv/data/src/main/java/fr/percroy/tailcontrol/data/ServiceLocator.kt', 'CachingDashboardRepository'),
  },
  {
    id: 5,
    name: 'Keystore session chiffrée',
    check: () =>
      fileContains(
        'android-tv/data/src/main/java/fr/percroy/tailcontrol/data/local/SecureSessionRepository.kt',
        'EncryptedSharedPreferences',
      ),
  },
  {
    id: 6,
    name: 'Backend NestJS',
    check: () => pathExists('backend/src/main.ts') && pathExists('backend/src/app.module.ts'),
  },
  {
    id: 7,
    name: 'PostgreSQL + Prisma',
    check: () =>
      pathExists('backend/prisma/schema.prisma') &&
      fileContains('backend/prisma/schema.prisma', 'provider = "postgresql"'),
  },
  {
    id: 8,
    name: 'Redis',
    check: () => pathExists('backend/src/common/redis/redis.service.ts'),
  },
  {
    id: 9,
    name: 'WebSocket temps réel',
    check: () => pathExists('backend/src/websocket/events.gateway.ts'),
  },
  {
    id: 10,
    name: 'JWT TV + Portail + refresh token',
    check: () =>
      pathExists('backend/src/auth/tv-auth.guard.ts') &&
      pathExists('backend/src/auth/portal-auth.guard.ts') &&
      fileContains(
        'android-tv/data/src/main/java/fr/percroy/tailcontrol/data/remote/AuthInterceptor.kt',
        'TokenAuthenticator',
      ),
  },
  {
    id: 11,
    name: 'OAuth Tailscale chiffré AES-256-GCM',
    check: () =>
      pathExists('backend/src/common/crypto/encryption.service.ts') &&
      fileContains('backend/src/common/crypto/encryption.service.ts', 'aes-256-gcm') &&
      pathExists('backend/test/encryption.service.spec.ts'),
  },
  {
    id: 12,
    name: 'Portail Web React + Tailwind',
    check: () =>
      pathExists('web/package.json') &&
      fileContains('web/package.json', 'tailwindcss'),
  },
  {
    id: 13,
    name: 'Infrastructure Docker',
    check: () => pathExists('infrastructure/docker/docker-compose.yml'),
  },
  {
    id: 14,
    name: 'Jumelage QR code TV',
    check: () => pathExists('android-tv/presentation/src/main/java/fr/percroy/tailcontrol/presentation/pairing/QrCodeImage.kt'),
  },
  {
    id: 15,
    name: 'Jumelage par code',
    check: () => pathExists('backend/src/pairing/pairing.controller.ts'),
  },
  {
    id: 16,
    name: 'Multi-TV révocation portail',
    check: () => pathExists('backend/src/tvs/tvs.controller.ts'),
  },
  {
    id: 17,
    name: 'Multi-Tailnet switch TV',
    check: () => pathExists('backend/src/tv/tv.controller.ts'),
  },
  {
    id: 18,
    name: 'RBAC par profil + menu TV filtré',
    check: () =>
      fileContains('backend/src/auth/permissions.util.ts', 'PermissionProfile.ADMIN') &&
      pathExists(
        'android-tv/presentation/src/main/java/fr/percroy/tailcontrol/presentation/compliance/NavPermissions.kt',
      ),
  },
  {
    id: 19,
    name: 'Dashboard TV + portail',
    check: () =>
      pathExists('backend/src/dashboard/dashboard.controller.ts') &&
      pathExists('android-tv/presentation/src/main/java/fr/percroy/tailcontrol/presentation/dashboard/DashboardScreen.kt'),
  },
  {
    id: 20,
    name: 'Machines CRUD + actions',
    check: () => pathExists('backend/src/devices/devices.controller.ts'),
  },
  {
    id: 21,
    name: 'Routes subnet',
    check: () => pathExists('backend/src/routes/routes.controller.ts'),
  },
  {
    id: 22,
    name: 'Exit nodes',
    check: () => fileContains('backend/src/routes/routes.controller.ts', 'exit-nodes'),
  },
  {
    id: 23,
    name: 'Utilisateurs Tailnet',
    check: () => pathExists('backend/src/users/users.controller.ts'),
  },
  {
    id: 24,
    name: 'DNS Tailnet',
    check: () => pathExists('backend/src/dns/dns.controller.ts'),
  },
  {
    id: 25,
    name: 'Auth keys',
    check: () => pathExists('backend/src/auth-keys/auth-keys.controller.ts'),
  },
  {
    id: 26,
    name: 'Politique ACL',
    check: () => pathExists('backend/src/policy/policy.controller.ts'),
  },
  {
    id: 27,
    name: 'Alertes + génération auto + push WebSocket TV',
    check: () =>
      pathExists('backend/src/alerts/alert-generator.service.ts') &&
      pathExists('backend/src/alerts/alerts.controller.ts') &&
      fileContains(
        'android-tv/data/src/main/java/fr/percroy/tailcontrol/data/websocket/AlertNotifier.kt',
        'AlertNotifier',
      ),
  },
  {
    id: 28,
    name: 'Audit logs TV',
    check: () =>
      pathExists('backend/src/audit/audit.controller.ts') &&
      pathExists(
        'android-tv/presentation/src/main/java/fr/percroy/tailcontrol/presentation/audit/AuditScreen.kt',
      ),
  },
  {
    id: 29,
    name: 'Fil activité TV',
    check: () =>
      pathExists('backend/src/activity/activity.controller.ts') &&
      pathExists(
        'android-tv/presentation/src/main/java/fr/percroy/tailcontrol/presentation/activity/ActivityScreen.kt',
      ),
  },
  {
    id: 30,
    name: 'Supervision ping/port/HTTP/WoL + écran TV',
    check: () =>
      pathExists('backend/src/monitoring/monitoring.service.ts') &&
      fileContains('backend/src/monitoring/monitoring.service.ts', 'sendWakeOnLan') &&
      pathExists(
        'android-tv/presentation/src/main/java/fr/percroy/tailcontrol/presentation/monitoring/MonitoringScreen.kt',
      ),
  },
  {
    id: 31,
    name: 'Agents supervision',
    check: () => pathExists('backend/src/agents/agents.controller.ts'),
  },
  {
    id: 32,
    name: 'Favoris machines',
    check: () => pathExists('backend/src/favorites/favorites.controller.ts'),
  },
  {
    id: 33,
    name: 'PIN administrateur TV',
    check: () => pathExists('android-tv/data/src/main/java/fr/percroy/tailcontrol/data/local/AdminPinStore.kt'),
  },
  {
    id: 34,
    name: 'Révocation immédiate WebSocket',
    check: () =>
      fileContains('backend/src/websocket/events.gateway.ts', 'session_revoked') &&
      fileContains('backend/src/auth/tv-auth.guard.ts', 'revokedAt') &&
      fileContains('android-tv/app/src/main/java/fr/percroy/tailcontrol/MainActivity.kt', 'SessionEvent.Revoked') &&
      fileContains(
        'android-tv/data/src/main/java/fr/percroy/tailcontrol/data/websocket/RefreshNotifier.kt',
        'RefreshNotifier',
      ),
  },
];

describe('Validation §86 — 34 critères TailControl TV v1.0', () => {
  for (const criterion of CRITERIA) {
    it(`#${criterion.id} — ${criterion.name}`, () => {
      expect(criterion.check(), `Critère ${criterion.id} non satisfait`).toBe(true);
    });
  }

  it('résumé : 34/34 critères structurels', () => {
    const passed = CRITERIA.filter((c) => c.check()).length;
    expect(passed).toBe(34);
  });
});
