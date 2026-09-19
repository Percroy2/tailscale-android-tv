import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://tailcontrol:tailcontrol@localhost:5433/tailcontrol',
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6380',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'e2e-access-secret',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'e2e-refresh-secret',
      MASTER_ENCRYPTION_KEY:
        process.env.MASTER_ENCRYPTION_KEY ?? 'e2e-master-key-for-tests-only!!',
      WEB_BASE_URL: process.env.WEB_BASE_URL ?? 'http://localhost:5173',
    },
  },
});
