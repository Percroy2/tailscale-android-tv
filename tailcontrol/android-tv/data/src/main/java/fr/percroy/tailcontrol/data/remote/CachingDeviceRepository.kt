package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.data.local.room.OfflineCacheStore
import fr.percroy.tailcontrol.domain.model.Device
import fr.percroy.tailcontrol.domain.model.DeviceFilter
import fr.percroy.tailcontrol.domain.repository.DeviceRepository
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class CachingDeviceRepository(
    private val remote: DeviceRepositoryImpl,
    private val cache: OfflineCacheStore,
    private val json: Json,
) : DeviceRepository {
    override suspend fun listDevices(filter: DeviceFilter): List<Device> {
        val cacheKey = "devices:${filter.apiValue.orEmpty()}"
        return runCatching { remote.listDevices(filter) }
            .onSuccess { devices ->
                val response = DevicesListResponse(
                    devices = devices.map { device ->
                        DeviceResponse(
                            id = device.id,
                            name = device.name,
                            hostname = device.hostname,
                            os = device.os,
                            user = device.user,
                            ipv4 = device.ipv4,
                            ipv6 = device.ipv6,
                            online = device.online,
                            lastSeen = device.lastSeen,
                            tags = device.tags,
                            authorized = device.authorized,
                            expires = device.expires,
                            keyExpiryDisabled = device.keyExpiryDisabled,
                            isExitNode = device.isExitNode,
                            isSubnetRouter = device.isSubnetRouter,
                            pendingRoutes = device.pendingRoutes,
                            advertisedRoutes = device.advertisedRoutes,
                            enabledRoutes = device.enabledRoutes,
                            dnsName = device.dnsName,
                            clientVersion = device.clientVersion,
                            createdAt = device.createdAt,
                        )
                    },
                )
                cache.put(cacheKey, json.encodeToString(response))
            }
            .getOrElse {
                val cached = cache.get(cacheKey) { payload ->
                    json.decodeFromString<DevicesListResponse>(payload)
                }
                cached?.devices?.map(::toDomain) ?: throw it
            }
    }

    override suspend fun getDevice(deviceId: String): Device {
        val cacheKey = "device:$deviceId"
        return runCatching { remote.getDevice(deviceId) }
            .onSuccess { device ->
                cache.put(cacheKey, json.encodeToString(toResponse(device)))
            }
            .getOrElse {
                val cached = cache.get(cacheKey) { payload ->
                    json.decodeFromString<DeviceResponse>(payload)
                }
                cached?.let(::toDomain) ?: throw it
            }
    }

    override suspend fun authorizeDevice(deviceId: String) {
        remote.authorizeDevice(deviceId)
    }

    override suspend fun revokeDevice(deviceId: String) {
        remote.revokeDevice(deviceId)
    }

    override suspend fun approveRoute(deviceId: String, route: String) {
        remote.approveRoute(deviceId, route)
    }

    private fun toResponse(device: Device) = DeviceResponse(
        id = device.id,
        name = device.name,
        hostname = device.hostname,
        os = device.os,
        user = device.user,
        ipv4 = device.ipv4,
        ipv6 = device.ipv6,
        online = device.online,
        lastSeen = device.lastSeen,
        tags = device.tags,
        authorized = device.authorized,
        expires = device.expires,
        keyExpiryDisabled = device.keyExpiryDisabled,
        isExitNode = device.isExitNode,
        isSubnetRouter = device.isSubnetRouter,
        pendingRoutes = device.pendingRoutes,
        advertisedRoutes = device.advertisedRoutes,
        enabledRoutes = device.enabledRoutes,
        dnsName = device.dnsName,
        clientVersion = device.clientVersion,
        createdAt = device.createdAt,
    )

    private fun toDomain(response: DeviceResponse) = Device(
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
