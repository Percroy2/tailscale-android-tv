package fr.percroy.tailcontrol.domain.model

data class AuditEntry(
    val id: String,
    val action: String,
    val targetType: String?,
    val result: String,
    val actor: String,
    val createdAt: String,
)

data class ActivityItem(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val result: String,
    val createdAt: String,
)
