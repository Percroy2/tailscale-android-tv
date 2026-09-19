package fr.percroy.tailcontrol.presentation.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fr.percroy.tailcontrol.domain.model.DeviceFavorite
import fr.percroy.tailcontrol.domain.repository.FavoritesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class FavoritesUiState(
    val loading: Boolean = true,
    val favorites: List<DeviceFavorite> = emptyList(),
    val error: String? = null,
)

class FavoritesViewModel(
    private val favoritesRepository: FavoritesRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(FavoritesUiState())
    val state = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.favorites.isEmpty(), error = null) }
            runCatching { favoritesRepository.listFavorites() }
                .onSuccess { favorites ->
                    _state.update { it.copy(loading = false, favorites = favorites) }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(loading = false, error = error.message ?: "Erreur favoris")
                    }
                }
        }
    }

    fun removeFavorite(deviceId: String) {
        viewModelScope.launch {
            runCatching { favoritesRepository.removeFavorite(deviceId) }
                .onSuccess { refresh() }
        }
    }
}
