package fr.percroy.tailcontrol.domain.model

data class MonitorItem(
    val id: String,
    val name: String,
    val type: String,
    val target: String,
    val enabled: Boolean,
    val lastStatus: String?,
    val lastLatencyMs: Int?,
    val lastCheckedAt: String?,
)

data class SupervisionAgentItem(
    val id: String,
    val name: String,
    val hostname: String,
    val status: String,
    val capabilities: List<String>,
    val lastSeenAt: String,
)

data class MonitorRunResult(
    val status: String,
    val latencyMs: Int?,
)
