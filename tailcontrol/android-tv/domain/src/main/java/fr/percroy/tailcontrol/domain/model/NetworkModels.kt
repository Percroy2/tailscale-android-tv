package fr.percroy.tailcontrol.domain.model

data class RouteEntry(
    val deviceId: String,
    val deviceName: String,
    val route: String,
    val approved: Boolean,
    val online: Boolean,
)

data class ExitNode(
    val id: String,
    val name: String,
    val ipv4: String?,
    val online: Boolean,
    val user: String,
    val os: String,
    val lastSeen: String?,
    val authorized: Boolean,
)

data class TailnetUser(
    val id: String,
    val displayName: String,
    val loginName: String,
    val role: String,
    val status: String,
    val type: String,
    val deviceCount: Int,
    val lastSeen: String?,
    val currentlyConnected: Boolean,
)
