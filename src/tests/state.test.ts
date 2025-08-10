import { BaseState } from "@/state/base_state";
import {BaseStateEventMap} from "../state/base_state";

describe('BaseState', () => {
    interface CounterState {
        count: number;
    }
    enum CounterEvents {
        Incremented = 'incremented',
    }
    type CounterEventMap = BaseStateEventMap<CounterState> & {
        stateChange: CounterState;
        incremented: number;
    }
    class Counter extends BaseState<CounterState, CounterEventMap> {
        constructor() {
            super({ count: 0 });
        }
        increment() {
            const newCount = this.getState().count + 1;
            this.setState({ count: newCount });
            this.emit(CounterEvents.Incremented, newCount);
        }
    }

    it('should initialize with default state', () => {
        const counter = new Counter();
        expect(counter.getState()).toEqual({ count: 0 });
    });

    it('should update state and emit stateChange event', () => {
        const counter = new Counter();
        const stateChangeHandler = jest.fn();
        counter.on('stateChange', stateChangeHandler);
        // Use the public increment method instead of setState
        counter.increment();
        expect(counter.getState().count).toBe(1);
        expect(stateChangeHandler).toHaveBeenCalledWith({ count: 1 });
    });

    it('should emit custom events', () => {
        const counter = new Counter();
        const incrementedHandler = jest.fn();
        counter.on(CounterEvents.Incremented, incrementedHandler);
        counter.increment();
        expect(incrementedHandler).toHaveBeenCalledWith(1);
    });

    it('should support deep state updates', () => {
        interface NestedState { a: { b: number } }
        type NestedEventMap = BaseStateEventMap<NestedState> & {
            stateChange: NestedState;
        }
        class Nested extends BaseState<NestedState, NestedEventMap> {
            constructor() { super({ a: { b: 1 } }); }
            updateB(newB: number) {
                this.setState({ a: { b: newB } });
            }
        }
        const nested = new Nested();
        nested.updateB(2);
        expect(nested.getState().a.b).toBe(2);
    });
});
