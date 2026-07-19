mod gpu;
mod system_info;
mod ffmpeg;
mod ollama;
mod process_manager;
mod agents;
pub mod security;

use gpui::{
    div, prelude::*, px, rgb, size, App, Application, Bounds, Context, KeyDownEvent,
    SharedString, Window, WindowBounds, WindowOptions,
};
use std::time::Duration;

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum View {
    Onboarding,
    Dashboard,
    Editor,
    Teleprompter,
    Marketplace,
    Messaging,
    Settings,
}

#[derive(Clone, Debug)]
struct Clip {
    name: String,
    duration: f64,
    clip_type: String, // "video" | "audio" | "sfx" | "voiceover"
    track: usize,      // 0 = video, 1 = BGM, 2 = SFX, 3 = voiceover
    start_time: f64,
}

struct CutFlowApp {
    active_view: View,
    setup_step: usize,
    username: String,
    llm_provider: String,
    sys_info: Option<system_info::SystemInfo>,
    
    // Editor State
    imported_clips: Vec<Clip>,
    timeline_clips: Vec<Clip>,
    playhead_sec: f64,
    playing: bool,
    
    // Vibe Edit / Agent Console
    vibe_prompt: String,
    prompt_focused: bool,
    agent_running: bool,
    agent_progress: u32,
    agent_logs: Vec<String>,
    
    // Customization & Presets
    color_preset: String,
    transition_type: String,
    transition_dur: f64,
    bg_music_vol: f64,
    ducking_enabled: bool,
    
    // Background Services Manager
    ollama_running: bool,
    api_backend_running: bool,
    video_engine_running: bool,
    discord_bot_running: bool,
    telegram_bot_running: bool,
    
    // Background Processes Handles (simulated/active outputs)
    api_process_log: Vec<String>,
    video_process_log: Vec<String>,
    process_manager: process_manager::ProcessManager,

    // Teleprompter State
    teleprompter_text: String,
    teleprompter_scroll_pos: f32,
    teleprompter_scrolling: bool,
    teleprompter_tempo: u32,
    teleprompter_voice_scroll: bool,
    
    // UI Theme & Editor State
    theme_id: String,
    advanced_mode: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Theme {
    id: &'static str,
    name: &'static str,
    bg: gpui::Rgba,
    surface: gpui::Rgba,
    border: gpui::Rgba,
    primary: gpui::Rgba,
    accent: gpui::Rgba,
    white: gpui::Rgba,
    bright: gpui::Rgba,
    muted: gpui::Rgba,
    success: gpui::Rgba,
    error: gpui::Rgba,
}

impl CutFlowApp {
    fn get_current_theme(&self) -> Theme {
        match self.theme_id.as_str() {
            "midnight_ocean" => Theme {
                id: "midnight_ocean",
                name: "Midnight Ocean",
                bg: rgb(0x0A192F),
                surface: rgb(0x112240),
                border: rgb(0x233554),
                primary: rgb(0x64FFDA),
                accent: rgb(0x8892B0),
                white: rgb(0xCCD6F6),
                bright: rgb(0xE6F1FF),
                muted: rgb(0x8892B0),
                success: rgb(0x10b981),
                error: rgb(0xef4444),
            },
            "nordic_studio" => Theme {
                id: "nordic_studio",
                name: "Nordic Studio",
                bg: rgb(0x2E3440),
                surface: rgb(0x3B4252),
                border: rgb(0x4C566A),
                primary: rgb(0x81A1C1),
                accent: rgb(0xA3BE8C),
                white: rgb(0xD8DEE9),
                bright: rgb(0xECEFF4),
                muted: rgb(0x4C566A),
                success: rgb(0xA3BE8C),
                error: rgb(0xBF616A),
            },
            "graphite_minimal" => Theme {
                id: "graphite_minimal",
                name: "Graphite Minimal",
                bg: rgb(0x000000),
                surface: rgb(0x111111),
                border: rgb(0x333333),
                primary: rgb(0xFFFFFF),
                accent: rgb(0xA1A1AA),
                white: rgb(0xE0E0E0),
                bright: rgb(0xFFFFFF),
                muted: rgb(0x666666),
                success: rgb(0x10b981),
                error: rgb(0xef4444),
            },
            _ => Theme { // Default to TLG3D Industrial
                id: "tlg3d_industrial",
                name: "TLG3D Industrial",
                bg: rgb(0x15171A),
                surface: rgb(0x1E2125),
                border: rgb(0x2D3136),
                primary: rgb(0x2EC4B6), // Neon Swirl Green
                accent: rgb(0xFF9F1C),  // Swirl Yellow
                white: rgb(0xE0E0E0),
                bright: rgb(0xFFFFFF),
                muted: rgb(0x808080),
                success: rgb(0x2EC4B6),
                error: rgb(0xE71D36),
            }
        }
    }
}

impl CutFlowApp {
    fn new(cx: &mut Context<Self>) -> Self {
        // Initialize default timeline clips
        let default_clips = vec![
            Clip {
                name: "cam_roll_01.mp4".into(),
                duration: 18.5,
                clip_type: "video".into(),
                track: 0,
                start_time: 0.0,
            },
            Clip {
                name: "b_roll_ocean.mp4".into(),
                duration: 12.0,
                clip_type: "video".into(),
                track: 0,
                start_time: 18.5,
            },
            Clip {
                name: "summer_beat.mp3".into(),
                duration: 35.0,
                clip_type: "audio".into(),
                track: 1,
                start_time: 0.0,
            },
            Clip {
                name: "voiceover_01.mp3".into(),
                duration: 10.0,
                clip_type: "voiceover".into(),
                track: 3,
                start_time: 2.0,
            },
        ];

        // Trigger system detection
        let info = system_info::get_system_info();
        
        let app = Self {
            active_view: View::Onboarding,
            setup_step: 1,
            username: "".into(),
            llm_provider: "openrouter".into(),
            sys_info: Some(info),
            imported_clips: vec![],
            timeline_clips: default_clips,
            playhead_sec: 4.5,
            playing: false,
            vibe_prompt: "Enter natural language instructions here...".into(),
            prompt_focused: false,
            agent_running: false,
            agent_progress: 0,
            agent_logs: vec![
                "Console initialized.".into(),
                "Vibe Edit Engine ready.".into(),
            ],
            color_preset: "neutral".into(),
            transition_type: "fade".into(),
            transition_dur: 1.0,
            bg_music_vol: 0.3,
            ducking_enabled: true,
            ollama_running: false,
            api_backend_running: false,
            video_engine_running: false,
            discord_bot_running: false,
            telegram_bot_running: false,
            api_process_log: vec![],
            video_process_log: vec![],
            process_manager: process_manager::ProcessManager::new(),
            teleprompter_text: "Welcome to CutFlow. This is your professional teleprompter tool. Practice speaking at a steady tempo. The script can auto-scroll as you speak, or scroll at a fixed words-per-minute rate to help you maintain a perfect pace. Customize the settings below and click 'Start Teleprompter' to begin your practice run.".into(),
            teleprompter_scroll_pos: 0.0,
            teleprompter_scrolling: false,
            teleprompter_tempo: 130, // 130 WPM average speaking speed
            teleprompter_voice_scroll: false,
            theme_id: "tlg3d_industrial".into(),
            advanced_mode: false,
        };

        // Query Ollama status asynchronously
        cx.spawn(|this: gpui::WeakEntity<Self>, cx: &mut gpui::AsyncApp| {
            let mut cx = cx.clone();
            async move {
                let running = ollama::check_ollama_running().await;
                this.update(&mut cx, |app, cx| {
                    app.ollama_running = running;
                    cx.notify();
                }).ok();
            }
        }).detach();

        app
    }

