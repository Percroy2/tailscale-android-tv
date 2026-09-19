package fr.percroy.tailcontrol.presentation.activity

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.ActivityItem
import fr.percroy.tailcontrol.domain.repository.ActivityRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ActivityUiState(
    val loading: Boolean = true,
    val items: List<ActivityItem> = emptyList(),
    val error: String? = null,
)

class ActivityViewModel(
    private val repository: ActivityRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(ActivityUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.items.isEmpty(), error = null) }
            runCatching { repository.listActivity() }
                .onSuccess { items ->
                    _state.update { it.copy(loading = false, items = items) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Activité indisponible")
                    }
                }
        }
    }
}
