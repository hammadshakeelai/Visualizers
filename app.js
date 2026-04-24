// ===== App State =====
const CLASS_COLORS = ['#6366f1', '#f472b6', '#34d399'];
const CLASS_NAMES = ['A', 'B', 'C'];
const RESOLUTIONS = [60, 40, 20]; // pixel step for heatmap

const state = {
    points: [],
    activeClass: 0,
    model: new NaiveBayes(),
    showBoundary: true,
    showHeatmap: true,
    showGaussian: true,
    resolution: 1, // index into RESOLUTIONS
    featureTab: 'x',
};

// ===== DOM Elements =====
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const curveCanvas = document.getElementById('curve-canvas');
const curveCtx = curveCanvas.getContext('2d');
const tooltip = document.getElementById('canvas-tooltip');
const placeholder = document.getElementById('canvas-placeholder');
const hoverProbs = document.getElementById('hover-probs');

// ===== Canvas Setup =====
function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Curve canvas
    const cw = curveCanvas.parentElement;
    const cr = cw.getBoundingClientRect();
    curveCanvas.width = cr.width * dpr;
    curveCanvas.height = cr.height * dpr;
    curveCanvas.style.width = cr.width + 'px';
    curveCanvas.style.height = cr.height + 'px';
    curveCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    render();
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 50);

// ===== Coordinate System =====
// Canvas maps to [0, 1] x [0, 1] in data space
function canvasToData(cx, cy) {
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    return { x: cx / w, y: 1 - cy / h };
}

function dataToCanvas(dx, dy) {
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    return { cx: dx * w, cy: (1 - dy) * h };
}

// ===== Rendering =====
function render() {
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    drawGrid(w, h);

    // Heatmap + boundary
    if (state.model.trained && (state.showHeatmap || state.showBoundary)) {
        drawHeatmapAndBoundary(w, h);
    }

    // Data points
    drawPoints(w, h);

    // Placeholder
    if (state.points.length === 0) {
        placeholder.classList.remove('hidden');
    } else {
        placeholder.classList.add('hidden');
    }
}

function drawGrid(w, h) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const steps = 10;
    for (let i = 1; i < steps; i++) {
        const x = (i / steps) * w;
        const y = (i / steps) * h;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= steps; i += 2) {
        ctx.fillText((i / steps).toFixed(1), (i / steps) * w, h - 4);
    }
    ctx.textAlign = 'left';
    for (let i = 0; i <= steps; i += 2) {
        ctx.fillText((i / steps).toFixed(1), 4, h - (i / steps) * h + 3);
    }
}

