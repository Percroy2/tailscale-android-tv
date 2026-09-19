package fr.percroy.tailcontrol.presentation.network

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.ExitNode
import fr.percroy.tailcontrol.domain.repository.NetworkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ExitNodesUiState(
    val loading: Boolean = true,
    val exitNodes: List<ExitNode> = emptyList(),
    val error: String? = null,
)

class ExitNodesViewModel(
    private val networkRepository: NetworkRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(ExitNodesUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.exitNodes.isEmpty(), error = null) }
            runCatching { networkRepository.listExitNodes() }
                .onSuccess { exitNodes ->
                    _state.update { it.copy(loading = false, exitNodes = exitNodes) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Erreur exit nodes")
                    }
                }
        }
    }
}
