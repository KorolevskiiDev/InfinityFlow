import { Flow } from "@/flow/flow";
import { FlowCallbacks } from "@/flow/callback";

export class FlowGroup {
    private flows: { flow: Flow; priority: number }[] = [];
    private condition?: () => boolean;
    private callbacks: FlowCallbacks = {};

    constructor(flows: { flow: Flow; priority?: number }[] = [], condition?: () => boolean) {
        flows.forEach(({ flow, priority }) => this.add(flow, priority));
        this.condition = condition;
    }

    add(flow: Flow, priority: number = 0): this {
        this.flows.push({ flow, priority });
        return this;
    }

    withCondition(condition: () => boolean): this {
        this.condition = condition;
        return this;
    }

    withCallbacks(callbacks: FlowCallbacks): this {
        this.callbacks = callbacks;
        return this;
    }

    start() {
        if (this.condition && !this.condition()) {
            console.log("Flow Group skipped due to condition");
            this.callbacks.onComplete?.();
            return;
        }

        this.callbacks.onStart?.();

        this.flows.sort((a, b) => a.priority - b.priority);

        Promise.all(this.flows.map(({ flow }) => this.waitForCompletion(flow)))
            .then(() => {
                this.callbacks.onComplete?.();
            })
            .catch((error) => {
                this.callbacks.onError?.(error);
            });

        this.flows.forEach(({ flow }) => flow.start());
    }

    cancel() {
        this.flows.forEach(({ flow }) => flow.cancel());
        this.callbacks.onError?.(new Error("Flow Group cancelled"));
    }

    reset() {
        this.cancel();
        this.start();
    }

    private waitForCompletion(flow: Flow): Promise<void> {
        return new Promise((resolve, reject) => {
            flow.withCallbacks({
                onComplete: () => resolve(),
                onError: (error) => reject(error),
            });
        });
    }
}
