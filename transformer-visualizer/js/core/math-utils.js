export function softmax(arr, temperature = 1) {
    const safeTemp = Math.max(temperature, 0.05);
    const max = Math.max(...arr);
    const exps = arr.map((v) => Math.exp((v - max) / safeTemp));
    const total = exps.reduce((acc, v) => acc + v, 0) || 1;
    return exps.map((v) => v / total);
}

export function dot(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
    return sum;
}

export function addVec(a, b) {
    return a.map((v, i) => v + b[i]);
}

export function layerNorm(vec) {
    const mean = vec.reduce((acc, v) => acc + v, 0) / vec.length;
    const variance = vec.reduce((acc, v) => acc + ((v - mean) ** 2), 0) / vec.length;
    const denom = Math.sqrt(variance + 1e-5);
    return vec.map((v) => (v - mean) / denom);
}

export function vectorL2(vec) {
    return Math.sqrt(vec.reduce((acc, v) => acc + (v * v), 0));
}
