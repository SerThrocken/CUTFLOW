// ============================================================
//  CutFlow — Tauri system_info.rs
//  Exposes system information to the frontend
// ============================================================

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FullSystemInfo {
    pub os:           String,
    pub os_version:   String,
    pub arch:         String,
    pub cpu_brand:    String,
    pub cpu_cores:    u32,
    pub total_ram_gb: f64,
    pub free_ram_gb:  f64,
    pub gpu_name:     String,
    pub gpu_vram_gb:  f64,
    pub disk_free_gb: f64,
    pub ffmpeg_installed: bool,
    pub ollama_installed: bool,
    pub ytdlp_installed:  bool,
    pub support_level: String,
}

pub fn detect_full_system() -> FullSystemInfo {
    use sysinfo::{System, SystemExt, CpuExt, DiskExt};

    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_brand  = sys.cpus().first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown".into());

    let total_ram  = (sys.total_memory()     as f64 / 1024.0 / 1024.0 / 1024.0 * 10.0).round() / 10.0;
    let free_ram   = (sys.available_memory() as f64 / 1024.0 / 1024.0 / 1024.0 * 10.0).round() / 10.0;

    let disk_free  = sys.disks().iter()
        .map(|d| d.available_space() as f64 / 1024.0 / 1024.0 / 1024.0)
        .fold(0.0_f64, f64::max);

    let gpu        = crate::gpu::get_gpu_info();
    let ffmpeg_ok  = which::which("ffmpeg").is_ok();
    let ollama_ok  = which::which("ollama").is_ok();
    let ytdlp_ok   = which::which("yt-dlp").is_ok()
                  || which::which("yt_dlp").is_ok();

    let support_level = if gpu.vram_gb >= 24.0 && total_ram >= 32.0 {
        "optimal"
    } else if gpu.vram_gb >= 12.0 && total_ram >= 16.0 {
        "recommended"
    } else {
        "minimum"
    }.to_string();

    FullSystemInfo {
        os:               std::env::consts::OS.to_string(),
        os_version:       sys.os_version().unwrap_or_default(),
        arch:             std::env::consts::ARCH.to_string(),
        cpu_brand,
        cpu_cores:        sys.cpus().len() as u32,
        total_ram_gb:     total_ram,
        free_ram_gb:      free_ram,
        gpu_name:         gpu.name,
        gpu_vram_gb:      gpu.vram_gb,
        disk_free_gb:     (disk_free * 10.0).round() / 10.0,
        ffmpeg_installed: ffmpeg_ok,
        ollama_installed: ollama_ok,
        ytdlp_installed:  ytdlp_ok,
        support_level,
    }
}
