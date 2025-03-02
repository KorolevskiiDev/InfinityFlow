import {State} from "@/state/state";
import {Flow} from "@/flow/flow";

type FlowCallback = () => void;
type FlowProgressCallback = (completed: number, total: number, resolvedState: State<any> | Flow) => void;
type FlowErrorCallback = (error: Error) => void;

export interface FlowCallbacks {
    onStart?: FlowCallback;
    onProgress?: FlowProgressCallback;
    onComplete?: FlowCallback;
    onError?: FlowErrorCallback;
    onReset?: FlowCallback;
}
