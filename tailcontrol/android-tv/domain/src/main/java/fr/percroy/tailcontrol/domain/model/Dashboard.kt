package fr.percroy.tailcontrol.domain.model

data class DashboardStats(
    val devicesTotal: Int,
    val devicesOnline: Int,
    val devicesOffline: Int,
    val exitNodes: Int,
    val subnetRouters: Int,
    val pendingApproval: Int,
    val pendingRoutes: Int,
    val expiringKeys: Int,
    val users: Int,
)

data class Dashboard(
    val tailnetName: String,
    val connected: Boolean,
    val stats: DashboardStats,
    val updatedAt: String,
)
