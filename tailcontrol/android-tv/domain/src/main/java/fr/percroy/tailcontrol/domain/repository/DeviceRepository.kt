package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.Device
import fr.percroy.tailcontrol.domain.model.DeviceFilter

interface DeviceRepository {
    suspend fun listDevices(filter: DeviceFilter = DeviceFilter.ALL): List<Device>
    suspend fun getDevice(deviceId: String): Device
    suspend fun authorizeDevice(deviceId: String)
    suspend fun revokeDevice(deviceId: String)
    suspend fun approveRoute(deviceId: String, route: String)
}