function drawHeatmapAndBoundary(w, h) {
    const step = RESOLUTIONS[state.resolution];
    const cols = Math.ceil(w / step);
    const rows = Math.ceil(h / step);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const cx = i * step + step / 2;
            const cy = j * step + step / 2;
            const { x, y } = canvasToData(cx, cy);
            const posteriors = state.model.getPosteriors(x, y);
            const predicted = state.model.predict(x, y);
            const confidence = posteriors[predicted];

            if (state.showHeatmap) {
                const color = CLASS_COLORS[predicted];
                const alpha = 0.05 + confidence * 0.2;
                ctx.fillStyle = hexToRgba(color, alpha);
                ctx.fillRect(i * step, j * step, step, step);
            }
        }
    }

    // Draw boundary lines
    if (state.showBoundary) {
        const bStep = Math.max(4, step / 2);
        const bCols = Math.ceil(w / bStep);
        const bRows = Math.ceil(h / bStep);
        const grid = [];

        for (let i = 0; i < bCols; i++) {
            grid[i] = [];
            for (let j = 0; j < bRows; j++) {
                const cx = i * bStep + bStep / 2;
                const cy = j * bStep + bStep / 2;
                const { x, y } = canvasToData(cx, cy);
                grid[i][j] = state.model.predict(x, y);
            }
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < bCols - 1; i++) {
            for (let j = 0; j < bRows - 1; j++) {
                const c = grid[i][j];
                if (c !== grid[i + 1][j] || c !== grid[i][j + 1]) {
                    const cx = i * bStep + bStep / 2;
                    const cy = j * bStep + bStep / 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }
}

function drawPoints(w, h) {
    state.points.forEach(p => {
        const { cx, cy } = dataToCanvas(p.x, p.y);
        const color = CLASS_COLORS[p.label];

        // Glow
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
        glow.addColorStop(0, hexToRgba(color, 0.3));
        glow.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = glow;
        ctx.fill();

        // Point
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });
}

// ===== Gaussian Curves =====
function drawCurves() {
    const cw = parseFloat(curveCanvas.style.width);
    const ch = parseFloat(curveCanvas.style.height);
    curveCtx.clearRect(0, 0, cw, ch);

    if (!state.model.trained || !state.showGaussian) return;

    const feat = state.featureTab;
    const padding = { top: 10, bottom: 20, left: 10, right: 10 };
    const plotW = cw - padding.left - padding.right;
    const plotH = ch - padding.top - padding.bottom;

    // Find range
    let globalMax = 0;
    const curves = state.model.classes.map(c => {
        const mean = state.model.means[c][feat];
        const variance = state.model.variances[c][feat];
        const points = [];
        for (let i = 0; i <= 200; i++) {
            const x = i / 200;
            const y = state.model.gaussianPDF(x, mean, variance);
            if (y > globalMax) globalMax = y;
            points.push({ x, y });
        }
        return { label: c, points };
    });

    // Draw
    curves.forEach(curve => {
        const color = CLASS_COLORS[curve.label];
        curveCtx.beginPath();
        curve.points.forEach((p, i) => {
            const px = padding.left + p.x * plotW;
            const py = padding.top + plotH - (p.y / globalMax) * plotH;
            if (i === 0) curveCtx.moveTo(px, py);
            else curveCtx.lineTo(px, py);
        });
        curveCtx.strokeStyle = color;
        curveCtx.lineWidth = 2;
        curveCtx.stroke();

        // Fill under curve
        const lastPt = curve.points[curve.points.length - 1];
        curveCtx.lineTo(padding.left + lastPt.x * plotW, padding.top + plotH);
        curveCtx.lineTo(padding.left, padding.top + plotH);
        curveCtx.closePath();
        curveCtx.fillStyle = hexToRgba(color, 0.1);
        curveCtx.fill();
    });

    // Axis
    curveCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    curveCtx.lineWidth = 1;
    curveCtx.beginPath();
    curveCtx.moveTo(padding.left, padding.top + plotH);
    curveCtx.lineTo(padding.left + plotW, padding.top + plotH);
    curveCtx.stroke();

    curveCtx.fillStyle = 'rgba(255,255,255,0.2)';
    curveCtx.font = '9px JetBrains Mono';
    curveCtx.textAlign = 'center';
    curveCtx.fillText('0', padding.left, ch - 4);
    curveCtx.fillText('1', padding.left + plotW, ch - 4);
    curveCtx.fillText('Feature ' + feat.toUpperCase(), cw / 2, ch - 4);
}

// ===== Event Handlers =====
// Canvas click
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const { x, y } = canvasToData(cx, cy);

    state.points.push({ x, y, label: state.activeClass });
    updatePointCounts();
    checkTrainButton();
    render();
});

// Canvas hover
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const { x, y } = canvasToData(cx, cy);

    // Tooltip
    tooltip.classList.remove('hidden');
    tooltip.querySelector('.tooltip-content').textContent = `(${x.toFixed(2)}, ${y.toFixed(2)})`;
    tooltip.style.left = (cx + 14) + 'px';
    tooltip.style.top = (cy - 8) + 'px';

    // Hover probabilities
    if (state.model.trained) {
        hoverProbs.classList.remove('hidden');
        const posteriors = state.model.getPosteriors(x, y);
        const predicted = state.model.predict(x, y);

        document.getElementById('prob-bar-a').style.width = (posteriors[0] ? (posteriors[0] * 100) : 0) + '%';
        document.getElementById('prob-bar-b').style.width = (posteriors[1] ? (posteriors[1] * 100) : 0) + '%';
        document.getElementById('prob-bar-c').style.width = (posteriors[2] ? (posteriors[2] * 100) : 0) + '%';

        document.getElementById('prob-val-a').textContent = posteriors[0] ? (posteriors[0] * 100).toFixed(1) + '%' : '—';
        document.getElementById('prob-val-b').textContent = posteriors[1] ? (posteriors[1] * 100).toFixed(1) + '%' : '—';
        document.getElementById('prob-val-c').textContent = posteriors[2] ? (posteriors[2] * 100).toFixed(1) + '%' : '—';

        document.getElementById('hover-prediction').innerHTML = `Prediction: <strong style="color:${CLASS_COLORS[predicted]}">Class ${CLASS_NAMES[predicted]}</strong>`;
    }
});

canvas.addEventListener('mouseleave', () => {
    tooltip.classList.add('hidden');
});

