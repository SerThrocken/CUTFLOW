package com.tlg3d.cutflow

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

// ============================================================
//  CutFlow Mobile — Android Companion App
//  Connects to desktop CutFlow REST API for remote control
//  by SerThrocken (The Looking Glass 3D)
// ============================================================

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CutFlowTheme {
                CutFlowMobileApp()
            }
        }
    }
}

// ── Theme ─────────────────────────────────────────────────────

val CutFlowDarkBg = Color(0xFF0A0A0A)
val CutFlowSurface = Color(0xFF131313)
val CutFlowBorder = Color(0xFF1E1E1E)
val CutFlowPrimary = Color(0xFF4FD97D)
val CutFlowAccent = Color(0xFFD4A574)
val CutFlowWhite = Color(0xFFE0E0E0)
val CutFlowMuted = Color(0xFF808080)

@Composable
fun CutFlowTheme(content: @Composable () -> Unit) {
    val colorScheme = darkColorScheme(
        primary = CutFlowPrimary,
        secondary = CutFlowAccent,
        background = CutFlowDarkBg,
        surface = CutFlowSurface,
        onPrimary = Color.Black,
        onBackground = CutFlowWhite,
        onSurface = CutFlowWhite,
    )
    MaterialTheme(colorScheme = colorScheme) {
        content()
    }
}

// ── Navigation ────────────────────────────────────────────────

enum class Screen {
    Home, VibeEdit, Ideas, Effects, Music, Settings
}

// ── Main App ──────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CutFlowMobileApp() {
    var currentScreen by remember { mutableStateOf(Screen.Home) }
    var serverUrl by remember { mutableStateOf("http://192.168.1.100:9876") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "CutFlow",
                        fontWeight = FontWeight.Bold,
                        color = CutFlowPrimary
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = CutFlowSurface
                ),
                actions = {
                    IconButton(onClick = { currentScreen = Screen.Settings }) {
                        Icon(Icons.Default.Settings, "Settings", tint = CutFlowMuted)
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(containerColor = CutFlowSurface) {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, "Home") },
                    label = { Text("Home") },
                    selected = currentScreen == Screen.Home,
                    onClick = { currentScreen = Screen.Home }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Edit, "Vibe Edit") },
                    label = { Text("Vibe Edit") },
                    selected = currentScreen == Screen.VibeEdit,
                    onClick = { currentScreen = Screen.VibeEdit }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Star, "Ideas") },
                    label = { Text("Ideas") },
                    selected = currentScreen == Screen.Ideas,
                    onClick = { currentScreen = Screen.Ideas }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Face, "Effects") },
                    label = { Text("Effects") },
                    selected = currentScreen == Screen.Effects,
                    onClick = { currentScreen = Screen.Effects }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.PlayArrow, "Music") },
                    label = { Text("Music") },
                    selected = currentScreen == Screen.Music,
                    onClick = { currentScreen = Screen.Music }
                )
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(CutFlowDarkBg)
                .padding(padding)
        ) {
            when (currentScreen) {
                Screen.Home -> HomeScreen(serverUrl)
                Screen.VibeEdit -> VibeEditScreen(serverUrl)
                Screen.Ideas -> IdeasScreen(serverUrl)
                Screen.Effects -> EffectsScreen(serverUrl)
                Screen.Music -> MusicScreen(serverUrl)
                Screen.Settings -> SettingsScreen(serverUrl) { serverUrl = it }
            }
        }
    }
}

// ── Home Screen ───────────────────────────────────────────────

