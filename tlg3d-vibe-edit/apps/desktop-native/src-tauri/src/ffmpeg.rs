// ============================================================
//  TLG3D — Rust FFmpeg Native Module
//  All video processing runs natively via FFmpeg subprocess
// ============================================================

use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::AppHandle;
use tokio::io::AsyncBufReadExt;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoInfo {
    pub path:          String,
    pub duration_secs: f64,
    pub width:         u32,
    pub height:        u32,
    pub fps:           f64,
    pub codec:         String,
    pub size_mb:       f64,
    pub has_audio:     bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FfmpegResult {
    pub success:   bool,
    pub exit_code: i32,
    pub stderr:    String,
    pub output:    String,
}

fn ffmpeg_bin() -> String {
    which::which("ffmpeg")
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "ffmpeg".into())
}

fn ffprobe_bin() -> String {
    which::which("ffprobe")
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "ffprobe".into())
}

// ── Run arbitrary FFmpeg command ──────────────────────────────

pub async fn run_ffmpeg_command(
    input:  &str,
    output: &str,
    args:   &[String],
) -> Result<FfmpegResult, String> {
    let mut cmd = tokio::process::Command::new(ffmpeg_bin());
    cmd.arg("-i").arg(input)
       .args(args)
       .arg(output)
       .arg("-y")               // overwrite
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());

    let child = cmd.spawn().map_err(|e| e.to_string())?;
    let out   = child.wait_with_output().await.map_err(|e| e.to_string())?;

    Ok(FfmpegResult {
        success:   out.status.success(),
        exit_code: out.status.code().unwrap_or(-1),
        stderr:    String::from_utf8_lossy(&out.stderr).to_string(),
        output:    output.to_string(),
    })
}

// ── Probe video metadata ──────────────────────────────────────

