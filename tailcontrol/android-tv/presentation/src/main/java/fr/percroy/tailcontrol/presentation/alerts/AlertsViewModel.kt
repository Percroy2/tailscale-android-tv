package fr.percroy.tailcontrol.presentation.alerts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.AlertItem
import fr.percroy.tailcontrol.domain.repository.AlertsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AlertsUiState(
    val loading: Boolean = true,
    val alerts: List<AlertItem> = emptyList(),
    val error: String? = null,
    val liveAlert: String? = null,
)

class AlertsViewModel(
    private val alertsRepository: AlertsRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(AlertsUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun onLiveAlert(title: String, message: String) {
        _state.update {
            it.copy(liveAlert = listOf(title, message).filter { part -> part.isNotBlank() }.joinToString(" — "))
        }
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.alerts.isEmpty(), error = null) }
            runCatching { alertsRepository.listAlerts() }
                .onSuccess { alerts ->
                    _state.update { it.copy(loading = false, alerts = alerts) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Erreur alertes")
                    }
                }
        }
    }

    fun markRead(alertId: String) {
        viewModelScope.launch {
            runCatching { alertsRepository.markRead(alertId) }
                .onSuccess { refresh() }
        }
    }
}
