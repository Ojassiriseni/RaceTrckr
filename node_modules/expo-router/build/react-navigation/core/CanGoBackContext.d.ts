import type { NavigationState, PartialState } from '../routers';
export declare const CanGoBackContext: import("react").Context<boolean | undefined>;
export declare function hasBackTarget(state: NavigationState | PartialState<NavigationState>): boolean;
export declare function getFocusedCanGoBack(rootState: NavigationState): boolean;
