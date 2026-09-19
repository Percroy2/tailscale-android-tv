package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.model.MonitorItem
import fr.percroy.tailcontrol.domain.model.MonitorRunResult
import fr.percroy.tailcontrol.domain.model.SupervisionAgentItem
import fr.percroy.tailcontrol.domain.repository.MonitoringRepository
import kotlinx.serialization.Serializable
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

@Serializable
data class MonitorResultResponse(
    val status: String,
    val latencyMs: Int? = null,
    val checkedAt: String? = null,
)

@Serializable
data class MonitorResponse(
    val id: String,
    val name: String,
    val type: String,
    val target: String,
    val enabled: Boolean = true,
    val results: List<MonitorResultResponse> = emptyList(),
)

@Serializable
data class MonitorsListResponse(val monitors: List<MonitorResponse>)

@Serializable
data class MonitorRunResponse(
    val result: MonitorResultResponse,
)

@Serializable
data class AgentResponse(
    val id: String,
    val name: String,
    val hostname: String,
    val status: String,
    val capabilities: List<String> = emptyList(),
    val lastSeenAt: String,
)

@Serializable
data class AgentsListResponse(val agents: List<AgentResponse>)

@Serializable
data class AgentCheckResponse(
    val accepted: Boolean,
    val reason: String? = null,
)

interface MonitoringApi {
    @GET("api/v1/monitoring")
    suspend fun listMonitors(): MonitorsListResponse

    @POST("api/v1/monitoring/{id}/run")
    suspend fun runMonitor(@Path("id") monitorId: String): MonitorRunResponse

    @GET("api/v1/agents/for-tv")
    suspend fun listAgents(): AgentsListResponse

    @POST("api/v1/agents/{id}/check")
    suspend fun requestAgentCheck(@Path("id") agentId: String): AgentCheckResponse
}

class MonitoringRepositoryImpl(
    private val api: MonitoringApi,
) : MonitoringRepository {
    override suspend fun listMonitors(): List<MonitorItem> {
        return api.listMonitors().monitors.map { monitor ->
            val latest = monitor.results.firstOrNull()
            MonitorItem(
                id = monitor.id,
                name = monitor.name,
                type = monitor.type,
                target = monitor.target,
                enabled = monitor.enabled,
                lastStatus = latest?.status,
                lastLatencyMs = latest?.latencyMs,
                lastCheckedAt = latest?.checkedAt,
            )
        }
    }

    override suspend fun runMonitor(monitorId: String): MonitorRunResult {
        val result = api.runMonitor(monitorId).result
        return MonitorRunResult(result.status, result.latencyMs)
    }

    override suspend fun listAgents(): List<SupervisionAgentItem> {
        return api.listAgents().agents.map {
            SupervisionAgentItem(
                id = it.id,
                name = it.name,
                hostname = it.hostname,
                status = it.status,
                capabilities = it.capabilities,
                lastSeenAt = it.lastSeenAt,
            )
        }
    }

    override suspend fun requestAgentCheck(agentId: String): Boolean {
        return api.requestAgentCheck(agentId).accepted
    }
}
