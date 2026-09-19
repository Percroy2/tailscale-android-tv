package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.Device
import fr.percroy.tailcontrol.domain.model.DeviceFilter
import fr.percroy.tailcontrol.domain.repository.DeviceRepository
import kotlinx.serialization.Serializable
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

@Serializable
data class DeviceResponse(
    val id: String,
    val name: String,
    val hostname: String,
    val os: String,
    val user: String,
    val ipv4: String? = null,
    val ipv6: String? = null,
    val online: Boolean,
    val lastSeen: String? = null,
    val tags: List<String> = emptyList(),
    val authorized: Boolean,
    val expires: String? = null,
    val keyExpiryDisabled: Boolean = false,
    val isExitNode: Boolean = false,
    val isSubnetRouter: Boolean = false,
    val pendingRoutes: List<String> = emptyList(),
    val advertisedRoutes: List<String> = emptyList(),
    val enabledRoutes: List<String> = emptyList(),
    val dnsName: String? = null,
    val clientVersion: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class DevicesListResponse(
    val devices: List<DeviceResponse>,
)

interface DevicesApi {
    @GET("api/v1/devices")
    suspend fun listDevices(@Query("filter") filter: String? = null): DevicesListResponse

    @GET("api/v1/devices/{id}")
    suspend fun getDevice(@Path("id") deviceId: String): DeviceResponse

    @POST("api/v1/devices/{id}/authorize")
    suspend fun authorizeDevice(@Path("id") deviceId: String)

    @POST("api/v1/devices/{id}/revoke")
    suspend fun revokeDevice(@Path("id") deviceId: String)

    @POST("api/v1/devices/{id}/routes/{route}/approve")
    suspend fun approveRoute(
        @Path("id") deviceId: String,
        @Path("route") route: String,
    )
}

class DeviceRepositoryImpl(
    private val api: DevicesApi,
) : DeviceRepository {
    override suspend fun listDevices(filter: DeviceFilter): List<Device> {
        return api.listDevices(filter.apiValue).devices.map(::toDomain)
    }

    override suspend fun getDevice(deviceId: String): Device {
        return toDomain(api.getDevice(deviceId))
    }

    override suspend fun authorizeDevice(deviceId: String) {
        api.authorizeDevice(deviceId)
    }

    override suspend fun revokeDevice(deviceId: String) {
        api.revokeDevice(deviceId)
    }

    override suspend fun approveRoute(deviceId: String, route: String) {
        api.approveRoute(deviceId, route)
    }

    private fun toDomain(response: DeviceResponse): Device {
        return Device(
            id = response.id,
            name = response.name,
            hostname = response.hostname,
            os = response.os,
            user = response.user,
            ipv4 = response.ipv4,
            ipv6 = response.ipv6,
            online = response.online,
            lastSeen = response.lastSeen,
            tags = response.tags,
            authorized = response.authorized,
            expires = response.expires,
            keyExpiryDisabled = response.keyExpiryDisabled,
            isExitNode = response.isExitNode,
            isSubnetRouter = response.isSubnetRouter,
            pendingRoutes = response.pendingRoutes,
            advertisedRoutes = response.advertisedRoutes,
            enabledRoutes = response.enabledRoutes,
            dnsName = response.dnsName,
            clientVersion = response.clientVersion,
            createdAt = response.createdAt,
        )
    }
}