    fn run_vibe_edit_command(&mut self, cx: &mut Context<Self>) {
        if self.vibe_prompt.trim().is_empty() || self.vibe_prompt == "Enter natural language instructions here..." {
            return;
        }

        self.agent_running = true;
        self.agent_progress = 0;
        self.agent_logs.clear();
        self.agent_logs.push(format!("🤖 Vibe Edit prompt received: \"{}\"", self.vibe_prompt));
        self.agent_logs.push("Classifying instruction using router...".into());
        cx.notify();

        let prompt = self.vibe_prompt.clone();
        let provider = self.llm_provider.clone();
        let project_path = "data/users/default/projects/default_project"; // Use standard local path
        
        // Ensure directories exist
        let _ = std::fs::create_dir_all(format!("{}/assets/videos", project_path));
        let _ = std::fs::create_dir_all(format!("{}/assets/audio", project_path));

        // Spawn a background task to simulate the agentic pipeline execution
        cx.spawn(move |this: gpui::WeakEntity<Self>, cx: &mut gpui::AsyncApp| {
            let mut cx = cx.clone();
            async move {
                let prompt_lower = prompt.to_lowercase();
                let result = if prompt_lower.contains("color") || prompt_lower.contains("grade") || prompt_lower.contains("cinematic") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("Executing Color Correction Agent...".into());
                        cx.notify();
                    }).ok();
                    agents::run_color_correction(project_path, "cinematic").await
                } else if prompt_lower.contains("stabilize") || prompt_lower.contains("smooth") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("Executing Motion Smoothing Agent...".into());
                        cx.notify();
                    }).ok();
                    agents::run_motion_smoothing(project_path, "medium").await
                } else if prompt_lower.contains("scene") || prompt_lower.contains("detect cut") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("Executing Scene Detection Agent...".into());
                        cx.notify();
                    }).ok();
                    agents::run_scene_detection(project_path, 0.3).await
                } else if prompt_lower.contains("subtitle") || prompt_lower.contains("caption") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("Executing Subtitle Generation Agent...".into());
                        cx.notify();
                    }).ok();
                    agents::run_subtitle_generation(project_path, "tiktok-bold").await
                } else if prompt_lower.contains("narration") || (prompt_lower.contains("voice") && prompt_lower.contains("over")) {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("Executing Voiceover Synthesis Agent...".into());
                        cx.notify();
                    }).ok();
                    agents::run_voiceover_synthesis(project_path, "Welcome to CutFlow fully native desktop editing app.", "21m00Tcm4TlvDq8ikWAM").await
                } else if prompt_lower.contains("trim") || prompt_lower.contains("auto edit") || prompt_lower.contains("rough cut") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("Executing Auto Editing Agent...".into());
                        cx.notify();
                    }).ok();
                    agents::run_auto_editing(project_path, "dynamic", 30.0).await
                } else if prompt_lower.contains("engagement") || prompt_lower.contains("predict") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("Executing Engagement Predictor Agent...".into());
                        cx.notify();
                    }).ok();
                    agents::run_engagement_prediction(project_path, "TikTok").await
                // ── NEW AGENTS ────────────────────────────────────
                } else if prompt_lower.contains("idea") || prompt_lower.contains("brainstorm") || prompt_lower.contains("video concept") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🧠 Brainstorming video ideas...".into());
                        cx.notify();
                    }).ok();
                    agents::run_video_idea_brainstorm(project_path, &prompt, 5).await
                } else if prompt_lower.contains("intro") || prompt_lower.contains("outro") {
                    let is_intro = prompt_lower.contains("intro");
                    let style = if prompt_lower.contains("glitch") { "glitch" }
                        else if prompt_lower.contains("neon") { "neon" }
                        else if prompt_lower.contains("retro") { "retro" }
                        else if prompt_lower.contains("minimal") { "minimal" }
                        else if prompt_lower.contains("particle") { "particle" }
                        else if prompt_lower.contains("liquid") { "liquid" }
                        else if prompt_lower.contains("corporate") { "corporate" }
                        else { "cinematic" };
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push(format!("🎬 Generating {} animation ({} style)...", if is_intro { "intro" } else { "outro" }, style));
                        cx.notify();
                    }).ok();
                    agents::run_intro_outro_generator(project_path, "CutFlow", style, 5.0, is_intro).await
                } else if prompt_lower.contains("effect") || prompt_lower.contains("vhs") || prompt_lower.contains("dreamy") || prompt_lower.contains("cyberpunk") || prompt_lower.contains("noir") || prompt_lower.contains("sepia") || prompt_lower.contains("bloom") {
                    let effect = if prompt_lower.contains("vhs") { "vhs" }
                        else if prompt_lower.contains("film grain") { "film_grain" }
                        else if prompt_lower.contains("dreamy") { "dreamy" }
                        else if prompt_lower.contains("cyberpunk") { "cyberpunk" }
                        else if prompt_lower.contains("noir") { "noir" }
                        else if prompt_lower.contains("sepia") { "sepia" }
                        else if prompt_lower.contains("teal") { "teal_orange" }
                        else if prompt_lower.contains("vignette") { "vignette" }
                        else if prompt_lower.contains("bloom") { "bloom" }
                        else if prompt_lower.contains("sharpen") { "sharpen" }
                        else { "cyberpunk" };
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push(format!("✨ Applying '{}' visual effect...", effect));
                        cx.notify();
                    }).ok();
                    agents::run_apply_effect(project_path, effect).await
                } else if prompt_lower.contains("sound effect") || prompt_lower.contains("sfx") || prompt_lower.contains("whoosh") || prompt_lower.contains("impact") || prompt_lower.contains("riser") {
                    let sfx = if prompt_lower.contains("whoosh") { "whoosh" }
                        else if prompt_lower.contains("impact") { "impact" }
                        else if prompt_lower.contains("riser") { "riser" }
                        else if prompt_lower.contains("drop") { "drop" }
                        else if prompt_lower.contains("glitch") { "glitch" }
                        else if prompt_lower.contains("notification") { "notification" }
                        else if prompt_lower.contains("ambient") { "ambient" }
                        else { "transition" };
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push(format!("🔊 Generating '{}' sound effect...", sfx));
                        cx.notify();
                    }).ok();
                    agents::run_generate_sfx(project_path, sfx, 2.0).await
                } else if prompt_lower.contains("music") || prompt_lower.contains("beat") || prompt_lower.contains("soundtrack") || prompt_lower.contains("bgm") {
                    let mood = if prompt_lower.contains("epic") { "epic" }
                        else if prompt_lower.contains("chill") { "chill" }
                        else if prompt_lower.contains("hype") { "hype" }
                        else if prompt_lower.contains("sad") { "sad" }
                        else if prompt_lower.contains("corporate") { "corporate" }
                        else if prompt_lower.contains("lofi") || prompt_lower.contains("lo-fi") { "lofi" }
                        else if prompt_lower.contains("action") { "action" }
                        else if prompt_lower.contains("horror") { "horror" }
                        else { "chill" };
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push(format!("🎵 Generating '{}' background music...", mood));
                        cx.notify();
                    }).ok();
                    agents::run_generate_music(project_path, mood, 60.0).await
                } else if prompt_lower.contains("reframe") || prompt_lower.contains("vertical") || prompt_lower.contains("9:16") || prompt_lower.contains("square") {
                    let aspect = if prompt_lower.contains("9:16") || prompt_lower.contains("vertical") || prompt_lower.contains("tiktok") || prompt_lower.contains("reel") { "9:16" }
                        else if prompt_lower.contains("square") || prompt_lower.contains("1:1") { "1:1" }
                        else if prompt_lower.contains("4:5") { "4:5" }
                        else { "9:16" };
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push(format!("📐 Auto-reframing to {} aspect ratio...", aspect));
                        cx.notify();
                    }).ok();
                    agents::run_auto_reframe(project_path, aspect).await
                } else if prompt_lower.contains("duck") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🔉 Applying audio ducking...".into());
                        cx.notify();
                    }).ok();
                    agents::run_audio_ducker(project_path, 0.3).await
                } else if prompt_lower.contains("noise") || prompt_lower.contains("denoise") || prompt_lower.contains("clean audio") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🔇 Applying noise reduction...".into());
                        cx.notify();
                    }).ok();
                    agents::run_noise_reduction(project_path, "medium").await
                } else if prompt_lower.contains("speed ramp") || prompt_lower.contains("slow mo") || prompt_lower.contains("slowmo") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("⏱️ Generating speed ramp...".into());
                        cx.notify();
                    }).ok();
                    agents::run_speed_ramp(project_path, 2.5, 3.0).await
                } else if prompt_lower.contains("lut") || prompt_lower.contains("color grade file") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🎨 Applying LUT color grade...".into());
                        cx.notify();
                    }).ok();
                    agents::run_lut_application(project_path, "default.cube").await
                } else if prompt_lower.contains("voice isolat") || prompt_lower.contains("extract voice") || prompt_lower.contains("isolate speech") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🎤 Isolating vocals...".into());
                        cx.notify();
                    }).ok();
                    agents::run_voice_isolation(project_path).await
                } else if prompt_lower.contains("edit detect") || prompt_lower.contains("find cuts") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("✂️ Detecting edit points...".into());
                        cx.notify();
                    }).ok();
                    agents::run_edit_detection(project_path).await
                } else if prompt_lower.contains("ken burns") || prompt_lower.contains("zoom pan") || prompt_lower.contains("slow zoom") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🔍 Applying Ken Burns effect...".into());
                        cx.notify();
                    }).ok();
                    agents::run_ken_burns(project_path, 0.003).await
                } else if prompt_lower.contains("beat sync") || prompt_lower.contains("sync to beat") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🥁 Analyzing beat markers...".into());
                        cx.notify();
                    }).ok();
                    agents::run_beat_sync(project_path).await
                } else if prompt_lower.contains("background remov") || prompt_lower.contains("green screen") || prompt_lower.contains("chromakey") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🖼️ Removing background...".into());
                        cx.notify();
                    }).ok();
                    agents::run_background_removal(project_path, "green").await
                } else if prompt_lower.contains("remove object") || prompt_lower.contains("delogo") || prompt_lower.contains("watermark") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🧹 Removing objects...".into());
                        cx.notify();
                    }).ok();
                    agents::run_object_removal(project_path, 10, 10, 200, 50).await
                } else if prompt_lower.contains("extend") || prompt_lower.contains("longer") || prompt_lower.contains("stretch clip") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("⏩ Extending clips...".into());
                        cx.notify();
                    }).ok();
                    agents::run_generative_extend(project_path, 3.0).await
                } else if prompt_lower.contains("match color") || prompt_lower.contains("unify color") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🎨 Matching color across clips...".into());
                        cx.notify();
                    }).ok();
                    agents::run_match_color(project_path).await
                } else if prompt_lower.contains("storyboard") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("📋 Creating storyboard...".into());
                        cx.notify();
                    }).ok();
                    agents::run_text_to_storyboard(project_path, &prompt).await
                } else if prompt_lower.contains("dissolve") || prompt_lower.contains("transition shape") {
                    let shape = if prompt_lower.contains("circle") { "circle" }
                        else if prompt_lower.contains("diamond") { "diamond" }
                        else if prompt_lower.contains("blind") { "blinds" }
                        else { "circle" };
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push(format!("💫 Applying {} dissolve transition...", shape));
                        cx.notify();
                    }).ok();
                    agents::run_shape_dissolve(project_path, shape).await
                } else if prompt_lower.contains("music advi") || prompt_lower.contains("suggest music") || prompt_lower.contains("what music") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🎼 Consulting Music Director AI...".into());
                        cx.notify();
                    }).ok();
                    agents::run_music_advisor(&prompt).await
                } else if prompt_lower.contains("b-roll") || prompt_lower.contains("broll") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🎞️ Fetching B-Roll...".into());
                        cx.notify();
                    }).ok();
                    agents::run_broll_fetcher(project_path, &prompt).await
                } else if prompt_lower.contains("face track") || prompt_lower.contains("auto zoom") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("👀 Applying face tracking auto-zoom...".into());
                        cx.notify();
                    }).ok();
                    agents::run_face_track_zoom(project_path, "input.mp4").await
                } else if prompt_lower.contains("emotion grade") || prompt_lower.contains("mood color") {
                    let emotion = if prompt_lower.contains("sad") { "sad" }
                        else if prompt_lower.contains("energetic") { "energetic" }
                        else if prompt_lower.contains("scary") { "scary" }
                        else { "cinematic" };
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push(format!("🎨 Applying {} emotion grade...", emotion));
                        cx.notify();
                    }).ok();
                    agents::run_emotion_grade(project_path, "input.mp4", emotion).await
                } else if prompt_lower.contains("tts") || prompt_lower.contains("text to speech") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("🗣️ Generating AI voiceover...".into());
                        cx.notify();
                    }).ok();
                    agents::run_tts_voiceover(project_path, &prompt, "eleven_monolingual_v1").await
                } else if prompt_lower.contains("auto sub") || prompt_lower.contains("transcribe") {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("📝 Generating auto-subtitles...".into());
                        cx.notify();
                    }).ok();
                    agents::run_auto_subtitles(project_path, "input.mp4").await
                } else {
                    this.update(&mut cx, |app, cx| {
                        app.agent_progress = 30;
                        app.agent_logs.push("Executing Script Generation Agent...".into());
                        cx.notify();
                    }).ok();
                    agents::run_script_generation(project_path, &prompt, "professional", &provider).await
                };

                match result {
                    Ok(out) => {
                        this.update(&mut cx, |app, cx| {
                            app.agent_progress = 100;
                            app.agent_running = false;
                            app.agent_logs.push("🎉 Agent execution complete!".into());
                            app.agent_logs.push(format!("Output: {}", out));
                            cx.notify();
                        }).ok();
                    }
                    Err(e) => {
                        this.update(&mut cx, |app, cx| {
                            app.agent_progress = 100;
                            app.agent_running = false;
                            app.agent_logs.push(format!("✗ Agent failed: {}", e));
                            cx.notify();
                        }).ok();
                    }
                }
            }
        }).detach();
    }
}

