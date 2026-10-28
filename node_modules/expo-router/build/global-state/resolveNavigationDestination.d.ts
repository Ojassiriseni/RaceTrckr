import type { RouteNode } from '../Route';
import type { ResultState } from '../fork/getStateFromPath';
import { type InternalExpoRouterParams } from '../navigationParams';
import type { NavigationAction, NavigationState } from '../react-navigation/routers';
import type { RouteState } from '../react-navigation/routers/attachRouteState';
import type { RouterRegistry } from './routerRegistry';
type DestinationAction = NavigationAction & {
    payload: {
        __internal__PreviewKey?: string;
        name?: string;
        params?: object;
        path?: string;
        state?: RouteState;
        [key: string]: unknown;
    };
};
type Options = {
    targetState: ResultState;
    navigationState: NavigationState;
    routeNode: RouteNode;
    registry: RouterRegistry;
    action: DestinationAction;
    withAnchor?: boolean;
    internalParams?: InternalExpoRouterParams;
};
export declare function resolveNavigationDestination({ targetState, navigationState, routeNode, registry, action, withAnchor, internalParams, }: Options): DestinationAction;
export {};
