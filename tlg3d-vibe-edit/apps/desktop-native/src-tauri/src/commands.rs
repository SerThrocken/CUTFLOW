// ============================================================
//  TLG3D — Tauri IPC Commands (Rust)
//  All callable from the React frontend via invoke()
// ============================================================

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use tauri::{AppHandle, Runtime};

// ── System Info ───────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemInfo {
    pub os:              String,
    pub os_version:      String,
    pub cpu_cores:       u32,
    pub cpu_brand:       String,
    pub total_ram_gb:    f64,
    pub available_ram_gb: f64,
    pub gpu_name:        String,
    pub gpu_vram_gb:     f64,
    pub disk_free_gb:    f64,
    pub ffmpeg_path:     Option<String>,
    pub ollama_path:     Option<String>,
}

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    use sysinfo::{System, SystemExt, CpuExt, DiskExt};

    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_brand = sys.cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".into());

    let total_ram    = sys.total_memory()  as f64 / 1024.0 / 1024.0 / 1024.0;
    let available_ram = sys.available_memory() as f64 / 1024.0 / 1024.0 / 1024.0;

    let disk_free = sys.disks()
        .iter()
        .filter(|d| d.mount_point() == std::path::Path::new("/")
                 || d.mount_point() == std::path::Path::new("C:\\"))
        .map(|d| d.available_space() as f64 / 1024.0 / 1024.0 / 1024.0)
        .next()
        .unwrap_or(0.0);

    let ffmpeg_path  = which::which("ffmpeg").ok().map(|p| p.display().to_string());
    let ollama_path  = which::which("ollama").ok().map(|p| p.display().to_string());

    Ok(SystemInfo {
        os:               std::env::consts::OS.to_string(),
        os_version:       sys.os_version().unwrap_or_default(),
        cpu_cores:        sys.cpus().len() as u32,
        cpu_brand,
        total_ram_gb:     (total_ram    * 10.0).round() / 10.0,
        available_ram_gb: (available_ram * 10.0).round() / 10.0,
        gpu_name:         crate::gpu::detect_gpu_name(),
        gpu_vram_gb:      crate::gpu::detect_gpu_vram(),
        disk_free_gb:     (disk_free * 10.0).round() / 10.0,
        ffmpeg_path,
        ollama_path,
    })
}

#[tauri::command]
pub async fn detect_gpu() -> Result<crate::gpu::GpuInfo, String> {
    Ok(crate::gpu::get_gpu_info())
}

#[tauri::command]
pub async fn get_disk_space(path: String) -> Result<f64, String> {
    use sysinfo::{System, SystemExt, DiskExt};
    let mut sys = System::new_all();
    sys.refresh_disks_list();

    let free = sys.disks()
        .iter()
        .find(|d| path.starts_with(d.mount_point().to_str().unwrap_or("")))
        .map(|d| d.available_space() as f64 / 1024.0 / 1024.0 / 1024.0)
        .unwrap_or(0.0);

    Ok(free)
}

// ── Ollama Commands ───────────────────────────────────────────

#[tauri::command]
pub async fn check_ollama_running() -> Result<bool, String> {
    let result = reqwest::get("http://localhost:11434/api/tags").await;
    Ok(result.map(|r| r.status().is_success()).unwrap_or(false))
}

#[tauri::command]
pub async fn list_ollama_models() -> Result<Vec<String>, String> {
    let resp = reqwest::get("http://localhost:11434/api/tags")
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;

    let models = resp["models"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|m| m["name"].as_str().map(String::from))
        .collect();

    Ok(models)
}

#[derive(Deserialize)]
pub struct OllamaGenerateRequest {
    pub model:  String,
    pub prompt: String,
    pub system: Option<String>,
}

#[tauri::command]
pub async fn ollama_generate(req: OllamaGenerateRequest) -> Result<String, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model":  req.model,
        "prompt": req.prompt,
        "system": req.system.unwrap_or_default(),
        "stream": false,
    });

    let resp = client
        .post("http://localhost:11434/api/generate")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;

    Ok(resp["response"].as_str().unwrap_or("").to_string())
}

#[derive(Deserialize)]
pub struct PullModelRequest { pub name: String }

