package fr.percroy.tailcontrol.data

import android.content.Context
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import fr.percroy.tailcontrol.data.local.AdminPinRepositoryImpl
import fr.percroy.tailcontrol.data.local.AdminPinStore
import fr.percroy.tailcontrol.data.local.SecureSessionRepository
import fr.percroy.tailcontrol.data.local.room.OfflineCacheStore
import fr.percroy.tailcontrol.data.local.room.TailControlDatabase
import fr.percroy.tailcontrol.data.remote.AlertsApi
import fr.percroy.tailcontrol.data.remote.AlertsRepositoryImpl
import fr.percroy.tailcontrol.data.remote.ActivityApi
import fr.percroy.tailcontrol.data.remote.ActivityRepositoryImpl
import fr.percroy.tailcontrol.data.remote.AuditApi
import fr.percroy.tailcontrol.data.remote.AuditRepositoryImpl
import fr.percroy.tailcontrol.data.remote.AuthInterceptor
import fr.percroy.tailcontrol.data.remote.TokenAuthenticator
import fr.percroy.tailcontrol.data.remote.AuthKeysApi
import fr.percroy.tailcontrol.data.remote.AuthKeysRepositoryImpl
import fr.percroy.tailcontrol.data.remote.CachingDashboardRepository
import fr.percroy.tailcontrol.data.remote.CachingDeviceRepository
import fr.percroy.tailcontrol.data.remote.DashboardApi
import fr.percroy.tailcontrol.data.remote.DashboardRepositoryImpl
import fr.percroy.tailcontrol.data.remote.DeviceRepositoryImpl
import fr.percroy.tailcontrol.data.remote.DevicesApi
import fr.percroy.tailcontrol.data.remote.DnsApi
import fr.percroy.tailcontrol.data.remote.DnsRepositoryImpl
import fr.percroy.tailcontrol.data.remote.MonitoringApi
import fr.percroy.tailcontrol.data.remote.MonitoringRepositoryImpl
import fr.percroy.tailcontrol.data.remote.NetworkApi
import fr.percroy.tailcontrol.data.remote.NetworkRepositoryImpl
import fr.percroy.tailcontrol.data.remote.PairingApi
import fr.percroy.tailcontrol.data.remote.PairingRepositoryImpl
import fr.percroy.tailcontrol.data.remote.PolicyApi
import fr.percroy.tailcontrol.data.remote.PolicyRepositoryImpl
import fr.percroy.tailcontrol.data.remote.TvApi
import fr.percroy.tailcontrol.data.remote.TvSessionRepositoryImpl
import fr.percroy.tailcontrol.data.websocket.AlertNotifier
import fr.percroy.tailcontrol.data.websocket.EventsClient
import fr.percroy.tailcontrol.data.websocket.RefreshNotifier
import fr.percroy.tailcontrol.domain.repository.ActivityRepository
import fr.percroy.tailcontrol.domain.repository.AuditRepository
import fr.percroy.tailcontrol.domain.repository.AdminPinRepository
import fr.percroy.tailcontrol.domain.repository.AlertsRepository
import fr.percroy.tailcontrol.domain.repository.AuthKeysRepository
import fr.percroy.tailcontrol.domain.repository.DashboardRepository
import fr.percroy.tailcontrol.domain.repository.DeviceRepository
import fr.percroy.tailcontrol.data.remote.FavoritesApi
import fr.percroy.tailcontrol.data.remote.FavoritesRepositoryImpl
import fr.percroy.tailcontrol.domain.repository.FavoritesRepository
import fr.percroy.tailcontrol.domain.repository.DnsRepository
import fr.percroy.tailcontrol.domain.repository.MonitoringRepository
import fr.percroy.tailcontrol.domain.repository.NetworkRepository
import fr.percroy.tailcontrol.domain.repository.PairingRepository
import fr.percroy.tailcontrol.domain.repository.PolicyRepository
import fr.percroy.tailcontrol.domain.repository.SessionRepository
import fr.percroy.tailcontrol.domain.repository.TvSessionRepository
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit

class ServiceLocator(
    private val baseUrl: String,
    context: Context,
) {
    private val appContext = context.applicationContext
    private val json = Json { ignoreUnknownKeys = true }

    private val database by lazy { TailControlDatabase.create(appContext) }
    private val offlineCache by lazy { OfflineCacheStore(database.cacheDao(), json) }

    val sessionRepository: SessionRepository by lazy {
        SecureSessionRepository(appContext)
    }

    val adminPinRepository: AdminPinRepository by lazy {
        AdminPinRepositoryImpl(AdminPinStore(appContext))
    }

    private val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .authenticator(TokenAuthenticator(baseUrl, sessionRepository, json))
            .addInterceptor(AuthInterceptor(sessionRepository))
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BASIC
                },
            )
            .build()
    }

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    val pairingRepository: PairingRepository by lazy {
        PairingRepositoryImpl(retrofit.create(PairingApi::class.java))
    }

    val dashboardRepository: DashboardRepository by lazy {
        CachingDashboardRepository(
            DashboardRepositoryImpl(retrofit.create(DashboardApi::class.java)),
            offlineCache,
            json,
        )
    }

    val deviceRepository: DeviceRepository by lazy {
        CachingDeviceRepository(
            DeviceRepositoryImpl(retrofit.create(DevicesApi::class.java)),
            offlineCache,
            json,
        )
    }

    val networkRepository: NetworkRepository by lazy {
        NetworkRepositoryImpl(retrofit.create(NetworkApi::class.java))
    }

    val alertsRepository: AlertsRepository by lazy {
        AlertsRepositoryImpl(retrofit.create(AlertsApi::class.java))
    }

    val tvSessionRepository: TvSessionRepository by lazy {
        TvSessionRepositoryImpl(retrofit.create(TvApi::class.java))
    }

    val dnsRepository: DnsRepository by lazy {
        DnsRepositoryImpl(retrofit.create(DnsApi::class.java))
    }

    val authKeysRepository: AuthKeysRepository by lazy {
        AuthKeysRepositoryImpl(retrofit.create(AuthKeysApi::class.java))
    }

    val policyRepository: PolicyRepository by lazy {
        PolicyRepositoryImpl(retrofit.create(PolicyApi::class.java), json)
    }

    val favoritesRepository: FavoritesRepository by lazy {
        FavoritesRepositoryImpl(retrofit.create(FavoritesApi::class.java))
    }

    val monitoringRepository: MonitoringRepository by lazy {
        MonitoringRepositoryImpl(retrofit.create(MonitoringApi::class.java))
    }

    val auditRepository: AuditRepository by lazy {
        AuditRepositoryImpl(retrofit.create(AuditApi::class.java))
    }

    val activityRepository: ActivityRepository by lazy {
        ActivityRepositoryImpl(retrofit.create(ActivityApi::class.java))
    }

    val refreshNotifier: RefreshNotifier by lazy { RefreshNotifier() }

    val alertNotifier: AlertNotifier by lazy { AlertNotifier() }

    val eventsClient: EventsClient by lazy {
        EventsClient(baseUrl)
    }
}
