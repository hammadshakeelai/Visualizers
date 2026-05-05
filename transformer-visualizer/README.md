# Transformer Visualizer and Simulator

An educational, modular web app that visualizes core Transformer internals for both beginners and advanced students.

## Goals

- Explain each stage of an encoder block with interactive visuals.
- Simulate the forward pass with inspectable intermediate tensors.
- Support hover-based explanations on modules and attention cells.
- Keep architecture modular for future extensions (decoder, masking, training loop, compare heads).

## Architecture

- `index.html` - screen layout and semantic containers
- `styles.css` - responsive visual design and readability
- `js/core/config.js` - simulation defaults and config normalization
- `js/core/constants.js` - shared constants and storage keys
- `js/core/math-utils.js` - reusable numerical primitives
- `js/core/transformer-simulator.js` - deterministic simulation engine
- `js/core/storage.js` - versioned persistence helpers
- `js/core/app-state-store.js` - app state foundation for future modularization
- `js/core/state-sanitizers.js` - centralized data validation and clamping
- `js/core/validate-state.js` - invariant checks (softmax row sums)
- `js/ui/network-view.js` - drawing modules, token chips, attention matrix
- `js/ui/tooltip.js` - reusable hover detail system
- `js/controllers/playback-controller.js` - playback lifecycle and controls
- `js/controllers/quiz-controller.js` - quiz behavior, rendering, and scoring flow
- `js/data/lesson-content.js` - teaching presets and pedagogy notes
- `js/app.js` - orchestration, state synchronization, and event handling
- `ARCHITECTURE.md` - module boundaries and extension strategy

## Software Requirements Snapshot (SRS-style)

### Functional requirements

- Simulate multi-layer, multi-head self-attention with deterministic outputs.
- Support interactive layer/head/token controls.
- Support mask modes: none and causal.
- Support temperature scaling in attention softmax.
- Support matrix and focus-distribution visualization modes.
- Support local save/load and JSON export of simulator session state.
- Provide guided quiz questions with persisted score/progress.
- Provide per-head comparison analytics for fast interpretation.
- Provide hover explanations for attention cells and architecture modules.
- Show trace output and equation breakdown for selected focus token.
- Validate simulation integrity and display warnings if invariants drift.

### Non-functional requirements

- Zero dependency, static hosting compatible with GitHub Pages.
- Modular code organization to enable future decoder and training extensions.
- Fast interactions for classroom demos (single-threaded browser execution).
- Readable UI for both beginner and advanced users.

## Deployment (GitHub Pages)

This is a pure static app. To deploy:

1. Push to GitHub.
2. In repository settings, enable GitHub Pages from branch `main` (root).
3. Visit:
   - `<your-pages-url>/transformer-visualizer/`

## Verification

- Open `transformer-visualizer/tests.html` in browser.
- Confirm all deterministic simulator tests pass:
  - full-layer execution
  - attention row normalization
  - causal mask correctness
  - temperature and entropy behavior

## Roadmap

- Add masking visualization (padding and causal masks).
- Add decoder cross-attention stage.
- Add BPE tokenization explorer and vocabulary heatmaps.
- Add layer norm and gradient flow charts.
- Add lesson checkpoints and mini quizzes.
