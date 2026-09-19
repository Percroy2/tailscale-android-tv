package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.DeviceFavorite
import fr.percroy.tailcontrol.domain.repository.FavoritesRepository
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

@Serializable
data class FavoriteResponse(
    val deviceId: String,
    val deviceName: String,
    val online: Boolean,
)

@Serializable
data class FavoritesListResponse(val favorites: List<FavoriteResponse>)

@Serializable
data class AddFavoriteRequest(val deviceId: String, val deviceName: String)

interface FavoritesApi {
    @GET("api/v1/favorites")
    suspend fun listFavorites(): FavoritesListResponse

    @POST("api/v1/favorites")
    suspend fun addFavorite(@Body body: AddFavoriteRequest)

    @DELETE("api/v1/favorites/{deviceId}")
    suspend fun removeFavorite(@Path("deviceId") deviceId: String)
}

class FavoritesRepositoryImpl(
    private val api: FavoritesApi,
) : FavoritesRepository {
    override suspend fun listFavorites(): List<DeviceFavorite> {
        return api.listFavorites().favorites.map {
            DeviceFavorite(it.deviceId, it.deviceName, it.online)
        }
    }

    override suspend fun addFavorite(deviceId: String, deviceName: String) {
        api.addFavorite(AddFavoriteRequest(deviceId, deviceName))
    }

    override suspend fun removeFavorite(deviceId: String) {
        api.removeFavorite(deviceId)
    }
}
