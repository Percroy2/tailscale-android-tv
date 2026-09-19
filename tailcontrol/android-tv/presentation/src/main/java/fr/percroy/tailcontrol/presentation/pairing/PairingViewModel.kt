package fr.percroy.tailcontrol.presentation.pairing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.PairingSession
import fr.percroy.tailcontrol.domain.model.TvSession
import fr.percroy.tailcontrol.domain.repository.PairingRepository
import fr.percroy.tailcontrol.domain.repository.SessionRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class PairingUiState(
    val loading: Boolean = true,
    val session: PairingSession? = null,
    val waitingForAuthorization: Boolean = false,
    val paired: Boolean = false,
    val error: String? = null,
)

class PairingViewModel(
    private val pairingRepository: PairingRepository,
    private val sessionRepository: SessionRepository,
    private val installationId: String,
) : ViewModel() {
    private val _state = MutableStateFlow(PairingUiState())
    val state = _state.asStateFlow()
    private var pollJob: Job? = null

    init {
        refresh()
    }

    fun refresh() {
        pollJob?.cancel()
        viewModelScope.launch {
            _state.update {
                it.copy(
                    loading = true,
                    error = null,
                    paired = false,
                    waitingForAuthorization = false,
                )
            }
            runCatching { pairingRepository.createPairing(installationId) }
                .onSuccess { session ->
                    _state.update {
                        it.copy(
                            loading = false,
                            session = session,
                            waitingForAuthorization = true,
                        )
                    }
                    startPolling(session.pairingId)
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            loading = false,
                            error = error.message ?: "Impossible de créer le jumelage",
                        )
                    }
                }
        }
    }

    private fun startPolling(pairingId: String) {
        pollJob = viewModelScope.launch {
            while (isActive) {
                delay(3_000)
                runCatching { pairingRepository.getPairingStatus(pairingId) }
                    .onSuccess { status ->
                        when (status.status) {
                            "completed" -> {
                                val access = status.accessToken
                                val refresh = status.refreshToken
                                if (access != null && refresh != null) {
                                    sessionRepository.saveSession(
                                        TvSession(
                                            accessToken = access,
                                            refreshToken = refresh,
                                        ),
                                    )
                                    _state.update {
                                        it.copy(
                                            waitingForAuthorization = false,
                                            paired = true,
                                        )
                                    }
                                }
                                pollJob?.cancel()
                            }

                            "expired" -> {
                                _state.update {
                                    it.copy(
                                        waitingForAuthorization = false,
                                        error = "Code expiré. Actualisez pour en générer un nouveau.",
                                    )
                                }
                                pollJob?.cancel()
                            }
                        }
                    }
            }
        }
    }

    override fun onCleared() {
        pollJob?.cancel()
        super.onCleared()
    }
}
