// ============================================================
//  TLG3D — Rust GPU Detection Module
// ============================================================

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GpuInfo {
    pub name:         String,
    pub vram_gb:      f64,
    pub vendor:       String,    // nvidia | amd | intel | apple
    pub cuda_support: bool,
    pub metal_support: bool,
    pub driver_version: String,
}

pub fn detect_gpu_name() -> String {
    get_gpu_info().name
}

pub fn detect_gpu_vram() -> f64 {
    get_gpu_info().vram_gb
}

pub fn get_gpu_info() -> GpuInfo {
    // Try NVIDIA first via nvidia-smi
    if let Some(info) = try_nvidia() { return info; }
    // Try sysinfo for generic
    try_generic()
}

fn try_nvidia() -> Option<GpuInfo> {
    let output = std::process::Command::new("nvidia-smi")
        .args(["--query-gpu=name,memory.total,driver_version",
               "--format=csv,noheader,nounits"])
        .output()
        .ok()?;

    let text = String::from_utf8(output.stdout).ok()?;
    let parts: Vec<&str> = text.trim().splitn(3, ',').collect();
    if parts.len() < 3 { return None; }

    let name   = parts[0].trim().to_string();
    let vram   = parts[1].trim().parse::<f64>().unwrap_or(0.0) / 1024.0;
    let driver = parts[2].trim().to_string();

    Some(GpuInfo {
        name,
        vram_gb:       (vram * 10.0).round() / 10.0,
        vendor:        "nvidia".into(),
        cuda_support:  true,
        metal_support: false,
        driver_version: driver,
    })
}

fn try_generic() -> GpuInfo {
    use sysinfo::{System, SystemExt};
    // Fallback — best effort
    GpuInfo {
        name:           "Unknown GPU".into(),
        vram_gb:        0.0,
        vendor:         "unknown".into(),
        cuda_support:   false,
        metal_support:  cfg!(target_os = "macos"),
        driver_version: "unknown".into(),
    }
}