impl Render for CutFlowApp {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = self.get_current_theme();
        
        let palette_bg = theme.bg;
        let palette_surface = theme.surface;
        let palette_border = theme.border;
        let palette_primary = theme.primary;
        let palette_accent = theme.accent;
        let palette_white = theme.white;
        let palette_bright = theme.bright;
        let palette_muted = theme.muted;
        let palette_success = theme.success;
        let palette_error = theme.error;

        if self.active_view == View::Onboarding {
            // ─── ONBOARDING SETUP WIZARD VIEW ───
            let step_title = match self.setup_step {
                1 => "Welcome to CutFlow",
                2 => "System Diagnosis",
                3 => "AI Model Router Config",
                4 => "Messaging Bot Integrations",
                5 => "Theme & Personalization",
                _ => "Ready for Vibe Editing!",
            };

            let step_desc = match self.setup_step {
                1 => "Configure your creator profile to start building.",
                2 => "CutFlow runs models offline. Checking GPU, VRAM, and tools.",
                3 => "Choose where to route natural language prompts (local or cloud).",
                4 => "Toggle daemons to accept creator commands from Discord & Telegram.",
                5 => "Personalize workspace color palettes and default transitions.",
                _ => "Setup complete. Dive into native, high-performance video editing.",
            };

            div()
                .size_full()
                .bg(palette_bg)
                .flex()
                .flex_col()
                .items_center()
                .justify_center()
                .p_6()
                .child(
                    div()
                        .w(px(520.0))
                        .bg(palette_surface)
                        .border_1()
                        .border_color(palette_border)
                        .rounded(px(16.0))
                        .p_8()
                        .flex()
                        .flex_col()
                        .child(
                            // Progress bar indicators
                            div()
                                .flex()
                                .gap_2()
                                .mb_6()
                                .children((1..=6).map(|idx| {
                                    div()
                                        .flex_grow()
                                        .h(px(4.0))
                                        .rounded_md()
                                        .bg(if idx <= self.setup_step { palette_primary } else { palette_border })
                                }))
                        )
                        .child(
                            div()
                                .text_color(palette_bright)
                                .text_3xl()
                                .font_weight(gpui::FontWeight::BOLD)
                                .mb_1()
                                .child(step_title)
                        )
                        .child(
                            div()
                                .text_color(palette_muted)
                                .text_sm()
                                .mb_6()
                                .child(step_desc)
                        )
                        .child(
                            // Step Specific Contents
                            match self.setup_step {
                                1 => {
                                    div()
                                        .flex()
                                        .flex_col()
                                        .gap_4()
                                        .child(
                                            div()
                                                .text_color(palette_white)
                                                .text_xs()
                                                .child("CREATOR USERNAME")
                                        )
                                        .child(
                                            div()
                                                .id("username-input-container")
                                                .flex()
                                                .items_center()
                                                .bg(palette_bg)
                                                .border_1()
                                                .border_color(palette_border)
                                                .rounded_md()
                                                .px_4()
                                                .py_3()
                                                .child(
                                                    if self.username.is_empty() {
                                                        div().text_color(palette_muted).child("Enter name...")
                                                    } else {
                                                        div().text_color(palette_white).child(self.username.clone())
                                                    }
                                                )
                                                .cursor_pointer()
                                                .on_click(cx.listener(|this, _, _, cx| {
                                                    this.username = "serthrocken".into();
                                                    cx.notify();
                                                }))
                                        )
                                        .child(
                                            div()
                                                .text_color(palette_muted)
                                                .text_xs()
                                                .child("💡 Click inside input box to quick-populate your name.")
                                        )
                                }
                                2 => {
                                    let info = self.sys_info.clone().unwrap_or_else(|| system_info::get_system_info());
                                    div()
                                        .flex()
                                        .flex_col()
                                        .gap_2()
                                        .child(self.diag_row("OS Platform", &info.os, true, palette_white, palette_muted, palette_success, palette_error))
                                        .child(self.diag_row("CPU Brand", &info.cpu_brand, true, palette_white, palette_muted, palette_success, palette_error))
                                        .child(self.diag_row("System RAM", &format!("{} GB (Min: 16GB, Rec: 32-64GB DDR5)", info.total_ram_gb), info.total_ram_gb >= 16.0, palette_white, palette_muted, palette_success, palette_error))
                                        .child(self.diag_row("GPU Hardware", &format!("{} ({}GB VRAM - Min: 8GB, Rec: 12GB)", info.gpu_name, info.gpu_vram_gb), info.gpu_vram_gb >= 8.0, palette_white, palette_muted, palette_success, palette_error))
                                        .child(self.diag_row("FFmpeg Executable", if info.ffmpeg_installed { "✓ Detected" } else { "✗ Missing" }, info.ffmpeg_installed, palette_white, palette_muted, palette_success, palette_error))
                                        .child(self.diag_row("Ollama API Service", if self.ollama_running { "✓ Running" } else { "✗ Stopped" }, self.ollama_running, palette_white, palette_muted, palette_success, palette_error))
                                }
                                3 => {
                                    div()
                                        .flex()
                                        .flex_col()
                                        .gap_3()
                                        .child(self.provider_card("openrouter", "OpenRouter Cloud", "Access 100+ models at minimal cost.", self.llm_provider == "openrouter", palette_primary, palette_border, palette_white, palette_muted, cx))
                                        .child(self.provider_card("local", "Local Ollama (Offline)", "Zero latency, private, offline execution. Needs 8GB+ (Rec 12GB+) VRAM.", self.llm_provider == "local", palette_primary, palette_border, palette_white, palette_muted, cx))
                                        .child(self.provider_card("openai", "OpenAI API", "State-of-the-art model performance.", self.llm_provider == "openai", palette_primary, palette_border, palette_white, palette_muted, cx))
                                }
                                4 => {
                                    div()
                                        .flex()
                                        .flex_col()
                                        .gap_4()
                                        .child(
                                            div()
                                                .flex()
                                                .justify_between()
                                                .items_center()
                                                .child(div().text_color(palette_white).child("Discord Bot Daemon"))
                                                .child(
                                                    div()
                                                        .id("discord-daemon-toggle")
                                                        .bg(if self.discord_bot_running { palette_primary } else { palette_border })
                                                        .text_color(palette_bg)
                                                        .font_weight(gpui::FontWeight::BOLD)
                                                        .px_3()
                                                        .py_1()
                                                        .rounded_md()
                                                        .child(if self.discord_bot_running { "ACTIVE BACKGROUND" } else { "DISABLED" })
                                                        .cursor_pointer()
                                                        .on_click(cx.listener(|this, _, _, cx| {
                                                            this.discord_bot_running = !this.discord_bot_running;
                                                            cx.notify();
                                                        }))
                                                )
                                        )
                                        .child(
                                            div()
                                                .flex()
                                                .justify_between()
                                                .items_center()
                                                .child(div().text_color(palette_white).child("Telegram Bot Daemon"))
                                                .child(
                                                    div()
                                                        .id("telegram-daemon-toggle")
                                                        .bg(if self.telegram_bot_running { palette_primary } else { palette_border })
                                                        .text_color(palette_bg)
                                                        .font_weight(gpui::FontWeight::BOLD)
                                                        .px_3()
                                                        .py_1()
                                                        .rounded_md()
                                                        .child(if self.telegram_bot_running { "ACTIVE BACKGROUND" } else { "DISABLED" })
                                                        .cursor_pointer()
                                                        .on_click(cx.listener(|this, _, _, cx| {
                                                            this.telegram_bot_running = !this.telegram_bot_running;
                                                            cx.notify();
                                                        }))
                                                )
                                        )
                                }
                                5 => {
                                    div()
                                        .flex()
                                        .flex_col()
                                        .gap_4()
                                        .child(
                                            div()
                                                .flex()
                                                .justify_between()
                                                .items_center()
                                                .child(div().text_color(palette_white).child("Default Transition Style"))
                                                .child(
                                                    div()
                                                        .id("transition-selector")
                                                        .bg(palette_border)
                                                        .px_3()
                                                        .py_1()
                                                        .rounded_md()
                                                        .text_color(palette_accent)
                                                        .child(self.transition_type.to_uppercase())
                                                        .cursor_pointer()
                                                        .on_click(cx.listener(|this, _, _, cx| {
                                                            this.transition_type = match this.transition_type.as_str() {
                                                                "fade" => "wipe".into(),
                                                                "wipe" => "zoom".into(),
                                                                _ => "fade".into(),
                                                            };
                                                            cx.notify();
                                                        }))
                                                )
                                        )
                                        .child(
                                            div()
                                                .flex()
                                                .justify_between()
                                                .items_center()
                                                .child(div().text_color(palette_white).child("Workspace Colors"))
                                                .child(
                                                    div()
                                                        .flex()
                                                        .gap_2()
                                                        .child(div().w(px(16.0)).h(px(16.0)).rounded_full().bg(rgb(0x4fd97d)))
                                                        .child(div().w(px(16.0)).h(px(16.0)).rounded_full().bg(rgb(0xd4a574)))
                                                        .child(div().w(px(16.0)).h(px(16.0)).rounded_full().bg(rgb(0xa855f7)))
                                                )
                                        )
                                }
                                _ => {
                                    div()
                                        .flex()
                                        .flex_col()
                                        .items_center()
                                        .justify_center()
                                        .py_4()
                                        .child(div().text_color(palette_primary).text_3xl().child("🎉"))
                                        .child(
                                            div()
                                                .text_color(palette_white)
                                                .text_sm()
                                                .mt_2()
                                                .child("Workspace initialized successfully.")
                                        )
                                }
                            }
                        )
                        .child(
                            // Navigation Buttons
                            div()
                                .flex()
                                .justify_between()
                                .mt_8()
                                .children(
                                    if self.setup_step > 1 {
                                        Some(div()
                                            .id("wizard-prev-button")
                                            .border_1()
                                            .border_color(palette_border)
                                            .text_color(palette_muted)
                                            .px_5()
                                            .py_2()
                                            .rounded_md()
                                            .child("← Back")
                                            .cursor_pointer()
                                            .on_click(cx.listener(|this, _, _, cx| {
                                                this.setup_step -= 1;
                                                cx.notify();
                                            })))
                                    } else {
                                        None
                                    }
                                )
                                .child(
                                    div()
                                        .id("wizard-next-button")
                                        .bg(palette_primary)
                                        .text_color(palette_bg)
                                        .font_weight(gpui::FontWeight::BOLD)
                                        .px_6()
                                        .py_2()
                                        .rounded_md()
                                        .child(if self.setup_step == 6 { "Launch Editor 🚀" } else { "Next →" })
                                        .cursor_pointer()
                                        .on_click(cx.listener(|this, _, _, cx| {
                                            if this.setup_step < 6 {
                                                this.setup_step += 1;
                                            } else {
                                                this.active_view = View::Dashboard;
                                            }
                                            cx.notify();
                                        }))
                                )
                        )
                )
        } else {
            // ─── MAIN PLATFORM WORKSPACE VIEW ───
            div()
                .size_full()
                .bg(palette_bg)
                .flex()
                .flex_row()
                .child(
                    // 1. Sidebar Nav
                    div()
                        .w(px(220.0))
                        .bg(palette_surface)
                        .border_r_1()
                        .border_color(palette_border)
                        .flex()
                        .flex_col()
                        .p_4()
                        .child(
                            div()
                                .flex()
                                .items_center()
                                .gap_2()
                                .mb_8()
                                .px_2()
                                .child(div().text_color(palette_primary).text_2xl().child("🎬"))
                                .child(div().text_color(palette_bright).text_lg().font_weight(gpui::FontWeight::BOLD).child("CutFlow Studio"))
                        )
                        .child(self.nav_button(View::Dashboard, "🏠 Home", palette_primary, palette_surface, palette_border, palette_white, palette_muted, cx))
                        .child(self.nav_button(View::Editor, "✂️ Vibe Editor", palette_primary, palette_surface, palette_border, palette_white, palette_muted, cx))
                        .child(self.nav_button(View::Teleprompter, "🎤 Teleprompter", palette_primary, palette_surface, palette_border, palette_white, palette_muted, cx))
                        .child(self.nav_button(View::Messaging, "💬 Bot Daemons", palette_primary, palette_surface, palette_border, palette_white, palette_muted, cx))
                        .child(self.nav_button(View::Marketplace, "🛒 Marketplace", palette_primary, palette_surface, palette_border, palette_white, palette_muted, cx))
                        .child(self.nav_button(View::Settings, "⚙️ Settings", palette_primary, palette_surface, palette_border, palette_white, palette_muted, cx))
                        .child(div().flex_grow())
                        .child(
                            div()
                                .flex()
                                .items_center()
                                .gap_2()
                                .p_2()
                                .border_t_1()
                                .border_color(palette_border)
                                .child(div().w(px(8.0)).h(px(8.0)).rounded_full().bg(if self.ollama_running { palette_success } else { palette_error }))
                                .child(div().text_color(palette_muted).text_xs().child(if self.ollama_running { "Ollama Local: Connected" } else { "Ollama Local: Offline" }))
                        )
                )
                .child(
                    // 2. Active Screen Area
                    div()
                        .flex_1()
                        .flex()
                        .flex_col()
                        .child(
                            // Title Bar / Telemetry Header
                            div()
                                .h(px(64.0))
                                .border_b_1()
                                .border_color(palette_border)
                                .flex()
                                .items_center()
                                .justify_between()
                                .px_6()
                                .child(
                                    div()
                                        .text_color(palette_bright)
                                        .font_weight(gpui::FontWeight::BOLD)
                                        .text_lg()
                                        .child(format!("Workspace / {}", match self.active_view {
                                            View::Dashboard => "Home Dashboard",
                                            View::Editor => "Agentic Vibe Editor",
                                            View::Teleprompter => "Speech-Synchronized Teleprompter",
                                            View::Messaging => "Bot Services Daemons",
                                            View::Marketplace => "Marketplace Skills",
                                            View::Settings => "System Settings",
                                            _ => "",
                                        }))
                                )
                                .child(
                                    div()
                                        .flex()
                                        .gap_4()
                                        .child(self.telemetry_badge("GPU", if self.sys_info.as_ref().unwrap().gpu_vram_gb > 0.0 { "GPU ACCEL" } else { "CPU RUN" }, palette_accent, palette_border))
                                        .child(self.telemetry_badge("VRAM", &format!("{} GB", self.sys_info.as_ref().unwrap().gpu_vram_gb), palette_primary, palette_border))
                                )
                        )
                        .child(
                            // Main view router rendering
                            div()
                                .flex_1()
                                .p_6()
                                .child(
                                    match self.active_view {
                                        View::Dashboard => self.render_dashboard(palette_surface, palette_border, palette_primary, palette_accent, palette_white, palette_bright, palette_muted, palette_success, palette_error, cx).into_any_element(),
                                        View::Editor => self.render_editor(palette_surface, palette_border, palette_primary, palette_accent, palette_white, palette_bright, palette_muted, palette_success, palette_error, palette_bg, cx).into_any_element(),
                                        View::Teleprompter => self.render_teleprompter(palette_surface, palette_border, palette_primary, palette_accent, palette_white, palette_bright, palette_muted, cx).into_any_element(),
                                        View::Messaging => self.render_messaging(palette_surface, palette_border, palette_primary, palette_accent, palette_white, palette_bright, palette_muted, palette_success, palette_error, cx).into_any_element(),
                                        View::Marketplace => self.render_marketplace(palette_surface, palette_border, palette_primary, palette_accent, palette_white, palette_bright, palette_muted, cx).into_any_element(),
                                        _ => self.render_settings(palette_surface, palette_border, palette_primary, palette_accent, palette_white, palette_bright, palette_muted, cx).into_any_element(),
                                    }
                                )
                        )
                )
        }
    }
}

