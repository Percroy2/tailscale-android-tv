package fr.percroy.tailcontrol.domain.repository

interface AdminPinRepository {
    fun isConfigured(): Boolean
    fun setPin(pin: String)
    fun verifyPin(pin: String): Boolean
    fun clearPin()
}
