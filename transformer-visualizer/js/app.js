import { LESSONS } from "./data/lesson-content.js";
import { QUIZ_QUESTIONS } from "./data/quiz-content.js";
import { TransformerSimulator } from "./core/transformer-simulator.js";
import { DEFAULT_SIM_CONFIG } from "./core/config.js";
import { DEFAULT_QUIZ_STATE, STORAGE_KEYS, APP_SCHEMA_VERSION } from "./core/constants.js";
import { loadVersionedState, saveVersionedState, loadRawState } from "./core/storage.js";
import { sanitizeSnapshot, sanitizeQuizState } from "./core/state-sanitizers.js";
import { AppStateStore } from "./core/app-state-store.js";
import { PlaybackController } from "./controllers/playback-controller.js";
import { QuizController } from "./controllers/quiz-controller.js";
import { validateLayer } from "./core/validate-state.js";
import { TooltipController } from "./ui/tooltip.js";
import { renderModuleGrid, renderTokens, drawAttentionMatrix, drawFocusDistribution } from "./ui/network-view.js";

const lessonSelect = document.getElementById("lesson-select");
const layerRange = document.getElementById("layer-range");
const headRange = document.getElementById("head-range");
const tokenRange = document.getElementById("token-range");
const layerLabel = document.getElementById("layer-label");
const headLabel = document.getElementById("head-label");
const tokenLabel = document.getElementById("token-label");
const maskSelect = document.getElementById("mask-select");
const temperatureRange = document.getElementById("temperature-range");
const temperatureLabel = document.getElementById("temperature-label");
const saveStateBtn = document.getElementById("save-state-btn");
const loadStateBtn = document.getElementById("load-state-btn");
const exportJsonBtn = document.getElementById("export-json-btn");
const viewSelect = document.getElementById("view-select");
const notesEl = document.getElementById("teaching-notes");
const moduleGrid = document.getElementById("module-grid");
const tokenRow = document.getElementById("token-row");
const focusSummary = document.getElementById("focus-summary");
const traceBox = document.getElementById("trace-box");
const equationBox = document.getElementById("equation-box");
const headStats = document.getElementById("head-stats");
const validationBox = document.getElementById("validation-box");
const headCompare = document.getElementById("head-compare");
const quizBox = document.getElementById("quiz-box");
const quizSubmitBtn = document.getElementById("quiz-submit-btn");
const quizNextBtn = document.getElementById("quiz-next-btn");
const quizFeedback = document.getElementById("quiz-feedback");
const progressBox = document.getElementById("progress-box");
const canvas = document.getElementById("attention-canvas");
const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const playbackSpeedSelect = document.getElementById("playback-speed-select");
const openGuideBtn = document.getElementById("open-guide-btn");
const closeGuideBtn = document.getElementById("close-guide-btn");
const guideModal = document.getElementById("guide-modal");
const tooltip = new TooltipController(document.getElementById("tooltip"));

const sim = new TransformerSimulator(DEFAULT_SIM_CONFIG);
let currentLesson = LESSONS[0];
let cells = [];
let quizState = sanitizeQuizState({ ...DEFAULT_QUIZ_STATE }, QUIZ_QUESTIONS);
const stateStore = new AppStateStore({
    ui: null,
    quiz: quizState
});

const playback = new PlaybackController({
    playBtn,
    pauseBtn,
    speedSelect: playbackSpeedSelect,
    onTick: () => stepForwardLayer()
});

const quizController = new QuizController({
    questions: QUIZ_QUESTIONS,
    elements: {
        quizBox,
        quizSubmitBtn,
        quizNextBtn,
        quizFeedback,
        progressBox
    },
    initialState: quizState,
    onStateChange: (nextState) => {
        quizState = sanitizeQuizState(nextState, QUIZ_QUESTIONS);
        stateStore.update((prev) => ({ ...prev, quiz: quizState }));
        saveVersionedState(STORAGE_KEYS.quizState, quizState);
    }
});

function applyRuntimeControls() {
    sim.updateRuntime({
        maskType: maskSelect.value,
        temperature: Number(temperatureRange.value)
    });
}

