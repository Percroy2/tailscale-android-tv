package fr.percroy.tailcontrol.data.local.room

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [CacheEntryEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class TailControlDatabase : RoomDatabase() {
    abstract fun cacheDao(): CacheDao

    companion object {
        fun create(context: Context): TailControlDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                TailControlDatabase::class.java,
                "tailcontrol_cache.db",
            ).build()
        }
    }
}
