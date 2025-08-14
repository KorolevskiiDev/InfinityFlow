import { FlowCallbacks } from "@/flow/callback";
import {BaseState, BaseStateEventMap, DeepPartial} from "@/state/base_state";

// Helper type extractors to keep inference stable across bundled .d.ts
export type ExtractStateShape<S> = S extends BaseState<infer SS, any> ? SS : never;
export type ExtractEventMap<S> = S extends BaseState<any, infer E> ? E : BaseStateEventMap<any>;

export type FlowContext<StateMap extends Record<string, BaseState<any, any>>> = {
    [K in keyof StateMap]: {
        getState: () => Readonly<ExtractStateShape<StateMap[K]>>;
        setState: (patch: DeepPartial<ExtractStateShape<StateMap[K]>>) => void;
        emit: <EM extends ExtractEventMap<StateMap[K]>, EK extends keyof EM>(event: EK, data: EM[EK]) => void;
    }
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
    private context: FlowContext<StateMap>;

    constructor(stateMap: StateMap, steps: ((ctx: FlowContext<StateMap>, input: any) => Promise<any> | any)[], callbacks: FlowCallbacks) {
        this.stateMap = stateMap;
        this.steps = steps;
        this.callbacks = callbacks;
        this.context = this.createContext(); // Create context once
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
                value = await this.steps[i](this.context, value);
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
            const stateInstance = this.stateMap[key];
            // Use the new public method to get the protected functions
            const flowInterface = stateInstance._getFlowInterface();

            // @ts-ignore
            ctx[key] = {
                getState: stateInstance.getState.bind(stateInstance),
                setState: flowInterface.setState,
                emit: flowInterface.emit,
            };
        }
        return ctx;
    }
}
