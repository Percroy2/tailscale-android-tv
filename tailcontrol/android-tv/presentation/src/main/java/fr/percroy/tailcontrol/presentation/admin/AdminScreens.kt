package fr.percroy.tailcontrol.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun DnsScreen(viewModel: DnsViewModel) {
    val state by viewModel.state.collectAsState()

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("DNS", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            state.config != null -> {
                val config = state.config!!
                Text("MagicDNS : ${if (config.magicDns) "activé" else "désactivé"}")
                Spacer(Modifier.height(8.dp))
                Text("Nameservers", style = MaterialTheme.typography.titleMedium)
                config.nameservers.forEach { Text(it) }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun AuthKeysScreen(
    viewModel: AuthKeysViewModel,
    adminPinViewModel: AdminPinViewModel,
) {
    val state by viewModel.state.collectAsState()
    var pinActionPending by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("AUTH KEYS", style = MaterialTheme.typography.headlineMedium)
        AdminPinGate(viewModel = adminPinViewModel, onVerified = { pinActionPending = false })
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.keys, key = { it.id }) { key ->
                    Column {
                        Text(key.description.ifBlank { key.id }, style = MaterialTheme.typography.titleMedium)
                        Text("${if (key.revoked) "Révoquée" else "Active"} • ${key.created}")
                    }
                }
            }
        }
        state.createdKey?.let {
            Spacer(Modifier.height(12.dp))
            Text("Nouvelle clé : $it", color = MaterialTheme.colorScheme.primary)
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun PolicyScreen(viewModel: PolicyViewModel) {
    val state by viewModel.state.collectAsState()

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("POLITIQUE ACL", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> Text("Chargement…")
            state.error != null -> Text(state.error ?: "Erreur", color = MaterialTheme.colorScheme.error)
            state.policy != null -> {
                Text("Mise à jour : ${state.policy!!.updatedAt ?: "—"}")
                Spacer(Modifier.height(8.dp))
                Text(
                    state.policy!!.aclJson.take(1200),
                    style = MaterialTheme.typography.bodyMedium,
                )
                state.valid?.let { valid ->
                    Spacer(Modifier.height(8.dp))
                    Text(if (valid) "ACL valide" else "ACL invalide")
                }
            }
        }
    }
}
