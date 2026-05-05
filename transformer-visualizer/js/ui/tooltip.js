export class TooltipController {
    constructor(element) {
        this.element = element;
    }

    show(x, y, html) {
        this.element.innerHTML = html;
        this.element.classList.remove("hidden");
        const offset = 14;
        const maxX = window.innerWidth - this.element.offsetWidth - 10;
        const maxY = window.innerHeight - this.element.offsetHeight - 10;
        const left = Math.min(x + offset, Math.max(10, maxX));
        const top = Math.min(y + offset, Math.max(10, maxY));
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }

    hide() {
        this.element.classList.add("hidden");
    }
}
