package fr.percroy.tailcontrol.data.local.room

import kotlinx.serialization.json.Json

class OfflineCacheStore(
    private val cacheDao: CacheDao,
    private val json: Json,
) {
    suspend fun <T> get(key: String, deserializer: (String) -> T): T? {
        val entry = cacheDao.get(key) ?: return null
        return runCatching { deserializer(entry.payload) }.getOrNull()
    }

    suspend fun put(key: String, payload: String) {
        cacheDao.put(
            CacheEntryEntity(
                key = key,
                payload = payload,
                updatedAt = System.currentTimeMillis(),
            ),
        )
    }

    suspend fun clear(key: String) {
        cacheDao.delete(key)
    }
}
