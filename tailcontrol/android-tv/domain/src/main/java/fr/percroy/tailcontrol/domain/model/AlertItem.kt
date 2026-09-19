package fr.percroy.tailcontrol.domain.model

data class AlertItem(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val readAt: String?,
    val createdAt: String,
)
