package fr.percroy.tailcontrol.domain.repository

import fr.percroy.tailcontrol.domain.model.AuthKeyItem
import fr.percroy.tailcontrol.domain.model.DnsConfig
import fr.percroy.tailcontrol.domain.model.PolicyDocument
import fr.percroy.tailcontrol.domain.model.TailnetSummary
import fr.percroy.tailcontrol.domain.model.TvProfile
import fr.percroy.tailcontrol.domain.model.TvSession

interface TvSessionRepository {
    suspend fun getProfile(): TvProfile
    suspend fun listTailnets(): List<TailnetSummary>
    suspend fun switchTailnet(tailnetId: String): TvSession
}

interface DnsRepository {
    suspend fun getDns(): DnsConfig
    suspend fun updateNameservers(nameservers: List<String>)
}

interface AuthKeysRepository {
    suspend fun listKeys(): List<AuthKeyItem>
    suspend fun createKey(description: String): AuthKeyItem
}

interface PolicyRepository {
    suspend fun getPolicy(): PolicyDocument
    suspend fun validatePolicy(aclJson: String): Boolean
}
