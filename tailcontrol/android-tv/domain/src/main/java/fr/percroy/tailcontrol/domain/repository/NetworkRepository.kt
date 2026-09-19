package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.ExitNode
import fr.percroy.tailcontrol.domain.model.RouteEntry
import fr.percroy.tailcontrol.domain.model.TailnetUser

interface NetworkRepository {
    suspend fun listRoutes(): List<RouteEntry>
    suspend fun listExitNodes(): List<ExitNode>
    suspend fun listUsers(): List<TailnetUser>
    suspend fun approveUser(userId: String)
    suspend fun suspendUser(userId: String)
    suspend fun restoreUser(userId: String)
}