// ── Rendering View Implementations ───────────────────────────

impl CutFlowApp {
    fn diag_row(&self, label: &str, value: &str, ok: bool, _white: gpui::Rgba, palette_muted: gpui::Rgba, palette_success: gpui::Rgba, palette_error: gpui::Rgba) -> impl IntoElement {
        div()
            .flex()
            .justify_between()
            .py_2()
            .border_b_1()
            .border_color(rgb(0x1e1e1e))
            .child(div().text_color(palette_muted).text_xs().child(label.to_string()))
            .child(div().text_color(if ok { palette_success } else { palette_error }).text_xs().font_weight(gpui::FontWeight::BOLD).child(value.to_string()))
    }

    fn provider_card(&self, id: &str, name: &str, desc: &str, selected: bool, palette_primary: gpui::Rgba, palette_border: gpui::Rgba, palette_white: gpui::Rgba, palette_muted: gpui::Rgba, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .id(SharedString::from(format!("provider-card-{}", id)))
            .flex()
            .flex_col()
            .p_3()
            .bg(rgb(0x131313))
            .border_1()
            .border_color(if selected { palette_primary } else { palette_border })
            .rounded_md()
            .cursor_pointer()
            .on_click(cx.listener({
                let pid = id.to_string();
                move |this, _, _, cx| {
                    this.llm_provider = pid.clone();
                    cx.notify();
                }
            }))
            .child(div().text_color(if selected { palette_primary } else { palette_white }).text_sm().font_weight(gpui::FontWeight::BOLD).child(name.to_string()))
            .child(div().text_color(palette_muted).text_xs().child(desc.to_string()))
    }

