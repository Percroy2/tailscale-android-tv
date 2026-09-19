package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.ExitNode
import fr.percroy.tailcontrol.domain.model.RouteEntry
import fr.percroy.tailcontrol.domain.model.TailnetUser
import fr.percroy.tailcontrol.domain.repository.NetworkRepository
import kotlinx.serialization.Serializable
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

@Serializable
data class RouteEntryResponse(
    val deviceId: String,
    val deviceName: String,
    val route: String,
    val approved: Boolean,
    val online: Boolean,
)

@Serializable
data class RoutesListResponse(val routes: List<RouteEntryResponse>)

@Serializable
data class ExitNodeResponse(
    val id: String,
    val name: String,
    val ipv4: String? = null,
    val online: Boolean,
    val user: String,
    val os: String,
    val lastSeen: String? = null,
    val authorized: Boolean,
)

@Serializable
data class ExitNodesListResponse(val exitNodes: List<ExitNodeResponse>)

@Serializable
data class TailnetUserResponse(
    val id: String,
    val displayName: String,
    val loginName: String,
    val role: String,
    val status: String,
    val type: String,
    val deviceCount: Int = 0,
    val lastSeen: String? = null,
    val currentlyConnected: Boolean = false,
)

@Serializable
data class UsersListResponse(val users: List<TailnetUserResponse>)

interface NetworkApi {
    @GET("api/v1/routes")
    suspend fun listRoutes(): RoutesListResponse

    @GET("api/v1/exit-nodes")
    suspend fun listExitNodes(): ExitNodesListResponse

    @GET("api/v1/users")
    suspend fun listUsers(): UsersListResponse

    @POST("api/v1/users/{id}/approve")
    suspend fun approveUser(@Path("id") userId: String)

    @POST("api/v1/users/{id}/suspend")
    suspend fun suspendUser(@Path("id") userId: String)

    @POST("api/v1/users/{id}/restore")
    suspend fun restoreUser(@Path("id") userId: String)
}

class NetworkRepositoryImpl(
    private val api: NetworkApi,
) : NetworkRepository {
    override suspend fun listRoutes(): List<RouteEntry> {
        return api.listRoutes().routes.map {
            RouteEntry(it.deviceId, it.deviceName, it.route, it.approved, it.online)
        }
    }

    override suspend fun listExitNodes(): List<ExitNode> {
        return api.listExitNodes().exitNodes.map {
            ExitNode(it.id, it.name, it.ipv4, it.online, it.user, it.os, it.lastSeen, it.authorized)
        }
    }

    override suspend fun listUsers(): List<TailnetUser> {
        return api.listUsers().users.map {
            TailnetUser(
                it.id,
                it.displayName,
                it.loginName,
                it.role,
                it.status,
                it.type,
                it.deviceCount,
                it.lastSeen,
                it.currentlyConnected,
            )
        }
    }

    override suspend fun approveUser(userId: String) {
        api.approveUser(userId)
    }

    override suspend fun suspendUser(userId: String) {
        api.suspendUser(userId)
    }

    override suspend fun restoreUser(userId: String) {
        api.restoreUser(userId)
    }
}
