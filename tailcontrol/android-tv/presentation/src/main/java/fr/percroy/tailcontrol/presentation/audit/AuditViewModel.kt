package fr.percroy.tailcontrol.presentation.audit

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.AuditEntry
import fr.percroy.tailcontrol.domain.repository.AuditRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuditUiState(
    val loading: Boolean = true,
    val entries: List<AuditEntry> = emptyList(),
    val error: String? = null,
)

class AuditViewModel(
    private val repository: AuditRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(AuditUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.entries.isEmpty(), error = null) }
            runCatching { repository.listEntries() }
                .onSuccess { entries ->
                    _state.update { it.copy(loading = false, entries = entries) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Audit indisponible")
                    }
                }
        }
    }
}