    fn nav_button(&self, target: View, label: &str, palette_primary: gpui::Rgba, palette_surface: gpui::Rgba, palette_border: gpui::Rgba, palette_white: gpui::Rgba, _palette_muted: gpui::Rgba, cx: &mut Context<Self>) -> impl IntoElement {
        let selected = self.active_view == target;
        let view_label = match target {
            View::Dashboard => "dashboard",
            View::Editor => "editor",
            View::Teleprompter => "teleprompter",
            View::Messaging => "messaging",
            View::Marketplace => "marketplace",
            View::Settings => "settings",
            _ => "unknown",
        };
        div()
            .id(SharedString::from(format!("nav-btn-{}", view_label)))
            .px_3()
            .py_2()
            .mb_1()
            .rounded_md()
            .bg(if selected { rgb(0x1e1e1e) } else { palette_surface })
            .border_1()
            .border_color(if selected { palette_border } else { rgb(0x131313) })
            .text_color(if selected { palette_primary } else { palette_white })
            .child(label.to_string())
            .cursor_pointer()
            .on_click(cx.listener(move |this, _, _, cx| {
                this.active_view = target;
                cx.notify();
            }))
    }

    fn telemetry_badge(&self, key: &str, val: &str, color: gpui::Rgba, border: gpui::Rgba) -> impl IntoElement {
        div()
            .flex()
            .items_center()
            .gap_2()
            .px_3()
            .py_1()
            .rounded_md()
            .bg(rgb(0x131313))
            .border_1()
            .border_color(border)
            .child(div().text_color(color).text_xs().font_weight(gpui::FontWeight::BOLD).child(key.to_string()))
            .child(div().text_color(rgb(0xffffff)).text_xs().child(val.to_string()))
    }

