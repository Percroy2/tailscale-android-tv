package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.PairingSession
import fr.percroy.tailcontrol.domain.model.PairingStatus
import fr.percroy.tailcontrol.domain.repository.PairingRepository
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

@Serializable
data class CreatePairingRequest(
    val installationId: String,
    val deviceName: String? = null,
)

@Serializable
data class CreatePairingResponse(
    val pairingId: String,
    val code: String,
    val expiresIn: Int,
    val pairingUrl: String,
)

@Serializable
data class PairingTokensResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Int,
    val tokenType: String,
)

@Serializable
data class PairingStatusResponse(
    val pairingId: String,
    val status: String,
    val tokens: PairingTokensResponse? = null,
)

interface PairingApi {
    @POST("api/v1/pairing")
    suspend fun createPairing(@Body body: CreatePairingRequest): CreatePairingResponse

    @GET("api/v1/pairing/{id}")
    suspend fun getPairingStatus(@Path("id") pairingId: String): PairingStatusResponse
}

class PairingRepositoryImpl(
    private val api: PairingApi,
) : PairingRepository {
    override suspend fun createPairing(installationId: String): PairingSession {
        val response = api.createPairing(CreatePairingRequest(installationId = installationId))
        return PairingSession(
            pairingId = response.pairingId,
            code = response.code,
            expiresIn = response.expiresIn,
            pairingUrl = response.pairingUrl,
        )
    }

    override suspend fun getPairingStatus(pairingId: String): PairingStatus {
        val response = api.getPairingStatus(pairingId)
        return PairingStatus(
            pairingId = response.pairingId,
            status = response.status,
            accessToken = response.tokens?.accessToken,
            refreshToken = response.tokens?.refreshToken,
        )
    }
}
