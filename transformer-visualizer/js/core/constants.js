export const APP_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
    uiState: "transformer-visualizer-state-v2",
    quizState: "transformer-visualizer-quiz-v2",
    // Legacy keys for migration
    legacyUiState: "transformer-visualizer-state-v1",
    legacyQuizState: "transformer-visualizer-quiz-v1"
};

export const DEFAULT_QUIZ_STATE = {
    index: 0,
    score: 0,
    answered: 0,
    selected: -1,
    graded: {},
    answers: {}
};
