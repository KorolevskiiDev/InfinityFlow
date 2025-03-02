export class State<T> {
    private static globalStateCounter = 0;
    private name: string;
    private logEnabled = false;

    private value: T;
    private listeners: Set<(value: T, oldValue: T) => void> = new Set();

    constructor(initialValue: T, name?: string, logEnabled = false) {
        this.value = initialValue;
        this.logEnabled = logEnabled;
        State.globalStateCounter++;
        this.name = name || 'State_' + State.globalStateCounter;
    }

    private log(...optionalParams: any[]) {
        if (!this.logEnabled) return;
        console.log(`[${this.name}] `, ...optionalParams);
    }

    get(): T {
        return this.value;
    }

    set(value: T) {
        if (this.value !== value) {
            this.log("Value changed:", value);
            const oldVal = this.value;
            this.value = value;
            this.notify(this.value, oldVal);
        }
    }

    subscribe(listener: (value: T, oldValue: T) => void): () => void {
        this.listeners.add(listener);
        this.log("Listener added. Total:", this.listeners.size);
        return () => {
            this.log("Listener removed. Total:", this.listeners.size);
            this.listeners.delete(listener)
        };
    }

    private notify(newVal: T,oldVal: T) {
        for (const listener of this.listeners) {
            listener(newVal, oldVal);
        }
    }
}
