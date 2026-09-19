package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.Dashboard

interface DashboardRepository {
    suspend fun getDashboard(): Dashboard
}
