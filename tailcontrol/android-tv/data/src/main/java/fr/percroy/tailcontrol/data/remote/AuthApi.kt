package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.TvSession
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.POST

@Serializable
data class RefreshTokenRequest(val refreshToken: String)

@Serializable
data class RefreshTokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Int,
    val tokenType: String,
)

interface AuthApi {
    @POST("api/v1/auth/refresh")
    suspend fun refresh(@Body body: RefreshTokenRequest): RefreshTokenResponse
}

suspend fun AuthApi.refreshSession(refreshToken: String): TvSession {
    val response = refresh(RefreshTokenRequest(refreshToken))
    return TvSession(response.accessToken, response.refreshToken)
}
