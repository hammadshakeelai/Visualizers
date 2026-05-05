import { APP_SCHEMA_VERSION } from "./constants.js";

function parseJson(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (_err) {
        return null;
    }
}

export function loadVersionedState(key) {
    const payload = parseJson(localStorage.getItem(key));
    if (!payload || typeof payload !== "object") return null;
    if (!("data" in payload)) return null;
    return payload.data;
}

export function saveVersionedState(key, data) {
    localStorage.setItem(
        key,
        JSON.stringify({
            version: APP_SCHEMA_VERSION,
            savedAt: new Date().toISOString(),
            data
        })
    );
}

export function loadRawState(key) {
    return parseJson(localStorage.getItem(key));
}
