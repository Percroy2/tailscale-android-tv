package fr.percroy.tailcontrol

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.tv.material3.ExperimentalTvMaterial3Api
import fr.percroy.tailcontrol.core.device.InstallationIdProvider
import fr.percroy.tailcontrol.data.ServiceLocator
import fr.percroy.tailcontrol.data.websocket.SessionEvent
import fr.percroy.tailcontrol.presentation.navigation.TailControlNavHost
import fr.percroy.tailcontrol.presentation.pairing.PairingScreen
import fr.percroy.tailcontrol.presentation.pairing.PairingViewModel
import fr.percroy.tailcontrol.presentation.theme.TailControlTheme

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalTvMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val services = ServiceLocator(
            baseUrl = BuildConfig.API_BASE_URL,
            context = this,
        )
        val installationId = InstallationIdProvider(this).current()

        setContent {
            var isPaired by remember { mutableStateOf(false) }
            var bootstrapped by remember { mutableStateOf(false) }

            LaunchedEffect(Unit) {
                isPaired = services.sessionRepository.getSession() != null
                bootstrapped = true
            }

            LaunchedEffect(isPaired) {
                if (!isPaired) {
                    return@LaunchedEffect
                }
                val session = services.sessionRepository.getSession() ?: return@LaunchedEffect
                services.eventsClient.sessionEvents(session.accessToken).collect { event ->
                    when (event) {
                        SessionEvent.Revoked -> {
                            services.sessionRepository.clearSession()
                            isPaired = false
                        }
                        SessionEvent.Refresh -> services.refreshNotifier.notifyRefresh()
                        is SessionEvent.Alert -> {
                            services.alertNotifier.notifyAlert(event.title, event.message)
                            services.refreshNotifier.notifyRefresh()
                        }
                    }
                }
            }

            TailControlTheme {
                when {
                    !bootstrapped -> Unit
                    isPaired -> TailControlNavHost(
                        services = services,
                        onLoggedOut = { isPaired = false },
                    )
                    else -> {
                        val viewModel = remember {
                            PairingViewModel(
                                pairingRepository = services.pairingRepository,
                                sessionRepository = services.sessionRepository,
                                installationId = installationId,
                            )
                        }
                        PairingScreen(
                            viewModel = viewModel,
                            onPaired = { isPaired = true },
                        )
                    }
                }
            }
        }
    }
}
