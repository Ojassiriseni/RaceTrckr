import type { RouteNode } from '../Route';
import type { NavigationAction, NavigationState, RouterActionHandling, RouterActionResult, RouterBrowserHistoryAction } from '../react-navigation/routers';
export type RouterRegistryEntry = {
    reduce: (state: NavigationState, action: NavigationAction) => RouterActionResult<NavigationState> | RouterActionHandling.Unhandled | null;
    shouldActionChangeFocus?: (action: NavigationAction) => boolean;
    getStateForRouteFocus?: (state: NavigationState, routeKey: string) => NavigationState;
    getBrowserHistoryForRouteFocus?: (previous: NavigationState, next: NavigationState, childAction?: RouterBrowserHistoryAction) => RouterBrowserHistoryAction | undefined;
    routeNode?: RouteNode;
};
export type RouterRegistry = ReadonlyMap<string, RouterRegistryEntry>;
export type RouterRegistrySetters = {
    register: (stateKey: string, entry: RouterRegistryEntry) => void;
    unregister: (stateKey: string, entry: RouterRegistryEntry) => void;
};
export declare const RouterRegistrySettersContext: import("react").Context<RouterRegistrySetters | undefined>;
export declare function useRegisterRouter(stateKey: string, entry: RouterRegistryEntry): void;
