export const QUIZ_QUESTIONS = [
    {
        id: "q1",
        prompt: "What does a higher softmax temperature usually do to attention?",
        options: [
            "Makes attention more uniform",
            "Makes attention more peaked",
            "Removes positional encoding"
        ],
        answer: 0,
        explanation: "Higher temperature smooths logits before softmax, increasing entropy."
    },
    {
        id: "q2",
        prompt: "In causal masking, token i can attend to:",
        options: [
            "Only tokens j > i",
            "Only tokens j <= i",
            "All tokens equally"
        ],
        answer: 1,
        explanation: "Causal masking blocks future positions and preserves autoregressive flow."
    },
    {
        id: "q3",
        prompt: "Why use multiple heads in attention?",
        options: [
            "To reduce sequence length",
            "To learn diverse relation patterns in parallel",
            "To remove residual connections"
        ],
        answer: 1,
        explanation: "Different heads can capture syntax, locality, and semantic structure simultaneously."
    }
];
