import { FlowCallbacks } from "@/flow/callback";
import { Timer } from "@/utils/timer";
import {State} from "@/state/state";

type Dependency<T> = { state: State<T>; predicate: (state: T) => boolean };

export class Flow {
    private static globalFlowCounter = 0;
    private name = "";
    private logEnabled = false;


    private dependencies: Dependency<any>[] = [];
    private flowDependencies: Flow[] = [];
    private parallelFlows: Flow[] = [];
    private action: () => void = () => {};
    private callbacks: FlowCallbacks = {};
    private completed = 0;
    private started = false;
    private cancelled = false;
    private autoReset: boolean = false;
    private waitingForReset = false;
    private debounceTime: number = 0;
    private debounceTimeout: number | null = null;

    constructor(options: { autoReset?: boolean; debounceTime?: number, name?: string, logEnabled?: boolean } = {}) {
        this.autoReset = options.autoReset ?? false;
        this.debounceTime = options.debounceTime ?? 0;
        this.logEnabled = options.logEnabled ?? false;

        Flow.globalFlowCounter++;
        this.name = options.name ?? "Flow_" + Flow.globalFlowCounter;
    }

    log(...optionalParams: any[]) {
        if (!this.logEnabled) return;
        console.log(`[${this.name}] `, ...optionalParams);
    }

    dependsOn<T>(state: State<T>, predicate: (value: T) => boolean): this {
        this.dependencies.push({state, predicate});
        this.log("Dependency added. Total:", this.dependencies.length);
        state.subscribe((value: T) => {
            if (this.cancelled || this.waitingForReset) return;
            switch (predicate(value)) {
                case true:
                    this.completed++;
                    this.log("Dependency resolved. Completed:", this.completed);
                    this.callProgress(state);
                    this.checkDependencies();
                    break;
                case false:
                    this.completed--;
                    this.log("Dependency unresolved. Completed:", this.completed);
                    this.callProgress(state);
            }
        });
        return this;
    }

    private callProgress(dependantState: State<any> | Flow) {
        this.callbacks.onProgress?.(this.completed, this.dependencies.length + this.flowDependencies.length, dependantState);
    }

    dependsOnFlow(flow: Flow): this {
        this.flowDependencies.push(flow);
        this.log("Flow dependency added. Total:", this.flowDependencies.length);
        flow.withCallbacks({
            onComplete: () => {
                if (this.cancelled) return;
                this.completed++;
                this.log("Flow dependency completed. Completed:", this.completed);
                this.callProgress(flow);
                this.checkDependencies();
            },
        });
        return this;
    }

    runsParallel(flow: Flow): this {
        this.parallelFlows.push(flow);
        this.log("Parallel flow added. Total:", this.parallelFlows.length);
        return this;
    }

    do(action: () => void): this {
        this.action = action;
        return this;
    }

    withCallbacks(callbacks: FlowCallbacks): this {
        this.callbacks = callbacks;
        return this;
    }

    start() {
        this.started = true;
        this.cancelled = false;
        this.completed = 0;
        this.log("Flow started.");
        this.callbacks.onStart?.();
        this.parallelFlows.forEach((flow) => flow.start());
        this.flowDependencies.forEach((flow) => flow.start());
        if (!this.waitingForReset) {
            this.fullFillDependencyCount();
            this.checkDependencies();
        }
    }

    cancel() {
        if (this.cancelled) return;
        this.cancelled = true;
        if (this.debounceTimeout !== null) Timer.clear(this.debounceTimeout);
        this.parallelFlows.forEach((flow) => flow.cancel());
        this.flowDependencies.forEach((flow) => flow.cancel());
        this.callbacks.onError?.(new Error("Flow cancelled"));
    }

    reset() {
        this.cancel();
        this.start();
    }

    private fullFillDependencyCount() {
        this.dependencies.forEach(({ state, predicate }) => {
            if (predicate(state.get())) {
                this.completed++;
            }
        });
        this.log("Checking dependencies on start. Completed:", this.completed);
    }

    private checkDependencies() {
        if (!this.started || this.cancelled) return;
        this.log("Checking dependencies. Completed:", this.completed, "Total:", this.dependencies.length + this.flowDependencies.length);
        if (this.completed === this.dependencies.length + this.flowDependencies.length) {
            if (this.debounceTimeout !== null) Timer.clear(this.debounceTimeout);
            this.debounceTimeout = Timer.set(() => {
                this.executeFlow();
            }, this.debounceTime);
        }
    }

    private executeFlow() {
        this.log("Executing flow.");
        this.callbacks.onComplete?.();
        this.action();
        this.log("Flow completed.");
        if (this.autoReset) {
            this.observeDependenciesForReset();
        }
    }

    private observeDependenciesForReset() {
        if (!this.autoReset) return;

        this.log("Observing dependencies for reset.");
        this.waitingForReset = true;

        let dependenciesResets: (() => void)[] = [];
        const resetDependencyObserver = () => {
            this.log("Resetting dependency observer for resetting.");
            dependenciesResets.forEach((reset) => reset());
            dependenciesResets = [];
        }

        this.dependencies.forEach(({ state }) => {
            const unsubscribe = state.subscribe((value: any, oldValue: any) => {
                this.log(`Dependency changed - resetting flow. (from: ${oldValue}, to: ${value})`);
                resetDependencyObserver();
                this.waitingForReset = false;
                this.callbacks.onReset?.();
                this.reset();
            });
            dependenciesResets.push(unsubscribe);
        });
    }
}
