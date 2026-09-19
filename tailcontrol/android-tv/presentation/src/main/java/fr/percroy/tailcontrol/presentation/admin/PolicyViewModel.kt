package fr.percroy.tailcontrol.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.PolicyDocument
import fr.percroy.tailcontrol.domain.repository.PolicyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PolicyUiState(
    val loading: Boolean = true,
    val policy: PolicyDocument? = null,
    val valid: Boolean? = null,
    val error: String? = null,
)

class PolicyViewModel(
    private val policyRepository: PolicyRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(PolicyUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.policy == null, error = null) }
            runCatching { policyRepository.getPolicy() }
                .onSuccess { policy -> _state.update { it.copy(loading = false, policy = policy) } }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Politique indisponible")
                    }
                }
        }
    }

    fun validate() {
        val policy = _state.value.policy ?: return
        viewModelScope.launch {
            runCatching { policyRepository.validatePolicy(policy.aclJson) }
                .onSuccess { valid -> _state.update { it.copy(valid = valid) } }
                .onFailure { error ->
                    _state.update {
                        it.copy(error = error.message ?: "Validation impossible")
                    }
                }
        }
    }
}
