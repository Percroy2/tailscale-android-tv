package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.ActivityItem
import fr.percroy.tailcontrol.domain.model.AuditEntry
import fr.percroy.tailcontrol.domain.repository.ActivityRepository
import fr.percroy.tailcontrol.domain.repository.AuditRepository
import kotlinx.serialization.Serializable
import retrofit2.http.GET
import retrofit2.http.Query

@Serializable
data class AuditUserResponse(
    val displayName: String? = null,
    val email: String? = null,
)

@Serializable
data class AuditDeviceResponse(
    val name: String? = null,
)

@Serializable
data class AuditEntryResponse(
    val id: String,
    val action: String,
    val targetType: String? = null,
    val result: String,
    val createdAt: String,
    val user: AuditUserResponse? = null,
    val tvDevice: AuditDeviceResponse? = null,
)

@Serializable
data class AuditListResponse(val entries: List<AuditEntryResponse>)

@Serializable
data class ActivityItemResponse(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val result: String,
    val createdAt: String,
)

@Serializable
data class ActivityListResponse(val items: List<ActivityItemResponse>)

interface AuditApi {
    @GET("api/v1/audit")
    suspend fun listEntries(@Query("limit") limit: Int = 100): AuditListResponse
}

interface ActivityApi {
    @GET("api/v1/activity")
    suspend fun listActivity(@Query("limit") limit: Int = 50): ActivityListResponse
}

class AuditRepositoryImpl(
    private val api: AuditApi,
) : AuditRepository {
    override suspend fun listEntries(limit: Int): List<AuditEntry> {
        return api.listEntries(limit).entries.map { entry ->
            AuditEntry(
                id = entry.id,
                action = entry.action,
                targetType = entry.targetType,
                result = entry.result,
                actor = entry.tvDevice?.name
                    ?: entry.user?.displayName
                    ?: entry.user?.email
                    ?: "Système",
                createdAt = entry.createdAt,
            )
        }
    }
}

class ActivityRepositoryImpl(
    private val api: ActivityApi,
) : ActivityRepository {
    override suspend fun listActivity(limit: Int): List<ActivityItem> {
        return api.listActivity(limit).items.map {
            ActivityItem(
                id = it.id,
                type = it.type,
                title = it.title,
                message = it.message,
                result = it.result,
                createdAt = it.createdAt,
            )
        }
    }
}
