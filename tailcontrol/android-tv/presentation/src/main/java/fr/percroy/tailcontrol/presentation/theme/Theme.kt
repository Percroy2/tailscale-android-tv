package fr.percroy.tailcontrol.presentation.theme

import androidx.compose.ui.graphics.Color
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val TailControlColors = darkColorScheme(
    primary = Color(0xFF0EA5E9),
    onPrimary = Color.White,
    background = Color(0xFF020617),
    onBackground = Color(0xFFF8FAFC),
    surface = Color(0xFF0F172A),
    onSurface = Color(0xFFE2E8F0),
    error = Color(0xFFEF4444),
)

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TailControlTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = TailControlColors,
        content = content,
    )
}
