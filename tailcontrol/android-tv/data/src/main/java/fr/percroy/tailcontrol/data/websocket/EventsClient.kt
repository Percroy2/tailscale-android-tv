package fr.percroy.tailcontrol.data.websocket

import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONObject
import java.net.URI

class EventsClient(
    private val baseUrl: String,
) {
    fun sessionEvents(accessToken: String): Flow<SessionEvent> = callbackFlow {
        val socketUrl = baseUrl.trimEnd('/') + "/ws"
        val options = IO.Options.builder()
            .setAuth(mapOf("token" to accessToken))
            .build()
        val socket: Socket = IO.socket(URI.create(socketUrl), options)

        val revokedListener = io.socket.emitter.Emitter.Listener {
            trySend(SessionEvent.Revoked)
        }
        val alertListener = io.socket.emitter.Emitter.Listener { args ->
            val payload = args.firstOrNull() as? JSONObject
            trySend(
                SessionEvent.Alert(
                    payload?.optString("title").orEmpty(),
                    payload?.optString("message").orEmpty(),
                ),
            )
        }
        val refreshListener = io.socket.emitter.Emitter.Listener {
            trySend(SessionEvent.Refresh)
        }

        socket.on("session_revoked", revokedListener)
        socket.on("alert", alertListener)
        socket.on("refresh", refreshListener)
        socket.connect()

        awaitClose {
            socket.off("session_revoked", revokedListener)
            socket.off("alert", alertListener)
            socket.off("refresh", refreshListener)
            socket.disconnect()
        }
    }
}

sealed interface SessionEvent {
    data object Revoked : SessionEvent
    data object Refresh : SessionEvent
    data class Alert(val title: String, val message: String) : SessionEvent
}
