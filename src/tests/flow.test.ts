import { Flow } from "@/flow/flow";
import {BaseState, BaseStateEvent, BaseStateEventMap} from "@/state/base_state";

describe('Flow', () => {
    interface CounterState { count: number; }
    enum CounterEvents { Incremented = 'incremented' }
    type CounterEventMap = BaseStateEventMap<CounterState> & {
        stateChange: CounterState;
        incremented: number;
    }
    class Counter extends BaseState<CounterState, CounterEventMap> {
        constructor() { super({ count: 0 }); }
        increment() {
            const newCount = this.getState().count + 1;
            this.setState({ count: newCount });
            this.emit(CounterEvents.Incremented, newCount);
        }
    }

    it('should execute a single step and update state', async () => {
        const counter = new Counter();
        const flow = new Flow({ counter })
            .step((ctx) => {
                ctx.counter.setState({ count: 5 });
                return ctx.counter.getState().count;
            });
        const result = await flow.step((ctx, prev) => prev + 1).start(0);
        expect(counter.getState().count).toBe(5);
        expect(result).toBe(6);
    });

    it('should call callbacks in correct order', async () => {
        const counter = new Counter();
        const calls: string[] = [];
        const flow = new Flow({ counter })
            .step((ctx) => { calls.push('step'); return 1; })
            .withCallbacks({
                onStart: () => calls.push('start'),
                onProgress: (i, total) => calls.push(`progress:${i}/${total}`),
                onComplete: () => calls.push('complete'),
            });
        await flow.step((ctx, prev) => { calls.push('step2'); return prev + 1; }).start(0);
        expect(calls).toEqual([
            'start',
            'progress:0/2',
            'step',
            'progress:1/2',
            'step2',
            'complete',
        ]);
    });

    it('should pass and mutate state between steps', async () => {
        const counter = new Counter();
        const flow = new Flow({ counter })
            .step((ctx) => {
                ctx.counter.setState({ count: 2 });
                return ctx.counter.getState().count;
            })
            .step((ctx, prev) => {
                ctx.counter.setState({ count: prev + 3 });
                return ctx.counter.getState().count;
            });
        const result = await flow.start(0);
        expect(counter.getState().count).toBe(5);
        expect(result).toBe(5);
    });
});

