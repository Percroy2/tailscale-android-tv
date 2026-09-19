package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.PairingSession
import fr.percroy.tailcontrol.domain.model.PairingStatus
import fr.percroy.tailcontrol.domain.model.TvSession

interface PairingRepository {
    suspend fun createPairing(installationId: String): PairingSession
    suspend fun getPairingStatus(pairingId: String): PairingStatus
}

interface SessionRepository {
    suspend fun saveSession(session: TvSession)
    suspend fun getSession(): TvSession?
    suspend fun clearSession()
}
