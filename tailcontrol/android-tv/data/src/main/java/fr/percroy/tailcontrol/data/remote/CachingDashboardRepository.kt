package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.data.local.room.OfflineCacheStore
import fr.percroy.tailcontrol.domain.model.Dashboard
import fr.percroy.tailcontrol.domain.model.DashboardStats
import fr.percroy.tailcontrol.domain.repository.DashboardRepository
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private const val CACHE_KEY = "dashboard"

class CachingDashboardRepository(
    private val remote: DashboardRepositoryImpl,
    private val cache: OfflineCacheStore,
    private val json: Json,
) : DashboardRepository {
    override suspend fun getDashboard(): Dashboard {
        return runCatching { remote.getDashboard() }
            .onSuccess { dashboard ->
                val response = DashboardResponse(
                    tailnet = DashboardTailnetResponse("", "", dashboard.tailnetName),
                    connected = dashboard.connected,
                    stats = DashboardStatsResponse(
                        devicesTotal = dashboard.stats.devicesTotal,
                        devicesOnline = dashboard.stats.devicesOnline,
                        devicesOffline = dashboard.stats.devicesOffline,
                        exitNodes = dashboard.stats.exitNodes,
                        subnetRouters = dashboard.stats.subnetRouters,
                        pendingApproval = dashboard.stats.pendingApproval,
                        pendingRoutes = dashboard.stats.pendingRoutes,
                        expiringKeys = dashboard.stats.expiringKeys,
                        users = dashboard.stats.users,
                    ),
                    updatedAt = dashboard.updatedAt,
                )
                cache.put(CACHE_KEY, json.encodeToString(response))
            }
            .getOrElse {
                val cached = cache.get(CACHE_KEY) { payload ->
                    json.decodeFromString<DashboardResponse>(payload)
                }
                cached?.toDomain() ?: throw it
            }
    }

    private fun DashboardResponse.toDomain() = Dashboard(
        tailnetName = tailnet.displayName,
        connected = connected,
        stats = DashboardStats(
            devicesTotal = stats.devicesTotal,
            devicesOnline = stats.devicesOnline,
            devicesOffline = stats.devicesOffline,
            exitNodes = stats.exitNodes,
            subnetRouters = stats.subnetRouters,
            pendingApproval = stats.pendingApproval,
            pendingRoutes = stats.pendingRoutes,
            expiringKeys = stats.expiringKeys,
            users = stats.users,
        ),
        updatedAt = updatedAt,
    )
}
