import { Flow } from "@/flow/flow";
import { FlowGroup } from "@/flow/group";
import {State} from "../state/state";

describe('FlowGroup Tests', () => {
    let flow1: Flow;
    let flow2: Flow;
    let flowGroup: FlowGroup;
    let state1: State<boolean>;
    let state2: State<boolean>;

    beforeEach(() => {
        state1 = new State(false);
        state2 = new State(false);

        flow1 = new Flow()
            .dependsOn(state1, (value) => value === true)
            .do(() => console.log("Flow 1 executed"));

        flow2 = new Flow()
            .dependsOn(state2, (value) => value === true)
            .do(() => console.log("Flow 2 executed"));

        flowGroup = new FlowGroup()
            .add(flow1, 1)
            .add(flow2, 2);
    });

    it('should start all flows in the group', async () => {
        const onStart = jest.fn();
        const onComplete = jest.fn();

        flowGroup.withCallbacks({ onStart, onComplete });
        flowGroup.start();

        state1.set(true);
        state2.set(true);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(onStart).toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalled();
    });

    it('should cancel all flows in the group', () => {
        const onError = jest.fn();

        flowGroup.withCallbacks({ onError });
        flowGroup.start();
        flowGroup.cancel();

        expect(onError).toHaveBeenCalledWith(new Error("Flow Group cancelled"));
    });

    it('should reset and restart all flows in the group', async () => {
        const onStart = jest.fn();
        const onComplete = jest.fn();

        flowGroup.withCallbacks({ onStart, onComplete });
        flowGroup.start();

        state1.set(true);
        state2.set(true);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(onComplete).toHaveBeenCalled();

        flowGroup.reset();

        state1.set(false);
        state2.set(false);

        state1.set(true);
        state2.set(true);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(onStart).toHaveBeenCalledTimes(2);
        expect(onComplete).toHaveBeenCalledTimes(2);
    });

    it('should skip starting flows if condition is not met', () => {
        const onComplete = jest.fn();

        flowGroup.withCondition(() => false);
        flowGroup.withCallbacks({ onComplete });
        flowGroup.start();

        expect(onComplete).toHaveBeenCalled();
    });
});
