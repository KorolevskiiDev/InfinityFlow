import { State } from "@/state/state";

describe('State Tests', () => {
    let state: State<boolean>;

    beforeEach(() => {
        state = new State(false);
    });

    it('should initialize with the correct value', () => {
        expect(state.get()).toBe(false);
    });

    it('should set and get the value correctly', () => {
        state.set(true);
        expect(state.get()).toBe(true);
    });

    it('should notify subscribers when the value changes', () => {
        const subscriber = jest.fn();
        state.subscribe(subscriber);

        state.set(true);
        expect(subscriber).toHaveBeenCalledWith(true, false);
    });

    it('should not notify subscribers if the value does not change', () => {
        const subscriber = jest.fn();
        state.subscribe(subscriber);

        state.set(false);
        expect(subscriber).not.toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
        const subscriber = jest.fn();
        const unsubscribe = state.subscribe(subscriber);

        unsubscribe();
        state.set(true);
        expect(subscriber).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();

        state.subscribe(subscriber1);
        state.subscribe(subscriber2);

        state.set(true);
        expect(subscriber1).toHaveBeenCalledWith(true, false);
        expect(subscriber2).toHaveBeenCalledWith(true, false);
    });
});
