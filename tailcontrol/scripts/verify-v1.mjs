#!/usr/bin/env node
/**
 * Vérification TailControl TV v1.0 — gates automatisées locales.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const requiredPaths = [
  'android-tv/gradlew',
  'android-tv/gradle/wrapper/gradle-wrapper.jar',
  'android-tv/presentation/src/main/java/fr/percroy/tailcontrol/presentation/monitoring/MonitoringScreen.kt',
  'backend/test/validation.s86.spec.ts',
  'web/package.json',
  'infrastructure/docker/docker-compose.yml',
  'infrastructure/scripts/smoke-stack.mjs',
  '.github/workflows/ci.yml',
];

const repoRoot = join(root, '..');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('TailControl TV v1.0 — verify\n');

let missing = 0;
for (const relative of requiredPaths) {
  const full = relative.startsWith('.github')
    ? join(repoRoot, relative)
    : join(root, relative);
  const ok = existsSync(full);
  console.log(`${ok ? '✓' : '✗'} ${relative}`);
  if (!ok) {
    missing += 1;
  }
}

if (missing > 0) {
  console.error(`\n${missing} artefact(s) manquant(s).`);
  process.exit(1);
}

console.log('\n→ Tests backend (§86 + E2E)...');
run('npm', ['run', 'test:all'], root);

console.log('\nVerify OK — prêt pour commit / CI / Docker smoke (npm run smoke).');
