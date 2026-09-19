package fr.percroy.tailcontrol.domain.model

data class Device(
    val id: String,
    val name: String,
    val hostname: String,
    val os: String,
    val user: String,
    val ipv4: String?,
    val ipv6: String?,
    val online: Boolean,
    val lastSeen: String?,
    val tags: List<String>,
    val authorized: Boolean,
    val expires: String?,
    val keyExpiryDisabled: Boolean,
    val isExitNode: Boolean,
    val isSubnetRouter: Boolean,
    val pendingRoutes: List<String>,
    val advertisedRoutes: List<String>,
    val enabledRoutes: List<String>,
    val dnsName: String?,
    val clientVersion: String?,
    val createdAt: String?,
)

enum class DeviceFilter(val apiValue: String?, val label: String) {
    ALL(null, "Tous"),
    ONLINE("online", "En ligne"),
    OFFLINE("offline", "Hors ligne"),
    PENDING("pending", "À approuver"),
    EXIT_NODES("exit-nodes", "Exit Nodes"),
    SUBNET_ROUTERS("subnet-routers", "Subnet Routers"),
    LINUX("linux", "Linux"),
    WINDOWS("windows", "Windows"),
}