@Composable
fun HomeScreen(serverUrl: String) {
    val scope = rememberCoroutineScope()
    var status by remember { mutableStateOf("Checking connection...") }
    var connected by remember { mutableStateOf(false) }

    LaunchedEffect(serverUrl) {
        status = try {
            val result = apiGet(serverUrl, "/status")
            connected = true
            "✅ Connected to CutFlow Desktop"
        } catch (e: Exception) {
            connected = false
            "❌ Not connected — check your desktop is running"
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "CutFlow Mobile",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = CutFlowPrimary
            )
            Text(
                "Remote control your desktop editing suite",
                color = CutFlowMuted,
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = CutFlowSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (connected) Icons.Default.CheckCircle else Icons.Default.Warning,
                        "status",
                        tint = if (connected) CutFlowPrimary else Color(0xFFEF4444),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(status, color = CutFlowWhite)
                }
            }
        }

        // Quick Actions Grid
        item {
            Text("Quick Actions", fontWeight = FontWeight.Bold, color = CutFlowWhite, modifier = Modifier.padding(top = 8.dp))
        }

        val quickActions = listOf(
            Triple("🧠 Video Ideas", "Brainstorm concepts", "/agent/ideas"),
            Triple("📋 Storyboard", "AI storyboard creator", "/agent/storyboard"),
            Triple("✨ Apply Effect", "VHS, Cyberpunk, etc.", "/agent/effect"),
            Triple("🎵 Generate Music", "Mood-based tracks", "/agent/music"),
            Triple("🔊 Sound Effects", "Whoosh, Impact, etc.", "/agent/sfx"),
            Triple("🎬 Intro/Outro", "Animated title cards", "/agent/intro"),
            Triple("📐 Auto Reframe", "9:16, 1:1, 4:5", "/agent/reframe"),
            Triple("🔇 Noise Reduce", "Clean audio AI", "/agent/denoise"),
            Triple("⏱️ Speed Ramp", "Cinematic slowmo", "/agent/speedramp"),
            Triple("🥁 Beat Sync", "Music-driven cuts", "/agent/beatsync"),
            Triple("🎤 Voice Isolate", "Extract speech", "/agent/voiceisolate"),
            Triple("🧹 Remove Object", "Delogo/watermark", "/agent/removeobj"),
        )

        items(quickActions.chunked(2)) { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { (label, desc, _) ->
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { /* Will trigger agent via API */ },
                        colors = CardDefaults.cardColors(containerColor = CutFlowSurface),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(label, fontWeight = FontWeight.Bold, color = CutFlowWhite, fontSize = 14.sp)
                            Text(desc, color = CutFlowMuted, fontSize = 11.sp)
                        }
                    }
                }
                // Fill empty space if odd number
                if (row.size < 2) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

// ── Vibe Edit Screen ──────────────────────────────────────────

@Composable
fun VibeEditScreen(serverUrl: String) {
    val scope = rememberCoroutineScope()
    var prompt by remember { mutableStateOf("") }
    var logs by remember { mutableStateOf(listOf("Console ready.")) }
    var isRunning by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Vibe Edit Console", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = CutFlowPrimary)
        Text("Describe what you want — AI handles the rest", color = CutFlowMuted, fontSize = 13.sp)

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = prompt,
            onValueChange = { prompt = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("e.g. \"Add a cinematic intro with neon style\"") },
            maxLines = 3,
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = CutFlowBorder,
                focusedBorderColor = CutFlowPrimary,
                unfocusedTextColor = CutFlowWhite,
                focusedTextColor = CutFlowWhite,
            )
        )

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = {
                if (prompt.isNotBlank()) {
                    isRunning = true
                    logs = logs + "🤖 Sending: \"$prompt\""
                    scope.launch {
                        try {
                            val result = apiPost(serverUrl, "/vibe-edit", """{"prompt":"$prompt"}""")
                            logs = logs + "✅ $result"
                        } catch (e: Exception) {
                            logs = logs + "❌ Error: ${e.message}"
                        }
                        isRunning = false
                    }
                }
            },
            enabled = !isRunning,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = CutFlowPrimary)
        ) {
            Text(if (isRunning) "Processing..." else "⚡ Execute Vibe Edit", color = Color.Black, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Log Output
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0D0D)),
            shape = RoundedCornerShape(8.dp)
        ) {
            LazyColumn(modifier = Modifier.padding(12.dp)) {
                items(logs) { log ->
                    Text(log, color = CutFlowMuted, fontSize = 12.sp, modifier = Modifier.padding(vertical = 2.dp))
                }
            }
        }
    }
}

// ── Ideas Screen ──────────────────────────────────────────────

