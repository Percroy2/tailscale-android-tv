package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.AuthKeyItem
import fr.percroy.tailcontrol.domain.model.DnsConfig
import fr.percroy.tailcontrol.domain.model.PolicyDocument
import fr.percroy.tailcontrol.domain.repository.AuthKeysRepository
import fr.percroy.tailcontrol.domain.repository.DnsRepository
import fr.percroy.tailcontrol.domain.repository.PolicyRepository
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

@Serializable
data class DnsConfigResponse(
    val nameservers: List<String> = emptyList(),
    val magicDns: Boolean = false,
    val searchPaths: List<String> = emptyList(),
)

@Serializable
data class UpdateNameserversRequest(val nameservers: List<String>)

@Serializable
data class AuthKeyResponse(
    val id: String,
    val key: String,
    val description: String = "",
    val created: String,
    val expires: String? = null,
    val revoked: Boolean = false,
    val reusable: Boolean = false,
    val ephemeral: Boolean = true,
)

@Serializable
data class AuthKeysListResponse(val keys: List<AuthKeyResponse>)

@Serializable
data class CreateAuthKeyRequest(val description: String = "TailControl TV")

@Serializable
data class PolicyResponse(
    val acl: JsonElement? = null,
    val updatedAt: String? = null,
)

@Serializable
data class ValidatePolicyRequest(val acl: JsonElement)

@Serializable
data class ValidatePolicyResponse(val valid: Boolean)

interface DnsApi {
    @GET("api/v1/dns")
    suspend fun getDns(): DnsConfigResponse

    @POST("api/v1/dns/nameservers")
    suspend fun updateNameservers(@Body body: UpdateNameserversRequest)
}

interface AuthKeysApi {
    @GET("api/v1/auth-keys")
    suspend fun listKeys(): AuthKeysListResponse

    @POST("api/v1/auth-keys")
    suspend fun createKey(@Body body: CreateAuthKeyRequest): AuthKeyResponse
}

interface PolicyApi {
    @GET("api/v1/policy")
    suspend fun getPolicy(): PolicyResponse

    @POST("api/v1/policy/validate")
    suspend fun validatePolicy(@Body body: ValidatePolicyRequest): ValidatePolicyResponse
}

class DnsRepositoryImpl(
    private val api: DnsApi,
) : DnsRepository {
    override suspend fun getDns(): DnsConfig {
        val response = api.getDns()
        return DnsConfig(response.nameservers, response.magicDns, response.searchPaths)
    }

    override suspend fun updateNameservers(nameservers: List<String>) {
        api.updateNameservers(UpdateNameserversRequest(nameservers))
    }
}

class AuthKeysRepositoryImpl(
    private val api: AuthKeysApi,
) : AuthKeysRepository {
    override suspend fun listKeys(): List<AuthKeyItem> {
        return api.listKeys().keys.map(::toDomain)
    }

    override suspend fun createKey(description: String): AuthKeyItem {
        return toDomain(api.createKey(CreateAuthKeyRequest(description)))
    }

    private fun toDomain(response: AuthKeyResponse) = AuthKeyItem(
        id = response.id,
        key = response.key,
        description = response.description,
        created = response.created,
        expires = response.expires,
        revoked = response.revoked,
        reusable = response.reusable,
        ephemeral = response.ephemeral,
    )
}

class PolicyRepositoryImpl(
    private val api: PolicyApi,
    private val json: Json,
) : PolicyRepository {
    override suspend fun getPolicy(): PolicyDocument {
        val response = api.getPolicy()
        val aclJson = response.acl?.let { json.encodeToString(JsonElement.serializer(), it) } ?: "{}"
        return PolicyDocument(aclJson, response.updatedAt)
    }

    override suspend fun validatePolicy(aclJson: String): Boolean {
        val element = json.parseToJsonElement(aclJson)
        return api.validatePolicy(ValidatePolicyRequest(element)).valid
    }
}
