package fr.percroy.tailcontrol.presentation.monitoring

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.MonitorItem
import fr.percroy.tailcontrol.domain.model.SupervisionAgentItem
import fr.percroy.tailcontrol.domain.repository.MonitoringRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MonitoringUiState(
    val loading: Boolean = true,
    val monitors: List<MonitorItem> = emptyList(),
    val agents: List<SupervisionAgentItem> = emptyList(),
    val message: String? = null,
    val error: String? = null,
    val runningMonitorId: String? = null,
)

class MonitoringViewModel(
    private val repository: MonitoringRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(MonitoringUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    loading = it.monitors.isEmpty() && it.agents.isEmpty(),
                    error = null,
                    message = null,
                )
            }
            runCatching {
                repository.listMonitors() to repository.listAgents()
            }.onSuccess { (monitors, agents) ->
                _state.update {
                    it.copy(loading = false, monitors = monitors, agents = agents)
                }
            }.onFailure { error ->
                _state.update {
                    it.copy(
                        loading = false,
                        error = error.message ?: "Supervision indisponible",
                    )
                }
            }
        }
    }

    fun runMonitor(monitorId: String) {
        viewModelScope.launch {
            _state.update { it.copy(runningMonitorId = monitorId, message = null, error = null) }
            runCatching { repository.runMonitor(monitorId) }
                .onSuccess { result ->
                    _state.update {
                        it.copy(
                            runningMonitorId = null,
                            message = "Résultat : ${result.status.uppercase()}" +
                                (result.latencyMs?.let { ms -> " (${ms} ms)" } ?: ""),
                        )
                    }
                    refresh()
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            runningMonitorId = null,
                            error = error.message ?: "Exécution impossible",
                        )
                    }
                }
        }
    }

    fun requestAgentCheck(agentId: String) {
        viewModelScope.launch {
            runCatching { repository.requestAgentCheck(agentId) }
                .onSuccess { accepted ->
                    _state.update {
                        it.copy(
                            message = if (accepted) {
                                "Demande envoyée à l'agent"
                            } else {
                                "Agent hors ligne ou indisponible"
                            },
                        )
                    }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(error = error.message ?: "Agent indisponible")
                    }
                }
        }
    }
}
