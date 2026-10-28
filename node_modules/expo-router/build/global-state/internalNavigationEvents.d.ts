import type { NavigationAction, NavigationState } from '../react-navigation';
import type { ReactNavigationState } from './types';
export interface ActionDispatchedEvent {
    actionType: NavigationAction['type'];
    payload: NavigationAction['payload'];
    state: ReactNavigationState;
}
/** Fires after navigation state commits for each `PRELOAD` action that changes it. */
export interface RoutePreloadedEvent {
    routeKey: string;
    state: NavigationState;
}
interface InternalNavigationEventMap {
    actionDispatched: ActionDispatchedEvent;
    routePreloaded: RoutePreloadedEvent;
}
type EventName = keyof InternalNavigationEventMap;
export declare const internalNavigationEvents: {
    addListener<Name extends EventName>(name: Name, callback: (event: InternalNavigationEventMap[Name]) => void): () => void;
    emit<Name extends EventName>(name: Name, event: InternalNavigationEventMap[Name]): void;
};
export {};
