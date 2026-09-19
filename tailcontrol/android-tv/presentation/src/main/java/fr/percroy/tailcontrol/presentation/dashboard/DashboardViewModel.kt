package fr.percroy.tailcontrol.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.Dashboard
import fr.percroy.tailcontrol.domain.repository.DashboardRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class DashboardUiState(
    val loading: Boolean = true,
    val dashboard: Dashboard? = null,
    val error: String? = null,
)

class DashboardViewModel(
    private val repository: DashboardRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(DashboardUiState())
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            while (isActive) {
                refresh()
                delay(30_000)
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.dashboard == null, error = null) }
            runCatching { repository.getDashboard() }
                .onSuccess { dashboard ->
                    _state.update {
                        it.copy(loading = false, dashboard = dashboard, error = null)
                    }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            loading = false,
                            error = error.message ?: "Dashboard indisponible",
                        )
                    }
                }
        }
    }
}
