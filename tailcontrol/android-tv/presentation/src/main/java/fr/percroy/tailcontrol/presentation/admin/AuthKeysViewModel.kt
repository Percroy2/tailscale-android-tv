package fr.percroy.tailcontrol.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.AuthKeyItem
import fr.percroy.tailcontrol.domain.repository.AuthKeysRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthKeysUiState(
    val loading: Boolean = true,
    val keys: List<AuthKeyItem> = emptyList(),
    val error: String? = null,
    val createdKey: String? = null,
)

class AuthKeysViewModel(
    private val authKeysRepository: AuthKeysRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(AuthKeysUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.keys.isEmpty(), error = null) }
            runCatching { authKeysRepository.listKeys() }
                .onSuccess { keys -> _state.update { it.copy(loading = false, keys = keys) } }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Clés indisponibles")
                    }
                }
        }
    }

    fun createKey() {
        viewModelScope.launch {
            runCatching { authKeysRepository.createKey("TailControl TV") }
                .onSuccess { key ->
                    _state.update { it.copy(createdKey = key.key) }
                    refresh()
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(error = error.message ?: "Création refusée")
                    }
                }
        }
    }
}
