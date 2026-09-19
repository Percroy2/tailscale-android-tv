package fr.percroy.tailcontrol.domain.model

data class PairingSession(
    val pairingId: String,
    val code: String,
    val expiresIn: Int,
    val pairingUrl: String,
)

data class PairingStatus(
    val pairingId: String,
    val status: String,
    val accessToken: String? = null,
    val refreshToken: String? = null,
)

data class TvSession(
    val accessToken: String,
    val refreshToken: String,
)
