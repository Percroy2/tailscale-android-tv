package fr.percroy.tailcontrol.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.Composable
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

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun AdminPinGate(
    viewModel: AdminPinViewModel,
    onVerified: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state = viewModel.state.value
    var pin by remember { mutableStateOf("") }

    if (!state.isConfigured || state.isUnlocked) {
        return
    }

    Column(modifier = modifier.padding(16.dp)) {
        Text("PIN administrateur requis", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))
        BasicTextField(
            value = pin,
            onValueChange = { value -> pin = value.filter { it.isDigit() }.take(8) },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {
                if (viewModel.verifyPin(pin)) {
                    onVerified()
                }
            }) {
                Text("Valider")
            }
        }
        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }
    }
}