function rebuildToLayer(targetLayer) {
    sim.initialize(currentLesson.tokens);
    applyRuntimeControls();
    while (sim.state.currentLayer <= targetLayer && sim.state.currentLayer < sim.config.nLayers) {
        sim.runStep();
    }
}

function setLesson(lessonId) {
    playback.stop();
    currentLesson = LESSONS.find((l) => l.id === lessonId) || LESSONS[0];
    notesEl.innerHTML = currentLesson.notes.map((n) => `<li>${n}</li>`).join("");
    layerRange.max = String(sim.config.nLayers - 1);
    headRange.max = String(sim.config.nHeads - 1);
    layerRange.value = "0";
    headRange.value = "0";
    tokenRange.max = String(currentLesson.tokens.length - 1);
    tokenRange.value = "0";
    rebuildToLayer(0);
    render();
}

function ensureLayer(target) {
    while (sim.state.currentLayer <= target && sim.state.currentLayer < sim.config.nLayers) {
        sim.runStep();
    }
}

function render() {
    const layer = Number(layerRange.value);
    const head = Number(headRange.value);
    const token = Number(tokenRange.value);
    ensureLayer(layer);
    applyRuntimeControls();

    layerLabel.textContent = `Layer ${layer}`;
    headLabel.textContent = `Head ${head}`;
    tokenLabel.textContent = `Token ${token} (${currentLesson.tokens[token]})`;
    temperatureLabel.textContent = `Temperature ${Number(temperatureRange.value).toFixed(2)}`;

    const layerData = sim.state.layers[Math.min(layer, sim.state.layers.length - 1)];
    const attn = layerData?.heads?.[head]?.attention || [];
    const row = attn[token] || [];
    if (viewSelect.value === "focus") {
        cells = drawFocusDistribution(canvas, row, currentLesson.tokens, token);
    } else {
        cells = drawAttentionMatrix(canvas, attn, currentLesson.tokens, token);
    }
    renderTokens(tokenRow, currentLesson.tokens, token);
    renderModuleGrid(moduleGrid, layer);

    const strongestIdx = row.length ? row.indexOf(Math.max(...row)) : 0;
    focusSummary.innerHTML = `
        <p><strong>Focus Token:</strong> ${currentLesson.tokens[token]}</p>
        <p><strong>Most attended token:</strong> ${currentLesson.tokens[strongestIdx] || "-"}</p>
        <p><strong>Attention weight:</strong> ${(row[strongestIdx] || 0).toFixed(4)}</p>
    `;

    const logits = layerData?.heads?.[head]?.logits?.[token] || [];
    const vecOut = layerData?.heads?.[head]?.output?.[token] || [];
    const qSample = layerData?.heads?.[head]?.q?.[token]?.slice(0, 4) || [];
    const kSample = layerData?.heads?.[head]?.k?.[strongestIdx]?.slice(0, 4) || [];
    traceBox.textContent = [
        `Layer ${layer}, Head ${head}, Token "${currentLesson.tokens[token]}"`,
        "",
        "Scaled Dot Product Logits (sample):",
        logits.slice(0, 6).map((v, i) => `  j=${i}: ${v.toFixed(4)}`).join("\n"),
        "",
        "Head Output Vector (sample):",
        vecOut.slice(0, 8).map((v, i) => `  d=${i}: ${v.toFixed(4)}`).join("\n"),
        "",
        "Rule: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V"
    ].join("\n");

    equationBox.textContent = [
        "Equation Breakdown (selected token pair)",
        "",
        `Q(sample): [${qSample.map((v) => v.toFixed(3)).join(", ")}]`,
        `K(sample): [${kSample.map((v) => v.toFixed(3)).join(", ")}]`,
        `temperature: ${Number(temperatureRange.value).toFixed(2)}`,
        `mask: ${maskSelect.value}`,
        "",
        "softmax_i((Q . K_i) / sqrt(d_k) / temperature)"
    ].join("\n");

    headStats.innerHTML = (layerData?.heads || []).map((h, idx) => {
        const rowSum = (h.attention[token] || []).reduce((a, b) => a + b, 0);
        const entropy = -(h.attention[token] || []).reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);
        return `<div><strong>Head ${idx}</strong> row-sum=${rowSum.toFixed(3)} entropy=${entropy.toFixed(3)}</div>`;
    }).join("");
    headCompare.innerHTML = (layerData?.heads || []).map((h, idx) => {
        const entropy = -(h.attention[token] || []).reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);
        const normalized = Math.max(0, Math.min(100, (entropy / 4) * 100));
        return `
            <div class="metric-bar">
                <div class="metric-label">Head ${idx} entropy ${entropy.toFixed(3)}</div>
                <div class="metric-track"><div class="metric-fill" style="width:${normalized.toFixed(2)}%"></div></div>
            </div>
        `;
    }).join("");

    const issues = validateLayer(layerData);
    const norm = layerData?.diagnostics?.meanTokenNorm ?? 0;
    validationBox.innerHTML = issues.length
        ? `<div class="warning">${issues.join("<br>")}</div>`
        : `<div class="ok">Attention checks pass. mean token L2 norm=${norm.toFixed(3)}</div>`;

    quizController.render();
}

