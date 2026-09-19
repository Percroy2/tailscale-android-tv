package fr.percroy.tailcontrol.data.remote

import fr.percroy.tailcontrol.domain.repository.SessionRepository
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.Route
import retrofit2.Retrofit
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType

class AuthInterceptor(
    private val sessionRepository: SessionRepository,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val session = runBlocking { sessionRepository.getSession() }
        val request = if (session != null) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer ${session.accessToken}")
                .build()
        } else {
            chain.request()
        }
        return chain.proceed(request)
    }
}

class TokenAuthenticator(
    private val baseUrl: String,
    private val sessionRepository: SessionRepository,
    private val json: Json,
) : Authenticator {
    private val refreshClient by lazy {
        val mediaType = "application/json".toMediaType()
        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(OkHttpClient.Builder().build())
            .addConverterFactory(json.asConverterFactory(mediaType))
            .build()
        retrofit.create(AuthApi::class.java)
    }

    override fun authenticate(route: Route?, response: Response): okhttp3.Request? {
        if (responseCount(response) >= 2) {
            return null
        }

        val session = runBlocking { sessionRepository.getSession() } ?: return null

        return runBlocking {
            runCatching { refreshClient.refreshSession(session.refreshToken) }
                .onSuccess { refreshed ->
                    sessionRepository.saveSession(refreshed)
                }
                .getOrNull()
        }?.let { refreshed ->
            response.request.newBuilder()
                .header("Authorization", "Bearer ${refreshed.accessToken}")
                .build()
        }
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}
