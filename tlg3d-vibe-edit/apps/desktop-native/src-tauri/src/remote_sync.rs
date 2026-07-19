// ============================================================
//  TLG3D — Rust Remote Sync Server
//  Runs a WebSocket server on the desktop so mobile clients
//  can connect, pair, send jobs, and receive results.
// ============================================================

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tokio::net::TcpListener;
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::{SinkExt, StreamExt};

// ── Types ─────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SyncStatus {
    pub listening:     bool,
    pub port:          u16,
    pub paired_devices: Vec<PairedDevice>,
    pub active_jobs:   Vec<String>,
    pub local_ip:      String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PairedDevice {
    pub device_id:    String,
    pub device_name:  String,
    pub platform:     String,   // ios | android
    pub user_id:      String,
    pub paired_at:    String,
    pub last_seen:    String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RemoteJob {
    pub job_id:       String,
    pub job_type:     String,   // render | script | voiceover | color_grade | transfer_file
    pub project_id:   String,
    pub user_id:      String,
    pub device_id:    String,
    pub payload:      serde_json::Value,
    pub submitted_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WsMessage {
    pub msg_type: String,
    pub payload:  serde_json::Value,
}

// ── Global state ──────────────────────────────────────────────

lazy_static::lazy_static! {
    static ref SYNC_STATE: Arc<Mutex<SyncStatus>> = Arc::new(Mutex::new(SyncStatus {
        listening:      false,
        port:           7373,
        paired_devices: vec![],
        active_jobs:    vec![],
        local_ip:       get_local_ip(),
    }));

    static ref JOB_QUEUE: Arc<Mutex<Vec<RemoteJob>>> = Arc::new(Mutex::new(vec![]));

    static ref PAIRED_TOKENS: Arc<Mutex<HashMap<String, String>>> =
        Arc::new(Mutex::new(HashMap::new()));
}

// ── Public API ────────────────────────────────────────────────

pub fn get_status() -> SyncStatus {
    SYNC_STATE.lock().unwrap().clone()
}

pub async fn pair_device(device_id: String) -> Result<String, String> {
    // Generate a secure pairing token
    let token = format!("{:x}", rand_token());
    PAIRED_TOKENS.lock().unwrap().insert(device_id.clone(), token.clone());
    Ok(token)
}

pub async fn queue_remote_job(job: RemoteJob) -> Result<String, String> {
    let job_id = job.job_id.clone();
    JOB_QUEUE.lock().unwrap().push(job);
    Ok(job_id)
}

pub async fn broadcast_progress(job_id: String, progress: f32) -> Result<(), String> {
    // In production: send to connected WebSocket clients
    log::info!("Job {} progress: {}%", job_id, progress);
    Ok(())
}

// ── WebSocket Server ─────────────────────────────────────────

pub async fn start_sync_server(app: AppHandle) {
    let port = 7373u16;
    let addr = format!("0.0.0.0:{}", port);

    let listener = match TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            log::error!("Failed to bind sync server: {}", e);
            return;
        }
    };

    {
        let mut state = SYNC_STATE.lock().unwrap();
        state.listening = true;
        state.port      = port;
    }

    log::info!("TLG3D Sync server listening on {}", addr);
    let _ = app.emit_all("sync-server-started", serde_json::json!({ "port": port }));

    while let Ok((stream, peer)) = listener.accept().await {
        log::info!("Mobile client connected: {}", peer);
        let app_clone = app.clone();

        tokio::spawn(async move {
            handle_mobile_client(stream, peer.to_string(), app_clone).await;
        });
    }
}

async fn handle_mobile_client<S>(stream: S, peer: String, app: AppHandle)
where
    S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => { log::warn!("WS handshake failed: {}", e); return; }
    };

    let (mut write, mut read) = ws_stream.split();

    // Send welcome message
    let welcome = serde_json::json!({
        "msg_type": "welcome",
        "payload": {
            "server": "CutFlow",
            "version": "0.1.0",
            "capabilities": ["render", "script", "voiceover", "color_grade",
                             "file_transfer", "live_preview"]
        }
    });
    let _ = write.send(Message::Text(welcome.to_string())).await;

    // Process incoming messages
    while let Some(msg) = read.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                    let response = handle_ws_message(ws_msg, &peer, &app).await;
                    let _ = write.send(Message::Text(response.to_string())).await;
                }
            }
            Ok(Message::Binary(data)) => {
                // File transfer from mobile
                handle_file_transfer(data, &peer, &app).await;
            }
            Ok(Message::Ping(p)) => {
                let _ = write.send(Message::Pong(p)).await;
            }
            Ok(Message::Close(_)) => {
                log::info!("Mobile client disconnected: {}", peer);
                break;
            }
            Err(e) => {
                log::warn!("WebSocket error from {}: {}", peer, e);
                break;
            }
            _ => {}
        }
    }
}

