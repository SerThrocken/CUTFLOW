# CutFlow RTX 3060 Optimization Checklist

- [x] Implement `get_encoder_args()` and CUDA acceleration in `apps/desktop/src/ffmpeg.rs`
- [x] Update `apps/desktop/src/agents.rs` to use hardware-accelerated encoder arguments
- [x] Implement VRAM-aware model selection in `agents.rs`
- [x] Compile and verify the optimized desktop binary
- [x] Update walkthrough documentation