@Composable
fun IdeasScreen(serverUrl: String) {
    val scope = rememberCoroutineScope()
    var niche by remember { mutableStateOf("") }
    var ideas by remember { mutableStateOf("") }
    var isGenerating by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("🧠 Video Idea Generator", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = CutFlowPrimary)
        Text("AI brainstorms viral video concepts for any niche", color = CutFlowMuted, fontSize = 13.sp)

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = niche,
            onValueChange = { niche = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Enter niche (e.g. fitness, tech, cooking, gaming)") },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = CutFlowBorder,
                focusedBorderColor = CutFlowPrimary,
                unfocusedTextColor = CutFlowWhite,
                focusedTextColor = CutFlowWhite,
            )
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Tech", "Fitness", "Cooking", "Gaming", "Travel").forEach { tag ->
                AssistChip(
                    onClick = { niche = tag.lowercase() },
                    label = { Text(tag, fontSize = 12.sp) },
                    colors = AssistChipDefaults.assistChipColors(containerColor = CutFlowSurface, labelColor = CutFlowAccent)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = {
                if (niche.isNotBlank()) {
                    isGenerating = true
                    scope.launch {
                        ideas = try {
                            apiPost(serverUrl, "/agent/ideas", """{"niche":"$niche","count":5}""")
                        } catch (e: Exception) {
                            "❌ Error: ${e.message}\n\nMake sure CutFlow Desktop is running."
                        }
                        isGenerating = false
                    }
                }
            },
            enabled = !isGenerating,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = CutFlowPrimary)
        ) {
            Text(if (isGenerating) "Brainstorming..." else "🧠 Generate Video Ideas", color = Color.Black, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(12.dp))

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            colors = CardDefaults.cardColors(containerColor = CutFlowSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            LazyColumn(modifier = Modifier.padding(12.dp)) {
                item {
                    Text(
                        if (ideas.isEmpty()) "Ideas will appear here..." else ideas,
                        color = if (ideas.isEmpty()) CutFlowMuted else CutFlowWhite,
                        fontSize = 13.sp,
                        lineHeight = 20.sp
                    )
                }
            }
        }
    }
}

// ── Effects Screen ────────────────────────────────────────────

@Composable
fun EffectsScreen(serverUrl: String) {
    val scope = rememberCoroutineScope()
    var result by remember { mutableStateOf("") }

    val effects = listOf(
        "vhs" to "🕹️ VHS Retro",
        "film_grain" to "🎞️ Film Grain",
        "dreamy" to "✨ Dreamy",
        "cyberpunk" to "🌆 Cyberpunk",
        "noir" to "🖤 Noir",
        "sepia" to "🟤 Sepia",
        "teal_orange" to "🎬 Teal & Orange",
        "vignette" to "⬛ Vignette",
        "bloom" to "💡 Bloom",
        "sharpen" to "🔍 Sharpen",
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("✨ Visual Effects Library", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = CutFlowPrimary)
        Text("Tap an effect to apply it to all project videos", color = CutFlowMuted, fontSize = 13.sp)

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
            items(effects.chunked(2)) { row ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    row.forEach { (key, label) ->
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    scope.launch {
                                        result = try {
                                            apiPost(serverUrl, "/agent/effect", """{"effect":"$key"}""")
                                        } catch (e: Exception) {
                                            "Error: ${e.message}"
                                        }
                                    }
                                },
                            colors = CardDefaults.cardColors(containerColor = CutFlowSurface),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                label,
                                modifier = Modifier.padding(16.dp),
                                color = CutFlowWhite,
                                fontWeight = FontWeight.Medium,
                                fontSize = 15.sp
                            )
                        }
                    }
                    if (row.size < 2) Spacer(modifier = Modifier.weight(1f))
                }
            }
        }

        if (result.isNotEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0D0D)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(result, modifier = Modifier.padding(12.dp), color = CutFlowPrimary, fontSize = 13.sp)
            }
        }
    }
}

// ── Music Screen ──────────────────────────────────────────────

