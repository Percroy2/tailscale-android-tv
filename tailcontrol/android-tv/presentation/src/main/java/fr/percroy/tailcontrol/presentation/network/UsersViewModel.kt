package fr.percroy.tailcontrol.presentation.network

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.TailnetUser
import fr.percroy.tailcontrol.domain.repository.NetworkRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class UsersUiState(
    val loading: Boolean = true,
    val users: List<TailnetUser> = emptyList(),
    val error: String? = null,
    val message: String? = null,
)

class UsersViewModel(
    private val networkRepository: NetworkRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(UsersUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.users.isEmpty(), error = null) }
            runCatching { networkRepository.listUsers() }
                .onSuccess { users ->
                    _state.update { it.copy(loading = false, users = users) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Erreur utilisateurs")
                    }
                }
        }
    }

    fun approveUser(userId: String) = userAction(userId) { networkRepository.approveUser(userId) }

    fun suspendUser(userId: String) = userAction(userId) { networkRepository.suspendUser(userId) }

    fun restoreUser(userId: String) = userAction(userId) { networkRepository.restoreUser(userId) }

    private fun userAction(userId: String, block: suspend () -> Unit) {
        viewModelScope.launch {
            runCatching { block() }
                .onSuccess {
                    _state.update { it.copy(message = "Action effectuée") }
                    refresh()
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(error = error.message ?: "Action refusée")
                    }
                }
        }
    }
}
