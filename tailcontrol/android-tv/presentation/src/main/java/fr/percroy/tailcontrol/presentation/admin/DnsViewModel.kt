package fr.percroy.tailcontrol.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.DnsConfig
import fr.percroy.tailcontrol.domain.repository.DnsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DnsUiState(
    val loading: Boolean = true,
    val config: DnsConfig? = null,
    val error: String? = null,
)

class DnsViewModel(
    private val dnsRepository: DnsRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(DnsUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.config == null, error = null) }
            runCatching { dnsRepository.getDns() }
                .onSuccess { config -> _state.update { it.copy(loading = false, config = config) } }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "DNS indisponible")
                    }
                }
        }
    }
}
