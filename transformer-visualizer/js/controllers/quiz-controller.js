import { sanitizeQuizState } from "../core/state-sanitizers.js";

export class QuizController {
    constructor({ questions, elements, initialState, onStateChange }) {
        this.questions = questions;
        this.elements = elements;
        this.state = sanitizeQuizState(initialState, questions);
        this.onStateChange = onStateChange;
    }

    setState(nextState) {
        this.state = sanitizeQuizState(nextState, this.questions);
    }

    getState() {
        return this.state;
    }

    bind() {
        this.elements.quizBox.addEventListener("change", (ev) => {
            const target = ev.target;
            if (!(target instanceof HTMLInputElement) || target.name !== "quiz-option") return;
            this.state.selected = Number(target.value);
            const q = this.questions[this.state.index];
            if (q) this.state.answers[q.id] = this.state.selected;
            this.onStateChange(this.state);
        });

        this.elements.quizSubmitBtn.addEventListener("click", () => {
            const q = this.questions[this.state.index];
            if (!q) {
                this.elements.quizFeedback.innerHTML = `<span class="warning">Quiz state is invalid. Move to next question.</span>`;
                return;
            }
            if (this.state.graded[q.id]) {
                this.elements.quizFeedback.innerHTML = `<span class="warning">This question is already graded.</span>`;
                return;
            }
            if (this.state.selected < 0) {
                this.elements.quizFeedback.innerHTML = `<span class="warning">Select an option first.</span>`;
                return;
            }
            const correct = this.state.selected === q.answer;
            this.state.answered = Math.max(this.state.answered, Object.keys(this.state.graded).length + 1);
            if (correct) this.state.score += 1;
            this.state.graded[q.id] = true;
            this.elements.quizFeedback.innerHTML = correct
                ? `<span class="ok">Correct. ${q.explanation}</span>`
                : `<span class="warning">Not quite. ${q.explanation}</span>`;
            this.onStateChange(this.state);
            this.render();
        });

        this.elements.quizNextBtn.addEventListener("click", () => {
            this.state.index = (this.state.index + 1) % this.questions.length;
            const q = this.questions[this.state.index];
            this.state.selected = q && Number.isFinite(this.state.answers[q.id]) ? this.state.answers[q.id] : -1;
            this.elements.quizFeedback.textContent = "";
            this.onStateChange(this.state);
            this.render();
        });
    }

    render() {
        const q = this.questions[this.state.index];
        if (!q) return;
        const alreadyGraded = Boolean(this.state.graded[q.id]);
        const selectedForQuestion = Number.isFinite(this.state.answers[q.id]) ? this.state.answers[q.id] : this.state.selected;
        this.elements.quizBox.innerHTML = `
            <div><strong>Q${this.state.index + 1}.</strong> ${q.prompt}</div>
            ${q.options.map((opt, idx) => `
                <label>
                    <input type="radio" name="quiz-option" value="${idx}" ${selectedForQuestion === idx ? "checked" : ""} ${alreadyGraded ? "disabled" : ""}>
                    ${opt}
                </label>
            `).join("")}
        `;
        this.elements.quizSubmitBtn.disabled = alreadyGraded;
        this.elements.progressBox.innerHTML = `
            answered ${this.state.answered}/${this.questions.length} |
            score ${this.state.score}
            ${this.state.score >= 2 ? "| badge: Attention Scholar" : ""}
        `;
    }
}
