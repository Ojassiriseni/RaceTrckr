interface NetworkingEvent {
    type: string;
    target: EventTargetLite;
    loaded: number;
    total: number;
    lengthComputable: boolean;
    message?: string;
}
export type NetworkingEventListener = (event: NetworkingEvent) => void;
export declare class EventTargetLite {
    private eventListeners;
    addEventListener(type: string, listener: NetworkingEventListener): void;
    removeEventListener(type: string, listener: NetworkingEventListener): void;
    __dispatch(type: string, extra?: Partial<NetworkingEvent>): void;
    private invokeListener;
}
export {};
//# sourceMappingURL=events.d.ts.map