const MODULES = [
    { id: "embedding", label: "Token + Positional" },
    { id: "attention", label: "Multi-Head Attention" },
    { id: "concat", label: "Concat + Projection" },
    { id: "residual1", label: "Residual + Norm" },
    { id: "ffn", label: "Feed Forward" },
    { id: "residual2", label: "Residual + Norm" }
];

function setupHiDPICanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const desiredWidth = Math.max(1, Math.floor(rect.width * dpr));
    const desiredHeight = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== desiredWidth || canvas.height !== desiredHeight) {
        canvas.width = desiredWidth;
        canvas.height = desiredHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
}

export function renderModuleGrid(host, activeLayer) {
    host.innerHTML = MODULES.map((mod, idx) => (
        `<div class="module ${activeLayer >= 0 ? "active" : ""}" data-module="${mod.id}">
            <strong>${mod.label}</strong>
        </div>`
    )).join("");
}

export function renderTokens(host, tokens, focusToken) {
    host.innerHTML = tokens.map((tok, idx) => (
        `<span class="token-chip ${idx === focusToken ? "focus" : ""}" data-token="${idx}">${tok}</span>`
    )).join("");
}

export function drawAttentionMatrix(canvas, matrix, tokens, focusToken) {
    const metrics = setupHiDPICanvas(canvas);
    if (!metrics) return [];
    const { ctx, width, height } = metrics;
    ctx.clearRect(0, 0, width, height);

    const n = tokens.length;
    const size = Math.max(14, Math.floor(Math.min((width - 90) / n, (height - 70) / n)));
    const x0 = 70;
    const y0 = 40;
    const cells = [];

    for (let i = 0; i < n; i += 1) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "12px Inter";
        ctx.fillText(tokens[i], x0 + i * size + 6, 24);
        ctx.fillText(tokens[i], 6, y0 + i * size + 16);
        for (let j = 0; j < n; j += 1) {
            const w = matrix?.[i]?.[j] ?? 0;
            const c = Math.floor(255 - w * 220);
            ctx.fillStyle = `rgb(35, ${c}, ${Math.max(40, c - 20)})`;
            ctx.fillRect(x0 + j * size, y0 + i * size, size - 1, size - 1);
            if (i === focusToken) {
                ctx.strokeStyle = "rgba(103, 232, 249, 0.9)";
                ctx.lineWidth = 1.4;
                ctx.strokeRect(x0 + j * size + 1, y0 + i * size + 1, size - 3, size - 3);
            }
            cells.push({
                row: i,
                col: j,
                x: x0 + j * size,
                y: y0 + i * size,
                w: size,
                h: size,
                value: w
            });
        }
    }
    return cells;
}

export function drawFocusDistribution(canvas, row, tokens, focusToken) {
    const metrics = setupHiDPICanvas(canvas);
    if (!metrics) return [];
    const { ctx, width, height } = metrics;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px Inter";
    ctx.fillText(`Focus distribution for token: ${tokens[focusToken] || "?"}`, 20, 28);

    const chartX = 40;
    const chartY = 60;
    const chartW = width - 80;
    const chartH = height - 90;
    const n = tokens.length || 1;
    const barW = Math.max(16, Math.floor((chartW - (n - 1) * 8) / n));
    const cells = [];

    for (let i = 0; i < n; i += 1) {
        const value = row?.[i] ?? 0;
        const h = Math.floor(value * chartH);
        const hitH = Math.max(h, 8);
        const x = chartX + i * (barW + 8);
        const y = chartY + (chartH - hitH);
        ctx.fillStyle = i === focusToken ? "#34d399" : "#60a5fa";
        ctx.fillRect(x, y, barW, hitH);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px Inter";
        ctx.fillText(tokens[i], x, chartY + chartH + 14);
        ctx.fillText(value.toFixed(2), x, Math.max(46, y - 6));

        cells.push({
            row: focusToken,
            col: i,
            x,
            y,
            w: barW,
            h: hitH,
            value
        });
    }
    return cells;
}
