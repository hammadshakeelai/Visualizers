export function sanitizeSnapshot(raw = {}, lessons, config) {
    const lessonIds = new Set(lessons.map((l) => l.id));
    const lessonId = lessonIds.has(raw.lessonId) ? raw.lessonId : lessons[0].id;
    const layer = Number.isFinite(raw.layer) ? Math.max(0, Math.min(raw.layer, config.nLayers - 1)) : 0;
    const head = Number.isFinite(raw.head) ? Math.max(0, Math.min(raw.head, config.nHeads - 1)) : 0;
    const tokenCount = (lessons.find((l) => l.id === lessonId)?.tokens?.length || 1);
    const token = Number.isFinite(raw.token) ? Math.max(0, Math.min(raw.token, tokenCount - 1)) : 0;
    const maskType = raw.maskType === "causal" ? "causal" : "none";
    const temp = Number.isFinite(raw.temperature) ? raw.temperature : 1;
    const temperature = Math.max(0.5, Math.min(2, temp));
    const view = raw.view === "focus" ? "focus" : "matrix";
    return { lessonId, layer, head, token, maskType, temperature, view };
}

export function sanitizeQuizState(raw = {}, questions) {
    const maxIndex = Math.max(0, questions.length - 1);
    const safeIndex = Number.isFinite(raw.index) ? Math.min(Math.max(0, raw.index), maxIndex) : 0;
    const safeAnswered = Number.isFinite(raw.answered) ? Math.min(Math.max(0, raw.answered), questions.length) : 0;
    const safeScore = Number.isFinite(raw.score) ? Math.min(Math.max(0, raw.score), questions.length) : 0;
    const safeSelected = Number.isFinite(raw.selected) ? raw.selected : -1;
    const safeGraded = (raw.graded && typeof raw.graded === "object") ? raw.graded : {};
    const safeAnswers = (raw.answers && typeof raw.answers === "object") ? raw.answers : {};
    const safeQuestionIds = new Set(questions.map((q) => q.id));
    const graded = Object.fromEntries(Object.entries(safeGraded).filter(([k, v]) => safeQuestionIds.has(k) && Boolean(v)));
    const answers = Object.fromEntries(Object.entries(safeAnswers).filter(([k, v]) => safeQuestionIds.has(k) && Number.isFinite(v)));
    const computedAnswered = Object.keys(graded).length;
    const computedScore = Object.entries(graded).reduce((acc, [qid]) => {
        const q = questions.find((item) => item.id === qid);
        const ans = answers[qid];
        return acc + ((q && ans === q.answer) ? 1 : 0);
    }, 0);
    return {
        index: safeIndex,
        score: Math.min(safeScore, computedScore),
        answered: Math.min(safeAnswered, computedAnswered),
        selected: safeSelected,
        graded,
        answers
    };
}
