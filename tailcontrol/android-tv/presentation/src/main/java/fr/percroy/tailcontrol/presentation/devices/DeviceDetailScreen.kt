package fr.percroy.tailcontrol.presentation.devices

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Button
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text

import fr.percroy.tailcontrol.presentation.admin.AdminPinGate
import fr.percroy.tailcontrol.presentation.admin.AdminPinViewModel

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun DeviceDetailScreen(
    viewModel: DeviceDetailViewModel,
    adminPinViewModel: AdminPinViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.state.collectAsState()
    val pinState by adminPinViewModel.state.collectAsState()
    val device = state.device
    val actionsAllowed = !pinState.isConfigured || pinState.isUnlocked

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Button(onClick = onBack) { Text("Retour") }
        AdminPinGate(viewModel = adminPinViewModel, onVerified = {})

        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            device != null -> {
                Text(
                    text = "${if (device.online) "● En ligne" else "○ Hors ligne"}",
                    style = MaterialTheme.typography.headlineMedium,
                )
                Text(text = device.name.uppercase(), style = MaterialTheme.typography.displaySmall)
                DetailLine("IP Tailscale", device.ipv4 ?: "—")
                DetailLine("Utilisateur", device.user)
                DetailLine("OS", device.os)
                DetailLine("Version", device.clientVersion ?: "—")
                DetailLine("Dernière activité", device.lastSeen ?: "—")
                DetailLine("Tags", device.tags.joinToString(", ").ifBlank { "—" })
                DetailLine(
                    "Clé",
                    if (device.keyExpiryDisabled) "Expiration désactivée" else device.expires ?: "—",
                )

                if (device.pendingRoutes.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Routes en attente", style = MaterialTheme.typography.titleMedium)
                    device.pendingRoutes.forEach { route ->
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text(text = route, modifier = Modifier.weight(1f))
                            Button(
                                onClick = { viewModel.approveRoute(route) },
                                enabled = actionsAllowed && !state.actionInProgress,
                            ) {
                                Text("Approuver")
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                if (actionsAllowed) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(onClick = viewModel::addToFavorites) {
                            Text("Favori")
                        }
                        if (!device.authorized) {
                            Button(
                                onClick = viewModel::authorize,
                                enabled = !state.actionInProgress,
                            ) {
                                Text("Autoriser")
                            }
                        } else {
                            Button(
                                onClick = viewModel::revoke,
                                enabled = !state.actionInProgress,
                            ) {
                                Text("Révoquer")
                            }
                        }
                    }
                }

                state.message?.let {
                    Text(text = it, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}

@Composable
private fun DetailLine(label: String, value: String) {
    Column {
        Text(text = label, style = MaterialTheme.typography.labelLarge)
        Text(text = value, style = MaterialTheme.typography.bodyLarge)
    }
}
