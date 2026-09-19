package fr.percroy.tailcontrol.presentation.monitoring

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

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun MonitoringScreen(viewModel: MonitoringViewModel) {
    val state by viewModel.state.collectAsState()

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("SUPERVISION", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Moniteurs ping/port/HTTP/WoL et agents LAN",
            style = MaterialTheme.typography.bodyLarge,
        )
        Spacer(Modifier.height(16.dp))

        state.message?.let {
            Text(it, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
        }
        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(8.dp))
        }

        when {
            state.loading -> Text("Chargement…")
            else -> {
                Text("Moniteurs", style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                if (state.monitors.isEmpty()) {
                    Text("Aucun moniteur configuré")
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.weight(1f, fill = false),
                    ) {
                        items(state.monitors, key = { it.id }) { monitor ->
                            MonitorRow(
                                monitor = monitor,
                                running = state.runningMonitorId == monitor.id,
                                onRun = { viewModel.runMonitor(monitor.id) },
                            )
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))
                Text("Agents", style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                if (state.agents.isEmpty()) {
                    Text("Aucun agent enregistré")
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(state.agents, key = { it.id }) { agent ->
                            AgentRow(
                                agent = agent,
                                onCheck = { viewModel.requestAgentCheck(agent.id) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun MonitorRow(
    monitor: fr.percroy.tailcontrol.domain.model.MonitorItem,
    running: Boolean,
    onRun: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(Modifier.weight(1f)) {
            Text(monitor.name, style = MaterialTheme.typography.titleMedium)
            Text("${monitor.type.uppercase()} → ${monitor.target}", style = MaterialTheme.typography.bodyMedium)
            monitor.lastStatus?.let {
                Text(
                    "Dernier : $it" +
                        (monitor.lastLatencyMs?.let { ms -> " (${ms} ms)" } ?: ""),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
        Button(onClick = onRun, enabled = !running) {
            Text(if (running) "…" else "Tester")
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun AgentRow(
    agent: fr.percroy.tailcontrol.domain.model.SupervisionAgentItem,
    onCheck: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(Modifier.weight(1f)) {
            Text(agent.name, style = MaterialTheme.typography.titleMedium)
            Text("${agent.hostname} · ${agent.status}", style = MaterialTheme.typography.bodyMedium)
            Text(
                agent.capabilities.joinToString(", "),
                style = MaterialTheme.typography.bodySmall,
            )
        }
        Button(onClick = onCheck) {
            Text("Contrôler")
        }
    }
}