// Class selector
document.querySelectorAll('.class-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeClass = parseInt(btn.dataset.class);
    });
});

// Train button
document.getElementById('btn-train').addEventListener('click', () => {
    if (state.points.length < 2) return;
    state.model = new NaiveBayes();
    state.model.train(state.points);
    render();
    updateStatsPanel();
    drawCurves();
});

// Clear points
document.getElementById('btn-clear-points').addEventListener('click', () => {
    state.points = [];
    state.model = new NaiveBayes();
    updatePointCounts();
    checkTrainButton();
    resetStatsPanel();
    render();
    drawCurves();
    hoverProbs.classList.add('hidden');
});

// Reset
document.getElementById('btn-reset').addEventListener('click', () => {
    state.points = [];
    state.activeClass = 0;
    state.model = new NaiveBayes();
    document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.class-btn[data-class="0"]').classList.add('active');
    document.querySelectorAll('.toggle input').forEach(cb => cb.checked = true);
    state.showBoundary = true;
    state.showHeatmap = true;
    state.showGaussian = true;
    state.resolution = 1;
    document.getElementById('resolution-slider').value = 2;
    document.getElementById('resolution-value').textContent = 'Medium';
    updatePointCounts();
    checkTrainButton();
    resetStatsPanel();
    render();
    drawCurves();
    hoverProbs.classList.add('hidden');
});

// Visualization toggles
document.querySelector('#toggle-boundary input').addEventListener('change', (e) => {
    state.showBoundary = e.target.checked;
    render();
});
document.querySelector('#toggle-heatmap input').addEventListener('change', (e) => {
    state.showHeatmap = e.target.checked;
    render();
});
document.querySelector('#toggle-gaussian input').addEventListener('change', (e) => {
    state.showGaussian = e.target.checked;
    drawCurves();
});

// Resolution slider
document.getElementById('resolution-slider').addEventListener('input', (e) => {
    const labels = ['High', 'Medium', 'Low'];
    state.resolution = 3 - parseInt(e.target.value); // invert: high=0 means smallest step
    document.getElementById('resolution-value').textContent = labels[3 - parseInt(e.target.value)];
    if (state.model.trained) render();
});

// Feature tabs
document.querySelectorAll('.feat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.feat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.featureTab = tab.dataset.feature;
        drawCurves();
    });
});

// ===== Quick Datasets =====
function generateDataset(type) {
    state.points = [];
    const rand = () => Math.random();
    const randn = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

    if (type === 'linear') {
        for (let i = 0; i < 40; i++) {
            const x = rand() * 0.4 + 0.05;
            const y = rand() * 0.8 + 0.1;
            state.points.push({ x, y, label: 0 });
        }
        for (let i = 0; i < 40; i++) {
            const x = rand() * 0.4 + 0.55;
            const y = rand() * 0.8 + 0.1;
            state.points.push({ x, y, label: 1 });
        }
    } else if (type === 'clusters') {
        const centers = [{ x: 0.25, y: 0.75 }, { x: 0.75, y: 0.25 }, { x: 0.7, y: 0.75 }];
        centers.forEach((c, label) => {
            for (let i = 0; i < 30; i++) {
                state.points.push({ x: c.x + randn() * 0.07, y: c.y + randn() * 0.07, label });
            }
        });
    } else if (type === 'overlap') {
        for (let i = 0; i < 40; i++) {
            state.points.push({ x: 0.4 + randn() * 0.12, y: 0.5 + randn() * 0.12, label: 0 });
        }
        for (let i = 0; i < 40; i++) {
            state.points.push({ x: 0.6 + randn() * 0.12, y: 0.5 + randn() * 0.12, label: 1 });
        }
    } else if (type === 'spiral') {
        for (let i = 0; i < 50; i++) {
            const t = (i / 50) * 2 * Math.PI;
            const r = 0.1 + t * 0.04;
            state.points.push({ x: 0.5 + r * Math.cos(t) + randn() * 0.02, y: 0.5 + r * Math.sin(t) + randn() * 0.02, label: 0 });
            state.points.push({ x: 0.5 + r * Math.cos(t + Math.PI) + randn() * 0.02, y: 0.5 + r * Math.sin(t + Math.PI) + randn() * 0.02, label: 1 });
        }
    }

    // Clamp
    state.points = state.points.map(p => ({
        x: Math.max(0.01, Math.min(0.99, p.x)),
        y: Math.max(0.01, Math.min(0.99, p.y)),
        label: p.label
    }));

    state.model = new NaiveBayes();
    updatePointCounts();
    checkTrainButton();
    resetStatsPanel();
    render();
    hoverProbs.classList.add('hidden');
}

