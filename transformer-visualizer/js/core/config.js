export const DEFAULT_SIM_CONFIG = {
    dModel: 24,
    nHeads: 4,
    nLayers: 6,
    temperature: 1,
    maskType: "none"
};

export function normalizeConfig(partial = {}) {
    const cfg = { ...DEFAULT_SIM_CONFIG, ...partial };
    if (cfg.dModel % cfg.nHeads !== 0) {
        throw new Error("dModel must be divisible by nHeads.");
    }
    if (!["none", "causal"].includes(cfg.maskType)) {
        throw new Error("maskType must be 'none' or 'causal'.");
    }
    if (cfg.temperature <= 0) {
        throw new Error("temperature must be > 0.");
    }
    return cfg;
}
