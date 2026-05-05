# Transformer Visualizer Architecture

This document defines the long-term structure for the Transformer visualizer so future work can scale without rewriting the app.

## System layers

- `js/core/` - deterministic simulation and shared infrastructure
  - `transformer-simulator.js` - forward pass emulator and layer caches
  - `config.js` / `constants.js` - configuration boundaries and shared constants
  - `storage.js` - versioned persistence helpers
  - `state-sanitizers.js` - snapshot/quiz validation and clamping rules
  - `app-state-store.js` - simple reactive store for app-level state
  - `validate-state.js` - integrity checks and invariant validation
- `js/controllers/` - feature controllers with minimal cross-coupling
  - `playback-controller.js` - animation timer + play/pause/speed lifecycle
  - `quiz-controller.js` - quiz state transitions and rendering
- `js/ui/` - rendering and interaction primitives
  - `network-view.js` - canvas rendering for matrix/distribution modes
  - `tooltip.js` - hover explainability
- `js/data/` - static lesson and quiz content
- `js/app.js` - composition/orchestration layer only

## Extension points

- Add new view modes in `js/ui/network-view.js`, then expose through `view-select`.
- Add simulator variants in `js/core/transformer-simulator.js` (decoder, cross-attention, masks).
- Add new persisted state fields via `constants.js` + `storage.js` to keep schema migrations explicit.
- Add new pedagogical tracks by extending `lesson-content.js` and `quiz-content.js`.

## State and persistence policy

- Use versioned storage writes through `saveVersionedState(...)`.
- Support migration reads from both new and legacy keys.
- Any new persisted object should be sanitized before use.
- `app-state-store.js` is the single source-of-truth scaffold for gradual migration to fully reactive UI updates.
- Keep business rules in `core/` and controller flow in `controllers/`; avoid pushing non-trivial logic into `app.js`.

## Quality gates for new work

- Keep `js/core` deterministic for reproducible teaching outputs.
- Add or extend `tests/run-simulator-tests.js` for behavior-affecting changes.
- Run lint checks on all touched files.
- Preserve keyboard accessibility and hover explainability semantics.
