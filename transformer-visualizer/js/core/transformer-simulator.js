import { normalizeConfig } from "./config.js";
import { softmax, dot, addVec, layerNorm, vectorL2 } from "./math-utils.js";

function makeVector(dim, seed) {
    const out = [];
    let x = seed * 9301 + 49297;
    for (let i = 0; i < dim; i += 1) {
        x = (x * 233280 + 17) % 2147483647;
        out.push(((x % 1000) / 500) - 1);
    }
    return out;
}

export class TransformerSimulator {
    constructor(config = {}) {
        this.config = normalizeConfig(config);
        this.headDim = this.config.dModel / this.config.nHeads;
        this.state = null;
    }

    updateRuntime(params = {}) {
        this.config.temperature = params.temperature ?? this.config.temperature;
        this.config.maskType = params.maskType ?? this.config.maskType;
    }

    initialize(tokens) {
        const embeddings = tokens.map((_, idx) => makeVector(this.config.dModel, idx + 1));
        const positional = tokens.map((_, pos) => (
            Array.from({ length: this.config.dModel }, (_, i) => (
                (i % 2 === 0)
                    ? Math.sin(pos / Math.pow(10000, i / this.config.dModel))
                    : Math.cos(pos / Math.pow(10000, (i - 1) / this.config.dModel))
            ))
        ));

        const x0 = embeddings.map((vec, i) => addVec(vec, positional[i]));
        this.state = {
            tokens,
            embeddings,
            positional,
            layers: [],
            currentLayer: 0,
            currentModule: "input",
            x: x0
        };
        return this.state;
    }

    runStep() {
        if (!this.state || this.state.currentLayer >= this.config.nLayers) return this.state;
        const layerIdx = this.state.currentLayer;
        const xIn = this.state.x;

        const heads = [];
        const combined = xIn.map(() => Array(this.config.dModel).fill(0));
        const scale = Math.sqrt(this.headDim);

        for (let h = 0; h < this.config.nHeads; h += 1) {
            const q = xIn.map((row, ri) => row.slice(h * this.headDim, (h + 1) * this.headDim).map((v) => v * (0.7 + 0.1 * (ri + 1))));
            const k = xIn.map((row, ri) => row.slice(h * this.headDim, (h + 1) * this.headDim).map((v) => v * (0.65 + 0.07 * (ri + 1))));
            const v = xIn.map((row, ri) => row.slice(h * this.headDim, (h + 1) * this.headDim).map((xv) => xv * (0.75 + 0.05 * (ri + 1))));

            const logits = q.map((qi, rowIdx) => k.map((kj, colIdx) => {
                if (this.config.maskType === "causal" && colIdx > rowIdx) return -1e9;
                return dot(qi, kj) / scale;
            }));
            const attention = logits.map((row) => softmax(row, this.config.temperature));
            const headOut = attention.map((weights) => (
                v.reduce((acc, vj, idx) => {
                    const w = weights[idx];
                    for (let d = 0; d < this.headDim; d += 1) acc[d] += vj[d] * w;
                    return acc;
                }, Array(this.headDim).fill(0))
            ));

            for (let t = 0; t < headOut.length; t += 1) {
                for (let d = 0; d < this.headDim; d += 1) {
                    combined[t][h * this.headDim + d] = headOut[t][d];
                }
            }

            heads.push({ q, k, v, logits, attention, output: headOut });
        }

        const residual1 = xIn.map((row, i) => layerNorm(addVec(row, combined[i])));
        const ffnHidden = residual1.map((row) => row.map((v, i) => Math.max(0, v * (i % 3 === 0 ? 1.35 : 0.85))));
        const ffnOut = ffnHidden.map((row) => row.map((v, i) => v * (i % 4 === 0 ? 0.9 : 1.05)));
        const xOut = residual1.map((row, i) => layerNorm(addVec(row, ffnOut[i])));

        const diagnostics = {
            meanTokenNorm: xOut.reduce((acc, row) => acc + vectorL2(row), 0) / xOut.length,
            maskType: this.config.maskType,
            temperature: this.config.temperature
        };

        this.state.layers.push({
            layerIdx,
            xIn,
            heads,
            combined,
            residual1,
            ffnHidden,
            ffnOut,
            xOut,
            diagnostics
        });
        this.state.x = xOut;
        this.state.currentLayer += 1;
        this.state.currentModule = this.state.currentLayer >= this.config.nLayers ? "output" : "layer";
        return this.state;
    }

    runAll() {
        while (this.state && this.state.currentLayer < this.config.nLayers) this.runStep();
        return this.state;
    }
}
