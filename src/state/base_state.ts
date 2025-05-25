export const enum BaseStateEvent {
    Update = 'update',
    StateChange = 'stateChange'
}

function deepReactive<T extends object>(
    target: T,
    emit: (event: string, data: any) => void
): T {
    const handler: ProxyHandler<any> = {
        get(obj, prop, receiver) {
            const val = Reflect.get(obj, prop, receiver);
            // Wrap nested objects lazily
            if (typeof val === 'object' && val !== null) {
                return new Proxy(val, handler);
            }
            return val;
        },
        set(obj, prop, value, receiver) {
            const oldValue = obj[prop];
            const result = Reflect.set(obj, prop, value, receiver);
            if (oldValue !== value) {
                emit(BaseStateEvent.Update, { property: prop, oldValue, newValue: value });
            }
            return result;
        }
    };
    return new Proxy(target, handler);
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

function deepMerge<T>(target: T, patch: DeepPartial<T>): void {
    for (const key in patch) {
        const patchVal = patch[key];
        if (patchVal && typeof patchVal === 'object' && !Array.isArray(patchVal)) {
            // @ts-ignore
            deepMerge(target[key], patchVal);
        } else {
            // @ts-ignore
            target[key] = patchVal;
        }
    }
}

// Generic listener type
type Listener<Payload> = (data: Payload) => void;

/**
 * BaseState provides:
 *  - Deep reactivity via Proxy
 *  - Strongly-typed events using an EventMap
 *  - Subscription API: on/off
 *  - Bulk state updates via setState
 */
export abstract class BaseState<
    S extends object,
    EM extends Record<string, any>
> {
    // Make state private
    #state: S;
    private listeners: Partial<{ [K in keyof EM]: Listener<EM[K]>[] }> = {};

    constructor(initialState: S) {
        // Only flows can mutate state
        this.#state = deepReactive(initialState, this.emit.bind(this));
    }

    /** Emit an event with typed payload */
    protected emit<K extends keyof EM>(event: K, data: EM[K]): void {
        const handlers = this.listeners[event];
        if (handlers) {
            handlers.slice().forEach(fn => fn(data));
        }
    }

    /** Subscribe to a typed event */
    public on<K extends keyof EM>(event: K, fn: Listener<EM[K]>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        (this.listeners[event] as Listener<EM[K]>[]).push(fn);
    }

    /** Unsubscribe from a typed event */
    public off<K extends keyof EM>(event: K, fn?: Listener<EM[K]>): void {
        const handlers = this.listeners[event];
        if (!handlers) return;
        if (!fn) {
            delete this.listeners[event];
        } else {
            this.listeners[event] = handlers.filter(h => h !== fn) as any;
        }
    }

    /** Bulk update state and emit a stateChange event (protected, only for flows) */
    protected setState(patch: DeepPartial<S>): void {
        deepMerge(this.#state, patch);
        // @ts-ignore assume 'stateChange' key is in EM
        this.emit(BaseStateEvent.StateChange as keyof EM, this.#state);
    }

    /** Access the reactive state as readonly */
    public getState(): Readonly<S> {
        return this.#state as Readonly<S>;
    }
}
