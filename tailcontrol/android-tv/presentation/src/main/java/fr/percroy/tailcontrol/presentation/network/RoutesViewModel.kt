package fr.percroy.tailcontrol.presentation.network

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.RouteEntry
import fr.percroy.tailcontrol.domain.repository.DeviceRepository
import fr.percroy.tailcontrol.domain.repository.NetworkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class RoutesUiState(
    val loading: Boolean = true,
    val routes: List<RouteEntry> = emptyList(),
    val error: String? = null,
    val message: String? = null,
)

class RoutesViewModel(
    private val networkRepository: NetworkRepository,
    private val deviceRepository: DeviceRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(RoutesUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.routes.isEmpty(), error = null) }
            runCatching { networkRepository.listRoutes() }
                .onSuccess { routes ->
                    _state.update { it.copy(loading = false, routes = routes) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Erreur routes")
                    }
                }
        }
    }

    fun approveRoute(entry: RouteEntry) {
        viewModelScope.launch {
            runCatching { deviceRepository.approveRoute(entry.deviceId, entry.route) }
                .onSuccess {
                    _state.update { it.copy(message = "Route ${entry.route} approuvée") }
                    refresh()
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(error = error.message ?: "Approbation impossible")
                    }
                }
        }
    }
}
