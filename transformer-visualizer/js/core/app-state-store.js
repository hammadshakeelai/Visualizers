export class AppStateStore {
    constructor(initialState) {
        this.state = initialState;
        this.listeners = new Set();
    }

    getState() {
        return this.state;
    }

    setState(nextState) {
        this.state = nextState;
        this.emit();
    }

    update(updater) {
        this.state = updater(this.state);
        this.emit();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    emit() {
        this.listeners.forEach((listener) => listener(this.state));
    }
}
