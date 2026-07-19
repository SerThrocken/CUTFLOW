# Changelog

All notable changes to **CutFlow** will be documented in this file.

## [1.1.0] - UI Overhaul & Monetization Integration
**Author:** SerThrocken

### Added
- **TLG3D Industrial Theming Engine:** Completely overhauled the UI in GPUI with dynamic color palettes based on the official TLG3D logo (Matte Charcoal, Neon Swirl Green, Swirl Yellow).
- **Curated Professional Themes:** Added Midnight Ocean, Nordic Studio, and Graphite Minimal themes to provide premium customization options without color clashing.
- **Basic / Advanced Editor Toggle:** Introduced a sleek toggle to switch between a minimalist Vibe-Prompt-only UI and a full multi-track advanced timeline.
- **Theme Transitions:** Implemented smooth sideways rolling fade animations for seamless theme swapping.
- **Monetization & Licensing Structure:** Drafted comprehensive strategies for Patreon webhook integration, PayPal checkouts, device fingerprinting, and offline tolerance.
- **Dev Backdoor Credentials:** Added secure `MAMAMEG` credentials to the encrypted security module alongside the primary developer backdoor.
- **Free AI Models Guide:** Created a comprehensive document (`FREE_AI_MODELS_GUIDE.md`) detailing free LLM alternatives (OpenRouter, Groq, Google AI Studio, etc.) to use CutFlow without API costs.

### Changed
- Refactored `CutFlowApp` state to support `theme_id` and `advanced_mode`.
- Migrated hardcoded GPUI hex values to dynamic `Theme` struct lookups.
- Completely rewrote the `README.md` to highlight AI editing features, system requirements, and the new Free vs. Pro tier comparison matrix.

## [1.0.0] - Initial Release
**Author:** SerThrocken

### Added
- Initial Vibe Edit Engine implementation in Rust (GPUI).
- Multi-track timeline (Video, BGM, SFX, Voiceover).
- System hardware telemetry detection (GPU / VRAM).
- Bot daemon integrations (Discord, Telegram).
- Speech-Synchronized Teleprompter view.