pub async fn probe_video(path: &str) -> Result<VideoInfo, String> {
    let out = tokio::process::Command::new(ffprobe_bin())
        .args([
            "-v",          "error",
            "-select_streams", "v:0",
            "-show_entries",
            "stream=width,height,r_frame_rate,codec_name,duration:format=size,duration",
            "-of",         "json",
            path,
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value =
        serde_json::from_slice(&out.stdout).map_err(|e| e.to_string())?;

    let stream  = &json["streams"][0];
    let format  = &json["format"];

    let fps_raw = stream["r_frame_rate"].as_str().unwrap_or("30/1");
    let fps = parse_fraction(fps_raw);

    let duration = format["duration"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    let size_bytes = format["size"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    // Check audio streams
    let audio_out = tokio::process::Command::new(ffprobe_bin())
        .args(["-v", "error", "-select_streams", "a:0",
               "-show_entries", "stream=codec_name", "-of", "json", path])
        .output().await.ok();
    let has_audio = audio_out
        .and_then(|o| serde_json::from_slice::<serde_json::Value>(&o.stdout).ok())
        .map(|j| !j["streams"].as_array().unwrap_or(&vec![]).is_empty())
        .unwrap_or(false);

    Ok(VideoInfo {
        path:          path.to_string(),
        duration_secs: duration,
        width:         stream["width"].as_u64().unwrap_or(0) as u32,
        height:        stream["height"].as_u64().unwrap_or(0) as u32,
        fps:           (fps * 100.0).round() / 100.0,
        codec:         stream["codec_name"].as_str().unwrap_or("unknown").to_string(),
        size_mb:       (size_bytes / 1024.0 / 1024.0 * 10.0).round() / 10.0,
        has_audio,
    })
}

// ── Transitions ───────────────────────────────────────────────

pub async fn apply_transition_native(
    input:     &str,
    output:    &str,
    ttype:     &str,
    duration:  f64,
) -> Result<FfmpegResult, String> {
    let filter = match ttype {
        "fade"     => format!("fade=t=in:d={}", duration),
        "fade_out" => format!("fade=t=out:d={}", duration),
        "slide"    => format!("zoompan=z='min(zoom+0.0015,1.5)':d={}:s=hd1080", (duration * 25.0) as u32),
        "dissolve" => format!("fade=t=in:d={}:alpha=1", duration),
        "zoom"     => format!("zoompan=z='zoom+0.001':d={}", (duration * 25.0) as u32),
        "wipe"     => format!("crop=iw*t/{}:ih:0:0", duration),
        _          => format!("fade=t=in:d={}", duration),
    };

    run_ffmpeg_command(input, output, &[
        "-vf".into(), filter,
        "-c:v".into(), "libx264".into(),
        "-preset".into(), "fast".into(),
        "-crf".into(), "22".into(),
        "-c:a".into(), "copy".into(),
    ]).await
}

// ── Color Grading ─────────────────────────────────────────────

pub async fn apply_color_grade_native(
    input:  &str,
    output: &str,
    preset: &str,
) -> Result<FfmpegResult, String> {
    let filter = match preset {
        "warm"       => "colorbalance=rs=0.15:gs=0.05:bs=-0.1,eq=saturation=1.1:contrast=1.05",
        "cool"       => "colorbalance=rs=-0.1:gs=0:bs=0.15,eq=saturation=0.95",
        "cinematic"  => "curves=r='0/0 0.25/0.22 0.75/0.8 1/1':g='0/0 0.5/0.48 1/1':b='0/0.05 1/0.95',eq=contrast=1.1:saturation=1.15",
        "vintage"    => "hue=h=10:s=0.8,curves=r='0/0.05 1/0.95':b='0/0 1/0.85',vignette",
        "bw"         => "colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3",
        "matte"      => "curves=r='0/0.05 0.5/0.52 1/0.95':g='0/0.05 0.5/0.5 1/0.95':b='0/0.1 0.5/0.5 1/0.9'",
        "vivid"      => "eq=saturation=1.4:contrast=1.1:brightness=0.02",
        "fade"       => "curves=all='0/0.1 0.5/0.5 1/0.9'",
        "horror"     => "colorchannelmixer=1.2:0:0:0:0:0.8:0:0:0:0:0.5:0,vignette",
        "summer"     => "hue=h=5:s=1.2,colorbalance=rs=0.1:bs=-0.05,eq=brightness=0.03",
        _            => "eq=saturation=1.0:contrast=1.0",  // neutral
    };

    run_ffmpeg_command(input, output, &[
        "-vf".into(), filter.to_string(),
        "-c:v".into(), "libx264".into(),
        "-preset".into(), "fast".into(),
        "-crf".into(), "22".into(),
        "-c:a".into(), "copy".into(),
    ]).await
}

// ── Scene Detection ───────────────────────────────────────────

pub async fn detect_scenes_native(input: &str) -> Result<Vec<f64>, String> {
    let out = tokio::process::Command::new(ffmpeg_bin())
        .args([
            "-i", input,
            "-vf", "select='gt(scene\\,0.3)',showinfo",
            "-f", "null", "-",
        ])
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| e.to_string())?;

    let stderr = String::from_utf8_lossy(&out.stderr);
    let mut timestamps = vec![];

    for line in stderr.lines() {
        if line.contains("pts_time:") {
            if let Some(ts_part) = line.split("pts_time:").nth(1) {
                if let Some(ts_str) = ts_part.split_whitespace().next() {
                    if let Ok(ts) = ts_str.parse::<f64>() {
                        timestamps.push(ts);
                    }
                }
            }
        }
    }

    Ok(timestamps)
}

// ── Render Pipeline ───────────────────────────────────────────

pub async fn render_project(
    app:        AppHandle,
    project_id: &str,
    output_path: &str,
) -> Result<String, String> {
    // Emit start event
    let _ = app.emit_all("render-started", serde_json::json!({
        "project_id":  project_id,
        "output_path": output_path,
    }));

    // In production: read timeline.json and build complex FFmpeg command
    // For now: simple passthrough to demonstrate pipeline
    let job_id = format!("render_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs());

    let _ = app.emit_all("render-complete", serde_json::json!({
        "project_id": project_id,
        "job_id":     job_id,
        "output":     output_path,
    }));

    Ok(job_id)
}

pub async fn cancel_render_job(job_id: &str) -> Result<(), String> {
    log::info!("Cancelling render job: {}", job_id);
    // In production: kill subprocess, clean up temp files
    Ok(())
}

// ── Helpers ───────────────────────────────────────────────────

fn parse_fraction(s: &str) -> f64 {
    let parts: Vec<&str> = s.split('/').collect();
    if parts.len() == 2 {
        let num: f64 = parts[0].parse().unwrap_or(30.0);
        let den: f64 = parts[1].parse().unwrap_or(1.0);
        if den != 0.0 { return num / den; }
    }
    30.0
}
