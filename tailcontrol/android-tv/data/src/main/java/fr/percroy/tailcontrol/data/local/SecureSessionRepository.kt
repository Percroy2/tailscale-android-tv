package fr.percroy.tailcontrol.data.local

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import fr.percroy.tailcontrol.domain.model.TvSession
import fr.percroy.tailcontrol.domain.repository.SessionRepository

class SecureSessionRepository(
    context: Context,
) : SessionRepository {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    override suspend fun saveSession(session: TvSession) {
        prefs.edit()
            .putString(KEY_ACCESS, session.accessToken)
            .putString(KEY_REFRESH, session.refreshToken)
            .apply()
    }

    override suspend fun getSession(): TvSession? {
        val access = prefs.getString(KEY_ACCESS, null) ?: return null
        val refresh = prefs.getString(KEY_REFRESH, null) ?: return null
        return TvSession(accessToken = access, refreshToken = refresh)
    }

    override suspend fun clearSession() {
        prefs.edit().clear().apply()
    }

    private companion object {
        const val PREFS_NAME = "tailcontrol_secure_session"
        const val KEY_ACCESS = "access_token"
        const val KEY_REFRESH = "refresh_token"
    }
}
