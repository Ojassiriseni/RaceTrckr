import { type RouteNode } from '../Route';
import type { ResultState } from '../fork/getStateFromPath';
import type { NavigationState, PartialState } from '../react-navigation/routers';
type SeedState = NavigationState | PartialState<NavigationState>;
/**
 * Completes the partial state parsed from the initial URL by `getStateFromPath` with keys,
 * route names, anchor routes, and `stale: false` so navigators can adopt it directly.
 *
 * @param targetState The partial state the app should start in, parsed from the initial URL by
 * `getStateFromPath`.
 * @param rootRouteNode The root of the app's route tree.
 */
export declare function createSeededRootState(targetState: ResultState | undefined, rootRouteNode: RouteNode): NavigationState;
export declare function completeNavigationState(state: SeedState, rootRouteNode: RouteNode): NavigationState;
export declare function completeParsedState(targetState: SeedState | undefined, parentChain: string): NavigationState | undefined;
export declare function createSeededNavigationState(targetState: SeedState | undefined, routeNode: RouteNode, parentChain: string, anchorParams?: object): NavigationState;
export {};
