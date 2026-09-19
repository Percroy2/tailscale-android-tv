package fr.percroy.tailcontrol.core.device

import android.content.Context
import java.util.UUID

class InstallationIdProvider(
    context: Context,
) {
    private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun current(): String {
        val existing = prefs.getString(KEY_INSTALLATION_ID, null)
        if (existing != null) {
            return existing
        }
        val created = "tv_${UUID.randomUUID()}"
        prefs.edit().putString(KEY_INSTALLATION_ID, created).apply()
        return created
    }

    private companion object {
        const val PREFS_NAME = "tailcontrol_device"
        const val KEY_INSTALLATION_ID = "installation_id"
    }
}
