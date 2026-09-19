package fr.percroy.tailcontrol.presentation.admin

import androidx.lifecycle.ViewModel
import fr.percroy.tailcontrol.domain.repository.AdminPinRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class AdminPinUiState(
    val isConfigured: Boolean = false,
    val isUnlocked: Boolean = false,
    val error: String? = null,
    val message: String? = null,
)

class AdminPinViewModel(
    private val adminPinRepository: AdminPinRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(
        AdminPinUiState(isConfigured = adminPinRepository.isConfigured()),
    )
    val state = _state.asStateFlow()

    fun setPin(pin: String) {
        if (pin.length < 4) {
            _state.update { it.copy(error = "PIN minimum 4 chiffres") }
            return
        }
        adminPinRepository.setPin(pin)
        _state.update {
            it.copy(
                isConfigured = true,
                isUnlocked = true,
                error = null,
                message = "PIN enregistré",
            )
        }
    }

    fun verifyPin(pin: String): Boolean {
        val valid = adminPinRepository.verifyPin(pin)
        _state.update {
            it.copy(
                isUnlocked = valid,
                error = if (valid) null else "PIN incorrect",
            )
        }
        return valid
    }

    fun lock() {
        _state.update { it.copy(isUnlocked = false, error = null) }
    }

    fun requireUnlock(onUnlocked: () -> Unit, pin: String) {
        if (!adminPinRepository.isConfigured()) {
            onUnlocked()
            return
        }
        if (_state.value.isUnlocked || verifyPin(pin)) {
            onUnlocked()
        }
    }
}
