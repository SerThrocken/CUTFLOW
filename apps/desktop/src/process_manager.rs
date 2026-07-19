// ============================================================
//  CutFlow — Background Process Manager
// ============================================================

use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::io::{BufRead, BufReader};

pub struct ProcessManager {
    discord_child: Option<Child>,
    telegram_child: Option<Child>,
    api_child: Option<Child>,
    video_child: Option<Child>,
    logs: Arc<Mutex<Vec<String>>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            discord_child: None,
            telegram_child: None,
            api_child: None,
            video_child: None,
            logs: Arc::new(Mutex::new(vec!["Process manager initialized.".into()])),
        }
    }

    fn spawn_and_stream(&self, label: &str, program: &str, args: &[&str], cwd: &str) -> Result<Child, String> {
        let mut cmd = Command::new(program);
        
        cmd.args(args)
            .current_dir(cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn {}: {}", program, e))?;
            
        let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
        let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
        
        let logs = self.logs.clone();
        let label = label.to_string();
        
        // Spawn thread to read stdout
        let logs_stdout = logs.clone();
        let label_stdout = label.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(l) = line {
                    if let Ok(mut guard) = logs_stdout.lock() {
                        guard.push(format!("[{} OUT] {}", label_stdout, l));
                        if guard.len() > 1000 { guard.remove(0); }
                    }
                }
            }
        });
        
        // Spawn thread to read stderr
        let logs_stderr = logs;
        let label_stderr = label;
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(l) = line {
                    if let Ok(mut guard) = logs_stderr.lock() {
                        guard.push(format!("[{} ERR] {}", label_stderr, l));
                        if guard.len() > 1000 { guard.remove(0); }
                    }
                }
            }
        });
        
        Ok(child)
    }

    pub fn start_discord(&mut self) -> Result<(), String> {
        if self.discord_child.is_none() {
            let child = self.spawn_and_stream(
                "DISCORD",
                "bun",
                &["run", "packages/messaging/src/main.ts"],
                "SerThrocken (The Looking Glass 3D)-vibe-edit",
            )?;
            self.discord_child = Some(child);
        }
        Ok(())
    }

    pub fn stop_discord(&mut self) {
        if let Some(mut child) = self.discord_child.take() {
            let _ = child.kill();
        }
    }

    pub fn start_telegram(&mut self) -> Result<(), String> {
        if self.telegram_child.is_none() {
            let child = self.spawn_and_stream(
                "TELEGRAM",
                "bun",
                &["run", "packages/messaging/src/main.ts"],
                "SerThrocken (The Looking Glass 3D)-vibe-edit",
            )?;
            self.telegram_child = Some(child);
        }
        Ok(())
    }

    pub fn stop_telegram(&mut self) {
        if let Some(mut child) = self.telegram_child.take() {
            let _ = child.kill();
        }
    }

    pub fn start_api(&mut self) -> Result<(), String> {
        if self.api_child.is_none() {
            let child = self.spawn_and_stream(
                "API",
                "bun",
                &["run", "packages/api/src/index.ts"],
                "SerThrocken (The Looking Glass 3D)-vibe-edit",
            )?;
            self.api_child = Some(child);
        }
        Ok(())
    }

    pub fn stop_api(&mut self) {
        if let Some(mut child) = self.api_child.take() {
            let _ = child.kill();
        }
    }

    pub fn start_video(&mut self) -> Result<(), String> {
        if self.video_child.is_none() {
            let child = self.spawn_and_stream(
                "VIDEO",
                "python",
                &["packages/video-engine/src/app.py"],
                "SerThrocken (The Looking Glass 3D)-vibe-edit",
            )?;
            self.video_child = Some(child);
        }
        Ok(())
    }

    pub fn stop_video(&mut self) {
        if let Some(mut child) = self.video_child.take() {
            let _ = child.kill();
        }
    }

    pub fn get_logs(&self) -> Vec<String> {
        if let Ok(guard) = self.logs.lock() {
            guard.clone()
        } else {
            vec![]
        }
    }
}

impl Drop for ProcessManager {
    fn drop(&mut self) {
        self.stop_discord();
        self.stop_telegram();
        self.stop_api();
        self.stop_video();
    }
}
