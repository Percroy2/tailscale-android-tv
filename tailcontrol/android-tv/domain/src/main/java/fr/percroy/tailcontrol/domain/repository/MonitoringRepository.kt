package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.MonitorItem
import fr.percroy.tailcontrol.domain.model.MonitorRunResult
import fr.percroy.tailcontrol.domain.model.SupervisionAgentItem

interface MonitoringRepository {
    suspend fun listMonitors(): List<MonitorItem>
    suspend fun runMonitor(monitorId: String): MonitorRunResult
    suspend fun listAgents(): List<SupervisionAgentItem>
    suspend fun requestAgentCheck(agentId: String): Boolean
}
