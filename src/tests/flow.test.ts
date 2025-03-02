import { ObservableState } from '@/state/observable';
import { Flow } from '@/flow/flow';

describe('State Flow Tests', () => {
    let wsService: ObservableState<boolean>;
    let micService: ObservableState<boolean>;
    let userWantsToSpeak: ObservableState<boolean>;
    let flow: Flow;

    beforeEach(() => {
        wsService = new ObservableState(false);
        micService = new ObservableState(false);
        userWantsToSpeak = new ObservableState(false);

        flow = new Flow({autoReset: true})
            .dependsOn(wsService, (value) => value === true)
            .dependsOn(userWantsToSpeak, (value) => value === true)
            .do(() => micService.set(true));
    });

    it('should activate microphone when WebSocket is connected and user wants to speak', async () => {
        flow.start();

        wsService.set(true);
        userWantsToSpeak.set(true);

        // Wait for async flow execution
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(micService.get()).toBe(true);
    });

    it('should not activate microphone if WebSocket is not connected', async () => {
        flow.start();

        userWantsToSpeak.set(true);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(micService.get()).toBe(false);
    });

    it('should reset the flow and reactivate microphone on new user request', async () => {
        flow.start();

        wsService.set(true);
        userWantsToSpeak.set(true);

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(micService.get()).toBe(true);

        micService.set(false);

        userWantsToSpeak.set(false);

        userWantsToSpeak.set(true);

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(micService.get()).toBe(true);
    });

    it('should cancel the flow', async () => {
        flow.start();
        flow.cancel();

        wsService.set(true);
        userWantsToSpeak.set(true);

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(micService.get()).toBe(false);
    });
});
