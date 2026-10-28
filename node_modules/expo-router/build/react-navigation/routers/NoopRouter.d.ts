import { type DefaultRouterOptions, type NavigationAction, type NavigationState, type RouterFactory } from './types';
/**
 * Router that handles nothing. `BaseRouter` extends it, so it is the root of every built-in
 * router chain.
 */
export declare const NoopRouter: RouterFactory<NavigationState, NavigationAction, DefaultRouterOptions>;
