package fr.percroy.tailcontrol.presentation.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.TailnetSummary
import fr.percroy.tailcontrol.domain.model.TvProfile
import fr.percroy.tailcontrol.domain.repository.SessionRepository
import fr.percroy.tailcontrol.domain.repository.TvSessionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsUiState(
    val loading: Boolean = true,
    val profile: TvProfile? = null,
    val tailnets: List<TailnetSummary> = emptyList(),
    val error: String? = null,
    val message: String? = null,
)

class SettingsViewModel(
    private val tvSessionRepository: TvSessionRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(SettingsUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching {
                val profile = tvSessionRepository.getProfile()
                val tailnets = tvSessionRepository.listTailnets()
                profile to tailnets
            }
                .onSuccess { (profile, tailnets) ->
                    _state.update {
                        it.copy(loading = false, profile = profile, tailnets = tailnets)
                    }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Erreur paramètres")
                    }
                }
        }
    }

    fun switchTailnet(tailnetId: String) {
        viewModelScope.launch {
            runCatching { tvSessionRepository.switchTailnet(tailnetId) }
                .onSuccess { session ->
                    sessionRepository.saveSession(session)
                    _state.update { it.copy(message = "Tailnet changé") }
                    refresh()
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(error = error.message ?: "Changement impossible")
                    }
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            sessionRepository.clearSession()
        }
    }
}