function runAll() {
    playback.stop();
    sim.initialize(currentLesson.tokens);
    applyRuntimeControls();
    sim.runAll();
    layerRange.value = String(Math.min(Number(layerRange.value), sim.config.nLayers - 1));
    render();
}

function stepForwardLayer() {
    if (Number(layerRange.value) >= sim.config.nLayers - 1) {
        playback.stop();
        return;
    }
    sim.runStep();
    layerRange.value = String(Math.min(Number(layerRange.value) + 1, sim.config.nLayers - 1));
    render();
}

function snapshotUiState() {
    const snapshot = {
        lessonId: currentLesson.id,
        layer: Number(layerRange.value),
        head: Number(headRange.value),
        token: Number(tokenRange.value),
        maskType: maskSelect.value,
        temperature: Number(temperatureRange.value),
        view: viewSelect.value
    };
    stateStore.update((prev) => ({ ...prev, ui: snapshot }));
    return snapshot;
}

function applySnapshot(snapshot) {
    if (!snapshot) return;
    const safe = sanitizeSnapshot(snapshot, LESSONS, sim.config);
    lessonSelect.value = safe.lessonId;
    currentLesson = LESSONS.find((l) => l.id === safe.lessonId) || LESSONS[0];
    maskSelect.value = safe.maskType;
    temperatureRange.value = String(safe.temperature);
    viewSelect.value = safe.view;
    setLesson(currentLesson.id);
    layerRange.value = String(safe.layer);
    headRange.value = String(safe.head);
    tokenRange.value = String(safe.token);
    rebuildToLayer(Number(layerRange.value));
    render();
}

lessonSelect.innerHTML = LESSONS.map((l) => `<option value="${l.id}">${l.title}</option>`).join("");

lessonSelect.addEventListener("change", () => setLesson(lessonSelect.value));
layerRange.addEventListener("input", render);
headRange.addEventListener("input", render);
tokenRange.addEventListener("input", render);
viewSelect.addEventListener("change", render);
maskSelect.addEventListener("change", () => {
    rebuildToLayer(Number(layerRange.value));
    render();
});
temperatureRange.addEventListener("input", () => {
    rebuildToLayer(Number(layerRange.value));
    render();
});

