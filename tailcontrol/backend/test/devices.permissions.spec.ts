import { describe, expect, it } from 'vitest';
import { PermissionProfile } from '@prisma/client';
import type { TvAccessPayload } from '../src/auth/token.service.js';
import { permissionsForProfile } from '../src/auth/permissions.util.js';

describe('devices permissions', () => {
  it('read-only profile cannot modify devices', () => {
    const permissions = permissionsForProfile(PermissionProfile.READ_ONLY);
    expect(permissions.canModifyDevices).toBe(false);
    expect(permissions.canManageRoutes).toBe(false);
  });

  it('operator profile can manage routes', () => {
    const permissions = permissionsForProfile(PermissionProfile.OPERATOR);
    expect(permissions.canModifyDevices).toBe(true);
    expect(permissions.canManageRoutes).toBe(true);
  });

  it('tv payload carries permission flags', () => {
    const payload: TvAccessPayload = {
      sub: 'tv1',
      type: 'tv_access',
      tvDeviceId: 'tv1',
      tailnetId: 'tn1',
      profile: PermissionProfile.ADMIN,
      permissions: permissionsForProfile(PermissionProfile.ADMIN),
    };
    expect(payload.permissions.canManagePolicy).toBe(true);
  });
});
