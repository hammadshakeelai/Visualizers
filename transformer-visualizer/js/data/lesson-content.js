export const LESSONS = [
    {
        id: "beginner",
        title: "Beginner - Basic sentence flow",
        tokens: ["The", "cat", "sat", "on", "the", "mat"],
        notes: [
            "Watch how each token attends to itself and nearby words.",
            "Observe that attention rows sum to 1 after softmax.",
            "Hover modules and cells to connect equations with visuals."
        ]
    },
    {
        id: "advanced",
        title: "Advanced - Long context dependency",
        tokens: ["Transformer", "models", "scale", "with", "data", "and", "compute", "efficiently"],
        notes: [
            "Track how distant tokens gain weight in deeper layers.",
            "Compare heads: some focus local syntax, others global semantics.",
            "Inspect trace values for QK^T normalization and FFN activation."
        ]
    },
    {
        id: "analysis",
        title: "Advanced - Question answering pattern",
        tokens: ["What", "causes", "attention", "to", "shift", "across", "layers", "?"],
        notes: [
            "Start from layer 0 and move upward to inspect representation drift.",
            "Use focus token slider to see role-specific heads.",
            "Use hover to inspect logits, softmax probabilities, and output vectors."
        ]
    }
];
