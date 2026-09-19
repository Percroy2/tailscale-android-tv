package fr.percroy.tailcontrol.domain.model

data class PermissionFlags(
    val canReadDevices: Boolean = true,
    val canModifyDevices: Boolean = false,
    val canDeleteDevices: Boolean = false,
    val canManageRoutes: Boolean = false,
    val canManageDns: Boolean = false,
    val canManageUsers: Boolean = false,
    val canManageKeys: Boolean = false,
    val canManagePolicy: Boolean = false,
)

data class TvProfile(
    val tvDeviceId: String,
    val tailnetId: String,
    val profile: String,
    val permissions: PermissionFlags,
)

data class TailnetSummary(
    val id: String,
    val name: String,
    val displayName: String,
    val profile: String,
)

data class DnsConfig(
    val nameservers: List<String>,
    val magicDns: Boolean,
    val searchPaths: List<String>,
)

data class AuthKeyItem(
    val id: String,
    val key: String,
    val description: String,
    val created: String,
    val expires: String?,
    val revoked: Boolean,
    val reusable: Boolean,
    val ephemeral: Boolean,
)

data class PolicyDocument(
    val aclJson: String,
    val updatedAt: String?,
)