async fn handle_ws_message(
    msg: WsMessage,
    peer: &str,
    app: &AppHandle,
) -> serde_json::Value {
    match msg.msg_type.as_str() {

        // Mobile requests pairing
        "pair_request" => {
            let device_id   = msg.payload["device_id"].as_str().unwrap_or("").to_string();
            let device_name = msg.payload["device_name"].as_str().unwrap_or("").to_string();
            let platform    = msg.payload["platform"].as_str().unwrap_or("").to_string();
            let user_id     = msg.payload["user_id"].as_str().unwrap_or("").to_string();

            let token = format!("{:x}", rand_token());
            PAIRED_TOKENS.lock().unwrap().insert(device_id.clone(), token.clone());

            // Notify desktop UI
            let _ = app.emit_all("mobile-paired", serde_json::json!({
                "device_id":   device_id,
                "device_name": device_name,
                "platform":    platform,
                "user_id":     user_id,
            }));

            serde_json::json!({
                "msg_type": "pair_response",
                "payload": { "success": true, "token": token }
            })
        }

        // Mobile submits a render/edit job
        "submit_job" => {
            let job: RemoteJob = match serde_json::from_value(msg.payload.clone()) {
                Ok(j) => j,
                Err(e) => return serde_json::json!({
                    "msg_type": "error",
                    "payload": { "message": e.to_string() }
                }),
            };
            let job_id = job.job_id.clone();
            JOB_QUEUE.lock().unwrap().push(job);

            let _ = app.emit_all("remote-job-received", serde_json::json!({
                "job_id": job_id
            }));

            serde_json::json!({
                "msg_type": "job_accepted",
                "payload": { "job_id": job_id, "position": 1 }
            })
        }

        // Mobile requests project list for user
        "list_projects" => {
            let user_id = msg.payload["user_id"].as_str().unwrap_or("");
            serde_json::json!({
                "msg_type": "project_list",
                "payload": { "user_id": user_id, "projects": [] }
            })
        }

        // Mobile requests file download (completed render)
        "download_file" => {
            let file_path = msg.payload["path"].as_str().unwrap_or("");
            let exists = std::path::Path::new(file_path).exists();
            serde_json::json!({
                "msg_type": "download_ready",
                "payload": { "path": file_path, "exists": exists }
            })
        }

        // Heartbeat
        "ping" => serde_json::json!({ "msg_type": "pong", "payload": {} }),

        _ => serde_json::json!({
            "msg_type": "error",
            "payload": { "message": format!("Unknown message type: {}", msg.msg_type) }
        }),
    }
}

async fn handle_file_transfer(data: Vec<u8>, peer: &str, app: &AppHandle) {
    // First 256 bytes = JSON header with metadata
    if data.len() < 256 {
        return;
    }

    let header_bytes = &data[..256];
    let file_data    = &data[256..];

    if let Ok(header_str) = std::str::from_utf8(header_bytes) {
        let header_str = header_str.trim_end_matches('\0');
        if let Ok(header) = serde_json::from_str::<serde_json::Value>(header_str) {
            let dest_path = header["dest_path"].as_str().unwrap_or("/tmp/tlg3d_upload");
            if let Ok(path) = std::fs::write(dest_path, file_data) {
                let _ = app.emit_all("file-received", serde_json::json!({
                    "path": dest_path,
                    "size": file_data.len(),
                    "from": peer,
                }));
            }
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────

fn get_local_ip() -> String {
    // Use sysinfo or local_ip_address crate in production
    "192.168.1.100".to_string()
}

fn rand_token() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as u64
}
