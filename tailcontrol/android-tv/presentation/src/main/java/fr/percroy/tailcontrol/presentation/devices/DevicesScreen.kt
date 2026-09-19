package fr.percroy.tailcontrol.presentation.devices

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.tv.material3.Button
import androidx.tv.material3.Card
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import fr.percroy.tailcontrol.domain.model.Device
import fr.percroy.tailcontrol.domain.model.DeviceFilter

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun DevicesScreen(
    viewModel: DevicesViewModel,
    onDeviceClick: (String) -> Unit,
) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
    ) {
        Text(text = "MACHINES", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DeviceFilter.entries.take(6).forEach { filter ->
                Button(onClick = { viewModel.setFilter(filter) }) {
                    Text(
                        text = filter.label,
                        color = if (state.filter == filter) {
                            MaterialTheme.colorScheme.onPrimary
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        },
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        when {
            state.loading -> Text("Chargement…")
            state.error != null -> {
                Text(text = state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
                Spacer(modifier = Modifier.height(12.dp))
                Button(onClick = viewModel::refresh) { Text("Réessayer") }
            }
            else -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(state.devices, key = { it.id }) { device ->
                        DeviceRow(device = device, onClick = { onDeviceClick(device.id) })
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun DeviceRow(
    device: Device,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.colors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "${if (device.online) "●" else "○"} ${device.name}",
                style = MaterialTheme.typography.titleLarge,
            )
            Text(text = device.os, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = device.ipv4 ?: "Sans IP",
                style = MaterialTheme.typography.bodyLarge,
            )
            if (!device.authorized) {
                Text(
                    text = "En attente d'approbation",
                    color = MaterialTheme.colorScheme.error,
                )
            }
        }
    }
}
