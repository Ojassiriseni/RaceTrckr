import type { NavigationState, RouterBrowserHistoryAction } from '../react-navigation/routers';
import type { BrowserHistory, BrowserHistoryChange, BrowserHistoryConfig, BrowserHistoryProjection, BrowserHistoryRestore, ReducibleIntent } from './browserHistory.types';
type Reduce<Result> = (result: Result, intent: ReducibleIntent) => Result;
/** Starts tracking the browser entry that is current when the app loads. */
export declare function createBrowserHistory(state: NavigationState, config: BrowserHistoryConfig): BrowserHistoryProjection;
/** Updates tracked entries and queues browser commands for an accepted router action. */
export declare function applyRouterHistoryAction(history: BrowserHistory, nextState: NavigationState, config: BrowserHistoryConfig, action?: RouterBrowserHistoryAction): BrowserHistoryProjection;
/**
 * Refreshes the current entry after `NAVIGATOR_CHANGED` or `NAVIGATOR_UNMOUNTED`, for example when
 * a navigator registers its routes or is removed from the tree.
 */
export declare function updateCurrentHistoryEntry(history: BrowserHistory, nextState: NavigationState, config: BrowserHistoryConfig): BrowserHistoryProjection;
/**
 * Restores navigation after browser back or forward. Known entries reuse their saved state;
 * unknown entries are rebuilt from the URL and added to the tracked history.
 */
export declare function restoreNavigationFromBrowser<Result extends {
    state: NavigationState;
}>(history: BrowserHistory, result: Result, change: BrowserHistoryChange, config: BrowserHistoryConfig, reduce: Reduce<Result>): BrowserHistoryRestore<Result>;
export {};
