# CutFlow — Director Agent & Sub-Agent Architecture

## Overview

CutFlow's agentic system is modeled after a real film production crew. The **Director Agent** is the master orchestrator that delegates tasks to specialized **Sub-Agents**, monitors their progress, and ensures quality through a unique HP/Grading accountability system.

---

## The Director Agent

The Director Agent (`DirectorAgent` in `agents.rs`) is the central controller that:

1. **Receives** the user's natural language instruction (e.g., "make this video cinematic with B-roll")
2. **Decomposes** the instruction into sub-tasks using the LLM router
3. **Dispatches** each sub-task to the appropriate Sub-Agent
4. **Monitors** each Sub-Agent's progress with a 3-minute check-in timer
5. **Evaluates** the output quality and accepts or rejects the result

### HP & Grading System

Every Sub-Agent starts with **15 Health Points (HP)** and an **A+ grade**. Points are deducted when:
- The Director rejects a Sub-Agent's output
- The user rejects a Sub-Agent's output
- A Sub-Agent fails to check in within 3 minutes (anti-loop protection)

| HP Range | Grade |
|---|---|
| 15 | A+ |
| 14 | A |
| 13 | A- |
| 12 | B+ |
| 11 | B |
| 10 | B- |
| 9 | C+ |
| 8 | C |
| 7 | C- |
| 6 | D+ |
| 5 | D |
| 0–4 | F |

When a Sub-Agent reaches **F grade**, it is flagged for the user's attention and the Director may reassign its tasks to another agent or request manual intervention.

---

## Sub-Agents

### Registered Sub-Agents

| ID | Name | Responsibility |
|---|---|---|
| `scripting` | Scripting Agent | Script generation, video ideas, storyboards |
| `audio` | Audio Agent | Music, SFX, voice isolation, noise reduction, ducking |
| `video` | Video/B-Roll Agent | B-Roll fetching, jump cuts, reframing, highlights |
| `fx` | VFX Agent | Color grading, effects, intros/outros, transitions |

### Agent Lifecycle

```
1. IDLE      → Agent is waiting for a task
2. ACTIVE    → Agent is processing a task
3. CHECK-IN  → Agent reports progress to Director (resets 3-min timer)
4. COMPLETE  → Agent returns result to Director for evaluation
5. PENALIZED → Agent failed or timed out, HP reduced
6. RESET     → Director resets agent HP back to 15 (A+)
```

---

## Available Agent Functions

### Scripting Agent
| Function | Description |
|---|---|
| `run_script_generation` | Generate a full video script from a prompt |
| `run_video_idea_brainstorm` | Brainstorm video concepts, titles, hooks |
| `run_text_to_storyboard` | Create a scene-by-scene production storyboard |
| `run_engagement_prediction` | Predict engagement score and suggest improvements |

### Audio Agent
| Function | Description |
|---|---|
| `run_generate_music` | Synthesize mood-based background music |
| `run_generate_sfx` | Create procedural sound effects |
| `run_voiceover_synthesis` | Generate AI voiceovers (ElevenLabs) |
| `run_noise_reduction` | Remove background noise |
| `run_voice_isolation` | Extract vocals from mixed audio |
| `run_audio_ducker` | Auto-duck music during speech |
| `run_beat_sync` | Detect beat markers for sync editing |
| `run_music_advisor` | AI recommends music mood, BPM, SFX placement |

### Video/B-Roll Agent
| Function | Description |
|---|---|
| `run_broll_agent` | Fetch royalty-free B-Roll from Pexels API |
| `run_smart_jumpcut` | Emotion-aware silence removal |
| `run_instruction_editor` | Natural language → edit operation decomposition |
| `run_auto_highlights` | Extract viral short-form clips from long video |
| `run_auto_reframe` | Convert aspect ratio (16:9 → 9:16, 1:1, 4:5) |
| `run_scene_detection` | Detect scene boundaries |
| `run_auto_editing` | Auto-trim and concat clips to target duration |
| `run_ken_burns` | Apply slow zoom pan effect |
| `run_speed_ramp` | Time remapping with speed ramping |
| `run_generative_extend` | Extend clip duration using reverse-loop |
| `run_semantic_search` | Natural language search across project clips |
| `run_thumbnail_generator` | Extract best frame + add title text overlay |

### VFX Agent
| Function | Description |
|---|---|
| `run_color_correction` | Apply color grade presets |
| `run_vibe_grade` | Autonomous vibe analysis → grade + EQ |
| `run_apply_effect` | Apply visual effects (VHS, cyberpunk, noir, etc.) |
| `run_apply_persona` | Apply bundled style presets (MrBeast, Documentary, etc.) |
| `run_intro_outro_generator` | Generate animated intro/outro sequences |
| `run_shape_dissolve` | Shape-based transitions (circle, diamond, blinds) |
| `run_lut_application` | Apply custom .cube LUT files |
| `run_match_color` | Unify color across multiple clips |
| `run_background_removal` | Chromakey green/blue screen removal |
| `run_object_removal` | Remove watermarks/logos (delogo) |
| `run_motion_smoothing` | Video stabilization (vidstab 2-pass) |
| `run_emotion_grade` | Emotion-based automatic color grading |

---

## LLM Routing

All agents use the Universal LLM Router (`ollama.rs`) which supports 40+ providers:

```
User Config → Provider Selection → API Call → Response
     ↓ (if fail)
  Fallback Provider → API Call → Response
     ↓ (if fail)
  Local Ollama → VRAM-Aware Model Selection → Response
     ↓ (if fail)
  Hardcoded Fallback Response
```

### VRAM-Aware Local Model Selection
| Available VRAM | Model Selected |
|---|---|
| 12+ GB | `llama3` (best quality) |
| 6–12 GB | `phi3` (good balance) |
| < 6 GB | `gemma:2b` (lightweight) |

---

*Architecture documentation for CutFlow by SerThrocken — The Looking Glass 3D*