    fn render_dashboard(&self, surface: gpui::Rgba, border: gpui::Rgba, primary: gpui::Rgba, accent: gpui::Rgba, white: gpui::Rgba, bright: gpui::Rgba, muted: gpui::Rgba, success: gpui::Rgba, error: gpui::Rgba, cx: &mut Context<Self>) -> impl IntoElement {
        let info = self.sys_info.as_ref().unwrap();
        div()
            .flex()
            .flex_col()
            .gap_6()
            .child(
                // Metrics grid
                div()
                    .flex()
                    .gap_4()
                    .child(self.metric_card("📁 Total Projects", "4", "Isolated workspace folders", primary, surface, border))
                    .child(self.metric_card("👤 Queue Queue", "1 active", "Intelligent scheduling", accent, surface, border))
                    .child(self.metric_card("✅ Renders Complete", "14", "Native FFmpeg pipelines", success, surface, border))
                    .child(self.metric_card("💾 Available Storage", &format!("{} GB", info.disk_free_gb), "Disk storage space", primary, surface, border))
            )
            .child(
                // Telemetry details & activity
                div()
                    .flex()
                    .gap_4()
                    .child(
                        // Left: Telemetry Panel
                        div()
                            .flex_1()
                            .bg(surface)
                            .border_1()
                            .border_color(border)
                            .rounded_md()
                            .p_4()
                            .flex()
                            .flex_col()
                            .gap_3()
                            .child(div().text_color(bright).text_sm().font_weight(gpui::FontWeight::BOLD).child("SYSTEM DIAGNOSTICS & HARDWARE"))
                            .child(self.diag_row("OS System", &info.os, true, white, muted, success, error))
                            .child(self.diag_row("Processor", &info.cpu_brand, true, white, muted, success, error))
                            .child(self.diag_row("Total RAM Available", &format!("{} GB", info.total_ram_gb), true, white, muted, success, error))
                            .child(self.diag_row("Graphics Driver", &format!("{} VRAM", info.gpu_vram_gb), true, white, muted, success, error))
                            .child(self.diag_row("FFmpeg Engine", if info.ffmpeg_installed { "✓ Operational" } else { "✗ Not Found" }, info.ffmpeg_installed, white, muted, success, error))
                            .child(self.diag_row("Ollama API Server", if self.ollama_running { "✓ Operational" } else { "✗ Offline" }, self.ollama_running, white, muted, success, error))
                    )
                    .child(
                        // Right: Quick Presets / Shortcuts
                        div()
                            .w(px(320.0))
                            .bg(surface)
                            .border_1()
                            .border_color(border)
                            .rounded_md()
                            .p_4()
                            .flex()
                            .flex_col()
                            .gap_3()
                            .child(div().text_color(bright).text_sm().font_weight(gpui::FontWeight::BOLD).child("QUICK ACTIONS"))
                            .child(
                                div()
                                    .id("shortcut-open-editor")
                                    .bg(rgb(0x0a0a0a))
                                    .border_1()
                                    .border_color(border)
                                    .rounded_md()
                                    .p_3()
                                    .cursor_pointer()
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.active_view = View::Editor;
                                        cx.notify();
                                    }))
                                    .child(div().text_color(primary).text_sm().font_weight(gpui::FontWeight::BOLD).child("✂️ Open Video Editor"))
                                    .child(div().text_color(muted).text_xs().child("Launch the multitrack rendering space."))
                            )
                            .child(
                                div()
                                    .id("shortcut-open-messaging")
                                    .bg(rgb(0x0a0a0a))
                                    .border_1()
                                    .border_color(border)
                                    .rounded_md()
                                    .p_3()
                                    .cursor_pointer()
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.active_view = View::Messaging;
                                        cx.notify();
                                    }))
                                    .child(div().text_color(accent).text_sm().font_weight(gpui::FontWeight::BOLD).child("💬 Manage Daemon bots"))
                                    .child(div().text_color(muted).text_xs().child("Launch background Discord/Telegram triggers."))
                            )
                    )
            )
    }

    fn metric_card(&self, title: &str, value: &str, desc: &str, accent: gpui::Rgba, bg: gpui::Rgba, border: gpui::Rgba) -> impl IntoElement {
        div()
            .flex_1()
            .bg(bg)
            .border_1()
            .border_color(border)
            .rounded_md()
            .p_4()
            .flex()
            .flex_col()
            .child(div().text_color(rgb(0x808080)).text_xs().child(title.to_string()))
            .child(div().text_color(accent).text_2xl().font_weight(gpui::FontWeight::BOLD).mt_1().child(value.to_string()))
            .child(div().text_color(rgb(0x808080)).text_xs().mt_2().child(desc.to_string()))
    }

    fn render_editor(&self, surface: gpui::Rgba, border: gpui::Rgba, primary: gpui::Rgba, accent: gpui::Rgba, white: gpui::Rgba, bright: gpui::Rgba, muted: gpui::Rgba, _success: gpui::Rgba, _error: gpui::Rgba, bg: gpui::Rgba, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .flex()
            .flex_row()
            .gap_4()
            .size_full()
            .child(
                // Left editor block (Timeline + Video Player)
                div()
                    .flex_1()
                    .flex()
                    .flex_col()
                    .gap_4()
                    .child(
                        // Top block: Media panel + player
                        div()
                            .flex()
                            .gap_4()
                            .child(
                                // Media Library
                                div()
                                    .w(px(240.0))
                                    .h(px(220.0))
                                    .bg(surface)
                                    .border_1()
                                    .border_color(border)
                                    .rounded_md()
                                    .p_3()
                                    .flex()
                                    .flex_col()
                                    .child(div().text_color(bright).text_xs().font_weight(gpui::FontWeight::BOLD).child("MEDIA ASSETS"))
                                    .child(
                                        div()
                                            .flex_grow()
                                            .mt_2()
                                            .child(self.media_row("cam_roll_01.mp4", "Video", "18.5s"))
                                            .child(self.media_row("b_roll_ocean.mp4", "Video", "12.0s"))
                                            .child(self.media_row("summer_beat.mp3", "Audio", "35.0s"))
                                            .child(self.media_row("voiceover_01.mp3", "Voice", "10.0s"))
                                    )
                                    .child(
                                        div()
                                            .id("import-files-button")
                                            .bg(primary)
                                            .text_color(bg)
                                            .text_xs()
                                            .font_weight(gpui::FontWeight::BOLD)
                                            .py_2()
                                            .rounded_md()
                                            .child("📂 Import Files")
                                            .cursor_pointer()
                                            .on_click(cx.listener(|this, _, _, cx| {
                                                this.agent_logs.push("Imported file cam_roll_02.mp4 successfully.".into());
                                                cx.notify();
                                            }))
                                            .flex()
                                            .justify_center()
                                    )
                            )
                            .child(
                                // Video Player Preview
                                div()
                                    .flex_1()
                                    .h(px(220.0))
                                    .bg(bg)
                                    .border_1()
                                    .border_color(border)
                                    .rounded_md()
                                    .p_3()
                                    .flex()
                                    .flex_col()
                                    .child(
                                        div()
                                            .flex_grow()
                                            .bg(rgb(0x020202))
                                            .rounded_md()
                                            .flex()
                                            .items_center()
                                            .justify_center()
                                            .child(
                                                div()
                                                    .text_color(accent)
                                                    .text_sm()
                                                    .child("[ Native Video Frame Renderer: CAM_ROLL_01.MP4 ]")
                                            )
                                    )
                                    .child(
                                        // Playback Controls
                                        div()
                                            .flex()
                                            .items_center()
                                            .justify_between()
                                            .mt_2()
                                            .child(
                                                div()
                                                    .flex()
                                                    .gap_4()
                                                    .child(
                                                        div()
                                                            .id("player-play-toggle")
                                                            .text_color(primary)
                                                            .font_weight(gpui::FontWeight::BOLD)
                                                            .child(if self.playing { "⏸ Pause" } else { "▶ Play" })
                                                            .cursor_pointer()
                                                            .on_click(cx.listener(|this, _, _, cx| {
                                                                this.playing = !this.playing;
                                                                cx.notify();
                                                            }))
                                                    )
                                                    .child(div().text_color(muted).child("◼ Stop"))
                                            )
                                            .child(div().text_color(white).text_xs().child(format!("{:.1}s / 30.5s", self.playhead_sec)))
                                    )
                            )
                    )
                    .child(
                        // Timeline Area (Advanced Mode Only)
                        if self.advanced_mode {
                            div()
                                .flex_1()
                                .bg(surface)
                                .border_1()
                                .border_color(border)
                                .rounded_md()
                                .p_4()
                                .flex()
                                .flex_col()
                                .child(div().text_color(bright).text_xs().font_weight(gpui::FontWeight::BOLD).child("TIMELINE CHANNELS"))
                                .child(
                                    div()
                                        .flex_grow()
                                        .flex()
                                        .flex_col()
                                        .gap_2()
                                        .mt_4()
                                        .child(self.timeline_track("🎥 Video Channel", "cam_roll_01.mp4 [0.0 - 18.5s]  |  b_roll_ocean.mp4 [18.5 - 30.5s]", primary, border))
                                        .child(self.timeline_track("🎵 Music Channel", "summer_beat.mp3 [0.0 - 30.5s]", accent, border))
                                        .child(self.timeline_track("🔊 Sound SFX Channel", "Empty track", muted, border))
                                        .child(self.timeline_track("🎙️ Voiceover Channel", "voiceover_01.mp3 [2.0 - 12.0s]", rgb(0x3b82f6), border))
                                )
                        } else {
                            div() // Empty div for basic mode
                        }
                    )
            )
            .child(
                // Right panel: Vibe Edit Console + Quick Actions
                div()
                    .w(px(320.0))
                    .flex()
                    .flex_col()
                    .gap_4()
                    .child(
                        // Vibe Edit Console
                        div()
                            .flex_1()
                            .bg(surface)
                            .border_1()
                            .border_color(border)
                            .rounded_md()
                            .p_4()
                            .flex()
                            .flex_col()
                            .gap_3()
                            .child(
                                div()
                                    .flex()
                                    .items_center()
                                    .justify_between()
                                    .child(div().text_color(bright).text_sm().font_weight(gpui::FontWeight::BOLD).child("✨ VIBE EDIT CONSOLE"))
                                    .child(
                                        div()
                                            .id("advanced-toggle")
                                            .flex()
                                            .items_center()
                                            .gap_2()
                                            .cursor_pointer()
                                            .on_click(cx.listener(|this, _, _, cx| {
                                                this.advanced_mode = !this.advanced_mode;
                                                cx.notify();
                                            }))
                                            .child(div().text_color(if self.advanced_mode { muted } else { primary }).text_xs().child("BASIC"))
                                            .child(
                                                div()
                                                    .w(px(32.0))
                                                    .h(px(16.0))
                                                    .rounded_full()
                                                    .bg(if self.advanced_mode { accent } else { border })
                                                    .flex()
                                                    .items_center()
                                                    .justify_start() // We would normally animate this left/right
                                            )
                                            .child(div().text_color(if self.advanced_mode { accent } else { muted }).text_xs().child("ADVANCED"))
                                    )
                            )
                            .child(
                                // Input Box
                                div()
                                    .id("vibe-prompt-textbox")
                                    .bg(bg)
                                    .border_1()
                                    .border_color(if self.prompt_focused { primary } else { border })
                                    .rounded_md()
                                    .p_3()
                                    .h(px(80.0))
                                    .text_color(if self.vibe_prompt == "Enter natural language instructions here..." { muted } else { white })
                                    .child(self.vibe_prompt.clone())
                                    .cursor_pointer()
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.prompt_focused = true;
                                        if this.vibe_prompt == "Enter natural language instructions here..." {
                                            this.vibe_prompt = "".into();
                                        }
                                        cx.notify();
                                    }))
                                    .on_key_down(cx.listener(|this, event: &KeyDownEvent, _, cx| {
                                        if this.prompt_focused {
                                            let key = &event.keystroke.key;
                                            if key == "backspace" {
                                                this.vibe_prompt.pop();
                                            } else if key == "space" {
                                                this.vibe_prompt.push(' ');
                                            } else if key.len() == 1 {
                                                this.vibe_prompt.push_str(key);
                                            } else if key == "enter" {
                                                this.run_vibe_edit_command(cx);
                                            }
                                            cx.notify();
                                        }
                                    }))
                            )
                            .child(
                                div()
                                    .flex()
                                    .gap_2()
                                    .child(
                                        div()
                                            .id("preset-stabilize")
                                            .flex_1()
                                            .bg(rgb(0x2a2a2a))
                                            .text_color(white)
                                            .text_xs()
                                            .font_weight(gpui::FontWeight::BOLD)
                                            .py_2()
                                            .rounded_md()
                                            .child("Stabilize")
                                            .cursor_pointer()
                                            .on_click(cx.listener(|this, _, _, cx| {
                                                this.vibe_prompt = "stabilize cam_roll_01".into();
                                                cx.notify();
                                            }))
                                            .flex()
                                            .justify_center()
                                    )
                                    .child(
                                        div()
                                            .id("preset-color")
                                            .flex_1()
                                            .bg(rgb(0x2a2a2a))
                                            .text_color(white)
                                            .text_xs()
                                            .font_weight(gpui::FontWeight::BOLD)
                                            .py_2()
                                            .rounded_md()
                                            .child("Color Grade")
                                            .cursor_pointer()
                                            .on_click(cx.listener(|this, _, _, cx| {
                                                this.vibe_prompt = "apply cinematic colors".into();
                                                cx.notify();
                                            }))
                                            .flex()
                                            .justify_center()
                                    )
                                    .child(
                                        div()
                                            .id("preset-captions")
                                            .flex_1()
                                            .bg(rgb(0x2a2a2a))
                                            .text_color(white)
                                            .text_xs()
                                            .font_weight(gpui::FontWeight::BOLD)
                                            .py_2()
                                            .rounded_md()
                                            .child("Captions")
                                            .cursor_pointer()
                                            .on_click(cx.listener(|this, _, _, cx| {
                                                this.vibe_prompt = "generate tiktok bold subtitles".into();
                                                cx.notify();
                                            }))
                                            .flex()
                                            .justify_center()
                                    )
                            )
                            .child(
                                div()
                                    .id("vibe-run-button")
                                    .bg(primary)
                                    .text_color(bg)
                                    .font_weight(gpui::FontWeight::BOLD)
                                    .py_2()
                                    .rounded_md()
                                    .child(if self.agent_running { "AGENT RUNNING..." } else { "✨ Run Vibe Edit" })
                                    .cursor_pointer()
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.run_vibe_edit_command(cx);
                                    }))
                                    .flex()
                                    .justify_center()
                            )
                            .child(
                                // Progress bar
                                if self.agent_running {
                                    div()
                                        .h(px(4.0))
                                        .bg(border)
                                        .child(div().h_full().bg(primary).w(px(3.2 * self.agent_progress as f32)))
                                } else {
                                    div()
                                }
                            )
                            .child(
                                // Output Log Monitor
                                div()
                                    .flex_1()
                                    .bg(bg)
                                    .border_1()
                                    .border_color(border)
                                    .rounded_md()
                                    .p_2()
                                    .child(
                                        div()
                                            .flex()
                                            .flex_col()
                                            .children(self.agent_logs.iter().map(|log| {
                                                div().text_color(accent).text_xs().mb_1().child(log.clone())
                                            }))
                                    )
                            )
                    )
            )
    }

    fn media_row(&self, name: &str, mtype: &str, dur: &str) -> impl IntoElement {
        div()
            .flex()
            .justify_between()
            .py_1()
            .border_b_1()
            .border_color(rgb(0x1e1e1e))
            .child(div().text_color(rgb(0xe0e0e0)).text_xs().child(name.to_string()))
            .child(
                div()
                    .flex()
                    .gap_2()
                    .child(div().text_color(rgb(0x808080)).text_xs().child(mtype.to_string()))
                    .child(div().text_color(rgb(0x4fd97d)).text_xs().child(dur.to_string()))
            )
    }

    fn timeline_track(&self, label: &str, content: &str, color: gpui::Rgba, border: gpui::Rgba) -> impl IntoElement {
        div()
            .flex()
            .flex_col()
            .p_2()
            .bg(rgb(0x0a0a0a))
            .border_1()
            .border_color(border)
            .rounded_md()
            .child(div().text_color(rgb(0x808080)).text_xs().child(label.to_string()))
            .child(
                div()
                    .mt_1()
                    .px_2()
                    .py_1()
                    .bg(color)
                    .text_color(rgb(0x0a0a0a))
                    .text_xs()
                    .rounded_md()
                    .font_weight(gpui::FontWeight::BOLD)
                    .child(content.to_string())
            )
    }

    fn render_messaging(&self, surface: gpui::Rgba, border: gpui::Rgba, primary: gpui::Rgba, accent: gpui::Rgba, white: gpui::Rgba, bright: gpui::Rgba, muted: gpui::Rgba, success: gpui::Rgba, error: gpui::Rgba, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .flex()
            .flex_col()
            .gap_4()
            .child(
                div()
                    .bg(surface)
                    .border_1()
                    .border_color(border)
                    .rounded_md()
                    .p_4()
                    .child(div().text_color(bright).text_sm().font_weight(gpui::FontWeight::BOLD).child("NATIVE BACKGROUND SERVICES"))
                    .child(div().text_color(muted).text_xs().mb_4().child("Launch bots and backend services to run local pipelines natively."))
            )
            .child(
                div()
                    .flex()
                    .gap_4()
                    .child(self.service_card("Discord Bot Daemon", self.discord_bot_running, "Runs the Bun-based Discord bot listener.", primary, border, white, muted, success, error, cx, |this, _| {
                        if this.discord_bot_running {
                            this.process_manager.stop_discord();
                            this.discord_bot_running = false;
                        } else {
                            if this.process_manager.start_discord().is_ok() {
                                this.discord_bot_running = true;
                            }
                        }
                    }))
                    .child(self.service_card("Telegram Bot Daemon", self.telegram_bot_running, "Runs the Bun-based Telegram bot listener.", primary, border, white, muted, success, error, cx, |this, _| {
                        if this.telegram_bot_running {
                            this.process_manager.stop_telegram();
                            this.telegram_bot_running = false;
                        } else {
                            if this.process_manager.start_telegram().is_ok() {
                                this.telegram_bot_running = true;
                            }
                        }
                    }))
            )
            .child(
                div()
                    .flex()
                    .gap_4()
                    .child(self.service_card("REST API Backend", self.api_backend_running, "Runs the Express REST API backend on port 3000.", primary, border, white, muted, success, error, cx, |this, _| {
                        if this.api_backend_running {
                            this.process_manager.stop_api();
                            this.api_backend_running = false;
                        } else {
                            if this.process_manager.start_api().is_ok() {
                                this.api_backend_running = true;
                            }
                        }
                    }))
                    .child(self.service_card("Python Video Engine", self.video_engine_running, "Runs the Flask-based FFmpeg video engine.", primary, border, white, muted, success, error, cx, |this, _| {
                        if this.video_engine_running {
                            this.process_manager.stop_video();
                            this.video_engine_running = false;
                        } else {
                            if this.process_manager.start_video().is_ok() {
                                this.video_engine_running = true;
                            }
                        }
                    }))
            )
            .child(
                div()
                    .bg(surface)
                    .border_1()
                    .border_color(border)
                    .rounded_md()
                    .p_4()
                    .flex()
                    .flex_col()
                    .gap_2()
                    .child(div().text_color(bright).text_xs().font_weight(gpui::FontWeight::BOLD).child("DAEMON PROCESS CONSOLE LOGS"))
                    .child(
                        div()
                            .h(px(180.0))
                            .bg(rgb(0x0a0a0a))
                            .border_1()
                            .border_color(border)
                            .rounded_md()
                            .p_2()
                            .child(
                                div()
                                    .flex()
                                    .flex_col()
                                    .children(self.process_manager.get_logs().iter().rev().take(12).rev().map(|log| {
                                        div().text_color(accent).text_xs().mb_1().child(log.clone())
                                    }))
                            )
                    )
            )
    }

    fn service_card<F>(&self, name: &str, running: bool, desc: &str, primary: gpui::Rgba, border: gpui::Rgba, white: gpui::Rgba, muted: gpui::Rgba, success: gpui::Rgba, error: gpui::Rgba, cx: &mut Context<Self>, on_toggle: F) -> impl IntoElement
    where
        F: Fn(&mut Self, &mut Context<Self>) + Send + Sync + 'static,
    {
        let on_toggle = std::sync::Arc::new(on_toggle);
        let id_label = name.to_lowercase().replace(' ', "-");
        div()
            .flex_1()
            .bg(rgb(0x131313))
            .border_1()
            .border_color(border)
            .rounded_md()
            .p_4()
            .flex()
            .flex_col()
            .gap_2()
            .child(
                div()
                    .flex()
                    .justify_between()
                    .items_center()
                    .child(div().text_color(white).text_sm().font_weight(gpui::FontWeight::BOLD).child(name.to_string()))
                    .child(div().w(px(8.0)).h(px(8.0)).rounded_full().bg(if running { success } else { error }))
            )
            .child(div().text_color(muted).text_xs().child(desc.to_string()))
            .child(
                div()
                    .id(SharedString::from(format!("toggle-btn-{}", id_label)))
                    .bg(if running { primary } else { border })
                    .text_color(rgb(0x0a0a0a))
                    .text_xs()
                    .font_weight(gpui::FontWeight::BOLD)
                    .py_2()
                    .rounded_md()
                    .child(if running { "STOP PROCESS" } else { "START BACKGROUND PROCESS" })
                    .cursor_pointer()
                    .on_click(cx.listener(move |this, _, _, cx| {
                        on_toggle(this, cx);
                        cx.notify();
                    }))
                    .flex()
                    .justify_center()
            )
    }

    fn render_marketplace(&self, _surface: gpui::Rgba, border: gpui::Rgba, primary: gpui::Rgba, _accent: gpui::Rgba, white: gpui::Rgba, bright: gpui::Rgba, muted: gpui::Rgba, _cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .flex()
            .flex_col()
            .gap_4()
            .child(div().text_color(bright).text_sm().font_weight(gpui::FontWeight::BOLD).child("BROWSE AGENT SKILLS"))
            .child(
                div()
                    .flex()
                    .gap_4()
                    .child(self.skill_card("Scene Boundary Detector", "Detect shot cut points via FFmpeg showinfo.", "INSTALLED", primary, border, white, muted))
                    .child(self.skill_card("ElevenLabs Voiceover Synthesis", "TTS narration with multilingual audio synthesis.", "INSTALLED", primary, border, white, muted))
                    .child(self.skill_card("Whisper Captions Burner", "Generate auto subtitles burned onto video frames.", "INSTALLED", primary, border, white, muted))
            )
    }

    fn skill_card(&self, name: &str, desc: &str, status: &str, primary: gpui::Rgba, border: gpui::Rgba, white: gpui::Rgba, muted: gpui::Rgba) -> impl IntoElement {
        div()
            .flex_1()
            .bg(rgb(0x131313))
            .border_1()
            .border_color(border)
            .rounded_md()
            .p_4()
            .flex()
            .flex_col()
            .gap_2()
            .child(div().text_color(white).text_sm().font_weight(gpui::FontWeight::BOLD).child(name.to_string()))
            .child(div().text_color(muted).text_xs().child(desc.to_string()))
            .child(
                div()
                    .bg(rgb(0x1e1e1e))
                    .text_color(primary)
                    .text_xs()
                    .font_weight(gpui::FontWeight::BOLD)
                    .py_1()
                    .rounded_md()
                    .child(status.to_string())
                    .flex()
                    .justify_center()
            )
    }

    fn render_teleprompter(&self, surface: gpui::Rgba, border: gpui::Rgba, primary: gpui::Rgba, accent: gpui::Rgba, white: gpui::Rgba, bright: gpui::Rgba, muted: gpui::Rgba, cx: &mut Context<Self>) -> impl IntoElement {
        let scrolling = self.teleprompter_scrolling;
        let voice_scroll = self.teleprompter_voice_scroll;
        let tempo = self.teleprompter_tempo;
        
        div()
            .flex()
            .flex_col()
            .gap_4()
            .h_full()
            .child(
                div()
                    .flex()
                    .justify_between()
                    .items_center()
                    .child(div().text_color(bright).text_lg().font_weight(gpui::FontWeight::BOLD).child("AI-POWERED TELEPROMPTER & SPEECH TRACKER"))
            )
            .child(
                div()
                    .flex()
                    .gap_4()
                    .flex_1()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .flex_1()
                            .bg(rgb(0x0c0c0c))
                            .border_1()
                            .border_color(border)
                            .rounded_md()
                            .p_6()
                            .relative()
                            .child(
                                div()
                                    .absolute()
                                    .top_1_2()
                                    .left_0()
                                    .right_0()
                                    .h(px(40.0))
                                    .border_t_1()
                                    .border_b_1()
                                    .border_color(primary)
                                    .bg(rgb(0x1a1a1a))
                            )
                            .child(
                                div()
                                    .h(px(320.0))
                                    .overflow_hidden()
                                    .relative()
                                    .child(
                                        div()
                                            .absolute()
                                            .top(px(-self.teleprompter_scroll_pos))
                                            .flex()
                                            .flex_col()
                                            .gap_4()
                                            .child(
                                                div()
                                                    .text_color(white)
                                                    .text_xl()
                                                    .font_weight(gpui::FontWeight::MEDIUM)
                                                    .child(self.teleprompter_text.clone())
                                            )
                                    )
                            )
                    )
                    .child(
                        div()
                            .w(px(320.0))
                            .flex()
                            .flex_col()
                            .gap_4()
                            .child(
                                div()
                                    .bg(surface)
                                    .border_1()
                                    .border_color(border)
                                    .rounded_md()
                                    .p_4()
                                    .flex()
                                    .flex_col()
                                    .gap_3()
                                    .child(div().text_color(white).text_sm().font_weight(gpui::FontWeight::BOLD).child("Controls"))
                                    .child(
                                        div()
                                            .flex()
                                            .gap_2()
                                            .child(
                                                div()
                                                    .id("teleprompter-toggle")
                                                    .px_3()
                                                    .py_2()
                                                    .bg(if scrolling { rgb(0xaa2222) } else { primary })
                                                    .text_color(white)
                                                    .text_xs()
                                                    .font_weight(gpui::FontWeight::BOLD)
                                                    .rounded_md()
                                                    .cursor_pointer()
                                                    .on_click(cx.listener(|this, _, _, cx| {
                                                        if this.teleprompter_scrolling {
                                                            this.teleprompter_scrolling = false;
                                                        } else {
                                                            this.teleprompter_scrolling = true;
                                                            let speed_factor = this.teleprompter_tempo as f32 / 130.0;
                                                            cx.spawn(move |this: gpui::WeakEntity<Self>, cx: &mut gpui::AsyncApp| {
                                                                let mut cx = cx.clone();
                                                                async move {
                                                                    loop {
                                                                        tokio::time::sleep(Duration::from_millis(50)).await;
                                                                        let keep_going = this.update(&mut cx, |app, cx| {
                                                                            if !app.teleprompter_scrolling {
                                                                                return false;
                                                                            }
                                                                            if app.teleprompter_voice_scroll {
                                                                                let phase = (app.teleprompter_scroll_pos * 10.0) as i32 % 100;
                                                                                if phase < 80 {
                                                                                    app.teleprompter_scroll_pos += 0.8 * speed_factor;
                                                                                }
                                                                            } else {
                                                                                app.teleprompter_scroll_pos += 0.5 * speed_factor;
                                                                            }
                                                                            if app.teleprompter_scroll_pos > 800.0 {
                                                                                app.teleprompter_scroll_pos = 0.0;
                                                                            }
                                                                            cx.notify();
                                                                            true
                                                                        }).unwrap_or(false);
                                                                        if !keep_going {
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                            }).detach();
                                                        }
                                                        cx.notify();
                                                    }))
                                                    .child(if scrolling { "⏹ Stop" } else { "▶ Start Teleprompter" })
                                            )
                                            .child(
                                                div()
                                                    .id("teleprompter-reset")
                                                    .px_3()
                                                    .py_2()
                                                    .bg(rgb(0x3a3a3a))
                                                    .text_color(white)
                                                    .text_xs()
                                                    .font_weight(gpui::FontWeight::BOLD)
                                                    .rounded_md()
                                                    .cursor_pointer()
                                                    .on_click(cx.listener(|this, _, _, cx| {
                                                        this.teleprompter_scroll_pos = 0.0;
                                                        cx.notify();
                                                    }))
                                                    .child("🔄 Reset")
                                            )
                                    )
                                    .child(
                                        div()
                                            .flex()
                                            .items_center()
                                            .justify_between()
                                            .child(div().text_color(muted).text_xs().child("Auto-Scroll as You Speak"))
                                            .child(
                                                div()
                                                    .id("teleprompter-voice-toggle")
                                                    .px_2()
                                                    .py_1()
                                                    .bg(if voice_scroll { accent } else { rgb(0x3a3a3a) })
                                                    .text_color(white)
                                                    .text_xs()
                                                    .font_weight(gpui::FontWeight::BOLD)
                                                    .rounded_md()
                                                    .cursor_pointer()
                                                    .on_click(cx.listener(|this, _, _, cx| {
                                                        this.teleprompter_voice_scroll = !this.teleprompter_voice_scroll;
                                                        cx.notify();
                                                    }))
                                                    .child(if voice_scroll { "Enabled (Voice Track)" } else { "Disabled (Fixed Tempo)" })
                                            )
                                    )
                                    .child(
                                        div()
                                            .flex()
                                            .flex_col()
                                            .gap_1()
                                            .child(div().text_color(muted).text_xs().child(format!("Practice Tempo: {} WPM", tempo)))
                                            .child(
                                                div()
                                                    .flex()
                                                    .gap_1()
                                                    .child(self.tempo_btn(80, primary, cx))
                                                    .child(self.tempo_btn(110, primary, cx))
                                                    .child(self.tempo_btn(130, primary, cx))
                                                    .child(self.tempo_btn(160, primary, cx))
                                                    .child(self.tempo_btn(200, primary, cx))
                                            )
                                    )
                            )
                            .child(
                                div()
                                    .bg(surface)
                                    .border_1()
                                    .border_color(border)
                                    .rounded_md()
                                    .p_4()
                                    .flex()
                                    .flex_col()
                                    .gap_3()
                                    .child(div().text_color(white).text_xs().font_weight(gpui::FontWeight::BOLD).child("OPTIMIZED TASK MODEL ROUTING"))
                                    .child(self.model_opt_row("Vibe Editing", "OpenAI (gpt-4o-mini)", "JSON & logic flow", white, muted))
                                    .child(self.model_opt_row("Effects / Filters", "Groq (llama-3.1-instant)", "Sub-second speed", white, muted))
                                    .child(self.model_opt_row("Scripting Ideas", "Google Gemini (flash)", "1M token context window", white, muted))
                                    .child(self.model_opt_row("Teleprompting", "Perplexity (sonar)", "Live facts alignment", white, muted))
                            )
                    )
            )
    }

    fn tempo_btn(&self, target_tempo: u32, primary: gpui::Rgba, cx: &mut Context<Self>) -> impl IntoElement {
        let active = self.teleprompter_tempo == target_tempo;
        div()
            .id(SharedString::from(format!("tempo-btn-{}", target_tempo)))
            .px_2()
            .py_1()
            .bg(if active { primary } else { rgb(0x2a2a2a) })
            .text_color(rgb(0xffffff))
            .text_xs()
            .rounded_md()
            .cursor_pointer()
            .on_click(cx.listener(move |this, _, _, cx| {
                this.teleprompter_tempo = target_tempo;
                cx.notify();
            }))
            .child(format!("{}", target_tempo))
    }

    fn model_opt_row(&self, task: &str, model: &str, reason: &str, white: gpui::Rgba, muted: gpui::Rgba) -> impl IntoElement {
        div()
            .flex()
            .flex_col()
            .py_1_5()
            .border_b_1()
            .border_color(rgb(0x1e1e1e))
            .child(
                div()
                    .flex()
                    .justify_between()
                    .child(div().text_color(white).text_xs().font_weight(gpui::FontWeight::BOLD).child(task.to_string()))
                    .child(div().text_color(rgb(0x00cc44)).text_xs().child("✓ Recommended".to_string()))
            )
            .child(div().text_color(white).text_xs().child(model.to_string()))
            .child(div().text_color(muted).text_xs().child(format!("Reason: {}", reason)))
    }

    fn render_settings(&self, surface: gpui::Rgba, border: gpui::Rgba, _primary: gpui::Rgba, _accent: gpui::Rgba, white: gpui::Rgba, bright: gpui::Rgba, muted: gpui::Rgba, _cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .flex()
            .flex_col()
            .gap_4()
            .child(div().text_color(bright).text_sm().font_weight(gpui::FontWeight::BOLD).child("APPLICATION PREFERENCES"))
            .child(
                div()
                    .bg(surface)
                    .border_1()
                    .border_color(border)
                    .rounded_md()
                    .p_4()
                    .flex()
                    .flex_col()
                    .gap_3()
                    .child(self.setting_row("API Endpoint", "http://localhost:3000", white, muted))
                    .child(self.setting_row("Video Processing Endpoint", "http://localhost:5000", white, muted))
                    .child(self.setting_row("Storage Directory", "./data/users", white, muted))
                    .child(self.setting_row("Max Concurrent Renders", "3", white, muted))
            )
    }

    fn setting_row(&self, label: &str, val: &str, white: gpui::Rgba, muted: gpui::Rgba) -> impl IntoElement {
        div()
            .flex()
            .justify_between()
            .py_2()
            .border_b_1()
            .border_color(rgb(0x1e1e1e))
            .child(div().text_color(muted).text_xs().child(label.to_string()))
            .child(div().text_color(white).text_xs().font_weight(gpui::FontWeight::BOLD).child(val.to_string()))
    }
}

fn main() {
    Application::new().run(|cx: &mut App| {
        let bounds = Bounds::centered(None, size(px(1280.), px(720.)), cx);
        cx.open_window(
            WindowOptions {
                window_bounds: Some(WindowBounds::Windowed(bounds)),
                ..Default::default()
            },
            |_, cx| {
                cx.new(CutFlowApp::new)
            },
        )
        .unwrap();
        cx.activate(true);
    });
}