document.getElementById("run-btn").addEventListener("click", runAll);
document.getElementById("step-btn").addEventListener("click", () => {
    stepForwardLayer();
});
document.getElementById("reset-btn").addEventListener("click", () => setLesson(currentLesson.id));
playback.bind();
openGuideBtn.addEventListener("click", () => guideModal.classList.remove("hidden"));
closeGuideBtn.addEventListener("click", () => guideModal.classList.add("hidden"));
saveStateBtn.addEventListener("click", () => {
    saveVersionedState(STORAGE_KEYS.uiState, snapshotUiState());
    validationBox.innerHTML = `<div class="ok">State saved locally.</div>`;
});
loadStateBtn.addEventListener("click", () => {
    const raw = loadVersionedState(STORAGE_KEYS.uiState) ?? loadRawState(STORAGE_KEYS.legacyUiState);
    if (!raw) {
        validationBox.innerHTML = `<div class="warning">No saved state found.</div>`;
        return;
    }
    try {
        applySnapshot(raw);
        validationBox.innerHTML = `<div class="ok">State loaded.</div>`;
    } catch (_err) {
        validationBox.innerHTML = `<div class="warning">Saved state is invalid.</div>`;
    }
});
exportJsonBtn.addEventListener("click", () => {
    const payload = {
        schemaVersion: APP_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        ui: snapshotUiState(),
        quiz: quizState,
        lesson: currentLesson,
        state: sim.state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transformer-visualizer-export.json";
    a.click();
    URL.revokeObjectURL(url);
});

tokenRow.addEventListener("click", (ev) => {
    const chip = ev.target.closest(".token-chip");
    if (!chip) return;
    tokenRange.value = chip.dataset.token || "0";
    render();
});

canvas.addEventListener("mousemove", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const hit = cells.find((c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
    if (!hit) {
        tooltip.hide();
        return;
    }
    tooltip.show(
        ev.clientX,
        ev.clientY,
        `<strong>Attention Cell</strong><br>
         Query: <code>${currentLesson.tokens[hit.row]}</code><br>
         Key: <code>${currentLesson.tokens[hit.col]}</code><br>
         Weight: <code>${hit.value.toFixed(5)}</code><br>
         Meaning: how much query token uses key token context.<br>
         View mode: <code>${viewSelect.value}</code>`
    );
});
canvas.addEventListener("mouseleave", () => tooltip.hide());

moduleGrid.addEventListener("mousemove", (ev) => {
    const mod = ev.target.closest(".module");
    if (!mod) return;
    const explanations = {
        embedding: "Builds initial vector = token embedding + positional encoding.",
        attention: "Computes Q, K, V then applies scaled dot-product attention.",
        concat: "Concatenates head outputs and projects back to model dimension.",
        residual1: "Adds input back and stabilizes representation flow.",
        ffn: "Two-layer MLP with non-linearity for token-wise transformation.",
        residual2: "Second skip pathway preserves gradient and semantic features."
    };
    tooltip.show(ev.clientX, ev.clientY, `<strong>${mod.dataset.module}</strong><br>${explanations[mod.dataset.module]}`);
});
moduleGrid.addEventListener("mouseleave", () => tooltip.hide());

document.addEventListener("keydown", (ev) => {
    const target = ev.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable)) {
        return;
    }
    if (ev.key === "r" || ev.key === "R") runAll();
    if (ev.key === "s" || ev.key === "S") document.getElementById("step-btn").click();
    if (ev.key === " ") {
        ev.preventDefault();
        if (playback.isRunning()) playback.stop();
        else playback.start();
    }
    if (ev.key === "]") {
        layerRange.value = String(Math.min(Number(layerRange.value) + 1, sim.config.nLayers - 1));
        render();
    }
    if (ev.key === "[") {
        layerRange.value = String(Math.max(Number(layerRange.value) - 1, 0));
        render();
    }
    if (ev.key === "h" || ev.key === "H") {
        const hidden = guideModal.classList.contains("hidden");
        guideModal.classList.toggle("hidden", !hidden);
    }
    if (ev.key === "Escape") {
        guideModal.classList.add("hidden");
    }
});

window.addEventListener("resize", () => {
    render();
});

const saved = loadVersionedState(STORAGE_KEYS.uiState) ?? loadRawState(STORAGE_KEYS.legacyUiState);
const savedQuiz = loadVersionedState(STORAGE_KEYS.quizState) ?? loadRawState(STORAGE_KEYS.legacyQuizState);
if (savedQuiz) {
    try {
        quizState = sanitizeQuizState({ ...quizState, ...savedQuiz }, QUIZ_QUESTIONS);
        quizController.setState(quizState);
    } catch (_err) {
        quizState = sanitizeQuizState({ ...DEFAULT_QUIZ_STATE }, QUIZ_QUESTIONS);
        quizController.setState(quizState);
    }
}
quizController.bind();
playback.stop();
if (saved) {
    try {
        applySnapshot(saved);
    } catch (_err) {
        setLesson(currentLesson.id);
    }
} else {
    setLesson(currentLesson.id);
}
