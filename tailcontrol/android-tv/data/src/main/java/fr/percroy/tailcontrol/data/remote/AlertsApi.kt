package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.AlertItem
import fr.percroy.tailcontrol.domain.repository.AlertsRepository
import kotlinx.serialization.Serializable
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

@Serializable
data class AlertResponse(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val readAt: String? = null,
    val createdAt: String,
)

@Serializable
data class AlertsListResponse(val alerts: List<AlertResponse>)

interface AlertsApi {
    @GET("api/v1/alerts")
    suspend fun listAlerts(): AlertsListResponse

    @POST("api/v1/alerts/{id}/read")
    suspend fun markRead(@Path("id") alertId: String)
}

class AlertsRepositoryImpl(
    private val api: AlertsApi,
) : AlertsRepository {
    override suspend fun listAlerts(): List<AlertItem> {
        return api.listAlerts().alerts.map {
            AlertItem(it.id, it.type, it.title, it.message, it.readAt, it.createdAt)
        }
    }

    override suspend fun markRead(alertId: String) {
        api.markRead(alertId)
    }
}