document.getElementById('ds-linear').addEventListener('click', () => generateDataset('linear'));
document.getElementById('ds-clusters').addEventListener('click', () => generateDataset('clusters'));
document.getElementById('ds-overlap').addEventListener('click', () => generateDataset('overlap'));
document.getElementById('ds-spiral').addEventListener('click', () => generateDataset('spiral'));

// ===== Tutorial =====
let tutSlide = 0;
const slides = document.querySelectorAll('.tutorial-slide');
const dots = document.querySelectorAll('.dot');

function showSlide(n) {
    tutSlide = n;
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    slides[n].classList.add('active');
    dots[n].classList.add('active');
    document.getElementById('tut-prev').disabled = n === 0;
    document.getElementById('tut-next').textContent = n === slides.length - 1 ? 'Got it!' : 'Next →';
}

document.getElementById('btn-tutorial').addEventListener('click', () => {
    document.getElementById('tutorial-modal').classList.remove('hidden');
    showSlide(0);
});
document.getElementById('close-tutorial').addEventListener('click', () => {
    document.getElementById('tutorial-modal').classList.add('hidden');
});
document.getElementById('tutorial-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('tutorial-modal')) {
        document.getElementById('tutorial-modal').classList.add('hidden');
    }
});
document.getElementById('tut-prev').addEventListener('click', () => { if (tutSlide > 0) showSlide(tutSlide - 1); });
document.getElementById('tut-next').addEventListener('click', () => {
    if (tutSlide < slides.length - 1) showSlide(tutSlide + 1);
    else document.getElementById('tutorial-modal').classList.add('hidden');
});
dots.forEach(d => d.addEventListener('click', () => showSlide(parseInt(d.dataset.dot))));

// ===== UI Updates =====
function updatePointCounts() {
    const counts = [0, 0, 0];
    state.points.forEach(p => counts[p.label]++);
    document.getElementById('count-a').textContent = counts[0];
    document.getElementById('count-b').textContent = counts[1];
    document.getElementById('count-c').textContent = counts[2];
}

function checkTrainButton() {
    const classes = new Set(state.points.map(p => p.label));
    document.getElementById('btn-train').disabled = classes.size < 2 || state.points.length < 4;
}

function updateStatsPanel() {
    const m = state.model;
    if (!m.trained) return;

    // Badge
    document.getElementById('model-status').textContent = 'Trained';
    document.getElementById('model-status').className = 'badge trained';

    // Priors
    const priorsHTML = m.classes.map(c =>
        `<div class="prior-row">
            <div class="prior-dot" style="background:${CLASS_COLORS[c]}"></div>
            <span class="prior-name">Class ${CLASS_NAMES[c]}</span>
            <span class="prior-val">${(m.priors[c] * 100).toFixed(1)}%</span>
        </div>`
    ).join('');
    document.getElementById('priors-container').innerHTML = priorsHTML;

    // Gaussian params
    updateGaussianParams();

    // Accuracy
    const acc = m.getAccuracy(state.points);
    document.getElementById('accuracy-section').style.display = '';
    document.getElementById('accuracy-value').textContent = (acc * 100).toFixed(1) + '%';
    const circumference = 2 * Math.PI * 52;
    document.getElementById('accuracy-ring-fill').style.strokeDashoffset = circumference * (1 - acc);
}

function updateGaussianParams() {
    const m = state.model;
    const feat = state.featureTab;
    if (!m.trained) return;

    const html = m.classes.map(c =>
        `<div class="param-row">
            <div class="param-dot" style="background:${CLASS_COLORS[c]}"></div>
            <span>μ=${m.means[c][feat].toFixed(3)}</span>
            <span>σ²=${m.variances[c][feat].toFixed(4)}</span>
        </div>`
    ).join('');
    document.getElementById('gaussian-params').innerHTML = html;
}

function resetStatsPanel() {
    document.getElementById('model-status').textContent = 'Untrained';
    document.getElementById('model-status').className = 'badge untrained';
    document.getElementById('priors-container').innerHTML = '<div class="empty-state">Train the model to see priors</div>';
    document.getElementById('gaussian-params').innerHTML = '<div class="empty-state">Train the model to see parameters</div>';
    document.getElementById('accuracy-section').style.display = 'none';
}

// ===== Utility =====
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
