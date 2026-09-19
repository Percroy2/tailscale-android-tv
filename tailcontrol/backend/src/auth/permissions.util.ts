import { PermissionProfile } from '@prisma/client';

export interface PermissionFlags {
  canReadDevices: boolean;
  canModifyDevices: boolean;
  canDeleteDevices: boolean;
  canManageRoutes: boolean;
  canManageDns: boolean;
  canManageUsers: boolean;
  canManageKeys: boolean;
  canManagePolicy: boolean;
}

export function permissionsForProfile(
  profile: PermissionProfile,
  custom?: Partial<PermissionFlags>,
): PermissionFlags {
  if (profile === PermissionProfile.CUSTOM && custom) {
    return {
      canReadDevices: custom.canReadDevices ?? true,
      canModifyDevices: custom.canModifyDevices ?? false,
      canDeleteDevices: custom.canDeleteDevices ?? false,
      canManageRoutes: custom.canManageRoutes ?? false,
      canManageDns: custom.canManageDns ?? false,
      canManageUsers: custom.canManageUsers ?? false,
      canManageKeys: custom.canManageKeys ?? false,
      canManagePolicy: custom.canManagePolicy ?? false,
    };
  }

  if (profile === PermissionProfile.ADMIN) {
    return {
      canReadDevices: true,
      canModifyDevices: true,
      canDeleteDevices: true,
      canManageRoutes: true,
      canManageDns: true,
      canManageUsers: true,
      canManageKeys: true,
      canManagePolicy: true,
    };
  }

  if (profile === PermissionProfile.OPERATOR) {
    return {
      canReadDevices: true,
      canModifyDevices: true,
      canDeleteDevices: false,
      canManageRoutes: true,
      canManageDns: false,
      canManageUsers: false,
      canManageKeys: false,
      canManagePolicy: false,
    };
  }

  return {
    canReadDevices: true,
    canModifyDevices: false,
    canDeleteDevices: false,
    canManageRoutes: false,
    canManageDns: false,
    canManageUsers: false,
    canManageKeys: false,
    canManagePolicy: false,
  };
}