@Composable
fun MusicScreen(serverUrl: String) {
    val scope = rememberCoroutineScope()
    var result by remember { mutableStateOf("") }

    val moods = listOf(
        "epic" to "🎻 Epic",
        "chill" to "🌊 Chill",
        "hype" to "🔥 Hype",
        "sad" to "💧 Sad",
        "corporate" to "💼 Corporate",
        "lofi" to "☕ Lo-Fi",
        "action" to "⚔️ Action",
        "horror" to "👻 Horror",
    )

    val sfx = listOf(
        "whoosh" to "💨 Whoosh",
        "impact" to "💥 Impact",
        "riser" to "📈 Riser",
        "drop" to "📉 Drop",
        "glitch" to "🔌 Glitch",
        "notification" to "🔔 Notification",
        "ambient" to "🌲 Ambient",
        "transition" to "🔄 Transition",
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text("🎵 Music Generator", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = CutFlowPrimary)
            Text("Generate mood-based background tracks", color = CutFlowMuted, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(8.dp))
        }

        items(moods.chunked(2)) { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (key, label) ->
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                scope.launch {
                                    result = try {
                                        apiPost(serverUrl, "/agent/music", """{"mood":"$key","duration":60}""")
                                    } catch (e: Exception) { "Error: ${e.message}" }
                                }
                            },
                        colors = CardDefaults.cardColors(containerColor = CutFlowSurface),
                        shape = RoundedCornerShape(12.dp)
                    ) { Text(label, modifier = Modifier.padding(14.dp), color = CutFlowWhite, fontWeight = FontWeight.Medium) }
                }
                if (row.size < 2) Spacer(modifier = Modifier.weight(1f))
            }
        }

        item {
            Spacer(modifier = Modifier.height(12.dp))
            Text("🔊 Sound Effects", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = CutFlowAccent)
            Spacer(modifier = Modifier.height(4.dp))
        }

        items(sfx.chunked(2)) { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (key, label) ->
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                scope.launch {
                                    result = try {
                                        apiPost(serverUrl, "/agent/sfx", """{"type":"$key","duration":2.0}""")
                                    } catch (e: Exception) { "Error: ${e.message}" }
                                }
                            },
                        colors = CardDefaults.cardColors(containerColor = CutFlowSurface),
                        shape = RoundedCornerShape(12.dp)
                    ) { Text(label, modifier = Modifier.padding(14.dp), color = CutFlowWhite, fontWeight = FontWeight.Medium) }
                }
                if (row.size < 2) Spacer(modifier = Modifier.weight(1f))
            }
        }

        if (result.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0D0D)),
                    shape = RoundedCornerShape(8.dp)
                ) { Text(result, modifier = Modifier.padding(12.dp), color = CutFlowPrimary, fontSize = 13.sp) }
            }
        }
    }
}

// ── Settings Screen ───────────────────────────────────────────

@Composable
fun SettingsScreen(serverUrl: String, onUrlChange: (String) -> Unit) {
    var url by remember { mutableStateOf(serverUrl) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("⚙️ Settings", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = CutFlowPrimary)

        Spacer(modifier = Modifier.height(16.dp))

        Text("Desktop Server URL", color = CutFlowMuted, fontSize = 12.sp)
        OutlinedTextField(
            value = url,
            onValueChange = { url = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = CutFlowBorder,
                focusedBorderColor = CutFlowPrimary,
                unfocusedTextColor = CutFlowWhite,
                focusedTextColor = CutFlowWhite,
            )
        )

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = { onUrlChange(url) },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = CutFlowPrimary)
        ) {
            Text("Save Connection", color = Color.Black, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = CutFlowSurface),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("About CutFlow Mobile", fontWeight = FontWeight.Bold, color = CutFlowWhite)
                Text("Version 1.0.0", color = CutFlowMuted, fontSize = 13.sp)
                Text("by SerThrocken (TLG3D)", color = CutFlowMuted, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "CutFlow Mobile connects to your desktop CutFlow instance over your local network. " +
                    "All processing happens on your PC — the mobile app is a remote control.",
                    color = CutFlowMuted,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
            }
        }
    }
}

// ── API Utilities ─────────────────────────────────────────────

suspend fun apiGet(baseUrl: String, path: String): String = withContext(Dispatchers.IO) {
    val url = URL("$baseUrl$path")
    val conn = url.openConnection() as HttpURLConnection
    conn.requestMethod = "GET"
    conn.connectTimeout = 5000
    conn.readTimeout = 10000
    try {
        conn.inputStream.bufferedReader().readText()
    } finally {
        conn.disconnect()
    }
}

suspend fun apiPost(baseUrl: String, path: String, body: String): String = withContext(Dispatchers.IO) {
    val url = URL("$baseUrl$path")
    val conn = url.openConnection() as HttpURLConnection
    conn.requestMethod = "POST"
    conn.setRequestProperty("Content-Type", "application/json")
    conn.doOutput = true
    conn.connectTimeout = 5000
    conn.readTimeout = 30000
    try {
        conn.outputStream.use { it.write(body.toByteArray()) }
        conn.inputStream.bufferedReader().readText()
    } finally {
        conn.disconnect()
    }
}
