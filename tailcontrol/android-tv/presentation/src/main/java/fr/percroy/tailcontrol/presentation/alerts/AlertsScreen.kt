package fr.percroy.tailcontrol.presentation.alerts

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
fun AlertsScreen(viewModel: AlertsViewModel) {
    val state by viewModel.state.collectAsState()

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("ALERTES", style = MaterialTheme.typography.headlineMedium)
        state.liveAlert?.let {
            Text(it, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(8.dp))
        }
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            state.alerts.isEmpty() -> Text("Aucune alerte")
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.alerts, key = { it.id }) { alert ->
                    Column(Modifier.fillMaxWidth()) {
                        Text(alert.title, style = MaterialTheme.typography.titleLarge)
                        Text(alert.message, style = MaterialTheme.typography.bodyLarge)
                        Text(
                            if (alert.readAt == null) "Non lue" else "Lue",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        if (alert.readAt == null) {
                            Button(onClick = { viewModel.markRead(alert.id) }) {
                                Text("Marquer lue")
                            }
                        }
                    }
                }
            }
        }
    }
}
