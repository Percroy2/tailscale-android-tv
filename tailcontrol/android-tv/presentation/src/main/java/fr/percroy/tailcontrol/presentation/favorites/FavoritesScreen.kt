package fr.percroy.tailcontrol.presentation.favorites

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.tv.material3.Button
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun FavoritesScreen(viewModel: FavoritesViewModel) {
    val state by viewModel.state.collectAsState()

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("FAVORIS", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            state.favorites.isEmpty() -> Text("Aucun favori")
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.favorites, key = { it.deviceId }) { favorite ->
                    Column {
                        Text(
                            "${if (favorite.online) "●" else "○"} ${favorite.deviceName}",
                            style = MaterialTheme.typography.titleLarge,
                        )
                        Button(onClick = { viewModel.removeFavorite(favorite.deviceId) }) {
                            Text("Retirer")
                        }
                    }
                }
            }
        }
    }
}
