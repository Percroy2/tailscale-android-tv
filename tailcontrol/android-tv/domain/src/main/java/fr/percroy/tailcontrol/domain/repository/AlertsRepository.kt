package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.AlertItem

interface AlertsRepository {
    suspend fun listAlerts(): List<AlertItem>
    suspend fun markRead(alertId: String)
}
