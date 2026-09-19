package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.ActivityItem
import fr.percroy.tailcontrol.domain.model.AuditEntry

interface AuditRepository {
    suspend fun listEntries(limit: Int = 100): List<AuditEntry>
}

interface ActivityRepository {
    suspend fun listActivity(limit: Int = 50): List<ActivityItem>
}
