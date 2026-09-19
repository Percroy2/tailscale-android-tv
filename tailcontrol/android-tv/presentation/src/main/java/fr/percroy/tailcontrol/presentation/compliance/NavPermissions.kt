package fr.percroy.tailcontrol.presentation.compliance

import fr.percroy.tailcontrol.domain.model.PermissionFlags

object NavPermissions {
    fun canShowRoutes(permissions: PermissionFlags) = permissions.canReadDevices

    fun canShowUsers(permissions: PermissionFlags) =
        permissions.canManageUsers || permissions.canModifyDevices

    fun canShowDns(permissions: PermissionFlags) = permissions.canManageDns

    fun canShowAuthKeys(permissions: PermissionFlags) = permissions.canManageKeys

    fun canShowPolicy(permissions: PermissionFlags) = permissions.canManagePolicy
}
