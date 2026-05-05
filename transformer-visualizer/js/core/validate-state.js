export function validateLayer(layer) {
    const problems = [];
    if (!layer) return ["Layer not available for selected controls."];
    (layer?.heads || []).forEach((head, hIdx) => {
        (head.attention || []).forEach((row, rIdx) => {
            const sum = row.reduce((a, b) => a + b, 0);
            if (Math.abs(sum - 1) > 0.02) {
                problems.push(`Head ${hIdx}, row ${rIdx} softmax sum drift: ${sum.toFixed(3)}`);
            }
            row.forEach((value, cIdx) => {
                if (value < -1e-8 || value > 1 + 1e-8) {
                    problems.push(`Head ${hIdx}, row ${rIdx}, col ${cIdx} out of range: ${value.toFixed(3)}`);
                }
            });
        });
    });
    return problems;
}
