package fr.percroy.tailcontrol.presentation.devices

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.Device
import fr.percroy.tailcontrol.domain.repository.DeviceRepository
import fr.percroy.tailcontrol.domain.repository.FavoritesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DeviceDetailUiState(
    val loading: Boolean = true,
    val device: Device? = null,
    val message: String? = null,
    val error: String? = null,
    val actionInProgress: Boolean = false,
)

class DeviceDetailViewModel(
    private val repository: DeviceRepository,
    private val favoritesRepository: FavoritesRepository,
    private val deviceId: String,
) : ViewModel() {
    private val _state = MutableStateFlow(DeviceDetailUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.device == null, error = null) }
            runCatching { repository.getDevice(deviceId) }
                .onSuccess { device ->
                    _state.update { it.copy(loading = false, device = device) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            loading = false,
                            error = error.message ?: "Machine introuvable",
                        )
                    }
                }
        }
    }

    fun authorize() = performAction("Machine autorisée") {
        repository.authorizeDevice(deviceId)
    }

    fun revoke() = performAction("Machine révoquée") {
        repository.revokeDevice(deviceId)
    }

    fun approveRoute(route: String) = performAction("Route $route approuvée") {
        repository.approveRoute(deviceId, route)
    }

    fun addToFavorites() {
        val device = _state.value.device ?: return
        viewModelScope.launch {
            runCatching {
                favoritesRepository.addFavorite(device.id, device.name)
            }
                .onSuccess {
                    _state.update { it.copy(message = "${device.name} ajouté aux favoris") }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(error = error.message ?: "Impossible d'ajouter aux favoris")
                    }
                }
        }
    }

    private fun performAction(message: String, block: suspend () -> Unit) {
        viewModelScope.launch {
            _state.update { it.copy(actionInProgress = true, error = null, message = null) }
            runCatching { block() }
                .onSuccess {
                    _state.update { it.copy(actionInProgress = false, message = message) }
                    refresh()
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            actionInProgress = false,
                            error = error.message ?: "Action refusée",
                        )
                    }
                }
        }
    }
}
