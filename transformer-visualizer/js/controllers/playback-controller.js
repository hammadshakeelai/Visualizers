export class PlaybackController {
    constructor({ playBtn, pauseBtn, speedSelect, onTick }) {
        this.playBtn = playBtn;
        this.pauseBtn = pauseBtn;
        this.speedSelect = speedSelect;
        this.onTick = onTick;
        this.timer = null;
    }

    bind() {
        this.playBtn.addEventListener("click", () => this.start());
        this.pauseBtn.addEventListener("click", () => this.stop());
        this.speedSelect.addEventListener("change", () => {
            if (this.isRunning()) this.start();
        });
        this.syncButtons();
    }

    isRunning() {
        return this.timer !== null;
    }

    start() {
        this.stop();
        const intervalMs = Number(this.speedSelect.value) || 850;
        this.timer = window.setInterval(() => {
            this.onTick();
        }, intervalMs);
        this.syncButtons();
    }

    stop() {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.syncButtons();
    }

    syncButtons() {
        this.playBtn.disabled = this.isRunning();
        this.pauseBtn.disabled = !this.isRunning();
    }
}
