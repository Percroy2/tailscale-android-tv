package fr.percroy.tailcontrol.presentation.network

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import fr.percroy.tailcontrol.presentation.admin.AdminPinGate
import fr.percroy.tailcontrol.presentation.admin.AdminPinViewModel

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun RoutesScreen(viewModel: RoutesViewModel) {
    val state by viewModel.state.collectAsState()

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("ROUTES", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.routes, key = { "${it.deviceId}-${it.route}" }) { route ->
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column {
                            Text(route.deviceName, style = MaterialTheme.typography.titleMedium)
                            Text(
                                "${route.route} ${if (route.approved) "✓ Approuvée" else "! En attente"}",
                                style = MaterialTheme.typography.bodyLarge,
                            )
                        }
                        if (!route.approved) {
                            Button(onClick = { viewModel.approveRoute(route) }) {
                                Text("Approuver")
                            }
                        }
                    }
                }
            }
        }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun ExitNodesScreen(viewModel: ExitNodesViewModel) {
    val state by viewModel.state.collectAsState()

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("EXIT NODES", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.exitNodes, key = { it.id }) { node ->
                    Column {
                        Text(
                            "${if (node.online) "●" else "○"} ${node.name}",
                            style = MaterialTheme.typography.titleLarge,
                        )
                        Text(node.os, style = MaterialTheme.typography.bodyMedium)
                        Text(node.ipv4 ?: "—", style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun UsersScreen(
    viewModel: UsersViewModel,
    adminPinViewModel: AdminPinViewModel,
) {
    val state by viewModel.state.collectAsState()
    val pinState by adminPinViewModel.state.collectAsState()
    val actionsAllowed = !pinState.isConfigured || pinState.isUnlocked

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("UTILISATEURS", style = MaterialTheme.typography.headlineMedium)
        AdminPinGate(viewModel = adminPinViewModel, onVerified = {})
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.users, key = { it.id }) { user ->
                    Column(Modifier.fillMaxWidth()) {
                        Text(user.displayName, style = MaterialTheme.typography.titleLarge)
                        Text(user.loginName, style = MaterialTheme.typography.bodyMedium)
                        Text("${user.role} • ${user.status}", style = MaterialTheme.typography.bodyLarge)
                        if (actionsAllowed) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (user.status == "pending") {
                                    Button(onClick = { viewModel.approveUser(user.id) }) {
                                        Text("Approuver")
                                    }
                                }
                                if (user.status != "suspended") {
                                    Button(onClick = { viewModel.suspendUser(user.id) }) {
                                        Text("Suspendre")
                                    }
                                } else {
                                    Button(onClick = { viewModel.restoreUser(user.id) }) {
                                        Text("Restaurer")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}
