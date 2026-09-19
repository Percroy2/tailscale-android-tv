#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const androidDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'android-tv');
const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

const result = spawnSync(gradle, ['assembleDebug', '--no-daemon'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
