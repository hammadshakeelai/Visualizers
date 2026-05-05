import { TransformerSimulator } from "../js/core/transformer-simulator.js";
import { DEFAULT_SIM_CONFIG, normalizeConfig } from "../js/core/config.js";
import { validateLayer } from "../js/core/validate-state.js";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function almostEqual(a, b, eps = 1e-6) {
    return Math.abs(a - b) < eps;
}

function run() {
    const lines = [];
    const sim = new TransformerSimulator(DEFAULT_SIM_CONFIG);
    const tokens = ["A", "simple", "test", "sequence"];
    sim.initialize(tokens);
    sim.updateRuntime({ maskType: "none", temperature: 1 });
    sim.runAll();

    assert(sim.state.layers.length === sim.config.nLayers, "runAll should build all layers");
    lines.push("PASS runAll builds expected number of layers");

    const layer0 = sim.state.layers[0];
    const issues = validateLayer(layer0);
    assert(issues.length === 0, `validateLayer should pass. Found: ${issues.join("; ")}`);
    lines.push("PASS attention rows are normalized");

    layer0.heads.forEach((head, headIdx) => {
        head.attention.forEach((row, rowIdx) => {
            const sum = row.reduce((a, b) => a + b, 0);
            assert(almostEqual(sum, 1, 0.02), `head=${headIdx}, row=${rowIdx} sum=${sum}`);
        });
    });
    lines.push("PASS explicit row-sum check");

    const simCausal = new TransformerSimulator(DEFAULT_SIM_CONFIG);
    simCausal.initialize(tokens);
    simCausal.updateRuntime({ maskType: "causal", temperature: 1 });
    simCausal.runStep();
    const causalAttn = simCausal.state.layers[0].heads[0].attention;
    causalAttn.forEach((row, i) => {
        row.forEach((value, j) => {
            if (j > i) {
                assert(value < 1e-5, `causal mask failed at row=${i}, col=${j}, value=${value}`);
            }
        });
    });
    lines.push("PASS causal mask blocks future positions");

    const simSharp = new TransformerSimulator(DEFAULT_SIM_CONFIG);
    simSharp.initialize(tokens);
    simSharp.updateRuntime({ maskType: "none", temperature: 0.5 });
    simSharp.runStep();
    const entropySharp = entropy(simSharp.state.layers[0].heads[0].attention[0]);

    const simSoft = new TransformerSimulator(DEFAULT_SIM_CONFIG);
    simSoft.initialize(tokens);
    simSoft.updateRuntime({ maskType: "none", temperature: 2.0 });
    simSoft.runStep();
    const entropySoft = entropy(simSoft.state.layers[0].heads[0].attention[0]);
    assert(entropySoft > entropySharp, "higher temperature should produce higher entropy");
    lines.push("PASS temperature affects attention entropy as expected");

    const normalized = normalizeConfig({ dModel: 32, nHeads: 4, maskType: "causal", temperature: 1.2 });
    assert(normalized.dModel === 32 && normalized.maskType === "causal", "normalizeConfig should keep valid values");
    lines.push("PASS normalizeConfig accepts valid config");

    let threw = false;
    try {
        normalizeConfig({ dModel: 30, nHeads: 4 });
    } catch (_err) {
        threw = true;
    }
    assert(threw, "normalizeConfig should reject invalid dModel/nHeads");
    lines.push("PASS normalizeConfig rejects invalid shape");

    return lines;
}

function entropy(row) {
    return -row.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);
}

const resultsEl = document.getElementById("results");
try {
    const lines = run();
    resultsEl.innerHTML = `<span class="ok">${lines.join("\n")}\n\nALL TESTS PASSED</span>`;
} catch (err) {
    resultsEl.innerHTML = `<span class="fail">TEST FAILED\n${err.message}</span>`;
    throw err;
}
