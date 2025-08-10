import { FlowCallbacks } from "@/flow/callback";
import { BaseState, BaseStateEvent } from "@/state/base_state";

// Context passed to each action, now with direct state access (no magic strings)
type StateContext<S extends BaseState<any, any>, EM extends Record<string, any>> = {
    getState: () => S extends BaseState<infer SS, any> ? Readonly<SS> : any;
    setState: (patch: any) => void;
    emit: <K extends keyof EM>(event: K, data: EM[K]) => void;
};

export type FlowContext<StateMap extends Record<string, BaseState<any, any>>> = {
    [K in keyof StateMap]: StateContext<
        StateMap[K],
        StateMap[K] extends BaseState<any, infer EM> ? EM : any
    >;
};

export interface StepFn<StateMap extends Record<string, BaseState<any, any>>, Input, Output> {
    (ctx: FlowContext<StateMap>, input: Input): Promise<Output> | Output;
}

export class Flow<StateMap extends Record<string, BaseState<any, any>>> {
    private stateMap: StateMap;
    private steps: ((ctx: FlowContext<StateMap>, input: any) => Promise<any> | any)[] = [];
    private callbacks: FlowCallbacks = {};

    constructor(stateMap: StateMap) {
        this.stateMap = stateMap;
    }

    step<Input, Output>(fn: StepFn<StateMap, Input, Output>): FlowStep<StateMap, Input, Output> {
        this.steps.push(fn);
        return new FlowStep(this.stateMap, this.steps, this.callbacks);
    }

    withCallbacks(callbacks: FlowCallbacks): this {
        this.callbacks = callbacks;
        return this;
    }
}

export class FlowStep<StateMap extends Record<string, BaseState<any, any>>, Input, Output> {
    private stateMap: StateMap;
    private steps: ((ctx: FlowContext<StateMap>, input: any) => Promise<any> | any)[];
    private callbacks: FlowCallbacks;

    constructor(stateMap: StateMap, steps: ((ctx: FlowContext<StateMap>, input: any) => Promise<any> | any)[], callbacks: FlowCallbacks) {
        this.stateMap = stateMap;
        this.steps = steps;
        this.callbacks = callbacks;
    }

    step<NextOutput>(fn: StepFn<StateMap, Output, NextOutput>): FlowStep<StateMap, Input, NextOutput> {
        this.steps.push(fn);
        return new FlowStep(this.stateMap, this.steps, this.callbacks);
    }

    withCallbacks(callbacks: FlowCallbacks): this {
        this.callbacks = callbacks;
        return this;
    }

    async start(input: Input): Promise<Output> {
        this.callbacks.onStart?.();
        let value: any = input;
        for (let i = 0; i < this.steps.length; i++) {
            this.callbacks.onProgress?.(i, this.steps.length);
            try {
                value = await this.steps[i](this.createContext(), value);
            } catch (error) {
                this.callbacks.onError?.(error as Error);
                return value;
            }
        }
        this.callbacks.onComplete?.();
        return value;
    }

    private createContext(): FlowContext<StateMap> {
        const ctx = {} as FlowContext<StateMap>;
        for (const key in this.stateMap) {
            ctx[key] = {
                getState: () => (this.stateMap[key] as any).getState(),
                setState: (patch: any) => (this.stateMap[key] as any).setState(patch),
                emit: (event, data) => (this.stateMap[key] as any).emit(event, data)
            };
        }
        return ctx;
    }
}
