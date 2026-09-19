package fr.percroy.tailcontrol.data.websocket

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

data class LiveAlert(
    val title: String,
    val message: String,
)

class AlertNotifier {
    private val _events = MutableSharedFlow<LiveAlert>(extraBufferCapacity = 8)
    val events: SharedFlow<LiveAlert> = _events.asSharedFlow()

    fun notifyAlert(title: String, message: String) {
        _events.tryEmit(LiveAlert(title, message))
    }
}
