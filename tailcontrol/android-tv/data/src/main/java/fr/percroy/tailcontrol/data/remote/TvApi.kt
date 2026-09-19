package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.PermissionFlags
import fr.percroy.tailcontrol.domain.model.TailnetSummary
import fr.percroy.tailcontrol.domain.model.TvProfile
import fr.percroy.tailcontrol.domain.model.TvSession
import fr.percroy.tailcontrol.domain.repository.TvSessionRepository
import kotlinx.serialization.Serializable
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

@Serializable
data class PermissionFlagsResponse(
    val canReadDevices: Boolean = true,
    val canModifyDevices: Boolean = false,
    val canDeleteDevices: Boolean = false,
    val canManageRoutes: Boolean = false,
    val canManageDns: Boolean = false,
    val canManageUsers: Boolean = false,
    val canManageKeys: Boolean = false,
    val canManagePolicy: Boolean = false,
)

@Serializable
data class TvProfileResponse(
    val tvDeviceId: String,
    val tailnetId: String,
    val profile: String,
    val permissions: PermissionFlagsResponse,
)

@Serializable
data class TailnetSummaryResponse(
    val id: String,
    val name: String,
    val displayName: String,
    val profile: String,
)

@Serializable
data class TailnetsListResponse(val tailnets: List<TailnetSummaryResponse>)

@Serializable
data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Int,
    val tokenType: String,
)

interface TvApi {
    @GET("api/v1/tv/profile")
    suspend fun getProfile(): TvProfileResponse

    @GET("api/v1/tv/tailnets")
    suspend fun listTailnets(): TailnetsListResponse

    @POST("api/v1/tv/tailnets/{tailnetId}/switch")
    suspend fun switchTailnet(@Path("tailnetId") tailnetId: String): TokenResponse
}

class TvSessionRepositoryImpl(
    private val api: TvApi,
) : TvSessionRepository {
    override suspend fun getProfile(): TvProfile {
        val response = api.getProfile()
        return TvProfile(
            tvDeviceId = response.tvDeviceId,
            tailnetId = response.tailnetId,
            profile = response.profile,
            permissions = response.permissions.toDomain(),
        )
    }

    override suspend fun listTailnets(): List<TailnetSummary> {
        return api.listTailnets().tailnets.map {
            TailnetSummary(it.id, it.name, it.displayName, it.profile)
        }
    }

    override suspend fun switchTailnet(tailnetId: String): TvSession {
        val tokens = api.switchTailnet(tailnetId)
        return TvSession(tokens.accessToken, tokens.refreshToken)
    }

    private fun PermissionFlagsResponse.toDomain() = PermissionFlags(
        canReadDevices = canReadDevices,
        canModifyDevices = canModifyDevices,
        canDeleteDevices = canDeleteDevices,
        canManageRoutes = canManageRoutes,
        canManageDns = canManageDns,
        canManageUsers = canManageUsers,
        canManageKeys = canManageKeys,
        canManagePolicy = canManagePolicy,
    )
}
