import {BaseState, BaseStateEvent, DeepPartial} from "../state/base_state";

enum SettingsEvent {
    SettingsChanged = 'settingsChanged',
}

interface Settings {
    theme: 'light' | 'dark';
    layout: {
        sidebar: boolean;
        toolbar: boolean;
    };
}

interface SettingsEventMap {
    [BaseStateEvent.Update]: {
        property: keyof Settings | keyof Settings['layout'];
        oldValue: any;
        newValue: any;
    };
    [SettingsEvent.SettingsChanged]: Settings;
    [BaseStateEvent.StateChange]: Settings;
}

class SettingsState extends BaseState<Settings, SettingsEventMap> {
    constructor() {
        super({
            theme: 'light',
            layout: {
                sidebar: false,
                toolbar: true
            }
        });
    }

    /** Flows to manage settings */
    public flows = {
        toggleSidebar: () => {
            this.setState({
                layout: {
                    sidebar: !this.getState().layout.sidebar
                }
            });
        },
        toggleToolbar: () => {
            this.setState({
                layout: {
                    toolbar: !this.getState().layout.toolbar
                }
            });
        }
    };

    /** Merge multiple settings at once */
    public mergeSettings(patch: DeepPartial<Settings>): void {
        this.setState(patch);
        this.emit(SettingsEvent.SettingsChanged, this.getState());
    }
}

describe('BaseState tests', () => {
    let settingsState: SettingsState;

    beforeEach(() => {
        settingsState = new SettingsState();
    });

    it('should initialize with default settings', () => {
        expect(settingsState.getState()).toEqual({
            theme: 'light',
            layout: { sidebar: false, toolbar: true }
        });
    });

    it('should update a single setting', () => {
        settingsState.setState({ theme: 'dark' });
        expect(settingsState.getState().theme).toBe('dark');
    });

    it('should emit stateChange event on update', () => {
        const listener = jest.fn();
        settingsState.on(BaseStateEvent.Update, listener);

        settingsState.setState({ theme: 'dark' });
        expect(listener).toHaveBeenCalledWith({
            theme: 'dark',
            layout: { sidebar: false, toolbar: true }
        });
    });

    it('should merge multiple settings and emit SettingsChanged event', () => {
        const listener = jest.fn();
        settingsState.on(SettingsEvent.SettingsChanged, listener);

        settingsState.mergeSettings({ theme: 'dark', layout: { sidebar: true } });

        expect(listener).toHaveBeenCalledWith({
            theme: 'dark',
            layout: { sidebar: true, toolbar: true }
        });
        expect(settingsState.getState()).toEqual({
            theme: 'dark',
            layout: { sidebar: true, toolbar: true }
        });
    });

    it('should notify subscribers of individual property changes', () => {
        const listener = jest.fn();
        settingsState.on(BaseStateEvent.Update, listener);

        settingsState.setState({ theme: 'dark' });
        expect(listener).toHaveBeenCalledWith({
            property: 'theme',
            oldValue: 'light',
            newValue: 'dark'
        });
    });

    it('should unsubscribe from events', () => {
        const listener = jest.fn();
        settingsState.on(BaseStateEvent.Update, listener);

        settingsState.off(BaseStateEvent.Update, listener);

        settingsState.setState({ theme: 'dark' });
        expect(listener).not.toHaveBeenCalled();
    });
});

