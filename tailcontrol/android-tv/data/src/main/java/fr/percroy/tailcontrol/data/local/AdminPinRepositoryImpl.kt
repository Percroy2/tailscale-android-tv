package fr.percroy.tailcontrol.data.local

import fr.percroy.tailcontrol.domain.repository.AdminPinRepository

class AdminPinRepositoryImpl(
    private val store: AdminPinStore,
) : AdminPinRepository {
    override fun isConfigured(): Boolean = store.isConfigured()

    override fun setPin(pin: String) {
        store.setPin(pin)
    }

    override fun verifyPin(pin: String): Boolean = store.verifyPin(pin)

    override fun clearPin() {
        store.clearPin()
    }
}
