package fr.percroy.tailcontrol.presentation.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Button
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text

@OptIn(ExperimentalTvMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun DashboardScreen(viewModel: DashboardViewModel) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "TAILCONTROL",
            style = MaterialTheme.typography.headlineLarge,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = state.dashboard?.tailnetName ?: "Tailnet",
            style = MaterialTheme.typography.titleLarge,
        )
        Text(
            text = if (state.dashboard?.connected == true) "● Connecté" else "○ Déconnecté",
            color = MaterialTheme.colorScheme.primary,
            style = MaterialTheme.typography.titleMedium,
        )
        Spacer(modifier = Modifier.height(32.dp))

        when {
            state.loading -> Text("Chargement du dashboard…")
            state.error != null -> {
                Text(
                    text = state.error ?: "Erreur",
                    color = MaterialTheme.colorScheme.error,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = viewModel::refresh) {
                    Text("Réessayer")
                }
            }

            state.dashboard != null -> {
                val stats = state.dashboard!!.stats
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.widthIn(max = 960.dp),
                ) {
                    StatCard(stats.devicesTotal.toString(), "APPAREILS")
                    StatCard(stats.devicesOnline.toString(), "EN LIGNE")
                    StatCard(stats.devicesOffline.toString(), "HORS LIGNE")
                    StatCard(stats.pendingApproval.toString(), "À APPROUVER")
                    StatCard(stats.exitNodes.toString(), "EXIT NODES")
                    StatCard(stats.subnetRouters.toString(), "SUBNET ROUTERS")
                    StatCard(stats.pendingRoutes.toString(), "ROUTES EN ATTENTE")
                    StatCard(stats.users.toString(), "UTILISATEURS")
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun StatCard(value: String, label: String) {
    Column(
        modifier = Modifier
            .widthIn(min = 180.dp)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = value, style = MaterialTheme.typography.displaySmall)
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = label, style = MaterialTheme.typography.labelLarge)
    }
}
