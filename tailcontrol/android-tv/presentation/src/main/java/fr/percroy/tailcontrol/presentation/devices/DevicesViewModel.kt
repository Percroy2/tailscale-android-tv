package fr.percroy.tailcontrol.presentation.devices

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.Device
import fr.percroy.tailcontrol.domain.model.DeviceFilter
import fr.percroy.tailcontrol.domain.repository.DeviceRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class DevicesUiState(
    val loading: Boolean = true,
    val devices: List<Device> = emptyList(),
    val filter: DeviceFilter = DeviceFilter.ALL,
    val error: String? = null,
)

class DevicesViewModel(
    private val repository: DeviceRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(DevicesUiState())
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            while (isActive) {
                refresh()
                delay(30_000)
            }
        }
    }

    fun setFilter(filter: DeviceFilter) {
        _state.update { it.copy(filter = filter) }
        refresh()
    }

    fun refresh() {
        val filter = _state.value.filter
        viewModelScope.launch {
            _state.update { it.copy(loading = it.devices.isEmpty(), error = null) }
            runCatching { repository.listDevices(filter) }
                .onSuccess { devices ->
                    _state.update { it.copy(loading = false, devices = devices) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            loading = false,
                            error = error.message ?: "Impossible de charger les machines",
                        )
                    }
                }
        }
    }
}