#[tauri::command]
pub async fn pull_ollama_model(
    app: AppHandle,
    req: PullModelRequest,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("http://localhost:11434/api/pull")
        .json(&serde_json::json!({ "name": req.name }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // Stream progress events to frontend
    use futures_util::StreamExt;
    let mut stream = resp.bytes_stream();
    while let Some(chunk) = stream.next().await {
        if let Ok(bytes) = chunk {
            if let Ok(text) = std::str::from_utf8(&bytes) {
                for line in text.lines() {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                        let _ = app.emit_all("ollama-pull-progress", &json);
                    }
                }
            }
        }
    }

    Ok(())
}

// ── FFmpeg / Video Commands ───────────────────────────────────

#[derive(Deserialize)]
pub struct FfmpegRequest {
    pub input:     String,
    pub output:    String,
    pub args:      Vec<String>,
}

#[derive(Serialize)]
pub struct FfmpegResult {
    pub success:   bool,
    pub exit_code: i32,
    pub stderr:    String,
    pub output:    String,
}

#[tauri::command]
pub async fn run_ffmpeg(req: FfmpegRequest) -> Result<FfmpegResult, String> {
    crate::ffmpeg::run_ffmpeg_command(&req.input, &req.output, &req.args).await
}

#[tauri::command]
pub async fn get_video_info(path: String) -> Result<crate::ffmpeg::VideoInfo, String> {
    crate::ffmpeg::probe_video(&path).await
}

#[tauri::command]
pub async fn apply_transition(
    input: String,
    output: String,
    transition_type: String,
    duration: f64,
) -> Result<FfmpegResult, String> {
    crate::ffmpeg::apply_transition_native(&input, &output, &transition_type, duration).await
}

#[tauri::command]
pub async fn apply_color_grade(
    input: String,
    output: String,
    preset: String,
) -> Result<FfmpegResult, String> {
    crate::ffmpeg::apply_color_grade_native(&input, &output, &preset).await
}

#[tauri::command]
pub async fn detect_scenes(input: String) -> Result<Vec<f64>, String> {
    crate::ffmpeg::detect_scenes_native(&input).await
}

#[tauri::command]
pub async fn render_video(
    app: AppHandle,
    project_id: String,
    output_path: String,
) -> Result<String, String> {
    crate::ffmpeg::render_project(app, &project_id, &output_path).await
}

#[tauri::command]
pub async fn cancel_render(job_id: String) -> Result<(), String> {
    crate::ffmpeg::cancel_render_job(&job_id).await
}

// ── File System Commands ──────────────────────────────────────

#[tauri::command]
pub async fn open_file_dialog(
    app: AppHandle,
    filters: Vec<String>,
    multiple: bool,
) -> Result<Vec<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let dialog = app.dialog();
    let mut builder = dialog.file();

    for filter in &filters {
        builder = builder.add_filter(filter, &[filter.as_str()]);
    }

    if multiple {
        let files = builder.blocking_pick_files()
            .unwrap_or_default()
            .into_iter()
            .map(|f| f.to_string_lossy().to_string())
            .collect();
        Ok(files)
    } else {
        let file = builder.blocking_pick_file()
            .map(|f| vec![f.to_string_lossy().to_string()])
            .unwrap_or_default();
        Ok(file)
    }
}

#[tauri::command]
pub async fn save_file_dialog(
    app: AppHandle,
    default_name: String,
    filters: Vec<String>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let path = app.dialog()
        .file()
        .set_file_name(&default_name)
        .blocking_save_file()
        .map(|p| p.to_string_lossy().to_string());

    Ok(path)
}

#[tauri::command]
pub async fn read_project_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_project_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_user_projects(user_data_dir: String) -> Result<Vec<String>, String> {
    let path = PathBuf::from(&user_data_dir);
    if !path.exists() {
        return Ok(vec![]);
    }

    let entries = std::fs::read_dir(&path)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();

    Ok(entries)
}

#[tauri::command]
pub async fn create_project_folder(base: String, name: String) -> Result<String, String> {
    let full = PathBuf::from(&base).join(&name);
    std::fs::create_dir_all(&full).map_err(|e| e.to_string())?;

    for sub in &["assets/videos", "assets/audio", "assets/images",
                 "assets/scripts", "processing", "output", "cache"] {
        std::fs::create_dir_all(full.join(sub)).map_err(|e| e.to_string())?;
    }

    Ok(full.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn delete_project_folder(path: String) -> Result<(), String> {
    std::fs::remove_dir_all(&path).map_err(|e| e.to_string())
}

// ── Remote Sync Commands ──────────────────────────────────────

#[tauri::command]
pub async fn get_sync_status() -> Result<crate::remote_sync::SyncStatus, String> {
    Ok(crate::remote_sync::get_status())
}

#[tauri::command]
pub async fn pair_mobile_device(device_id: String) -> Result<String, String> {
    crate::remote_sync::pair_device(device_id).await
}

#[tauri::command]
pub async fn receive_remote_job(job: crate::remote_sync::RemoteJob) -> Result<String, String> {
    crate::remote_sync::queue_remote_job(job).await
}

#[tauri::command]
pub async fn send_job_progress(job_id: String, progress: f32) -> Result<(), String> {
    crate::remote_sync::broadcast_progress(job_id, progress).await
}

// ── Notification Commands ─────────────────────────────────────

#[tauri::command]
pub async fn send_native_notification(
    app: AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())
}

// ── Updater Commands ──────────────────────────────────────────

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_updater::UpdaterExt;
    let update = app.updater()
        .check()
        .await
        .map_err(|e| e.to_string())?;
    Ok(update.is_some())
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    if let Some(update) = app.updater().check().await.map_err(|e| e.to_string())? {
        update.download_and_install(|_, _| {}, || {})
              .await
              .map_err(|e| e.to_string())?;
    }
    Ok(())
}
