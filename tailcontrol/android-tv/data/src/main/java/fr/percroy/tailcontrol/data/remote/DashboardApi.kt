package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.Dashboard
import fr.percroy.tailcontrol.domain.model.DashboardStats
import fr.percroy.tailcontrol.domain.repository.DashboardRepository
import kotlinx.serialization.Serializable
import retrofit2.http.GET

@Serializable
data class DashboardStatsResponse(
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

@Serializable
data class DashboardTailnetResponse(
    val id: String,
    val name: String,
    val displayName: String,
)

@Serializable
data class DashboardResponse(
    val tailnet: DashboardTailnetResponse,
    val connected: Boolean,
    val stats: DashboardStatsResponse,
    val updatedAt: String,
)

interface DashboardApi {
    @GET("api/v1/dashboard")
    suspend fun getDashboard(): DashboardResponse
}

class DashboardRepositoryImpl(
    private val api: DashboardApi,
) : DashboardRepository {
    override suspend fun getDashboard(): Dashboard {
        val response = api.getDashboard()
        return Dashboard(
            tailnetName = response.tailnet.displayName,
            connected = response.connected,
            stats = DashboardStats(
                devicesTotal = response.stats.devicesTotal,
                devicesOnline = response.stats.devicesOnline,
                devicesOffline = response.stats.devicesOffline,
                exitNodes = response.stats.exitNodes,
                subnetRouters = response.stats.subnetRouters,
                pendingApproval = response.stats.pendingApproval,
                pendingRoutes = response.stats.pendingRoutes,
                expiringKeys = response.stats.expiringKeys,
                users = response.stats.users,
            ),
            updatedAt = response.updatedAt,
        )
    }
}
