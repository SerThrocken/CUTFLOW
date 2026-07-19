// ============================================================
//  CutFlow — Checkpoint System
//  Saves and restores agent progress so nothing is lost on
//  provider failure, crash, or interruption.
// ============================================================

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::SystemTime;

/// Represents the state of a multi-step agent operation.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Checkpoint {
    /// Unique ID for this editing session
    pub session_id: String,
    /// Which agent is running
    pub agent_name: String,
    /// Current step index (0-based)
    pub current_step: usize,
    /// Total expected steps
    pub total_steps: usize,
    /// Completed step outputs (key = step name, value = output/path)
    pub completed_steps: Vec<StepResult>,
    /// Original prompt that started this operation
    pub original_prompt: String,
    /// Project path
    pub project_path: String,
    /// Timestamp of last update
    pub last_updated: u64,
    /// Whether this checkpoint is finished
    pub completed: bool,
    /// Intermediate files created (for cleanup or resume)
    pub intermediate_files: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StepResult {
    pub step_name: String,
    pub step_index: usize,
    pub output: String,
    pub output_files: Vec<String>,
    pub timestamp: u64,
    pub provider_used: String,
}

impl Checkpoint {
    /// Create a new checkpoint for an agent operation.
    pub fn new(agent_name: &str, project_path: &str, prompt: &str, total_steps: usize) -> Self {
        let ts = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            session_id: format!("{}_{}", agent_name, ts),
            agent_name: agent_name.to_string(),
            current_step: 0,
            total_steps,
            completed_steps: vec![],
            original_prompt: prompt.to_string(),
            project_path: project_path.to_string(),
            last_updated: ts,
            completed: false,
            intermediate_files: vec![],
        }
    }

    /// Record a completed step.
    pub fn record_step(
        &mut self,
        step_name: &str,
        output: &str,
        output_files: Vec<String>,
        provider: &str,
    ) {
        let ts = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        self.completed_steps.push(StepResult {
            step_name: step_name.to_string(),
            step_index: self.current_step,
            output: output.to_string(),
            output_files: output_files.clone(),
            timestamp: ts,
            provider_used: provider.to_string(),
        });

        self.current_step += 1;
        self.last_updated = ts;
        self.intermediate_files.extend(output_files);

        if self.current_step >= self.total_steps {
            self.completed = true;
        }

        // Auto-save after each step
        let _ = self.save();
    }

    /// Mark the checkpoint as completed.
    pub fn finish(&mut self) {
        self.completed = true;
        self.last_updated = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let _ = self.save();
    }

    /// Get the progress percentage.
    pub fn progress_pct(&self) -> u32 {
        if self.total_steps == 0 { return 100; }
        ((self.current_step as f64 / self.total_steps as f64) * 100.0) as u32
    }

    // ── Persistence ──────────────────────────────────────────

    fn checkpoints_dir(project_path: &str) -> String {
        format!("{}/checkpoints", project_path)
    }

    fn file_path(&self) -> String {
        format!(
            "{}/{}.json",
            Self::checkpoints_dir(&self.project_path),
            self.session_id
        )
    }

    /// Save checkpoint to disk.
    pub fn save(&self) -> Result<(), String> {
        let dir = Self::checkpoints_dir(&self.project_path);
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(self.file_path(), json).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Load a checkpoint from disk by session ID.
    pub fn load(project_path: &str, session_id: &str) -> Result<Self, String> {
        let path = format!("{}/checkpoints/{}.json", project_path, session_id);
        let json = fs::read_to_string(&path).map_err(|e| format!("Checkpoint not found: {}", e))?;
        serde_json::from_str(&json).map_err(|e| e.to_string())
    }

    /// Find the most recent incomplete checkpoint for an agent.
    pub fn find_resumable(project_path: &str, agent_name: &str) -> Option<Self> {
        let dir = Self::checkpoints_dir(project_path);
        let entries = fs::read_dir(&dir).ok()?;

        let mut candidates: Vec<Self> = entries
            .filter_map(|e| e.ok())
            .filter_map(|e| {
                let content = fs::read_to_string(e.path()).ok()?;
                let cp: Checkpoint = serde_json::from_str(&content).ok()?;
                if cp.agent_name == agent_name && !cp.completed {
                    Some(cp)
                } else {
                    None
                }
            })
            .collect();

        // Return the most recently updated one
        candidates.sort_by(|a, b| b.last_updated.cmp(&a.last_updated));
        candidates.into_iter().next()
    }

    /// List all checkpoints for a project.
    pub fn list_all(project_path: &str) -> Vec<Self> {
        let dir = Self::checkpoints_dir(project_path);
        let entries = match fs::read_dir(&dir) {
            Ok(e) => e,
            Err(_) => return vec![],
        };

        let mut checkpoints: Vec<Self> = entries
            .filter_map(|e| e.ok())
            .filter_map(|e| {
                let content = fs::read_to_string(e.path()).ok()?;
                serde_json::from_str(&content).ok()
            })
            .collect();

        checkpoints.sort_by(|a, b| b.last_updated.cmp(&a.last_updated));
        checkpoints
    }

    /// Clean up old completed checkpoints (keep last N).
    pub fn cleanup_old(project_path: &str, keep_last: usize) {
        let all = Self::list_all(project_path);
        let completed: Vec<&Self> = all.iter().filter(|c| c.completed).collect();

        if completed.len() > keep_last {
            for cp in &completed[keep_last..] {
                let _ = fs::remove_file(cp.file_path());
            }
        }
    }

    /// Summary for UI display.
    pub fn summary(&self) -> String {
        format!(
            "{} [{}] — {}/{} steps ({}%)",
            self.agent_name,
            if self.completed { "✅ Done" } else { "🔄 In Progress" },
            self.current_step,
            self.total_steps,
            self.progress_pct()
        )
    }
}

// ============================================================
//  Checkpoint-Aware Agent Runner
//  Wraps any multi-step agent operation with checkpointing.
// ============================================================

/// Run a series of named steps with automatic checkpointing.
/// If a previous checkpoint exists for this agent, resumes from where it left off.
pub async fn run_with_checkpoints<F, Fut>(
    project_path: &str,
    agent_name: &str,
    prompt: &str,
    steps: Vec<(&str, F)>,
) -> Result<String, String>
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = Result<(String, Vec<String>), String>>,
{
    // Try to resume from a previous checkpoint
    let mut checkpoint = Checkpoint::find_resumable(project_path, agent_name)
        .unwrap_or_else(|| Checkpoint::new(agent_name, project_path, prompt, steps.len()));

    let start_from = checkpoint.current_step;
    let mut last_output = String::new();

    for (idx, (step_name, step_fn)) in steps.into_iter().enumerate() {
        // Skip already-completed steps
        if idx < start_from {
            if let Some(prev) = checkpoint.completed_steps.get(idx) {
                last_output = prev.output.clone();
            }
            continue;
        }

        // Execute the step
        match step_fn().await {
            Ok((output, files)) => {
                checkpoint.record_step(step_name, &output, files, "auto");
                last_output = output;
            }
            Err(e) => {
                // Save checkpoint before returning error so we can resume later
                let _ = checkpoint.save();
                return Err(format!(
                    "Step '{}' failed: {}. Progress saved — resume from checkpoint {}.",
                    step_name, e, checkpoint.session_id
                ));
            }
        }
    }

    checkpoint.finish();

    // Clean up old checkpoints (keep last 10)
    Checkpoint::cleanup_old(project_path, 10);

    Ok(last_output)
}
