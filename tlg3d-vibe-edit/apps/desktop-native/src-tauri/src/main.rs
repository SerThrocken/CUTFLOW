// ============================================================
//  CutFlow — Tauri Native Desktop Backend (Rust)
//  src-tauri/src/main.rs
// ============================================================

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod gpu;
mod ffmpeg;
mod remote_sync;
mod system_info;
mod tray;

use tauri::Manager;
use tauri_plugin_log::LogTarget;

fn main() {
    tauri::Builder::default()
        // ── Plugins ────────────────────────────────────────
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .build(),
        )
        // ── System tray ────────────────────────────────────
        .setup(|app| {
            tray::setup_tray(app)?;

            // Spawn background services on start
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                remote_sync::start_sync_server(app_handle).await;
            });

            Ok(())
        })
        // ── IPC Commands ───────────────────────────────────
        .invoke_handler(tauri::generate_handler![
            // System
            commands::get_system_info,
            commands::detect_gpu,
            commands::check_ollama_running,
            commands::get_disk_space,
            // FFmpeg / Video
            commands::run_ffmpeg,
            commands::get_video_info,
            commands::apply_transition,
            commands::apply_color_grade,
            commands::detect_scenes,
            commands::render_video,
            commands::cancel_render,
            // File System
            commands::open_file_dialog,
            commands::save_file_dialog,
            commands::read_project_file,
            commands::write_project_file,
            commands::list_user_projects,
            commands::create_project_folder,
            commands::delete_project_folder,
            // Ollama
            commands::pull_ollama_model,
            commands::list_ollama_models,
            commands::ollama_generate,
            // Remote Sync
            commands::get_sync_status,
            commands::pair_mobile_device,
            commands::receive_remote_job,
            commands::send_job_progress,
            // Notifications
            commands::send_native_notification,
            // Updates
            commands::check_for_updates,
            commands::install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CutFlow");
}
