import { describe, expect, it } from 'vitest';
import { PermissionProfile } from '@prisma/client';
import { permissionsForProfile } from '../src/auth/permissions.util.js';

describe('permissionsForProfile', () => {
  it('grants read-only permissions', () => {
    const flags = permissionsForProfile(PermissionProfile.READ_ONLY);
    expect(flags.canReadDevices).toBe(true);
    expect(flags.canModifyDevices).toBe(false);
    expect(flags.canManageRoutes).toBe(false);
  });

  it('grants admin permissions', () => {
    const flags = permissionsForProfile(PermissionProfile.ADMIN);
    expect(flags.canManageDns).toBe(true);
    expect(flags.canManagePolicy).toBe(true);
  });

  it('grants operator route permissions', () => {
    const flags = permissionsForProfile(PermissionProfile.OPERATOR);
    expect(flags.canManageRoutes).toBe(true);
    expect(flags.canDeleteDevices).toBe(false);
  });
});
