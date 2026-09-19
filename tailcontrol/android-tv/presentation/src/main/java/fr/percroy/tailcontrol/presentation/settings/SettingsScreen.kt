package fr.percroy.tailcontrol.presentation.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Button
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import fr.percroy.tailcontrol.presentation.admin.AdminPinViewModel

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    adminPinViewModel: AdminPinViewModel,
    onLoggedOut: () -> Unit,
) {
    val state by viewModel.state.collectAsState()
    val pinState by adminPinViewModel.state.collectAsState()
    var newPin by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().padding(32.dp)) {
        Text("PARAMÈTRES", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))

        state.profile?.let { profile ->
            Text("Profil : ${profile.profile}", style = MaterialTheme.typography.titleMedium)
            Text("Tailnet actif", style = MaterialTheme.typography.bodyLarge)
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text("Changer de Tailnet", style = MaterialTheme.typography.titleMedium)
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            state.tailnets.forEach { tailnet ->
                Button(onClick = { viewModel.switchTailnet(tailnet.id) }) {
                    Text("${tailnet.displayName} (${tailnet.profile})")
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text("PIN administrateur", style = MaterialTheme.typography.titleMedium)
        BasicTextField(
            value = newPin,
            onValueChange = { value -> newPin = value.filter { it.isDigit() }.take(8) },
        )
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = { adminPinViewModel.setPin(newPin) }) {
            Text(if (pinState.isConfigured) "Modifier le PIN" else "Définir le PIN")
        }
        pinState.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }

        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = {
            viewModel.logout()
            onLoggedOut()
        }) {
            Text("Déconnexion")
        }

        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}
