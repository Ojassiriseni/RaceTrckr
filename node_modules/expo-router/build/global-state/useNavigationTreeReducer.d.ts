import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { InitialState, NavigationAction, NavigationState } from '../react-navigation/routers';
import type { BrowserHistoryEvent } from './browserHistory.types';
import type { RouterRegistry } from './routerRegistry';
import { type QueuedRoutingIntent } from './routingQueue';
import type { StoreRedirects } from './types';
type Options = {
    initialState: InitialState | undefined;
    routeNode?: RouteNode;
    registry: RouterRegistry;
    routesWithRemovalPrevented?: ReadonlySet<string>;
    linking?: ExpoLinkingOptions;
    redirects?: StoreRedirects[];
};
export type NavigationTreeReport = {
    events: NavigationTreeReportEvent[];
};
type NavigationTreeReportEventData = {
    type: 'unhandled-action';
    action: NavigationAction;
} | {
    type: 'removed-routes';
    routeKeys: readonly string[];
    action: NavigationAction;
} | {
    type: 'prevented-routes';
    routeKeys: readonly string[];
    action: NavigationAction;
} | {
    type: 'action-dispatched';
    action: NavigationAction;
    state: NavigationState;
    actionId: number;
} | {
    type: 'route-preloaded';
    routeKey: string;
    state: NavigationState;
} | BrowserHistoryEvent;
export type NavigationTreeReportEvent = NavigationTreeReportEventData & {
    id: number;
};
export declare function useNavigationTreeReducer({ initialState, routeNode, registry, routesWithRemovalPrevented, linking, redirects, }: Options): {
    state: Readonly<{
        key: string;
        routeKeySeq: number;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../react-navigation").NavigationRoute<import("../react-navigation").ParamListBase, string>[];
        type?: string;
        stale: false;
    }>;
    isWaitingForLayouts: boolean;
    report: NavigationTreeReport | undefined;
    consumeReportEvents: (eventIds: readonly number[]) => void;
    resetNavigator: (stateKey: string, routerType: string | undefined) => void;
    handleAction: (action: NavigationAction, originKey?: string) => void;
    processIntent: (intent: QueuedRoutingIntent, inTransition?: boolean) => void;
};
export declare function replaceNavigationState(state: NavigationState, stateKey: string, replacement: NavigationState): NavigationState;
export {};
