import type { NavigationState, PartialState, Route } from './types';
export type RouteState = (NavigationState | PartialState<NavigationState>) & {
    __internal__routerActionState?: true;
};
type StateAction = {
    payload?: object & {
        state?: RouteState | null;
    };
};
/**
 * Attaches trusted nested state from a navigation action to a route and removes Expo Router's
 * internal state markers at every nested level. State without the internal
 * `__internal__routerActionState` marker is ignored and triggers a warning in development.
 *
 * @returns The original route object when the action has no state, the state lacks the marker,
 * or the state after removing markers is deeply equal to the route's existing state. Otherwise,
 * returns a new route object with the nested state attached, without mutating the original route
 * or action.
 *
 * @example
 * ```ts
 * // Inside a custom router's action handler, preserve nested state from the incoming action.
 * const route = attachRouteState(
 *   {
 *     key: nextKey(action.payload.name),
 *     name: action.payload.name,
 *     params: action.payload.params,
 *   },
 *   action
 * );
 * ```
 *
 * @experimental
 */
export declare function attachRouteState<T extends Route<string> & {
    state?: RouteState;
}>(route: T, action: StateAction): T;
export {};
