package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.DeviceFavorite

interface FavoritesRepository {
    suspend fun listFavorites(): List<DeviceFavorite>
    suspend fun addFavorite(deviceId: String, deviceName: String)
    suspend fun removeFavorite(deviceId: String)
}
