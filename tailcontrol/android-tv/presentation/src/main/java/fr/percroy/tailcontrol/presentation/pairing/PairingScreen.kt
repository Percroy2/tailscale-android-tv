package fr.percroy.tailcontrol.presentation.pairing

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun PairingScreen(
    viewModel: PairingViewModel,
    onPaired: () -> Unit,
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.paired) {
        if (state.paired) {
            onPaired()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = "TAILCONTROL",
            style = MaterialTheme.typography.headlineLarge,
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Connecter cette TV",
            style = MaterialTheme.typography.titleLarge,
        )
        Spacer(modifier = Modifier.height(32.dp))

        when {
            state.loading -> {
                Text(text = "Génération du code…")
            }

            state.error != null -> {
                Text(
                    text = state.error ?: "Erreur",
                    color = MaterialTheme.colorScheme.error,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(onClick = viewModel::refresh) {
                    Text("Réessayer")
                }
            }

            state.session != null -> {
                val session = state.session!!
                QrCodeImage(content = session.pairingUrl, size = 280)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = session.code,
                    style = MaterialTheme.typography.displayMedium,
                    modifier = Modifier.widthIn(max = 480.dp),
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = session.pairingUrl,
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = if (state.waitingForAuthorization) {
                        "Scannez le QR Code depuis votre smartphone pour autoriser cette TV."
                    } else {
                        "Jumelage terminé."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(onClick = viewModel::refresh) {
                    Text("Actualiser")
                }
            }
        }
    }
}
